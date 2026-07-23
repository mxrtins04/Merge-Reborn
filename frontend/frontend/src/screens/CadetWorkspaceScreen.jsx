import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MergeLogo from '../components/MergeLogo';
import { api } from '../api';

export default function CadetWorkspaceScreen() {
  const navigate = useNavigate();

  // Core data
  const [conceptId, setConceptId] = useState(null);
  const [concept, setConcept] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Workspace state: "problem_intro" | "explanation" | "resources" | "articulation_gate" | "drill" | "xp_screen"
  const [workspaceState, setWorkspaceState] = useState('problem_intro');
  const [gateAnswer, setGateAnswer] = useState('');

  // Drill state
  const [currentDrill, setCurrentDrill] = useState(null);
  const [drillAnswer, setDrillAnswer] = useState('');
  const [drillSubmitting, setDrillSubmitting] = useState(false);
  const [drillGenerating, setDrillGenerating] = useState(false);
  const [drillResult, setDrillResult] = useState(null); // passed/failed with feedback
  const [drillError, setDrillError] = useState('');
  const [pasteAttempted, setPasteAttempted] = useState(false);
  const [tabFocusLost, setTabFocusLost] = useState(0);
  const tabLostRef = useRef(0);

  // Progression state
  const [nextConceptResult, setNextConceptResult] = useState(null);
  const [isCheckingNext, setIsCheckingNext] = useState(false);

  // Exit modal
  const [showExitModal, setShowExitModal] = useState(false);

  // Load concept on mount
  useEffect(() => {
    loadConcept();
  }, []);

  // Tab focus tracking for anti-cheat
  useEffect(() => {
    const handleBlur = () => {
      tabLostRef.current += 1;
      setTabFocusLost(tabLostRef.current);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const loadConcept = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to get concept id from localStorage (set by dashboard)
      const storedConceptId = localStorage.getItem('merge_current_concept_id');
      
      if (storedConceptId) {
        // Fetch the specific concept
        const conceptData = await api.get(`/concepts/${storedConceptId}`);
        setConcept(conceptData);
        setConceptId(storedConceptId);

        // Fetch resources for this concept
        try {
          const resourceData = await api.get(`/concepts/${storedConceptId}/resources`);
          setResources(resourceData || []);
        } catch (resErr) {
          console.warn('Could not load resources:', resErr);
          setResources([]);
        }
      } else {
        // Fall back to GET /concepts/next
        const result = await api.get('/concepts/next');
        if (result && result.status === 'PRESENT' && result.concept) {
          setConcept(result.concept);
          setConceptId(result.concept.id);
          localStorage.setItem('merge_current_concept_id', result.concept.id);

          try {
            const resourceData = await api.get(`/concepts/${result.concept.id}/resources`);
            setResources(resourceData || []);
          } catch (resErr) {
            console.warn('Could not load resources:', resErr);
            setResources([]);
          }
        } else if (result && result.status === 'STAGE_COMPLETE') {
          // Stage complete — redirect to build
          navigate('/build-workspace');
          return;
        } else {
          setError('No concept is currently available for this stage.');
        }
      }
    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load concept.');
    } finally {
      setLoading(false);
    }
  };

  const generateDrill = async () => {
    if (!conceptId) return;
    setDrillGenerating(true);
    setDrillError('');
    setDrillResult(null);
    setPasteAttempted(false);
    tabLostRef.current = 0;
    setTabFocusLost(0);
    setDrillAnswer('');

    try {
      const drill = await api.post('/drills', { conceptId });
      setCurrentDrill(drill);
      setWorkspaceState('drill');
    } catch (err) {
      setDrillError(err.message || 'Failed to generate drill. Please try again.');
      // Stay on articulation_gate state
    } finally {
      setDrillGenerating(false);
    }
  };

  const handlePasteAttempt = () => {
    setPasteAttempted(true);
  };

  const submitDrill = async () => {
    if (!currentDrill || !drillAnswer.trim()) return;
    setDrillSubmitting(true);
    setDrillError('');

    const idempotencyKey = `drill-${currentDrill.id}-${Date.now()}`;

    try {
      const result = await api.post(`/drills/${currentDrill.id}/submit`, {
        answer: drillAnswer,
        idempotencyKey,
        pasteAttempted,
        tabFocusLost: tabLostRef.current
      });
      setDrillResult(result);
      setCurrentDrill(result);
    } catch (err) {
      setDrillError(err.message || 'Failed to submit drill. Please try again.');
    } finally {
      setDrillSubmitting(false);
    }
  };

  const handleDrillContinue = async () => {
    // After drill is done (passed or failed), check next concept
    setIsCheckingNext(true);
    try {
      const result = await api.get('/concepts/next');
      setNextConceptResult(result);
      
      if (result && result.status === 'PRESENT' && result.concept) {
        // There's another concept — navigate to it
        localStorage.setItem('merge_current_concept_id', result.concept.id);
        // Reload this workspace with the new concept
        window.location.reload();
      } else if (result && result.status === 'STAGE_COMPLETE') {
        // All done! Navigate to build
        navigate('/build-workspace');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setIsCheckingNext(false);
    }
  };

  const handleExitTrigger = () => {
    if (workspaceState === 'drill') {
      setShowExitModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const confirmDiscardAndExit = () => {
    setShowExitModal(false);
    navigate('/dashboard');
  };

  // --- Derived values from concept ---
  const failureScenario = concept?.predefinedContentRef?.failureScenario || '';
  const teachingObjective = concept?.predefinedContentRef?.teachingObjective || '';
  const coreContent = concept?.predefinedContentRef?.coreContent || '';
  const conceptTitle = concept?.name || teachingObjective || 'Concept';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface select-none">
        <div className="animate-spin text-primary text-[32px] material-symbols-outlined mb-4">sync</div>
        <p className="font-mono-code text-xs uppercase tracking-widest text-on-surface-variant">Loading Concept Workspace...</p>
      </div>
    );
  }

  // Error state
  if (error && !concept) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface select-none">
        <div className="max-w-md bg-[#16181D] border border-error/50 p-8 text-center space-y-6">
          <span className="material-symbols-outlined text-[36px] text-error">error</span>
          <h2 className="font-headline-md text-on-surface uppercase">Concept Load Failed</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3.5 text-label-caps uppercase tracking-wider transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#10131a] text-[#e1e2ec] relative select-text animate-fade-in">
      {/* Header */}
      <header className="h-[48px] bg-[#16181D] border-b border-outline-variant flex justify-between items-center px-margin-md z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={handleExitTrigger}
            className="flex items-center gap-1 hover:text-primary transition-colors text-on-surface-variant font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Exit Workspace</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-2 py-0.5 border border-primary/40 bg-primary/5 text-primary font-mono-code text-[10px] uppercase">
            CONCEPT WORKSPACE
          </span>
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors font-label-caps text-label-caps uppercase">
            Dashboard
          </button>
        </div>
      </header>

      {/* Problem Intro */}
      {workspaceState === 'problem_intro' && (
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col justify-start">
          <div className="mb-2 text-left">
            <span className="font-mono-code text-[10px] text-on-surface-variant uppercase block">Active Concept</span>
            <span className="font-mono-code text-[10px] text-primary uppercase block mt-1">Step 1 of 4 — The Problem</span>
          </div>

          <div className="border-b border-outline-variant pb-6 mb-8 text-left">
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">{conceptTitle}</h1>
          </div>

          {failureScenario ? (
            <div className="functional-border bg-surface-container p-6 mb-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                <span className="font-label-caps text-[10px] text-error uppercase tracking-widest">Real-World Failure Scenario</span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                {failureScenario}
              </p>
            </div>
          ) : (
            <div className="functional-border bg-surface-container p-6 mb-8">
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                {coreContent || 'This concept covers fundamental programming principles.'}
              </p>
            </div>
          )}

          <div className="functional-border bg-surface-container-low p-5 mb-10">
            <p className="font-body-md text-body-md text-on-surface-variant">
              <span className="text-on-surface font-bold">Teaching objective: </span>
              {teachingObjective || coreContent}
            </p>
          </div>

          <button
            onClick={() => setWorkspaceState('explanation')}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-10 py-5 font-display text-headline-md font-bold tracking-tight transition-all active:scale-[0.98] w-full md:w-auto"
          >
            CONTINUE TO EXPLANATION
          </button>
        </main>
      )}

      {/* Explanation */}
      {workspaceState === 'explanation' && (
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col justify-start">
          <div className="mb-2 text-left">
            <span className="font-mono-code text-[10px] text-on-surface-variant uppercase block">Active Concept</span>
            <span className="font-mono-code text-[10px] text-primary uppercase block mt-1">Step 2 of 4 — The Explanation</span>
          </div>

          <div className="border-b border-outline-variant pb-6 mb-8 text-left">
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">{conceptTitle}</h1>
          </div>

          <article className="text-left font-body-lg text-body-lg text-on-surface-variant space-y-6 leading-relaxed mb-10">
            {coreContent ? (
              coreContent.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))
            ) : (
              <p>This concept will teach you essential programming principles. Review the resources below to deepen your understanding before practicing with drills.</p>
            )}
          </article>

          <div className="flex gap-3">
            <button
              onClick={() => setWorkspaceState('problem_intro')}
              className="border border-outline-variant hover:bg-surface-container-high text-on-surface-variant px-6 py-4 font-label-caps text-label-caps uppercase tracking-wider transition-all"
            >
              BACK
            </button>
            <button
              onClick={() => setWorkspaceState('resources')}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-10 py-4 font-display text-headline-md font-bold tracking-tight transition-all active:scale-[0.98]"
            >
              CONTINUE TO RESOURCES
            </button>
          </div>
        </main>
      )}

      {/* Resources */}
      {workspaceState === 'resources' && (
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col justify-start">
          <div className="mb-2 text-left">
            <span className="font-mono-code text-[10px] text-on-surface-variant uppercase block">Active Concept</span>
            <span className="font-mono-code text-[10px] text-primary uppercase block mt-1">Step 3 of 4 — Reference Materials</span>
          </div>

          <div className="border-b border-outline-variant pb-6 mb-8 text-left">
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">{conceptTitle}</h1>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            These are reference materials for deeper understanding. You can work through them now or come back to them during the drills.
          </p>

          <div className="space-y-3 mb-10">
            {resources.length > 0 ? (
              resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="functional-border bg-surface-container p-5 flex items-start gap-4 hover:bg-surface-container-highest transition-colors cursor-pointer group block"
                >
                  <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {resource.type === 'VIDEO' ? 'play_circle' : resource.type === 'BOOK' ? 'auto_stories' : 'menu_book'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-body-md text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">{resource.title}</span>
                      <span className="font-label-caps text-[9px] text-on-surface-variant border border-outline-variant px-1.5 py-0.5">{resource.type}</span>
                    </div>
                    <span className="font-mono-code text-[10px] text-primary mt-1 block">{resource.url}</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] group-hover:text-primary transition-colors flex-shrink-0">open_in_new</span>
                </a>
              ))
            ) : (
              <div className="functional-border bg-surface-container p-8 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[28px] block mb-2">library_books</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No additional resources for this concept. Proceed to the comprehension gate.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setWorkspaceState('explanation')}
              className="border border-outline-variant hover:bg-surface-container-high text-on-surface-variant px-6 py-4 font-label-caps text-label-caps uppercase tracking-wider transition-all"
            >
              BACK
            </button>
            <button
              onClick={() => setWorkspaceState('articulation_gate')}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-10 py-4 font-display text-headline-md font-bold tracking-tight transition-all active:scale-[0.98]"
            >
              CONTINUE TO COMPREHENSION GATE
            </button>
          </div>
        </main>
      )}

      {/* Articulation Gate */}
      {workspaceState === 'articulation_gate' && (
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col justify-start">
          <div className="mb-2 text-left">
            <span className="font-mono-code text-[10px] text-on-surface-variant uppercase block">Active Concept</span>
            <span className="font-mono-code text-[10px] text-primary uppercase block mt-1">Step 4 of 4 — Comprehension Gate</span>
          </div>

          <div className="border-b border-outline-variant pb-6 mb-8 text-left">
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">{conceptTitle}</h1>
          </div>

          <div className="functional-border bg-surface-container p-5 mb-8 space-y-2">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Before the drill unlocks, demonstrate your understanding of the core concept in your own words.
            </p>
          </div>

          {drillError && (
            <div className="mb-4 flex items-center gap-2 bg-error/10 border border-error/50 p-3">
              <span className="material-symbols-outlined text-error text-[16px]">warning</span>
              <span className="font-mono-code text-error text-[11px]">{drillError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (gateAnswer.trim().length > 10) {
                generateDrill();
              }
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block">
                In your own words — explain the core concept and why it matters:
              </label>
              <textarea
                required
                value={gateAnswer}
                onChange={e => setGateAnswer(e.target.value)}
                placeholder="Explain what you've learned and why this concept is critical in production software..."
                rows={5}
                className="w-full bg-[#09090B] border border-outline-variant p-4 font-mono-code text-mono-code focus:border-primary outline-none transition-colors rounded-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWorkspaceState('resources')}
                className="border border-outline-variant hover:bg-surface-container-high text-on-surface-variant px-6 py-4 font-label-caps text-label-caps uppercase tracking-wider transition-all"
              >
                BACK TO RESOURCES
              </button>
              <button
                type="submit"
                disabled={drillGenerating || gateAnswer.trim().length <= 10}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-blue-800 disabled:cursor-wait text-white px-10 py-4 font-display text-headline-md font-bold tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {drillGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>GENERATING DRILL...</span>
                  </>
                ) : 'SUBMIT & UNLOCK DRILL'}
              </button>
            </div>
          </form>
        </main>
      )}

      {/* Drill */}
      {workspaceState === 'drill' && currentDrill && (
        <main className="flex-grow grid grid-cols-12 overflow-hidden h-[calc(100vh-48px)]">
          {/* Left Panel: Question */}
          <section className="col-span-5 border-r border-[#27272A] p-6 flex flex-col gap-6 text-left overflow-y-auto bg-surface-container-lowest">
            <div>
              <span className="font-mono-code text-[10px] text-primary uppercase tracking-widest block mb-1">DRILL / CONCEPT PRACTICE</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase">{conceptTitle}</h2>
            </div>

            <div className="space-y-4 font-body-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{currentDrill.question}</p>
            </div>

            {/* Drill result feedback */}
            {drillResult && (
              <div className={`border p-4 space-y-3 ${drillResult.passed ? 'border-green-500 bg-green-500/5' : 'border-error bg-error/5'}`}>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[18px] ${drillResult.passed ? 'text-green-400' : 'text-error'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {drillResult.passed ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={`font-label-caps text-[11px] font-bold uppercase ${drillResult.passed ? 'text-green-400' : 'text-error'}`}>
                    {drillResult.passed ? `PASSED · +${drillResult.xpAwarded} XP` : 'INCORRECT'}
                  </span>
                </div>
                {drillResult.feedback && (
                  <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                    {drillResult.feedback}
                  </p>
                )}

                <div className="pt-2 space-y-2">
                  {drillResult.passed ? (
                    <button
                      onClick={handleDrillContinue}
                      disabled={isCheckingNext}
                      className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 text-white py-3 font-label-caps text-label-caps uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      {isCheckingNext ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>CHECKING NEXT...</span>
                        </>
                      ) : 'CONTINUE →'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDrillResult(null);
                        setDrillAnswer('');
                        setDrillError('');
                        setPasteAttempted(false);
                        tabLostRef.current = 0;
                        setTabFocusLost(0);
                        generateDrill();
                      }}
                      className="w-full border border-outline-variant hover:bg-surface-container-high text-on-surface-variant py-3 font-label-caps text-label-caps uppercase tracking-wider transition-colors"
                    >
                      TRY AGAIN
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full border border-outline-variant/50 hover:bg-surface-container-high text-on-surface-variant/60 py-2 font-label-caps text-[10px] uppercase tracking-wider transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

            {drillError && !drillResult && (
              <div className="flex items-center gap-2 text-error font-mono-code text-[11px]">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                {drillError}
              </div>
            )}

            {/* Anti-cheat signals */}
            <div className="mt-auto border-t border-outline-variant/30 pt-3 space-y-1">
              {pasteAttempted && (
                <div className="flex items-center gap-1.5 text-[#ffb95f] font-mono-code text-[10px]">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  <span>Paste detected — recorded</span>
                </div>
              )}
              {tabFocusLost > 0 && (
                <div className="flex items-center gap-1.5 text-on-surface-variant/60 font-mono-code text-[10px]">
                  <span className="material-symbols-outlined text-[12px]">tab</span>
                  <span>Tab focus lost: {tabFocusLost}x</span>
                </div>
              )}
            </div>
          </section>

          {/* Right Panel: Answer */}
          <section className="col-span-7 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#27272A] px-4 py-2 bg-surface-container">
              <span className="font-mono-code text-[11px] text-on-surface-variant uppercase">response.txt</span>
              <span className="font-mono-code text-[11px] text-primary uppercase">
                {currentDrill.status === 'PENDING' ? '[AWAITING ANSWER]' : `[${currentDrill.status}]`}
              </span>
            </div>

            <textarea
              value={drillAnswer}
              onChange={e => setDrillAnswer(e.target.value)}
              onPaste={() => handlePasteAttempt()}
              disabled={!!drillResult}
              className={`w-full flex-1 bg-[#09090B] font-mono-code text-xs text-[#e1e2ec] p-4 outline-none border-none resize-none leading-relaxed ${drillResult ? 'opacity-60' : ''}`}
              placeholder="Type your answer here..."
            />

            <div className="border-t border-[#27272A] p-4 bg-surface-container flex justify-between">
              <div className="text-[11px] font-mono-code text-on-surface-variant flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 animate-pulse rounded-full"></span>
                <span>DRILL ACTIVE</span>
              </div>
              {!drillResult && (
                <button
                  disabled={drillSubmitting || !drillAnswer.trim()}
                  onClick={submitDrill}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-wait text-white px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  {drillSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </main>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-6 select-none animate-fade-in">
          <div className="bg-[#16181D] border border-error max-w-sm w-full p-8 text-center space-y-6 shadow-2xl">
            <div className="flex flex-col items-center space-y-2 text-error">
              <span className="material-symbols-outlined text-[32px]">warning</span>
              <h3 className="font-headline-md text-on-surface uppercase text-sm">Abort Active Workspace</h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Exiting now will discard your current drill state. Confirm abort action?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 font-label-caps text-label-caps uppercase tracking-wider rounded-none"
              >
                Cancel / Continue Drill
              </button>
              <button
                onClick={confirmDiscardAndExit}
                className="w-full border border-[#27272A] hover:bg-surface-container-high text-on-surface-variant py-2.5 font-label-caps text-[10px] uppercase tracking-wider rounded-none"
              >
                Discard and Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
