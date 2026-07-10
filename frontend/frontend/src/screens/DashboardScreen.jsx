import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MergeLogo from '../components/MergeLogo';
import { api } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  BookOpen,
  HelpCircle,
  Trophy,
  Briefcase,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock,
  BarChart2,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Menu,
  X
} from 'lucide-react';

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-[#1B202A] animate-pulse rounded ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F4F6F8] flex">
      {/* Sidebar Skeleton */}
      <aside className="w-[260px] border-r border-[#2A2F39] bg-[#161A22] flex flex-col h-screen fixed left-0 top-0 z-30 p-6 justify-between">
        <div className="space-y-8">
          <SkeletonBlock className="w-28 h-6" />
          <div className="flex flex-col gap-2">
            {[...Array(6)].map((_, i) => (
              <SkeletonBlock key={i} className="w-full h-10" />
            ))}
          </div>
        </div>
        <div className="border-t border-[#2A2F39] pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-8 h-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <SkeletonBlock className="w-2/3 h-3.5" />
              <SkeletonBlock className="w-1/2 h-2.5" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Layout Skeleton */}
      <div className="flex-1 pl-[260px] min-h-screen flex flex-col bg-[#0F1117]">
        <div className="grid grid-cols-12 flex-1">
          {/* Center Column Skeleton */}
          <section className="col-span-8 p-8 border-r border-[#2A2F39] flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <SkeletonBlock className="h-7 w-48" />
                <SkeletonBlock className="h-4 w-64" />
              </div>
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-[280px] w-full" />
          </section>

          {/* Right Sidebar Skeleton */}
          <section className="col-span-4 p-8 flex flex-col gap-8 bg-[#101219]">
            <SkeletonBlock className="h-[140px] w-full" />
            <SkeletonBlock className="h-[220px] w-full" />
          </section>
        </div>
      </div>
    </div>
  );
}

// Social activities feed helper for other students in the same stage
function getStageActivities(stageName) {
  const name = stageName ? stageName.toUpperCase() : 'SCOUT';
  if (name === 'SCOUT') {
    return [
      { student: 'Chidi', title: 'completed Computational Thinking drill', type: 'CONCEPT DRILL', xp: '+10 XP', date: '2m ago' },
      { student: 'Tunde', title: 'completed Quiz: Variable Scope', type: 'COMPREHENSION CHECK', xp: '+25 XP', date: '15m ago' },
      { student: 'Chioma', title: 'completed basic control flow exercises', type: 'CONCEPT DRILL', xp: '+10 XP', date: '1h ago' }
    ];
  } else if (name === 'BUILDER') {
    return [
      { student: 'Yuki', title: 'completed system architecture trace', type: 'ARCHITECTURE CHECK', xp: '+15 XP', date: '5m ago' },
      { student: 'Aisha', title: 'completed Quiz: HTTP Methods & Headers', type: 'COMPREHENSION CHECK', xp: '+25 XP', date: '30m ago' },
      { student: 'David', title: 'passed Stage Builder promotion gateway', type: 'FORMATION GRADUATION', xp: '+50 XP', date: '2h ago' }
    ];
  } else {
    return [
      { student: 'Sarah', title: 'completed Quiz: Git Conflict Resolution', type: 'COMPREHENSION CHECK', xp: '+25 XP', date: '8m ago' },
      { student: 'Omar', title: 'completed memory allocation exercises', type: 'CONCEPT DRILL', xp: '+10 XP', date: '20m ago' },
      { student: 'Fatima', title: 'unlocked Stage Scout capstone challenge', type: 'FORMATION GRADUATION', xp: '+50 XP', date: '3h ago' }
    ];
  }
}

