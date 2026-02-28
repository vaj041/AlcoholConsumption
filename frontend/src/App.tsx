import { useEffect } from 'react';
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
import Layout from './components/Layout';
import { useSettingsStore } from './store/settingsStore';

function App() {
  const { token, loadUser } = useAuthStore();
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
