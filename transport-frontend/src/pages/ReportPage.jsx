import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ReportPage = () => {
  const [summary, setSummary] = useState([]);
  const [totals, setTotals] = useState(null);
  const [range, setRange] = useState('today');
  const [dutyType, setDutyType] = useState('');
  const [carType, setCarType] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedSummary = summary.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(summary.length / itemsPerPage);

  const token = localStorage.getItem('token');
  const { dutyTypes, vehicleTypes } = useSettings();

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { range };
      if (dutyType) params.dutyType = dutyType;
      if (carType) params.carType = carType;

      const res = await axios.get(`${BASE_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setSummary(res.data.summary);
      setTotals(res.data.totals);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      alert('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchReport();
  }, [range, dutyType, carType]);

  const handleExportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trip Report');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Duty Type', key: 'dutyType', width: 18 },
      { header: 'Vehicle Type', key: 'vehicleType', width: 18 },
      { header: 'Guest Charge', key: 'guestCharge', width: 15 },
      { header: 'Backend Charge', key: 'backendCharge', width: 15 },
    ];

    summary.forEach((row) => {
      worksheet.addRow({
        date: row.date,
        dutyType: row.dutyType,
        vehicleType: row.vehicleType,
        guestCharge: row.guestCharge.toFixed(2),
        backendCharge: row.backendCharge.toFixed(2),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `Trip_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };


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
        </select>

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
      </div>

      {/* Revenue Bifurcation */}
      {totals && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Revenue Summary</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(totals.byDutyType).map(([type, data]) => (
              <div key={type} className="border rounded p-4 shadow-sm bg-gray-50">
                <h3 className="font-bold mb-2">{type}</h3>
                <p className="text-sm">Guest Revenue: ₹{data.guestTotal.toFixed(2)}</p>
                <p className="text-sm">Backend Cost: ₹{data.backendTotal.toFixed(2)}</p>
                <p className="text-sm font-medium text-green-700">
                  Profit: ₹{data.profit.toFixed(2)}
                </p>
              </div>
            ))}

            <div className="border rounded p-4 shadow-md bg-blue-100">
              <h3 className="font-bold mb-2">Grand Total</h3>
              <p className="text-sm">Guest Revenue: ₹{totals.grandTotal.guestTotal.toFixed(2)}</p>
              <p className="text-sm">Backend Cost: ₹{totals.grandTotal.backendTotal.toFixed(2)}</p>
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
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Duty Type</th>
              <th className="px-3 py-2 border">Vehicle</th>
              <th className="px-3 py-2 border">Guest Charge</th>
              <th className="px-3 py-2 border">Backend Charge</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSummary.map((row, idx) => (
              <tr key={idx} className="even:bg-gray-50">
                <td className="px-3 py-1 border">{row.date}</td>
                <td className="px-3 py-1 border">{row.dutyType}</td>
                <td className="px-3 py-1 border">{row.vehicleType}</td>
                <td className="px-3 py-1 border">₹{row.guestCharge.toFixed(2)}</td>
                <td className="px-3 py-1 border">₹{row.backendCharge.toFixed(2)}</td>
              </tr>
            ))}
            {summary.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-3">
                  No data found for selected range.
                </td>
              </tr>
            )}
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
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </tbody>
        </table>
      </div>

      {loading && (
        <p className="text-center mt-4 text-gray-500">Loading report...</p>
      )}
    </div>
  );
};

export default ReportPage;
