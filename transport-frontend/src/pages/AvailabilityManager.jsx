import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

const AvailabilityManager = () => {
  const [cars, setCars] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [carAvailability, setCarAvailability] = useState({});
  const [chauffeurAvailability, setChauffeurAvailability] = useState({});
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/fleet/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCars(res.data.cars || []);
      setChauffeurs(res.data.chauffeurs || []);

      const carMap = {};
      res.data.cars.forEach(car => {
        carMap[car._id] = {
          available: car.available ?? true,
          reason: car.reason || '',
        };
      });

      const chauffeurMap = {};
      res.data.chauffeurs.forEach(c => {
        chauffeurMap[c._id] = {
          available: c.available ?? true,
          reason: c.reason || '',
        };
      });

      setCarAvailability(carMap);
      setChauffeurAvailability(chauffeurMap);
    } catch (err) {
      console.error('Error fetching availability:', err);
      alert('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleAvailability = (id, type) => {
    const updater = type === 'car' ? setCarAvailability : setChauffeurAvailability;
    const current = type === 'car' ? carAvailability : chauffeurAvailability;

    updater(prev => ({
      ...prev,
      [id]: {
        available: !current[id].available,
        reason: '',
      },
    }));
  };

  const updateReason = (id, type, reason) => {
    const updater = type === 'car' ? setCarAvailability : setChauffeurAvailability;
    const current = type === 'car' ? carAvailability : chauffeurAvailability;

    updater(prev => ({
      ...prev,
      [id]: {
        ...current[id],
        reason,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      const carPayload = Object.entries(carAvailability).map(([id, data]) => ({
        type: 'car',
        id,
        available: data.available,
        reason: data.reason,
      }));

      const chauffeurPayload = Object.entries(chauffeurAvailability).map(([id, data]) => ({
        type: 'chauffeur',
        id,
        available: data.available,
        reason: data.reason,
      }));

      const finalPayload = [...carPayload, ...chauffeurPayload];

      await axios.patch(`${BASE_URL}/api/fleet/availability`, finalPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Availability updated successfully');
      fetchData();
    } catch {
      alert('Failed to update availability');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Manage Availability</h2>

      {/* Chauffeur Section */}
      <h3 className="text-lg font-semibold mb-2">Chauffeurs</h3>
      <table className="w-full border text-sm mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1 text-center">Available</th>
            <th className="border px-2 py-1">Reason (if unavailable)</th>
          </tr>
        </thead>
        <tbody>
          {chauffeurs.map((c) => (
            <tr key={c._id}>
              <td className="border px-2 py-1">{c.name}</td>
              <td className="border px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={chauffeurAvailability[c._id]?.available}
                  onChange={() => toggleAvailability(c._id, 'chauffeur')}
                />
              </td>
              <td className="border px-2 py-1">
                {!chauffeurAvailability[c._id]?.available && (
                  <input
                    className="border rounded p-1 w-full"
                    value={chauffeurAvailability[c._id]?.reason}
                    onChange={(e) => updateReason(c._id, 'chauffeur', e.target.value)}
                    placeholder="Reason"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Car Section */}
      <h3 className="text-lg font-semibold mb-2">Cars</h3>
      <table className="w-full border text-sm mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Vehicle Type</th>
            <th className="border px-2 py-1">Car Number</th>
            <th className="border px-2 py-1">Fixed Chauffeur</th>
            <th className="border px-2 py-1 text-center">Available</th>
            <th className="border px-2 py-1">Reason (if unavailable)</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car._id}>
              <td className="border px-2 py-1">{car.vehicleType}</td>
              <td className="border px-2 py-1">{car.carNumber}</td>
              <td className="border px-2 py-1">{car.fixedChauffeur || '-'}</td>
              <td className="border px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={carAvailability[car._id]?.available}
                  onChange={() => toggleAvailability(car._id, 'car')}
                />
              </td>
              <td className="border px-2 py-1">
                {!carAvailability[car._id]?.available && (
                  <input
                    className="border rounded p-1 w-full"
                    value={carAvailability[car._id]?.reason}
                    onChange={(e) => updateReason(car._id, 'car', e.target.value)}
                    placeholder="Reason"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Availability
        </button>
      </div>
    </div>
  );
};

export default AvailabilityManager;
