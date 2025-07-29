// /src/js/dashboard.js - Dashboard dinámico para Obra360
class DashboardManager {
  constructor() {
    this.baseURL = 'https://mature-romona-obra360-e2712968.koyeb.app/api';
    this.charts = {};
    this.init();
  }

  async init() {
    // Verificar autenticación
    if (!window.authManager || !window.authManager.isAuthenticated()) {
      window.location.href = '/html/auth/login.html';
      return;
    }

    this.setupUserInfo();
    this.setupDateTime();
    await this.loadDashboardData();
    this.setupCharts();
    this.setupNotifications();
  }

  // Configurar información del usuario
  setupUserInfo() {
    const user = window.authManager.getUser();
    if (user) {
      const welcomeMsg = document.getElementById('welcomeMessage');
      const userName = document.getElementById('userName');
      
      if (welcomeMsg) {
        const hora = new Date().getHours();
        let saludo = 'Buen día';
        if (hora >= 12 && hora < 18) saludo = 'Buenas tardes';
        if (hora >= 18) saludo = 'Buenas noches';
        
        welcomeMsg.textContent = `${saludo}, ${user.firstName || user.email}!`;
      }
      
      if (userName) {
        userName.textContent = `${user.firstName} ${user.lastName}` || user.email;
      }
    }
  }

  // Configurar fecha y hora
  setupDateTime() {
    const dateMsg = document.getElementById('dateMessage');
    if (dateMsg) {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      dateMsg.textContent = `Hoy es ${now.toLocaleDateString('es-ES', options)}`;
    }
  }

  // Cargar datos principales del dashboard
  async loadDashboardData() {
    try {
      // Cargar obras y estadísticas en paralelo
      const [obrasData, statsData] = await Promise.all([
        this.loadObras(),
        this.loadStats()
      ]);

      this.updateKPIs(obrasData, statsData);
      this.displayRecentObras(obrasData);
      this.setupAlertas(obrasData);
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      this.showError('Error al cargar los datos del dashboard');
    }
  }

  // Cargar obras desde la API
  async loadObras() {
    try {
      const result = await window.authUtils.apiRequest('/api/obras');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error cargando obras:', error);
      return [];
    }
  }

  // Cargar estadísticas (si está disponible)
  async loadStats() {
    try {
      const result = await window.authUtils.apiRequest('/api/obras/stats/general');
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      return null;
    }
  }

  // Actualizar KPIs principales
  updateKPIs(obras, stats) {
    // Total de obras
    const totalObras = document.getElementById('totalObras');
    if (totalObras) {
      totalObras.textContent = obras.length;
    }

    // Obras activas (simulado - puedes agregar campo 'estado' a tu modelo)
    const obrasActivas = document.getElementById('obrasActivas');
    if (obrasActivas) {
      obrasActivas.textContent = obras.length; // Por ahora todas están "activas"
    }

    // Tendencia de obras
    const tendencia = document.getElementById('obrasTendencia');
    if (tendencia) {
      const obrasRecientes = obras.filter(obra => {
        const fechaObra = new Date(obra.createdAt);
        const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return fechaObra > hace30Dias;
      });
      tendencia.textContent = `+${obrasRecientes.length} este mes`;
    }

    // Inversión total (simulado basado en artículos)
    const inversionTotal = document.getElementById('inversionTotal');
    if (inversionTotal) {
      let total = 0;
      obras.forEach(obra => {
        if (obra.articulos) {
          obra.articulos.forEach(articulo => {
            total += articulo.precio * articulo.Cantidad;
          });
        }
      });
      inversionTotal.textContent = `$${total.toLocaleString()}`;
    }

    // Certificaciones (placeholder)
    const totalCert = document.getElementById('totalCertificaciones');
    if (totalCert) {
      totalCert.textContent = Math.floor(Math.random() * 20) + 5; // Simulado
    }
  }

