const API_BASE =
  window.location.origin;

const REPORT_API =
  `${API_BASE}/api/reports/create`;


const img =
document.getElementById("img");

const preview =
document.getElementById("preview");

const emptyPreview =
document.getElementById("emptyPreview");

const kotaSelect =
document.getElementById("kota");

const jalanSelect =
document.getElementById("jalan");

const statusText =
document.getElementById("status");

const submitBtn =
document.getElementById("submitBtn");

const deskripsiInput =
document.getElementById("deskripsi");



/* =========================
   PREVIEW IMAGE
========================= */

img.addEventListener(

  "change",

  (e)=>{

    const file =
    e.target.files[0];

    if(!file) return;

    preview.src =
    URL.createObjectURL(file);

    preview.style.display =
    "block";

    emptyPreview.style.display =
    "none";

  }

);

/* =========================
LOCATION DATA
========================= */

let latitude = null;
let longitude = null;

let selectedCity = "";
let selectedRoad = "";

let cityLocations = {};
let roadLocations = {};

/* =========================
LOCATION ELEMENTS
========================= */

const kotaDropdown =
  document.getElementById("kotaDropdown");

const jalanDropdown =
  document.getElementById("jalanDropdown");


/* =========================
NOMINATIM CONFIG
========================= */
const NOMINATIM_API =
  "https://nominatim.openstreetmap.org";


/* =========================
ADD DATALIST OPTION
========================= */

// function addOption(list, value) {

//   if (!list || !value) return;

//   const option =
//     document.createElement("option");

//   option.value = value;

//   list.appendChild(option);
// }

/* =========================
   ADD DROPDOWN OPTION
========================= */

function addOption(dropdown, value, show = false, onClick = null) {

  if (!dropdown || !value) return;

  const item = document.createElement("div");

  item.className = "autocomplete-item";

  item.textContent = value;

  if (onClick) {
    item.addEventListener("click", onClick);
  }

  dropdown.appendChild(item);

  if (show) {
    dropdown.classList.add("show");
  }
}

/* =========================
SEARCH CITY
========================= */

async function cariKota() {

  const keyword = kotaSelect.value.trim();

  if (keyword.length < 3) {
    kotaDropdown.innerHTML = "";
    kotaDropdown.classList.remove("show");
    return;
  }

  try {

    const response = await fetch(
      `${API_BASE}/api/reports/geocode/search?q=${encodeURIComponent(keyword)}`
    );

    if (!response.ok) {
      throw new Error("Gagal mencari kota");
    }

    const results = await response.json();

    kotaDropdown.innerHTML = "";

    const cities = [];
    const seenCities = new Set();

    results.forEach((item) => {

      const address = item.address || {};

      /*
       * Ambil nama kota/kabupaten
       */
      const city =
        address.city ||
        address.town ||
        address.municipality ||
        address.county;

      if (!city) return;

      /*
       * Hindari kota yang sama muncul berkali-kali
       */
      if (seenCities.has(city.toLowerCase())) {
        return;
      }

      seenCities.add(city.toLowerCase());
      cities.push(city);

      /*
       * Simpan koordinat kota
       */
      cityLocations[city] = {
        latitude: Number(item.lat),
        longitude: Number(item.lon)
      };

    });

    /*
     * Tampilkan HASIL KOTA
     * ke kotaDropdown
     */
    cities.forEach((city) => {

      const item =
        document.createElement("div");

      item.className =
        "autocomplete-item";

      item.textContent =
        city;

      item.addEventListener(
        "click",
        () => {

          kotaSelect.value =
            city;

          selectedCity =
            city;

          const location =
            cityLocations[city];

          if (location) {

            latitude =
              location.latitude;

            longitude =
              location.longitude;

          }

          /*
           * Bersihkan pencarian kota
           */
          kotaDropdown.innerHTML = "";

          kotaDropdown.classList.remove(
            "show"
          );

          /*
           * Bersihkan jalan lama
           */
          jalanSelect.value = "";

          selectedRoad = "";

          jalanDropdown.innerHTML = "";

          jalanDropdown.classList.remove(
            "show"
          );

          /*
           * Beritahu sistem bahwa kota berubah
           */
          kotaSelect.dispatchEvent(
            new Event("change")
          );

          console.log(
            "CITY SELECTED:",
            {
              city,
              latitude,
              longitude
            }
          );

        }
      );

      kotaDropdown.appendChild(item);

    });

    /*
     * Tampilkan dropdown KOTA
     * hanya kalau ada hasil
     */
    if (cities.length > 0) {

      kotaDropdown.classList.add(
        "show"
      );

    } else {

      kotaDropdown.classList.remove(
        "show"
      );

    }

  }

  catch(error) {

    console.error(
      "Error cari kota:",
      error
    );

    kotaDropdown.innerHTML = "";

    kotaDropdown.classList.remove(
      "show"
    );

  }

}

