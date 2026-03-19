import { useState, useEffect } from "react";
import { API_ENDPOINTS, apiCall } from "../../config/api";

interface Profile {
  _id: string;
  name: string;
  allowedCategories?: string[];
  blockedCategories?: string[];
  thresholdAllowed: number;
  thresholdBlocked: number;
  similarityMargin: number;
  createdBy: string;
  creatorEmail: string;
  contentPrompts?: string[];
  behaviorPrompts?: string[];
  knowledgePrompts?: string[];
  createdAt?: string;
}

export default function ProfilesManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: "",
    allowedCategories: [],
    blockedCategories: [],
    thresholdAllowed: 0.25,
    thresholdBlocked: 0.25,
    similarityMargin: 0.05,
    createdBy: "Admin",
    creatorEmail: "admin@safeai.com",
    contentPrompts: [],
    behaviorPrompts: [],
    knowledgePrompts: [],
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await apiCall<Profile[]>(API_ENDPOINTS.profiles);
      setProfiles(data);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall(API_ENDPOINTS.profiles, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      await fetchProfiles();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("שגיאה ביצירת פרופיל");
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק פרופיל זה?")) return;

    try {
      await apiCall(`${API_ENDPOINTS.profiles}/${id}`, {
        method: "DELETE",
      });

      await fetchProfiles();
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("שגיאה במחיקת פרופיל");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      allowedCategories: [],
      blockedCategories: [],
      thresholdAllowed: 0.25,
      thresholdBlocked: 0.25,
      similarityMargin: 0.05,
      createdBy: "Admin",
      creatorEmail: "admin@safeai.com",
      contentPrompts: [],
      behaviorPrompts: [],
      knowledgePrompts: [],
    });
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-state">טוען פרופילים...</div>;
  }

  return (
    <div>
      <div className="management-header">
        <h2>ניהול פרופילים</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + פרופיל חדש
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="חפש פרופיל..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="empty-state">
          <p>לא נמצאו פרופילים</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            צור פרופיל ראשון
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {filteredProfiles.map((profile) => (
            <div key={profile._id} className="item-card">
              <div className="item-card-header">
                <h3 className="item-card-title">{profile.name}</h3>
                <div className="item-card-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteProfile(profile._id)}
                  >
                    מחק
                  </button>
                </div>
              </div>
              <div className="item-card-body">
                <div className="item-detail">
                  <span className="item-detail-label">נוצר על ידי:</span>
                  <span className="item-detail-value">{profile.createdBy}</span>
                </div>
                <div className="item-detail">
                  <span className="item-detail-label">אימייל:</span>
                  <span className="item-detail-value">{profile.creatorEmail}</span>
                </div>
                <div className="item-detail">
                  <span className="item-detail-label">סף מותר:</span>
                  <span className="item-detail-value">{profile.thresholdAllowed}</span>
                </div>
                <div className="item-detail">
                  <span className="item-detail-label">סף חסום:</span>
                  <span className="item-detail-value">{profile.thresholdBlocked}</span>
                </div>
                {profile.allowedCategories && profile.allowedCategories.length > 0 && (
                  <div className="item-detail">
                    <span className="item-detail-label">קטגוריות מותרות:</span>
                    <span className="item-detail-value">
                      {profile.allowedCategories.length}
                    </span>
                  </div>
                )}
                {profile.blockedCategories && profile.blockedCategories.length > 0 && (
                  <div className="item-detail">
                    <span className="item-detail-label">קטגוריות חסומות:</span>
                    <span className="item-detail-value">
                      {profile.blockedCategories.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>פרופיל חדש</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProfile}>
              <div className="form-group">
                <label>שם הפרופיל</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="למשל: פרופיל בסיסי"
                />
              </div>

              <div className="form-group">
                <label>נוצר על ידי</label>
                <input
                  type="text"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>אימייל יוצר</label>
                <input
                  type="email"
                  value={formData.creatorEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, creatorEmail: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>סף מותר (Threshold Allowed)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.thresholdAllowed}
                  onChange={(e) =>
                    setFormData({ ...formData, thresholdAllowed: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>סף חסום (Threshold Blocked)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.thresholdBlocked}
                  onChange={(e) =>
                    setFormData({ ...formData, thresholdBlocked: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>מרווח דמיון (Similarity Margin)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.similarityMargin}
                  onChange={(e) =>
                    setFormData({ ...formData, similarityMargin: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  צור פרופיל
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
