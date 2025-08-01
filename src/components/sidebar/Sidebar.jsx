// src/components/Sidebar/Sidebar.jsx
import React, { useEffect } from 'react';
import { useSidebarState } from './hooks/useSidebarState';
import { SidebarProvider } from './context/SidebarContext';
import SidebarBrand from './SidebarBrand';
import SidebarMenu from './SidebarMenu';
import './sidebar.css';

const Sidebar = ({ config, userRole = 'ADMIN', currentPath }) => {
  const sidebarState = useSidebarState();
  const { isCollapsed, isMobile, showMobileSidebar } = sidebarState;

  // Actualizar el overlay
  useEffect(() => {
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      if (isMobile && showMobileSidebar) {
        overlay.classList.add('show');
      } else {
        overlay.classList.remove('show');
      }
    }
  }, [isMobile, showMobileSidebar]);

  const sidebarClasses = [
    'sidebar',
    isCollapsed && !isMobile ? 'collapsed' : '',
    isMobile && showMobileSidebar ? 'show' : ''
  ].filter(Boolean).join(' ');

  return (
    <SidebarProvider value={{ ...sidebarState, config, userRole, currentPath }}>
      <nav className={sidebarClasses} id="sidebar">
        <div className="sidebar-content">
          <SidebarBrand brand={config.brand} />
          <SidebarMenu items={config.menuItems} />
        </div>
      </nav>
    </SidebarProvider>
  );
};

export default Sidebar;