/* =========================
SEARCH ROAD
========================= */

async function cariJalan() {

  const roadKeyword =
    jalanSelect.value.trim();

  const cityKeyword =
    kotaSelect.value.trim();

  if (roadKeyword.length < 3) {
    jalanDropdown.innerHTML = "";
    jalanDropdown.classList.remove("show");
    return;
  }

  try {

    let query = roadKeyword;

    if (cityKeyword) {
      query =
        `${roadKeyword}, ${cityKeyword}, Indonesia`;
    }

    const url =
      `${NOMINATIM_API}/search` +
      `?format=jsonv2` +
      `&q=${encodeURIComponent(query)}` +
      `&addressdetails=1` +
      `&limit=10` +
      `&countrycodes=id`;

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error("Gagal mencari jalan");
    }

    const results =
      await response.json();

    jalanDropdown.innerHTML = "";

    const roads = [];
    const seenRoads = new Set();

    results.forEach((item) => {

      const address =
        item.address || {};

      const road =
        address.road ||
        address.pedestrian ||
        address.residential ||
        address.neighbourhood;

      if (!road) return;

      const key =
        road.toLowerCase();

      if (seenRoads.has(key)) {
        return;
      }

      seenRoads.add(key);

      roads.push({
        name: road,
        latitude: Number(item.lat),
        longitude: Number(item.lon)
      });

    });

    roads.forEach((roadData) => {

      const item =
        document.createElement("div");

      item.className =
        "autocomplete-item";

      item.textContent =
        roadData.name;

      item.addEventListener(
        "click",
        () => {

          jalanSelect.value =
            roadData.name;

          selectedRoad =
            roadData.name;

          latitude =
            roadData.latitude;

          longitude =
            roadData.longitude;

          jalanDropdown.innerHTML = "";

          jalanDropdown.classList.remove(
            "show"
          );

          console.log(
            "ROAD SELECTED:",
            {
              road: roadData.name,
              latitude,
              longitude
            }
          );

          updateMapFromLocation();

        }
      );

      jalanDropdown.appendChild(item);

    });

    /*
     * Dropdown JALAN baru muncul
     * setelah Enter ditekan
     */
    if (roads.length > 0) {

      jalanDropdown.classList.add(
        "show"
      );

    } else {

      jalanDropdown.classList.remove(
        "show"
      );

      console.log(
        "Jalan tidak ditemukan:",
        query
      );

    }

  }

  catch(error) {

    console.error(
      "Error cari jalan:",
      error
    );

    jalanDropdown.innerHTML = "";

    jalanDropdown.classList.remove(
      "show"
    );

  }

}


/* =========================
CITY SEARCH EVENT
========================= */

kotaSelect.addEventListener(
  "keydown",
  (event) => {

    if(event.key === "Enter") {

      event.preventDefault();

      cariKota();

    }

  }
);

/* =========================
CITY SELECTION
========================= */

kotaSelect.addEventListener(
  "change",
  () => {

    const city =
      kotaSelect.value.trim();

    const location =
      cityLocations[city];

    if(!location) return;

    latitude =
      location.latitude;

    longitude =
      location.longitude;

    selectedCity =
      city;

    console.log(
      "CITY SELECTED:",
      {
        city,
        latitude,
        longitude
      }
    );

  }
);


/* =========================
ROAD SEARCH EVENT
========================= */

jalanSelect.addEventListener(
  "keydown",
  (event) => {

    if(event.key === "Enter") {

      event.preventDefault();

      cariJalan();

    }

  }
);

