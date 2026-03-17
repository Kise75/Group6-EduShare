import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DisplayPreferences from "../components/DisplayPreferences";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import api, { parseApiError } from "../services/api";

const defaultLogin = { identifier: "", password: "" };
const defaultRegister = { name: "", email: "", password: "", confirmPassword: "", major: "" };

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [forgotEmail, setForgotEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post("/auth/login", loginForm);
      login(response.data);
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(parseApiError(requestError, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setBusy(false);
      setError(t("auth.passwordMismatch"));
      return;
    }

    try {
      const payload = {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        major: registerForm.major,
      };
      const response = await api.post("/auth/register", payload);
      login(response.data);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(parseApiError(requestError, "Register failed"));
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post("/auth/forgot-password", { email: forgotEmail });
      setMessage(response.data.message || "Reset email sent");
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot send reset email"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-wrap">
      <section className="shell-panel">
        <header className="top-nav">
          <div className="nav-main-row">
            <Link to="/" className="brand">
              EduShare
            </Link>
            <div className="auth-nav-actions">
              <DisplayPreferences />
              <Link to="/" className="ghost-link">
                {t("nav.home")}
              </Link>
            </div>
          </div>
        </header>

        <section className="auth-grid shell-content">
          <form className="panel-card" onSubmit={submitLogin}>
            <h2>{t("nav.login")}</h2>
            <label>{t("auth.usernameOrEmail")}</label>
            <input
              type="text"
              required
              placeholder={t("auth.usernameOrEmailPlaceholder")}
              value={loginForm.identifier}
              onChange={(event) =>
                setLoginForm((prev) => ({ ...prev, identifier: event.target.value }))
              }
            />
            <label>{t("auth.password")}</label>
            <input
              type="password"
              required
              placeholder={t("auth.passwordPlaceholder")}
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            <button className="btn btn-primary" disabled={busy} type="submit">
              {t("nav.login")}
            </button>
          </form>

          <form className="panel-card" onSubmit={submitRegister}>
            <h2>{t("auth.register")}</h2>
            <label>{t("auth.name")}</label>
            <input
              required
              placeholder={t("auth.namePlaceholder")}
              value={registerForm.name}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <label>{t("auth.email")}</label>
            <input
              type="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            <label>{t("auth.major")}</label>
            <input
              placeholder={t("auth.majorPlaceholder")}
              value={registerForm.major}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, major: event.target.value }))
              }
            />
            <label>{t("auth.password")}</label>
            <input
              type="password"
              required
              placeholder={t("auth.createPasswordPlaceholder")}
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            <label>{t("auth.confirmPassword")}</label>
            <input
              type="password"
              required
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={registerForm.confirmPassword}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
            />
            <button className="btn btn-primary" disabled={busy} type="submit">
              {t("auth.register")}
            </button>
          </form>

          <form className="panel-card" onSubmit={submitForgot}>
            <h2>{t("auth.forgot")}</h2>
            <p className="muted">{t("auth.resetHint")}</p>
            <label>{t("auth.email")}</label>
            <input
              type="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
            />
            <button className="btn btn-primary" disabled={busy} type="submit">
              {t("auth.sendReset")}
            </button>
          </form>
        </section>

        <div className="shell-content">
          {error ? <p className="feedback error">{error}</p> : null}
          {message ? <p className="feedback success">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
