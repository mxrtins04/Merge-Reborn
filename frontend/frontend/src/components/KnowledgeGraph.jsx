import React from 'react';

const NODES = [
  { id: 0,  cx: 12, cy: 18 },
  { id: 1,  cx: 32, cy: 8  },
  { id: 2,  cx: 55, cy: 22 },
  { id: 3,  cx: 78, cy: 12 },
  { id: 4,  cx: 94, cy: 30 },
  { id: 5,  cx: 6,  cy: 38 },
  { id: 6,  cx: 25, cy: 45 },
  { id: 7,  cx: 48, cy: 50 },
  { id: 8,  cx: 68, cy: 42 },
  { id: 9,  cx: 88, cy: 55 },
  { id: 10, cx: 15, cy: 65 },
  { id: 11, cx: 38, cy: 70 },
  { id: 12, cx: 60, cy: 66 },
  { id: 13, cx: 82, cy: 72 },
  { id: 14, cx: 96, cy: 85 },
  { id: 15, cx: 20, cy: 88 },
  { id: 16, cx: 45, cy: 92 },
  { id: 17, cx: 68, cy: 88 },
  { id: 18, cx: 3,  cy: 55 },
  { id: 19, cx: 42, cy: 32 },
];

const EDGES = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[1,6],[2,19],[19,7],[3,8],[4,9],
  [5,6],[6,7],[7,8],[8,9],
  [5,18],[18,10],[6,10],[6,11],[7,11],[7,12],[8,12],[8,13],[9,13],[9,14],
  [10,11],[11,12],[12,13],[13,14],
  [10,15],[11,16],[12,17],[13,17],
  [15,16],[16,17],
  [1,19],[19,8],[0,18],[2,7],
];

export default function KnowledgeGraph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      aria-hidden="true"
    >
      {EDGES.map(([a, b], i) => {
        const nA = NODES[a];
        const nB = NODES[b];
        return (
          <line
            key={`e${i}`}
            x1={nA.cx} y1={nA.cy}
            x2={nB.cx} y2={nB.cy}
            stroke="#adc6ff"
            strokeWidth="0.18"
            style={{
              animation: `kg-line ${6 + (i % 6)}s ease-in-out ${((i * 0.45) % 12).toFixed(2)}s infinite`,
              opacity: 0.05,
            }}
          />
        );
      })}

      {NODES.map((node, i) => (
        <circle
          key={`n${i}`}
          cx={node.cx}
          cy={node.cy}
          r="0.9"
          fill="#adc6ff"
          style={{
            animation: `kg-node ${5 + (i % 4)}s ease-in-out ${((i * 0.65) % 10).toFixed(2)}s infinite`,
            opacity: 0.08,
          }}
        />
      ))}
    </svg>
  );
}
