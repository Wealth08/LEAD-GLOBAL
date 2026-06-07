/**
 * LeadsGlobal — Production Supabase Service
 * Replaces supabaseMock.ts with real Supabase Auth + Database operations.
 * Every new account starts with $0 balance (enforced by DB default + this layer).
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import {
  UserProfile,
  Transaction,
  DailyTask,
  TaskLog,
  SupportTicket,
  LeaderboardEntry,
  BankAccount,
  InvestmentPlan,
  InvestmentPlanId,
  KYCData,
} from './types';

// ─── Client Initialisation ────────────────────────────────────────────────────
const SUPABASE_URL = 'https://jcufueffwgkgxrzssiyo.supabase.co';
const SUPABASE_ANON_KEY =
  'sb_publishable_9KxfFUZyqjb_DEHzWVSzLg_OgPvPbWw';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ─── Investment Plans (static config — unchanged) ────────────────────────────
export const PLANS: Record<InvestmentPlanId, InvestmentPlan> = {
  regular: {
    id: 'regular',
    name: 'Regular Plan',
    price: 30,
    dailyEarning: 1,
    description:
      'Earn $1 daily (Monday to Friday). Withdrawal unlocks after accumulating $30 in plan earnings.',
  },
  gold: {
    id: 'gold',
    name: 'Gold Plan',
    price: 60,
    dailyEarning: 2,
    description:
      'Earn $2 daily (Monday to Friday). Withdrawal unlocks after accumulating $60 in plan earnings.',
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Plan',
    price: 120,
    dailyEarning: 4,
    description:
      'Earn $4 daily (Monday to Friday). Withdrawal unlocks after accumulating $120 in plan earnings.',
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Plan',
    price: 240,
    dailyEarning: 8,
    description:
      'Earn $8 daily (Monday to Friday). Withdrawal unlocks after accumulating $240 in plan earnings.',
  },
};

// ─── Default Daily Tasks ──────────────────────────────────────────────────────
export const DEFAULT_TASKS: DailyTask[] = [
  {
    id: 'task-checkin',
    title: 'Daily Platform Check-in',
    category: 'checkin',
    reward: 0.5,
    instructions:
      'Log in and click the daily check-in button to verify your presence and keep your account active.',
  },
  {
    id: 'task-telegram',
    title: 'Join LeadsGlobal Official Telegram Group',
    category: 'social',
    reward: 1.0,
    instructions:
      'Join our announcements channel and post a greeting. Submit your Telegram handle as proof.',
    link: 'https://t.me/leadsglobal_official_channel',
  },
  {
    id: 'task-twitter',
    title: 'Share LeadsGlobal Certificate on Twitter / X',
    category: 'promo',
    reward: 2.0,
    instructions:
      'Tweet an elegant picture of your approved deposit invoice or promotional banner with hashtag #LeadsGlobal Capital. Paste the tweet URL.',
    link: 'https://twitter.com/intent/tweet?text=Growing%20Capital,%20Building%20Future%20with%20LeadsGlobal%20Investment',
  },
  {
    id: 'task-whatsapp',
    title: 'Post LeadsGlobal Status on WhatsApp Screen',
    category: 'promo',
    reward: 1.5,
    instructions:
      'Take a screenshot of LeadsGlobal in your WhatsApp stories post. Keep it up for 24h and upload the screenshot.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

/** Map a raw profiles row → UserProfile shape used throughout the app */
function rowToProfile(row: Record<string, any>): UserProfile {
  return {
    id: row.id,
    email: row.email,
    isEmailVerified: row.is_email_verified ?? false,
    phone: row.phone ?? '',
    country: row.country ?? '',
    timezone: row.timezone ?? 'UTC',
    createdAt: row.created_at,
    referralCode: row.referral_code ?? '',
    referredByCode: row.referred_by_code ?? undefined,
    status: row.status ?? 'Pending Verification',
    kycStatus: row.kyc_status ?? 'None',
    kyc: row.kyc_data ?? undefined,
    walletBalance: Number(row.wallet_balance ?? 0),
    totalDeposited: Number(row.total_deposited ?? 0),
    pendingDeposited: Number(row.pending_deposited ?? 0),
    dailyEarningsAccumulated: Number(row.daily_earnings_accumulated ?? 0),
    referralEarningsAccumulated: Number(row.referral_earnings_accumulated ?? 0),
    withdrawnAmount: Number(row.withdrawn_amount ?? 0),
    activePlanId: row.active_plan_id ?? undefined,
    planActivatedAt: row.plan_activated_at ?? undefined,
    planAccumulatedEarnings: Number(row.plan_accumulated_earnings ?? 0),
    telegramHandle: row.telegram_handle ?? undefined,
    whatsappNumber: row.whatsapp_number ?? undefined,
    notificationsEnabled: row.notifications_enabled ?? {
      telegram: true,
      whatsapp: true,
      email: true,
    },
  };
}

