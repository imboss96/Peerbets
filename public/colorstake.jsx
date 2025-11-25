import React, { useState, useEffect } from 'react';
import { Send, User, History, TrendingUp, Clock, DollarSign } from 'lucide-react';

// Firebase configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let db = null;
let auth = null;

// Lazy load Firebase to avoid errors if not configured
const initFirebase = async () => {
  if (db) return { db, auth };
  
  try {
    const firebase = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const authModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    const app = firebase.initializeApp(firebaseConfig);
    db = firestoreModule.getFirestore(app);
    auth = authModule.getAuth(app);
    
    return { db, auth, firestore: firestoreModule, authMod: authModule };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

export default function ColorStake() {
  const [userId, setUserId] = useState('demo-user-' + Math.random().toString(36).substr(2, 9));
  const [balance, setBalance] = useState(1000.00);
  const [bettingMode, setBettingMode] = useState('digits');
  const [selectedDigit, setSelectedDigit] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [ticks, setTicks] = useState(5);
  const [stake, setStake] = useState(10);
  const [chatMessage, setChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState('trade');
  const [myBets, setMyBets] = useState([]);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { user: 'John', message: 'Just won on Red!', time: '12:45' },
    { user: 'Sarah', message: 'Going for Blue next', time: '12:46' },
    { user: 'Mike', message: 'Good luck everyone!', time: '12:47' }
  ]);
  const [chartData, setChartData] = useState(() => 
    Array.from({ length: 50 }, (_, i) => ({
      time: i,
      value: 800 + Math.random() * 40
    }))
  );

  // Live chart animation
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1].value;
        const change = (Math.random() - 0.5) * 10;
        newData.push({
          time: prev[prev.length - 1].time + 1,
          value: Math.max(780, Math.min(860, lastValue + change))
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch bets from Firebase on mount
  useEffect(() => {
    fetchBets();
  }, []);

  const colors = [
    { name: 'Red', hex: '#EF4444', class: 'bg-red-500' },
    { name: 'Blue', hex: '#3B82F6', class: 'bg-blue-500' },
    { name: 'Green', hex: '#10B981', class: 'bg-green-500' },
    { name: 'Yellow', hex: '#EAB308', class: 'bg-yellow-500' },
    { name: 'Orange', hex: '#F97316', class: 'bg-orange-500' },
    { name: 'Grey', hex: '#6B7280', class: 'bg-gray-500' },
    { name: 'Black', hex: '#000000', class: 'bg-black' },
    { name: 'Pink', hex: '#EC4899', class: 'bg-pink-500' },
    { name: 'Maroon', hex: '#881337', class: 'bg-rose-900' }
  ];

  const getColorFromIndex = (value) => {
    const decimal = Math.abs(value - Math.floor(value));
    const decimalValue = Math.round(decimal * 100);
    
    if (decimalValue === 0) return { name: 'Black', hex: '#000000', class: 'bg-black' };
    if (decimalValue >= 11 && decimalValue <= 19) return { name: 'Grey', hex: '#6B7280', class: 'bg-gray-500' };
    if (decimalValue >= 20 && decimalValue <= 29) return { name: 'Red', hex: '#EF4444', class: 'bg-red-500' };
    if (decimalValue >= 30 && decimalValue <= 39) return { name: 'Black', hex: '#000000', class: 'bg-black' };
    if (decimalValue >= 40 && decimalValue <= 49) return { name: 'Blue', hex: '#3B82F6', class: 'bg-blue-500' };
    if (decimalValue >= 50 && decimalValue <= 59) return { name: 'Orange', hex: '#F97316', class: 'bg-orange-500' };
    if (decimalValue >= 60 && decimalValue <= 69) return { name: 'Yellow', hex: '#EAB308', class: 'bg-yellow-500' };
    if (decimalValue >= 70 && decimalValue <= 79) return { name: 'Green', hex: '#10B981', class: 'bg-green-500' };
    if (decimalValue >= 80 && decimalValue <= 89) return { name: 'Pink', hex: '#EC4899', class: 'bg-pink-500' };
    if (decimalValue >= 90 && decimalValue <= 99) return { name: 'Maroon', hex: '#881337', class: 'bg-rose-900' };
    
    return { name: 'Black', hex: '#000000', class: 'bg-black' };
  };
  
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  const calculatePayout = () => {
    if (bettingMode === 'digits') {
      return (stake * 9.5).toFixed(2);
    } else {
      return (stake * 7.8).toFixed(2);
    }
  };

  const toggleMode = () => {
    setBettingMode(prev => prev === 'digits' ? 'colors' : 'digits');
    setSelectedDigit(null);
    setSelectedColor(null);
  };

  const sendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        user: 'You',
        message: chatMessage,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');
    }
  };

  // Fetch bets from Firebase
  const fetchBets = async () => {
    try {
      const firebase = await initFirebase();
      if (!firebase || !firebase.db) {
        console.log('Firebase not initialized, using demo data');
        loadMockBets();
        return;
      }

      const { db, firestore } = firebase;
      const { collection, query, where, orderBy, getDocs } = firestore;
      
      const betsRef = collection(db, 'bets');
      const q = query(
        betsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedBets = [];
      
      querySnapshot.forEach((doc) => {
        fetchedBets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setMyBets(fetchedBets);
    } catch (error) {
      console.error('Error fetching bets:', error);
      loadMockBets();
    }
  };

  // Load mock bets for demo purposes
  const loadMockBets = () => {
    const mockBets = [
      {
        id: '1',
        type: 'digit',
        selection: '7',
        stake: 10,
        payout: 95,
        status: 'won',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ticks: 5
      },
      {
        id: '2',
        type: 'color',
        selection: 'Red',
        stake: 20,
        payout: 0,
        status: 'lost',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        ticks: 3
      },
      {
        id: '3',
        type: 'digit',
        selection: '3',
        stake: 15,
        payout: 142.5,
        status: 'won',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        ticks: 7
      }
    ];
    setMyBets(mockBets);
  };

  // Place bet and save to Firebase
  const placeBet = async () => {
    if (bettingMode === 'digits' && selectedDigit === null) return;
    if (bettingMode === 'colors' && selectedColor === null) return;
    if (stake > balance) {
      alert('Insufficient balance!');
      return;
    }

    setIsPlacingBet(true);

    const betData = {
      userId: userId,
      type: bettingMode === 'digits' ? 'digit' : 'color',
      selection: bettingMode === 'digits' ? selectedDigit.toString() : selectedColor,
      stake: stake,
      payout: parseFloat(calculatePayout()),
      status: 'pending',
      timestamp: new Date().toISOString(),
      ticks: ticks,
      createdAt: Date.now()
    };

    try {
      const firebase = await initFirebase();
      
      if (!firebase || !firebase.db) {
        // Fallback to local storage if Firebase not available
        console.log('Firebase not available, saving locally');
        const newBet = { ...betData, id: Date.now().toString() };
        setMyBets(prev => [newBet, ...prev]);
        setBalance(prev => prev - stake);
        setSelectedDigit(null);
        setSelectedColor(null);
        alert('Bet placed successfully! (Local mode)');
        setIsPlacingBet(false);
        return;
      }

      const { db, firestore } = firebase;
      const { collection, addDoc } = firestore;
      
      const betsRef = collection(db, 'bets');
      const docRef = await addDoc(betsRef, betData);
      
      // Update balance
      setBalance(prev => prev - stake);
      
      // Add bet to local state
      setMyBets(prev => [{ ...betData, id: docRef.id }, ...prev]);
      
      // Reset selections
      setSelectedDigit(null);
      setSelectedColor(null);
      
      alert('Bet placed successfully!');
    } catch (error) {
      console.error('Error placing bet:', error);
      
      // Fallback: Add bet locally even if Firebase fails
      const newBet = {
        ...betData,
        id: Date.now().toString()
      };
      setMyBets(prev => [newBet, ...prev]);
      setBalance(prev => prev - stake);
      setSelectedDigit(null);
      setSelectedColor(null);
      
      alert('Bet placed successfully! (Offline mode)');
    } finally {
      setIsPlacingBet(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'won': return 'text-green-400';
      case 'lost': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'won': return 'bg-green-500/10 border-green-500/30';
      case 'lost': return 'bg-red-500/10 border-red-500/30';
      case 'pending': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Header with Balance */}
      <div className="mb-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">ColorStake</h1>
        <div className="text-right">
          <div className="text-sm text-gray-400">Balance</div>
          <div className="text-2xl font-bold text-green-400">{balance.toFixed(2)} USD</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Live Market Index</h2>
            <div className="text-sm text-green-400">● Live</div>
          </div>
          
          {/* Live Moving Chart */}
          <div className="h-80 bg-gray-900 rounded-lg border border-gray-700 p-4">
            <svg width="100%" height="100%" className="overflow-hidden">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                points={chartData.map((point, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 100 - ((point.value - 780) / 80) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
              />
              
              <polygon
                fill="url(#chartGradient)"
                points={
                  chartData.map((point, i) => {
                    const x = (i / (chartData.length - 1)) * 100;
                    const y = 100 - ((point.value - 780) / 80) * 100;
                    return `${x}%,${y}%`;
                  }).join(' ') + ` 100%,100% 0%,100%`
                }
              />
              
              <circle
                cx="100%"
                cy={`${100 - ((chartData[chartData.length - 1].value - 780) / 80) * 100}%`}
                r="4"
                fill="#10B981"
                className="animate-pulse"
              />
            </svg>
            
            <div className="mt-2 text-right">
              <span className="text-2xl font-bold text-white">
                {chartData[chartData.length - 1].value.toFixed(2)}
              </span>
              <span className="ml-2 text-sm text-green-400">
                +{((chartData[chartData.length - 1].value - chartData[chartData.length - 2].value)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bottom Colors/Digits Display */}
          <div className="mt-4">
            <div className="text-sm text-gray-400 mb-2">
              {bettingMode === 'digits' ? 'Recent Digit Results' : 'Recent Color Results'}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {bettingMode === 'digits' ? (
                digits.slice(0, 7).map((digit, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-semibold text-white"
                  >
                    {digit}
                  </div>
                ))
              ) : (
                chartData.slice(-7).map((point, idx) => {
                  const color = getColorFromIndex(point.value);
                  return (
                    <div
                      key={idx}
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${color.class}`}
                      title={`${color.name} (${point.value.toFixed(2)})`}
                    ></div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Trading Panel with Tabs */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'trade'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Trade
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              My Bets
            </button>
          </div>

          {/* Trade Tab */}
          {activeTab === 'trade' && (
            <>
              {/* Mode Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Betting Mode</span>
                </div>
                <button
                  onClick={toggleMode}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-lg"
                >
                  {bettingMode === 'digits' ? '🎨 Switch to Colors' : '🔢 Switch to Digits'}
                </button>
              </div>

              {/* Ticks Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ticks: {ticks}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={ticks}
                  onChange={(e) => setTicks(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="text-xs text-gray-400 text-center mt-1">{ticks} Ticks</div>
              </div>

              {/* Selection Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {bettingMode === 'digits' ? 'Select Digit' : 'Select Color'}
                </label>
                
                {bettingMode === 'digits' ? (
                  <div className="grid grid-cols-5 gap-2">
                    {digits.map((digit) => (
                      <button
                        key={digit}
                        onClick={() => setSelectedDigit(digit)}
                        className={`py-3 rounded-lg font-semibold transition-all ${
                          selectedDigit === digit
                            ? 'bg-blue-600 text-white shadow-lg scale-110'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 justify-items-center">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-16 h-16 rounded-full transition-all ${color.class} ${
                          selectedColor === color.name
                            ? 'ring-4 ring-blue-500 scale-125 shadow-xl'
                            : 'hover:scale-110 shadow-lg'
                        }`}
                        title={color.name}
                      >
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stake Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stake
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStake(Math.max(1, stake - 1))}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-center text-white"
                  />
                  <span className="text-sm text-gray-400">USD</span>
                  <button
                    onClick={() => setStake(stake + 1)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Payout Display */}
              <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Potential Payout</div>
                <div className="text-2xl font-bold text-green-400">{calculatePayout()} USD</div>
                <div className="text-xs text-gray-500 mt-1">
                  {bettingMode === 'digits' ? 'Multiplier: 9.5x' : 'Multiplier: 7.8x'}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={placeBet}
                disabled={(bettingMode === 'digits' ? selectedDigit === null : selectedColor === null) || isPlacingBet}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold text-lg transition-all shadow-lg disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
              >
                {isPlacingBet ? 'Placing Bet...' : (
                  bettingMode === 'digits' 
                    ? (selectedDigit !== null ? `Bet on ${selectedDigit}` : 'Select a Digit')
                    : (selectedColor ? `Bet on ${selectedColor}` : 'Select a Color')
                )}
              </button>
            </>
          )}

          {/* Bet History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Betting History</h3>
                <button
                  onClick={fetchBets}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Refresh
                </button>
              </div>

              {myBets.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No bets placed yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start trading to see your history</p>
                </div>
              ) : (
                myBets.map((bet) => (
                  <div
                    key={bet.id}
                    className={`p-4 rounded-lg border ${getStatusBg(bet.status)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-white text-lg">
                          {bet.type === 'digit' ? `Digit ${bet.selection}` : bet.selection}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(bet.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(bet.status)}`}>
                        {bet.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <div className="text-xs text-gray-400">Stake</div>
                        <div className="text-sm font-semibold text-white flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {bet.stake.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Ticks</div>
                        <div className="text-sm font-semibold text-white">{bet.ticks}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Payout</div>
                        <div className={`text-sm font-semibold ${bet.status === 'won' ? 'text-green-400' : 'text-gray-400'}`}>
                          {bet.status === 'won' ? `+${bet.payout.toFixed(2)}` : '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Live Chat */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 flex flex-col h-[600px]">
          <h3 className="text-lg font-semibold text-white mb-4">💬 Live Chat</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-400 text-sm">{msg.user}</span>
                  <span className="text-xs text-gray-500 ml-auto">{msg.time}</span>
                </div>
                <p className="text-gray-300 text-sm">{msg.message}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}