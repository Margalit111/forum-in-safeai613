import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import DevelopmentModal from "../components/DevelopmentModal";
import "../styles/layout.css";

export default function AppLayout() {
  const location = useLocation();
  const showDevelopmentModal = location.pathname !== "/safeai-ui" && location.pathname !== "/";

  return (
    <div className="app-root">
        <div className="landing-header">
        <h1 style={{ direction: "ltr", position: "relative" }}>
          <img
            src="./empty_logo.png"
            style={{
              height: "1.5em",
              position: "absolute",
              transform: "translateX(-110%)",
            }}
          />
          SafeAI{" "}
        </h1>
        <p className="landing-subtitle">פתרונות בטוחים לשימוש ב-AI</p>
      </div>
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <DevelopmentModal show={showDevelopmentModal} />
    </div>
  );
}
