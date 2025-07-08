import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardRouter from './pages/DashboardRouter';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import NewDuty from './pages/NewDuty';
import RegisterAdmin from './pages/RegisterAdmin';
import AdminDashboard from './pages/AdminDashboard';
import ConciergeDashboard from './pages/ConciergeDashboard';
import TransportDashboard from './pages/TransportDashboard';
import ChauffeurDashboard from './pages/ChauffeurDashboard';
import ManageCarsAndChauffeurs from './pages/ManageCarsAndChauffeurs';
import AvailabilityManager from './pages/AvailabilityManager';
import AdminLogs from './pages/AdminLogs';
import { useSettings } from './context/SettingsContext';
import { useEffect } from 'react';
import ManageSettings from './pages/ManageSettings';
import ReportPage from './pages/ReportPage';
import AdminUserLogs from './pages/AdminUserLogs';
import { jwtDecode } from 'jwt-decode';

const App = () => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbarOn = ['/login', '/register-admin'];

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          localStorage.removeItem('token');
          localStorage.removeItem('activeRole');
          navigate('/login');
        }
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('activeRole');
        navigate('/login');
      }
    }
  }, [token, navigate]);

  return (
    <>
      {!hideNavbarOn.includes(location.pathname) && token && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/new-duty" element={<NewDuty />} />
        <Route path="/dashboard" element={token ? <DashboardRouter /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/concierge" element={<ConciergeDashboard />} />
        <Route path="/transport" element={<TransportDashboard />} />
        <Route path="/chauffeur" element={<ChauffeurDashboard />} />
        <Route path="/ManageCarsAndChauffeurs" element={<ManageCarsAndChauffeurs />} />
        <Route path="/manage-availability" element={<AvailabilityManager />} />
        <Route path="/AdminLogs" element={<AdminLogs />} />
        <Route path="/manage-settings" element={<ManageSettings />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/adminactivitylogs" element={<AdminUserLogs />} />
        <Route path="/*" element={token ? <DashboardRouter /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
};

export default App;
