const mongoose = require("mongoose");

const roadDamageSchema =
  new mongoose.Schema({

    /* =========================
       IMAGE
    ========================= */

    image:{

      type:String,

      required:true

    },

    /* =========================
       GPS
    ========================= */

    latitude:{

      type:Number,

      required:false

    },

    longitude:{

      type:Number,

      required:false

    },

    /* =========================
       LOCATION NAME
    ========================= */

    location:{

      type:String,

      default:"Unknown Location"

    },

    city:{

      type:String,
      default:"Unknown City"

    },


    severity:{

      type:String,

      enum:[

        "kecil",
        "sedang",
        "besar"

      ],

      required:true

    },

    confidence:{

      type:Number,

      required:true

    },


    createdAt:{

      type:Date,

      default:Date.now

    }

  });

module.exports =
  mongoose.model(

    "RoadDamage",

    roadDamageSchema

  );