// TransportDashboard.jsx

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useEvent } from "../context/EventContext";
import { useAutoRefresh } from "../hooks/useAutoRefresh";


const TransportDashboard = () => {
  const [duties, setDuties] = useState([]);
  const { triggerRefresh } = useEvent();
  const [tab, setTab] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [editDutyId, setEditDutyId] = useState(null);
  const [editFields, setEditFields] = useState({ carNumber: '', chauffeurName: '' });
  const [availableCars, setAvailableCars] = useState([]);
  const [availableChauffeurs, setAvailableChauffeurs] = useState([]);
  const [viewDuty, setViewDuty] = useState(null);
  const printRef = useRef();
  const [verifyModalDuty, setVerifyModalDuty] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [adjustments, setAdjustments] = useState({
    additionalKm: 0,
    additionalHours: 0,
    discountPercent: 0,
    discountRemark: '',
    editDiscount: false,
    editKm: false,
    editHr: false,
    kmRemark: '',
    hrRemark: '',
  });
  
  const [expenseSplit, setExpenseSplit] = useState({
    parking: '',
    fuel: '',
    misc: '',
  });
  
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { settings } = useSettings();

  const fetchDuties = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/duties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDuties(response.data);
    } catch (err) {
      console.error('Error fetching duties:', err);
    }
  };
  useAutoRefresh(fetchDuties);
  const fetchAvailableResources = async () => {
    try {
      const [carRes, chauffeurRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/fleet/cars`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}/api/auth/chauffeurs`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const assignedCars = duties.filter(d => ['pending', 'active'].includes(d.status)).map(d => d.carNumber);
      const assignedChauffeurs = duties.filter(d => ['pending', 'active'].includes(d.status)).map(d => d.chauffeurName);

      const freeCars = carRes.data.filter(c => c.available && !assignedCars.includes(c.carNumber));
      const freeChauffeurs = chauffeurRes.data.filter(c => c.available && !assignedChauffeurs.includes(c.name));

      setAvailableCars(freeCars);
      setAvailableChauffeurs(freeChauffeurs);
    } catch (err) {
      console.error('Error loading resources:', err);
    }
  };

  useEffect(() => {
    fetchDuties();
    const interval = setInterval(fetchDuties, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!verifyModalDuty) return;

    // Set adjustments
    setAdjustments({
      additionalKm: verifyModalDuty.additionalKm || 0,
      additionalHours: verifyModalDuty.additionalHours || 0,
      discountPercent: verifyModalDuty.discountPercentage || 0,
      discountRemark: verifyModalDuty.discountRemark || '',
      editDiscount: false,
      editKm: false,
      editHr: false,
      kmRemark: verifyModalDuty.additionalChargesRemark?.km || '',
      hrRemark: verifyModalDuty.additionalChargesRemark?.hr || '',
    });

    const newSplit = {};

    if (verifyModalDuty.verifiedExpenses?.length > 0) {
      ['parking', 'fuel', 'misc'].forEach((type) => {
        // If verifiedExpenses exist, use them
        const found = verifyModalDuty.verifiedExpenses?.find((v) => v.label === type);
        if (found) {
          newSplit[type] = found.type || '';
        } else {
          // Leave it blank — do NOT auto-assign "guest"
          newSplit[type] = '';
        }
      });
    }

    setExpenseSplit(newSplit);
  }, [verifyModalDuty]);



  const today = new Date().toISOString().slice(0, 10);

  const filteredDuties = duties.filter((duty) => {
    const pickupDate = new Date(duty.pickupDateTime).toISOString().slice(0, 10);
    const endDate = duty.endTime ? new Date(duty.endTime).toISOString().slice(0, 10) : null;
    const isCompleted = duty.status === "completed";
    const isCancelled = duty.status === "cancelled";

    if (tab === "today") {
      // Always show non-completed & non-cancelled duties regardless of date
      if (!isCompleted && !isCancelled) return true;
      // Show completed duties only if ended today
      if (isCompleted) return endDate === today;
      // Show cancelled duties if they are from today (you can decide how to check date for cancelled)
      if (isCancelled) return pickupDate === today;
      return false;
    }

    if (tab === "previous") {
      if (isCompleted) {
        if (dateFilter) return endDate === dateFilter;
        return endDate && endDate < today;
      }
      // Also include cancelled duties for previous tab if needed
      if (isCancelled) {
        if (dateFilter) return pickupDate === dateFilter;
        return pickupDate && pickupDate < today;
      }
      return false;
    }

    return false;
  }).filter((duty) => {
    if (statusFilter === "all") return true;
    return duty.status === statusFilter.toLowerCase();
  });



  const handleSave = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/api/duties/${id}`, editFields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditDutyId(null);
      setEditFields({ carNumber: '', chauffeurName: '' });
      fetchDuties();
    } catch {
      alert('Failed to update duty');
    }
  };

  const getPackageLabel = (code) => {
    const pkg = settings?.localUsePackages?.find(p => p.label === code);
    return pkg ? pkg.label : code;
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Transport Dashboard</h1>

      <div className="flex gap-4 mb-4">
        <button onClick={() => navigate('/ManageCarsAndChauffeurs')} className="bg-blue-700 text-white px-4 py-2 rounded">
          Manage Cars & Chauffeurs
        </button>
        <button onClick={() => navigate('/manage-availability')} className="bg-indigo-700 text-white px-4 py-2 rounded">
          Mark Availability
        </button>
        <button
          onClick={() => navigate('/report')}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          View Reports
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button onClick={() => setTab('today')} className={`px-4 py-2 rounded ${tab === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            Today's Duties
          </button>
          <button onClick={() => setTab('previous')} className={`px-4 py-2 rounded ${tab === 'previous' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            Previous Duties
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2 rounded">
          <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending-verification-transport">Pending Verification (Transport)</option>
            <option value="pending-verification-concierge">Pending Verification (Concierge)</option>
        </select>
        {tab === 'previous' && (
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border p-2 rounded" />
        )}
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Trip ID</th>
            <th className="border px-2 py-1">Guest</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Pickup</th>
            <th className="border px-2 py-1">Package</th>
            <th className="border px-2 py-1">Vehicle</th>
            <th className="border px-2 py-1">Car No.</th>
            <th className="border px-2 py-1">Chauffeur</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Amount</th>
            <th className="border px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredDuties.map((duty) => (
            <tr key={duty._id} className={duty.status === 'completed' ? 'bg-green-50' : ''}>
              <td className="border px-2 py-1">{duty.tripID}</td>
              <td className="border px-2 py-1">{duty.guestName}</td>
              <td className="border px-2 py-1">{duty.dutyType}</td>
              <td className="border px-2 py-1">
                {new Date(duty.pickupDateTime).toLocaleString('en-GB', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
                })}
              </td>
              <td className="border px-2 py-1">
                {duty.dutyType === 'Local Use' && getPackageLabel(duty.packageCode)}
                {duty.dutyType === 'Office Transfer' && `${duty.pickupLocation} → ${duty.dropLocation}`}
                {!['Local Use', 'Office Transfer'].includes(duty.dutyType) && duty.dutyType}
              </td>
              <td className="border px-2 py-1">{duty.vehicleType}</td>
              <td className="border px-2 py-1">
                {editDutyId === duty._id ? (
                  <select
                    value={editFields.carNumber}
                    onChange={(e) => {
                      const car = availableCars.find(c => c.carNumber === e.target.value);
                      const fixedCh = car?.fixedChauffeur;
                      const available = availableChauffeurs.find(c => c.name === fixedCh);
                      setEditFields({
                        carNumber: e.target.value,
                        chauffeurName: available ? fixedCh : '',
                      });
                    }}
                    className="border px-1 rounded"
                  >
                    <option value="">Select</option>
                    {availableCars.map(car => (
                      <option key={car._id} value={car.carNumber}>{car.carNumber}</option>
                    ))}
                  </select>
                ) : duty.carNumber || '-'}
              </td>
              <td className="border px-2 py-1">
                {editDutyId === duty._id ? (
                  <select
                    value={editFields.chauffeurName}
                    onChange={(e) => setEditFields({ ...editFields, chauffeurName: e.target.value })}
                    className="border px-1 rounded"
                  >
                    <option value="">Select</option>
                    {availableChauffeurs.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : duty.chauffeurName || '-'}
              </td>
              <td className="border px-2 py-1 capitalize">{duty.status}</td>
              <td
                className="border px-2 py-1"
                title={
                  (duty.charges ?? "Chargeable") === "Chargeable" &&
                  duty.discountPercentage > 0 &&
                  duty.originalCharges?.guest?.total
                    ? `Original: ₹${duty.originalCharges.guest.total.toFixed(2)} | Discount: ${duty.discountPercentage}%`
                    : (duty.charges ?? "Chargeable") === "Chargeable"
                      ? "No discount applied"
                      : ""
                }
              >
                {(duty.charges ?? "Chargeable") === "Chargeable"
                  ? `₹${duty.guestCharge?.total?.toFixed(2) || "0.00"}`
                  : duty.charges || "N/A"}
              </td>
              <td className="border px-2 py-1 text-center">
                {duty.status === 'pending' ? (
                  editDutyId === duty._id ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleSave(duty._id)}
                        className="text-green-600 underline text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditDutyId(null);
                          setEditFields({ carNumber: '', chauffeurName: '' });
                        }}
                        className="text-gray-500 underline text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        setEditDutyId(duty._id);
                        setEditFields({
                          carNumber: duty.carNumber || '',
                          chauffeurName: duty.chauffeurName || '',
                        });
                        await fetchAvailableResources();
                      }}
                      className="text-blue-600 underline text-sm"
                    >
                      Edit
                    </button>
                  )
                ) : duty.status === 'pending-verification-transport' ? (
                  <button
                    onClick={() => setVerifyModalDuty(duty)}
                    className="text-indigo-600 underline text-sm"
                  >
                    Verify
                  </button>
                ) : duty.status === 'active' ? (
                    editDutyId === duty._id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleSave(duty._id)}
                          className="text-green-600 underline text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditDutyId(null);
                            setEditFields({ carNumber: '', chauffeurName: '' });
                          }}
                          className="text-gray-500 underline text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          setEditDutyId(duty._id);
                          setEditFields({
                            carNumber: duty.carNumber || '',
                            chauffeurName: duty.chauffeurName || '',
                          });
                          await fetchAvailableResources();
                        }}
                        className="text-blue-600 underline text-sm"
                      >
                        Edit
                      </button>
                    )
                  ) : duty.status === 'pending-verification-transport' ? (
                    <button
                      onClick={() => setVerifyModalDuty(duty)}
                      className="text-indigo-600 underline text-sm"
                    >
                      Verify
                    </button>
                  ) : duty.status === 'completed' ? (
                  <button
                    onClick={() => setViewDuty(duty)}
                    className="text-blue-600 underline text-sm"
                  >
                    View / Print
                  </button>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {verifyModalDuty && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white max-w-xl w-full p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Verify Duty – {verifyModalDuty.guestName}</h2>

            {/* 🔹 Charge Breakdown */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Charge Breakdown</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Type</th>
                    <th className="border px-2 py-1">Base</th>
                    <th className="border px-2 py-1">Extra</th>
                    <th className="border px-2 py-1">Tax</th>
                    <th className="border px-2 py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1 font-medium">Guest (after discount)</td>
                    <td className="border px-2 py-1">₹{verifyModalDuty.guestCharge?.base?.toFixed(2) || '0.00'}</td>
                    <td className="border px-2 py-1">₹{verifyModalDuty.guestCharge?.extra?.toFixed(2) || '0.00'}</td>
                    <td className="border px-2 py-1">₹{verifyModalDuty.guestCharge?.tax?.toFixed(2) || '0.00'}</td>
                    <td className="border px-2 py-1 font-semibold">₹{verifyModalDuty.guestCharge?.total?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1 font-medium">Backend</td>
                    <td className="border px-2 py-1">₹{verifyModalDuty.backendCharge?.base?.toFixed(2) || '0.00'}</td>
                    <td className="border px-2 py-1">₹{verifyModalDuty.backendCharge?.extra?.toFixed(2) || '0.00'}</td>
                    <td className="border px-2 py-1">₹{verifyModalDuty.backendCharge?.tax?.toFixed(2) || '0.00'}</td>
                    <td className="border px-2 py-1 font-semibold">₹{verifyModalDuty.backendCharge?.total?.toFixed(2) || '0.00'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 🔹 Adjustments */}
            <div className="space-y-4">
              {/* Extra Charges for Local Use */}
              {verifyModalDuty.dutyType === 'Local Use' && (() => {
                  const { vehicleType } = verifyModalDuty;
                  const { perHour = 0, perKm = 0 } = settings?.extraCharges?.[vehicleType] || {};
                  const extraKm = adjustments.additionalKm || 0;
                  const extraHr = adjustments.additionalHours || 0;

                  const handleSaveExtra = async (type) => {
                    if (type === 'km' && !adjustments.kmRemark?.trim()) {
                      alert("Please provide a remark for additional KM");
                      return;
                    }
                    if (type === 'hr' && !adjustments.hrRemark?.trim()) {
                      alert("Please provide a remark for additional Hours");
                      return;
                    }

                    try {
                      const res = await axios.post(
                        `${BASE_URL}/api/duties/calculate-charges/${verifyModalDuty._id}`,
                        {
                          additionalKm: type === 'km' ? adjustments.additionalKm : verifyModalDuty.additionalKm,
                          additionalHours: type === 'hr' ? adjustments.additionalHours : verifyModalDuty.additionalHours,
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                      setVerifyModalDuty(res.data);
                      setAdjustments((prev) => ({
                        ...prev,
                        editKm: type === 'km' ? false : prev.editKm,
                        editHr: type === 'hr' ? false : prev.editHr,
                      }));
                    } catch (err) {
                      alert('Failed to recalculate charges.');
                    }
                  };

                  return (
                    <>
                      {/* --- Additional Kilometers --- */}
                      {(extraKm > 0 || adjustments.editKm) && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Additional Kilometers</label>

                          {(extraKm > 0 && perKm > 0) && !adjustments.editKm && (
                            <p className="text-xs text-gray-600 mb-1">
                              {extraKm} km × ₹{perKm} = ₹{(extraKm * perKm).toFixed(2)}
                            </p>
                          )}

                          {!adjustments.editKm ? (
                            <button
                              className="text-blue-600 underline text-sm"
                              onClick={() => setAdjustments({ ...adjustments, editKm: true })}
                            >
                              Edit KM
                            </button>
                          ) : (
                            <>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="number"
                                  value={extraKm}
                                  onChange={(e) =>
                                    setAdjustments({ ...adjustments, additionalKm: parseFloat(e.target.value || 0) })
                                  }
                                  className="border rounded px-2 py-1 w-full"
                                  placeholder="Enter additional KM"
                                />
                                <button
                                  className="text-red-600 underline text-sm"
                                  onClick={() =>
                                    setAdjustments((prev) => ({
                                      ...prev,
                                      editKm: false,
                                      additionalKm: verifyModalDuty.additionalKm || 0,
                                      kmRemark: verifyModalDuty.additionalChargesRemark?.km || '',
                                    }))
                                  }
                                >
                                  Cancel
                                </button>
                                <button
                                  className="text-green-600 underline text-sm"
                                  onClick={() => handleSaveExtra('km')}
                                >
                                  Save
                                </button>
                              </div>

                              <input
                                type="text"
                                value={adjustments.kmRemark || ''}
                                onChange={(e) =>
                                  setAdjustments({ ...adjustments, kmRemark: e.target.value })
                                }
                                className="border rounded px-2 py-1 w-full mb-2"
                                placeholder="Reason for additional KM"
                                required
                              />
                            </>
                          )}
                        </div>
                      )}

                      {/* --- Additional Hours --- */}
                      {(extraHr > 0 || adjustments.editHr) && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Additional Hours</label>

                          {(extraHr > 0 && perHour > 0) && !adjustments.editHr && (
                            <p className="text-xs text-gray-600 mb-1">
                              {extraHr} hr × ₹{perHour} = ₹{(extraHr * perHour).toFixed(2)}
                            </p>
                          )}

                          {!adjustments.editHr ? (
                            <button
                              className="text-blue-600 underline text-sm"
                              onClick={() => setAdjustments({ ...adjustments, editHr: true })}
                            >
                              Edit Hour
                            </button>
                          ) : (
                            <>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="number"
                                  value={extraHr}
                                  onChange={(e) =>
                                    setAdjustments({ ...adjustments, additionalHours: parseFloat(e.target.value || 0) })
                                  }
                                  className="border rounded px-2 py-1 w-full"
                                  placeholder="Enter additional hours"
                                />
                                <button
                                  className="text-red-600 underline text-sm"
                                  onClick={() =>
                                    setAdjustments((prev) => ({
                                      ...prev,
                                      editHr: false,
                                      additionalHours: verifyModalDuty.additionalHours || 0,
                                      hrRemark: verifyModalDuty.additionalChargesRemark?.hr || '',
                                    }))
                                  }
                                >
                                  Cancel
                                </button>
                                <button
                                  className="text-green-600 underline text-sm"
                                  onClick={() => handleSaveExtra('hr')}
                                >
                                  Save
                                </button>
                              </div>

                              <input
                                type="text"
                                value={adjustments.hrRemark || ''}
                                onChange={(e) =>
                                  setAdjustments({ ...adjustments, hrRemark: e.target.value })
                                }
                                className="border rounded px-2 py-1 w-full mb-2"
                                placeholder="Reason for additional hours"
                                required
                              />
                            </>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

              {/* 🔹 Discount Section */}
              <div>
                <label className="block text-sm font-medium mb-1">Guest Discount</label>

                {adjustments.editDiscount ? (
                  <>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        value={adjustments.discountPercent}
                        onChange={(e) =>
                          setAdjustments({
                            ...adjustments,
                            discountPercent: parseFloat(e.target.value || 0),
                          })
                        }
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Discount %"
                      />
                      <button
                        className="text-red-600 underline text-sm"
                        onClick={() =>
                          setAdjustments((prev) => ({
                            ...prev,
                            editDiscount: false,
                            discountPercent: verifyModalDuty.discountPercentage || 0,
                            discountRemark: verifyModalDuty.discountRemark || '',
                          }))
                        }
                      >
                        Cancel
                      </button>
                      <button
                        className="text-green-600 underline text-sm"
                        onClick={async () => {
                          if (!adjustments.discountRemark?.trim()) {
                            alert("Please provide a remark for the discount.");
                            return;
                          }

                          try {
                            const res = await axios.post(
                              `${BASE_URL}/api/duties/calculate-charges/${verifyModalDuty._id}`,
                              {
                                additionalKm: verifyModalDuty.additionalKm || 0,
                                additionalHours: verifyModalDuty.additionalHours || 0,
                                discountPercentage: adjustments.discountPercent || 0,
                                discountRemark: adjustments.discountRemark || '',
                                applyDiscount: true,
                              },
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );

                            const updated = res.data;

                            setVerifyModalDuty((prev) => ({
                              ...prev,
                              guestCharge: updated.guestCharge,
                              backendCharge: updated.backendCharge,
                              originalCharges: updated.originalCharges,
                              discountPercentage: updated.discountPercentage,
                              discountRemark: updated.discountRemark,
                            }));

                            setAdjustments((prev) => ({
                              ...prev,
                              editDiscount: false,
                            }));
                          } catch (err) {
                            alert("Failed to apply discount");
                          }
                        }}
                      >
                        Save
                      </button>
                    </div>

                    <input
                      type="text"
                      value={adjustments.discountRemark}
                      onChange={(e) =>
                        setAdjustments({
                          ...adjustments,
                          discountRemark: e.target.value,
                        })
                      }
                      className="border rounded px-2 py-1 w-full"
                      placeholder="Discount Remark"
                    />
                  </>
                ) : (
                  <button
                    className="text-blue-600 underline text-sm mt-1"
                    onClick={() =>
                      setAdjustments({
                        ...adjustments,
                        editDiscount: true,
                      })
                    }
                  >
                    Edit Discount
                  </button>
                )}
              </div>

            {/* 🔹 Expense Split */}
            {verifyModalDuty.expenses &&
              Object.values(verifyModalDuty.expenses).some((exp) => (exp.entries?.length || 0) > 0) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Expense Split</label>

                  {['parking', 'fuel', 'misc'].map((type) => {
                    const entries = verifyModalDuty.expenses?.[type]?.entries || [];
                    const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
                    if (total <= 0) return null;

                    const isEditing = expenseSplit?.[`_editing_${type}`] || false;
                    const currentSplit = expenseSplit[type] || '';
                    const originalSplit = verifyModalDuty.verifiedExpenses?.find((v) => v.label === type)?.type || '';

                    return (
                      <div key={type} className="mb-2">
                        {!isEditing ? (
                          <div className="flex justify-between items-center">
                            <span className="capitalize font-medium text-sm">
                              {type} – ₹{total.toFixed(2)} added to{' '}
                              <span className="font-semibold">{currentSplit || originalSplit || '—'}</span>
                            </span>
                            {/* 🔹 Image preview goes here */}
                            {entries.length > 0 && (
                              <div className="flex gap-1 ml-2">
                                {entries.map((entry, idx) => (
                                  entry.image && (
                                    <img
                                      key={idx}
                                      src={`${BASE_URL}/uploads/${entry.image}`}
                                      alt={`${type} ${idx + 1}`}
                                      className="w-10 h-10 object-cover rounded border cursor-pointer hover:scale-105 transition"
                                      onClick={() => setPreviewImage(`${BASE_URL}/uploads/${entry.image}`)}
                                    />
                                  )
                                ))}
                              </div>
                            )}
                            <button
                              className="text-blue-600 text-sm underline"
                              onClick={() => {
                                setExpenseSplit({
                                  ...expenseSplit,
                                  [`_editing_${type}`]: true,
                                  [type]: currentSplit || originalSplit || '',
                                });
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1">
                              <label className="text-sm capitalize block mb-1">
                                {type} – ₹{total.toFixed(2)} to:
                              </label>
                              <select
                                value={expenseSplit[type] || ''}
                                onChange={(e) =>
                                  setExpenseSplit({ ...expenseSplit, [type]: e.target.value })
                                }
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="">Kindly select</option>
                                <option value="guest">Guest</option>
                                <option value="backend">Backend</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <button
                                className="text-green-600 text-sm underline"
                                onClick={async () => {
                                  const updatedSplit = { ...expenseSplit, [`_editing_${type}`]: false };

                                  try {
                                    // Compose updated verifiedExpenses for all types
                                    const verifiedExpenses = ['parking', 'fuel', 'misc']
                                      .map((label) => {
                                        const expTotal = (verifyModalDuty.expenses?.[label]?.entries || []).reduce(
                                          (sum, e) => sum + (e.amount || 0),
                                          0
                                        );
                                        if (expTotal <= 0) return null;

                                        return {
                                          label,
                                          type: updatedSplit[label] || originalSplit,
                                          amount: expTotal,
                                        };
                                      })
                                      .filter(Boolean);

                                    const res = await axios.post(
                                      `${BASE_URL}/api/duties/calculate-charges/${verifyModalDuty._id}`,
                                      {
                                        additionalKm: verifyModalDuty.additionalKm || 0,
                                        additionalHours: verifyModalDuty.additionalHours || 0,
                                        discountPercentage: adjustments.discountPercent || 0,
                                        applyDiscount: true,
                                        verifiedExpenses,
                                      },
                                      {
                                        headers: { Authorization: `Bearer ${token}` },
                                      }
                                    );

                                    setVerifyModalDuty(res.data);

                                    // Persist editing flags and splits
                                    const persistedSplit = { ...updatedSplit };
                                    ['parking', 'fuel', 'misc'].forEach((label) => {
                                      persistedSplit[`_editing_${label}`] = false;
                                    });
                                    setExpenseSplit(persistedSplit);
                                  } catch (err) {
                                    console.error(err);
                                    alert('Failed to update expense split.');
                                  }
                                }}
                              >
                                Save
                              </button>
                              <button
                                className="text-gray-500 text-sm underline"
                                onClick={() => {
                                  const reset = { ...expenseSplit };
                                  reset[`_editing_${type}`] = false;
                                  reset[type] = originalSplit;
                                  setExpenseSplit(reset);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            )}

            {/* Final Guest Breakdown with Expenses */}
            {verifyModalDuty.originalCharges?.guest?.total && (
              <div className="text-sm text-gray-700 mt-4 space-y-1">
                <p>
                  Original Guest Charge: ₹
                  {verifyModalDuty.originalCharges.guest.total.toFixed(2)}
                </p>

                <p>
                  Discount Applied: {verifyModalDuty.discountPercentage || 0}% → Updated Guest Charge: ₹
                  {verifyModalDuty.guestCharge?.total?.toFixed(2)}
                </p>

                {['parking', 'fuel', 'misc'].map((type) => {
                  const entries = verifyModalDuty.expenses?.[type]?.entries || [];
                  const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);

                  if (total <= 0) return null;

                  if (type === 'misc') {
                    return entries
                      .filter((e) => e.amount > 0)
                      .map((entry, index) => (
                        <p key={`${type}-${index}`} className="text-xs text-gray-500">
                          {expenseSplit[type] === 'guest' ? (
                            <>+ ₹{entry.amount.toFixed(2)} (misc: {entry.remark || 'No remark'})</>
                          ) : (
                            <>- ₹{entry.amount.toFixed(2)} (misc removed: {entry.remark || 'No remark'})</>
                          )}
                        </p>
                      ));
                  }

                  return (
                    <p key={type} className="text-xs text-gray-500">
                      {expenseSplit[type] === 'guest' ? (
                          <>+ ₹{total.toFixed(2)} ({type.charAt(0).toUpperCase() + type.slice(1)} Charges to be Added)</>
                        ) : (
                          <>* ₹{total.toFixed(2)} ({type.charAt(0).toUpperCase() + type.slice(1)} Charges will be added to backend)</>
                        )}
                      </p>
                  );
                })}
              </div>
            )}
              </div>

            {/* Submit Buttons */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setVerifyModalDuty(null)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={async () => {
                  // Validation 1: No pending edits
                  if (adjustments.editKm || adjustments.editHr || adjustments.editDiscount) {
                    alert('Please save or cancel all edit sections before submitting.');
                    return;
                  }

                  // Validation 2: Ensure discount remark is filled if discount was applied
                  if ((adjustments.discountPercent || 0) > 0 && !adjustments.discountRemark?.trim()) {
                    alert('Please provide a remark for the discount.');
                    return;
                  }

                  // Validation 3: All expense splits must be either guest or backend
                  const hasInvalidExpenseSplit = Object.entries(expenseSplit).some(
                    ([label, type]) =>
                      (verifyModalDuty.expenses?.[label]?.entries.length || 0) > 0 &&
                      (type !== 'guest' && type !== 'backend')
                  );
                  if (hasInvalidExpenseSplit) {
                    alert("Please select 'Guest' or 'Backend' for all expense types.");
                    return;
                  }

                  try {
                    const verifiedExpenses = Object.entries(expenseSplit)
                      .filter(([label]) => verifyModalDuty.expenses?.[label]?.entries.length > 0)
                      .map(([label, type]) => ({
                        label,
                        type,
                        amount: (verifyModalDuty.expenses[label]?.entries || []).reduce(
                          (sum, e) => sum + (e.amount || 0),
                          0
                        ),
                      }));

                    await axios.patch(
                      `${BASE_URL}/api/duties/verify-transport/${verifyModalDuty._id}`,
                      {
                        additionalKm: adjustments.additionalKm,
                        additionalHours: adjustments.additionalHours,
                        discountPercentage: adjustments.discountPercent,
                        discountRemark: adjustments.discountRemark,
                        verifiedExpenses,
                        additionalChargesRemark: {
                          km: adjustments.kmRemark || '',
                          hr: adjustments.hrRemark || '',
                        },
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    setVerifyModalDuty(null);
                    fetchDuties();
                    triggerRefresh();
                  } catch (err) {
                    alert('Verification failed');
                  }
                }}
              >
                Submit
              </button>
            </div>

          </div>
        </div>
      )}

      {viewDuty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-[320px] p-4 rounded shadow" ref={printRef}>
            {/* Header */}
            <div className="text-center text-xs mb-2">
              <h2 className="font-bold text-sm">Transport Duty Receipt</h2>
              <p>Hotel XYZ, New Delhi</p>
              <p>{new Date(viewDuty.createdAt).toLocaleString("en-GB")}</p>
              <hr className="my-2" />
            </div>

            {/* Duty Info */}
            <div className="text-xs">
              <p><strong>Guest:</strong> {viewDuty.guestName}</p>
              <p><strong>Duty Type:</strong> {viewDuty.dutyType}</p>
              <p><strong>Vehicle:</strong> {viewDuty.vehicleType} ({viewDuty.carNumber})</p>
              <p><strong>Pickup:</strong> {new Date(viewDuty.pickupDateTime).toLocaleString("en-GB")}</p>

              {viewDuty.dutyType === "Local Use" && (
                <p><strong>Package:</strong> {getPackageLabel(viewDuty.packageCode)}</p>
              )}
              {viewDuty.dutyType === "Office Transfer" && (
                <p><strong>Route:</strong> {viewDuty.pickupLocation} → {viewDuty.dropLocation}</p>
              )}

              <hr className="my-2" />

              {/* Guest Charges */}
              <p className="font-semibold underline mb-1">Guest Charges</p>
              {viewDuty.discountPercentage > 0 ? (
                <>
                  {viewDuty.originalCharges?.guest?.base && (
                    <p className="text-gray-500 line-through">
                      Base: ₹{viewDuty.originalCharges.guest.base.toFixed(2)}
                    </p>
                  )}
                  <p><strong>Discounted Base:</strong> ₹{viewDuty.guestCharge.base.toFixed(2)}</p>

                  {viewDuty.originalCharges?.guest?.extra > 0 && (
                    <p className="text-gray-500 line-through">
                      Extra: ₹{viewDuty.originalCharges.guest.extra.toFixed(2)}
                    </p>
                  )}
                  {viewDuty.guestCharge.extra > 0 && (
                    <p><strong>Discounted Extra:</strong> ₹{viewDuty.guestCharge.extra.toFixed(2)}</p>
                  )}
                </>
              ) : (
                <>
                  <p><strong>Base:</strong> ₹{viewDuty.guestCharge.base.toFixed(2)}</p>
                  {viewDuty.guestCharge.extra > 0 && (
                    <p><strong>Extra:</strong> ₹{viewDuty.guestCharge.extra.toFixed(2)}</p>
                  )}
                </>
              )}
              <p><strong>Tax:</strong> ₹{viewDuty.guestCharge.tax.toFixed(2)}</p>

              {viewDuty.expenses &&
                ['parking', 'fuel', 'misc'].map((type) => {
                  const entries = viewDuty.expenses[type]?.entries || [];

                  const guestEntries = entries.filter((entry) => {
                    if (entry.split === 'guest') return true;
                    return viewDuty.verifiedExpenses?.some(
                      (v) => v.label === type && v.type === 'guest' && v.amount === entry.amount
                    );
                  });

                  if (guestEntries.length === 0) return null;

                  const total = guestEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

                  return (
                    <div key={type} className="mb-1">
                      <p>
                        <strong className="capitalize">{type}:</strong> ₹{total.toFixed(2)}
                      </p>
                      {/* Image thumbnails */}
                      <div className="flex gap-1 flex-wrap mt-1">
                        {guestEntries.map((entry, idx) =>
                          entry.image ? (
                            <img
                              key={idx}
                              src={`${BASE_URL}/uploads/${entry.image}`}
                              alt={`${type} ${idx + 1}`}
                              className="w-10 h-10 object-cover rounded border"
                            />
                          ) : null
                        )}
                      </div>
                    </div>
                  );
                })}

              {viewDuty.discountPercentage > 0 && (
                <>
                  <p><strong>Discount:</strong> {viewDuty.discountPercentage}%</p>
                  {viewDuty.discountRemark && (
                    <p className="italic text-gray-600">Remark: {viewDuty.discountRemark}</p>
                  )}
                </>
              )}
              {viewDuty.charges === 'Chargeable' ? (
                <p className="font-semibold border-t mt-2 pt-1">
                  Guest Total: ₹{viewDuty.guestCharge.total.toFixed(2)}
                </p>
              ) : (
                <p className="font-semibold border-t mt-2 pt-1">
                  Guest Charges: {viewDuty.charges}
                </p>
              )}

              {/* Backend Charges */}
              <hr className="my-2" />
              <p className="font-semibold underline mb-1">Backend Charges</p>
              <p><strong>Base:</strong> ₹{viewDuty.backendCharge.base.toFixed(2)}</p>
              {viewDuty.backendCharge.extra > 0 && (
                <p><strong>Extra:</strong> ₹{viewDuty.backendCharge.extra.toFixed(2)}</p>
              )}
              <p><strong>Tax:</strong> ₹{viewDuty.backendCharge.tax.toFixed(2)}</p>

              {viewDuty.expenses &&
                ['parking', 'fuel', 'misc'].map((type) => {
                  const entries = viewDuty.expenses[type]?.entries || [];

                  const backendEntries = entries.filter((entry) => {
                    if (entry.split === 'backend') return true;
                    return viewDuty.verifiedExpenses?.some(
                      (v) => v.label === type && v.type === 'backend' && v.amount === entry.amount
                    );
                  });

                  if (backendEntries.length === 0) return null;

                  const total = backendEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

                  return (
                    <div key={type} className="mb-1">
                      <p>
                        <strong className="capitalize">{type}:</strong> ₹{total.toFixed(2)}
                      </p>
                      {/* Image thumbnails */}
                      <div className="flex gap-1 flex-wrap mt-1">
                        {backendEntries.map((entry, idx) =>
                          entry.image ? (
                            <img
                              key={idx}
                              src={`${BASE_URL}/uploads/${entry.image}`}
                              alt={`${type} ${idx + 1}`}
                              className="w-10 h-10 object-cover rounded border"
                            />
                          ) : null
                        )}
                      </div>
                    </div>
                  );
                })}

              <p className="font-semibold border-t mt-2 pt-1">
                Backend Total: ₹{viewDuty.backendCharge.total.toFixed(2)}
              </p>

              <p className="mt-3 text-center">Thank you for choosing our service!</p>
            </div>

            <hr className="my-2" />
            <div className="text-center text-xs">Powered by Concierge Team</div>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-6 flex gap-4">
            <button
              onClick={() => setViewDuty(null)}
              className="bg-gray-400 text-white px-4 py-1 rounded"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-1 rounded"
            >
              Print
            </button>
          </div>
        </div>
      )}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[999]"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90%] max-h-[90%] rounded shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default TransportDashboard;
