import React, { useRef, useEffect } from 'react';

interface RuttEtraScanProps {
  data: number[];
  label: string;
  color?: string;
  intensity?: number;
  lines?: number;
  pointsPerLine?: number;
}

export const RuttEtraScan: React.FC<RuttEtraScanProps> = ({ 
  data, 
  label, 
  color = '#0066FF',
  intensity = 1.0,
  lines = 8,
  pointsPerLine = 24
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
    
    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Additive bloom effect
      ctx.globalCompositeOperation = 'lighter';
      
      // Secondary glow pass
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.globalAlpha = 0.2 * intensity;
      ctx.shadowBlur = 12 * intensity;
      ctx.shadowColor = color;

      const innerWidth = width - (padding * 2);
      const innerHeight = height - (padding * 2);
      const stepY = innerHeight / (lines - 1);
      const stepX = innerWidth / (pointsPerLine - 1);

      const drawPath = () => {
        for (let l = 0; l < lines; l++) {
          ctx.beginPath();
          for (let p = 0; p < pointsPerLine; p++) {
            const idx = (l * pointsPerLine + p) % data.length;
            const val = data[idx] || 0;
            
            const displacement = val * (innerHeight * 0.35) * intensity;
            const x = padding + p * stepX;
            const tiltOffset = (l - lines / 2) * 4;
            const drift = Math.sin(time * 0.0005 + l) * 5;
            const y = padding + (l * stepY) - (displacement * 0.7) + Math.sin(time * 0.002 + p * 0.5 + l) * 2;

            if (p === 0) ctx.moveTo(x + tiltOffset + drift, y);
            else ctx.lineTo(x + tiltOffset + drift, y);
          }
          ctx.stroke();
        }
      };

      // Draw glow pass
      drawPath();

      // Main sharp pass
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.9 * intensity;
      ctx.lineWidth = 1.0;
      drawPath();

      // Draw point cloud dots at scan line vertices
      if (intensity > 0.2) {
        ctx.globalCompositeOperation = 'source-over';
        for (let l = 0; l < lines; l++) {
          for (let p = 0; p < pointsPerLine; p++) {
            if (p % 3 === 0) {
              const idx = (l * pointsPerLine + p) % data.length;
              const val = data[idx] || 0;
              const displacement = val * (innerHeight * 0.35) * intensity;
              const x = padding + p * stepX;
              const tiltOffset = (l - lines / 2) * 4;
              const drift = Math.sin(time * 0.0005 + l) * 5;
              const y = padding + (l * stepY) - (displacement * 0.7) + Math.sin(time * 0.002 + p * 0.5 + l) * 2;

              const isPeak = displacement > (innerHeight * 0.1);
              ctx.beginPath();
              ctx.arc(x + tiltOffset + drift, y, isPeak ? 1.5 : 0.8, 0, Math.PI * 2);
              
              const baseColor = color.toUpperCase();
              const isPurpleISH = baseColor.includes('FF007F') || baseColor.includes('9D00FF');
              ctx.fillStyle = isPurpleISH ? '#00F3FF' : '#FF007F'; 
              ctx.fill();

              if (isPeak && intensity > 0.6) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = ctx.fillStyle;
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            }
          }
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
