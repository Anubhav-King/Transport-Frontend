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
  const [editingUserId, setEditingUserId] = useState(null);
  const [roleBuffer, setRoleBuffer] = useState({});

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

  const startEdit = (userId, currentRoles) => {
    setEditingUserId(userId);
    setRoleBuffer({ [userId]: Array.isArray(currentRoles) ? [...currentRoles] : [currentRoles] });
  };

  const toggleRole = (userId, role) => {
    setRoleBuffer(prev => {
      const current = prev[userId] || [];
      const isRemoving = current.includes(role);
      if (role === 'Chauffeur') return prev;
      if (isRemoving && !window.confirm(`Are you sure you want to remove ${role} role?`)) {
        return prev;
      }
      const updated = isRemoving
        ? current.filter(r => r !== role)
        : [...current, role];
      return { ...prev, [userId]: updated };
    });
  };

  const saveRoles = async (userId) => {
    const roles = roleBuffer[userId] || [];

    if (roles.includes('Admin') && !roles.includes('Concierge')) {
      return alert('Admin role requires Concierge role');
    }

    const payload = { roles };

    // Ask passcode only if Admin role is being newly added
    const user = users.find((u) => u._id === userId);
    const hadAdmin = Array.isArray(user.role) && user.role.includes('Admin');
    const wantsAdmin = roles.includes('Admin');

    if (wantsAdmin && !hadAdmin) {
      const passcode = prompt('Enter passcode to assign Admin role:');
      if (passcode !== 'King@2025') return alert('Incorrect passcode');
      payload.passcode = passcode;
    }

    try {
      await axios.patch(`${BASE_URL}/api/auth/update-jobtitles/${userId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingUserId(null);
      setRoleBuffer({});
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update roles');
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={() => navigate('/manage-settings')} className="bg-green-600 text-white px-4 py-2 rounded">Manage Settings</button>
        <button onClick={() => navigate('/adminlogs')} className="bg-purple-600 text-white px-4 py-2 rounded">View Change Logs</button>
        <button onClick={() => navigate('/adminactivitylogs')} className="bg-indigo-600 text-white px-4 py-2 rounded">View User Activity Logs</button>
      </div>

      <div className="mb-8 border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Add New User</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="border px-3 py-2 rounded w-full" />
          <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} className="border px-3 py-2 rounded w-full" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border px-3 py-2 rounded w-full">
            <option value="Concierge">Concierge</option>
            <option value="Transport">Transport</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button onClick={handleAddUser} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </div>

      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Manage Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Mobile</th>
                <th className="border px-2 py-1">Roles</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="border px-2 py-1">{user.name}</td>
                  <td className="border px-2 py-1">{user.mobile}</td>
                  <td className="border px-2 py-1">
                    {editingUserId === user._id ? (
                      <div className="space-y-1">
                        {['Admin', 'Concierge', 'Transport'].map((r) => (
                          <label key={r} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={(roleBuffer[user._id] || (user.role ? (Array.isArray(user.role) ? user.role : [user.role]) : [])).includes(r)}
                              onChange={() => toggleRole(user._id, r)}
                            />
                            {r}
                          </label>
                        ))}
                        {Array.isArray(user.role) && user.role.includes('Chauffeur') && (
                          <label className="flex items-center gap-1">
                            <input type="checkbox" checked disabled />
                            Chauffeur
                          </label>
                        )}
                      </div>
                    ) : (
                      <p>{Array.isArray(user.role) ? user.role.join(', ') : user.role}</p>
                    )}
                  </td>
                  <td className="border px-2 py-1 flex gap-2 items-center">
                    {editingUserId === user._id ? (
                      <>
                        <button onClick={() => saveRoles(user._id)} className="text-green-600 text-sm">Save</button>
                        <button onClick={() => setEditingUserId(null)} className="text-gray-600 text-sm">Cancel</button>
                      </>
                    ) : (
                      <>
                        {!((Array.isArray(user.role) && user.role.includes('Chauffeur')) || user.role === 'Chauffeur') && (
                          <button onClick={() => startEdit(user._id, user.role || [])} className="text-blue-600 text-sm">Edit</button>
                        )}
                        <button onClick={() => handleDeleteUser(user._id)} className="text-red-600 text-sm">Delete</button>
                        <button onClick={() => handleResetPassword(user._id)} className="text-yellow-600 text-sm">Reset Password</button>
                      </>
                    )}
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