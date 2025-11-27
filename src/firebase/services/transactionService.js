import { db } from '../config';
import { 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';

class TransactionService {
  static async getUserTransactions(userId) {
    try {
      console.log('[TransactionService] Fetching transactions for user:', userId);
      
      // Simplified query - no orderBy to avoid index requirement
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(transactionsQuery);
      console.log('[TransactionService] Found', querySnapshot.size, 'transactions');
      
      const transactions = [];

      querySnapshot.forEach((doc) => {
        const txData = doc.data();
        console.log('[TransactionService] Transaction data:', txData);
        
        let timestamp;

        if (txData.timestamp && typeof txData.timestamp.toDate === 'function') {
          timestamp = txData.timestamp.toDate().toISOString();
        } else if (txData.timestamp) {
          timestamp = new Date(txData.timestamp).toISOString();
        } else {
          timestamp = new Date().toISOString();
        }

        transactions.push({
          id: doc.id,
          ...txData,
          timestamp: timestamp
        });
      });

      // Sort by timestamp in JavaScript (descending)
      transactions.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      console.log('[TransactionService] Processed transactions:', transactions);
      return { success: true, transactions };
    } catch (error) {
      console.error('[TransactionService] Error fetching transactions:', error);
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
        const txType = tx.type?.toLowerCase();
        const amount = Number(tx.amount) || 0;
        
        if (txType === 'deposit') {
          stats.totalDeposits += amount;
          stats.depositCount++;
        } else if (txType === 'withdrawal' || txType === 'withdraw') {
          stats.totalWithdrawals += amount;
          stats.withdrawalCount++;
        } else if (txType === 'refund') {
          stats.totalRefunds += amount;
          stats.refundCount++;
        }
      });

      console.log('[TransactionService] Stats:', stats);
      return { success: true, stats };
    } catch (error) {
      console.error('[TransactionService] Error calculating stats:', error);
      return { success: false, stats: null };
    }
  }
}

export default TransactionService;