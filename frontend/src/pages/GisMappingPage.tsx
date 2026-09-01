import React, { useState } from 'react';
import { Contact, NavWaypoint, SurveyUploadResponse } from '../types/detection';
import { MapView } from '../components/map/MapView';
import { 
  Compass, 
  MapPin, 
  Filter, 
  FileDown, 
  Layers 
} from 'lucide-react';

interface GisMappingPageProps {
  survey: SurveyUploadResponse | null;
  contacts: Contact[];
  selectedContact: Contact | null;
  navTrack: NavWaypoint[];
  onSelectContact: (contact: Contact) => void;
  onNavigateToAnalysis: () => void;
  onNavigateToVerify: () => void;
  onExportGeoJSON: () => void;
}

export const GisMappingPage: React.FC<GisMappingPageProps> = ({
  survey,
  contacts,
  selectedContact,
  navTrack,
  onSelectContact,
  onNavigateToAnalysis,
  onNavigateToVerify,
  onExportGeoJSON
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'high' | 'confirmed'>('all');

  const filteredContacts = contacts.filter(c => {
    if (filterMode === 'high') return c.priority === 'HIGH';
    if (filterMode === 'confirmed') return c.review_status === 'CONFIRMED';
    return true;
  });

  const activeContact = selectedContact || filteredContacts[0] || null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans select-none">
      {/* Top Map Toolbar Matching Figma Screen 4 */}
      <div className="h-12 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-10 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-900 text-sm">GIS Mapping & Cleanup Planning</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium border border-slate-200">
            WGS 84 (EPSG:4326)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportGeoJSON}
            disabled={contacts.length === 0}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export GIS Layer (GeoJSON)</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane: MapLibre Viewer (Left 8 Cols) & GIS Metadata Sidebar (Right 4 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* MapLibre Map (8 Cols) */}
        <div className="lg:col-span-8 h-full relative border-r border-slate-200">
          <MapView
            contacts={filteredContacts}
            selectedContact={activeContact}
            navTrack={navTrack}
            onSelectContact={onSelectContact}
          />
        </div>

        {/* Right Drawer / Sidebar (4 Cols) Matching Figma Screen 4 */}
        <div className="lg:col-span-4 h-full bg-[#f8fafc] p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            {/* GIS Filters Matching Figma */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> GIS FILTERS</span>
                <span className="text-slate-700 font-mono font-bold">{filteredContacts.length} Shown</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`py-1.5 rounded-md font-medium text-center transition-colors border ${
                    filterMode === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All ({contacts.length})
                </button>
                <button
                  onClick={() => setFilterMode('high')}
                  className={`py-1.5 rounded-md font-medium text-center transition-colors border ${
                    filterMode === 'high'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  High ({contacts.filter(c => c.priority === 'HIGH').length})
                </button>
                <button
                  onClick={() => setFilterMode('confirmed')}
                  className={`py-1.5 rounded-md font-medium text-center transition-colors border ${
                    filterMode === 'confirmed'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Confirmed ({contacts.filter(c => c.review_status === 'CONFIRMED').length})
                </button>
              </div>
            </div>

            {/* Selected Contact Card Matching Figma */}
            {activeContact ? (
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold font-mono text-slate-900 text-base">{activeContact.contact_id}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    activeContact.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                    activeContact.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {activeContact.priority} PRIORITY
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Class:</span>
                    <span className="text-slate-900 font-semibold">{activeContact.class_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="text-emerald-700 font-bold font-mono">{Math.round(activeContact.confidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    {activeContact.latitude != null ? (
                      <span className="text-slate-900 font-mono font-semibold">
                        {activeContact.latitude.toFixed(5)}°N, {activeContact.longitude?.toFixed(5)}°E
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Spatial coordinates unavailable</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Review Status:</span>
                    <span className="text-slate-800 font-medium">{activeContact.review_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Survey Ref:</span>
                    <span className="text-slate-700 font-mono text-[11px] truncate max-w-[140px]">{activeContact.survey_id}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={onNavigateToAnalysis}
                    className="flex-1 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium text-center transition-colors"
                  >
                    View in Sonar Swath
                  </button>
                  <button
                    onClick={onNavigateToVerify}
                    className="flex-1 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium text-center shadow-xs transition-colors"
                  >
                    Triage Candidate
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic bg-white rounded-lg border border-slate-200">
                Select a detection on the map to inspect spatial intelligence.
              </div>
            )}

            {/* Spatial Resolution & Geodesy Specs Matching Figma */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
              <div className="text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100 pb-1">
                SPATIAL RESOLUTION & DATUM
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Datum Reference:</span>
                <span className="text-slate-900 font-medium">WGS 84 (EPSG:4326)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Positioning Method:</span>
                <span className="text-slate-900 font-medium">Towfish Navigation Log</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Localization Status:</span>
                <span className="text-emerald-700 font-semibold font-mono">ESTIMATED / UNAVAILABLE</span>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-1 leading-relaxed">
                * Coordinates are estimated via along-track dead reckoning. They are not geodetic survey benchmarks.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-200 pt-2 font-medium">
            MAPLIBRE GL • NAUTICAL BATHYMETRY • ZERO SYNTHETIC GPS FABRICATION
          </div>
        </div>
      </div>
    </div>
  );
};
