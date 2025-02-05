interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  location: string;
  voteCount?: number;
  tieBreaker?: boolean;
}

interface SessionData {
  code: string;
  status: "voting" | "completed";
  creatorName: string;
  selectedRestaurants: Restaurant[];
  participants: Participant[];
  winner?: Restaurant;
  topChoices?: Restaurant[];
}
