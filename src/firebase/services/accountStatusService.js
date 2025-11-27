import { db } from '../config';
import { doc, getDoc } from 'firebase/firestore';

class AccountStatusService {
  // Check account status and restrictions
  static async checkAccountStatus(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          success: true,
          canLogin: false,
          status: 'not_found',
          message: 'Account not found',
          warning: null
        };
      }

      const userData = userDoc.data();
      const status = userData.status || 'active';

      // Check if account is deleted
      if (status === 'deleted') {
        return {
          success: true,
          canLogin: false,
          status: 'deleted',
          message: 'This account has been deleted',
          warning: null
        };
      }

      // Check if account is suspended
      if (status === 'suspended') {
        return {
          success: true,
          canLogin: true, // Allow login but show warning
          status: 'suspended',
          message: 'Your account is suspended',
          warning: {
            type: 'suspended',
            title: '⚠️ Account Limited',
            message: 'Your account is currently limited. Please contact support for more information.',
            reason: userData.suspensionReason || 'Account suspension',
            suspendedAt: userData.suspendedAt?.toDate?.() || new Date(),
            contactEmail: 'support@sparkbets.com',
            contactPhone: '+254712345678',
            severity: 'high'
          }
        };
      }

      // Check if account is banned
      if (status === 'banned') {
        return {
          success: true,
          canLogin: false,
          status: 'banned',
          message: 'This account has been banned',
          warning: {
            type: 'banned',
            title: '❌ Account Banned',
            message: 'Your account has been permanently banned. Contact support for appeals.',
            reason: userData.banReason || 'Account ban',
            bannedAt: userData.bannedAt?.toDate?.() || new Date(),
            contactEmail: 'support@sparkbets.com',
            severity: 'critical'
          }
        };
      }

      // Check if account is restricted
      if (status === 'restricted') {
        return {
          success: true,
          canLogin: true,
          status: 'restricted',
          message: 'Your account has restrictions',
          warning: {
            type: 'restricted',
            title: '⚠️ Account Restricted',
            message: 'Your account has certain restrictions. Some features may be unavailable.',
            reason: userData.restrictionReason || 'Account restricted',
            restrictions: userData.restrictions || [],
            restrictedAt: userData.restrictedAt?.toDate?.() || new Date(),
            severity: 'medium'
          }
        };
      }

      // Active account
      return {
        success: true,
        canLogin: true,
        status: 'active',
        message: 'Account is active',
        warning: null
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      return {
        success: false,
        canLogin: false,
        status: 'error',
        message: 'Error checking account status',
        warning: null,
        error: error.message
      };
    }
  }

  // Get account restrictions
  static async getAccountRestrictions(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { success: false, restrictions: [] };
      }

      const userData = userDoc.data();

      return {
        success: true,
        restrictions: userData.restrictions || [],
        status: userData.status,
        canPlaceBets: !userData.restrictions?.includes('betting'),
        canWithdraw: !userData.restrictions?.includes('withdrawal'),
        canDeposit: !userData.restrictions?.includes('deposit')
      };
    } catch (error) {
      console.error('Error getting restrictions:', error);
      return { success: false, restrictions: [] };
    }
  }
}

export default AccountStatusService;