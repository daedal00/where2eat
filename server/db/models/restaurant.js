import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cuisine: { type: String, required: true },
    link: { type: String, required: false },
    location: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
