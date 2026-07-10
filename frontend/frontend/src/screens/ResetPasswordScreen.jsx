import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api } from '../api';

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setErrorMsg('Please enter your reset token.'); return; }
    if (newPassword.length < 12) {
      setErrorMsg('Password must be at least 12 characters and contain a letter and digit.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, newPassword });
      setSuccessMsg('Password updated. Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to confirm reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[400px] animate-fade-up">
        <div className="mb-8">
          <h1 className="font-display text-[22px] font-bold text-[#e1e2ec] tracking-tight">New password</h1>
          <p className="font-mono-code text-[11px] text-[#c2c6d6] mt-1 uppercase tracking-wider">
            Enter your reset token and a new password
          </p>
        </div>

        <div className="w-full bg-[#16181D] border border-[#27272A] p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest" htmlFor="reset_token">
                Reset Token
              </label>
              <input
                id="reset_token"
                type="text"
                required
                disabled={isSubmitting}
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full bg-[#0b0e15] border border-[#424754] text-[#e1e2ec] font-mono-code text-[13px] px-4 py-3 focus:border-[#adc6ff] transition-colors duration-150 rounded-none outline-none disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest" htmlFor="new_password">
                New Password
              </label>
              <input
                id="new_password"
                type="password"
                required
                disabled={isSubmitting}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="12+ characters, letter + digit"
                className="w-full bg-[#0b0e15] border border-[#424754] text-[#e1e2ec] font-mono-code text-[13px] px-4 py-3 focus:border-[#adc6ff] transition-colors duration-150 rounded-none outline-none disabled:opacity-50 placeholder-[#424754]"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 border border-[#ffb4ab]/30 px-3 py-2.5">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[14px]">warning</span>
                <p className="font-mono-code text-[11px] text-[#ffb4ab]">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 border border-[#adc6ff]/30 px-3 py-2.5">
                <span className="material-symbols-outlined text-[#adc6ff] text-[14px]">check_circle</span>
                <p className="font-mono-code text-[11px] text-[#adc6ff]">{successMsg}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1d4ed8] disabled:cursor-wait text-white font-mono-code text-[11px] py-4 transition-colors duration-150 rounded-none uppercase tracking-[0.1em]"
              >
                {isSubmitting ? 'Resetting…' : 'Confirm New Password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full border border-[#424754] hover:bg-[#1d2027] text-[#c2c6d6] py-3 font-mono-code text-[10px] uppercase tracking-wider rounded-none transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
