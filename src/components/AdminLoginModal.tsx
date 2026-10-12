import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Lock, Mail, ShieldCheck, KeyRound, X, ArrowRight } from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { AdminUser } from '../types.ts';
import { IlmLogo } from './IlmLogo.tsx';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string, user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid administrator credentials.');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            'Your Google account is not registered as an authorized ILM administrator.'
        );
      }
      onLoginSuccess(idToken, data.user);
    } catch (err: any) {
      setError(
        err.message || 'Google Sign-In could not be completed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          currentPassword: password,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      setSuccessMsg(data.message || 'Password updated. You may now sign in.');
      setMode('login');
      setPassword(newPassword);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminDemoAccount = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0B0D14] border border-[#D4AF37]/40 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close administrator login"
          className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Brand Column (Matches ILM Black & Gold Reference Board) */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-[#121624] via-[#0B0D14] to-[#07080C] border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col justify-between">
          <div>
            <IlmLogo size="lg" showSubtitle />
            <h2 className="font-display text-2xl font-bold text-white mt-8 leading-snug">
              Authorized Administrator Portal
            </h2>
            <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
              Restricted exclusively to authorized ILM Super Admins and assigned Class Admins (U1–U6). Public visitors and scholars do not require an account to browse or download published content.
            </p>
          </div>

          {/* Quick Role Verification Switcher */}
          <div className="mt-8 pt-6 border-t border-neutral-800/90">
            <p className="text-xs font-semibold text-[#F3D068] tracking-wider uppercase mb-3">
              Authorized Admin Quick Select
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  fillAdminDemoAccount(
                    'nasirhussin12489@gmail.com',
                    '9934886605dilD@'
                  )
                }
                className="col-span-2 px-3 py-2 rounded-lg bg-[#161924] hover:bg-[#1E2332] border border-[#D4AF37]/40 text-left text-xs text-white transition-colors cursor-pointer"
              >
                <div className="font-semibold text-[#F3D068]">
                  Super Admin (All Classes U1–U6)
                </div>
                <div className="text-[11px] text-neutral-300 truncate">
                  nasirhussin12489@gmail.com
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  fillAdminDemoAccount('admin@gmail.com', '123456789admin')
                }
                className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-[#D4AF37]/30 text-left text-xs text-neutral-200 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-[#F3D068]">
                  U1 Class Admin
                </div>
                <div className="text-[11px] text-neutral-400 truncate">
                  admin@gmail.com
                </div>
              </button>
              {(['U2', 'U3', 'U4', 'U5', 'U6'] as const).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() =>
                    fillAdminDemoAccount(
                      `${cls.toLowerCase()}.admin@ilm.edu.pk`,
                      'IlmAdmin#2026'
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left text-xs text-neutral-200 transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-white">{cls} Class Admin</div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    Isolated to {cls}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold tracking-wider uppercase mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {mode === 'login'
                ? 'Super Admin & Class Admin Access'
                : 'Administrator Password Update'}
            </span>
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {mode === 'login' ? 'Welcome Back' : 'Reset Administrator Password'}
          </h3>
          <p className="text-sm text-neutral-400 mt-1 mb-6">
            {mode === 'login'
              ? 'Sign in with your administrator credentials or authorized Google account.'
              : 'Verify your current administrator password to set a new password.'}
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-950/60 border border-red-700/60 text-xs text-red-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-xs text-emerald-200">
              {successMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="superadmin@ilm.edu.pk or u2.admin@ilm.edu.pk"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                    }}
                    className="text-xs text-[#F3D068] hover:underline cursor-pointer"
                  >
                    Change / Reset password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] hover:brightness-110 text-neutral-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Login to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-800" />
                <span className="flex-shrink mx-3 text-xs text-neutral-500 uppercase">
                  or authorized OAuth
                </span>
                <div className="flex-grow border-t border-neutral-800" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#151924] hover:bg-[#1C2130] text-white border border-neutral-700 text-sm font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <span>Sign in with Google (Authorized Admin)</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your administrator email"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-sm font-medium cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#D4AF37] hover:bg-[#e3be42] text-neutral-950 font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
