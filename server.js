const express = require('express');
const path = require('path');
const moment = require('moment');
const ejsHelpers = require('./helpers/ejs-helpers');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/src', express.static(path.join(__dirname, 'src'))); // Para auth.js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===============================================
//         HELPER DE DATOS (SIMULADO)
// ===============================================
const getUserData = (req) => {
  // En una implementación real, decodificarías el token JWT de la cookie aquí
  // y devolverías los datos del usuario.
  return {
    id: 1,
    firstName: 'Admin',
    lastName: 'Papu',
    role: 'ADMIN',
    email: 'admin@obra360.com'
  };
};

// ===============================================
//         MIDDLEWARES DE PERMISOS
// ===============================================

// Middleware para verificar que sea ADMIN o SUPERVISOR
const soloAdminSupervisor = (req, res, next) => {
  const user = getUserData(req);
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return res.status(403).render('pages/error', {
      title: 'Acceso Denegado',
      error: 'No tienes permisos para acceder a esta sección.',
      currentPage: 'error'
    });
  }
  
  next();
};

// Middleware solo para ADMIN
const soloAdmin = (req, res, next) => {
  const user = getUserData(req);
  
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).render('pages/error', {
      title: 'Acceso Denegado',
      error: 'Solo los administradores pueden acceder a esta sección.',
      currentPage: 'error'
    });
  }
  
  next();
};

// Middleware para verificar permisos de personal
const verificarPermisosPersonal = (req, res, next) => {
  const user = getUserData(req);
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    console.log('No hay usuario autenticado, redirigiendo al login...');
    return res.redirect('/login');
  }
  
  // Verificar rol
  if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
    console.log(`Usuario ${user.email} sin permisos suficientes (rol: ${user.role})`);
    return res.status(403).render('pages/error', {
      title: 'Acceso Denegado',
      error: 'No tienes permisos para acceder a la gestión de personal.',
      currentPage: 'error',
      user: user // Pasar user incluso en error
    });
  }
  
  // IMPORTANTE: Asignar el usuario al request
  req.user = user;
  res.locals.user = user; // También agregarlo a locals para las vistas
  
  console.log(`Usuario ${user.email} autorizado para control de horas`);
  next();
};


// Middleware global para variables de template
app.use((req, res, next) => {
  // Hacemos que estas variables estén disponibles en TODAS las vistas y parciales
  res.locals.moment = moment;
  res.locals.formatCurrency = ejsHelpers.formatCurrency;
  res.locals.user = getUserData(req); // Asigna los datos del usuario a res.locals
  res.locals.appName = 'Obra 360';
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPage = ''; 
  res.locals.notificaciones = [];
  
  next();
});

