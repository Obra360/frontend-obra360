document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  if (!form) return; // prevenir error si el formulario no existe

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Login exitoso");
        console.log("Token:", data.token);
        // podés guardar el token en localStorage si querés usarlo luego
        localStorage.setItem("token", data.token);
      } else {
        alert("Login fallido: " + (data.error || "Verificá tus credenciales"));
      }
    } catch (err) {
      console.error("Error al conectar con el servidor:", err);
      alert("Error de conexión");
    }
  });
});