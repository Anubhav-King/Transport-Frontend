// src/pages/ChangePassword.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../utils/api';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirm) {
      return setMessage("New passwords don't match");
    }

    try {
      await axios.patch(
        `${BASE_URL}/api/users/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Clear mustChange flag
      localStorage.removeItem('mustChange');

      alert('Password changed successfully.');

      // ✅ Redirect to correct dashboard
      const user = JSON.parse(localStorage.getItem('user'));
      const activeRole = localStorage.getItem('activeRole');

      if (activeRole) {
        switch (activeRole) {
          case 'Admin':
            return navigate('/admin');
          case 'Concierge':
            return navigate('/concierge');
          case 'Transport':
            return navigate('/transport');
          case 'Chauffeur':
            return navigate('/chauffeur');
          default:
            return navigate('/');
        }
      } else {
        // If no role selected yet
        const roles = Array.isArray(user.role) ? user.role : [user.role];
        if (roles.length === 1) {
          localStorage.setItem('activeRole', roles[0]);
          return navigate(`/${roles[0].toLowerCase()}`);
        } else {
          // Fallback: redirect to role selector or home
          return navigate('/');
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Change Password</h2>
      {message && <div className="text-red-600 mb-2">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Current Password"
          className="w-full border p-2 rounded"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          className="w-full border p-2 rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full border p-2 rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
