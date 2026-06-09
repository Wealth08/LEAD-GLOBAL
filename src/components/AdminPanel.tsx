import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, CheckCircle, XCircle, ShieldAlert, VolumeX, Megaphone,
  TrendingUp, Settings, FileText, ArrowLeft, RotateCw, Clock,
  Briefcase, Sliders, AlertCircle, Download, RefreshCw, MessageSquare, Send, Image,
} from 'lucide-react';
import { dbService, PLANS, uploadImage } from '../supabaseMock';
import { UserProfile, Transaction, TaskLog, SupportTicket, InvestmentPlanId } from '../types';

interface AdminPanelProps {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'admin', payload?: any) => void;
}

// ─── Admin Image Upload ───────────────────────────────────────────────────────
function AdminImageUpload({ bucket, onUploaded }: { bucket: 'deposits' | 'kyc' | 'tasks' | 'support'; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url } = await uploadImage(file, bucket);
    setUploading(false);
    if (url) { setUploaded(true); onUploaded(url); }
  };

  return (
    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/10 hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] rounded-lg transition text-[9px] font-mono uppercase">
      <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : uploaded ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Image className="w-3 h-3" />}
      <span>{uploading ? 'Uploading…' : uploaded ? 'Attached' : 'Attach Image'}</span>
    </label>
  );
}

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected user — full field editor
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    walletBalance: '0',
    status: 'Active' as 'Active' | 'Pending Verification' | 'Banned',
    isEmailVerified: true,
    activePlanId: '' as InvestmentPlanId | '',
    planAccumulatedEarnings: '0',
    dailyEarningsAccumulated: '0',
    referralEarningsAccumulated: '0',
    totalDeposited: '0',
    withdrawnAmount: '0',
    customNotice: '',
  });

  // Support tickets
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminReplyImageUrl, setAdminReplyImageUrl] = useState('');
  const [announcementImageUrl, setAnnouncementImageUrl] = useState('');

  const [rejectReason, setRejectReason] = useState('Screenshot is blurry or hash does not match.');
  const [kycRejectReason, setKycRejectReason] = useState('Document cropped or selfie does not match ID.');

  const [simulateDays, setSimulateDays] = useState(5);
  const [announcementText, setAnnouncementText] = useState('');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  const [adminTab, setAdminTab] = useState<
    'users' | 'deposits' | 'withdrawals' | 'kyc_docs' | 'tasks_verify' | 'broadcast' | 'transactions' | 'support'
  >('users');

  // Toast & loading action key
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // CSV Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'deposit' | 'withdrawal' | 'earning' | 'referral_bonus' | 'kyc_fee'
  >('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>(
    'all'
  );

  // ── Data Loading ────────────────────────────────────────────────────────────
  const refreshAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [u, t, tl, tk] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getAllTransactions(),
        dbService.getAllTaskLogs(),
        dbService.getSupportTickets(),
      ]);
      setUsers(u);
      setTransactions(t);
      setTaskLogs(tl);
      setTickets(tk);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setActionLoading(key);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const selectUserForEdit = (u: UserProfile) => {
    setSelectedUserId(u.id);
    setEditFields({
      walletBalance: u.walletBalance.toString(),
      status: u.status,
      isEmailVerified: u.isEmailVerified,
      activePlanId: (u.activePlanId ?? '') as InvestmentPlanId | '',
      planAccumulatedEarnings: u.planAccumulatedEarnings.toString(),
      dailyEarningsAccumulated: u.dailyEarningsAccumulated.toString(),
      referralEarningsAccumulated: u.referralEarningsAccumulated.toString(),
      totalDeposited: u.totalDeposited.toString(),
      withdrawnAmount: u.withdrawnAmount.toString(),
      customNotice: (u as any).customNotice || '',
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    await withLoading('edit_user', async () => {
      const res = await dbService.adminAdjustUserFields(selectedUserId, {
        walletBalance: parseFloat(editFields.walletBalance) || 0,
        isEmailVerified: editFields.isEmailVerified,
        status: editFields.status,
        activePlanId: (editFields.activePlanId || null) as InvestmentPlanId | null,
        planAccumulatedEarnings: parseFloat(editFields.planAccumulatedEarnings) || 0,
        dailyEarningsAccumulated: parseFloat(editFields.dailyEarningsAccumulated) || 0,
        referralEarningsAccumulated: parseFloat(editFields.referralEarningsAccumulated) || 0,
        totalDeposited: parseFloat(editFields.totalDeposited) || 0,
        withdrawnAmount: parseFloat(editFields.withdrawnAmount) || 0,
        customNotice: editFields.customNotice,
      });
      if (res.success) { showToastMsg(res.message); setSelectedUserId(null); await refreshAdminData(); }
      else { showToastMsg(res.message); }
    });
  };

  const handleApproveDeposit = async (txId: string) => {
    await withLoading(`approve_dep_${txId}`, async () => {
      const res = await dbService.adminApproveDeposit(txId);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleRejectDeposit = async (txId: string) => {
    await withLoading(`reject_dep_${txId}`, async () => {
      const res = await dbService.adminRejectDeposit(txId, rejectReason);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleApproveWithdrawal = async (txId: string) => {
    await withLoading(`approve_wd_${txId}`, async () => {
      const res = await dbService.adminApproveWithdrawal(txId);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleRejectWithdrawal = async (txId: string) => {
    await withLoading(`reject_wd_${txId}`, async () => {
      const res = await dbService.adminRejectWithdrawal(txId, rejectReason);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleApproveKYC = async (userId: string) => {
    await withLoading(`approve_kyc_${userId}`, async () => {
      const res = await dbService.adminApproveKYC(userId);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleRejectKYC = async (userId: string) => {
    await withLoading(`reject_kyc_${userId}`, async () => {
      const res = await dbService.adminRejectKYC(userId, kycRejectReason);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleApproveTaskLog = async (logId: string) => {
    await withLoading(`approve_task_${logId}`, async () => {
      const res = await dbService.adminApproveTaskLog(logId);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleRejectTaskLog = async (logId: string) => {
    await withLoading(`reject_task_${logId}`, async () => {
      const res = await dbService.adminRejectTaskLog(logId);
      showToastMsg(res.message);
      await refreshAdminData();
    });
  };

  const handleTriggerBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    await withLoading('broadcast', async () => {
      await dbService.adminPostAnnouncement(announcementText, announcementImageUrl || undefined);
      showToastMsg('Announcement dispatched to all users!');
      setAnnouncementText(''); setAnnouncementImageUrl('');
    });
  };

  const handleAdminTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !adminReplyText) return;
    await withLoading('admin_reply', async () => {
      const res = await dbService.replyToTicket(selectedTicketId, adminReplyText, 'admin', adminReplyImageUrl || undefined);
      if (res.success) { setAdminReplyText(''); setAdminReplyImageUrl(''); await refreshAdminData(); showToastMsg('Reply sent.'); }
      else { showToastMsg(res.message); }
    });
  };

  const handleCloseTicket = async (ticketId: string) => {
    await withLoading(`close_${ticketId}`, async () => {
      await dbService.closeTicket(ticketId);
      showToastMsg('Ticket marked as resolved.');
      await refreshAdminData();
    });
  };

  const handleSimulatePassage = async () => {
    await withLoading('simulate', async () => {
      const res = await dbService.simulateWeekdaysPassage(simulateDays);
      setSimulationLogs(res.details);
      showToastMsg(
        `Fast-forwarded ${simulateDays} weekday${simulateDays > 1 ? 's' : ''} — $${res.creditTotal.toFixed(2)} distributed globally!`
      );
      await refreshAdminData();
    });
  };

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleDownloadCSV = (onlyFiltered: boolean) => {
    const list = onlyFiltered ? filteredTransactions : transactions;
    const headers = [
      'Transaction ID',
      'User Email',
      'User ID',
      'Type',
      'Amount ($)',
      'Status',
      'Date',
      'Receipt ID',
      'TX Hash / Reference',
      'Bank Details',
      'Rejection Reason',
    ];

    const escape = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const rows = list.map((tx) => [
      escape(tx.id),
      escape(tx.userEmail),
      escape(tx.userId),
      escape(tx.type),
      escape(tx.amount),
      escape(tx.status),
      escape(tx.date),
      escape(tx.receiptId),
      escape(tx.txHash || ''),
      escape(tx.bankDetails || ''),
      escape(tx.rejectionReason || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leadsglobal_transactions_${onlyFiltered ? 'filtered' : 'all'}_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg(`${onlyFiltered ? 'Filtered' : 'All'} transactions exported to CSV.`);
  };

  // ── Derived Lists ───────────────────────────────────────────────────────────
  const pendingDepositsList = transactions.filter(
    (t) => t.type === 'deposit' && t.status === 'pending'
  );
  const pendingWithdrawalsList = transactions.filter(
    (t) => t.type === 'withdrawal' && t.status === 'pending'
  );
  const pendingKYCUsersList = users.filter((u) => u.kycStatus === 'Pending');
  const pendingTasksList = taskLogs.filter((t) => t.status === 'pending');

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      t.userEmail.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.receiptId.toLowerCase().includes(q) ||
      (t.txHash && t.txHash.toLowerCase().includes(q)) ||
      (t.bankDetails && t.bankDetails.toLowerCase().includes(q));

    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchQuery && matchType && matchStatus;
  });

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0C0C0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Loading admin ledger…
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      id="admin-view"
      className="min-h-screen bg-[#0C0C0D] text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-16"
    >
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C170E] border-2 border-[#D4AF37] text-[#D4AF37] p-4 rounded-xl flex items-center gap-2 animate-bounce shadow-2xl">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-mono font-bold uppercase">{toastMsg}</p>
        </div>
      )}

      {/* ── Admin Header ── */}
      <header className="bg-[#111112] border-b border-red-500/20 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="back-to-dashboard-btn"
              onClick={() => onNavigate('dashboard')}
              className="p-2 bg-white/[0.02] border border-white/[0.08] hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] rounded-full transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-red-400" />
                <h1 className="text-sm font-extrabold uppercase font-mono tracking-widest text-white">
                  LEADSGLOBAL CORE ADMIN DECKS
                </h1>
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                Manage deposits, KYC, withdrawals, tasks, and global simulations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono select-none">
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-gray-400">
              Users: <strong className="text-white">{users.length}</strong>
            </span>
            <span className="bg-red-950/20 border border-red-500/20 px-3 py-1 rounded-lg text-red-300">
              Pending Deposits:{' '}
              <strong className="text-white">{pendingDepositsList.length}</strong>
            </span>
            <span className="bg-[#1C170E] border border-[#D4AF37]/20 px-3 py-1 rounded-lg text-[#D4AF37]">
              Pending Withdrawals:{' '}
              <strong className="text-white">{pendingWithdrawalsList.length}</strong>
            </span>
            <button
              onClick={refreshAdminData}
              disabled={!!actionLoading}
              className="p-2 border border-white/10 rounded-lg hover:border-[#D4AF37] text-gray-400 hover:text-[#D4AF37] transition"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid lg:grid-cols-12 gap-8">

        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Navigation */}
          <div className="bg-[#111112] p-4 rounded-2xl border border-white/[0.04]">
            <h3 className="text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-3 block">
              LEDGER DIRECTORIES
            </h3>

            <nav className="flex flex-col gap-1.5 font-mono text-xs">
              {[
                { id: 'users', label: 'Users Ledger Directory', badge: users.length.toString(), badgeColor: 'text-gray-400' },
                { id: 'deposits', label: 'Deposit Verification', badge: pendingDepositsList.length > 0 ? pendingDepositsList.length.toString() : null, badgeColor: 'bg-red-900 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] animate-pulse' },
                { id: 'withdrawals', label: 'Payout Wire Dispersal', badge: pendingWithdrawalsList.length > 0 ? pendingWithdrawalsList.length.toString() : null, badgeColor: 'bg-amber-900 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]' },
                { id: 'kyc_docs', label: 'KYC Identity Audits', badge: pendingKYCUsersList.length > 0 ? pendingKYCUsersList.length.toString() : null, badgeColor: 'bg-sky-900 text-sky-200 rounded px-1.5 text-[8px]' },
                { id: 'tasks_verify', label: 'Promo Tasks Logs', badge: pendingTasksList.length > 0 ? '●' : null, badgeColor: 'text-red-400 animate-pulse font-bold text-sm' },
                { id: 'support', label: 'Support Helpdesk', badge: tickets.filter(t => t.status === 'open').length > 0 ? tickets.filter(t => t.status === 'open').length.toString() : null, badgeColor: 'bg-purple-900 text-purple-200 rounded px-1.5 text-[8px] animate-pulse' },
                { id: 'broadcast', label: 'Bulletins & Broadcasts', badge: 'Live', badgeColor: 'text-emerald-400 text-[8px] font-bold' },
                { id: 'transactions', label: 'Payment Ledger History', badge: `(${transactions.length})`, badgeColor: 'text-gray-500' },
              ].map((nav) => (
                <button
                  key={nav.id}
                  onClick={() => setAdminTab(nav.id as any)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl transition uppercase flex items-center justify-between ${
                    adminTab === nav.id
                      ? 'bg-[#1E190F] border border-[#D4AF37]/30 text-[#D4AF37]'
                      : 'hover:bg-white/[0.01] text-gray-400'
                  }`}
                >
                  <span>{nav.label}</span>
                  {nav.badge && (
                    <span className={nav.badgeColor}>{nav.badge}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Time Accelerator Widget */}
          <div className="bg-[#1C170E] border border-[#D4AF37]/20 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Investment Fast-Forward</span>
            </h4>
            <p className="text-[10px] text-gray-400 leading-normal">
              Simulate {simulateDays} business weekday{simulateDays > 1 ? 's' : ''} passing
              globally. Updates all active investor returns. Weekends auto-excluded.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center bg-[#0C0C0D] p-2 rounded border border-[#D4AF37]/10 font-mono text-[11px] text-white">
                <span>DAYS TO SIMULATE:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={simulateDays}
                  onChange={(e) => setSimulateDays(Number(e.target.value))}
                  className="w-12 bg-transparent text-right font-bold focus:outline-none text-[#D4AF37] border-b border-[#D4AF37]"
                />
              </div>

              <button
                onClick={handleSimulatePassage}
                disabled={actionLoading === 'simulate'}
                className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black font-extrabold text-[10px] uppercase tracking-wider transition font-mono shadow-md hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading === 'simulate' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Inject Weekday Returns'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="lg:col-span-9 space-y-6">

          {/* ── TAB: USERS ── */}
          {adminTab === 'users' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03]">
                <h3 className="text-base font-bold">Users Ledger Database</h3>
                <p className="text-xs text-gray-400">
                  View balances, audit verification status, freeze or adjust wallet sums.
                </p>
              </div>

              {/* Inline user editor */}
              {selectedUserId && (
                <form onSubmit={handleUpdateUser} className="p-4 bg-[#1C170E] rounded-2xl border border-[#D4AF37]/30 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#D4AF37] uppercase">Editing: {users.find(u => u.id === selectedUserId)?.email}</span>
                    <button type="button" onClick={() => setSelectedUserId(null)} className="text-gray-400 hover:text-white text-[10px] uppercase">Close</button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Wallet Balance ($)', key: 'walletBalance' },
                      { label: 'Plan Accumulated Earnings ($)', key: 'planAccumulatedEarnings' },
                      { label: 'Daily Earnings Accumulated ($)', key: 'dailyEarningsAccumulated' },
                      { label: 'Referral Earnings ($)', key: 'referralEarningsAccumulated' },
                      { label: 'Total Deposited ($)', key: 'totalDeposited' },
                      { label: 'Total Withdrawn ($)', key: 'withdrawnAmount' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[9px] text-gray-500 uppercase block mb-1">{f.label}</label>
                        <input type="number" value={(editFields as any)[f.key]} onChange={e => setEditFields(p => ({ ...p, [f.key]: e.target.value }))} className="w-full bg-[#0C0C0D] border border-[#D4AF37]/25 text-[#D4AF37] rounded-lg py-1.5 px-2 focus:outline-none text-xs" />
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase block mb-1">Account Status</label>
                      <select value={editFields.status} onChange={e => setEditFields(p => ({ ...p, status: e.target.value as any }))} className="w-full bg-[#0C0C0D] border border-white/10 rounded-lg py-1.5 px-2 focus:outline-none text-white text-xs">
                        <option value="Active">Active</option>
                        <option value="Pending Verification">Pending Verification</option>
                        <option value="Banned">Banned</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase block mb-1">Active Plan</label>
                      <select value={editFields.activePlanId} onChange={e => setEditFields(p => ({ ...p, activePlanId: e.target.value as any }))} className="w-full bg-[#0C0C0D] border border-white/10 rounded-lg py-1.5 px-2 focus:outline-none text-white text-xs">
                        <option value="">No Plan</option>
                        <option value="regular">Regular ($30)</option>
                        <option value="gold">Gold ($60)</option>
                        <option value="titanium">Titanium ($120)</option>
                        <option value="platinum">Platinum ($240)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase block mb-1">Email Verified</label>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={editFields.isEmailVerified} onChange={e => setEditFields(p => ({ ...p, isEmailVerified: e.target.checked }))} className="w-4 h-4" />
                        <span className="text-white text-xs">Mark as verified</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-gray-500 uppercase block mb-1">Custom Notice (shown on user dashboard)</label>
                    <input type="text" value={editFields.customNotice} onChange={e => setEditFields(p => ({ ...p, customNotice: e.target.value }))} placeholder="e.g. Your account is under review..." className="w-full bg-[#0C0C0D] border border-white/10 rounded-lg py-1.5 px-2 focus:outline-none text-white text-xs" />
                  </div>

                  <button type="submit" disabled={actionLoading === 'edit_user'} className="px-4 py-2 bg-[#D4AF37] text-black font-bold uppercase rounded text-[10px] tracking-wider flex items-center gap-2 disabled:opacity-60">
                    {actionLoading === 'edit_user' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Commit All Changes'}
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead>
                    <tr className="border-b border-white/[0.03] text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                      <th className="pb-3">Email / Phone</th>
                      <th className="pb-3">Wallet</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-center">Email</th>
                      <th className="pb-3 text-center">KYC</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {users.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.01]">
                        <td className="py-3">
                          <p className="font-bold text-white leading-none">{row.email}</p>
                          <span className="text-[9.5px] font-mono text-gray-500 mt-1 block">
                            {row.phone || 'No Phone'} &bull; {row.id.substring(0, 12)}…
                          </span>
                        </td>
                        <td className="py-3 font-mono">
                          <p className="text-white font-bold">${row.walletBalance.toFixed(2)}</p>
                          <span className="text-[9.5px] text-gray-500 mt-0.5 block">
                            Plan: {row.activePlanId?.toUpperCase() || 'None'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 font-mono rounded text-[9px] uppercase ${
                              row.status === 'Active'
                                ? 'bg-emerald-950 text-emerald-400 font-bold'
                                : row.status === 'Banned'
                                ? 'bg-red-950 text-red-400'
                                : 'bg-amber-950 text-amber-200 animate-pulse'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              row.isEmailVerified ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {row.isEmailVerified ? '✓ VERIFIED' : '✗ PENDING'}
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono text-[10px]">
                          <span
                            className={
                              row.kycStatus === 'Approved'
                                ? 'text-emerald-400 font-bold'
                                : row.kycStatus === 'Pending'
                                ? 'text-amber-400 animate-pulse'
                                : row.kycStatus === 'Rejected'
                                ? 'text-red-400'
                                : 'text-gray-600'
                            }
                          >
                            {row.kycStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => selectUserForEdit(row)}
                            className="px-2.5 py-1 bg-white/[0.02] border border-white/[0.1] text-white hover:text-[#D4AF37] hover:border-[#D4AF37] font-mono text-[9px] uppercase tracking-wide rounded"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: DEPOSITS ── */}
          {adminTab === 'deposits' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03]">
                <h3 className="text-base font-bold">Deposit Receipt Audit Queue</h3>
                <p className="text-xs text-gray-400">
                  Validate blockchain hashes or bank wire references. Approving a deposit
                  automatically activates the user's account and credits their wallet.
                </p>
              </div>

              {pendingDepositsList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 rounded-2xl bg-[#0A0A0B]/60 font-mono text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-3" />
                  <span>No pending deposit receipts awaiting verification.</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                    <label className="text-[10px] text-red-200 uppercase font-mono block mb-1.5">
                      Rejection reason (used when declining):
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#1A1A1C] border border-red-500/10 rounded py-1.5 px-3 text-xs font-mono text-red-100 focus:outline-none"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>

                  {pendingDepositsList.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-5 bg-[#0C0C0D] border border-white/[0.04] rounded-2xl grid md:grid-cols-12 gap-6 items-center"
                    >
                      <div className="md:col-span-4 space-y-2">
                        <span className="text-[10px] text-gray-500 font-mono block">
                          TX: {tx.id}
                        </span>
                        <h4 className="text-sm font-bold text-[#D4AF37]">{tx.userEmail}</h4>
                        <span className="text-2xl font-bold font-mono text-white block">
                          ${tx.amount.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-400 font-mono break-all border-t border-white/[0.03] pt-1.5">
                          Hash: {tx.txHash || 'Screenshot / Bank Wire'}
                        </p>
                      </div>

                      <div className="md:col-span-5 bg-[#121214] border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center h-28 text-center relative overflow-hidden">
                        <span className="absolute top-2 left-2 text-[8px] font-mono text-gray-500 bg-[#0C0C0D] px-1.5 py-0.5 rounded uppercase">
                          Payment Proof
                        </span>
                        <p className="text-[10px] text-gray-400 font-mono font-bold mt-4">
                          Screenshot Reference
                        </p>
                        <code className="text-[9px] text-gray-600 block mt-1 break-all truncate w-48">
                          {tx.proofUrl}
                        </code>
                        <div className="mt-2.5 px-3 py-1 bg-white/[0.02] border border-white/10 rounded text-[9px] font-mono uppercase">
                          Open proof file
                        </div>
                      </div>

                      <div className="md:col-span-3 flex flex-col gap-2">
                        <button
                          onClick={() => handleApproveDeposit(tx.id)}
                          disabled={actionLoading === `approve_dep_${tx.id}`}
                          className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] uppercase font-mono transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {actionLoading === `approve_dep_${tx.id}` ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Approve & Activate User'
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectDeposit(tx.id)}
                          disabled={actionLoading === `reject_dep_${tx.id}`}
                          className="w-full py-2 rounded-lg bg-red-950/60 text-red-400 border border-red-500/10 text-[10px] uppercase font-mono hover:bg-red-950 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {actionLoading === `reject_dep_${tx.id}` ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Reject Proof'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: WITHDRAWALS ── */}
          {adminTab === 'withdrawals' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03]">
                <h3 className="text-base font-bold">Payout Wire Dispersal Command Panel</h3>
                <p className="text-xs text-gray-400">
                  Only approve for investors meeting circular earnings targets and KYC approval.
                  Rejecting refunds the held amount back to the investor's wallet.
                </p>
              </div>

              {pendingWithdrawalsList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 rounded-2xl bg-[#0A0A0B]/60 font-mono text-xs">
                  No withdrawals queued in the ledger at this time.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingWithdrawalsList.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-5 bg-[#0C0C0D] border border-white/[0.04] rounded-2xl grid md:grid-cols-12 gap-4 items-center"
                    >
                      <div className="md:col-span-4 space-y-1">
                        <span className="text-[10px] text-gray-500 font-mono block">
                          REF: {tx.id}
                        </span>
                        <h4 className="text-xs font-bold text-white">{tx.userEmail}</h4>
                        <span className="text-xl font-bold font-mono text-red-400 block">
                          ${tx.amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="md:col-span-5 bg-[#141416] p-3 rounded-xl text-xs text-gray-400 font-mono">
                        <span className="text-[9px] text-gray-500 block mb-1 uppercase">
                          Destination Bank Credentials:
                        </span>
                        <p className="text-white">{tx.bankDetails || 'N/A'}</p>
                      </div>

                      <div className="md:col-span-3 flex flex-col gap-2">
                        <button
                          onClick={() => handleApproveWithdrawal(tx.id)}
                          disabled={actionLoading === `approve_wd_${tx.id}`}
                          className="w-full py-2 bg-[#D4AF37] hover:bg-[#8C6D23] text-black font-extrabold text-[9px] uppercase font-mono rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {actionLoading === `approve_wd_${tx.id}` ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            'Confirm Dispersal'
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(tx.id)}
                          disabled={actionLoading === `reject_wd_${tx.id}`}
                          className="w-full py-2 bg-red-950 text-red-300 font-bold text-[9px] uppercase font-mono rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {actionLoading === `reject_wd_${tx.id}` ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            'Cancel & Refund'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: KYC ── */}
          {adminTab === 'kyc_docs' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03]">
                <h3 className="text-base font-bold">Compliance KYC Document Audit Portal</h3>
                <p className="text-xs text-gray-400">
                  Review uploaded identity files and select a validation state. Rejection triggers
                  the custom reason below.
                </p>
              </div>

              {pendingKYCUsersList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 rounded-2xl bg-[#0A0A0B]/60 font-mono text-xs">
                  Zero pending KYC submissions awaiting audit.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                    <label className="text-[10px] text-red-200 uppercase font-mono block mb-1.5">
                      KYC Rejection Reason:
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#1A1A1C] border border-red-500/10 rounded py-1.5 px-3 text-xs font-mono text-red-100 focus:outline-none"
                      value={kycRejectReason}
                      onChange={(e) => setKycRejectReason(e.target.value)}
                    />
                  </div>

                  {pendingKYCUsersList.map((row) => (
                    <div
                      key={row.id}
                      className="p-5 bg-[#0C0C0D] border border-white/[0.04] rounded-2xl grid md:grid-cols-12 gap-6 items-center"
                    >
                      <div className="md:col-span-4 space-y-2">
                        <h4 className="text-sm font-bold text-white">{row.kyc?.fullName}</h4>
                        <span className="text-xs text-[#D4AF37] font-mono block">
                          {row.kyc?.idType}: {row.kyc?.idNumber}
                        </span>
                        <p className="text-[10px] text-gray-500 font-mono">{row.email}</p>
                        <span className="text-[9px] text-gray-500 font-mono block">
                          Submitted:{' '}
                          {new Date(row.kyc?.submittedAt || '').toLocaleDateString()}
                        </span>
                      </div>

                      <div className="md:col-span-5 space-y-1.5 text-xs text-gray-400 font-mono bg-[#141416] p-3 rounded-xl border border-white/[0.03]">
                        <span className="text-[9px] text-gray-500 uppercase block">
                          Submitted Files:
                        </span>
                        <p>
                          &bull; Selfie:{' '}
                          <code className="text-gray-500 text-[9px]">
                            {row.kyc?.selfieUrl}
                          </code>
                        </p>
                        <p>
                          &bull; Address Proof:{' '}
                          <code className="text-gray-500 text-[9px]">
                            {row.kyc?.addressProofUrl}
                          </code>
                        </p>
                        <p className="mt-1">
                          Fee Paid:{' '}
                          <strong
                            className={row.kyc?.hasPaidFee ? 'text-emerald-400' : 'text-red-400'}
                          >
                            {row.kyc?.hasPaidFee ? 'Yes ✓' : 'No ✗'}
                          </strong>
                        </p>
                      </div>

                      <div className="md:col-span-3 flex flex-col gap-2">
                        <button
                          onClick={() => handleApproveKYC(row.id)}
                          disabled={actionLoading === `approve_kyc_${row.id}`}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] uppercase font-mono rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {actionLoading === `approve_kyc_${row.id}` ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Approve KYC'
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectKYC(row.id)}
                          disabled={actionLoading === `reject_kyc_${row.id}`}
                          className="w-full py-2 bg-red-950 text-red-400 border border-red-500/20 text-[10px] uppercase font-mono rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {actionLoading === `reject_kyc_${row.id}` ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Reject KYC'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: TASKS ── */}
          {adminTab === 'tasks_verify' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03]">
                <h3 className="text-base font-bold">Daily Promo Task Verification Queue</h3>
                <p className="text-xs text-gray-400">
                  Review submitted tweet URLs, Telegram handles, and WhatsApp screenshots.
                  Approval instantly credits reward to the user's wallet.
                </p>
              </div>

              {pendingTasksList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 rounded-2xl bg-[#0A0A0B]/60 font-mono text-xs">
                  No promotional task submissions pending verification.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTasksList.map((row) => (
                    <div key={row.id} className="p-4 bg-[#0C0C0D] border border-white/[0.03] rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] text-[#D4AF37] font-mono uppercase font-bold block">Task: {row.taskTitle}</span>
                        <p className="text-xs font-bold text-white">{users.find(u => u.id === row.userId)?.email || row.userId}</p>
                        {(row as any).proofImageUrl && (
                          <a href={(row as any).proofImageUrl} target="_blank" rel="noopener noreferrer">
                            <img src={(row as any).proofImageUrl} alt="proof" className="w-32 h-20 object-cover rounded-lg border border-white/10 mt-1 cursor-pointer hover:opacity-80 transition" />
                          </a>
                        )}
                        <code className="text-[10px] text-gray-500 font-mono block break-all">{row.proof}</code>
                        <span className="text-[9px] text-gray-600 font-mono block">{new Date(row.submittedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleApproveTaskLog(row.id)} disabled={actionLoading === `approve_task_${row.id}`} className="px-3 py-1.5 bg-emerald-500 text-black font-semibold text-[9.5px] uppercase font-mono rounded hover:brightness-110 transition flex items-center gap-1.5 disabled:opacity-60">
                          {actionLoading === `approve_task_${row.id}` ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Credit Reward'}
                        </button>
                        <button onClick={() => handleRejectTaskLog(row.id)} disabled={actionLoading === `reject_task_${row.id}`} className="px-3 py-1.5 bg-red-950 text-red-400 border border-red-500/10 text-[9.5px] uppercase font-mono rounded hover:bg-red-900 transition flex items-center gap-1.5 disabled:opacity-60">
                          {actionLoading === `reject_task_${row.id}` ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Deny'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SUPPORT ── */}
          {adminTab === 'support' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03]">
                <h3 className="text-base font-bold">Support Helpdesk — All Tickets</h3>
                <p className="text-xs text-gray-400">Read user messages and reply as admin. Images supported.</p>
              </div>

              {tickets.length === 0 ? (
                <div className="p-12 text-center text-gray-500 rounded-2xl bg-[#0A0A0B]/60 font-mono text-xs">No support tickets yet.</div>
              ) : (
                <div className="grid sm:grid-cols-12 gap-4">
                  {/* Ticket list */}
                  <div className="sm:col-span-4 space-y-2 overflow-y-auto max-h-[520px]">
                    {tickets.map(tck => (
                      <button key={tck.id} onClick={() => setSelectedTicketId(tck.id)} className={`w-full p-3 text-left rounded-xl border transition flex flex-col ${selectedTicketId === tck.id ? 'bg-[#1C170E] border-[#D4AF37]' : 'bg-[#0E0E0F] border-white/[0.04] hover:bg-white/[0.01]'}`}>
                        <div className="flex justify-between w-full">
                          <span className="text-[9px] font-mono text-gray-500">{tck.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${tck.status === 'open' ? 'bg-purple-950 text-purple-300' : 'bg-emerald-950 text-emerald-400'}`}>{tck.status}</span>
                        </div>
                        <p className="text-[11px] font-bold text-white mt-1 line-clamp-1">{tck.subject}</p>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">{tck.userEmail}</p>
                        <p className="text-[9px] text-gray-600 font-mono">{tck.category} · {tck.messages.length} msg{tck.messages.length !== 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>

                  {/* Chat thread */}
                  <div className="sm:col-span-8 bg-[#0C0C0D] p-4 rounded-2xl border border-white/[0.03] flex flex-col h-[520px]">
                    {selectedTicketId ? (() => {
                      const tck = tickets.find(t => t.id === selectedTicketId);
                      if (!tck) return null;
                      return (
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 mb-3">
                            <div>
                              <h4 className="text-xs font-bold text-white">{tck.subject}</h4>
                              <p className="text-[9px] text-gray-400 font-mono">{tck.userEmail} · {tck.category}</p>
                            </div>
                            {tck.status === 'open' && (
                              <button onClick={() => handleCloseTicket(tck.id)} disabled={!!actionLoading} className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono uppercase rounded hover:bg-emerald-900 transition">
                                Mark Resolved
                              </button>
                            )}
                          </div>

                          <div className="flex-1 space-y-3 overflow-y-auto max-h-[330px] pr-1">
                            {tck.messages.map((msg: any, i: number) => (
                              <div key={i} className={`max-w-[85%] p-2.5 rounded-xl text-xs ${msg.sender === 'admin' ? 'bg-[#1C170E] border border-[#D4AF37]/20 text-white ml-auto' : 'bg-white/[0.05] text-gray-200 mr-auto'}`}>
                                <p className="font-bold text-[9px] mb-1 uppercase font-mono">{msg.sender === 'admin' ? '🛡 Admin' : '👤 User'}</p>
                                <p>{msg.message}</p>
                                {msg.imageUrl && (
                                  <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.imageUrl} alt="attachment" className="mt-2 w-full max-h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition" />
                                  </a>
                                )}
                                <span className="block text-[8px] text-gray-500 mt-1 font-mono">{new Date(msg.timestamp).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 space-y-2 border-t border-white/[0.03] pt-3">
                            <div className="flex items-center gap-2">
                              <AdminImageUpload bucket="support" onUploaded={(url) => setAdminReplyImageUrl(url)} />
                              {adminReplyImageUrl && <span className="text-[9px] text-emerald-400 font-mono">Image ready</span>}
                            </div>
                            <form onSubmit={handleAdminTicketReply} className="flex gap-2">
                              <input type="text" required value={adminReplyText} onChange={e => setAdminReplyText(e.target.value)} placeholder="Type admin reply…" className="flex-1 bg-[#1A1A1C] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition" />
                              <button type="submit" disabled={actionLoading === 'admin_reply'} className="bg-[#D4AF37] hover:bg-[#8C6D23] text-black px-3.5 rounded-xl transition flex items-center justify-center">
                                {actionLoading === 'admin_reply' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 font-mono text-xs">
                        <MessageSquare className="w-8 h-8 opacity-25 mb-2" />
                        <span>Select a ticket to view the conversation.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: BROADCAST ── */}
          {adminTab === 'broadcast' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03]">
                <h3 className="text-base font-bold">Bulletins, Announcements & Alerts</h3>
                <p className="text-xs text-gray-400">Publish announcements instantly visible to all users in real-time.</p>
              </div>

              <form onSubmit={handleTriggerBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1.5">Broadcast Message</label>
                  <textarea required rows={4} className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition" value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Enter announcement text for all users…" />
                </div>
                <div className="flex items-center gap-3">
                  <AdminImageUpload bucket="support" onUploaded={(url) => setAnnouncementImageUrl(url)} />
                  {announcementImageUrl && <span className="text-[9px] text-emerald-400 font-mono">Image attached</span>}
                </div>
                <button type="submit" disabled={actionLoading === 'broadcast'} className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition hover:brightness-110 disabled:opacity-60 flex items-center gap-2">
                  {actionLoading === 'broadcast' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Dispatch to All Users'}
                </button>
              </form>

              <div className="bg-[#0C0C0D] p-5 rounded-2xl border border-white/[0.03] space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-ping" />
                  <span className="font-bold text-[#D4AF37] uppercase">Recent Simulation Activity:</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {simulationLogs.length === 0 ? (
                    <span className="text-gray-500 italic text-[11px]">No simulations run yet.</span>
                  ) : (
                    simulationLogs.map((logStr, idx) => (
                      <p key={idx} className="text-[10px] text-gray-400 border-l border-[#D4AF37]/30 pl-2 py-0.5">{logStr}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: TRANSACTIONS ── */}
          {adminTab === 'transactions' && (
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="pb-3 border-b border-white/[0.03] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold uppercase font-mono tracking-widest text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#D4AF37]" />
                    <span>Global Payment & Ledger History</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    View, search, filter, and audit all financial transaction records.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 font-mono">
                  <button
                    onClick={() => handleDownloadCSV(false)}
                    className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition hover:brightness-110 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export All CSV
                  </button>
                  {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                      onClick={() => handleDownloadCSV(true)}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Filtered ({filteredTransactions.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Approved Deposits',
                    val: transactions
                      .filter((t) => t.type === 'deposit' && t.status === 'approved')
                      .reduce((a, c) => a + c.amount, 0),
                    color: 'text-emerald-400',
                  },
                  {
                    label: 'Approved Withdrawals',
                    val: transactions
                      .filter((t) => t.type === 'withdrawal' && t.status === 'approved')
                      .reduce((a, c) => a + c.amount, 0),
                    color: 'text-red-400',
                  },
                  {
                    label: 'Earnings & Referrals',
                    val: transactions
                      .filter(
                        (t) =>
                          (t.type === 'earning' || t.type === 'referral_bonus') &&
                          t.status === 'approved'
                      )
                      .reduce((a, c) => a + Math.abs(c.amount), 0),
                    color: 'text-[#D4AF37]',
                  },
                  {
                    label: 'KYC Fees Collected',
                    val: transactions
                      .filter((t) => t.type === 'kyc_fee')
                      .reduce((a, c) => a + c.amount, 0),
                    color: 'text-sky-400',
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-[#0C0C0D] p-4 rounded-2xl border border-white/[0.02]"
                  >
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">
                      {m.label}
                    </span>
                    <p className={`text-lg font-bold font-mono mt-1 ${m.color}`}>
                      ${m.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="grid sm:grid-cols-4 gap-4 p-4 bg-[#0C0C0D] border border-white/[0.02] rounded-2xl font-mono text-xs">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">
                    Search Email / Hash / ID
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#111112] border border-white/10 rounded-lg py-1.5 px-3 focus:outline-none focus:border-[#D4AF37] text-white"
                    placeholder="investor@domain.com or TXN-12345…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">
                    Transaction Type
                  </label>
                  <select
                    className="w-full bg-[#111112] border border-white/10 rounded-lg py-1.5 px-2 focus:outline-none focus:border-[#D4AF37] text-white"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="earning">Earnings Plan</option>
                    <option value="referral_bonus">Referral Bonus</option>
                    <option value="kyc_fee">KYC Fee</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">
                    Audit Status
                  </label>
                  <select
                    className="w-full bg-[#111112] border border-white/10 rounded-lg py-1.5 px-2 focus:outline-none focus:border-[#D4AF37] text-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                {filteredTransactions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 rounded-2xl bg-[#0A0A0B]/60 font-mono text-xs">
                    <AlertCircle className="w-8 h-8 mx-auto text-[#D4AF37] mb-2" />
                    No transactions matched your filter criteria.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-white/[0.03] text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="pb-3">Receipt / Date</th>
                        <th className="pb-3">User Email</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 pl-4">Hash / Bank Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-mono">
                            <span className="text-white font-bold block">{tx.receiptId}</span>
                            <span className="text-[9.5px] text-gray-500 block mt-0.5">
                              {new Date(tx.date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-[9px] text-[#D4AF37]/50 block mt-0.5">
                              {tx.id}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-gray-200 block truncate max-w-[180px]">
                              {tx.userEmail}
                            </span>
                            <span className="text-[9.5px] font-mono text-gray-500 block mt-0.5 truncate max-w-[180px]">
                              uid: {tx.userId}
                            </span>
                          </td>
                          <td className="py-3 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                tx.type === 'deposit'
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10'
                                  : tx.type === 'withdrawal'
                                  ? 'bg-amber-950/40 text-amber-300 border border-amber-500/10'
                                  : tx.type === 'earning'
                                  ? 'bg-purple-950/40 text-purple-400 border border-purple-500/10'
                                  : tx.type === 'kyc_fee'
                                  ? 'bg-sky-950/40 text-sky-400 border border-sky-500/10'
                                  : 'bg-amber-950/40 text-[#D4AF37] border border-[#D4AF37]/10'
                              }`}
                            >
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold">
                            <span
                              className={
                                tx.amount < 0 ||
                                tx.type === 'withdrawal' ||
                                tx.type === 'kyc_fee'
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }
                            >
                              {tx.amount < 0 ||
                              tx.type === 'withdrawal' ||
                              tx.type === 'kyc_fee'
                                ? '-'
                                : '+'}
                              ${Math.abs(tx.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[8.5px] uppercase font-bold ${
                                tx.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : tx.status === 'pending'
                                  ? 'bg-amber-950 text-amber-300 animate-pulse'
                                  : 'bg-red-950 text-red-400'
                              }`}
                            >
                              {tx.status}
                            </span>
                            {tx.rejectionReason && (
                              <p
                                className="text-[8.5px] text-red-400 mt-1 max-w-[110px] truncate mx-auto"
                                title={tx.rejectionReason}
                              >
                                {tx.rejectionReason}
                              </p>
                            )}
                          </td>
                          <td className="py-3 pl-4 font-mono text-[9.5px] text-gray-400">
                            {tx.type === 'deposit' ? (
                              <span
                                className="break-all block truncate max-w-[200px]"
                                title={tx.txHash || 'N/A'}
                              >
                                Hash: {tx.txHash || '—'}
                              </span>
                            ) : tx.type === 'withdrawal' ? (
                              <span
                                className="break-all block truncate max-w-[200px]"
                                title={tx.bankDetails || 'N/A'}
                              >
                                Bank: {tx.bankDetails || '—'}
                              </span>
                            ) : (
                              <span className="text-gray-600">Internal Ledger</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
