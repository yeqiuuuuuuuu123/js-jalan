const mongoose = require("mongoose");

const connectDB = async () => {

  try {

    console.log(
      "MONGO URI:",
      process.env.MONGO_URI
    );

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected"
    );

    console.log(
      "Database:",
      mongoose.connection.name
    );

  } catch (error) {

    console.error(
      "MongoDB error:",
      error.message
    );

    process.exit(1);

  }

};

module.exports = connectDB;