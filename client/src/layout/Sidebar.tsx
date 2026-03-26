import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "דף הבית" },
  { to: "/safeai-ui", label: "SafeAI UI" },
  { to: "/home", label: "לוח בקרה" },
  { to: "/tasks", label: "ניהול משימות" },
  { to: "/users", label: "משתמשים" },
  { to: "/groups", label: "קבוצות" },
  { to: "/models", label: "מודלים" },
  { to: "/agents", label: "סוכנים" },
  { to: "/api-keys", label: "מפתחות API" },
  { to: "/stats", label: "סטטיסטיקות שימוש" },
  { to: "/tabl_data", label: "טבלת נתונים" },
  { to: "/data-history", label: "היסטוריית נתונים" },
  { to: "/filter-admin", label: "ניהול פילטרים" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">Safe-AI Admin</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}