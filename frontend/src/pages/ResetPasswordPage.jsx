import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthPasswordField from "../components/AuthPasswordField";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import api, { parseApiError } from "../services/api";
import { getPasswordStrengthMeta } from "../utils/authFormHelpers";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirm: false,
  });

  const content = useMemo(
    () =>
      language === "vi"
        ? {
            languageLabel: "Ngôn ngữ",
            themeLabel: "Giao diện",
            light: "Sáng",
            dark: "Tối",
            badge: "Khôi phục tài khoản",
            title: "Đặt lại mật khẩu để quay lại tài khoản EduShare.",
            description:
              "Đây là bước cuối cùng của luồng khôi phục. Nhập mật khẩu mới, xác nhận lại rồi quay lại trang đăng nhập như một website hoàn chỉnh.",
            securityTitle: "Lưu ý nhanh",
            securityPoints: [
              "Dùng mật khẩu tối thiểu 6 ký tự.",
              "Tránh dùng lại mật khẩu quá dễ đoán.",
              "Sau khi cập nhật xong, bạn sẽ được đưa về trang đăng nhập.",
            ],
            formLead: "Mật khẩu mới",
            formHint: "Nhập mật khẩu mới để hoàn tất quá trình khôi phục.",
            password: "Mật khẩu mới",
            confirmPassword: "Xác nhận mật khẩu",
            mismatch: "Mật khẩu xác nhận không khớp.",
            submit: "Cập nhật mật khẩu",
            submitting: "Đang cập nhật...",
            success: "Mật khẩu đã được cập nhật. Đang quay về trang đăng nhập...",
            home: "Trang chủ",
            invalidLink: "Liên kết đặt lại mật khẩu không hợp lệ.",
            backToLogin: "Quay lại đăng nhập",
            showPassword: "Hiện",
            hidePassword: "Ẩn",
            passwordStrengthLabel: "Độ mạnh mật khẩu",
            resetError: "Không thể đặt lại mật khẩu.",
          }
        : {
            languageLabel: "Language",
            themeLabel: "Theme",
            light: "Light",
            dark: "Dark",
            badge: "Account recovery",
            title: "Reset your password and return to EduShare.",
            description:
              "This is the last step of the recovery flow. Enter a new password, confirm it, and head back to the standard sign-in screen.",
            securityTitle: "Quick reminders",
            securityPoints: [
              "Use at least 6 characters.",
              "Avoid reusing an easy-to-guess password.",
              "After saving, you will be redirected back to login.",
            ],
            formLead: "Choose a new password",
            formHint: "Enter a fresh password to complete account recovery.",
            password: "New Password",
            confirmPassword: "Confirm Password",
            mismatch: "Passwords do not match.",
            submit: "Update Password",
            submitting: "Updating...",
            success: "Password updated successfully. Redirecting to login...",
            home: "Home",
            invalidLink: "This reset password link is invalid.",
            backToLogin: "Back to login",
            showPassword: "Show",
            hidePassword: "Hide",
            passwordStrengthLabel: "Password strength",
            resetError: "Cannot reset password.",
          },
    [language]
  );

  const passwordStrength = useMemo(
    () => getPasswordStrengthMeta(form.password, language),
    [form.password, language]
  );

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError(content.invalidLink);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(content.mismatch);
      return;
    }

    setBusy(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });
      setMessage(response.data.message || content.success);
      window.setTimeout(() => navigate("/auth", { replace: true }), 1200);
    } catch (requestError) {
      setError(parseApiError(requestError, content.resetError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-wrap">
      <section className="shell-panel">
        <header className="top-nav">
          <div className="nav-main-row container-fluid px-0">
            <Link to="/" className="brand">
              EduShare
            </Link>
            <div />
            <div className="auth-nav-actions">
              <div className="display-preferences">
                <div className="segmented-control" role="group" aria-label={content.languageLabel}>
                  <button
                    type="button"
                    className={language === "vi" ? "active" : ""}
                    onClick={() => setLanguage("vi")}
                  >
                    VI
                  </button>
                  <button
                    type="button"
                    className={language === "en" ? "active" : ""}
                    onClick={() => setLanguage("en")}
                  >
                    EN
                  </button>
                </div>

                <div className="segmented-control" role="group" aria-label={content.themeLabel}>
                  <button
                    type="button"
                    className={theme === "light" ? "active" : ""}
                    onClick={() => setTheme("light")}
                  >
                    {content.light}
                  </button>
                  <button
                    type="button"
                    className={theme === "dark" ? "active" : ""}
                    onClick={() => setTheme("dark")}
                  >
                    {content.dark}
                  </button>
                </div>
              </div>

              <Link to="/" className="ghost-link">
                {content.home}
              </Link>
            </div>
          </div>
        </header>

        <section className="shell-content">
          <div className="auth-shell auth-shell-reset">
            <aside className="auth-showcase auth-showcase-reset">
              <span className="auth-showcase-badge">{content.badge}</span>
              <h1>{content.title}</h1>
              <p className="muted">{content.description}</p>

              <div className="auth-secondary-card auth-secondary-static">
                <div>
                  <h3>{content.securityTitle}</h3>
                </div>
                <div className="auth-showcase-list compact">
                  {content.securityPoints.map((item) => (
                    <article key={item} className="auth-showcase-item compact">
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </div>
            </aside>

            <section className="auth-card-wrap">
              <div className="auth-card">
                <div className="auth-card-head">
                  <span className="muted">{content.formLead}</span>
                  <h2>{content.submit}</h2>
                  <p className="muted">{content.formHint}</p>
                </div>

                {error || message ? (
                  <div className="auth-message-stack">
                    {error ? <p className="feedback error">{error}</p> : null}
                    {message ? <p className="feedback success">{message}</p> : null}
                  </div>
                ) : null}

                <form className="auth-form" onSubmit={handleSubmit}>
                  <AuthPasswordField
                    label={content.password}
                    value={form.password}
                    minLength={6}
                    autoComplete="new-password"
                    visible={passwordVisibility.password}
                    showLabel={content.showPassword}
                    hideLabel={content.hidePassword}
                    onToggleVisibility={() => togglePasswordVisibility("password")}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />

                  <div className="auth-password-strength">
                    <div className="auth-password-strength-head">
                      <span>{content.passwordStrengthLabel}</span>
                      <strong className={`tone-${passwordStrength.tone}`}>{passwordStrength.label}</strong>
                    </div>
                    <div className="auth-password-strength-bar" aria-hidden="true">
                      <span
                        className={`tone-${passwordStrength.tone}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                    <p className="field-hint">{passwordStrength.hint}</p>
                  </div>

                  <AuthPasswordField
                    label={content.confirmPassword}
                    value={form.confirmPassword}
                    minLength={6}
                    autoComplete="new-password"
                    visible={passwordVisibility.confirm}
                    showLabel={content.showPassword}
                    hideLabel={content.hidePassword}
                    onToggleVisibility={() => togglePasswordVisibility("confirm")}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                  />

                  <button className="btn btn-primary w-100" disabled={busy} type="submit">
                    {busy ? content.submitting : content.submit}
                  </button>
                </form>

                <p className="auth-footnote">
                  <Link className="auth-link-inline" to="/auth">
                    {content.backToLogin}
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
