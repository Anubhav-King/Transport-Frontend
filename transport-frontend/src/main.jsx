import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { UserProvider } from "./context/UserContext";
import { EventProvider } from "./context/EventContext"; // ✅ NEW
import './index.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <UserProvider>
          <EventProvider> {/* ✅ Wrap here */}
            <App />
          </EventProvider>
        </UserProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
