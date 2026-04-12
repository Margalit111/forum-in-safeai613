import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api";
import ApiKeyDisplay from "./ApiKeyDisplay";

interface Profile {
  _id: string;
  name: string;
  createdBy: string;
  creatorEmail: string;
}

export default function RegisterFormSuccess() {
  const [showAPIKey, setShowAPIKey] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const navigate = useNavigate();

  // Fetch profiles on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const response = await fetch(API_ENDPOINTS.profiles, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profiles");
        }

        const data = await response.json();
        setProfiles(data);
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setError("שגיאה בטעינת הפרופילים");
      }
    };

    fetchProfiles();
  }, []);

  const handleSaveProfile = async () => {
    if (!selectedProfile) {
      setError("אנא בחר פרופיל");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await fetch(`${API_ENDPOINTS.users}/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          profileId: selectedProfile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileSaved(true);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("שגיאה בשמירת הפרופיל");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-form-container">
      <div className="auth-form-wrapper" style={{ maxWidth: "700px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
             המשתמש שלך נוצר בהצלחה!
          </h1>
        </div>

        <div
          className="api-key-box"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "30px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              color: "white",
              marginBottom: "15px",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            נשאר עוד צעד אחד ואפשר להתחיל.
            <br />
            עליך לבחור פרופיל מהרשימה:
          </p>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              border: "3px solid #fff",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                marginBottom: "15px",
                backgroundColor: "#f8f9fa",
              }}
              disabled={profileSaved}
            >
              <option value="">-- בחר פרופיל --</option>
              {profiles.map((profile) => (
                <option key={profile._id} value={profile._id}>
                  {profile.name}
                </option>
              ))}
            </select>

            {error && (
              <div style={{ color: "#dc3545", marginBottom: "10px", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={!selectedProfile || loading || profileSaved}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: profileSaved ? "#28a745" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: !selectedProfile || loading || profileSaved ? "not-allowed" : "pointer",
                opacity: !selectedProfile || loading ? 0.6 : 1,
              }}
            >
              {loading ? "שומר..." : profileSaved ? "✓ הפרופיל נשמר!" : "שמור פרופיל"}
            </button>
          </div>
        </div>

        {profileSaved && (
          <>
            <div
              className="alert alert-warning"
              style={{
                background: "#fff3cd",
                border: "2px solid #ffc107",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "25px",
              }}
            >
              <h3
                style={{ color: "#856404", marginBottom: "10px", fontSize: "18px" }}
              >
                ⚠️ מתכנת / משתמש בתוכנות צד שלישי?
              </h3>
              <button
                onClick={() => {
                  setShowAPIKey(true);
                }}
                className="btn btn-secondary"
                style={{ padding: "10px 20px" }}
              >
                שמור את המפתח!
              </button>
            </div>

            {showAPIKey && <ApiKeyDisplay />}
            
            <button
              onClick={() => {
                navigate("/safeai-ui");
              }}
              className="btn btn-primary btn-full"
              style={{ fontSize: "16px", padding: "15px" }}
            >
              המשך לדשבורד &gt;&gt;&gt;
            </button>
            <br />
            <button
              onClick={() => {
                window.location.href = "https://ai613.autodidact.co.il/";
              }}
              className="btn btn-primary btn-full"
              style={{ fontSize: "16px", padding: "15px", marginTop: "2rem" }}
            >
              עבור לצ'אט AI613
            </button>
          </>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "12px",
            color: "#999",
          }}
        >
          לאחר המעבר לדשבורד, לא תוכל לראות את המפתח שוב
        </p>
      </div>
    </div>
  );
}
