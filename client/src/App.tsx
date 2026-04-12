import "./styles/design-system.css";
import "./App.css";
import AppRouter from "./router/AppRouter";

function App() {
  return (
    <>
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
      <AppRouter />
    </>
  );
}

export default App;
