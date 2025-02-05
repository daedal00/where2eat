import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinSession = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5050/api/sessions/${code}`
      );
      if (!response.ok) {
        throw new Error("Session not found");
      }
      navigate(`/session/${code}`);
    } catch (err) {
      setError("Invalid session code");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Join Existing Session
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Session Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter session code"
            className="w-full p-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md uppercase text-center text-lg tracking-wider"
            maxLength={6}
            required
            autoComplete="off"
            inputMode="text"
            pattern="[A-Za-z0-9]*"
          />
        </div>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          Join Session
        </button>
      </form>
    </div>
  );
};

export default JoinSession;
