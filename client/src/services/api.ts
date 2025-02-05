const API_URL = import.meta.env.VITE_API_URL;

export interface CreateSessionFilters {
  locations: string[];
  includeCuisines: string[];
  excludeCuisines: string[];
}

export const api = {
  // Session endpoints
  getSession: async (code: string) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}`);
    if (!response.ok) throw new Error("Session not found");
    return response.json();
  },

  createSession: async (filters: CreateSessionFilters) => {
    const response = await fetch(`${API_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create session");
    }
    return response.json();
  },

  joinSession: async (code: string, name: string) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to join session");
    }
    return response.json();
  },

  submitVotes: async (code: string, name: string, votes: any[]) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, votes }),
    });
    if (!response.ok) throw new Error("Failed to submit votes");
    return response.json();
  },

  confirmVotes: async (code: string, name: string) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error("Failed to confirm votes");
    return response.json();
  },

  restartVoting: async (code: string, creatorName: string) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/revote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorName }),
    });
    if (!response.ok) throw new Error("Failed to restart voting");
    return response.json();
  },

  kickParticipant: async (
    code: string,
    creatorName: string,
    participantName: string
  ) => {
    const response = await fetch(`${API_URL}/api/sessions/${code}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorName, participantName }),
    });
    if (!response.ok) throw new Error("Failed to kick participant");
    return response.json();
  },

  // Restaurant data fetching
  getCities: async () => {
    const response = await fetch(`${API_URL}/api/restaurants/cities`);
    if (!response.ok) throw new Error("Failed to fetch cities");
    return response.json();
  },

  getCuisines: async () => {
    const response = await fetch(`${API_URL}/api/restaurants/cuisines`);
    if (!response.ok) throw new Error("Failed to fetch cuisines");
    return response.json();
  },

  getCuisinesByLocation: async (locations: string[]) => {
    const response = await fetch(
      `${API_URL}/api/restaurants/cuisines-by-location?locations=${locations.join(
        ","
      )}`
    );
    if (!response.ok) throw new Error("Failed to fetch cuisines by location");
    return response.json();
  },

  // Restaurant upload methods
  uploadRestaurants: async (chunk: any[]) => {
    const response = await fetch(`${API_URL}/api/restaurants/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload restaurants");
    }
    return response.json();
  },
};
