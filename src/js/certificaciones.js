// /src/js/certificaciones.js - Gestión de certificaciones para Obra360
class CertificacionesManager {
  constructor() {
    this.baseURL = 'https://mature-romona-obra360-e2712968.koyeb.app/api';
    this.certificaciones = [];
    this.stats = {};
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
    await this.loadCertificaciones();
    await this.loadStats();
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

  // Configurar event listeners
  setupEventListeners() {
    // Filtros
    const buscarInput = document.getElementById('buscarCertificacion');
    const filtroObra = document.getElementById('filtroObra');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroPeriodo = document.getElementById('filtroPeriodo');

    if (buscarInput) {
      buscarInput.addEventListener('input', () => this.filtrarCertificaciones());
    }
    if (filtroObra) {
      filtroObra.addEventListener('change', () => this.filtrarCertificaciones());
    }
    if (filtroEstado) {
      filtroEstado.addEventListener('change', () => this.filtrarCertificaciones());
    }
    if (filtroPeriodo) {
      filtroPeriodo.addEventListener('change', () => this.filtrarCertificaciones());
    }
  }

  // Cargar certificaciones desde la API
  async loadCertificaciones() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('certificacionesContainer');
    const estadoVacio = document.getElementById('estadoVacio');

    try {
      console.log('Cargando certificaciones...');
      
      if (loadingSpinner) loadingSpinner.style.display = 'block';
      if (container) container.style.display = 'none';
      if (estadoVacio) estadoVacio.classList.add('d-none');

      const result = await window.authUtils.apiRequest('/api/certificaciones');
      
      if (loadingSpinner) loadingSpinner.style.display = 'none';
      
      if (result.success && result.data) {
        this.certificaciones = result.data;
        console.log(`Cargadas ${this.certificaciones.length} certificaciones`);
        
        if (this.certificaciones.length > 0) {
          this.renderCertificaciones(this.certificaciones);
          if (container) container.style.display = 'block';
        } else {
          if (estadoVacio) estadoVacio.classList.remove('d-none');
        }
      } else {
        console.error('Error cargando certificaciones:', result.error);
        this.showAlert(result.error || 'Error al cargar certificaciones', 'danger');
        if (estadoVacio) estadoVacio.classList.remove('d-none');
      }
    } catch (error) {
      console.error('Error cargando certificaciones:', error);
      if (loadingSpinner) loadingSpinner.style.display = 'none';
      this.showAlert('Error de conexión. Por favor intente nuevamente.', 'danger');
      if (estadoVacio) estadoVacio.classList.remove('d-none');
    }
  }

  // Cargar estadísticas
  async loadStats() {
    try {
      const result = await window.authUtils.apiRequest('/api/certificaciones/stats/resumen');
      
      if (result.success && result.data) {
        this.stats = result.data;
        this.updateStatsHeader();
        this.updateResumenObras();
      } else {
        console.log('Stats no disponibles:', result.error);
      }
    } catch (error) {
      console.log('Error cargando stats (no crítico):', error);
    }
  }

  // Actualizar estadísticas en el header
  updateStatsHeader() {
    const totalCertificaciones = document.getElementById('totalCertificaciones');
    const totalMonto = document.getElementById('totalMonto');
    const certificacionesPendientes = document.getElementById('certificacionesPendientes');
    const certificacionesAprobadas = document.getElementById('certificacionesAprobadas');

    if (totalCertificaciones) {
      totalCertificaciones.textContent = this.stats.totalCertificaciones || 0;
    }
    if (totalMonto) {
      totalMonto.textContent = `$${(this.stats.totalMonto || 0).toLocaleString()}`;
    }
    if (certificacionesPendientes) {
      certificacionesPendientes.textContent = this.stats.certificacionesPendientes || 0;
    }
    if (certificacionesAprobadas) {
      certificacionesAprobadas.textContent = this.stats.certificacionesAprobadas || 0;
    }
  }

