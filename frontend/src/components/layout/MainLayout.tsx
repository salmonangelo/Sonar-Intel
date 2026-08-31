import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SurveyUploadResponse, SurveySummary, Contact } from '../../types/detection';

interface MainLayoutProps {
  survey: SurveyUploadResponse | null;
  summary: SurveySummary | null;
  contacts: Contact[];
  analyzing: boolean;
  onLoadDemo: () => void;
  onRunAnalysis: () => void;
  onExportGeoJSON: () => void;
  onExportCSV: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  survey,
  summary,
  contacts,
  analyzing,
  onLoadDemo,
  onRunAnalysis,
  onExportGeoJSON,
  onExportCSV,
  children
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#050b14] text-slate-100 overflow-hidden">
      <Header surveyId={survey?.survey_id} onLoadDemo={onLoadDemo} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          survey={survey}
          summary={summary}
          contacts={contacts}
          analyzing={analyzing}
          onRunAnalysis={onRunAnalysis}
          onExportGeoJSON={onExportGeoJSON}
          onExportCSV={onExportCSV}
        />
        <main className="flex-1 flex flex-col overflow-hidden bg-[#08101d] sonar-grid relative">
          {children}
        </main>
      </div>
    </div>
  );
};
