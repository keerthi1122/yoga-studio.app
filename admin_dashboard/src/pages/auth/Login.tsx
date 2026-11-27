import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Lock, Mail, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { signIn, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials. Please check your login details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);

    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Could not send reset link. Ensure email is registered.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4 relative selection:bg-[#D4AF37] selection:text-black">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-fadeInUp">
        {/* Back to Public Site link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#F5D77F] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#F5D77F] border border-[#D4AF37]/30">
            Director & Staff Portal
          </span>
        </div>

        {/* Logo Card */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#8F2F1B] items-center justify-center text-black shadow-lg shadow-[#D4AF37]/20 mb-3">
            <span className="font-serif text-2xl font-black">G</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Guinness Vijay Yoga Academy</h1>
          <p className="text-xs text-slate-400 mt-0.5">Staff & Operations Management Portal</p>
        </div>

        {/* Login or Password Reset Form Box */}
        <div className="glass-dark rounded-3xl p-7 sm:p-8 shadow-2xl border border-white/10">
          {!showForgotPassword ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-white">Director & Faculty Sign In</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your authorized staff credentials to access schedules, purchases, bookings, and ledgers.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 text-xs text-red-300 animate-scaleIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@yogastudio.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setShowForgotPassword(true);
                      }}
                      className="text-xs font-semibold text-[#F5D77F] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter staff password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Rate-Limited Portal
                  </span>
                  <code className="text-[#F5D77F] font-mono text-[10px]">admin@yogastudio.com</code>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black rounded-xl font-bold text-xs shadow-xl shadow-[#D4AF37]/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2 btn-press"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Authenticating Clearance...' : 'Sign In to Management'}</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to sign in</span>
              </button>

              <h2 className="text-lg font-bold text-white mb-1">Password Recovery</h2>
              <p className="text-xs text-slate-400 mb-5">
                Enter your staff email and we will send a secure link to reset your administrative password.
              </p>

              {resetSent ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Instructions Sent</p>
                    <p className="mt-1 text-slate-300">
                      Check your email inbox for password reset instructions. Return to login once updated.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Staff Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@yogastudio.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black rounded-xl font-bold text-xs shadow-lg transition-all btn-press"
                  >
                    {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Public Membership Portal Banner */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl glass-dark border border-[#D4AF37]/40 shadow-sm text-xs font-medium text-slate-300 hover:border-[#D4AF37] hover:text-white transition-all group"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
            <span>Looking for Kids & Pro Yoga Memberships?</span>
            <span className="font-bold text-[#F5D77F] group-hover:underline flex items-center gap-1">
              Explore GVYA Plans <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
