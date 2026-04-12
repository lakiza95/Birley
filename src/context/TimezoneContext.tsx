import React, { createContext, useContext, ReactNode } from 'react';

interface TimezoneContextType {
  timezone: string;
}

const TimezoneContext = createContext<TimezoneContextType>({ timezone: 'UTC' });

export const TimezoneProvider = ({ children, timezone }: { children: ReactNode, timezone: string }) => {
  return (
    <TimezoneContext.Provider value={{ timezone }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => useContext(TimezoneContext);