export default function DashboardScreen() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [stage, setStage] = useState(null);
  const [nextConcept, setNextConcept] = useState(null);
  const [activeMissions, setActiveMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const studentData = await api.get('/students/me');
      setStudent(studentData);

      localStorage.setItem('merge_student', JSON.stringify({
        fullName: studentData.name,
        email: '',
        total_xp: studentData.xp,
        current_stage: studentData.stageId ? 'CADET' : 'SCOUT',
        stageId: studentData.stageId,
        id: studentData.id,
      }));

      if (studentData.stageId) {
        try {
          const stageData = await api.get(`/stages/${studentData.stageId}`);
          setStage(stageData);
        } catch (_) {}
      }

      try {
        const conceptResult = await api.get('/concepts/next');
        setNextConcept(conceptResult);
      } catch (_) {}

      try {
        const missionsResult = await api.get('/missions/active');
        setActiveMissions(missionsResult || []);
      } catch (_) {}

    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('merge_jwt');
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleStartLearning = async () => {
    if (stageComplete) {
      navigate('/build-workspace');
      return;
    }
    setIsStarting(true);
    setStartError('');
    try {
      try {
        const activeSession = await api.get('/sessions/active');
        if (activeSession?.id) {
          localStorage.setItem('merge_active_session_id', activeSession.id);
          navigate('/workspace');
          return;
        }
      } catch (err) {
        if (err.status !== 404) throw err;
      }
      navigate('/session/start');
    } catch (err) {
      setStartError(err.message || 'Could not start session.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('merge_jwt');
    localStorage.removeItem('merge_student');
    localStorage.removeItem('merge_gemini_token');
    localStorage.removeItem('merge_current_concept_id');
    localStorage.removeItem('merge_active_session_id');
    navigate('/login');
  };

  const xp = student?.xp ?? 0;
  const stageName = stage?.name ?? (student?.stageId ? 'CADET' : 'SCOUT');
  const stageXpThreshold = stage?.xpThreshold ?? 1500;
  const remainingXp = Math.max(0, stageXpThreshold - xp);
  const studentName = student?.name ?? 'Engineer';
  const hasNextConcept = nextConcept?.status === 'PRESENT';
  const stageComplete = nextConcept?.status === 'STAGE_COMPLETE';

  // Determine active stage progression sequence
  const stagesList = ['SCOUT', 'BUILDER', 'ENGINEER', 'ARCHITECT', 'MENTOR'];
  const activeStageIndex = stagesList.indexOf(stageName.toUpperCase());
  const nextStageName = activeStageIndex < stagesList.length - 1 ? stagesList[activeStageIndex + 1] : 'GRADUATED';

  // Fetch student stage active missions (Remediation flow prioritizes database missions)
  const activeMission = activeMissions.length > 0 ? activeMissions[0] : null;

  // Social feed activities of other students in the same stage
  const currentStageActivities = getStageActivities(stageName);

  if (loading) return <DashboardSkeleton />;

  // Layout sizing adjustments
  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-[260px]';
  const sidebarOffset = isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]';

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F4F6F8] flex relative overflow-x-hidden font-sans select-text">
      
      {/* Subtle Blueprint grid background */}
      <div className="absolute inset-0 bg-[#0F1117] pointer-events-none z-0 select-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#2A2F39 1px, transparent 1px), linear-gradient(90deg, #2A2F39 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* MOBILE HEADER (sticky on screens below large) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#161A22] border-b border-[#2A2F39] z-20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 hover:bg-[#1B202A] rounded border border-[#2A2F39]/50 text-[#9AA3AF] hover:text-[#F4F6F8] transition-all outline-none"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <MergeLogo className="font-display font-bold uppercase tracking-widest text-[18px]" />
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-mono-code text-[11px] font-bold text-primary">
            {studentName ? studentName.charAt(0).toUpperCase() : 'U'}
          </button>
        </div>
      </header>

      {/* BACKGROUND SCROLL OVERLAY FOR MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (collapsible on desktop, drawer on mobile) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#161A22] border-r border-[#2A2F39] p-4 select-none flex flex-col justify-between transition-transform duration-300 lg:transition-all lg:translate-x-0 ${sidebarWidth} ${
          isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Collapse Header */}
          <div className="flex items-center justify-between h-10 px-2">
            <div className="cursor-pointer" onClick={() => { navigate('/dashboard'); setIsMobileOpen(false); }}>
              {isCollapsed && !isMobileOpen ? (
                <div className="font-display font-bold text-[20px] text-primary mx-auto">M</div>
              ) : (
                <MergeLogo className="font-display font-bold uppercase tracking-widest text-[22px]" />
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Collapse toggle button (desktop only) */}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 hover:bg-[#1B202A] border border-[#2A2F39]/50 hover:border-[#2A2F39] rounded text-[#9AA3AF] hover:text-[#F4F6F8] transition-all hidden lg:flex items-center justify-center outline-none"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>

              {/* Close drawer (mobile only) */}
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 hover:bg-[#1B202A] rounded text-[#9AA3AF] hover:text-[#F4F6F8] transition-all flex lg:hidden items-center justify-center outline-none"
                aria-label="Close navigation menu"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1">
            {[
              { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
              { label: 'Missions', path: '/workspace', icon: Target },
              { label: 'Concepts', path: '/curriculum', icon: BookOpen },
              { label: 'Quizzes', path: '/peer-review', icon: HelpCircle },
              { label: 'Leaderboard', path: '/dashboard', icon: Trophy },
              { label: 'Internships', path: '/dashboard', icon: Briefcase },
              { label: 'Mentor', path: '/dashboard', icon: Users },
              { label: 'Settings', path: '/identity', icon: Settings }
            ].map((item) => {
              const isActive = window.location.hash.includes(item.path);
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full relative group flex items-center gap-3 px-3 py-2.5 font-mono-code text-[11px] uppercase tracking-wider rounded transition-all text-left outline-none ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'text-[#9AA3AF] hover:text-[#F4F6F8] hover:bg-[#1B202A]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[2.5px] bg-primary rounded-r" />
                  )}
                  <Icon size={15} className={isActive ? 'text-primary' : 'text-[#9AA3AF] group-hover:text-[#F4F6F8]'} />
                  {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile details at base */}
        <div className="border-t border-[#2A2F39] pt-4 flex flex-col gap-3">
          <div 
            onClick={() => { navigate('/identity'); setIsMobileOpen(false); }}
            className="flex items-center gap-3 px-2 cursor-pointer hover:bg-[#1B202A]/40 transition-all rounded p-1 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-mono-code text-[12px] font-bold text-primary flex-shrink-0">
              {studentName ? studentName.charAt(0).toUpperCase() : 'U'}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="overflow-hidden">
                <p className="font-sans font-semibold text-[13px] text-[#F4F6F8] truncate leading-tight">{studentName}</p>
                <p className="font-mono-code text-[9px] text-[#6B7280] truncate mt-0.5 uppercase tracking-wider">{stageName}</p>
              </div>
            )}
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={handleLogout}
              className="w-full border border-[#2A2F39] hover:bg-[#ff4d4f]/10 hover:border-[#ff4d4f]/30 text-[#9AA3AF] hover:text-[#ff4d4f] py-2 font-mono-code text-[10px] uppercase tracking-widest transition-all rounded outline-none"
            >
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* CENTER & RIGHT MAIN WRAPPER */}
      <div 
        className={`flex-1 min-h-screen flex flex-col bg-[#0F1117] transition-all duration-300 relative z-10 pt-14 lg:pt-0 ${sidebarOffset}`}
      >
        
        {/* Main Content Grid (Responsive stacking on tablet/mobile) */}
        <div className="grid grid-cols-12 flex-1">
          
          {/* CENTER: Primary Work Area */}
          <main className="col-span-12 xl:col-span-8 p-6 lg:p-8 border-r border-[#2A2F39] flex flex-col gap-8">
            
            {/* Quiet Header (Desktop only) */}
            <div className="hidden lg:flex justify-between items-center">
              <div className="text-left">
                <h1 className="font-sans text-[26px] font-semibold text-[#F4F6F8] tracking-tight leading-tight">
                  Good evening, {studentName}.
                </h1>
                <p className="font-mono-code text-[11px] text-[#6B7280] uppercase tracking-wider mt-1.5">
                  Stay consistent. Build your future.
                </p>
              </div>
              
              <button 
                className="w-9 h-9 border border-[#2A2F39] hover:bg-[#161A22] rounded-full flex items-center justify-center text-[#9AA3AF] hover:text-[#F4F6F8] transition-all outline-none"
                aria-label="View notifications"
              >
                <Bell size={16} />
              </button>
            </div>

            {/* TOP METRICS CARD (Single Horizontal Card with Separators) */}
            <div className="border border-[#2A2F39] bg-[#161A22] p-5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
              <div className="grid grid-cols-3 gap-4 sm:gap-6 flex-1 text-left">
                <div className="pr-2 sm:pr-6">
                  <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">Stage</span>
                  <span className="font-sans font-bold text-[14px] sm:text-[15px] text-[#F4F6F8] mt-1 block uppercase">{stageName}</span>
                </div>
                <div className="border-l border-[#2A2F39] pl-4 pr-2 sm:px-6">
                  <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">XP Earned</span>
                  <span className="font-mono-code font-bold text-[14px] sm:text-[15px] text-primary mt-1 block">{xp.toLocaleString()} XP</span>
                </div>
                <div className="border-l border-[#2A2F39] pl-4 sm:px-6">
                  <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">XP Remaining</span>
                  <span className="font-mono-code font-bold text-[14px] sm:text-[15px] text-[#F4F6F8] mt-1 block">{remainingXp.toLocaleString()} XP</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/curriculum')}
                className="w-full sm:w-auto border border-[#2A2F39] hover:border-primary text-[#F4F6F8] hover:text-primary px-4 py-2 font-mono-code text-[10px] uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-1.5 rounded outline-none"
              >
                <span>View Journey</span>
                <span>→</span>
              </button>
            </div>

            {/* CURRENT MISSION */}
            <div className="border border-[#2A2F39] bg-[#161A22] p-6 rounded-lg transition-all duration-150 hover:-translate-y-[2px] group text-left">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-mono-code text-[10px] text-[#6B7280] uppercase tracking-widest block mb-1">
                    {activeMission ? 'ACTIVE REMEDIATION MISSION' : stageComplete ? 'FINAL GATEWAY' : 'CURRENT MISSION'}
                  </span>
                  <h2 className="font-sans text-[20px] font-bold text-[#F4F6F8] tracking-tight leading-snug">
                    {activeMission 
                      ? (activeMission.painPointDescription || 'Concept Remediation') 
                      : stageComplete 
                        ? 'Capstone Stage Graduation Build' 
                        : (nextConcept.concept?.predefinedContentRef?.teachingObjective || 'Next Formation Stage')}
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 border border-primary/40 text-primary font-mono-code text-[9px] uppercase tracking-wider rounded">
                  {activeMission ? 'REMEDIATING' : stageComplete ? 'BUILD READY' : hasNextConcept ? 'IN PROGRESS' : 'COMPLETE'}
                </span>
              </div>

              <p className="font-sans text-[13px] text-[#9AA3AF] leading-relaxed mb-6">
                {activeMission 
                  ? (activeMission.conceptAndContext || 'This remediation mission was generated based on your previous drill attempts to help reinforce core technical knowledge.')
                  : stageComplete 
                    ? "Demonstrate your complete technical mastery of this stage's concepts. Complete the final code compilation and system architecture check to graduate."
                    : (nextConcept.concept?.predefinedContentRef?.coreContent?.substring(0, 280) || 'Initialize learning session to receive your next formation objective.')}
                {!activeMission && !stageComplete && nextConcept.concept?.predefinedContentRef?.coreContent?.length > 280 && '…'}
              </p>

              {/* Mission Metadata Row */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 border-t border-[#2A2F39] pt-4 mb-6">
                <div>
                  <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">Estimated Time</span>
                  <div className="flex items-center gap-1.5 mt-1 text-[#F4F6F8] font-mono-code text-[12px] font-semibold">
                    <Clock size={12} className="text-[#6B7280]" />
                    <span>{activeMission ? '30 mins' : stageComplete ? '120 mins' : '45 mins'}</span>
                  </div>
                </div>
                <div>
                  <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">Difficulty</span>
                  <div className="flex items-center gap-1.5 mt-1 text-[#F4F6F8] font-mono-code text-[12px] font-semibold uppercase">
                    <BarChart2 size={12} className="text-[#6B7280]" />
                    <span>{activeMission ? 'Review' : stageComplete ? 'Advanced' : 'Intermediate'}</span>
                  </div>
                </div>
                <div>
                  <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">Reward</span>
                  <div className="flex items-center gap-1.5 mt-1 text-primary font-mono-code text-[12px] font-semibold">
                    <Award size={12} className="text-primary/70" />
                    <span>{activeMission ? '+15 XP' : stageComplete ? '+100 XP' : '+15 XP'}</span>
                  </div>
                </div>
              </div>

              {/* Primary CTA (Operating System Style Action) */}
              <button
                onClick={handleStartLearning}
                disabled={isStarting}
                className="w-full bg-primary hover:bg-[#bce6ff] border border-primary/20 text-[#0F1117] font-mono-code text-[11px] font-bold py-3.5 transition-all duration-150 uppercase tracking-[0.12em] flex items-center justify-center gap-2 rounded outline-none"
              >
                {isStarting ? (
                  <span>INITIALIZING MISSION...</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {activeMission ? 'Start Remediation Drill' : stageComplete ? 'Launch Capstone Build' : 'Continue Learning'}
                    <span className="transition-transform duration-150 transform group-hover:translate-x-1">→</span>
                  </span>
                )}
              </button>
            </div>

            {/* YOUR JOURNEY (Horizontal Progression Timeline for Current to Next stage only) */}
            <div className="space-y-4 text-left select-none">
              <div className="flex justify-between items-center">
                <span className="font-mono-code text-[10px] text-[#6B7280] tracking-widest block uppercase">YOUR JOURNEY</span>
                <span className="font-mono-code text-[10px] font-bold text-primary tracking-wider uppercase">
                  {Math.min(100, Math.round((xp / stageXpThreshold) * 100))}% to {nextStageName} ({xp.toLocaleString()} / {stageXpThreshold.toLocaleString()} XP)
                </span>
              </div>
              <div className="border border-[#2A2F39] bg-[#161A22] p-6 rounded-lg relative overflow-hidden">
                <div className="relative flex items-center justify-between max-w-md mx-auto">
                  {/* Connecting Line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#2A2F39] z-0" />
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-primary transition-all duration-500 z-0" 
                    style={{ width: `${Math.min(100, (xp / stageXpThreshold) * 100)}%` }}
                  />

                  {/* Stage 1: Current Stage */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-primary bg-primary/20 shadow-[0_0_8px_rgba(173,198,255,0.4)]">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                    <span className="font-mono-code text-[10px] text-primary font-bold uppercase tracking-wider">
                      {stageName} (Current)
                    </span>
                  </div>

                  {/* Stage 2: Next Stage */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#2A2F39] bg-[#161A22]">
                      {xp >= stageXpThreshold && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                    </div>
                    <span className="font-mono-code text-[10px] text-[#6B7280] uppercase tracking-wider">
                      {nextStageName} (Next Target)
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY (Social Feed for other students in same stage) */}
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="font-mono-code text-[10px] text-[#6B7280] tracking-widest block uppercase">STAGE ACTIVITY FEED</span>
                <span className="font-mono-code text-[9px] text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {stageName} PHASE
                </span>
              </div>
              <div className="border border-[#2A2F39] bg-[#161A22] rounded-lg divide-y divide-[#2A2F39]/50 overflow-hidden">
                {currentStageActivities.map((act, index) => (
                  <div key={index} className="p-4 flex justify-between items-center transition-all hover:bg-[#1B202A]/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-primary/70 flex-shrink-0" />
                      <div>
                        <p className="font-sans text-[13px] text-[#F4F6F8] font-semibold leading-tight">
                          <span className="text-primary font-medium mr-1">{act.student}</span>
                          {act.title}
                        </p>
                        <p className="font-mono-code text-[9px] text-[#6B7280] mt-0.5 tracking-wider uppercase">{act.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 font-mono-code text-right">
                      <span className="text-primary text-[12px] font-bold">{act.xp}</span>
                      <span className="text-[#6B7280] text-[10px]">{act.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </main>

          {/* RIGHT SIDEBAR: Status Cards, Progress */}
          <section className="col-span-12 xl:col-span-4 p-6 lg:p-8 flex flex-col gap-8 bg-[#101219] border-t xl:border-t-0 xl:border-l border-[#2A2F39]">
            
            {/* STAGE OVERVIEW CARD */}
            <div className="space-y-4 text-left">
              <span className="font-mono-code text-[10px] text-[#6B7280] tracking-widest block uppercase">Stage Overview</span>
              <div className="border border-[#2A2F39] bg-[#161A22] p-5 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">Current Phase</span>
                    <h3 className="font-sans text-[20px] font-bold text-[#F4F6F8] uppercase mt-0.5 tracking-tight">{stageName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">XP Gate</span>
                    <span className="font-mono-code text-[12px] text-primary font-bold block mt-0.5">{stageXpThreshold.toLocaleString()} XP</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono-code text-[10px] text-[#9AA3AF]">
                    <span>PROGRESS</span>
                    <span>{pctProgress(xp, stageXpThreshold)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0F1117] border border-[#2A2F39]/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (xp / stageXpThreshold) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-[#2A2F39]/60 pt-3">
                  <p className="font-mono-code text-[10px] text-[#6B7280] uppercase tracking-wider">
                    {remainingXp === 0 
                      ? 'GATEWAY UNLOCKED. PROCEED TO GRADUATION BUILD.' 
                      : `${remainingXp.toLocaleString()} XP REMAINING TO STAGE PROMOTION`}
                  </p>
                </div>
              </div>
            </div>

            {/* INTERNSHIP TRACK CARD (Locked with Circular Progress Indicator) */}
            <div className="space-y-4 text-left">
              <span className="font-mono-code text-[10px] text-[#6B7280] tracking-widest block uppercase">Internship Track</span>
              <div className="border border-[#2A2F39] bg-[#161A22] p-5 rounded-lg space-y-4 relative">
                
                {/* Circular indicator and Lock label */}
                <div className="flex items-center gap-4">
                  
                  {/* SVG Circular Progress */}
                  <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center bg-[#0F1117] rounded-full border border-[#2A2F39]">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle 
                        cx="16" 
                        cy="16" 
                        r="12" 
                        stroke="#2A2F39" 
                        strokeWidth="2.5" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="16" 
                        cy="16" 
                        r="12" 
                        stroke="#adc6ff" 
                        strokeWidth="2.5" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 12}
                        strokeDashoffset={2 * Math.PI * 12 * (1 - Math.min(1, xp / stageXpThreshold))}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <Lock size={12} className="absolute text-[#6B7280]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-code text-[10px] font-bold text-primary tracking-wider uppercase">LOCKED</span>
                    </div>
                    <p className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider mt-0.5">Internship Phase 1</p>
                  </div>
                </div>

                <div className="border-t border-[#2A2F39]/60 pt-3 space-y-2">
                  <span className="font-mono-code text-[9px] text-[#6B7280] uppercase tracking-wider block">Unlock Requirements</span>
                  <ul className="space-y-1.5 font-mono-code text-[10px] text-[#9AA3AF]">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      <span>Complete stage {stageName}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      <span>Maintain active concept pace</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}

// Helper to compute progress percentage
function pctProgress(xp, threshold) {
  if (threshold <= 0) return 0;
  return Math.min(100, Math.round((xp / threshold) * 100));
}
