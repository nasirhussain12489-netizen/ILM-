import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Lock, Mail, KeyRound, X, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import {
  auth,
  googleAuthProvider,
  syncAdminSessionToFirestore,
} from '../lib/firebase.ts';
import { safeFetchJson, formatErrorMessage } from '../lib/api.ts';
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
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fillSuperAdminCredentials = () => {
    setEmail('nasirhussin12489@gmail.com');
    setPassword('9934886605dilD@');
    setError(null);
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { ok, data, error: apiErr } = await safeFetchJson<{
        token: string;
        user: AdminUser;
      }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Invalid Gmail or password.');
      }

      await syncAdminSessionToFirestore(data.user);
      onLoginSuccess(data.token, data.user);
    } catch (err: unknown) {
      setError(formatErrorMessage(err, 'Authentication failed. Please verify your credentials.'));
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

      const { ok, data, error: apiErr } = await safeFetchJson<{
        user: AdminUser;
      }>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!ok || !data) {
        throw new Error(
          apiErr ||
            'Your Gmail account is not registered. Please ask the Super Admin to add your Gmail.'
        );
      }

      await syncAdminSessionToFirestore(data.user);
      onLoginSuccess(idToken, data.user);
    } catch (err: any) {
      const code = err?.code || '';
      let friendly = formatErrorMessage(err, 'Google Sign-In could not be completed.');

      if (
        code === 'auth/internal-error' ||
        code === 'auth/unauthorized-domain' ||
        code === 'auth/configuration-not-found' ||
        friendly.includes('auth/internal-error')
      ) {
        friendly =
          'Firebase Google Popup is not enabled for this domain (auth/internal-error). Please use your Gmail & Password above to login directly (nasirhussin12489@gmail.com).';
      } else if (code === 'auth/popup-closed-by-user') {
        friendly = 'Sign-in popup was closed before completion.';
      } else if (code === 'auth/popup-blocked') {
        friendly = 'Browser blocked the popup window. Please allow popups or use Gmail & Password above.';
      }

      setError(friendly);
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
      const { ok, data, error: apiErr } = await safeFetchJson<{
        message?: string;
      }>('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          currentPassword: password,
          newPassword,
        }),
      });

      if (!ok || !data) {
        throw new Error(apiErr || 'Password reset failed.');
      }

      setSuccessMsg(data.message || 'Password updated. You may now sign in.');
      setMode('login');
      setPassword(newPassword);
      setNewPassword('');
    } catch (err: unknown) {
      setError(formatErrorMessage(err, 'Password reset failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0B0D14] border border-[#D4AF37]/40 shadow-2xl overflow-hidden p-7 sm:p-9">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Gmail login"
          className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <IlmLogo size="sm" showSubtitle />
          <h3 className="font-display text-2xl font-bold text-white mt-5">
            {mode === 'login' ? 'Sign In with Gmail' : 'Change Password'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'login'
              ? 'Enter your registered Gmail address and password to open your dashboard.'
              : 'Verify your current password to set a new password.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-950/60 border border-red-700/60 text-xs text-red-200 space-y-2">
            <p>{error}</p>
            {mode === 'login' && (
              <button
                type="button"
                onClick={fillSuperAdminCredentials}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3D068] text-[11px] font-semibold cursor-pointer border border-[#D4AF37]/40 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Fill Super Admin Login (nasirhussin12489@gmail.com)</span>
              </button>
            )}
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
                Gmail Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Gmail (e.g. example@gmail.com)"
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
                  Change password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] hover:brightness-110 text-neutral-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Login with Gmail & Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-neutral-800" />
              <span className="flex-shrink mx-3 text-xs text-neutral-500 uppercase">
                or Firebase Google Auth
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
              <span>Continue with Google Popup</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Gmail Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Gmail address"
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
  );
};

