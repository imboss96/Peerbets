import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, Volume2, VolumeX, Settings, RefreshCw, Trash2 } from 'lucide-react';
import FlyGameAdminService from '../services/FlyGameAdminService';
import VirtualGameAdminService from '../services/VirtualGameAdminService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';const Fly = ({ user, onBalanceUpdate, onBack, onPlaceBet, onSettleBet }) => {
  const [gameState, setGameState] = useState('idle');
  const [multiplier, setMultiplier] = useState(1.0);
  const [stake, setStake] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [crashSeries, setCrashSeries] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [adminLogs, setAdminLogs] = useState([]);
  const [nextCrashInput, setNextCrashInput] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [autoCashOutMultiplier, setAutoCashOutMultiplier] = useState(2.0);
  const [autoStake, setAutoStake] = useState('');
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(false);
  const [pendingBetsStats, setPendingBetsStats] = useState(null);
  
  const gameLoopRef = useRef(null);
  const crashPointRef = useRef(null);
  const audioRef = useRef(new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='));

  const MIN_CRASH = 1.01;
  const MAX_CRASH = 1000000;
  const INCREMENT_SPEED = 0.01;

  // Auto-bet logic
  useEffect(() => {
    if (autoBetEnabled && gameState === 'idle' && !betPlaced && autoStake && autoStake > 0) {
      // Auto-place bet after a short delay
      const timer = setTimeout(() => {
        setStake(autoStake);
        handlePlaceBet();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoBetEnabled, gameState, betPlaced, autoStake]);

  // Auto-cashout logic
  useEffect(() => {
    if (autoBetEnabled && gameState === 'running' && betPlaced && multiplier >= autoCashOutMultiplier) {
      handleCashOut();
    }
  }, [autoBetEnabled, gameState, betPlaced, multiplier, autoCashOutMultiplier]);

  // Fetch config on mount and when admin panel opens
  useEffect(() => {
    fetchCrashSeriesConfig();
    if (user?.isAdmin) {
      fetchPendingBetsStats();
    }
  }, [user?.isAdmin]);

  useEffect(() => {
    if (showAdminPanel && user?.isAdmin) {
      fetchAdminLogs();
    }
  }, [showAdminPanel]);

  const fetchCrashSeriesConfig = async () => {
    const result = await FlyGameAdminService.getCrashSeriesConfig();
    if (result.success) {
      setCrashSeries(result.data.crashSeries || []);
      setCurrentGameIndex(result.data.currentGameIndex || 0);
    }
  };

  const fetchAdminLogs = async () => {
    const result = await FlyGameAdminService.getAdminLogs(20);
    if (result.success) {
      setAdminLogs(result.data);
    }
  };

  const getCrashPoint = () => {
    if (crashSeries.length === 0) return 2.5;
    const nextIndex = currentGameIndex % crashSeries.length;
    return crashSeries[nextIndex];
  };

  useEffect(() => {
    if (gameState === 'idle') {
      const crash = getCrashPoint();
      crashPointRef.current = crash;
    }
  }, [gameState, crashSeries, currentGameIndex]);

  useEffect(() => {
    if (gameState !== 'running') return;

    gameLoopRef.current = setInterval(() => {
      setMultiplier(prev => {
        const newMult = Number((prev + INCREMENT_SPEED).toFixed(2));
        
        if (newMult >= crashPointRef.current) {
          clearInterval(gameLoopRef.current);
          setGameState('crashed');
          if (soundEnabled) playSound();
          
          // Update game state and stats
          const nextIndex = (currentGameIndex + 1) % crashSeries.length;
          setCurrentGameIndex(nextIndex);
          updateGameIndexInFirestore(nextIndex);
          
          // Track loss if bet was placed
          if (betPlaced && !cashOutMultiplier) {
            setConsecutiveLosses(prev => prev + 1);
            setConsecutiveWins(0);
          }
          
          return crashPointRef.current;
        }
        
        return newMult;
      });
    }, 100);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, soundEnabled, currentGameIndex, crashSeries, betPlaced, cashOutMultiplier]);

  const updateGameIndexInFirestore = async (newIndex) => {
    try {
      const result = await FlyGameAdminService.updateCrashSeries(crashSeries, user.uid);
      if (!result.success) {
        console.error('Update index failed:', result.error);
      }
    } catch (err) {
      console.error('Update game index error:', err);
    }
  };

  const playSound = () => {
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (e) {
      console.log('Sound play error:', e);
    }
  };

  const startGame = async () => {
    setError('');
    setGameState('running');
    setMultiplier(1.0);
    setBetPlaced(false);
    setCashOutMultiplier(null);
    setGameHistory(prev => [
      { multiplier: crashPointRef.current || 2.5, timestamp: new Date().toLocaleTimeString(), crashPoint: true },
      ...prev.slice(0, 9)
    ]);
  };

  const handlePlaceBet = async () => {
    if (!user) {
      setError('Please login to place a bet');
      return;
    }

    const stakeAmount = parseFloat(stake);
    if (!stakeAmount || stakeAmount <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    if (stakeAmount > user.balance) {
      setError('Insufficient balance');
      return;
    }

    if (gameState !== 'idle') {
      setError('Game already in progress. Wait for next round.');
      return;
    }

    setLoading(true);
    setError('');

    const newBalance = user.balance - stakeAmount;
    const betData = {
      match: 'Fly Crash Game',
      market: 'fly',
      outcome: `Placed at ${multiplier.toFixed(2)}x`,
      selection: 'crash_game',
      stake: stakeAmount,
      potentialWin: stakeAmount,
      status: 'pending'
    };

    const result = await onPlaceBet(betData, newBalance);

    if (result.success) {
      onBalanceUpdate(newBalance);
      setBetPlaced(true);
      setStake('');
      await startGame();
    } else {
      setError(result.error || 'Failed to place bet');
    }

    setLoading(false);
  };

  const handleCashOut = async () => {
    if (!betPlaced || gameState !== 'running') {
      setError('Cannot cash out at this time');
      return;
    }

    setCashOutMultiplier(multiplier);
    clearInterval(gameLoopRef.current);
    setGameState('idle');

    const stakeAmount = parseFloat(stake) || 0;
    const winnings = stakeAmount * multiplier;
    const newBalance = user.balance + winnings;

    await onBalanceUpdate(newBalance);
    
    // Track win
    setConsecutiveWins(prev => prev + 1);
    setConsecutiveLosses(0);

    setBetPlaced(false);
    if (!autoBetEnabled) {
      alert(`🎉 Cashed out at ${multiplier.toFixed(2)}x! Won ${winnings.toFixed(2)} KSH`);
    }
  };

  const resetGame = () => {
    setGameState('idle');
    setBetPlaced(false);
    setCashOutMultiplier(null);
    setMultiplier(1.0);
    setError('');
  };

  const handleSetNextCrash = async () => {
    if (!user?.isAdmin) {
      alert('Admin only');
      return;
    }

    const crashValue = parseFloat(nextCrashInput);
    if (isNaN(crashValue) || crashValue < MIN_CRASH || crashValue > MAX_CRASH) {
      alert(`Enter a value between ${MIN_CRASH} and ${MAX_CRASH}`);
      return;
    }

    setAdminLoading(true);
    const result = await FlyGameAdminService.setNextCrash(crashValue, user.uid);
    setAdminLoading(false);

    if (result.success) {
      alert(`✅ ${result.message}\nGame ${result.gameIndex}`);
      setNextCrashInput('');
      await fetchCrashSeriesConfig();
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const handleResetGameIndex = async () => {
    if (!user?.isAdmin) {
      alert('Admin only');
      return;
    }

    if (!window.confirm('Reset game index to 0?')) return;

    setAdminLoading(true);
    const result = await FlyGameAdminService.resetGameIndex(user.uid);
    setAdminLoading(false);

    if (result.success) {
      alert(result.message);
      await fetchCrashSeriesConfig();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleGenerateNewSeries = async () => {
    if (!user?.isAdmin) {
      alert('Admin only');
      return;
    }

    if (!window.confirm('Generate new random series? Current series will be replaced.')) return;

    setAdminLoading(true);
    const result = await FlyGameAdminService.generateNewSeries(20, user.uid);
    setAdminLoading(false);

    if (result.success) {
      alert('✅ New series generated');
      await fetchCrashSeriesConfig();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Auto-complete pending bets effect
  useEffect(() => {
    if (!autoCompleteEnabled || !user?.isAdmin) return;

    const interval = setInterval(async () => {
      const result = await VirtualGameAdminService.autoCompletePendingBets('fly');
      if (result.success && result.completedCount > 0) {
        console.log(`Auto-completed ${result.completedCount} Fly bets`);
        // Refresh stats
        fetchPendingBetsStats();
      }
    }, 30000); // Run every 30 seconds

    return () => clearInterval(interval);
  }, [autoCompleteEnabled, user?.isAdmin]);

  const fetchPendingBetsStats = async () => {
    const result = await VirtualGameAdminService.getPendingBetsStats('fly');
    if (result.success) {
      setPendingBetsStats(result.data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Matches
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Fly Crash Game</h2>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {user?.isAdmin && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="p-2 rounded-lg bg-purple-600/50 hover:bg-purple-600"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Admin Panel */}
      {showAdminPanel && user?.isAdmin && (
        <div className="bg-purple-900/50 border border-purple-500/30 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white">🛠️ Admin: Fly Game Control</h3>

          {/* Quick Set Next Crash */}
          <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4">
            <h4 className="text-sm font-bold text-white mb-3">⚡ Quick Set Next Crash (Testing)</h4>
            <div className="flex gap-2">
              <input
                type="number"
                value={nextCrashInput}
                onChange={(e) => setNextCrashInput(e.target.value)}
                placeholder="e.g., 2.5, 5.0, 10.5"
                step="0.01"
                min={MIN_CRASH}
                max={MAX_CRASH}
                className="flex-1 bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSetNextCrash}
                disabled={adminLoading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg"
              >
                {adminLoading ? 'Saving...' : 'Set'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Sets the crash value for the next game</p>
          </div>

          {/* Game Status */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Series Length</p>
              <p className="text-xl font-bold text-blue-400">{crashSeries.length}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Current Index</p>
              <p className="text-xl font-bold text-blue-400">{currentGameIndex}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Next Crash</p>
              <p className="text-xl font-bold text-red-400">{getCrashPoint().toFixed(2)}x</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Game State</p>
              <p className="text-xl font-bold text-yellow-400 capitalize">{gameState}</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <button
              onClick={handleResetGameIndex}
              disabled={adminLoading}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Game Index to 0
            </button>
            <button
              onClick={handleGenerateNewSeries}
              disabled={adminLoading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Generate New Series
            </button>
          </div>

          {/* Auto-Complete Virtual Bets Section */}
          <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white">Auto-Complete Pending Bets</h4>
              <button
                onClick={async () => {
                  const newState = !autoCompleteEnabled;
                  setAutoCompleteEnabled(newState);
                  const result = await VirtualGameAdminService.setAutoCompleteConfig('fly', newState, 30);
                  if (result.success) {
                    alert(result.message);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  autoCompleteEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {autoCompleteEnabled ? '✓ Active' : 'Inactive'}
              </button>
            </div>

            {pendingBetsStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
                  <p className="text-xs text-gray-400">Pending Bets</p>
                  <p className="text-lg font-bold text-yellow-400">{pendingBetsStats.pendingBetsCount}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
                  <p className="text-xs text-gray-400">Total Stake</p>
                  <p className="text-lg font-bold text-blue-400">KSH {pendingBetsStats.totalStake.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
                  <p className="text-xs text-gray-400">Potential Payout</p>
                  <p className="text-lg font-bold text-green-400">KSH {pendingBetsStats.totalPotentialWin.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
                  <p className="text-xs text-gray-400">Risk</p>
                  <p className={`text-lg font-bold ${pendingBetsStats.totalRisk > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    KSH {Math.abs(pendingBetsStats.totalRisk).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={async () => {
                const result = await VirtualGameAdminService.autoCompletePendingBets('fly');
                if (result.success) {
                  alert(`✅ ${result.message}\n\nCompleted: ${result.completedCount} bets`);
                  await fetchPendingBetsStats();
                } else {
                  alert('❌ Error: ' + result.error);
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Complete Pending Bets Now
            </button>
            <p className="text-xs text-purple-300 mt-2">
              {autoCompleteEnabled 
                ? '✓ Auto-completing every 30 seconds' 
                : 'Manual completion only'}
            </p>
          </div>

          {/* Admin Logs */}
          <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4">
            <h4 className="text-sm font-bold text-white mb-3">📋 Admin Action Logs</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {adminLogs.length === 0 ? (
                <p className="text-xs text-gray-500">No logs yet</p>
              ) : (
                adminLogs.reverse().map((log, idx) => (
                  <div key={idx} className="p-2 bg-slate-800 rounded-lg border border-slate-700/50 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-yellow-400 font-mono">{log.action}</span>
                      <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-gray-400 font-mono">
                      {JSON.stringify(log.details).substring(0, 80)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Display */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/20 rounded-xl p-12 text-center">
        <div className="relative">
          <div className="mb-8">
            <div className={`text-6xl transition-all duration-100 ${
              gameState === 'crashed' ? 'animate-bounce text-red-500' : 'text-blue-400'
            }`}>
              ✈️
            </div>
          </div>

          <div className={`text-7xl font-bold mb-4 transition-all duration-100 ${
            gameState === 'crashed' ? 'text-red-500' : 'text-green-400'
          }`}>
            {multiplier.toFixed(2)}x
          </div>

          {gameState === 'crashed' && (
            <div className="text-xl font-bold text-red-500 mb-4">
              💥 CRASHED AT {crashPointRef.current?.toFixed(2)}x!
            </div>
          )}

          {gameState === 'idle' && betPlaced && cashOutMultiplier && (
            <div className="text-lg text-green-400 mb-4">
              ✅ Cashed out at {cashOutMultiplier.toFixed(2)}x
            </div>
          )}
        </div>
      </div>

      {/* Game Controls & Betting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Betting Panel */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Place Your Bet</h3>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-gray-400 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-green-400">
                KSH {(user?.balance || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Stake Amount</label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Enter amount"
                disabled={gameState !== 'idle' || loading}
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setStake(amt.toString())}
                  disabled={gameState !== 'idle'}
                  className="bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 border border-blue-500/30 text-blue-300 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {amt}
                </button>
              ))}
            </div>

            {/* AutoBet Section */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white">Auto Bet</h4>
                <button
                  onClick={() => {
                    if (gameState === 'running') {
                      alert('Stop the current game before toggling auto bet');
                      return;
                    }
                    setAutoBetEnabled(!autoBetEnabled);
                  }}
                  disabled={gameState === 'running'}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    autoBetEnabled
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  } disabled:opacity-50`}
                >
                  {autoBetEnabled ? '✓ Enabled' : 'Disabled'}
                </button>
              </div>

              {autoBetEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Auto Stake Amount</label>
                    <input
                      type="number"
                      value={autoStake}
                      onChange={(e) => setAutoStake(e.target.value)}
                      placeholder="e.g., 100"
                      className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Auto Cash Out At</label>
                    <input
                      type="number"
                      value={autoCashOutMultiplier}
                      onChange={(e) => setAutoCashOutMultiplier(parseFloat(e.target.value) || 2.0)}
                      placeholder="e.g., 2.0"
                      step="0.1"
                      min="1.01"
                      max="100"
                      className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <p className="text-xs text-purple-300">
                    Auto bets will place at: {autoStake} KSH and cash out automatically at {autoCashOutMultiplier}x
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {gameState === 'idle' && !betPlaced && (
                <button
                  onClick={handlePlaceBet}
                  disabled={loading || !stake}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  {loading ? 'Placing...' : 'Place Bet & Start Game'}
                </button>
              )}

              {gameState === 'running' && betPlaced && (
                <button
                  onClick={handleCashOut}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-3 rounded-lg transition-all animate-pulse"
                >
                  💰 CASH OUT @ {multiplier.toFixed(2)}x
                </button>
              )}

              {gameState === 'crashed' && betPlaced && !cashOutMultiplier && (
                <button
                  onClick={resetGame}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 rounded-lg"
                >
                  You Crashed! Try Again
                </button>
              )}

              {gameState === 'idle' && betPlaced && cashOutMultiplier && (
                <button
                  onClick={() => {
                    setBetPlaced(false);
                    setCashOutMultiplier(null);
                    setStake('');
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Play Again
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Game Stats & CashOut Info */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 h-fit">
          <h3 className="text-lg font-bold text-white mb-4">Game Stats</h3>

          {betPlaced && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Current Bet</p>
              <p className="text-xl font-bold text-white">
                KSH {(parseFloat(stake) || 0).toLocaleString()}
              </p>
              {gameState === 'running' && (
                <div className="mt-3 space-y-2">
                  <div className="bg-green-500/20 rounded-lg p-2">
                    <p className="text-xs text-green-300">Current Winnings</p>
                    <p className="text-lg font-bold text-green-400">
                      KSH {(parseFloat(stake) * multiplier).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-yellow-500/20 rounded-lg p-2">
                    <p className="text-xs text-yellow-300">Crash Point</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {crashPointRef.current?.toFixed(2)}x
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Win/Loss Tracking */}
          <div className="space-y-3 mb-6">
            <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Consecutive Wins</p>
              <p className="text-xl font-bold text-green-400">{consecutiveWins} 🎉</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Consecutive Losses</p>
              <p className="text-xl font-bold text-red-400">{consecutiveLosses} 💔</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Game Status</p>
              <p className="text-sm font-bold text-white capitalize mt-1">
                {gameState === 'running' ? '🎮 In Progress' : gameState === 'crashed' ? '💥 Crashed' : '⏸️ Waiting'}
              </p>
            </div>

            {gameState === 'running' && (
              <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-300">⚠️ Game Running</p>
                <p className="text-sm text-red-400 font-bold mt-1">Cash out or crash!</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-bold text-white mb-3">Recent Games</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameHistory.map((game, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <span className="text-xs text-gray-400">{game.timestamp}</span>
                  <span className={`text-sm font-bold ${game.crashPoint ? 'text-red-400' : 'text-green-400'}`}>
                    {game.multiplier.toFixed(2)}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How to Play */}
      <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          How to Play
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-500/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-400 font-bold">1</span>
            </div>
            <p className="text-sm text-gray-400">Place your stake</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-400 font-bold">2</span>
            </div>
            <p className="text-sm text-gray-400">Game starts, multiplier rises</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-400 font-bold">3</span>
            </div>
            <p className="text-sm text-gray-400">Cash out before it crashes</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-400 font-bold">4</span>
            </div>
            <p className="text-sm text-gray-400">Win big or lose your bet!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fly;