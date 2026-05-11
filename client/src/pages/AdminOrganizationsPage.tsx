import { useEffect, useState } from "react";
import axios from "axios";

interface Organization {
  _id: string;
  name: string;
  description: string;
  ownerId: {
    _id: string;
    email: string;
    name?: string;
  };
  isActive: boolean;
  createdAt: string;
  settings: {
    maxUsers: number;
    allowedDomains: string[];
  };
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: "",
    description: "",
    ownerId: "",
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/organizations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOrganizations(response.data);
    } catch (err: unknown) {
      console.error("Error fetching organizations:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to fetch organizations");
      } else {
        setError("Failed to fetch organizations");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Not authenticated");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/organizations`,
        newOrg,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Organization created successfully!");
      setShowCreateForm(false);
      setNewOrg({ name: "", description: "", ownerId: "" });
      fetchOrganizations();
    } catch (err: unknown) {
      console.error("Error creating organization:", err);
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Failed to create organization");
      } else {
        alert("Failed to create organization");
      }
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this organization?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Not authenticated");
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/organizations/${orgId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Organization deleted successfully!");
      fetchOrganizations();
    } catch (err: unknown) {
      console.error("Error deleting organization:", err);
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Failed to delete organization");
      } else {
        alert("Failed to delete organization");
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Organizations Management</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Organizations Management</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Organizations Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {showCreateForm ? "Cancel" : "Create Organization"}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateOrganization}
          style={{
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <h3>Create New Organization</h3>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Organization Name:</label>
            <input
              type="text"
              value={newOrg.name}
              onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Description:</label>
            <textarea
              value={newOrg.description}
              onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              rows={3}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Owner User ID:</label>
            <input
              type="text"
              value={newOrg.ownerId}
              onChange={(e) => setNewOrg({ ...newOrg, ownerId: e.target.value })}
              required
              placeholder="Enter user ID"
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Create
          </button>
        </form>
      )}

      <h3>All Organizations ({organizations.length})</h3>

      {organizations.length === 0 ? (
        <p>No organizations found.</p>
      ) : (
        <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
          {organizations.map((org) => (
            <div
              key={org._id}
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <h3>{org.name}</h3>
                  <p style={{ color: "#666" }}>{org.description}</p>
                  <div style={{ marginTop: "10px" }}>
                    <p><strong>Owner:</strong> {org.ownerId.email} {org.ownerId.name ? `(${org.ownerId.name})` : ""}</p>
                    <p><strong>Max Users:</strong> {org.settings.maxUsers}</p>
                    <p><strong>Status:</strong> 
                      <span style={{
                        marginLeft: "8px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: org.isActive ? "#4CAF50" : "#f44336",
                        color: "white",
                        fontSize: "12px"
                      }}>
                        {org.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {new Date(org.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteOrganization(org._id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
