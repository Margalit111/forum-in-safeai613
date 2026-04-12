import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/safeai-ui.css";
import ProfilesManagement from "../features/safeai-ui/ProfilesManagement";
import UsersManagement from "../features/safeai-ui/UsersManagement";
import UserDashboard from "../features/safeai-ui/UserDashboard";
import Statistics from "../features/safeai-ui/Statistics";
import UserApiKeysPage from "../features/safeai-ui/UserApiKeysPage";

type Section = "profiles" | "users" | "dashboard" | "statistics" | "apikeys";

interface UserData {
  email: string;
  name: string;
  _id?: string;
}

export default function SafeAIUIPage() {
  const navigate = useNavigate();
  
  // Initialize state from localStorage
  const getInitialState = () => {
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");
    
    if (storedUser && storedRole) {
      const parsedUser = JSON.parse(storedUser);
      return {
        user: parsedUser,
        role: storedRole as "admin" | "user",
        section: (storedRole === "admin" ? "profiles" : "dashboard") as Section
      };
    }
    
    return {
      user: null,
      role: null,
      section: "dashboard" as Section
    };
  };

  const initialState = getInitialState();
  const [activeSection, setActiveSection] = useState<Section>(initialState.section);
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(initialState.role);
  const [currentUser, setCurrentUser] = useState<UserData | null>(initialState.user);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!userRole) {
      navigate("/");
    }
  }, [userRole, navigate]);

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profiles":
        return <ProfilesManagement />;
      case "users":
        return <UsersManagement />;
      case "dashboard":
        return <UserDashboard user={currentUser} />;
      case "statistics":
        return <Statistics user={currentUser} />;
      case "apikeys":
        return <UserApiKeysPage />;
      default:
        return <UserDashboard user={currentUser} />;
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
                className={activeSection === "apikeys" ? "nav-btn active" : "nav-btn"}
                onClick={() => setActiveSection("apikeys")}
              >
                🔑 מפתחות API
              </button>
              {/* <button
                className={activeSection === "statistics" ? "nav-btn active" : "nav-btn"}
                onClick={() => setActiveSection("statistics")}
              >
                סטטיסטיקות
              </button> */}
            </>
          )}
        </nav>
      )}

      <div className="safeai-content">{renderSection()}</div>
    </div>
  );
}
