// ==================== APP PRINCIPAL ==================== 
console.log('🚀 Iniciando Obra 360 App...');

// ==================== CONFIGURACIÓN GLOBAL ====================
window.Obra360 = {
  version: '1.0.0',
  debug: window.location.hostname === 'localhost',
  config: {
    api: {
      baseUrl: '/api',
      timeout: 10000
    },
    sidebar: {
      defaultCollapsed: false,
      mobileBreakpoint: 768
    }
  }
};

// ==================== SIDEBAR MANAGER ====================
class SidebarManager {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.sidebarToggle = document.getElementById('sidebarToggle');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.mainContent = document.getElementById('mainContent');
    
    this.isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    this.isMobile = window.innerWidth <= window.Obra360.config.sidebar.mobileBreakpoint;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.handleResize();
    this.restoreState();
    
    if (window.Obra360.debug) {
      console.log('✅ Sidebar Manager inicializado');
    }
  }

  bindEvents() {
    // Toggle button
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => this.toggle());
    }

    // Overlay click (mobile)
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => this.closeMobile());
    }

    // Window resize
    window.addEventListener('resize', () => this.handleResize());

    // Dropdown toggles
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-bs-toggle="collapse"]')) {
        e.preventDefault();
        this.toggleDropdown(e.target);
      }
    });
  }

  toggle() {
    if (this.isMobile) {
      this.toggleMobile();
    } else {
      this.toggleDesktop();
    }
  }

  toggleDesktop() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebar?.classList.toggle('collapsed', this.isCollapsed);
    this.mainContent?.classList.toggle('expanded', this.isCollapsed);
    
    // Guardar estado
    localStorage.setItem('sidebar-collapsed', this.isCollapsed);
    
    // Emitir evento
    window.dispatchEvent(new CustomEvent('sidebarToggled', {
      detail: { collapsed: this.isCollapsed, mobile: false }
    }));
  }

  toggleMobile() {
    const isOpen = this.sidebar?.classList.contains('show');
    
    this.sidebar?.classList.toggle('show', !isOpen);
    this.sidebarOverlay?.classList.toggle('show', !isOpen);
    
    // Emitir evento
    window.dispatchEvent(new CustomEvent('sidebarToggled', {
      detail: { collapsed: false, mobile: true, open: !isOpen }
    }));
  }

  closeMobile() {
    this.sidebar?.classList.remove('show');
    this.sidebarOverlay?.classList.remove('show');
  }

  toggleDropdown(trigger) {
    const target = document.querySelector(trigger.getAttribute('data-bs-target'));
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    
    // Toggle aria-expanded
    trigger.setAttribute('aria-expanded', !isExpanded);
    
    // Toggle collapse class
    target?.classList.toggle('show', !isExpanded);
    
    // Rotar icono
    const icon = trigger.querySelector('.dropdown-icon');
    if (icon) {
      icon.style.transform = !isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
    }
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= window.Obra360.config.sidebar.mobileBreakpoint;
    
    if (wasMobile !== this.isMobile) {
      // Cambio de modo
      if (!this.isMobile) {
        // Desktop mode
        this.sidebar?.classList.remove('show');
        this.sidebarOverlay?.classList.remove('show');
        this.restoreState();
      } else {
        // Mobile mode
        this.sidebar?.classList.remove('collapsed');
        this.mainContent?.classList.remove('expanded');
      }
    }
  }

  restoreState() {
    if (!this.isMobile && this.isCollapsed) {
      this.sidebar?.classList.add('collapsed');
      this.mainContent?.classList.add('expanded');
    }
  }

  // API pública
  collapse() {
    if (!this.isMobile && !this.isCollapsed) {
      this.toggleDesktop();
    }
  }

  expand() {
    if (!this.isMobile && this.isCollapsed) {
      this.toggleDesktop();
    }
  }
}

// ==================== API CLIENT ====================
class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.timeout = window.Obra360.config.api.timeout;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  get(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseUrl);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    return this.request(url.pathname + url.search);
  }

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// ==================== NOTIFICATION MANAGER ====================
class NotificationManager {
  constructor() {
    this.container = this.createContainer();
    this.sounds = {
      success: '/static/sounds/success.mp3',
      error: '/static/sounds/error.mp3',
      warning: '/static/sounds/warning.mp3',
      info: '/static/sounds/info.mp3'
    };
  }

  createContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'position-fixed top-0 end-0 p-3';
      container.style.zIndex = '1080';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', options = {}) {
    const notification = this.createNotification(message, type, options);
    this.container.appendChild(notification);

    // Auto dismiss
    const duration = options.duration || 5000;
    if (duration > 0) {
      setTimeout(() => this.dismiss(notification), duration);
    }

    // Play sound
    if (options.sound !== false) {
      this.playSound(type);
    }

