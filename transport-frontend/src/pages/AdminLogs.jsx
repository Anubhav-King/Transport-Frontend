import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

const AdminLogs = () => {
  const [logType, setLogType] = useState('availability'); // availability | setting
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const token = localStorage.getItem('token');

  const fetchLogs = async () => {
    try {
      let url = '';
      if (logType === 'availability') {
        url = `${BASE_URL}/api/fleet/logs?date=${date}`;
      } else {
        url = `${BASE_URL}/api/settings/logs`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(res.data);
    } catch (err) {
      console.error('Fetch log error:', err);
      alert('Failed to fetch logs');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logType, date]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-bold text-center mb-4">Admin Logs</h2>

      {/* Tabs */}
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={() => setLogType('availability')}
          className={`px-4 py-2 rounded ${logType === 'availability' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Availability Logs
        </button>
        <button
          onClick={() => setLogType('setting')}
          className={`px-4 py-2 rounded ${logType === 'setting' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Setting Change Logs
        </button>
      </div>

      {/* Filters */}
      {logType === 'availability' && (
        <div className="flex justify-end mb-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
      )}

      {/* Tables */}
      {logType === 'availability' ? (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Timestamp</th>
              <th className="border px-2 py-1">Car No.</th>
              <th className="border px-2 py-1">Vehicle Type</th>
              <th className="border px-2 py-1">Chauffeur</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Reason</th>
              <th className="border px-2 py-1">Updated By</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td className="border px-2 py-1">{new Date(log.updatedAt).toLocaleString()}</td>
                <td className="border px-2 py-1">{log.carNumber}</td>
                <td className="border px-2 py-1">{log.vehicleType}</td>
                <td className="border px-2 py-1">{log.chauffeurName || '-'}</td>
                <td className="border px-2 py-1">{log.available ? 'Available' : 'Unavailable'}</td>
                <td className="border px-2 py-1">{log.reason || '-'}</td>
                <td className="border px-2 py-1">{log.updatedBy}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-2">No logs found for this date.</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Timestamp</th>
              <th className="border px-2 py-1">Setting Key</th>
              <th className="border px-2 py-1">Action</th>
              <th className="border px-2 py-1">Updated By</th>
              <th className="border px-2 py-1">Changes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td className="border px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="border px-2 py-1">{log.key}</td>
                <td className="border px-2 py-1 capitalize">{log.action}</td>
                <td className="border px-2 py-1">{log.updatedBy?.name || log.updatedBy}</td>
                <td className="border px-2 py-1 whitespace-pre-wrap text-left max-w-xs">
                  {JSON.stringify(log.changes || {}, null, 2)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-2">No setting logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminLogs;
