import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useSettings } from '../context/SettingsContext';

const NewDuty = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const { settings } = useSettings();
  const {
    dutyTypes = [],
    vehicleTypes = [],
    localUsePackages = [],
    guestCharges = {},
    localUseCharges = {},
  } = settings;

  useEffect(() => {
    
  }, []);

  const [form, setForm] = useState({
    requestDate: '',
    guestName: '',
    guestType: '',
    roomNumber: '',
    mobileNumber: '',
    dutyType: '',
    localUsePackage: '',
    vehicleType: '',
    requestedTime: '',
    carNumber: '',
    chauffeur: '',
    remarks: '',
    pickupLocation: '',
    dropLocation: '',
    discount: '',
    discountRemark: '',
    charges: 'Chargeable',
  });

  const [guestCharge, setGuestCharge] = useState(0);
  const [finalGuestCharge, setFinalGuestCharge] = useState(0);

  useEffect(() => {
    const { dutyType, vehicleType, localUsePackage, discount, charges } = form;

    if (!dutyType || !vehicleType || !charges) {
      setGuestCharge(0);
      setFinalGuestCharge(0);
      return;
    }

    if (charges !== 'Chargeable') {
      setGuestCharge(0);
      setFinalGuestCharge(0);
      return;
    }

    let baseCharge = 0;

    if (dutyType === 'Local Use') {
      if (
        Object.keys(localUseCharges).length === 0 ||
        !localUsePackage ||
        !localUseCharges[localUsePackage] ||
        !localUseCharges[localUsePackage][vehicleType]
      ) {
        setGuestCharge(0);
        setFinalGuestCharge(0);
        return;
      }

      baseCharge = localUseCharges[localUsePackage][vehicleType].guestCharge;
    } else {
      if (
        Object.keys(guestCharges).length === 0 ||
        !guestCharges[vehicleType] ||
        !guestCharges[vehicleType][dutyType]
      ) {
        setGuestCharge(0);
        setFinalGuestCharge(0);
        return;
      }

      baseCharge = guestCharges[vehicleType][dutyType];
    }

    const discountAmount =
      discount && !isNaN(discount)
        ? (baseCharge * Number(discount)) / 100
        : 0;

    const discountedBase = baseCharge - discountAmount;
    const discountedTax = +(discountedBase * 0.12).toFixed(2);
    const totalAfterDiscount = +(discountedBase + discountedTax).toFixed(2);

    setGuestCharge(baseCharge);
    setFinalGuestCharge(totalAfterDiscount);
  }, [
    form.dutyType,
    form.vehicleType,
    form.localUsePackage,
    form.discount,
    form.charges,
    guestCharges,
    localUseCharges,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dutyType' && value !== 'Local Use') {
      setForm(prev => ({
        ...prev,
        dutyType: value,
        localUsePackage: '',
      }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.dutyType === 'Airport Pickup' && !form.remarks.trim()) {
      alert('Please update the Arrival Flight Details in Remarks');
      return;
    }

    if (form.charges === 'Chargeable' && form.discount && !form.discountRemark.trim()) {
      alert('Please provide remark for discount approval');
      return;
    }

    const pickupDateTime = new Date(`${form.requestDate}T${form.requestedTime}`);
    const packageCode = form.dutyType === 'Local Use' ? form.localUsePackage : form.dutyType;
    const guestMobile = form.guestType === 'In House'
      ? `Room ${form.roomNumber}`
      : form.mobileNumber;

    const baseCharge = guestCharge;
    const originalTax = +(baseCharge * 0.12).toFixed(2);
    const originalTotal = +(baseCharge + originalTax).toFixed(2);

    const discountAmount = form.discount && !isNaN(form.discount)
      ? (baseCharge * Number(form.discount)) / 100
      : 0;

    const discountedBase = baseCharge - discountAmount;
    const discountedTax = +(discountedBase * 0.12).toFixed(2);
    const discountedTotal = +(discountedBase + discountedTax).toFixed(2);

    const guestChargeDetails = form.charges === 'Chargeable' ? {
      base: +discountedBase.toFixed(2),
      tax: discountedTax,
      extra: 0,
      total: discountedTotal,
    } : {
      base: 0,
      tax: 0,
      extra: 0,
      total: 0,
    };

    const originalGuestChargeDetails = form.charges === 'Chargeable' ? {
      base: baseCharge,
      tax: originalTax,
      extra: 0,
      total: originalTotal,
    } : {
      base: 0,
      tax: 0,
      extra: 0,
      total: 0,
    };

    const backendChargeDetails = {
      base: 0,
      extra: 0,
      tax: 0,
      total: 0,
    };

    const payload = {
      guestName: form.guestName,
      guestMobile,
      dutyType: form.dutyType,
      pickupDateTime,
      pickupLocation: form.dutyType === 'Office Transfer' ? form.pickupLocation : undefined,
      dropLocation: form.dutyType === 'Office Transfer' ? form.dropLocation : undefined,
      vehicleType: form.vehicleType,
      packageCode,
      specialRequest: form.remarks,
      chauffeurName: form.chauffeur,
      carNumber: form.carNumber,
      guestCharge: guestChargeDetails,
      backendCharge: backendChargeDetails,
      originalCharges: {
        guest: originalGuestChargeDetails,
        backend: backendChargeDetails,
      },
      discountPercentage: form.charges === 'Chargeable' && form.discount ? Number(form.discount) : undefined,
      discountRemark: form.charges === 'Chargeable' ? form.discountRemark || undefined : undefined,
      charges: form.charges,
      createdBy: user._id,
    };

    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === '') {
        delete payload[key];
      }
    });

    try {
      console.log("Submitting payload:", payload);
      await axios.post(`${BASE_URL}/api/duties`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Duty created successfully');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to create duty');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">New Duty Entry</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2 font-semibold text-lg">Guest Information</div>

        <div>
          <label className="block text-sm font-medium mb-1">Request Date</label>
          <input type="date" name="requestDate" value={form.requestDate} onChange={handleChange} required className="border p-2 rounded w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Guest Name</label>
          <input type="text" name="guestName" value={form.guestName} onChange={handleChange} required className="border p-2 rounded w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Guest Type</label>
          <select name="guestType" value={form.guestType} onChange={handleChange} required className="border p-2 rounded w-full">
            <option value="">Select Guest Type</option>
            <option value="In House">In House</option>
            <option value="Expected Arrival">Expected Arrival</option>
            <option value="Non-Resident">Non-Resident</option>
          </select>
        </div>

        {form.guestType === 'In House' && (
          <div>
            <label className="block text-sm font-medium mb-1">Room Number</label>
            <input type="text" name="roomNumber" value={form.roomNumber} onChange={handleChange} required className="border p-2 rounded w-full" />
          </div>
        )}

        {(form.guestType === 'Expected Arrival' || form.guestType === 'Non-Resident') && (
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <input type="text" name="mobileNumber" value={form.mobileNumber} onChange={handleChange} required className="border p-2 rounded w-full" />
          </div>
        )}

        <div className="col-span-2 font-semibold text-lg mt-4">Duty Details</div>

        <div>
          <label className="block text-sm font-medium mb-1">Duty Type</label>
          <select name="dutyType" value={form.dutyType} onChange={handleChange} required className="border p-2 rounded w-full">
            <option value="">Select Duty Type</option>
            {dutyTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {form.dutyType === 'Local Use' && (
          <div>
            <label className="block text-sm font-medium mb-1">Local Use Package</label>
            <select name="localUsePackage" value={form.localUsePackage} onChange={handleChange} required className="border p-2 rounded w-full">
              <option value="">Select Local Use Package</option>
              {localUsePackages.map((pkg) => (
                <option key={pkg.label} value={pkg.label}>{pkg.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Type</label>
          <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required className="border p-2 rounded w-full">
            <option value="">Select Vehicle Type</option>
            {vehicleTypes.map((v) => (
              <option key={v.type} value={v.type}>{v.type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Requested Time</label>
          <input type="time" name="requestedTime" value={form.requestedTime} onChange={handleChange} required className="border p-2 rounded w-full" />
        </div>

        {form.dutyType === 'Office Transfer' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Pickup Location</label>
              <input type="text" name="pickupLocation" value={form.pickupLocation} onChange={handleChange} required className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Drop Location</label>
              <input type="text" name="dropLocation" value={form.dropLocation} onChange={handleChange} required className="border p-2 rounded w-full" />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Charges</label>
          <select name="charges" value={form.charges} onChange={handleChange} required className="border p-2 rounded w-full">
            <option value="Chargeable">Chargeable</option>
            <option value="Complimentary">Complimentary</option>
            <option value="Part of Package">Part of Package</option>
          </select>
        </div>

        {user.role === 'Transport' && (
          <>
            <div className="col-span-2 font-semibold text-lg mt-4">Transport Allocation</div>
            <div>
              <label className="block text-sm font-medium mb-1">Chauffeur</label>
              <input type="text" name="chauffeur" value={form.chauffeur} onChange={handleChange} className="border p-2 rounded w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Car Number</label>
              <input type="text" name="carNumber" value={form.carNumber} onChange={handleChange} className="border p-2 rounded w-full" />
            </div>
          </>
        )}

        <div className="col-span-2 font-semibold text-lg mt-4">Remarks & Discount</div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Remarks</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} className="border p-2 rounded w-full" rows={2} placeholder="Optional" />
        </div>

        {form.charges === 'Chargeable' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Discount % (Optional)</label>
              <input type="number" name="discount" value={form.discount} onChange={handleChange} className="border p-2 rounded w-full" min="0" max="100" placeholder="e.g. 10" />
            </div>

            {form.discount && (
              <div>
                <label className="block text-sm font-medium mb-1">Discount Remark</label>
                <input type="text" name="discountRemark" value={form.discountRemark} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Who approved the discount?" />
              </div>
            )}
          </>
        )}

        <div className="col-span-2 text-right font-medium">
          Final Guest Charge:{' '}
          {form.charges === 'Chargeable'
            ? `₹${finalGuestCharge.toFixed(2)}`
            : form.charges}
        </div>

        <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Submit Duty
        </button>
      </form>
    </div>
  );
};

export default NewDuty;
