
// supabaseClient.js
// Inicializa el cliente Supabase correctamente
const supabaseUrl = 'https://hvgyzhmqyunnquarpbhh.supabase.co';
const supabaseAnonKey = 'tu-clave-anon-publica'; // NO uses el JWT largo de admin

const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Guardar el cliente en window si necesitás accederlo globalmente
window.supabaseClient = supabase;

// Esperar a que se cargue la sesión actual (usuario autenticado)
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('Error al obtener sesión:', error);
  } else if (session) {
    console.log('🟢 Usuario autenticado:', session.user);
  } else {
    console.warn('🟡 No hay sesión activa');
  }
});
