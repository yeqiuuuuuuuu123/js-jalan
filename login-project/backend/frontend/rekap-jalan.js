const API_BASE = window.location.origin;
const API_ROAD_SUMMARY = `${API_BASE}/api/reports/road-summary`;

const body = document.getElementById("roadTableBody");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");

const ROAD_CACHE_KEY = "rekapJalanLengthV5";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

function checkLogin(){
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if(!token || !user){
    window.location.href = "login.html";
    return false;
  }

  // Profile sudah dihapus dari HTML halaman Rekap Jalan.
  const profileName = document.getElementById("profileName");
  const profileInitial = document.getElementById("profileInitial");

  if(profileName){
    profileName.textContent = user.username || user.name || "User";
  }

  if(profileInitial){
    profileInitial.textContent =
      (user.username || user.name || "U").charAt(0).toUpperCase();
  }

  if(user.role !== "admin"){
    const a = document.getElementById("menuDeteksi");
    const b = document.getElementById("menuAdmin");
    if(a) a.style.display = "none";
    if(b) b.style.display = "none";
  }

  return true;
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatKm(km){
  if(km == null || !Number.isFinite(Number(km))) return "Belum tersedia";
  return `${Number(km).toLocaleString("id-ID", {maximumFractionDigits:2})} km`;
}

function loadCache(){
  try{
    return JSON.parse(localStorage.getItem(ROAD_CACHE_KEY) || "{}");
  }catch{
    return {};
  }
}

function saveCache(cache){
  try{
    localStorage.setItem(ROAD_CACHE_KEY, JSON.stringify(cache));
  }catch(error){
    console.warn("Cache panjang jalan tidak dapat disimpan:", error);
  }
}

function cacheKey(item){
  return `${String(item.city || "").toLowerCase()}|${String(item.jalan || "").toLowerCase()}`;
}

function haversineMeters(a, b){
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);

  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
    Math.cos(toRad(b.lat)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function wayLengthMeters(way){
  const geometry = way.geometry || [];
  let total = 0;

  for(let i = 1; i < geometry.length; i++){
    total += haversineMeters(
      {lat: geometry[i - 1].lat, lon: geometry[i - 1].lon},
      {lat: geometry[i].lat, lon: geometry[i].lon}
    );
  }

  return total;
}

function normalizeRoadName(name){
  return String(name || "")
    .toLowerCase()
    .replace(/\b(jalan|jl\.?|street|st\.?)\s*/gi, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roadNameTokens(name){
  return normalizeRoadName(name)
    .split(/\s+/)
    .filter(token => token.length >= 2);
}

function nameMatchScore(target, candidate){
  const a = normalizeRoadName(target);
  const b = normalizeRoadName(candidate);

  if(!a || !b) return 0;
  if(a === b) return 100;
  if(a.includes(b) || b.includes(a)) return 80;

  const A = new Set(roadNameTokens(a));
  const B = new Set(roadNameTokens(b));

  if(!A.size || !B.size) return 0;

  let common = 0;
  for(const token of A){
    if(B.has(token)) common++;
  }

  const ratioTarget = common / A.size;
  const ratioCandidate = common / B.size;

  if(ratioTarget >= 0.75 && ratioCandidate >= 0.5) return 60;
  if(ratioTarget >= 0.5) return 40;

  return 0;
}

function getRowsBounds(rows){
  const points = rows.flatMap(item =>
    Array.isArray(item.points) ? item.points : []
  );

  const lats = points
    .map(p => Number(p.latitude))
    .filter(Number.isFinite);

  const lons = points
    .map(p => Number(p.longitude))
    .filter(Number.isFinite);

  if(!lats.length || !lons.length) return null;

  return {
    south: Math.min(...lats) - 0.02,
    west: Math.min(...lons) - 0.02,
    north: Math.max(...lats) + 0.02,
    east: Math.max(...lons) + 0.02
  };
}

function buildBatchOverpassQuery(rows){
  const bounds = getRowsBounds(rows);
  if(!bounds) return null;

  return `
[out:json][timeout:60];
way["highway"]["name"](
  ${bounds.south},
  ${bounds.west},
  ${bounds.north},
  ${bounds.east}
);
out body geom;
`.trim();
}

function pointToWayDistanceMeters(point, way){
  const geometry = Array.isArray(way.geometry) ? way.geometry : [];
  let minDistance = Infinity;

  for(const node of geometry){
    const lat = Number(node.lat);
    const lon = Number(node.lon);
    if(!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const d = haversineMeters(point, {lat, lon});
    if(d < minDistance) minDistance = d;
  }

  return minDistance;
}

function connectedRoadComponent(seedWay, sameNameWays){
  const byNode = new Map();

  for(const way of sameNameWays){
    const nodes = Array.isArray(way.nodes) ? way.nodes : [];

    for(const nodeId of nodes){
      if(!byNode.has(nodeId)) byNode.set(nodeId, []);
      byNode.get(nodeId).push(way);
    }
  }

  if(!Array.isArray(seedWay.nodes) || !seedWay.nodes.length){
    return [seedWay];
  }

  const visited = new Set();
  const queue = [seedWay];
  const result = [];

  while(queue.length){
    const current = queue.shift();
    if(!current || visited.has(current.id)) continue;

    visited.add(current.id);
    result.push(current);

    for(const nodeId of (current.nodes || [])){
      const neighbours = byNode.get(nodeId) || [];
      for(const neighbour of neighbours){
        if(!visited.has(neighbour.id)) queue.push(neighbour);
      }
    }
  }

  return result;
}

function selectSeedWay(item, candidateWays){
  const points = (item.points || [])
    .map(p => ({
      lat: Number(p.latitude),
      lon: Number(p.longitude)
    }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  if(!points.length || !candidateWays.length) return null;

  let bestWay = null;
  let bestDistance = Infinity;

  for(const way of candidateWays){
    for(const point of points){
      const distance = pointToWayDistanceMeters(point, way);
      if(distance < bestDistance){
        bestDistance = distance;
        bestWay = way;
      }
    }
  }

  if(bestWay && bestDistance <= 250){
    return bestWay;
  }

  return null;
}

async function fetchAllRoadLengthsFromOSM(rows){
  const query = buildBatchOverpassQuery(rows);
  if(!query) return {};

  for(const endpoint of OVERPASS_ENDPOINTS){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    try{
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: "data=" + encodeURIComponent(query),
        signal: controller.signal,
        cache: "no-store"
      });

      if(!response.ok) continue;

      const data = await response.json();
      const ways = Array.isArray(data.elements) ? data.elements : [];

      console.log(
        "OSM: total way jalan bernama =",
        ways.length,
        "endpoint =",
        endpoint
      );

      const osmWays = ways
        .filter(way =>
          way &&
          way.type === "way" &&
          way.tags?.name &&
          Array.isArray(way.geometry) &&
          Array.isArray(way.nodes)
        )
        .map(way => ({
          id: way.id,
          name: way.tags.name,
          normalizedName: normalizeRoadName(way.tags.name),
          nodes: way.nodes,
          geometry: way.geometry,
          meters: wayLengthMeters(way)
        }))
        .filter(way => way.meters > 0);

      const result = {};

      for(const item of rows){
        const targetName = String(item.jalan || "").trim();
        if(!targetName) continue;

        let candidates = osmWays.filter(way =>
          nameMatchScore(targetName, way.name) >= 80
        );

        if(!candidates.length){
          candidates = osmWays.filter(way =>
            nameMatchScore(targetName, way.name) >= 40
          );
        }

        let seedWay = selectSeedWay(item, candidates);

        if(!seedWay){
          seedWay = selectSeedWay(item, osmWays);
        }

        if(!seedWay){
          console.warn(
            `Ruas tidak ditemukan dekat titik deteksi: "${targetName}"`
          );
          continue;
        }

        const seedName = seedWay.normalizedName;
        const sameNameWays = osmWays.filter(way =>
          way.normalizedName === seedName
        );

        const component = connectedRoadComponent(
          seedWay,
          sameNameWays
        );

        const totalMeters = component.reduce(
          (sum, way) => sum + way.meters,
          0
        );

        if(totalMeters <= 0) continue;

        const panjangKm = totalMeters / 1000;
        result[cacheKey(item)] = panjangKm;

        console.log(
          `PANJANG RUAS: ${targetName} = ${panjangKm.toFixed(2)} km`,
          {
            osmName: seedWay.name,
            segments: component.length,
            batas: "segmen terhubung dengan nama jalan yang sama"
          }
        );
      }

      return result;

    }catch(error){
      console.warn(
        "OSM road geometry error:",
        endpoint,
        error.message
      );
    }finally{
      clearTimeout(timer);
    }
  }

  return {};
}

function getCachedLength(item, cache){
  const value = Number(cache[cacheKey(item)]?.panjangKm);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function saveRoadLength(item, panjangKm, cache){
  if(!Number.isFinite(Number(panjangKm)) || Number(panjangKm) <= 0) return;

  cache[cacheKey(item)] = {
    city: item.city,
    jalan: item.jalan,
    panjangKm: Number(panjangKm),
    savedAt: Date.now()
  };
}

function renderRows(rows){
  body.innerHTML = rows.map((item, index) => {
    const count = Number(item.jumlahLubang || 0);
    const km = Number(item.panjangKm);

    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <strong>${escapeHtml(item.jalan)}</strong>
          <br>
          <span class="unknown">${escapeHtml(item.city || "")}</span>
        </td>
        <td class="count">${count}</td>
        <td>${
          Number.isFinite(km) && km > 0
            ? formatKm(km)
            : `<span class="unknown">Belum ditemukan di OSM</span>`
        }</td>
      </tr>`;
  }).join("");
}

async function loadRoadSummary(){
  statusEl.textContent = "Mengambil data kerusakan...";
  body.innerHTML = `<tr><td colspan="4" class="empty">Mengambil data...</td></tr>`;

  try{
    const response = await fetch(API_ROAD_SUMMARY, {cache:"no-store"});
    const result = await response.json();

    if(!response.ok){
      throw new Error(result.message || "Gagal mengambil rekap jalan");
    }

    const rows = result.data || [];

    if(rows.length === 0){
      body.innerHTML = `<tr><td colspan="4" class="empty">Belum ada data kerusakan per jalan.</td></tr>`;
      statusEl.textContent = "Tidak ada data.";
      return;
    }

    renderRows(rows);

    const cache = loadCache();
    const belumAdaCache = [];

    for(const item of rows){
      const cachedKm = getCachedLength(item, cache);

      if(cachedKm != null){
        item.panjangKm = cachedKm;
      }else{
        item.panjangKm = null;
        belumAdaCache.push(item);
      }
    }

    renderRows(rows);

    if(!belumAdaCache.length){
      statusEl.textContent =
        `${rows.length} Jarak ditampilkan • panjang jalan menggunakan data OpenStreetMap.`;
      return;
    }

    statusEl.textContent =
      `Mengambil panjang ${belumAdaCache.length} jalan berdasarkan geometri jalan OpenStreetMap...`;

    const osmLengths = await fetchAllRoadLengthsFromOSM(belumAdaCache);

    for(const item of belumAdaCache){
      const key = cacheKey(item);
      const panjangKm = Number(osmLengths[key]);

      if(Number.isFinite(panjangKm) && panjangKm > 0){
        item.panjangKm = panjangKm;
        saveRoadLength(item, panjangKm, cache);
      }
    }

    saveCache(cache);
    renderRows(rows);

    const totalTersedia = rows.filter(
      item => Number.isFinite(Number(item.panjangKm)) && Number(item.panjangKm) > 0
    ).length;

    statusEl.textContent =
      `${rows.length} ruas ditampilkan • ${totalTersedia} ruas memiliki panjang berdasarkan OpenStreetMap.`;

  }catch(error){
    console.error("REKAP JALAN ERROR:", error);
    body.innerHTML = `<tr><td colspan="4" class="empty">Gagal memuat data rekap jalan.</td></tr>`;
    statusEl.textContent = error.message;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if(!checkLogin()) return;

  loadRoadSummary();
  refreshBtn?.addEventListener("click", loadRoadSummary);

  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("overlay");

  menuBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("show");
    overlay?.classList.toggle("show");
  });

  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("show");
    overlay?.classList.remove("show");
  });
});
