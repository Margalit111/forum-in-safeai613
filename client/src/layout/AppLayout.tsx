import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import DevelopmentModal from "../components/DevelopmentModal";
import "../styles/layout.css";

export default function AppLayout() {
  const location = useLocation();
  const showDevelopmentModal = location.pathname !== "/safeai-ui";

  return (
    <div className="app-root">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <DevelopmentModal show={showDevelopmentModal} />
    </div>
  );
}
