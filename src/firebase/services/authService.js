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
   * Get all users (admin)
   */
  static async getAllUsers() {
    try {
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const users = [];
      snapshot.forEach(doc => users.push({ uid: doc.id, ...doc.data() }));
      return { success: true, users };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message, users: [] };
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

  //survey services
  // Add to FirebaseAuthService class
static async saveSurveyAnswers(uid, answers) {
  try {
    await this.initialize();
    
    await this.updateDoc(this.doc(this.firebaseDb, 'users', uid), {
      surveyCompleted: true,
      surveyAnswers: answers,
      surveyCompletedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Save survey error:', error);
    return { success: false, error: 'Failed to save survey' };
  }
}

static async findMatchingUsers(currentUserId, currentUserAnswers) {
  try {
    await this.initialize();
    
    const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get all users who completed survey (excluding current user)
    const usersQuery = query(
      collection(this.firebaseDb, 'users'),
      where('surveyCompleted', '==', true)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Skip current user
      if (userData.uid === currentUserId) return;
      
      const matchScore = this.calculateMatchScore(currentUserAnswers, userData.surveyAnswers);
      
      if (matchScore >= 60) { // Only show matches with 60%+ compatibility
        matches.push({
          uid: userData.uid,
          username: userData.username,
          matchPercentage: matchScore,
          bettingStyle: userData.surveyAnswers?.betting_style?.[0] || 'Not specified',
          betRange: userData.surveyAnswers?.bet_amount_range?.[0] || 'Not specified',
          favoriteTeams: userData.surveyAnswers?.favorite_teams || []
        });
      }
    });
    
    // Sort by match percentage (highest first)
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    return { success: true, matches: matches.slice(0, 5) }; // Return top 5 matches
  } catch (error) {
    console.error('Find matching users error:', error);
    return { success: false, error: 'Failed to find matches', matches: [] };
  }
}

static calculateMatchScore(answers1, answers2) {
  if (!answers1 || !answers2) return 0;
  
  let totalScore = 0;
  let maxScore = 0;
  
  Object.keys(answers1).forEach(questionId => {
    const user1Answers = answers1[questionId] || [];
    const user2Answers = answers2[questionId] || [];
    
    if (user1Answers.length > 0 && user2Answers.length > 0) {
      const commonAnswers = user1Answers.filter(answer => 
        user2Answers.includes(answer)
      ).length;
      
      const maxAnswers = Math.max(user1Answers.length, user2Answers.length);
      totalScore += (commonAnswers / maxAnswers) * 100;
      maxScore += 100;
    }
  });
  
  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

static async createP2PBet(betData) {
  try {
    await this.initialize();
    
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const p2pBet = {
      ...betData,
      type: 'p2p',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const betRef = await addDoc(collection(this.firebaseDb, 'p2p_bets'), p2pBet);
    
    return { success: true, betId: betRef.id };
  } catch (error) {
    console.error('Create P2P bet error:', error);
    return { success: false, error: 'Failed to create P2P bet' };
  }
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
