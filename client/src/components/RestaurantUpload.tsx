import { useState } from "react";
import { api } from "../services/api";

interface Restaurant {
  name: string;
  cuisine: string;
  link?: string;
  location: string;
}

const RestaurantUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const fileContent = await file.text();
      const restaurants = JSON.parse(fileContent) as Restaurant[];

      console.log("Parsed JSON data:", restaurants);

      // Split data into chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < restaurants.length; i += chunkSize) {
        const chunk = restaurants.slice(i, i + chunkSize);
        console.log(
          `Uploading chunk ${i / chunkSize + 1} of ${Math.ceil(
            restaurants.length / chunkSize
          )}`
        );

        await api.uploadRestaurants(chunk);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload restaurants"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload Restaurants</h2>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          JSON File
        </label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && (
        <p className="text-green-500 mb-4">
          Restaurants uploaded successfully!
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default RestaurantUpload;
