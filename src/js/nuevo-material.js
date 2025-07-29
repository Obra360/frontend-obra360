// /src/js/nuevo-material.js - Funcionalidad para agregar nuevo material
class NuevoMaterialManager {
  constructor() {
    this.baseURL = 'https://mature-romona-obra360-e2712968.koyeb.app/api';
    this.obras = [];
    this.init();
  }

  async init() {
    // Verificar autenticación
    if (!window.authManager || !window.authManager.isAuthenticated()) {
      window.location.href = '/html/auth/login.html';
      return;
    }

    this.setupUserInfo();
    this.setupEventListeners();
    this.setupDateDefault();
    await this.loadObras();
  }

  // Configurar información del usuario
  setupUserInfo() {
    const user = window.authManager.getUser();
    if (user) {
      const userName = document.getElementById('userName');
      if (userName) {
        userName.textContent = `${user.firstName} ${user.lastName}` || user.email;
      }
    }
  }

  // Configurar fecha por defecto (hoy)
  setupDateDefault() {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
      const today = new Date().toISOString().split('T')[0];
      fechaInput.value = today;
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // Formulario
    const form = document.getElementById('nuevoMaterialForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Cálculo automático del precio total
    const precioInput = document.getElementById('precio');
    const cantidadInput = document.getElementById('cantidad');
    
    if (precioInput) {
      precioInput.addEventListener('input', () => this.calcularPrecioTotal());
    }
    
    if (cantidadInput) {
      cantidadInput.addEventListener('input', () => this.calcularPrecioTotal());
    }

    // Actualizar resumen en tiempo real
    const inputs = ['codigoInterno', 'nombre', 'unidad', 'obraId', 'cantidad', 'precio'];
    inputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => this.updateResumen());
        input.addEventListener('change', () => this.updateResumen());
      }
    });

    // Validación en tiempo real del código interno
    const codigoInput = document.getElementById('codigoInterno');
    if (codigoInput) {
      let timeoutId;
      codigoInput.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => this.validateCodigoInterno(), 500);
      });
    }
  }

  // Cargar obras disponibles
  async loadObras() {
    const select = document.getElementById('obraId');
    if (!select) return;

    try {
      console.log('Cargando obras...');
      const result = await window.authUtils.apiRequest('/api/obras');
      
      if (result.success && result.data) {
        this.obras = result.data;
        this.populateObrasSelect(this.obras);
      } else {
        console.error('Error cargando obras:', result.error);
        this.showObrasError();
      }
    } catch (error) {
      console.error('Error cargando obras:', error);
      this.showObrasError();
    }
  }

  // Poblar el select de obras
  populateObrasSelect(obras) {
    const select = document.getElementById('obraId');
    if (!select) return;

    if (!obras || obras.length === 0) {
      select.innerHTML = `
        <option value="">No hay obras disponibles</option>
        <option value="crear-nueva">+ Crear nueva obra</option>
      `;
      return;
    }

    // Limpiar opciones
    select.innerHTML = '<option value="">Seleccionar obra</option>';

    // Agregar obras
    obras.forEach(obra => {
      const option = document.createElement('option');
      option.value = obra.id;
      option.textContent = `${obra.empresa} - ${obra.ciudad} (${obra.tipo})`;
      select.appendChild(option);
    });

    // Opción para crear nueva obra
    const newOption = document.createElement('option');
    newOption.value = 'crear-nueva';
    newOption.textContent = '+ Crear nueva obra';
    newOption.style.fontStyle = 'italic';
    select.appendChild(newOption);

    console.log(`Cargadas ${obras.length} obras`);
  }

  // Mostrar error al cargar obras
  showObrasError() {
    const select = document.getElementById('obraId');
    if (!select) return;

    select.innerHTML = `
      <option value="">Error cargando obras</option>
      <option value="retry">🔄 Reintentar</option>
      <option value="crear-nueva">+ Crear nueva obra</option>
    `;

    // Event listener para reintentar
    select.addEventListener('change', (e) => {
      if (e.target.value === 'retry') {
        this.loadObras();
      } else if (e.target.value === 'crear-nueva') {
        window.location.href = '/html/obras/nueva-obra.html';
      }
    });
  }

  // Calcular precio total automáticamente
  calcularPrecioTotal() {
    const precioInput = document.getElementById('precio');
    const cantidadInput = document.getElementById('cantidad');
    const precioFinalInput = document.getElementById('precioFinal');

    if (!precioInput || !cantidadInput || !precioFinalInput) return;

    const precio = parseFloat(precioInput.value) || 0;
    const cantidad = parseFloat(cantidadInput.value) || 0;
    const total = precio * cantidad;

    precioFinalInput.value = total.toFixed(2);
  }

  // Actualizar resumen en tiempo real
  updateResumen() {
    const resumenDiv = document.getElementById('resumenMaterial');
    if (!resumenDiv) return;

    const codigo = document.getElementById('codigoInterno')?.value || '';
    const nombre = document.getElementById('nombre')?.value || '';
    const unidad = document.getElementById('unidad')?.value || '';
    const obraId = document.getElementById('obraId')?.value || '';
    const cantidad = document.getElementById('cantidad')?.value || '0';
    const precio = document.getElementById('precio')?.value || '0';

    if (!codigo && !nombre) {
      resumenDiv.innerHTML = '<p class="text-muted mb-0">Complete los campos para ver el resumen del material.</p>';
      return;
    }

    // Encontrar nombre de la obra
    const obra = this.obras.find(o => o.id === obraId);
    const nombreObra = obra ? `${obra.empresa} - ${obra.ciudad}` : 'Sin seleccionar';

    const total = (parseFloat(precio) || 0) * (parseFloat(cantidad) || 0);

    resumenDiv.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <p class="mb-1"><strong>Material:</strong> ${nombre || 'Sin nombre'}</p>
          <p class="mb-1"><strong>Código:</strong> ${codigo || 'Sin código'}</p>
          <p class="mb-1"><strong>Cantidad:</strong> ${cantidad} ${unidad || 'unidades'}</p>
        </div>
        <div class="col-md-6">
          <p class="mb-1"><strong>Obra:</strong> ${nombreObra}</p>
          <p class="mb-1"><strong>Precio unitario:</strong> $${parseFloat(precio || 0).toLocaleString()}</p>
          <p class="mb-1"><strong>Total:</strong> <span class="fw-bold text-primary">$${total.toLocaleString()}</span></p>
        </div>
      </div>
    `;
  }

  // Validar código interno único
  async validateCodigoInterno() {
    const input = document.getElementById('codigoInterno');
    if (!input || !input.value.trim()) return;

    // Por ahora solo validación básica
    // TODO: Implementar validación en el backend
    const codigo = input.value.trim();
    
    if (codigo.length < 3) {
      this.setInputValidation(input, false, 'El código debe tener al menos 3 caracteres');
    } else {
      this.setInputValidation(input, true);
    }
  }

  // Configurar validación visual del input
  setInputValidation(input, isValid, message = '') {
    if (isValid) {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
    } else {
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
      
      const feedback = input.parentNode.querySelector('.invalid-feedback');
      if (feedback && message) {
        feedback.textContent = message;
      }
    }
  }

  // Manejar envío del formulario
  async handleSubmit(event) {
    event.preventDefault();
    
    const btnGuardar = document.getElementById('btnGuardar');
    const originalText = btnGuardar.innerHTML;

    try {
      // Cambiar estado del botón
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i>Guardando...';

      // Validar formulario
      if (!this.validateForm()) {
        return;
      }

      // Recopilar datos
      const materialData = this.collectFormData();
      console.log('Datos a enviar:', materialData);

      // Enviar al backend
      const result = await this.saveMaterial(materialData);
      
      if (result.success) {
        this.showAlert('Material guardado correctamente', 'success');
        setTimeout(() => {
          window.location.href = '/html/materiales/materiales.html';
        }, 1500);
      } else {
        this.showAlert(result.error || 'Error al guardar el material', 'danger');
      }

    } catch (error) {
      console.error('Error:', error);
      this.showAlert('Error de conexión. Intente nuevamente.', 'danger');
    } finally {
      // Restaurar botón
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = originalText;
    }
  }

  // Validar formulario
  validateForm() {
    const requiredFields = [
      { id: 'codigoInterno', name: 'Código Interno' },
      { id: 'nombre', name: 'Nombre' },
      { id: 'unidad', name: 'Unidad de Medida' },
      { id: 'obraId', name: 'Obra' },
      { id: 'cantidad', name: 'Cantidad' }
    ];

    let isValid = true;

    requiredFields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input || !input.value.trim()) {
        this.setInputValidation(input, false, `${field.name} es requerido`);
        isValid = false;
      } else {
        this.setInputValidation(input, true);
      }
    });

    // Validación específica para cantidad
    const cantidadInput = document.getElementById('cantidad');
    if (cantidadInput && parseFloat(cantidadInput.value) < 0) {
      this.setInputValidation(cantidadInput, false, 'La cantidad no puede ser negativa');
      isValid = false;
    }

    // Validación específica para obra
    const obraSelect = document.getElementById('obraId');
    if (obraSelect && obraSelect.value === 'crear-nueva') {
      this.showAlert('Debe seleccionar una obra existente o crear una nueva obra primero', 'warning');
      isValid = false;
    }

    if (!isValid) {
      this.showAlert('Por favor complete todos los campos requeridos', 'warning');
    }

    return isValid;
  }

  // Recopilar datos del formulario
  collectFormData() {
    return {
      codigoInterno: document.getElementById('codigoInterno')?.value.trim() || '',
      nombre: document.getElementById('nombre')?.value.trim() || '',
      unidad: document.getElementById('unidad')?.value || '',
      obraId: document.getElementById('obraId')?.value || '',
      cantidad: parseFloat(document.getElementById('cantidad')?.value) || 0,
      precio: parseFloat(document.getElementById('precio')?.value) || 0,
      precioTotal: parseFloat(document.getElementById('precioFinal')?.value) || 0,
      remito: document.getElementById('remito')?.value.trim() || '',
      fecha: document.getElementById('fecha')?.value || new Date().toISOString().split('T')[0],
      estado: 'activo',
      fechaCreacion: new Date().toISOString()
    };
  }

  // Guardar material en el backend
  async saveMaterial(materialData) {
    try {
      const result = await window.authUtils.apiRequest('/api/materiales', {
        method: 'POST',
        body: JSON.stringify(materialData)
      });

      return result;
    } catch (error) {
      console.error('Error guardando material:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Mostrar alertas
  showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    // Limpiar alertas previas
    alertContainer.innerHTML = '';

    const alertClass = {
      'success': 'alert-success',
      'danger': 'alert-danger',
      'warning': 'alert-warning',
      'info': 'alert-info'
    }[type] || 'alert-info';

    const alertIcon = {
      'success': 'bi-check-circle',
      'danger': 'bi-exclamation-triangle',
      'warning': 'bi-exclamation-triangle',
      'info': 'bi-info-circle'
    }[type] || 'bi-info-circle';

    const alertHTML = `
      <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
        <i class="bi ${alertIcon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    alertContainer.innerHTML = alertHTML;

    // Auto-hide success alerts
    if (type === 'success') {
      setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
          const bsAlert = new bootstrap.Alert(alert);
          bsAlert.close();
        }
      }, 3000);
    }

    // Scroll to top to show alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Función global para limpiar formulario
function limpiarFormulario() {
  const form = document.getElementById('nuevoMaterialForm');
  if (form) {
    form.reset();
    
    // Limpiar validaciones
    const inputs = form.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
      input.classList.remove('is-valid', 'is-invalid');
    });

    // Restaurar fecha por defecto
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
      const today = new Date().toISOString().split('T')[0];
      fechaInput.value = today;
    }

    // Limpiar resumen
    const resumenDiv = document.getElementById('resumenMaterial');
    if (resumenDiv) {
      resumenDiv.innerHTML = '<p class="text-muted mb-0">Complete los campos para ver el resumen del material.</p>';
    }

    // Limpiar alertas
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
      alertContainer.innerHTML = '';
    }

    console.log('Formulario limpiado');
  }
}

// Función global para logout
function logout() {
  if (window.authManager) {
    window.authManager.logout();
  } else {
    // Fallback si no está disponible authManager
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/html/auth/login.html';
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando NuevoMaterialManager...');
  window.nuevoMaterialManager = new NuevoMaterialManager();
});

// Manejar errores globales
window.addEventListener('error', (event) => {
  console.error('Error global:', event.error);
});

// Manejar errores de promesas no capturadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejection no manejada:', event.reason);
});