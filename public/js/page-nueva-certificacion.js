class NuevaCertificacionManager {
    constructor() {
        this.items = [];
        this.itemIdCounter = 0;
        this.form = document.getElementById('certificacionForm');
        this.hiddenInput = document.getElementById('itemsJsonInput');
        this.itemsContainer = document.getElementById('items-container');
        this.emptyState = document.getElementById('items-empty-state');

        this.init();
    }

    init() {
        this.setupEventListeners();
        // Ponemos la fecha de hoy por defecto
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
        console.log('✅ Nueva Certificación Manager inicializado');
    }

    setupEventListeners() {
        document.getElementById('agregarItemBtn').addEventListener('click', () => this.agregarItem());
        
        this.itemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('removeItemBtn')) {
                const itemId = e.target.closest('.item-row').dataset.itemId;
                this.eliminarItem(itemId);
            }
        });
        
        this.itemsContainer.addEventListener('input', () => this.actualizarResumen());

        this.form.addEventListener('submit', () => this.prepararEnvio());
    }

    agregarItem() {
        this.emptyState.style.display = 'none';
        const itemId = this.itemIdCounter++;
        const itemHTML = `
            <div class="row g-2 align-items-end mb-3 item-row" data-item-id="${itemId}">
              <div class="col-md-2"><label class="form-label small">Código *</label><input type="text" class="form-control form-control-sm item-codigo" required></div>
              <div class="col-md-3"><label class="form-label small">Descripción *</label><input type="text" class="form-control form-control-sm item-descripcion" required></div>
              <div class="col-md-2"><label class="form-label small">Unidad *</label><select class="form-select form-control-sm item-unidad" required><option value="">Unidad</option><option value="kg">kg</option><option value="m">m</option><option value="m2">m²</option><option value="m3">m³</option><option value="unidad">unidad</option><option value="litro">litro</option><option value="bolsa">bolsa</option><option value="paquete">paquete</option></select></div>
              <div class="col-md-2"><label class="form-label small">Cantidad *</label><input type="number" class="form-control form-control-sm item-cantidad" value="1" min="0" step="any" required></div>
              <div class="col-md-2"><label class="form-label small">Precio *</label><input type="number" class="form-control form-control-sm item-precio" value="0" min="0" step="any" required></div>
              <div class="col-md-1"><button type="button" class="btn btn-sm btn-outline-danger w-100 removeItemBtn">X</button></div>
            </div>`;
        this.itemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        this.actualizarResumen();
    }

    eliminarItem(itemId) {
        const itemRow = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
        if (itemRow) {
            itemRow.remove();
            if (this.itemsContainer.children.length === 0) {
                this.emptyState.style.display = 'block';
            }
        }
        this.actualizarResumen();
    }

    actualizarResumen() {
        let totalItems = 0;
        let totalUnidades = 0;
        let totalGeneral = 0;

        this.itemsContainer.querySelectorAll('.item-row').forEach(row => {
            totalItems++;
            const cantidad = parseFloat(row.querySelector('.item-cantidad').value) || 0;
            const precio = parseFloat(row.querySelector('.item-precio').value) || 0;
            totalUnidades += cantidad;
            totalGeneral += cantidad * precio;
        });

        document.getElementById('resumenItems').textContent = totalItems;
        document.getElementById('resumenUnidades').textContent = totalUnidades;
        document.getElementById('resumenTotal').textContent = `$${totalGeneral.toLocaleString('es-AR')}`;
    }

    prepararEnvio() {
        const items = [];
        this.itemsContainer.querySelectorAll('.item-row').forEach(row => {
            items.push({
                codigo: row.querySelector('.item-codigo').value,
                descripcion: row.querySelector('.item-descripcion').value,
                unidad: row.querySelector('.item-unidad').value, // ← NUEVO CAMPO
                cantidad: parseFloat(row.querySelector('.item-cantidad').value) || 0,
                precio: parseFloat(row.querySelector('.item-precio').value) || 0,
            });
        });
        this.hiddenInput.value = JSON.stringify(items);
    }
}

// Inicializar el manager
new NuevaCertificacionManager();
