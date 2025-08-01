// src/components/Sidebar/context/SidebarContext.js
import React, { createContext, useContext } from 'react';

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children, value }) => (
  <SidebarContext.Provider value={value}>
    {children}
  </SidebarContext.Provider>
);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
};