/** Map a raw transactions row → Transaction */
function rowToTransaction(row: Record<string, any>): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    type: row.type,
    amount: Number(row.amount),
    status: row.status,
    date: row.date,
    txHash: row.tx_hash ?? undefined,
    proofUrl: row.proof_url ?? undefined,
    receiptId: row.receipt_id ?? undefined,
    bankDetails: row.bank_details ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

// ─── SupabaseService ──────────────────────────────────────────────────────────
export class SupabaseService {
  private _cachedUser: UserProfile | null = null;
  private _authUser: User | null = null;

  constructor() {
    // Keep internal auth user in sync
    supabase.auth.onAuthStateChange((_event, session) => {
      this._authUser = session?.user ?? null;
      if (!session) this._cachedUser = null;
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Sign up with email + password.
   * Profile row is created via a Supabase DB trigger (handle_new_user),
   * but we also upsert here to set referral code, country, phone, etc.
   * Wallet balance is ALWAYS initialised to $0 — never seeded with funds.
   */
  async signup(
    email: string,
    password: string,
    phone: string,
    country: string,
    referralCodeUsed?: string
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            // stored in auth.users.raw_user_meta_data
            phone,
            country,
            referred_by_code: referralCodeUsed?.trim().toUpperCase() || null,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Signup failed. Please try again.' };
      }

      // Build the profile row explicitly so all fields are correct on creation
      const referralCode =
        trimmedEmail.split('@')[0].toUpperCase() +
        '_' +
        Math.floor(100 + Math.random() * 900);

      const profilePayload = {
        id: data.user.id,
        email: trimmedEmail,
        phone: phone || null,
        country: country || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        referral_code: referralCode,
        referred_by_code: referralCodeUsed?.trim().toUpperCase() || null,
        status: 'Pending Verification',
        kyc_status: 'None',
        // ─── All financial fields reset to zero for every new account ─────
        wallet_balance: 0,
        total_deposited: 0,
        pending_deposited: 0,
        daily_earnings_accumulated: 0,
        referral_earnings_accumulated: 0,
        withdrawn_amount: 0,
        plan_accumulated_earnings: 0,
        // ─────────────────────────────────────────────────────────────────
        is_email_verified: false,
        notifications_enabled: { telegram: true, whatsapp: true, email: true },
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload)
        .select()
        .single();

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        // Non-fatal — auth user was created; profile may be created by trigger
      }

      await this._logActivity(
        data.user.id,
        'USER_REGISTERED',
        `New account registered: ${trimmedEmail} from ${country}. Referred by: ${referralCodeUsed || 'None'}.`
      );

      const profile = profileData ? rowToProfile(profileData) : null;
      this._cachedUser = profile;

      return {
        success: true,
        message:
          'Account created! A verification link has been sent to your email. Please check your inbox.',
        user: profile ?? undefined,
      };
    } catch (err: any) {
      console.error('Signup error:', err);
      return { success: false, message: err.message || 'Unexpected signup error.' };
    }
  }

  /**
   * Sign in with email + password via Supabase Auth.
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid')) {
          return {
            success: false,
            message: 'Invalid email or password. Please try again.',
          };
        }
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Login failed. Please try again.' };
      }

      this._authUser = data.user;
      const profile = await this._fetchProfile(data.user.id);

      if (!profile) {
        return {
          success: false,
          message: 'Account profile not found. Please contact support.',
        };
      }

      if (profile.status === 'Banned') {
        await supabase.auth.signOut();
        return {
          success: false,
          message:
            'This account has been suspended for policy violations. Contact support.',
        };
      }

      this._cachedUser = profile;

      await this._logActivity(
        data.user.id,
        'USER_LOGIN',
        `User ${profile.email} logged in successfully.`
      );

      return { success: true, message: 'Logged in successfully.', user: profile };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Unexpected login error.' };
    }
  }

  /** Sign out current session */
  async logout(): Promise<void> {
    this._cachedUser = null;
    this._authUser = null;
    await supabase.auth.signOut();
  }

