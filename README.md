# 🏗️ Obra 360 - Dashboard de Gestión de Construcción

Sistema integral para la gestión de obras, materiales, personal y certificaciones en proyectos de construcción.

## 📋 Características

- **Dashboard Interactivo**: Vista general con KPIs y métricas importantes
- **Gestión de Obras**: Administración completa del ciclo de vida de obras
- **Inventario de Materiales**: Control de stock, ubicaciones y movimientos
- **Gestión de Personal**: Registro y seguimiento de empleados
- **Certificaciones**: Manejo de documentación y certificaciones
- **Reportes**: Generación de reportes en PDF y Excel
- **Responsive**: Diseño adaptable para móviles y tablets
- **Sidebar Modular**: Navegación dinámica según rol de usuario

## 🛠️ Tecnologías

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **EJS** - Motor de templates
- **Moment.js** - Manejo de fechas

### Frontend
- **Bootstrap 5** - Framework CSS
- **Bootstrap Icons** - Iconografía
- **React** (componente sidebar) - UI components
- **Vanilla JavaScript** - Funcionalidad del cliente

### Herramientas de Desarrollo
- **Webpack** - Bundling de assets
- **Nodemon** - Auto-restart del servidor
- **Babel** - Transpilación de JavaScript

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn
- Git

### Paso 1: Clonar el Repositorio

```bash
git clone 
cd obra360-dashboard
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables según tu configuración
nano .env
```

### Paso 4: Construir Assets

```bash
# Construir una vez
npm run build

# O ejecutar en modo watch para desarrollo
npm run watch
```

### Paso 5: Iniciar el Servidor

```bash
# Desarrollo (con auto-restart)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
obra360-dashboard/
├── 📁 dist/                    # Assets compilados por Webpack
├── 📁 helpers/                 # Helpers de EJS y utilidades
├── 📁 node_modules/            # Dependencias de Node.js
├── 📁 public/                  # Archivos estáticos
│   ├── 📁 css/                # Estilos CSS
│   ├── 📁 js/                 # JavaScript del cliente
│   └── 📁 images/             # Imágenes y assets
├── 📁 src/                     # Código fuente
│   ├── 📁 components/         # Componentes React
│   └── 📁 js/                 # JavaScript fuente
├── 📁 views/                   # Templates EJS
│   ├── 📁 pages/              # Páginas principales
│   └── 📁 partials/           # Componentes reutilizables
├── 📄 server.js               # Servidor principal
├── 📄 package.json           # Configuración del proyecto
├── 📄 webpack.config.js      # Configuración de Webpack
├── 📄 nodemon.json           # Configuración de Nodemon
└── 📄 .env.example           # Variables de entorno ejemplo
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor con nodemon
npm run watch        # Webpack en modo watch
npm run build        # Construir assets para producción

# Producción
npm start           # Iniciar servidor en modo producción

# Utilidades
npm run clean       # Limpiar archivos generados
npm run lint        # Verificar código con ESLint
npm run test        # Ejecutar tests (cuando se implementen)
```

## 👥 Roles de Usuario

El sistema maneja diferentes roles con distintos permisos:

### 🔴 ADMIN
- Acceso completo a todas las funcionalidades
- Gestión de usuarios y configuración
- Reportes financieros y administrativos
- Eliminación de registros

### 🟡 SUPERVISOR
- Gestión de obras y materiales
- Creación y edición de registros
- Reportes operativos
- Gestión de personal

### 🟢 OPERARIO
- Consulta de información
- Registro de actividades básicas
- Acceso limitado a reportes

## 🎨 Personalización del Sidebar

El sidebar es completamente modular y se configura en:

```javascript
// src/components/Sidebar/sidebar.config.js
export const SIDEBAR_CONFIG = {
  brand: {
    name: 'Obra 360',
    icon: 'bi-building',
    href: '/index.html'
  },
  menuItems: [
    // Configuración de elementos del menú
  ]
};
```

## 📊 API Endpoints

### Dashboard
- `GET /` - Dashboard principal
- `GET /api/dashboard/kpis` - Métricas del dashboard

### Obras
- `GET /obras` - Listado de obras
- `GET /obras/nueva` - Formulario nueva obra
- `GET /api/obras/recientes` - Obras recientes

### Materiales
- `GET /materiales` - Inventario de materiales
- `GET /materiales/nuevo` - Formulario nuevo material

### Reportes
- `GET /api/reportes/obras` - Reporte de obras (PDF)
- `GET /api/reportes/materiales` - Reporte de materiales (PDF)
- `GET /api/reportes/financiero` - Reporte financiero (PDF)

## 🔒 Seguridad

### Medidas Implementadas
- Validación de formularios en cliente y servidor
- Sanitización de datos de entrada
- Control de acceso basado en roles
- Variables de entorno para configuración sensible

### Recomendaciones para Producción
- Configurar HTTPS
- Implementar rate limiting
- Usar base de datos segura
- Configurar logs de auditoría
- Backup automático de datos

## 🐛 Debugging

### Logs de Desarrollo
```bash
# Habilitar logs detallados
DEBUG=obra360:* npm run dev
```

### Debugging del Sidebar
```javascript
// En el navegador
window.Obra360.debug = true;
```

## 📱 Responsive Design

El dashboard está optimizado para:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

### Breakpoints
- Sidebar colapsa automáticamente en móviles
- Cards se reorganizan según el espacio disponible
- Tablas se vuelven scrolleables horizontalmente

## 🚀 Deployment

### Desarrollo Local
```bash
npm run dev
```

### Producción
```bash
# Construir assets
npm run build

# Iniciar servidor
NODE_ENV=production npm start
```

### Docker (Opcional)
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📝 Changelog

### v1.0.0 (Actual)
- ✅ Dashboard principal con KPIs
- ✅ Gestión de obras (CRUD)
- ✅ Inventario de materiales
- ✅ Sidebar responsive y modular
- ✅ Sistema de roles básico
- ✅ Generación de reportes básicos

### Próximas Funcionalidades
- 🔄 Integración con base de datos
- 🔄 Autenticación JWT
- 🔄 Notificaciones en tiempo real
- 🔄 Geolocalización de obras
- 🔄 Dashboard de analíticas avanzadas
- 🔄 API REST completa

## 📞 Soporte

Para soporte técnico o consultas:
- 📧 Email: soporte@obra360.com
- 📱 WhatsApp: +54 9 11 XXXX-XXXX
- 💬 Discord: [Servidor de la Comunidad]

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Hecho con ❤️ para la industria de la construcción**