/* =========================
ROAD SELECTION
========================= */

jalanSelect.addEventListener(
  "change",
  () => {

    const road =
      jalanSelect.value.trim();

    const location =
      roadLocations[road];

    if(!location) return;

    latitude =
      location.latitude;

    longitude =
      location.longitude;

    selectedRoad =
      road;

    console.log(
      "ROAD SELECTED:",
      {
        road,
        latitude,
        longitude
      }
    );

  }
);


/* =========================
GET GPS LOCATION
========================= */

if(navigator.geolocation) {

  navigator.geolocation.getCurrentPosition(

    async(position) => {

      latitude =
        position.coords.latitude;

      longitude =
        position.coords.longitude;

      try {

        const response =
          await fetch(
            `${NOMINATIM_API}/reverse` +
            `?format=jsonv2` +
            `&lat=${latitude}` +
            `&lon=${longitude}` +
            `&addressdetails=1`
          );

        if(!response.ok) {

          throw new Error(
            "Reverse geocoding gagal"
          );

        }

        const data =
          await response.json();

        const address =
          data.address || {};

        const kota =
          address.city ||
          address.town ||
          address.municipality ||
          address.county ||
          address.state ||
          "";

        const jalan =
          address.road ||
          address.pedestrian ||
          address.residential ||
          address.neighbourhood ||
          "";

        if(kota) {

          kotaSelect.value =
            kota;

          selectedCity =
            kota;

addOption(
  kotaDropdown,
  kota,
  false
);

        }

        if(jalan) {

          jalanSelect.value =
            jalan;

          selectedRoad =
            jalan;

addOption(
  jalanDropdown,
  jalan,
  false
);
        }

        console.log(
          "GPS LOCATION:",
          {
            latitude,
            longitude,
            city: kota,
            road: jalan
          }
        );

      }

      catch(error) {

        console.error(
          "Reverse geocoding error:",
          error
        );

      }

    },

    (error) => {

      console.log(
        "GPS error:",
        error
      );

      latitude = null;
      longitude = null;

    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

  );

}
else {

  console.log(
    "Browser tidak mendukung GPS"
  );

}

/* =========================
KIRIM LAPORAN
========================= */

async function kirim(){

  const file =
    img.files[0];

  const deskripsi =
    deskripsiInput.value.trim();

  if(!file){

    statusText.style.color =
      "#ff6b6b";

    statusText.innerText =
      "Silakan pilih foto terlebih dahulu";

    return;

  }

  if(!deskripsi){

    statusText.style.color =
      "#ff6b6b";

    statusText.innerText =
      "Deskripsi kerusakan wajib diisi";

    return;

  }

  try{

    submitBtn.disabled =
      true;

    submitBtn.innerText =
      "Mengirim...";

    statusText.style.color =
      "#ffffff";

    statusText.innerText =
      "Mengirim laporan...";

    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    formData.append(
      "latitude",
      latitude
    );

    formData.append(
      "longitude",
      longitude
    );

    formData.append(
      "city",
      kotaSelect.value
    );

    formData.append(
      "location",
      jalanSelect.value
    );

    formData.append(
      "description",
      deskripsi
    );

    const response =
      await fetch(

        REPORT_API,

        {
          method: "POST",
          body: formData
        }

      );

    const data =
      await response.json();

    if(response.ok){

      statusText.style.color =
        "#00f5c3";

      statusText.innerText =
        "Laporan berhasil dikirim dan menunggu verifikasi admin";

      img.value = "";

      preview.src = "";

      preview.style.display =
        "none";

      emptyPreview.style.display =
        "flex";

      deskripsiInput.value = "";

    }

    else{

      statusText.style.color =
        "#ff6b6b";

      statusText.innerText =
        data.message ||
        "Gagal mengirim laporan";

    }

  }

  catch(error){

    console.log(error);

    statusText.style.color =
      "#ff6b6b";

    statusText.innerText =
      "Server error";

  }

  finally{

    submitBtn.disabled =
      false;

    submitBtn.innerText =
      "Kirim Laporan";

  }

}

/* =========================
   PILIH LOKASI DI PETA
========================= */

const pilihLokasiBtn =
  document.getElementById("pilihLokasiBtn");

const mapElement =
  document.getElementById("map");

let reportMap = null;

/* =========================
   MARKER HASIL DETEKSI
========================= */

async function loadDetectionMarkers() {

  try {

    const response =
      await fetch(
        `${API_BASE}/api/detection`
      );

    if (!response.ok) {
      throw new Error(
        "Gagal mengambil data deteksi"
      );
    }

    const result =
      await response.json();

    const detections =
      result.data || [];

    console.log(
      "DATA DETEKSI UNTUK PELAPORAN:",
      detections
    );

    /* Layer khusus marker deteksi */
    reportMap.detectionLayer =
      L.layerGroup().addTo(reportMap);

    detections.forEach((item) => {

      if (
        item.latitude == null ||
        item.longitude == null
      ) {
        return;
      }

      let color = "#00f5c3";

      if(item.severity === "sedang"){
        color = "#ffd43b";
      }

      if(item.severity === "besar"){
        color = "#ff4d4d";
      }

      const detectionIcon =
        L.divIcon({

          className:
            "detection-marker",

          html: `
            <div
              style="
                width:16px;
                height:16px;
                border-radius:50%;
                background:${color};
                border:3px solid white;
                box-shadow:0 0 12px ${color};
              "
            ></div>
          `,

          iconSize: [16,16],
          iconAnchor: [8,8]

        });

   const marker =
  L.marker(
    [
      Number(item.latitude),
      Number(item.longitude)
    ],
    {
      icon: detectionIcon
    }
  );


// =========================
// ZOOM SAAT MARKER DIKLIK
// =========================

marker.on("click", function () {

  reportMap.flyTo(
    [
      Number(item.latitude),
      Number(item.longitude)
    ],
    18,
    {
      animate: true,
      duration: 1.5
    }
  );

});


// =========================
// POPUP HASIL DETEKSI
// =========================

marker.bindPopup(`
  <div style="
    min-width:220px;
    font-family:Poppins, sans-serif;
  ">

    <h3 style="
      margin:0 0 8px 0;
      font-size:16px;
    ">
      Hasil Deteksi
    </h3>

    <div style="margin-bottom:6px;">
      <b>Kerusakan:</b>
      ${item.severity || "Tidak diketahui"}
    </div>

    <div style="margin-bottom:12px;">
      <b>Lokasi:</b>
      ${item.location || "Lokasi tidak diketahui"}
    </div>

    <a
      href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${Number(item.latitude)},${Number(item.longitude)}"
      target="_blank"
      rel="noopener noreferrer"
      style="
        display:inline-block;
        padding:8px 14px;
        background:#00c853;
        color:white;
        border-radius:8px;
        text-decoration:none;
        font-weight:600;
        font-size:13px;
      "
    >
      📍 Street View
    </a>

  </div>
`);


marker.addTo(
  reportMap.detectionLayer
);

    });

  }

  catch(error) {

    console.error(
      "ERROR MARKER DETEKSI:",
      error
    );

  }

}

/* =========================
   MAP MENGIKUTI KOTA / JALAN
========================= */

async function updateMapFromLocation() {

  const kota =
    kotaSelect.value.trim();

  const jalan =
    jalanSelect.value.trim();

  if (!kota && !jalan) return;

  try {

    let query = "";

    /* Kalau jalan sudah dipilih */
    if (jalan) {

      query =
        `${jalan}, ${kota}, Indonesia`;

    }

    /* Kalau hanya kota */
    else {

      query =
        `${kota}, Indonesia`;

    }

    const response =
      await fetch(
        `${NOMINATIM_API}/search` +
        `?format=jsonv2` +
        `&q=${encodeURIComponent(query)}` +
        `&addressdetails=1` +
        `&limit=1` +
        `&countrycodes=id`
      );

    if (!response.ok) {

      throw new Error(
        "Gagal mencari lokasi"
      );

    }

    const results =
      await response.json();

    if (
      !results ||
      results.length === 0
    ) {

      console.log(
        "Lokasi tidak ditemukan:",
        query
      );

      return;
    }

    const result =
      results[0];

    const newLatitude =
      Number(result.lat);

    const newLongitude =
      Number(result.lon);

    /* Simpan koordinat baru */
    latitude =
      newLatitude;

    longitude =
      newLongitude;

    console.log(
      "MAP MENGIKUTI LOKASI:",
      {
        kota,
        jalan,
        latitude,
        longitude
      }
    );

    /* =========================
       JIKA MAP SUDAH DIBUKA
    ========================= */

    if (reportMap) {

      reportMap.flyTo(
        [
          newLatitude,
          newLongitude
        ],
        16,
        {
          animate: true,
          duration: 1.5
        }
      );

      /* Hapus marker lama */
      if (
        reportMap.selectedMarker
      ) {

        reportMap.removeLayer(
          reportMap.selectedMarker
        );

      }

      /* Marker baru */
      reportMap.selectedMarker =
        L.marker([
          newLatitude,
          newLongitude
        ])
        .addTo(reportMap)
        .bindPopup(
          `
          <b>Lokasi Dipilih</b><br>
          ${kota}<br>
          ${jalan || "Lokasi kota"}
          `
        );

    }

  }

  catch(error) {

    console.error(
      "Error update map:",
      error
    );

  }

}

/* =========================
   KOTA BERUBAH
========================= */

kotaSelect.addEventListener(
  "change",
  () => {

    updateMapFromLocation();

  }
);


/* =========================
   JALAN BERUBAH
========================= */

jalanSelect.addEventListener(
  "change",
  () => {

    updateMapFromLocation();

  }
);

pilihLokasiBtn.addEventListener(
  "click",
  () => {

    /* Tampilkan map */
    mapElement.style.display = "block";

    /* Buat map hanya sekali */
    if (!reportMap) {

     reportMap = L.map("map").setView(
  [
    latitude !== null
      ? latitude
      : -0.9471,

    longitude !== null
      ? longitude
      : 100.4172
  ],
  16
);
      /* OpenStreetMap */
/* =========================
   BASE MAP
========================= */

const osm =
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "© OpenStreetMap contributors"
    }
  );

const satellite =
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "© Esri"
    }
  );

