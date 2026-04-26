import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TelemetryGaugesProps {
  data: number[];
}

const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ data }) => {
  const chartData = data.map((val, i) => ({
    index: i,
    value: val
  }));

  return (
    <div className="flex flex-col gap-[var(--spacing-phi-3)] h-full min-h-0 overflow-hidden">
      <div className="nasa-panel flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-[var(--spacing-phi-3)]">
          <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest">Entropy Distribution [Σ-1024]</h3>
          <span className="text-[10px] font-mono text-telemetry-green">SECURE</span>
        </div>
        
        <div className="flex-1 w-full min-h-[120px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF41" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00FF41" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <Area 
                type="stepAfter" 
                dataKey="value" 
                stroke="#00FF41" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-[var(--spacing-phi-2)] mt-[var(--spacing-phi-3)]">
          <div className="p-[var(--spacing-phi-2)] border border-white/10 bg-white/5 shadow-inner">
            <h4 className="text-[9px] font-mono text-white/40 uppercase mb-1">Effective Bits</h4>
            <p className="text-lg font-mono text-white tracking-tighter font-bold">5120.00</p>
          </div>
          <div className="p-[var(--spacing-phi-2)] border border-white/10 bg-white/5 shadow-inner">
            <h4 className="text-[9px] font-mono text-white/40 uppercase mb-1">Noise Floor</h4>
            <p className="text-lg font-mono text-telemetry-green tracking-tighter font-bold">-124 dB</p>
          </div>
        </div>
      </div>

      <div className="nasa-panel">
        <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest mb-[var(--spacing-phi-3)]">Channel Stability</h3>
        <div className="space-y-[var(--spacing-phi-2)]">
          {[
            { name: 'K40 Visual', value: 99.3, color: 'text-telemetry-green' },
            { name: 'Prime Audio', value: 100, color: 'text-telemetry-green' },
            { name: 'Superstring', value: 87.5, color: 'text-amber' },
            { name: 'Geoglyph', value: 100, color: 'text-telemetry-green' },
            { name: 'Cartridge', value: 94.2, color: 'text-telemetry-green' }
          ].map((ch) => (
            <div key={ch.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono uppercase">
                <span className="text-white/60">{ch.name}</span>
                <span className={ch.color}>{ch.value}%</span>
              </div>
              <div className="h-1 bg-white/5 w-full overflow-hidden ring-1 ring-inset ring-white/5">
                <div 
                  className={`h-full transition-all duration-500 bg-current shadow-[0_0_8px_currentColor] ${ch.color}`} 
                  style={{ width: `${ch.value}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TelemetryGauges;
