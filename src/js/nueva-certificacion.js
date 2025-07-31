// /src/js/nueva-certificacion.js - Crear nueva certificación
class NuevaCertificacionManager {
  constructor() {
    this.baseURL = 'https://mature-romona-obra360-e2712968.koyeb.app/api';
    this.itemsCount = 0;
    this.totalCertificacion = 0;
    this.init();
  }

  async cargarObras() {
    const selectObra = document.getElementById('obra');
    
    try {
      // Mostrar loading
      selectObra.innerHTML = '<option value="">Cargando obras...</option>';
      selectObra.disabled = true;

      // Hacer petición usando tu sistema existente
      const result = await window.authUtils.apiRequest('/api/obras', {
        method: 'GET'
      });

      if (result.success && result.data) {
        // Limpiar y llenar el dropdown
        selectObra.innerHTML = '<option value="">Seleccionar obra</option>';
        
        result.data.forEach(obra => {
          const option = document.createElement('option');
          option.value = obra.id;
          option.textContent = `${obra.empresa} - ${obra.ciudad}`;
          selectObra.appendChild(option);
        });

        selectObra.disabled = false;
        
        // Mostrar mensaje si no hay obras
        if (result.data.length === 0) {
          selectObra.innerHTML = '<option value="">No hay obras disponibles</option>';
          this.showAlert('No tienes obras disponibles para certificar', 'warning');
        }

      } else {
        throw new Error(result.error || 'Error al cargar obras');
      }

    } catch (error) {
      console.error('Error cargando obras:', error);
      selectObra.innerHTML = '<option value="">Error al cargar obras</option>';
      selectObra.disabled = true;
      this.showAlert('Error al cargar las obras. Verifica tu conexión e intenta recargar la página.', 'danger');
    }
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
    this.actualizarResumen();
    this.actualizarEstadoVacio();
    await this.cargarObras();
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
    // Botón agregar item
    const agregarItemBtn = document.getElementById('agregarItem');
    if (agregarItemBtn) {
      agregarItemBtn.addEventListener('click', () => this.agregarNuevoItem());
    }

    // Botón guardar certificación
    const guardarBtn = document.getElementById('guardarCertificacion');
    if (guardarBtn) {
      guardarBtn.addEventListener('click', () => this.guardarCertificacion());
    }

    // Botón limpiar formulario
    const limpiarBtn = document.getElementById('limpiarFormulario');
    if (limpiarBtn) {
      limpiarBtn.addEventListener('click', () => this.limpiarFormulario());
    }

    // Botón previsualizar
    const previsualizarBtn = document.getElementById('previsualizar');
    if (previsualizarBtn) {
      previsualizarBtn.addEventListener('click', () => this.previsualizar());
    }

    // Códigos frecuentes
    document.querySelectorAll('.codigo-frecuente').forEach(btn => {
      btn.addEventListener('click', () => {
        const codigo = btn.dataset.codigo;
        const descripcion = btn.dataset.descripcion;
        const precio = btn.dataset.precio;
        const unidad = btn.dataset.unidad;
        
        this.agregarNuevoItem(codigo, descripcion, unidad, 1, precio);
      });
    });

    // Validación del formulario principal
    document.querySelectorAll('#certificacionForm input, #certificacionForm select').forEach(input => {
      input.addEventListener('change', () => this.validarFormulario());
      input.addEventListener('input', () => this.validarFormulario());
    });
  }

