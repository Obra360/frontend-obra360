// src/components/Sidebar/SidebarDropdown.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useActiveRoute } from './hooks/useActiveRoute';
import { useSidebarContext } from './context/SidebarContext';

const SidebarDropdown = ({ item }) => {
  const { findActiveParent, isActiveRoute } = useActiveRoute();
  const { userRole, closeMobileSidebar, isCollapsed, isMobile } = useSidebarContext();
  
  const hasActiveChild = findActiveParent(item.children);
  const [isExpanded, setIsExpanded] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  const filteredChildren = item.children?.filter(child => 
    !child.roles || child.roles.includes(userRole)
  ) || [];

  const toggleDropdown = (e) => {
    e.preventDefault();
    if (!isCollapsed || isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleChildClick = () => {
    if (isMobile) {
      closeMobileSidebar();
    }
  };

  // Cuando está colapsado en desktop, el dropdown se maneja de otra forma (ej. con un popover)
  // o simplemente se oculta. Por ahora, lo ocultamos para mantener la simplicidad.
  if (isCollapsed && !isMobile) {
    // Podrías renderizar solo el ícono aquí si quisieras un tooltip al hacer hover.
    return (
        <li className="sidebar-item">
            <a href="#" className={`sidebar-link ${hasActiveChild ? 'active' : ''}`}>
                <i className={item.icon}></i>
            </a>
        </li>
    );
  }

  return (
    <li className="sidebar-item">
      {/* CORREGIDO: Se agregó la etiqueta de apertura <a> */}
      <a
        href="#" // Usamos href="#" para que sea un enlace válido, el click lo maneja JS
        className={`sidebar-link ${hasActiveChild ? 'active' : ''}`}
        onClick={toggleDropdown}
        data-page={item.id}
        aria-expanded={isExpanded}
        style={{ cursor: 'pointer' }}
      >
        <i className={item.icon}></i>
        <span>{item.label}</span>
        {item.badge && (
          <span className="badge-notification">{item.badge}</span>
        )}
        <i className={`bi bi-chevron-right dropdown-icon ${isExpanded ? 'rotated' : ''}`}></i>
      </a>
      
      <ul 
        className={`sidebar-dropdown list-unstyled collapse ${isExpanded ? 'show' : ''}`}
      >
        {filteredChildren.map(child => {
          const isChildActive = isActiveRoute(child.href, child.id);
          
          return (
            <li key={child.id} className="sidebar-item">
              <NavLink
                to={child.href}
                className={`sidebar-link ${isChildActive ? 'active' : ''}`}
                data-page={child.id}
                onClick={handleChildClick}
              >
                <span>{child.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
};

export default SidebarDropdown;
