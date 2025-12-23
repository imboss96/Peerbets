import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const FlyAdminDashboard = ({ user, onBack, isAdmin }) => {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('series');
  const [crashSeriesInput, setCrashSeriesInput] = useState('');
  const [crashSeries, setCrashSeries] = useState([]);
  const [currentSeriesIndex, setCurrentSeriesIndex] = useState(0);
  const [profitMargin, setProfitMargin] = useState(15);
  const [autoMode, setAutoMode] = useState(false);
  const [autoInterval, setAutoInterval] = useState(30);
  const [minBetThreshold, setMinBetThreshold] = useState(100);
  const [maxPlayerPayoutPercent, setMaxPlayerPayoutPercent] = useState(85);
  const [gameStats, setGameStats] = useState({ totalBets: 0, totalPayouts: 0, roundsPlayed: 0 });
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    if (!isAdmin || !user?.uid) {
      onBack();
      return;
    }

    setLoading(true);

    const settingsRef = doc(db, 'admin', 'flyGameSettings');
    const unsubscribeSettings = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const settings = snapshot.data();
          if (settings.crashSeries) setCrashSeries(settings.crashSeries);
          if (settings.currentSeriesIndex !== undefined) setCurrentSeriesIndex(settings.currentSeriesIndex);
          if (settings.profitMargin) setProfitMargin(settings.profitMargin);
          if (settings.autoMode !== undefined) setAutoMode(settings.autoMode);
          if (settings.autoInterval) setAutoInterval(settings.autoInterval);
          if (settings.minBetThreshold) setMinBetThreshold(settings.minBetThreshold);
          if (settings.maxPlayerPayoutPercent) setMaxPlayerPayoutPercent(settings.maxPlayerPayoutPercent);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading settings:', error);
        showToast('Error loading settings', 'error');
        setLoading(false);
      }
    );

    const statsRef = doc(db, 'admin', 'flyGameStats');
    const unsubscribeStats = onSnapshot(
      statsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setGameStats(snapshot.data());
        }
      },
      (error) => console.error('Error loading stats:', error)
    );

    return () => {
      unsubscribeSettings();
      unsubscribeStats();
    };
  }, [isAdmin, user?.uid, onBack]);

  // Toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  // Save crash series
  const saveCrashSeries = async () => {
    if (!crashSeriesInput.trim()) {
      showToast('❌ Please enter crash points', 'error');
      return;
    }

    try {
      const series = crashSeriesInput
        .split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val) && val > 1);

      if (series.length === 0) {
        showToast('❌ Invalid crash points. Use format: 2.5, 3.1, 1.8, etc.', 'error');
        return;
      }

      const settingsRef = doc(db, 'admin', 'flyGameSettings');
      
      // Use setDoc with merge to create if doesn't exist
      await setDoc(settingsRef, {
        crashSeries: series,
        currentSeriesIndex: 0,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      }, { merge: true });

      setCrashSeries(series);
      setCurrentSeriesIndex(0);
      setCrashSeriesInput('');
      showToast('✅ Crash series saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving crash series:', err);
      showToast('❌ Error saving crash series', 'error');
    }
  };

  // Add single crash point
  const addCrashPoint = async (value) => {
    const point = parseFloat(value);
    if (isNaN(point) || point <= 1) {
      showToast('❌ Invalid crash point', 'error');
      return;
    }

    try {
      const newSeries = [...crashSeries, point];
      const settingsRef = doc(db, 'admin', 'flyGameSettings');
      
      // Use setDoc with merge to create if doesn't exist
      await setDoc(settingsRef, {
        crashSeries: newSeries,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      }, { merge: true });

      setCrashSeries(newSeries);
      showToast(`✅ Added crash point: ${point.toFixed(2)}x`, 'success');
    } catch (err) {
      console.error('Error adding crash point:', err);
      showToast('❌ Error adding crash point: ' + err.message, 'error');
    }
  };

  // Delete crash point
  const deleteCrashPoint = async (index) => {
    try {
      const newSeries = crashSeries.filter((_, i) => i !== index);
      await db.collection('admin').doc('flyGameSettings').set({
        crashSeries: newSeries,
        currentSeriesIndex: Math.min(currentSeriesIndex, newSeries.length - 1),
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      }, { merge: true });

      setCrashSeries(newSeries);
      showToast('✅ Crash point deleted', 'success');
    } catch (err) {
      showToast('❌ Error deleting crash point', 'error');
    }
  };

  // Set current round
  const setCurrentRound = async (index) => {
    try {
      await db.collection('admin').doc('flyGameSettings').set({
        currentSeriesIndex: index,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      }, { merge: true });

      setCurrentSeriesIndex(index);
      showToast(`✅ Current round set to ${crashSeries[index].toFixed(2)}x`, 'success');
    } catch (err) {
      showToast('❌ Error setting current round', 'error');
    }
  };

  // Advance to next round
  const proceedToNextRound = async () => {
    if (crashSeries.length === 0) {
      showToast('❌ No crash series available', 'error');
      return;
    }

    try {
      const nextIndex = (currentSeriesIndex + 1) % crashSeries.length;
      await setCurrentRound(nextIndex);
      showToast(`✅ Advanced to round ${nextIndex + 1}`, 'success');
    } catch (err) {
      showToast('❌ Error advancing round', 'error');
    }
  };

  // Save all settings
  const saveAllSettings = async () => {
    try {
      const settingsRef = doc(db, 'admin', 'flyGameSettings');
      
      await setDoc(settingsRef, {
        profitMargin,
        autoMode,
        autoInterval,
        minBetThreshold,
        maxPlayerPayoutPercent,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      }, { merge: true });

      showToast('✅ All settings saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('❌ Error saving settings', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🔒 Admin Access Required</h1>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-xl font-bold">Loading settings...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Header */}
      <div className="bg-[#12121f] border-b border-gray-800 p-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-purple-400">⚙️ Fly Game Settings</h1>
          <div className="ml-auto text-sm text-gray-400">
            Admin: <span className="text-purple-400 font-bold">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`px-6 py-4 rounded-lg shadow-2xl backdrop-blur-sm border-l-4 ${
            toast.type === 'success'
              ? 'bg-green-900/80 border-green-500 text-green-100'
              : toast.type === 'error'
              ? 'bg-red-900/80 border-red-500 text-red-100'
              : 'bg-blue-900/80 border-blue-500 text-blue-100'
          }`}>
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800 pb-4 overflow-x-auto">
          {[
            { id: 'series', label: '📊 Crash Series' },
            { id: 'margins', label: '💰 Margins & Limits' },
            { id: 'automation', label: '🤖 Automation' },
            { id: 'stats', label: '📈 Stats' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#12121f] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CRASH SERIES */}
        {activeTab === 'series' && (
          <div className="space-y-6">
            {/* Current Round */}
            <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-4">🎯 Current Round</h2>
              <div className="text-6xl font-bold text-yellow-400">
                {crashSeries.length > 0 ? crashSeries[currentSeriesIndex]?.toFixed(2) : 'Not set'}x
              </div>
              <div className="text-gray-400 mt-2">
                Round {currentSeriesIndex + 1} of {crashSeries.length}
              </div>
            </div>

            {/* Bulk Add */}
            <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">📝 Add Crash Series (Bulk)</h2>
              <textarea
                value={crashSeriesInput}
                onChange={(e) => setCrashSeriesInput(e.target.value)}
                placeholder="Enter comma-separated crash points&#10;Example: 1.5, 2.5, 3.1, 1.8, 5.2, 2.1, 1.5"
                className="w-full bg-[#0a0a1a] border border-gray-700 rounded-lg p-4 text-white outline-none focus:border-purple-500 resize-none"
                rows="6"
              />
              <button
                onClick={saveCrashSeries}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Series
              </button>
            </div>

            {/* Quick Add */}
            <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">➕ Add Single Crash Point</h2>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="E.g., 2.50"
                  min="1.01"
                  step="0.01"
                  className="flex-1 bg-[#0a0a1a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCrashPoint(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  id="quickAddInput"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('quickAddInput');
                    addCrashPoint(input.value);
                    input.value = '';
                  }}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Crash Series List */}
            {crashSeries.length > 0 && (
              <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">📋 Series ({crashSeries.length} points)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {crashSeries.map((crash, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                        idx === currentSeriesIndex
                          ? 'bg-yellow-900/40 border-yellow-500'
                          : 'bg-[#0a0a1a] border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setCurrentRound(idx)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold text-yellow-400">
                          {crash.toFixed(2)}x
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">Round {idx + 1}</div>
                      {idx === currentSeriesIndex && (
                        <div className="mt-2 text-xs text-yellow-400 font-bold">🎯 CURRENT</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {crashSeries.length > 0 && (
              <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
                <div className="flex gap-3">
                  <button
                    onClick={proceedToNextRound}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold transition-colors"
                  >
                    ➡️ Next Round
                  </button>
                  <button
                    onClick={() => setCurrentRound(0)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition-colors"
                  >
                    ⏮️ Reset to Start
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MARGINS & LIMITS */}
        {activeTab === 'margins' && (
          <div className="space-y-6">
            <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-8">💰 Profit Margins & Limits</h2>

              <div className="space-y-8">
                {/* Profit Margin */}
                <div>
                  <label className="text-sm text-gray-400 mb-3 block">
                    Profit Margin: <span className="text-yellow-400 font-bold text-lg">{profitMargin}%</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#0a0a1a] rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    For every 100 KES bet, you keep {profitMargin} KES as profit
                  </p>
                </div>

                {/* Min Bet Threshold */}
                <div>
                  <label className="text-sm text-gray-400 mb-3 block">
                    Min Total Bets to Start: <span className="text-blue-400 font-bold text-lg">{minBetThreshold} KES</span>
                  </label>
                  <input
                    type="number"
                    value={minBetThreshold}
                    onChange={(e) => setMinBetThreshold(parseInt(e.target.value))}
                    className="w-full bg-[#0a0a1a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum total bets required before game can start
                  </p>
                </div>

                {/* Max Player Payout */}
                <div>
                  <label className="text-sm text-gray-400 mb-3 block">
                    Max Player Payout: <span className="text-green-400 font-bold text-lg">{maxPlayerPayoutPercent}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={maxPlayerPayoutPercent}
                    onChange={(e) => setMaxPlayerPayoutPercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#0a0a1a] rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum percentage of total bets that can be paid to winners
                  </p>
                </div>
              </div>

              <button
                onClick={saveAllSettings}
                className="mt-8 w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Margins & Limits
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: AUTOMATION */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold mb-8">🤖 Automation Settings</h2>

              <div className="space-y-8">
                {/* Auto Mode Toggle */}
                <div className="bg-[#0a0a1a] rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-gray-400">Auto Mode</label>
                      <p className="text-xs text-gray-500 mt-1">
                        {autoMode
                          ? `🤖 Automatically advancing every ${autoInterval}s`
                          : '⭕ Manual mode - advance manually'}
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoMode(!autoMode)}
                      className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                        autoMode
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {autoMode ? '✅ ENABLED' : '⭕ DISABLED'}
                    </button>
                  </div>
                </div>

                {/* Auto Interval */}
                {autoMode && (
                  <div>
                    <label className="text-sm text-gray-400 mb-3 block">
                      Interval Between Rounds: <span className="text-blue-400 font-bold text-lg">{autoInterval}s</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={autoInterval}
                      onChange={(e) => setAutoInterval(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#0a0a1a] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>10s</span>
                      <span>120s</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={saveAllSettings}
                className="mt-8 w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Automation
              </button>

              {autoMode && (
                <div className="mt-4 bg-green-900/30 border border-green-500/30 rounded-lg p-4 text-sm text-green-300">
                  ✅ Auto-mode is active. Rounds will advance automatically every {autoInterval} seconds.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2 font-bold">Total Bets</div>
                <div className="text-3xl font-bold text-blue-400">
                  {gameStats.totalBets?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mt-1">KES</div>
              </div>

              <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2 font-bold">Total Payouts</div>
                <div className="text-3xl font-bold text-green-400">
                  {gameStats.totalPayouts?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mt-1">KES</div>
              </div>

              <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2 font-bold">Rounds Played</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {gameStats.roundsPlayed || '0'}
                </div>
                <div className="text-xs text-gray-500 mt-1">games</div>
              </div>

              <div className="bg-[#12121f] rounded-lg p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2 font-bold">House Profit</div>
                <div className="text-3xl font-bold text-purple-400">
                  {((gameStats.totalBets || 0) - (gameStats.totalPayouts || 0)).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">KES</div>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-6">
              <p className="text-sm text-blue-300">
                📊 Statistics update in real-time as players place bets and cash out.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlyAdminDashboard;