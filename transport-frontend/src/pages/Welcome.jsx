import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">
        Welcome to the Transport Duty System
      </h1>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Manage, verify, and track all transport duties efficiently across Concierge, Transport, and Chauffeur roles.
      </p>
      <Link
        to="/login"
        className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 transition"
      >
        Login
      </Link>
    </div>
  );
};

export default Welcome;