// ===============================================
//         RUTAS DE AUTENTICACIÓN
// ===============================================
app.get('/login', (req, res) => {
  res.render('pages/auth/login', {
    title: 'Iniciar Sesión - Obra 360',
    appName: 'Obra 360'
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({ message: data.error || 'Email o contraseña incorrectos' });
    }
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
    res.status(200).json({ message: 'Login exitoso' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ===============================================
//         RUTA DEL DASHBOARD
// ===============================================
app.get('/', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    console.log('Cargando datos del dashboard...');
    
    // Hacemos las llamadas a la API
    const [obrasResponse, certStatsResponse] = await Promise.all([
      fetch(`${process.env.API_BASE_URL}/api/obras`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${process.env.API_BASE_URL}/api/certificaciones/stats/resumen`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    // Verificamos CADA respuesta por separado para un mejor diagnóstico
    if (!obrasResponse.ok) {
      const errorData = await obrasResponse.text();
      throw new Error(`Error en la API de Obras: ${obrasResponse.status} - ${errorData}`);
    }
    
    if (!certStatsResponse.ok) {
      const errorData = await certStatsResponse.text();
      throw new Error(`Error en la API de Certificaciones: ${certStatsResponse.status} - ${errorData}`);
    }

    // Si ambas respuestas son correctas, continuamos...
    const obras = await obrasResponse.json();
    const certStats = await certStatsResponse.json();

    const kpis = {
      totalObras: obras.length,
      obrasTendencia: `+${obras.filter(o => moment(o.createdAt).isAfter(moment().subtract(30, 'days'))).length} este mes`,
      obrasActivas: obras.length,
      inversionTotal: certStats.totalMonto || 0,
      certificaciones: certStats.totalCertificaciones || 0
    };

    const obrasRecientes = obras
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(obra => ({
        id: obra.id, nombre: obra.empresa, tipo: obra.tipo,
        ubicacion: obra.ciudad, fecha: moment(obra.createdAt).fromNow()
      }));

    const obrasPorMes = new Array(12).fill(0);
    obras.forEach(obra => {
      obrasPorMes[new Date(obra.createdAt).getMonth()]++;
    });

    const distribucionTipo = [
      obras.filter(o => o.tipo === 'Obra privada').length,
      obras.filter(o => o.tipo === 'Obra pública').length
    ];
    
    const graficos = { obrasPorMes, distribucionTipo };
    const alertas = {
      obrasSinMateriales: obras.filter(o => !o.articulos || o.articulos.length === 0).length,
      actividadReciente: obras.filter(o => moment(o.createdAt).isAfter(moment().subtract(7, 'days'))).length
    };
    
    res.render('pages/dashboard', {
      title: 'Dashboard - Obra 360', kpis, obrasRecientes, graficos, alertas,
      notificaciones: [], currentPage: 'dashboard'
    });

  } catch (error) {
    console.error('Error al cargar el dashboard:', error);
    res.render('pages/dashboard', {
      title: 'Error de Dashboard',
      kpis: { totalObras: 0, obrasTendencia: '+0', obrasActivas: 0, inversionTotal: 0, certificaciones: 0 },
      obrasRecientes: [], graficos: { obrasPorMes: new Array(12).fill(0), distribucionTipo: [0, 0] },
      alertas: { obrasSinMateriales: 0, actividadReciente: 0 }, notificaciones: [],
      currentPage: 'dashboard', error: "No se pudieron cargar los datos del dashboard."
    });
  }
});

// ===============================================
//         RUTAS API
// ===============================================

// RUTA API PARA OBTENER OBRAS (JSON)
app.get('/api/obras', async (req, res) => {
  console.log('🔍 [DEBUG] Llamada a /api/obras recibida');
  
  const token = req.cookies.token;
  console.log('🔍 [DEBUG] Token encontrado:', token ? 'SÍ' : 'NO');
  
  if (!token) {
    console.log('❌ [DEBUG] Sin token, retornando error 401');
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    console.log('🔍 [DEBUG] Haciendo petición a:', `${process.env.API_BASE_URL}/api/obras`);
    
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('🔍 [DEBUG] Respuesta del backend:', apiResponse.status, apiResponse.ok);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('❌ [DEBUG] Error del backend:', errorText);
      throw new Error('Error al obtener obras del backend');
    }

    const obras = await apiResponse.json();
    console.log('✅ [DEBUG] Obras obtenidas:', obras.length, 'obras');
    
    res.json({ success: true, data: obras });

  } catch (error) {
    console.error("❌ [DEBUG] Error en la API de obras:", error.message);
    res.status(500).json({ success: false, error: 'Error de conexión con el backend' });
  }
});

// ===============================================
//         RUTAS DE OBRAS
// ===============================================

// RUTA PARA OBRAS (CONECTADA AL BACKEND)
app.get('/obras', soloAdminSupervisor, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!apiResponse.ok) throw new Error('No se pudieron cargar las obras');

    const obrasApi = await apiResponse.json();
    
    const obrasData = obrasApi.map(obra => ({
      id: obra.id,
      nombre: obra.empresa,
      cliente: obra.user ? `${obra.user.firstName} ${obra.user.lastName}` : 'N/A',
      ubicacion: obra.ciudad,
      tipo: obra.tipo,
      estado: 'Activa',
      fechaInicio: obra.createdAt,
      progreso: Math.floor(Math.random() * 51) + 50
    }));

    const stats = {
      activas: obrasData.filter(o => o.estado === 'Activa').length,
      completadas: obrasData.filter(o => o.progreso === 100).length,
      total: obrasData.length
    };

    res.render('pages/obras', {
      title: 'Gestión de Obras',
      user,
      currentPage: 'obras',
      obras: obrasData,
      stats: stats
    });

  } catch (error) {
    console.error("Error conectando con la API de obras:", error);
    res.render('pages/obras', {
      title: 'Error de Conexión', user, currentPage: 'obras', 
      obras: [],
      stats: { activas: 0, completadas: 0, total: 0 },
      error: "No se pudieron cargar las obras."
    });
  }
});

// RUTA PARA MOSTRAR EL FORMULARIO DE NUEVA OBRA (GET)
app.get('/obras/nueva', soloAdminSupervisor, (req, res) => {
  const user = getUserData(req);
  res.render('pages/nueva-obra', {
    title: 'Nueva Obra',
    user,
    currentPage: 'nueva-obra'
  });
});

// RUTA PARA PROCESAR EL FORMULARIO DE NUEVA OBRA (POST)
app.post('/obras/nueva', soloAdminSupervisor, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const datosParaAPI = {
      empresa: req.body.empresa,
      tipo: req.body.tipo,
      ciudad: req.body.ciudad
    };

    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosParaAPI)
    });

    if (!apiResponse.ok) {
      throw new Error('La API rechazó la creación de la obra');
    }
    
    res.redirect('/obras');

  } catch (error) {
    console.error("Error al crear la obra:", error);
    const user = getUserData(req);
    res.render('pages/nueva-obra', {
      title: 'Nueva Obra',
      user,
      currentPage: 'nueva-obra',
      error: 'No se pudo guardar la obra. Por favor, inténtalo de nuevo.'
    });
  }
});

// RUTA PARA OBTENER DETALLES DE UNA OBRA (GET)
app.get('/obras/detalles/:id', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    const { id } = req.params;
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!apiResponse.ok) throw new Error('Obra no encontrada');
    const obra = await apiResponse.json();
    res.json(obra);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// RUTA PARA ACTUALIZAR UNA OBRA (POST)
app.post('/obras/editar/:id', soloAdminSupervisor, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const { id } = req.params;
    await fetch(`${process.env.API_BASE_URL}/api/obras/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });
    res.redirect('/obras');
  } catch (error) {
    console.error("Error al editar la obra:", error);
    res.redirect(`/obras?error=edit`);
  }
});

// RUTA PARA ELIMINAR UNA OBRA (POST)
app.post('/obras/eliminar/:id', soloAdminSupervisor, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    const { id } = req.params;
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!apiResponse.ok) throw new Error('No se pudo eliminar la obra');
    res.json({ message: 'Obra eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===============================================
//         RUTAS DE MATERIALES
// ===============================================


// RUTA PARA MOSTRAR EL FORMULARIO DE NUEVO MATERIAL
app.get('/materiales/nuevo', soloAdminSupervisor, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  
  if (!token) return res.redirect('/login');

  try {
    // Fetch obras from your API
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!apiResponse.ok) {
      throw new Error('Error al cargar obras');
    }
    
    const obras = await apiResponse.json();
    console.log('✅ [MATERIALES] Obras cargadas:', obras.length);
    
    res.render('pages/nuevo-material', {
      title: 'Nuevo Material',
      user,
      currentPage: 'nuevo-material',
      obras: obras || []
    });

  } catch (error) {
    console.error("❌ [MATERIALES] Error al cargar obras:", error);
    res.render('pages/nuevo-material', {
      title: 'Nuevo Material',
      user,
      currentPage: 'nuevo-material',
      obras: [],
      error: "No se pudieron cargar las obras disponibles."
    });
  }
});

// RUTA PARA PROCESAR EL FORMULARIO DE NUEVO MATERIAL
app.post('/materiales/nuevo', soloAdminSupervisor, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  console.log('🔍 [MATERIALES] Datos recibidos:', req.body);

  try {
    const datosParaAPI = {
      codigoInterno: req.body.codigoInterno,
      nombre: req.body.nombre,
      unidad: req.body.unidad,
      cantidad: parseFloat(req.body.cantidad) || 0,
      precio: parseFloat(req.body.precio) || 0,
      obraId: req.body.obraId
    };

    console.log('🔍 [MATERIALES] Datos a enviar al API:', datosParaAPI);

    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/materiales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosParaAPI)
    });

    console.log('🔍 [MATERIALES] Response status:', apiResponse.status);

    const responseText = await apiResponse.text();
    console.log('🔍 [MATERIALES] Response text:', responseText);

    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: responseText };
      }
      
      console.log('❌ [MATERIALES] API error:', errorData);
      throw new Error(errorData.error || errorData.message || 'La API rechazó la creación del material');
    }
    
    console.log('✅ [MATERIALES] Material creado exitosamente');
    res.redirect('/materiales?success=Material agregado correctamente');

  } catch (error) {
    console.error("❌ [MATERIALES] Error completo:", error.message);
    
    // Re-load obras for the form in case of error
    try {
      const obrasResponse = await fetch(`${process.env.API_BASE_URL}/api/obras`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const obras = obrasResponse.ok ? await obrasResponse.json() : [];
      
      const user = getUserData(req);
      res.render('pages/nuevo-material', {
        title: 'Nuevo Material',
        user,
        currentPage: 'nuevo-material',
        obras: obras,
        error: `No se pudo guardar el material: ${error.message}`,
        formData: req.body // Pre-fill form with submitted data
      });
    } catch (renderError) {
      console.error("❌ [MATERIALES] Error al re-renderizar:", renderError);
      res.redirect('/materiales/nuevo?error=Error al procesar el material');
    }
  }
});

