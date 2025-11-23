import React, { useState, useEffect } from 'react';
import { Trophy, Wallet, Clock, TrendingUp, Users, ChevronRight, Flame, Lock, Radio, Target, Award, Zap, LogOut, User, Mail, Phone, Eye, EyeOff } from 'lucide-react';

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
      const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getFirestore, doc, setDoc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

      const app = initializeApp(FIREBASE_CONFIG);
      this.firebaseAuth = getAuth(app);
      this.firebaseDb = getFirestore(app);
      
      this.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
      this.signInWithEmailAndPassword = signInWithEmailAndPassword;
      this.signOut = signOut;
      this.sendPasswordResetEmail = sendPasswordResetEmail;
      this.onAuthStateChanged = onAuthStateChanged;
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

  static async register(email, password, username, phoneNumber) {
    try {
      await this.initialize();

      if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
        return { 
          success: false, 
          error: 'Please configure Firebase: Update FIREBASE_CONFIG with your actual Firebase credentials' 
        };
      }

      const userCredential = await this.createUserWithEmailAndPassword(this.firebaseAuth, email, password);
      const firebaseUser = userCredential.user;

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
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }

      return { success: false, error: errorMessage };
    }
  }

  static async login(email, password) {
    try {
      await this.initialize();

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
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }

      return { success: false, error: errorMessage };
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

  static async resetPassword(email) {
    try {
      await this.initialize();
      await this.sendPasswordResetEmail(this.firebaseAuth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }

      return { success: false, error: errorMessage };
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
      
      const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const betsQuery = query(
        collection(this.firebaseDb, 'bets'),
        where('userId', '==', uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(betsQuery);
      const bets = [];
      
      querySnapshot.forEach((doc) => {
        bets.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, bets };
    } catch (error) {
      console.error('Get user bets error:', error);
      return { success: false, error: 'Failed to load bets', bets: [] };
    }
  }
}

const MOCK_MATCHES = [
  {
    id: 1,
    league: 'Premier League',
    homeTeam: 'Chelsea',
    awayTeam: 'Manchester United',
    kickoff: '2025-11-23T14:30:00',
    status: 'live',
    minute: 67,
    score: { home: 2, away: 1 },
    homeBets: 45000,
    awayBets: 38000,
    drawBets: 12000,
    totalPool: 95000
  },
  {
    id: 2,
    league: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Arsenal',
    kickoff: '2025-11-23T15:15:00',
    status: 'live',
    minute: 23,
    score: { home: 0, away: 0 },
    homeBets: 62000,
    awayBets: 55000,
    drawBets: 18000,
    totalPool: 135000
  },
  {
    id: 3,
    league: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    kickoff: '2025-11-24T20:00:00',
    status: 'upcoming',
    homeBets: 88000,
    awayBets: 92000,
    drawBets: 25000,
    totalPool: 205000
  },
  {
    id: 4,
    league: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Tottenham',
    kickoff: '2025-11-26T19:45:00',
    status: 'upcoming',
    homeBets: 71000,
    awayBets: 42000,
    drawBets: 15000,
    totalPool: 128000
  }
];

const MARKETS = [
  { id: 'match_winner', name: 'Match Winner', icon: Trophy },
  { id: 'total_goals', name: 'Total Goals', icon: Target },
  { id: 'both_teams_score', name: 'Both Teams to Score', icon: Award },
  { id: 'penalties', name: 'Penalties (Even/Odd)', icon: Zap },
  { id: 'corners', name: 'Total Corners', icon: ChevronRight },
  { id: 'cards', name: 'Total Cards', icon: Radio }
];

const LoginForm = ({ onLogin, onSwitchToRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await FirebaseAuthService.login(email, password);
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
          <label className="block text-sm text-gray-400 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="your@email.com"
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
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={onForgotPassword}
          className="w-full text-sm text-blue-400 hover:text-blue-300"
        >
          Forgot Password?
        </button>

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

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await FirebaseAuthService.register(
      formData.email,
      formData.password,
      formData.username,
      formData.phoneNumber
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
          <label className="block text-sm text-gray-400 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="your@email.com"
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
          {loading ? 'Creating Account...' : 'Create Account'}
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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await FirebaseAuthService.resetPassword(email);
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

  if (success) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full text-center">
        <div className="bg-green-500/20 p-4 rounded-full inline-block mb-4">
          <Mail className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-gray-400 mb-6">We've sent password reset instructions to {email}</p>
        <button onClick={onBack} className="text-blue-400 hover:text-blue-300">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
      <p className="text-gray-400 mb-6">Enter your email to receive reset instructions</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="your@email.com"
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
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <button type="button" onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-300">
          Back to Login
        </button>
      </form>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [activeBets, setActiveBets] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState('match_winner');
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [view, setView] = useState('matches');
  const [filter, setFilter] = useState('all');
  const [liveMinutes, setLiveMinutes] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await FirebaseAuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Load user's bets from database
        const betsResult = await FirebaseAuthService.getUserBets(currentUser.uid);
        if (betsResult.success) {
          setActiveBets(betsResult.bets);
        }
      }
    };
    loadUser();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Load user's bets after login
    FirebaseAuthService.getUserBets(userData.uid).then(result => {
      if (result.success) {
        setActiveBets(result.bets);
      }
    });
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await FirebaseAuthService.logout();
    setUser(null);
    setActiveBets([]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMinutes(prev => {
        const updated = { ...prev };
        MOCK_MATCHES.filter(m => m.status === 'live').forEach(match => {
          if (!updated[match.id]) updated[match.id] = match.minute;
          if (updated[match.id] < 90) {
            updated[match.id] = updated[match.id] + 1;
          }
        });
        return updated;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
      timestamp: new Date().toISOString(),
      status: selectedMatch.status === 'live' ? 'live' : 'pending',
      isLive: selectedMatch.status === 'live',
      result: 'pending' // pending, won, lost, refunded
    };

    // Save bet to Firestore
    const betResult = await FirebaseAuthService.saveBet(newBet);
    
    if (!betResult.success) {
      alert('Failed to save bet. Please try again.');
      return;
    }

    // Add bet ID from Firestore
    newBet.id = betResult.betId;

    // Update local state
    setActiveBets([newBet, ...activeBets]);
    
    // Update user balance
    const newBalance = user.balance - amount;
    await FirebaseAuthService.updateUserBalance(user.uid, newBalance, user.bonus, user.withdrawableBonus);
    setUser({ ...user, balance: newBalance });
    
    setBetAmount('');
    setSelectedMatch(null);
    setSelectedOutcome(null);
    alert(`Bet placed successfully!${newBet.isLive ? ' (Live Bet)' : ''}`);
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

  const filteredMatches = MOCK_MATCHES.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        {authView === 'login' && (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
            onForgotPassword={() => setAuthView('forgot')}
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
            <div className="flex items-center justify-between mb-6">
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
              <div className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-300">P2P betting • Multiple markets</p>
              </div>
            </div>

            {filteredMatches.map(match => (
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
                          <p className="text-xs font-bold text-red-400">LIVE {liveMinutes[match.id] || match.minute}'</p>
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
                        {option.disabled && (
                          <div className="absolute top-2 right-2">
                            <Lock className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <p className={`text-sm font-bold mb-2 ${option.disabled ? 'text-gray-400' : 'text-white'}`}>
                          {option.label}
                        </p>
                        <div className="bg-slate-900/50 rounded px-2 py-1 mb-1">
                          <p className={`text-xl font-bold ${option.disabled ? 'text-gray-500' : 'text-green-400'}`}>
                            {option.odds}
                          </p>
                        </div>
                        <p className={`text-xs ${option.disabled ? 'text-gray-500' : 'text-gray-400'}`}>
                          {option.disabled ? 'Not available' : formatCurrency(option.pool)}
                        </p>
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

                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                    <Users className="w-3 h-3" />
                    <p>
                      {match.status === 'live' 
                        ? '🔴 Live betting • Odds update in real-time' 
                        : 'Pool-based odds • Draw = Full refund'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'myBets' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">My Active Bets</h2>
            {activeBets.length === 0 ? (
              <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No active bets yet</p>
                <button
                  onClick={() => setView('matches')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Place Your First Bet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBets.map(bet => (
                  <div key={bet.id} className="bg-slate-800/50 rounded-lg border border-blue-500/20 p-4">
                    <div className="flex items-start justify-between">
                      <div>
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
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Stake</p>
                        <p className="font-bold text-white">{formatCurrency(bet.amount)}</p>
                        <p className="text-xs text-green-400">Odds: {bet.odds}x</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Win: {formatCurrency(bet.amount * parseFloat(bet.odds))}
                        </p>
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
                <p className="text-xs text-blue-300">✅ Password reset via email</p>
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