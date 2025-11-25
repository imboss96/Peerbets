import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    getFirestore,
    collection,
    addDoc,
    setDoc,
    doc,
    serverTimestamp,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    getDoc
} from 'firebase/firestore';
import firebaseConfig from '../config';

let db;
function init() {
  if (!db) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  }
}

const AdminService = {
  async getGames() {
    try {
      init();
      // Admin-managed games collection
      const col = collection(db, 'adminGames');
      const snaps = await getDocs(col);
      const games = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
      return { success: true, games };
    } catch (error) {
      console.error('getGames', error);
      return { success: false, error: error.message };
    }
  },

  async addGame(gameData) {
    try {
      init();
      const functions = getFunctions();
      const db = getFirestore();

      // ensure consistent shape expected by the homepage
      const publicGame = {
        title: gameData.title || `${gameData.homeTeam} vs ${gameData.awayTeam}`,
        homeTeam: gameData.homeTeam,
        awayTeam: gameData.awayTeam,
        league: gameData.league || '',
        kickoff: gameData.kickoff ? new Date(gameData.kickoff) : null,
        odds: gameData.odds || {},
        status: gameData.status || 'scheduled',
        createdAt: serverTimestamp(),
        metadata: gameData.metadata || {}
      };

      // Try callable first (optional)
      try {
        const addAdminGame = httpsCallable(functions, 'addAdminGame');
        const res = await addAdminGame(publicGame);
        const id = res?.data?.id;
        if (id) {
          // mirror into public collections using same id
          await setDoc(doc(db, 'games', id), { ...publicGame, id });
          await setDoc(doc(db, 'events', id), { ...publicGame, id });
          await setDoc(doc(db, 'adminGames', id), { ...publicGame, id, createdByCallable: true });
          return { id };
        }
      } catch (err) {
        console.warn('callable addAdminGame failed, falling back to direct writes', err?.message || err);
      }

      // Fallback direct (create shared id and write)
      const adminRef = await addDoc(collection(db, 'adminGames'), publicGame);
      const id = adminRef.id;
      await setDoc(doc(db, 'games', id), { ...publicGame, id });
      await setDoc(doc(db, 'events', id), { ...publicGame, id });
      // ensure admin doc has id set
      await setDoc(doc(db, 'adminGames', id), { ...publicGame, id });
      return { id };
    } catch (error) {
      console.error('addGame', error);
      return { success: false, error: error.message };
    }
  },

  async deleteGame(id) {
    try {
      init();
      const d = doc(db, 'adminGames', id);
      await deleteDoc(d);
      return { success: true };
    } catch (error) {
      console.error('deleteGame', error);
      return { success: false, error: error.message };
    }
  },

  async getRecentBets(limit = 50) {
    try {
      init();
      const col = collection(db, 'bets');
      const snaps = await getDocs(col);
      const bets = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
      // sort by timestamp desc
      bets.sort((a, b) => new Date(b.timestamp || b.settledAt || Date.now()) - new Date(a.timestamp || a.settledAt || Date.now()));
      return { success: true, bets: bets.slice(0, limit) };
    } catch (error) {
      console.error('getRecentBets', error);
      return { success: false, error: error.message };
    }
  },

  async bulkSettleColorStakes() {
    try {
      init();
      const col = collection(db, 'bets');
      const snaps = await getDocs(col);
      const bets = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
      const pending = bets.filter(b => (b.market === 'colorstake' || (b.match && b.match.toLowerCase().includes('colorstake'))) && !['won','lost','void','settled'].includes((b.status||'').toLowerCase()));

      const app = getApp();
      const functions = getFunctions(app);
      const fn = httpsCallable(functions, 'settleBet');

      const results = [];
      for (const b of pending) {
        // decide randomly win or lost
        const isWin = Math.random() < 0.5;
        const status = isWin ? 'won' : 'lost';
        // eslint-disable-next-line no-await-in-loop
        const res = await fn({ betId: b.id, status });
        results.push({ id: b.id, status, success: true, data: res.data });
      }

      return { success: true, settled: results.length, results };
    } catch (error) {
      console.error('bulkSettleColorStakes', error);
      return { success: false, error: error.message };
    }
  },

  async getTransactions(limit = 100) {
    try {
      init();
      const col = collection(db, 'transactions');
      const snaps = await getDocs(col);
      const txs = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
      txs.sort((a, b) => (b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.parse(b.timestamp || '')) - (a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.parse(a.timestamp || '')));
      return { success: true, transactions: txs.slice(0, limit) };
    } catch (error) {
      console.error('getTransactions', error);
      return { success: false, error: error.message };
    }
  },

  async settleBet(betId, status) {
    try {
      init();
      const app = getApp();
      const functions = getFunctions(app);
      const fn = httpsCallable(functions, 'settleBet');
      const res = await fn({ betId, status });
      return { success: true, data: res.data };
    } catch (error) {
      console.error('settleBet', error);
      return { success: false, error: error.message || error.toString() };
    }
  },
  async userSettleBet(betId, status) {
    try {
      init();
      const app = getApp();
      const functions = getFunctions(app);
      const fn = httpsCallable(functions, 'userSettleBet');
      const res = await fn({ betId, status });
      return { success: true, data: res.data };
    } catch (error) {
      console.error('userSettleBet', error);
      return { success: false, error: error.message || error.toString() };
    }
  },

  async getAccountingSummary() {
    try {
      init();
      // Aggregate from transactions first (escrow/profit/payout)
      const txCol = collection(db, 'transactions');
      const txSnaps = await getDocs(txCol);

      let totalProfit = 0;
      let totalEscrow = 0;
      let totalPayouts = 0;

      txSnaps.forEach(d => {
        const t = d.data();
        if (!t || !t.type) return;
        const amt = Number(t.amount || 0);
        if (t.type === 'profit') totalProfit += amt;
        if (t.type === 'escrow') totalEscrow += amt;
        if (t.type === 'payout') totalPayouts += amt;
      });

      // Users summary
      const usersCol = collection(db, 'users');
      const userSnaps = await getDocs(usersCol);
      let totalBalances = 0;
      userSnaps.forEach(doc => { totalBalances += (doc.data().balance || 0); });

      // Bets summary for counts
      const betsCol = collection(db, 'bets');
      const betsSnaps = await getDocs(betsCol);
      let totalBets = betsSnaps.size;

      const netProfit = totalProfit - totalPayouts;

      return {
        success: true,
        data: {
          totalProfit,
          totalEscrow,
          totalPayouts,
          netProfit,
          totalBalances,
          totalBets
        }
      };
    } catch (error) {
      console.error('getAccountingSummary', error);
      return { success: false, error: error.message };
    }
  }
};

export default AdminService;