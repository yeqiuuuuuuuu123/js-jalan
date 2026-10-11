const multer = require("multer");
const FormData = require("form-data");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
const detectionRouter = require("./routes/detection");
const reportRoutes =
  require("./routes/reportRoutes");
dotenv.config();

const app = express();

const upload = multer({
  storage: multer.memoryStorage()
});

connectDB();

app.use(cors());
app.use(express.json({
  limit: "50mb"
}));

app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}));

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/uploads",
  express.static("uploads")
);

app.use(express.static(
  path.join(__dirname, "frontend")
));

app.use("/api/auth", authRouter);

app.use("/api/detection", detectionRouter);

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "frontend",
      "security.html"
    )
  );
});

app.post(
  "/detect",
  upload.single("image"),
  async (req, res) => {

    try {

      const formData = new FormData();

      formData.append(
        "image",
        req.file.buffer,
        req.file.originalname
      );

     const response =
        await axios.post(

        "http://host.docker.internal:5001/detect",

          formData,

        {
          headers:
            formData.getHeaders()
          }

          );

      res.json(
        response.data
      );

    }

    catch(err){

      console.error(
        err.message
      );

      res.status(500).json([]);

    }

  }
);

app.get("/gps", async (req, res) => {

  console.log("=== REQUEST /gps MASUK ===");

  try {

    console.log("Mengambil GPS dari Jetson...");

    const response = await axios.get(
      "http://100.120.69.44:5002/gps"
    );

    console.log("GPS BERHASIL:", response.data);

    console.log("Mengirim ke browser...");

    return res.json(response.data);

  } catch (err) {

    console.log("GPS ERROR:", err);

    return res.status(500).json({
      status: "error"
    });

  }

});


app.listen(5000, () => {

  console.log("Server jalan di 5000");
});