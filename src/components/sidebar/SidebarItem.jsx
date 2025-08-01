// src/components/Sidebar/SidebarItem.jsx (versión sin React Router)
import React from 'react';
import { useSidebarContext } from './context/SidebarContext';

const SidebarItem = ({ item }) => {
  const { closeMobileSidebar, isCollapsed, isMobile, currentPath } = useSidebarContext();
  
  const isActive = currentPath === item.href || 
                   (item.id && currentPath.includes(item.id));

  const handleClick = () => {
    if (isMobile) {
      closeMobileSidebar();
    }
    // Navegación normal del navegador
    window.location.href = item.href;
  };

  return (
    <li className="sidebar-item">
      {/* CORREGIDO: Se agregó la etiqueta de apertura <a> */}
      <a
        href={item.href}
        className={`sidebar-link ${isActive ? 'active' : ''}`}
        data-page={item.id}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
      >
        <i className={item.icon}></i>
        {(!isCollapsed || isMobile) && (
          <>
            <span>{item.label}</span>
            {item.badge && (
              <span className="badge-notification">{item.badge}</span>
            )}
          </>
        )}
      </a>
    </li>
  );
};

export default SidebarItem;