/* Default: OpenStreetMap */
osm.addTo(reportMap);

/* Pilihan layer */
L.control.layers(
  {
    "🗺 Peta": osm,
    "🛰 Satelit": satellite
  }
).addTo(reportMap);

/* Marker hasil deteksi */
loadDetectionMarkers();

// double click untuk street view
reportMap.doubleClickZoom.disable();

reportMap.on(
  "dblclick",
  function(event) {

    const lat =
      event.latlng.lat;

    const lng =
      event.latlng.lng;

    const streetViewUrl =
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

    window.open(
      streetViewUrl,
      "_blank"
    );

  }
);

      /* Klik lokasi */
      reportMap.on(
        "click",
        function(event) {

          latitude =
            event.latlng.lat;

          longitude =
            event.latlng.lng;
                /* =========================
       UPDATE KOTA & JALAN
    ========================= */

    fetch(
      `${NOMINATIM_API}/reverse` +
      `?format=jsonv2` +
      `&lat=${latitude}` +
      `&lon=${longitude}` +
      `&addressdetails=1`
    )
    .then(response => response.json())
    .then(data => {

      const address =
        data.address || {};

      const kota =
        address.city ||
        address.town ||
        address.municipality ||
        address.county ||
        address.state ||
        "";

      const jalan =
        address.road ||
        address.pedestrian ||
        address.residential ||
        address.neighbourhood ||
        "";

      if (kota) {

        kotaSelect.value =
          kota;

        selectedCity =
          kota;
      }

      if (jalan) {

        jalanSelect.value =
          jalan;

        selectedRoad =
          jalan;
      }

      console.log(
        "LOKASI TERPILIH:",
        {
          latitude,
          longitude,
          kota,
          jalan
        }
      );

    })
    .catch(error => {

      console.error(
        "Gagal mengambil alamat:",
        error
      );

    });

          console.log(
            "LOKASI PETA:",
            {
              latitude,
              longitude
            }
          );

          /* Hapus marker lama */
          if (reportMap.selectedMarker) {

            reportMap.removeLayer(
              reportMap.selectedMarker
            );

          }

          /* Buat marker baru */
          reportMap.selectedMarker =
            L.marker([
              latitude,
              longitude
            ])
            .addTo(reportMap)
            .bindPopup(
              `
              <b>Lokasi Dipilih</b><br>
              Latitude: ${latitude.toFixed(6)}<br>
              Longitude: ${longitude.toFixed(6)}
              `
            )
            .openPopup();

        }
      );

    }

    /* Penting setelah map baru ditampilkan */
    setTimeout(
      () => {

        reportMap.invalidateSize();

      },
      100
    );

  }
);

