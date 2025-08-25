// Variables globales
let personas = [];
let registros = [];
let modalPersona = null;
let modalRegistro = null;
let modalEditar = null;

// ✅ FUNCIÓN CORREGIDA: No buscar token en localStorage, usar cookies del navegador
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json'
        // ✅ No incluir Authorization header - el token viene automáticamente por cookie
    };
}

// ✅ FUNCIÓN AUXILIAR: Verificar si estamos autenticados
function isAuthenticated() {
    // En lugar de verificar localStorage, verificamos si estamos en una página autenticada
    // El servidor ya se encargó de verificar el token cuando cargó la página
    return document.getElementById('mainContent') !== null; // Si la página cargó, estamos autenticados
}

// ✅ INICIALIZACIÓN CORREGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 [CONTROL-HORAS-JS] Iniciando aplicación...');
    
    // NO verificar token aquí - el servidor ya lo hizo
    if (!isAuthenticated()) {
        console.log('❌ [CONTROL-HORAS-JS] Página no autenticada');
        return;
    }
    
    try {
        // Inicializar modales
        modalPersona = new bootstrap.Modal(document.getElementById('modalPersona'));
        modalRegistro = new bootstrap.Modal(document.getElementById('modalRegistro'));
        modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
        
        // Cargar datos iniciales (con manejo de errores mejorado)
        cargarPersonas();
        cargarRegistros();
        
        // Actualizar hora actual cada segundo
        actualizarHoraActual();
        setInterval(actualizarHoraActual, 1000);
        
        // Event listeners
        const buscarInput = document.getElementById('buscarPersona');
        if (buscarInput) {
            buscarInput.addEventListener('input', buscarPersona);
        }
        
        // Autocompletar hora actual al seleccionar tipo de registro
        const tipoRegistro = document.getElementById('tipoRegistro');
        if (tipoRegistro) {
            tipoRegistro.addEventListener('change', function() {
                if (this.value) {
                    const ahora = new Date();
                    const horaInput = document.getElementById('registroHora');
                    if (horaInput) {
                        horaInput.value = ahora.toTimeString().slice(0, 5);
                    }
                }
            });
        }
        
        console.log('✅ [CONTROL-HORAS-JS] Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ [CONTROL-HORAS-JS] Error en inicialización:', error);
    }
});

// ✅ FUNCIONES DE PERSONAS CORREGIDAS
async function cargarPersonas() {
    try {
        console.log('🔍 [CONTROL-HORAS-JS] Cargando personas...');
        
        const response = await fetch('/api/control-horas/personas');
        
        if (response.ok) {
            personas = await response.json();
            actualizarSelectPersonas();
            console.log('✅ [CONTROL-HORAS-JS] Personas cargadas:', personas.length);
        } else if (response.status === 401) {
            console.log('❌ [CONTROL-HORAS-JS] Token expirado, redirigiendo...');
            window.location.href = '/login?expired=true';
        } else {
            console.log('⚠️ [CONTROL-HORAS-JS] Error cargando personas:', response.status);
            // No romper la app por este error
        }
    } catch (error) {
        console.error('❌ [CONTROL-HORAS-JS] Error de red cargando personas:', error);
        mostrarNotificacion('Error de conexión al cargar personas', 'warning');
    }
}

function actualizarSelectPersonas() {
    const selectRegistro = document.getElementById('registroPersona');
    const selectFiltro = document.getElementById('filtroPersona');
    
    if (!selectRegistro || !selectFiltro) return;
    
    // Limpiar selects
    selectRegistro.innerHTML = '<option value="">Seleccionar persona</option>';
    selectFiltro.innerHTML = '<option value="">Todas las personas</option>';
    
    // Agregar personas ordenadas alfabéticamente
    personas.sort((a, b) => a.apellido.localeCompare(b.apellido))
        .forEach(persona => {
            const option1 = new Option(
                `${persona.apellido}, ${persona.nombre} - DNI: ${persona.dni}`, 
                persona.id
            );
            const option2 = option1.cloneNode(true);
            
            selectRegistro.appendChild(option1);
            selectFiltro.appendChild(option2);
        });
}

function mostrarModalPersona() {
    const form = document.getElementById('formPersona');
    if (form) {
        form.reset();
    }
    if (modalPersona) {
        modalPersona.show();
    }
}

async function guardarPersona() {
    const nombre = document.getElementById('personaNombre')?.value.trim();
    const apellido = document.getElementById('personaApellido')?.value.trim();
    const dni = document.getElementById('personaDni')?.value.trim();
    
    if (!nombre || !apellido || !dni) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    try {
        const response = await fetch('/api/control-horas/personas', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ nombre, apellido, dni })
        });
        
        if (response.ok) {
            if (modalPersona) modalPersona.hide();
            cargarPersonas();
            cargarRegistros();
            mostrarNotificacion('Persona creada exitosamente', 'success');
        } else if (response.status === 401) {
            window.location.href = '/login?expired=true';
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al crear persona', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión al crear persona', 'danger');
    }
}

