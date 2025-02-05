import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    minlength: 6,
    maxlength: 6,
  },
  status: {
    type: String,
    enum: ["voting", "completed"],
    default: "voting",
  },
  creatorName: {
    type: String,
    required: false, // Optional initially, set when first person joins
  },
  filters: {
    locations: [String],
    includeCuisines: [String],
    excludeCuisines: [String],
  },
  participants: [
    {
      name: {
        type: String,
        required: true,
      },
      votes: [
        {
          restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
          },
          vote: {
            type: Number,
            enum: [-1, 0, 1], // -1 for dislike, 0 for no vote, 1 for like
            default: 0,
          },
        },
      ],
      hasConfirmed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  selectedRestaurants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
  ],
  topChoices: [
    {
      type: mongoose.Schema.Types.Mixed,
      ref: "Restaurant",
    },
  ],
  winner: {
    type: mongoose.Schema.Types.Mixed,
    ref: "Restaurant",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // automatically delete after 24 hours
  },
});

// Add helper method to generate code
sessionSchema.statics.generateCode = function () {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Add helper method to calculate results
sessionSchema.methods.calculateResults = function () {
  const scores = new Map();

  this.participants.forEach((participant) => {
    participant.votes.forEach((vote) => {
      const currentScore = scores.get(vote.restaurant.toString()) || 0;
      scores.set(vote.restaurant.toString(), currentScore + vote.vote);
    });
  });

  const sortedRestaurants = [...scores.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id);

  this.topChoices = sortedRestaurants.slice(0, 3);
  this.winner = sortedRestaurants[0];

  return this;
};

// Add helper method to check if all participants have confirmed
sessionSchema.methods.areAllConfirmed = function () {
  return this.participants.every((p) => p.hasConfirmed);
};

const Session = mongoose.model("Session", sessionSchema);
export default Session;
