/**
 * Bulk settle ColorStake bets locally using the Firebase Admin SDK.
 *
 * Usage:
 * 1. Create a service account JSON in Google Cloud and set the env var:
 *    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
 * 2. From project root run:
 *    node scripts/bulk_settle_colorstakes.js
 *
 * The script will:
 * - Find bets in `bets` collection whose market is 'colorstake' (or match contains 'ColorStake')
 *   and which do not have a final status (won/lost/void/settled).
 * - For each bet, it will randomly mark it 'won' or 'lost', update the bet document,
 *   create a corresponding transaction document in `transactions`, and credit user balance for wins.
 *
 * IMPORTANT: Run this only if you understand it will modify production data.
 */

const admin = require('firebase-admin');

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS is not set. Set it to your service account JSON path.');
    process.exit(1);
  }

  admin.initializeApp();
  const db = admin.firestore();

  console.log('Fetching bets...');
  const betsSnap = await db.collection('bets').get();
  const bets = [];
  betsSnap.forEach(d => bets.push({ id: d.id, ...d.data() }));

  const pending = bets.filter(b => {
    const market = (b.market || '').toLowerCase();
    const match = (b.match || '').toLowerCase();
    const status = (b.status || '').toLowerCase();
    const isColor = market === 'colorstake' || match.includes('colorstake');
    const isFinal = ['won','lost','void','settled'].includes(status);
    return isColor && !isFinal;
  });

  console.log(`Found ${pending.length} pending ColorStake bets.`);
  if (pending.length === 0) return;

  // Ask for confirmation in interactive terminal
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => rl.question(`Settle ${pending.length} bets now? (yes/no): `, resolve));
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) {
    console.log('Aborted by user.');
    return;
  }

  const results = [];
  for (const b of pending) {
    const isWin = Math.random() < 0.5; // random
    const status = isWin ? 'won' : 'lost';
    const settledAt = new Date().toISOString();

    // Update bet
    try {
      await db.collection('bets').doc(b.id).update({ status, settledAt, settledBy: 'admin-bulk-script' });

      // create transaction
      let tx = null;
      if (status === 'won') {
        tx = {
          betId: b.id,
          userId: b.userId || b.user || b.uid || null,
          type: 'payout',
          amount: Number(b.potentialWin || b.payout || 0),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          settledBy: 'admin-bulk-script'
        };
      } else {
        tx = {
          betId: b.id,
          userId: b.userId || b.user || b.uid || null,
          type: 'profit',
          amount: Number(b.stake || b.amount || 0),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          settledBy: 'admin-bulk-script'
        };
      }

      const txRef = await db.collection('transactions').add(tx);

      // credit user on win
      if (status === 'won' && tx.userId) {
        const userRef = db.collection('users').doc(tx.userId);
        await db.runTransaction(async (t) => {
          const snap = await t.get(userRef);
          const cur = snap.exists ? (snap.data().balance || 0) : 0;
          const newBal = cur + Number(tx.amount || 0);
          t.set(userRef, { balance: newBal }, { merge: true });
        });
      }

      results.push({ id: b.id, status, txId: txRef.id });
      console.log(`Settled ${b.id} as ${status}`);
    } catch (err) {
      console.error('Failed to settle', b.id, err);
      results.push({ id: b.id, status: 'error', error: err.message });
    }
  }

  console.log('Done. Summary:');
  console.table(results);
}

main().catch(err => { console.error(err); process.exit(1); });
