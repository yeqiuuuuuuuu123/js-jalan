const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

const Report =
  require("../models/Report");

const RoadDamage =
  require("../models/RoadDamage");
const https = require("https");

const geocodeCache = new Map();

let lastNominatimRequest = 0;

async function waitForNominatim() {
  const now = Date.now();
  const elapsed = now - lastNominatimRequest;

  if (elapsed < 1100) {
    await new Promise(resolve =>
      setTimeout(resolve, 1100 - elapsed)
    );
  }

  lastNominatimRequest = Date.now();
}

/* =========================
MULTER CONFIG
========================= */

const storage =
  multer.diskStorage({

    destination: (req, file, cb) => {

      cb(
        null,
        "uploads/"
      );

    },

    filename: (req, file, cb) => {

      cb(

        null,

        Date.now() +

        path.extname(
          file.originalname
        )

      );

    }

  });

const upload =
  multer({
    storage
  });

  /* =========================
   NOMINATIM SEARCH
========================= */

router.get(
  "/geocode/search",
  async (req, res) => {

    try {

        const query =
  String(req.query.q || "").trim();

if (!query) {
  return res.status(400).json({
    message: "Query lokasi wajib diisi"
  });
}

const cacheKey =
  `search:${query.toLowerCase()}`;

if (geocodeCache.has(cacheKey)) {
  console.log("GEOCODE CACHE:", query);

  return res.json(
    geocodeCache.get(cacheKey)
  );
}

await waitForNominatim();

      if (!query) {

        return res.status(400).json({
          message:
            "Query lokasi wajib diisi"
        });

      }

      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?format=jsonv2` +
        `&q=${encodeURIComponent(query)}` +
        `&addressdetails=1` +
        `&limit=10` +
        `&countrycodes=id`;

      const response =
        await fetch(
          url,
          {
            headers: {
               "User-Agent":
  "DeteksiJalan/1.0 (road damage reporting application)"
            }
          }
        );

      if (!response.ok) {

        return res.status(
          response.status
        ).json({

          message:
            "Gagal mengambil data lokasi dari Nominatim"

        });

      }

      const data =
        await response.json();
        geocodeCache.set(
  cacheKey,
  data
);

      res.json(data);

    }

    catch(error) {

      console.error(
        "NOMINATIM SEARCH ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Gagal mencari lokasi"

      });

    }

  }
);


/* =========================
   NOMINATIM REVERSE
========================= */

router.get(
  "/geocode/reverse",
  async (req, res) => {

    try {

      const {
        lat,
        lon
      } = req.query;
      const cacheKey =
  `reverse:${lat},${lon}`;

if (geocodeCache.has(cacheKey)) {
  console.log(
    "REVERSE CACHE:",
    lat,
    lon
  );

  return res.json(
    geocodeCache.get(cacheKey)
  );
}

await waitForNominatim();


      if (!lat || !lon) {

        return res.status(400).json({

          message:
            "Latitude dan longitude wajib diisi"

        });

      }


      const url =
        "https://nominatim.openstreetmap.org/reverse" +
        `?format=jsonv2` +
        `&lat=${encodeURIComponent(lat)}` +
        `&lon=${encodeURIComponent(lon)}` +
        `&addressdetails=1`;


      const response =
        await fetch(
          url,
          {
            headers: {
              "User-Agent":
                "DeteksiJalan/1.0"
            }
          }
        );


      if (!response.ok) {

        return res.status(
          response.status
        ).json({

          message:
            "Gagal mengambil alamat dari Nominatim"

        });

      }


      const data =
        await response.json();
        geocodeCache.set(
  cacheKey,
  data
);


      res.json(data);

    }

    catch(error) {

      console.error(
        "NOMINATIM REVERSE ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Gagal mendapatkan alamat"

      });

    }

  }
);

/* =========================
CREATE REPORT
========================= */

router.post(

  "/create",

  upload.single("image"),

  async (req, res) => {

    try {

      const {

        latitude,
        longitude,
        city,
        location,
        description

      } = req.body;

      if (!req.file) {

        return res.status(400).json({

          message:
            "Foto wajib diupload"

        });

      }

      const report =
        await Report.create({

          image:
            req.file.filename,

          latitude:
            Number(latitude),

          longitude:
            Number(longitude),

          city:
            city ||
            "Kota Tidak Diketahui",

          location:
            location ||
            "Lokasi Tidak Diketahui",

          description:
            description || "",

          severity:
            "belum",

          status:
            "Pending",

          adminNote:
            "",

          inspected:
            false

        });

      res.status(201).json({

        success: true,

        message:
          "Laporan berhasil dikirim",

        report

      });

    }

    catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,

        message:
          "Server error"

      });

    }

  }

);

/* =========================
GET ALL REPORTS
========================= */

router.get(

  "/all",

  async (req, res) => {

    try {

      const reports =
        await Report.find()

        .sort({

          createdAt: -1

        });

      res.json({

        success: true,

        total:
          reports.length,

        data:
          reports

      });

    }

    catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,

        message:
          "Server error"

      });

    }

  }

);


router.get("/road-summary", async (req, res) => {
  try {
    const detections = await RoadDamage.find({
      location: {
        $exists: true,
        $nin: ["", null, "Unknown Location", "Lokasi Tidak Diketahui"]
      },
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).lean();

    function extractRoadName(location) {
      const text = String(location || "").trim();
      if (!text) return "";

      const parts = text
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

      // Ambil komponen yang paling mungkin merupakan nama jalan.
      const roadPart = parts.find(part =>
        /^(jalan|jl\.?|gang|gg\.?|lorong|lrg\.?|street|road|avenue|ave\.?)/i.test(part)
      );

      return roadPart || parts[0] || text;
    }

    const groups = new Map();

    for (const item of detections) {
      const city = String(item.city || "").trim();
      const jalan = extractRoadName(item.location);
      if (!jalan) continue;

      const latitude = Number(item.latitude);
      const longitude = Number(item.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      const key = `${city.toLowerCase()}|${jalan.toLowerCase()}`;

      if (!groups.has(key)) {
        groups.set(key, {
          city,
          jalan,
          jumlahLubang: 0,
          points: []
        });
      }

      const group = groups.get(key);
      group.jumlahLubang += 1;
      group.points.push({ latitude, longitude });
    }

    const data = [...groups.values()]
      .map(group => {
        const lats = group.points.map(p => p.latitude);
        const lons = group.points.map(p => p.longitude);

        return {
          city: group.city,
          jalan: group.jalan,
          jumlahLubang: group.jumlahLubang,
          points: group.points,
          bounds: {
            south: Math.min(...lats),
            west: Math.min(...lons),
            north: Math.max(...lats),
            east: Math.max(...lons)
          }
        };
      })
      .sort((a, b) => b.jumlahLubang - a.jumlahLubang);

    res.json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    console.error("ROAD SUMMARY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil rekap kerusakan per jalan"
    });
  }
});


/* =========================
GET REPORT BY ID
========================= */

router.get(

  "/:id",

  async (req, res) => {

    try {

      const report =
        await Report.findById(
          req.params.id
        );

      if (!report) {

        return res.status(404).json({

          success: false,

          message:
            "Laporan tidak ditemukan"

        });

      }

      res.json(report);

    }

    catch(error) {

      console.log(
        "========== ERROR =========="
      );

      console.log(error);
      console.log(error.message);
      console.log(error.stack);

      console.log(
        "==========================="
      );

      res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);

/* =========================
UPDATE INSPEKSI ADMIN
========================= */

router.put(

  "/update/:id",

  async (req, res) => {

    try {

      const {
        severity,
        status,
        adminNote
      } = req.body;

      const report =
        await Report.findById(
          req.params.id
        );

      if(!report){

        return res.status(404).json({

          success:false,

          message:
            "Laporan tidak ditemukan"

        });

      }

      report.severity =
        severity;

      report.status =
        status;

      report.adminNote =
        adminNote || "";

      report.inspected =
        true;

      /* =========================
         KIRIM KE ROAD DAMAGE
      ========================= */

      if(!report.verified){

        await RoadDamage.create({

          image:
            report.image,

          latitude:
            report.latitude,

          longitude:
            report.longitude,

          city:
            report.city,

          location:
            report.location,

          severity:
            severity,

          confidence:
            100

        });

        report.verified =
          true;

      }

      await report.save();

      res.json({

        success:true,

        message:
          "Inspeksi berhasil disimpan & masuk dashboard",

        report

      });

    }

    catch(error){

      console.log(error);

      res.status(500).json({

        success:false,

        message:
          "Server error"

      });

    }

  }

);

/* =========================
DELETE REPORT
========================= */

router.delete(

  "/:id",

  async (req, res) => {

    try {

      const report =
        await Report.findById(
          req.params.id
        );

      if (!report) {

        return res.status(404).json({

          success: false,

          message:
            "Laporan tidak ditemukan"

        });

      }

      await report.deleteOne();

      res.json({

        success: true,

        message:
          "Laporan berhasil dihapus"

      });

    }

    catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,

        message:
          "Server error"

      });

    }

  }

);

module.exports = router;