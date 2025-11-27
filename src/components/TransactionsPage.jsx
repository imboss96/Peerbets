import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, RefreshCw, DollarSign } from 'lucide-react';
import TransactionService from '../firebase/services/transactionService';

const TransactionsPage = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, [user?.uid]);

  const loadTransactions = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Load transactions
      const txResult = await TransactionService.getUserTransactions(user.uid);
      console.log('📊 Transactions loaded:', txResult);
      
      if (txResult.success) {
        setTransactions(txResult.transactions);
      }

      // Load stats
      const statsResult = await TransactionService.getTransactionStats(user.uid);
      console.log('📈 Stats loaded:', statsResult);
      
      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
    
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    const n = Number(amount);
    const safe = Number.isFinite(n) ? n : 0;
    return `KSH ${safe.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const getTransactionIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'deposit':
        return <ArrowDown className="w-4 h-4 text-green-400" />;
      case 'withdrawal':
      case 'withdraw':
        return <ArrowUp className="w-4 h-4 text-red-400" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'deposit':
        return 'bg-green-500/10 border-green-500/30';
      case 'withdrawal':
      case 'withdraw':
        return 'bg-red-500/10 border-red-500/30';
      case 'refund':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getTransactionLabel = (type) => {
    switch(type?.toLowerCase()) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
      case 'withdraw':
        return 'Withdrawal';
      case 'refund':
        return 'Refund';
      default:
        return 'Transaction';
    }
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type?.toLowerCase() === filter?.toLowerCase());

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">💳 Transaction History</h2>
        <button
          onClick={loadTransactions}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Deposits */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-green-300 font-medium">Total Deposits</p>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <ArrowDown className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-2">{formatCurrency(stats.totalDeposits)}</p>
            <p className="text-xs text-green-300">{stats.depositCount} transaction{stats.depositCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Withdrawals */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-red-300 font-medium">Total Withdrawals</p>
              <div className="bg-red-500/20 p-3 rounded-lg">
                <ArrowUp className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-2">{formatCurrency(stats.totalWithdrawals)}</p>
            <p className="text-xs text-red-300">{stats.withdrawalCount} transaction{stats.withdrawalCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Refunds */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-blue-300 font-medium">Total Refunds</p>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-2">{formatCurrency(stats.totalRefunds)}</p>
            <p className="text-xs text-blue-300">{stats.refundCount} transaction{stats.refundCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All Transactions' },
          { id: 'deposit', label: 'Deposits' },
          { id: 'withdrawal', label: 'Withdrawals' },
          { id: 'refund', label: 'Refunds' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Debug Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          Debug: {filteredTransactions.length} transactions | Total: {transactions.length}
        </p>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No transactions found</p>
          <p className="text-gray-500 text-sm">
            {filter === 'all' 
              ? 'Your transactions will appear here' 
              : `No ${filter} transactions yet`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`${getTransactionColor(tx.type)} border rounded-lg p-4 hover:border-blue-500/50 transition-colors`}
            >
              <div className="flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-slate-900/50 p-3 rounded-lg">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-2">
                      {getTransactionLabel(tx.type)}
                      {tx.status && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          tx.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : tx.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.status?.toUpperCase()}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.method && `via ${tx.method.toUpperCase()}`}
                      {tx.phoneNumber && ` • ${tx.phoneNumber}`}
                      {tx.transactionId && ` • ID: ${tx.transactionId}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(tx.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Right Side - Amount */}
                <div className="text-right min-w-fit ml-4">
                  <p className={`text-lg font-bold ${
                    tx.type?.toLowerCase() === 'deposit' || tx.type?.toLowerCase() === 'refund'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {tx.type?.toLowerCase() === 'deposit' || tx.type?.toLowerCase() === 'refund' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;