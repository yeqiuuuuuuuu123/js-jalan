const tableBody =
  document.getElementById("tableBody");

const searchInput =
  document.getElementById("searchInput");

const refreshBtn =
  document.getElementById("refreshBtn");

let detections = [];

const locationCache = {};

const API_BASE =
  window.location.origin;

const API_URL =
  `${API_BASE}/api/detection`;

  const currentUser =
  JSON.parse(
    localStorage.getItem("user")
  );

const isAdmin =
  currentUser?.role === "admin";

/* =========================
   FORMAT TANGGAL
========================= */

function formatTanggal(dateString){

  const date =
    new Date(dateString);

  return {

    tanggal:
      date.toLocaleDateString(
        "id-ID"
      ),

    waktu:
      date.toLocaleTimeString(
        "id-ID"
      )

  };

}

/* =========================
   GET LOCATION NAME
========================= */

async function getLocationName(
  latitude,
  longitude
){

  try{

    if(

      latitude === undefined ||
      longitude === undefined ||

      latitude === null ||
      longitude === null

    ){

      return "Lokasi Tidak Diketahui";

    }

    const cacheKey =
      `${latitude},${longitude}`;

    if(locationCache[cacheKey]){

      return locationCache[cacheKey];

    }

    const response =
      await fetch(

        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`

      );

    if(!response.ok){

      throw new Error(
        "Gagal mengambil lokasi"
      );

    }

    const data =
      await response.json();

    let lokasi =

      data.address?.road ||

      data.address?.village ||

      data.address?.suburb ||

      data.address?.city ||

      data.display_name ||

      "Lokasi Tidak Diketahui";

    locationCache[cacheKey] =
      lokasi;

    return lokasi;

  }

  catch(err){

    console.log(
      "LOCATION ERROR:",
      err
    );

    return "Lokasi Tidak Diketahui";

  }

}



/* =========================
   STATUS
========================= */

function getStatus(severity){

  if(severity === "besar"){

    return {

      text:
        "Perlu Perbaikan",

      class:
        "status-rusak-berat"

    };

  }

  if(severity === "sedang"){

    return {

      text:
        "Perlu Monitoring",

      class:
        "status-sedang"

    };

  }

  return {

    text:
      "Aman",

    class:
      "status-baik"

  };

}

/* =========================
   DELETE DATA
========================= */

async function deleteData(id){

  const konfirmasi =
    confirm(
      "Yakin ingin menghapus data ini?"
    );

  if(!konfirmasi){

    return;

  }

  try{

  const token =
  localStorage.getItem("token");

const response =
  await fetch(

      `${API_URL}/${id}`,

      {

        method:"DELETE",

        headers:{
          Authorization: `Bearer ${token}`,
          "Content-Type":"application/json"
        }

      }

    );
    
    if(!response.ok){

      throw new Error(
        "Gagal menghapus data"
      );

    }

    alert(
      "Data berhasil dihapus"
    );

    loadDetections();

  }

  catch(error){

    console.log(error);

    alert(
      "Gagal menghapus data"
    );

  }

}

/* =========================
   LOAD DATA
========================= */

async function loadDetections(){

  try{

    tableBody.innerHTML =

    `
    <tr>

      <td
        colspan="7"
        class="empty-data"
      >

        Memuat data...

      </td>

    </tr>
    `;

       const response =
              await fetch(
                API_URL
          );

    if(!response.ok){

      throw new Error(
        "Gagal mengambil data"
      );

    }

    const result =
      await response.json();

    detections =
      result.data || [];

    renderTable(
      detections
    );

  }

  catch(error){

    console.error(error);

    tableBody.innerHTML =

    `
    <tr>

      <td
        colspan="7"
        class="empty-data"
      >

        Gagal mengambil data

      </td>

    </tr>
    `;

  }

}

/* =========================
   RENDER TABLE
========================= */

async function renderTable(data){

  tableBody.innerHTML = "";

  if(data.length === 0){

    tableBody.innerHTML =

    `
    <tr>

      <td
        colspan="7"
        class="empty-data"
      >

        Belum ada data deteksi

      </td>

    </tr>
    `;

    return;

  }

  let no = 1;

  for(const item of data){

    const waktuData =
      formatTanggal(
        item.createdAt
      );

    const status =
      getStatus(
        item.severity
      );

    let badgeClass =
      "ringan";

    if(item.severity === "sedang"){

      badgeClass =
        "sedang";

    }

    if(item.severity === "besar"){

      badgeClass =
        "berat";

    }

    const kerusakan =

      item.severity
        .charAt(0)
        .toUpperCase()

      +

      item.severity
        .slice(1);

    let lokasi =
      "Lokasi Tidak Diketahui";

    if(

      item.location &&

      item.location !==
      "Unknown Location" &&

      item.location !==
      "Lokasi Tidak Diketahui"

    ){

      lokasi =
        item.location;

    }

    else{

      lokasi =
        await getLocationName(

          item.latitude,

          item.longitude

        );

    }

    tableBody.innerHTML +=

    `
    <tr>

      <td>
        ${no++}
      </td>

      <td>
        ${waktuData.tanggal}
      </td>

      <td>
        ${waktuData.waktu}
      </td>

      <td>
        ${lokasi}
      </td>

      <td>

        <span
          class="badge ${badgeClass}"
        >

          ${kerusakan}

        </span>

      </td>

      <td class="${status.class}">
        ${status.text}
      </td>

       <td>

         ${
            isAdmin
                     ?
    `
      <button
      class="delete-btn"
      onclick="deleteData('${item._id}')"
    >
      Hapus
    </button>
    `
    :
    ""
  }

</td>

    </tr>
    `;

  }

}

/* =========================
   SEARCH
========================= */

searchInput.addEventListener(

  "input",

  () => {

    const keyword =

      searchInput.value
      .toLowerCase();

    const filtered =

      detections.filter(item =>

        (
          item.location || ""
        )
        .toLowerCase()
        .includes(keyword)

      );

    renderTable(
      filtered
    );

  }

);

/* =========================
   REFRESH BUTTON
========================= */

if(refreshBtn){

  refreshBtn.addEventListener(

    "click",

    () => {

      loadDetections();

    }

  );

}

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

document.addEventListener(
  "DOMContentLoaded",
  () => {

    checkLogin();
    roleCheck();
    loadDetections();

  }
);

function checkLogin(){

  const token =
    localStorage.getItem("token");

  if(!token){

    window.location.href =
      "login.html";

  }

}

function roleCheck(){

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  if(!user){

    window.location.href =
      "login.html";

    return;

  }

  const menuDeteksi =
    document.getElementById(
      "menuDeteksi"
    );

  const menuAdmin =
    document.getElementById(
      "menuAdmin"
    );

  const aksiHeader =
     document.getElementById(
    "aksiHeader"
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

    if(aksiHeader){

       aksiHeader.style.display =
       "none";

}

  }

}

