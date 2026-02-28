import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Drinks from './pages/Drinks';
import Calendar from './pages/Calendar';
import History from './pages/History';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Translations from './pages/Translations';
import Layout from './components/Layout';
import { useSettingsStore } from './store/settingsStore';
import { i18n } from './i18n/i18nService';
import { translationsService } from './services/translationsService';

function App() {
  const { token, loadUser } = useAuthStore();
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const [, setI18nVersion] = useState(0);

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  useEffect(() => {
    let isActive = true;

    const loadRemoteTranslations = async () => {
      try {
        const dictionary = await translationsService.getTranslations(language);
        if (!isActive) {
          return;
        }

        i18n.setRemoteDictionary(language, dictionary);
      } catch {
        if (!isActive) {
          return;
        }

        i18n.clearRemoteDictionary(language);
      } finally {
        if (isActive) {
          setI18nVersion((value) => value + 1);
        }
      }
    };

    loadRemoteTranslations();

    return () => {
      isActive = false;
    };
  }, [language]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
        
        <Route element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drinks" element={<Drinks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/translations" element={<Translations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
