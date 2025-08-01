// src/sidebar-app.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import Sidebar from './components/Sidebar';
import { SIDEBAR_CONFIG } from './components/Sidebar/sidebar.config';

// Importar los estilos del sidebar
import './components/Sidebar/sidebar.css';

// Función global para inicializar el sidebar
window.initializeSidebar = (containerId = 'sidebar-container', options = {}) => {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container con id "${containerId}" no encontrado`);
    return;
  }

  // Obtener el usuario del authManager existente
  const user = window.authManager?.getUser();
  const userRole = options.userRole || user?.role || 'OPERARIO';

  // Crear root de React
  const root = ReactDOM.createRoot(container);
  
  // Renderizar el sidebar
  root.render(
    <React.StrictMode>
      <Sidebar 
        config={SIDEBAR_CONFIG} 
        userRole={userRole}
        currentPath={window.location.pathname}
      />
    </React.StrictMode>
  );

  // Conectar el botón toggle
  const toggleButton = document.getElementById('sidebarToggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('toggleSidebar'));
    });
  }

  // Manejar el overlay móvil
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('closeMobileSidebar'));
    });
  }

  // Actualizar el estado del main content
  window.addEventListener('sidebarStateChanged', (e) => {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      if (e.detail.isCollapsed && !e.detail.isMobile) {
        mainContent.classList.add('expanded');
      } else {
        mainContent.classList.remove('expanded');
      }
    }
  });
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.initializeSidebar();
  });
} else {
  window.initializeSidebar();
}