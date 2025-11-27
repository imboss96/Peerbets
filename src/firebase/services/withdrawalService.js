import { db } from '../config';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  increment
} from 'firebase/firestore';

class WithdrawalService {
  // Request withdrawal
  static async requestWithdrawal(userId, amount, phoneNumber, accountName) {
    try {
      // Validate amount
      if (amount <= 0) {
        return { success: false, error: 'Invalid withdrawal amount' };
      }

      // Get user details
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      const currentBalance = Number(userData.balance) || 0;

      // Check sufficient balance
      if (currentBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Create withdrawal request
      const withdrawalId = `withdrawal_${Date.now()}`;
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);

      await setDoc(withdrawalRef, {
        id: withdrawalId,
        userId,
        username: userData.username,
        email: userData.email,
        amount: Number(amount),
        phoneNumber,
        accountName,
        status: 'pending', // pending, processing, completed, failed, cancelled
        requestedAt: Timestamp.now(),
        processedAt: null,
        completedAt: null,
        failureReason: null,
        transactionReference: null
      });

      // Create transaction record
      const transactionId = `txn_${Date.now()}`;
      const transactionRef = doc(db, 'transactions', transactionId);

      await setDoc(transactionRef, {
        id: transactionId,
        userId,
        username: userData.username,
        email: userData.email,
        type: 'withdrawal',
        method: 'bank_transfer',
        amount: Number(amount),
        status: 'pending',
        phoneNumber,
        accountName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        withdrawalId,
        description: `Withdrawal to ${accountName}`
      });

      // Deduct from user balance immediately
      const newBalance = currentBalance - amount;
      await updateDoc(userRef, {
        balance: newBalance,
        lastUpdated: Timestamp.now(),
        pendingWithdrawal: increment(amount)
      });

      return {
        success: true,
        withdrawalId,
        transactionId,
        message: 'Withdrawal request submitted successfully',
        newBalance
      };
    } catch (error) {
      console.error('Withdrawal request error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user withdrawals
  static async getUserWithdrawals(userId) {
    try {
      const withdrawalsRef = collection(db, 'withdrawals');
      const q = query(withdrawalsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const withdrawals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate?.() || new Date(),
        processedAt: doc.data().processedAt?.toDate?.() || null,
        completedAt: doc.data().completedAt?.toDate?.() || null
      }));

      return { success: true, withdrawals: withdrawals.sort((a, b) => b.requestedAt - a.requestedAt) };
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return { success: false, withdrawals: [], error: error.message };
    }
  }

  // Get all withdrawals (admin)
  static async getAllWithdrawals(status = 'all') {
    try {
      const withdrawalsRef = collection(db, 'withdrawals');
      let q;

      if (status === 'all') {
        q = query(withdrawalsRef);
      } else {
        q = query(withdrawalsRef, where('status', '==', status));
      }

      const snapshot = await getDocs(q);

      const withdrawals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate?.() || new Date(),
        processedAt: doc.data().processedAt?.toDate?.() || null,
        completedAt: doc.data().completedAt?.toDate?.() || null
      }));

