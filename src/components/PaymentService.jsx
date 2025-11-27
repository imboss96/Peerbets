import { getFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class PaymentService {
  constructor() {
    this.db = null;
  }

  async initDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  // Process deposit
  async processDeposit(userId, amount, paymentMethod, phoneNumber = null) {
    try {
      await this.initDb();

      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      // Create deposit transaction
      const transactionRef = collection(this.db, 'transactions');
      const transactionId = `DEP-${Date.now()}`;

      const depositData = {
        transactionId,
        userId,
        type: 'deposit',
        amount,
        paymentMethod, // 'mpesa', 'card', 'bank'
        phoneNumber,
        status: 'pending', // pending, completed, failed
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };

      const docRef = await addDoc(transactionRef, depositData);

      // For demo/testing: auto-complete M-Pesa deposits
      if (paymentMethod === 'mpesa') {
        setTimeout(async () => {
          await this.completeDeposit(transactionId, userId, amount);
        }, 3000); // Simulate 3 second processing
      }

      return {
        success: true,
        transactionId,
        message: `Deposit initiated. Please complete payment of KSH ${amount}`,
        status: 'pending'
      };
    } catch (err) {
      console.error('processDeposit error:', err);
      return { success: false, error: err.message };
    }
  }

  // Complete deposit and update balance
  async completeDeposit(transactionId, userId, amount) {
    try {
      await this.initDb();

      // Update transaction status
      const transRef = collection(this.db, 'transactions');
      const q = query(transRef, where('transactionId', '==', transactionId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Transaction not found' };
      }

      const transDoc = snapshot.docs[0];
      await updateDoc(transDoc.ref, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Update user balance
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const newBalance = (userData.balance || 0) + amount;

        await updateDoc(userRef, {
          balance: newBalance,
          lastUpdated: new Date().toISOString()
        });

        return {
          success: true,
          message: `Deposit of KSH ${amount} completed`,
          newBalance
        };
      }
    } catch (err) {
      console.error('completeDeposit error:', err);
      return { success: false, error: err.message };
    }
  }

  // Process withdrawal
  async processWithdrawal(userId, amount, paymentMethod, accountDetails) {
    try {
      await this.initDb();

      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      // Check user balance
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userSnap.data();
      const currentBalance = userData.balance || 0;

      if (currentBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Available: KSH ${currentBalance}` 
        };
      }

      // Create withdrawal transaction
      const transactionId = `WD-${Date.now()}`;
      const transactionRef = collection(this.db, 'transactions');

      const withdrawalData = {
        transactionId,
        userId,
        type: 'withdrawal',
        amount,
        paymentMethod, // 'mpesa', 'bank'
        accountDetails, // { phoneNumber } or { accountNumber, bankCode }
        status: 'pending', // pending, completed, failed, cancelled
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };

      await addDoc(transactionRef, withdrawalData);

      // Deduct from balance immediately (hold)
      const newBalance = currentBalance - amount;
      await updateDoc(userRef, {
        balance: newBalance,
        lastUpdated: new Date().toISOString()
      });

      // Auto-complete M-Pesa withdrawals after delay
      if (paymentMethod === 'mpesa') {
        setTimeout(async () => {
          await this.completeWithdrawal(transactionId, userId, amount);
        }, 5000); // Simulate 5 second processing
      }

      return {
        success: true,
        transactionId,
        message: `Withdrawal of KSH ${amount} initiated`,
        status: 'pending',
        newBalance
      };
    } catch (err) {
      console.error('processWithdrawal error:', err);
      return { success: false, error: err.message };
    }
  }

  // Complete withdrawal
  async completeWithdrawal(transactionId, userId, amount) {
    try {
      await this.initDb();

      // Update transaction status
      const transRef = collection(this.db, 'transactions');
      const q = query(transRef, where('transactionId', '==', transactionId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Transaction not found' };
      }

      const transDoc = snapshot.docs[0];
      await updateDoc(transDoc.ref, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: `Withdrawal of KSH ${amount} completed`
      };
    } catch (err) {
      console.error('completeWithdrawal error:', err);
      return { success: false, error: err.message };
    }
  }

  // Cancel withdrawal
  async cancelWithdrawal(transactionId, userId) {
    try {
      await this.initDb();

      const transRef = collection(this.db, 'transactions');
      const q = query(transRef, where('transactionId', '==', transactionId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Transaction not found' };
      }

      const transDoc = snapshot.docs[0];
      const transaction = transDoc.data();

      await updateDoc(transDoc.ref, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });

      // Refund balance
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const refundBalance = (userData.balance || 0) + transaction.amount;

        await updateDoc(userRef, {
          balance: refundBalance,
          lastUpdated: new Date().toISOString()
        });
      }

      return { success: true, message: 'Withdrawal cancelled and balance refunded' };
    } catch (err) {
      console.error('cancelWithdrawal error:', err);
      return { success: false, error: err.message };
    }
  }

  // Get transaction history
  async getTransactionHistory(userId, limit = 20) {
    try {
      await this.initDb();
      const transRef = collection(this.db, 'transactions');
      const q = query(transRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const transactions = [];
      snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        data: transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit)
      };
    } catch (err) {
      console.error('getTransactionHistory error:', err);
      return { success: false, error: err.message };
    }
  }
}

export default new PaymentService();