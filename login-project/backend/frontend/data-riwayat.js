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
   ELEMENT
========================= */

const table =
  document.getElementById("table");

const tbody =
  document.getElementById("dataTable");

const loading =
  document.getElementById("loading");

const errorBox =
  document.getElementById("error");

const refreshBtn =
  document.getElementById("refreshBtn");

/* =========================
   CACHE LOKASI
========================= */

const locationCache = {};

/* =========================
   FORMAT TANGGAL
========================= */

function formatTanggal(dateString){

  const date =
    new Date(dateString);

  return date.toLocaleString(

    "id-ID",

    {

      day:"numeric",
      month:"long",
      year:"numeric",

      hour:"2-digit",
      minute:"2-digit",
      second:"2-digit"

    }

  );

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

      latitude === null ||
      longitude === null ||

      latitude === undefined ||
      longitude === undefined

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

    if(response.status === 429){

      return `${latitude}, ${longitude}`;

    }

    if(!response.ok){

      throw new Error(
        "Gagal mengambil lokasi"
      );

    }

    const data =
      await response.json();

    let lokasi =
      `${latitude}, ${longitude}`;

    if(data.address){

      const address =
        data.address;

      lokasi =

        address.road ||

        address.pedestrian ||

        address.neighbourhood ||

        address.suburb ||

        address.hamlet ||

        address.village ||

        address.town ||

        address.city ||

        address.county ||

        address.state ||

        data.display_name ||

        `${latitude}, ${longitude}`;

    }

    else if(data.display_name){

      lokasi =
        data.display_name;

    }

    locationCache[cacheKey] =
      lokasi;

    return lokasi;

  }

  catch(err){

    console.log(
      "LOCATION ERROR:",
      err
    );

    return `${latitude}, ${longitude}`;

  }

}

/* =========================
   DELETE DATA
========================= */

async function deleteData(id){

  const confirmDelete =
    confirm(
      "Yakin ingin menghapus data ini?"
    );

  if(!confirmDelete){

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

    loadData();

  }

  catch(err){

    console.log(
      "DELETE ERROR:",
      err
    );

    alert(
      "Gagal menghapus data"
    );

  }

}

/* =========================
   LOAD DATA
========================= */

async function loadData(){

  try{

    tbody.innerHTML = "";

    loading.style.display =
      "block";

    table.style.display =
      "none";

    errorBox.innerText = "";

    const res =
      await fetch(
        API_URL
      );

    if(!res.ok){

      throw new Error(
        "Gagal mengambil data"
      );

    }

    const result =
      await res.json();

    const data =
      result.data || [];

    data.sort(

      (a,b)=>

        new Date(
          b.createdAt
        )

        -

        new Date(
          a.createdAt
        )

    );

    loading.style.display =
      "none";

    table.style.display =
      "table";

    if(data.length === 0){

      tbody.innerHTML =

      `
      <tr>

        <td
          colspan="5"
          class="empty-data"
        >

          Belum ada data kerusakan jalan

        </td>

      </tr>
      `;

      return;

    }

    for(const d of data){

      const severityClass =
        d.severity || "sedang";

      let confidence = 0;

      if(d.confidence <= 1){

        confidence =

          (
            d.confidence * 100
          )

          .toFixed(1);

      }

      else{

        confidence =

          Number(
            d.confidence
          )

          .toFixed(1);

      }

      let lokasi =
        "Lokasi Tidak Diketahui";

      if(

        d.location &&

        d.location !==
        "Unknown Location" &&

        d.location !==
        "Lokasi Tidak Diketahui"

      ){

        lokasi =
          d.location;

      }

      else{

        lokasi =
          await getLocationName(

            d.latitude,

            d.longitude

          );

      }

      const row =

      `
      <tr>

        <td>
          ${lokasi}
        </td>

        <td class="${severityClass}">
          ${d.severity}
        </td>

        <td>
          ${confidence}%
        </td>

        <td>
          ${formatTanggal(
            d.createdAt
          )}
        </td>

        <td>

     ${
    isAdmin
    ?
    `
    <button
      class="delete-btn"
      onclick="deleteData('${d._id}')"
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

      tbody.innerHTML += row;

    }

  }

  catch(err){

    console.error(err);

    loading.style.display =
      "none";

    errorBox.innerText =

      "Gagal load data dari server";

  }

}

/* =========================
   REFRESH BUTTON
========================= */

if(refreshBtn){

  refreshBtn.addEventListener(

    "click",

    () => {

      loadData();

    }

  );

}


/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    checkLogin();
    roleCheck();
    loadData();

  }
);

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

function checkLogin(){

  const token =
    localStorage.getItem("token");

  if(!token){

    window.location.href =
      "login.html";

    return;

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