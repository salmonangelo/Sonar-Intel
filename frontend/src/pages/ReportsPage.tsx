import React, { useState } from 'react';
import { Contact, SurveyUploadResponse } from '../types/detection';
import { 
  FileText, 
  FileDown, 
  MapPin, 
  Cpu, 
  Clock 
} from 'lucide-react';

interface ReportsPageProps {
  survey: SurveyUploadResponse | null;
  contacts: Contact[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ survey, contacts }) => {
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (!survey) return;
    window.open(`/api/surveys/${survey.survey_id}/csv`, '_blank');
    setDownloadMsg('Generated detection CSV export.');
  };

  const handleExportGeoJSON = () => {
    if (!survey) return;
    window.open(`/api/surveys/${survey.survey_id}/geojson`, '_blank');
    setDownloadMsg('Generated spatial GeoJSON export.');
  };

  const handleExportSummary = () => {
    if (!survey) return;
    window.open(`/api/surveys/${survey.survey_id}/summary`, '_blank');
    setDownloadMsg('Generated survey executive summary.');
  };

  const confirmedCount = contacts.filter(c => c.review_status === 'CONFIRMED').length;
  const fpCount = contacts.filter(c => c.review_status === 'FALSE_POSITIVE').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc] text-slate-900 font-sans select-none">
      {/* Header Matching Figma */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Reports & Export Central
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hydrographic Data Products, Spatial GeoJSON, and Tabular Audit Artifacts
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Active Swath: <span className="text-slate-900 font-mono font-semibold">{survey?.survey_id || 'None'}</span>
        </div>
      </div>

      {downloadMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>[Download Initiated] {downloadMsg}</span>
          <button onClick={() => setDownloadMsg(null)} className="underline text-[11px] font-medium">Dismiss</button>
        </div>
      )}

      {/* 4 Primary Export Cards Matching Figma Screen 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Card 1: Full Survey Hydrographic Report */}
        <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Full Survey Report</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aggregated acoustic and visual mapping datasets for government or vessel operator review.
            </p>
          </div>
          <button
            onClick={handleExportSummary}
            disabled={!survey}
            className="w-full py-2 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>

        {/* Card 2: Spatial GeoJSON */}
        <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <MapPin className="w-4 h-4 text-slate-700" />
              <span>Spatial GeoJSON</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vector layer matching standard GIS data formats (QGIS, ArcGIS) with point geometries and metadata labels.
            </p>
          </div>
          <button
            onClick={handleExportGeoJSON}
            disabled={!survey || contacts.length === 0}
            className="w-full py-2 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-300 text-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Start Export</span>
          </button>
        </div>

        {/* Card 3: Tabular Detections CSV */}
        <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <FileDown className="w-4 h-4 text-slate-700" />
              <span>Detections CSV</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tabular spreadsheet containing candidate IDs, pixel bounds, AI confidences, acoustic scores, and review statuses.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!survey || contacts.length === 0}
            className="w-full py-2 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-300 text-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Card 4: Model Specifications Card */}
        <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span>Baseline Model Card</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official model card for <code className="text-slate-800 font-mono text-[11px]">yolov8n-sonar-baseline</code> documenting dataset split and verified metrics.
            </p>
          </div>
          <button
            onClick={() => window.open('/outputs/models/yolov8n_sonar_baseline/MODEL_CARD.md', '_blank')}
            className="w-full py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Model Card</span>
          </button>
        </div>
      </div>

      {/* Bottom Grid: Consolidated Stats & Recent Exports Log on White Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Consolidated Environmental Impact / Triage Totals (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs uppercase text-slate-500 font-bold border-b border-slate-100 pb-2">
            CONSOLIDATED ENVIRONMENTAL IMPACT SUMMARY
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Total Anomaly Candidates:</span>
              <span className="text-slate-900 font-bold font-mono">{contacts.length} items</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Confirmed Anomaly Contacts:</span>
              <span className="text-emerald-700 font-bold font-mono">{confirmedCount}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">False Positive Clutter:</span>
              <span className="text-red-700 font-bold font-mono">{fpCount}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Operator Triage Rate:</span>
              <span className="text-slate-900 font-bold font-mono">
                {contacts.length > 0 ? `${Math.round(((confirmedCount + fpCount) / contacts.length) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Spatial Datum:</span>
              <span className="text-slate-800 font-medium">WGS 84 (EPSG:4326)</span>
            </div>
          </div>
        </div>

        {/* Recent Exports Log Table (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs uppercase text-slate-500 font-bold border-b border-slate-100 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-600" /> Recent Exports Log</span>
            <span className="text-slate-400 text-[10px]">PROVENANCE RECORDS</span>
          </div>

          <div className="space-y-2">
            {[
              { file: `${survey?.survey_id || 'DEMO'}_detections.csv`, type: 'CSV Tabular Export', status: 'Available', size: '1.8 KB' },
              { file: `${survey?.survey_id || 'DEMO'}_spatial.geojson`, type: 'GeoJSON Point FeatureCollection', status: 'Available', size: '4.2 KB' },
              { file: 'yolov8n_sonar_baseline_model_card.md', type: 'Baseline Model Specifications', status: 'Archived', size: '3.1 KB' }
            ].map((row, idx) => (
              <div key={idx} className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-900 font-semibold font-mono text-[11px]">{row.file}</div>
                  <div className="text-[11px] text-slate-500">{row.type} • {row.size}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
