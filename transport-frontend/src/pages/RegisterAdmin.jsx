// src/pages/RegisterAdmin.jsx
import { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const RegisterAdmin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    mobile: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/register-admin`, form);
      setMessage('✅ Admin created. Password is "Monday01"');
      setForm({ name: '', mobile: '' });
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Registration failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow mt-10 rounded">
      <h2 className="text-xl font-bold mb-4">Admin Registration</h2>
      {message && <p className="mb-3 text-sm text-blue-700">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Admin Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2"
          required
        />
        <input
          type="text"
          name="mobile"
          placeholder="Mobile Number"
          value={form.mobile}
          onChange={handleChange}
          className="w-full border p-2"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Register Admin
        </button>
      </form>
    </div>
  );
};

export default RegisterAdmin;
