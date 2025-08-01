// src/components/Sidebar/SidebarMenu.jsx
import React from 'react';
import { useSidebarContext } from './context/SidebarContext';
import SidebarItem from './SidebarItem';
import SidebarDropdown from './SidebarDropdown';

const SidebarMenu = ({ items }) => {
  const { userRole, isCollapsed, isMobile } = useSidebarContext();

  // Filtrar items según el rol del usuario
  const filteredItems = items.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  return (
    <ul className="sidebar-nav" id="sidebarNav">
      {(!isCollapsed || isMobile) && (
        <li className="sidebar-header">Secciones</li>
      )}
      
      {filteredItems.map(item => {
        if (item.type === 'link') {
          return <SidebarItem key={item.id} item={item} />;
        } else if (item.type === 'dropdown') {
          return <SidebarDropdown key={item.id} item={item} />;
        }
        return null;
      })}
    </ul>
  );
};

export default SidebarMenu;