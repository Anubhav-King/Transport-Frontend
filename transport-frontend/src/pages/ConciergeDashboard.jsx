// src/pages/ConciergeDashboard.jsx
import { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useSettings } from '../context/SettingsContext';
import { useEvent } from "../context/EventContext";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const ConciergeDashboard = () => {
  const [duties, setDuties] = useState([]);
  const [tab, setTab] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const { triggerRefresh } = useEvent();
  const [dateFilter, setDateFilter] = useState("");
  const [showReason, setShowReason] = useState(null);
  const [verifyModalDuty, setVerifyModalDuty] = useState(null);
  const [viewingDuty, setViewingDuty] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [discountRemark, setDiscountRemark] = useState("");
  const [chargesFilter, setChargesFilter] = useState("all");
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
    parking: 'guest',
    fuel: 'guest',
    misc: 'guest',
  });

  const { settings } = useSettings();
  
  const localUsePackages = settings?.localUsePackages || [];

  const printRef = useRef();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const getPackageLabel = (code) => {
    const match = localUsePackages.find((pkg) => pkg.label === code);
    return match ? match.label : code;
  };

  const fetchDuties = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/duties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDuties(response.data);
    } catch (err) {
      console.error("Error fetching duties:", err);
    }
  };

  useEffect(() => {
    fetchDuties();
    const interval = setInterval(fetchDuties, 30000);
    return () => clearInterval(interval);
  }, []);

  useAutoRefresh(fetchDuties);

  const handleCancelDuty = async (id) => {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;
    try {
      await axios.patch(
        `${BASE_URL}/api/duties/${id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDuties();
    } catch {
      alert("Failed to cancel duty");
    }
  };

  const handleConciergeVerify = async (id, finalData = {}) => {
    try {
      await axios.patch(
        `${BASE_URL}/api/duties/verify-concierge/${id}`,
        finalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDuties();
    } catch {
      alert("Verification failed");
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const filteredDuties = duties
  .filter((duty) => {
    const pickupDate = new Date(duty.pickupDateTime).toISOString().slice(0, 10);
    const endDate = duty.endTime ? new Date(duty.endTime).toISOString().slice(0, 10) : null;
    const isCompleted = duty.status === "completed";
    const isCancelled = duty.status === "cancelled";

    if (tab === "today") {
      if (!isCompleted && !isCancelled) return true;
      if (isCompleted) return endDate === today;
      if (isCancelled) return pickupDate === today;
      return false;
    }

    if (tab === "previous") {
      if (isCompleted) {
        if (dateFilter) return endDate === dateFilter;
        return endDate && endDate < today;
      }
      if (isCancelled) {
        if (dateFilter) return pickupDate === dateFilter;
        return pickupDate && pickupDate < today;
      }
      return false;
    }

    return false;
  })
  .filter((duty) => {
    const statusMatch = statusFilter === "all" || duty.status === statusFilter.toLowerCase();
    const chargesMatch = chargesFilter === "all" || duty.charges === chargesFilter;
    return statusMatch && chargesMatch;
  });

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Concierge Dashboard</h1>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => navigate('/report')}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          View Reports
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button
            onClick={() => setTab("today")}
            className={`px-4 py-2 rounded ${tab === "today" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Today's Duties
          </button>
          <button
            onClick={() => setTab("previous")}
            className={`px-4 py-2 rounded ${tab === "previous" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Previous Duties
          </button>
        </div>
        <button
          onClick={() => navigate("/new-duty")}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + New Duty
        </button>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending-verification-transport">Pending Verification (Transport)</option>
          <option value="pending-verification-concierge">Pending Verification (Concierge)</option>
        </select>
        <select
          value={chargesFilter}
          onChange={(e) => setChargesFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Charges</option>
          <option value="Chargeable">Chargeable</option>
          <option value="Complimentary">Complimentary</option>
          <option value="Part of Package">Part of Package</option>
        </select>

        {tab === "previous" && (
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border p-2 rounded"
          />
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
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Amount</th>
            <th className="border px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredDuties.map((duty) => (
            <tr key={duty._id}>
              <td className="border px-2 py-1">{duty.tripID}</td>
              <td className="border px-2 py-1">{duty.guestName}</td>
              <td className="border px-2 py-1">{duty.dutyType}</td>
              <td className="border px-2 py-1">{new Date(duty.pickupDateTime).toLocaleString("en-GB")}</td>
              <td className="border px-2 py-1">
                {duty.dutyType === "Local Use" && getPackageLabel(duty.packageCode)}
                {duty.dutyType === "Office Transfer" && `${duty.pickupLocation} → ${duty.dropLocation}`}
                {!["Local Use", "Office Transfer"].includes(duty.dutyType) && duty.packageCode}
              </td>
              <td className="border px-2 py-1">{duty.vehicleType}</td>
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
                {["pending", "active"].includes(duty.status) ? (
                  <button onClick={() => handleCancelDuty(duty._id)} className="text-red-600 underline text-sm">Cancel</button>
                ) : duty.status === "cancelled" && duty.cancellationReason ? (
                  <button onClick={() => setShowReason(duty.cancellationReason)} className="text-blue-600 underline text-sm">View Reason</button>
                ) : duty.status === "pending-verification-concierge" ? (
                  <button onClick={() => {
                    setVerifyModalDuty(duty);
                    setDiscount(duty.discountPercentage || 0);
                    setDiscountRemark(duty.discountRemark || "");
                  }} className="text-green-600 underline text-sm">Verify</button>
                ) : duty.status === "completed" ? (
                  <button onClick={() => setViewingDuty(duty)} className="text-blue-600 underline text-sm">View / Print</button>
                ) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modals */}
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
                      setAdjustments((prev) => ({
                        ...prev,
                        editDiscount: true,
                        discountPercent: verifyModalDuty.discountPercentage || 0,
                        discountRemark: verifyModalDuty.discountRemark || '',
                      }))
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
                                {type} – ₹{total.toFixed(2)} added to{" "}
                                <span className="font-semibold">{currentSplit || originalSplit || '—'}</span>
                              </span>
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

                                      // Save split back
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
                    <strong>Original Guest Charge:</strong> ₹
                    {verifyModalDuty.originalCharges.guest.total.toFixed(2)}
                  </p>

                  <p>
                    <strong>Discount Applied:</strong> {verifyModalDuty.discountPercentage || 0}% → 
                    <strong> Updated Guest Charge:</strong> ₹
                    {verifyModalDuty.guestCharge?.total?.toFixed(2)}
                  </p>

                  {["parking", "fuel", "misc"].map((type) => {
                    const entries = verifyModalDuty.expenses?.[type]?.entries || [];
                    const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);

                    if (total <= 0) return null;

                    if (type === "misc") {
                      return entries
                        .filter((e) => e.amount > 0)
                        .map((entry, index) => (
                          <p key={`${type}-${index}`} className="text-xs text-gray-500">
                            {expenseSplit[type] === "guest" ? (
                              <>+ ₹{entry.amount.toFixed(2)} (misc: {entry.remark || "No remark"})</>
                            ) : (
                              <>- ₹{entry.amount.toFixed(2)} (misc removed: {entry.remark || "No remark"})</>
                            )}
                          </p>
                        ));
                    }

                    return (
                      <p key={type} className="text-xs text-gray-500">
                        {expenseSplit[type] === "guest" ? (
                          <>+ ₹{total.toFixed(2)} ({type.charAt(0).toUpperCase() + type.slice(1)} charges added)</>
                        ) : (
                          <>- ₹{total.toFixed(2)} ({type.charAt(0).toUpperCase() + type.slice(1)} charges to be removed)</>
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
                    alert("Please save or cancel all edit sections before submitting.");
                    return;
                  }

                  // Validation 2: Ensure discount remark is filled if discount was applied
                  if ((adjustments.discountPercent || 0) > 0 && !adjustments.discountRemark?.trim()) {
                    alert("Please provide a remark for the discount.");
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
                      `${BASE_URL}/api/duties/verify-concierge/${verifyModalDuty._id}`,
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
                    alert("Verification failed");
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingDuty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-[320px] p-4 rounded shadow" ref={printRef}>
            {/* Header */}
            <div className="text-center text-xs mb-2">
              <h2 className="font-bold text-sm">Transport Duty Receipt</h2>
              <p>Hotel XYZ, New Delhi</p>
              <p>{new Date(viewingDuty.createdAt).toLocaleString("en-GB")}</p>
              <hr className="my-2" />
            </div>

            {/* Duty Info */}
            <div className="text-xs">
              <p><strong>Guest:</strong> {viewingDuty.guestName}</p>
              <p><strong>Duty Type:</strong> {viewingDuty.dutyType}</p>
              <p><strong>Vehicle:</strong> {viewingDuty.vehicleType} ({viewingDuty.carNumber})</p>
              <p><strong>Request Date and Time:</strong> {new Date(viewingDuty.pickupDateTime).toLocaleString("en-GB")}</p>

              {viewingDuty.dutyType === "Local Use" && (
                <p><strong>Package:</strong> {getPackageLabel(viewingDuty.packageCode)}</p>
              )}
              {viewingDuty.dutyType === "Office Transfer" && (
                <p><strong>Route:</strong> {viewingDuty.pickupLocation} → {viewingDuty.dropLocation}</p>
              )}

              <hr className="my-2" />

              {/* Guest Charges */}
              <p className="font-semibold underline mb-1">Charges Split-up</p>

              {(viewingDuty.charges !== "Complimentary" && viewingDuty.charges !== "Part of Package") && (
                <>
                  {viewingDuty.discountPercentage > 0 ? (
                    <>
                      {viewingDuty.originalCharges?.guest?.base && (
                        <p className="text-gray-500 line-through">
                          Base: ₹{viewingDuty.originalCharges.guest.base.toFixed(2)}
                        </p>
                      )}
                      <p><strong>Discounted Base:</strong> ₹{viewingDuty.guestCharge.base.toFixed(2)}</p>

                      {viewingDuty.originalCharges?.guest?.extra > 0 && (
                        <p className="text-gray-500 line-through">
                          Extra: ₹{viewingDuty.originalCharges.guest.extra.toFixed(2)}
                        </p>
                      )}
                      {viewingDuty.guestCharge.extra > 0 && (
                        <p><strong>Discounted Extra:</strong> ₹{viewingDuty.guestCharge.extra.toFixed(2)}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p><strong>Base:</strong> ₹{viewingDuty.guestCharge.base.toFixed(2)}</p>
                      {viewingDuty.guestCharge.extra > 0 && (
                        <p><strong>Extra:</strong> ₹{viewingDuty.guestCharge.extra.toFixed(2)}</p>
                      )}
                    </>
                  )}

                  <p><strong>Tax:</strong> ₹{viewingDuty.guestCharge.tax.toFixed(2)}</p>
                </>
              )}

              {viewingDuty.expenses &&
                ['parking', 'fuel', 'misc'].map((type) => {
                  const entries = viewingDuty.expenses[type]?.entries || [];

                  const guestEntries = entries.filter((entry) => {
                    if (entry.split === 'guest') return true;
                    return viewingDuty.verifiedExpenses?.some(
                      (v) => v.label === type && v.type === 'guest' && v.amount === entry.amount
                    );
                  });

                  if (guestEntries.length === 0) return null;

                  const total = guestEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

                  return (
                    <p key={type}>
                      <strong className="capitalize">{type}:</strong> ₹{total.toFixed(2)}
                    </p>
                  );
                })}

              {viewingDuty.discountPercentage > 0 && (
                <>
                  <p><strong>Discount:</strong> {viewingDuty.discountPercentage}%</p>
                  {viewingDuty.discountRemark && (
                    <p className="italic text-gray-600">Remark: {viewingDuty.discountRemark}</p>
                  )}
                </>
              )}

              {viewingDuty.charges === 'Chargeable' ? (
                <p className="font-semibold border-t mt-2 pt-1">
                  Total: ₹{viewingDuty.guestCharge.total.toFixed(2)}
                </p>
              ) : (
                <p className="font-semibold border-t mt-2 pt-1">
                  Guest Charges: {viewingDuty.charges}
                </p>
              )}


              <p className="mt-3 text-center">Thank you for choosing our service!</p>
            </div>

            <hr className="my-2" />
            <div className="text-center text-xs">Powered by Concierge Team</div>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-6 flex gap-4">
            <button
              onClick={() => setViewingDuty(null)}
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

      {showReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-4">Cancellation Reason</h2>
            <p>{showReason}</p>
            <button
              onClick={() => setShowReason(null)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConciergeDashboard;
