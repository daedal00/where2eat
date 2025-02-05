import { useState, useEffect } from "react";

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  location: string;
  link?: string;
}

const AdminDashboard = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Restaurant>>({});

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch("http://localhost:5050/api/restaurants");
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();
      setRestaurants(data);
    } catch (err) {
      setError("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (editingId === id) {
      try {
        const response = await fetch(
          `http://localhost:5050/api/restaurants/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm),
          }
        );

        if (!response.ok) throw new Error("Failed to update restaurant");
        await fetchRestaurants();
        setEditingId(null);
        setEditForm({});
      } catch (err) {
        setError("Failed to update restaurant");
      }
    } else {
      const restaurant = restaurants.find((r) => r._id === id);
      setEditForm(restaurant || {});
      setEditingId(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;

    try {
      const response = await fetch(
        `http://localhost:5050/api/restaurants/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete restaurant");
      await fetchRestaurants();
    } catch (err) {
      setError("Failed to delete restaurant");
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Restaurant Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Cuisine</th>
              <th className="px-6 py-3 text-left">Location</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant._id} className="border-t">
                <td className="px-6 py-4">
                  {editingId === restaurant._id ? (
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    />
                  ) : (
                    restaurant.name
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === restaurant._id ? (
                    <input
                      type="text"
                      value={editForm.cuisine || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, cuisine: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    />
                  ) : (
                    restaurant.cuisine
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === restaurant._id ? (
                    <input
                      type="text"
                      value={editForm.location || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    />
                  ) : (
                    restaurant.location
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(restaurant._id)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    {editingId === restaurant._id ? "Save" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDelete(restaurant._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
