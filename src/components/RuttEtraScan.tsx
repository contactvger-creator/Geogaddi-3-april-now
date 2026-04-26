import React, { useRef, useEffect } from 'react';

interface RuttEtraScanProps {
  data: number[];
  label: string;
  color?: string;
  intensity?: number;
}

export const RuttEtraScan: React.FC<RuttEtraScanProps> = ({ 
  data, 
  label, 
  color = '#0066FF',
  intensity = 1.0 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 120;
    let height = 80;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrame: number;
    const padding = 20; // Increased padding
    const lines = 8; // Number of scanlines
    const pointsPerLine = 24;
    
    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Logical color coding applied here
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.8 * intensity;

      const innerWidth = width - (padding * 2);
      const innerHeight = height - (padding * 2);
      const stepY = innerHeight / (lines - 1);
      const stepX = innerWidth / (pointsPerLine - 1);

      // Bloom/Glow pass
      ctx.shadowBlur = 6 * intensity;
      ctx.shadowColor = color;

      for (let l = 0; l < lines; l++) {
        const linePoints: {x: number, y: number}[] = [];
        
        ctx.beginPath();
        for (let p = 0; p < pointsPerLine; p++) {
          const idx = (l * pointsPerLine + p) % data.length;
          const val = data[idx] || 0;
          
          // Displacement logic - constrained more strictly to prevent clipping
          const displacement = val * (innerHeight * 0.32) * intensity;
          const x = padding + p * stepX;
          // Orthographic perspective tilt - shift lines slightly
          const tiltOffset = (l - lines / 2) * 2;
          const skewX = (displacement / innerHeight) * 3 + tiltOffset;
          // Ensure y doesn't drift outside padding
          const y = padding + (l * stepY) - (displacement * 0.65) + Math.sin(time * 0.001 + p * 0.4 + l * 0.2) * 1.5;

          linePoints.push({ x: x + skewX, y });

          if (p === 0) {
            ctx.moveTo(x + skewX, y);
          } else {
            ctx.lineTo(x + skewX, y);
          }
        }
        ctx.stroke();

        // Draw point cloud dots at scan line vertices
        if (intensity > 0.2) {
          linePoints.forEach((pt, i) => {
            // Every 2nd point to keep performance but look dense
            if (i % 2 === 0) {
              const isPeak = pt.y < (padding + l * stepY - 4);
              const dotSize = isPeak ? 1.2 : 0.6;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, dotSize, 0, Math.PI * 2);
              
              // Pink or Blue dots as requested, contrasting with waveform
              const baseColor = color.toUpperCase();
              const isBlueISH = baseColor.includes('00D2FF') || baseColor.includes('0055FF') || baseColor.includes('4B0082');
              ctx.fillStyle = isBlueISH ? '#FF00FF' : '#00D2FF'; 
              ctx.fill();
              
              // Special peak glow
              if (isPeak && intensity > 0.6) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = isBlueISH ? '#FF00FF' : '#00D2FF';
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            }
          });
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [data, color, intensity]);

  return (
    <div ref={containerRef} className="relative flex flex-col bg-black/40 border border-white/5 overflow-hidden group">
      <div className="absolute top-1 left-1.5 z-10">
        <span className="text-[7px] font-mono text-white/40 uppercase tracking-tighter block leading-none">
          {label}
        </span>
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-full brightness-150 contrast-125"
      />
      
      {/* Decorative scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      <div className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[6px] font-mono text-telemetry-green uppercase">Scanning...</span>
      </div>
    </div>
  );
};
