import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { Link } from 'react-router-dom';
import { SettingsContext } from '../context/SettingsContext';

const ViewRequests = () => {
  const token = localStorage.getItem('token');
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('today');
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/transport`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const today = new Date().toISOString().slice(0, 10);
        const all = res.data;

        const filtered =
          filter === 'today'
            ? all.filter((e) => e.createdOn?.includes(today))
            : all;

        setEntries(filtered.reverse());
      } catch (err) {
        console.error('Failed to fetch transport entries', err);
        alert('Unable to load entries');
      }
    };

    fetchRequests();
  }, [filter]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Transport Requests</h2>

      <div className="mb-6 flex justify-center gap-4">
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded ${
            filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-gray-600">No transport requests found.</p>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div key={entry._id} className="border p-4 rounded shadow bg-white">
              <div className="font-semibold text-lg mb-1">{entry.guestName}</div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Request Date:</strong> {entry.requestDate}</p>
                <p><strong>Car Number:</strong> {entry.carNumber || '-'}</p>
                <p><strong>Chauffeur:</strong> {entry.chauffeurName || '-'}</p>
                <p><strong>Duty Type:</strong> {entry.dutyType}</p>
                <p><strong>Vehicle Type:</strong> {entry.vehicleType}</p>
                {entry.dutyType === 'Local Use' && (
                  <p><strong>Package:</strong> {entry.packageCode}</p>
                )}
                {entry.dutyType === 'Office Transfer' && (
                  <p>
                    <strong>Route:</strong> {entry.pickupLocation} → {entry.dropLocation}
                  </p>
                )}
                <p><strong>Status:</strong> <span className="capitalize">{entry.status}</span></p>
              </div>

              <div className="mt-4">
                <Link
                  to={`/update-entry/${entry._id}`}
                  className="text-blue-600 underline text-sm"
                >
                  Update
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewRequests;
