// auth.js - Sistema de autenticación para Obra360
const AUTH_TOKEN_KEY = 'obra360_token';
const AUTH_USER_KEY = 'obra360_user';

// Configuración de la API
const API_BASE_URL = 'https://mature-romona-obra360-e2712968.koyeb.app';

// 2. Creamos un objeto global 'authUtils' para nuestras funciones
window.authUtils = {
  /**
   * Esta función ahora es la encargada de hacer TODAS las llamadas a la API
   * desde el JavaScript del navegador.
   */
  apiRequest: async function(endpoint, options = {}) {
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      // Tomamos el token directamente de localStorage, donde lo guarda tu script de login.
      const token = localStorage.getItem('obra360_token');
      
      const fetchOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      // Si tenemos un token, lo añadimos a la cabecera de autorización.
      if (token) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(fullUrl, fetchOptions);
      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        // Si el token expira (error 401), redirigimos al login.
        if (response.status === 401) {
          window.location.href = '/login';
        }
        return { success: false, error: data.message || `Error ${response.status}` };
      }
    } catch (error) {
      console.error(`Error en apiRequest a ${endpoint}:`, error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Función para cerrar sesión.
   */
  logout: function() {
    localStorage.removeItem('obra360_token');
    localStorage.removeItem('obra360_user');
    window.location.href = '/login';
  }
};

// 3. Creamos un 'authManager' simulado para no romper los botones que ya usan onclick="authManager.logout()"
window.authManager = {
    logout: window.authUtils.logout
};
