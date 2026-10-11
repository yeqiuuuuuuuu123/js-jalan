const API_BASE =
  window.location.origin;

const API_URL =
  `${API_BASE}/api/detection`;

const user =
  JSON.parse(
    localStorage.getItem("user")
  );

if(
  !user ||
  user.role !== "admin"
){

  alert(
    "Akses ditolak"
  );

  window.location.href =
    "dashboard.html";
}

const video =
  document.getElementById("video");

const overlay =
  document.getElementById("overlay");

const overlayCtx =
  overlay.getContext("2d");

let stream = null;
let intervalAI = null;

/* =========================
   GPS USER
========================= */

let userLatitude = null;
let userLongitude = null;

let currentAddress =
  "Unknown Location";

/* =========================
   ANTI SPAM DATABASE
========================= */

let lastSaveTime = 0;

/* =========================
   LOAD CAMERA LIST
========================= */

async function loadCameras(){

  try{

    await navigator.mediaDevices.getUserMedia({
      video:true
    });

    const devices =
      await navigator.mediaDevices.enumerateDevices();

    const cameras =
      devices.filter(
        device => device.kind === "videoinput"
      );

    const select =
      document.getElementById(
        "cameraSelect"
      );

    select.innerHTML = "";

    cameras.forEach((camera,index)=>{

      const option =
        document.createElement("option");

      option.value =
        camera.deviceId;

      option.text =
        camera.label ||
        `Camera ${index + 1}`;

      select.appendChild(option);

    });

  }catch(err){

    console.error(err);

    alert(
      "Tidak bisa load kamera"
    );

  }

}

/* =========================
   UPDATE ADDRESS
========================= */

