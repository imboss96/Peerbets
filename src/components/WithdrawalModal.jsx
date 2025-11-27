import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import WithdrawalService from '../firebase/services/withdrawalService';

const WithdrawalModal = ({ user, balance, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [accountName, setAccountName] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      const withdrawAmount = Number(amount);
      if (!withdrawAmount || withdrawAmount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (withdrawAmount > balance) {
        setError('Insufficient balance');
        setLoading(false);
        return;
      }

      if (!phoneNumber.trim()) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }

      if (!accountName.trim()) {
        setError('Account name is required');
        setLoading(false);
        return;
      }

      // Request withdrawal
      const result = await WithdrawalService.requestWithdrawal(
        user.uid,
        withdrawAmount,
        phoneNumber,
        accountName
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.(result);
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Withdrawal request failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-blue-500/30 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Request Withdrawal</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!success ? (
          <form onSubmit={handleWithdrawal} className="space-y-4">
            {/* Current Balance */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/20">
              <p className="text-xs text-gray-400 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-green-400">
                KSH {balance.toLocaleString()}
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Withdrawal Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  KSH
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="100"
                  max={balance}
                  step="100"
                  disabled={loading}
                  className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-12 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum: KSH 100</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                disabled={loading}
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Bank account holder name"
                disabled={loading}
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                ℹ️ Your withdrawal will be processed within 24-48 hours. You'll receive a confirmation email once it's completed.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !amount}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Request Withdrawal'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Withdrawal Requested!</h4>
            <p className="text-gray-400 text-sm mb-4">
              Your withdrawal request has been submitted successfully. You'll receive a confirmation email shortly.
            </p>
            <p className="text-xs text-gray-500">
              Processing time: 24-48 hours
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalModal;