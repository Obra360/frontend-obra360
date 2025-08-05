// helpers/ejs-helpers.js
// Helpers personalizados para EJS

// Storage para contenido de secciones
const contentSections = {};

/**
 * Helper para definir contenido en secciones
 * Uso: <%- contentFor('sectionName') %>content<%- contentFor('sectionName') %>
 */
function contentFor(sectionName) {
  if (!contentSections[sectionName]) {
    contentSections[sectionName] = [];
  }
  
  // Si se llama sin contenido, devolver el contenido acumulado
  if (arguments.length === 1) {
    return contentSections[sectionName].join('\n');
  }
  
  // Función para capturar contenido
  return {
    capture: function(content) {
      contentSections[sectionName].push(content);
      return '';
    }
  };
}

/**
 * Helper para renderizar parciales con contexto
 */
function renderPartial(path, locals = {}) {
  // En un entorno real, esto se manejaría con include()
  // Este es un placeholder para el concepto
  return `<%- include('${path}', ${JSON.stringify(locals)}) %>`;
}

/**
 * Helper para generar clases CSS condicionales
 */
function classNames(...classes) {
  return classes
    .filter(Boolean)
    .join(' ');
}

/**
 * Helper para formatear fechas en español
 */
function formatDate(date, format = 'long') {
  const options = {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    }
  };
  
  return new Intl.DateTimeFormat('es-AR', options[format] || options.long)
    .format(new Date(date));
}

/**
 * Helper para formatear moneda argentina
 */
function formatCurrency(amount, showCurrency = true) {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'ARS',
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
}

/**
 * Helper para truncar texto
 */
function truncate(text, length = 100, suffix = '...') {
  if (!text || text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
}

/**
 * Helper para pluralizar palabras en español
 */
function pluralize(count, singular, plural) {
  if (!plural) {
    // Reglas básicas de pluralización en español
    if (singular.endsWith('s') || singular.endsWith('x')) {
      plural = singular;
    } else if (singular.endsWith('z')) {
      plural = singular.slice(0, -1) + 'ces';
    } else if (singular.endsWith('í') || singular.endsWith('ú')) {
      plural = singular + 'es';
    } else if (singular.endsWith('vocal')) {
      plural = singular + 's';
    } else {
      plural = singular + 'es';
    }
  }
  
  return count === 1 ? singular : plural;
}

/**
 * Helper para generar avatares con iniciales
 */
function avatar(name, size = 40) {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  const colors = [
    'bg-primary', 'bg-success', 'bg-info', 'bg-warning', 
    'bg-danger', 'bg-secondary', 'bg-dark'
  ];
  
  const colorIndex = name.length % colors.length;
  const color = colors[colorIndex];
  
  return `
    <div class="avatar ${color} d-inline-flex align-items-center justify-content-center text-white rounded-circle" 
         style="width: ${size}px; height: ${size}px; font-size: ${size * 0.4}px;">
      ${initials}
    </div>
  `;
}

/**
 * Helper para badges de estado
 */
function statusBadge(status, type = 'badge') {
  const statusMap = {
    active: { class: 'success', text: 'Activo' },
    inactive: { class: 'secondary', text: 'Inactivo' },
    pending: { class: 'warning', text: 'Pendiente' },
    completed: { class: 'success', text: 'Completado' },
    cancelled: { class: 'danger', text: 'Cancelado' },
    in_progress: { class: 'info', text: 'En Progreso' },
    draft: { class: 'secondary', text: 'Borrador' }
  };
  
  const config = statusMap[status] || { class: 'secondary', text: status };
  
  if (type === 'badge') {
    return `<span class="badge bg-${config.class}">${config.text}</span>`;
  } else if (type === 'dot') {
    return `
      <span class="d-inline-flex align-items-center">
        <span class="badge bg-${config.class} rounded-pill me-1" style="width: 8px; height: 8px;"></span>
        ${config.text}
      </span>
    `;
  }
  
  return config.text;
}

/**
 * Helper para iconos con contexto
 */
function icon(name, size = 16, className = '') {
  return `<i class="bi bi-${name} ${className}" style="font-size: ${size}px;"></i>`;
}

/**
 * Helper para números con separadores de miles
 */
function formatNumber(number, decimals = 0) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

/**
 * Helper para generar breadcrumbs
 */
function breadcrumb(items) {
  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    
    if (isLast) {
      return `<li class="breadcrumb-item active" aria-current="page">${item.text}</li>`;
    } else {
      return `<li class="breadcrumb-item"><a href="${item.href}">${item.text}</a></li>`;
    }
  }).join('');
  
  return `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        ${breadcrumbItems}
      </ol>
    </nav>
  `;
}

/**
 * Helper para alertas
 */
function alert(message, type = 'info', dismissible = true) {
  const dismissibleClass = dismissible ? 'alert-dismissible' : '';
  const dismissButton = dismissible ? 
    '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' : '';
  
  return `
    <div class="alert alert-${type} ${dismissibleClass}" role="alert">
      ${message}
      ${dismissButton}
    </div>
  `;
}

/**
 * Función para limpiar las secciones de contenido (usar entre requests)
 */
function clearContentSections() {
  Object.keys(contentSections).forEach(key => {
    contentSections[key] = [];
  });
}

module.exports = {
  contentFor,
  renderPartial,
  classNames,
  formatDate,
  formatCurrency,
  truncate,
  pluralize,
  avatar,
  statusBadge,
  icon,
  formatNumber,
  breadcrumb,
  alert,
  clearContentSections
};