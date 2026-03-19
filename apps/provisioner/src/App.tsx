import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProvisionPage } from './pages/ProvisionPage';
import { SettingsPage } from './pages/SettingsPage';
import { WizardPage } from './pages/WizardPage';
import { PiSetupPage } from './pages/PiSetupPage';

function App() {
  return (
    <Routes>
      {/* Wizard has its own layout */}
      <Route path="/wizard" element={<WizardPage />} />
      
      {/* Pi Setup has its own layout */}
      <Route path="/pi-setup" element={<PiSetupPage />} />
      
      {/* Main app layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/provision" element={<ProvisionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
