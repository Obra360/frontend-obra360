// src/components/Sidebar/sidebar.config.js
export const SIDEBAR_CONFIG = {
  brand: {
    name: 'Obra 360',
    icon: 'bi-building',
    href: '/index.html'
  },

  menuItems: [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: 'bi-house',
      href: '/index.html',
      type: 'link',
      roles: ['ADMIN', 'SUPERVISOR', 'OPERARIO']
    },
    {
      id: 'obras',
      label: 'Obras',
      icon: 'bi-building',
      type: 'dropdown',
      roles: ['ADMIN', 'SUPERVISOR'],
      children: [
        {
          id: 'listado-obras',
          label: 'Listado de obras',
          href: '/html/obras/obras.html'
        },
        {
          id: 'nueva-obra',
          label: 'Nueva obra',
          href: '/html/obras/nueva-obra.html'
        }
      ]
    },
    {
      id: 'materiales',
      label: 'Materiales',
      icon: 'bi-box-seam',
      type: 'dropdown',
      roles: ['ADMIN', 'SUPERVISOR', 'OPERARIO'],
      children: [
        {
          id: 'listado-materiales',
          label: 'Listado de materiales',
          href: '/html/materiales/materiales.html'
        },
        {
          id: 'nuevo-material',
          label: 'Nuevo material',
          href: '/html/materiales/nuevo-material.html',
          roles: ['ADMIN', 'SUPERVISOR']
        }
      ]
    },
    {
      id: 'certificaciones',
      label: 'Certificaciones',
      icon: 'bi-file-earmark-check',
      type: 'dropdown',
      roles: ['ADMIN', 'SUPERVISOR'],
      badge: '5',
      children: [
        {
          id: 'certificaciones-registradas',
          label: 'Certificaciones registradas',
          href: '/html/certificaciones/certificaciones.html'
        },
        {
          id: 'nueva-certificacion',
          label: 'Nueva certificación',
          href: '/html/certificaciones/nueva-certificacion.html'
        }
      ]
    },
    {
      id: 'personal',
      label: 'Personal',
      icon: 'bi-people',
      type: 'dropdown',
      roles: ['ADMIN', 'SUPERVISOR'],
      children: [
        {
          id: 'listado-personal',
          label: 'Listado de personal',
          href: '/html/personal/personal.html'
        },
        {
          id: 'nuevo-personal',
          label: 'Nuevo ingreso',
          href: '/html/personal/nuevo-personal.html'
        },
        {
          id: 'control-horas',
          label: 'Control de horas',
          href: '/html/personal/control-horas.html'
        }
      ]
    }
  ]
};