import express from "express";
import Session from "../db/models/session.js";
import Restaurant from "../db/models/restaurant.js";

const router = express.Router();

// Create a new session
router.post("/", async (req, res) => {
  try {
    const { filters } = req.body;

    // Generate a unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = Session.generateCode();
      const existing = await Session.findOne({ code });
      if (!existing) isUnique = true;
    }

    // Find restaurants based on filters
    const query = {};
    if (filters.locations?.length) {
      query.location = { $in: filters.locations };
    }
    if (filters.includeCuisines?.length) {
      // Use our normalized cuisine matching
      query.cuisine = {
        $in: filters.includeCuisines.map((cuisine) => new RegExp(cuisine, "i")),
      };
    }
    if (filters.excludeCuisines?.length) {
      query.cuisine = {
        ...query.cuisine,
        $nin: filters.excludeCuisines.map(
          (cuisine) => new RegExp(cuisine, "i")
        ),
      };
    }

    console.log("Restaurant query:", query); // Add logging
    const restaurants = await Restaurant.find(query);
    console.log(`Found ${restaurants.length} restaurants`); // Add logging

    if (restaurants.length === 0) {
      return res.status(400).json({
        message: "No restaurants found matching your criteria",
      });
    }

    const session = new Session({
      code,
      selectedRestaurants: restaurants.map((r) => r._id),
    });

    const newSession = await session.save();
    const populatedSession = await Session.findById(newSession._id).populate(
      "selectedRestaurants"
    );

    res.status(201).json(populatedSession);
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(400).json({ message: err.message });
  }
});

