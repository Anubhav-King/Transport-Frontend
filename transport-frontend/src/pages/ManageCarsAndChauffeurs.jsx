// src/pages/ManageCarsAndChauffeurs.jsx

import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useSettings } from '../context/SettingsContext';

const ManageCarsAndChauffeurs = () => {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [cars, setCars] = useState([]);

  const [chauffeurName, setChauffeurName] = useState('');
  const [chauffeurMobile, setChauffeurMobile] = useState('');

  const [vehicleType, setVehicleType] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [fixedChauffeur, setFixedChauffeur] = useState('');

  const { settings, fetchSettings } = useSettings();
  const token = localStorage.getItem('token');

  const fetchChauffeurs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chauffeursOnly = res.data.filter(user => user.role === 'Chauffeur' || (Array.isArray(user.role) && user.role.includes('Chauffeur'));
      setChauffeurs(chauffeursOnly);
    } catch (err) {
      console.error('Error fetching chauffeurs:', err);
    }
  };

  const fetchCars = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/fleet/cars`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCars(res.data);
    } catch (err) {
      console.error('Error fetching cars:', err);
    }
  };

  const handleAddChauffeur = async () => {
    if (!chauffeurName.trim() || !chauffeurMobile.trim()) return alert('Name and mobile required');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        name: chauffeurName,
        mobile: chauffeurMobile,
        role: 'Chauffeur',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChauffeurName('');
      setChauffeurMobile('');
      fetchChauffeurs();
    } catch {
      alert('Failed to add chauffeur');
    }
  };

  const handleDeleteChauffeur = async (id) => {
    if (!window.confirm('Delete this chauffeur?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/auth/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchChauffeurs();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleAddCar = async () => {
    if (!carNumber.trim()) return alert('Car number required');
    try {
      await axios.post(`${BASE_URL}/api/fleet/cars`, {
        carNumber,
        vehicleType,
        fixedChauffeur: fixedChauffeur || null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCarNumber('');
      setFixedChauffeur('');
      fetchCars();
    } catch {
      alert('Failed to add car');
    }
  };

  const handleDeleteCar = async (carNumber) => {
    if (!window.confirm('Delete this car?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/fleet/cars/${carNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCars();
    } catch {
      alert('Failed to delete');
    }
  };

  useEffect(() => {
    fetchChauffeurs();
    fetchCars();
  }, []);

  useEffect(() => {
    if (settings?.vehicleTypes?.length > 0) {
      setVehicleType(settings.vehicleTypes[0].type);
    }
  }, [settings]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      <h1 className="text-2xl font-bold text-center mb-4">Manage Chauffeurs and Cars</h1>

      {/* Chauffeurs Section */}
      <section className="border rounded p-4 shadow">
        <h2 className="text-lg font-semibold mb-4">Chauffeurs</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            placeholder="Full Name"
            value={chauffeurName}
            onChange={(e) => setChauffeurName(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            placeholder="Mobile Number"
            value={chauffeurMobile}
            onChange={(e) => setChauffeurMobile(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={handleAddChauffeur}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Chauffeur
          </button>
        </div>

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Mobile</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chauffeurs.map(c => (
              <tr key={c._id}>
                <td className="border px-2 py-1">{c.name}</td>
                <td className="border px-2 py-1">{c.mobile}</td>
                <td className="border px-2 py-1">
                  <button onClick={() => handleDeleteChauffeur(c._id)} className="text-red-600 text-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {chauffeurs.length === 0 && (
              <tr><td colSpan="3" className="text-center py-2">No chauffeurs</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Cars Section */}
      <section className="border rounded p-4 shadow">
        <h2 className="text-lg font-semibold mb-4">Cars</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="border p-2 rounded w-full"
          >
            {(settings?.vehicleTypes || []).map(v => (
              <option key={v.type} value={v.type}>{v.type}</option>
            ))}
          </select>
          <input
            placeholder="Car Number"
            value={carNumber}
            onChange={(e) => setCarNumber(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <select
            value={fixedChauffeur}
            onChange={(e) => setFixedChauffeur(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">No Fixed Chauffeur</option>
            {chauffeurs.map(ch => (
              <option key={ch._id} value={ch.name}>{ch.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddCar}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Car
          </button>
        </div>

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Vehicle</th>
              <th className="border px-2 py-1">Car Number</th>
              <th className="border px-2 py-1">Fixed Chauffeur</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {cars.map(car => (
              <tr key={car._id}>
                <td className="border px-2 py-1">{car.vehicleType}</td>
                <td className="border px-2 py-1">{car.carNumber}</td>
                <td className="border px-2 py-1">{car.fixedChauffeur || '-'}</td>
                <td className="border px-2 py-1">
                  <button onClick={() => handleDeleteCar(car.carNumber)} className="text-red-600 text-sm">Delete</button>
                </td>
              </tr>
            ))}
            {cars.length === 0 && (
              <tr><td colSpan="4" className="text-center py-2">No cars added</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ManageCarsAndChauffeurs;
