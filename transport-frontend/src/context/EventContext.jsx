import { createContext, useContext, useState } from 'react';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [eventKey, setEventKey] = useState(Date.now());

  const triggerRefresh = () => {
    setEventKey(Date.now());
  };

  return (
    <EventContext.Provider value={{ eventKey, triggerRefresh }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => useContext(EventContext);
