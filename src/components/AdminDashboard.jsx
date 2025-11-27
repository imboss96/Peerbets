import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, TrendingUp, DollarSign, AlertCircle, Settings,
  Eye, EyeOff, Download, RefreshCw, Search, Filter,
  ChevronDown, ChevronUp, Zap, Lock, Unlock, Trash2,
  Edit2, Plus, Calendar, BarChart3, PieChart as PieChartIcon,
  Activity, Clock, CheckCircle, XCircle, User, Mail, Phone,
  CreditCard, Wallet, Gift, TrendingDown, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import AdminService from '../firebase/services/adminService';
import MaintenanceService from '../firebase/services/maintenanceService';
import WithdrawalService from '../firebase/services/withdrawalService';

const AdminDashboard = ({ user }) => {
  // Dashboard State
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7days');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Data States
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allBets, setAllBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [withdrawalStats, setWithdrawalStats] = useState(null);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Analytics
  const [chartData, setChartData] = useState([]);
  const [betDistribution, setBetDistribution] = useState([]);

  // Maintenance settings
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceEstimatedTime, setMaintenanceEstimatedTime] = useState('');

  // Real-time subscriptions
  const unsubscribeRef = React.useRef({});

  // Load Dashboard Data
  useEffect(() => {
    loadDashboardData();

    // Set up real-time listeners
    const unsubUsers = AdminService.subscribeToUsers((users) => {
      setAllUsers(users);
    });

    const unsubBets = AdminService.subscribeToBets((bets) => {
      setAllBets(bets);
      generateChartData(bets);
      generateBetDistribution(bets);
    });

    const unsubTransactions = AdminService.subscribeToTransactions((transactions) => {
      setTransactions(transactions);
    });

    const unsubWithdrawals = AdminService.subscribeToWithdrawals((withdrawals) => {
      setAllWithdrawals(withdrawals);
      calculateWithdrawalStats(withdrawals);
    });

    // Store unsubscribe functions
    unsubscribeRef.current = { unsubUsers, unsubBets, unsubTransactions, unsubWithdrawals };

    return () => {
      // Cleanup subscriptions
      unsubUsers();
      unsubBets();
      unsubTransactions();
      unsubWithdrawals();
    };
  }, []);

  // Reload metrics periodically
  useEffect(() => {
    const metricsInterval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(metricsInterval);
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load metrics
      const metricsResult = await AdminService.getDashboardMetrics(dateRange);
      if (metricsResult.success) {
        setDashboardMetrics(metricsResult.data);
      }

      // Load users
      const usersResult = await AdminService.getAllUsers();
      if (usersResult.success) {
        setAllUsers(usersResult.users);
      }

      // Load bets
      const betsResult = await AdminService.getAllBets(dateRange);
      if (betsResult.success) {
        setAllBets(betsResult.bets);
        generateChartData(betsResult.bets);
        generateBetDistribution(betsResult.bets);
      }

      // Load transactions
      const transactionsResult = await AdminService.getAllTransactions(dateRange);
      if (transactionsResult.success) {
        setTransactions(transactionsResult.transactions);
      }

      // Load financial data
      const financialResult = await AdminService.getFinancialData();
      if (financialResult.success) {
        setFinancialData(financialResult.data);
      }

      // Load system health
      const healthResult = await AdminService.getSystemHealth();
      if (healthResult.success) {
        setSystemHealth(healthResult.data);
      }

      // Load withdrawals
      const withdrawalsResult = await AdminService.getAllWithdrawals(dateRange);
      if (withdrawalsResult.success) {
        setAllWithdrawals(withdrawalsResult.withdrawals);
        calculateWithdrawalStats(withdrawalsResult.withdrawals);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (bets) => {
    const data = {};
    bets.forEach(bet => {
      const date = new Date(bet.timestamp).toLocaleDateString();
      if (!data[date]) {
        data[date] = { date, placed: 0, settled: 0, won: 0, lost: 0 };
      }
      data[date].placed++;
      if (bet.status === 'settled') {
        data[date].settled++;
        if (bet.result === 'won') data[date].won++;
        if (bet.result === 'lost') data[date].lost++;
      }
    });
    setChartData(Object.values(data).sort((a, b) => new Date(a.date) - new Date(b.date)));
  };

  const generateBetDistribution = (bets) => {
    const distribution = {
      pending: 0,
      settled: 0,
      won: 0,
      lost: 0,
      refunded: 0
    };
    bets.forEach(bet => {
      if (bet.result === 'won') distribution.won++;
      else if (bet.result === 'lost') distribution.lost++;
      else if (bet.result === 'refund') distribution.refunded++;
      else if (bet.status === 'settled') distribution.settled++;
      else distribution.pending++;
    });
    setBetDistribution([
      { name: 'Won', value: distribution.won, color: '#10b981' },
      { name: 'Lost', value: distribution.lost, color: '#ef4444' },
      { name: 'Refunded', value: distribution.refunded, color: '#3b82f6' },
      { name: 'Pending', value: distribution.pending, color: '#f59e0b' }
    ]);
  };

  const calculateWithdrawalStats = (withdrawals) => {
    const stats = {
      pendingCount: 0,
      completedCount: 0,
      failedCount: 0,
      totalCount: 0,
      totalPending: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalRequested: 0
    };
    withdrawals.forEach(w => {
      if (w.status === 'pending') {
        stats.pendingCount++;
        stats.totalPending += w.amount;
      } else if (w.status === 'completed') {
        stats.completedCount++;
        stats.totalCompleted += w.amount;
      } else if (w.status === 'failed') {
        stats.failedCount++;
        stats.totalFailed += w.amount;
      }
      stats.totalCount++;
      stats.totalRequested += w.amount;
    });
    setWithdrawalStats(stats);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    const n = Number(amount);
    const safe = Number.isFinite(n) ? n : 0;
    return `KSH ${safe.toLocaleString()}`;
  };

  const handleUserAction = async (action, userId) => {
    setConfirmAction({ action, userId });
    setShowConfirmModal(true);
  };

  const confirmUserAction = async () => {
    if (!confirmAction) return;

    try {
      let result;
      switch (confirmAction.action) {
        case 'suspend':
          result = await AdminService.suspendUser(confirmAction.userId);
          break;
        case 'unsuspend':
          result = await AdminService.unsuspendUser(confirmAction.userId);
          break;
        case 'delete':
          result = await AdminService.deleteUser(confirmAction.userId);
          break;
        default:
          break;
      }

      if (result.success) {
        alert(`✅ User ${confirmAction.action} successfully`);
        await loadDashboardData();
      } else {
        alert(`❌ Failed to ${confirmAction.action} user`);
      }
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleBetSettlement = async (betId, result) => {
    try {
      const settlementResult = await AdminService.settleBet(betId, result);
      if (settlementResult.success) {
        alert(`✅ Bet settled as ${result}`);
        await loadDashboardData();
        setShowBetModal(false);
        setSelectedBet(null);
      } else {
        alert(`❌ Failed to settle bet: ${settlementResult.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleMaintenanceToggle = async (isEnabled) => {
    try {
      if (isEnabled) {
        const result = await MaintenanceService.enableMaintenanceMode(
          'We are performing scheduled maintenance. Please check back soon.',
          null
        );
        if (result.success) {
          alert('✅ Maintenance mode enabled');
          await loadDashboardData();
        }
      } else {
        const result = await MaintenanceService.disableMaintenanceMode();
        if (result.success) {
          alert('✅ Maintenance mode disabled');
          await loadDashboardData();
        }
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const updateMaintenanceSettings = async () => {
    try {
      const result = await MaintenanceService.enableMaintenanceMode(
        maintenanceMessage,
        maintenanceEstimatedTime ? new Date(maintenanceEstimatedTime) : null
      );
      if (result.success) {
        alert('✅ Maintenance settings updated');
      } else {
        alert(`❌ Failed to update: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    const transactionRef = prompt('Enter transaction reference number:');
    if (!transactionRef) return;

    try {
      const result = await WithdrawalService.approveWithdrawal(withdrawalId, transactionRef);
      if (result.success) {
        alert('✅ Withdrawal approved successfully');
        await loadDashboardData();
      } else {
        alert(`❌ Failed to approve: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const result = await WithdrawalService.rejectWithdrawal(withdrawalId, reason);
      if (result.success) {
        alert('✅ Withdrawal rejected and balance refunded');
        await loadDashboardData();
      } else {
        alert(`❌ Failed to reject: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const filteredUsers = allUsers.filter(u =>
    (searchTerm === '' || u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || u.status === filterStatus)
  );

  const filteredBets = allBets.filter(b =>
    (searchTerm === '' || b.userId?.includes(searchTerm) || b.match?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || b.status === filterStatus)
  );

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: BarChart3 },
    { id: 'users', label: '👥 Users', icon: Users },
    { id: 'bets', label: '🎯 Bets', icon: TrendingUp },
    { id: 'transactions', label: '💳 Transactions', icon: CreditCard },
    { id: 'financial', label: '💰 Financial', icon: DollarSign },
    { id: 'system', label: '⚙️ System', icon: Settings },
    { id: 'withdrawals', label: '💸 Withdrawals', icon: ArrowDownLeft }
  ];

  // Metrics data
  const metricsData = [
    {
      label: 'Total Revenue',
      value: formatCurrency(dashboardMetrics?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'green',
      change: dashboardMetrics?.revenueChange
    },
    {
      label: 'Active Users',
      value: dashboardMetrics?.activeUsers || 0,
      icon: Users,
      color: 'blue',
      change: dashboardMetrics?.usersChange
    },
    {
      label: 'Bets Placed',
      value: dashboardMetrics?.betsPlaced || 0,
      icon: Activity,
      color: 'purple',
      change: dashboardMetrics?.betsChange
    },
    {
      label: 'Avg Bet Size',
      value: formatCurrency(dashboardMetrics?.avgBetSize || 0),
      icon: Wallet,
      color: 'orange',
      change: dashboardMetrics?.avgBetChange
    }
  ];

  // Transaction stats
  const transactionStats = [
    {
      label: 'Total Deposits',
      value: formatCurrency(dashboardMetrics?.totalDeposits || 0),
      icon: ArrowDownLeft,
      color: 'green'
    },
    {
      label: 'Total Withdrawals',
      value: formatCurrency(dashboardMetrics?.totalWithdrawals || 0),
      icon: ArrowUpRight,
      color: 'orange'
    },
    {
      label: 'Net Flow',
      value: formatCurrency((dashboardMetrics?.totalDeposits || 0) - (dashboardMetrics?.totalWithdrawals || 0)),
      icon: CreditCard,
      color: 'blue'
    }
  ];

  // Financial stats
  const financialStats = [
    {
      label: 'Commission Revenue',
      value: formatCurrency(financialData?.commissionRevenue || 0),
      icon: DollarSign,
      color: 'green'
    },
    {
      label: 'Total Payouts',
      value: formatCurrency(financialData?.totalPayouts || 0),
      icon: Wallet,
      color: 'orange'
    },
    {
      label: 'Escrow Balance',
      value: formatCurrency(financialData?.escrowBalance || 0),
      icon: Lock,
      color: 'blue'
    },
    {
      label: 'Profit Margin',
      value: `${financialData?.profitMargin || 0}%`,
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  // System services
  const systemServices = [
    { name: 'Database', status: systemHealth?.database || 'healthy', color: 'green' },
    { name: 'API Server', status: systemHealth?.api || 'healthy', color: 'green' },
    { name: 'Payment Gateway', status: systemHealth?.payment || 'healthy', color: 'green' },
    { name: 'Email Service', status: systemHealth?.email || 'healthy', color: 'green' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, bets, and financial operations</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-800 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="24hours">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-800/50 rounded-xl border border-blue-500/20 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto bg-slate-800/30 rounded-lg p-1 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricsData.map((metric, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-gray-400 text-sm">{metric.label}</p>
                      <div className={`bg-${metric.color}-500/20 p-2 rounded-lg`}>
                        <metric.icon className={`w-5 h-5 text-${metric.color}-400`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white mb-2">{metric.value}</p>
                    {metric.change !== undefined && (
                      <div className={`flex items-center gap-1 text-sm ${metric.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metric.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        {Math.abs(metric.change)}% from last period
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bets Timeline */}
                <div className="lg:col-span-2 bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Bets Timeline</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="placed" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="settled" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="won" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Bet Distribution */}
                <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Bet Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={betDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {betDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Bar Chart */}
              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Daily Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="placed" fill="#3b82f6" />
                    <Bar dataKey="settled" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-slate-800 border border-blue-500/30 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50 border-b border-blue-500/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">User</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredUsers.map((userData, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-white font-medium">{userData.username}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{userData.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{userData.phoneNumber}</td>
                          <td className="px-6 py-4 text-sm text-green-400 font-bold">{formatCurrency(userData.balance)}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              userData.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : userData.status === 'suspended'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {userData.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(userData.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(userData);
                                  setShowUserModal(true);
                                }}
                                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-3 py-1 rounded text-xs transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleUserAction(
                                  userData.status === 'suspended' ? 'unsuspend' : 'suspend',
                                  userData.uid
                                )}
                                className={`${
                                  userData.status === 'suspended'
                                    ? 'bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400'
                                    : 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400'
                                } px-3 py-1 rounded text-xs transition-colors`}
                              >
                                {userData.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BETS TAB */}
          {activeTab === 'bets' && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search bets..."
                    className="w-full bg-slate-800 border border-blue-500/30 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Bets</option>
                  <option value="pending">Pending</option>
                  <option value="settled">Settled</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50 border-b border-blue-500/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Match</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Market</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Potential Win</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Result</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredBets.slice(0, 20).map((bet, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-white font-medium">{bet.match}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{bet.market}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{formatCurrency(bet.amount)}</td>
                          <td className="px-6 py-4 text-sm text-green-400 font-bold">{formatCurrency(bet.potentialWin)}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              bet.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {bet.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              bet.result === 'won'
                                ? 'bg-green-500/20 text-green-400'
                                : bet.result === 'lost'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {bet.result || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(bet.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {bet.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setSelectedBet(bet);
                                  setShowBetModal(true);
                                }}
                                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-3 py-1 rounded text-xs transition-colors"
                              >
                                Settle
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {transactionStats.map((stat, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <div className={`bg-${stat.color}-500/20 p-2 rounded-lg`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50 border-b border-blue-500/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">User</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {transactions.slice(0, 20).map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-white font-medium">{tx.username}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              tx.type === 'deposit'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{formatCurrency(tx.amount)}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{tx.method}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              tx.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : tx.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FINANCIAL TAB */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {financialStats.map((stat, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <div className={`bg-${stat.color}-500/20 p-2 rounded-lg`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">System Health</h3>
                  <div className="space-y-3">
                    {systemServices.map((service, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <span className="text-gray-400">{service.name}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${service.color}-500/20 text-${service.color}-400`}>
                          {service.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Settings */}
                <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex-1">
                        <span className="text-gray-400 block text-sm">Maintenance Mode</span>
                        <p className="text-xs text-gray-500 mt-1">Redirect all users to maintenance page</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          onChange={(e) => handleMaintenanceToggle(e.checked)}
                          defaultChecked={systemHealth?.maintenance}
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Maintenance Mode Settings */}
                    {systemHealth?.maintenance && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                        <input
                          type="text"
                          placeholder="Maintenance message..."
                          value={maintenanceMessage}
                          onChange={(e) => setMaintenanceMessage(e.target.value)}
                          className="w-full bg-slate-900/50 border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                        />
                        <input
                          type="datetime-local"
                          value={maintenanceEstimatedTime}
                          onChange={(e) => setMaintenanceEstimatedTime(e.target.value)}
                          className="w-full bg-slate-900/50 border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                        />
                        <button
                          onClick={updateMaintenanceSettings}
                          className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                        >
                          Save Maintenance Settings
                        </button>
                      </div>
                    )}

                    {/* Other settings */}
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-gray-400">Enable 2FA</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WITHDRAWALS TAB */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-yellow-400">{withdrawalStats?.pendingCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">KSH {Number(withdrawalStats?.totalPending || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{withdrawalStats?.completedCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">KSH {Number(withdrawalStats?.totalCompleted || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{withdrawalStats?.failedCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">KSH {Number(withdrawalStats?.totalFailed || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Requested</p>
                  <p className="text-2xl font-bold text-blue-400">{withdrawalStats?.totalCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">KSH {Number(withdrawalStats?.totalRequested || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50 border-b border-blue-500/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">User</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {allWithdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-white font-medium">{withdrawal.username}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">KSH {Number(withdrawal.amount).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{withdrawal.phoneNumber}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              withdrawal.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : withdrawal.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {withdrawal.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                  className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 px-3 py-1 rounded text-xs transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                  className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-3 py-1 rounded text-xs transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-white mb-6">User Details</h3>
            <div className="space-y-4 mb-6">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Username</p>
                <p className="text-lg font-bold text-white">{selectedUser.username}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-lg text-white">{selectedUser.email}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Phone</p>
                <p className="text-lg text-white">{selectedUser.phoneNumber}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Balance</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(selectedUser.balance)}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Joined</p>
                <p className="text-lg text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  handleUserAction('delete', selectedUser.uid);
                }}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bet Settlement Modal */}
      {showBetModal && selectedBet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Settle Bet</h3>
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">{selectedBet.match}</p>
              <p className="text-lg font-bold text-white mb-2">{selectedBet.outcome}</p>
              <p className="text-sm text-gray-400">Amount: {formatCurrency(selectedBet.amount)}</p>
            </div>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleBetSettlement(selectedBet.id, 'won')}
                className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg font-bold transition-colors"
              >
                ✓ Mark as Won
              </button>
              <button
                onClick={() => handleBetSettlement(selectedBet.id, 'lost')}
                className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg font-bold transition-colors"
              >
                ✗ Mark as Lost
              </button>
              <button
                onClick={() => handleBetSettlement(selectedBet.id, 'refund')}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg font-bold transition-colors"
              >
                ↻ Refund Bet
              </button>
            </div>
            <button
              onClick={() => setShowBetModal(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Confirm Action</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to <span className="font-bold text-white">{confirmAction.action}</span> this user?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUserAction}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;