import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HexStageProps {
  state: 0 | 1 | 2; // Write (blank), Encrypted (shielded), Decrypted (unicursal)
  phase?: number;
  clayTerrain?: number[];
}

const HexStage: React.FC<HexStageProps> = ({ state, phase = 0, clayTerrain = [0, 0, 0, 0, 0, 0] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 300;
  const center = { x: size / 2, y: size / 2 };
  const radius = size * 0.28; 

  const vertices = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      let angle: number;
      let r = radius;

      if (state === 2) {
        // Precise Crowley Thelema angles and radii to match image proportions
        // 0: Top, 1: Top-Right, 2: Bottom-Right, 3: Bottom, 4: Bottom-Left, 5: Top-Left
        const thelemaAngles = [90, 20, 340, 270, 200, 160];
        angle = thelemaAngles[i] * Math.PI / 180;
        
        // Image proportions: Stretched for the unicursal hexagram while staying within the circle
        const isVertical = i === 0 || i === 3;
        r = isVertical ? radius * 1.5 : radius * 1.6;
      } else {
        const angles = [90, 30, 330, 270, 210, 150]; // Regular hexagon angles
        angle = angles[i] * Math.PI / 180;
        r = radius * 1.55; 
        if (state === 1) {
          r += (clayTerrain[i] || 0) * 2;
        }
      }
      
      return {
        x: center.x + r * Math.cos(angle),
        y: center.y - r * Math.sin(angle) 
      };
    });
  }, [state, clayTerrain, radius, center.x, center.y]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 1. Render K40 Grain Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      
      // High-density micro-grain
      for(let i=0; i<300; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const alpha = Math.random() * 0.05;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillRect(x, y, 1, 1);
      }

      // 2. Render Geometric State
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = false; // Sharper pixel boundaries

      if (state === 0) {
        // State 0: Write (Blank Hexagon) - Turquoise/NASA Cyan
        drawHexagon(ctx, vertices, '#40E0D0', 1.5);
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#40E0D0';
        drawHexagon(ctx, vertices, '#40E0D0', 0.5);
        ctx.shadowBlur = 0;
      } 
      else if (state === 1) {
        // State 1: Encrypted (Shielded) - NASA Red
        const nasaRed = '#FC3D21';
        drawHexagon(ctx, vertices, nasaRed, 2);
        
        // Draw diagonal shield: Top-Left (Index 5) to Bottom-Right (Index 2)
        ctx.beginPath();
        ctx.moveTo(vertices[5].x, vertices[5].y);
        ctx.lineTo(vertices[2].x, vertices[2].y);
        ctx.strokeStyle = nasaRed;
        ctx.lineWidth = 12;
        ctx.globalAlpha = 0.25;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        
        drawVertices(ctx, vertices, nasaRed, 5);
      } 
      else if (state === 2) {
        // State 2: Decrypted (Unicursal Hexagram) - Telemetry Green
        const green = '#00FF41';
        const order = [0, 2, 5, 3, 1, 4, 0];
        const progress = Math.min(phase / 1024, 1);
        const stepsToDraw = Math.floor(order.length * progress);
        
        if (stepsToDraw >= 1) {
          ctx.beginPath();
          const startV = vertices[order[0]];
          ctx.moveTo(startV.x, startV.y);
          
          for (let i = 1; i < stepsToDraw; i++) {
            const v = vertices[order[i]];
            ctx.lineTo(v.x, v.y);
          }
          
          if (progress < 1 && stepsToDraw > 0) {
             const nextIdx = order[stepsToDraw];
             const prevIdx = order[stepsToDraw - 1];
             const subProgress = (order.length * progress) % 1;
             const px = vertices[prevIdx].x + (vertices[nextIdx].x - vertices[prevIdx].x) * subProgress;
             const py = vertices[prevIdx].y + (vertices[nextIdx].y - vertices[prevIdx].y) * subProgress;
             ctx.lineTo(px, py);
          } else if (progress >= 1) {
             ctx.lineTo(vertices[order[0]].x, vertices[order[0]].y);
          }

          ctx.shadowBlur = 10;
          ctx.shadowColor = green;
          ctx.lineWidth = 2 + (phase / 1024) * 4;
          ctx.strokeStyle = green;
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          // Secondary sharp stroke
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#FFFFFF';
          ctx.globalAlpha = 0.5 * (phase / 1024);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Draw the center point (The Rose)
        if (progress > 0.4) {
          ctx.globalAlpha = Math.min(1, (progress - 0.4) * 2);
          ctx.beginPath();
          ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = green;
          ctx.fill();
          ctx.shadowBlur = 10;
          ctx.shadowColor = green;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        }
        
        drawVertices(ctx, vertices, green, 4);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, phase, vertices, size]);

  function drawHexagon(ctx: CanvasRenderingContext2D, v: { x: number, y: number }[], color: string, width: number) {
    ctx.beginPath();
    ctx.moveTo(v[0].x, v[0].y);
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawVertices(ctx: CanvasRenderingContext2D, v: { x: number, y: number }[], color: string, r: number) {
    for (const p of v) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  return (
    <div className="nasa-panel flex flex-col items-center justify-center min-h-[350px]">
      <div className="absolute top-[var(--spacing-phi-2)] left-[var(--spacing-phi-2)] text-[10px] font-mono text-white/40 uppercase tracking-widest">
        Riemann State Visualizer [v2.1]
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="rounded-full shadow-[0_0_30px_rgba(0,102,255,0.25)] border border-royal-blue/35"
      />

      <div className="mt-[var(--spacing-phi-3)] grid grid-cols-3 gap-[var(--spacing-phi-3)] w-full text-center">
        <div>
          <p className="text-[9px] font-mono text-white/40 uppercase mb-1">State</p>
          <h4 className={`text-[10px] font-mono ${state === 1 ? 'text-caution-red' : 'text-telemetry-green'}`}>
            {state === 0 ? 'WRITE' : state === 1 ? 'SHIELDED' : 'UNICURSAL'}
          </h4>
        </div>
        <div>
          <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Phase</p>
          <h4 className="text-[10px] font-mono text-telemetry-green tracking-tighter">
            Φ = {phase.toString().padStart(4, '0')}
          </h4>
        </div>
        <div>
          <p className="text-[9px] font-mono text-white/40 uppercase mb-1">Supercharge</p>
          <h4 className="text-[10px] font-mono text-telemetry-green">Q_L ⊕ Q_R</h4>
        </div>
      </div>
    </div>
  );
};

export default HexStage;

