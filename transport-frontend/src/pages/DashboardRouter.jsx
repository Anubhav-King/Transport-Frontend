import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AdminDashboard from './AdminDashboard';
import ConciergeDashboard from './ConciergeDashboard';
import TransportDashboard from './TransportDashboard';
import ChauffeurDashboard from './ChauffeurDashboard';
import { useSettings } from '../context/SettingsContext';
import { useUser } from '../context/UserContext';

const DashboardRouter = () => {
  const navigate = useNavigate();
  const { settings, loading, error } = useSettings();
  const { user, setUser } = useUser();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded);

      switch (decoded.role) {
        case 'Admin':
          setDashboard(<AdminDashboard />);
          break;
        case 'Concierge':
          setDashboard(<ConciergeDashboard />);
          break;
        case 'Transport':
          setDashboard(<TransportDashboard />);
          break;
        case 'Chauffeur':
          setDashboard(<ChauffeurDashboard />);
          break;
        default:
          navigate('/login');
      }
    } catch (err) {
      console.error('Invalid token:', err);
      navigate('/login');
    }
  }, []);

  if (loading) return <div className="p-4">Loading settings...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return dashboard;
};

export default DashboardRouter;
