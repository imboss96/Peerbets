import React, { useEffect, useState } from 'react';
import { Trophy, PlusCircle, Trash2, Wallet } from 'lucide-react';
import AdminService from '../firebase/services/adminService';
import PieChart from './PieChart';

export default function AdminDashboard({ user }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ homeTeam: '', awayTeam: '', league: '', kickoff: '' });
  const [accounting, setAccounting] = useState({ totalProfit: 0, escrow: 0, totalBalances: 0 });
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedBets, setSelectedBets] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [settleAllLoading, setSettleAllLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const gamesResult = await AdminService.getGames();
    if (gamesResult.success) setGames(gamesResult.games || []);

    const acct = await AdminService.getAccountingSummary();
    if (acct.success) setAccounting(acct.data || {});

    const betsRes = await AdminService.getRecentBets();
    if (betsRes.success) setBets(betsRes.bets || []);

    const txRes = await AdminService.getTransactions();
    if (txRes.success) setTransactions(txRes.transactions || []);

    setLoading(false);
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.homeTeam || !form.awayTeam || !form.kickoff) {
      setError('Please fill required fields');
      return;
    }

    const result = await AdminService.addGame({
      ...form,
      status: 'upcoming',
      createdAt: new Date().toISOString()
    });

    if (result.success) {
      setForm({ homeTeam: '', awayTeam: '', league: '', kickoff: '' });
      loadData();
    } else {
      setError(result.error || 'Failed to add game');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this game?')) return;
    const res = await AdminService.deleteGame(id);
    if (res.success) loadData();
  };

  const handleSettle = async (betId, status) => {
    if (!window.confirm(`Settle bet ${betId} as ${status}?`)) return;
    const res = await AdminService.settleBet(betId, status);
    if (res.success) {
      await loadData();
      alert('Bet settled');
    } else {
      alert('Failed to settle: ' + res.error);
    }
  };

  const toggleSelect = (betId) => {
    const next = new Set(selectedBets);
    if (next.has(betId)) next.delete(betId); else next.add(betId);
    setSelectedBets(next);
  };

  const selectAllVisible = (visibleBets) => {
    const next = new Set(selectedBets);
    let added = 0;
    visibleBets.forEach(b => { if (!next.has(b.id)) { next.add(b.id); added++; } });
    if (added === 0) {
      // if already all selected, clear
      setSelectedBets(new Set());
    } else {
      setSelectedBets(next);
    }
  };

  const handleBulkSettle = async (status) => {
    if (selectedBets.size === 0) { alert('No bets selected'); return; }
    if (!window.confirm(`Settle ${selectedBets.size} bets as ${status}?`)) return;
    setBulkLoading(true);
    const ids = Array.from(selectedBets);
    const results = [];
    for (const id of ids) {
      // call settleBet sequentially to avoid rate issues
      // each call returns { success }
      // eslint-disable-next-line no-await-in-loop
      const res = await AdminService.settleBet(id, status);
      results.push({ id, ...res });
    }
    setBulkLoading(false);
    // refresh dashboard
    await loadData();
    setSelectedBets(new Set());
    const failed = results.filter(r => !r.success);
    if (failed.length === 0) {
      alert(`All ${ids.length} bets settled as ${status}`);
    } else {
      alert(`${failed.length} of ${ids.length} failed. Check console for details.`);
      console.error('Bulk settle failures', failed);
    }
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-xl border border-blue-500/20">
        <p className="text-gray-300">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-sm text-gray-400">Manage games and view accounting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-lg border border-blue-500/20">
          <h3 className="text-sm text-gray-300 mb-2">Accounting Summary</h3>
          <div className="space-y-3">
            <PieChart slices={[
              { label: 'Profit', value: accounting.totalProfit || accounting.totalProfit === 0 ? accounting.totalProfit : 0, color: '#16a34a' },
              { label: 'Payouts', value: accounting.totalPayouts || 0, color: '#ef4444' },
              { label: 'Escrow', value: accounting.totalEscrow || accounting.escrow || 0, color: '#3b82f6' }
            ]} />

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Profit</span>
                <span className="font-bold text-white">KSH {Number(accounting.totalProfit || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Escrow</span>
                <span className="font-bold text-white">KSH {Number(accounting.totalEscrow || accounting.escrow || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Balances</span>
                <span className="font-bold text-white">KSH {Number(accounting.totalBalances || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-lg border border-blue-500/20">
          <h3 className="text-lg text-white font-semibold mb-3">Add Game</h3>
          <form onSubmit={handleAddGame} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={form.homeTeam} onChange={(e)=>setForm({...form, homeTeam:e.target.value})} placeholder="Home Team" className="px-3 py-2 rounded-lg bg-slate-900/50 text-white w-full" />
              <input value={form.awayTeam} onChange={(e)=>setForm({...form, awayTeam:e.target.value})} placeholder="Away Team" className="px-3 py-2 rounded-lg bg-slate-900/50 text-white w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={form.league} onChange={(e)=>setForm({...form, league:e.target.value})} placeholder="League" className="px-3 py-2 rounded-lg bg-slate-900/50 text-white w-full" />
              <input value={form.kickoff} onChange={(e)=>setForm({...form, kickoff:e.target.value})} placeholder="Kickoff (ISO)" className="px-3 py-2 rounded-lg bg-slate-900/50 text-white w-full" />
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="flex gap-2">
              <button className="bg-green-600 px-4 py-2 rounded-lg text-white flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Add Game</button>
            </div>
          </form>

          <hr className="my-4 border-slate-700" />

          <h3 className="text-lg text-white font-semibold mb-3">Games</h3>
          {loading ? <div className="text-gray-400">Loading...</div> : (
            <div className="space-y-2">
              {games.map(g => (
                <div key={g.id} className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg">
                  <div>
                    <div className="font-medium text-white">{g.homeTeam} vs {g.awayTeam}</div>
                    <div className="text-xs text-gray-400">{g.league} • {new Date(g.kickoff).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>handleDelete(g.id)} className="p-2 rounded-md bg-red-600/20 text-red-400"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-slate-800/50 p-4 rounded-lg border border-blue-500/20">
        <h3 className="text-lg text-white font-semibold mb-3">Unsettled Bets</h3>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => selectAllVisible(bets.filter(b => !['won','lost','void'].includes(b.status)))} className="px-3 py-1 bg-slate-700 rounded text-white text-sm">Toggle Select Visible</button>
            <button onClick={async () => {
              if (!window.confirm('Settle ALL pending ColorStake bets now? This will randomly mark each as won or lost.')) return;
              setSettleAllLoading(true);
              const res = await AdminService.bulkSettleColorStakes();
              setSettleAllLoading(false);
              if (res.success) {
                alert(`Settled ${res.settled} ColorStake bets`);
                await loadData();
              } else {
                alert('Bulk settle failed: '+res.error);
              }
            }} className="px-3 py-1 bg-indigo-600 rounded text-white text-sm">Settle All ColorStake</button>
            <div className="text-sm text-gray-400">Selected: {selectedBets.size}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkSettle('won')} disabled={bulkLoading || selectedBets.size===0} className="px-3 py-1 bg-green-600 rounded text-white text-sm">Settle Won</button>
            <button onClick={() => handleBulkSettle('lost')} disabled={bulkLoading || selectedBets.size===0} className="px-3 py-1 bg-red-600 rounded text-white text-sm">Settle Lost</button>
            <button onClick={() => handleBulkSettle('void')} disabled={bulkLoading || selectedBets.size===0} className="px-3 py-1 bg-yellow-600 rounded text-white text-sm">Void / Refund</button>
          </div>
        </div>

        {bets.filter(b => !['won','lost','void'].includes(b.status)).length === 0 ? (
          <p className="text-gray-400">No unsettled bets</p>
        ) : (
          <div className="space-y-2">
            {bets.filter(b => !['won','lost','void'].includes(b.status)).map(b => (
              <div key={b.id} className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedBets.has(b.id)} onChange={() => toggleSelect(b.id)} className="w-4 h-4" />
                  <div>
                    <div className="font-medium text-white">{b.match || (b.homeTeam + ' vs ' + b.awayTeam)}</div>
                    <div className="text-xs text-gray-400">{b.market} • {b.outcome} • {new Date(b.timestamp || b.settledAt || Date.now()).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Stake</div>
                    <div className="font-bold text-white">KSH {Number(b.amount || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Status: {b.status}</div>
                  </div>
                  <div className="flex flex-col gap-1 ml-3">
                    <button onClick={() => handleSettle(b.id, 'won')} className="px-2 py-1 bg-green-600 rounded text-white text-sm">Settle Won</button>
                    <button onClick={() => handleSettle(b.id, 'lost')} className="px-2 py-1 bg-red-600 rounded text-white text-sm">Settle Lost</button>
                    <button onClick={() => handleSettle(b.id, 'void')} className="px-2 py-1 bg-yellow-600 rounded text-white text-sm">Void / Refund</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {bulkLoading && <div className="mt-2 text-sm text-gray-300">Processing bulk settle...</div>}
      </div>

      <div className="mt-6 bg-slate-800/50 p-4 rounded-lg border border-blue-500/20">
        <h3 className="text-lg text-white font-semibold mb-3">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400">No transactions yet</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg">
                <div>
                  <div className="text-sm text-gray-300">{t.type.toUpperCase()}</div>
                  <div className="text-xs text-gray-400">Bet: {t.betId} • User: {t.userId}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">KSH {Number(t.amount || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{t.settledBy || t.settledByUid || ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