  // Agregar nuevo item
  agregarNuevoItem(codigo = '', descripcion = '', unidad = '', cantidad = '', precio = '') {
    this.itemsCount++;
    
    const contenedor = document.getElementById('contenedor-items-certificados');
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'card mb-3 item-certificado';
    itemDiv.dataset.itemId = this.itemsCount;

    itemDiv.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">
          <i class="bi bi-tag me-1"></i>Item ${this.itemsCount}
        </h6>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="nuevaCertificacionManager.eliminarItem(${this.itemsCount})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3 mb-2">
            <label class="form-label">Código *</label>
            <input type="text" class="form-control item-codigo" placeholder="Ej: 5022224" value="${codigo}" required>
            <div class="invalid-feedback">Código requerido</div>
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">Descripción *</label>
            <input type="text" class="form-control item-descripcion" placeholder="Descripción del trabajo" value="${descripcion}" required>
            <div class="invalid-feedback">Descripción requerida</div>
          </div>
          <div class="col-md-3 mb-2">
            <label class="form-label">Unidad *</label>
            <select class="form-select item-unidad" required>
              <option value="">Unidad</option>
              <option value="M" ${unidad === 'M' ? 'selected' : ''}>M (Metro)</option>
              <option value="U" ${unidad === 'U' ? 'selected' : ''}>U (Unidad)</option>
              <option value="H" ${unidad === 'H' ? 'selected' : ''}>H (Hora)</option>
              <option value="KG" ${unidad === 'KG' ? 'selected' : ''}>KG (Kilogramo)</option>
              <option value="M2" ${unidad === 'M2' ? 'selected' : ''}>M² (Metro cuadrado)</option>
              <option value="M3" ${unidad === 'M3' ? 'selected' : ''}>M³ (Metro cúbico)</option>
            </select>
            <div class="invalid-feedback">Seleccione unidad</div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3 mb-2">
            <label class="form-label">Cantidad *</label>
            <input type="number" class="form-control item-cantidad" placeholder="1" min="0.01" step="0.01" value="${cantidad}" required>
            <div class="invalid-feedback">Cantidad requerida</div>
          </div>
          <div class="col-md-3 mb-2">
            <label class="form-label">Precio Unitario *</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control item-precio" placeholder="0,00" min="0" step="0.01" value="${precio}" required>
            </div>
            <div class="invalid-feedback">Precio requerido</div>
          </div>
          <div class="col-md-3 mb-2">
            <label class="form-label">Subtotal</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="text" class="form-control item-subtotal" readonly>
            </div>
          </div>
          <div class="col-md-3 mb-2">
            <label class="form-label">Estado</label>
            <div class="mt-2">
              <span class="badge bg-warning item-estado">Pendiente</span>
            </div>
          </div>
        </div>
      </div>
    `;

    contenedor.appendChild(itemDiv);

    // Agregar event listeners para cálculos automáticos
    const cantidadInput = itemDiv.querySelector('.item-cantidad');
    const precioInput = itemDiv.querySelector('.item-precio');
    
    cantidadInput.addEventListener('input', () => this.calcularSubtotal(this.itemsCount));
    precioInput.addEventListener('input', () => this.calcularSubtotal(this.itemsCount));
    
    // Agregar event listeners para validación
    itemDiv.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', () => this.validarFormulario());
      input.addEventListener('input', () => this.validarFormulario());
    });
    
    // Calcular subtotal inicial
    this.calcularSubtotal(this.itemsCount);
    
    // Actualizar estado
    this.actualizarEstadoVacio();
    this.actualizarResumen();
    this.validarFormulario();

    // Hacer scroll al nuevo item
    itemDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Eliminar item
  eliminarItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
      // Confirmar eliminación
      if (confirm('¿Está seguro de que desea eliminar este item?')) {
        item.remove();
        this.actualizarEstadoVacio();
        this.actualizarResumen();
        this.validarFormulario();
      }
    }
  }

  // Calcular subtotal de un item
  calcularSubtotal(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;

    const cantidad = parseFloat(item.querySelector('.item-cantidad').value) || 0;
    const precio = parseFloat(item.querySelector('.item-precio').value) || 0;
    const subtotal = cantidad * precio;

    item.querySelector('.item-subtotal').value = subtotal.toFixed(2);
    
    // Actualizar badge de estado
    const badge = item.querySelector('.item-estado');
    if (cantidad > 0 && precio > 0) {
      badge.className = 'badge bg-success item-estado';
      badge.textContent = 'Válido';
    } else {
      badge.className = 'badge bg-warning item-estado';
      badge.textContent = 'Pendiente';
    }

    this.actualizarResumen();
  }

  // Actualizar estado vacío
  actualizarEstadoVacio() {
    const contenedor = document.getElementById('contenedor-items-certificados');
    const estadoVacio = document.getElementById('estadoVacioItems');
    
    if (contenedor.children.length === 0) {
      estadoVacio.classList.remove('d-none');
    } else {
      estadoVacio.classList.add('d-none');
    }
  }

  // Actualizar resumen
  actualizarResumen() {
    const items = document.querySelectorAll('.item-certificado');
    let totalItems = items.length;
    let totalUnidades = 0;
    let subtotalGeneral = 0;

    items.forEach(item => {
      const cantidad = parseFloat(item.querySelector('.item-cantidad').value) || 0;
      const precio = parseFloat(item.querySelector('.item-precio').value) || 0;
      const subtotal = cantidad * precio;

      totalUnidades += cantidad;
      subtotalGeneral += subtotal;
    });

    const promedioUnitario = totalItems > 0 ? subtotalGeneral / totalItems : 0;

    // Actualizar displays
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalUnidades').textContent = totalUnidades.toFixed(0);
    document.getElementById('promedioUnitario').textContent = `$${promedioUnitario.toFixed(0)}`;
    document.getElementById('totalGeneral').textContent = `$${subtotalGeneral.toFixed(2)}`;

    this.totalCertificacion = subtotalGeneral;
  }

  // Validar formulario
  validarFormulario() {
    const obra = document.getElementById('obra').value;
    const tipoCertificacion = document.getElementById('tipoCertificacion').value;
    const fecha = document.getElementById('fecha').value;
    const items = document.querySelectorAll('.item-certificado');
    
    let itemsValidos = 0;
    items.forEach(item => {
      const cantidad = parseFloat(item.querySelector('.item-cantidad').value) || 0;
      const precio = parseFloat(item.querySelector('.item-precio').value) || 0;
      const codigo = item.querySelector('.item-codigo').value.trim();
      const descripcion = item.querySelector('.item-descripcion').value.trim();
      const unidad = item.querySelector('.item-unidad').value;
      
      if (cantidad > 0 && precio > 0 && codigo && descripcion && unidad) {
        itemsValidos++;
      }
    });

    const formValido = obra && tipoCertificacion && fecha && itemsValidos > 0;
    
    const btnGuardar = document.getElementById('guardarCertificacion');
    const alertValidacion = document.getElementById('alertValidacion');
    const mensajeValidacion = document.getElementById('mensajeValidacion');

    btnGuardar.disabled = !formValido;

    if (!formValido) {
      alertValidacion.classList.remove('d-none');
      if (!obra || !tipoCertificacion || !fecha) {
        mensajeValidacion.textContent = 'Complete la información general de la certificación.';
      } else if (itemsValidos === 0) {
        mensajeValidacion.textContent = 'Agregue al menos un item válido con todos los campos completos.';
      }
    } else {
      alertValidacion.classList.add('d-none');
    }

    return formValido;
  }

  // Guardar certificación
  async guardarCertificacion() {
    if (!this.validarFormulario()) {
      this.showAlert('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    const btnGuardar = document.getElementById('guardarCertificacion');
    const originalText = btnGuardar.innerHTML;

    try {
      // Cambiar estado del botón
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i>Guardando...';

      // Recopilar datos
      const certificacionData = this.recopilarDatos();
      console.log('Datos a enviar:', certificacionData);

      // Confirmar con el usuario
      const confirmacion = confirm(`¿Confirma guardar la certificación por un total de $${this.totalCertificacion.toFixed(2)}?`);
      
      if (!confirmacion) {
        return;
      }

      // Enviar al backend
      const result = await window.authUtils.apiRequest('/api/certificaciones', {
        method: 'POST',
        body: JSON.stringify(certificacionData)
      });
      
      if (result.success) {
        this.showAlert('Certificación guardada exitosamente', 'success');
        setTimeout(() => {
          window.location.href = '/html/certificaciones/certificaciones.html';
        }, 1500);
      } else {
        this.showAlert(result.error || 'Error al guardar la certificación', 'danger');
      }

    } catch (error) {
      console.error('Error guardando certificación:', error);
      this.showAlert('Error de conexión. Intente nuevamente.', 'danger');
    } finally {
      // Restaurar botón
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = originalText;
    }
  }

  // Recopilar datos del formulario
  recopilarDatos() {
    const obra = document.getElementById('obra').value;
    const tipoCertificacion = document.getElementById('tipoCertificacion').value;
    const fecha = document.getElementById('fecha').value;
    
    const items = [];
    document.querySelectorAll('.item-certificado').forEach(item => {
      const codigo = item.querySelector('.item-codigo').value.trim();
      const descripcion = item.querySelector('.item-descripcion').value.trim();
      const unidad = item.querySelector('.item-unidad').value;
      const cantidad = parseFloat(item.querySelector('.item-cantidad').value) || 0;
      const precio = parseFloat(item.querySelector('.item-precio').value) || 0;
      
      if (codigo && descripcion && unidad && cantidad > 0 && precio >= 0) {
        items.push({
          codigo,
          descripcion,
          unidad,
          cantidad,
          precio
        });
      }
    });

    return {
      obra,
      tipoCertificacion,
      fecha,
      items
    };
  }

  // Limpiar formulario
  limpiarFormulario() {
    const confirmacion = confirm('¿Está seguro de que desea limpiar todo el formulario? Se perderán todos los datos ingresados.');
    
    if (!confirmacion) return;

    // Limpiar campos principales
    document.getElementById('obra').value = '';
    document.getElementById('tipoCertificacion').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;

    // Eliminar todos los items
    const contenedor = document.getElementById('contenedor-items-certificados');
    contenedor.innerHTML = '';
    
    // Resetear contador
    this.itemsCount = 0;
    this.totalCertificacion = 0;

    // Actualizar estado
    this.actualizarEstadoVacio();
    this.actualizarResumen();
    this.validarFormulario();

    // Limpiar alertas
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
      alertContainer.innerHTML = '';
    }

    this.showAlert('Formulario limpiado correctamente', 'info');
  }

  // Previsualizar certificación
  previsualizar() {
    if (!this.validarFormulario()) {
      this.showAlert('Complete todos los campos para previsualizar', 'warning');
      return;
    }

    const datos = this.recopilarDatos();
    this.mostrarModalPreview(datos);
  }

  // Mostrar modal de previsualización
  mostrarModalPreview(datos) {
    const total = datos.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
    
    const modalHTML = `
      <div class="modal fade" id="previewModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-eye me-2"></i>Previsualización de Certificación
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <!-- Información general -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <h6><strong>Obra:</strong></h6>
                  <p>${datos.obra}</p>
                </div>
                <div class="col-md-4">
                  <h6><strong>Tipo:</strong></h6>
                  <p>${datos.tipoCertificacion}</p>
                </div>
                <div class="col-md-4">
                  <h6><strong>Fecha:</strong></h6>
                  <p>${this.formatDate(datos.fecha)}</p>
                </div>
              </div>

              <!-- Items -->
              <h6>Items Certificados (${datos.items.length})</h6>
              <div class="table-responsive">
                <table class="table table-bordered table-striped">
                  <thead class="table-dark">
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Unidad</th>
                      <th class="text-center">Cantidad</th>
                      <th class="text-center">Precio</th>
                      <th class="text-center">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${datos.items.map(item => `
                      <tr>
                        <td><code>${item.codigo}</code></td>
                        <td>${item.descripcion}</td>
                        <td><span class="badge bg-secondary">${item.unidad}</span></td>
                        <td class="text-center">${item.cantidad}</td>
                        <td class="text-center">$${item.precio.toLocaleString()}</td>
                        <td class="text-center"><strong>$${(item.cantidad * item.precio).toLocaleString()}</strong></td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="table-success">
                      <td colspan="5" class="text-end fw-bold fs-5">Total:</td>
                      <td class="text-center fw-bold fs-5 text-success">$${total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Resumen -->
              <div class="row mt-4">
                <div class="col-md-3 text-center">
                  <div class="p-3 bg-light rounded">
                    <h4 class="text-primary">${datos.items.length}</h4>
                    <small>Items</small>
                  </div>
                </div>
                <div class="col-md-3 text-center">
                  <div class="p-3 bg-light rounded">
                    <h4 class="text-info">${datos.items.reduce((sum, item) => sum + item.cantidad, 0)}</h4>
                    <small>Unidades totales</small>
                  </div>
                </div>
                <div class="col-md-3 text-center">
                  <div class="p-3 bg-light rounded">
                    <h4 class="text-warning">$${(total / datos.items.length).toFixed(0)}</h4>
                    <small>Promedio por item</small>
                  </div>
                </div>
                <div class="col-md-3 text-center">
                  <div class="p-3 bg-success text-white rounded">
                    <h4>$${total.toLocaleString()}</h4>
                    <small>Total certificación</small>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-lg me-1"></i>Cerrar
              </button>
              <button type="button" class="btn btn-success" onclick="nuevaCertificacionManager.guardarCertificacion()" data-bs-dismiss="modal">
                <i class="bi bi-check-lg me-1"></i>Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.showModal(modalHTML, 'previewModal');
  }

  // Formatear fecha
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Mostrar modal genérico
  showModal(modalHTML, modalId) {
    // Remover modal anterior si existe
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();

    // Limpiar modal al cerrar
    document.getElementById(modalId).addEventListener('hidden.bs.modal', function () {
      this.remove();
    });
  }

  // Mostrar alerta
  showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertId = 'alert-' + Date.now();
    
    const iconMap = {
      'success': 'check-circle',
      'warning': 'exclamation-triangle',
      'danger': 'exclamation-circle',
      'info': 'info-circle'
    };
    
    const alertHTML = `
      <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${iconMap[type] || 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHTML);

    // Auto-hide success alerts
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
          const bsAlert = new bootstrap.Alert(alert);
          bsAlert.close();
        }
      }, 5000);
    }

    // Scroll to top to show alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Funciones globales
function logout() {
  if (window.authManager) {
    window.authManager.logout();
  }
}

// Inicializar cuando el DOM esté listo
let nuevaCertificacionManager;

document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando NuevaCertificacionManager...');
  setTimeout(() => {
    try {
      nuevaCertificacionManager = new NuevaCertificacionManager();
    } catch (error) {
      console.error('Error inicializando NuevaCertificacionManager:', error);
    }
  }, 100);
});