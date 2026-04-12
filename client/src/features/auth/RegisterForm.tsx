import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall, API_ENDPOINTS } from "../../config/api";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  organization?: string;
  profileId?: string;
  mode: "BYOK" | "MANAGED";
}

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  mode: string;
  profileId?: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    organization: "",
    profileId: "",
    mode: "BYOK",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  // Don't fetch profiles during registration - user is not authenticated yet
  // Profiles can be assigned later after login

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("הסיסמה חייבת להכיל לפחות 8 תווים");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("הסיסמה חייבת להכיל לפחות אות גדולה אחת");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("הסיסמה חייבת להכיל לפחות אות קטנה אחת");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("הסיסמה חייבת להכיל לפחות ספרה אחת");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPasswordErrors([]);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      setLoading(false);
      return;
    }

    // Validate password strength
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await apiCall<{
        success: boolean;
        message: string;
        user: User;
        proxyApiKey: string;
        accessToken: string;
        refreshToken: string;
      }>(API_ENDPOINTS.auth.register, {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          organization: formData.organization || undefined,
          profileId: formData.profileId || undefined,
          mode: formData.mode,
        }),
      });

      if (response.success) {
        // Store tokens and user info
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("userRole", response.user.role);

        // Navigate to Profile Choose and API key display page
        navigate("/register-success", {
          state: {
            proxyApiKey: response.proxyApiKey,
            message: response.message,
          },
        });
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "שגיאה בהרשמה";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear password errors when user types
    if (name === "password" && passwordErrors.length > 0) {
      setPasswordErrors([]);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-wrapper">
        <h2 className="auth-title">הרשמה</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">שם מלא *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="הזן שם מלא"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">אימייל *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="הזן סיסמה"
              autoComplete="new-password"
            />
            {passwordErrors.length > 0 && (
              <div className="password-requirements">
                <ul>
                  {passwordErrors.map((err, idx) => (
                    <li key={idx} style={{ color: "#dc3545", fontSize: "12px" }}>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">אימות סיסמה *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="הזן סיסמה שוב"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization">ארגון (אופציונלי)</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              placeholder="שם הארגון"
            />
          </div>

          <div className="form-group">
            <label htmlFor="mode">מצב שימוש *</label>
            <select
              id="mode"
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              required
            >
              <option value="BYOK">🔑 BYOK - הבא מפתח משלך</option>
              <option value="MANAGED">🏢 MANAGED - שימוש במפתחות המערכת</option>
            </select>
            <small style={{ display: "block", marginTop: "5px", color: "#666" }}>
              {formData.mode === "BYOK"
                ? "תוכל להוסיף מפתחות API משלך לספקים שונים"
                : "המערכת תנהל את המפתחות עבורך"}
            </small>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "15px" }}>
              {error}
            </div>
          )}

          <div className="form-info">
            <p style={{ fontSize: "12px", color: "#666" }}>
              בהרשמה אתם מסכימים לתנאי השימוש ומדיניות הפרטיות שלנו
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "נרשם..." : "הירשם"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            כבר יש לך חשבון?{" "}
            <button className="link-button" onClick={() => navigate("/login")}>
              התחבר
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
