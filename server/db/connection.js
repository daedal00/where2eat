import mongoose from "mongoose";

const uri = process.env.ATLAS_URI || "mongodb://localhost:27017/where2eat";

mongoose
  .connect(uri)
  .then(() => {
    console.log("Successfully connected to MongoDB.");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

export default mongoose.connection;
