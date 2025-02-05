import express from "express";
import cors from "cors";
import "./db/connection.js";
import restaurantRoutes from "./routes/restaurants.js";
import sessionRoutes from "./routes/sessions.js";

const app = express();

app.use(
  cors({
    origin: ["https://where2eat.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/sessions", sessionRoutes);

// Only listen to port if not running on Vercel
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5050;
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// Export the app for Vercel
export default app;
