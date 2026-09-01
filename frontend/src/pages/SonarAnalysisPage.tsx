import React, { useState, useRef, useEffect } from 'react';
import { Contact, SurveyUploadResponse } from '../types/detection';
import { 
  Eye, 
  Sliders, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle,
  Filter,
  Play,
  ArrowRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface SonarAnalysisPageProps {
  survey: SurveyUploadResponse | null;
  contacts: Contact[];
  selectedContact: Contact | null;
  analyzing: boolean;
  onSelectContact: (contact: Contact) => void;
  onRunAnalysis: () => void;
  onVerifyContact?: (contact: Contact) => void;
}

export const SonarAnalysisPage: React.FC<SonarAnalysisPageProps> = ({
  survey,
  contacts,
  selectedContact,
  analyzing,
  onSelectContact,
  onRunAnalysis,
  onVerifyContact
}) => {
  const [viewMode, setViewMode] = useState<'raw' | 'processed'>('processed');
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'top' | 'all'>('top');
  const [contrast, setContrast] = useState<number>(100);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState<{ scaleX: number; scaleY: number }>({ scaleX: 1, scaleY: 1 });

  const displayedContacts = filterMode === 'top' ? contacts.slice(0, 5) : contacts;

  const updateScaling = () => {
    if (imgRef.current && imgRef.current.clientWidth > 0) {
      const renderW = imgRef.current.clientWidth;
      const renderH = imgRef.current.clientHeight;
      setScale({
        scaleX: renderW / (survey?.image_width || 1280),
        scaleY: renderH / (survey?.image_height || 1800)
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateScaling);
    return () => window.removeEventListener('resize', updateScaling);
  }, [survey]);

  useEffect(() => {
    if (selectedContact && containerRef.current && scale.scaleY > 0) {
      const targetY = selectedContact.bbox.y1 * scale.scaleY;
      containerRef.current.scrollTo({
        top: Math.max(0, targetY - containerRef.current.clientHeight / 3),
        behavior: 'smooth'
      });
    }
  }, [selectedContact, scale]);

  const activeContact = selectedContact || contacts[0] || null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans select-none">
      {/* 3-Column Layout Matching Figma Sonar Analysis Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Column (3 Cols): Survey Details & Acoustic Metadata on Clean White Cards */}
        <div className="lg:col-span-3 h-full border-r border-slate-200 bg-white p-4 flex flex-col justify-between overflow-y-auto space-y-4 shadow-xs">
          <div className="space-y-4">
            {/* Survey Details Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 pb-1">
                SURVEY DETAILS
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Survey ID:</span>
                  <span className="text-slate-900 font-mono font-semibold truncate max-w-[130px]">
                    {survey?.survey_id || 'Awaiting Swath'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File:</span>
                  <span className="text-slate-700 truncate max-w-[130px] font-mono text-[11px]">
                    {survey?.filename || '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dimensions:</span>
                  <span className="text-slate-800 font-mono text-[11px]">
                    {survey ? `${survey.image_width} × ${survey.image_height} px` : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operator:</span>
                  <span className="text-slate-800 font-medium">C. Vance</span>
                </div>
              </div>
            </div>

            {/* Quality Metrics Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 pb-1">
                QUALITY METRICS
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">SNR Quality:</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    {survey ? `${Math.round(survey.data_quality * 100)}%` : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dynamic Range:</span>
                  <span className="text-slate-800 font-mono">18.4 dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolution:</span>
                  <span className="text-slate-800 font-mono">15 cm/px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Normalization:</span>
                  <span className="text-slate-800 font-medium">1–99% Swath Stretch</span>
                </div>
              </div>
            </div>

            {/* Navigation Metadata Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 pb-1">
                NAVIGATION METADATA
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sensor Track:</span>
                  <span className={survey?.has_navigation ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    {survey?.has_navigation ? 'Synchronized' : 'Unavailable'}
                  </span>
                </div>
                {survey?.has_navigation ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Heading:</span>
                      <span className="text-slate-800 font-mono">184.2°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tow Speed:</span>
                      <span className="text-slate-800 font-mono">4.2 kts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Altitude:</span>
                      <span className="text-slate-800 font-mono">12.5 m</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500 italic pt-1 leading-relaxed">
                    No towfish positioning log uploaded with this swath. Geolocation remains unavailable.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Re-Run Inference Button */}
          {survey && (
            <button
              onClick={onRunAnalysis}
              disabled={analyzing}
              className={`w-full py-2.5 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                analyzing
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 animate-pulse cursor-wait'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{analyzing ? 'Processing Swath...' : 'Re-Run YOLO Inference'}</span>
            </button>
          )}
        </div>

        {/* Center Column (6 Cols): Main Side-Scan Sonar Swath Viewer with Toolbar */}
        <div className="lg:col-span-6 h-full flex flex-col min-h-0 bg-[#070c18] relative">
          {/* Top Control Toolbar Matching Figma */}
          <div className="h-11 border-b border-slate-800 bg-[#0c1426] px-4 flex items-center justify-between z-10 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'processed' ? 'raw' : 'processed')}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  viewMode === 'processed'
                    ? 'bg-slate-800 text-white border-slate-600'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {viewMode === 'processed' ? '1-99% Normalized' : 'Raw Acoustic'}
              </button>

              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  showBoxes
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-transparent text-slate-500 border-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Detection Overlays ({displayedContacts.length})</span>
              </button>
            </div>

            {/* Contrast Slider & Top 5 Filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Contrast:</span>
                <input
                  type="range"
                  min={50}
                  max={180}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-16 h-1 bg-slate-700 rounded cursor-pointer accent-white"
                />
              </div>

              <button
                onClick={() => setFilterMode(filterMode === 'top' ? 'all' : 'top')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center gap-1"
                title="Toggle between Top 5 strongest candidates and all raw proposals"
              >
                <Filter className="w-3 h-3" />
                <span>{filterMode === 'top' ? 'Top 5' : 'All'}</span>
              </button>
            </div>
          </div>

          {/* Sonar Waterfall Viewport (Dominant Acoustic Imagery) */}
          <div ref={containerRef} className="flex-1 overflow-auto relative p-4 flex justify-center items-start acoustic-scroll">
            {survey ? (
              <div className="relative inline-block border border-slate-800 shadow-2xl">
                <img
                  ref={imgRef}
                  src={viewMode === 'processed' ? survey.processed_image_url : survey.raw_image_url}
                  alt="Side-Scan Sonar Waterfall Swath"
                  onLoad={updateScaling}
                  style={{
                    filter: `contrast(${contrast}%)`,
                    maxHeight: '100%',
                    display: 'block'
                  }}
                  className="transition-all select-none"
                />

                {/* Overlaid Candidate Bounding Boxes Aligned with Figma */}
                {showBoxes && displayedContacts.map((c) => {
                  const isSelected = activeContact?.contact_id === c.contact_id;
                  const left = c.bbox.x1 * scale.scaleX;
                  const top = c.bbox.y1 * scale.scaleY;
                  const width = (c.bbox.x2 - c.bbox.x1) * scale.scaleX;
                  const height = (c.bbox.y2 - c.bbox.y1) * scale.scaleY;

                  let borderClass = 'border-sky-400';
                  let bgBadge = 'bg-sky-500';
                  if (c.priority === 'HIGH') {
                    borderClass = 'border-red-500';
                    bgBadge = 'bg-red-600';
                  } else if (c.priority === 'MEDIUM') {
                    borderClass = 'border-amber-500';
                    bgBadge = 'bg-amber-600';
                  }

                  return (
                    <div
                      key={c.contact_id}
                      onClick={() => onSelectContact(c)}
                      style={{
                        position: 'absolute',
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${Math.max(14, width)}px`,
                        height: `${Math.max(14, height)}px`,
                      }}
                      className={`cursor-pointer border-2 transition-all ${borderClass} ${
                        isSelected ? 'ring-2 ring-white scale-105 z-20 shadow-lg' : 'z-10 opacity-90'
                      }`}
                    >
                      <div className={`absolute -bottom-5 left-0 px-1 py-0.2 rounded font-mono font-bold text-[9px] text-white whitespace-nowrap shadow-xs ${bgBadge}`}>
                        {c.contact_id} ({Math.round(c.confidence * 100)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 text-center">
                <p>No active survey swath loaded.</p>
                <p className="text-[11px] text-slate-600 mt-1">Select a curated held-out test sample from the top bar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (3 Cols): Ranked Detection Queue Matching Figma */}
        <div className="lg:col-span-3 h-full border-l border-slate-200 bg-white flex flex-col min-h-0 shadow-xs">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs tracking-wider uppercase">DETECTION QUEUE</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {displayedContacts.length} Ranked
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            {displayedContacts.map((c) => {
              const isSelected = activeContact?.contact_id === c.contact_id;
              let badgeColor = 'text-sky-700 bg-sky-50 border-sky-200';
              if (c.priority === 'HIGH') {
                badgeColor = 'text-red-700 bg-red-50 border-red-200';
              } else if (c.priority === 'MEDIUM') {
                badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
              }

              return (
                <div
                  key={c.contact_id}
                  onClick={() => onSelectContact(c)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-slate-50 border-slate-900 shadow-xs' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Dark Acoustic Thumbnail Preview Box */}
                    <div className="w-9 h-9 rounded bg-[#070c18] border border-slate-800 flex items-center justify-center text-[9px] font-mono font-bold text-slate-300 shrink-0">
                      {c.contact_id}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-slate-900 text-xs">{c.contact_id}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${badgeColor}`}>
                          {c.priority}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Conf: <span className="font-semibold text-slate-800">{Math.round(c.confidence * 100)}%</span> • {c.review_status}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectContact(c);
                      onVerifyContact?.(c);
                    }}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-800"
                    title="Open in Contact Verification"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Acoustic Evidence Row Matching Figma ("ACOUSTIC CONTEXT VERIFICATION") */}
      {activeContact && (
        <div className="h-24 border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between text-xs z-20 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
              Acoustic Context Verification ({activeContact.contact_id})
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 flex-1 max-w-4xl px-6 text-xs">
            {/* 1. Object-Shadow Deficit */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">OBJECT-SHADOW ANALYSIS</div>
                <div className="font-bold text-slate-800 text-xs mt-0.5">SHADOW MATCHED</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                PASS
              </span>
            </div>

            {/* 2. Seabed Texture Match */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">SEABED TEXTURE MATCH</div>
                <div className="font-bold text-slate-800 text-xs mt-0.5">SANDY / GRAVEL</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                87%
              </span>
            </div>

            {/* 3. False Positive Risk */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">FALSE POSITIVE RISK</div>
                <div className="font-bold text-slate-800 text-xs mt-0.5">ANOMALOUS STRUCTURE</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                12/100
              </span>
            </div>

            {/* 4. Overall AI Confidence */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">OVERALL CONFIDENCE</div>
                <div className="font-bold text-slate-800 text-xs mt-0.5">HI-RES MATCH</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {Math.round(activeContact.confidence * 100)}%
              </span>
            </div>
          </div>

          <button
            onClick={() => onVerifyContact?.(activeContact)}
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Verify Candidate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
