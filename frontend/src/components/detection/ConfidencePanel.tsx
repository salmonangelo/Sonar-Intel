import React from 'react';
import { Contact } from '../../types/detection';
import { Shield, Sparkles, Activity, MapPin } from 'lucide-react';

interface ConfidencePanelProps {
  contact: Contact;
}

export const ConfidencePanel: React.FC<ConfidencePanelProps> = ({ contact }) => {
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-[0_0_8px_rgba(56,189,248,0.4)]';
    }
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#1a2f4c] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-100">{contact.contact_id}</span>
          <span className="text-[10px] text-slate-400 font-sans">({contact.class_name})</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${getPriorityBadgeClass(contact.priority)}`}>
          {contact.priority} PRIORITY
        </span>
      </div>

      {/* Acoustic Metric Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 rounded bg-[#070e1a] border border-[#1a2f4c]">
          <div className="text-slate-400 text-[10px]">AI CONFIDENCE</div>
          <div className="text-base font-bold text-cyan-400">
            {Math.round(contact.confidence * 100)}%
          </div>
          <div className="w-full bg-[#122238] h-1 rounded mt-1 overflow-hidden">
            <div className="bg-cyan-400 h-full" style={{ width: `${contact.confidence * 100}%` }} />
          </div>
        </div>

        <div className="p-2 rounded bg-[#070e1a] border border-[#1a2f4c]">
          <div className="text-slate-400 text-[10px]">DATA QUALITY</div>
          <div className="text-base font-bold text-emerald-400">
            {Math.round(contact.data_quality * 100)}%
          </div>
          <div className="w-full bg-[#122238] h-1 rounded mt-1 overflow-hidden">
            <div className="bg-emerald-400 h-full" style={{ width: `${contact.data_quality * 100}%` }} />
          </div>
        </div>

        <div className="p-2 rounded bg-[#070e1a] border border-[#1a2f4c]">
          <div className="text-slate-400 text-[10px]">SHADOW EVIDENCE</div>
          <div className="text-base font-bold text-amber-400">
            {Math.round(contact.shadow_evidence * 100)}%
          </div>
          <div className="w-full bg-[#122238] h-1 rounded mt-1 overflow-hidden">
            <div className="bg-amber-400 h-full" style={{ width: `${contact.shadow_evidence * 100}%` }} />
          </div>
        </div>

        <div className="p-2 rounded bg-[#070e1a] border border-[#1a2f4c]">
          <div className="text-slate-400 text-[10px]">CONTEXT SCORE</div>
          <div className="text-base font-bold text-purple-400">
            {Math.round(contact.context_score * 100)}%
          </div>
          <div className="w-full bg-[#122238] h-1 rounded mt-1 overflow-hidden">
            <div className="bg-purple-400 h-full" style={{ width: `${contact.context_score * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Geolocation Readout */}
      <div className="p-2 rounded bg-[#070e1a] border border-[#1a2f4c] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>LOCATION</span>
        </div>
        <div className="text-right">
          {contact.latitude != null ? (
            <div className="text-cyan-300 font-semibold">
              {contact.latitude.toFixed(5)}°N, {contact.longitude?.toFixed(5)}°E
            </div>
          ) : (
            <span className="text-slate-500 italic">No nav metadata</span>
          )}
          <span className="text-[10px] text-slate-400">({contact.localization_status})</span>
        </div>
      </div>
    </div>
  );
};
