import express from "express";
import cors from "cors";
import "./db/connection.js";
import restaurantRoutes from "./routes/restaurants.js";
import sessionRoutes from "./routes/sessions.js";

const app = express();
const port = process.env.PORT || 5050;

app.use(
  cors({
    origin: [
      process.env.NODE_ENV === "production"
        ? "https://where2eat-client.vercel.app" // Update this to your actual Vercel frontend domain
        : "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/sessions", sessionRoutes);

// start the Express server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
