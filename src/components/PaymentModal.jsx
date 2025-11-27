import React, { useState } from 'react';
import { X, Send, Wallet, TrendingDown } from 'lucide-react';
import PaymentService from '../services/PaymentService';

const PaymentModal = ({ user, type, onClose, onSuccess }) => {
  const [step, setStep] = useState('method'); // method, amount, confirm, processing
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  const isDeposit = type === 'deposit';
  const title = isDeposit ? 'Deposit Funds' : 'Withdraw Funds';
  const buttonColor = isDeposit ? 'green' : 'orange';

  const paymentMethods = [
    { id: 'mpesa', name: 'M-Pesa', icon: '📱', info: 'Instant via M-Pesa' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', info: 'Visa, Mastercard' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', info: '1-2 business days' }
  ];

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    setStep('amount');
  };

  const handleAmountConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (isDeposit && parseFloat(amount) > 100000) {
      setError('Maximum deposit is KSH 100,000');
      return;
    }
    if (!isDeposit && parseFloat(amount) > (user?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmTransaction = async () => {
    setLoading(true);
    setError('');
    setStep('processing');

    try {
      let result;
      if (isDeposit) {
        result = await PaymentService.processDeposit(
          user.uid,
          parseFloat(amount),
          paymentMethod,
          phoneNumber
        );
      } else {
        result = await PaymentService.processWithdrawal(
          user.uid,
          parseFloat(amount),
          paymentMethod,
          { phoneNumber }
        );
      }

      if (result.success) {
        setTransactionId(result.transactionId);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              transactionId: result.transactionId,
              amount: parseFloat(amount),
              type
            });
          }
          onClose();
        }, 3000);
      } else {
        setError(result.error);
        setStep('confirm');
      }
    } catch (err) {
      setError(err.message);
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-blue-500/20 rounded-xl max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-blue-500/20 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isDeposit ? <Wallet className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Payment Method */}
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Select Payment Method</p>
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full p-4 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-bold text-white">{method.name}</p>
                      <p className="text-xs text-gray-400">{method.info}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (KSH)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Quick amounts</p>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map(quickAmount => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className="p-2 bg-slate-800 hover:bg-blue-600 border border-slate-700 rounded text-sm font-medium text-white"
                    >
                      {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., 0712345678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleAmountConfirm}
                  className={`flex-1 px-4 py-2 bg-${buttonColor}-600 hover:bg-${buttonColor}-700 text-white rounded-lg font-medium`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="text-3xl font-bold text-white">KSH {parseFloat(amount).toLocaleString()}</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Method</span>
                  <span className="text-sm font-medium text-white capitalize">{paymentMethod}</span>
                </div>
                {phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Phone</span>
                    <span className="text-sm font-medium text-white">{phoneNumber}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmTransaction}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 bg-${buttonColor}-600 hover:bg-${buttonColor}-700 disabled:opacity-50 text-white rounded-lg font-medium`}
                >
                  {loading ? 'Processing...' : isDeposit ? 'Deposit' : 'Withdraw'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">💫</div>
              <p className="text-white font-bold mb-2">Processing {isDeposit ? 'Deposit' : 'Withdrawal'}</p>
              <p className="text-sm text-gray-400 mb-4">Please wait...</p>
              {transactionId && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                  <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                  <p className="text-sm font-mono text-green-400">{transactionId}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;