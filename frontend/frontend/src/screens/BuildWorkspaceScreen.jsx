import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MergeLogo from '../components/MergeLogo';
import { api } from '../api';

// Terminal states that end polling
const TERMINAL_STATES = ['PASSED', 'FAILED', 'ERROR', 'REJECTED', 'COMPLETED'];

export default function BuildWorkspaceScreen() {
  const navigate = useNavigate();

  // Build data
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Concept data (from next concept)
  const [buildConcept, setBuildConcept] = useState(null);
  const [stageData, setStageData] = useState(null);
  const [buildType, setBuildType] = useState('concept'); // 'concept' | 'level'

  // Active editor tab: "code" | "tests" | "architecture"
  const [activeTab, setActiveTab] = useState('code');

  // Editor content states
  const [code, setCode] = useState('');
  const [testSuite, setTestSuite] = useState('');
  const [architecture, setArchitecture] = useState('');

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const pollTimerRef = useRef(null);

  useEffect(() => {
    initializeBuild();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const initializeBuild = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Check student data to determine build type
      const studentRaw = localStorage.getItem('merge_student');
      let stageId = null;
      if (studentRaw) {
        try {
          const studentLocal = JSON.parse(studentRaw);
          stageId = studentLocal.stageId;
        } catch (e) {}
      }

      // Re-fetch student data to get fresh stageId
      const student = await api.get('/students/me');
      stageId = student.stageId;

      if (stageId) {
        const stage = await api.get(`/stages/${stageId}`);
        setStageData(stage);
      }

      // Try to get next concept — if STAGE_COMPLETE, it's a level build
      const nextResult = await api.get('/concepts/next');
      if (nextResult && nextResult.status === 'STAGE_COMPLETE') {
        setBuildType('level');
      } else if (nextResult && nextResult.status === 'PRESENT' && nextResult.concept) {
        setBuildConcept(nextResult.concept);
        setBuildType('concept');
      }

      // Initialize editor with starter template
      initializeEditorDefaults(stageId ? 'CADET' : 'SCOUT');

    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setErrorMsg(err.message || 'Failed to initialize Build workspace.');
    } finally {
      setLoading(false);
    }
  };

  const initializeEditorDefaults = (stageName) => {
    setCode(
`/**
 * MERGE ${stageName} STAGE BUILD
 * Implement your solution below.
 */

// Your implementation here...
`
    );

    setTestSuite(
`// Write your TDD test cases below
// Target both happy-path and failure edge cases

describe("My Solution", () => {
  it("should solve the core requirement", () => {
    // Your test here
  });
});`
    );

    setArchitecture(
`# Architecture Specification

## 1. Approach
Describe your overall approach and design decisions.

## 2. Data Structures
Explain the data structures you chose and why.

## 3. Edge Cases
List the edge cases you considered and how you handled them.`
    );
  };

  const handleExitTrigger = () => {
    if (code.trim().length > 100 || testSuite.trim().length > 100) {
      setShowExitModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const confirmDiscardAndExit = () => {
    setShowExitModal(false);
    navigate('/dashboard');
  };

  const handleSubmitBuild = async () => {
    if (code.trim().length === 0 || testSuite.trim().length === 0 || architecture.trim().length === 0) {
      alert('All submissions require implementation code, TDD test suite, and architecture document.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const idempotencyKey = `build-${buildType}-${Date.now()}`;

    try {
      let submission;

      if (buildType === 'concept' && buildConcept) {
        // POST /concept-builds
        submission = await api.post('/concept-builds', {
          conceptId: buildConcept.id,
          githubLink: null, // Optional — may not be available yet
          sourceCode: code,
          testSuite: testSuite,
          idempotencyKey
        });
      } else {
        // POST /level-builds
        const studentRaw = localStorage.getItem('merge_student');
        let stageId = stageData?.id;
        if (!stageId && studentRaw) {
          try {
            const studentLocal = JSON.parse(studentRaw);
            stageId = studentLocal.stageId;
          } catch (e) {}
        }

        submission = await api.post('/level-builds', {
          stageId,
          githubLink: null,
          sourceCode: code,
          testSuite: testSuite,
          idempotencyKey
        });
      }

      // Start polling the submission
      const sid = submission?.id;
      if (sid) {
        setSubmissionId(sid);
        setPolling(true);
        setSubmitting(false);
        startPolling(sid);
      } else {
        // Submission accepted but no id returned, navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit build. Please try again.');
      setSubmitting(false);
    }
  };

  const startPolling = useCallback((sid) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    pollTimerRef.current = setTimeout(async () => {
      setPollCount(prev => prev + 1);
      try {
        const result = await api.get(`/submissions/${sid}`);
        const status = result?.status;

        if (status && TERMINAL_STATES.includes(status.toUpperCase())) {
          setSubmissionResult(result);
          setPolling(false);
        } else {
          // Continue polling
          startPolling(sid);
        }
      } catch (err) {
        // If 404, might still be processing — continue polling a few more times
        setPollCount(prev => {
          if (prev > 30) {
            setPolling(false);
            setErrorMsg('Submission timed out. Please check your dashboard for results.');
            return prev;
          }
          return prev;
        });
        startPolling(sid);
      }
    }, 4000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface select-none">
        <div className="animate-spin text-primary text-[32px] material-symbols-outlined mb-4">sync</div>
        <p className="font-mono-code text-xs uppercase tracking-widest text-on-surface-variant">Initializing Build Workspace...</p>
      </div>
    );
  }

  if (polling) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface select-none animate-fade-in">
        <div className="w-full max-w-md bg-[#16181D] border border-outline-variant p-8 flex flex-col space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
            <span className="text-primary font-bold animate-pulse font-mono-code text-[11px] uppercase">BUILD_EVALUATION RUNNING</span>
            <span className="text-on-surface-variant font-mono-code text-[10px]">POLL #{pollCount}</span>
          </div>

          <div className="space-y-4 text-left">
            <h1 className="font-headline-md text-on-surface uppercase">Evaluating Build</h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your submission is being evaluated. This may take up to 2 minutes. Do not close this window.
            </p>

            <div className="font-mono-code text-[10px] text-primary/80 space-y-1.5 pt-2 max-h-36 overflow-y-auto">
              <div>&gt; Submission received and queued...</div>
              {pollCount >= 1 && <div>&gt; Running test suite against submission...</div>}
              {pollCount >= 3 && <div>&gt; Evaluating code quality and SFIA rubric...</div>}
              {pollCount >= 6 && <div>&gt; Compiling final evaluation results...</div>}
              <div className="animate-pulse text-white font-bold">&gt; Waiting for terminal state (poll: {pollCount})...</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 border border-transparent text-on-surface-variant hover:text-on-surface text-label-caps uppercase py-3 transition-colors text-[10px]"
            >
              Exit to Dashboard (results will still be recorded)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submissionResult) {
    const passed = submissionResult.status?.toUpperCase() === 'PASSED';
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface select-none animate-fade-in">
        <div className="w-full max-w-md bg-[#16181D] border border-outline-variant p-8 text-center space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <span className={`material-symbols-outlined text-[48px] ${passed ? 'text-primary' : 'text-error'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {passed ? 'verified' : 'cancel'}
            </span>
            <span className="font-mono-code text-[10px] text-on-surface-variant uppercase tracking-widest">Build Evaluation</span>
            <h1 className="font-display text-[36px] font-extrabold text-on-surface uppercase">
              {passed ? 'BUILD PASSED' : 'BUILD FAILED'}
            </h1>
          </div>

          {submissionResult.feedback && (
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {submissionResult.feedback}
            </p>
          )}

          {passed && (
            <p className="text-xs text-primary leading-relaxed">
              The backend will automatically close your session and record the build results. Return to the dashboard to see your updated profile.
            </p>
          )}

          <div className="pt-4 space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-4 font-label-caps text-label-caps uppercase tracking-widest transition-colors rounded-none"
            >
              Return to Dashboard
            </button>
            {!passed && (
              <button
                onClick={() => {
                  setSubmissionResult(null);
                  setPollCount(0);
                  setSubmissionId(null);
                }}
                className="w-full border border-outline-variant hover:bg-surface-container-high text-on-surface-variant py-3 font-label-caps text-[10px] uppercase tracking-wider rounded-none transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg && !code) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface select-none">
        <div className="max-w-md bg-[#16181D] border border-error/50 p-8 text-center space-y-6">
          <span className="material-symbols-outlined text-[36px] text-error">lock</span>
          <h2 className="font-headline-md text-on-surface uppercase">Access Restricted</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">{errorMsg}</p>
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
    <div className="min-h-screen flex flex-col bg-background text-on-surface relative select-text font-body-md text-body-md animate-fade-in">
      {/* Workspace Header */}
      <header className="h-[48px] bg-surface border-b border-outline-variant flex justify-between items-center px-margin-md z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={handleExitTrigger}
            className="flex items-center gap-1.5 hover:text-primary transition-colors text-on-surface-variant font-label-caps text-label-caps"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Exit Build</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-2 py-0.5 border border-primary/45 bg-primary/5 text-primary font-mono-code text-[10px] uppercase">
            {buildType === 'level' ? 'LEVEL CAPSTONE BUILD' : 'CONCEPT BUILD'}
          </span>
          <button
            onClick={handleExitTrigger}
            className="hover:text-primary transition-colors font-label-caps text-label-caps uppercase text-on-surface-variant text-[10px]"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-48px)]">
        {/* Left Panel: Context */}
        <section className="col-span-5 border-r border-outline-variant p-6 flex flex-col gap-6 text-left overflow-y-auto bg-surface-container-lowest">
          <div>
            <span className="font-mono-code text-[10px] text-primary uppercase tracking-widest block mb-1">
              {buildType === 'level' ? 'STAGE CAPSTONE BUILD' : 'CONCEPT BUILD'}
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase">
              {buildType === 'level'
                ? `${stageData?.name || 'Stage'} Capstone`
                : buildConcept?.predefinedContentRef?.teachingObjective || 'Concept Build'}
            </h2>
          </div>

          <div className="border-t border-outline-variant/30 pt-4 space-y-4 text-sm text-on-surface-variant leading-relaxed">
            {buildType === 'concept' && buildConcept?.predefinedContentRef ? (
              <>
                <div>
                  <span className="font-label-caps text-[9px] text-on-surface-variant uppercase block mb-1">FAILURE SCENARIO</span>
                  <p className="font-body-md text-body-md">{buildConcept.predefinedContentRef.failureScenario}</p>
                </div>
                <div>
                  <span className="font-label-caps text-[9px] text-on-surface-variant uppercase block mb-1">CORE CONTENT</span>
                  <p className="font-body-md text-body-md">{buildConcept.predefinedContentRef.coreContent}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="font-body-md text-body-md">
                  Apply everything you've learned in this stage to build a complete solution that demonstrates mastery across all covered concepts.
                </p>
                <div className="mt-4 space-y-2">
                  <span className="font-label-caps text-label-caps text-on-surface uppercase block">Requirements</span>
                  <ul className="space-y-1.5 text-xs text-on-surface-variant pl-4 list-disc">
                    <li>Implement a solution that correctly handles all edge cases</li>
                    <li>Write comprehensive TDD tests covering happy-path and failures</li>
                    <li>Document your architecture and design decisions</li>
                    <li>Code must be clean, readable, and follow SOLID principles</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-error/10 border border-error/50 p-3">
              <span className="material-symbols-outlined text-error text-[16px]">warning</span>
              <span className="font-mono-code text-error text-[11px]">{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Right Panel: Editors */}
        <section className="col-span-7 flex flex-col overflow-hidden relative bg-[#09090B]">
          {/* Editor Header / Tab Switcher */}
          <div className="flex justify-between items-center border-b border-outline-variant px-4 py-2 bg-surface-container">
            <div className="flex gap-4">
              {['code', 'tests', 'architecture'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-label-caps text-[10px] uppercase py-1 border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab === 'code' ? 'Implementation Code' : tab === 'tests' ? 'TDD Test Suite' : 'Architecture Spec'}
                </button>
              ))}
            </div>
            <span className="font-mono-code text-[10px] text-primary uppercase">[EDITING_MODE]</span>
          </div>

          {/* Code Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {activeTab === 'code' && (
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full flex-1 bg-[#09090B] font-mono-code text-xs text-[#a78bfa] p-6 outline-none border-none resize-none leading-relaxed select-all"
                spellCheck="false"
                placeholder="// Write your implementation code here..."
              />
            )}

            {activeTab === 'tests' && (
              <textarea
                value={testSuite}
                onChange={e => setTestSuite(e.target.value)}
                className="w-full flex-1 bg-[#09090B] font-mono-code text-xs text-primary p-6 outline-none border-none resize-none leading-relaxed select-all"
                spellCheck="false"
                placeholder="// Write your unit testing suite code here..."
              />
            )}

            {activeTab === 'architecture' && (
              <textarea
                value={architecture}
                onChange={e => setArchitecture(e.target.value)}
                className="w-full flex-1 bg-[#09090B] font-mono-code text-xs text-on-surface p-6 outline-none border-none resize-none leading-relaxed select-all"
                spellCheck="false"
                placeholder="# Architecture Document&#10;Describe your structure and design choices..."
              />
            )}
          </div>

          {/* Bottom Bar Controls */}
          <div className="border-t border-outline-variant p-4 bg-surface-container flex justify-between items-center">
            <span className="text-[11px] font-mono-code text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 animate-pulse rounded-full"></span>
              <span>BUILD_WORKSPACE // AUTHENTICATED</span>
            </span>
            <button
              disabled={submitting}
              onClick={handleSubmitBuild}
              className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-wait text-white px-8 py-3.5 font-label-caps text-label-caps uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Build For Evaluation</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </>
              )}
            </button>
          </div>
        </section>
      </main>

      {/* Exit confirmation dialog */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-6 select-none animate-fade-in">
          <div className="bg-[#16181D] border border-error max-w-sm w-full p-8 text-center space-y-6 shadow-2xl">
            <div className="flex flex-col items-center space-y-2 text-error">
              <span className="material-symbols-outlined text-[32px]">warning</span>
              <h3 className="font-headline-md text-on-surface uppercase text-sm">Abort Active Build</h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Exiting now will discard your current code changes. Confirm abort action?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 font-label-caps text-label-caps uppercase tracking-wider rounded-none"
              >
                Cancel / Return to Build
              </button>
              <button
                onClick={confirmDiscardAndExit}
                className="w-full border border-outline-variant hover:bg-surface-container-high text-on-surface-variant py-2.5 font-label-caps text-[10px] uppercase tracking-wider rounded-none"
              >
                Discard Work and Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
