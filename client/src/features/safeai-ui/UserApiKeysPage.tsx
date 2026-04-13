import { useState, useEffect } from "react";
import ProviderKeysManagement from "./ProviderKeysManagement";
import { API_ENDPOINTS, apiCall } from "../../config/api";

interface ProviderKey {
  _id: string;
  userId?: string;
  provider: "openai" | "anthropic" | "google" | "groq";
  keyPrefix: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: string;
}

export default function UserApiKeysPage() {
  const [user, setUser] = useState<{ _id: string; email: string; name: string; role: string; mode: string } | null>(null);
  const [keys, setKeys] = useState<ProviderKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchKeys(parsedUser._id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchKeys = async (userId: string) => {
    try {
      const allKeys = await apiCall<ProviderKey[]>(API_ENDPOINTS.providerKeys);
      const userKeys = allKeys.filter(key => key.userId === userId);
      setKeys(userKeys);
    } catch (error) {
      console.error("Failed to fetch provider keys:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">טוען...</div>;
  }

  if (!user) {
    return (
      <div className="empty-state">
        <h2>לא מחובר</h2>
        <p>אנא התחבר כדי לנהל מפתחות API</p>
      </div>
    );
  }

  return (
    <div>
      <div className="management-header">
        <div>
          <h2>🔑 ניהול מפתחות API</h2>
          <p style={{ margin: "10px 0 0 0", color: "#666" }}>
            שלום {user.name} ({user.email})
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className={`badge ${user.mode === "BYOK" ? "badge-primary" : "badge-secondary"}`}>
            {user.mode === "BYOK" ? "🔑 BYOK" : "🏢 MANAGED"}
          </span>
          <span className={`badge ${user.role === "admin" ? "badge-warning" : "badge-info"}`}>
            {user.role === "admin" ? "👑 מנהל" : "👤 משתמש"}
          </span>
        </div>
      </div>

      {user.mode === "BYOK" ? (
        <>
          <div className="alert alert-info" style={{ marginBottom: "20px" }}>
            <strong>ℹ️ מצב BYOK (Bring Your Own Key)</strong>
            <p style={{ margin: "10px 0 0 0" }}>
              במצב זה, אתה מוסיף מפתחות API משלך לספקים שונים (OpenAI, Anthropic, Google, Groq).
              המפתחות מוצפנים ונשמרים בצורה מאובטחת במערכת.
            </p>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3>המפתחות שלי ({keys.length})</h3>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddModal(true)}
              >
                + הוסף מפתח חדש
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="empty-state">
                <p>עדיין לא הוספת מפתחות API</p>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  הוסף מפתח ראשון
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {keys.map((key) => (
                  <div 
                    key={key._id} 
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      backgroundColor: key.isActive ? "#fff" : "#f5f5f5",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "24px" }}>
                          {key.provider === "openai" ? "🤖" : 
                           key.provider === "anthropic" ? "🧠" : 
                           key.provider === "google" ? "🔍" : "⚡"}
                        </span>
                        <div>
                          <h4 style={{ margin: 0 }}>
                            {key.provider === "openai" ? "OpenAI" : 
                             key.provider === "anthropic" ? "Anthropic (Claude)" : 
                             key.provider === "google" ? "Google (Gemini)" : "Groq"}
                          </h4>
                          <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666", fontFamily: "monospace" }}>
                            {key.keyPrefix}...
                          </p>
                        </div>
                      </div>
                      <span className={key.isActive ? "badge badge-success" : "badge badge-secondary"}>
                        {key.isActive ? "פעיל" : "לא פעיל"}
                      </span>
                    </div>
                    {key.createdAt && (
                      <p style={{ margin: "10px 0 0 0", fontSize: "12px", color: "#999" }}>
                        נוצר: {new Date(key.createdAt).toLocaleDateString("he-IL")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="alert alert-info">
          <strong>🏢 מצב MANAGED</strong>
          <p style={{ margin: "10px 0 0 0" }}>
            במצב זה, המערכת מנהלת את המפתחות עבורך. אין צורך להוסיף מפתחות משלך.
          </p>
        </div>
      )}

      {showAddModal && user && (
        <ProviderKeysManagement
          userId={user._id}
          userEmail={user.email}
          onClose={() => {
            setShowAddModal(false);
            fetchKeys(user._id);
          }}
        />
      )}
    </div>
  );
}
