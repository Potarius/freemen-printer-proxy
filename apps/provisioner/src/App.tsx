import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { ProvisionPage } from './pages/ProvisionPage';
import { SettingsPage } from './pages/SettingsPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { WizardPage } from './pages/WizardPage';
import { PiSetupPage } from './pages/PiSetupPage';
import { UbuntuDeployPage } from './pages/UbuntuDeployPage';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Wizard has its own layout */}
        <Route path="/wizard" element={<WizardPage />} />
        
        {/* Pi Setup has its own layout */}
        <Route path="/pi-setup" element={<PiSetupPage />} />
        
        {/* Ubuntu Deploy has its own layout */}
        <Route path="/ubuntu-deploy" element={<UbuntuDeployPage />} />
        
        {/* Main app layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/provision" element={<ProvisionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/diagnostics" element={<DiagnosticsPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
