import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class VirtualGameAdminService {
  constructor() {
    this.db = null;
  }

  async initDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  async autoCompletePendingBets(gameType) {
    try {
      await this.initDb();
      const betsRef = collection(this.db, 'bets');
      const q = query(betsRef, where('market', '==', gameType), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      let completedCount = 0;

      for (const betDoc of snapshot.docs) {
        const bet = betDoc.data();
        const isWin = Math.random() > 0.5;
        const payout = isWin ? bet.potentialWin : 0;

        await updateDoc(betDoc.ref, {
          status: isWin ? 'won' : 'lost',
          completedAt: new Date().toISOString()
        });

        if (isWin && bet.userId) {
          const userRef = doc(this.db, 'users', bet.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const newBalance = (userSnap.data().balance || 0) + payout;
            await updateDoc(userRef, { balance: newBalance });
          }
        }
        completedCount++;
      }

      return { success: true, message: `Completed ${completedCount} ${gameType} bets`, completedCount };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async setAutoCompleteConfig(gameType, enabled) {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'virtualGameConfig');
      const currentConfig = await getDoc(configRef);
      const config = currentConfig.exists() ? currentConfig.data() : { games: {} };

      config.games = config.games || {};
      config.games[gameType] = { autoComplete: enabled };

      await setDoc(configRef, config);
      return { success: true, message: `Auto-complete ${enabled ? 'ON' : 'OFF'} for ${gameType}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getPendingBetsStats(gameType) {
    try {
      await this.initDb();
      const betsRef = collection(this.db, 'bets');
      const q = query(betsRef, where('market', '==', gameType), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      let totalStake = 0, totalPayout = 0;

      snapshot.forEach(doc => {
        const bet = doc.data();
        totalStake += bet.amount || 0;
        totalPayout += bet.potentialWin || 0;
      });

      return { success: true, data: { pendingBetsCount: snapshot.size, totalStake, totalPayout } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getVirtualGameConfig() {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'virtualGameConfig');
      const snap = await getDoc(configRef);
      return { success: true, data: snap.exists() ? snap.data() : { games: { fly: { autoComplete: false }, colorstake: { autoComplete: false } } } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new VirtualGameAdminService();