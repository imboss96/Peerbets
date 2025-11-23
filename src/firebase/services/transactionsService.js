import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  orderBy,
  limit 
} from 'firebase/firestore';

export class TransactionsService {
  /**
   * Create a new transaction
   */
  static async createTransaction(transactionData) {
    try {
      const transaction = {
        ...transactionData,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'transactions'), transaction);
      
      return { 
        success: true, 
        transactionId: docRef.id 
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Get user transactions
   */
  static async getUserTransactions(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { 
        success: true, 
        transactions 
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { 
        success: false, 
        error: error.message,
        transactions: [] 
      };
    }
  }

  /**
   * Record a bet transaction
   */
  static async recordBet(userId, amount, betId) {
    return await this.createTransaction({
      userId,
      type: 'bet',
      amount: -amount, // Negative because it's a deduction
      betId,
      status: 'completed',
      description: 'Bet placed'
    });
  }

  /**
   * Record a win transaction
   */
  static async recordWin(userId, amount, betId) {
    return await this.createTransaction({
      userId,
      type: 'win',
      amount: amount,
      betId,
      status: 'completed',
      description: 'Bet won'
    });
  }

  /**
   * Record a deposit transaction
   */
  static async recordDeposit(userId, amount, paymentMethod) {
    return await this.createTransaction({
      userId,
      type: 'deposit',
      amount: amount,
      paymentMethod,
      status: 'pending',
      description: 'Deposit'
    });
  }

  /**
   * Record a withdrawal transaction
   */
  static async recordWithdrawal(userId, amount, paymentMethod) {
    return await this.createTransaction({
      userId,
      type: 'withdrawal',
      amount: -amount,
      paymentMethod,
      status: 'pending',
      description: 'Withdrawal'
    });
  }
}
