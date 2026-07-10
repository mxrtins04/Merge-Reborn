import React, { useState, useEffect } from 'react';
import KnowledgeGraph from './KnowledgeGraph';
import MergeLogo from './MergeLogo';

const MESSAGES = [
  "Build deliberately.",
  "One concept at a time.",
  "Mastery takes consistency.",
  "Every engineer starts somewhere.",
  "Small improvements compound.",
  "Write software with intention.",
  "Form before speed.",
  "Understand before you build.",
];

export default function AuthLayout({ children }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#0b0e15] text-[#e1e2ec]">
      {/* Left panel — visual identity */}
      <aside className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        {/* Knowledge Graph fills entire panel */}
        <div className="absolute inset-0">
          <KnowledgeGraph />
        </div>

        {/* Gradient overlay for legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(11,14,21,0.85) 0%, rgba(11,14,21,0.50) 50%, rgba(11,14,21,0.75) 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-10 select-none">
          {/* Logo */}
          <div>
            <MergeLogo height={22} />
          </div>

          {/* Centre message */}
          <div className="flex-1 flex items-center">
            <div className="max-w-[280px]">
              <p
                className="font-mono-code text-[11px] text-primary uppercase tracking-[0.18em] mb-5 font-bold"
                style={{
                  transition: 'opacity 0.35s ease, transform 0.35s ease',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                {MESSAGES[msgIndex]}
              </p>
              <h2 className="font-display text-[50px] font-extrabold text-[#e1e2ec] leading-[1.15] tracking-tight">
                Where engineers<br />are formed.
              </h2>
            </div>
          </div>

          {/* Footer label */}
          <p className="font-mono-code text-[15px] text-[#e1e2ec]/25 uppercase tracking-[0.22em]">
            Engineering Formation Platform
          </p>
        </div>
      </aside>

      {/* Right panel — form area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-[#10131a] min-h-screen">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-10">
          <MergeLogo height={24} />
        </div>
        {children}
      </main>
    </div>
  );
}
