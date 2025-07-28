// auth.js - Sistema de autenticación para Obra360
const AUTH_TOKEN_KEY = 'obra360_token';
const AUTH_USER_KEY = 'obra360_user';

// Configuración de la API
const API_BASE_URL = 'mature-romona-obra360-e2712968.koyeb.app/'; // Ajusta según tu backend

// Clase principal para manejar autenticación
class AuthManager {
    constructor() {
        this.token = this.getToken();
        this.user = this.getUser();
        this.initializeAuth();
    }

    // Inicializar el sistema de autenticación
    initializeAuth() {
        // Verificar token al cargar la página
        if (this.token) {
            this.setAuthHeaders();
            this.verifyToken();
        } else {
            this.redirectToLogin();
        }

        // Interceptar todas las peticiones fetch
        this.setupFetchInterceptor();
    }

    // Obtener token del localStorage
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }

    // Obtener usuario del localStorage
    getUser() {
        const userStr = localStorage.getItem(AUTH_USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Guardar token y usuario
    setAuth(token, user) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        this.token = token;
        this.user = user;
        this.setAuthHeaders();
    }

    // Limpiar autenticación
    clearAuth() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        this.token = null;
        this.user = null;
    }

    // Configurar headers de autorización para fetch
    setAuthHeaders() {
        // Configurar axios si lo usas
        if (window.axios) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        }
    }

    // Verificar si el token es válido
    async verifyToken() {
        try {
            const response = await this.authenticatedFetch(`${API_BASE_URL}/auth/verify`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            return true;
        } catch (error) {
            console.error('Error verificando token:', error);
            this.handleAuthError();
            return false;
        }
    }

    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                this.setAuth(data.token, data.user);
                return { success: true, data };
            } else {
                return { 
                    success: false, 
                    error: data.message || 'Error en el login' 
                };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { 
                success: false, 
                error: 'Error de conexión' 
            };
        }
    }

    // Logout
    logout() {
        this.clearAuth();
        window.location.href = './login.html';
    }

    // Manejar errores de autenticación
    handleAuthError() {
        this.clearAuth();
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        this.redirectToLogin();
    }

    // Redireccionar al login si no está autenticado
    redirectToLogin() {
        const currentPath = window.location.pathname;
        const publicPaths = ['./login.html', '/register.html', '/forgot-password.html'];
        
        if (!publicPaths.includes(currentPath)) {
            window.location.href = './login.html';
        }
    }

    // Fetch autenticado - wrapper para incluir token
    async authenticatedFetch(url, options = {}) {
        if (!this.token) {
            this.redirectToLogin();
            throw new Error('No autorizado');
        }

        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(url, authOptions);

        // Si el token expiró o es inválido
        if (response.status === 401) {
            this.handleAuthError();
            throw new Error('Token expirado');
        }

        return response;
    }

    // Configurar interceptor global para fetch
    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        const authManager = this;

        window.fetch = function(...args) {
            let [url, options = {}] = args;

            // Solo interceptar llamadas a la API
            if (url.includes(API_BASE_URL)) {
                // Agregar token si existe
                if (authManager.token) {
                    options.headers = {
                        ...options.headers,
                        'Authorization': `Bearer ${authManager.token}`
                    };
                }
            }

            return originalFetch.apply(this, [url, options])
                .then(response => {
                    // Manejar respuestas 401
                    if (response.status === 401 && url.includes(API_BASE_URL)) {
                        authManager.handleAuthError();
                    }
                    return response;
                });
        };
    }

    // Verificar si el usuario tiene un rol específico
    hasRole(role) {
        return this.user && this.user.role === role;
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.token;
    }
}

// Crear instancia global
const authManager = new AuthManager();

// Exportar para uso en otros archivos
window.authManager = authManager;

// Funciones de utilidad para usar en el HTML
window.authUtils = {
    // Verificar autenticación antes de realizar acciones
    requireAuth: function(callback) {
        if (authManager.isAuthenticated()) {
            callback();
        } else {
            alert('Debes iniciar sesión para realizar esta acción');
            authManager.redirectToLogin();
        }
    },

    // Hacer peticiones autenticadas
    apiRequest: async function(endpoint, options = {}) {
        try {
            const response = await authManager.authenticatedFetch(
                `${API_BASE_URL}${endpoint}`, 
                options
            );
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            } else {
                return { 
                    success: false, 
                    error: data.message || 'Error en la petición' 
                };
            }
        } catch (error) {
            console.error('Error en apiRequest:', error);
            return { 
                success: false, 
                error: error.message || 'Error de conexión' 
            };
        }
    },

    // Verificar rol de administrador
    isAdmin: function() {
        return authManager.hasRole('admin');
    },

    // Obtener información del usuario actual
    getCurrentUser: function() {
        return authManager.user;
    },

    // Logout
    logout: function() {
        authManager.logout();
    }
};

// Auto-inicializar en páginas protegidas
document.addEventListener('DOMContentLoaded', function() {
    const publicPages = ['./login.html', 'register.html', 'forgot-password.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!publicPages.includes(currentPage) && !authManager.isAuthenticated()) {
        authManager.redirectToLogin();
    }
});