  // Mostrar obras recientes
  displayRecentObras(obras) {
    const loader = document.getElementById('obrasRecientesLoader');
    const list = document.getElementById('obrasRecientesList');
    const empty = document.getElementById('obrasRecientesEmpty');

    if (loader) loader.style.display = 'none';

    if (!obras || obras.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }

    if (list) {
      list.style.display = 'block';
      
      // Mostrar las 5 obras más recientes
      const obrasRecientes = obras
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      list.innerHTML = obrasRecientes.map(obra => `
        <div class="d-flex align-items-center py-2 border-bottom">
          <div class="me-3">
            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
              <i class="bi bi-building text-white"></i>
            </div>
          </div>
          <div class="flex-grow-1">
            <h6 class="mb-0">${obra.empresa}</h6>
            <small class="text-muted">
              <i class="bi bi-geo-alt me-1"></i>${obra.ciudad} • 
              <i class="bi bi-hammer me-1"></i>${obra.tipo}
            </small>
          </div>
          <div class="text-end">
            <small class="text-muted">${this.formatDate(obra.createdAt)}</small>
            <div>
              <a href="/html/obras/obras.html" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-eye"></i>
              </a>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // Configurar gráficos
  setupCharts() {
    this.setupObrasMonthlyChart();
    this.setupObrasTipoChart();
  }

  // Gráfico de obras por mes
  async setupObrasMonthlyChart() {
    const ctx = document.getElementById('chartObrasMonthly');
    if (!ctx) return;

    try {
      const obras = await this.loadObras();
      
      // Procesar datos por mes
      const monthlyData = this.processMonthlyData(obras);

      this.charts.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          datasets: [{
            label: 'Obras',
            data: monthlyData,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creando gráfico de tipos:', error);
    }
  }

  // Procesar datos mensuales
  processMonthlyData(obras) {
    const monthlyCount = new Array(12).fill(0);
    
    obras.forEach(obra => {
      const fecha = new Date(obra.createdAt);
      const mes = fecha.getMonth();
      monthlyCount[mes]++;
    });

    return monthlyCount;
  }

  // Configurar notificaciones
  setupNotifications() {
    const notifications = this.generateNotifications();
    this.updateNotificationBadge(notifications.length);
    this.updateNotificationDropdown(notifications);
  }

  // Generar notificaciones dinámicas
  generateNotifications() {
    const notifications = [];
    
    // Ejemplo de notificaciones basadas en datos reales
    notifications.push({
      type: 'success',
      icon: 'check-circle',
      title: 'Sistema actualizado',
      message: 'Todas las funcionalidades están operativas',
      time: '5m ago'
    });

    notifications.push({
      type: 'info',
      icon: 'info-circle',
      title: 'Recordatorio',
      message: 'Revisar certificaciones pendientes',
      time: '1h ago'
    });

    notifications.push({
      type: 'warning',
      icon: 'exclamation-triangle',
      title: 'Inventario bajo',
      message: 'Algunos materiales necesitan reposición',
      time: '2h ago'
    });

    return notifications;
  }

  // Actualizar badge de notificaciones
  updateNotificationBadge(count) {
    const badge = document.getElementById('notificationCount');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
  }

  // Actualizar dropdown de notificaciones
  updateNotificationDropdown(notifications) {
    const header = document.getElementById('notificationHeader');
    const list = document.getElementById('notificationList');

    if (header) {
      header.textContent = notifications.length > 0 
        ? `${notifications.length} Nuevas Notificaciones`
        : 'Sin notificaciones';
    }

    if (list) {
      list.innerHTML = notifications.map(notif => `
        <a class="list-group-item" href="#">
          <div class="row g-0 align-items-center">
            <div class="col-2">
              <i class="text-${notif.type === 'success' ? 'success' : notif.type === 'warning' ? 'warning' : 'info'}" data-feather="${notif.icon}"></i>
            </div>
            <div class="col-10">
              <div class="text-dark">${notif.title}</div>
              <div class="text-muted small mt-1">${notif.message}</div>
              <div class="text-muted small mt-1">${notif.time}</div>
            </div>
          </div>
        </a>
      `).join('');
      
      // Reinitialize feather icons
      if (window.feather) {
        feather.replace();
      }
    }
  }

  // Configurar alertas del sistema
  setupAlertas(obras) {
    const container = document.getElementById('alertasContainer');
    if (!container) return;

    const alertas = this.generateAlertas(obras);
    
    if (alertas.length === 0) {
      container.innerHTML = `
        <div class="alert alert-success d-flex align-items-center" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          <div>
            <strong>¡Todo en orden!</strong> No hay alertas pendientes en el sistema.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = alertas.map(alerta => `
      <div class="alert alert-${alerta.type} d-flex align-items-center" role="alert">
        <i class="bi ${alerta.icon} me-2"></i>
        <div>
          <strong>${alerta.title}</strong> ${alerta.message}
        </div>
      </div>
    `).join('');
  }

  // Generar alertas basadas en datos
  generateAlertas(obras) {
    const alertas = [];

    // Verificar obras sin artículos
    const obrasSinArticulos = obras.filter(obra => !obra.articulos || obra.articulos.length === 0);
    if (obrasSinArticulos.length > 0) {
      alertas.push({
        type: 'warning',
        icon: 'bi-exclamation-triangle-fill',
        title: 'Obras sin materiales:',
        message: `${obrasSinArticulos.length} obra(s) no tienen materiales asignados.`
      });
    }

    // Verificar obras recientes
    const obrasRecientes = obras.filter(obra => {
      const fechaObra = new Date(obra.createdAt);
      const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return fechaObra > hace7Dias;
    });

    if (obrasRecientes.length > 0) {
      alertas.push({
        type: 'info',
        icon: 'bi-info-circle-fill',
        title: 'Actividad reciente:',
        message: `${obrasRecientes.length} obra(s) agregada(s) en los últimos 7 días.`
      });
    }

    return alertas;
  }

  // Formatear fecha
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays - 1} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Mostrar error
  showError(message) {
    const alertasContainer = document.getElementById('alertasContainer');
    if (alertasContainer) {
      alertasContainer.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <div>
            <strong>Error:</strong> ${message}
          </div>
        </div>
      `;
    }
  }
}

// Funciones globales para botones
function generarReporte() {
  alert('Función de reporte general en desarrollo');
}

function generarReporteObras() {
  alert('Reporte de obras en desarrollo');
}

function generarReporteMateriales() {
  alert('Reporte de materiales en desarrollo');
}

function generarReporteFinanciero() {
  alert('Reporte financiero en desarrollo');
}

function logout() {
  if (window.authUtils) {
    window.authUtils.logout();
  }
}

// Inicializar dashboard
let dashboardManager;

document.addEventListener('DOMContentLoaded', function() {
  // Esperar un poco para asegurar que auth.js se haya cargado
  setTimeout(() => {
    dashboardManager = new DashboardManager();
  }, 100);
});atio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creando gráfico mensual:', error);
    }
  }

  // Gráfico de distribución por tipo
  async setupObrasTipoChart() {
    const ctx = document.getElementById('chartObrasTipo');
    if (!ctx) return;

    try {
      const obras = await this.loadObras();
      
      const privadas = obras.filter(o => o.tipo === 'Obra privada').length;
      const publicas = obras.filter(o => o.tipo === 'Obra pública').length;

      this.charts.tipo = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Obra Privada', 'Obra Pública'],
          datasets: [{
            data: [privadas, publicas],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectR