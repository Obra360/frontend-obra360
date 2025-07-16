# frontend-obra360

Frontend webapp for **Obra360**, a digital platform designed to streamline project management and material tracking for small and medium-sized construction businesses (PyMEs) in Argentina.

## 🧱 Proyecto

**Obra360** busca ofrecer una solución integral para el seguimiento de obras, la administración de materiales, personal y certificaciones, con una interfaz clara, moderna y responsive.

Este repositorio contiene el **frontend** del sistema, construido con:

- HTML5
- CSS3 / SCSS
- JavaScript (Vanilla)
- Bootstrap 5
- Feather Icons & Bootstrap Icons

---

## 📁 Estructura del proyecto

/html
├─ index/ → Vista principal / Dashboard
├─ obras/ → Listado y alta de obras
├─ materiales/ → Catálogo y carga de materiales
├─ certificaciones/ → Certificaciones registradas y nueva certificación
└─ personal/ → Gestión de usuarios y operadores

/src
├─ app.css → Estilos principales
└─ app.js → Scripts generales (sidebar, interacciones, etc.)


---

## 🧪 Funcionalidades principales

✅ Navegación lateral (sidebar) con secciones dinámicas  
✅ Listado y alta de obras  
✅ Gestión de materiales por obra  
✅ Registro y exportación de certificaciones  
✅ Administración de usuarios (administradores y operadores)

---

## 🚀 Instalación y uso local

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/frontend-obra360.git
cd frontend-obra360

2. Abrir el archivo index.html en tu navegador, o servirlo con alguna extensión de Live Server.

No requiere dependencias ni entorno de ejecución backend para la vista previa.

🔐 Roles de usuario
Administrador: puede ver y gestionar todo, incluyendo dar de alta/baja operadores.

Operador: acceso restringido a operaciones básicas de registro y consulta.

📌 Notas
Este frontend está diseñado para integrarse con el backend del proyecto Obra360, que manejará la base de datos y la autenticación.

Proyecto en desarrollo, se aceptan sugerencias y mejoras vía Pull Request.

📄 Licencia
MIT © 2025 — Proyecto educativo y profesional desarrollado por ----