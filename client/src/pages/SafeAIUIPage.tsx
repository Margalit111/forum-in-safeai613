import { useState } from "react";
import "../styles/safeai-ui.css";
import ProfilesManagement from "../features/safeai-ui/ProfilesManagement";
import UsersManagement from "../features/safeai-ui/UsersManagement";
import AuthSection from "../features/safeai-ui/AuthSection";
import UserDashboard from "../features/safeai-ui/UserDashboard";
import Statistics from "../features/safeai-ui/Statistics";

type Section = "profiles" | "users" | "auth" | "dashboard" | "statistics";

interface UserData {
  email: string;
  name: string;
  _id?: string;
}

export default function SafeAIUIPage() {
  const [activeSection, setActiveSection] = useState<Section>("auth");
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const handleLogin = (role: "admin" | "user", userData?: UserData) => {
    setUserRole(role);
    setCurrentUser(userData || null);
    if (role === "admin") {
      setActiveSection("profiles");
    } else {
      setActiveSection("dashboard");
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setActiveSection("auth");
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profiles":
        return <ProfilesManagement />;
      case "users":
        return <UsersManagement />;
      case "auth":
        return <AuthSection onLogin={handleLogin} />;
      case "dashboard":
        return <UserDashboard user={currentUser} />;
      case "statistics":
        return <Statistics user={currentUser} />;
      default:
        return <AuthSection onLogin={handleLogin} />;
    }
  };

  return (
    <div className="safeai-ui-page">
      <div className="safeai-header">
        <h1>SafeAI UI</h1>
        {userRole && (
          <div className="user-info">
            <span className="user-role-badge">{userRole === "admin" ? "מנהל" : "משתמש"}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              התנתק
            </button>
          </div>
        )}
      </div>

      {userRole && (
        <nav className="safeai-nav">
          {userRole === "admin" && (
            <>
              <button
                className={activeSection === "profiles" ? "nav-btn active" : "nav-btn"}
                onClick={() => setActiveSection("profiles")}
              >
                ניהול פרופילים
              </button>
              <button
                className={activeSection === "users" ? "nav-btn active" : "nav-btn"}
                onClick={() => setActiveSection("users")}
              >
                ניהול משתמשים
              </button>
            </>
          )}
          {userRole === "user" && (
            <>
              <button
                className={activeSection === "dashboard" ? "nav-btn active" : "nav-btn"}
                onClick={() => setActiveSection("dashboard")}
              >
                לוח משתמש
              </button>
              <button
                className={activeSection === "statistics" ? "nav-btn active" : "nav-btn"}
                onClick={() => setActiveSection("statistics")}
              >
                סטטיסטיקות
              </button>
            </>
          )}
        </nav>
      )}

      <div className="safeai-content">{renderSection()}</div>
    </div>
  );
}