// Get session by code
router.get("/:code", async (req, res) => {
  try {
    const session = await Session.findOne({ code: req.params.code }).populate(
      "selectedRestaurants winner"
    );
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Join a session
router.post("/:code/join", async (req, res) => {
  try {
    const { name, isCreator } = req.body;
    const session = await Session.findOne({ code: req.params.code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ message: "Session already completed" });
    }

    // Check if participant already exists
    const existingParticipant = session.participants.find(
      (p) => p.name === name
    );
    if (existingParticipant) {
      return res
        .status(400)
        .json({ message: "Name already taken in this session" });
    }

    // Set creator if this is the first person joining
    if (!session.creatorName) {
      session.creatorName = name;
    }

    // Initialize participant with empty votes
    const participant = {
      name,
      votes: session.selectedRestaurants.map((restaurant) => ({
        restaurant: restaurant,
        vote: 0,
      })),
      hasConfirmed: false,
    };

    session.participants.push(participant);
    await session.save();

    res.json(session);
  } catch (err) {
    console.error("Join session error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Submit votes
router.post("/:code/vote", async (req, res) => {
  try {
    const { name, votes } = req.body;
    const session = await Session.findOne({ code: req.params.code }).populate(
      "selectedRestaurants"
    );

    if (!session) return res.status(404).json({ message: "Session not found" });

    const participant = session.participants.find((p) => p.name === name);
    if (!participant)
      return res.status(404).json({ message: "Participant not found" });

    participant.votes = votes;
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Confirm votes
router.post("/:code/confirm", async (req, res) => {
  try {
    const { name } = req.body;
    const session = await Session.findOne({ code: req.params.code })
      .populate("selectedRestaurants")
      .populate("winner")
      .populate("topChoices");

    if (!session) return res.status(404).json({ message: "Session not found" });

    const participant = session.participants.find((p) => p.name === name);
    if (!participant)
      return res.status(404).json({ message: "Participant not found" });

    participant.hasConfirmed = true;

    // Check if all participants have confirmed
    const allConfirmed = session.participants.every((p) => p.hasConfirmed);

    if (allConfirmed) {
      // Calculate scores for all restaurants
      const restaurantScores = new Map();

      // Initialize scores for all restaurants
      session.selectedRestaurants.forEach((restaurant) => {
        restaurantScores.set(restaurant._id.toString(), {
          restaurant,
          score: 0,
          voteCount: 0,
        });
      });

      // Calculate total scores
      session.participants.forEach((participant) => {
        participant.votes.forEach((vote) => {
          const restaurantId = vote.restaurant.toString();
          const currentData = restaurantScores.get(restaurantId);
          if (currentData) {
            currentData.score += vote.vote;
            if (vote.vote > 0) currentData.voteCount += 1;
          }
        });
      });

      // Convert to array and sort by score
      const sortedRestaurants = [...restaurantScores.values()].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.voteCount - a.voteCount;
      });

      // Check for ties in first place
      const highestScore = sortedRestaurants[0].score;
      const tiedForFirst = sortedRestaurants.filter(
        (r) => r.score === highestScore
      );

      let winner;
      let tieBreaker = false;

      if (tiedForFirst.length > 1) {
        // Randomly select winner from tied restaurants
        const randomIndex = Math.floor(Math.random() * tiedForFirst.length);
        winner = tiedForFirst[randomIndex].restaurant;
        tieBreaker = true;
      } else {
        winner = sortedRestaurants[0].restaurant;
      }

      // Create winner document with stats
      const winnerWithStats = {
        _id: winner._id,
        name: winner.name,
        cuisine: winner.cuisine,
        location: winner.location,
        priceRange: winner.priceRange,
        voteCount: restaurantScores.get(winner._id.toString()).voteCount,
        tieBreaker,
      };

      // Get top choices excluding winner
      const topChoices = sortedRestaurants
        .filter((r) => r.restaurant._id.toString() !== winner._id.toString())
        .slice(0, 2)
        .map((r) => ({
          _id: r.restaurant._id,
          name: r.restaurant.name,
          cuisine: r.restaurant.cuisine,
          location: r.restaurant.location,
          priceRange: r.restaurant.priceRange,
          voteCount: r.voteCount,
        }));

      session.winner = winnerWithStats;
      session.topChoices = topChoices;
      session.status = "completed";

      await session.save();
    } else {
      await session.save();
    }

    const updatedSession = await Session.findById(session._id)
      .populate("selectedRestaurants")
      .populate("winner")
      .populate("topChoices");

    res.json(updatedSession);
  } catch (err) {
    console.error("Confirm votes error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Add this route for cleanup
router.delete("/cleanup", async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await Session.deleteMany({
      status: "active",
      createdAt: { $lt: oneHourAgo },
      "participants.0": { $exists: false }, // No participants joined
    });

    res.json({
      message: `Cleaned up ${result.deletedCount} abandoned sessions`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add revote endpoint
router.post("/:code/revote", async (req, res) => {
  try {
    const { creatorName } = req.body;
    const session = await Session.findOne({ code: req.params.code }).populate(
      "selectedRestaurants"
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.creatorName !== creatorName) {
      return res
        .status(403)
        .json({ message: "Only the session creator can restart voting" });
    }

    // Reset all participants' votes and confirmation status
    session.participants.forEach((participant) => {
      participant.votes = session.selectedRestaurants.map((restaurant) => ({
        restaurant: restaurant._id,
        vote: 0,
      }));
      participant.hasConfirmed = false;
    });

    session.status = "voting";
    session.winner = undefined;
    session.topChoices = [];

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate("selectedRestaurants")
      .populate("winner")
      .populate("topChoices");

    res.json(populatedSession);
  } catch (err) {
    console.error("Revote error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Add kick endpoint
router.post("/:code/kick", async (req, res) => {
  try {
    const { creatorName, participantName } = req.body;
    const session = await Session.findOne({ code: req.params.code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if the requester is the creator
    if (session.creatorName !== creatorName) {
      return res
        .status(403)
        .json({ message: "Only the creator can kick participants" });
    }

    // Remove the participant
    session.participants = session.participants.filter(
      (p) => p.name !== participantName
    );

    await session.save();
    res.json(session);
  } catch (err) {
    console.error("Kick participant error:", err);
    res.status(400).json({ message: err.message });
  }
});

export default router;
