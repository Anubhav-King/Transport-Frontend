import { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('Concierge');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleAddUser = async () => {
    if (!name.trim() || !mobile.trim()) return;
    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/api/auth/register`, {
        name,
        mobile,
        role,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setName('');
      setMobile('');
      setRole('Concierge');
      fetchUsers();
    } catch (err) {
      alert('Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure to delete this user?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/auth/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.patch(`${BASE_URL}/api/auth/update-jobtitles/${userId}`, {
        role: newRole,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Password reset to default: Monday01');
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => navigate('/manage-settings')}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Manage Settings
        </button>

        <button
          onClick={() => navigate('/adminlogs')}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          View Change Logs
        </button>
      </div>

      {/* Add User Section */}
      <div className="mb-8 border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Add New User</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="Concierge">Concierge</option>
            <option value="Transport">Transport</option>
            <option value="Chauffeur">Chauffeur</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button
          onClick={handleAddUser}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </div>

      {/* Users Table */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Manage Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Mobile</th>
                <th className="border px-2 py-1">Role</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="border px-2 py-1">{user.name}</td>
                  <td className="border px-2 py-1">{user.mobile}</td>
                  <td className="border px-2 py-1">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user._id, e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Concierge">Concierge</option>
                      <option value="Transport">Transport</option>
                      <option value="Chauffeur">Chauffeur</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1 flex gap-2">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 text-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleResetPassword(user._id)}
                      className="text-yellow-600 text-sm"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-2">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
