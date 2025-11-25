import React, { useState, useEffect, useRef } from 'react';
import { Send, User, TrendingUp, TrendingDown, ArrowLeft, Wallet } from 'lucide-react';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class VirtualGameAdminService {
  constructor() {
    this.db = null;
  }

  async initDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  // Auto-complete pending virtual game bets
  async autoCompletePendingBets(gameType) {
    try {
      await this.initDb();
      const betsRef = collection(this.db, 'bets');
      
      // Query pending bets for specific game type
      const q = query(
        betsRef,
        where('market', '==', gameType),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      let completedCount = 0;
      const results = [];

      for (const betDoc of snapshot.docs) {
        const bet = betDoc.data();
        const userId = bet.userId;

        // Randomly determine win/loss for virtual games
        const isWin = Math.random() > 0.5;
        const payout = isWin ? bet.potentialWin : 0;
        const newStatus = isWin ? 'won' : 'lost';

        // Update bet status
        await updateDoc(betDoc.ref, {
          status: newStatus,
          result: isWin ? 'win' : 'loss',
          completedAt: new Date().toISOString(),
          autoCompleted: true
        });

        // Update user balance if won
        if (isWin && userId) {
          const userRef = doc(this.db, 'users', userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const newBalance = (userData.balance || 0) + payout;
            
            await updateDoc(userRef, {
              balance: newBalance,
              lastUpdated: new Date().toISOString()
            });
          }
        }

        completedCount++;
        results.push({
          betId: betDoc.id,
          userId,
          status: newStatus,
          payout: isWin ? payout : 0
        });
      }

      // Log admin action
      await this.logVirtualGameAction('AUTO_COMPLETE_BETS', {
        gameType,
        completedCount,
        timestamp: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Auto-completed ${completedCount} ${gameType} bets`,
        completedCount,
        results
      };
    } catch (err) {
      console.error('autoCompletePendingBets error:', err);
      return { success: false, error: err.message };
    }
  }

  // Enable/disable auto-complete for a game type
  async setAutoCompleteConfig(gameType, enabled, completionIntervalSeconds = 30) {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'virtualGameConfig');
      
      const currentConfig = await getDoc(configRef);
      const config = currentConfig.exists() ? currentConfig.data() : { games: {} };

      config.games = config.games || {};
      config.games[gameType] = {
        autoComplete: enabled,
        completionIntervalSeconds,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(configRef, config);

      return { 
        success: true, 
        message: `Auto-complete ${enabled ? 'enabled' : 'disabled'} for ${gameType}` 
      };
    } catch (err) {
      console.error('setAutoCompleteConfig error:', err);
      return { success: false, error: err.message };
    }
  }

  // Get virtual game config
  async getVirtualGameConfig() {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'virtualGameConfig');
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        return { success: true, data: configSnap.data() };
      } else {
        const defaultConfig = {
          games: {
            colorstake: { autoComplete: false, completionIntervalSeconds: 30 },
            fly: { autoComplete: false, completionIntervalSeconds: 30 }
          },
          createdAt: new Date().toISOString()
        };
        await setDoc(configRef, defaultConfig);
        return { success: true, data: defaultConfig };
      }
    } catch (err) {
      console.error('getVirtualGameConfig error:', err);
      return { success: false, error: err.message };
    }
  }

  // Get stats on pending bets
  async getPendingBetsStats(gameType) {
    try {
      await this.initDb();
      const betsRef = collection(this.db, 'bets');
      const q = query(
        betsRef,
        where('market', '==', gameType),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      let totalStake = 0;
      let totalPotentialWin = 0;

      snapshot.forEach(doc => {
        const bet = doc.data();
        totalStake += bet.amount || 0;
        totalPotentialWin += bet.potentialWin || 0;
      });

      return {
        success: true,
        data: {
          gameType,
          pendingBetsCount: snapshot.size,
          totalStake,
          totalPotentialWin,
          totalRisk: totalPotentialWin - totalStake
        }
      };
    } catch (err) {
      console.error('getPendingBetsStats error:', err);
      return { success: false, error: err.message };
    }
  }

  // Log virtual game admin action
  async logVirtualGameAction(action, details) {
    try {
      await this.initDb();
      const logsRef = collection(this.db, 'admin/virtualGameConfig/logs');

      await addDoc ? await (async () => {
        const { addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        return addDoc(logsRef, {
          action,
          details,
          timestamp: new Date().toISOString(),
          serverTimestamp: serverTimestamp()
        });
      })() : null;
    } catch (err) {
      console.error('logVirtualGameAction error:', err);
    }
  }
}

export const virtualGameAdminService = new VirtualGameAdminService();
export default function ColorStake({ user, onBalanceUpdate, onBack, onPlaceBet, onSettleBet }) {
  const [balance, setBalance] = useState(user?.balance || 0);
  const [bettingMode, setBettingMode] = useState('digits');
  const [selectedDigit, setSelectedDigit] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [ticks, setTicks] = useState(5);
  const [stake, setStake] = useState(10);
  const [chatMessage, setChatMessage] = useState('');
  const [activeBet, setActiveBet] = useState(null);
  const [ticksRemaining, setTicksRemaining] = useState(0);
  const [recentResults, setRecentResults] = useState([]);
  const [timeframe, setTimeframe] = useState('5m'); // New state for timeframe
  const [chatMessages, setChatMessages] = useState([
    { user: 'John', message: 'Just won on Red!', time: '12:45' },
    { user: 'Sarah', message: 'Going for Blue next', time: '12:46' },
    { user: 'Mike', message: 'Good luck everyone!', time: '12:47' }
  ]);
  
  // Sync balance with user prop
  useEffect(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user?.balance]);

  // Timeframe configurations
  const timeframes = [
    { id: '5m', label: '5M', dataPoints: 100, interval: 1000, displayFormat: 'time' },
    { id: '15m', label: '15M', dataPoints: 100, interval: 3000, displayFormat: 'time' },
    { id: '30m', label: '30M', dataPoints: 100, interval: 6000, displayFormat: 'time' },
    { id: '1h', label: '1H', dataPoints: 100, interval: 12000, displayFormat: 'time' },
    { id: '3h', label: '3H', dataPoints: 100, interval: 36000, displayFormat: 'time' },
    { id: '1d', label: '1D', dataPoints: 100, interval: 86400, displayFormat: 'date' },
    { id: '10d', label: '10D', dataPoints: 100, interval: 864000, displayFormat: 'date' },
    { id: '1M', label: '1M', dataPoints: 100, interval: 2592000, displayFormat: 'date' }
  ];

  const currentTimeframe = timeframes.find(tf => tf.id === timeframe) || timeframes[0];

  const [chartData, setChartData] = useState(() =>
    Array.from({ length: currentTimeframe.dataPoints }, (_, i) => {
      const now = Date.now();
      return {
        time: now - (currentTimeframe.dataPoints - i) * currentTimeframe.interval,
        value: 820 + Math.sin(i / 5) * 20 + Math.random() * 10
      };
    })
  );

  const lastValueRef = useRef(820);
  const velocityRef = useRef(0);
  const trendRef = useRef(0);
  const volatilityRef = useRef(1);

  // Reset chart data when timeframe changes
  useEffect(() => {
    const selectedTimeframe = timeframes.find(tf => tf.id === timeframe) || timeframes[0];
    setChartData(
      Array.from({ length: selectedTimeframe.dataPoints }, (_, i) => {
        const now = Date.now();
        return {
          time: now - (selectedTimeframe.dataPoints - i) * selectedTimeframe.interval,
          value: 820 + Math.sin(i / 5) * 20 + Math.random() * 10
        };
      })
    );
    lastValueRef.current = 820;
  }, [timeframe]);

  // Chart update with timestamps
  useEffect(() => {
    const selectedTimeframe = timeframes.find(tf => tf.id === timeframe) || timeframes[0];
    const updateInterval = Math.max(200, selectedTimeframe.interval / 5); // Scale update speed
    
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        const lastValue = lastValueRef.current;
        
        const meanReversionForce = (820 - lastValue) * 0.001;
        trendRef.current = trendRef.current * 0.98 + (Math.random() - 0.5) * 0.1;
        trendRef.current = Math.max(-0.5, Math.min(0.5, trendRef.current));
        
        volatilityRef.current = volatilityRef.current * 0.99 + (Math.random() * 0.5 + 0.5) * 0.01;
        volatilityRef.current = Math.max(0.5, Math.min(2, volatilityRef.current));
        
        const noise = (Math.random() - 0.5) * 2 * volatilityRef.current;
        velocityRef.current = velocityRef.current * 0.85 + noise + trendRef.current + meanReversionForce;
        velocityRef.current = Math.max(-3, Math.min(3, velocityRef.current));
        
        const microMovement = Math.sin(Date.now() / 200) * 0.1;
        const newValue = lastValue + velocityRef.current + microMovement;
        const boundedValue = Math.max(780, Math.min(860, newValue));
        
        lastValueRef.current = boundedValue;
        
        newData.push({
          time: Date.now(),
          value: boundedValue
        });
        
        return newData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Handle active bet countdown
  useEffect(() => {
    if (activeBet && ticksRemaining > 0) {
      const interval = setInterval(() => {
        setTicksRemaining(prev => {
          if (prev <= 1) {
            resolveBet();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeBet, ticksRemaining]);

  const colors = [
    { name: 'Red', hex: '#EF4444', class: 'bg-red-500' },
    { name: 'Blue', hex: '#3B82F6', class: 'bg-blue-500' },
    { name: 'Green', hex: '#10B981', class: 'bg-green-500' },
    { name: 'Yellow', hex: '#EAB308', class: 'bg-yellow-500' },
    { name: 'Orange', hex: '#F97316', class: 'bg-orange-500' },
    { name: 'Grey', hex: '#6B7280', class: 'bg-gray-500' },
    { name: 'White', hex: '#FFFFFF', class: 'bg-white border-2 border-gray-300' },
    { name: 'Black', hex: '#000000', class: 'bg-black' }
  ];

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const calculatePayout = () => {
    if (bettingMode === 'digits') {
      return (stake * 9.5).toFixed(2);
    } else {
      return (stake * 7.8).toFixed(2);
    }
  };

  const resolveBet = async () => {
    let won = false;
    let result;

    if (activeBet.mode === 'digits') {
      result = Math.floor(Math.random() * 10);
      won = result === activeBet.selection;
    } else {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      result = randomColor.name;
      won = result === activeBet.selection;
    }

    setRecentResults(prev => [result, ...prev.slice(0, 6)]);

    if (won) {
      const payout = parseFloat(calculatePayout());
      const newBalance = balance + payout;
      setBalance(newBalance);
      
      // Update parent component balance
      if (onBalanceUpdate) {
        onBalanceUpdate(newBalance);
      }
      
      addChatMessage('System', `🎉 You won KSH ${payout.toFixed(2)}!`, true);
      // settle bet as won
      await settleActiveBet('win');
    } else {
      addChatMessage('System', `❌ You lost. Result was ${result}`, true);
      // settle bet as lost
      await settleActiveBet('lose');
    }

    setActiveBet(null);
    setTicksRemaining(0);
  };

  const placeBet = async () => {
    if (stake > balance) {
      addChatMessage('System', '⚠️ Insufficient balance!', true);
      return;
    }

    if ((bettingMode === 'digits' && selectedDigit === null) || 
        (bettingMode === 'colors' && selectedColor === null)) {
      return;
    }

    const newBalance = balance - stake;
    setBalance(newBalance);
    
    // Update parent component balance
    if (onBalanceUpdate) {
      onBalanceUpdate(newBalance);
    }

    const selection = bettingMode === 'digits' ? selectedDigit : selectedColor;
    const betObj = {
      mode: bettingMode,
      selection: selection,
      stake: stake,
      ticks: ticks,
      potentialWin: parseFloat(calculatePayout()),
      market: 'colorstake',
      outcome: selection,
      status: 'pending',
      isLive: false,
      timestamp: new Date().toISOString(),
      match: 'ColorStake'
    };

    // Await save result if parent persists
    let saved = null;
    if (typeof onPlaceBet === 'function') {
      try {
        const res = await onPlaceBet(betObj, newBalance);
        if (res && res.success && res.bet) saved = res.bet;
      } catch (err) {
        console.error('onPlaceBet error', err);
      }
    }

    setActiveBet({
      ...betObj,
      id: saved?.id || null
    });
    setTicksRemaining(ticks);
    addChatMessage('You', `Placed KSH ${stake} on ${selection} for ${ticks} ticks`, true);

    // parent persistence already awaited above (if provided)
  };

  // Called when active bet resolves; if bet was persisted, attempt to settle via callable
  const settleActiveBet = async (result) => {
    if (!activeBet) return;
    const status = result === 'win' ? 'won' : result === 'void' ? 'void' : 'lost';
    if (activeBet.id && typeof onSettleBet === 'function') {
      try {
        await onSettleBet(activeBet.id, status);
      } catch (err) {
        console.error('onSettleBet error', err);
      }
    }
  };

  const toggleMode = () => {
    if (activeBet) return;
    setBettingMode(prev => (prev === 'digits' ? 'colors' : 'digits'));
    setSelectedDigit(null);
    setSelectedColor(null);
  };

  const addChatMessage = (user, message, isSystem = false) => {
    const newMessage = {
      user: user,
      message: message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isSystem
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = () => {
    if (chatMessage.trim()) {
      addChatMessage('You', chatMessage);
      setChatMessage('');
    }
  };

  const formatCurrency = (amount) => {
    return `KSH ${amount.toLocaleString()}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    
    if (currentTimeframe.displayFormat === 'date') {
      // For longer timeframes, show date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For shorter timeframes, show time
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  };

  const formatXAxisTime = (timestamp) => {
    const date = new Date(timestamp);
    
    switch(timeframe) {
      case '5m':
      case '15m':
      case '30m':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '1h':
      case '3h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '1d':
      case '10d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const currentPrice = chartData[chartData.length - 1].value;
  const previousPrice = chartData[chartData.length - 2]?.value || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const isPositive = priceChange >= 0;

  // Get price range for Y-axis
  const prices = chartData.map(d => d.value);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const yAxisSteps = 5;
  const yAxisValues = Array.from({ length: yAxisSteps }, (_, i) => 
    minPrice + (priceRange * i / (yAxisSteps - 1))
  );

  // Get time range for X-axis
  const timeRange = chartData[chartData.length - 1].time - chartData[0].time;
  const xAxisSteps = 6;
  const xAxisTimes = Array.from({ length: xAxisSteps }, (_, i) => 
    chartData[0].time + (timeRange * i / (xAxisSteps - 1))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Header */}
      <div className="mb-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-slate-700/50 hover:bg-slate-600/50 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">ColorStake</h1>
              <p className="text-sm text-blue-300">Instant Win Games</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-700/50 px-4 py-2 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(balance)}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-blue-500/30">
              <p className="text-sm text-white font-medium">{user?.username || 'Player'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Bet Notification */}
      {activeBet && (
        <div className="mb-6 bg-blue-900/50 border-2 border-blue-500/50 rounded-xl p-4 animate-pulse backdrop-blur-sm">
          <div className="text-white text-center">
            <div className="text-lg font-bold">Active Bet: {activeBet.selection}</div>
            <div className="text-sm">Ticks Remaining: {ticksRemaining}</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Area - MetaTrader Style */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">Live Market Index</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">● Live</span>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {currentPrice.toFixed(2)}
              </div>
              <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({((priceChange / previousPrice) * 100).toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* MetaTrader-style Chart */}
          <div className="mb-4">
            {/* Timeframe Selector */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
              {timeframes.map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    timeframe === tf.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-96 bg-slate-900/70 rounded-lg border border-slate-700/50 p-0 relative overflow-hidden">
            <svg width="100%" height="100%" className="overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines - Horizontal (Price levels) */}
              {yAxisValues.map((price, i) => {
                const y = 85 - ((price - minPrice) / priceRange) * 70;
                return (
                  <g key={`h-${i}`}>
                    <line
                      x1="8%"
                      y1={`${y}%`}
                      x2="92%"
                      y2={`${y}%`}
                      stroke="#374151"
                      strokeWidth="0.5"
                      strokeDasharray="2,2"
                      opacity="0.5"
                    />
                    <text
                      x="93%"
                      y={`${y}%`}
                      fill="#9CA3AF"
                      fontSize="10"
                      textAnchor="start"
                      dominantBaseline="middle"
                    >
                      {price.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Grid lines - Vertical (Time) */}
              {xAxisTimes.map((time, i) => {
                const x = 8 + (84 * i / (xAxisSteps - 1));
                return (
                  <g key={`v-${i}`}>
                    <line
                      x1={`${x}%`}
                      y1="15%"
                      x2={`${x}%`}
                      y2="85%"
                      stroke="#374151"
                      strokeWidth="0.5"
                      strokeDasharray="2,2"
                      opacity="0.5"
                    />
                    <text
                      x={`${x}%`}
                      y="90%"
                      fill="#9CA3AF"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {formatXAxisTime(time)}
                    </text>
                  </g>
                );
              })}

              {/* Chart area fill */}
              <polygon
                fill="url(#chartGradient)"
                points={
                  chartData.map((point, i) => {
                    const x = 8 + (84 * i / (chartData.length - 1));
                    const y = 85 - ((point.value - minPrice) / priceRange) * 70;
                    return `${x}%,${y}%`;
                  }).join(' ') + ` 92%,85% 8%,85%`
                }
              />

              {/* Chart line */}
              <path
                d={chartData.map((point, i) => {
                  const x = 8 + (84 * i / (chartData.length - 1));
                  const y = 85 - ((point.value - minPrice) / priceRange) * 70;
                  if (i === 0) return `M ${x} ${y}`;
                  
                  const prevPoint = chartData[i - 1];
                  const prevX = 8 + (84 * (i - 1) / (chartData.length - 1));
                  const prevY = 85 - ((prevPoint.value - minPrice) / priceRange) * 70;
                  const cpX = prevX + (x - prevX) / 2;
                  
                  return ` Q ${cpX} ${prevY}, ${x} ${y}`;
                }).join('')}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Current price indicator */}
              <g>
                <circle
                  cx="92%"
                  cy={`${85 - ((currentPrice - minPrice) / priceRange) * 70}%`}
                  r="4"
                  fill="#10B981"
                >
                  <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle
                  cx="92%"
                  cy={`${85 - ((currentPrice - minPrice) / priceRange) * 70}%`}
                  r="4"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                >
                  <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            </svg>
          </div>

          {/* Recent Results */}
          <div className="mt-4">
            <div className="text-sm text-gray-400 mb-2">
              {bettingMode === 'digits' ? 'Recent Digit Results' : 'Recent Color Results'}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.length > 0 ? (
                recentResults.map((result, idx) => (
                  bettingMode === 'digits' ? (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-white shadow-lg border border-blue-500/30"
                    >
                      {result}
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className={`flex-shrink-0 w-12 h-12 rounded-full shadow-lg border-2 border-slate-600/50 ${
                        colors.find(c => c.name === result)?.class || 'bg-gray-500'
                      }`}
                    />
                  )
                ))
              ) : (
                <div className="text-gray-500 text-sm">No results yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
          {/* Mode Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Betting Mode</span>
            </div>
            <button
              onClick={toggleMode}
              disabled={activeBet !== null}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bettingMode === 'digits' ? '🎨 Switch to Colors' : '🔢 Switch to Digits'}
            </button>
          </div>

          {/* Ticks Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Ticks: {ticks}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={ticks}
              onChange={(e) => setTicks(Number(e.target.value))}
              disabled={activeBet !== null}
              className="w-full accent-blue-500"
            />
            <div className="text-xs text-gray-500 text-center mt-1">{ticks} Ticks = {ticks} seconds</div>
          </div>

          {/* Selection Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              {bettingMode === 'digits' ? 'Select Digit' : 'Select Color'}
            </label>

            {bettingMode === 'digits' ? (
              <div className="grid grid-cols-5 gap-2">
                {digits.map((digit) => (
                  <button
                    key={digit}
                    onClick={() => setSelectedDigit(digit)}
                    disabled={activeBet !== null}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      selectedDigit === digit
                        ? 'bg-blue-600 text-white shadow-lg scale-110 border-2 border-blue-400'
                        : 'bg-slate-700/50 text-white hover:bg-slate-600/50 border border-slate-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {digit}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4 justify-items-center">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    disabled={activeBet !== null}
                    className={`w-16 h-16 rounded-full transition-all ${color.class} ${
                      selectedColor === color.name
                        ? 'ring-4 ring-blue-500 scale-125 shadow-xl'
                        : 'hover:scale-110 shadow-lg'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stake Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Stake
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStake(Math.max(1, stake - 1))}
                disabled={activeBet !== null}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                disabled={activeBet !== null}
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-blue-500/30 text-white rounded-lg text-center disabled:opacity-50 focus:outline-none focus:border-blue-500"
              />
              <span className="text-sm text-gray-400">KSH</span>
              <button
                onClick={() => setStake(stake + 1)}
                disabled={activeBet !== null}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Payout Display */}
          <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-blue-500/20">
            <div className="text-sm text-gray-400 mb-1">Potential Payout</div>
            <div className="text-2xl font-bold text-green-400">KSH {calculatePayout()}</div>
            <div className="text-xs text-gray-500 mt-1">
              {bettingMode === 'digits' ? 'Multiplier: 9.5x' : 'Multiplier: 7.8x'}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={placeBet}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold text-lg transition-all shadow-lg disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              activeBet !== null ||
              (bettingMode === 'digits' ? selectedDigit === null : selectedColor === null) ||
              stake > balance
            }
          >
            {activeBet ? 'Bet in Progress...' :
             bettingMode === 'digits'
              ? (selectedDigit !== null ? `Bet KSH ${stake} on ${selectedDigit}` : 'Select a Digit')
              : (selectedColor ? `Bet KSH ${stake} on ${selectedColor}` : 'Select a Color')
            }
          </button>
        </div>

        {/* Live Chat */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 flex flex-col h-[600px]">
          <h3 className="text-lg font-semibold text-white mb-4">💬 Live Chat</h3>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`rounded-lg p-3 border ${
                msg.isSystem ? 'bg-blue-900/30 border-blue-500/30' : 'bg-slate-900/50 border-slate-700/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-400 text-sm">{msg.user}</span>
                  <span className="text-xs text-gray-500 ml-auto">{msg.time}</span>
                </div>
                <p className="text-gray-300 text-sm">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-slate-900/50 border border-blue-500/30 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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