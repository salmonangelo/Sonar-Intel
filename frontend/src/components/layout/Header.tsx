import React, { useState, useEffect } from 'react';
import { ShieldCheck, Waves, Activity, AlertCircle, Info } from 'lucide-react';
import { apiService } from '../../services/api';

interface HeaderProps {
  surveyId?: string;
  onLoadDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ surveyId, onLoadDemo }) => {
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const check = async () => {
      const res = await apiService.checkHealth();
      setBackendStatus(res.status === 'healthy' ? 'online' : 'offline');
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-[#1a2f4c] bg-[#070e1a] px-5 flex items-center justify-between z-20 select-none">
      {/* Brand & Mission Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Waves className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wider text-slate-100 font-mono">SONAR-INTEL</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
              OPERATIONAL MVP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            AI-Powered Side-Scan Sonar Marine Debris & Anomaly Triage
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#0b1626] border border-[#1a2f4c]">
          <span className="text-slate-400">SURVEY:</span>
          <span className="text-cyan-400 font-semibold">{surveyId || 'NO ACTIVE MISSION'}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#0b1626] border border-[#1a2f4c]">
          <span className="text-slate-400">MODEL:</span>
          <span className="text-emerald-400 font-semibold">YOLOv8n-v1</span>
        </div>

        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
          title="Domain & Scientific Honesty Disclaimer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Disclaimer</span>
        </button>
      </div>

      {/* Actions & Health */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLoadDemo}
          className="px-3 py-1.5 text-xs font-medium rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-200 transition-colors flex items-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Load Demo Survey</span>
        </button>

        {/* Backend health pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#091322] border border-[#1a2f4c] text-xs">
          <div className={`w-2 h-2 rounded-full ${
            backendStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' :
            backendStatus === 'checking' ? 'bg-amber-400' : 'bg-red-500'
          }`} />
          <span className="text-[11px] font-mono text-slate-300">
            {backendStatus === 'online' ? 'BACKEND OK' : backendStatus === 'checking' ? 'SYNC' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Scientific Disclaimer Modal Dropdown */}
      {showDisclaimer && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[520px] bg-[#0c182b] border border-cyan-800/80 rounded-lg p-4 shadow-2xl z-50 text-xs text-slate-300 font-sans">
          <div className="flex items-start gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <h4 className="font-semibold text-slate-100">Operational & Scientific Disclaimer</h4>
          </div>
          <p className="text-slate-300 leading-relaxed mb-2">
            SONAR-INTEL is an artificial-anomaly triage and decision-support prototype. Detections indicate statistical backscatter candidates requiring human surveyor verification.
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • Coordinates are mathematically estimated via towfish navigation logs (not survey-grade geodesy).<br/>
            • Shadow evidence is advisory; low-profile debris may exhibit subtle or absent acoustic shadows.
          </p>
          <button
            onClick={() => setShowDisclaimer(false)}
            className="mt-3 w-full py-1 text-center bg-[#132742] hover:bg-[#1a355a] text-cyan-300 rounded text-xs font-medium"
          >
            Acknowledge
          </button>
        </div>
      )}
    </header>
  );
};