    return notification;
  }

  createNotification(message, type, options) {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const icons = {
      success: 'bi-check-circle',
      error: 'bi-x-circle',
      warning: 'bi-exclamation-triangle',
      info: 'bi-info-circle'
    };

    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    notification.style.minWidth = '300px';
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi ${icons[type]} me-2"></i>
        <div class="flex-grow-1">
          <strong>${options.title || this.capitalizeFirst(type)}</strong>
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    // Bind close event
    const closeBtn = notification.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => this.dismiss(notification));

    return notification;
  }

  dismiss(notification) {
    if (notification && notification.parentNode) {
      notification.classList.add('fade');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 150);
    }
  }

  playSound(type) {
    if (this.sounds[type]) {
      const audio = new Audio(this.sounds[type]);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if sound can't play
      });
    }
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'danger', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }
}

// ==================== LOADING MANAGER ====================
class LoadingManager {
  constructor() {
    this.overlay = this.createOverlay();
    this.activeLoaders = new Set();
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-none';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '1090';
    overlay.innerHTML = `
      <div class="d-flex align-items-center justify-content-center h-100">
        <div class="text-center text-white">
          <div class="spinner-border mb-3" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <div id="loading-message">Cargando...</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  show(message = 'Cargando...', id = 'default') {
    this.activeLoaders.add(id);
    document.getElementById('loading-message').textContent = message;
    this.overlay.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }

  hide(id = 'default') {
    this.activeLoaders.delete(id);
    if (this.activeLoaders.size === 0) {
      this.overlay.classList.add('d-none');
      document.body.style.overflow = '';
    }
  }

  hideAll() {
    this.activeLoaders.clear();
    this.overlay.classList.add('d-none');
    document.body.style.overflow = '';
  }
}

// ==================== FORM HELPERS ====================
class FormHelpers {
  static validate(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        this.showFieldError(input, 'Este campo es obligatorio');
        isValid = false;
      } else {
        this.clearFieldError(input);
      }
    });

    return isValid;
  }

  static showFieldError(field, message) {
    this.clearFieldError(field);
    
    field.classList.add('is-invalid');
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    field.parentNode.appendChild(feedback);
  }

  static clearFieldError(field) {
    field.classList.remove('is-invalid');
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.remove();
    }
  }

  static serialize(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        // Multiple values for same key
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }
}

// ==================== UTILITIES ====================
const utils = {
  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Format currency
  formatCurrency(amount, currency = 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Format date
  formatDate(date, options = {}) {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(new Date(date));
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      window.Obra360.notification.success('Copiado al portapapeles');
      return true;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      window.Obra360.notification.error('Error al copiar');
      return false;
    }
  },

  // Generate UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 DOM Ready - Inicializando componentes...');

  try {
    // Inicializar managers
    window.Obra360.sidebar = new SidebarManager();
    window.Obra360.api = new ApiClient();
    window.Obra360.notification = new NotificationManager();
    window.Obra360.loading = new LoadingManager();
    window.Obra360.utils = utils;
    window.Obra360.FormHelpers = FormHelpers;

    // Configurar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configurar popovers de Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });

    console.log('✅ Obra 360 App inicializada correctamente');

    // Mostrar notificación de bienvenida en modo debug
    if (window.Obra360.debug) {
      setTimeout(() => {
        window.Obra360.notification.success('Obra 360 inicializada correctamente', {
          title: 'Debug Mode',
          duration: 3000
        });
      }, 1000);
    }

  } catch (error) {
    console.error('❌ Error inicializando app:', error);
    
    // Fallback notification
    const fallbackNotification = document.createElement('div');
    fallbackNotification.className = 'alert alert-danger position-fixed top-0 end-0 m-3';
    fallbackNotification.style.zIndex = '1080';
    fallbackNotification.innerHTML = `
      <strong>Error:</strong> No se pudo inicializar la aplicación.
      <button type="button" class="btn-close" onclick="this.parentNode.remove()"></button>
    `;
    document.body.appendChild(fallbackNotification);
  }
});

// ==================== GLOBAL ERROR HANDLER ====================
window.addEventListener('error', function(e) {
  console.error('❌ Error global:', e.error);
  
  if (window.Obra360?.notification) {
    window.Obra360.notification.error('Ha ocurrido un error inesperado', {
      title: 'Error',
      duration: 10000
    });
  }
});

// ==================== UNHANDLED PROMISE REJECTION ====================
window.addEventListener('unhandledrejection', function(e) {
  console.error('❌ Promise rejection:', e.reason);
  
  if (window.Obra360?.notification) {
    window.Obra360.notification.error('Error en operación asíncrona', {
      title: 'Error',
      duration: 8000
    });
  }
});

console.log('📚 App.js cargado correctamente');