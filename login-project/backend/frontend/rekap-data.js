const API_BASE =
  window.location.origin;

const CITY_SUMMARY_API =
  `${API_BASE}/api/detection/city-summary`;

const DELETE_ALL_API =
  `${API_BASE}/api/detection/delete-all`;

async function loadRekap() {

    const tableBody =
    document.getElementById("tableBody");

    try {

        tableBody.innerHTML = `
        <tr>
            <td colspan="9">
                Memuat data...
            </td>
        </tr>
        `;

        const response =
            await fetch(
                CITY_SUMMARY_API
        );

        if(!response.ok){
            throw new Error("Gagal mengambil data");
        }

        const data =
        await response.json();

        tableBody.innerHTML = "";

        if(data.length === 0){

            tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    Tidak ada data
                </td>
            </tr>
            `;

            return;
        }

        let totalKota = 0;
        let totalKerusakan = 0;
        let totalIKJ = 0;
        let prioritas = 0;

        totalKota = data.length;

        data.forEach((item,index)=>{

            totalKerusakan += item.total;
            const ikj = item.IKJ || 0;

            totalIKJ += ikj;

            let status = "Baik";
            let badge = "success";

            if(ikj < 50){

                status = "Perlu Perbaikan";
                badge = "danger";

                prioritas++;

            }
            else if(ikj < 75){

                status = "Monitoring";
                badge = "warning";

            }

            tableBody.innerHTML += `
            <tr>

                <td>${index + 1}</td>
                <td>${item.city}</td>
                <td>${item.kecil}</td>
                <td>${item.sedang}</td>
                <td>${item.besar}</td>
                <td>${item.total}</td>
                <td>${ikj.toFixed(2)}%</td>

                <td>
                    <span class="badge ${badge}">
                        ${status}
                    </span>
                </td>

                <td>
                    <button
                        class="detail-btn"
                        onclick="viewDetail('${item.city}')"
                    >
                        Detail
                    </button>
                </td>

            </tr>
            `;
        });

        document.getElementById("totalKota").innerText =
        totalKota;

        document.getElementById("totalKerusakan").innerText =
        totalKerusakan;

        document.getElementById("avgIKJ").innerText =
        totalKota > 0
        ?
        (
            totalIKJ / totalKota
        ).toFixed(2) + "%"
        :
        "0%";

        document.getElementById("prioritas").innerText =
        prioritas;

    }

    catch(error){

        console.error(
            "REKAP ERROR:",
            error
        );

        tableBody.innerHTML = `
        <tr>
            <td colspan="9">
                Gagal memuat data
            </td>
        </tr>
        `;
    }
}

/* =========================
   DETAIL
========================= */

function viewDetail(city){

    alert(
        "Detail wilayah: " + city
    );

}

/* =========================
   DELETE ALL
========================= */

async function deleteAllData(){

    const confirmDelete =
    confirm(
        "Yakin ingin menghapus SEMUA data?"
    );

    if(!confirmDelete) return;

    try{

        const token =
            localStorage.getItem("token");

        console.log("TOKEN =", token);

        const response =
            await fetch(
                DELETE_ALL_API,
                {
                    method:"DELETE",

                    headers:{
                        Authorization: `Bearer ${token}`,
                        "Content-Type":"application/json"
                    }
                }
            );

        const result =
            await response.json();

        console.log(result);

        alert(result.message);

        loadRekap();

    }

    catch(error){

        console.error(error);

        alert(
            "Gagal menghapus data"
        );

    }

}

/* =========================
   SEARCH
========================= */

function initSearch(){

    const searchInput =
    document.getElementById(
        "searchInput"
    );

    if(!searchInput) return;

    searchInput.addEventListener(

        "keyup",

        function(){

            const keyword =
            this.value.toLowerCase();

            const rows =
            document.querySelectorAll(
                "#tableBody tr"
            );

            rows.forEach(row=>{

                if(row.children.length < 2)
                    return;

                const city =
                row.children[1]
                .innerText
                .toLowerCase();

                row.style.display =

                city.includes(keyword)
                ?
                ""
                :
                "none";

            });

        }

    );

}

/* =========================
   START
========================= */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        loadRekap();
        initSearch();

    }

);

const menuBtn =
  document.getElementById("menuBtn");

const sidebar =
  document.querySelector(".sidebar");

const overlay =
  document.getElementById("overlay");

if(menuBtn){

  menuBtn.addEventListener(
    "click",
    () => {

      sidebar.classList.toggle("show");
      overlay.classList.toggle("show");

    }
  );

  overlay.addEventListener(
    "click",
    () => {

      sidebar.classList.remove("show");
      overlay.classList.remove("show");

    }
  );
}

/* =========================
   ROLE CHECK
========================= */

const user =
  JSON.parse(
    localStorage.getItem("user")
  );

if(!user){

  window.location.href =
    "login.html";
}

console.log(
  "USER LOGIN:",
  user
);

const menuDeteksi =
  document.getElementById(
    "menuDeteksi"
  );

const menuAdmin =
  document.getElementById(
    "menuAdmin"
  );

if(user.role !== "admin"){

  if(menuDeteksi){

    menuDeteksi.style.display =
      "none";
  }

  if(menuAdmin){

    menuAdmin.style.display =
      "none";
  }

}

const deleteAllBtn =
  document.getElementById(
    "deleteAllBtn"
  );

if(
  user.role !== "admin" &&
  deleteAllBtn
){

  deleteAllBtn.style.display =
    "none";

}