// public/js/page-certificaciones.js

document.addEventListener('DOMContentLoaded', function() {
    // Obtenemos los datos iniciales que el servidor nos pasó
    const todasLasCertificaciones = <%- JSON.stringify(certificaciones) %>;
    
    // Elementos del DOM
    const container = document.getElementById('certificaciones-container');
    const resumenBody = document.getElementById('resumen-obras-tbody');
    const emptyState = document.getElementById('empty-state');
    const buscarInput = document.getElementById('buscarInput');
    const filtroObra = document.getElementById('filtroObra');
    const filtroPeriodo = document.getElementById('filtroPeriodo');
    
    // --- LÓGICA DE RENDERIZADO ---

    function renderCertificaciones(certificaciones) {
        container.innerHTML = ''; // Limpiamos el contenedor
        if (certificaciones.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        certificaciones.forEach(cert => {
            const certHTML = `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${cert.id}">
                            <div class="w-100 d-flex justify-content-between align-items-center pe-3">
                                <div>
                                    <i class="bi bi-geo-alt-fill text-primary me-2"></i>
                                    <strong>${cert.obraNombre}</strong> - ${cert.tipo}
                                </div>
                                <span class="fw-bold text-success fs-5">$${cert.monto.toLocaleString('es-AR')}</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse-${cert.id}" class="accordion-collapse collapse" data-bs-parent="#certificaciones-container">
                        <div class="accordion-body">
                           <p class="text-muted"><small>Certificado el ${moment(cert.fecha).format('DD [de] MMMM, YYYY')}</small></p>
                            <table class="table table-sm">
                                <thead class="table-light"><tr><th>Código</th><th>Descripción</th><th class="text-end">Subtotal</th></tr></thead>
                                <tbody>
                                    ${cert.items.map(item => `
                                        <tr>
                                            <td><code>${item.codigo}</code></td>
                                            <td>${item.descripcion}</td>
                                            <td class="text-end fw-bold">$${item.subtotal.toLocaleString('es-AR')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += certHTML;
        });
    }

    function renderResumen(certificaciones) {
        resumenBody.innerHTML = '';
        const totalGeneral = certificaciones.reduce((sum, cert) => sum + cert.monto, 0);

        const resumenPorObra = certificaciones.reduce((acc, cert) => {
            if (!acc[cert.obraNombre]) {
                acc[cert.obraNombre] = { cantidad: 0, total: 0 };
            }
            acc[cert.obraNombre].cantidad++;
            acc[cert.obraNombre].total += cert.monto;
            return acc;
        }, {});

        for (const obra in resumenPorObra) {
            const { cantidad, total } = resumenPorObra[obra];
            const porcentaje = totalGeneral > 0 ? (total / totalGeneral) * 100 : 0;
            const filaHTML = `
                <tr>
                    <td>${obra}</td>
                    <td>${cantidad}</td>
                    <td>$${total.toLocaleString('es-AR')}</td>
                    <td>
                        <div class="progress"><div class="progress-bar" style="width: ${porcentaje.toFixed(1)}%"></div></div>
                        <small>${porcentaje.toFixed(1)}%</small>
                    </td>
                </tr>
            `;
            resumenBody.innerHTML += filaHTML;
        }
    }

    function popularFiltroObras(certificaciones) {
        const obrasUnicas = [...new Set(certificaciones.map(cert => cert.obraNombre))];
        obrasUnicas.forEach(obra => {
            filtroObra.innerHTML += `<option value="${obra}">${obra}</option>`;
        });
    }
    
    // --- LÓGICA DE FILTRADO ---

    function aplicarFiltros() {
        const busqueda = buscarInput.value.toLowerCase();
        const obra = filtroObra.value;
        const periodo = filtroPeriodo.value;

        let certificacionesFiltradas = todasLasCertificaciones.filter(cert => {
            // Filtro por búsqueda de texto
            const coincideBusqueda = busqueda === '' || 
                                     cert.obraNombre.toLowerCase().includes(busqueda) ||
                                     cert.tipo.toLowerCase().includes(busqueda);

            // Filtro por obra
            const coincideObra = obra === '' || cert.obraNombre === obra;

            // Filtro por período
            let coincidePeriodo = true;
            if (periodo === 'hoy') {
                coincidePeriodo = moment(cert.fecha).isSame(moment(), 'day');
            } else if (periodo === 'semana') {
                coincidePeriodo = moment(cert.fecha).isSame(moment(), 'week');
            } else if (periodo === 'mes') {
                coincidePeriodo = moment(cert.fecha).isSame(moment(), 'month');
            }
            
            return coincideBusqueda && coincideObra && coincidePeriodo;
        });

        renderCertificaciones(certificacionesFiltradas);
        renderResumen(certificacionesFiltradas);
    }

    // --- INICIALIZACIÓN ---
    
    // Añadimos listeners a los filtros
    buscarInput.addEventListener('input', aplicarFiltros);
    filtroObra.addEventListener('change', aplicarFiltros);
    filtroPeriodo.addEventListener('change', aplicarFiltros);
    
    // Carga inicial de datos
    popularFiltroObras(todasLasCertificaciones);
    renderCertificaciones(todasLasCertificaciones);
    renderResumen(todasLasCertificaciones);
});