/* =========================
   ZOOM FOTO KERUSAKAN
========================= */

const previewZoom =
  document.getElementById("preview");

let zoomScale = 1;

let startDistance = 0;
let startScale = 1;

let lastX = 0;
let lastY = 0;

let moveX = 0;
let moveY = 0;

let isDragging = false;


/* =========================
   APPLY ZOOM
========================= */

function applyZoom(){

  previewZoom.style.transform =
    `translate(${moveX}px, ${moveY}px) scale(${zoomScale})`;

}


/* =========================
   RESET
========================= */

function resetZoom(){

  zoomScale = 1;

  moveX = 0;
  moveY = 0;

  applyZoom();

}


/* =========================
   HITUNG JARAK 2 JARI
========================= */

function getDistance(touch1, touch2){

  const dx =
    touch1.clientX -
    touch2.clientX;

  const dy =
    touch1.clientY -
    touch2.clientY;

  return Math.sqrt(
    dx * dx +
    dy * dy
  );

}


/* =========================
   TOUCH START
========================= */

previewZoom.addEventListener(
  "touchstart",
  function(e){

    if(e.touches.length === 2){

      startDistance =
        getDistance(
          e.touches[0],
          e.touches[1]
        );

      startScale =
        zoomScale;

    }

    else if(e.touches.length === 1){

      lastX =
        e.touches[0].clientX;

      lastY =
        e.touches[0].clientY;

      isDragging = true;

    }

  },
  {passive:false}
);


