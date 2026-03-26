import { useState } from "react";
import "../styles/landing-page.css";
import AboutCompany from "../features/landing/AboutCompany";
import Products from "../features/landing/Products";
import AuthForm from "../features/landing/AuthForm";

type Section = "about" | "products" | "auth";

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<Section>("about");

  const renderSection = () => {
    switch (activeSection) {
      case "about":
        return <AboutCompany />;
      case "products":
        return <Products />;
      case "auth":
        return <AuthForm />;
      default:
        return <AboutCompany />;
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1>SafeAI - בינה מלאכותית בטוחה ומסוננת</h1>
        <p className="landing-subtitle">פתרונות מתקדמים לסינון תוכן AI עבור ארגונים ומוסדות</p>
      </div>

      <nav className="landing-nav">
        <button
          className={activeSection === "about" ? "landing-nav-btn active" : "landing-nav-btn"}
          onClick={() => setActiveSection("about")}
        >
          אודות החברה
        </button>
        <button
          className={activeSection === "products" ? "landing-nav-btn active" : "landing-nav-btn"}
          onClick={() => setActiveSection("products")}
        >
          המוצרים שלנו
        </button>
        <button
          className={activeSection === "auth" ? "landing-nav-btn active" : "landing-nav-btn"}
          onClick={() => setActiveSection("auth")}
        >
          התחברות / הרשמה
        </button>
      </nav>

      <div className="landing-content">{renderSection()}</div>
    </div>
  );
}
