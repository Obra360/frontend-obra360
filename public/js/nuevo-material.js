// public/js/page-nuevo-material.js - Lógica interactiva para el formulario de nuevo material

class NuevoMaterialManager {
  constructor() {
    console.log('✅ NuevoMaterialManager cargado para interactividad.');
    // La carga de obras se llama desde el init
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.loadObras(); // Cargamos las obras para el menú desplegable
  }

  // Configurar event listeners para la interactividad
  setupEventListeners() {
    const precioInput = document.getElementById('precio');
    const cantidadInput = document.getElementById('cantidad');
    
    if (precioInput) {
      precioInput.addEventListener('input', this.calcularPrecioTotal);
    }
    if (cantidadInput) {
      cantidadInput.addEventListener('input', this.calcularPrecioTotal);
    }
  }

  // Cargar las obras desde la API para rellenar el selector
  async loadObras() {
    const select = document.getElementById('obraId');
    if (!select) return;

    try {
      select.innerHTML = '<option value="">Cargando obras...</option>';
      const result = await window.authUtils.apiRequest('/api/obras');
      
      if (result.success && result.data) {
        select.innerHTML = '<option value="">Seleccionar obra</option>';
        result.data.forEach(obra => {
          const option = document.createElement('option');
          option.value = obra.id;
          option.textContent = `${obra.empresa} - ${obra.ciudad}`;
          select.appendChild(option);
        });
      } else {
        select.innerHTML = '<option value="">Error al cargar obras</option>';
      }
    } catch (error) {
      select.innerHTML = '<option value="">Error de conexión</option>';
    }
  }

  // Calcular precio total automáticamente
  calcularPrecioTotal() {
    const precioInput = document.getElementById('precio');
    const cantidadInput = document.getElementById('cantidad');
    const precioFinalInput = document.getElementById('precioFinal');

    if (!precioInput || !cantidadInput || !precioFinalInput) return;

    const precio = parseFloat(precioInput.value) || 0;
    const cantidad = parseFloat(cantidadInput.value) || 0;
    precioFinalInput.value = (precio * cantidad).toFixed(2);
  }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new NuevoMaterialManager();
});