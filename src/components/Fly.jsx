import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX, Settings, TrendingUp, Users, MessageSquare, History, Zap } from 'lucide-react';
import FlyGameAdminService from '../services/FlyGameAdminService';

const FlyAviator = ({ user, onBalanceUpdate, onBack, onPlaceBet, onSettleBet }) => {
  // Game states
  const [gameState, setGameState] = useState('countdown');
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(5);
  
  // Bet 1
  const [bet1Amount, setBet1Amount] = useState('100');
  const [bet1Active, setBet1Active] = useState(false);
  const [bet1CashedOut, setBet1CashedOut] = useState(null);
  const [autoCashout1, setAutoCashout1] = useState('');
  
  // Bet 2
  const [bet2Amount, setBet2Amount] = useState('');
  const [bet2Active, setBet2Active] = useState(false);
  const [bet2CashedOut, setBet2CashedOut] = useState(null);
  const [autoCashout2, setAutoCashout2] = useState('');
  
  // Game data
  const [gameHistory, setGameHistory] = useState([]);
  const [allBets, setAllBets] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [topWins, setTopWins] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [error, setError] = useState('');
  
  // Refs
  const crashPointRef = useRef(2.5);
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  
  const MIN_CRASH = 1.01;
  const MAX_CRASH = 100;

  // Generate random crash point
  const generateCrashPoint = () => {
    const random = Math.random();
    if (random < 0.5) return 1.0 + Math.random() * 1.5; // 1.0-2.5x (50%)
    if (random < 0.8) return 2.5 + Math.random() * 2.5; // 2.5-5.0x (30%)
    if (random < 0.95) return 5.0 + Math.random() * 5.0; // 5.0-10.0x (15%)
    return 10.0 + Math.random() * 90.0; // 10.0-100.0x (5%)
  };

  // Generate fake player bets
  const generateFakeBets = () => {
    const names = ['John', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'Tom', 'Anna'];
    const newBets = [];
    for (let i = 0; i < 8; i++) {
      newBets.push({
        id: Math.random(),
        player: names[Math.floor(Math.random() * names.length)],
        amount: (Math.random() * 500 + 50).toFixed(2),
        multiplier: null,
        cashedOut: false
      });
    }
    return newBets;
  };

  // Initialize game
  useEffect(() => {
    crashPointRef.current = generateCrashPoint();
    setAllBets(generateFakeBets());
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameState === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            startGame();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Game loop - exponential growth with increasing speed
  useEffect(() => {
    if (gameState !== 'running') return;

    gameLoopRef.current = setInterval(() => {
      setMultiplier(prev => {
        // Exponential increment: speed increases as multiplier increases
        const increment = Math.max(0.001, prev * 0.008); // 0.8% of current multiplier per tick
        const newMult = Number((prev + increment).toFixed(2));
        
        // Check auto-cashouts
        if (bet1Active && !bet1CashedOut && autoCashout1 && newMult >= parseFloat(autoCashout1)) {
          handleCashout(1, newMult);
        }
        if (bet2Active && !bet2CashedOut && autoCashout2 && newMult >= parseFloat(autoCashout2)) {
          handleCashout(2, newMult);
        }

        // Update fake players
        setAllBets(prev => prev.map(bet => {
          if (!bet.cashedOut && Math.random() > 0.98) {
            return { ...bet, multiplier: newMult, cashedOut: true };
          }
          return bet;
        }));
        
        if (newMult >= crashPointRef.current) {
          clearInterval(gameLoopRef.current);
          crashGame();
          return crashPointRef.current;
        }
        
        return newMult;
      });
    }, 100);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, bet1Active, bet2Active, bet1CashedOut, bet2CashedOut, autoCashout1, autoCashout2]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const drawGraph = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
      
      if (gameState === 'running') {
        // Draw exponential curve
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const points = 100;
        for (let i = 0; i < points; i++) {
          const x = (i / points) * width;
          // Exponential curve: y = e^(progress * 3)
          // This creates the curved line that accelerates like Aviator
          const progress = (multiplier - 1) / (crashPointRef.current - 1);
          const exponentialProgress = Math.min(1, progress);
          
          // Calculate y using exponential function (curves upward)
          const curveValue = (Math.exp(exponentialProgress * (i / points) * 2) - 1) / (Math.exp(2) - 1);
          const y = height - (curveValue * height);
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Draw plane - keep it visible on canvas like Aviator
        const planeProgress = Math.min(1, (multiplier - 1) / (crashPointRef.current - 1));
        const planeX = width * Math.min(0.90, 0.1 + (planeProgress * 0.8)); // Moves from 10% to 90% of width
        const planeCurve = Math.min(0.85, (Math.exp(planeProgress * 2) - 1) / (Math.exp(2) - 1)); // Caps at 85% height
        const planeY = height - (planeCurve * height * 0.9); // Stays within 90% of canvas height
        ctx.fillStyle = '#22c55e';
        ctx.font = '30px Arial';
        ctx.fillText('✈️', planeX, planeY);
      } else if (gameState === 'crashed') {
        // Red graph on crash
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width * 0.8, height * 0.2);
        ctx.stroke();
        
        // Explosion
        ctx.fillStyle = '#ef4444';
        ctx.font = '50px Arial';
        ctx.fillText('💥', width * 0.75, height * 0.25);
      }
    };
    
    const animate = () => {
      drawGraph();
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [gameState, multiplier]);

  const startGame = () => {
    setGameState('running');
    setMultiplier(1.0);
    setBet1CashedOut(null);
    setBet2CashedOut(null);
    // Bets are only activated when user clicks "PLACE BET"
  };

  const crashGame = () => {
    setGameState('crashed');
    
    // Add to history
    setGameHistory(prev => [crashPointRef.current, ...prev.slice(0, 9)]);
    
    // Handle losses
    if (bet1Active && !bet1CashedOut) {
      const loss = {
        amount: parseFloat(bet1Amount),
        multiplier: crashPointRef.current,
        profit: -parseFloat(bet1Amount),
        time: new Date().toLocaleTimeString()
      };
      setMyBets(prev => [loss, ...prev.slice(0, 9)]);
    }
    if (bet2Active && !bet2CashedOut) {
      const loss = {
        amount: parseFloat(bet2Amount),
        multiplier: crashPointRef.current,
        profit: -parseFloat(bet2Amount),
        time: new Date().toLocaleTimeString()
      };
      setMyBets(prev => [loss, ...prev.slice(0, 9)]);
    }
    
    setBet1Active(false);
    setBet2Active(false);
    
    // Reset after delay
    setTimeout(() => {
      crashPointRef.current = generateCrashPoint();
      setGameState('countdown');
      setCountdown(5);
      setAllBets(generateFakeBets());
    }, 3000);
  };

  const handlePlaceBet = (betNum) => {
    if (gameState !== 'countdown') return;
    const amount = betNum === 1 ? parseFloat(bet1Amount) : parseFloat(bet2Amount);
    if (amount <= 0) {
      setError('Enter valid bet amount');
      return;
    }
    if (amount > user.balance) {
      setError('Insufficient balance');
      return;
    }
    
    // Deduct from balance
    const newBalance = user.balance - amount;
    onBalanceUpdate(newBalance);
    
    // Activate the bet
    if (betNum === 1) {
      setBet1Active(true);
    } else {
      setBet2Active(true);
    }
    
    setError('');
  };

  const handleCashout = async (betNum, mult = null) => {
    const cashoutMult = mult || multiplier;
    
    if (betNum === 1 && bet1Active && !bet1CashedOut) {
      const amount = parseFloat(bet1Amount);
      const winnings = amount * cashoutMult;
      const profit = winnings - amount;
      const newBalance = user.balance + winnings;
      
      setBet1CashedOut(cashoutMult);
      setBet1Active(false);
      onBalanceUpdate(newBalance);
      
      const myBet = {
        amount,
        multiplier: cashoutMult,
        profit,
        time: new Date().toLocaleTimeString()
      };
      setMyBets(prev => [myBet, ...prev.slice(0, 9)]);
      setTopWins(prev => [myBet, ...prev.slice(0, 9)].sort((a, b) => b.profit - a.profit));
    } else if (betNum === 2 && bet2Active && !bet2CashedOut) {
      const amount = parseFloat(bet2Amount);
      const winnings = amount * cashoutMult;
      const profit = winnings - amount;
      const newBalance = user.balance + winnings;
      
      setBet2CashedOut(cashoutMult);
      setBet2Active(false);
      onBalanceUpdate(newBalance);
      
      const myBet = {
        amount,
        multiplier: cashoutMult,
        profit,
        time: new Date().toLocaleTimeString()
      };
      setMyBets(prev => [myBet, ...prev.slice(0, 9)]);
      setTopWins(prev => [myBet, ...prev.slice(0, 9)].sort((a, b) => b.profit - a.profit));
    }
  };

  const handleCancel = (betNum) => {
    if (gameState !== 'countdown') return;
    if (betNum === 1) {
      setBet1Amount('100');
    } else {
      setBet2Amount('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Sparkfly
            </h1>
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-400">Balance:</span>
              <span className="text-lg font-bold text-yellow-400">KSH {(user?.balance || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            {user?.isAdmin && (
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Game History Bar */}
        <div className="bg-slate-800/30 rounded-lg p-3 mb-6 flex items-center gap-2 overflow-x-auto">
          <History className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex gap-2">
            {gameHistory.map((mult, idx) => (
              <div
                key={idx}
                className={`px-3 py-1 rounded font-bold text-sm whitespace-nowrap ${
                  mult >= 2 ? 'bg-purple-500/20 text-purple-300' :
                  mult >= 1.5 ? 'bg-blue-500/20 text-blue-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}
              >
                {mult.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Canvas */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50 relative overflow-hidden h-96">
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={400}
                className="w-full h-full absolute inset-0"
              />
              
              {/* Multiplier Display */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                {gameState === 'countdown' && (
                  <div className="text-center">
                    <div className="text-7xl font-bold text-blue-400 mb-4 animate-pulse">
                      {countdown}
                    </div>
                    <div className="text-2xl text-gray-300">
                      Place your bets...
                    </div>
                  </div>
                )}
                
                {gameState === 'running' && (
                  <div className="text-9xl font-bold text-green-400 animate-pulse">
                    {multiplier.toFixed(2)}x
                  </div>
                )}
                
                {gameState === 'crashed' && (
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-500 mb-4">
                      CRASHED!
                    </div>
                    <div className="text-5xl text-red-400">
                      {crashPointRef.current.toFixed(2)}x
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Betting Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bet 1 */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/20">
                <h3 className="text-lg font-bold text-white mb-4">Bet 1 (Green)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-green-300 mb-2 uppercase tracking-wider">Bet Amount (KSH)</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setBet1Amount((prev) => (parseFloat(prev) / 2).toFixed(2))}
                        className="px-3 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-green-500/30"
                      >
                        ½
                      </button>
                      <input
                        type="number"
                        value={bet1Amount}
                        onChange={(e) => setBet1Amount(e.target.value)}
                        disabled={gameState === 'running'}
                        className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500/30 rounded-lg px-4 py-3 text-white text-lg font-semibold disabled:opacity-50 focus:border-green-500 focus:outline-none focus:shadow-lg focus:shadow-green-500/50 transition-all placeholder-gray-500"
                      />
                      <button 
                        onClick={() => setBet1Amount((prev) => (parseFloat(prev) * 2).toFixed(2))}
                        className="px-3 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-green-500/30"
                      >
                        2×
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-green-300 mb-2 uppercase tracking-wider">Auto Cashout At</label>
                    <input
                      type="number"
                      value={autoCashout1}
                      onChange={(e) => setAutoCashout1(e.target.value)}
                      placeholder="e.g. 2.5x"
                      step="0.1"
                      min="1.01"
                      className="w-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500/30 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-green-500 focus:outline-none focus:shadow-lg focus:shadow-green-500/50 transition-all placeholder-gray-500"
                    />
                  </div>

                  {!bet1Active ? (
                    <>
                      <button
                        onClick={() => handlePlaceBet(1)}
                        disabled={gameState !== 'countdown'}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        {gameState === 'countdown' ? 'PLACE BET' : 'WAIT...'}
                      </button>
                      {gameState === 'countdown' && (
                        <button
                          onClick={() => handleCancel(1)}
                          className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  ) : bet1CashedOut ? (
                    <div className="w-full py-3 bg-green-600/20 border-2 border-green-500 rounded-lg font-bold text-center text-green-400">
                      WON KSH {(parseFloat(bet1Amount) * bet1CashedOut).toLocaleString()}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCashout(1)}
                      className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-lg animate-pulse transition-all"
                    >
                      CASHOUT KSH {(parseFloat(bet1Amount) * multiplier).toLocaleString()}
                    </button>
                  )}
                </div>
              </div>

              {/* Bet 2 */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
                <h3 className="text-lg font-bold text-white mb-4">Bet 2 (Blue)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-300 mb-2 uppercase tracking-wider">Bet Amount (KSH)</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setBet2Amount((prev) => (parseFloat(prev || '0') / 2).toFixed(2))}
                        className="px-3 py-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-blue-500/30"
                      >
                        ½
                      </button>
                      <input
                        type="number"
                        value={bet2Amount}
                        onChange={(e) => setBet2Amount(e.target.value)}
                        disabled={gameState === 'running'}
                        placeholder="0.00"
                        className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/30 rounded-lg px-4 py-3 text-white text-lg font-semibold disabled:opacity-50 focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/50 transition-all placeholder-gray-500"
                      />
                      <button 
                        onClick={() => setBet2Amount((prev) => (parseFloat(prev || '10') * 2).toFixed(2))}
                        className="px-3 py-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-blue-500/30"
                      >
                        2×
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-300 mb-2 uppercase tracking-wider">Auto Cashout At</label>
                    <input
                      type="number"
                      value={autoCashout2}
                      onChange={(e) => setAutoCashout2(e.target.value)}
                      placeholder="e.g. 3.0x"
                      step="0.1"
                      min="1.01"
                      className="w-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/30 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/50 transition-all placeholder-gray-500"
                    />
                  </div>

                  {!bet2Active ? (
                    <>
                      <button
                        onClick={() => handlePlaceBet(2)}
                        disabled={gameState !== 'countdown' || !bet2Amount}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        {gameState === 'countdown' ? 'PLACE BET' : 'WAIT...'}
                      </button>
                      {gameState === 'countdown' && (
                        <button
                          onClick={() => handleCancel(2)}
                          className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  ) : bet2CashedOut ? (
                    <div className="w-full py-3 bg-blue-600/20 border-2 border-blue-500 rounded-lg font-bold text-center text-blue-400">
                      WON KSH {(parseFloat(bet2Amount) * bet2CashedOut).toLocaleString()}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCashout(2)}
                      className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-lg animate-pulse transition-all"
                    >
                      CASHOUT KSH {(parseFloat(bet2Amount) * multiplier).toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Game Stats & Bets */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="flex border-b border-slate-700">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`flex-1 py-3 text-sm font-bold transition-colors ${
                    selectedTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  All Bets
                </button>
                <button
                  onClick={() => setSelectedTab('my')}
                  className={`flex-1 py-3 text-sm font-bold transition-colors ${
                    selectedTab === 'my' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  My Bets
                </button>
                <button
                  onClick={() => setSelectedTab('top')}
                  className={`flex-1 py-3 text-sm font-bold transition-colors ${
                    selectedTab === 'top' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Top
                </button>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto space-y-2">
                {selectedTab === 'all' && allBets.map((bet) => (
                  <div key={bet.id} className="bg-slate-900/50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{bet.player}</div>
                      <div className="text-xs text-gray-400">KSH {parseFloat(bet.amount).toLocaleString()}</div>
                    </div>
                    {bet.cashedOut ? (
                      <div className="text-green-400 font-bold text-sm">
                        {bet.multiplier.toFixed(2)}x
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs">
                        Betting...
                      </div>
                    )}
                  </div>
                ))}

                {selectedTab === 'my' && (myBets.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No bets yet
                  </div>
                ) : myBets.map((bet, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">{bet.time}</span>
                      <span className={`font-bold text-sm ${bet.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bet.profit > 0 ? '+' : ''}KSH {bet.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">KSH {parseFloat(bet.amount).toLocaleString()}</span>
                      <span className="font-bold text-sm">{bet.multiplier.toFixed(2)}x</span>
                    </div>
                  </div>
                )))}

                {selectedTab === 'top' && (topWins.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No wins yet
                  </div>
                ) : topWins.map((bet, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-3 border border-yellow-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-yellow-400">#{idx + 1}</span>
                      <span className="font-bold text-green-400 text-sm">
                        +KSH {bet.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">KSH {parseFloat(bet.amount).toLocaleString()}</span>
                      <span className="font-bold text-yellow-400 text-sm">{bet.multiplier.toFixed(2)}x</span>
                    </div>
                  </div>
                )))}
              </div>
            </div>

            {/* Game Status */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
              <h4 className="text-sm font-bold text-white mb-3">Game Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                  <span className="text-xs text-gray-400">State</span>
                  <span className="text-sm font-bold text-blue-400 capitalize">{gameState}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                  <span className="text-xs text-gray-400">Current Multiplier</span>
                  <span className="text-sm font-bold text-green-400">{multiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                  <span className="text-xs text-gray-400">Crash Point</span>
                  <span className="text-sm font-bold text-orange-400">{crashPointRef.current.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlyAviator;