// RUTA PARA MATERIALES (CONECTADA AL BACKEND)
app.get('/materiales', async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  
  if (!token) return res.redirect('/login');

  try {
    console.log('🔍 [MATERIALES] Cargando materiales desde API...');
    
    // Fetch materials from your API
    const materialesResponse = await fetch(`${process.env.API_BASE_URL}/api/materiales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('🔍 [MATERIALES] Materiales response status:', materialesResponse.status);

    if (!materialesResponse.ok) {
      const errorText = await materialesResponse.text();
      console.log('❌ [MATERIALES] Error al obtener materiales:', errorText);
      throw new Error(`Error ${materialesResponse.status}: ${errorText}`);
    }

    const materialesData = await materialesResponse.json();
    console.log('✅ [MATERIALES] Materiales obtenidos:', materialesData.length);
    console.log('🔍 [MATERIALES] Primer material de ejemplo:', materialesData[0]);

    // Transform materials data to match your template structure
    // Note: Your API uses snake_case field names
    const materialesAdaptados = materialesData.map(material => {
      const precio = parseFloat(material.precio) || 0;
      const cantidad = parseFloat(material.cantidad) || 0;
      
      return {
        id: material.id,
        codigoInterno: material.codigo_interno || 'N/A', // snake_case from API
        nombre: material.nombre,
        unidad: material.unidad,
        stock: cantidad,
        precio: precio,
        fechaIngreso: material.fecha_ingreso || material.created_at, // Use the correct field
        obraId: material.obra_id, // snake_case from API
        // The Obra object is included in the response
        obraNombre: material.Obra ? `${material.Obra.empresa} - ${material.Obra.ciudad}` : 'Obra no encontrada'
      };
    });

    const stats = {
      total: materialesAdaptados.length,
      stockBajo: materialesAdaptados.filter(m => m.stock < 10).length,
      valorTotal: materialesAdaptados.reduce((sum, m) => sum + (m.stock * m.precio), 0)
    };

    console.log('✅ [MATERIALES] Datos procesados:', {
      materialesCount: materialesAdaptados.length,
      stats: stats,
      primerMaterial: materialesAdaptados[0]
    });

    res.render('pages/materiales', {
      title: 'Inventario de Materiales',
      user,
      currentPage: 'materiales',
      materiales: materialesAdaptados,
      stats: stats,
      success: req.query.success || null
    });

  } catch (error) {
    console.error("❌ [MATERIALES] Error completo:", error);
    
    res.render('pages/materiales', {
      title: 'Error de Conexión - Materiales',
      user,
      currentPage: 'materiales',
      materiales: [],
      stats: { total: 0, stockBajo: 0, valorTotal: 0 },
      error: `No se pudieron cargar los materiales: ${error.message}`
    });
  }
});

// API ROUTE: Get material details
app.get('/api/materiales/:id', async (req, res) => {
  const token = req.cookies.token;
  const { id } = req.params;
  
  console.log('🔍 [API-MATERIALES] Solicitando detalles del material:', id);
  
  if (!token) {
    console.log('❌ [API-MATERIALES] No token provided');
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    // First, let's get all materials and find the one we need
    // since the individual endpoint might not exist
    const apiUrl = `${process.env.API_BASE_URL}/api/materiales`;
    console.log('🔍 [API-MATERIALES] Fetching all materials from:', apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('🔍 [API-MATERIALES] Response status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('❌ [API-MATERIALES] API error:', errorText);
      throw new Error(`Error al obtener materiales: ${apiResponse.status}`);
    }
    
    const materiales = await apiResponse.json();
    const material = materiales.find(m => m.id === id);
    
    if (!material) {
      console.log('❌ [API-MATERIALES] Material no encontrado con ID:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Material no encontrado' 
      });
    }
    
    console.log('✅ [API-MATERIALES] Material encontrado:', material.nombre);
    
    // Transform the material data to expected format
    const materialTransformado = {
      id: material.id,
      codigoInterno: material.codigo_interno,
      nombre: material.nombre,
      unidad: material.unidad,
      cantidad: material.cantidad,
      precio: material.precio,
      precioTotal: material.precio_total,
      fechaIngreso: material.fecha_ingreso,
      obraId: material.obra_id,
      obraNombre: material.Obra ? `${material.Obra.empresa} - ${material.Obra.ciudad}` : 'N/A'
    };
    
    res.json(materialTransformado);
    
  } catch (error) {
    console.error('❌ [API-MATERIALES] Error completo:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: 'Error al obtener detalles del material'
    });
  }
});

// API ROUTE: Delete material
app.delete('/api/materiales/:id', async (req, res) => {
  const token = req.cookies.token;
  const { id } = req.params;
  
  console.log('🔍 [DELETE-MATERIALES] Eliminando material:', id);
  
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    // Try to delete using the API
    const apiUrl = `${process.env.API_BASE_URL}/api/materiales/${id}`;
    console.log('🔍 [DELETE-MATERIALES] DELETE request to:', apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('🔍 [DELETE-MATERIALES] Response status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('❌ [DELETE-MATERIALES] API error:', errorText);
      
      // If the endpoint doesn't exist, return a message
      if (apiResponse.status === 404) {
        return res.status(501).json({ 
          success: false, 
          message: 'La funcionalidad de eliminación aún no está implementada en el API' 
        });
      }
      
      throw new Error(`Error ${apiResponse.status}: ${errorText}`);
    }
    
    console.log('✅ [DELETE-MATERIALES] Material eliminado correctamente');
    res.json({ success: true, message: 'Material eliminado correctamente' });
    
  } catch (error) {
    console.error('❌ [DELETE-MATERIALES] Error completo:', error.message);
    res.status(500).json({ 
      success: false, 
      message: `Error al eliminar: ${error.message}` 
    });
  }
});


// ===============================================
//         RUTAS DE CERTIFICACIONES
// ===============================================

// RUTA PARA CERTIFICACIONES (CONECTADA AL BACKEND)
app.get('/certificaciones', soloAdminSupervisor, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const [certificacionesResponse, obrasResponse] = await Promise.all([
      fetch(`${process.env.API_BASE_URL}/api/certificaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${process.env.API_BASE_URL}/api/obras`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    if (!certificacionesResponse.ok) throw new Error('Error al obtener certificaciones');
    if (!obrasResponse.ok) throw new Error('Error al obtener obras');
    
    const certificacionesData = await certificacionesResponse.json();
    const obrasData = await obrasResponse.json();

    const obrasMap = {};
    obrasData.forEach(obra => {
      obrasMap[obra.id] = `${obra.empresa} - ${obra.ciudad}`;
    });

    const stats = {
      total: certificacionesData.length,
      aprobadas: certificacionesData.filter(c => c.estado === 'APROBADA').length,
      pendientes: certificacionesData.filter(c => c.estado === 'PENDIENTE').length,
      montoTotal: certificacionesData.reduce((sum, c) => sum + c.total, 0)
    };
    
    const certificacionesAdaptadas = certificacionesData.map(cert => {
      let obraNombre;

      const esUUID = (str) => {
        return typeof str === 'string' && 
               str.length === 36 && 
               str.includes('-') && 
               str.split('-').length === 5;
      };

      if (typeof cert.obra === 'object' && cert.obra !== null) {
        obraNombre = `${cert.obra.empresa} - ${cert.obra.ciudad}`;
      } else if (esUUID(cert.obra)) {
        obraNombre = obrasMap[cert.obra] || `ID: ${cert.obra}`;
      } else {
        obraNombre = cert.obra || 'Obra sin nombre';
      }

      return {
        id: cert.id,
        obraNombre: obraNombre,
        tipo: cert.tipoCertificacion,
        fecha: cert.fecha,
        estado: cert.estado,
        monto: cert.total,
        itemsCount: cert.items.length,
        items: cert.items
      };
    });

    res.render('pages/certificaciones', {
      title: 'Certificaciones',
      user,
      currentPage: 'certificaciones',
      certificaciones: certificacionesAdaptadas,
      stats
    });

  } catch (error) {
    console.error("❌ [CERT] Error conectando con las APIs:", error);
    res.render('pages/certificaciones', {
      title: 'Error de Conexión', user, currentPage: 'certificaciones', 
      certificaciones: [],
      stats: { total: 0, aprobadas: 0, pendientes: 0, montoTotal: 0 },
      error: "No se pudieron cargar las certificaciones."
    });
  }
});

// RUTA PARA MOSTRAR EL FORMULARIO DE NUEVA CERTIFICACIÓN
app.get('/certificaciones/nueva', soloAdminSupervisor, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!apiResponse.ok) throw new Error('No se pudieron cargar las obras');

    const obras = await apiResponse.json();
    
    res.render('pages/nueva-certificacion', {
      title: 'Nueva Certificación',
      user,
      currentPage: 'nueva-certificacion',
      obras: obras
    });

  } catch (error) {
    console.error("Error al cargar obras para nueva certificación:", error);
    res.render('pages/nueva-certificacion', {
      title: 'Nueva Certificación',
      user,
      currentPage: 'nueva-certificacion',
      obras: [],
      error: "No se pudieron cargar las obras."
    });
  }
});

// RUTA PARA PROCESAR EL FORMULARIO DE NUEVA CERTIFICACIÓN (POST)
app.post('/certificaciones/nueva', soloAdminSupervisor, async (req, res) => {
  const token = req.cookies.token;
  console.log('🔍 [CERT] Iniciando creación de certificación...');
  
  if (!token) return res.redirect('/login');

  try {
    console.log('🔍 [CERT] Datos recibidos del formulario:', req.body);
    
    const items = JSON.parse(req.body.itemsJson);
    console.log('🔍 [CERT] Items parseados:', items);
    
    const datosParaAPI = {
      obra: req.body.obraId,
      tipoCertificacion: req.body.tipo,
      fecha: req.body.fecha,
      items: items
    };

    console.log('🔍 [CERT] Datos a enviar al backend:', datosParaAPI);

    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/certificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosParaAPI)
    });

    console.log('🔍 [CERT] Respuesta del backend - Status:', apiResponse.status, 'OK:', apiResponse.ok);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('❌ [CERT] Error del backend:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || errorData.message || 'La API rechazó la creación de la certificación');
      } catch (parseError) {
        throw new Error(`Error ${apiResponse.status}: ${errorText}`);
      }
    }
    
    const responseData = await apiResponse.json();
    console.log('✅ [CERT] Certificación creada exitosamente:', responseData);
    
    res.redirect('/certificaciones');

  } catch (error) {
    console.error("❌ [CERT] Error completo:", error);
    
    const user = getUserData(req);
    const token = req.cookies.token;
    
    try {
      const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/obras`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const obras = apiResponse.ok ? await apiResponse.json() : [];
      
      res.render('pages/nueva-certificacion', {
        title: 'Nueva Certificación',
        user,
        currentPage: 'nueva-certificacion',
        obras: obras,
        error: `No se pudo guardar la certificación: ${error.message}`
      });
    } catch (renderError) {
      console.error("❌ [CERT] Error al renderizar formulario con error:", renderError);
      res.redirect('/certificaciones/nueva?error=true');
    }
  }
});

// RUTA PARA EXPORTAR CERTIFICACIONES A EXCEL (SIMULADO)
app.get('/api/certificaciones/export/excel', (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-certificaciones.xlsx"');
  res.send("Este es un reporte de Excel simulado.");
});

// RUTA PARA EXPORTAR CERTIFICACIONES A PDF (SIMULADO)
app.get('/api/certificaciones/export/pdf', (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-certificaciones.pdf"');
  res.send("Este es un reporte en PDF simulado.");
});

// ===============================================
//         RUTAS DE PERSONAL
// ===============================================

// RUTA PARA LISTADO DE PERSONAL (con permisos)
app.get('/personal', verificarPermisosPersonal, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;

  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apiResponse.ok) throw new Error('Error al obtener el personal');

    const personalData = await apiResponse.json();

    // Filtrar usuarios según permisos
    let personalFiltrado = personalData;
    if (user.role === 'SUPERVISOR') {
      personalFiltrado = personalData.filter(p => 
        p.role === 'OPERARIO' || p.role === 'OPERATOR' || p.id === user.id
      );
    }

    const personalAdaptado = personalFiltrado.map(p => ({
      id: p.id,
      nombreCompleto: `${p.firstName} ${p.lastName}`,
      email: p.email,
      rol: p.role,
      registro: p.createdAt
    }));

    res.render('pages/personal', {
      title: 'Gestión de Personal',
      user,
      currentPage: 'personal',
      personal: personalAdaptado,
      permisos: {
        puedeCrear: true,
        puedeEditarTodos: user.role === 'ADMIN',
        puedeEliminarTodos: user.role === 'ADMIN'
      }
    });

  } catch (error) {
    console.error("Error conectando con la API de personal:", error);
    res.render('pages/personal', {
      title: 'Error de Conexión', 
      user, 
      currentPage: 'personal', 
      personal: [],
      permisos: { puedeCrear: false, puedeEditarTodos: false, puedeEliminarTodos: false },
      error: "No se pudo cargar la lista de personal."
    });
  }
});

// RUTA PARA MOSTRAR EL FORMULARIO DE NUEVO PERSONAL (con permisos)
app.get('/personal/nuevo', verificarPermisosPersonal, (req, res) => {
  const user = getUserData(req);
  
  let rolesDisponibles = [];
  if (user.role === 'ADMIN') {
    rolesDisponibles = [
      { value: 'ADMIN', name: 'Administrador' },
      { value: 'SUPERVISOR', name: 'Supervisor' },
      { value: 'OPERARIO', name: 'Operario' }
    ];
  } else if (user.role === 'SUPERVISOR') {
    rolesDisponibles = [
      { value: 'OPERARIO', name: 'Operario' }
    ];
  }

  res.render('pages/nuevo-personal', {
    title: 'Nuevo Personal',
    user,
    currentPage: 'nuevo-personal',
    rolesDisponibles
  });
});

// RUTA PARA PROCESAR EL FORMULARIO DE NUEVO PERSONAL (con validación de permisos)
app.post('/personal/nuevo', verificarPermisosPersonal, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;

  try {
    // Validar que el usuario actual puede crear el rol solicitado
    const rolSolicitado = req.body.role;
    let puedeCrearRol = false;

    if (user.role === 'ADMIN') {
      puedeCrearRol = ['ADMIN', 'SUPERVISOR', 'OPERARIO'].includes(rolSolicitado);
    } else if (user.role === 'SUPERVISOR') {
      puedeCrearRol = rolSolicitado === 'OPERARIO';
    }

    if (!puedeCrearRol) {
      throw new Error('No tienes permisos para crear un usuario con ese rol.');
    }

    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || 'Error al crear el usuario');
    }
    
    res.redirect('/personal?success=Usuario creado correctamente');

  } catch (error) {
    console.error("Error al crear personal:", error);
    
    const rolesDisponibles = user.role === 'ADMIN' 
      ? [{ value: 'ADMIN', name: 'Administrador' }, { value: 'SUPERVISOR', name: 'Supervisor' }, { value: 'OPERARIO', name: 'Operario' }]
      : [{ value: 'OPERARIO', name: 'Operario' }];

    res.render('pages/nuevo-personal', {
      title: 'Nuevo Personal',
      user,
      currentPage: 'nuevo-personal',
      rolesDisponibles,
      error: error.message,
      formData: req.body
    });
  }
});

