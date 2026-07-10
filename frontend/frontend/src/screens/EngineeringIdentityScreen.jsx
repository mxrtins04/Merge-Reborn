import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MergeLogo from '../components/MergeLogo';
import { api } from '../api';

export default function EngineeringIdentityScreen() {
  const navigate = useNavigate();

  // Data states
  const [student, setStudent] = useState(null);
  const [profile, setProfile] = useState(null); // EProfileResponse
  const [stage, setStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('identity'); // "identity" | "competencies"

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch student data
      const studentData = await api.get('/students/me');
      setStudent(studentData);

      // Fetch stage data if available
      if (studentData.stageId) {
        try {
          const stageData = await api.get(`/stages/${studentData.stageId}`);
          setStage(stageData);
        } catch (stageErr) {
          console.warn('Stage not found:', stageErr);
        }
      }

      // Try to fetch engineering profile (may not exist if freshly onboarded)
      try {
        const profileData = await api.get('/students/me/profile');
        setProfile(profileData);
      } catch (profileErr) {
        // Profile may not exist yet — not a fatal error
        console.info('Engineering profile not found:', profileErr);
      }

    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const stageName = stage?.name ?? 'SCOUT';
  const xp = student?.xp ?? 0;
  const stageThreshold = stage?.xpThreshold ?? 0;
  const initials = student?.name
    ? student.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '??';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface select-none">
        <div className="animate-spin text-primary text-[32px] material-symbols-outlined mb-4">sync</div>
        <p className="font-mono-code text-xs uppercase tracking-widest text-on-surface-variant">Loading Engineering Identity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface select-none">
        <div className="max-w-md bg-[#16181D] border border-error/50 p-8 text-center space-y-6">
          <span className="material-symbols-outlined text-[36px] text-error">error</span>
          <h2 className="font-headline-md text-on-surface uppercase">Failed to Load Profile</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={loadProfileData}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3.5 text-label-caps uppercase tracking-wider transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 border border-outline-variant hover:bg-surface-container-high text-on-surface-variant py-3.5 text-label-caps uppercase tracking-wider transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface relative font-body-md text-body-md select-text animate-fade-in">
      {/* Header */}
      <header className="h-[48px] bg-surface border-b border-outline-variant flex justify-between items-center px-margin-md z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 hover:text-primary transition-colors text-on-surface-variant font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Dashboard</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-2 py-0.5 border border-primary bg-primary/5 text-primary font-mono-code text-[10px] uppercase">
            verified engineering identity
          </span>
        </div>
      </header>

      {/* Profile Header Block */}
      <section className="bg-surface-container-low border-b border-outline-variant py-10 px-margin-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5 text-left">
            {/* User Initials Avatar */}
            <div className="w-16 h-16 bg-surface-container-highest border-2 border-primary flex items-center justify-center font-display font-extrabold text-2xl text-primary">
              {initials}
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-[26px] font-extrabold text-on-surface tracking-tight leading-none">
                {student?.name ?? 'Loading...'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant font-mono-code">
                {student?.details && (
                  <>
                    <span className="text-on-surface-variant">{student.details}</span>
                    <span className="text-outline-variant">&#8226;</span>
                  </>
                )}
                <span className="text-primary font-bold uppercase">STAGE: {stageName}</span>
                {student?.internshipEligible && (
                  <>
                    <span className="text-outline-variant">&#8226;</span>
                    <span className="text-green-400 font-bold uppercase">Internship Eligible</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="border border-outline-variant p-4 bg-surface-container-lowest text-center min-w-28">
              <span className="font-mono-code text-[9px] text-on-surface-variant uppercase block mb-0.5">Formation XP</span>
              <span className="font-mono-code text-sm font-bold text-primary">{xp.toLocaleString()} XP</span>
            </div>
            <div className="border border-outline-variant p-4 bg-surface-container-lowest text-center min-w-28">
              <span className="font-mono-code text-[9px] text-on-surface-variant uppercase block mb-0.5">Stage Gate</span>
              <span className="font-mono-code text-sm font-bold text-on-surface">{stageThreshold.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Section */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-margin-md py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/60 mb-8">
          <button
            onClick={() => setActiveSection('identity')}
            className={`font-label-caps text-label-caps uppercase py-2.5 px-4 border-b-2 transition-all ${
              activeSection === 'identity'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Engineering Profile
          </button>
          <button
            onClick={() => setActiveSection('competencies')}
            className={`font-label-caps text-label-caps uppercase py-2.5 px-4 border-b-2 transition-all ${
              activeSection === 'competencies'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            SFIA Competency Matrix
          </button>
        </div>

        {/* Tab 1: Engineering Identity */}
        {activeSection === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
            {/* Left Col */}
            <div className="md:col-span-7 space-y-6">

              {/* Student Info Card */}
              <div className="border border-outline-variant bg-[#16181D] p-5 space-y-4">
                <span className="font-mono-code text-[9px] text-primary uppercase tracking-widest block mb-2">STUDENT RECORD</span>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-mono-code">Full Name</span>
                    <span className="text-on-surface font-mono-code font-bold">{student?.name ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-mono-code">Stage</span>
                    <span className="text-primary font-mono-code font-bold uppercase">{stageName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-mono-code">Total XP</span>
                    <span className="text-on-surface font-mono-code font-bold">{xp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-mono-code">Internship Eligible</span>
                    <span className={`font-mono-code font-bold ${student?.internshipEligible ? 'text-green-400' : 'text-on-surface-variant'}`}>
                      {student?.internshipEligible ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {student?.details && (
                    <div className="border-t border-outline-variant/30 pt-3">
                      <p className="text-xs text-on-surface-variant leading-relaxed">{student.details}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* XP Progress Card */}
              <div className="border border-outline-variant bg-[#16181D] p-5 space-y-4">
                <span className="font-mono-code text-[9px] text-primary uppercase tracking-widest block">XP FORMATION PROGRESS</span>
                <div className="space-y-2">
                  <div className="flex justify-between font-mono-code text-[11px]">
                    <span className="text-on-surface-variant">Current</span>
                    <span className="text-on-surface font-bold">{xp.toLocaleString()} / {stageThreshold.toLocaleString()} XP</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest border border-outline-variant/35">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, stageThreshold > 0 ? (xp / stageThreshold) * 100 : 0)}%` }}
                    ></div>
                  </div>
                  <p className="font-mono-code text-[10px] text-on-surface-variant">
                    {stageThreshold > xp
                      ? `${(stageThreshold - xp).toLocaleString()} XP until stage promotion`
                      : 'Stage complete — eligible for Build challenge'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div className="md:col-span-5 space-y-6">
              {/* Profile additional info if it exists */}
              {profile ? (
                <div className="border border-outline-variant bg-[#16181D] p-5 space-y-4">
                  <span className="font-mono-code text-[9px] text-primary uppercase tracking-widest block">ENGINEERING PROFILE</span>
                  <div className="space-y-3 text-xs font-mono-code">
                    {Object.entries(profile).map(([key, value]) => (
                      key !== 'id' && key !== 'studentId' && value !== null && value !== undefined ? (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-on-surface-variant capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                          <span className="text-on-surface font-bold">{String(value)}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border border-outline-variant bg-[#16181D] p-5 space-y-3">
                  <span className="font-mono-code text-[9px] text-primary uppercase tracking-widest block">ENGINEERING PROFILE</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Engineering profile will be available after completing your first stage. Keep training to unlock this section.
                  </p>
                </div>
              )}

              {/* Stage Info */}
              {stage && (
                <div className="border border-outline-variant bg-[#16181D] p-5 space-y-3">
                  <span className="font-mono-code text-[9px] text-primary uppercase tracking-widest block">CURRENT STAGE</span>
                  <div className="space-y-2 text-xs font-mono-code">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Stage Name</span>
                      <span className="text-on-surface font-bold uppercase">{stage.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">XP Gate</span>
                      <span className="text-on-surface font-bold">{stage.xpThreshold.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Competency Matrix */}
        {activeSection === 'competencies' && (
          <div className="space-y-6 text-left">
            <div className="bg-surface-container border border-outline-variant p-5 text-xs text-on-surface-variant leading-relaxed mb-6">
              <p>
                Merge competencies map directly to the <strong className="text-on-surface">Skills Framework for the Information Age (SFIA)</strong> standards.
                Competencies are unlocked and verified as you complete drills, builds, and stage promotions.
              </p>
            </div>

            {/* Empty state — competency tracking is a future milestone */}
            <div className="border border-outline-variant bg-[#16181D] p-12 text-center space-y-4">
              <span className="material-symbols-outlined text-on-surface-variant text-[36px]">schema</span>
              <h3 className="font-headline-md text-on-surface uppercase">Competency Matrix</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-md mx-auto">
                Your SFIA competency matrix will populate as you progress through the program and pass stage builds.
                Complete your first concept drills to begin building your verified engineering identity.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-3 font-label-caps text-label-caps uppercase tracking-wider transition-colors"
              >
                Continue Training
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
