const API_BASE =
  window.location.origin;

const API_SUMMARY =
  `${API_BASE}/api/detection/summary`;

const API_DETECTION =
  `${API_BASE}/api/detection`;


let damageChart = null;
let trendChart = null;

let map = null;
let markersLayer = null;

const locationCache = {};

/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    checkLogin();

    roleCheck();

    loadDashboard();

    setInterval(
      loadDashboard,
      10000
    );

  }
);

/* =========================
   GET LOCATION
========================= */

async function getLocationName(
  latitude,
  longitude
){

  try{

    if(
      latitude == null ||
      longitude == null
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
      throw new Error();
    }

    const data =
      await response.json();

    const lokasi =

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

  catch{

    return "Lokasi Tidak Diketahui";

  }

}

/* =========================
   FORMAT CONFIDENCE
========================= */

function formatConfidence(
  confidence
){

  if(confidence == null){
    return "0.0";
  }

  let value =
    Number(confidence);

  if(value <= 1){
    value *= 100;
  }

  return value.toFixed(1);

}

function checkLogin(){

  const token =
    localStorage.getItem("token");

  if(!token){

    window.location.href =
      "login.html";

    return;

  }

}

/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard(){

  try{

    /* SUMMARY */

    const summaryRes =
      await fetch(
        API_SUMMARY
      );

    const summary =
      await summaryRes.json();

    document.getElementById(
      "total"
    ).innerText =
      summary.total || 0;

    document.getElementById(
      "ringan"
    ).innerText =
      summary.kecil || 0;

    document.getElementById(
      "sedang"
    ).innerText =
      summary.sedang || 0;

    document.getElementById(
      "berat"
    ).innerText =
      summary.besar || 0;

    const ikj =
      Math.max(
        0,
        Number(summary.IKJ || 0)
      );

    document.getElementById(
      "ikj"
    ).innerText =
      ikj.toFixed(2) + "%";

    document.getElementById(
      "ikjText"
    ).innerText =
      ikj.toFixed(2) + "%";

    document.getElementById(
      "progressFill"
    ).style.width =
      ikj + "%";

    updateDamageChart(
      summary
    );

    /* DETECTION */

    const dataRes =
      await fetch(
        API_DETECTION
      );

    const result =
      await dataRes.json();

    const detections =
      result.data || [];

    await updateLatestActivity(
      detections
    );

    await updateLatestDetection(
      detections
    );

    await updateTopLocation(
      detections
    );

    updateAverageConfidence(
      detections
    );

    updateTrendChart(
      detections
    );

    updateMap(
      detections
    );

  }

  catch(err){

    console.error(
      "DASHBOARD ERROR:",
      err
    );

  }

}

/* =========================
   DAMAGE CHART
========================= */

function updateDamageChart(
  data
){

  const ctx =
    document.getElementById(
      "damageChart"
    );

  if(!ctx){
    return;
  }

  if(damageChart){
    damageChart.destroy();
  }

  damageChart =
    new Chart(ctx,{

      type:"doughnut",

      data:{

        labels:[
          "Ringan",
          "Sedang",
          "Berat"
        ],

        datasets:[{

          data:[
            data.kecil || 0,
            data.sedang || 0,
            data.besar || 0
          ],

          backgroundColor:[
            "#22c55e",
            "#facc15",
            "#ef4444"
          ],

          borderWidth:0

        }]

      },

      options:{

        responsive:true,

        maintainAspectRatio:false,

        plugins:{

          legend:{

            labels:{
              color:"#fff"
            }

          }

        }

      }

    });

}

/* =========================
   TREND CHART
========================= */

function updateTrendChart(
  detections
){

  const ctx =
    document.getElementById(
      "trendChart"
    );

  if(!ctx){
    return;
  }

  const dailyData = {};

  detections.forEach(item => {

    const date =
      item.createdAt
      .split("T")[0];

    dailyData[date] =
      (dailyData[date] || 0)
      + 1;

  });

  const labels =
    Object.keys(
      dailyData
    ).sort();

  const values =
    labels.map(
      date =>
      dailyData[date]
    );

  if(trendChart){
    trendChart.destroy();
  }

  trendChart =
    new Chart(ctx,{

      type:"line",

      data:{

        labels,

        datasets:[{

          label:"Deteksi",

          data:values,

          borderColor:"#00f5c3",

          backgroundColor:
            "rgba(0,245,195,.15)",

          fill:true,

          tension:.4

        }]

      },

      options:{

        responsive:true,

        plugins:{
          legend:{
            labels:{
              color:"#fff"
            }
          }
        },

        scales:{

          x:{
            ticks:{
              color:"#fff"
            }
          },

          y:{
            ticks:{
              color:"#fff"
            }
          }

        }

      }

    });

}

/* =========================
   AKTIVITAS TERBARU
========================= */

async function updateLatestActivity(
  detections
){

  const container =
    document.getElementById(
      "latestActivity"
    );

  if(!container){
    return;
  }

  container.innerHTML = "";

  const latest =
    [...detections]
    .sort(
      (a,b)=>
      new Date(b.createdAt)
      -
      new Date(a.createdAt)
    )
    .slice(0,5);

  for(const item of latest){

    let lokasi =
      item.location;

    if(
      !lokasi ||
      lokasi === "Unknown Location" ||
      lokasi === "Lokasi Tidak Diketahui"
    ){

      lokasi =
        await getLocationName(
          item.latitude,
          item.longitude
        );

    }

    let colorClass =
      "green";

    if(item.severity === "sedang"){
      colorClass = "yellow";
    }

    if(item.severity === "besar"){
      colorClass = "red";
    }

    container.innerHTML +=
    `
    <div class="activity">
      <div class="dot ${colorClass}"></div>
      Deteksi ${item.severity} di ${lokasi}
    </div>
    `;

  }

}

/* =========================
   DETEKSI TERAKHIR
========================= */

async function updateLatestDetection(
  detections
){

  const container =
    document.getElementById(
      "latestDetection"
    );

  if(!container){
    return;
  }

  if(detections.length === 0){

    container.innerHTML =
      "<p>Belum ada data</p>";

    return;

  }

  const latest =
    [...detections]
    .sort(
      (a,b)=>
      new Date(b.createdAt)
      -
      new Date(a.createdAt)
    )[0];

  let lokasi =
    latest.location;

  if(
    !lokasi ||
    lokasi === "Unknown Location" ||
    lokasi === "Lokasi Tidak Diketahui"
  ){

    lokasi =
      await getLocationName(
        latest.latitude,
        latest.longitude
      );

  }

  container.innerHTML =
  `
  <p>
    <strong>Lokasi:</strong><br>
    ${lokasi}
    <br><br>

    <strong>Kerusakan:</strong><br>
    ${latest.severity}
    <br><br>

    <strong>Confidence:</strong><br>
    ${formatConfidence(latest.confidence)}%
    <br><br>

    <strong>Waktu:</strong><br>
    ${new Date(latest.createdAt)
      .toLocaleString("id-ID")}
  </p>
  `;

}

/* =========================
   TOP LOCATION
========================= */

async function updateTopLocation(
  detections
){

  const container =
    document.getElementById(
      "topLocation"
    );

  if(!container){
    return;
  }

  container.innerHTML = "";

  const lokasiCount = {};

  for(const item of detections){

    let lokasi =
      item.location;

    if(
      !lokasi ||
      lokasi === "Unknown Location" ||
      lokasi === "Lokasi Tidak Diketahui"
    ){

      lokasi =
        await getLocationName(
          item.latitude,
          item.longitude
        );

    }

    lokasiCount[lokasi] =
      (lokasiCount[lokasi] || 0)
      + 1;

  }

  const sorted =
    Object.entries(
      lokasiCount
    )
    .sort(
      (a,b)=>b[1]-a[1]
    )
    .slice(0,5);

  sorted.forEach(item => {

    container.innerHTML +=
    `
    <div class="location-item">

      <span>${item[0]}</span>

      <span class="location-count">
        ${item[1]}
      </span>

    </div>
    `;

  });

}

/* =========================
   AVG CONFIDENCE
========================= */

function updateAverageConfidence(
  detections
){

  const el =
    document.getElementById(
      "avgConfidence"
    );

  if(!el){
    return;
  }

  if(detections.length === 0){

    el.innerText = "0%";

    return;

  }

  let total = 0;

  detections.forEach(item => {

    total += Number(
      formatConfidence(
        item.confidence
      )
    );

  });

  const avg =
    (
      total /
      detections.length
    ).toFixed(1);

  el.innerText =
    avg + "%";

}

/* =========================
   MAP
========================= */

function updateMap(
  detections
){

  const mapElement =
    document.getElementById(
      "map"
    );

  if(!mapElement){
    return;
  }

  if(!map){

map = L.map("map").setView(
    [-0.9222, 100.4469],
    16
);

// OpenStreetMap
const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap"
    }
);

// Satelit Esri
const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "© Esri"
    }
);

