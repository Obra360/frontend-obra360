// Variables globales
let personas = [];
let registros = [];
let modalPersona = null;
let modalRegistro = null;
let modalEditar = null;

// Función auxiliar para obtener el token
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Función auxiliar para headers con autenticación
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Inicializar modales
    modalPersona = new bootstrap.Modal(document.getElementById('modalPersona'));
    modalRegistro = new bootstrap.Modal(document.getElementById('modalRegistro'));
    modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
    
    // Cargar datos iniciales
    cargarPersonas();
    cargarRegistros();
    
    // Actualizar hora actual cada segundo
    actualizarHoraActual();
    setInterval(actualizarHoraActual, 1000);
    
    // Event listeners
    document.getElementById('buscarPersona').addEventListener('input', buscarPersona);
    
    // Autocompletar hora actual al seleccionar tipo de registro
    document.getElementById('tipoRegistro').addEventListener('change', function() {
        if (this.value) {
            const ahora = new Date();
            document.getElementById('registroHora').value = 
                ahora.toTimeString().slice(0, 5);
        }
    });
});

// Funciones de Personas
async function cargarPersonas() {
    try {
        const response = await fetch('/api/control-horas/personas', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (response.ok) {
            personas = await response.json();
            actualizarSelectPersonas();
        } else if (response.status === 401) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error cargando personas:', error);
        mostrarNotificacion('Error al cargar personas', 'danger');
    }
}

function actualizarSelectPersonas() {
    const selectRegistro = document.getElementById('registroPersona');
    const selectFiltro = document.getElementById('filtroPersona');
    
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
    document.getElementById('formPersona').reset();
    modalPersona.show();
}

async function guardarPersona() {
    const nombre = document.getElementById('personaNombre').value.trim();
    const apellido = document.getElementById('personaApellido').value.trim();
    const dni = document.getElementById('personaDni').value.trim();
    
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
            modalPersona.hide();
            cargarPersonas();
            cargarRegistros();
            mostrarNotificacion('Persona creada exitosamente', 'success');
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al crear persona', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al crear persona', 'danger');
    }
}

// Funciones de Registros
async function cargarRegistros() {
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    const personaId = document.getElementById('filtroPersona').value;
    
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (personaId) params.append('personaId', personaId);
    
    try {
        const response = await fetch(`/api/control-horas/registros?${params}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (response.ok) {
            registros = await response.json();
            renderizarTabla();
            actualizarEstadisticas();
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error cargando registros:', error);
        mostrarNotificacion('Error al cargar registros', 'danger');
    }
}

function renderizarTabla() {
    const tbody = document.getElementById('tablaRegistros');
    
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
    document.getElementById('formRegistro').reset();
    document.getElementById('registroFecha').value = moment().format('YYYY-MM-DD');
    modalRegistro.show();
}

async function guardarRegistro() {
    const personaId = document.getElementById('registroPersona').value;
    const tipo = document.getElementById('tipoRegistro').value;
    const fecha = document.getElementById('registroFecha').value;
    const hora = document.getElementById('registroHora').value;
    const esHoraExtra = document.getElementById('esHoraExtra').checked;
    
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
            modalRegistro.hide();
            cargarRegistros();
            mostrarNotificacion('Registro guardado exitosamente', 'success');
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al guardar registro', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al guardar registro', 'danger');
    }
}

async function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;
    
    document.getElementById('editarId').value = id;
    document.getElementById('editarHoraEntrada').value = registro.horaEntrada || '';
    document.getElementById('editarHoraSalida').value = registro.horaSalida || '';
    document.getElementById('editarHorasExtra').value = registro.horasExtra || 0;
    
    modalEditar.show();
}

async function actualizarRegistro() {
    const id = document.getElementById('editarId').value;
    const horaEntrada = document.getElementById('editarHoraEntrada').value;
    const horaSalida = document.getElementById('editarHoraSalida').value;
    const horasExtra = document.getElementById('editarHorasExtra').value;
    
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
            modalEditar.hide();
            cargarRegistros();
            mostrarNotificacion('Registro actualizado exitosamente', 'success');
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al actualizar registro', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar registro', 'danger');
    }
}

async function eliminarRegistro(id) {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    
    try {
        const response = await fetch(`/api/control-horas/registros/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            cargarRegistros();
            mostrarNotificacion('Registro eliminado exitosamente', 'success');
        } else {
            const error = await response.json();
            mostrarNotificacion(error.error || 'Error al eliminar registro', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar registro', 'danger');
    }
}

// Funciones auxiliares
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
    return moment(fecha).format('DD/MM/YYYY');
}

async function actualizarEstadisticas() {
    const hoy = moment().format('YYYY-MM-DD');
    
    try {
        const response = await fetch(`/api/control-horas/resumen/${hoy}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const resumen = await response.json();
            document.getElementById('presentesHoy').textContent = resumen.empleadosPresentes || 0;
            document.getElementById('horasTrabajadas').textContent = resumen.horasTotales || '0:00';
            document.getElementById('horasExtraTotal').textContent = resumen.horasExtra || '0:00';
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
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    const personaId = document.getElementById('filtroPersona').value;
    
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (personaId) params.append('personaId', personaId);
    
    const token = getAuthToken();
    window.location.href = `/api/control-horas/exportar?${params}&token=${token}`;
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
        alertDiv.remove();
    }, 5000);
}