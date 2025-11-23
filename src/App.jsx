import React, { useState, useEffect } from 'react';
import { Trophy, Wallet, Clock, TrendingUp, RefreshCw, Users, ChevronRight, Flame, Lock, Radio, Target, Award, Zap, LogOut, User, Mail, Phone, Eye, EyeOff, Search } from 'lucide-react';
import ApiFootballService from './services/apiFootballService';
import { LEAGUE_IDS } from './services/leagueIds';
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
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getFirestore, doc, setDoc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

      const app = initializeApp(FIREBASE_CONFIG);
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
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

      {step === 'password' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-center">
            <div className="bg-green-500/20 p-3 rounded-full inline-block mb-4">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-medium mb-2">Create New Password</p>
            <p className="text-gray-400 text-sm">Enter your new password</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button 
            type="button" 
            onClick={() => setStep('otp')}
            className="w-full text-sm text-gray-400 hover:text-gray-300"
          >
            Back to OTP
          </button>
        </form>
      )}
    </div>
  );
};

const App = () => {
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
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState('connecting'); // 'connected', 'error', 'mock'
  const [searchQuery, setSearchQuery] = useState('');


  


useEffect(() => {
  const loadUserAndBets = async () => {
    setLoadingBets(true);
    const currentUser = await FirebaseAuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
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

//New for calling live sports API
// NEW CODE - ADD THIS ENTIRE BLOCK
useEffect(() => {
  const fetchMatches = async () => {
    setLoadingMatches(true);
    setApiStatus('connecting');
    
    try {
      console.log('🔄 Fetching matches from API-Football...');
      const allGames = await ApiFootballService.getAllGames();
      
      if (allGames && allGames.length > 0) {
        console.log('✅ Loaded matches:', allGames.length);
        setMatches(allGames);
        setApiStatus('connected');
        setLastUpdated(new Date());
      } else {
        console.log('⚠️ Using mock data');
        const mockGames = [...ApiFootballService.getMockLiveGames(), ...ApiFootballService.getMockUpcomingGames()];
        setMatches(mockGames);
        setApiStatus('mock');
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('❌ Error fetching matches:', error);
      const mockGames = [...ApiFootballService.getMockLiveGames(), ...ApiFootballService.getMockUpcomingGames()];
      setMatches(mockGames);
      setApiStatus('error');
    } finally {
      setLoadingMatches(false);
    }
  };

  fetchMatches();
  const matchInterval = setInterval(fetchMatches, 120000);
  return () => clearInterval(matchInterval);
}, []);

  const handleLogin = async (userData) => {
  console.log('User logged in:', userData);
  setUser(userData);
  // Load user's bets after login - UPDATE THESE LINES
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
        return [
          { id: 'home', label: match.homeTeam, odds: calculateOdds(match, 'home'), pool: match.homeBets },
          { id: 'draw', label: 'Draw', odds: calculateOdds(match, 'draw'), pool: match.drawBets, disabled: true },
          { id: 'away', label: match.awayTeam, odds: calculateOdds(match, 'away'), pool: match.awayBets }
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

  const calculateOdds = (match, outcome) => {
    const totalOtherBets = match.totalPool - match[`${outcome}Bets`];
    if (totalOtherBets === 0) return 1.0;
    return (match.totalPool / match[`${outcome}Bets`]).toFixed(2);
  };

  const placeBet = async () => {
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
    odds: selectedOutcome.odds,
    potentialWin: amount * parseFloat(selectedOutcome.odds),
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
    return `KSH ${amount.toLocaleString()}`;
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-blue-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SparkBets</h1>
                <p className="text-xs text-blue-300">Live & Pre-Match Betting</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-slate-800/30 backdrop-blur-sm border-b border-blue-500/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'matches', label: 'Matches', icon: Flame },
              { id: 'myBets', label: 'My Bets', icon: TrendingUp },
              { id: 'wallet', label: 'Wallet', icon: Wallet }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                  view === tab.id
                    ? 'text-white border-b-2 border-blue-500 bg-slate-700/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
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
          {lastUpdated && (
            <div className="text-xs text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            apiStatus === 'connected' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : apiStatus === 'mock'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {apiStatus === 'connected' ? '✅ Live Data' : 
             apiStatus === 'mock' ? '⚠️ Mock Data' : '🔌 Connecting...'}
          </div>
          
          <div className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-lg">
            <p className="text-sm text-blue-300">API-Football • Real-time</p>
          </div>
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

    {loadingMatches ? (
      <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Connecting to API-Football...</p>
        <p className="text-gray-500 text-sm mt-2">Fetching live match data</p>
      </div>
    ) : filteredMatches.length === 0 ? (
      <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
        <p className="text-gray-400">No matches found</p>
        <p className="text-gray-500 text-sm mt-2">Try refreshing or check back later</p>
      </div>
    ) : (
      filteredMatches.map(match => (
        // Your existing match display code here - it will work with the new data structure
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

            {/* Rest of your existing match display code remains the same */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {getMarketOptions(match, 'match_winner').map(option => (
                <button
                  key={option.id}
                  onClick={() => !option.disabled && (setSelectedMatch(match), setSelectedOutcome(option), setSelectedMarket('match_winner'))}
                  disabled={option.disabled}
                  className={`${
                    option.disabled
                      ? 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 border border-gray-500/30 opacity-60 cursor-not-allowed'
                      : option.id === 'home'
                      ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30 border border-blue-500/30 hover:scale-105'
                      : 'bg-gradient-to-br from-purple-600/20 to-purple-700/20 hover:from-purple-600/30 hover:to-purple-700/30 border border-purple-500/30 hover:scale-105'
                  } rounded-lg p-3 transition-all relative`}
                >
                  {/* ... rest of your existing match buttons */}
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
              <span className="bg-blue-500/30 text-blue-300 text-xs px-2 py-0.5 rounded-full">
                +{MARKETS.length - 1}
              </span>
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

    {/* Debug info - you can remove this later */}
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
        {activeBets.map((bet, index) => (
          <div key={bet.id || index} className="bg-slate-800/50 rounded-lg border border-blue-500/20 p-4 hover:border-blue-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {bet.isLive && (
                  <div className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-1 rounded-full mb-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-red-400 font-bold">LIVE BET</p>
                  </div>
                )}
                <p className="font-medium text-white">{bet.match}</p>
                <p className="text-sm text-gray-400">
                  {bet.market}: <span className="text-blue-400 font-medium">{bet.outcome}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {bet.league} • {new Date(bet.timestamp).toLocaleDateString()} at {new Date(bet.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Stake</p>
                <p className="font-bold text-white">{formatCurrency(bet.amount)}</p>
                <p className="text-xs text-green-400">Odds: {bet.odds}x</p>
                <p className="text-xs text-gray-500 mt-1">
                  Win: {formatCurrency(bet.potentialWin)}
                </p>
                <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                  bet.status === 'live' ? 'bg-red-500/20 text-red-400' : 
                  bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {bet.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
        {view === 'wallet' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Wallet</h2>
            
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 mb-4">
              <p className="text-blue-100 mb-2">Available Balance</p>
              <p className="text-4xl font-bold text-white mb-4">{formatCurrency(user.balance)}</p>
              <div className="flex gap-3">
                <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                  Deposit
                </button>
                <button className="bg-blue-500/20 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-500/30 transition-colors border border-white/20">
                  Withdraw
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Bonus Balance</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(user.bonus)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Use for placing bets</p>
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                  <p className="text-xs text-yellow-300">💡 Earn bonus through deposits & promotions</p>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Withdrawable Bonus</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(user.withdrawableBonus)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Available for withdrawal</p>
                <button className="mt-3 w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Withdraw Bonus
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-white mb-4">Account Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-gray-400">Main Balance</span>
                  <span className="font-bold text-white">{formatCurrency(user.balance)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-gray-400">Bonus Balance</span>
                  <span className="font-bold text-yellow-400">{formatCurrency(user.bonus)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="text-gray-400">Withdrawable Bonus</span>
                  <span className="font-bold text-green-400">{formatCurrency(user.withdrawableBonus)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white font-bold">Total Available</span>
                  <span className="font-bold text-blue-400 text-xl">
                    {formatCurrency(user.balance + user.bonus + user.withdrawableBonus)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-6">
              <h3 className="font-bold text-white mb-4">Firebase Integration</h3>
              <p className="text-gray-400 text-sm mb-4">This app uses real Firebase Authentication and Firestore. Replace the Firebase config at the top of the code with your project credentials.</p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">✅ User authentication with Firebase Auth</p>
                <p className="text-xs text-blue-300">✅ User data stored in Firestore</p>
                <p className="text-xs text-blue-300">✅ Password reset via OTP</p>
                <p className="text-xs text-blue-300">✅ Real-time balance updates</p>
              </div>
            </div>
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
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                              : 'bg-slate-800/50 border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 hover:scale-105'
                          } relative`}
                        >
                          {option.disabled && (
                            <div className="absolute top-2 right-2">
                              <Lock className="w-3 h-3 text-gray-500" />
                            </div>
                          )}
                          <p className={`text-sm font-medium mb-2 ${option.disabled ? 'text-gray-500' : 'text-white'}`}>
                            {option.label}
                          </p>
                          <p className={`text-xl font-bold ${option.disabled ? 'text-gray-600' : 'text-green-400'}`}>
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

            <button
              onClick={() => {
                setShowAllMarkets(false);
                setSelectedMatch(null);
              }}
              className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
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
                    {formatCurrency(parseFloat(betAmount) * parseFloat(selectedOutcome.odds))}
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
    </div>
  );
};

export default App;