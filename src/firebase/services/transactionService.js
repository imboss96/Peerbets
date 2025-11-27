import { db } from '../config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp
} from 'firebase/firestore';

class TransactionService {
  static async getUserTransactions(userId) {
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(transactionsQuery);
      const transactions = [];

      querySnapshot.forEach((doc) => {
        const txData = doc.data();
        let timestamp;

        if (txData.timestamp && typeof txData.timestamp.toDate === 'function') {
          timestamp = txData.timestamp.toDate().toISOString();
        } else if (txData.timestamp) {
          timestamp = txData.timestamp;
        } else {
          timestamp = new Date().toISOString();
        }

        transactions.push({
          id: doc.id,
          ...txData,
          timestamp: timestamp
        });
      });

      return { success: true, transactions };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { success: false, error: error.message, transactions: [] };
    }
  }

  static async getTransactionStats(userId) {
    try {
      const result = await this.getUserTransactions(userId);
      
      if (!result.success) {
        return { success: false, stats: null };
      }

      const transactions = result.transactions;
      const stats = {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalRefunds: 0,
        depositCount: 0,
        withdrawalCount: 0,
        refundCount: 0
      };

      transactions.forEach(tx => {
        if (tx.type === 'deposit') {
          stats.totalDeposits += tx.amount;
          stats.depositCount++;
        } else if (tx.type === 'withdrawal' || tx.type === 'withdraw') {
          stats.totalWithdrawals += tx.amount;
          stats.withdrawalCount++;
        } else if (tx.type === 'refund') {
          stats.totalRefunds += tx.amount;
          stats.refundCount++;
        }
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { success: false, stats: null };
    }
  }
}

export default TransactionService;