  // Actualizar resumen por obras
  updateResumenObras() {
    const resumenContainer = document.getElementById('resumenObras');
    const tableBody = document.getElementById('resumenObrasTableBody');

    if (!this.stats.resumenPorObra || this.stats.resumenPorObra.length === 0) {
      if (resumenContainer) resumenContainer.style.display = 'none';
      return;
    }

    if (resumenContainer) resumenContainer.style.display = 'block';
    
    if (tableBody) {
      const totalGeneral = this.stats.totalMonto || 0;
      
      tableBody.innerHTML = this.stats.resumenPorObra.map(obra => {
        const porcentaje = totalGeneral > 0 ? ((obra.total / totalGeneral) * 100) : 0;
        
        return `
          <tr>
            <td class="fw-bold">${obra.obra}</td>
            <td>${obra.cantidad}</td>
            <td class="fw-bold">$${obra.total.toLocaleString()}</td>
            <td>
              <div class="d-flex align-items-center">
                <div class="progress me-2" style="width: 100px; height: 20px;">
                  <div class="progress-bar bg-info" style="width: ${porcentaje}%"></div>
                </div>
                ${porcentaje.toFixed(1)}%
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Renderizar certificaciones
  renderCertificaciones(certificaciones) {
    const container = document.getElementById('certificacionesContainer');
    if (!container) return;

    container.innerHTML = '';

    certificaciones.forEach(cert => {
      const card = this.createCertificacionCard(cert);
      container.appendChild(card);
    });
  }

  // Crear tarjeta de certificación
  createCertificacionCard(cert) {
    const card = document.createElement('div');
    card.className = 'col-12 mb-4 certificacion-card';
    card.setAttribute('data-cert-id', cert.id);

    // Determinar badge de estado
    const estadoBadge = this.getEstadoBadge(cert.estado);
    
    // Información del creador
    const createdByInfo = cert.createdBy ? 
      `${cert.createdBy.nombre}` : 'Sistema';

    card.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-header">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h5 class="mb-1">
                <i class="bi bi-geo-alt text-primary me-2"></i>${cert.obra}
                ${estadoBadge}
              </h5>
              <div class="text-muted">
                <i class="bi bi-tools me-1"></i>${cert.tipoCertificacion}
                <span class="mx-2">•</span>
                <i class="bi bi-calendar me-1"></i>${this.formatDate(cert.fecha)}
              </div>
            </div>
            <div class="col-md-4 text-end">
              <h4 class="text-success mb-0">$${cert.total.toLocaleString()}</h4>
              <small class="text-muted">Total certificado</small>
            </div>
          </div>
        </div>
        
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-3">
              <div class="text-center p-2 bg-light rounded">
                <div class="h5 mb-0 text-primary">${cert.cantidadItems}</div>
                <small class="text-muted">Items</small>
              </div>
            </div>
            <div class="col-md-3">
              <div class="text-center p-2 bg-light rounded">
                <div class="h5 mb-0 text-info">${this.getTotalUnidades(cert.items)}</div>
                <small class="text-muted">Unidades totales</small>
              </div>
            </div>
            <div class="col-md-3">
              <div class="text-center p-2 bg-light rounded">
                <div class="h5 mb-0 text-warning">$${this.getPromedioUnitario(cert.items)}</div>
                <small class="text-muted">Precio promedio</small>
              </div>
            </div>
            <div class="col-md-3">
              <div class="text-center p-2 bg-light rounded">
                <div class="h5 mb-0 text-secondary">${cert.estado}</div>
                <small class="text-muted">Estado actual</small>
              </div>
            </div>
          </div>

          <!-- Tabla de items (colapsable) -->
          <div class="accordion" id="accordion-${cert.id}">
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#collapse-${cert.id}" aria-expanded="false">
                  <i class="bi bi-list-ul me-2"></i>Ver items certificados (${cert.cantidadItems})
                </button>
              </h2>
              <div id="collapse-${cert.id}" class="accordion-collapse collapse" 
                   data-bs-parent="#accordion-${cert.id}">
                <div class="accordion-body">
                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-dark">
                        <tr>
                          <th><i class="bi bi-hash me-1"></i>Código</th>
                          <th><i class="bi bi-card-text me-1"></i>Descripción</th>
                          <th class="text-center"><i class="bi bi-rulers me-1"></i>Unidad</th>
                          <th class="text-center"><i class="bi bi-123 me-1"></i>Cantidad</th>
                          <th class="text-center"><i class="bi bi-currency-dollar me-1"></i>Precio</th>
                          <th class="text-center"><i class="bi bi-calculator me-1"></i>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${cert.items.map(item => `
                          <tr>
                            <td><code>${item.codigo}</code></td>
                            <td>${item.descripcion}</td>
                            <td class="text-center"><span class="badge bg-secondary">${item.unidad}</span></td>
                            <td class="text-center"><strong>${item.cantidad}</strong></td>
                            <td class="text-center">$${item.precio.toLocaleString()}</td>
                            <td class="text-center"><strong class="text-success">$${item.subtotal.toLocaleString()}</strong></td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="table-success">
                          <td colspan="5" class="text-end fw-bold">Total Certificación:</td>
                          <td class="text-center"><h5 class="mb-0 text-success">$${cert.total.toLocaleString()}</h5></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="row mt-3">
            <div class="col-md-6">
              <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Certificado por: ${createdByInfo} • ${this.formatDateTime(cert.createdAt)}
              </small>
            </div>
            <div class="col-md-6 text-end">
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-primary" title="Ver detalles" 
                        onclick="certificacionesManager.verDetalles('${cert.id}')">
                  <i class="bi bi-eye"></i>
                </button>
                ${cert.estado === 'PENDIENTE' ? `
                  <button class="btn btn-outline-warning" title="Editar" 
                          onclick="certificacionesManager.editarCertificacion('${cert.id}')">
                    <i class="bi bi-pencil"></i>
                  </button>
                ` : ''}
                <button class="btn btn-outline-success" title="Exportar" 
                        onclick="certificacionesManager.exportarCertificacion('${cert.id}')">
                  <i class="bi bi-download"></i>
                </button>
                ${cert.estado === 'PENDIENTE' ? `
                  <button class="btn btn-outline-danger" title="Eliminar" 
                          onclick="certificacionesManager.eliminarCertificacion('${cert.id}')">
                    <i class="bi bi-trash"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  // Obtener badge de estado
  getEstadoBadge(estado) {
    const badges = {
      'PENDIENTE': '<span class="badge bg-warning ms-2">Pendiente</span>',
      'COMPLETA': '<span class="badge bg-success ms-2">Completa</span>',
      'APROBADA': '<span class="badge bg-primary ms-2">Aprobada</span>',
      'RECHAZADA': '<span class="badge bg-danger ms-2">Rechazada</span>',
      'PAGADA': '<span class="badge bg-info ms-2">Pagada</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary ms-2">Desconocido</span>';
  }

  // Calcular total de unidades
  getTotalUnidades(items) {
    return items.reduce((total, item) => total + item.cantidad, 0).toFixed(0);
  }

  // Calcular promedio unitario
  getPromedioUnitario(items) {
    if (!items || items.length === 0) return '0';
    const promedio = items.reduce((total, item) => total + item.precio, 0) / items.length;
    return promedio.toLocaleString();
  }

  // Filtrar certificaciones
  filtrarCertificaciones() {
    const busqueda = document.getElementById('buscarCertificacion')?.value.toLowerCase() || '';
    const obra = document.getElementById('filtroObra')?.value || '';
    const estado = document.getElementById('filtroEstado')?.value || '';
    const periodo = document.getElementById('filtroPeriodo')?.value || '';

    console.log('Filtrando:', { busqueda, obra, estado, periodo });

    const cards = document.querySelectorAll('.certificacion-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const cardText = card.textContent.toLowerCase();
      let mostrar = true;

      // Filtro de búsqueda
      if (busqueda && !cardText.includes(busqueda)) {
        mostrar = false;
      }

      // Filtro de obra
      if (obra) {
        const obraCard = card.querySelector('h5')?.textContent || '';
        if (!obraCard.toLowerCase().includes(obra.toLowerCase())) {
          mostrar = false;
        }
      }

      // Filtro de estado
      if (estado) {
        const estadoCard = card.querySelector('.badge')?.textContent || '';
        if (!estadoCard.includes(estado)) {
          mostrar = false;
        }
      }

      // Mostrar/ocultar card
      if (mostrar) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Mostrar estado vacío si no hay resultados
    const estadoVacio = document.getElementById('estadoVacio');
    if (visibleCount === 0 && cards.length > 0) {
      if (estadoVacio) estadoVacio.classList.remove('d-none');
    } else {
      if (estadoVacio) estadoVacio.classList.add('d-none');
    }
  }

  // Ver detalles de certificación
  async verDetalles(certificacionId) {
    try {
      const result = await window.authUtils.apiRequest(`/api/certificaciones/${certificacionId}`);
      
      if (result.success && result.data) {
        this.showDetallesModal(result.data);
      } else {
        this.showAlert(result.error || 'Error al cargar los detalles', 'danger');
      }
    } catch (error) {
      console.error('Error obteniendo detalles:', error);
      this.showAlert('Error de conexión', 'danger');
    }
  }

  // Mostrar modal de detalles
  showDetallesModal(cert) {
    const modalHTML = `
      <div class="modal fade" id="detallesCertificacionModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-eye me-2"></i>Detalles de Certificación
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row mb-4">
                <div class="col-md-6">
                  <h6><i class="bi bi-info-circle me-2"></i>Información General</h6>
                  <table class="table table-sm">
                    <tr><td><strong>ID:</strong></td><td><code>${cert.id}</code></td></tr>
                    <tr><td><strong>Obra:</strong></td><td>${cert.obra}</td></tr>
                    <tr><td><strong>Tipo:</strong></td><td>${cert.tipoCertificacion}</td></tr>
                    <tr><td><strong>Fecha:</strong></td><td>${this.formatDate(cert.fecha)}</td></tr>
                    <tr><td><strong>Estado:</strong></td><td>${this.getEstadoBadge(cert.estado)}</td></tr>
                    <tr><td><strong>Total:</strong></td><td class="fw-bold text-success">$${cert.total.toLocaleString()}</td></tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6><i class="bi bi-person me-2"></i>Información de Creación</h6>
                  <table class="table table-sm">
                    <tr><td><strong>Creado por:</strong></td><td>${cert.createdBy?.nombre || 'Sistema'}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${cert.createdBy?.email || 'N/A'}</td></tr>
                    <tr><td><strong>Fecha creación:</strong></td><td>${this.formatDateTime(cert.createdAt)}</td></tr>
                    <tr><td><strong>Última actualización:</strong></td><td>${this.formatDateTime(cert.updatedAt)}</td></tr>
                  </table>
                </div>
              </div>
              
              <hr>
              <h6><i class="bi bi-list-ul me-2"></i>Items Certificados (${cert.items.length})</h6>
              <div class="table-responsive">
                <table class="table table-bordered table-striped">
                  <thead class="table-dark">
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Unidad</th>
                      <th class="text-center">Cantidad</th>
                      <th class="text-center">Precio Unitario</th>
                      <th class="text-center">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cert.items.map(item => `
                      <tr>
                        <td><code>${item.codigo}</code></td>
                        <td>${item.descripcion}</td>
                        <td><span class="badge bg-secondary">${item.unidad}</span></td>
                        <td class="text-center fw-bold">${item.cantidad}</td>
                        <td class="text-center">$${item.precio.toLocaleString()}</td>
                        <td class="text-center fw-bold text-success">$${item.subtotal.toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="table-success">
                      <td colspan="5" class="text-end fw-bold fs-5">Total Certificación:</td>
                      <td class="text-center fw-bold fs-5 text-success">$${cert.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-lg me-1"></i>Cerrar
              </button>
              <button type="button" class="btn btn-success" onclick="certificacionesManager.exportarCertificacion('${cert.id}')" data-bs-dismiss="modal">
                <i class="bi bi-download me-1"></i>Exportar
              </button>
              ${cert.estado === 'PENDIENTE' ? `
                <button type="button" class="btn btn-primary" onclick="certificacionesManager.editarCertificacion('${cert.id}')" data-bs-dismiss="modal">
                  <i class="bi bi-pencil me-1"></i>Editar
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    this.showModal(modalHTML, 'detallesCertificacionModal');
  }

  // Eliminar certificación
  async eliminarCertificacion(certificacionId) {
    const confirmacion = await this.showConfirmDialog(
      '¿Eliminar Certificación?',
      '¿Estás seguro de que deseas eliminar esta certificación? Esta acción no se puede deshacer.',
      'danger'
    );

    if (!confirmacion) return;

    try {
      const result = await window.authUtils.apiRequest(`/api/certificaciones/${certificacionId}`, {
        method: 'DELETE'
      });

      if (result.success) {
        this.showAlert('Certificación eliminada correctamente', 'success');
        await this.loadCertificaciones();
        await this.loadStats();
      } else {
        this.showAlert(result.error || 'Error al eliminar la certificación', 'danger');
      }
    } catch (error) {
      console.error('Error eliminando certificación:', error);
      this.showAlert('Error de conexión', 'danger');
    }
  }

  // Editar certificación
  editarCertificacion(certificacionId) {
    // Por ahora redirigir a página de edición
    window.location.href = `/html/certificaciones/editar-certificacion.html?id=${certificacionId}`;
  }

  // Exportar certificación
  exportarCertificacion(certificacionId) {
    // Implementar exportación
    alert('Función de exportación en desarrollo');
  }

  // Formatear fecha
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Formatear fecha y hora
  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Mostrar diálogo de confirmación
  showConfirmDialog(title, message, type = 'warning') {
    return new Promise((resolve) => {
      const modalHTML = `
        <div class="modal fade" id="confirmModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle text-${type === 'danger' ? 'danger' : 'warning'}" 
                     style="font-size: 2rem; margin-right: 1rem;"></i>
                  <p class="mb-0">${message}</p>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" 
                        onclick="window.confirmDialogResolve(false)">
                  <i class="bi bi-x-lg me-1"></i>Cancelar
                </button>
                <button type="button" class="btn btn-${type}" onclick="window.confirmDialogResolve(true)">
                  <i class="bi bi-trash me-1"></i>${type === 'danger' ? 'Eliminar' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Configurar resolve global
      window.confirmDialogResolve = (result) => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        resolve(result);
        delete window.confirmDialogResolve;
      };

      this.showModal(modalHTML, 'confirmModal');
    });
  }

  // Mostrar alerta
  showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'position-fixed top-0 end-0 p-3';
    alertContainer.style.zIndex = '9999';
    
    const alertId = 'alert-' + Date.now();
    
    const iconMap = {
      'success': 'check-circle',
      'warning': 'exclamation-triangle',
      'danger': 'exclamation-circle',
      'info': 'info-circle'
    };
    
    alertContainer.innerHTML = `
      <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${iconMap[type] || 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    document.body.appendChild(alertContainer);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      const alert = document.getElementById(alertId);
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
        setTimeout(() => alertContainer.remove(), 300);
      }
    }, 5000);
  }
}

// Funciones globales
function exportarExcel() {
  alert('Función de exportación Excel en desarrollo');
}

function generarReporte() {
  alert('Función de generación de reportes en desarrollo');
}

function logout() {
  if (window.authManager) {
    window.authManager.logout();
  }
}

// Inicializar cuando el DOM esté listo
let certificacionesManager;

document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando CertificacionesManager...');
  setTimeout(() => {
    try {
      certificacionesManager = new CertificacionesManager();
    } catch (error) {
      console.error('Error inicializando CertificacionesManager:', error);
    }
  }, 100);
});