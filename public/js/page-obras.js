// public/js/page-obras.js

// Hacemos que estas funciones sean globales para que los botones 'onclick' las encuentren
async function verDetalles(obraId) {
  try {
    // Pedimos los detalles de la obra a nuestro servidor
    const response = await fetch(`/obras/detalles/${obraId}`);
    if (!response.ok) throw new Error('No se pudo cargar la información de la obra.');
    
    const obra = await response.json();
    
    // Mostramos el modal con los datos recibidos
    mostrarModalDetalles(obra);
    
  } catch (error) {
    console.error(error);
    alert('Error al cargar los detalles de la obra.');
  }
}

async function editarObra(obraId) {
  try {
    const response = await fetch(`/obras/detalles/${obraId}`);
    if (!response.ok) throw new Error('No se pudo cargar la información para editar.');
    
    const obra = await response.json();
    
    mostrarModalEdicion(obra);

  } catch (error) {
    console.error(error);
    alert('Error al cargar los datos para editar.');
  }
}

async function eliminarObra(obraId, obraNombre) {
  if (confirm(`¿Estás seguro de que deseas eliminar la obra "${obraNombre}"?`)) {
    try {
      const response = await fetch(`/obras/eliminar/${obraId}`, { method: 'POST' });
      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        window.location.reload(); // Recargamos la página para ver los cambios
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la obra.');
    }
  }
}

// --- Funciones para mostrar los modales ---

function mostrarModalDetalles(obra) {
  // Eliminar modal anterior si existe
  document.getElementById('obraModalContainer')?.remove();

  const modalHTML = `
    <div id="obraModalContainer">
      <div class="modal fade" id="detallesObraModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalles de la Obra</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6><i class="bi bi-info-circle me-2"></i>Información General</h6>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>ID:</strong> <code>${obra.id}</code></li>
                    <li class="list-group-item"><strong>Empresa:</strong> ${obra.empresa}</li>
                    <li class="list-group-item"><strong>Tipo:</strong> <span class="badge bg-primary">${obra.tipo}</span></li>
                    <li class="list-group-item"><strong>Ciudad:</strong> ${obra.ciudad}</li>
                    <li class="list-group-item"><strong>Creada:</strong> ${moment(obra.createdAt).format('DD [de] MMMM, YYYY')}</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h6><i class="bi bi-person me-2"></i>Responsable</h6>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Nombre:</strong> ${obra.user.firstName} ${obra.user.lastName}</li>
                    <li class="list-group-item"><strong>Email:</strong> ${obra.user.email}</li>
                    <li class="list-group-item"><strong>Rol:</strong> <span class="badge bg-warning">${obra.user.role}</span></li>
                  </ul>
                </div>
              </div>
              <hr>
              <div class="text-center text-muted py-3">
                <i class="bi bi-box fs-1"></i>
                <p class="mt-2">No hay artículos registrados para esta obra</p>
                <button class="btn btn-sm btn-outline-primary">+ Agregar Artículos</button>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" class="btn btn-primary" onclick="editarObra('${obra.id}')" data-bs-dismiss="modal">Editar Obra</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  new bootstrap.Modal(document.getElementById('detallesObraModal')).show();
}

function mostrarModalEdicion(obra) {
  document.getElementById('obraModalContainer')?.remove();
  const modalHTML = `
    <div id="obraModalContainer">
      <div class="modal fade" id="editarObraModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <form action="/obras/editar/${obra.id}" method="POST">
              <div class="modal-header"><h5 class="modal-title">Editar Obra</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
              <div class="modal-body">
                  <div class="mb-3"><label class="form-label">Empresa *</label><input type="text" class="form-control" name="empresa" value="${obra.empresa}" required></div>
                  <div class="mb-3"><label class="form-label">Tipo de Obra *</label>
                      <select class="form-select" name="tipo" required>
                          <option value="Obra pública" ${obra.tipo === 'Obra pública' ? 'selected' : ''}>Obra pública</option>
                          <option value="Obra privada" ${obra.tipo === 'Obra privada' ? 'selected' : ''}>Obra privada</option>
                      </select>
                  </div>
                  <div class="mb-3"><label class="form-label">Ciudad *</label><input type="text" class="form-control" name="ciudad" value="${obra.ciudad}" required></div>
                  <div class="alert alert-info small">Información: Creada el ${moment(obra.createdAt).format('DD [de] MMMM, YYYY')} por ${obra.user.firstName} ${obra.user.lastName}</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  new bootstrap.Modal(document.getElementById('editarObraModal')).show();
}