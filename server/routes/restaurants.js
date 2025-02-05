import express from "express";
import Restaurant from "../db/models/restaurant.js";

const router = express.Router();

// Move normalizeCuisine function to the top level
function normalizeCuisine(cuisine) {
  const normalized = cuisine.toLowerCase();
  const commonCuisines = [
    "korean",
    "chinese",
    "japanese",
    "vietnamese",
    "thai",
    "indian",
    "italian",
    "french",
    "greek",
    "mexican",
    "american",
    "mediterranean",
    "lebanese",
    "turkish",
    "persian",
    "malaysian",
    "indonesian",
    "filipino",
    "spanish",
    "german",
    "brazilian",
    "caribbean",
  ];

  for (const baseCuisine of commonCuisines) {
    if (normalized.includes(baseCuisine)) {
      return baseCuisine.charAt(0).toUpperCase() + baseCuisine.slice(1);
    }
  }

  const firstWord = normalized.split(/[\s/]+/)[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}

// Get all restaurants with optional filters
router.get("/", async (req, res) => {
  try {
    console.log("GET /restaurants - Query:", req.query);
    const { cuisine, location } = req.query;
    const filter = {};

    if (cuisine) {
      // Use case-insensitive regex to match the base cuisine type
      filter.cuisine = new RegExp(cuisine, "i");
    }
    if (location) filter.location = location;

    const restaurants = await Restaurant.find(filter);
    console.log(`Found ${restaurants.length} restaurants`);
    res.json(restaurants);
  } catch (err) {
    console.error("Error in GET /restaurants:", err);
    res.status(500).json({ message: err.message });
  }
});

// Bulk import restaurants
router.post("/bulk", async (req, res) => {
  try {
    console.log("POST /restaurants/bulk - Received request");

    if (!Array.isArray(req.body)) {
      console.warn("Invalid request body - not an array");
      return res.status(400).json({ message: "Request body must be an array" });
    }

    console.log(`Processing ${req.body.length} restaurants in request`);

    // More detailed validation logging
    const validRestaurants = req.body.filter((restaurant) => {
      const isValid =
        restaurant.name && restaurant.cuisine && restaurant.location;
      console.log("Validating restaurant:", {
        restaurant,
        isValid,
        hasName: !!restaurant.name,
        hasCuisine: !!restaurant.cuisine,
        hasLocation: !!restaurant.location,
      });
      return isValid;
    });

    console.log("Valid restaurants count:", validRestaurants.length);
    console.log("Sample valid restaurant:", validRestaurants[0]);

    if (validRestaurants.length === 0) {
      console.warn("No valid restaurants in request");
      return res.status(400).json({ message: "No valid restaurants provided" });
    }

    // Reduce chunk size for MongoDB
    const chunkSize = 25;
    const results = [];

    for (let i = 0; i < validRestaurants.length; i += chunkSize) {
      const chunk = validRestaurants.slice(i, i + chunkSize);
      console.log(
        `Inserting chunk ${i / chunkSize + 1} of ${Math.ceil(
          validRestaurants.length / chunkSize
        )}`
      );
      const result = await Restaurant.insertMany(chunk, { ordered: false });
      results.push(...result);
    }

    console.log(`Successfully imported ${results.length} restaurants`);
    res.status(201).json({
      message: `Successfully imported ${results.length} restaurants`,
      count: results.length,
    });
  } catch (err) {
    console.error("Error in POST /restaurants/bulk:", err.stack);
    res.status(400).json({ message: err.message });
  }
});

// Get unique cuisines (grouped for frontend display)
router.get("/cuisines", async (req, res) => {
  try {
    const allCuisines = await Restaurant.distinct("cuisine");

    // Normalize and deduplicate cuisines
    const normalizedCuisines = [
      ...new Set(allCuisines.map(normalizeCuisine)),
    ].sort();

    console.log(
      `Normalized ${allCuisines.length} cuisines into ${normalizedCuisines.length} categories`
    );
    console.log("Normalized cuisines:", normalizedCuisines);
    res.json(normalizedCuisines);
  } catch (err) {
    console.error("Error in GET /restaurants/cuisines:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get unique cities
router.get("/cities", async (req, res) => {
  try {
    console.log("GET /restaurants/cities");
    const defaultCities = ["Vancouver", "Lougheed", "Surrey", "Burnaby"];
    const dbCities = await Restaurant.distinct("location");
    const allCities = [...new Set([...defaultCities, ...dbCities])];
    console.log(`Found ${allCities.length} unique cities`);
    res.json(allCities);
  } catch (err) {
    console.error("Error in GET /restaurants/cities:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get cuisines available for specific locations
router.get("/cuisines-by-location", async (req, res) => {
  try {
    const locations = req.query.locations?.split(",") || [];
    console.log("Fetching cuisines for locations:", locations);

    // If no locations selected, return all cuisines
    if (locations.length === 0) {
      const allCuisines = await Restaurant.distinct("cuisine");
      const normalizedCuisines = [
        ...new Set(allCuisines.map(normalizeCuisine)),
      ].sort();
      return res.json({
        cuisines: normalizedCuisines,
        availableInLocation: {},
      });
    }

    // Find all restaurants in selected locations
    const restaurants = await Restaurant.find({
      location: { $in: locations },
    });

    console.log("Found restaurants:", restaurants.length);

    // Get unique cuisines and track which locations they're available in
    const cuisinesByLocation = new Map();
    restaurants.forEach((restaurant) => {
      const normalizedCuisine = normalizeCuisine(restaurant.cuisine);
      if (!cuisinesByLocation.has(normalizedCuisine)) {
        cuisinesByLocation.set(normalizedCuisine, new Set());
      }
      cuisinesByLocation.get(normalizedCuisine).add(restaurant.location);
    });

    // Convert to response format
    const availableInLocation = Object.fromEntries(
      [...cuisinesByLocation.entries()].map(([cuisine, locations]) => [
        cuisine,
        [...locations],
      ])
    );

    console.log("Unique cuisines:", [...cuisinesByLocation.keys()]);

    res.json({
      cuisines: [...cuisinesByLocation.keys()].sort(),
      availableInLocation,
    });
  } catch (err) {
    console.error("Error in GET /restaurants/cuisines-by-location:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get a single restaurant
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a restaurant
router.put("/:id", async (req, res) => {
  try {
    console.log("Updating restaurant:", req.params.id, req.body);
    const { name, cuisine, location, link } = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { name, cuisine, location, link },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    console.log("Updated restaurant:", restaurant);
    res.json(restaurant);
  } catch (err) {
    console.error("Error updating restaurant:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a restaurant
router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({ message: "Restaurant deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
