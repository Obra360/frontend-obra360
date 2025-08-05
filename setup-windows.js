#!/usr/bin/env node

/**
 * Script de configuración inicial para Obra 360 - Windows
 * Versión optimizada para Windows PowerShell/CMD
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para Windows (funciona en PowerShell moderno y Windows Terminal)
const colors = {
  reset: '',
  bright: '',
  red: '',
  green: '',
  yellow: '',
  blue: '',
  magenta: '',
  cyan: ''
};

// Detectar si soporta colores
try {
  if (process.stdout.isTTY) {
    colors.reset = '\x1b[0m';
    colors.bright = '\x1b[1m';
    colors.red = '\x1b[31m';
    colors.green = '\x1b[32m';
    colors.yellow = '\x1b[33m';
    colors.blue = '\x1b[34m';
    colors.magenta = '\x1b[35m';
    colors.cyan = '\x1b[36m';
  }
} catch (e) {
  // Sin colores si hay error
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✅ Directorio creado: ${dirPath}`, 'green');
  } else {
    log(`ℹ️  Directorio ya existe: ${dirPath}`, 'yellow');
  }
}

function createFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✅ Archivo creado: ${filePath}`, 'green');
  } else {
    log(`ℹ️  Archivo ya existe: ${filePath}`, 'yellow');
  }
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 16) {
      log(`✅ Node.js ${version} encontrado`, 'green');
      return true;
    } else {
      log(`❌ Node.js ${version} encontrado, pero se requiere v16+`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error verificando versión de Node.js', 'red');
    return false;
  }
}

function checkNpm() {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm v${version} encontrado`, 'green');
    return true;
  } catch (error) {
    log('❌ npm no está disponible', 'red');
    return false;
  }
}

function main() {
  log('🏗️  Configurando Obra 360 para Windows...', 'cyan');
  log('==========================================', 'cyan');

  // Verificar prerequisitos
  log('\n📋 Verificando prerequisitos...', 'blue');
  
  if (!checkNodeVersion()) {
    log('\n❌ Por favor instala Node.js v16+ desde: https://nodejs.org/', 'red');
    log('Después ejecuta: npm run setup', 'yellow');
    process.exit(1);
  }

  if (!checkNpm()) {
    log('\n❌ npm no está disponible. Reinstala Node.js.', 'red');
    process.exit(1);
  }

  // Mostrar información del sistema
  log(`\n💻 Sistema: ${process.platform} ${process.arch}`, 'blue');
  log(`📁 Directorio: ${process.cwd()}`, 'blue');

  // Crear estructura de directorios
  log('\n📁 Creando estructura de directorios...', 'blue');
  
  const directories = [
    'public',
    'public/css',
    'public/js', 
    'public/images',
    'public/images/materiales',
    'public/sounds',
    'src',
    'src/js',
    'src/components',
    'src/components/Sidebar',
    'src/components/Sidebar/hooks',
    'src/components/Sidebar/context',
    'views',
    'views/pages',
    'views/partials',
    'views/layout',
    'helpers',
    'routes',
    'dist',
    'logs',
    'uploads',
    'reports',
    'backups'
  ];

  directories.forEach(createDirectory);

  // Crear archivo .env
  log('\n🔧 Configurando variables de entorno...', 'blue');
  
  if (!fs.existsSync('.env')) {
    const envContent = `# Configuración de Obra 360
NODE_ENV=development
PORT=3000

# Seguridad
JWT_SECRET=obra360_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# URLs
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Debug
DEBUG=obra360:*

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Configuración de desarrollo
WEBPACK_DEV_SERVER=true`;
    
    createFile('.env', envContent);
    log('⚠️  Recuerda cambiar JWT_SECRET en producción', 'yellow');
  } else {
    log('ℹ️  Archivo .env ya existe', 'yellow');
  }

  // Crear .gitignore
  log('\n📝 Configurando .gitignore...', 'blue');
  
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build
dist/
build/

# Logs
logs/
*.log

# Runtime
pids/
*.pid
*.seed
*.pid.lock

# Coverage
coverage/

# Uploads
uploads/
reports/
backups/

# OS - Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# OS - macOS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary
tmp/
temp/`;

  createFile('.gitignore', gitignoreContent);

  // Verificar package.json
  log('\n📦 Verificando dependencias...', 'blue');
  
  if (!fs.existsSync('package.json')) {
    log('❌ package.json no encontrado.', 'red');
    log('Ejecuta: npm init -y', 'yellow');
    process.exit(1);
  }

  // Verificar e instalar dependencias
  if (!fs.existsSync('node_modules')) {
    log('📥 Instalando dependencias...', 'blue');
    log('Esto puede tomar unos minutos...', 'yellow');
    
    try {
      execSync('npm install', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      log('✅ Dependencias instaladas correctamente', 'green');
    } catch (error) {
      log('❌ Error instalando dependencias:', 'red');
      log(error.message, 'red');
      log('\nIntenta ejecutar manualmente: npm install', 'yellow');
    }
  } else {
    log('✅ Dependencias ya instaladas', 'green');
  }

  // Crear archivos JavaScript necesarios
  log('\n🎨 Creando archivos base...', 'blue');
  
  // auth.js para desarrollo
  const authJsContent = `// Simulador de autenticación para desarrollo
console.log('🔐 Auth module loaded');

window.authManager = {
  getUser() {
    return {
      id: 1,
      firstName: 'Admin',
      lastName: 'Usuario',
      email: 'admin@obra360.com',
      role: 'ADMIN'
    };
  },
  
  logout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
      alert('Logout simulado - Redirigiendo...');
      // En producción: window.location.href = '/login';
    }
  },
  
  isAuthenticated() {
    return true; // Siempre autenticado en desarrollo
  }
};

console.log('✅ Auth manager inicializado');`;

  createFile('src/js/auth.js', authJsContent);

  // dashboard.js
  const dashboardJsContent = `// Dashboard JavaScript específico
console.log('📊 Dashboard JS loaded');

// Funciones del dashboard
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Dashboard inicializado');
  
  // Ejemplo de función para actualizar datos
  function actualizarDashboard() {
    console.log('Actualizando datos del dashboard...');
    // Aquí irían las llamadas AJAX reales
  }
  
  // Ejecutar cada 30 segundos
  setInterval(actualizarDashboard, 30000);
});`;

  createFile('src/js/dashboard.js', dashboardJsContent);

  // Intentar construir assets
  log('\n🔨 Construyendo assets...', 'blue');
  
  if (fs.existsSync('webpack.config.js')) {
    try {
      log('Ejecutando webpack build...', 'yellow');
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 60000 // 1 minuto timeout
      });
      log('✅ Assets construidos correctamente', 'green');
    } catch (error) {
      log('⚠️  Build falló, pero continuando...', 'yellow');
      log('Puedes ejecutar manualmente: npm run build', 'cyan');
    }
  } else {
    log('ℹ️  webpack.config.js no encontrado', 'yellow');
  }

  // Verificar configuración
  log('\n✅ Verificando configuración final...', 'blue');
  
  const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'views/pages/dashboard.ejs',
    'views/partials/sidebar.ejs'
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} faltante`, 'red');
      allFilesExist = false;
    }
  });

  // Resumen final
  log('\n🎉 ¡Configuración completada!', 'bright');
  log('=========================================', 'cyan');
  
  if (allFilesExist) {
    log('\n✅ Todo está listo para usar', 'green');
    log('\n🚀 Próximos pasos:', 'blue');
    log('1. npm run dev    (iniciar servidor)', 'cyan');
    log('2. Abrir: http://localhost:3000', 'cyan');
    log('3. ¡Comenzar a usar Obra 360!', 'cyan');
  } else {
    log('\n⚠️  Algunos archivos faltan', 'yellow');
    log('Asegúrate de copiar todos los archivos del proyecto', 'yellow');
  }
  
  log('\n💡 Comandos útiles:', 'blue');
  log('• npm run dev     - Modo desarrollo', 'cyan');
  log('• npm run build   - Construir assets', 'cyan');
  log('• npm start       - Modo producción', 'cyan');
  log('• npm run watch   - Watch assets', 'cyan');
  log('• npm run clean   - Limpiar archivos', 'cyan');
  
  log('\n📖 Documentación:', 'blue');
  log('• README.md       - Documentación completa', 'cyan');
  log('• QUICK_START.md  - Guía rápida', 'cyan');
  
  log('\n🌐 Una vez iniciado, visita:', 'blue');
  log('• http://localhost:3000/         - Dashboard', 'cyan');
  log('• http://localhost:3000/obras    - Obras', 'cyan');
  log('• http://localhost:3000/materiales - Materiales', 'cyan');
  
  log('\n🎊 ¡Obra 360 configurado para Windows!', 'green');
}

// Manejo de errores global
process.on('uncaughtException', (error) => {
  log('\n❌ Error inesperado:', 'red');
  log(error.message, 'red');
  log('\nIntenta ejecutar el setup nuevamente', 'yellow');
  process.exit(1);
});

// Ejecutar setup
if (require.main === module) {
  main();
}

module.exports = { main };