import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MergeLogo from '../components/MergeLogo';
import { api } from '../api';

export default function CadetCurriculumScreen() {
  const navigate = useNavigate();
  const [concepts, setConcepts] = useState([]);
  const [stage, setStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      setError('');

      // Get student to find their stage
      const student = await api.get('/students/me');

      if (student.stageId) {
        // Fetch stage info
        const stageData = await api.get(`/stages/${student.stageId}`);
        setStage(stageData);

        // Fetch concepts for this stage
        const conceptList = await api.get(`/concepts?stageId=${student.stageId}`);
        setConcepts(conceptList || []);
      } else {
        setError('No stage assigned yet. Complete onboarding to see your curriculum.');
      }
    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load curriculum.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface select-none">
        <div className="animate-spin text-primary text-[32px] material-symbols-outlined mb-4">sync</div>
        <p className="font-mono-code text-xs uppercase tracking-widest text-on-surface-variant">Loading Curriculum...</p>
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
            {stage?.name ?? 'CURRICULUM'} CURRICULUM
          </span>
        </div>
      </header>

      <main className="flex-grow max-w-3xl w-full mx-auto px-6 py-10">
        <div className="border-b border-outline-variant pb-6 mb-8 text-left">
          <span className="font-mono-code text-[10px] text-primary uppercase block mb-1">
            {stage?.name ?? 'STAGE'} FORMATION MAP
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase">Concept Curriculum</h1>
        </div>

        {error && (
          <div className="functional-border bg-surface-container p-8 text-center space-y-4">
            <span className="material-symbols-outlined text-on-surface-variant text-[32px]">info</span>
            <p className="font-body-md text-on-surface-variant leading-relaxed">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {!error && concepts.length === 0 && !loading && (
          <div className="functional-border bg-surface-container p-8 text-center space-y-4">
            <span className="material-symbols-outlined text-on-surface-variant text-[32px]">school</span>
            <h3 className="font-headline-md text-on-surface uppercase">No Concepts Yet</h3>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              Your instructor hasn't added concepts to this stage yet. Check back soon.
            </p>
          </div>
        )}

        {concepts.length > 0 && (
          <div className="space-y-4">
            {concepts.map((concept, idx) => {
              const ref = concept.predefinedContentRef;
              const title = ref?.teachingObjective || ref?.failureScenario || `Concept ${idx + 1}`;
              const description = ref?.coreContent || ref?.failureScenario || '';

              return (
                <div key={concept.id} className="border border-outline-variant bg-[#16181D] p-6 space-y-3 transition-colors duration-150 hover:border-[#424754]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-[10px] text-on-surface-variant uppercase">
                          #{idx + 1}
                        </span>
                        <span className="font-label-caps text-label-caps text-on-surface font-bold uppercase">
                          {title}
                        </span>
                      </div>
                      {description && (
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {description.length > 200 ? description.substring(0, 200) + '...' : description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem('merge_current_concept_id', concept.id);
                        navigate('/workspace');
                      }}
                      className="flex-shrink-0 border border-outline-variant hover:bg-surface-container-high text-on-surface-variant hover:text-primary px-4 py-2 font-label-caps text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Start
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
