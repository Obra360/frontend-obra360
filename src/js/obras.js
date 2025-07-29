// /src/js/obras.js - JavaScript adaptado para tu sistema de autenticación
class ObrasManager {
  constructor() {
    this.baseURL = 'https://mature-romona-obra360-e2712968.koyeb.app/api';
    this.init();
  }

  init() {
    // Verificar autenticación usando tu sistema
    if (!window.authManager.isAuthenticated()) {
      window.authManager.redirectToLogin();
      return;
    }
    
    this.loadObras();
    this.setupUserInfo();
  }

  // Configurar información del usuario en la UI
  setupUserInfo() {
    const user = window.authManager.getUser();
    if (user) {
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = `${user.firstName} ${user.lastName}` || user.email;
      }
    }
  }

  // Cargar todas las obras usando tu sistema authUtils
  async loadObras() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const listaObras = document.getElementById('lista-obras');
    const emptyState = document.getElementById('emptyState');
    
    try {
      loadingSpinner.style.display = 'block';
      listaObras.style.display = 'none';
      emptyState.style.display = 'none';

      // Usar tu sistema authUtils para hacer la petición
      const result = await window.authUtils.apiRequest('/api/obras', {
        method: 'GET'
      });
      
      loadingSpinner.style.display = 'none';
      
      if (result.success && result.data && result.data.length > 0) {
        this.renderObras(result.data);
        listaObras.style.display = 'flex';
        emptyState.style.display = 'none';
      } else if (result.success && result.data) {
        listaObras.style.display = 'none';
        emptyState.style.display = 'block';
      } else {
        this.showAlert(result.error || 'Error al cargar las obras', 'danger');
      }
    } catch (error) {
      console.error('Error al cargar obras:', error);
      loadingSpinner.style.display = 'none';
      this.showAlert('Error de conexión. Por favor intente nuevamente.', 'danger');
    }
  }

  // Renderizar obras en el DOM
  renderObras(obras) {
    const contenedor = document.getElementById("lista-obras");
    contenedor.innerHTML = "";

    obras.forEach((obra) => {
      const card = this.createObraCard(obra);
      contenedor.appendChild(card);
    });
  }

  // Crear tarjeta de obra
  createObraCard(obra) {
    const card = document.createElement("div");
    card.className = "col-md-4";
    card.setAttribute('data-obra-id', obra.id);

    // Información del usuario responsable
    const userInfo = obra.user ? 
      `${obra.user.firstName} ${obra.user.lastName}` : 
      'Sin asignar';

    card.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">${obra.empresa}</h5>
            <span class="badge bg-secondary">ID: ${obra.id.slice(-8)}</span>
          </div>
          
          <div class="mb-3">
            <p class="mb-1">
              <i class="bi bi-building me-1 text-primary"></i> 
              <strong>${obra.tipo}</strong>
            </p>
            <p class="mb-1">
              <i class="bi bi-geo-alt me-1 text-danger"></i> 
              <strong>${obra.ciudad}</strong>
            </p>
            <p class="mb-1">
              <i class="bi bi-person me-1 text-success"></i> 
              <strong>${userInfo}</strong>
            </p>
            <p class="mb-0">
              <i class="bi bi-calendar me-1 text-info"></i> 
              <strong>${this.formatDate(obra.createdAt)}</strong>
            </p>
          </div>
        </div>
        
        <div class="card-footer bg-light">
          <div class="d-flex justify-content-between gap-2">
            <button class="btn btn-sm btn-outline-primary flex-fill" onclick="obrasManager.editarObra('${obra.id}')">
              <i class="bi bi-pencil me-1"></i> Editar
            </button>
            <button class="btn btn-sm btn-outline-danger flex-fill" onclick="obrasManager.eliminarObra('${obra.id}')">
              <i class="bi bi-trash me-1"></i> Eliminar
            </button>
          </div>
          <button class="btn btn-sm btn-info w-100 mt-2" onclick="obrasManager.verDetalles('${obra.id}')">
            <i class="bi bi-eye me-1"></i> Ver Detalles
          </button>
        </div>
      </div>
    `;

    return card;
  }

  // Formatear fecha
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Editar obra
  async editarObra(obraId) {
    try {
      const result = await window.authUtils.apiRequest(`/api/obras/${obraId}`, {
        method: 'GET'
      });
      
      if (result.success) {
        this.showEditModal(result.data);
      } else {
        this.showAlert(result.error || 'Error al cargar los datos de la obra', 'danger');
      }
    } catch (error) {
      console.error('Error al obtener datos de la obra:', error);
      this.showAlert('Error de conexión', 'danger');
    }
  }

  // Mostrar modal de edición
  showEditModal(obra) {
    const modalHTML = `
      <div class="modal fade" id="editObraModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-pencil me-2"></i>Editar Obra
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="editObraForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="editEmpresa" class="form-label">
                      <i class="bi bi-building me-1"></i>Empresa *
                    </label>
                    <input type="text" class="form-control" id="editEmpresa" value="${obra.empresa}" required>
                    <div class="invalid-feedback">Por favor ingrese el nombre de la empresa.</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="editTipo" class="form-label">
                      <i class="bi bi-hammer me-1"></i>Tipo de Obra *
                    </label>
                    <select class="form-select" id="editTipo" required>
                      <option value="">Seleccionar tipo</option>
                      <option value="Obra privada" ${obra.tipo === 'Obra privada' ? 'selected' : ''}>Obra privada</option>
                      <option value="Obra pública" ${obra.tipo === 'Obra pública' ? 'selected' : ''}>Obra pública</option>
                    </select>
                    <div class="invalid-feedback">Por favor seleccione el tipo de obra.</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="editCiudad" class="form-label">
                      <i class="bi bi-geo-alt me-1"></i>Ciudad *
                    </label>
                    <input type="text" class="form-control" id="editCiudad" value="${obra.ciudad}" required>
                    <div class="invalid-feedback">Por favor ingrese la ciudad.</div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <div class="alert alert-info">
                      <i class="bi bi-info-circle me-2"></i>
                      <strong>Información:</strong> Creada el ${this.formatDate(obra.createdAt)} por ${obra.user.firstName} ${obra.user.lastName}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-lg me-1"></i>Cancelar
              </button>
              <button type="button" class="btn btn-primary" onclick="obrasManager.guardarCambios('${obra.id}')">
                <i class="bi bi-check-lg me-1"></i>Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal anterior si existe
    const existingModal = document.getElementById('editObraModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editObraModal'));
    modal.show();

    // Limpiar modal al cerrar
    document.getElementById('editObraModal').addEventListener('hidden.bs.modal', function () {
      this.remove();
    });
  }

  // Guardar cambios de edición
  async guardarCambios(obraId) {
    const form = document.getElementById('editObraForm');
    const empresa = document.getElementById('editEmpresa').value.trim();
    const tipo = document.getElementById('editTipo').value;
    const ciudad = document.getElementById('editCiudad').value.trim();

    // Validaciones
    let isValid = true;

    if (!empresa) {
      document.getElementById('editEmpresa').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('editEmpresa').classList.remove('is-invalid');
    }

    if (!tipo) {
      document.getElementById('editTipo').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('editTipo').classList.remove('is-invalid');
    }

    if (!ciudad) {
      document.getElementById('editCiudad').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('editCiudad').classList.remove('is-invalid');
    }

    if (!isValid) {
      this.showAlert('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }

    try {
      const datosActualizados = {
        empresa,
        tipo,
        ciudad
      };

      const result = await window.authUtils.apiRequest(`/api/obras/${obraId}`, {
        method: 'PUT',
        body: JSON.stringify(datosActualizados)
      });

      if (result.success) {
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editObraModal'));
        modal.hide();

        this.showAlert('Obra actualizada correctamente', 'success');
        
        // Recargar obras
        await this.loadObras();
      } else {
        this.showAlert(result.error || 'Error al actualizar la obra', 'danger');
      }

    } catch (error) {
      console.error('Error al guardar cambios:', error);
      this.showAlert('Error de conexión', 'danger');
    }
  }

  // Eliminar obra
  async eliminarObra(obraId) {
    const confirmacion = await this.showConfirmDialog(
      '¿Eliminar Obra?',
      '¿Estás seguro de que deseas eliminar esta obra? Esta acción no se puede deshacer.',
      'danger'
    );

    if (!confirmacion) return;

    try {
      const result = await window.authUtils.apiRequest(`/api/obras/${obraId}`, {
        method: 'DELETE'
      });

      if (result.success) {
        this.showAlert('Obra eliminada correctamente', 'success');
        
        // Recargar obras
        await this.loadObras();
      } else {
        this.showAlert(result.error || 'Error al eliminar la obra', 'danger');
      }

    } catch (error) {
      console.error('Error al eliminar obra:', error);
      this.showAlert('Error de conexión', 'danger');
    }
  }

  // Ver detalles de obra
  async verDetalles(obraId) {
    try {
      const result = await window.authUtils.apiRequest(`/api/obras/${obraId}`, {
        method: 'GET'
      });
      
      if (result.success) {
        this.showDetallesModal(result.data);
      } else {
        this.showAlert(result.error || 'Error al cargar los detalles', 'danger');
      }
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      this.showAlert('Error de conexión', 'danger');
    }
  }

  // Mostrar modal de detalles
  showDetallesModal(obra) {
    const modalHTML = `
      <div class="modal fade" id="detallesObraModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-eye me-2"></i>Detalles de la Obra
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6><i class="bi bi-building me-2"></i>Información General</h6>
                  <table class="table table-sm">
                    <tr><td><strong>ID:</strong></td><td><code>${obra.id}</code></td></tr>
                    <tr><td><strong>Empresa:</strong></td><td>${obra.empresa}</td></tr>
                    <tr><td><strong>Tipo:</strong></td><td><span class="badge bg-primary">${obra.tipo}</span></td></tr>
                    <tr><td><strong>Ciudad:</strong></td><td>${obra.ciudad}</td></tr>
                    <tr><td><strong>Creada:</strong></td><td>${this.formatDate(obra.createdAt)}</td></tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6><i class="bi bi-person me-2"></i>Responsable</h6>
                  <table class="table table-sm">
                    <tr><td><strong>Nombre:</strong></td><td>${obra.user.firstName} ${obra.user.lastName}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${obra.user.email}</td></tr>
                    <tr><td><strong>Rol:</strong></td><td><span class="badge bg-secondary">${obra.user.role}</span></td></tr>
                  </table>
                </div>
              </div>
              
              ${obra.articulos && obra.articulos.length > 0 ? `
                <hr>
                <h6><i class="bi bi-box me-2"></i>Artículos (${obra.articulos.length})</h6>
                <div class="table-responsive">
                  <table class="table table-sm table-striped">
                    <thead class="table-dark">
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${obra.articulos.map(articulo => `
                        <tr>
                          <td><code>${articulo.CodigoInterno}</code></td>
                          <td>${articulo.Nombre}</td>
                          <td><span class="badge bg-info">${articulo.Cantidad}</span></td>
                          <td>$${articulo.precio.toLocaleString()}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <hr>
                <div class="text-center text-muted py-4">
                  <i class="bi bi-box" style="font-size: 3rem; opacity: 0.3;"></i>
                  <p class="mt-2">No hay artículos registrados para esta obra</p>
                  <a href="/html/materiales/nuevo-material.html" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-plus me-1"></i>Agregar Artículos
                  </a>
                </div>
              `}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-lg me-1"></i>Cerrar
              </button>
              <button type="button" class="btn btn-primary" onclick="obrasManager.editarObra('${obra.id}')" data-bs-dismiss="modal">
                <i class="bi bi-pencil me-1"></i>Editar Obra
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal anterior si existe
    const existingModal = document.getElementById('detallesObraModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('detallesObraModal'));
    modal.show();

    // Limpiar modal al cerrar
    document.getElementById('detallesObraModal').addEventListener('hidden.bs.modal', function () {
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
                  <i class="bi bi-exclamation-triangle text-${type === 'danger' ? 'danger' : 'warning'}" style="font-size: 2rem; margin-right: 1rem;"></i>
                  <p class="mb-0">${message}</p>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" onclick="window.confirmDialogResolve(false)">
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

      // Remover modal anterior si existe
      const existingModal = document.getElementById('confirmModal');
      if (existingModal) {
        existingModal.remove();
      }

      // Agregar nuevo modal
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Configurar resolve global
      window.confirmDialogResolve = (result) => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        resolve(result);
        delete window.confirmDialogResolve;
      };

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
      modal.show();

      // Limpiar modal al cerrar
      document.getElementById('confirmModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
        if (window.confirmDialogResolve) {
          window.confirmDialogResolve(false);
        }
      });
    });
  }

  // Mostrar alerta
  showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const iconMap = {
      'success': 'check-circle',
      'warning': 'exclamation-triangle',
      'danger': 'exclamation-circle',
      'info': 'info-circle'
    };
    
    alertContainer.insertAdjacentHTML('beforeend', `
      <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${iconMap[type] || 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      const alert = document.getElementById(alertId);
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }
}

// Inicializar cuando el DOM esté listo
let obrasManager;

document.addEventListener('DOMContentLoaded', function() {
  // Esperar un poco para asegurar que auth.js se haya cargado
  setTimeout(() => {
    obrasManager = new ObrasManager();
  }, 100);
});

// Funciones globales para compatibilidad
function editarObra(id) {
  window.authUtils.requireAuth(() => {
    if (obrasManager) {
      obrasManager.editarObra(id);
    }
  });
}

function eliminarObra(id) {
  window.authUtils.requireAuth(() => {
    if (obrasManager) {
      obrasManager.eliminarObra(id);
    }
  });
}

function agregarMaterial() {
  window.authUtils.requireAuth(() => {
    window.location.href = '/html/materiales/nuevo-material.html';
  });
}

function verReporte() {
  window.authUtils.requireAuth(() => {
    alert('Función de reportes en desarrollo');
  });
}

function logout() {
  window.authUtils.logout();
}