
export type Language = 'en' | 'fr' | 'es' | 'pt' | 'ar';

export interface TranslationSchema {
  slogan: string;
  subSlogan1: string;
  subSlogan2: string;
  getStarted: string;
  login: string;
  signup: string;
  logout: string;
  dashboard: string;
  depositStatus: string;
  kycStatus: string;
  emailVerifyNotice: string;
  paymentPendingNotice: string;
  activePlan: string;
  plans: string;
  referrals: string;
  leaderboard: string;
  tasks: string;
  support: string;
  adminPanel: string;
  walletBalance: string;
  withdrawable: string;
  totalDeposited: string;
  pendingDeposits: string;
  dailyEarnings: string;
  referralEarnings: string;
  progressToTarget: string;
  recentTransactions: string;
  referralLink: string;
  referralCount: string;
}

export type InvestmentPlanId = 'regular' | 'gold' | 'titanium' | 'platinum';

export interface InvestmentPlan {
  id: InvestmentPlanId;
  name: string;
  price: number;
  dailyEarning: number;
  description: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  iban?: string;
  country: string;
  currency: string;
  isPreferred: boolean;
}

export interface KYCData {
  idType: string;
  idNumber: string;
  fullName: string;
  addressProofUrl?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
  submittedAt: string;
  status: 'None' | 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  hasPaidFee: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  isEmailVerified: boolean;
  phone?: string;
  country?: string;
  timezone?: string;
  createdAt: string;
  referralCode: string;
  referredByCode?: string;
  status: 'Pending Verification' | 'Active' | 'Banned'; // 'Pending Verification' if payment is unsubmitted/unapproved
  kycStatus: 'None' | 'Pending' | 'Approved' | 'Rejected';
  kyc?: KYCData;
  telegramHandle?: string;
  whatsappNumber?: string;
  notificationsEnabled: {
    telegram: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  // Balances
  walletBalance: number;       // Current general wallet
  totalDeposited: number;      // Successfully approved deposits
  pendingDeposited: number;    // Unapproved screenshot-loaded requests
  dailyEarningsAccumulated: number; // accumulated weekday profits
  referralEarningsAccumulated: number; // accumulated referral commissions
  withdrawnAmount: number;     // all time withdrawn
  activePlanId?: InvestmentPlanId;
  planActivatedAt?: string;
  planAccumulatedEarnings: number; // current run earnings for active plan
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: 'deposit' | 'withdrawal' | 'earning' | 'referral_bonus' | 'kyc_fee';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  proofUrl?: string; // payment screenshot
  rejectionReason?: string;
  txHash?: string;
  bankDetails?: string;
  receiptId: string;
}

export interface DailyTask {
  id: string;
  title: string;
  category: 'social' | 'promo' | 'checkin';
  reward: number;
  instructions: string;
  link?: string;
}

export interface TaskLog {
  id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  proof?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: string;
  status: 'open' | 'resolved';
  createdAt: string;
  messages: {
    sender: 'user' | 'admin';
    message: string;
    timestamp: string;
  }[];
}

export interface LeaderboardEntry {
  userId: string;
  email: string;
  referralCount: number;
  totalReferralEarnings: number;
  rank: number;
}
