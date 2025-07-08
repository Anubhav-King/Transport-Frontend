import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('activeRole');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedRole) setActiveRole(storedRole);
  }, []);

  useEffect(() => {
    if (activeRole) {
      localStorage.setItem('activeRole', activeRole);
    }
  }, [activeRole]);

  return (
    <UserContext.Provider value={{ user, setUser, activeRole, setActiveRole }}>
      {children}
    </UserContext.Provider>
  );
};
