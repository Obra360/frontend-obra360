// src/components/Sidebar/SidebarBrand.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebarContext } from './context/SidebarContext';

const SidebarBrand = ({ brand }) => {
  const { isCollapsed, isMobile } = useSidebarContext();
  
  return (
    <Link to={brand.href} className="sidebar-brand">
      <i className={`${brand.icon} brand-icon`}></i>
      {(!isCollapsed || isMobile) && (
        <span className="brand-text">{brand.name}</span>
      )}
    </Link>
  );
};

export default SidebarBrand;