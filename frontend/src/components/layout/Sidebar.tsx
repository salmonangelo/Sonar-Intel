import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Waves, 
  CheckCircle2, 
  Compass, 
  Cpu, 
  FileText, 
  Play, 
  Search, 
  User, 
  Anchor 
} from 'lucide-react';
import { SurveyUploadResponse, Contact } from '../../types/detection';

export type ActiveScreen = 
  | 'dashboard' 
  | 'sonar-analysis' 
  | 'contact-verification' 
  | 'gis-mapping' 
  | 'ai-pipeline' 
  | 'reports';

interface SidebarProps {
  activeScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  survey: SurveyUploadResponse | null;
  contacts: Contact[];
  selectedContact?: Contact | null;
  analyzing: boolean;
  onRunAnalysis: () => void;
  onSelectContact?: (contact: Contact) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  survey,
  contacts,
  analyzing,
  onRunAnalysis,
  onSelectContact
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = searchQuery.trim()
    ? contacts.filter(c => {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.contact_id.toLowerCase().includes(q) ||
          c.priority.toLowerCase().includes(q) ||
          c.review_status.toLowerCase().includes(q) ||
          c.class_name.toLowerCase().includes(q)
        );
      })
    : [];

  const navItems = [
    { id: 'dashboard' as ActiveScreen, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sonar-analysis' as ActiveScreen, label: 'Sonar Analysis', icon: Waves },
    { id: 'contact-verification' as ActiveScreen, label: 'Contact Verification', icon: CheckCircle2 },
    { id: 'gis-mapping' as ActiveScreen, label: 'GIS Mapping', icon: Compass },
    { id: 'ai-pipeline' as ActiveScreen, label: 'AI Pipeline', icon: Cpu },
    { id: 'reports' as ActiveScreen, label: 'Reports', icon: FileText },
  ];

  return (
    <aside className="w-60 border-r border-[#172342] bg-[#0b1329] flex flex-col justify-between p-3 select-none text-xs font-sans">
      <div className="space-y-4">
        {/* Navigation Items Matching Figma Sidebar */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 py-1">
            APPLICATION VIEWS
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`w-full py-2 px-3 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#182649] text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Survey Provenance Card */}
        <div className="p-3 rounded-lg bg-[#111d38] border border-[#1e3059] space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-semibold uppercase">ACTIVE SWATH</span>
            <span className={`px-1.5 py-0.2 rounded font-medium ${
              survey ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
            }`}>
              {survey ? 'INGESTED' : 'AWAITING'}
            </span>
          </div>

          {survey ? (
            <div className="space-y-1 text-xs">
              <div className="truncate text-slate-100 font-medium">{survey.filename}</div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Quality Score:</span>
                <span className="text-emerald-400 font-semibold">{Math.round(survey.data_quality * 100)}%</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>AI Candidates:</span>
                <span className="text-slate-200 font-bold">{contacts.length}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-[11px] italic">No active swath loaded.</p>
          )}

          {survey && (
            <button
              onClick={onRunAnalysis}
              disabled={analyzing}
              className={`w-full mt-2 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                analyzing
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 animate-pulse cursor-wait'
                  : 'bg-white hover:bg-slate-100 text-slate-900 shadow-xs'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{analyzing ? 'PROCESSING...' : 'RUN INFERENCE'}</span>
            </button>
          )}
        </div>

        {/* Quick Contact Search */}
        {contacts.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
              <span className="flex items-center gap-1"><Search className="w-3 h-3" /> CANDIDATE SEARCH</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[10px] text-slate-400 hover:text-white underline">
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ID (C001), priority..."
              className="w-full px-2.5 py-1.5 rounded-md bg-[#111d38] border border-[#1e3059] focus:border-slate-400 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none"
            />
            {searchQuery.trim() && (
              <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
                {filteredContacts.map(c => (
                  <div
                    key={c.contact_id}
                    onClick={() => onSelectContact?.(c)}
                    className="p-1.5 rounded bg-[#142242] hover:bg-[#1a2d57] border border-[#1e3059] cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-200">{c.contact_id}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">{Math.round(c.confidence * 100)}%</span>
                    </div>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                      c.priority === 'HIGH' ? 'text-red-300 bg-red-950' : 'text-amber-300 bg-amber-950'
                    }`}>
                      {c.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Operator Session Profile Matching Figma */}
      <div className="p-2.5 rounded-lg bg-[#111d38] border border-[#1e3059] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 shrink-0 font-bold text-xs">
          CV
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-semibold text-slate-100 truncate">Dr. Clara Vance</div>
          <div className="text-[10px] text-slate-400 truncate">Senior Analyst / Operator</div>
        </div>
      </div>
    </aside>
  );
};
