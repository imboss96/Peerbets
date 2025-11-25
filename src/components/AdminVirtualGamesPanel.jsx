import React, { useState, useEffect } from 'react';
import { Settings, RotateCcw, Zap } from 'lucide-react';
import VirtualGameAdminService from '../services/VirtualGameAdminService';

const AdminVirtualGamesPanel = ({ user, onClose }) => {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchConfig();
      fetchStats();
    }
  }, [user?.isAdmin]);

  const fetchConfig = async () => {
    const result = await VirtualGameAdminService.getVirtualGameConfig();
    if (result.success) {
      setConfig(result.data);
    }
  };

  const fetchStats = async () => {
    const flyStats = await VirtualGameAdminService.getPendingBetsStats('fly');
    const colorStats = await VirtualGameAdminService.getPendingBetsStats('colorstake');
    
    if (flyStats.success) {
      setStats(prev => ({ ...prev, fly: flyStats.data }));
    }
    if (colorStats.success) {
      setStats(prev => ({ ...prev, colorstake: colorStats.data }));
    }
  };

  const handleToggleAutoComplete = async (gameType) => {
    setLoading(true);
    const currentState = config?.games?.[gameType]?.autoComplete || false;
    const result = await VirtualGameAdminService.setAutoCompleteConfig(gameType, !currentState, 30);
    setLoading(false);

    if (result.success) {
      alert(result.message);
      await fetchConfig();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleManualComplete = async (gameType) => {
    setLoading(true);
    const result = await VirtualGameAdminService.autoCompletePendingBets(gameType);
    setLoading(false);

    if (result.success) {
      alert(`✅ ${result.message}`);
      await fetchStats();
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  if (!user?.isAdmin) {
    return <div className="text-red-400">Admin access required</div>;
  }

  const games = ['fly', 'colorstake'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-xl max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-purple-500/20 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Virtual Games Admin Control
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {games.map(gameType => (
            <div key={gameType} className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white capitalize">{gameType}</h3>
                <button
                  onClick={() => handleToggleAutoComplete(gameType)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    config?.games?.[gameType]?.autoComplete
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white disabled:opacity-50`}
                >
                  {config?.games?.[gameType]?.autoComplete ? '✓ Auto-Complete ON' : 'Auto-Complete OFF'}
                </button>
              </div>

              {stats[gameType] && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">Pending Bets</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats[gameType].pendingBetsCount}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">Total Stake</p>
                    <p className="text-xl font-bold text-blue-400">
                      KSH {stats[gameType].totalStake.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">Potential Payout</p>
                    <p className="text-xl font-bold text-green-400">
                      KSH {stats[gameType].totalPotentialWin.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">Risk</p>
                    <p className={`text-xl font-bold ${stats[gameType].totalRisk > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {stats[gameType].totalRisk > 0 ? '+' : '-'}KSH {Math.abs(stats[gameType].totalRisk).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleManualComplete(gameType)}
                disabled={loading || stats[gameType]?.pendingBetsCount === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Complete All Pending Bets
              </button>

              {config?.games?.[gameType]?.autoComplete && (
                <p className="text-xs text-green-300 mt-2">
                  ✓ Auto-completing every {config.games[gameType].completionIntervalSeconds}s
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminVirtualGamesPanel;