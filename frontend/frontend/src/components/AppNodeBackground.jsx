import React, { useRef, useEffect } from 'react';

export default function AppNodeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2 };
    let currentOffset = { x: 0, y: 0 };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Projected nodes in 3D space with high visibility to match the auth panel
    const nodeCount = 45;
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const z = 0.6 + Math.random() * 1.8; // Z depth plane
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: z,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: (1.5 + Math.random() * 2.2) * (1.3 / z),
        // Increased base opacity to match the high contrast of the login screen
        opacity: (0.22 + Math.random() * 0.28) * (1.2 / z)
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Lerp camera parallax offsets
      const targetX = (mouse.x - width / 2) * 0.035;
      const targetY = (mouse.y - height / 2) * 0.035;
      currentOffset.x += (targetX - currentOffset.x) * 0.06;
      currentOffset.y += (targetY - currentOffset.y) * 0.06;

      // Update positions
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Screen boundary wrap
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;
      });

      // Draw connection traces with high contrast
      ctx.lineWidth = 1.0;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        const x1 = n1.x + currentOffset.x / n1.z;
        const y1 = n1.y + currentOffset.y / n1.z;

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          // Restrict lines to nearby depth layers
          if (Math.abs(n1.z - n2.z) > 0.6) continue;

          const x2 = n2.x + currentOffset.x / n2.z;
          const y2 = n2.y + currentOffset.y / n2.z;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            // Increased line opacity coefficient to match the login screen visibility
            const alpha = (1 - dist / 110) * 0.18 * (1.2 / n1.z);
            ctx.strokeStyle = `rgba(173, 198, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // Draw individual dimension nodes
      nodes.forEach((node) => {
        const x = node.x + currentOffset.x / node.z;
        const y = node.y + currentOffset.y / node.z;

        ctx.beginPath();
        ctx.arc(x, y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(173, 198, 255, ${node.opacity})`;
        ctx.fill();

        // Highlight layer glow for closer dimensions
        if (node.z < 1.0) {
          ctx.beginPath();
          ctx.arc(x, y, node.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(173, 198, 255, ${node.opacity * 0.25})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#0F1117]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