// RUTA PARA EDITAR PERSONAL (GET)
app.get('/personal/editar/:id', verificarPermisosPersonal, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  const { id } = req.params;

  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/users/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apiResponse.ok) throw new Error('Usuario no encontrado');

    const usuario = await apiResponse.json();

    // Verificar permisos para editar este usuario
    let puedeEditar = false;
    if (user.role === 'ADMIN') {
      puedeEditar = true;
    } else if (user.role === 'SUPERVISOR') {
      puedeEditar = usuario.role === 'OPERARIO' || usuario.id === user.id;
    }

    if (!puedeEditar) {
      throw new Error('No tienes permisos para editar este usuario.');
    }

    // Roles disponibles según permisos
    let rolesDisponibles = [];
    if (user.role === 'ADMIN') {
      rolesDisponibles = [
        { value: 'ADMIN', name: 'Administrador' },
        { value: 'SUPERVISOR', name: 'Supervisor' },
        { value: 'OPERARIO', name: 'Operario' }
      ];
    } else if (user.role === 'SUPERVISOR' && usuario.role === 'OPERARIO') {
      rolesDisponibles = [{ value: 'OPERARIO', name: 'Operario' }];
    }

    res.json({ success: true, usuario, rolesDisponibles });

  } catch (error) {
    res.status(403).json({ success: false, error: error.message });
  }
});