// ✅ FUNCIONES DE REGISTROS CORREGIDAS
async function cargarRegistros() {
    const fechaDesde = document.getElementById('fechaDesde')?.value;
    const fechaHasta = document.getElementById('fechaHasta')?.value;
    const personaId = document.getElementById('filtroPersona')?.value;
    
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (personaId) params.append('personaId', personaId);
    
    try {
        console.log('🔍 [CONTROL-HORAS-JS] Cargando registros...');
        
        const response = await fetch(`/api/control-horas/registros?${params}`);
        
        if (response.ok) {
            registros = await response.json();
            renderizarTabla();
            actualizarEstadisticas();
            console.log('✅ [CONTROL-HORAS-JS] Registros cargados:', registros.length);
        } else if (response.status === 401) {
            console.log('❌ [CONTROL-HORAS-JS] Token expirado');
            window.location.href = '/login?expired=true';
        } else {
            console.log('⚠️ [CONTROL-HORAS-JS] Error cargando registros:', response.status);
            registros = [];
            renderizarTabla();
        }
    } catch (error) {
        console.error('❌ [CONTROL-HORAS-JS] Error de red cargando registros:', error);
        mostrarNotificacion('Error de conexión al cargar registros', 'warning');
    }
}

function renderizarTabla() {
    const tbody = document.getElementById('tablaRegistros');
    if (!tbody) return;
    
    if (registros.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <i class="bi bi-clipboard-x fs-1 text-muted"></i>
                    <h5 class="mt-3 text-muted">No hay registros para mostrar</h5>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = registros.map(registro => {
        const horasTrabajadas = calcularHorasTrabajadas(
            registro.horaEntrada, 
            registro.horaSalida
        );
        const total = calcularTotalHoras(horasTrabajadas, registro.horasExtra);
        
        return `
            <tr>
                <td><strong>${registro.apellido}, ${registro.nombre}</strong></td>
                <td>${registro.dni}</td>
                <td>${formatearFecha(registro.fecha)}</td>
                <td class="text-success">${registro.horaEntrada || '-'}</td>
                <td class="text-danger">${registro.horaSalida || '-'}</td>
                <td>${horasTrabajadas}</td>
                <td class="text-warning">${registro.horasExtra || '0'}h</td>
                <td class="fw-bold">${total}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarRegistro('${registro.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistro('${registro.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function mostrarModalRegistro() {
    const form = document.getElementById('formRegistro');
    if (form) {
        form.reset();
    }
    
    const fechaInput = document.getElementById('registroFecha');
    if (fechaInput && typeof moment !== 'undefined') {
        fechaInput.value = moment().format('YYYY-MM-DD');
    }
    
    if (modalRegistro) {
        modalRegistro.show();
    }
}

async function guardarRegistro() {
    const personaId = document.getElementById('registroPersona')?.value;
    const tipo = document.getElementById('tipoRegistro')?.value;
    const fecha = document.getElementById('registroFecha')?.value;
    const hora = document.getElementById('registroHora')?.value;
    const esHoraExtra = document.getElementById('esHoraExtra')?.checked;
    
    if (!personaId || !tipo || !fecha || !hora) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    try {
        const response = await fetch('/api/control-horas/marcar', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                personaId,
                tipo,
                fecha,
                hora,
                esHoraExtra
            })
        });
        
        if (response.ok) {
            if (modalRegistro) modalRegistro.hide();
            cargarRegistros();
            mostrarNotificacion('Registro guardado exitosamente', 'success');
        } else if (response.status === 401) {
            window.location.href = '/login?expired=true';
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al guardar registro', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión al guardar registro', 'danger');
    }
}

// ✅ RESTO DE FUNCIONES AUXILIARES (sin cambios críticos)
function actualizarHoraActual() {
    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('es-AR');
    const elemento = document.getElementById('horaActual');
    if (elemento) {
        elemento.textContent = horaActual;
    }
}

function calcularHorasTrabajadas(entrada, salida) {
    if (!entrada || !salida) return '0h';
    
    const [horaE, minE] = entrada.split(':').map(Number);
    const [horaS, minS] = salida.split(':').map(Number);
    
    let totalMinutos = (horaS * 60 + minS) - (horaE * 60 + minE);
    if (totalMinutos < 0) totalMinutos += 24 * 60; // Si cruza medianoche
    
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    
    return `${horas}h ${minutos}m`;
}

function calcularTotalHoras(horasTrabajadas, horasExtra) {
    const trabajadas = parseFloat(horasTrabajadas) || 0;
    const extra = parseFloat(horasExtra) || 0;
    return `${(trabajadas + extra).toFixed(1)}h`;
}

function formatearFecha(fecha) {
    if (typeof moment !== 'undefined') {
        return moment(fecha).format('DD/MM/YYYY');
    } else {
        return new Date(fecha).toLocaleDateString('es-AR');
    }
}

async function actualizarEstadisticas() {
    const hoy = typeof moment !== 'undefined' ? moment().format('YYYY-MM-DD') : new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`/api/control-horas/resumen/${hoy}`);
        
        if (response.ok) {
            const resumen = await response.json();
                        const presentesEl = document.getElementById('presentesHoy');
                        const horasTrabajadasEl = document.getElementById('horasTrabajadas');
                        const horasExtraEl = document.getElementById('horasExtraTotal');
            
                        if (presentesEl) presentesEl.textContent = resumen.empleadosPresentes || 0;
                        if (horasTrabajadasEl) horasTrabajadasEl.textContent = resumen.horasTotales || '0:00';
                        if (horasExtraEl) horasExtraEl.textContent = resumen.horasExtra || '0:00';
                    }
                } catch (error) {
                    console.error('Error actualizando estadísticas:', error);
                }
            }

function buscarPersona(event) {
    const busqueda = event.target.value.toLowerCase();
    const filas = document.querySelectorAll('#tablaRegistros tr');
    
    filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        fila.style.display = texto.includes(busqueda) ? '' : 'none';
    });
}

function aplicarFiltros() {
    cargarRegistros();
}

async function exportarExcel() {
    const fechaDesde = document.getElementById('fechaDesde')?.value;
    const fechaHasta = document.getElementById('fechaHasta')?.value;
    const personaId = document.getElementById('filtroPersona')?.value;
    
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (personaId) params.append('personaId', personaId);
    
    // ✅ No incluir token en URL - usar cookie automática
    window.location.href = `/api/control-horas/exportar?${params}`;
}

async function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;
    
    const editarIdEl = document.getElementById('editarId');
    const editarEntradaEl = document.getElementById('editarHoraEntrada');
    const editarSalidaEl = document.getElementById('editarHoraSalida');
    const editarExtraEl = document.getElementById('editarHorasExtra');
    
    if (editarIdEl) editarIdEl.value = id;
    if (editarEntradaEl) editarEntradaEl.value = registro.horaEntrada || '';
    if (editarSalidaEl) editarSalidaEl.value = registro.horaSalida || '';
    if (editarExtraEl) editarExtraEl.value = registro.horasExtra || 0;
    
    if (modalEditar) modalEditar.show();
}

async function actualizarRegistro() {
    const id = document.getElementById('editarId')?.value;
    const horaEntrada = document.getElementById('editarHoraEntrada')?.value;
    const horaSalida = document.getElementById('editarHoraSalida')?.value;
    const horasExtra = document.getElementById('editarHorasExtra')?.value;
    
    if (!id) return;
    
    try {
        const response = await fetch(`/api/control-horas/registros/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                horaEntrada,
                horaSalida,
                horasExtra
            })
        });
        
        if (response.ok) {
            if (modalEditar) modalEditar.hide();
            cargarRegistros();
            mostrarNotificacion('Registro actualizado exitosamente', 'success');
        } else if (response.status === 401) {
            window.location.href = '/login?expired=true';
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al actualizar registro', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión al actualizar registro', 'danger');
    }
}

async function eliminarRegistro(id) {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    
    try {
        const response = await fetch(`/api/control-horas/registros/${id}`, {
            method: 'DELETE'
            // ✅ No incluir headers - usar cookie automática
        });
        
        if (response.ok) {
            cargarRegistros();
            mostrarNotificacion('Registro eliminado exitosamente', 'success');
        } else if (response.status === 401) {
            window.location.href = '/login?expired=true';
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al eliminar registro', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión al eliminar registro', 'danger');
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Implementar sistema de notificaciones con toast o alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// ✅ EXPORT GLOBAL FUNCTIONS para que funcionen desde HTML
window.mostrarModalPersona = mostrarModalPersona;
window.guardarPersona = guardarPersona;
window.mostrarModalRegistro = mostrarModalRegistro;
window.guardarRegistro = guardarRegistro;
window.editarRegistro = editarRegistro;
window.actualizarRegistro = actualizarRegistro;
window.eliminarRegistro = eliminarRegistro;
window.aplicarFiltros = aplicarFiltros;
window.exportarExcel = exportarExcel;

console.log('✅ [CONTROL-HORAS-JS] Script cargado completamente');