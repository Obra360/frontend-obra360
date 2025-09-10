// public/js/page-materiales.js
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");

  // REEMPLAZAR todo el event listener por:
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", file);

    alert("Iniciando importación...");

    try {
      // USAR authUtils.apiRequest en lugar de fetch directo
      const result = await window.authUtils.apiRequest(
        "/api/materiales/importar",
        {
          method: "POST",
          headers: {}, // No poner Content-Type para FormData
          body: formData,
        }
      );

      if (result.success) {
        alert("¡Importación exitosa! " + result.data.message);
        window.location.reload();
      } else {
        alert("Error al importar: " + result.error);
      }
    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de conexión con el servidor.");
    }
  });

  // ... (mantén las funciones verDetalles, editarMaterial y eliminarMaterial aquí si existen)
});
