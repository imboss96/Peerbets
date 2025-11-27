import React, { useState, useEffect } from 'react';
import { Trophy, Wallet, Clock, TrendingUp, RefreshCw, Users, ChevronRight, Flame, Lock, Radio, Target, Award, Zap, LogOut, User, Mail, Phone, Eye, EyeOff, Search, Menu, X, DollarSign } from 'lucide-react';
// ApiFootballService removed — debug/live fetching disabled
import { LEAGUE_IDS } from './services/leagueIds';
import ColorStake from './components/ColorStake';
import AdminDashboard from './components/AdminDashboard';
import AdminService from './firebase/services/adminService';
import { getDB } from './firebase/initFirebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Fly from './components/Fly';
import BetSettlementModal from './components/BetSettlementModal';
import BetSettlementService from './services/BetSettlementService';
import AccountStatusService from './firebase/services/accountStatusService';
import AccountWarningModal from './components/AccountWarningModal';
import TransactionsPage from './components/TransactionsPage';


/* SurveyForm component disabled. To re-enable, restore the component definition here.
const SurveyForm = ({ questions, onComplete, onSkip }) => { ... }
*/

//MATCH NOTIFACTION SERVICE
const MatchNotification = ({ matchedUsers, onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-green-500/30 max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="bg-green-500/20 p-4 rounded-full inline-block mb-4">
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Perfect Match Found! 🎯</h2>
          <p className="text-gray-400">We found users with similar betting interests</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Matched Users:</h3>
          <div className="space-y-2">
            {matchedUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.username}</p>
                    <p className="text-xs text-gray-400">{user.matchPercentage}% match</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-400">{user.bettingStyle}</p>
                  <p className="text-xs text-gray-400">Typical bet: {user.betRange}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-300 text-center">
            💡 You can now place peer-to-peer bets with these users. No odds - just agree on terms!
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Start Betting!
          </button>
        </div>
      </div>
    </div>
  );
};
const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBYuEbHVbs-9eXqo9Ds92C6HR70__tJbV0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sparkbet-af742.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sparkbet-af742",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sparkbet-af742.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "63170914902",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:63170914902:web:121f41f5217f99ab3869f7",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-5GNLZTDDF0"
};

