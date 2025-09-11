// Excel Import Functionality - Add this to your existing page-materiales.js
document.addEventListener("DOMContentLoaded", function () {
  const importModal = document.getElementById("importModal");
  const fileInput = document.getElementById("excelFile");
  const dropZone = document.getElementById("dropZone");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadSection = document.getElementById("uploadSection");
  const progressSection = document.getElementById("progressSection");
  const resultsSection = document.getElementById("resultsSection");

  let selectedFile = null;

  // File input change
  fileInput.addEventListener("change", function (e) {
    handleFileSelect(e.target.files[0]);
  });

  // Drag & Drop functionality
  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-primary");
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-primary");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-primary");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // Handle file selection
  function handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Por favor selecciona un archivo Excel válido (.xlsx o .xls)");
      return;
    }

    selectedFile = file;
    uploadBtn.style.display = "block";
    dropZone.innerHTML = `
            <i class="bi bi-file-earmark-excel fs-1 text-success"></i>
            <p class="mb-0"><strong>${file.name}</strong></p>
            <small class="text-muted">${(file.size / 1024 / 1024).toFixed(
              2
            )} MB</small>
        `;
  }

  // Upload button click
  uploadBtn.addEventListener("click", function () {
    if (!selectedFile) return;
    uploadExcelFile(selectedFile);
  });

  // Upload Excel file
  async function uploadExcelFile(file) {
    const formData = new FormData();
    formData.append("excel", file);

    uploadSection.style.display = "none";
    progressSection.style.display = "block";
    uploadBtn.style.display = "none";

    try {
      // Use the localStorage token
      const token = localStorage.getItem("obra360_token");

      const response = await fetch(
        "https://mature-romona-obra360-e2712968.koyeb.app/api/materiales/importar",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`, // Use the correct localStorage key
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al importar archivo");
      }

      showResults(result);
    } catch (error) {
      console.error("Error importing Excel:", error);
      showError(error.message);
    } finally {
      progressSection.style.display = "none";
    }
  }
  // Show results
  function showResults(result) {
    const { summary, results } = result;

    resultsSection.style.display = "block";

    // Update summary
    const summaryText = document.getElementById("summaryText");
    summaryText.innerHTML = `
            <strong>Total procesadas:</strong> ${summary.total} filas<br>
            <strong>Exitosas:</strong> ${summary.success}<br>
            <strong>Con errores:</strong> ${summary.errors}
        `;

    // Update alert class based on results
    const summaryAlert = document.getElementById("summaryAlert");
    if (summary.errors === 0) {
      summaryAlert.className = "alert alert-success";
    } else if (summary.success > 0) {
      summaryAlert.className = "alert alert-warning";
    } else {
      summaryAlert.className = "alert alert-danger";
    }

    // Show errors if any
    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      showErrors(errors);
    }

    // Refresh materials list if any succeeded
    if (summary.success > 0) {
      // Call your existing function to reload the materials table
      // You might need to adjust this based on your existing code
      if (typeof loadMateriales === "function") {
        loadMateriales();
      } else {
        location.reload(); // Fallback to reload page
      }
    }
  }

  // Show errors
  function showErrors(errors) {
    const errorsList = document.getElementById("errorsList");
    const errorsTableBody = document.getElementById("errorsTableBody");

    errorsList.style.display = "block";
    errorsTableBody.innerHTML = "";

    errors.forEach((error) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${error.row}</td>
                <td>${error.error}</td>
            `;
      errorsTableBody.appendChild(row);
    });
  }

  // Show error
  function showError(message) {
    resultsSection.style.display = "block";
    const summaryAlert = document.getElementById("summaryAlert");
    summaryAlert.className = "alert alert-danger";
    summaryAlert.innerHTML = `
            <h6 class="alert-heading">Error</h6>
            <p class="mb-0">${message}</p>
        `;
  }

  // Reset modal when closed
  if (importModal) {
    importModal.addEventListener("hidden.bs.modal", function () {
      selectedFile = null;
      uploadSection.style.display = "block";
      progressSection.style.display = "none";
      resultsSection.style.display = "none";
      uploadBtn.style.display = "none";
      fileInput.value = "";
      dropZone.innerHTML = `
                <i class="bi bi-cloud-upload fs-1 text-muted"></i>
                <p class="mb-0">Arrastra el archivo aquí o haz clic para seleccionar</p>
            `;
    });
  }
});