async function updateAddress(){

  try{

    const response =
      await fetch(

        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLatitude}&lon=${userLongitude}`

      );

    const data =
      await response.json();

    currentAddress =
      data.display_name;

    console.log(
      "ADDRESS:",
      currentAddress
    );

  }catch(err){

    console.log(
      "ADDRESS ERROR:",
      err
    );

  }

}

/* =========================
   LOAD GPS REALTIME
========================= */

async function loadGPS() {

  console.log("=== LOAD GPS DIPANGGIL ===");

  try {

    const response = await fetch("/gps");

    console.log(
      "GPS HTTP STATUS:",
      response.status
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    console.log(
      "GPS RESPONSE:",
      data
    );

    if (
      data.status === "success" &&
      data.latitude != null &&
      data.longitude != null
    ) {

      userLatitude =
        Number(data.latitude);

      userLongitude =
        Number(data.longitude);

      console.log(
        "GPS DISIMPAN KE VARIABLE:",
        userLatitude,
        userLongitude
      );

      await updateAddress();

    } else {

      console.log(
        "GPS belum FIX:",
        data
      );

    }

  } catch (err) {

    console.error(
      "GPS SERVER ERROR:",
      err
    );

  }

}

/* =========================
   START CAMERA
========================= */

async function startCamera(){

  try{

    stopCamera();

    video.src = "http://localhost:5001/video_feed";

    document.getElementById(
      "status"
    ).innerText =
      "Camera Active";

    if(intervalAI){
      clearInterval(intervalAI);
    }

    intervalAI =
      setInterval(
        updateDetection,
        1000
      );

  }catch(err){

    console.error(err);

    alert(
      "Kamera gagal dibuka"
    );

  }

}

/* =========================
   STOP CAMERA
========================= */

function stopCamera(){

  video.src = "";
  stream = null;

  if(intervalAI){

    clearInterval(intervalAI);

    intervalAI = null;

  }

  if(intervalAI){

    clearInterval(
      intervalAI
    );

    intervalAI = null;

  }

  overlayCtx.clearRect(
    0,
    0,
    overlay.width,
    overlay.height
  );

  document.getElementById(
    "status"
  ).innerText =
    "Stopped";

}

/* =========================
   DRAW BOXES
========================= */

function drawBoxes(detections){

  overlay.width =
    video.videoWidth;

  overlay.height =
    video.videoHeight;

  overlayCtx.clearRect(
    0,
    0,
    overlay.width,
    overlay.height
  );

  detections.forEach((det)=>{

    const box =
      det.box;

    const x1 = box[0];
    const y1 = box[1];
    const x2 = box[2];
    const y2 = box[3];

    const width =
      x2 - x1;

    const height =
      y2 - y1;

    overlayCtx.strokeStyle =
      "#00f5c3";

    overlayCtx.lineWidth = 4;

    overlayCtx.strokeRect(
      x1,
      y1,
      width,
      height
    );

    overlayCtx.fillStyle =
      "#00f5c3";

    overlayCtx.fillRect(
      x1,
      y1 - 30,
      220,
      30
    );

    overlayCtx.fillStyle =
      "#02111f";

    overlayCtx.font =
      "bold 16px Poppins";

    overlayCtx.fillText(

      `${det.label} ${(
        det.confidence * 100
      ).toFixed(1)}%`,

      x1 + 8,
      y1 - 10

    );

  });

}

/* =========================
   KIRIM FRAME KE AI
========================= */

async function kirimKeAI(){

if(
  !video.naturalWidth ||
  !video.naturalHeight
){
  return;
}

const canvas =
  document.createElement("canvas");

canvas.width =
  video.naturalWidth;

canvas.height =
  video.naturalHeight;

  const ctx =
    canvas.getContext("2d");

  ctx.drawImage(

    video,

    0,
    0,

    canvas.width,
    canvas.height

  );

  canvas.toBlob(async(blob)=>{

    try{

      const formData =
        new FormData();

      formData.append(
        "image",
        blob,
        "frame.jpg"
      );

      const start =
        performance.now();

      const response =
        await fetch(

          `${API_BASE}/detect`,

          {

            method:"POST",

            body:formData

          }

        );

      if(!response.ok){

        document.getElementById(
          "status"
        ).innerText =
          "Flask Error";

        return;

      }

      const data =
        await response.json();

      console.log(
        "AI RESULT:",
        data
      );

      const end =
        performance.now();

      const fps =
        (
          1000 / (end - start)
        ).toFixed(1);

      document.getElementById(
        "fps"
      ).innerText =
        fps + " FPS";

      document.getElementById(
        "status"
      ).innerText =
        "AI Running";

      if(data.length > 0){

        drawBoxes(data);

        const hasil =
          data[0];

        document.getElementById(
          "severity"
        ).innerText =
          hasil.label;

        document.getElementById(
          "confidence"
        ).innerText =
          (
            hasil.confidence * 100
          ).toFixed(1) + "%";

        const now =
          Date.now();

        if(
          now - lastSaveTime < 10000
        ){
          return;
        }

        lastSaveTime = now;

        try{

               const saveResponse =
                   await fetch(

                  API_URL,

                   {
                   method:"POST",

                headers:{
                  "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({

                  image:
                    "camera-detection.jpg",

                  latitude:
                    userLatitude,

                  longitude:
                    userLongitude,

                  location:
                    currentAddress,

                  severity:
                    hasil.label,

                  confidence:
                    hasil.confidence

                })

              }

            );

          const saveData =
            await saveResponse.json();

          console.log(
            "SAVE SUCCESS:",
            saveData
          );

        }catch(saveErr){

          console.log(
            "SAVE ERROR:",
            saveErr
          );

        }

      }
      else{

        overlayCtx.clearRect(
          0,
          0,
          overlay.width,
          overlay.height
        );

        document.getElementById(
          "severity"
        ).innerText =
          "Tidak Ada";

        document.getElementById(
          "confidence"
        ).innerText =
          "0%";

      }

    }catch(err){

      console.error(err);

      document.getElementById(
        "status"
      ).innerText =
        "AI Server Error";

    }

  },"image/jpeg");

}

async function updateDetection() {

  try {

    const response = await fetch(
      "http://localhost:5001/latest_detection"
    );

    const data = await response.json();

    if (data.status !== "success") {

      document.getElementById("severity").innerText = "Tidak Ada";
      document.getElementById("confidence").innerText = "0%";
      return;
    }

    document.getElementById("severity").innerText =
      data.label;

    document.getElementById("confidence").innerText =
      (data.confidence * 100).toFixed(1) + "%";

// Jangan simpan deteksi kalau GPS belum tersedia
if (
  userLatitude === null ||
  userLongitude === null
) {
  console.log("GPS belum tersedia, data tidak disimpan");
  return;
}

const now = Date.now();

if (now - lastSaveTime < 10000) return;

lastSaveTime = now;

const payload = {

    image: "camera-detection.jpg",

    latitude: userLatitude,

    longitude: userLongitude,

    location: currentAddress,

    severity: data.label,

    confidence: data.confidence

};

console.log("================================");
console.log("PAYLOAD DIKIRIM");
console.log(payload);
console.log("================================");

await fetch(API_URL, {

    method: "POST",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify(payload)

});

  } catch (err) {

    console.log(err);

  }

}

window.onload = async () => {

  console.log("Memulai GPS...");

  // Ambil GPS pertama kali
  await loadGPS();

  console.log(
    "GPS AWAL:",
    userLatitude,
    userLongitude
  );

  // Update GPS setiap 5 detik
  setInterval(
    loadGPS,
    5000
  );

};

const menuBtn =
  document.getElementById("menuBtn");

const sidebar =
  document.querySelector(".sidebar");

const mobileOverlay =
  document.getElementById("mobileOverlay");

if(menuBtn){

  menuBtn.addEventListener(
    "click",
    ()=>{

      sidebar.classList.toggle("show");
      mobileOverlay.classList.toggle("show");

    }
  );

  mobileOverlay.addEventListener(
    "click",
    ()=>{

      sidebar.classList.remove("show");
      mobileOverlay.classList.remove("show");

    }
  );
}