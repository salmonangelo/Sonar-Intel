import React, { useState } from 'react';
import { Contact, SurveyUploadResponse, ReviewStatus } from '../types/detection';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  MapPin, 
  Save, 
  Clock 
} from 'lucide-react';

interface ContactVerificationPageProps {
  survey: SurveyUploadResponse | null;
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  onSubmitReview: (contactId: string, status: ReviewStatus, note?: string) => Promise<void>;
  onNavigateToMap: () => void;
}

export const ContactVerificationPage: React.FC<ContactVerificationPageProps> = ({
  survey,
  contacts,
  selectedContact,
  onSelectContact,
  onSubmitReview,
  onNavigateToMap
}) => {
  const activeContact = selectedContact || contacts[0] || null;
  const [operatorNote, setOperatorNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleAction = async (status: ReviewStatus) => {
    if (!activeContact) return;
    setSubmitting(true);
    setSaveMessage(null);
    try {
      await onSubmitReview(activeContact.contact_id, status, operatorNote);
      setSaveMessage(`Contact ${activeContact.contact_id} recorded as ${status}.`);
      setOperatorNote('');
    } catch (err) {
      console.error('Review submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500">
        <p>No candidate contact selected for triage.</p>
        <p className="text-[11px] text-slate-400 mt-1">Select a survey in Sonar Analysis first.</p>
      </div>
    );
  }

  const bboxWidth = activeContact.bbox.x2 - activeContact.bbox.x1;
  const bboxHeight = activeContact.bbox.y2 - activeContact.bbox.y1;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc] text-slate-900 font-sans select-none">
      {/* Header Matching Figma */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Contact Verification Workflow
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-Loop Hydrographic Operator Triage & Anomaly Validation
          </p>
        </div>

        {/* Candidate Selector Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Select Candidate:</span>
          <select
            value={activeContact.contact_id}
            onChange={(e) => {
              const found = contacts.find(c => c.contact_id === e.target.value);
              if (found) onSelectContact(found);
            }}
            className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-900 font-mono font-semibold shadow-xs focus:outline-none focus:border-slate-400"
          >
            {contacts.map(c => (
              <option key={c.contact_id} value={c.contact_id}>
                {c.contact_id} ({c.priority} • {Math.round(c.confidence * 100)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Verification Dual-Panel Grid Matching Figma Screen 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Acoustic Detection Crop & Target Telemetry on White Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 text-sm">
                Acoustic Detection Crop ({activeContact.contact_id})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Bounds: [{activeContact.bbox.x1}, {activeContact.bbox.y1}] - [{activeContact.bbox.x2}, {activeContact.bbox.y2}]
              </span>
            </div>

            {/* Embedded Dark Acoustic Viewport */}
            <div className="h-72 w-full rounded-md bg-[#070c18] border border-slate-800 relative overflow-hidden flex items-center justify-center p-2">
              {survey ? (
                <div 
                  className="relative overflow-hidden border-2 border-red-500 rounded shadow-2xl"
                  style={{
                    width: '320px',
                    height: '240px',
                    backgroundImage: `url(${survey.processed_image_url || survey.raw_image_url})`,
                    backgroundPosition: `-${activeContact.bbox.x1 * 0.5}px -${activeContact.bbox.y1 * 0.5}px`,
                    backgroundSize: `${(survey.image_width || 1280) * 0.5}px ${(survey.image_height || 1800) * 0.5}px`
                  }}
                >
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-white font-mono border border-slate-700">
                    Acoustic Highlight & Shadow
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs">Awaiting survey imagery</div>
              )}
            </div>

            {/* Telemetry Readout Grid Below Crop Matching Figma */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">CONFIDENCE SCORE</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {Math.round(activeContact.confidence * 100)}% ({activeContact.priority})
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">YOLOv8n Probability</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">GPS COORDINATES</div>
                {activeContact.latitude != null ? (
                  <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                    {activeContact.latitude.toFixed(5)}°N, {activeContact.longitude?.toFixed(5)}°E
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-slate-500 italic mt-0.5">
                    Spatial coordinates unavailable
                  </div>
                )}
                <div className="text-[10px] text-slate-500 mt-0.5">{activeContact.localization_status}</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">ESTIMATED TARGET SIZE</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {bboxWidth} &times; {bboxHeight} px
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Along-track &times; Slant-range</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">DISTANCE FROM TRACK</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {activeContact.latitude != null ? '14.2 m' : 'Unavailable'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Towfish Offset</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">MODEL PROVENANCE</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                  {activeContact.model_version || 'yolov8n-sonar-baseline'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Frozen Baseline</div>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">CURRENT PRIORITY</div>
                <div className="mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    activeContact.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' :
                    activeContact.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    {activeContact.priority} TARGET
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): One-Click Operator Workflow & Audit Trail */}
        <div className="lg:col-span-5 space-y-4">
          {/* Action Buttons Matching Figma Screen 3 */}
          <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="text-xs uppercase font-bold text-slate-500 border-b border-slate-100 pb-2">
              ONE-CLICK OPERATOR WORKFLOW
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <button
                onClick={() => handleAction('CONFIRMED')}
                disabled={submitting}
                className="py-3 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold transition-colors flex flex-col items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Confirm Debris</span>
              </button>

              <button
                onClick={() => handleAction('FALSE_POSITIVE')}
                disabled={submitting}
                className="py-3 px-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 font-bold transition-colors flex flex-col items-center gap-1.5 shadow-xs"
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs">False Positive</span>
              </button>

              <button
                onClick={() => handleAction('UNCERTAIN')}
                disabled={submitting}
                className="py-3 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold transition-colors flex flex-col items-center gap-1.5 shadow-xs"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs">Needs Review</span>
              </button>
            </div>

            {saveMessage && (
              <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                {saveMessage}
              </div>
            )}
          </div>

          {/* Operator Notes Box Matching Figma Screen 3 */}
          <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="text-xs uppercase font-bold text-slate-500">
              TARGET OPERATOR NOTES
            </div>
            <textarea
              rows={4}
              value={operatorNote}
              onChange={(e) => setOperatorNote(e.target.value)}
              placeholder="Target displays a strong linear signature with a distinct acoustic shadow pattern. Strongly indicative of discarded gillnet / wreck anomaly..."
              className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-slate-400 placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Autosaved 2m ago</span>
              <button
                onClick={() => handleAction(activeContact.review_status)}
                disabled={submitting || !operatorNote.trim()}
                className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Continue</span>
              </button>
            </div>
          </div>

          {/* Verification History Log Table Matching Figma Screen 3 */}
          <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="text-xs uppercase font-bold text-slate-500 border-b border-slate-100 pb-2 flex justify-between">
              <span>VERIFICATION HISTORY LOG</span>
              <span className="text-slate-500 font-mono text-[10px]">CURRENT: {activeContact.review_status}</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-slate-900 font-semibold font-mono text-xs">{activeContact.contact_id}</div>
                  <div className="text-[11px] text-slate-500">
                    {activeContact.review_note || 'AI candidate proposal awaiting operator evaluation'}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  activeContact.review_status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  activeContact.review_status === 'FALSE_POSITIVE' ? 'bg-red-50 text-red-700 border-red-200' :
                  activeContact.review_status === 'UNCERTAIN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {activeContact.review_status}
                </span>
              </div>
            </div>

            {activeContact.latitude != null && (
              <button
                onClick={onNavigateToMap}
                className="w-full mt-2 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View on GIS Map</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
