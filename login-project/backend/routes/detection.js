const express = require("express");
const router = express.Router();

const axios = require("axios");

const RoadDamage =
  require("../models/RoadDamage");

const protect =
  require("../middleware/authMiddleware");

const adminOnly =
  require("../middleware/adminMiddleware");

/* =========================
   CREATE DETECTION
========================= */

router.post("/", async (req, res) => {

  try {

const {

  image,
  latitude,
  longitude,
  location: frontendLocation,
  severity,
  confidence

} = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!image || !severity) {

      return res.status(400).json({

        message:
          "Data tidak lengkap"

      });

    }

  

let location =
  frontendLocation || "Lokasi Tidak Diketahui";

let city =
  frontendLocation ? "Padang" : "Unknown City";

    try {

if (

    !frontendLocation &&
    latitude !== undefined &&
    longitude !== undefined

) {
        console.log("LAT :", latitude);
console.log("LON :", longitude);
console.log(
  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
);

        const response =
        
          await axios.get(

            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,

            {

              headers: {

                "User-Agent":
                  "DeteksiJalanApp"

              }

            }

          );

        const data =
          response.data;

        console.log(
          "LOCATION DATA:",
          data
        );

        if (data.address) {

          location =

            data.address.road ||

            data.address.neighbourhood ||

            data.address.suburb ||

            data.address.village ||

            data.address.city ||

            data.display_name ||

            "Lokasi Tidak Diketahui";

           city =

            data.address.city ||

            data.address.town ||

            data.address.county ||

            data.address.state ||

             "Tidak Diketahui";            

        }

      }

    } catch (locationErr) {

      console.log(
        "LOCATION ERROR:",
        locationErr.message
      );

    }

    /* =========================
       SAVE DATABASE
    ========================= */

     console.log("LOCATION :", location);
     console.log("CITY     :", city);

     console.log("================================");
console.log("LATITUDE :", latitude);
console.log("LONGITUDE:", longitude);
console.log("LOCATION :", location);
console.log("CITY     :", city);
console.log("================================");

    const data =
      await RoadDamage.create({

        image,

        latitude,

        longitude,

        location,

        city,

        severity,

        confidence

      });

    /* =========================
       SUCCESS
    ========================= */

    res.status(201).json({

      message:
        "Data berhasil disimpan",

      data

    });

  } catch (err) {

    console.error(
      "CREATE ERROR:",
      err.message
    );

    res.status(500).json({

      message:
        "Error server"

    });

  }

});

/* =========================
   ADMIN GET
========================= */

router.get(

  "/admin",

  protect,

  adminOnly,

  async (req, res) => {

    try {

      const data =
        await RoadDamage
          .find()
          .sort({

            createdAt: -1

          });

      res.json({

        total:
          data.length,

        data

      });

    } catch (err) {

      console.error(
        "ADMIN GET ERROR:",
        err.message
      );

      res.status(500).json({

        message:
          "Error server"

      });

    }

  }

);

/* =========================
   GET ALL
========================= */

router.get("/", async (req, res) => {

  try {

    const data =
      await RoadDamage
        .find()
        .sort({

          createdAt: -1

        });

    res.json({

      total:
        data.length,

      data

    });

  } catch (err) {

    console.error(
      "GET ERROR:",
      err.message
    );

    res.status(500).json({

      message:
        "Error server"

    });

  }

});

/* =========================
   SUMMARY
========================= */

router.get("/summary", async (req, res) => {

  try {

    const data = await RoadDamage.find();

    let kecil = 0;
    let sedang = 0;
    let besar = 0;

    data.forEach(d => {

      if (d.severity === "kecil") {
        kecil++;
      }
      else if (d.severity === "sedang") {
        sedang++;
      }
      else if (d.severity === "besar") {
        besar++;
      }

    });

const total = data.length;

let S = 0;
let IKJ = 0;

if (total > 0) {

  // =========================
  // Weighted Mean (RSMS)
  // =========================

  S =
  (
    (kecil * 0.50) +
    (sedang * 0.75) +
    (besar * 1.00)
  ) / total;

  // =========================
  // Transformasi IKJ
  // =========================

  IKJ =
    ((1.00 - S) / 0.50) * 100;

  // Membatasi nilai IKJ
  IKJ = Math.max(
    0,
    Math.min(100, IKJ)
  );

}

res.json({

  total,

  kecil,

  sedang,

  besar,

  IKJ: Number(IKJ.toFixed(2))

});

  }

  catch (err) {

    console.error(
      "SUMMARY ERROR:",
      err.message
    );

    res.status(500).json({

      message:
        "Error server"

    });

  }

});


router.get("/city-summary", async (req, res) => {

  try {

    const data =
      await RoadDamage.find();

    const result = {};

    data.forEach(item => {

      const city =
        item.city || "Tidak Diketahui";

      if (!result[city]) {

        result[city] = {

          city,

          total: 0,

          kecil: 0,

          sedang: 0,

          besar: 0

        };

      }

      result[city].total++;

      if (item.severity === "kecil")
        result[city].kecil++;

      else if (item.severity === "sedang")
        result[city].sedang++;

      else if (item.severity === "besar")
        result[city].besar++;

    });

    Object.values(result).forEach(item => {

  let S = 0;
  let IKJ = 0;

  if (item.total > 0) {

    // Weighted Mean (RSMS)
    S =
    (
      (item.kecil * 0.50) +
      (item.sedang * 0.75) +
      (item.besar * 1.00)
    ) / item.total;

    // Transformasi IKJ
    IKJ =
      ((1.00 - S) / 0.50) * 100;

    // Membatasi nilai IKJ
    IKJ = Math.max(
      0,
      Math.min(100, IKJ)
    );

  }

  item.IKJ = Number(IKJ.toFixed(2));

});

    res.json(
      Object.values(result)
    );

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      message:
        "Server error"

    });

  }

});

/* =========================
   DELETE ALL
========================= */

router.delete(

    "/delete-all",

    protect,

    adminOnly,

    async (req,res)=>{

        try{

            await RoadDamage.deleteMany({});

            res.json({

                message:
                "Semua data berhasil dihapus"

            });

        }

        catch(err){

            console.error(err);

            res.status(500).json({

                message:
                "Server error"

            });

        }

    }

);


/* =========================
   DELETE
========================= */


router.delete(

  "/:id",

  protect,

  adminOnly,

  async (req, res) => {

    try {

      const data =
        await RoadDamage.findById(
          req.params.id
        );

      if (!data) {

        return res.status(404).json({

          message:
            "Data tidak ditemukan"

        });

      }

      await data.deleteOne();

      res.json({

        message:
          "Data berhasil dihapus"

      });

    } catch (err) {

      console.error(
        "DELETE ERROR:",
        err.message
      );

      res.status(500).json({

        message:
          "Error server"

      });

    }

  }

);

router.put(

  "/:id",

  protect,

  adminOnly,

  async (req, res) => {

    try {

      const data =
        await RoadDamage.findById(
          req.params.id
        );

      if (!data) {

        return res.status(404).json({

          message:
            "Data tidak ditemukan"

        });

      }

      const {

        severity,
        confidence

      } = req.body;

      if (severity) {

        data.severity =
          severity;

      }

      if (confidence) {

        data.confidence =
          confidence;

      }

      await data.save();

      res.json({

        message:
          "Data berhasil diupdate",

        data

      });

    } catch (err) {

      console.error(
        "UPDATE ERROR:",
        err.message
      );

      res.status(500).json({

        message:
          "Error server"

      });

    }

  }

);

module.exports = router;