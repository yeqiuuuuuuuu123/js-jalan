const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({

  image: {
    type: String,
    required: true
  },

  latitude: {
    type: Number
  },

  longitude: {
    type: Number
  },

  city: {
    type: String,
    default: "Kota Tidak Diketahui"
  },

  location: {
    type: String,
    default: "Lokasi Tidak Diketahui"
  },

  description: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: [
      "Pending",
      "Diproses",
      "Selesai"
    ],
    default: "Pending"
  },

  inspected: {
    type: Boolean,
    default: false
  },

  verified: {
    type: Boolean,
    default: false
  },

  severity: {
    type: String,
    enum: [
      "belum",
      "kecil",
      "sedang",
      "besar"
    ],
    default: "belum"
  },

  confidence: {
    type: Number,
    default: 0
  },

  adminNote: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports =
  mongoose.model(
    "Report",
    reportSchema
  );