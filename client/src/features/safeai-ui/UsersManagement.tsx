import { useState, useEffect } from "react";
import { API_ENDPOINTS, apiCall } from "../../config/api";

interface User {
  _id: string;
  email: string;
  name?: string;
  profileId?: string;
  mode: "BYOK" | "MANAGED";
  isActive: boolean;
  proxyKeyPrefix: string;
  litellmPrefix: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiCall<User[]>(API_ENDPOINTS.users);
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="loading-state">טוען משתמשים...</div>;
  }

  return (
    <div>
      <div className="management-header">
        <h2>ניהול משתמשים</h2>
        <div className="badge badge-info">סה"כ משתמשים: {users.length}</div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="חפש משתמש..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>לא נמצאו משתמשים</p>
        </div>
      ) : (
        <div className="items-grid">
          {filteredUsers.map((user) => (
            <div key={user._id} className="item-card">
              <div className="item-card-header">
                <h3 className="item-card-title">{user.name || user.email}</h3>
                <div className="item-card-actions">
                  <span
                    className={
                      user.isActive ? "badge badge-success" : "badge badge-danger"
                    }
                  >
                    {user.isActive ? "פעיל" : "לא פעיל"}
                  </span>
                </div>
              </div>
              <div className="item-card-body">
                <div className="item-detail">
                  <span className="item-detail-label">אימייל:</span>
                  <span className="item-detail-value">{user.email}</span>
                </div>
                {user.name && (
                  <div className="item-detail">
                    <span className="item-detail-label">שם:</span>
                    <span className="item-detail-value">{user.name}</span>
                  </div>
                )}
                <div className="item-detail">
                  <span className="item-detail-label">מצב:</span>
                  <span className="item-detail-value">
                    <span className={user.mode === "BYOK" ? "badge badge-info" : "badge badge-warning"}>
                      {user.mode}
                    </span>
                  </span>
                </div>
                <div className="item-detail">
                  <span className="item-detail-label">Proxy Key Prefix:</span>
                  <span className="item-detail-value">{user.proxyKeyPrefix}</span>
                </div>
                <div className="item-detail">
                  <span className="item-detail-label">LiteLLM Prefix:</span>
                  <span className="item-detail-value">{user.litellmPrefix}</span>
                </div>
                {user.createdAt && (
                  <div className="item-detail">
                    <span className="item-detail-label">נוצר בתאריך:</span>
                    <span className="item-detail-value">
                      {new Date(user.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
