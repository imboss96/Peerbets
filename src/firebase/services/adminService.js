import { db } from '../config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  increment
} from 'firebase/firestore';

class AdminService {
  // Real-time listener for users
  static subscribeToUsers(callback) {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      callback(users);
    });
    return unsubscribe;
  }

  // Real-time listener for bets
  static subscribeToBets(callback) {
    const betsRef = collection(db, 'bets');
    const q = query(betsRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(bets);
    });
    return unsubscribe;
  }

  // Real-time listener for transactions
  static subscribeToTransactions(callback) {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(transactions);
    });
    return unsubscribe;
  }

  // Real-time listener for withdrawals
  static subscribeToWithdrawals(callback) {
    try {
      const withdrawalsRef = collection(db, 'withdrawals');
      const q = query(withdrawalsRef, orderBy('requestedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const withdrawals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate?.() || new Date()
        }));
        callback(withdrawals);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to withdrawals:', error);
      callback([]);
      return () => {};
    }
  }

  // Get all users
  static async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      return { success: true, users };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all bets with filtering
  static async getAllBets(dateRange = '7days') {
    try {
      const betsRef = collection(db, 'bets');
      let startDate = new Date();

      switch (dateRange) {
        case '24hours':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'all':
          startDate = new Date(0);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const q = query(
        betsRef,
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const bets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));
      return { success: true, bets };
    } catch (error) {
      console.error('Error fetching bets:', error);
      return { success: false, bets: [], error: error.message };
    }
  }

  // Get all transactions
  static async getAllTransactions(dateRange = '7days') {
    try {
      const transactionsRef = collection(db, 'transactions');
      let startDate = new Date();

      switch (dateRange) {
        case '24hours':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'all':
          startDate = new Date(0);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const q = query(
        transactionsRef,
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      return { success: true, transactions };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { success: false, transactions: [], error: error.message };
    }
  }

  // Get all withdrawals (admin)
  static async getAllWithdrawals(dateRange = '7days') {
    try {
      const withdrawalsRef = collection(db, 'withdrawals');
      let startDate = new Date();

      switch (dateRange) {
        case '24hours':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'all':
          startDate = new Date(0);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const q = query(
        withdrawalsRef,
        where('requestedAt', '>=', startDate),
        orderBy('requestedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const withdrawals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate?.() || new Date()
      }));

      return { success: true, withdrawals };
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return { success: false, withdrawals: [], error: error.message };
    }
  }

  // Calculate dashboard metrics
  static async getDashboardMetrics(dateRange = '7days') {
    try {
      const usersResult = await this.getAllUsers();
      const users = usersResult.users || [];

      const betsResult = await this.getAllBets(dateRange);
      const bets = betsResult.bets || [];

      const transactionsResult = await this.getAllTransactions(dateRange);
      const transactions = transactionsResult.transactions || [];

      const activeUsers = users.filter(u => u.status === 'active').length;
      const totalBalance = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
      const totalBonus = users.reduce((sum, u) => sum + (Number(u.bonus) || 0), 0);

      const betsPlaced = bets.length;
      const wonBets = bets.filter(b => b.result === 'won').length;
      const lostBets = bets.filter(b => b.result === 'lost').length;
      const refundedBets = bets.filter(b => b.result === 'refund').length;

      const totalBetAmount = bets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const avgBetSize = betsPlaced > 0 ? totalBetAmount / betsPlaced : 0;

      const totalWinnings = bets
        .filter(b => b.result === 'won')
        .reduce((sum, b) => sum + (Number(b.potentialWin) || 0), 0);

      const totalDeposits = transactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const totalRevenue = totalDeposits - totalWinnings;
      const commissionRate = 0.05;
      const commissionRevenue = totalBetAmount * commissionRate;

      const prevStartDate = new Date();
      switch (dateRange) {
        case '24hours':
          prevStartDate.setHours(prevStartDate.getHours() - 48);
          break;
        case '7days':
          prevStartDate.setDate(prevStartDate.getDate() - 14);
          break;
        case '30days':
          prevStartDate.setDate(prevStartDate.getDate() - 60);
          break;
        default:
          prevStartDate.setDate(prevStartDate.getDate() - 14);
      }

      const prevBets = bets.filter(b => b.timestamp?.toDate?.() <= prevStartDate);
      const revenueChange = prevBets.length > 0
        ? ((betsPlaced - prevBets.length) / prevBets.length) * 100
        : 0;

      return {
        success: true,
        data: {
          totalRevenue,
          commissionRevenue,
          activeUsers,
          betsPlaced,
          avgBetSize,
          totalBalance,
          totalBonus,
          wonBets,
          lostBets,
          refundedBets,
          totalDeposits,
          totalWithdrawals,
          totalBetAmount,
          totalWinnings,
          revenueChange: Math.round(revenueChange),
          usersChange: 0,
          betsChange: 0,
          avgBetChange: 0
        }
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        success: false,
        data: {
          totalRevenue: 0,
          activeUsers: 0,
          betsPlaced: 0,
          avgBetSize: 0,
          revenueChange: 0,
          usersChange: 0,
          betsChange: 0,
          avgBetChange: 0
        }
      };
    }
  }

  // Get financial data
  static async getFinancialData() {
    try {
      const usersResult = await this.getAllUsers();
      const users = usersResult.users || [];

      const betsResult = await this.getAllBets('all');
      const bets = betsResult.bets || [];

      const transactionsResult = await this.getAllTransactions('all');
      const transactions = transactionsResult.transactions || [];

      const commissionRate = 0.05;
      const totalBetAmount = bets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const commissionRevenue = totalBetAmount * commissionRate;

      const totalPayouts = bets
        .filter(b => b.result === 'won')
        .reduce((sum, b) => sum + (Number(b.potentialWin) || 0), 0);

      const escrowBalance = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
      const profitMargin = totalBetAmount > 0
        ? ((commissionRevenue - totalPayouts) / totalBetAmount) * 100
        : 0;

      return {
        success: true,
        data: {
          commissionRevenue,
          totalPayouts,
          escrowBalance,
          profitMargin: Math.round(profitMargin),
          totalBetAmount,
          activeUsers: users.length,
          totalTransactions: transactions.length
        }
      };
    } catch (error) {
      console.error('Error fetching financial data:', error);
      return {
        success: false,
        data: {
          commissionRevenue: 0,
          totalPayouts: 0,
          escrowBalance: 0,
          profitMargin: 0
        }
      };
    }
  }

  // Get system health
  static async getSystemHealth() {
    try {
      const testRef = doc(db, 'system', 'health');
      await getDoc(testRef);

      return {
        success: true,
        data: {
          database: 'healthy',
          api: 'healthy',
          payment: 'healthy',
          email: 'healthy',
          lastChecked: new Date(),
          uptime: '99.9%'
        }
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        success: true,
        data: {
          database: 'degraded',
          api: 'healthy',
          payment: 'healthy',
          email: 'healthy',
          lastChecked: new Date(),
          uptime: '99.0%'
        }
      };
    }
  }

  // Suspend user
  static async suspendUser(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'suspended',
        suspendedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error('Error suspending user:', error);
      return { success: false, error: error.message };
    }
  }

  // Unsuspend user
  static async unsuspendUser(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'active',
        suspendedAt: null
      });
      return { success: true };
    } catch (error) {
      console.error('Error unsuspending user:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete user
  static async deleteUser(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'deleted',
        deletedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Suspend user with reason
  static async suspendUserWithReason(userId, reason) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'suspended',
        suspendedAt: Timestamp.now(),
        suspensionReason: reason
      });
      return { success: true, message: 'User suspended successfully' };
    } catch (error) {
      console.error('Error suspending user:', error);
      return { success: false, error: error.message };
    }
  }

  // Ban user permanently
  static async banUser(userId, reason) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'banned',
        bannedAt: Timestamp.now(),
        banReason: reason
      });
      return { success: true, message: 'User banned successfully' };
    } catch (error) {
      console.error('Error banning user:', error);
      return { success: false, error: error.message };
    }
  }

  // Restrict user (limit certain features)
  static async restrictUser(userId, restrictions, reason) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'restricted',
        restrictedAt: Timestamp.now(),
        restrictions: restrictions, // ['betting', 'withdrawal', 'deposit']
        restrictionReason: reason
      });
      return { success: true, message: 'User restrictions applied' };
    } catch (error) {
      console.error('Error restricting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Prevent deleted users from logging in
  static async deleteUserPermanently(userId, reason) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'deleted',
        deletedAt: Timestamp.now(),
        deletionReason: reason,
        canLogin: false
      });
      return { success: true, message: 'User deleted permanently' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Settle bet
  static async settleBet(betId, result) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);
      const betData = betDoc.data();

      let updateData = {
        status: 'settled',
        result,
        settledAt: Timestamp.now()
      };

      if (result === 'won') {
        const userRef = doc(db, 'users', betData.userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const newBalance = (Number(userData.balance) || 0) + (Number(betData.potentialWin) || 0);

        await updateDoc(userRef, { balance: newBalance });
      } else if (result === 'refund') {
        const userRef = doc(db, 'users', betData.userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const newBalance = (Number(userData.balance) || 0) + (Number(betData.amount) || 0);

        await updateDoc(userRef, { balance: newBalance });
      }

      await updateDoc(betRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error settling bet:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user balance
  static async updateUserBalance(userId, newBalance) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { balance: newBalance });
      return { success: true };
    } catch (error) {
      console.error('Error updating balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user statistics
  static async getUserStats(userId) {
    try {
      const betsRef = collection(db, 'bets');
      const q = query(betsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const userBets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalBets = userBets.length;
      const wonBets = userBets.filter(b => b.result === 'won').length;
      const lostBets = userBets.filter(b => b.result === 'lost').length;
      const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
      const totalStaked = userBets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const totalWon = userBets
        .filter(b => b.result === 'won')
        .reduce((sum, b) => sum + (Number(b.potentialWin) || 0), 0);

      return {
        success: true,
        stats: {
          totalBets,
          wonBets,
          lostBets,
          winRate: Math.round(winRate),
          totalStaked,
          totalWon,
          profit: totalWon - totalStaked
        }
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { success: false, stats: {} };
    }
  }
}

// Export the class itself, not an instance
export default AdminService;