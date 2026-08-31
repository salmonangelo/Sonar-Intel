import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, HelpCircle, FileDown, Play, Navigation } from 'lucide-react';
import { SurveyUploadResponse, SurveySummary, Contact } from '../../types/detection';

interface SidebarProps {
  survey: SurveyUploadResponse | null;
  summary: SurveySummary | null;
  contacts: Contact[];
  analyzing: boolean;
  onRunAnalysis: () => void;
  onExportGeoJSON: () => void;
  onExportCSV: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  survey,
  summary,
  contacts,
  analyzing,
  onRunAnalysis,
  onExportGeoJSON,
  onExportCSV
}) => {
  const highCount = summary?.high_priority ?? contacts.filter(c => c.priority === 'HIGH').length;
  const medCount = summary?.medium_priority ?? contacts.filter(c => c.priority === 'MEDIUM').length;
  const lowCount = summary?.low_priority ?? contacts.filter(c => c.priority === 'LOW').length;
  const reviewedCount = summary?.reviewed_count ?? contacts.filter(c => c.review_status !== 'AI_CANDIDATE').length;

  return (
    <aside className="w-64 border-r border-[#1a2f4c] bg-[#070e1a] flex flex-col justify-between p-3 select-none text-xs">
      {/* Top Section: Survey Info & Triage Stats */}
      <div className="space-y-4">
        {/* Survey Info Card */}
        <div className="p-2.5 rounded bg-[#0b1626] border border-[#1a2f4c]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">MISSION SWATH</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              {survey ? 'INGESTED' : 'AWAITING'}
            </span>
          </div>

          {survey ? (
            <div className="space-y-1 font-mono text-[11px]">
              <div className="truncate text-slate-200 font-medium">{survey.filename}</div>
              <div className="flex justify-between text-slate-400">
                <span>Dimensions:</span>
                <span className="text-slate-200">{survey.image_width} × {survey.image_height} px</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Signal Quality:</span>
                <span className="text-emerald-400 font-bold">{Math.round(survey.data_quality * 100)}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Navigation:</span>
                <span className={survey.has_navigation ? 'text-cyan-300' : 'text-slate-500'}>
                  {survey.has_navigation ? 'SYNCED' : 'NONE'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-[11px] italic">No sonar swath loaded. Upload an SSS image or click "Load Demo Survey".</p>
          )}
        </div>

        {/* Trigger Analysis Button */}
        {survey && (
          <button
            onClick={onRunAnalysis}
            disabled={analyzing}
            className={`w-full py-2.5 px-3 rounded font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              analyzing
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse cursor-wait'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{analyzing ? 'PROCESSING SWATH...' : 'RUN ANALYSIS PIPELINE'}</span>
          </button>
        )}

        {/* Priority Breakdown */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>TRIAGE STATS</span>
            <span className="text-cyan-400">{contacts.length} TOTAL</span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-[#0b1626] border border-red-900/40">
              <div className="flex items-center gap-2 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                <span className="font-semibold">HIGH PRIORITY</span>
              </div>
              <span className="font-bold text-red-300">{highCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0b1626] border border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-400">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
                <span className="font-semibold">MEDIUM PRIORITY</span>
              </div>
              <span className="font-bold text-amber-300">{medCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0b1626] border border-blue-900/40">
              <div className="flex items-center gap-2 text-sky-400">
                <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_6px_#38bdf8]" />
                <span className="font-semibold">LOW PRIORITY</span>
              </div>
              <span className="font-bold text-sky-300">{lowCount}</span>
            </div>
          </div>
        </div>

        {/* Human Review Progress */}
        <div className="p-2.5 rounded bg-[#0b1626] border border-[#1a2f4c]">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1.5">
            <span>REVIEW PROGRESS</span>
            <span className="text-cyan-400 font-bold">{reviewedCount} / {contacts.length}</span>
          </div>
          <div className="w-full h-1.5 bg-[#14233a] rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${contacts.length > 0 ? (reviewedCount / contacts.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section: Mission Exports */}
      <div className="pt-3 border-t border-[#1a2f4c] space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">EXPORT MISSION DATA</span>
        <div className="grid grid-cols-2 gap-2 font-mono">
          <button
            onClick={onExportGeoJSON}
            disabled={contacts.length === 0}
            className="p-1.5 rounded bg-[#0c182a] hover:bg-[#132742] disabled:opacity-40 disabled:hover:bg-[#0c182a] border border-[#1a2f4c] text-cyan-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3 h-3" />
            <span>GeoJSON</span>
          </button>
          <button
            onClick={onExportCSV}
            disabled={contacts.length === 0}
            className="p-1.5 rounded bg-[#0c182a] hover:bg-[#132742] disabled:opacity-40 disabled:hover:bg-[#0c182a] border border-[#1a2f4c] text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
