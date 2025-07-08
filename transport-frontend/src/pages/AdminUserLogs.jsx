import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/role-change-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">User Activity Logs</h1>
      {loading ? (
        <p className="text-center text-gray-500">Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-gray-500">No logs found.</p>
      ) : (
        <div className="overflow-x-auto border rounded shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border">Timestamp</th>
                <th className="px-3 py-2 border">User</th>
                <th className="px-3 py-2 border">Role</th>
                <th className="px-3 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="even:bg-gray-50">
                  <td className="px-3 py-1 border whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </td>
                  <td className="px-3 py-1 border">{log.userId?.name || 'N/A'}</td>
                  <td className="px-3 py-1 border">{log.role}</td>
                  <td className="px-3 py-1 border">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLogsPage;
