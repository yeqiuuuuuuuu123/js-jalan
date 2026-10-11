const API_BASE =
  window.location.origin;

const API_URL =
  `${API_BASE}/api/detection`;

/* =========================
   LOAD PROFILE
========================= */

function loadProfile(){

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  if(!user){

    window.location.href =
      "login.html";

    return;
  }

  console.log(
    "USER LOGIN:",
    user
  );

  document.getElementById(
    "profileName"
  ).innerText =
    user.username;

  const profileInitial =
    document.getElementById(
      "profileInitial"
    );

  if(user.profileImage){

    profileInitial.innerHTML =
    `
    <img
      src="${user.profileImage}"
      class="profile-img"
    >
    `;

  }else{

    profileInitial.innerText =
      user.username
        .charAt(0)
        .toUpperCase();
  }

  /* =========================
     ROLE MENU
  ========================= */

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

}

loadProfile();

/* =========================
   LEAFLET MAP
========================= */

async function initMap(){

  try{

    /* =========================
       CREATE MAP
    ========================= */

    const map =
      L.map("map").setView(
        [-6.200000, 106.816666],
        12
      );

/* =========================
   BASE MAP
========================= */

const osm = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "© OpenStreetMap"
  }
);

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "© Esri"
  }
);

// Default menggunakan OpenStreetMap
osm.addTo(map);

// Tombol pilihan layer
L.control.layers(
  {
    "🗺 Peta": osm,
    "🛰 Satelit": satellite
  }
).addTo(map);

    /* =========================
       GET DATA
    ========================= */

   const response =
  await fetch(
    API_URL
      );

    const result =
      await response.json();

    console.log(
      "MAP DATA:",
      result
    );

    const data =
      result.data;

    /* =========================
       TIDAK ADA DATA
    ========================= */

    if(!data || data.length === 0){

      console.log(
        "Data kosong"
      );

      return;
    }

    /* =========================
       LOOP DATA
    ========================= */

    data.forEach((d)=>{

      if(
        d.latitude == null ||
        d.longitude == null
      ){
        return;
      }

      /* =========================
         WARNA MARKER
      ========================= */

      let color =
        "#00f5c3";

      // kecil
      if(d.severity === "kecil"){

        color =
          "#00f5c3";
      }

      // sedang
      if(d.severity === "sedang"){

        color =
          "#ffd43b";
      }

      // besar
      if(d.severity === "besar"){

        color =
          "#ff4d4d";
      }

      /* =========================
         CUSTOM ICON
      ========================= */

      const customIcon =
        L.divIcon({

          className:
            "custom-marker",

          html:
          `
          <div
            style="
              width:18px;
              height:18px;
              border-radius:50%;
              background:${color};
              border:3px solid white;
              box-shadow:0 0 15px ${color};
            "
          ></div>
          `,

          iconSize:[18,18]

        });

      /* =========================
         CREATE MARKER
      ========================= */

      const marker =
        L.marker(

          [
            Number(d.latitude),
            Number(d.longitude)
          ],

          {
            icon:customIcon
          }

        ).addTo(map);

      /* =========================
         POPUP
      ========================= */

marker.bindPopup(`
<div
  style="
    font-family:Poppins;
    min-width:220px;
  "
>

  <h3
    style="
      margin-bottom:8px;
      color:${color};
    "
  >
    ${d.severity.toUpperCase()}
  </h3>

  <p><b>Confidence:</b> ${d.confidence}%</p>

  <p><b>Latitude:</b> ${d.latitude}</p>

  <p><b>Longitude:</b> ${d.longitude}</p>

  <hr>

  <a
    href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${d.latitude},${d.longitude}"
    target="_blank"
    style="
      display:inline-block;
      padding:8px 14px;
      background:#00c853;
      color:white;
      border-radius:8px;
      text-decoration:none;
      font-weight:bold;
    "
  >
     Street View
  </a>

</div>
`);

      marker.on("click", function () {

  map.flyTo(
    [
      Number(d.latitude),
      Number(d.longitude)
    ],
    18,
    {
      animate: true,
      duration: 2
    }
  );

});
      

    });
    

  }catch(err){

    console.log(
      "ERROR MAP:",
      err
    );
    

  }

}


window.onload =
  initMap;


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