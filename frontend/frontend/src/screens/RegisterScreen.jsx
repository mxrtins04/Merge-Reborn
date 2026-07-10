import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api } from '../api';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const data = await api.post('/auth/register', {
        email,
        password,
        name: fullName,
      });
      localStorage.setItem('merge_jwt', data.accessToken);
      localStorage.setItem('merge_student', JSON.stringify({
        fullName,
        email,
        total_xp: 0,
        current_stage: '',
      }));
      navigate('/setup/gemini');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[400px] animate-fade-up">
        <div className="mb-8">
          <h1 className="font-display text-[22px] font-bold text-[#e1e2ec] tracking-tight">
            Create account
          </h1>
          <p className="font-mono-code text-[11px] text-[#c2c6d6] mt-1 uppercase tracking-wider">
            Begin your engineering formation
          </p>
        </div>

        <div className="w-full bg-[#16181D] border border-[#27272A] p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest"
                htmlFor="full_name"
              >
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                required
                disabled={isSubmitting}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#0b0e15] border border-[#424754] text-[#e1e2ec] font-mono-code text-[13px] px-4 py-3 focus:border-[#adc6ff] transition-colors duration-150 rounded-none outline-none disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label
                className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0b0e15] border border-[#424754] text-[#e1e2ec] font-mono-code text-[13px] px-4 py-3 focus:border-[#adc6ff] transition-colors duration-150 rounded-none outline-none disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label
                className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 12 characters, 1 letter, 1 digit"
                className="w-full bg-[#0b0e15] border border-[#424754] text-[#e1e2ec] font-mono-code text-[13px] px-4 py-3 focus:border-[#adc6ff] transition-colors duration-150 rounded-none outline-none disabled:opacity-50 placeholder-[#424754]"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 bg-[#ffb4ab]/8 border border-[#ffb4ab]/30 px-3 py-2.5">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[14px]">warning</span>
                <p className="font-mono-code text-[11px] text-[#ffb4ab]">{errorMsg}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1d4ed8] disabled:cursor-wait text-white font-mono-code text-[11px] py-4 transition-colors duration-150 rounded-none uppercase tracking-[0.1em] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center font-mono-code text-[11px] text-[#c2c6d6]">
          Already have an account?{' '}
          <button
            className="text-[#adc6ff] hover:underline transition-all duration-150 bg-transparent border-none p-0 cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
