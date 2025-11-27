import React, { useState } from 'react';
import { X, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const BetSettlementModal = ({ bet, user, onSettle, onClose, loading }) => {
  const [selectedResult, setSelectedResult] = useState(null);

  const handleSettle = async () => {
    if (!selectedResult) {
      alert('Please select a result');
      return;
    }
    await onSettle(bet.id, selectedResult);
  };

  const formatCurrency = (amount) => {
    return `KSH ${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-blue-500/30 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Settle Bet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Bet Details */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
          <p className="text-sm text-gray-400 mb-2">{bet.match}</p>
          <p className="text-white font-medium mb-1">{bet.outcome}</p>
          <p className="text-sm text-gray-400 mb-2">Stake: {formatCurrency(bet.amount)}</p>
          <p className="text-sm text-green-400">Potential Win: {formatCurrency(bet.potentialWin)}</p>
        </div>

        {/* Settlement Options */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelectedResult('won')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-start gap-3 ${
              selectedResult === 'won'
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-slate-900/50 border-slate-700/50 text-white hover:border-green-500/50'
            }`}
          >
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-bold">✓ Bet Won</p>
              <p className="text-sm text-gray-400">
                User receives: {formatCurrency(bet.potentialWin)}
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedResult('lost')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-start gap-3 ${
              selectedResult === 'lost'
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-slate-900/50 border-slate-700/50 text-white hover:border-red-500/50'
            }`}
          >
            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-bold">✗ Bet Lost</p>
              <p className="text-sm text-gray-400">
                Stake forfeited: {formatCurrency(bet.amount)}
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedResult('refund')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-start gap-3 ${
              selectedResult === 'refund'
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-slate-900/50 border-slate-700/50 text-white hover:border-blue-500/50'
            }`}
          >
            <RotateCcw className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-bold">↻ Refund Bet</p>
              <p className="text-sm text-gray-400">
                Return to user: {formatCurrency(bet.amount)}
              </p>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={!selectedResult || loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Settling...' : 'Settle Bet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BetSettlementModal;