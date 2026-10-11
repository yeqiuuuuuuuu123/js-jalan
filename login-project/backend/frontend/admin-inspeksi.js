  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  if(
    !user ||
    user.role !== "admin"
  ){

    alert("Akses ditolak");

    window.location.href =
      "dashboard.html";

  }

  const API_BASE =
    window.location.origin;

  const tableBody =
    document.getElementById("tableBody");

  const modal =
    document.getElementById("modal");

  const closeModal =
    document.getElementById("closeModal");

  const modalImage =
    document.getElementById("modalImage");

  const modalLokasi =
    document.getElementById("modalLokasi");

  const modalDescription =
    document.getElementById("modalDescription");

  const severitySelect =
    document.getElementById("severitySelect");

  const statusSelect =
    document.getElementById("statusSelect");


  const adminNote =
    document.getElementById("adminNote");

  const saveBtn =
    document.getElementById("saveBtn");

  const deleteBtn =
    document.getElementById("deleteBtn");

  const searchInput =
    document.getElementById("searchInput");

  let currentId = null;

  /* =========================
    LOAD REPORTS
  ========================= */

  async function loadReports(){

    try{

      const response =
        await fetch(
          `${API_BASE}/api/reports/all`
        );

      const result =
        await response.json();

      const reports =
        result.data || [];

      tableBody.innerHTML = "";

      reports.forEach((report,index)=>{

        const row =
          document.createElement("tr");

        row.innerHTML = `

          <td>${index + 1}</td>

          <td>
            <img
              src="${API_BASE}/uploads/${report.image}"
              style="width:80px;height:60px;object-fit:cover;border-radius:8px;"
            >
          </td>

          <td>
            ${report.location || "-"}
          </td>

          <td>
            ${report.severity || "belum"}
          </td>

          <td>
            ${report.status || "Pending"}
          </td>


          <td>

            <div class="action-buttons">

              <button
                class="inspect-btn"
                onclick="openModal('${report._id}')"
              >
                Inspeksi
              </button>

              <button
                class="delete-btn"
                onclick="deleteReport('${report._id}')"
              >
                Hapus
              </button>

            </div>

          </td>

        `;

        tableBody.appendChild(row);

      });

    }
    catch(error){

      console.error(error);

      alert(
        "Gagal memuat data laporan"
      );

    }

  }

  /* =========================
    OPEN MODAL
  ========================= */

  async function openModal(id){

    try{

      currentId = id;

      const response =
        await fetch(
          `${API_BASE}/api/reports/${id}`
        );

      const report =
        await response.json();

      modal.style.display =
        "flex";

      modalImage.src =
        `${API_BASE}/uploads/${report.image}`;

      modalLokasi.innerText =
        report.location || "-";

      modalDescription.innerText =
        report.description || "-";

      severitySelect.value =
        report.severity || "belum";

      statusSelect.value =
        report.status || "Pending";


      adminNote.value =
        report.adminNote || "";

    }
    catch(error){

      console.error(error);

      alert(
        "Gagal membuka data laporan"
      );

    }

  }

  /* =========================
    CLOSE MODAL
  ========================= */

  closeModal.onclick = ()=>{

    modal.style.display =
      "none";

  };

  window.onclick = (e)=>{

    if(e.target === modal){

      modal.style.display =
        "none";

    }

  };

  /* =========================
    SAVE INSPEKSI
  ========================= */

  saveBtn.onclick =
  async ()=>{

    try{

      const body = {

        severity:
          severitySelect.value,

        status:
          statusSelect.value,


        adminNote:
          adminNote.value

      };

      const response =
        await fetch(

          `${API_BASE}/api/reports/update/${currentId}`,

          {

            method:"PUT",

            headers:{
              "Content-Type":
              "application/json"
            },

            body:
              JSON.stringify(body)

          }

        );

      const data =
        await response.json();

      alert(
        data.message ||
        "Data berhasil diperbarui"
      );

      modal.style.display =
        "none";

      loadReports();

    }
    catch(error){

      console.error(error);

      alert(
        "Gagal menyimpan inspeksi"
      );

    }

  };

  /* =========================
    DELETE REPORT
  ========================= */

  async function deleteReport(id){

    const konfirmasi =
      confirm(
        "Yakin ingin menghapus laporan ini?"
      );

    if(!konfirmasi) return;

    try{

      const response =
        await fetch(

          `${API_BASE}/api/reports/${id}`,

          {
            method:"DELETE"
          }

        );

      const data =
        await response.json();

      alert(
        data.message ||
        "Data berhasil dihapus"
      );

      loadReports();

    }
    catch(error){

      console.error(error);

      alert(
        "Gagal menghapus laporan"
      );

    }

  }

  /* =========================
    DELETE DARI MODAL
  ========================= */

  deleteBtn.onclick =
  ()=>{

    deleteReport(
      currentId
    );

    modal.style.display =
      "none";

  };

  /* =========================
    SEARCH
  ========================= */

  if(searchInput){

    searchInput.addEventListener(

      "keyup",

      ()=>{

        const keyword =
          searchInput.value
          .toLowerCase();

        const rows =
          document.querySelectorAll(
            "#tableBody tr"
          );

        rows.forEach((row)=>{

          const lokasi =
            row.children[2]
            .innerText
            .toLowerCase();

          row.style.display =
            lokasi.includes(keyword)
            ? ""
            : "none";

        });

      }

    );

  }

  /* =========================
    LOGOUT
  ========================= */

  function logout(){

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    window.location.href =
      "login.html";

  }

  /* =========================
    MOBILE MENU
  ========================= */

  const menuBtn =
    document.getElementById("menuBtn");

  const sidebar =
    document.querySelector(".sidebar");

  const overlay =
    document.getElementById("overlay");

  if(
    menuBtn &&
    sidebar &&
    overlay
  ){

    menuBtn.addEventListener(
      "click",
      ()=>{

        sidebar.classList.toggle(
          "show"
        );

        overlay.classList.toggle(
          "show"
        );

      }
    );

    overlay.addEventListener(
      "click",
      ()=>{

        sidebar.classList.remove(
          "show"
        );

        overlay.classList.remove(
          "show"
        );

      }
    );

  }

  /* =========================
    START
  ========================= */

  loadReports();