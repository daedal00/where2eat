import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface CreateSessionFilters {
  locations: string[];
  includeCuisines: string[];
  excludeCuisines: string[];
}

const CreateSession = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<string[]>([]);
  const [allCuisines, setAllCuisines] = useState<string[]>([]);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<
    Map<string, "include" | "exclude">
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [citiesResponse, cuisinesResponse] = await Promise.all([
          fetch("http://localhost:5050/api/restaurants/cities"),
          fetch("http://localhost:5050/api/restaurants/cuisines"),
        ]);

        if (!citiesResponse.ok || !cuisinesResponse.ok) {
          throw new Error("Failed to fetch initial data");
        }

        const citiesData = await citiesResponse.json();
        const cuisinesData = await cuisinesResponse.json();

        setCities(citiesData);
        setAllCuisines(cuisinesData);
        setAvailableCuisines(cuisinesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchAvailableCuisines = async () => {
      if (selectedLocations.length === 0) {
        setAvailableCuisines(allCuisines);
        return;
      }

      try {
        console.log("Fetching cuisines for locations:", selectedLocations);
        const response = await fetch(
          `http://localhost:5050/api/restaurants/cuisines-by-location?locations=${selectedLocations.join(
            ","
          )}`
        );

        if (!response.ok) throw new Error("Failed to fetch cuisines");

        const data = await response.json();
        console.log("Received cuisine data:", data);
        setAvailableCuisines(data.cuisines);

        setCuisinePreferences((prev) => {
          const newPreferences = new Map(prev);
          for (const [cuisine] of prev) {
            if (!data.cuisines.includes(cuisine)) {
              newPreferences.delete(cuisine);
            }
          }
          return newPreferences;
        });
      } catch (err) {
        console.error("Error fetching available cuisines:", err);
      }
    };

    fetchAvailableCuisines();
  }, [selectedLocations, allCuisines]);

  const handleLocationToggle = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((loc) => loc !== location)
        : [...prev, location]
    );
  };

  const handleCuisineToggle = (cuisine: string) => {
    if (!availableCuisines.includes(cuisine)) return;

    setCuisinePreferences((prev) => {
      const newPreferences = new Map(prev);
      const currentPref = prev.get(cuisine);

      if (!currentPref) {
        newPreferences.set(cuisine, "include");
      } else if (currentPref === "include") {
        newPreferences.set(cuisine, "exclude");
      } else {
        newPreferences.delete(cuisine);
      }

      return newPreferences;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedLocations.length === 0) {
      setError("Please select at least one location");
      return;
    }

    try {
      const includeCuisines = [...cuisinePreferences.entries()]
        .filter(([_, pref]) => pref === "include")
        .map(([cuisine]) => cuisine);

      const excludeCuisines = [...cuisinePreferences.entries()]
        .filter(([_, pref]) => pref === "exclude")
        .map(([cuisine]) => cuisine);

      const filters: CreateSessionFilters = {
        locations: selectedLocations,
        includeCuisines,
        excludeCuisines,
      };

      const response = await fetch("http://localhost:5050/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create session");
      }

      const data = await response.json();
      navigate(`/session/${data.code}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create session. Please try again.");
      }
    }
  };

  if (loading)
    return (
      <div className="text-center p-4 sm:p-8 text-gray-800 dark:text-gray-200">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-4 sm:p-8 text-red-600 dark:text-red-400">
        {error}
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-800 dark:text-white">
        Create New Session
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Locations
          </label>
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Select one or more locations 📍</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border dark:border-gray-700 rounded">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleLocationToggle(city)}
                className={`
                  p-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    selectedLocations.includes(city)
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-2 border-blue-500"
                      : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent dark:text-gray-200"
                  }
                `}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Cuisines
          </label>
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Click once to include only selected cuisines 🟢</p>
            <p>Click twice to exclude selected cuisines 🔴</p>
            <p>Click again to reset (include all) ⚪</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border dark:border-gray-700 rounded">
            {allCuisines.map((cuisine) => {
              const isAvailable = availableCuisines.includes(cuisine);

              return (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => handleCuisineToggle(cuisine)}
                  disabled={!isAvailable && selectedLocations.length > 0}
                  className={`
                    p-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      !isAvailable && selectedLocations.length > 0
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                        : !cuisinePreferences.has(cuisine)
                        ? "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                        : cuisinePreferences.get(cuisine) === "include"
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-2 border-green-500"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-2 border-red-500"
                    }
                  `}
                >
                  <span className="block text-center">{cuisine}</span>
                  {!isAvailable && selectedLocations.length > 0 && (
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      Not available in selected location(s)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
        >
          Create Session
        </button>
      </form>
    </div>
  );
};

export default CreateSession;
