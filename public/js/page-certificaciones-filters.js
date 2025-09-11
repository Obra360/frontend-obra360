// public/js/page-certificaciones-filters.js

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const buscarInput = document.getElementById('buscarInput');
    const filtroObra = document.getElementById('filtroObra');
    const filtroPeriodo = document.getElementById('filtroPeriodo');
    const certificacionesItems = document.querySelectorAll('#accordionCertificaciones .accordion-item');
    const emptyState = document.getElementById('empty-state');
    // asd

    function aplicarFiltros() {
        const busqueda = buscarInput.value.toLowerCase();
        const obra = filtroObra.value;
        const periodo = filtroPeriodo.value;
        let itemsVisibles = 0;

        certificacionesItems.forEach(item => {
            const textoBusqueda = item.dataset.textoBusqueda;
            const obraItem = item.dataset.obra;
            const fechaItem = item.dataset.fecha;

            // Comprobar cada filtro
            const coincideBusqueda = textoBusqueda.includes(busqueda);
            const coincideObra = obra === '' || obraItem === obra;
            
            let coincidePeriodo = true;
            if (periodo === 'hoy') {
                coincidePeriodo = moment(fechaItem).isSame(moment(), 'day');
            } else if (periodo === 'semana') {
                coincidePeriodo = moment(fechaItem).isSame(moment(), 'week');
            } else if (periodo === 'mes') {
                coincidePeriodo = moment(fechaItem).isSame(moment(), 'month');
            }

            // Mostrar u ocultar el item
            if (coincideBusqueda && coincideObra && coincidePeriodo) {
                item.style.display = 'block';
                itemsVisibles++;
            } else {
                item.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        if (emptyState) {
           emptyState.style.display = itemsVisibles === 0 ? 'block' : 'none';
        }
    }

    // Añadir listeners a los filtros
    buscarInput.addEventListener('input', aplicarFiltros);
    filtroObra.addEventListener('change', aplicarFiltros);
    filtroPeriodo.addEventListener('change', aplicarFiltros);
});