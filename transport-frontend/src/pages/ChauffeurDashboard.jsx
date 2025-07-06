// src/pages/ChauffeurDashboard.jsx
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { useEvent } from "../context/EventContext";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const ChauffeurDashboard = () => {
  const [tab, setTab] = useState('current');
  const [duties, setDuties] = useState([]);
  const [currentDuty, setCurrentDuty] = useState(null);
  const { triggerRefresh } = useEvent();
  const [completedDuties, setCompletedDuties] = useState([]);
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [expensesEnabled, setExpensesEnabled] = useState(false);
  const [expenses, setExpenses] = useState({ parking: [], fuel: [], misc: [] });
  const [expenseTypesEnabled, setExpenseTypesEnabled] = useState({ parking: false, fuel: false, misc: false });
  const [updatedAmount, setUpdatedAmount] = useState(null);
  const token = localStorage.getItem('token');

  const { settings } = useSettings();

  const { localUsePackages = [] } = settings;
  
  const fetchDuties = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/duties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = res.data;

      const activeDuty = all.find(d => d.status === 'active' || d.status === 'in-progress');

      const today = new Date().toISOString().slice(0, 10);
      const completedToday = all.filter(d =>
        d.status === 'completed' &&
        d.endTime &&
        new Date(d.endTime).toISOString().slice(0, 10) === today
      );

      setDuties(all);
      setCurrentDuty(activeDuty || null);
      setCompletedDuties(completedToday);
    } catch (err) {
      console.error('Failed to fetch duties:', err);
    }
  };


  useEffect(() => {
    fetchDuties();
  }, []);
  useAutoRefresh(fetchDuties);

  const handleStartTrip = async () => {
    if (!startKm || isNaN(startKm)) return alert('Enter valid Start KM');
    try {
      await axios.patch(`${BASE_URL}/api/duties/${currentDuty._id}/start`, {
        startKm: Number(startKm),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Trip started');
      fetchDuties();
      triggerRefresh();
    } catch {
      alert('Start trip failed');
    }
  };

  const handleEndTrip = async () => {
    if (!endKm || isNaN(endKm)) return alert('Enter valid End KM');
    if (!currentDuty.startTime || !currentDuty.startKm) return alert('Trip not started properly');

    const formData = new FormData();
    const parsedStartKm = Number(currentDuty.startKm);
    const parsedEndKm = Number(endKm);
    const parsedStartTime = new Date(currentDuty.startTime);
    const parsedEndTime = new Date();

    formData.append('startKm', parsedStartKm);
    formData.append('endKm', parsedEndKm);
    formData.append('startTime', parsedStartTime.toISOString());
    formData.append('endTime', parsedEndTime.toISOString());

    // Calculate additional km/hours if Local Use
    if (currentDuty.dutyType === 'Local Use') {
      const pkg = localUsePackages.find(p => p.code === currentDuty.packageCode);
      if (pkg) {
        const includedKm = parseFloat(pkg.km || 0);
        const includedHr = parseFloat(pkg.hr || 0);

        const actualDistance = parsedEndKm - parsedStartKm;
        const durationMs = parsedEndTime - parsedStartTime;
        const actualDurationHr = durationMs / (1000 * 60 * 60);

        const additionalKm = Math.max(0, actualDistance - includedKm);
        const additionalHours = Math.max(0, actualDurationHr - includedHr);

        formData.append('additionalKm', additionalKm.toFixed(1));
        formData.append('additionalHours', additionalHours.toFixed(1));
        formData.append('additionalChargesRemark', JSON.stringify({ km: '', hr: '' })); // Placeholder; can update via transport
      }
    }

    // Handle expenses
    if (expensesEnabled) {
      for (const type of ['parking', 'fuel', 'misc']) {
        if (!expenseTypesEnabled[type]) continue;

        for (let idx = 0; idx < expenses[type].length; idx++) {
          const entry = expenses[type][idx];
          if (!entry.amount || !entry.image) {
            alert(`Fill all fields for ${type} expense #${idx + 1}`);
            return;
          }
          if (type === 'misc' && !entry.remark?.trim()) {
            alert(`Remark required for Misc Expense #${idx + 1}`);
            return;
          }
          formData.append(`${type}Amount_${idx}`, entry.amount);
          formData.append(`${type}Remark_${idx}`, entry.remark || '');
          formData.append(`${type}Image_${idx}`, entry.image);
        }
        formData.append(`${type}Enabled`, true);
        formData.append(`${type}Count`, expenses[type].length);
      }
    }

    try {
      const res = await axios.patch(`${BASE_URL}/api/duties/${currentDuty._id}/end-trip`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUpdatedAmount(res.data.duty.guestCharge.total);
      alert('Trip ended successfully');
      fetchDuties();
      triggerRefresh();
    } catch (err) {
      console.error(err);
      alert('End trip failed');
    }
  };

  const addExpenseEntry = (type) => {
    setExpenses(prev => ({
      ...prev,
      [type]: [...prev[type], { amount: '', image: null, remark: '' }]
    }));
  };

  const updateExpenseEntry = (type, index, field, value) => {
    setExpenses(prev => {
      const updated = [...prev[type]];
      updated[index][field] = value;
      return { ...prev, [type]: updated };
    });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getPackageLabel = () => {
    if (!currentDuty) return '';
    if (currentDuty.dutyType === 'Local Use') {
      return localUsePackages.find(p => p.code === currentDuty.packageCode)?.label || currentDuty.packageCode;
    }
    if (currentDuty.dutyType === 'Office Transfer') {
      return `${currentDuty.pickupLocation} → ${currentDuty.dropLocation}`;
    }
    return currentDuty.packageCode;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold text-center mb-4">Chauffeur Dashboard</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${tab === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('current')}
        >
          Current Trip
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('completed')}
        >
          Completed Today
        </button>
      </div>

      {tab === 'current' && currentDuty && (
        <div className="bg-white shadow-md rounded p-4 border space-y-2 mb-6">
          <p><strong>Guest:</strong> {currentDuty.guestName}</p>
          <p><strong>Duty Type:</strong> {currentDuty.dutyType}</p>
          <p><strong>Package:</strong> {getPackageLabel()}</p>
          <p><strong>Vehicle:</strong> {currentDuty.vehicleType}</p>
          <p><strong>Pickup:</strong> {formatDate(currentDuty.pickupDateTime)}</p>

          {currentDuty.status === 'active' ? (
            <div className="mt-4 border p-4 rounded bg-gray-50">
              <label className="block mb-2 font-medium">Start KM</label>
              <input
                type="number"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="border p-2 rounded w-full"
              />
              <button onClick={handleStartTrip} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
                Start Trip
              </button>
            </div>
          ) : (
            <div className="mt-4 border p-4 rounded bg-gray-50">
                <input
                  type="number"
                  value={endKm}
                  onChange={(e) => setEndKm(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  className="border p-2 rounded w-full"
                />

                {currentDuty.startKm && endKm && (
                  <div className="mt-4 bg-white p-3 border rounded">
                    <p><strong>Distance Travelled:</strong> {endKm - currentDuty.startKm} KM</p>
                    <p><strong>Trip Duration:</strong> {
                      (() => {
                        const durationMs = new Date() - new Date(currentDuty.startTime);
                        const mins = Math.floor(durationMs / 60000);
                        const hrs = Math.floor(mins / 60);
                        const remainingMins = mins % 60;
                        return `${hrs}h ${remainingMins}m`;
                      })()
                    }</p>
                  </div>
                )}

                <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={expensesEnabled}
                    onChange={() => setExpensesEnabled(!expensesEnabled)}
                  />
                  Add Extra Expenses
                </label>
              </div>

              {expensesEnabled && ['parking', 'fuel', 'misc'].map((type) => (
                <div key={type} className="mt-4 border rounded p-3">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={expenseTypesEnabled[type]}
                      onChange={() => {
                        setExpenseTypesEnabled(prev => {
                          const updated = !prev[type];
                          if (updated && expenses[type].length === 0) {
                            setExpenses(prev => ({
                              ...prev,
                              [type]: [{ amount: '', image: null, remark: '' }],
                            }));
                          }
                          return { ...prev, [type]: updated };
                        });
                      }}
                    />
                    Add {type.charAt(0).toUpperCase() + type.slice(1)} Charges
                  </label>

                  {expenseTypesEnabled[type] && expenses[type].map((entry, idx) => (
                    <div key={idx} className="mb-3 border p-3 rounded bg-gray-50 relative">
                      <button
                        className="absolute top-2 right-2 text-red-600 text-sm"
                        onClick={() =>
                          setExpenses(prev => ({
                            ...prev,
                            [type]: prev[type].filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        ✕
                      </button>
                      <input
                        type="number"
                        className="border p-2 rounded w-full mb-2"
                        placeholder="Amount (₹)"
                        value={entry.amount}
                        onChange={(e) => updateExpenseEntry(type, idx, 'amount', e.target.value)}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="border p-2 rounded w-full mb-2"
                        onChange={(e) => updateExpenseEntry(type, idx, 'image', e.target.files[0])}
                      />
                      <input
                        type="text"
                        className="border p-2 rounded w-full"
                        placeholder="Optional remark"
                        value={entry.remark}
                        onChange={(e) => updateExpenseEntry(type, idx, 'remark', e.target.value)}
                      />
                    </div>
                  ))}

                  {expenseTypesEnabled[type] && (
                    <button
                      onClick={() => addExpenseEntry(type)}
                      className="bg-gray-200 px-3 py-1 rounded text-sm"
                    >
                      Add another {type} charge
                    </button>
                  )}
                </div>
              ))}

              <button onClick={handleEndTrip} className="mt-6 bg-green-600 text-white px-4 py-2 rounded">
                End Trip
              </button>
            </div>
          )}

          {updatedAmount && (
            <div className="mt-6 text-center bg-green-100 border border-green-300 p-4 rounded">
              <p className="font-semibold">Updated Guest Charge: ₹{updatedAmount.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'current' && !currentDuty && (
        <div className="text-center text-gray-600">No duties assigned currently.</div>
      )}

      {tab === 'completed' && (
        completedDuties.length > 0 ? (
          <div className="bg-white shadow-md rounded p-4 border">
            <ul className="space-y-3">
              {completedDuties.map((d) => (
                <li key={d._id} className="border-b pb-2">
                  <p><strong>Guest:</strong> {d.guestName}</p>
                  <p><strong>Duty Type:</strong> {d.dutyType}</p>
                  <p><strong>Start Time:</strong> {formatDate(d.startTime)}</p>
                  <p><strong>End Time:</strong> {formatDate(d.endTime)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center text-gray-600">No completed trips today.</div>
        )
      )}
    </div>
  );
};

export default ChauffeurDashboard;