// RUTA PARA ACTUALIZAR PERSONAL (PUT)
app.put('/personal/:id', verificarPermisosPersonal, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  const { id } = req.params;

  try {
    // Primero obtener el usuario actual para verificar permisos
    const getUserResponse = await fetch(`${process.env.API_BASE_URL}/api/users/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!getUserResponse.ok) throw new Error('Usuario no encontrado');
    const usuarioActual = await getUserResponse.json();

    // Verificar permisos
    let puedeEditar = false;
    if (user.role === 'ADMIN') {
      puedeEditar = true;
    } else if (user.role === 'SUPERVISOR') {
      puedeEditar = usuarioActual.role === 'OPERARIO';
    }

    if (!puedeEditar) {
      throw new Error('No tienes permisos para editar este usuario.');
    }

    // Validar el rol si se está cambiando
    if (req.body.role && req.body.role !== usuarioActual.role) {
      let puedeAsignarRol = false;
      if (user.role === 'ADMIN') {
        puedeAsignarRol = ['ADMIN', 'SUPERVISOR', 'OPERARIO'].includes(req.body.role);
      } else if (user.role === 'SUPERVISOR') {
        puedeAsignarRol = req.body.role === 'OPERARIO';
      }

      if (!puedeAsignarRol) {
        throw new Error('No tienes permisos para asignar ese rol.');
      }
    }

    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || 'Error al actualizar el usuario');
    }

    const result = await apiResponse.json();
    res.json({ success: true, message: 'Usuario actualizado correctamente', data: result });

  } catch (error) {
    res.status(403).json({ success: false, error: error.message });
  }
});

// RUTA PARA ELIMINAR PERSONAL (DELETE)
app.delete('/personal/:id', verificarPermisosPersonal, async (req, res) => {
  const user = getUserData(req);
  const token = req.cookies.token;
  const { id } = req.params;

  try {
    // No puede eliminarse a sí mismo
    if (id === user.id.toString()) {
      throw new Error('No puedes eliminarte a ti mismo.');
    }

    // Obtener información del usuario a eliminar
    const getUserResponse = await fetch(`${process.env.API_BASE_URL}/api/users/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!getUserResponse.ok) throw new Error('Usuario no encontrado');
    const usuarioAEliminar = await getUserResponse.json();

    // Verificar permisos para eliminar
    let puedeEliminar = false;
    if (user.role === 'ADMIN') {
      puedeEliminar = true;
    } else if (user.role === 'SUPERVISOR') {
      puedeEliminar = usuarioAEliminar.role === 'OPERARIO';
    }

    if (!puedeEliminar) {
      throw new Error('No tienes permisos para eliminar este usuario.');
    }

    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || 'Error al eliminar el usuario');
    }

    res.json({ success: true, message: 'Usuario eliminado correctamente' });

  } catch (error) {
    res.status(403).json({ success: false, error: error.message });
  }
});

// ===============================================
//     RUTAS DE CONTROL DE HORAS (FRONTEND PROXY)
// ===============================================
// Agregar estas rutas en tu server.js después de las rutas de personal

// ACTUALIZAR LA RUTA EXISTENTE DE CONTROL DE HORAS (Vista principal)
app.get('/personal/control-horas', verificarPermisosPersonal, async (req, res) => {
  const user = req.user;
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    // Obtener fecha de hoy
    const hoy = moment().format('YYYY-MM-DD');
    
    // Obtener resumen del día
    const resumenResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/resumen/${hoy}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let stats = {
      presentes: 0,
      horasTrabajadas: '0:00',
      horasExtra: '0:00'
    };
    
    if (resumenResponse.ok) {
      const resumen = await resumenResponse.json();
      stats = {
        presentes: resumen.empleadosPresentes || 0,
        horasTrabajadas: resumen.horasTotales || '0:00',
        horasExtra: resumen.horasExtra || '0:00'
      };
    }

    res.render('pages/control-horas', {
      title: 'Control de Horas',
      user,
      currentPage: 'control-horas',
      stats
    });
  } catch (error) {
    console.error("Error al cargar control de horas:", error);
    res.render('pages/control-horas', {
      title: 'Control de Horas',
      user,
      currentPage: 'control-horas',
      stats: { presentes: 0, horasTrabajadas: '0:00', horasExtra: '0:00' }
    });
  }
});

// API: Obtener todas las personas
app.get('/api/control-horas/personas', verificarPermisosPersonal, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/personas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      throw new Error(`Error del backend: ${apiResponse.status} - ${errorData}`);
    }

    const personas = await apiResponse.json();
    res.json(personas);
  } catch (error) {
    console.error('Error obteniendo personas:', error);
    res.status(500).json({ error: 'Error al obtener personas' });
  }
});

// API: Crear nueva persona
app.post('/api/control-horas/personas', verificarPermisosPersonal, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/personas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return res.status(apiResponse.status).json(errorData);
    }

    const nuevaPersona = await apiResponse.json();
    res.status(201).json(nuevaPersona);
  } catch (error) {
    console.error('Error creando persona:', error);
    res.status(500).json({ error: 'Error al crear persona' });
  }
});

// // API: Obtener registros de control de horas
// app.get('/personal/control-horas', verificarPermisosPersonal, async (req, res) => {
//   // El usuario ya viene del middleware
//   const user = req.user;
//   const token = req.cookies.token;
  
//   // Si por alguna razón no hay usuario, redirigir al login
//   if (!user) {
//     return res.redirect('/login');
//   }

