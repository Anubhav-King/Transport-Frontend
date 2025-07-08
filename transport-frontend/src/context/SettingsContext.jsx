import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return; // 🔁 wait until token is available

        const res = await axios.get(`${BASE_URL}/api/settings/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const settingMap = {};
        res.data.forEach((item) => {
          try {
            const parsed = typeof item.values === 'string'
              ? JSON.parse(item.values)
              : item.values;
            settingMap[item.key] = parsed;
          } catch (err) {
            console.warn(`Failed to parse setting key "${item.key}":`, item.value);
            settingMap[item.key] = item.value;
          }
        });

        //console.log("✅ Settings loaded:", settingMap);
        setSettings(settingMap);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        fetchSettings();
        clearInterval(interval);
      }
    }, 300); // Check every 300ms until token appears

    return () => clearInterval(interval);
  }, []); // ✅ fetch only once on mount

  const contextValue = {
    settings,
    loading,
    error,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