  /** Send password-reset email via Supabase */
  async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    if (error) return { success: false, message: error.message };
    return {
      success: true,
      message: 'Password reset link sent. Check your inbox.',
    };
  }

  /**
   * Returns the currently authenticated user profile.
   * Fetches from DB if not cached.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (this._cachedUser) return this._cachedUser;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    this._authUser = user;
    const profile = await this._fetchProfile(user.id);
    this._cachedUser = profile;
    return profile;
  }

  /**
   * Synchronous version — returns cached user only.
   * Used for initial render guards before async hydration.
   */
  getCurrentUserSync(): UserProfile | null {
    return this._cachedUser;
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  async getUserById(id: string): Promise<UserProfile | null> {
    return this._fetchProfile(id);
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) { console.error(error); return []; }
    return (data ?? []).map(rowToProfile);
  }

  async updateNotificationSettings(
    telegramHandle: string,
    whatsappNumber: string,
    preferences: { telegram: boolean; whatsapp: boolean; email: boolean }
  ): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        telegram_handle: telegramHandle || null,
        whatsapp_number: whatsappNumber || null,
        notifications_enabled: preferences,
      })
      .eq('id', user.id);

    this._cachedUser = null; // invalidate cache
    await this._logActivity(user.id, 'NOTIFICATIONS_UPDATED', `User ${user.email} updated notification channels.`);
  }

  // ── Bank Accounts ─────────────────────────────────────────────────────────

  async getBankAccounts(): Promise<BankAccount[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_preferred', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      bankName: r.bank_name,
      accountName: r.account_name,
      accountNumber: r.account_number,
      swiftCode: r.swift_code ?? undefined,
      iban: r.iban ?? undefined,
      country: r.country,
      currency: r.currency,
      isPreferred: r.is_preferred,
    }));
  }

  async addBankAccount(
    account: Omit<BankAccount, 'id'>
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized session.' };

    // Remove preferred flag from others if new account is preferred
    if (account.isPreferred) {
      await supabase
        .from('bank_accounts')
        .update({ is_preferred: false })
        .eq('user_id', user.id);
    }

    const { error } = await supabase.from('bank_accounts').insert({
      id: 'bnk-' + generateId(),
      user_id: user.id,
      bank_name: account.bankName,
      account_name: account.accountName,
      account_number: account.accountNumber,
      swift_code: account.swiftCode ?? null,
      iban: account.iban ?? null,
      country: account.country,
      currency: account.currency,
      is_preferred: account.isPreferred,
    });

    if (error) return { success: false, message: error.message };
    await this._logActivity(user.id, 'BANK_ADDED', `Bank account added: ${account.bankName} by ${user.email}`);
    return { success: true, message: 'Bank account added successfully.' };
  }

  async deleteBankAccount(id: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;
    await supabase.from('bank_accounts').delete().eq('id', id).eq('user_id', user.id);
  }

  // ── KYC ───────────────────────────────────────────────────────────────────

  async submitKYC(
    formData: Omit<KYCData, 'status' | 'submittedAt' | 'hasPaidFee'>
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };

    const kycData: KYCData = {
      ...formData,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      hasPaidFee: user.kyc?.hasPaidFee || false,
    };

    const { error } = await supabase
      .from('profiles')
      .update({ kyc_data: kycData, kyc_status: 'Pending' })
      .eq('id', user.id);

    if (error) return { success: false, message: error.message };

    this._cachedUser = null;
    await this._logActivity(user.id, 'KYC_SUBMITTED', `User ${user.email} submitted KYC documents.`);
    return { success: true, message: 'KYC documents submitted. Our compliance team will review within 24 hours.' };
  }

  async payKYCFee(): Promise<{ success: boolean; message: string }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    if (!user.kyc) return { success: false, message: 'Submit your KYC documents before paying the fee.' };

    const fee = 15;
    if (user.walletBalance < fee) {
      return { success: false, message: `Insufficient balance. KYC fee is $${fee}.` };
    }

    const newBalance = user.walletBalance - fee;
    const updatedKyc = { ...user.kyc, hasPaidFee: true };

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance, kyc_data: updatedKyc })
      .eq('id', user.id);

    if (error) return { success: false, message: error.message };

    await supabase.from('transactions').insert({
      id: 'TXN-FEE-' + generateId(),
      user_id: user.id,
      user_email: user.email,
      type: 'kyc_fee',
      amount: fee,
      status: 'approved',
      date: new Date().toISOString(),
      receipt_id: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    this._cachedUser = null;
    await this._logActivity(user.id, 'KYC_FEE_PAID', `User ${user.email} paid $${fee} KYC processing fee.`);
    return { success: true, message: 'KYC processing fee of $15 paid. This accelerates your validation timeline.' };
  }

  // ── Deposits ──────────────────────────────────────────────────────────────

  async submitDeposit(
    amount: number,
    txHash?: string,
    proofUrl?: string
  ): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized session.' };
    if (!user.isEmailVerified) {
      return { success: false, message: 'Please verify your email before making deposits.' };
    }

    const receiptId = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = 'TXN-' + Math.floor(100000 + Math.random() * 90000).toString();

    const { error: txError } = await supabase.from('transactions').insert({
      id: txId,
      user_id: user.id,
      user_email: user.email,
      type: 'deposit',
      amount,
      status: 'pending',
      date: new Date().toISOString(),
      tx_hash: txHash?.trim() || null,
      proof_url: proofUrl || null,
      receipt_id: receiptId,
    });

    if (txError) return { success: false, message: txError.message };

    // Increment pending deposited
    await supabase
      .from('profiles')
      .update({ pending_deposited: user.pendingDeposited + amount })
      .eq('id', user.id);

    this._cachedUser = null;
    await this._logActivity(user.id, 'DEPOSIT_REQUEST', `User ${user.email} submitted $${amount} deposit proof. Receipt: ${receiptId}.`);

    return {
      success: true,
      message: 'Deposit proof submitted. Our auditors will verify within 1–2 hours.',
      transaction: {
        id: txId,
        userId: user.id,
        userEmail: user.email,
        type: 'deposit',
        amount,
        status: 'pending',
        date: new Date().toISOString(),
        txHash: txHash,
        proofUrl,
        receiptId,
      },
    };
  }

  // ── Investment Plans ──────────────────────────────────────────────────────

  async purchaseInvestmentPlan(
    planId: InvestmentPlanId
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized session.' };
    if (!user.isEmailVerified) return { success: false, message: 'Verify your email first.' };
    if (user.status === 'Pending Verification') {
      return { success: false, message: 'Complete your deposit verification before activating a plan.' };
    }

    const plan = PLANS[planId];
    if (user.walletBalance < plan.price) {
      return { success: false, message: `Insufficient balance. Required: $${plan.price}.` };
    }

    const newBalance = user.walletBalance - plan.price;

    const { error } = await supabase
      .from('profiles')
      .update({
        wallet_balance: newBalance,
        active_plan_id: planId,
        plan_activated_at: new Date().toISOString(),
        plan_accumulated_earnings: 0,
      })
      .eq('id', user.id);

    if (error) return { success: false, message: error.message };

    await supabase.from('transactions').insert({
      id: 'TXN-' + Math.floor(100000 + Math.random() * 90000).toString(),
      user_id: user.id,
      user_email: user.email,
      type: 'earning',
      amount: -plan.price,
      status: 'approved',
      date: new Date().toISOString(),
      tx_hash: 'PLAN_ACTIVATED_INTERNAL',
      receipt_id: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    this._cachedUser = null;
    await this._logActivity(user.id, 'PLAN_ACTIVATED', `User ${user.email} activated ${plan.name} ($${plan.price}).`);
    return { success: true, message: `${plan.name} activated! Daily returns of $${plan.dailyEarning}/day will begin.` };
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  async submitTaskProof(
    taskId: string,
    proofText?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    if (!user.isEmailVerified) return { success: false, message: 'Verify your email first.' };
    if (user.status === 'Pending Verification') {
      return { success: false, message: 'Complete your deposit verification first.' };
    }

    const task = DEFAULT_TASKS.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found.' };

    // Check existing pending log
    const { data: existingLogs } = await supabase
      .from('task_logs')
      .select('id, status, submitted_at')
      .eq('user_id', user.id)
      .eq('task_id', taskId);

    const hasPendingLog = (existingLogs ?? []).some((l: any) => l.status === 'pending');
    if (hasPendingLog) {
      return { success: false, message: 'You already have a pending review for this task.' };
    }

    // Daily check-in: instant approval
    if (task.category === 'checkin') {
      const today = new Date().toDateString();
      const doneToday = (existingLogs ?? []).some(
        (l: any) => new Date(l.submitted_at).toDateString() === today && l.status === 'approved'
      );
      if (doneToday) return { success: false, message: 'Already checked in today.' };

      const { error: logError } = await supabase.from('task_logs').insert({
        id: 'LOG-' + generateId(),
        user_id: user.id,
        task_id: task.id,
        task_title: task.title,
        submitted_at: new Date().toISOString(),
        status: 'approved',
        proof: 'Daily Attendance Authorized',
      });

      if (logError) return { success: false, message: logError.message };

      // Credit wallet instantly
      await supabase
        .from('profiles')
        .update({ wallet_balance: user.walletBalance + task.reward })
        .eq('id', user.id);

      this._cachedUser = null;
      await this._logActivity(user.id, 'TASK_COMPLETED', `Check-in by ${user.email}. $${task.reward} credited.`);
      return { success: true, message: `Check-in successful! $${task.reward} added to your wallet.` };
    }

    // Social/promo tasks: pending review
    const { error } = await supabase.from('task_logs').insert({
      id: 'LOG-' + generateId(),
      user_id: user.id,
      task_id: task.id,
      task_title: task.title,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      proof: proofText || 'Screenshot Submitted',
    });

    if (error) return { success: false, message: error.message };
    await this._logActivity(user.id, 'TASK_SUBMITTED', `User ${user.email} submitted proof for: ${task.title}.`);
    return { success: true, message: 'Task submitted. Our team will review shortly.' };
  }

  // ── Withdrawals ───────────────────────────────────────────────────────────

  async submitWithdrawal(
    amount: number,
    bankAccountId: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    if (!user.isEmailVerified) return { success: false, message: 'Verify your email to withdraw.' };
    if (user.status === 'Pending Verification') return { success: false, message: 'Account not yet verified.' };
    if (!user.activePlanId) return { success: false, message: 'No active investment plan found.' };

    const plan = PLANS[user.activePlanId];
    if (user.planAccumulatedEarnings < plan.price) {
      return {
        success: false,
        message: `Capital Lock: Earnings must reach $${plan.price} before withdrawal. Current: $${user.planAccumulatedEarnings}.`,
      };
    }

    if (user.kycStatus !== 'Approved') {
      return { success: false, message: 'KYC verification required before withdrawals.' };
    }
    if (!user.kyc?.hasPaidFee) {
      return { success: false, message: 'KYC processing fee ($15) unpaid. Go to Profile to authorise payment.' };
    }
    if (user.walletBalance < amount) {
      return { success: false, message: `Insufficient balance. Available: $${user.walletBalance}.` };
    }

    const accounts = await this.getBankAccounts();
    const bnk = accounts.find((a) => a.id === bankAccountId);
    if (!bnk) return { success: false, message: 'Bank account not found.' };

    const receiptId = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = 'TXN-' + Math.floor(100000 + Math.random() * 90000).toString();

    // Deduct immediately (held pending admin approval)
    await supabase
      .from('profiles')
      .update({ wallet_balance: user.walletBalance - amount })
      .eq('id', user.id);

    await supabase.from('transactions').insert({
      id: txId,
      user_id: user.id,
      user_email: user.email,
      type: 'withdrawal',
      amount,
      status: 'pending',
      date: new Date().toISOString(),
      bank_details: `${bnk.bankName} - ${bnk.accountName} (${bnk.accountNumber})`,
      receipt_id: receiptId,
    });

    this._cachedUser = null;
    await this._logActivity(user.id, 'WITHDRAWAL_REQUEST', `User ${user.email} requested $${amount} withdrawal to ${bnk.bankName}.`);
    return { success: true, message: 'Withdrawal submitted. Funds will be transferred once authorised.' };
  }

  // ── Support Tickets ───────────────────────────────────────────────────────

  async openSupportTicket(
    subject: string,
    category: string,
    firstMessage: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };

    const ticketId = 'TCK-' + Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabase.from('support_tickets').insert({
      id: ticketId,
      user_id: user.id,
      user_email: user.email,
      subject,
      category,
      status: 'open',
      created_at: new Date().toISOString(),
      messages: [{ sender: 'user', message: firstMessage, timestamp: new Date().toISOString() }],
    });

    if (error) return { success: false, message: error.message };
    await this._logActivity(user.id, 'SUPPORT_OPENED', `User ${user.email} opened ticket #${ticketId}.`);
    return { success: true, message: 'Support ticket submitted. Our agents will respond shortly.' };
  }

  async replyToTicket(
    ticketId: string,
    message: string,
    sender: 'user' | 'admin'
  ): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('messages')
      .eq('id', ticketId)
      .single();

    if (error || !data) return { success: false, message: 'Ticket not found.' };

    const updatedMessages = [
      ...(data.messages || []),
      { sender, message, timestamp: new Date().toISOString() },
    ];

    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({ messages: updatedMessages })
      .eq('id', ticketId);

    if (updateError) return { success: false, message: updateError.message };
    return { success: true, message: 'Reply posted.' };
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  async getCurrentUserTransactions(): Promise<Transaction[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []).map(rowToTransaction);
  }

  async getCurrentUserTickets(): Promise<SupportTicket[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email,
      subject: r.subject,
      category: r.category,
      status: r.status,
      createdAt: r.created_at,
      messages: r.messages ?? [],
    }));
  }

  async getCurrentUserTaskLogs(): Promise<TaskLog[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('task_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      taskId: r.task_id,
      taskTitle: r.task_title,
      submittedAt: r.submitted_at,
      status: r.status,
      proof: r.proof ?? '',
    }));
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, referral_code, referral_earnings_accumulated')
      .neq('email', 'admin@leadsglobal.com')
      .order('referral_earnings_accumulated', { ascending: false });

    if (error) { console.error(error); return []; }

    // Count referrals per user from DB
    const entries: LeaderboardEntry[] = await Promise.all(
      (data ?? []).map(async (u, index) => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by_code', u.referral_code);

        return {
          userId: u.id,
          email: u.email,
          referralCount: count ?? 0,
          totalReferralEarnings: Number(u.referral_earnings_accumulated ?? 0),
          rank: index + 1,
        };
      })
    );

    return entries;
  }

  async getAnnouncements(): Promise<{ id: string; text: string; date: string }[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) { console.error(error); return []; }
    return data ?? [];
  }

  async getSystemLogs(): Promise<{ id: string; action: string; date: string; details: string }[]> {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(200);

    if (error) { console.error(error); return []; }
    return data ?? [];
  }

  // ── Admin Operations ──────────────────────────────────────────────────────

  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []).map(rowToTransaction);
  }

  async getAllTaskLogs(): Promise<TaskLog[]> {
    const { data, error } = await supabase
      .from('task_logs')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      taskId: r.task_id,
      taskTitle: r.task_title,
      submittedAt: r.submitted_at,
      status: r.status,
      proof: r.proof ?? '',
    }));
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email,
      subject: r.subject,
      category: r.category,
      status: r.status,
      createdAt: r.created_at,
      messages: r.messages ?? [],
    }));
  }

  async adminApproveDeposit(txId: string): Promise<{ success: boolean; message: string }> {
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', txId)
      .single();

    if (txError || !tx) return { success: false, message: 'Transaction not found.' };
    if (tx.type !== 'deposit') return { success: false, message: 'Not a deposit transaction.' };
    if (tx.status !== 'pending') return { success: false, message: 'Transaction already processed.' };

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', tx.user_id)
      .single();

    if (!profileData) return { success: false, message: 'User not found.' };
    const user = rowToProfile(profileData);

    // Approve the transaction
    await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);

    // Credit wallet and activate user
    await supabase
      .from('profiles')
      .update({
        status: 'Active',
        wallet_balance: user.walletBalance + tx.amount,
        total_deposited: user.totalDeposited + tx.amount,
        pending_deposited: Math.max(0, user.pendingDeposited - tx.amount),
      })
      .eq('id', user.id);

    // Referral bonus: 10% to sponsor
    if (user.referredByCode) {
      const { data: sponsor } = await supabase
        .from('profiles')
        .select('*')
        .eq('referral_code', user.referredByCode)
        .single();

      if (sponsor && sponsor.status === 'Active') {
        const bonus = tx.amount * 0.10;
        await supabase
          .from('profiles')
          .update({
            wallet_balance: Number(sponsor.wallet_balance) + bonus,
            referral_earnings_accumulated: Number(sponsor.referral_earnings_accumulated) + bonus,
          })
          .eq('id', sponsor.id);

        await supabase.from('transactions').insert({
          id: 'TXN-REF-' + generateId(),
          user_id: sponsor.id,
          user_email: sponsor.email,
          type: 'referral_bonus',
          amount: bonus,
          status: 'approved',
          date: new Date().toISOString(),
          tx_hash: `REFERRAL_CREDIT_${user.email}`,
          receipt_id: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      }
    }

    await this._logActivity(tx.user_id, 'DEPOSIT_APPROVED', `Admin approved $${tx.amount} deposit for ${user.email}.`);
    return { success: true, message: `Deposit of $${tx.amount} approved. User account activated.` };
  }

  async adminRejectDeposit(txId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (!tx) return { success: false, message: 'Transaction not found.' };
    if (tx.status !== 'pending') return { success: false, message: 'Already processed.' };

    await supabase.from('transactions').update({ status: 'rejected', rejection_reason: reason }).eq('id', txId);

    const { data: p } = await supabase.from('profiles').select('pending_deposited').eq('id', tx.user_id).single();
    if (p) {
      await supabase
        .from('profiles')
        .update({ pending_deposited: Math.max(0, Number(p.pending_deposited) - tx.amount) })
        .eq('id', tx.user_id);
    }

    await this._logActivity(tx.user_id, 'DEPOSIT_REJECTED', `Admin rejected $${tx.amount} deposit. Reason: ${reason}`);
    return { success: true, message: 'Deposit rejected.' };
  }

  async adminApproveWithdrawal(txId: string): Promise<{ success: boolean; message: string }> {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (!tx || tx.type !== 'withdrawal') return { success: false, message: 'Withdrawal not found.' };
    if (tx.status !== 'pending') return { success: false, message: 'Already processed.' };

    await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);

    const { data: p } = await supabase.from('profiles').select('withdrawn_amount').eq('id', tx.user_id).single();
    if (p) {
      await supabase
        .from('profiles')
        .update({ withdrawn_amount: Number(p.withdrawn_amount) + tx.amount })
        .eq('id', tx.user_id);
    }

    await this._logActivity(tx.user_id, 'WITHDRAWAL_APPROVED', `Admin approved $${tx.amount} withdrawal for ${tx.user_email}.`);
    return { success: true, message: 'Withdrawal approved and disbursed.' };
  }

  async adminRejectWithdrawal(txId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (!tx || tx.type !== 'withdrawal') return { success: false, message: 'Withdrawal not found.' };
    if (tx.status !== 'pending') return { success: false, message: 'Already processed.' };

    await supabase.from('transactions').update({ status: 'rejected', rejection_reason: reason }).eq('id', txId);

    // Refund wallet
    const { data: p } = await supabase.from('profiles').select('wallet_balance').eq('id', tx.user_id).single();
    if (p) {
      await supabase
        .from('profiles')
        .update({ wallet_balance: Number(p.wallet_balance) + tx.amount })
        .eq('id', tx.user_id);
    }

    await this._logActivity(tx.user_id, 'WITHDRAWAL_REJECTED', `Admin rejected $${tx.amount} withdrawal. Reason: ${reason}`);
    return { success: true, message: 'Withdrawal rejected. Funds returned to wallet.' };
  }

  async adminApproveKYC(userId: string): Promise<{ success: boolean; message: string }> {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!p || !p.kyc_data) return { success: false, message: 'User or KYC data not found.' };

    const updatedKyc = { ...p.kyc_data, status: 'Approved' };
    await supabase.from('profiles').update({ kyc_status: 'Approved', kyc_data: updatedKyc }).eq('id', userId);
    await this._logActivity(userId, 'KYC_APPROVED', `KYC approved for ${p.email}.`);
    return { success: true, message: `KYC approved for ${p.email}.` };
  }

  async adminRejectKYC(userId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!p) return { success: false, message: 'User not found.' };

    const updatedKyc = { ...p.kyc_data, status: 'Rejected', rejectionReason: reason };
    await supabase.from('profiles').update({ kyc_status: 'Rejected', kyc_data: updatedKyc }).eq('id', userId);
    await this._logActivity(userId, 'KYC_REJECTED', `KYC rejected for ${p.email}. Reason: ${reason}`);
    return { success: true, message: 'KYC rejected.' };
  }

  async adminAdjustUserFields(
    userId: string,
    walletBalance: number,
    isEmailVerified: boolean,
    status: 'Pending Verification' | 'Active' | 'Banned'
  ): Promise<{ success: boolean; message: string }> {
    const { data: p } = await supabase.from('profiles').select('email').eq('id', userId).single();
    if (!p) return { success: false, message: 'User not found.' };

    await supabase
      .from('profiles')
      .update({ wallet_balance: walletBalance, is_email_verified: isEmailVerified, status })
      .eq('id', userId);

    await this._logActivity(userId, 'USER_FORCE_ADJUSTED', `Admin adjusted ${p.email}: balance=$${walletBalance}, status=${status}.`);
    return { success: true, message: `Account updated for ${p.email}.` };
  }

  async adminPostAnnouncement(text: string): Promise<void> {
    await supabase.from('announcements').insert({
      id: 'ANN-' + Math.floor(100 + Math.random() * 900),
      text,
      date: new Date().toISOString(),
    });
  }

  async adminApproveTaskLog(logId: string): Promise<{ success: boolean; message: string }> {
    const { data: log } = await supabase.from('task_logs').select('*').eq('id', logId).single();
    if (!log) return { success: false, message: 'Task log not found.' };
    if (log.status !== 'pending') return { success: false, message: 'Already resolved.' };

    const task = DEFAULT_TASKS.find((t) => t.id === log.task_id);
    if (!task) return { success: false, message: 'Associated task no longer exists.' };

    await supabase.from('task_logs').update({ status: 'approved' }).eq('id', logId);

    const { data: p } = await supabase.from('profiles').select('wallet_balance, email').eq('id', log.user_id).single();
    if (p) {
      await supabase
        .from('profiles')
        .update({ wallet_balance: Number(p.wallet_balance) + task.reward })
        .eq('id', log.user_id);
    }

    await this._logActivity(log.user_id, 'TASK_APPROVED', `Task "${task.title}" approved for ${p?.email}. $${task.reward} credited.`);
    return { success: true, message: `Task approved. $${task.reward} credited.` };
  }

  async adminRejectTaskLog(logId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase.from('task_logs').update({ status: 'rejected' }).eq('id', logId);
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Task log rejected.' };
  }

  async simulateWeekdaysPassage(
    daysToSimulate: number
  ): Promise<{ creditTotal: number; details: string[] }> {
    const allUsers = await this.getAllUsers();
    const activeInvestors = allUsers.filter(
      (u) => u.status === 'Active' && u.activePlanId && u.isEmailVerified
    );

    let creditTotal = 0;
    const logs: string[] = [];

    for (const user of activeInvestors) {
      if (!user.activePlanId) continue;
      const plan = PLANS[user.activePlanId];
      const totalEarned = plan.dailyEarning * daysToSimulate;

      await supabase
        .from('profiles')
        .update({
          wallet_balance: user.walletBalance + totalEarned,
          daily_earnings_accumulated: user.dailyEarningsAccumulated + totalEarned,
          plan_accumulated_earnings: user.planAccumulatedEarnings + totalEarned,
        })
        .eq('id', user.id);

      creditTotal += totalEarned;
      logs.push(`Credited $${totalEarned} to ${user.email} (${plan.name} × ${daysToSimulate} days)`);

      if (user.referredByCode) {
        const sponsor = allUsers.find((s) => s.referralCode === user.referredByCode);
        if (sponsor && sponsor.status === 'Active') {
          const refBonus = totalEarned * 0.10;
          await supabase
            .from('profiles')
            .update({
              wallet_balance: sponsor.walletBalance + refBonus,
              referral_earnings_accumulated: sponsor.referralEarningsAccumulated + refBonus,
            })
            .eq('id', sponsor.id);
          logs.push(`Referral bonus $${refBonus.toFixed(2)} → ${sponsor.email}`);
        }
      }
    }

    if (activeInvestors.length > 0) {
      await this._logActivity('system', 'WEEKDAY_SIMULATION', `Fast-forwarded ${daysToSimulate} days for ${activeInvestors.length} investors.`);
    }

    return { creditTotal, details: logs };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async _fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return rowToProfile(data);
  }

  private async _logActivity(userId: string, action: string, details: string): Promise<void> {
    await supabase.from('system_logs').insert({
      id: 'LOG-' + generateId(),
      user_id: userId !== 'system' ? userId : null,
      action,
      details,
      date: new Date().toISOString(),
    });
  }
}

// ─── Singleton export (drop-in replacement for dbService) ────────────────────
export const dbService = new SupabaseService();