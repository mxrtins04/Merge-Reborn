import React, { useRef, useEffect } from 'react';

export default function CircuitBoardBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    let mouse = { x: -1000, y: -1000 };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initCircuits();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Circuit board parameters
    let pads = [];
    let traces = [];
    let activePulses = [];

    class Pad {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 2.0 + Math.random() * 1.5;
        this.opacity = 0.03 + Math.random() * 0.05;
        this.glow = 0;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(173, 198, 255, ${Math.min(0.7, this.opacity + this.glow)})`;
        ctx.fill();
        if (this.glow > 0) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(173, 198, 255, ${this.glow * 0.20})`;
          ctx.fill();
        }
      }
    }

    class Trace {
      constructor(points) {
        this.points = points; // Array of {x, y}
        this.opacity = 0.02 + Math.random() * 0.03;
      }
      draw() {
        if (this.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.strokeStyle = `rgba(173, 198, 255, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    class Pulse {
      constructor(trace, speed = 1.2) {
        this.trace = trace;
        this.speed = speed;
        this.segmentIndex = 0;
        this.progress = 0; // distance along segment
        this.currentPos = { x: trace.points[0].x, y: trace.points[0].y };
      }

      update() {
        const p1 = this.trace.points[this.segmentIndex];
        const p2 = this.trace.points[this.segmentIndex + 1];
        if (!p1 || !p2) return false;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        this.progress += this.speed;
        if (this.progress >= len) {
          this.segmentIndex++;
          this.progress = 0;
          if (this.segmentIndex >= this.trace.points.length - 1) {
            return false; // finished
          }
        }

        const t = this.progress / len;
        const nextP1 = this.trace.points[this.segmentIndex];
        const nextP2 = this.trace.points[this.segmentIndex + 1];
        this.currentPos.x = nextP1.x + (nextP2.x - nextP1.x) * t;
        this.currentPos.y = nextP1.y + (nextP2.y - nextP1.y) * t;
        return true;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.currentPos.x, this.currentPos.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#adc6ff';
        ctx.shadowColor = '#adc6ff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }
    }

    const initCircuits = () => {
      pads = [];
      traces = [];
      activePulses = [];

      const gridWidth = 90;
      const gridHeight = 90;
      const cols = Math.floor(width / gridWidth);
      const rows = Math.floor(height / gridHeight);

      // Generate traces on grid points
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (Math.random() > 0.12) continue;

          let startX = i * gridWidth + gridWidth / 2;
          let startY = j * gridHeight + gridHeight / 2;
          let points = [{ x: startX, y: startY }];

          let currentX = startX;
          let currentY = startY;
          let segments = 2 + Math.floor(Math.random() * 3);

          let dirX = Math.random() > 0.5 ? 1 : -1;
          let dirY = Math.random() > 0.5 ? 1 : -1;

          for (let s = 0; s < segments; s++) {
            let len = (1 + Math.floor(Math.random() * 2)) * gridWidth;
            let type = Math.random();

            if (type < 0.33) {
              currentX += dirX * len;
            } else if (type < 0.66) {
              currentY += dirY * len;
            } else {
              currentX += dirX * len;
              currentY += dirY * len;
            }

            // Bound checks
            if (currentX < 0 || currentX > width || currentY < 0 || currentY > height) break;
            points.push({ x: currentX, y: currentY });
          }

          if (points.length >= 2) {
            const trace = new Trace(points);
            traces.push(trace);
            pads.push(new Pad(points[0].x, points[0].y));
            pads.push(new Pad(points[points.length - 1].x, points[points.length - 1].y));
          }
        }
      }
    };

    initCircuits();

    // Spawning pulses loop
    const spawnTimer = setInterval(() => {
      if (traces.length > 0 && activePulses.length < 12 && Math.random() > 0.3) {
        const traceIndex = Math.floor(Math.random() * traces.length);
        const trace = traces[traceIndex];
        activePulses.push(new Pulse(trace, 1.0 + Math.random() * 1.5));
      }
    }, 1200);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw traces
      traces.forEach(trace => trace.draw());

      // Update and draw pads (glows based on mouse proximity)
      pads.forEach(pad => {
        const dx = mouse.x - pad.x;
        const dy = mouse.y - pad.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          pad.glow = (1 - dist / 120) * 0.40;
          if (dist < 20 && Math.random() > 0.95) {
            // Trigger interactive pulse when mouse passes close to pad
            const connectedTraces = traces.filter(t => t.points[0].x === pad.x && t.points[0].y === pad.y);
            if (connectedTraces.length > 0) {
              const trace = connectedTraces[Math.floor(Math.random() * connectedTraces.length)];
              if (!activePulses.some(p => p.trace === trace)) {
                activePulses.push(new Pulse(trace, 2.0));
              }
            }
          }
        } else {
          pad.glow = 0;
        }
        pad.draw();
      });

      // Update and draw active pulses
      activePulses = activePulses.filter(pulse => {
        const active = pulse.update();
        if (active) {
          pulse.draw();
        }
        return active;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(spawnTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#0d0f12]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
