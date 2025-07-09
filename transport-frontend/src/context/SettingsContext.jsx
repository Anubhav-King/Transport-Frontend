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
        if (!token) return;

        const res = await axios.get(`${BASE_URL}/api/settings/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const settingMap = {};
        res.data.forEach((item) => {
          try {
            const parsed =
              typeof item.values === "string"
                ? JSON.parse(item.values)
                : item.values;
            settingMap[item.key] = parsed;
          } catch (err) {
            console.warn(`Failed to parse setting key "${item.key}":`, item.values);
            settingMap[item.key] = item.values;
          }
        });

        console.log("✅ Loaded Settings:", settingMap); // Add this for debug
        setSettings(settingMap);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings(); // Call directly once
  }, []);


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
