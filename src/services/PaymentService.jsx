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

  async processDeposit(userId, amount, paymentMethod, phoneNumber = null) {
    try {
      await this.initDb();

      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      const transactionId = `DEP-${Date.now()}`;
      const transactionRef = collection(this.db, 'transactions');

      const depositData = {
        transactionId,
        userId,
        type: 'deposit',
        amount,
        paymentMethod,
        phoneNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };

      await addDoc(transactionRef, depositData);

      // Auto-complete M-Pesa deposits after 3 seconds
      if (paymentMethod === 'mpesa') {
        setTimeout(async () => {
          await this.completeDeposit(transactionId, userId, amount);
        }, 3000);
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

  async completeDeposit(transactionId, userId, amount) {
    try {
      await this.initDb();

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

  async processWithdrawal(userId, amount, paymentMethod, accountDetails) {
    try {
      await this.initDb();

      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

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

      const transactionId = `WD-${Date.now()}`;
      const transactionRef = collection(this.db, 'transactions');

      const withdrawalData = {
        transactionId,
        userId,
        type: 'withdrawal',
        amount,
        paymentMethod,
        accountDetails,
        status: 'pending',
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };

      await addDoc(transactionRef, withdrawalData);

      const newBalance = currentBalance - amount;
      await updateDoc(userRef, {
        balance: newBalance,
        lastUpdated: new Date().toISOString()
      });

      if (paymentMethod === 'mpesa') {
        setTimeout(async () => {
          await this.completeWithdrawal(transactionId, userId, amount);
        }, 5000);
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

  async completeWithdrawal(transactionId, userId, amount) {
    try {
      await this.initDb();

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

      return { success: true, message: `Withdrawal of KSH ${amount} completed` };
    } catch (err) {
      console.error('completeWithdrawal error:', err);
      return { success: false, error: err.message };
    }
  }

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