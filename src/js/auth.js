// Simulador de autenticación para desarrollo
console.log('🔐 Auth module loaded');

window.authManager = {
  getUser() {
    return {
      id: 1,
      firstName: 'Admin',
      lastName: 'Usuario',
      email: 'admin@obra360.com',
      role: 'ADMIN'
    };
  },
  
  logout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
      alert('Logout simulado - Redirigiendo...');
      // En producción: window.location.href = '/login';
    }
  },
  
  isAuthenticated() {
    return true; // Siempre autenticado en desarrollo
  }
};

console.log('✅ Auth manager inicializado');