import { ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'admin' | 'privacy' | 'terms') => void;
}

const sections = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing or using the LeadsGlobal platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.`,
  },
  {
    title: 'Eligibility',
    content: `You must be at least 18 years of age to use LeadsGlobal. By registering an account, you confirm that you are of legal age in your jurisdiction and have the legal capacity to enter into a binding agreement. We reserve the right to verify your identity at any time.`,
  },
  {
    title: 'Account Registration',
    content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration and to update your information as necessary. Accounts are non-transferable.`,
  },
  {
    title: 'Investment Plans',
    content: `LeadsGlobal offers a range of investment plans with varying yield rates and terms. All investment returns are projected and not guaranteed. Past performance is not indicative of future results. By selecting a plan, you acknowledge the inherent risks associated with financial investments.`,
  },
  {
    title: 'Prohibited Activities',
    content: `You agree not to use the platform for any unlawful purpose, to impersonate any person or entity, to interfere with platform security, to engage in money laundering or fraudulent activity, or to upload harmful code or malicious content. Violations may result in immediate account termination.`,
  },
  {
    title: 'Referral Program',
    content: `LeadsGlobal operates a referral program that awards bonuses for verified referrals. Referral abuse, including self-referrals or fraudulent sign-ups, will result in forfeiture of all referral rewards and account suspension. Referral bonuses are subject to change without notice.`,
  },
  {
    title: 'Intellectual Property',
    content: `All content on the LeadsGlobal platform, including but not limited to text, graphics, logos, and software, is the property of LeadsGlobal and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written consent.`,
  },
  {
    title: 'Limitation of Liability',
    content: `LeadsGlobal shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including loss of profits, data, or investment capital. Our total liability to you shall not exceed the amount deposited in your account in the 30 days preceding the claim.`,
  },
  {
    title: 'Termination',
    content: `We reserve the right to suspend or terminate your account at our sole discretion, with or without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, third parties, or the platform. Upon termination, your right to use the platform ceases immediately.`,
  },
  {
    title: 'Governing Law',
    content: `These Terms shall be governed by and construed in accordance with applicable international financial regulations. Any disputes arising under these Terms shall be resolved through binding arbitration in accordance with established commercial arbitration rules.`,
  },
];

export default function TermsOfService({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans py-16 px-4 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4af37]/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back button */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#D4AF37] transition font-mono uppercase tracking-widest mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-white/[0.06]">
          <p className="text-xs text-[#C5A059] font-mono uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-display font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-400">
            Last updated: <span className="text-gray-300 font-mono">June 2025</span>
          </p>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            Please read these Terms of Service carefully before using the LeadsGlobal platform. These terms govern your access to and use of our fintech investment services.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i} className="liquid-glass rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-[10px] font-mono text-[#8C6D23] mt-1 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white mb-3 font-display">{section.title}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agreement notice */}
        <div className="mt-12 p-6 rounded-2xl border border-[#D4AF37]/15 bg-[#1C1A12]/60">
          <p className="text-xs font-mono text-[#C5A059] uppercase tracking-widest mb-2">Agreement</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            By using LeadsGlobal, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. For questions, contact us at{' '}
            <a href="mailto:support@leadglobal.online" className="text-[#D4AF37] hover:underline">
              support@leadglobal.online
            </a>
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-600 font-mono tracking-wider mt-12">
          LEADSGLOBAL &bull; GLOBAL ENCRYPTED SANDBOX &bull; ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  );
}