//   try {
//     // Obtener fecha de hoy
//     const hoy = moment().format('YYYY-MM-DD');
    
//     // Inicializar stats por defecto
//     let stats = {
//       presentes: 0,
//       horasTrabajadas: '0:00',
//       horasExtra: '0:00'
//     };
    
//     // Si hay token, intentar obtener el resumen del backend
//     if (token) {
//       try {
//         const resumenResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/resumen/${hoy}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
        
//         if (resumenResponse.ok) {
//           const resumen = await resumenResponse.json();
//           stats = {
//             presentes: resumen.empleadosPresentes || 0,
//             horasTrabajadas: resumen.horasTotales || '0:00',
//             horasExtra: resumen.horasExtra || '0:00'
//           };
//         }
//       } catch (error) {
//         console.log('Error obteniendo resumen:', error);
//         // Mantener stats por defecto
//       }
//     }

//     // IMPORTANTE: Siempre pasar el objeto user
//     res.render('pages/control-horas', {
//       title: 'Control de Horas',
//       user: user, // Asegurarse de pasar user
//       currentPage: 'control-horas',
//       stats: stats,
//       moment: moment // También pasar moment si lo usas en la vista
//     });
    
//   } catch (error) {
//     console.error("Error al cargar control de horas:", error);
    
//     // En caso de error, aún así renderizar con valores por defecto
//     res.render('pages/control-horas', {
//       title: 'Control de Horas',
//       user: user, // SIEMPRE pasar user
//       currentPage: 'control-horas',
//       stats: { 
//         presentes: 0, 
//         horasTrabajadas: '0:00', 
//         horasExtra: '0:00' 
//       },
//       error: "Error al cargar los datos.",
//       moment: moment
//     });
//   }
// });


// API: Registrar entrada/salida
app.post('/api/control-horas/marcar', verificarPermisosPersonal, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/marcar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return res.status(apiResponse.status).json(errorData);
    }

    const resultado = await apiResponse.json();
    res.json(resultado);
  } catch (error) {
    console.error('Error registrando:', error);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// API: Actualizar registro
app.put('/api/control-horas/registros/:id', verificarPermisosPersonal, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const { id } = req.params;
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/registros/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(req.body)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return res.status(apiResponse.status).json(errorData);
    }

    const resultado = await apiResponse.json();
    res.json(resultado);
  } catch (error) {
    console.error('Error actualizando registro:', error);
    res.status(500).json({ error: 'Error al actualizar registro' });
  }
});

// API: Eliminar registro
app.delete('/api/control-horas/registros/:id', verificarPermisosPersonal, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const { id } = req.params;
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/registros/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return res.status(apiResponse.status).json(errorData);
    }

    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando registro:', error);
    res.status(500).json({ error: 'Error al eliminar registro' });
  }
});

// API: Obtener resumen del día
app.get('/api/control-horas/resumen/:fecha', verificarPermisosPersonal, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const { fecha } = req.params;
    const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/control-horas/resumen/${fecha}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      throw new Error(`Error del backend: ${apiResponse.status} - ${errorData}`);
    }

    const resumen = await apiResponse.json();
    res.json(resumen);
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// API: Exportar a Excel/CSV
app.get('/api/control-horas/exportar', verificarPermisosPersonal, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const queryParams = new URLSearchParams(req.query);
    const apiUrl = `${process.env.API_BASE_URL}/api/control-horas/exportar?${queryParams}`;

    const apiResponse = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!apiResponse.ok) {
      throw new Error('Error al exportar datos');
    }

    // Copiar headers de la respuesta del backend
    const contentType = apiResponse.headers.get('content-type');
    const contentDisposition = apiResponse.headers.get('content-disposition');
    
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);

    // Transmitir el archivo
    const buffer = await apiResponse.buffer();
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando:', error);
    res.status(500).json({ error: 'Error al exportar' });
  }
});

// ===============================================
//         API ROUTES PARA REPORTES
// ===============================================

app.get('/api/reportes/obras', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-obras.pdf"');
    res.send(Buffer.from('PDF Content Here'));
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de obras' });
  }
});

app.get('/api/reportes/materiales', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-materiales.pdf"');
    res.send(Buffer.from('PDF Content Here'));
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de materiales' });
  }
});

app.get('/api/reportes/financiero', async (req, res) => {
  try {
    const user = getUserData(req);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-financiero.pdf"');
    res.send(Buffer.from('PDF Content Here'));
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte financiero' });
  }
});

app.get('/api/dashboard/kpis', async (req, res) => {
  try {
    // Implementar obtención de KPIs
    res.json({ message: 'KPIs endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo KPIs' });
  }
});

app.get('/api/obras/recientes', async (req, res) => {
  try {
    // Implementar obtención de obras recientes
    res.json({ message: 'Obras recientes endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo obras recientes' });
  }
});

// ===============================================
//         MANEJO DE ERRORES (al final)
// ===============================================
app.use((req, res) => {
  res.status(404).render('pages/404', { title: '404 - Página no encontrada', currentPage: '404' });
});

app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).render('pages/error', {
    title: 'Error - Obra 360',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    currentPage: 'error'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});