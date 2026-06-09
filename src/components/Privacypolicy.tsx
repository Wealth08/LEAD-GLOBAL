import { ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'admin' | 'privacy' | 'terms') => void;
}

const sections = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly to us when you create an account, including your email address, phone number, country of residence, and any referral codes used during registration. We also collect usage data such as login timestamps, session activity, and device information to maintain platform security.`,
  },
  {
    title: 'How We Use Your Information',
    content: `Your information is used to operate and maintain your account, send authentication and transactional emails, process investment plan selections, detect and prevent fraudulent activity, and comply with applicable financial regulations. We do not sell your personal data to third parties.`,
  },
  {
    title: 'Data Security',
    content: `We implement industry-standard encryption and security protocols to protect your personal information. All data transmissions are secured via TLS. Access to personal data is restricted to authorised personnel only. Despite our best efforts, no method of transmission over the internet is 100% secure.`,
  },
  {
    title: 'Data Retention',
    content: `We retain your personal data for as long as your account remains active or as required by law. Inactive accounts may be purged after 72 hours of inactivity during the verification period. You may request deletion of your account and associated data at any time by contacting our support team.`,
  },
  {
    title: 'Cookies',
    content: `We use essential cookies to maintain your session and ensure platform functionality. We do not use advertising or tracking cookies. You may disable cookies in your browser settings, though this may affect platform performance.`,
  },
  {
    title: 'Third-Party Services',
    content: `We use trusted third-party providers for authentication (Supabase), email delivery, and payment processing. These providers are contractually obligated to handle your data securely and only for the purposes we specify.`,
  },
  {
    title: 'Your Rights',
    content: `Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data, object to processing, or request data portability. To exercise any of these rights, contact us at support@leadglobal.online.`,
  },

  {
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPolicy({ onNavigate }: Props) {
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
          <h1 className="text-4xl font-display font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-400">
            Last updated: <span className="text-gray-300 font-mono">June 2025</span>
          </p>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            LeadsGlobal ("we", "our", or "us") is committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you use our platform.
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

        {/* Contact */}
        <div className="mt-12 p-6 rounded-2xl border border-[#D4AF37]/15 bg-[#1C1A12]/60">
          <p className="text-xs font-mono text-[#C5A059] uppercase tracking-widest mb-2">Contact</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            For privacy-related questions, contact us at{' '}
            <a href="mailto:support@leadglobal.online" className="text-[#D4AF37] hover:underline">
              support@leadglobal.online
            </a>
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