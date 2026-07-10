import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MergeLogo from '../components/MergeLogo';
import { api } from '../api';

const XP_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3 years' },
  { value: 5, label: '5+ years' },
];

const LANGUAGES = [
  { value: 'JAVA', label: 'Java' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'JAVASCRIPT', label: 'JavaScript' },
  { value: 'GO', label: 'Go' },
  { value: 'RUST', label: 'Rust' },
];

const MOTIVATIONS = [
  { value: 'JOB', label: 'Career & Employment' },
  { value: 'CURIOSITY', label: 'Curiosity & Learning' },
  { value: 'ACADEMIC', label: 'Academic Study' },
  { value: 'ENTREPRENEURSHIP', label: 'Building a Business' },
];

function PillGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 font-label-caps text-label-caps border transition-colors duration-150 rounded-none outline-none focus-visible:ring-1 focus-visible:ring-primary ${
            value === opt.value
              ? 'bg-primary border-primary text-white'
              : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CardGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full text-left px-4 py-3 font-body-md text-body-md border transition-colors duration-150 rounded-none outline-none focus-visible:ring-1 focus-visible:ring-primary ${
            value === opt.value
              ? 'bg-primary/10 border-primary text-on-surface'
              : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [yearsOfExperience, setYearsOfExperience] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [motivation, setMotivation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If onboarding is already done (stageId present), skip straight to dashboard.
  useEffect(() => {
    api.get('/students/me').then(student => {
      if (student.stageId) navigate('/dashboard', { replace: true });
    }).catch(() => {});
  }, [navigate]);

  const canSubmit = yearsOfExperience !== null && preferredLanguage && motivation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await api.post('/students/me/onboarding', {
        yearsOfExperience,
        preferredLanguage,
        motivation,
      });

      const student = await api.get('/students/me');
      localStorage.setItem('merge_student', JSON.stringify({
        fullName: student.name,
        email: '',
        total_xp: student.xp,
        current_stage: 'SCOUT',
        stageId: student.stageId,
        id: student.id,
      }));

      navigate('/dashboard');
    } catch (err) {
      // Backend rejects duplicate onboarding with 400 — treat as already done.
      if (err.status === 400 && err.message?.includes('staticData is written once')) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setErrorMsg(err.message || 'Setup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0D0F12] text-[#e1e2ec]">
      <main className="w-full max-w-[480px] flex flex-col items-center animate-fade-up">
        <header className="w-full mb-8 text-center">
          <MergeLogo height={22} />
        </header>

        <div className="w-full bg-[#16181D] border border-[#27272A] p-8 md:p-10">
          <div className="mb-8 border-b border-[#27272A] pb-6">
            <h1 className="font-display text-[20px] font-bold text-[#e1e2ec] tracking-tight">Set up your profile</h1>
            <p className="font-mono-code text-[11px] text-[#c2c6d6] mt-1.5 uppercase tracking-wider">
              Three questions — under a minute
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest">
                Programming experience
              </label>
              <PillGroup
                options={XP_OPTIONS}
                value={yearsOfExperience}
                onChange={setYearsOfExperience}
              />
            </div>

            <div className="space-y-3">
              <label className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest">
                Primary language
              </label>
              <PillGroup
                options={LANGUAGES}
                value={preferredLanguage}
                onChange={setPreferredLanguage}
              />
            </div>

            <div className="space-y-3">
              <label className="block font-mono-code text-[10px] text-[#c2c6d6] uppercase tracking-widest">
                What drives you
              </label>
              <CardGroup
                options={MOTIVATIONS}
                value={motivation}
                onChange={setMotivation}
              />
            </div>

            {errorMsg && (
              <p className="font-mono-code text-[12px] text-error">{errorMsg}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed text-white font-label-caps text-label-caps py-4 transition-colors duration-150 rounded-none uppercase tracking-wide flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <span>Get Started</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
