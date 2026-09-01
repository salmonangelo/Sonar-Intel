import React, { useState, useEffect } from 'react';
import { Anchor, ShieldCheck, Activity, Info, ChevronDown, Search } from 'lucide-react';
import { apiService } from '../../services/api';

interface HeaderProps {
  surveyId?: string;
  onLoadDemoSample: (sampleId: string) => void;
  onCustomUploadClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  surveyId,
  onLoadDemoSample,
  onCustomUploadClick
}) => {
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const [showDemoMenu, setShowDemoMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    <header className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between z-30 select-none shadow-xs font-sans">
      {/* Brand & Portal Label Matching Figma */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
          <Anchor className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-slate-900 font-sans">SONAR-INTEL</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
              GOVT / NGO PORTAL
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-none mt-0.5">
            AI-Assisted Side-Scan Sonar Anomaly Detection & Operator Triage
          </p>
        </div>
      </div>

      {/* Center Search Input Matching Figma Topbar */}
      <div className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anomalies, coordinates, or grids..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
        />
      </div>

      {/* Right Actions: Curated Demo Dropdown, Model Version & Health Status */}
      <div className="flex items-center gap-3">
        {/* Curated Demo Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Demo Swath</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 top-10 w-84 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                CURATED TEST-SET DEMONSTRATIONS
              </div>

              <button
                onClick={() => {
                  onLoadDemoSample('viator_04');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="font-semibold text-slate-900">Viator-04 (Held-Out Test Wreck)</div>
                <div className="text-[11px] text-slate-500">
                  Prominent shipwreck hull • High highlight & acoustic shadow (True Positive)
                </div>
              </button>

              <button
                onClick={() => {
                  onLoadDemoSample('corsican_02');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="font-semibold text-slate-900">Corsican-02 (Held-Out Test Target)</div>
                <div className="text-[11px] text-slate-500">
                  Verified shipwreck target matching ground-truth YOLO annotation
                </div>
              </button>

              <button
                onClick={() => {
                  onLoadDemoSample('artificial_reef_02');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="font-semibold text-slate-900">Artificial Reef-02 (Seabed Clutter)</div>
                <div className="text-[11px] text-slate-500">
                  Geological ridges & rock reefs (False Alarm Operator Triage)
                </div>
              </button>

              <button
                onClick={() => {
                  onLoadDemoSample('survey_001');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="font-semibold text-slate-900">Survey-001 (Towfish Nav Reference)</div>
                <div className="text-[11px] text-slate-500">
                  Synchronized towfish navigation log (Estimated GPS Telemetry)
                </div>
              </button>

              {onCustomUploadClick && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onCustomUploadClick();
                      setShowDemoMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-md hover:bg-slate-50 text-slate-700 text-xs font-medium"
                  >
                    + Upload Custom SSS Swath...
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Model Provenance Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs">
          <span className="text-slate-500">Model:</span>
          <span className="text-slate-900 font-mono font-medium text-[11px]">yolov8n-sonar-baseline</span>
        </div>

        {/* Scientific Disclaimer Trigger */}
        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          title="Domain & Scientific Honesty Disclaimer"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Backend Health Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <div className={`w-2 h-2 rounded-full ${
            backendStatus === 'online' ? 'bg-emerald-500' :
            backendStatus === 'checking' ? 'bg-amber-400' : 'bg-red-500'
          }`} />
          <span className="font-medium text-[11px]">
            {backendStatus === 'online' ? 'API Online' : 'Connecting'}
          </span>
        </div>
      </div>

      {/* Scientific Disclaimer Modal */}
      {showDisclaimer && (
        <div className="absolute top-14 right-5 w-96 bg-white border border-slate-200 rounded-lg p-4 shadow-xl z-50 text-xs text-slate-700">
          <div className="flex items-start gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <h4 className="font-bold text-slate-900">Operational & Scientific Scope</h4>
          </div>
          <p className="text-slate-600 leading-relaxed mb-2 text-xs">
            SONAR-INTEL is an <strong>AI-assisted acoustic anomaly candidate generator and operator triage decision-support system</strong>.
          </p>
          <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
            • Coordinates are mathematically estimated from along-track navigation records when provided.<br/>
            • Baseline benchmarks reflect real measured performance: <strong>Validation mAP50: 6.45%</strong>, <strong>Frozen Test mAP50: 10.48%</strong>.
          </p>
          <button
            onClick={() => setShowDisclaimer(false)}
            className="w-full py-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-medium transition-colors"
          >
            Acknowledge
          </button>
        </div>
      )}
    </header>
  );
};
