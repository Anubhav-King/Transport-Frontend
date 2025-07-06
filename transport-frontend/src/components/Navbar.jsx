import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setRole(user?.role || '');
  }, []);

  const goHome = () => {
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
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 shadow-md w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Back
          </button>
          <button
            onClick={goHome}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Home
          </button>
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