// Firebase Auth Service
class FirebaseAuthService {
  static firebaseAuth = null;
  static firebaseDb = null;
  static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    try {
      const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getFirestore, doc, setDoc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

      const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
      this.firebaseAuth = getAuth(app);
      this.firebaseDb = getFirestore(app);
      
      this.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
      this.signInWithEmailAndPassword = signInWithEmailAndPassword;
      this.signOut = signOut;
      this.sendPasswordResetEmail = sendPasswordResetEmail;
      this.onAuthStateChanged = onAuthStateChanged;
      this.updateProfile = updateProfile;
      this.doc = doc;
      this.setDoc = setDoc;
      this.getDoc = getDoc;
      this.updateDoc = updateDoc;

      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw new Error('Failed to initialize Firebase: ' + error.message);
    }
  }

  // Generate email from phone number for Firebase Auth
  static generateEmailFromPhone(phoneNumber) {
    return `${phoneNumber.replace(/[^0-9]/g, '')}@sparkbet.ke`;
  }

  static async register(username, phoneNumber, password) {
    try {
      await this.initialize();

      if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
        return { 
          success: false, 
          error: 'Please configure Firebase: Update FIREBASE_CONFIG with your actual Firebase credentials' 
        };
      }

      const email = this.generateEmailFromPhone(phoneNumber);
      const userCredential = await this.createUserWithEmailAndPassword(this.firebaseAuth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with username
      await this.updateProfile(firebaseUser, {
        displayName: username
      });

      const userData = {
        uid: firebaseUser.uid,
        email: email,
        username: username,
        phoneNumber: phoneNumber,
        balance: 1000,
        bonus: 0,
        withdrawableBonus: 0,
        isAdmin: false,
        createdAt: new Date().toISOString()
      };

      await this.setDoc(this.doc(this.firebaseDb, 'users', firebaseUser.uid), userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This phone number is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid phone number';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }

      return { success: false, error: errorMessage };
    }
  }

  static async loginWithPassword(phoneNumber, password) {
    try {
      await this.initialize();

      const email = this.generateEmailFromPhone(phoneNumber);
      const userCredential = await this.signInWithEmailAndPassword(this.firebaseAuth, email, password);
      const firebaseUser = userCredential.user;

      const userDoc = await this.getDoc(this.doc(this.firebaseDb, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'User profile not found' };
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this phone number';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid phone number';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }

      return { success: false, error: errorMessage };
    }
  }

  // Mock OTP verification
  static async verifyOTP(phoneNumber, otp) {
    try {
      await this.initialize();
      
      // Mock OTP verification - in production, integrate with SMS service
      // For demo purposes, any 6-digit code starting with '1' will work
      if (otp.length === 6 && otp.startsWith('1')) {
        // Find user by phone number
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const usersQuery = query(
          collection(this.firebaseDb, 'users'),
          where('phoneNumber', '==', phoneNumber)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          // Sign in the user properly
          const email = this.generateEmailFromPhone(phoneNumber);
          const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
          const auth = getAuth();
          
          // For OTP login, we need to have a password - in real app, use Firebase Phone Auth
          // For demo, we'll use a default password
          try {
            await signInWithEmailAndPassword(auth, email, 'otp123456');
          } catch (authError) {
            console.log('Auth sign in attempted for OTP login');
          }
          
          return { success: true, user: userData };
        } else {
          return { success: false, error: 'No account found with this phone number' };
        }
      } else {
        return { success: false, error: 'Invalid OTP code. Use any code starting with 1 for demo' };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: 'OTP verification failed' };
    }
  }

  // Mock OTP sending
  static async sendOTP(phoneNumber) {
    try {
      // In production, integrate with SMS service like Africa's Talking, Twilio, etc.
      console.log(`Mock: Sending OTP to ${phoneNumber}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, always return success
      return { 
        success: true, 
        message: 'OTP sent to your phone',
        demoOtp: '123456' // Starting with 1 for demo verification
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: 'Failed to send OTP' };
    }
  }

  static async resetPasswordWithOTP(phoneNumber) {
    try {
      const result = await this.sendOTP(phoneNumber);
      if (result.success) {
        return { 
          success: true, 
          message: 'OTP sent to your phone for password reset',
          demoOtp: result.demoOtp
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Password reset OTP error:', error);
      return { success: false, error: 'Failed to send reset OTP' };
    }
  }

  static async changePassword(phoneNumber, newPassword) {
    try {
      await this.initialize();
      
      const email = this.generateEmailFromPhone(phoneNumber);
      
      // For password change, we need to be authenticated first
      // In a real app, you would handle this differently
      console.log('Password change requested for:', phoneNumber);
      
      return { success: true, message: 'Password reset process initiated' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  static async logout() {
    try {
      await this.initialize();
      await this.signOut(this.firebaseAuth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  static async getCurrentUser() {
    try {
      await this.initialize();
      
      return new Promise((resolve) => {
        this.onAuthStateChanged(this.firebaseAuth, async (firebaseUser) => {
          if (firebaseUser) {
            const userDoc = await this.getDoc(this.doc(this.firebaseDb, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              resolve(userDoc.data());
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async updateUserBalance(uid, newBalance, bonus, withdrawableBonus) {
    try {
      await this.initialize();
      
      await this.updateDoc(this.doc(this.firebaseDb, 'users', uid), {
        balance: newBalance,
        bonus: bonus,
        withdrawableBonus: withdrawableBonus
      });

      return { success: true };
    } catch (error) {
      console.error('Update balance error:', error);
      return { success: false, error: 'Failed to update balance' };
    }
  }

  static async saveBet(betData) {
    try {
      await this.initialize();
      
      const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const betRef = await addDoc(collection(this.firebaseDb, 'bets'), betData);
      
      return { success: true, betId: betRef.id };
    } catch (error) {
      console.error('Save bet error:', error);
      return { success: false, error: 'Failed to save bet' };
    }
  }
static async getUserBets(uid) {
  try {
    await this.initialize();
    
    const { collection, query, where, orderBy, getDocs, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const betsQuery = query(
      collection(this.firebaseDb, 'bets'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(betsQuery);
    const bets = [];
    
    querySnapshot.forEach((doc) => {
      const betData = doc.data();
      // Properly handle Firestore timestamp
      let timestamp;
      
      if (betData.timestamp && typeof betData.timestamp.toDate === 'function') {
        // It's a Firestore timestamp
        timestamp = betData.timestamp.toDate().toISOString();
      } else if (betData.timestamp) {
        // It's already a string or other format
        timestamp = betData.timestamp;
      } else {
        // Fallback to current time
        timestamp = new Date().toISOString();
      }
      
      bets.push({ 
        id: doc.id, 
        ...betData,
        timestamp: timestamp
      });
    });
    
    console.log('✅ Loaded bets from Firebase:', bets.length, 'bets');
    return { success: true, bets };
  } catch (error) {
    console.error('❌ Get user bets error:', error);
    return { success: false, error: 'Failed to load bets', bets: [] };
  }
}
}
//MockData


const MARKETS = [
  { id: 'match_winner', name: 'Match Winner', icon: Trophy },
  { id: 'total_goals', name: 'Total Goals', icon: Target },
  { id: 'both_teams_score', name: 'Both Teams to Score', icon: Award },
  { id: 'penalties', name: 'Penalties (Even/Odd)', icon: Zap },
  { id: 'corners', name: 'Total Corners', icon: ChevronRight },
  { id: 'cards', name: 'Total Cards', icon: Radio }
];

const LoginForm = ({ onLogin, onSwitchToRegister, onForgotPassword, onSwitchToOTPLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await FirebaseAuthService.loginWithPassword(phoneNumber, password);
    if (result.success) {
      onLogin(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg inline-block mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to SparkBets</h2>
        <p className="text-gray-400 text-sm">Login to start betting</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="+254712345678"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-12 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login with Password'}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onForgotPassword}
            className="flex-1 text-sm text-blue-400 hover:text-blue-300"
          >
            Forgot Password?
          </button>
          <button
            type="button"
            onClick={onSwitchToOTPLogin}
            className="flex-1 text-sm text-green-400 hover:text-green-300"
          >
            Login with OTP
          </button>
        </div>

        <div className="text-center pt-4 border-t border-slate-700">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="text-blue-400 hover:text-blue-300 font-medium">
              Register
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

const OTPLoginForm = ({ onLogin, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await FirebaseAuthService.sendOTP(phoneNumber);
    if (result.success) {
      setOtpSent(true);
      setStep('otp');
      alert(`Demo: Use OTP ${result.demoOtp} to login`); // Remove in production
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await FirebaseAuthService.verifyOTP(phoneNumber, otp);
    if (result.success) {
      onLogin(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-green-500 to-blue-600 p-3 rounded-lg inline-block mb-4">
          <Phone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">OTP Login</h2>
        <p className="text-gray-400 text-sm">Quick login with phone verification</p>
      </div>

      {step === 'phone' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="+254712345678"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <button type="button" onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-300">
            Back to Password Login
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="text-center">
            <div className="bg-green-500/20 p-3 rounded-full inline-block mb-4">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-medium mb-2">OTP Sent to {phoneNumber}</p>
            <p className="text-gray-400 text-sm">Enter the 6-digit code sent to your phone</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white text-center text-xl font-mono focus:outline-none focus:border-blue-500"
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button 
            type="button" 
            onClick={() => setStep('phone')}
            className="w-full text-sm text-gray-400 hover:text-gray-300"
          >
            Change Phone Number
          </button>
        </form>
      )}
    </div>
  );
};

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('details'); // 'details' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    if (!formData.username || !formData.phoneNumber || !formData.password) {
      setError('Please fill all fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    const result = await FirebaseAuthService.sendOTP(formData.phoneNumber);
    if (result.success) {
      setOtpSent(true);
      setStep('otp');
      alert(`Demo: Use OTP ${result.demoOtp} to register`); // Remove in production
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 'details') {
      await handleSendOTP();
      return;
    }

    // OTP verification step
    setLoading(true);
    setError('');

    const result = await FirebaseAuthService.register(
      formData.username,
      formData.phoneNumber,
      formData.password
    );

    if (result.success) {
      onRegister(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg inline-block mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-gray-400 text-sm">Join SparkBets today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 'details' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Choose username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="+254712345678"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-12 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                >
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
          </>
        )}

        {step === 'otp' && (
          <div>
            <div className="text-center mb-4">
              <div className="bg-green-500/20 p-3 rounded-full inline-block mb-2">
                <Phone className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-white font-medium">Verify Phone Number</p>
              <p className="text-gray-400 text-sm">Enter OTP sent to {formData.phoneNumber}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">OTP Code</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white text-center text-xl font-mono focus:outline-none focus:border-blue-500"
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full text-sm text-gray-400 hover:text-gray-300 mb-2"
            >
              Change Details
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : step === 'details' ? 'Send OTP' : 'Create Account'}
        </button>

        <div className="text-center pt-4 border-t border-slate-700">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-blue-400 hover:text-blue-300 font-medium">
              Login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

const ForgotPasswordForm = ({ onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'password'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await FirebaseAuthService.resetPasswordWithOTP(phoneNumber);
    setLoading(false);
    
    if (result.success) {
      setStep('otp');
      alert(`Demo: Use OTP ${result.demoOtp} to reset password`); // Remove in production
    } else {
      setError(result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await FirebaseAuthService.verifyOTP(phoneNumber, otp);
    if (result.success) {
      setStep('password');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await FirebaseAuthService.changePassword(phoneNumber, newPassword);
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
  };

  if (success) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full text-center">
        <div className="bg-green-500/20 p-4 rounded-full inline-block mb-4">
          <Lock className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Password Reset</h2>
        <p className="text-gray-400 mb-6">Your password has been reset successfully</p>
        <button onClick={onBack} className="text-blue-400 hover:text-blue-300">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
      <p className="text-gray-400 mb-6">Enter your phone number to receive OTP</p>

      {step === 'phone' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="+254712345678"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <button type="button" onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-300">
            Back to Login
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="text-center">
            <div className="bg-green-500/20 p-3 rounded-full inline-block mb-4">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-medium mb-2">OTP Sent to {phoneNumber}</p>
            <p className="text-gray-400 text-sm">Enter the 6-digit code to verify</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white text-center text-xl font-mono focus:outline-none focus:border-blue-500"
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button 
            type="button" 
            onClick={() => setStep('phone')}
            className="w-full text-sm text-gray-400 hover:text-gray-300"
          >
            Change Phone Number
          </button>
        </form>
      )}
    </div>
  );
};

const PaymentModal = ({ user, type, onClose, onSuccess }) => {
  const [step, setStep] = useState('method'); // method, amount, confirm, processing
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  const isDeposit = type === 'deposit';
  const title = isDeposit ? 'Deposit Funds' : 'Withdraw Funds';
  const buttonColor = isDeposit ? 'green' : 'orange';

  const paymentMethods = [
    { id: 'mpesa', name: 'M-Pesa', icon: '📱', info: 'Instant via M-Pesa' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', info: 'Visa, Mastercard' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', info: '1-2 business days' }
  ];

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    setStep('amount');
  };

  const handleAmountConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (isDeposit && parseFloat(amount) > 100000) {
      setError('Maximum deposit is KSH 100,000');
      return;
    }
    if (!isDeposit && parseFloat(amount) > (user?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirmTransaction = async () => {
  setLoading(true);
  setError('');
  setStep('processing');

  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const txId = `${isDeposit ? 'DEP' : 'WD'}-${Date.now()}`;
    setTransactionId(txId);

    // Save transaction to Firebase
    try {
      const { collection, addDoc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const db = await import('./firebase/initFirebase').then(m => m.getDB());
      
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: type,
        amount: parseFloat(amount),
        method: paymentMethod,
        phoneNumber: phoneNumber,
        transactionId: txId,
        status: 'completed',
        timestamp: Timestamp.now(),
        createdAt: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Failed to save transaction to DB:', dbError);
    }

    setTimeout(() => {
      if (onSuccess) {
        onSuccess({
          transactionId: txId,
          amount: parseFloat(amount),
          type
        });
      }
      onClose();
    }, 2000);
  } catch (err) {
    setError(err.message);
    setStep('confirm');
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-blue-500/20 rounded-xl max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-blue-500/20 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Payment Method */}
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Select Payment Method</p>
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full p-4 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-bold text-white">{method.name}</p>
                      <p className="text-xs text-gray-400">{method.info}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (KSH)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Quick amounts</p>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map(quickAmount => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className="p-2 bg-slate-800 hover:bg-blue-600 border border-slate-700 rounded text-sm font-medium text-white"
                    >
                      {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., 0712345678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleAmountConfirm}
                  className={`flex-1 px-4 py-2 bg-${buttonColor}-600 hover:bg-${buttonColor}-700 text-white rounded-lg font-medium`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="text-3xl font-bold text-white">KSH {parseFloat(amount).toLocaleString()}</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Method</span>
                  <span className="text-sm font-medium text-white capitalize">{paymentMethod}</span>
                </div>
                {phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Phone</span>
                    <span className="text-sm font-medium text-white">{phoneNumber}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmTransaction}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 bg-${buttonColor}-600 hover:bg-${buttonColor}-700 disabled:opacity-50 text-white rounded-lg font-medium`}
                >
                  {loading ? 'Processing...' : isDeposit ? 'Deposit' : 'Withdraw'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">💫</div>
              <p className="text-white font-bold mb-2">Processing {isDeposit ? 'Deposit' : 'Withdrawal'}</p>
              <p className="text-sm text-gray-400 mb-4">Please wait...</p>
              {transactionId && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                  <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                  <p className="text-sm font-mono text-green-400">{transactionId}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App(props) {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [activeBets, setActiveBets] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState('match_winner');
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [view, setView] = useState('matches');
  const [filter, setFilter] = useState('all');
  const [liveMinutes, setLiveMinutes] = useState({});
  const [loadingBets, setLoadingBets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [games, setGames] = React.useState([]);
  const [paymentModal, setPaymentModal] = useState({ open: false, type: null });
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [currentBet, setCurrentBet] = useState(null);
  const [accountWarning, setAccountWarning] = useState(null);
  const [walletTab, setWalletTab] = useState('balance');


  // External events state
  const [externalEvents, setExternalEvents] = React.useState([]);
  const [externalLoading, setExternalLoading] = React.useState(false);
  const [externalError, setExternalError] = React.useState(null);

  //Load user and bets on app start
  //Load user and bets on app start
useEffect(() => {
  const loadUserAndBets = async () => {
    setLoadingBets(true);
    const currentUser = await FirebaseAuthService.getCurrentUser();
    if (currentUser) {
      // Check account status
      const statusCheck = await AccountStatusService.checkAccountStatus(currentUser.uid);

      if (!statusCheck.canLogin) {
        alert(`❌ ${statusCheck.message}`);
        await FirebaseAuthService.logout();
        setUser(null);
        setLoadingBets(false);
        return;
      }

      setUser(currentUser);
      
      // Show warning if account is suspended/restricted
      if (statusCheck.warning) {
        setAccountWarning(statusCheck.warning);
      }

      // Load user's bets from database
      const betsResult = await FirebaseAuthService.getUserBets(currentUser.uid);
      if (betsResult.success) {
        console.log('Loaded bets from Firebase:', betsResult.bets);
        setActiveBets(betsResult.bets);
      } else {
        console.error('Failed to load bets:', betsResult.error);
      }
    }
    setLoadingBets(false);
  };
  loadUserAndBets();
}, []);

  // Live API-Football fetching removed (debugging code). If you want live or mock matches,
  // populate `matches` from another service or a static fixture in development.

  const handleLogin = async (userData) => {
  console.log('User logged in:', userData);
  
  // Check account status
  const statusCheck = await AccountStatusService.checkAccountStatus(userData.uid);

  if (!statusCheck.canLogin) {
    alert(`❌ ${statusCheck.message}`);
    await FirebaseAuthService.logout();
    setUser(null);
    return;
  }

  setUser(userData);
  
  // Show warning if account is suspended/restricted
  if (statusCheck.warning) {
    setAccountWarning(statusCheck.warning);
  }
  
  setShowAuthModal(false);
  
  // Load user's bets after login
  const betsResult = await FirebaseAuthService.getUserBets(userData.uid);
  if (betsResult.success) {
    setActiveBets(betsResult.bets);
  } else {
    console.error('Failed to load bets on login:', betsResult.error);
  }
};

  const handleRegister = (userData) => {
    console.log('User registered:', userData);
    setUser(userData);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await FirebaseAuthService.logout();
    setUser(null);
    setActiveBets([]);
  };


  //Deleted segments related to calculating live match minutes for brevity

  const getMarketOptions = (match, marketId) => {
    switch (marketId) {
      case 'match_winner':
        // Peer-to-peer: allow only Home / Away, no draw, no odds (market handled P2P)
        return [
          { id: 'home', label: match.homeTeam, odds: null, pool: match.homeBets || 0 },
          { id: 'away', label: match.awayTeam, odds: null, pool: match.awayBets || 0 }
        ];
      case 'total_goals':
        return [
          { id: 'under_2.5', label: 'Under 2.5', odds: '1.85', pool: 35000 },
          { id: 'over_2.5', label: 'Over 2.5', odds: '2.10', pool: 28000 },
          { id: 'under_3.5', label: 'Under 3.5', odds: '1.45', pool: 42000 },
          { id: 'over_3.5', label: 'Over 3.5', odds: '2.75', pool: 18000 }
        ];
      case 'both_teams_score':
        return [
          { id: 'yes', label: 'Yes', odds: '1.75', pool: 45000 },
          { id: 'no', label: 'No', odds: '2.05', pool: 32000 }
        ];
      case 'penalties':
        return [
          { id: 'even', label: 'Even Penalties', odds: '1.95', pool: 25000 },
          { id: 'odd', label: 'Odd Penalties', odds: '1.95', pool: 25000 }
        ];
      case 'corners':
        return [
          { id: 'under_9.5', label: 'Under 9.5', odds: '1.90', pool: 22000 },
          { id: 'over_9.5', label: 'Over 9.5', odds: '1.90', pool: 22000 },
          { id: 'under_11.5', label: 'Under 11.5', odds: '1.60', pool: 30000 },
          { id: 'over_11.5', label: 'Over 11.5', odds: '2.30', pool: 18000 }
        ];
      case 'cards':
        return [
          { id: 'under_3.5', label: 'Under 3.5 Cards', odds: '1.70', pool: 28000 },
          { id: 'over_3.5', label: 'Over 3.5 Cards', odds: '2.15', pool: 20000 },
          { id: 'under_5.5', label: 'Under 5.5 Cards', odds: '1.50', pool: 35000 },
          { id: 'over_5.5', label: 'Over 5.5 Cards', odds: '2.60', pool: 15000 }
        ];
      default:
        return [];
    }
  };

  //create match notification componet
  

  const calculateOdds = (match, outcome) => {
    const totalOtherBets = match.totalPool - match[`${outcome}Bets`];
    if (totalOtherBets === 0) return 1.0;
    return (match.totalPool / match[`${outcome}Bets`]).toFixed(2);
  };

const placeBet = async () => {
  if (!user) {
    setShowAuthModal(true);
    return;
  }

  const amount = parseFloat(betAmount);
  if (!amount || amount <= 0 || amount > user.balance) {
    alert('Invalid bet amount or insufficient balance');
    return;
  }

  const marketName = MARKETS.find(m => m.id === selectedMarket)?.name;
  
  // Import Firestore Timestamp
  const { Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  
  const newBet = {
    userId: user.uid,
    matchId: selectedMatch.id,
    match: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
    homeTeam: selectedMatch.homeTeam,
    awayTeam: selectedMatch.awayTeam,
    league: selectedMatch.league,
    market: marketName,
    marketId: selectedMarket,
    outcome: selectedOutcome.label,
    outcomeId: selectedOutcome.id,
    amount: amount,
    // Peer-to-peer: no odds. potentialWin = stake (or business logic to compute P2P payout)
    odds: null,
    potentialWin: amount,
    timestamp: Timestamp.now(), // Use Firestore timestamp
    status: selectedMatch.status === 'live' ? 'live' : 'pending',
    isLive: selectedMatch.status === 'live',
    result: 'pending'
  };

  // Save bet to Firestore
  const betResult = await FirebaseAuthService.saveBet(newBet);
  
  if (!betResult.success) {
    alert('Failed to save bet. Please try again.');
    return;
  }

  // Update local state with proper timestamp
  const betWithId = {
    ...newBet,
    id: betResult.betId,
    timestamp: new Date().toISOString() // Convert to ISO string for display
  };
  
  setActiveBets([betWithId, ...activeBets]);
  
  // Update user balance
  const newBalance = user.balance - amount;
  await FirebaseAuthService.updateUserBalance(user.uid, newBalance, user.bonus, user.withdrawableBonus);
  setUser({ ...user, balance: newBalance });
  
  setBetAmount('');
  setSelectedMatch(null);
  setSelectedOutcome(null);
  alert(`Bet placed successfully!${newBet.isLive ? ' (Live Bet)' : ''}`);
};
// Add this function to your App component
const refreshUserBets = async () => {
  if (user) {
    setLoadingBets(true);
    const betsResult = await FirebaseAuthService.getUserBets(user.uid);
    if (betsResult.success) {
      setActiveBets(betsResult.bets);
    } else {
      console.error('Failed to refresh bets:', betsResult.error);
    }
    setLoadingBets(false);
  }
};

//Handling settle bet function
// Add this after refreshUserBets function
const handleSettleBet = async (betId, result) => {
  if (!user) {
    alert('Not logged in');
    return;
  }

  setSettlementLoading(true);

  const settleResult = await BetSettlementService.settleBet(betId, result, user.uid);

  if (settleResult.success) {
    // Track in admin financial records
    const bet = activeBets.find(b => b.id === betId);
    
    if (result === 'lost') {
      // Lost bets go to profits
      await BetSettlementService.addToProfit(betId, bet.amount, user.uid);
    } else if (result === 'won' || result === 'refund') {
      // Release from escrow
      await BetSettlementService.releaseEscrow(bet.amount);
    }

    // Update local state
    const updatedBets = activeBets.map(b =>
      b.id === betId 
        ? { ...b, status: 'settled', result, settledAt: new Date().toISOString() } 
        : b
    );
    setActiveBets(updatedBets);

    setUser({ ...user, balance: settleResult.newBalance });
    alert(`✅ ${settleResult.message}`);
    setShowSettlementModal(false);
    setCurrentBet(null);
  } else {
    alert('❌ Failed to settle bet: ' + settleResult.error);
  }

  setSettlementLoading(false);
};

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 0) return 'Started';
    if (hours < 24) return `${hours}h ${minutes}m`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    const n = Number(amount);
    const safe = Number.isFinite(n) ? n : 0;
    return `KSH ${safe.toLocaleString()}`;
  };

  // Find this line (usually around line 750-760) and update it:
const filteredMatches = matches.filter(match => {
  // First filter by status (all/live/upcoming)
  const statusMatch = filter === 'all' || match.status === filter;
  
  // Then filter by search query
  if (!searchQuery.trim()) {
    return statusMatch;
  }
  
  const query = searchQuery.toLowerCase();
  const matchesSearch = 
    match.homeTeam.toLowerCase().includes(query) ||
    match.awayTeam.toLowerCase().includes(query) ||
    match.league.toLowerCase().includes(query) ||
    (match.country && match.country.toLowerCase().includes(query));
  
  return statusMatch && matchesSearch;
});

// Auth Modal Component with dismiss button
const AuthModal = () => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="absolute top-4 right-4">
      <button
        onClick={() => setShowAuthModal(false)}
        aria-label="Close auth modal"
        className="w-10 h-10 rounded-full bg-slate-700/60 hover:bg-slate-700/80 flex items-center justify-center text-white"
      >
        ✕
      </button>
    </div>

    <div className="w-full max-w-md">
      {authView === 'login' && (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthView('register')}
          onForgotPassword={() => setAuthView('forgot')}
          onSwitchToOTPLogin={() => setAuthView('otp-login')}
        />
      )}
      {authView === 'otp-login' && (
        <OTPLoginForm
          onLogin={handleLogin}
          onBack={() => setAuthView('login')}
        />
      )}
      {authView === 'register' && (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthView('login')}
        />
      )}
      {authView === 'forgot' && (
        <ForgotPasswordForm onBack={() => setAuthView('login')} />
      )}
    </div>
  </div>
);

  React.useEffect(() => {
    if (!user) return; // don't fetch games if no user
    try {
      const db = getDB(); // use safe initializer from firebase/initFirebase
      const q = query(collection(db, 'games'), orderBy('kickoff', 'asc'));
      const unsubGames = onSnapshot(q, (snap) => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGames(arr);
      }, (err) => {
        console.error('games snapshot failed', err);
      });
      return () => unsubGames();
    } catch (err) {
      console.error('useEffect error:', err);
    }
  }, [user]); // add user dependency

  // fetch external events from api-football
  async function fetchExternalEvents(params = {}) {
    // api-football v3 fixtures endpoint
    const API_URL = 'https://v3.football.api-sports.io/fixtures';
    const API_KEY = '9146330a16b5741a6c5d4e7df1af5477'; // test key you provided  remove 1 later or replace with working api key

    setExternalLoading(true);
    setExternalError(null);

    try {
      const url = new URL(API_URL);

      // optional params: date (YYYY-MM-DD), league, season
      if (params.date) url.searchParams.set('date', params.date);
      if (params.league) url.searchParams.set('league', params.league);
      if (params.season) url.searchParams.set('season', params.season);

      // default: today's fixtures when no date/league provided
      if (!params.date && !params.league) {
        const today = new Date().toISOString().slice(0, 10);
        url.searchParams.set('date', today);
      }

      console.debug('[fetchExternalEvents] Request URL:', url.toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-apisports-key': API_KEY,
          'Accept': 'application/json'
        }
      });

      console.debug('[fetchExternalEvents] status', res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upstream error ${res.status}: ${text}`);
      }

      const payload = await res.json();
      const fixtures = Array.isArray(payload.response) ? payload.response : [];

      // normalize fixtures into simple events for your UI
      const events = fixtures.map(f => ({
        id: f.fixture?.id || `${f.fixture?.timestamp}-${Math.random()}`,
        homeTeam: f.teams?.home?.name,
        awayTeam: f.teams?.away?.name,
        league: f.league?.name,
        kickoff: f.fixture?.date,
        status: (f.fixture?.status?.long || '').toLowerCase().includes('live') ? 'live' : 'upcoming',
        score: f.goals || { home: 0, away: 0 },
        raw: f
      }));

      // Use external events as the app's matches so homepage/search shows them
      setExternalEvents(events);
      setMatches(events);
    } catch (err) {
      console.error('[fetchExternalEvents] error', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setExternalError('Network/CORS error: browser blocked the request. Use a server-side proxy (Cloud Function) or enable CORS on the API.');
      } else {
        setExternalError(err.message || 'Fetch failed');
      }
      setExternalEvents([]);
    } finally {
      setExternalLoading(false);
    }
  }

  // fetch once on mount (customize params as needed)
  React.useEffect(() => {
    fetchExternalEvents({ date: null, league: null });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-blue-500/20 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="sm:hidden p-2 rounded-md bg-slate-700/30 hover:bg-slate-700/40 mr-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg flex items-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>

          <div className="ml-2">
            <h1 className="text-2xl font-bold text-white">SparkBets</h1>
            <p className="text-xs text-blue-300 hidden sm:block">Live & Pre-Match Betting</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* full controls for desktop */}
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <>
                <div className="bg-slate-700/50 px-4 py-2 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">Balance</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(user.balance)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-blue-500/30">
                  <p className="text-sm text-white font-medium">{user.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 p-2 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthView('register');
                    setShowAuthModal(true);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-blue-500/30"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* mobile: compact balance / login at top-right */}
          <div className="flex items-center gap-3 sm:hidden">
            {user ? (
              <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-bold text-white">{formatCurrency(user.balance)}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg font-medium"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
</header>

        {showMobileMenu && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-slate-800/90 border-r border-blue-500/20 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Menu</h3>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-md bg-slate-700/30">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-2">
                <button onClick={() => { setView('myBets'); setShowMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/30 text-white">My Bets</button>
                <button onClick={() => { setView('wallet'); setShowMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/30 text-white">Wallet</button>
                <button onClick={() => { if (user) { setView('wallet'); } else { setAuthView('login'); setShowAuthModal(true); } setShowMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/30 text-white">Profile Settings</button>
                {user && (
                  <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/30 text-red-400">Logout</button>
                )}
              </div>
            </div>
          </div>
        )}

      <nav className="bg-slate-800/30 backdrop-blur-sm border-b border-blue-500/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 flex-wrap">
            {( () => {
              const baseTabs = [
                { id: 'matches', label: 'Matches', icon: Flame },
                { id: 'myBets', label: 'My Bets', icon: TrendingUp },
                { id: 'wallet', label: 'Wallet', icon: Wallet },
                { id: 'colorstake', label: 'ColorStake', icon: Award },
                { id: 'fly', label: 'Fly Game', icon: Zap }
              ];

              if (user && user.isAdmin) {
                baseTabs.push({ id: 'admin', label: 'Admin', icon: Users });
              }

              return baseTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-6 py-3 font-medium transition-all ${
                    view === tab.id
                      ? 'text-white border-b-2 border-blue-500 bg-slate-700/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/20'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ));
            })() }
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'matches' && (
  <div className="space-y-4">
    <div className="flex flex-col gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by team name, league, or country..."
          className="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters and Status Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'live', label: '🔴 Live' },
            { id: 'upcoming', label: 'Upcoming' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400">Matches</div>
        </div>
      </div>

      {/* Search Results Count */}
      {searchQuery && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
          <p className="text-sm text-blue-300">
            Found {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} for "{searchQuery}"
          </p>
        </div>
      )}
    </div>

    {filteredMatches.length === 0 ? (
      <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
        <p className="text-gray-400">No matches found</p>
        <p className="text-gray-500 text-sm mt-2">Try refreshing or check back later</p>
      </div>
    ) : (
      filteredMatches.map(match => (
        <div key={match.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 overflow-hidden hover:border-blue-500/40 transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 px-3 py-1 rounded-full">
                  <p className="text-xs font-medium text-blue-300">{match.league}</p>
                </div>
                {match.status === 'live' ? (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-xs font-bold text-red-400">
                      LIVE {liveMinutes[match.id] || match.minute}'
                      {match.statusDescription && ` - ${match.statusDescription}`}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Clock className="w-3 h-3" />
                    <p className="text-xs">{formatTime(match.kickoff)}</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total Pool</p>
                <p className="text-sm font-bold text-green-400">{formatCurrency(match.totalPool)}</p>
                {match.venue && <p className="text-xs text-gray-500 mt-1">{match.venue}</p>}
              </div>
            </div>

            {match.status === 'live' && (
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4 text-center">
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{match.homeTeam}</p>
                    <p className="text-4xl font-bold text-white">{match.score.home}</p>
                  </div>
                  <div className="text-2xl text-gray-500">-</div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{match.awayTeam}</p>
                    <p className="text-4xl font-bold text-white">{match.score.away}</p>
                  </div>
                </div>
              </div>
            )}

            {match.status === 'upcoming' && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-bold text-white">{match.homeTeam}</p>
                <p className="text-gray-500">vs</p>
                <p className="text-lg font-bold text-white">{match.awayTeam}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {getMarketOptions(match, 'match_winner').map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (!option.disabled) {
                      setSelectedMatch(match);
                      setSelectedOutcome(option);
                      setSelectedMarket('match_winner');
                    }
                  }}
                  disabled={option.disabled}
                  className={`${
                    option.disabled
                      ? 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 border border-gray-500/30 opacity-60 cursor-not-allowed'
                      : option.id === 'home'
                      ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30 border border-blue-500/30 hover:scale-105'
                      : 'bg-gradient-to-br from-purple-600/20 to-purple-700/20 hover:from-purple-600/30 hover:to-purple-700/30 border border-purple-500/30 hover:scale-105'
                  } rounded-lg p-3 transition-all relative`}
                >
                  <div className="text-xs font-medium mb-1 text-white">{option.label}</div>
                  <div className="text-sm font-bold text-green-400">{option.odds ? `${option.odds}x` : 'P2P'}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedMatch(match);
                setShowAllMarkets(true);
                setSelectedMarket('match_winner');
              }}
              className="w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-lg p-3 transition-all flex items-center justify-center gap-2 group"
            >
              <Target className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">More Markets</span>
            </button>
          </div>
        </div>
      ))
    )}
  </div>
)}

{view === 'myBets' && (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">My Active Bets</h2>
      <button
        onClick={refreshUserBets}
        disabled={loadingBets}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${loadingBets ? 'animate-spin' : ''}`} />
        {loadingBets ? 'Loading...' : 'Refresh'}
      </button>
    </div>

    {/* Debug info */}
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
      <p className="text-xs text-blue-300">
        Debug Info: {activeBets.length} bets loaded | User ID: {user?.uid?.substring(0, 8)}...
      </p>
    </div>

    {loadingBets ? (
      <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your bets...</p>
      </div>
    ) : activeBets.length === 0 ? (
      <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">No active bets yet</p>
        <p className="text-gray-500 text-sm mb-4">Place your first bet to see it here</p>
        <button
          onClick={() => setView('matches')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Place Your First Bet
        </button>
      </div>
    ) : (
      <div className="space-y-3">
        {activeBets.map((bet, index) => {
          const isSettled = bet.status === 'settled';
          const isWon = bet.result === 'won';
          const isLost = bet.result === 'lost';
          const isRefunded = bet.result === 'refund';

          return (
            <div 
              key={bet.id || index} 
              className={`bg-slate-800/50 rounded-lg border p-4 hover:border-blue-500/40 transition-colors ${
                isSettled 
                  ? isWon 
                    ? 'border-green-500/30 bg-green-500/5'
                    : isLost
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-blue-500/30 bg-blue-500/5'
                  : 'border-yellow-500/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    {isSettled && (
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        isWon 
                          ? 'bg-green-500/20 text-green-400' 
                          : isLost 
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {isWon ? '✓ WON' : isLost ? '✗ LOST' : '↻ REFUNDED'}
                      </div>
                    )}
                    {!isSettled && (
                      <div className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400">
                        ⏳ PENDING
                      </div>
                    )}
                  </div>

                  {/* Bet Details */}
                  <p className="font-medium text-white mb-1">{bet.match}</p>
                  <p className="text-sm text-gray-400 mb-2">
                    {bet.market}: <span className="text-blue-400 font-medium">{bet.outcome}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {bet.league} • {new Date(bet.timestamp).toLocaleDateString()}
                  </p>
                </div>

                {/* Right Side - Amount Info */}
                <div className="text-right min-w-fit ml-4">
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Stake</p>
                    <p className="font-bold text-white">{formatCurrency(bet.amount)}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Potential</p>
                    <p className="font-bold text-green-400">{formatCurrency(bet.potentialWin)}</p>
                  </div>

                  {isSettled && isWon && (
                    <div className="bg-green-500/20 rounded p-2 text-xs text-center">
                      <p className="text-green-400 font-bold">+{formatCurrency(bet.potentialWin)}</p>
                    </div>
                  )}

                  {isSettled && isLost && (
                    <div className="bg-red-500/20 rounded p-2 text-xs text-center">
                      <p className="text-red-400 font-bold">-{formatCurrency(bet.amount)}</p>
                    </div>
                  )}

                  {isSettled && isRefunded && (
                    <div className="bg-blue-500/20 rounded p-2 text-xs text-center">
                      <p className="text-blue-400 font-bold">+{formatCurrency(bet.amount)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Actions for Pending Bets (Admin Only) */}
              {!isSettled && user?.isAdmin && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setCurrentBet(bet);
                      setShowSettlementModal(true);
                    }}
                    className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ⚙️ Settle Bet
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
       {view === 'wallet' && user && (
  <div>
    {/* Wallet Tabs */}
    <div className="flex gap-2 mb-6 border-b border-slate-700/50">
      <button
        onClick={() => setWalletTab('balance')}
        className={`px-4 py-3 font-medium transition-colors ${
          walletTab === 'balance'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Balance & Bonus
      </button>
      <button
        onClick={() => setWalletTab('transactions')}
        className={`px-4 py-3 font-medium transition-colors ${
          walletTab === 'transactions'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Transactions
      </button>
    </div>

    {/* Balance & Bonus Tab */}
    {walletTab === 'balance' && (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">💰 Wallet</h2>
        
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-6">
          <p className="text-blue-100 mb-2">Available Balance</p>
          <p className="text-4xl font-bold text-white mb-4">{formatCurrency(user?.balance || 0)}</p>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPaymentModal({ open: true, type: 'deposit' });
              }}
              className="flex-1 bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-all"
            >
              💳 Deposit
            </button>
            <button
              onClick={() => {
                setPaymentModal({ open: true, type: 'withdrawal' });
              }}
              className="flex-1 bg-blue-500/20 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500/30 border border-white/20 transition-all"
            >
              💸 Withdraw
            </button>
          </div>
        </div>

        {/* Bonus Info */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Bonus & Rewards</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span className="text-gray-400">Active Bonus</span>
              <span className="font-bold text-green-400">{formatCurrency(user?.bonus || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span className="text-gray-400">Withdrawable Bonus</span>
              <span className="font-bold text-blue-400">{formatCurrency(user?.withdrawableBonus || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Transactions Tab */}
    {walletTab === 'transactions' && (
      <TransactionsPage user={user} />
    )}
  </div>
)}

        {view === 'admin' && (
          <div className="py-6">
            <AdminDashboard user={user} />
          </div>
        )}
        {view === 'colorstake' && (
  <div className="py-6">
    <ColorStake 
      user={user}
      onBalanceUpdate={async (newBalance) => {
        // Update local state
        setUser({ ...user, balance: newBalance });
        // Update Firebase
        await FirebaseAuthService.updateUserBalance(
          user.uid, 
          newBalance, 
          user.bonus, 
          user.withdrawableBonus
        );
      }}
      onBack={() => setView('matches')}
      onPlaceBet={async (betObj, newBalance) => {
        // Persist ColorStake bet to Firestore so admin functions and accounting pick it up
        if (!user) {
          setShowAuthModal(true);
          return;
        }

        const newBet = {
          userId: user.uid,
          match: betObj.match || 'ColorStake',
          market: betObj.market || 'colorstake',
          marketId: 'colorstake',
          outcome: betObj.outcome,
          outcomeId: betObj.selection,
          amount: Number(betObj.stake || 0),
          potentialWin: Number(betObj.potentialWin || 0),
          timestamp: new Date().toISOString(),
          status: betObj.status || 'pending',
          isLive: false,
          result: 'pending'
        };

        const betResult = await FirebaseAuthService.saveBet(newBet);
        if (betResult.success) {
          const betWithId = { ...newBet, id: betResult.betId };
          setActiveBets(prev => [betWithId, ...prev]);
          // update user balance in Firestore using the balance passed from ColorStake
          await FirebaseAuthService.updateUserBalance(user.uid, newBalance, user.bonus, user.withdrawableBonus);
          // return saved bet id to the caller
          return { success: true, bet: betWithId };
        } else {
          console.error('Failed to save ColorStake bet', betResult.error);
          alert('Failed to save bet. Please try again.');
          return { success: false, error: betResult.error };
        }
      }}
      onSettleBet={async (betId, status) => {
        // allow user to settle their own ColorStake bet via callable
        if (!user) return { success: false, error: 'Not logged in' };
        const res = await AdminService.userSettleBet(betId, status);
        if (res.success) {
          // If payout, update balance for user locally
          if (status === 'won') {
            // fetch bet to know payout amount
            const bet = activeBets.find(b => b.id === betId);
            const payout = bet?.potentialWin || 0;
            const newBal = (user.balance || 0) + Number(payout);
            await FirebaseAuthService.updateUserBalance(user.uid, newBal, user.bonus, user.withdrawableBonus);
            setUser({ ...user, balance: newBal });
          }
          // refresh bets
          refreshUserBets();
        }
        return res;
      }}
    />
  </div>
)}
        {view === 'fly' && (
  <div className="py-6">
    <Fly
      user={user}
      onBalanceUpdate={async (newBalance) => {
        // Update local state
        setUser({ ...user, balance: newBalance });
        // Update Firebase
        await FirebaseAuthService.updateUserBalance(
          user.uid,
          newBalance,
          user.bonus,
          user.withdrawableBonus
        );
      }}
      onBack={() => setView('matches')}
      onPlaceBet={async (betObj, newBalance) => {
        if (!user) {
          setShowAuthModal(true);
          return;
        }

        const newBet = {
          userId: user.uid,
          match: betObj.match || 'Fly Game',
          market: betObj.market || 'fly',
          marketId: 'fly',
          outcome: betObj.outcome,
          outcomeId: betObj.selection,
          amount: Number(betObj.stake || 0),
          potentialWin: Number(betObj.potentialWin || 0),
          timestamp: new Date().toISOString(),
          status: betObj.status || 'pending',
          isLive: false,
          result: 'pending'
        };

        const betResult = await FirebaseAuthService.saveBet(newBet);
        if (betResult.success) {
          const betWithId = { ...newBet, id: betResult.betId };
          setActiveBets(prev => [betWithId, ...prev]);
          await FirebaseAuthService.updateUserBalance(user.uid, newBalance, user.bonus, user.withdrawableBonus);
          return { success: true, bet: betWithId };
        } else {
          console.error('Failed to save Fly bet', betResult.error);
          alert('Failed to save bet. Please try again.');
          return { success: false, error: betResult.error };
        }
      }}
      onSettleBet={async (betId, status) => {
        if (!user) return { success: false, error: 'Not logged in' };
        const res = await AdminService.userSettleBet(betId, status);
        if (res.success) {
          if (status === 'won') {
            const bet = activeBets.find(b => b.id === betId);
            const payout = bet?.potentialWin || 0;
            const newBal = (user.balance || 0) + Number(payout);
            await FirebaseAuthService.updateUserBalance(user.uid, newBal, user.bonus, user.withdrawableBonus);
            setUser({ ...user, balance: newBal });
          }
        }
      }}
    />
  </div>
)}
      </main>

      {showAllMarkets && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-blue-500/30 max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">All Markets</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                </p>
              </div>
              {selectedMatch.status === 'live' && (
                <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-red-400 font-bold">LIVE</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {MARKETS.map(market => {
                const MarketIcon = market.icon;
                return (
                  <div key={market.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <MarketIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <h4 className="text-lg font-bold text-white">{market.name}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {getMarketOptions(selectedMatch, market.id).map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            if (!option.disabled) {
                              setSelectedOutcome(option);
                              setSelectedMarket(market.id);
                              setShowAllMarkets(false);
                            }
                          }}
                          disabled={option.disabled}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            option.disabled
                              ? 'bg-gray-700/20 border-gray-600/30 opacity-50 cursor-not-allowed'
                              : selectedOutcome?.id === option.id
                              ? 'bg-blue-600/30 border-blue-500'
                              : 'bg-slate-700/30 border-slate-600/30 hover:border-blue-500/50'
                          }`}
                        >
                          <p className={`text-xs font-medium mb-1 ${option.disabled ? 'text-gray-500' : 'text-white'}`}>
                            {option.label}
                          </p>
                          <p className={`text-sm font-bold ${option.disabled ? 'text-gray-500' : 'text-green-400'}`}>
                            {option.odds}x
                          </p>
                          {!option.disabled && option.pool && (
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(option.pool)}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedMatch && selectedOutcome && !showAllMarkets && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-blue-500/30 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Place Your Bet</h3>
              {selectedMatch.status === 'live' && (
                <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-red-400 font-bold">LIVE</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">{selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</p>
              <p className="text-sm text-gray-400 mb-2">
                Market: <span className="text-white font-medium">{MARKETS.find(m => m.id === selectedMarket)?.name}</span>
              </p>
              <p className="text-lg font-bold text-white mb-1">
                Betting on: <span className="text-blue-400">{selectedOutcome.label}</span>
              </p>
              <p className="text-sm text-green-400">Current Odds: {selectedOutcome.odds}x</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Available Options:</p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {getMarketOptions(selectedMatch, selectedMarket).map(option => (
                  <button
                    key={option.id}
                    onClick={() => !option.disabled && setSelectedOutcome(option)}
                    disabled={option.disabled}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      option.disabled
                        ? 'bg-gray-700/20 border-gray-600/30 opacity-50 cursor-not-allowed'
                        : selectedOutcome?.id === option.id
                        ? 'bg-blue-600/30 border-blue-500'
                        : 'bg-slate-700/30 border-slate-600/30 hover:border-blue-500/50'
                    }`}
                  >
                    <p className={`text-xs font-medium mb-1 ${option.disabled ? 'text-gray-500' : 'text-white'}`}>
                      {option.label}
                    </p>
                    <p className={`text-sm font-bold ${option.disabled ? 'text-gray-500' : 'text-green-400'}`}>
                      {option.odds}x
                    </p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Bet Amount (KSH)</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
              {betAmount && (
                <p className="text-sm text-gray-400 mt-2">
                  Potential win: <span className="text-green-400 font-medium">
                    {formatCurrency( Number(betAmount) /* peer-to-peer: winner gets stake back or agreed stake */ )}
                  </span>
                </p>
              )}
            </div>

            {selectedMarket === 'match_winner' && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-300">⚠️ If the match ends in a draw, your full stake will be refunded</p>
              </div>
            )}

            {selectedMatch.status === 'live' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-300">🔴 Live betting: Odds may change rapidly during play</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setSelectedOutcome(null);
                  setBetAmount('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={placeBet}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Confirm Bet
              </button>
            </div>
          </div>
        </div>
      )}
      {showAuthModal && <AuthModal />}

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-blue-500/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* About Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">SparkBets</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Your trusted platform for live and pre-match betting. Experience the thrill of sports betting with competitive odds and instant payouts.
              </p>
              <div className="flex gap-3">
                <a href="#" className="bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.261 2.913-.558.788-.306 1.459-.717 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.261-2.148-.558-2.913-.306-.789-.717-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0s-3.667.015-4.947.072C5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12zM12 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07c-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => setView('matches')} className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Live Matches</button></li>
                <li><button onClick={() => setView('myBets')} className="text-sm text-gray-400 hover:text-blue-400 transition-colors">My Bets</button></li>
                <li><button onClick={() => setView('wallet')} className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Wallet</button></li>
                <li><button onClick={() => setView('colorstake')} className="text-sm text-gray-400 hover:text-blue-400 transition-colors">ColorStake Game</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    support@sparkbets.ke
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    +254 712 345 678
                  </a>
                </li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="text-white font-bold mb-4">Payment Methods</h4>
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-gray-400 mb-2">We Accept:</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-green-600/20 border border-green-500/30 px-3 py-1 rounded">
                      <p className="text-xs font-bold text-green-400">M-Pesa</p>
                    </div>
                    <div className="bg-blue-600/20 border border-blue-500/30 px-3 py-1 rounded">
                      <p className="text-xs font-bold text-blue-400">Airtel</p>
                    </div>
                    <div className="bg-orange-600/20 border border-orange-500/30 px-3 py-1 rounded">
                      <p className="text-xs font-bold text-orange-400">Visa</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">
                    <Award className="w-4 h-4 inline mr-1" />
                    Licensed & Regulated
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Responsible Gambling */}
          <div className="border-t border-slate-700/50 pt-6 mb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-500/20 p-2 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="text-white font-bold mb-2">Responsible Gambling</h5>
                  <p className="text-xs text-gray-400 mb-2">
                    Gambling can be addictive. Please bet responsibly. Only bet what you can afford to lose. If you or someone you know has a gambling problem, please seek help.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a href="#" className="text-xs text-red-400 hover:text-red-300 underline">GamCare</a>
                    <span className="text-gray-600">•</span>
                    <a href="#" className="text-xs text-red-400 hover:text-red-300 underline">BeGambleAware</a>
                    <span className="text-gray-600">•</span>
                    <a href="#" className="text-xs text-red-400 hover:text-red-300 underline">18+ Only</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-700/50 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © 2025 SparkBets. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Version 1.0.0</span>
                <span>•</span>
                <span>Made in Kenya 🇰🇪</span>
                <span>•</span>
                <a href="#" className="hover:text-gray-400 transition-colors">Status</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {paymentModal.open && (
  <PaymentModal
    user={user}
    type={paymentModal.type}
    onClose={() => setPaymentModal({ open: false, type: null })}
    onSuccess={async (data) => {
      // Calculate new balance
      const newBalance = data.type === 'deposit' 
        ? user.balance + data.amount 
        : user.balance - data.amount;
      
      // Update Firebase first
      const updateResult = await FirebaseAuthService.updateUserBalance(
        user.uid,
        newBalance,
        user.bonus,
        user.withdrawableBonus
      );
      
      if (updateResult.success) {
        // Update local state after Firebase confirms
        setUser({ ...user, balance: newBalance });
        alert(`✅ ${data.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of KSH ${data.amount} successful!\nID: ${data.transactionId}`);
      } else {
        alert('❌ Failed to save transaction. Please try again.');
      }
    }}
  />
)}
      {accountWarning && (
  <AccountWarningModal 
    warning={accountWarning}
    onClose={() => {
      setAccountWarning(null);
      localStorage.removeItem('accountWarning');
    }}
  />
)}
      {showSettlementModal && currentBet && (
        <BetSettlementModal
          bet={currentBet}
          user={user}
          onSettle={handleSettleBet}
          onClose={() => {
            setShowSettlementModal(false);
            setCurrentBet(null);
          }}
          loading={settlementLoading}
        />
      )}
    </div>
  );
};

export default App;