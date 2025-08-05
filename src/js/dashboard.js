// Dashboard JavaScript específico
console.log('📊 Dashboard JS loaded');

// Funciones del dashboard
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Dashboard inicializado');
  
  // Ejemplo de función para actualizar datos
  function actualizarDashboard() {
    console.log('Actualizando datos del dashboard...');
    // Aquí irían las llamadas AJAX reales
  }
  
  // Ejecutar cada 30 segundos
  setInterval(actualizarDashboard, 30000);
});