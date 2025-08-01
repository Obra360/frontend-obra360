// /src/components/sidebar/sidebar.js
// Sidebar Manager mínimo para Obra 360

console.log('🔧 Cargando SidebarManager...');

class SidebarManager {
  constructor(config, userRole = 'ADMIN') {
    console.log('🚀 Inicializando SidebarManager con rol:', userRole);
    
    this.config = config;
    this.userRole = userRole;
    this.currentPath = window.location.pathname;
    this.isCollapsed = false;
    this.isMobile = window.innerWidth <= 768;
    
    // Elementos DOM
    this.sidebar = null;
    this.sidebarNav = null;
    this.sidebarToggle = null;
    this.sidebarOverlay = null;
    this.mainContent = null;
  }

  // Inicializar sidebar
  async init() {
    try {
      console.log('🔍 Buscando elementos DOM...');
      this.findElements();
      
      console.log('🎨 Renderizando menú...');
      this.renderMenu();
      
      console.log('🔗 Configurando eventos...');
      this.bindEvents();
      
      console.log('✨ Configurando estado activo...');
      this.setActiveMenu();
      
      console.log('📱 Configurando responsive...');
      this.handleResize();
      
      console.log('✅ Sidebar inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando sidebar:', error);
    }
  }

  // Encontrar elementos DOM
  findElements() {
    this.sidebar = document.getElementById('sidebar');
    this.sidebarNav = document.getElementById('sidebarNav');
    this.sidebarToggle = document.getElementById('sidebarToggle');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.mainContent = document.getElementById('mainContent');

    if (!this.sidebar) {
      throw new Error('❌ Elemento #sidebar no encontrado');
    }
    if (!this.sidebarNav) {
      throw new Error('❌ Elemento #sidebarNav no encontrado');
    }
    
    console.log('✅ Elementos DOM encontrados');
  }

  // Renderizar menú
  renderMenu() {
    const filteredItems = this.config.menuItems.filter(item => 
      !item.roles || item.roles.includes(this.userRole)
    );

    const menuHTML = filteredItems.map(item => {
      if (item.type === 'link') {
        return this.renderMenuItem(item);
      } else if (item.type === 'dropdown') {
        return this.renderDropdownItem(item);
      }
      return '';
    }).join('');

    this.sidebarNav.innerHTML = `
      <li class="sidebar-header">Secciones</li>
      ${menuHTML}
    `;
    
    console.log('✅ Menú renderizado');
  }

  // Renderizar item simple
  renderMenuItem(item) {
    const isActive = this.isActiveRoute(item.href, item.id);
    
    return `
      <li class="sidebar-item">
        <a href="${item.href}" 
           class="sidebar-link ${isActive ? 'active' : ''}" 
           data-page="${item.id}">
          <i class="${item.icon}"></i>
          <span>${item.label}</span>
          ${item.badge ? `<span class="badge-notification">${item.badge}</span>` : ''}
        </a>
      </li>
    `;
  }

  // Renderizar dropdown
  renderDropdownItem(item) {
    const filteredChildren = item.children?.filter(child => 
      !child.roles || child.roles.includes(this.userRole)
    ) || [];

    const childrenHTML = filteredChildren.map(child => {
      const isActive = this.isActiveRoute(child.href, child.id);
      return `
        <li class="sidebar-item">
          <a href="${child.href}" 
             class="sidebar-link ${isActive ? 'active' : ''}" 
             data-page="${child.id}">
            <span>${child.label}</span>
          </a>
        </li>
      `;
    }).join('');

    const dropdownId = `dropdown-${item.id}`;
    const hasActiveChild = filteredChildren.some(child => 
      this.isActiveRoute(child.href, child.id)
    );
    
    return `
      <li class="sidebar-item">
        <a class="sidebar-link ${hasActiveChild ? 'active' : ''}" 
           data-bs-toggle="collapse" 
           data-bs-target="#${dropdownId}" 
           aria-expanded="${hasActiveChild}"
           data-page="${item.id}">
          <i class="${item.icon}"></i>
          <span>${item.label}</span>
          ${item.badge ? `<span class="badge-notification">${item.badge}</span>` : ''}
          <i class="bi bi-chevron-right dropdown-icon"></i>
        </a>
        <ul class="sidebar-dropdown list-unstyled collapse ${hasActiveChild ? 'show' : ''}" 
            id="${dropdownId}">
          ${childrenHTML}
        </ul>
      </li>
    `;
  }

