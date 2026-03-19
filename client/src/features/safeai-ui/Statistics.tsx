import { useState, useEffect } from "react";

interface StatisticsProps {
  user: {
    email: string;
    name: string;
    _id?: string;
  } | null;
}

interface UsageData {
  date: string;
  requests: number;
  blocked: number;
}

export default function Statistics({ user }: StatisticsProps) {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  useEffect(() => {
    // Simulate fetching statistics
    // In production, this would call your API with user data
    setTimeout(() => {
      const mockData: UsageData[] = [];
      const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split("T")[0],
          requests: Math.floor(Math.random() * 100),
          blocked: Math.floor(Math.random() * 20),
        });
      }
      
      setUsageData(mockData);
      setLoading(false);
    }, 500);
  }, [timeRange, user]);

  const totalRequests = usageData.reduce((sum, day) => sum + day.requests, 0);
  const totalBlocked = usageData.reduce((sum, day) => sum + day.blocked, 0);
  const avgRequestsPerDay = totalRequests / usageData.length;
  const blockRate = ((totalBlocked / totalRequests) * 100).toFixed(1);

  if (loading) {
    return <div className="loading-state">טוען סטטיסטיקות...</div>;
  }

  return (
    <div>
      <div className="management-header">
        <h2>סטטיסטיקות שימוש</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={timeRange === "week" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setTimeRange("week")}
          >
            שבוע
          </button>
          <button
            className={timeRange === "month" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setTimeRange("month")}
          >
            חודש
          </button>
          <button
            className={timeRange === "year" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setTimeRange("year")}
          >
            שנה
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>סה"כ בקשות</h3>
          <p className="stat-value">{totalRequests}</p>
          <p className="stat-change">
            {timeRange === "week" ? "7 ימים אחרונים" : timeRange === "month" ? "30 ימים אחרונים" : "שנה אחרונה"}
          </p>
        </div>

        <div className="stat-card">
          <h3>ממוצע יומי</h3>
          <p className="stat-value">{avgRequestsPerDay.toFixed(0)}</p>
          <p className="stat-change">בקשות ליום</p>
        </div>

        <div className="stat-card">
          <h3>סה"כ חסומות</h3>
          <p className="stat-value">{totalBlocked}</p>
          <p className="stat-change negative">{blockRate}% מהבקשות</p>
        </div>

        <div className="stat-card">
          <h3>שיעור הצלחה</h3>
          <p className="stat-value">{(100 - parseFloat(blockRate)).toFixed(1)}%</p>
          <p className="stat-change positive">בקשות מוצלחות</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3>פירוט יומי</h3>
        <div style={{ marginTop: "16px", maxHeight: "400px", overflowY: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>בקשות</th>
                <th>חסומות</th>
                <th>שיעור הצלחה</th>
              </tr>
            </thead>
            <tbody>
              {usageData.slice().reverse().map((day) => {
                const successRate = ((day.requests - day.blocked) / day.requests * 100).toFixed(1);
                return (
                  <tr key={day.date}>
                    <td>{new Date(day.date).toLocaleDateString("he-IL")}</td>
                    <td>{day.requests}</td>
                    <td>
                      <span className="badge badge-danger">{day.blocked}</span>
                    </td>
                    <td>
                      <span className={parseFloat(successRate) > 80 ? "badge badge-success" : "badge badge-warning"}>
                        {successRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3>תובנות</h3>
        <div style={{ marginTop: "16px" }}>
          <div className="alert alert-info">
            <strong>📊 ניתוח:</strong>
            <ul style={{ marginTop: "8px", marginBottom: "0", paddingRight: "20px" }}>
              <li>הממוצע היומי שלך הוא {avgRequestsPerDay.toFixed(0)} בקשות</li>
              <li>שיעור החסימה שלך הוא {blockRate}%</li>
              <li>
                {parseFloat(blockRate) < 10
                  ? "שיעור חסימה נמוך - שימוש תקין! ✅"
                  : parseFloat(blockRate) < 25
                  ? "שיעור חסימה בינוני - שים לב לתוכן הבקשות ⚠️"
                  : "שיעור חסימה גבוה - מומלץ לבדוק את הפרופיל שלך 🔴"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