// Default
osm.addTo(map);

// Tombol Layer
L.control.layers(
    {
        "🗺 Peta": osm,
        "🛰 Satelit": satellite
    }
).addTo(map);

markersLayer = L.layerGroup().addTo(map);

    markersLayer =
      L.layerGroup()
      .addTo(map);

  }

  markersLayer.clearLayers();

  detections.forEach(item => {

    if(
      item.latitude == null ||
      item.longitude == null
    ){
      return;
    }

    let color =
      "#22c55e";

    if(item.severity === "sedang"){
      color = "#facc15";
    }

    if(item.severity === "besar"){
      color = "#ef4444";
    }

    const marker =
      L.circleMarker(
        [
          item.latitude,
          item.longitude
        ],
        {
          radius:8,
          color,
          fillColor:color,
          fillOpacity:0.8
        }
      );

marker.bindPopup(`
<div style="
    font-family:Poppins;
    min-width:220px;
">

<h3 style="
margin-bottom:10px;
color:${color};
">
${item.severity.toUpperCase()}
</h3>

<p>
<b>Confidence :</b>
${formatConfidence(item.confidence)}%
</p>

<p>
<b>Latitude :</b>
${item.latitude}
</p>

<p>
<b>Longitude :</b>
${item.longitude}
</p>

<hr>

<button
onclick="
window.open(
'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${item.latitude},${item.longitude}',
'_blank'
)"
style="
width:100%;
padding:8px;
border:none;
border-radius:8px;
background:#00c853;
color:white;
cursor:pointer;
font-weight:bold;
">

 Street View

</button>

</div>
`);
marker.on("click", function () {

    map.flyTo(
        [
            item.latitude - 0.00012,
            item.longitude
        ],
        18,
        {
            animate: true,
            duration: 2
        }
    );

});

    marker.addTo(
      markersLayer
    );

  });

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

}

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