  // Verificar si ruta está activa
  isActiveRoute(href, pageId) {
    if (!href) return false;
    
    // Exact match
    if (this.currentPath === href) return true;
    
    // Page ID match
    if (this.currentPath.includes(pageId)) return true;
    
    return false;
  }

  // Configurar eventos
  bindEvents() {
    // Toggle sidebar
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }
    
    // Overlay click (mobile)
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());
    }
    
    // Window resize
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('✅ Eventos configurados');
  }

  // Toggle sidebar
  toggleSidebar() {
    if (this.isMobile) {
      this.sidebar.classList.toggle('show');
      if (this.sidebarOverlay) {
        this.sidebarOverlay.classList.toggle('show');
      }
    } else {
      this.isCollapsed = !this.isCollapsed;
      this.sidebar.classList.toggle('collapsed', this.isCollapsed);
      if (this.mainContent) {
        this.mainContent.classList.toggle('expanded', this.isCollapsed);
      }
    }
    
    console.log('🔄 Sidebar toggle:', this.isMobile ? 'mobile' : 'desktop');
  }

  // Cerrar sidebar mobile
  closeMobileSidebar() {
    this.sidebar.classList.remove('show');
    if (this.sidebarOverlay) {
      this.sidebarOverlay.classList.remove('show');
    }
  }

  // Handle resize
  handleResize() {
    this.isMobile = window.innerWidth <= 768;
    
    if (!this.isMobile) {
      this.sidebar.classList.remove('show');
      if (this.sidebarOverlay) {
        this.sidebarOverlay.classList.remove('show');
      }
    }
  }

  // Establecer menú activo
  setActiveMenu() {
    // Buscar el link activo
    const allLinks = this.sidebarNav.querySelectorAll('.sidebar-link[data-page]');
    let activeFound = false;
    
    allLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Buscar coincidencia
    for (const link of allLinks) {
      const href = link.getAttribute('href');
      const page = link.getAttribute('data-page');
      
      if (this.isActiveRoute(href, page)) {
        this.setActiveLink(link);
        activeFound = true;
        break;
      }
    }

    // Si no hay coincidencia, activar "inicio"
    if (!activeFound) {
      const inicioLink = this.sidebarNav.querySelector('[data-page="inicio"]');
      if (inicioLink) {
        this.setActiveLink(inicioLink);
      }
    }
    
    console.log('✅ Estado activo configurado');
  }

  // Establecer link activo
  setActiveLink(link) {
    // Remover activo de todos
    this.sidebarNav.querySelectorAll('.sidebar-link').forEach(l => {
      l.classList.remove('active');
    });

    // Activar el link
    link.classList.add('active');

    // Si es un child dropdown, activar parent
    const parentDropdown = link.closest('.sidebar-dropdown');
    if (parentDropdown) {
      const parentLink = parentDropdown.previousElementSibling;
      if (parentLink) {
        parentLink.classList.add('active');
        parentLink.setAttribute('aria-expanded', 'true');
      }
      parentDropdown.classList.add('show');
    }
  }

  // Actualizar badge
  updateBadge(menuId, badgeText) {
    const menuItem = this.config.menuItems.find(item => item.id === menuId);
    if (menuItem) {
      menuItem.badge = badgeText;
      this.renderMenu();
      this.setActiveMenu();
      console.log(`📍 Badge actualizado: ${menuId} = ${badgeText}`);
    }
  }

  // Cambiar rol de usuario
  setUserRole(newRole) {
    this.userRole = newRole;
    this.renderMenu();
    this.setActiveMenu();
    console.log(`👤 Rol actualizado: ${newRole}`);
  }

  // Eventos personalizados
  on(eventName, callback) {
    document.addEventListener(eventName, callback);
  }

  off(eventName, callback) {
    document.removeEventListener(eventName, callback);
  }
}

// Hacer disponible globalmente
window.SidebarManager = SidebarManager;

console.log('✅ SidebarManager definido globalmente');