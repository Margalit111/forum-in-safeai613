import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing-page.css";
import AboutCompany from "../features/landing/AboutCompany";
import Products from "../features/landing/Products";

type Section = "about" | "products";

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<Section>("about");
  const navigate = useNavigate();

  const renderSection = () => {
    switch (activeSection) {
      case "about":
        return <AboutCompany />;
      case "products":
        return <Products />;
      default:
        return <AboutCompany />;
    }
  };

  return (
    <div className="landing-page">
    

      <nav className="landing-nav">
        <button
  className="landing-nav-btn"
          onClick={() => setActiveSection("about")}
        >
          לאורח{" "}
        </button>
        <button
          className="landing-nav-btn"
          onClick={() => setActiveSection("products")}
        >
          למפתח{" "}
        </button>
        <button className="landing-nav-btn active" onClick={() => navigate("/login")}>
          לכניסה למערכת &gt;&gt;&gt;
        </button>
      
      </nav>

      <div className="landing-content">{renderSection()}</div>
    </div>
  );
}
