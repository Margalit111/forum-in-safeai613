import { useState, useEffect } from "react";

interface UserDashboardProps {
  user: {
    email: string;
    name: string;
    _id?: string;
  } | null;
}

interface DashboardStats {
  totalRequests: number;
  successfulRequests: number;
  blockedRequests: number;
  apiKeyStatus: "active" | "inactive";
  lastActivity?: string;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    successfulRequests: 0,
    blockedRequests: 0,
    apiKeyStatus: "active",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user stats
    // In production, this would call your API
    setTimeout(() => {
      setStats({
        totalRequests: Math.floor(Math.random() * 1000),
        successfulRequests: Math.floor(Math.random() * 800),
        blockedRequests: Math.floor(Math.random() * 200),
        apiKeyStatus: "active",
        lastActivity: new Date().toISOString(),
      });
      setLoading(false);
    }, 500);
  }, [user]);

  if (loading) {
    return <div className="loading-state">טוען נתונים...</div>;
  }

  return (
    <div>
      <div className="management-header">
        <h2>שלום, {user?.name || user?.email}</h2>
        <span className="badge badge-success">חשבון פעיל</span>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>סה"כ בקשות</h3>
          <p className="stat-value">{stats.totalRequests}</p>
          <p className="stat-change positive">↑ 12% מהשבוע שעבר</p>
        </div>

        <div className="stat-card">
          <h3>בקשות מוצלחות</h3>
          <p className="stat-value">{stats.successfulRequests}</p>
          <p className="stat-change positive">
            {((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}% הצלחה
          </p>
        </div>

        <div className="stat-card">
          <h3>בקשות חסומות</h3>
          <p className="stat-value">{stats.blockedRequests}</p>
          <p className="stat-change negative">
            {((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)}% חסימה
          </p>
        </div>

        <div className="stat-card">
          <h3>סטטוס API Key</h3>
          <p className="stat-value">
            <span className="badge badge-success">פעיל</span>
          </p>
          <p className="stat-change">
            {stats.lastActivity && `פעילות אחרונה: ${new Date(stats.lastActivity).toLocaleString("he-IL")}`}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3>פרטי חשבון</h3>
        <div style={{ marginTop: "16px" }}>
          <div className="item-detail">
            <span className="item-detail-label">אימייל:</span>
            <span className="item-detail-value">{user?.email}</span>
          </div>
          <div className="item-detail">
            <span className="item-detail-label">שם:</span>
            <span className="item-detail-value">{user?.name}</span>
          </div>
          <div className="item-detail">
            <span className="item-detail-label">מזהה משתמש:</span>
            <span className="item-detail-value">{user?._id || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop: "24px" }}>
        <strong>💡 טיפ:</strong> השתמש בלשונית "סטטיסטיקות" כדי לראות ניתוח מפורט של השימוש שלך.
      </div>
    </div>
  );
}
