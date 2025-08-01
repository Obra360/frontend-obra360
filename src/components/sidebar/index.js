import React from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/sidebar'; // Asumiendo que index.js exporta el componente Sidebar

// CORREGIDO: La ruta ahora apunta al archivo correcto 'sidebar-config.js'
import { SIDEBAR_CONFIG } from './components/sidebar/sidebar-config';

// Importa el CSS principal del sidebar
import './components/sidebar/sidebar.css';

const App = () => {
  // Obtener el rol del usuario desde donde lo tengas guardado (ej. authManager)
  const userRole = window.authManager?.getUser()?.role || 'ADMIN';

  return (
    <Sidebar
      config={SIDEBAR_CONFIG}
      userRole={userRole}
    />
  );
};

const container = document.getElementById('sidebar');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("El contenedor del sidebar con id 'sidebar' no fue encontrado.");
}
