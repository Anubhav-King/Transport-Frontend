import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

const UpdateEntryForm = () => {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [form, setForm] = useState({
    startKm: '',
    endKm: '',
    parkingCharges: '',
    fuelCharges: '',
    expenseImage: null,
  });
  const [mode, setMode] = useState('start'); // 'start' or 'end'
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios
      .get(`${BASE_URL}/transport/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setEntry(res.data))
      .catch(() => alert('Failed to load entry'));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'expenseImage') {
      setForm((prev) => ({ ...prev, expenseImage: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStartTrip = async () => {
    try {
      const startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await axios.patch(
        `${BASE_URL}/transport/${id}/start`,
        { startKm: form.startKm, startTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Trip Started');
      setMode('end');
    } catch (err) {
      alert('Failed to start trip');
    }
  };

  const handleEndTrip = async () => {
    try {
      const endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const payload = new FormData();
      payload.append('endKm', form.endKm);
      payload.append('endTime', endTime);
      payload.append('parkingCharges', form.parkingCharges);
      payload.append('fuelCharges', form.fuelCharges);
      if (form.expenseImage) payload.append('expenseImage', form.expenseImage);

      await axios.patch(`${BASE_URL}/transport/${id}/end`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Trip Ended & Submitted');
    } catch (err) {
      alert('Failed to end trip');
    }
  };

  if (!entry) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Update Entry</h2>
      <p><strong>Guest:</strong> {entry.guestName}</p>
      <p><strong>Car Number:</strong> {entry.carNumber}</p>
      <p><strong>Duty Type:</strong> {entry.dutyType}</p>

      {mode === 'start' ? (
        <>
          <h3 className="mt-6 text-lg font-semibold">Start Trip</h3>
          <input
            name="startKm"
            type="number"
            value={form.startKm}
            onChange={handleChange}
            placeholder="Start Kms"
            className="input my-2 w-full border px-3 py-2 rounded"
          />
          <button
            onClick={handleStartTrip}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Start Trip
          </button>
        </>
      ) : (
        <>
          <h3 className="mt-6 text-lg font-semibold">End Trip & Expenses</h3>
          <input
            name="endKm"
            type="number"
            value={form.endKm}
            onChange={handleChange}
            placeholder="End Kms"
            className="input my-2 w-full border px-3 py-2 rounded"
          />
          <input
            name="parkingCharges"
            type="number"
            value={form.parkingCharges}
            onChange={handleChange}
            placeholder="Parking Charges"
            className="input my-2 w-full border px-3 py-2 rounded"
          />
          <input
            name="fuelCharges"
            type="number"
            value={form.fuelCharges}
            onChange={handleChange}
            placeholder="Fuel Charges"
            className="input my-2 w-full border px-3 py-2 rounded"
          />
          <input
            type="file"
            name="expenseImage"
            accept="image/*"
            onChange={handleChange}
            className="my-2"
          />
          <button
            onClick={handleEndTrip}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            End Trip & Submit
          </button>
        </>
      )}
    </div>
  );
};

export default UpdateEntryForm;
