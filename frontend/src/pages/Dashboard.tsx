import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { SurveyUpload } from '../components/upload/SurveyUpload';
import { SonarViewer } from '../components/sonar/SonarViewer';
import { MapView } from '../components/map/MapView';
import { DetectionCard } from '../components/detection/DetectionCard';
import { ReviewQueue } from '../components/review/ReviewQueue';
import { useSurvey } from '../hooks/useSurvey';

export const Dashboard: React.FC = () => {

  const {
    survey,
    contacts,
    selectedContact,
    navTrack,
    summary,
    loading,
    analyzing,
    error,
    setSelectedContact,
    loadSurvey,
    runAnalysis,
    submitReview,
    loadDemoSurvey,
    setError
  } = useSurvey();

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const handleExportGeoJSON = () => {
    if (!survey) return;
    window.open(`/api/surveys/${survey.survey_id}/geojson`, '_blank');
  };

  const handleExportCSV = () => {
    if (!survey) return;
    window.open(`/api/surveys/${survey.survey_id}/csv`, '_blank');
  };

  return (
    <MainLayout
      survey={survey}
      summary={summary}
      contacts={contacts}
      analyzing={analyzing}
      onLoadDemo={loadDemoSurvey}
      onRunAnalysis={() => runAnalysis(0.25)}
      onExportGeoJSON={handleExportGeoJSON}
      onExportCSV={handleExportCSV}
    >
      {/* Top Banner Alert (if error) */}
      {error && (
        <div className="bg-red-950/80 border-b border-red-800 text-red-200 px-4 py-2 text-xs flex items-center justify-between font-mono z-30">
          <span>[SYSTEM ALERT] {error}</span>
          <button onClick={() => setError(null)} className="underline ml-4 text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Main Content Workspace */}
      {!survey ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4 mb-6">
            <h2 className="text-xl font-bold font-mono text-cyan-300">AWAITING SURVEY SWATH</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Load an acoustic side-scan sonar waterfall and optional navigation sensor data to initiate candidate detection, acoustic-context scoring, and geospatial triage.
            </p>
          </div>
          <SurveyUpload
            onUploadSuccess={(newSurvey) => {
              loadSurvey(newSurvey);
              setShowUploadModal(false);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Main Dual-View: Sonar Waterfall (Left) & Map View (Right) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Sonar Swath Waterfall Viewer (7 cols) */}
            <div className="lg:col-span-7 h-full flex flex-col min-h-0">
              <SonarViewer
                survey={survey}
                contacts={contacts}
                selectedContact={selectedContact}
                onSelectContact={setSelectedContact}
              />
            </div>

            {/* Map View & Selected Contact Panel (5 cols) */}
            <div className="lg:col-span-5 h-full flex flex-col min-h-0 border-l border-[#1a2f4c]">
              {/* Geospatial Map Section */}
              <div className="h-[48%] min-h-[220px] relative border-b border-[#1a2f4c]">
                <MapView
                  contacts={contacts}
                  selectedContact={selectedContact}
                  navTrack={navTrack}
                  onSelectContact={setSelectedContact}
                />
              </div>

              {/* Selected Contact Triage & Evidence Panel */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <DetectionCard
                  contact={selectedContact}
                  onSubmitReview={submitReview}
                />
              </div>
            </div>
          </div>

          {/* Bottom Contact Queue */}
          {contacts.length > 0 && (
            <ReviewQueue
              contacts={contacts}
              selectedContact={selectedContact}
              onSelectContact={setSelectedContact}
            />
          )}
        </div>
      )}
    </MainLayout>
  );
};
