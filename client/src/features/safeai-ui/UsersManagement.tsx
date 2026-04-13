import { useState, useEffect } from "react";
import { API_ENDPOINTS, apiCall } from "../../config/api";
import ProviderKeysManagement from "./ProviderKeysManagement";

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

interface Profile {
  _id: string;
  name: string;
}

interface CreateUserResponse {
  success: boolean;
  user: User;
  proxyApiKey: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterMode, setFilterMode] = useState<"all" | "BYOK" | "MANAGED">("all");
  const [filterProfile, setFilterProfile] = useState<string>("all");
  const [managingKeysUser, setManagingKeysUser] = useState<User | null>(null);
  
  const [createFormData, setCreateFormData] = useState({
    email: "",
    name: "",
    profileId: "",
    mode: "MANAGED" as "BYOK" | "MANAGED",
    isActive: true,
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    profileId: "",
    mode: "MANAGED" as "BYOK" | "MANAGED",
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchProfiles();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiCall<User[]>(API_ENDPOINTS.users);
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("שגיאה בטעינת משתמשים");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const data = await apiCall<Profile[]>(API_ENDPOINTS.profiles);
      setProfiles(data);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await apiCall<CreateUserResponse>(API_ENDPOINTS.users, {
        method: "POST",
        body: JSON.stringify({
          email: createFormData.email,
          name: createFormData.name || undefined,
          profileId: createFormData.profileId || undefined,
          mode: createFormData.mode,
          isActive: createFormData.isActive,
        }),
      });

      setGeneratedApiKey(response.proxyApiKey);
      setShowCreateModal(false);
      setShowApiKeyModal(true);
      resetCreateForm();
      await fetchUsers();
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error ? error.message : "שגיאה לא ידועה";
      alert(`שגיאה ביצירת משתמש: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);

    try {
      await apiCall(`${API_ENDPOINTS.users}/${editingUser._id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editFormData.name || undefined,
          profileId: editFormData.profileId || undefined,
          mode: editFormData.mode,
          isActive: editFormData.isActive,
        }),
      });

      setShowEditModal(false);
      setEditingUser(null);
      await fetchUsers();
      alert("המשתמש עודכן בהצלחה");
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      const errorMessage = error instanceof Error ? error.message : "שגיאה לא ידועה";
      alert(`שגיאה בעדכון משתמש: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${userEmail}?\n\nאזהרה: מחיקת משתמש תמחק גם את המפתחות שלו ב-LiteLLM`)) {
      return;
    }

    try {
      await apiCall(`${API_ENDPOINTS.users}/${userId}`, {
        method: "DELETE",
      });

      await fetchUsers();
      alert("המשתמש נמחק בהצלחה");
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      const errorMessage = error instanceof Error ? error.message : "שגיאה לא ידועה";
      alert(`שגיאה במחיקת משתמש: ${errorMessage}`);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      profileId: user.profileId || "",
      mode: user.mode,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      email: "",
      name: "",
      profileId: "",
      mode: "MANAGED",
      isActive: true,
    });
  };

  const getProfileName = (profileId?: string) => {
    if (!profileId) return "ללא פרופיל";
    const profile = profiles.find((p) => p._id === profileId);
    return profile ? profile.name : "פרופיל לא נמצא";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);
    
    const matchesMode =
      filterMode === "all" || user.mode === filterMode;
    
    const matchesProfile =
      filterProfile === "all" ||
      (filterProfile === "none" && !user.profileId) ||
      user.profileId === filterProfile;

    return matchesSearch && matchesStatus && matchesMode && matchesProfile;
  });

  if (loading) {
    return <div className="loading-state">טוען משתמשים...</div>;
  }

  return (
    <div>
      <div className="management-header">
        <h2>ניהול משתמשים</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="badge badge-info">סה"כ משתמשים: {users.length}</div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + משתמש חדש
          </button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="חפש משתמש..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div>
          <label style={{ marginLeft: "8px", fontWeight: "bold" }}>סטטוס:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
            style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            <option value="all">הכל</option>
            <option value="active">פעיל</option>
            <option value="inactive">לא פעיל</option>
          </select>
        </div>

        <div>
          <label style={{ marginLeft: "8px", fontWeight: "bold" }}>מצב:</label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as "all" | "BYOK" | "MANAGED")}
            style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            <option value="all">הכל</option>
            <option value="BYOK">BYOK</option>
            <option value="MANAGED">MANAGED</option>
          </select>
        </div>

        <div>
          <label style={{ marginLeft: "8px", fontWeight: "bold" }}>פרופיל:</label>
          <select
            value={filterProfile}
            onChange={(e) => setFilterProfile(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            <option value="all">הכל</option>
            <option value="none">ללא פרופיל</option>
            {profiles.map((profile) => (
              <option key={profile._id} value={profile._id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>לא נמצאו משתמשים</p>
          {users.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              צור משתמש ראשון
            </button>
          )}
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
                  <span className="item-detail-label">פרופיל:</span>
                  <span className="item-detail-value">
                    <span className={user.profileId ? "badge badge-info" : "badge badge-secondary"}>
                      {getProfileName(user.profileId)}
                    </span>
                  </span>
                </div>
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
              <div className="item-card-footer" style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(user)}
                  style={{ flex: 1, minWidth: "100px" }}
                >
                  ערוך
                </button>
                {user.mode === "BYOK" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setManagingKeysUser(user)}
                    style={{ flex: 1, minWidth: "100px" }}
                  >
                    🔑 API Keys
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteUser(user._id, user.email)}
                  style={{ flex: 1, minWidth: "100px" }}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>משתמש חדש</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>אימייל *</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label>שם (אופציונלי)</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="שם המשתמש"
                />
              </div>

              <div className="form-group">
                <label>פרופיל (אופציונלי)</label>
                <select
                  value={createFormData.profileId}
                  onChange={(e) => setCreateFormData({ ...createFormData, profileId: e.target.value })}
                >
                  <option value="">ללא פרופיל</option>
                  {profiles.map((profile) => (
                    <option key={profile._id} value={profile._id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>מצב *</label>
                <select
                  value={createFormData.mode}
                  onChange={(e) => setCreateFormData({ ...createFormData, mode: e.target.value as "BYOK" | "MANAGED" })}
                  required
                >
                  <option value="MANAGED">MANAGED</option>
                  <option value="BYOK">BYOK</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    checked={createFormData.isActive}
                    onChange={(e) => setCreateFormData({ ...createFormData, isActive: e.target.checked })}
                  />
                  משתמש פעיל
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                >
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "יוצר..." : "צור משתמש"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>עריכת משתמש: {editingUser.email}</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label>אימייל (לא ניתן לשינוי)</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label>שם</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="שם המשתמש"
                />
              </div>

              <div className="form-group">
                <label>פרופיל</label>
                <select
                  value={editFormData.profileId}
                  onChange={(e) => setEditFormData({ ...editFormData, profileId: e.target.value })}
                >
                  <option value="">ללא פרופיל</option>
                  {profiles.map((profile) => (
                    <option key={profile._id} value={profile._id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>מצב</label>
                <select
                  value={editFormData.mode}
                  onChange={(e) => setEditFormData({ ...editFormData, mode: e.target.value as "BYOK" | "MANAGED" })}
                >
                  <option value="MANAGED">MANAGED</option>
                  <option value="BYOK">BYOK</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  />
                  משתמש פעיל
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "שומר..." : "שמור שינויים"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider Keys Management Modal */}
      {managingKeysUser && (
        <ProviderKeysManagement
          userId={managingKeysUser._id}
          userEmail={managingKeysUser.email}
          onClose={() => setManagingKeysUser(null)}
        />
      )}

      {/* API Key Display Modal */}
      {showApiKeyModal && (
        <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 API Key נוצר בהצלחה!</h2>
              <button className="modal-close" onClick={() => setShowApiKeyModal(false)}>
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ 
                backgroundColor: "#fff3cd", 
                border: "1px solid #ffc107", 
                borderRadius: "4px", 
                padding: "15px", 
                marginBottom: "20px" 
              }}>
                <strong>⚠️ אזהרה חשובה:</strong>
                <p style={{ margin: "10px 0 0 0" }}>
                  זוהי ההזדמנות היחידה שלך לשמור את המפתח הזה. לא תוכל לראות אותו שוב!
                </p>
              </div>

              <div className="form-group">
                <label>API Key:</label>
                <textarea
                  value={generatedApiKey}
                  readOnly
                  rows={3}
                  style={{ 
                    width: "100%", 
                    fontFamily: "monospace", 
                    fontSize: "14px",
                    backgroundColor: "#f8f9fa",
                    padding: "10px"
                  }}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={() => {
                  navigator.clipboard.writeText(generatedApiKey);
                  alert("המפתח הועתק ללוח!");
                }}
              >
                📋 העתק ללוח
              </button>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowApiKeyModal(false);
                  setGeneratedApiKey("");
                }}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