/* =========================
   TOUCH MOVE
========================= */

previewZoom.addEventListener(
  "touchmove",
  function(e){

    e.preventDefault();

    /* =====================
       PINCH ZOOM
    ===================== */

    if(e.touches.length === 2){

      const currentDistance =
        getDistance(
          e.touches[0],
          e.touches[1]
        );

      if(startDistance > 0){

        const ratio =
          currentDistance /
          startDistance;

        zoomScale =
          startScale * ratio;

        /* batas zoom */

        zoomScale =
          Math.max(
            1,
            Math.min(4, zoomScale)
          );

        applyZoom();

      }

    }

    /* =====================
       GESER FOTO
    ===================== */

    else if(
      e.touches.length === 1 &&
      zoomScale > 1 &&
      isDragging
    ){

      const x =
        e.touches[0].clientX;

      const y =
        e.touches[0].clientY;

      moveX +=
        x - lastX;

      moveY +=
        y - lastY;

      lastX = x;
      lastY = y;

      applyZoom();

    }

  },
  {passive:false}
);


/* =========================
   TOUCH END
========================= */

previewZoom.addEventListener(
  "touchend",
  function(e){

    if(e.touches.length === 0){

      isDragging = false;

      startDistance = 0;

    }

  }
);


/* =========================
   DOUBLE CLICK / DOUBLE TAP
========================= */

previewZoom.addEventListener(
  "dblclick",
  function(){

    if(zoomScale === 1){

      zoomScale = 2;

    }else{

      resetZoom();

      return;

    }

    applyZoom();

  }
);


/* =========================
   ZOOM MOUSE / TRACKPAD
========================= */

previewZoom.addEventListener(
  "wheel",
  function(e){

    e.preventDefault();

    if(e.deltaY < 0){

      zoomScale += 0.2;

    }else{

      zoomScale -= 0.2;

    }

    zoomScale =
      Math.max(
        1,
        Math.min(4, zoomScale)
      );

    applyZoom();

  },
  {passive:false}
);


/* =========================
   RESET SAAT FOTO BARU
========================= */

previewZoom.addEventListener(
  "load",
  function(){

    resetZoom();

  }
);

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