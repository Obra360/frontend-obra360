#!/usr/bin/env node

/**
 * Script de configuración inicial para Obra 360
 * Automatiza la creación de directorios, archivos de configuración y verificación de dependencias
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

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
    fs.writeFileSync(filePath, content);
    log(`✅ Archivo creado: ${filePath}`, 'green');
  } else {
    log(`ℹ️  Archivo ya existe: ${filePath}`, 'yellow');
  }
}

function checkCommand(command) {
  try {
    // Detectar sistema operativo
    const isWindows = process.platform === 'win32';
    const checkCmd = isWindows ? `where ${command}` : `which ${command}`;
    
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function main() {
  log('🏗️  Configurando Obra 360...', 'cyan');
  log('=====================================', 'cyan');

  // Verificar prerequisitos
  log('\n📋 Verificando prerequisitos...', 'blue');
  
  if (!checkCommand('node')) {
    log('❌ Node.js no está instalado', 'red');
    process.exit(1);
  }
  log('✅ Node.js encontrado', 'green');

  if (!checkCommand('npm')) {
    log('❌ npm no está instalado', 'red');
    process.exit(1);
  }
  log('✅ npm encontrado', 'green');

  // Crear estructura de directorios
  log('\n📁 Creando estructura de directorios...', 'blue');
  
  const directories = [
    'public/css',
    'public/js',
    'public/images',
    'public/images/materiales',
    'public/sounds',
    'src/js',
    'src/components/Sidebar',
    'src/components/Sidebar/hooks',
    'src/components/Sidebar/context',
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

  // Crear archivo .env si no existe
  log('\n🔧 Configurando variables de entorno...', 'blue');
  
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      log('✅ Archivo .env creado desde .env.example', 'green');
      log('⚠️  Recuerda configurar las variables en .env', 'yellow');
    } else {
      const defaultEnv = `NODE_ENV=development
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here
BASE_URL=http://localhost:3000
DEBUG=obra360:*`;
      
      createFile('.env', defaultEnv);
    }
  } else {
    log('ℹ️  Archivo .env ya existe', 'yellow');
  }

  // Crear gitignore si no existe
  log('\n📝 Configurando .gitignore...', 'blue');
  
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Uploads
uploads/
reports/
backups/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
tmp/
temp/`;

  createFile('.gitignore', gitignoreContent);

  // Verificar package.json
  log('\n📦 Verificando package.json...', 'blue');
  
  if (!fs.existsSync('package.json')) {
    log('❌ package.json no encontrado. Ejecuta "npm init" primero.', 'red');
  } else {
    log('✅ package.json encontrado', 'green');
    
    // Verificar si las dependencias están instaladas
    if (!fs.existsSync('node_modules')) {
      log('📥 Instalando dependencias...', 'blue');
      try {
        execSync('npm install', { stdio: 'inherit' });
        log('✅ Dependencias instaladas correctamente', 'green');
      } catch (error) {
        log('❌ Error instalando dependencias', 'red');
        console.error(error);
      }
    } else {
      log('✅ Dependencias ya instaladas', 'green');
    }
  }

  // Crear archivos de ejemplo para desarrollo
  log('\n🎨 Creando archivos de ejemplo...', 'blue');
  
  // auth.js placeholder
  const authJsContent = `// Simulador de autenticación para desarrollo
console.log('🔐 Auth module cargado');

window.authManager = {
  getUser() {
    return {
      id: 1,
      firstName: 'Admin',
      lastName: 'Papu',
      email: 'admin@obra360.com',
      role: 'ADMIN'
    };
  },
  
  logout() {
    alert('Funcionalidad de logout en desarrollo');
    // window.location.href = '/login';
  },
  
  isAuthenticated() {
    return true; // Siempre autenticado en desarrollo
  }
};`;

  createFile('src/js/auth.js', authJsContent);

  // dashboard.js placeholder
  const dashboardJsContent = `// Dashboard específico JavaScript
console.log('📊 Dashboard JS cargado');

// Funciones específicas del dashboard
function actualizarDatos() {
  console.log('Actualizando datos del dashboard...');
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard inicializado');
});`;

  createFile('src/js/dashboard.js', dashboardJsContent);

  // Construir assets si webpack está configurado
  log('\n🔨 Construyendo assets...', 'blue');
  
  if (fs.existsSync('webpack.config.js')) {
    try {
      execSync('npm run build', { stdio: 'inherit' });
      log('✅ Assets construidos correctamente', 'green');
    } catch (error) {
      log('⚠️  Error construyendo assets (continuando...)', 'yellow');
    }
  } else {
    log('ℹ️  webpack.config.js no encontrado, saltando build', 'yellow');
  }

  // Verificar puerto disponible
  log('\n🌐 Verificando configuración del servidor...', 'blue');
  
  const port = process.env.PORT || 3000;
  log(`✅ Puerto configurado: ${port}`, 'green');

  // Resumen final
  log('\n🎉 ¡Configuración completada!', 'bright');
  log('=====================================', 'cyan');
  log('\n📋 Próximos pasos:', 'blue');
  log('1. Revisa y configura las variables en .env', 'cyan');
  log('2. Ejecuta "npm run dev" para desarrollo', 'cyan');
  log('3. Abre http://localhost:3000 en tu navegador', 'cyan');
  log('4. ¡Comienza a usar Obra 360!', 'cyan');
  
  log('\n🔧 Comandos útiles:', 'blue');
  log('• npm run dev    - Modo desarrollo', 'cyan');
  log('• npm run build  - Construir assets', 'cyan');
  log('• npm start      - Modo producción', 'cyan');
  log('• npm run watch  - Watch mode para assets', 'cyan');
  
  log('\n💡 Recursos:', 'blue');
  log('• Documentación: README.md', 'cyan');
  log('• Estructura: Revisa la carpeta del proyecto', 'cyan');
  log('• Soporte: Consulta la documentación', 'cyan');
  
  log('\n🚀 ¡Obra 360 está listo para usar!', 'green');
}

// Ejecutar setup
if (require.main === module) {
  main();
}

module.exports = { main };