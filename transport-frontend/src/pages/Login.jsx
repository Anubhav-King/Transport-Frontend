// src/pages/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { BASE_URL } from '../utils/api';

const Login = () => {
  const { setUser } = useUser();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { mobile, password });

      const user = res.data.user;
      const token = res.data.token;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      switch (user.role) {
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
    } catch (err) {
      alert('Invalid mobile or password');
    }
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
      </div>
    </div>
  );
};

export default Login;
