import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS, ROLE_LABELS } from '@/context/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate('/dashboard');
    }
  }

  function quickLogin(acctEmail: string) {
    setEmail(acctEmail);
    setPassword('Demo@1234');
    setError(null);
    setLoading(true);
    signIn(acctEmail, 'Demo@1234').then(({ error }) => {
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        navigate('/dashboard');
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] relative overflow-hidden flex items-center justify-center">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid" style={{
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }} />

      {/* Vertical guides */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-[#e5e4de]" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#e5e4de]" />
        <div className="absolute top-0 bottom-0 left-3/4 w-px bg-[#e5e4de]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Branding */}
        <div className="hidden lg:block fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex flex-col gap-1">
              <div className="w-6 h-0.5 bg-[#3d7068]" />
              <div className="w-8 h-0.5 bg-[#1c1c1c]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-light tracking-tight text-[#1c1c1c]">BHULEKH</h1>
              <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase">Land Record System</p>
            </div>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-2 text-[10px] mono-data text-[#3d7068] tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 bg-[#3d7068] pulse-dot" />
              Intelligent Digitization Platform
            </span>
          </div>

          <h2 className="font-serif text-5xl font-light leading-[1.1] text-[#1c1c1c] mb-6">
            Transforming legacy<br/>
            <span className="italic text-[#b4b4b4]">land records</span> into<br/>
            searchable digital intelligence.
          </h2>

          <p className="text-sm text-[#6b7280] leading-relaxed max-w-md mb-8">
            AI-powered extraction, validation, and verification of land records with GIS integration,
            audit trails, and role-based access for government revenue departments.
          </p>

          <div className="grid grid-cols-3 gap-0 border border-[#e5e4de]">
            {[
              { num: '20', label: 'Documents' },
              { num: '16', label: 'Records' },
              { num: '7', label: 'Pending' },
            ].map((stat, i) => (
              <div key={i} className={`px-4 py-3 ${i < 2 ? 'border-r border-[#e5e4de]' : ''}`}>
                <p className="font-serif text-3xl font-light text-[#1c1c1c]">{stat.num}</p>
                <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login form */}
        <div className="fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <div className="w-6 h-0.5 bg-[#3d7068]" />
              <div className="w-8 h-0.5 bg-[#1c1c1c]" />
            </div>
            <h1 className="font-serif text-xl font-light tracking-tight text-[#1c1c1c]">BHULEKH</h1>
          </div>

          <div className="bg-white/30 border border-[#e5e4de] p-8">
            <h3 className="font-serif text-2xl font-light text-[#1c1c1c] mb-1">Sign In</h3>
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-6">
              Access the digitization platform
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="officer@landrecord.gov.in"
                  className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] editorial-ease placeholder:text-[#b4b4b4] placeholder:text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] editorial-ease placeholder:text-[#b4b4b4] placeholder:text-xs pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-2 text-[#b4b4b4] hover:text-[#1c1c1c]"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-[#f8eded] border border-[#b54545]/30 px-4 py-3 text-sm text-[#b54545]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3d7068] text-[#f7f6f2] py-3 mono-data text-[10px] tracking-[0.25em] uppercase cta-btn disabled:opacity-50 editorial-ease flex items-center justify-center gap-2"
              >
                {loading ? 'Signing In...' : 'Sign In'}
                {!loading && <ArrowRight size={12} />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-3">
                Quick Login — Demo Accounts
              </p>
              <div className="space-y-1">
                {DEMO_ACCOUNTS.map((acct) => (
                  <button
                    key={acct.email}
                    onClick={() => quickLogin(acct.email)}
                    disabled={loading}
                    className="w-full flex items-center justify-between px-3 py-2 border border-[#e5e4de] hover:border-[#3d7068] hover:bg-[#eaf2f0]/30 editorial-ease text-left disabled:opacity-50"
                  >
                    <div>
                      <p className="text-xs text-[#1c1c1c]">{acct.name}</p>
                      <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase mt-0.5">
                        {ROLE_LABELS[acct.role]}
                      </p>
                    </div>
                    <ArrowRight size={12} className="text-[#b4b4b4] flex-shrink-0" />
                  </button>
                ))}
              </div>
              <p className="text-[9px] mono-data text-[#b4b4b4] mt-3 text-center">
                Password for all accounts: Demo@1234
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
