const express = require("express");
const router = express.Router();

const User = require("../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const protect =
  require("../middleware/authMiddleware");


/* =========================================
   REGISTER
========================================= */

router.post("/register", async (req, res) => {

  try {

    let {
      username,
      email,
      password
    } = req.body;


    if (!username || !email || !password) {

      return res.status(400).json({

        message:
          "Semua field wajib diisi"
      });
    }

    if (password.length < 6) {

      return res.status(400).json({

        message:
          "Password minimal 6 karakter"
      });
    }

    email =
      email.toLowerCase().trim();

    /* CEK USER */

    const userExists =
      await User.findOne({

        $or: [

          { email },

          { username }
        ]
      });

    if (userExists) {

      return res.status(400).json({

        message:
          "Email atau Username sudah terdaftar"
      });
    }

    /* HASH PASSWORD */

    const hashedPassword =
      await bcrypt.hash(password, 10);

    /* CREATE USER */

    const user =
      await User.create({

        username,

        email,

        password:
          hashedPassword,

        profileImage: ""
      });

    /* RESPONSE */

    res.status(201).json({

      message:
        "Register berhasil",

      user: {

        id:
          user._id,

        username:
          user.username,

        email:
          user.email,

        points:
          user.points,

        role:
          user.role,

        profileImage:
          user.profileImage
      }
    });

  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );

    res.status(500).json({

      message:
        "Server error"
    });
  }
});



router.post("/login", async (req, res) => {

  try {

    let {
      email,
      password
    } = req.body;

    if (!email || !password) {

      return res.status(400).json({

        message:
          "Email & password wajib diisi"
      });
    }

    email =
      email.toLowerCase().trim();


    const user =
      await User.findOne({ email });

    if (!user) {

      return res.status(400).json({

        message:
          "User tidak ditemukan"
      });
    }



    const isMatch =
      await bcrypt.compare(

        password,
        user.password
      );

    if (!isMatch) {

      return res.status(400).json({

        message:
          "Password salah"
      });
    }


    const token =
      jwt.sign(

        { id: user._id },

        process.env.JWT_SECRET,

        {
          expiresIn: "30d"
        }
      );


    res.json({

      message:
        "Login berhasil",

      token,

      user: {

        id:
          user._id,

        username:
          user.username,

        email:
          user.email,

        points:
          user.points,

        role:
          user.role,

        profileImage:
          user.profileImage
      }
    });

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    res.status(500).json({

      message:
        "Server error"
    });
  }
});

router.get("/profile", protect, (req, res) => {

  res.json({

    user:
      req.user
  });
});


router.post("/checkout", protect, async (req, res) => {

  try {

    const {
      totalItems
    } = req.body;

    const user =
      await User.findById(req.user._id);

    const pointEarned =
      totalItems * 10;

    user.points +=
      pointEarned;

    await user.save();

    res.json({

      message:
        "Checkout berhasil",

      pointEarned,

      totalPoints:
        user.points
    });

  } catch (error) {

    console.error(
      "CHECKOUT ERROR:",
      error
    );

    res.status(500).json({

      message:
        "Server error"
    });
  }
});



router.put("/change-password", protect, async (req, res) => {

  try {

    const {
      oldPassword,
      newPassword
    } = req.body;


    if (!oldPassword || !newPassword) {

      return res.status(400).json({

        message:
          "Semua field wajib diisi"
      });
    }

    if (newPassword.length < 6) {

      return res.status(400).json({

        message:
          "Password baru minimal 6 karakter"
      });
    }

    const user =
      await User.findById(req.user._id);


    const isMatch =
      await bcrypt.compare(

        oldPassword,
        user.password
      );

    if (!isMatch) {

      return res.status(400).json({

        message:
          "Password lama salah"
      });
    }

    user.password =
      await bcrypt.hash(newPassword, 10);

    await user.save();



    res.json({

      message:
        "Password berhasil diubah"
    });

  } catch (error) {

    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    res.status(500).json({

      message:
        "Server error"
    });
  }
});



router.put("/update-profile", protect, async (req, res) => {

  try {

    const {
      username,
      email,
      profileImage
    } = req.body;


    const user =
      await User.findById(req.user._id);

    if (!user) {

      return res.status(404).json({

        message:
          "User tidak ditemukan"
      });
    }


    user.username =
      username || user.username;

    user.email =
      email || user.email;

    user.profileImage =
      profileImage || user.profileImage;

    await user.save();


    res.json({

      message:
        "Profile berhasil diupdate",

      user: {

        id:
          user._id,

        username:
          user.username,

        email:
          user.email,

        points:
          user.points,

        role:
          user.role,

        profileImage:
          user.profileImage
      }
    });

  } catch (error) {

    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    res.status(500).json({

      message:
        "Server error"
    });
  }
});


module.exports = router;