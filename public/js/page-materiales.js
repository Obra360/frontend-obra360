// public/js/page-materiales.js
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('excelFile', file);

        // Muestra un mensaje de carga
        alert('Iniciando importación...');

        try {
            const response = await fetch('/api/materiales/importar', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert('¡Importación exitosa! ' + result.message);
                window.location.reload(); // Recarga la página para mostrar los nuevos datos
            } else {
                alert('Error al importar: ' + (result.message || result.error));
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('Error de conexión con el servidor.');
        }
    });

    // ... (mantén las funciones verDetalles, editarMaterial y eliminarMaterial aquí si existen)
});