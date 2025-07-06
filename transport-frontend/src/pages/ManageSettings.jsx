import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

const ManageSettings = () => {
  const [settings, setSettings] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValues, setNewValues] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValues, setEditValues] = useState('');
  const token = localStorage.getItem('token');

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/settings/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      alert('Failed to fetch settings');
    }
  };

  const handleAddSetting = async () => {
    if (!newKey.trim() || !newValues.trim()) return alert('Key and Values required');

    let parsedValues;
    try {
      parsedValues = JSON.parse(newValues);
    } catch (err) {
      return alert('Invalid JSON in Values');
    }

    try {
      await axios.post(`${BASE_URL}/api/settings`, {
        key: newKey,
        label: newLabel,
        values: parsedValues,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewKey('');
      setNewLabel('');
      setNewValues('');
      fetchSettings();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add setting');
    }
  };

  const handleEdit = (key, currentValues) => {
    setEditingKey(key);
    setEditValues(JSON.stringify(currentValues, null, 2));
  };

  const handleSaveEdit = async (key) => {
    let parsed;
    try {
      parsed = JSON.parse(editValues);
    } catch (err) {
      return alert('Invalid JSON format');
    }

    try {
      await axios.patch(`${BASE_URL}/api/settings/${key}`, {
        values: parsed,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEditingKey(null);
      setEditValues('');
      fetchSettings();
    } catch (err) {
      alert('Failed to update setting');
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Are you sure you want to delete "${key}"?`)) return;

    try {
      await axios.delete(`${BASE_URL}/api/settings/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSettings();
    } catch (err) {
      alert('Failed to delete setting');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Manage Settings</h2>

      {/* Add New Setting */}
      <div className="border p-4 rounded shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Add New Setting</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-3">
          <input
            type="text"
            placeholder="Setting Key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <textarea
          placeholder="JSON Values"
          value={newValues}
          onChange={(e) => setNewValues(e.target.value)}
          className="border px-3 py-2 rounded w-full font-mono h-32"
        />
        <button
          onClick={handleAddSetting}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Setting
        </button>
      </div>

      {/* Settings Table */}
      <div className="border p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Existing Settings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left">Key</th>
                <th className="border px-2 py-1 text-left">Label</th>
                <th className="border px-2 py-1 text-left">Values</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.key}>
                  <td className="border px-2 py-1 font-mono">{s.key}</td>
                  <td className="border px-2 py-1">{typeof s.label === 'string' ? s.label : JSON.stringify(s.label)}</td>
                  <td className="border px-2 py-1">
                    {editingKey === s.key ? (
                      <textarea
                        value={editValues}
                        onChange={(e) => setEditValues(e.target.value)}
                        className="w-full h-32 border rounded px-2 py-1 font-mono"
                      />
                    ) : (
                      <pre className="max-w-xs whitespace-pre-wrap overflow-x-auto font-mono">
                        {JSON.stringify(s.values, null, 2)}
                      </pre>
                    )}
                  </td>
                  <td className="border px-2 py-1 text-center space-y-1">
                    {editingKey === s.key ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(s.key)}
                          className="text-green-700 mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="text-gray-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(s.key, s.values)}
                          className="text-blue-600 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.key)}
                          className="text-red-600"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {settings.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-2">
                    No settings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageSettings;
