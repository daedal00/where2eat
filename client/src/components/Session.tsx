import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  location: string;
  priceRange: string;
  voteCount?: number;
  tieBreaker?: boolean;
}

interface Vote {
  restaurant: string;
  vote: number;
}

interface Participant {
  name: string;
  votes: Vote[];
  hasConfirmed: boolean;
}

interface SessionData {
  code: string;
  status: "voting" | "completed";
  participants: Participant[];
  selectedRestaurants: Restaurant[];
  winner?: Restaurant;
  creatorName: string;
  topChoices?: Restaurant[];
}

const Session = () => {
  const { code } = useParams<{ code: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [name, setName] = useState<string>("");
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const pollSession = async () => {
      try {
        const data = await api.getSession(code!);
        setSession(data);
        setIsCreator(data.creatorName === name);

        const participant = data.participants.find((p) => p.name === name);
        if (participant) {
          setVotes(participant.votes);
          setJoining(false);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load session");
        setLoading(false);
      }
    };

    const interval = setInterval(pollSession, 2000);
    return () => clearInterval(interval);
  }, [code, name]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJoin = async (name: string) => {
    try {
      const data = await api.joinSession(code!, name);
      setSession(data);
      setName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join session");
    }
  };

  const handleVote = async (restaurantId: string) => {
    try {
      const currentVote =
        votes.find((v) => v.restaurant === restaurantId)?.vote || 0;
      const finalVote = currentVote === 1 ? 0 : 1;

      const newVotes =
        votes.length > 0
          ? votes.map((v) =>
              v.restaurant === restaurantId ? { ...v, vote: finalVote } : v
            )
          : session!.selectedRestaurants.map((r) => ({
              restaurant: r._id,
              vote: r._id === restaurantId ? finalVote : 0,
            }));

      setVotes(newVotes);
      const response = await api.submitVotes(code!, name, newVotes);
      setSession(response);
    } catch (err) {
      setError("Failed to submit vote");
    }
  };

  const handleConfirm = async () => {
    try {
      const data = await api.confirmVotes(code!, name);
      setSession(data);
    } catch (err) {
      setError("Failed to confirm votes");
    }
  };

  const handleKickParticipant = async (participantName: string) => {
    try {
      const response = await api.kickParticipant(code!, name, participantName);
      setSession(response);
    } catch (err) {
      setError("Failed to kick participant");
    }
  };

  const handleRevote = async () => {
    try {
      if (!session) return;
      const data = await api.restartVoting(code!, session.creatorName);
      setSession(data);
    } catch (err) {
      setError("Failed to restart voting");
    }
  };

  // Get liked restaurants
  const likedRestaurants =
    session?.selectedRestaurants.filter(
      (restaurant) =>
        votes.find((v) => v.restaurant === restaurant._id)?.vote === 1
    ) || [];

  if (loading)
    return (
      <div className="text-center p-8 text-gray-800 dark:text-gray-200">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-8 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  if (!session) return null;

  if (joining) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
            Join Session
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin(name);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      {/* Main content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {session.status === "voting" ? "Vote for Restaurants" : "Results"}
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Session Code: <span className="font-mono">{session.code}</span>
          </div>
        </div>

        {session.status === "voting" ? (
          <>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {session.selectedRestaurants.map((restaurant) => {
                const vote =
                  votes.find((v) => v.restaurant === restaurant._id)?.vote || 0;
                return (
                  <div
                    key={restaurant._id}
                    className="p-4 border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow dark:bg-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold dark:text-white">
                          {restaurant.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {restaurant.cuisine} • {restaurant.priceRange}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {restaurant.location}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVote(restaurant._id)}
                          className={`p-2 rounded-full transition-colors ${
                            vote === 1
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 dark:bg-gray-600 hover:bg-green-100 dark:hover:bg-green-900"
                          }`}
                        >
                          👍
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleConfirm}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Confirm Votes
            </button>
          </>
        ) : (
          session.winner && (
            <div className="text-center">
              <div className="mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                Winner!
                {session.winner.tieBreaker && (
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400 block mt-1">
                    (Won by tie-breaker)
                  </span>
                )}
              </h3>
              <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-900 dark:border-green-700">
                <h4 className="text-lg font-semibold text-green-800 dark:text-green-100">
                  {session.winner.name}
                </h4>
                <p className="text-green-600 dark:text-green-200">
                  {session.winner.cuisine} • {session.winner.priceRange}
                </p>
                <p className="text-green-600 dark:text-green-200">
                  {session.winner.location}
                </p>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  {session.winner.voteCount} votes
                </p>
              </div>

              {session.topChoices && session.topChoices.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3 dark:text-white">
                    Other Top Choices
                  </h4>
                  <div className="space-y-3">
                    {session.topChoices.map((choice, index) => (
                      <div
                        key={`topChoice-${choice._id}-${index}`}
                        className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <h5 className="font-medium text-gray-800 dark:text-gray-200">
                          {choice.name}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {choice.cuisine} • {choice.priceRange}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {choice.location}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {choice.voteCount}{" "}
                          {choice.voteCount === 1 ? "vote" : "votes"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Floating Liked Restaurants Sidebar */}
      {session.status === "voting" && likedRestaurants.length > 0 && (
        <div className="fixed md:top-6 bottom-0 md:right-6 right-0 left-0 md:left-auto w-full md:w-64 bg-white dark:bg-gray-800 rounded-t-lg md:rounded-lg shadow-lg p-4 border border-green-200 dark:border-green-700 md:max-h-[80vh] max-h-[40vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3 text-green-800 dark:text-green-200 flex items-center">
            <span className="mr-2">👍</span> Liked Places
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              ({likedRestaurants.length})
            </span>
          </h3>
          <div className="overflow-y-auto">
            {likedRestaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="p-2 mb-2 bg-green-50 dark:bg-green-900 rounded text-sm"
              >
                <div className="font-medium dark:text-white">
                  {restaurant.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {restaurant.cuisine} • {restaurant.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">
            Participants
          </h3>
          {isCreator && session.status === "voting" && (
            <button
              onClick={handleRevote}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
            >
              Restart Voting
            </button>
          )}
        </div>
        <div
          className={`space-y-3 ${
            session.status === "voting" && likedRestaurants.length > 0
              ? "mb-40 md:mb-0"
              : ""
          }`}
        >
          {session.participants.map((participant) => (
            <div
              key={`participant-${participant.name}`}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`dark:text-white ${
                    participant.name === session.creatorName
                      ? "font-semibold"
                      : ""
                  }`}
                >
                  {participant.name}
                  {participant.name === session.creatorName && (
                    <span className="ml-2" title="Session Creator">
                      👑
                    </span>
                  )}
                </span>
                <div className="flex space-x-2">
                  {participant.hasConfirmed ? (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      Voted ✓
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                      Voting...
                    </span>
                  )}
                </div>
              </div>
              {isCreator &&
                participant.name !== name &&
                participant.name !== session.creatorName && (
                  <button
                    onClick={() => handleKickParticipant(participant.name)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 md:bottom-6 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group"
          aria-label="Back to top"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-y-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Session;
