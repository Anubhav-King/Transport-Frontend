import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import { useSettings } from "../context/SettingsContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ReportPage = () => {
  const [summary, setSummary] = useState([]);
  const [totals, setTotals] = useState(null);
  const [range, setRange] = useState("today");
  const [dutyType, setDutyType] = useState("");
  const [carType, setCarType] = useState("");
  const [packageCode, setPackageCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");


  const [modalOpen, setModalOpen] = useState(false);
  const [viewDuty, setViewDuty] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const token = localStorage.getItem("token");
  const { dutyTypes, vehicleTypes, localUsePackages } = useSettings();

  const paginatedSummary = summary.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(summary.length / itemsPerPage);

  const getPackageLabel = (code) => {
    const pkg = localUsePackages?.find(
      (p) => p.code === code || p.label === code,
    );
    return pkg ? pkg.label : code;
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};

if (fromDate && toDate) {
  params.fromDate = fromDate;
  params.toDate = toDate;
} else {
  params.range = range;
}

      if (dutyType) params.dutyType = dutyType;
      if (carType) params.carType = carType;
      if (packageCode) params.packageCode = packageCode;

      const res = await axios.get(`${BASE_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setSummary(res.data.summary);
      setTotals(res.data.totals);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      alert("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const fetchDutyById = async (id) => {
    setModalLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/duties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewDuty(res.data);
      setModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch duty:", err);
      alert("Failed to fetch duty details");
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

useEffect(() => {
  setCurrentPage(1);
  fetchReport();
}, [range, dutyType, carType, packageCode, fromDate, toDate]);


  const handleExportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Trip Report");

    worksheet.columns = [
      { header: "Trip ID", key: "tripID", width: 15 },
      { header: "Date", key: "date", width: 20 },
      { header: "Duty Type", key: "dutyType", width: 18 },
      { header: "Vehicle Type", key: "vehicleType", width: 18 },
      { header: "Guest Charge", key: "guestCharge", width: 15 },
      { header: "Backend Charge", key: "backendCharge", width: 15 },
      { header: "Profit", key: "profit", width: 15 },
    ];

    summary.forEach((row) => {
      worksheet.addRow({
        tripID: row.tripID || "",
        date: row.date,
        dutyType: row.dutyType,
        vehicleType: row.vehicleType,
        guestCharge: row.guestCharge.toFixed(2),
        backendCharge: row.backendCharge.toFixed(2),
        profit: (row.guestCharge - row.backendCharge).toFixed(2),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const today = new Date();
    const fileName = `Trip_Report_${today.toLocaleDateString("en-GB").replace(/\//g, "-")}.xlsx`;
    saveAs(blob, fileName);
  };

  const closeModal = () => {
    setModalOpen(false);
    setViewDuty(null);
  };

  const [previewImage, setPreviewImage] = useState(null);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Trip Report</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleExportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm"
        >
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="mtd">Month to Date</option>
          <option value="ytd">Year to Date</option>
          <option value="custom">Custom Range</option>

        </select>
        {range === "custom" && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      className="border px-3 py-2 rounded"
    />
    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      className="border px-3 py-2 rounded"
    />
  </div>
)}

        <select
          value={dutyType}
          onChange={(e) => setDutyType(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Duty Types</option>
          {Array.isArray(dutyTypes) &&
            dutyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
        </select>

        <select
          value={carType}
          onChange={(e) => setCarType(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Car Types</option>
          {Array.isArray(vehicleTypes) &&
            vehicleTypes.map((v, idx) => (
              <option key={v.type || idx} value={v.type}>
                {v.label || v.type}
              </option>
            ))}
        </select>

        {dutyType === "Local Use" && (
          <select
            value={packageCode}
            onChange={(e) => setPackageCode(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Packages</option>
            {localUsePackages?.map((pkg) => (
              <option key={pkg.code} value={pkg.code}>
                {pkg.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Revenue Summary */}
      {totals && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Revenue Summary</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(totals.byDutyType).map(([type, data]) => (
              <div
                key={type}
                className="border rounded p-4 shadow-sm bg-gray-50"
              >
                <h3 className="font-bold mb-2">{type}</h3>
                <p className="text-sm">
                  Guest Revenue: ₹{data.guestTotal.toFixed(2)}
                </p>
                <p className="text-sm">
                  Backend Cost: ₹{data.backendTotal.toFixed(2)}
                </p>
                <p className="text-sm font-medium text-green-700">
                  Profit: ₹{data.profit.toFixed(2)}
                </p>
              </div>
            ))}
            <div className="border rounded p-4 shadow-md bg-blue-100">
              <h3 className="font-bold mb-2">Grand Total</h3>
              <p className="text-sm">
                Guest Revenue: ₹{totals.grandTotal.guestTotal.toFixed(2)}
              </p>
              <p className="text-sm">
                Backend Cost: ₹{totals.grandTotal.backendTotal.toFixed(2)}
              </p>
              <p className="text-sm font-bold text-blue-800">
                Profit: ₹{totals.grandTotal.profit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Trip ID</th>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Duty Type</th>
              <th className="px-3 py-2 border">Vehicle</th>
              <th className="px-3 py-2 border">Guest Charge</th>
              <th className="px-3 py-2 border">Backend Charge</th>
              <th className="px-3 py-2 border">Profit</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSummary.map((row, idx) => (
              <tr key={idx} className="even:bg-gray-50">
                <td
                  className="px-3 py-1 border text-blue-600 cursor-pointer underline"
                  onClick={() => fetchDutyById(row._id)}
                >
                  {row.tripID}
                </td>
                <td className="px-3 py-1 border">{row.date}</td>
                <td className="px-3 py-1 border">{row.dutyType}</td>
                <td className="px-3 py-1 border">{row.vehicleType}</td>
                <td className="px-3 py-1 border">
                  ₹{row.guestCharge.toFixed(2)}
                </td>
                <td className="px-3 py-1 border">
                  ₹{row.backendCharge.toFixed(2)}
                </td>
                <td className="px-3 py-1 border text-green-700">
                  ₹{(row.guestCharge - row.backendCharge).toFixed(2)}
                </td>
              </tr>
            ))}
            {summary.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-3">
                  No data found for selected range.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {summary.length > itemsPerPage && (
          <div className="flex justify-center items-center mt-4 space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="px-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white w-[320px] p-4 rounded shadow relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {modalLoading && (
              <p className="text-center text-gray-500">
                Loading trip details...
              </p>
            )}

            {viewDuty && !modalLoading && (
              <>
                {/* Header */}
                <div className="text-center text-xs mb-2">
                  <h2 className="font-bold text-sm">Transport Duty Receipt</h2>
                  <p>Hotel XYZ, New Delhi</p>
                  <p>{new Date(viewDuty.createdAt).toLocaleString("en-GB")}</p>
                  <hr className="my-2" />
                </div>

                {/* Duty Info */}
                <div className="text-xs">
                  <p>
                    <strong>Guest:</strong> {viewDuty.guestName}
                  </p>
                  <p>
                    <strong>Duty Type:</strong> {viewDuty.dutyType}
                  </p>
                  <p>
                    <strong>Vehicle:</strong> {viewDuty.vehicleType} (
                    {viewDuty.carNumber})
                  </p>
                  <p>
                    <strong>Pickup:</strong>{" "}
                    {new Date(viewDuty.pickupDateTime).toLocaleString("en-GB")}
                  </p>

                  {viewDuty.dutyType === "Local Use" && (
                    <p>
                      <strong>Package:</strong>{" "}
                      {getPackageLabel(viewDuty.packageCode)}
                    </p>
                  )}
                  {viewDuty.dutyType === "Office Transfer" && (
                    <p>
                      <strong>Route:</strong> {viewDuty.pickupLocation} →{" "}
                      {viewDuty.dropLocation}
                    </p>
                  )}

                  <hr className="my-2" />

                  {/* Guest Charges */}
                  <p className="font-semibold underline mb-1">Guest Charges</p>
                  {viewDuty.discountPercentage > 0 ? (
                    <>
                      {viewDuty.originalCharges?.guest?.base && (
                        <p className="text-gray-500 line-through">
                          Base: ₹
                          {viewDuty.originalCharges.guest.base.toFixed(2)}
                        </p>
                      )}
                      <p>
                        <strong>Discounted Base:</strong> ₹
                        {viewDuty.guestCharge.base.toFixed(2)}
                      </p>

                      {viewDuty.originalCharges?.guest?.extra > 0 && (
                        <p className="text-gray-500 line-through">
                          Extra: ₹
                          {viewDuty.originalCharges.guest.extra.toFixed(2)}
                        </p>
                      )}
                      {viewDuty.guestCharge.extra > 0 && (
                        <p>
                          <strong>Discounted Extra:</strong> ₹
                          {viewDuty.guestCharge.extra.toFixed(2)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Base:</strong> ₹
                        {viewDuty.guestCharge.base.toFixed(2)}
                      </p>
                      {viewDuty.guestCharge.extra > 0 && (
                        <p>
                          <strong>Extra:</strong> ₹
                          {viewDuty.guestCharge.extra.toFixed(2)}
                        </p>
                      )}
                    </>
                  )}
                  <p>
                    <strong>Tax:</strong> ₹{viewDuty.guestCharge.tax.toFixed(2)}
                  </p>

                  {viewDuty.expenses &&
                    ["parking", "fuel", "misc"].map((type) => {
                      const entries = viewDuty.expenses[type]?.entries || [];

                      const guestEntries = entries.filter((entry) => {
                        if (entry.split === "guest") return true;
                        return viewDuty.verifiedExpenses?.some(
                          (v) =>
                            v.label === type &&
                            v.type === "guest" &&
                            v.amount === entry.amount,
                        );
                      });

                      if (guestEntries.length === 0) return null;

                      const total = guestEntries.reduce(
                        (sum, e) => sum + (e.amount || 0),
                        0,
                      );

                      return (
                        <div key={type} className="mb-1">
                          <p>
                            <strong className="capitalize">{type}:</strong> ₹
                            {total.toFixed(2)}
                          </p>
                          {/* Image thumbnails */}
                          <div className="flex gap-1 flex-wrap mt-1">
                            {guestEntries.map((entry, idx) =>
                              entry.image ? (
                                <img
                                  key={idx}
                                  src={`${BASE_URL}/uploads/${entry.image}`}
                                  alt={`${type} ${idx + 1}`}
                                  className="w-10 h-10 object-cover rounded border cursor-pointer"
                                  onClick={() =>
                                    setPreviewImage(
                                      `${BASE_URL}/uploads/${entry.image}`,
                                    )
                                  }
                                />
                              ) : null,
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {viewDuty.discountPercentage > 0 && (
                    <>
                      <p>
                        <strong>Discount:</strong> {viewDuty.discountPercentage}
                        %
                      </p>
                      {viewDuty.discountRemark && (
                        <p className="italic text-gray-600">
                          Remark: {viewDuty.discountRemark}
                        </p>
                      )}
                    </>
                  )}
                  {viewDuty.charges === "Chargeable" ? (
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
                  <p className="font-semibold underline mb-1">
                    Backend Charges
                  </p>
                  <p>
                    <strong>Base:</strong> ₹
                    {viewDuty.backendCharge.base.toFixed(2)}
                  </p>
                  {viewDuty.backendCharge.extra > 0 && (
                    <p>
                      <strong>Extra:</strong> ₹
                      {viewDuty.backendCharge.extra.toFixed(2)}
                    </p>
                  )}
                  <p>
                    <strong>Tax:</strong> ₹
                    {viewDuty.backendCharge.tax.toFixed(2)}
                  </p>

                  {viewDuty.expenses &&
                    ["parking", "fuel", "misc"].map((type) => {
                      const entries = viewDuty.expenses[type]?.entries || [];

                      const backendEntries = entries.filter((entry) => {
                        if (entry.split === "backend") return true;
                        return viewDuty.verifiedExpenses?.some(
                          (v) =>
                            v.label === type &&
                            v.type === "backend" &&
                            v.amount === entry.amount,
                        );
                      });

                      if (backendEntries.length === 0) return null;

                      const total = backendEntries.reduce(
                        (sum, e) => sum + (e.amount || 0),
                        0,
                      );

                      return (
                        <div key={type} className="mb-1">
                          <p>
                            <strong className="capitalize">{type}:</strong> ₹
                            {total.toFixed(2)}
                          </p>
                          {/* Image thumbnails */}
                          <div className="flex gap-1 flex-wrap mt-1">
                            {backendEntries.map((entry, idx) =>
                              entry.image ? (
                                <img
                                  key={idx}
                                  src={`${BASE_URL}/uploads/${entry.image}`}
                                  alt={`${type} ${idx + 1}`}
                                  className="w-10 h-10 object-cover rounded border cursor-pointer"
                                  onClick={() =>
                                    setPreviewImage(
                                      `${BASE_URL}/uploads/${entry.image}`,
                                    )
                                  }
                                />
                              ) : null,
                            )}
                          </div>
                        </div>
                      );
                    })}

                  <p className="font-semibold border-t mt-2 pt-1">
                    Backend Total: ₹{viewDuty.backendCharge.total.toFixed(2)}
                  </p>

                  <p className="mt-3 text-center">
                    Thank you for choosing our service!
                  </p>
                </div>

                <hr className="my-2" />
                <div className="text-center text-xs">
                  Powered by Concierge Team
                </div>

                {/* Close Button */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={closeModal}
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image preview overlay */}
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

      {loading && (
        <p className="text-center mt-4 text-gray-500">Loading report...</p>
      )}
    </div>
  );
};

export default ReportPage;
