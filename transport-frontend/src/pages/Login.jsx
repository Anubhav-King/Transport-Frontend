import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { BASE_URL } from '../utils/api';

const Login = () => {
  const { setUser } = useUser();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [selectRole, setSelectRole] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { mobile, password });
      const user = res.data.user;
      const token = res.data.token;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      // If user must change password
      if (user.mustChange) {
        localStorage.setItem('mustChange', 'true');
        navigate('/change-password');
        return;
      }

      const roles = Array.isArray(user.role) ? user.role : [user.role];

      if (roles.length === 1) {
        redirectToDashboard(roles[0]);
      } else {
        setAvailableRoles(roles);
        setPendingUser(user);
        setSelectRole(true);
      }
    } catch (err) {
      alert('Invalid mobile or password');
    }
  };

  const redirectToDashboard = (role) => {
    localStorage.setItem('activeRole', role); // optional for session usage
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

  const handleRoleSelect = (role) => {
    redirectToDashboard(role);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 border rounded shadow">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>
        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full border px-4 py-2 mb-4 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-4 py-2 mb-6 rounded"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>

        {/* Role selection modal */}
        {selectRole && (
          <div className="mt-6 p-4 bg-gray-100 rounded shadow">
            <h3 className="text-md font-medium mb-2">Select Role</h3>
            <div className="flex flex-col gap-2">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