      return { success: true, withdrawals: withdrawals.sort((a, b) => b.requestedAt - a.requestedAt) };
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return { success: false, withdrawals: [], error: error.message };
    }
  }

  // Approve withdrawal
  static async approveWithdrawal(withdrawalId, transactionReference) {
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      const withdrawalDoc = await getDoc(withdrawalRef);

      if (!withdrawalDoc.exists()) {
        return { success: false, error: 'Withdrawal not found' };
      }

      const withdrawalData = withdrawalDoc.data();

      // Update withdrawal status
      await updateDoc(withdrawalRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        transactionReference
      });

      // Update transaction status
      if (withdrawalData.transactionId) {
        const txnRef = doc(db, 'transactions', withdrawalData.transactionId);
        await updateDoc(txnRef, {
          status: 'completed',
          updatedAt: Timestamp.now(),
          transactionReference
        });
      }

      // Update user pending withdrawal
      const userRef = doc(db, 'users', withdrawalData.userId);
      await updateDoc(userRef, {
        pendingWithdrawal: increment(-withdrawalData.amount),
        lastUpdated: Timestamp.now()
      });

      return { success: true, message: 'Withdrawal approved successfully' };
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject withdrawal
  static async rejectWithdrawal(withdrawalId, reason) {
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      const withdrawalDoc = await getDoc(withdrawalRef);

      if (!withdrawalDoc.exists()) {
        return { success: false, error: 'Withdrawal not found' };
      }

      const withdrawalData = withdrawalDoc.data();

      // Update withdrawal status
      await updateDoc(withdrawalRef, {
        status: 'failed',
        completedAt: Timestamp.now(),
        failureReason: reason
      });

      // Update transaction status
      if (withdrawalData.transactionId) {
        const txnRef = doc(db, 'transactions', withdrawalData.transactionId);
        await updateDoc(txnRef, {
          status: 'failed',
          updatedAt: Timestamp.now(),
          failureReason: reason
        });
      }

      // Refund balance to user
      const userRef = doc(db, 'users', withdrawalData.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const refundedBalance = (Number(userData.balance) || 0) + withdrawalData.amount;

      await updateDoc(userRef, {
        balance: refundedBalance,
        pendingWithdrawal: increment(-withdrawalData.amount),
        lastUpdated: Timestamp.now()
      });

      return { success: true, message: 'Withdrawal rejected and balance refunded' };
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel withdrawal
  static async cancelWithdrawal(withdrawalId) {
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      const withdrawalDoc = await getDoc(withdrawalRef);

      if (!withdrawalDoc.exists()) {
        return { success: false, error: 'Withdrawal not found' };
      }

      const withdrawalData = withdrawalDoc.data();

      // Only allow cancellation if status is pending
      if (withdrawalData.status !== 'pending') {
        return { success: false, error: `Cannot cancel ${withdrawalData.status} withdrawal` };
      }

      // Update withdrawal status
      await updateDoc(withdrawalRef, {
        status: 'cancelled',
        completedAt: Timestamp.now()
      });

      // Update transaction status
      if (withdrawalData.transactionId) {
        const txnRef = doc(db, 'transactions', withdrawalData.transactionId);
        await updateDoc(txnRef, {
          status: 'cancelled',
          updatedAt: Timestamp.now()
        });
      }

      // Refund balance to user
      const userRef = doc(db, 'users', withdrawalData.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const refundedBalance = (Number(userData.balance) || 0) + withdrawalData.amount;

      await updateDoc(userRef, {
        balance: refundedBalance,
        pendingWithdrawal: increment(-withdrawalData.amount),
        lastUpdated: Timestamp.now()
      });

      return { success: true, message: 'Withdrawal cancelled and balance refunded' };
    } catch (error) {
      console.error('Error cancelling withdrawal:', error);
      return { success: false, error: error.message };
    }
  }

  // Get withdrawal statistics
  static async getWithdrawalStats() {
    try {
      const withdrawalsRef = collection(db, 'withdrawals');
      const snapshot = await getDocs(withdrawalsRef);

      const withdrawals = snapshot.docs.map(doc => doc.data());

      const totalRequested = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      const totalCompleted = withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      const totalPending = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      const totalFailed = withdrawals
        .filter(w => w.status === 'failed')
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

      return {
        success: true,
        stats: {
          totalRequested,
          totalCompleted,
          totalPending,
          totalFailed,
          totalCount: withdrawals.length,
          completedCount: withdrawals.filter(w => w.status === 'completed').length,
          pendingCount: withdrawals.filter(w => w.status === 'pending').length,
          failedCount: withdrawals.filter(w => w.status === 'failed').length
        }
      };
    } catch (error) {
      console.error('Error fetching withdrawal stats:', error);
      return { success: false, stats: {} };
    }
  }
}

export default WithdrawalService;