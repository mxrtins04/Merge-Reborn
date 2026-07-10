import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MergeLogo from '../components/MergeLogo';
import { api } from '../api';

export default function GeminiTokenSetupScreen() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitToken = async (e) => {
    e.preventDefault();
    if (!token.startsWith('AIzaSy')) {
      setErrorMsg('Invalid token format. Gemini API keys begin with "AIzaSy".');
      return;
    }
    setErrorMsg('');
    setVerifying(true);

    try {
      await api.post('/students/me/credentials', { token });
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save credential.');
    } finally {
      setVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0F12] text-[#E1E2EC] animate-fade-up">
        <header className="fixed top-0 left-0 w-full h-[48px] flex items-center justify-center px-6 bg-[#10131a] border-b border-[#27272A] z-50">
          <MergeLogo height={18} />
        </header>

        <main className="w-full max-w-[400px] mx-auto px-6">
          <div className="bg-[#16181D] border border-[#27272A] p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-5">
              <div>
                <span className="font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest block mb-1">Gemini API Key</span>
                <h1 className="font-display text-[20px] font-bold text-[#e1e2ec]">Key accepted</h1>
              </div>
              <div className="h-8 w-8 flex items-center justify-center border border-[#adc6ff] text-[#adc6ff]">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#6ee7b7] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="font-mono-code text-[12px] text-[#6ee7b7]">Encrypted and stored securely.</span>
            </div>

            <div className="grid grid-cols-2 border border-[#27272A]">
              <div className="p-3 border-r border-[#27272A] bg-[#191b23]">
                <span className="block font-mono-code text-[9px] text-[#c2c6d6] uppercase tracking-widest mb-1">Status</span>
                <span className="block font-mono-code text-[11px] text-[#adc6ff]">ACTIVE</span>
              </div>
              <div className="p-3 bg-[#191b23]">
                <span className="block font-mono-code text-[9px] text-[#c2c6d6] uppercase tracking-widest mb-1">Encryption</span>
                <span className="block font-mono-code text-[11px] text-[#adc6ff]">AES-256-GCM</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/onboarding')}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono-code text-[11px] py-4 transition-colors flex items-center justify-center gap-2 group rounded-none uppercase tracking-[0.1em]"
            >
              <span>Continue to Profile Setup</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0D0F12] text-[#e1e2ec]">
      <header className="absolute top-0 left-0 w-full h-[48px] flex items-center justify-center px-6 bg-[#10131a] border-b border-[#27272A] z-10">
        <MergeLogo height={18} />
      </header>

      <main className="w-full max-w-[400px] z-10 flex flex-col gap-8 animate-fade-up">
        <div className="bg-[#16181D] border border-[#27272A] p-8">
          <div className="mb-8 border-b border-[#27272A] pb-6">
            <h2 className="font-display text-[20px] font-bold text-[#e1e2ec] tracking-tight">Connect Gemini</h2>
            <p className="font-mono-code text-[11px] text-[#c2c6d6] mt-1.5 uppercase tracking-wider">
              Merge needs your API key to generate drills
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmitToken}>
            <div className="flex flex-col gap-2">
              <label className="font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest" htmlFor="api_token">
                Gemini API Key
              </label>
              <input
                id="api_token"
                type="password"
                required
                disabled={verifying}
                placeholder="AIzaSy…"
                value={token}
                onChange={e => { setToken(e.target.value); if (errorMsg) setErrorMsg(''); }}
                className={`w-full bg-[#0b0e15] font-mono-code text-[13px] text-[#e1e2ec] px-4 py-3 rounded-none outline-none border transition-colors duration-150 disabled:opacity-50 placeholder-[#424754] ${
                  errorMsg ? 'border-[#ffb4ab]' : 'border-[#424754] focus:border-[#adc6ff]'
                }`}
              />
              {errorMsg && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb4ab] text-[13px]">warning</span>
                  <p className="font-mono-code text-[11px] text-[#ffb4ab]">{errorMsg}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full font-mono-code text-[11px] h-[48px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 rounded-none border-none bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors duration-150 disabled:bg-[#1d4ed8] disabled:cursor-wait"
            >
              {verifying ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying…</span>
                </>
              ) : 'Submit Key'}
            </button>

            <div className="pt-3 border-t border-[#27272A] flex items-start gap-3">
              <span className="material-symbols-outlined text-[#c2c6d6] text-[18px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <p className="font-mono-code text-[11px] text-[#c2c6d6] leading-relaxed">
                Encrypted immediately — never stored in plain text or returned in API responses.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
