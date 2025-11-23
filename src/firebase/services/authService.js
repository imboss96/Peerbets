import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(email, password, username, phoneNumber) {
    try {
      // Create Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        username: username,
        phoneNumber: phoneNumber,
        balance: 1000, // Starting balance
        bonus: 500, // Welcome bonus
        withdrawableBonus: 200,
        kycVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Fetch the complete user data
      const userData = await this.getUserData(user.uid);
      
      return { 
        success: true, 
        user: userData 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      // Fetch user data from Firestore
      const userData = await this.getUserData(user.uid);
      
      if (!userData) {
        throw new Error('User data not found');
      }
      
      return { 
        success: true, 
        user: userData 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        message: 'Password reset email sent' 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Get user data from Firestore
   */
  static async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        return {
          uid: uid,
          ...userDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Update user balance
   */
  static async updateUserBalance(uid, newBalance, bonus, withdrawableBonus) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        balance: newBalance,
        bonus: bonus,
        withdrawableBonus: withdrawableBonus,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating balance:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await this.getUserData(user.uid);
        callback(userData);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get user-friendly error messages
   */
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak (minimum 6 characters)',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/too-many-requests': 'Too many failed attempts. Try again later',
      'auth/network-request-failed': 'Network error. Check your connection'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }
}
