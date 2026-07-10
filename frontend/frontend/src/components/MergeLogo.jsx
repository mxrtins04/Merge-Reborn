import React from 'react';

/**
 * MergeLogo — Clean, high-fidelity SVG text logo.
 * Resolves overlapping M & E legibility issues.
 */
export default function MergeLogo({ height = 24, className = "" }) {
  return (
    <span className={`inline-flex items-center ${className}`} aria-label="Merge">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 140 28"
        fill="currentColor"
        height={height}
        role="img"
        aria-label="Merge"
        className="w-auto text-[#F4F6F8]"
      >
        <text
          x="0"
          y="22"
          fill="currentColor"
          style={{
            fontFamily: '"Inter", "Outfit", sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            letterSpacing: '0.12em',
          }}
        >
          MERGE
        </text>
      </svg>
    </span>
  );
}
