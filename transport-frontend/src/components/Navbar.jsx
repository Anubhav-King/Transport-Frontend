import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedRole = localStorage.getItem('activeRole');

    if (storedUser) {
      setUser(storedUser);
      const roles = Array.isArray(storedUser.role) ? storedUser.role : [storedUser.role];
      setAvailableRoles(roles);
    }

    setActiveRole(storedRole || '');
  }, []);

  const redirectToDashboard = (role) => {
    localStorage.setItem('activeRole', role);
    setActiveRole(role);

    switch (role) {
      case 'Admin':
        navigate('/admin');
        break;
      case 'Concierge':
        navigate('/concierge');
        break;
      case 'Transport':
        navigate('/transport');
        break;
      case 'Chauffeur':
        navigate('/chauffeur');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleBack = () => {
    const dashboardRoutes = ['/admin', '/concierge', '/transport', '/chauffeur', '/dashboard'];
    if (!dashboardRoutes.includes(location.pathname)) {
      navigate(-1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 shadow-md w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Buttons */}
        <div className="flex gap-4 items-center">
          <button
            onClick={handleBack}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Back
          </button>
          <button
            onClick={() => redirectToDashboard(activeRole)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Home
          </button>

          {/* Role Display + Switch */}
          {user && availableRoles.length > 1 && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => redirectToDashboard(e.target.value)}
                className="text-black px-2 py-1 rounded"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/change-password')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
