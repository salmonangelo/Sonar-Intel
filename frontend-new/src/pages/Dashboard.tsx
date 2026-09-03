import React, { useState, useEffect } from 'react';
import { MainLayout, ActiveScreen } from '../components/layout/MainLayout';
import { useSurvey } from '../hooks/useSurvey';
import { Contact } from '../types/detection';
import { DashboardPage } from './DashboardPage';
import { SonarAnalysisPage } from './SonarAnalysisPage';
import { ContactVerificationPage } from './ContactVerificationPage';
import { GisMappingPage } from './GisMappingPage';
import { AiPipelinePage } from './AiPipelinePage';
import { ReportsPage } from './ReportsPage';
import { Upload, AlertCircle, X } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

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
    loadCuratedSample,
    setError
  } = useSurvey();

  // Ingest primary held-out benchmark true-positive (Viator-04) on first load
  useEffect(() => {
    if (!survey && !loading) {
      loadCuratedSample('viator_04');
    }
  }, []);

  const handleExportGeoJSON = () => {
    if (!survey) return;
    window.open(`/api/surveys/${survey.survey_id}/geojson`, '_blank');
  };

  const handleVerifyContact = (contact: Contact) => {
    setSelectedContact(contact);
    setActiveScreen('contact-verification');
  };

  return (
    <MainLayout
      activeScreen={activeScreen}
      onSelectScreen={setActiveScreen}
      survey={survey}
      summary={summary}
      contacts={contacts}
      analyzing={analyzing}
      onLoadDemoSample={loadCuratedSample}
      onCustomUploadClick={() => setShowUploadModal(true)}
      onRunAnalysis={() => runAnalysis(0.20)}
    >
      {/* System Error / Alert Toast */}
      {error && (
        <div className="mx-8 mt-4 p-4 rounded-2xl bg-[#ff383c]/10 border border-[#ff383c]/30 text-[#ff383c] flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-[#ff383c]" />
            <span>[System Notice] {error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="p-1 rounded-full hover:bg-[#ff383c]/20 text-[#ff383c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen 1: Dashboard Overview (Placely Timespent Theme) */}
      {activeScreen === 'dashboard' && (
        <DashboardPage
          survey={survey}
          contacts={contacts}
          onSelectScreen={setActiveScreen}
          onSelectContact={(c) => {
            setSelectedContact(c);
            setActiveScreen('sonar-analysis');
          }}
        />
      )}

      {/* Screen 2: Sonar Analysis Workspace (Placely Timespent Theme) */}
      {activeScreen === 'sonar-analysis' && (
        <SonarAnalysisPage
          survey={survey}
          contacts={contacts}
          selectedContact={selectedContact}
          analyzing={analyzing}
          onSelectContact={setSelectedContact}
          onRunAnalysis={() => runAnalysis(0.20)}
          onVerifyContact={handleVerifyContact}
        />
      )}

      {/* Screen 3: Contact Verification Workflow (Placely Timespent Theme) */}
      {activeScreen === 'contact-verification' && (
        <ContactVerificationPage
          survey={survey}
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
          onSubmitReview={submitReview}
          onNavigateToMap={() => setActiveScreen('gis-mapping')}
        />
      )}

      {/* Screen 4: GIS Spatial Mapping & Nautical Chart (Placely Timespent Theme) */}
      {activeScreen === 'gis-mapping' && (
        <GisMappingPage
          survey={survey}
          contacts={contacts}
          selectedContact={selectedContact}
          navTrack={navTrack}
          onSelectContact={setSelectedContact}
          onNavigateToAnalysis={() => setActiveScreen('sonar-analysis')}
          onNavigateToVerify={() => setActiveScreen('contact-verification')}
          onExportGeoJSON={handleExportGeoJSON}
        />
      )}

      {/* Screen 5: AI Deep Learning Pipeline Monitor (Placely Timespent Theme) */}
      {activeScreen === 'ai-pipeline' && (
        <AiPipelinePage />
      )}

      {/* Screen 6: Reports & Export Central (Placely Timespent Theme) */}
      {activeScreen === 'reports' && (
        <ReportsPage
          survey={survey}
          contacts={contacts}
        />
      )}

      {/* Upload Swath Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#e6e6e6] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <h4 className="text-base font-bold text-[#1f1f1f] font-display">
                Upload Custom Side-Scan Sonar Swath
              </h4>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-[#8e8e93] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8e8e93]">
              Upload standard SSS GeoTIFF, PNG or RAW acoustic waterfall recordings.
            </p>

            <div className="border-2 border-dashed border-[#e6e6e6] rounded-2xl p-8 text-center space-y-3 hover:border-[#ff383c]/50 transition-colors cursor-pointer bg-[#fcfcfc]">
              <Upload className="w-8 h-8 text-[#ff383c] mx-auto" />
              <div className="text-xs font-semibold text-[#1f1f1f]">Drag & drop acoustic swath file here</div>
              <div className="text-[11px] text-[#8e8e93]">Supports .png, .jpg, .tif, .xtf</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-5 py-2.5 rounded-full border border-[#e6e6e6] text-[#1f1f1f] text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
