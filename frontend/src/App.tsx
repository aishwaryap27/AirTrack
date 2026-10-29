import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { LiveAirspacePage } from './pages/LiveAirspacePage';
import { FlightsManagerPage } from './pages/FlightsManagerPage';
import { AnalyticsHubPage } from './pages/AnalyticsHubPage';
import { AirportsPage } from './pages/AirportsPage';
import { AirlinesPage } from './pages/AirlinesPage';
import { DatabaseStatusPage } from './pages/DatabaseStatusPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="airspace" element={<LiveAirspacePage />} />
          <Route path="flights" element={<FlightsManagerPage />} />
          <Route path="analytics" element={<AnalyticsHubPage />} />
          <Route path="airports" element={<AirportsPage />} />
          <Route path="airlines" element={<AirlinesPage />} />
          <Route path="database" element={<DatabaseStatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
