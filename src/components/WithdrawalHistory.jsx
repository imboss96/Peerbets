import React, { useState, useEffect } from 'react';
import { Download, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import WithdrawalService from '../firebase/services/withdrawalService';

const WithdrawalHistory = ({ userId }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  useEffect(() => {
    loadWithdrawals();
  }, [userId]);

  const loadWithdrawals = async () => {
    setLoading(true);
    const result = await WithdrawalService.getUserWithdrawals(userId);
    if (result.success) {
      setWithdrawals(result.withdrawals);
    }
    setLoading(false);
  };

  const handleCancel = async (withdrawalId) => {
    if (window.confirm('Are you sure you want to cancel this withdrawal?')) {
      const result = await WithdrawalService.cancelWithdrawal(withdrawalId);
      if (result.success) {
        alert('✅ Withdrawal cancelled successfully');
        await loadWithdrawals();
      } else {
        alert(`❌ ${result.error}`);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">Withdrawal History</h3>

      {withdrawals.length === 0 ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-lg">
          <p className="text-gray-400">No withdrawals yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    KSH {Number(withdrawal.amount).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(withdrawal.requestedAt).toLocaleDateString()}
                  </p>
                  {withdrawal.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(withdrawal.id)}
                      className="text-xs bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-2 py-1 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p>{withdrawal.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Account</p>
                  <p>{withdrawal.accountName}</p>
                </div>
              </div>

              {withdrawal.failureReason && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded p-2">
                  <p className="text-xs text-red-300">
                    <strong>Reason:</strong> {withdrawal.failureReason}
                  </p>
                </div>
              )}

              {withdrawal.transactionReference && (
                <div className="mt-3 text-xs text-green-400">
                  <strong>Ref:</strong> {withdrawal.transactionReference}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;