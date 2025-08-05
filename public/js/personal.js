// public/js/personal.js - Gestión de Personal

class PersonalManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModals();
        this.showSuccessMessage();
    }

    setupEventListeners() {
        // Búsqueda en tiempo real
        const buscarInput = document.getElementById('buscarInput');
        if (buscarInput) {
            buscarInput.addEventListener('input', () => this.filtrarUsuarios());
        }

        // Filtro por rol
        const filtroRol = document.getElementById('filtroRol');
        if (filtroRol) {
            filtroRol.addEventListener('change', () => this.filtrarUsuarios());
        }

        // Guardar cambios del usuario editado
        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', () => this.guardarCambiosUsuario());
        }
    }

    setupModals() {
        // Modal de edición - toggle de contraseña
        const changePasswordCheck = document.getElementById('changePassword');
        const passwordSection = document.getElementById('passwordSection');
        const editPassword = document.getElementById('editPassword');

        if (changePasswordCheck && passwordSection && editPassword) {
            changePasswordCheck.addEventListener('change', function() {
                if (this.checked) {
                    passwordSection.style.display = 'block';
                    editPassword.setAttribute('required', 'required');
                } else {
                    passwordSection.style.display = 'none';
                    editPassword.removeAttribute('required');
                    editPassword.value = '';
                }
            });
        }

        // Validación en tiempo real
        const editInputs = document.querySelectorAll('#editUserForm input, #editUserForm select');
        editInputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validarInput(e));
            input.addEventListener('input', (e) => this.limpiarValidacion(e));
        });
    }

    showSuccessMessage() {
        // Mostrar mensaje de éxito si viene en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const successMessage = urlParams.get('success');
        
        if (successMessage) {
            this.mostrarAlerta(successMessage, 'success');
            // Limpiar la URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    filtrarUsuarios() {
        const buscarTexto = document.getElementById('buscarInput').value.toLowerCase().trim();
        const filtroRol = document.getElementById('filtroRol').value;
        const filas = document.querySelectorAll('.personal-row');
        const emptyState = document.getElementById('empty-state');
        let filasVisibles = 0;

        filas.forEach(fila => {
            const textoBusqueda = fila.dataset.textoBusqueda;
            const rolUsuario = fila.dataset.rol;

            // Filtro de texto
            const coincideTexto = !buscarTexto || textoBusqueda.includes(buscarTexto);
            
            // Filtro de rol
            const coincideRol = !filtroRol || rolUsuario === filtroRol;

            // Mostrar/ocultar fila
            if (coincideTexto && coincideRol) {
                fila.style.display = '';
                filasVisibles++;
            } else {
                fila.style.display = 'none';
            }
        });

        // Mostrar/ocultar estado vacío
        if (emptyState) {
            emptyState.style.display = filasVisibles === 0 ? 'block' : 'none';
        }
    }

    async editarUsuario(userId) {
        try {
            console.log('🔄 Cargando datos del usuario:', userId);

            const response = await fetch(`/personal/editar/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Error al cargar el usuario');
            }

            const { usuario, rolesDisponibles } = result;

            // Llenar el formulario
            document.getElementById('editUserId').value = usuario.id;
            document.getElementById('editFirstName').value = usuario.firstName || '';
            document.getElementById('editLastName').value = usuario.lastName || '';
            document.getElementById('editEmail').value = usuario.email || '';

            // Llenar el select de roles
            const editRoleSelect = document.getElementById('editRole');
            editRoleSelect.innerHTML = '<option value="">Seleccionar rol</option>';
            rolesDisponibles.forEach(rol => {
                const option = document.createElement('option');
                option.value = rol.value;
                option.textContent = rol.name;
                option.selected = usuario.role === rol.value;
                editRoleSelect.appendChild(option);
            });

            // Reset del formulario
            this.resetearFormularioEdicion();

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('editModal'));
            modal.show();

        } catch (error) {
            console.error('❌ Error al cargar usuario:', error);
            this.mostrarAlerta(error.message, 'danger');
        }
    }

    resetearFormularioEdicion() {
        // Limpiar validaciones
        const form = document.getElementById('editUserForm');
        const inputs = form.querySelectorAll('.form-control, .form-select');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });

        // Reset contraseña
        document.getElementById('changePassword').checked = false;
        document.getElementById('passwordSection').style.display = 'none';
        document.getElementById('editPassword').removeAttribute('required');
        document.getElementById('editPassword').value = '';

        // Limpiar alertas del modal
        document.getElementById('editAlertContainer').innerHTML = '';
    }

    async guardarCambiosUsuario() {
        const saveBtn = document.getElementById('saveUserBtn');
        const originalText = saveBtn.innerHTML;

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i>Guardando...';

            // Validar formulario
            if (!this.validarFormularioEdicion()) {
                return;
            }

            const userId = document.getElementById('editUserId').value;
            const changePassword = document.getElementById('changePassword').checked;

            // Preparar datos
            const userData = {
                firstName: document.getElementById('editFirstName').value.trim(),
                lastName: document.getElementById('editLastName').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                role: document.getElementById('editRole').value
            };

            // Agregar contraseña si se va a cambiar
            if (changePassword) {
                const password = document.getElementById('editPassword').value;
                if (password) {
                    userData.password = password;
                }
            }

            console.log('💾 Guardando cambios:', userData);

            const response = await fetch(`/personal/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                this.mostrarAlertaModal('Usuario actualizado correctamente', 'success');
                
                // Cerrar modal y recargar página
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                    modal.hide();
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error(result.error || 'Error al actualizar usuario');
            }

        } catch (error) {
            console.error('❌ Error al guardar:', error);
            this.mostrarAlertaModal(error.message, 'danger');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    validarFormularioEdicion() {
        const requiredFields = [
            { id: 'editFirstName', name: 'Nombre' },
            { id: 'editLastName', name: 'Apellido' },
            { id: 'editEmail', name: 'Email' },
            { id: 'editRole', name: 'Rol' }
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

        // Validar email
        const emailInput = document.getElementById('editEmail');
        if (emailInput && emailInput.value && !this.isValidEmail(emailInput.value)) {
            this.setInputValidation(emailInput, false, 'Ingrese un email válido');
            isValid = false;
        }

        // Validar contraseña si se va a cambiar
        const changePassword = document.getElementById('changePassword').checked;
        if (changePassword) {
            const passwordInput = document.getElementById('editPassword');
            if (passwordInput && (!passwordInput.value || passwordInput.value.length < 8)) {
                this.setInputValidation(passwordInput, false, 'La contraseña debe tener al menos 8 caracteres');
                isValid = false;
            }
        }

        if (!isValid) {
            this.mostrarAlertaModal('Por favor complete todos los campos correctamente', 'warning');
        }

        return isValid;
    }

    confirmarEliminar(userId, userName) {
        console.log('🗑️ Confirmando eliminación:', userId, userName);
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        document.getElementById('deleteUserName').textContent = userName;
        
        // Limpiar listeners previos
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Agregar nuevo listener
        newConfirmBtn.addEventListener('click', () => this.eliminarUsuario(userId, modal));
        
        modal.show();
    }

    async eliminarUsuario(userId, modal) {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const originalText = confirmBtn.innerHTML;

        try {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i>Eliminando...';

            const response = await fetch(`/personal/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.mostrarAlerta('Usuario eliminado correctamente', 'success');
                modal.hide();
                
                // Remover la fila de la tabla
                const fila = document.querySelector(`tr[data-user-id="${userId}"]`);
                if (fila) {
                    fila.remove();
                }
                
                // Recargar página para actualizar
                setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error(result.error || 'Error al eliminar usuario');
            }

        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            this.mostrarAlerta(error.message, 'danger');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalText;
        }
    }

    // Funciones de utilidad
    validarInput(event) {
        const input = event.target;
        const value = input.value.trim();

        if (input.hasAttribute('required') && !value) {
            this.setInputValidation(input, false, 'Este campo es requerido');
        } else if (input.type === 'email' && value && !this.isValidEmail(value)) {
            this.setInputValidation(input, false, 'Ingrese un email válido');
        } else if (input.type === 'password' && value && value.length < 8) {
            this.setInputValidation(input, false, 'La contraseña debe tener al menos 8 caracteres');
        } else {
            this.setInputValidation(input, true);
        }
    }

    limpiarValidacion(event) {
        const input = event.target;
        input.classList.remove('is-invalid', 'is-valid');
    }

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

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    mostrarAlerta(message, type = 'info') {
        // Crear alerta en la parte superior de la página
        const alertContainer = document.createElement('div');
        alertContainer.className = 'position-fixed top-0 start-50 translate-middle-x mt-3';
        alertContainer.style.zIndex = '9999';

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

        alertContainer.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show shadow" role="alert">
                <i class="bi ${alertIcon} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(alertContainer);

        // Auto-remover después de 4 segundos
        setTimeout(() => {
            if (alertContainer && alertContainer.parentNode) {
                alertContainer.remove();
            }
        }, 4000);
    }

    mostrarAlertaModal(message, type = 'info') {
        const alertContainer = document.getElementById('editAlertContainer');
        if (!alertContainer) return;

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

        alertContainer.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="bi ${alertIcon} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    refreshUserList() {
        window.location.reload();
    }
}

// Funciones globales para los onclick en el HTML
window.editarUsuario = function(userId) {
    window.personalManager.editarUsuario(userId);
};

window.confirmarEliminar = function(userId, userName) {
    window.personalManager.confirmarEliminar(userId, userName);
};

window.refreshUserList = function() {
    window.personalManager.refreshUserList();
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.personalManager = new PersonalManager();
});