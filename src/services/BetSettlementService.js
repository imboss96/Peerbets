import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

class BetSettlementService {
  constructor() {
    this.db = null;
  }

  async initDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  async settleBet(betId, result, userId) {
    try {
      await this.initDb();

      // Get bet details
      const betRef = doc(this.db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        return { success: false, error: 'Bet not found' };
      }

      const bet = betDoc.data();

      // Get user details
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      let newBalance = userData.balance || 0;
      let message = '';

      // Calculate balance change based on result
      if (result === 'won') {
        newBalance = newBalance + bet.potentialWin;
        message = `Bet won! +KSH ${Number(bet.potentialWin).toLocaleString()}`;
      } else if (result === 'lost') {
        // Stake already deducted when bet placed, add to profits
        message = `Bet lost. -KSH ${Number(bet.amount).toLocaleString()}`;
      } else if (result === 'refund') {
        newBalance = newBalance + bet.amount;
        message = `Bet refunded. +KSH ${Number(bet.amount).toLocaleString()}`;
      }

      // Update bet status
      await updateDoc(betRef, {
        result: result,
        status: 'settled',
        settledAt: serverTimestamp(),
        settledBy: userId
      });

      // Update user balance
      await updateDoc(userRef, {
        balance: newBalance,
        lastUpdated: serverTimestamp()
      });

      return {
        success: true,
        newBalance,
        message
      };
    } catch (error) {
      console.error('Settlement error:', error);
      return { success: false, error: error.message };
    }
  }

  // Track pending bets in escrow
  async addToEscrow(betId, amount, userId) {
    try {
      await this.initDb();
      const adminRef = doc(this.db, 'admin', 'financial');
      const adminDoc = await getDoc(adminRef);

      const currentEscrow = adminDoc.data()?.escrow || 0;

      await updateDoc(adminRef, {
        escrow: currentEscrow + amount,
        lastUpdated: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Escrow error:', error);
      return { success: false, error: error.message };
    }
  }

  // Move lost bet amount to profits
  async addToProfit(betId, amount, userId) {
    try {
      await this.initDb();
      const adminRef = doc(this.db, 'admin', 'financial');
      const adminDoc = await getDoc(adminRef);

      const currentProfit = adminDoc.data()?.profits || 0;
      const currentEscrow = adminDoc.data()?.escrow || 0;

      await updateDoc(adminRef, {
        profits: currentProfit + amount,
        escrow: Math.max(0, currentEscrow - amount),
        lastUpdated: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Profit tracking error:', error);
      return { success: false, error: error.message };
    }
  }

  // Release escrow on bet win/refund
  async releaseEscrow(amount) {
    try {
      await this.initDb();
      const adminRef = doc(this.db, 'admin', 'financial');
      const adminDoc = await getDoc(adminRef);

      const currentEscrow = adminDoc.data()?.escrow || 0;

      await updateDoc(adminRef, {
        escrow: Math.max(0, currentEscrow - amount),
        lastUpdated: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Escrow release error:', error);
      return { success: false, error: error.message };
    }
  }
}

const betSettlementServiceInstance = new BetSettlementService();
export default betSettlementServiceInstance;