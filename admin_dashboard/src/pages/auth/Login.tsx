import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
      navigate('/dashboard');
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
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-burgundy items-center justify-center text-white shadow-lg shadow-burgundy/25 mb-4">
            <span className="font-serif text-3xl font-bold">Y</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-dark tracking-tight">Prana Yoga Studio</h1>
          <p className="text-sm text-dark-muted mt-1">Administrative & Operations Portal</p>
        </div>

        {/* Login or Password Reset Form Box */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E9DCC5]">
          {!showForgotPassword ? (
            <>
              <h2 className="text-xl font-bold text-dark mb-2">Director & Staff Sign In</h2>
              <p className="text-xs text-dark-muted mb-6">
                Authorized personnel only. Customer access is through the mobile application.
              </p>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1.5">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-dark-muted/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@yogastudio.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-cream/30 border border-[#E9DCC5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setShowForgotPassword(true);
                      }}
                      className="text-xs font-semibold text-burgundy hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-dark-muted/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-cream/30 border border-[#E9DCC5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted/60 hover:text-dark focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-burgundy/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to Management'}</span>
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
                className="flex items-center gap-1.5 text-xs font-semibold text-dark-muted hover:text-burgundy mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to sign in</span>
              </button>

              <h2 className="text-xl font-bold text-dark mb-2">Password Recovery</h2>
              <p className="text-xs text-dark-muted mb-6">
                Enter your staff email and we will send a secure link to reset your administrative password.
              </p>

              {resetSent ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Instructions Sent</p>
                    <p className="mt-1">
                      Check your email inbox for password reset instructions. Return to login once updated.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1.5">
                      Staff Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-dark-muted/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@yogastudio.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-cream/30 border border-[#E9DCC5] rounded-xl text-sm focus:outline-none focus:border-burgundy"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-burgundy/20"
                  >
                    {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
