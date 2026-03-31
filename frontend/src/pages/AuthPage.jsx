import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthPasswordField from "../components/AuthPasswordField";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import api, { parseApiError } from "../services/api";
import {
  courseCodeSuggestions,
  getAcademicEmailHint,
  getAuthContextNotice,
  getPasswordStrengthMeta,
  majorSuggestions,
  normalizeTrackedCourseCodes,
} from "../utils/authFormHelpers";

const defaultLogin = { identifier: "", password: "" };
const defaultRegister = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  major: "",
  trackedCourseCodes: "",
};

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("login");
  const [showForgot, setShowForgot] = useState(false);
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [forgotEmail, setForgotEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordVisibility, setPasswordVisibility] = useState({
    login: false,
    register: false,
    confirm: false,
  });

  const authCopy = useMemo(
    () =>
      language === "vi"
        ? {
            languageLabel: "Ngôn ngữ",
            themeLabel: "Giao diện",
            light: "Sáng",
            dark: "Tối",
            home: "Trang chủ",
            loginTab: "Đăng nhập",
            registerTab: "Đăng ký",
            usernameOrEmail: "Tên đăng nhập hoặc email",
            usernameOrEmailPlaceholder: "Nhập tên đăng nhập hoặc email",
            password: "Mật khẩu",
            passwordPlaceholder: "Nhập mật khẩu của bạn",
            name: "Họ tên",
            namePlaceholder: "Nhập họ tên",
            email: "Email",
            emailPlaceholder: "Nhập email",
            major: "Ngành học",
            majorPlaceholder: "Ví dụ: Công nghệ thông tin",
            createPasswordPlaceholder: "Tạo mật khẩu",
            confirmPassword: "Xác nhận mật khẩu",
            confirmPasswordPlaceholder: "Nhập lại mật khẩu",
            sendReset: "Gửi liên kết đặt lại",
            passwordMismatch: "Mật khẩu xác nhận không khớp.",
            badge: "Nền tảng giáo trình trong trường",
            title: "Đăng nhập để tiếp tục mua, bán và trao đổi giáo trình an toàn hơn.",
            description:
              "Một luồng đăng nhập gọn, quen thuộc và đúng ngữ cảnh sinh viên để bạn vào nhanh marketplace, tin nhắn và meetup mà không bị rối.",
            highlights: [
              {
                title: "Theo dõi đúng mã môn",
                body: "Tạo tài khoản xong là có thể lưu các mã môn đang học để EduShare gợi ý giáo trình sát hơn.",
              },
              {
                title: "Giao dịch rõ ràng",
                body: "Tin nhắn, meetup, lưu tin và lịch sử giao dịch đều nằm trong cùng một tài khoản.",
              },
              {
                title: "Đủ mượt để dùng thật",
                body: "Biểu mẫu quen thuộc, có hiện mật khẩu, gợi ý email sinh viên và nhắc bước tiếp theo sau đăng nhập.",
              },
            ],
            metrics: [
              { value: "12+", label: "tin đăng mẫu" },
              { value: "1", label: "luồng đăng nhập chính" },
              { value: "3", label: "thao tác học tập cốt lõi" },
              { value: "24/7", label: "sẵn sàng trước giờ meetup" },
            ],
            loginLead: "Chào mừng bạn quay lại",
            registerLead: "Tạo tài khoản mới",
            loginHint: "Nhập tài khoản để tiếp tục dùng EduShare.",
            registerHint: "Đăng ký nhanh để bắt đầu đăng giáo trình, lưu tin và nhắn tin.",
            forgotTitle: "Quên mật khẩu?",
            forgotHint: "Nhập email đã đăng ký. Hệ thống sẽ gửi liên kết đặt lại mật khẩu.",
            forgotToggle: "Quên mật khẩu",
            hideForgot: "Đóng phần khôi phục",
            noAccount: "Chưa có tài khoản?",
            haveAccount: "Đã có tài khoản?",
            switchToRegister: "Đăng ký ngay",
            switchToLogin: "Đăng nhập ngay",
            showPassword: "Hiện",
            hidePassword: "Ẩn",
            loginSubmitting: "Đang đăng nhập...",
            registerSubmitting: "Đang tạo tài khoản...",
            forgotSubmitting: "Đang gửi liên kết...",
            resetEmailSent: "Liên kết đặt lại mật khẩu đã được gửi tới email của bạn.",
            majorHint: "Ngành học sẽ giúp hồ sơ và gợi ý học liệu sát hơn.",
            trackedCourseCodesLabel: "Mã môn muốn theo dõi",
            trackedCourseCodesPlaceholder: "Ví dụ: MATH101, IT204, ECON205",
            trackedCourseCodesHint:
              "Nhập tối đa 6 mã môn, cách nhau bằng dấu phẩy. EduShare sẽ dùng để cá nhân hóa gợi ý giáo trình.",
            trackedCourseCodesPreview: "Sẽ theo dõi ngay sau khi tạo tài khoản",
            passwordStrengthLabel: "Độ mạnh mật khẩu",
            loginError: "Không thể đăng nhập.",
            registerError: "Không thể tạo tài khoản.",
            forgotError: "Không thể gửi liên kết đặt lại.",
            tabsLabel: "Các bước xác thực",
          }
        : {
            languageLabel: "Language",
            themeLabel: "Theme",
            light: "Light",
            dark: "Dark",
            home: "Home",
            loginTab: "Login",
            registerTab: "Register",
            usernameOrEmail: "Username or Email",
            usernameOrEmailPlaceholder: "Enter username or email",
            password: "Password",
            passwordPlaceholder: "Enter your password",
            name: "Name",
            namePlaceholder: "Enter your name",
            email: "Email",
            emailPlaceholder: "Enter your email",
            major: "Major",
            majorPlaceholder: "For example: Computer Science",
            createPasswordPlaceholder: "Create a password",
            confirmPassword: "Confirm Password",
            confirmPasswordPlaceholder: "Confirm your password",
            sendReset: "Send Reset Link",
            passwordMismatch: "Passwords do not match.",
            badge: "Campus study marketplace",
            title: "Sign in to keep buying, selling, and sharing course materials with less friction.",
            description:
              "A more familiar auth flow keeps students focused on the marketplace, messages, and meetup planning instead of juggling three separate forms.",
            highlights: [
              {
                title: "Track the right course codes",
                body: "New accounts can save tracked course codes early so EduShare can personalize textbook suggestions sooner.",
              },
              {
                title: "Keep every deal in one place",
                body: "Messages, meetup planning, saved items, and transaction history stay under one account.",
              },
              {
                title: "Feels like a real product",
                body: "The page now includes password visibility, school email hints, and smarter return-to-action prompts.",
              },
            ],
            metrics: [
              { value: "12+", label: "sample listings" },
              { value: "1", label: "primary auth flow" },
              { value: "3", label: "core study actions" },
              { value: "24/7", label: "ready before meetup time" },
            ],
            loginLead: "Welcome back",
            registerLead: "Create a new account",
            loginHint: "Enter your credentials to continue with EduShare.",
            registerHint: "Create an account to start posting, saving, and chatting.",
            forgotTitle: "Forgot your password?",
            forgotHint: "Enter the email tied to your account and we will send a reset link.",
            forgotToggle: "Forgot password",
            hideForgot: "Hide recovery form",
            noAccount: "Don't have an account yet?",
            haveAccount: "Already have an account?",
            switchToRegister: "Create one",
            switchToLogin: "Sign in",
            showPassword: "Show",
            hidePassword: "Hide",
            loginSubmitting: "Signing in...",
            registerSubmitting: "Creating account...",
            forgotSubmitting: "Sending reset link...",
            resetEmailSent: "A reset link has been sent to your email.",
            majorHint: "Your major helps EduShare personalize profile and course material suggestions.",
            trackedCourseCodesLabel: "Tracked course codes",
            trackedCourseCodesPlaceholder: "For example: MATH101, IT204, ECON205",
            trackedCourseCodesHint:
              "Enter up to 6 course codes separated by commas so EduShare can personalize recommendations sooner.",
            trackedCourseCodesPreview: "Will be tracked as soon as your account is created",
            passwordStrengthLabel: "Password strength",
            loginError: "Cannot sign in.",
            registerError: "Cannot create account.",
            forgotError: "Cannot send the reset link.",
            tabsLabel: "Authentication tabs",
          },
    [language]
  );

  const redirectTo = location.state?.from || "/";
  const trackedCourseCodesPreview = useMemo(
    () => normalizeTrackedCourseCodes(registerForm.trackedCourseCodes),
    [registerForm.trackedCourseCodes]
  );
  const passwordStrength = useMemo(
    () => getPasswordStrengthMeta(registerForm.password, language),
    [language, registerForm.password]
  );
  const academicEmailHint = useMemo(
    () => getAcademicEmailHint(registerForm.email, language),
    [language, registerForm.email]
  );
  const authContextNotice = useMemo(
    () => getAuthContextNotice(location.state?.from, language),
    [language, location.state]
  );

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const switchTab = (nextTab) => {
    setActiveTab(nextTab);
    setShowForgot(false);
    resetFeedback();
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    resetFeedback();

    try {
      const response = await api.post("/auth/login", loginForm);
      login(response.data);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(parseApiError(requestError, authCopy.loginError));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setBusy(true);
    resetFeedback();

    if (registerForm.password !== registerForm.confirmPassword) {
      setBusy(false);
      setError(authCopy.passwordMismatch);
      return;
    }

    try {
      const payload = {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        major: registerForm.major,
        trackedCourseCodes: trackedCourseCodesPreview,
      };
      const response = await api.post("/auth/register", payload);
      login(response.data);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(parseApiError(requestError, authCopy.registerError));
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    setBusy(true);
    resetFeedback();

    try {
      const response = await api.post("/auth/forgot-password", { email: forgotEmail });
      setMessage(response.data.message || authCopy.resetEmailSent);
    } catch (requestError) {
      setError(parseApiError(requestError, authCopy.forgotError));
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
                <div className="segmented-control" role="group" aria-label={authCopy.languageLabel}>
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

                <div className="segmented-control" role="group" aria-label={authCopy.themeLabel}>
                  <button
                    type="button"
                    className={theme === "light" ? "active" : ""}
                    onClick={() => setTheme("light")}
                  >
                    {authCopy.light}
                  </button>
                  <button
                    type="button"
                    className={theme === "dark" ? "active" : ""}
                    onClick={() => setTheme("dark")}
                  >
                    {authCopy.dark}
                  </button>
                </div>
              </div>

              <Link to="/" className="ghost-link">
                {authCopy.home}
              </Link>
            </div>
          </div>
        </header>

        <section className="shell-content">
          <div className="auth-shell auth-shell-centered">
            <section className="auth-card-wrap auth-card-wrap-centered">
              <div className="auth-card auth-card-centered">
                <div className="auth-card-head">
                  <span className="muted">
                    {activeTab === "login" ? authCopy.loginLead : authCopy.registerLead}
                  </span>
                  <h2>{activeTab === "login" ? authCopy.loginTab : authCopy.registerTab}</h2>
                  <p className="muted">
                    {activeTab === "login" ? authCopy.loginHint : authCopy.registerHint}
                  </p>
                </div>

                {authContextNotice ? (
                  <div className="auth-context-note">
                    <strong>{authContextNotice.title}</strong>
                    <p>{authContextNotice.body}</p>
                  </div>
                ) : null}

                <div className="auth-tabs" role="tablist" aria-label={authCopy.tabsLabel}>
                  <button
                    type="button"
                    className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
                    onClick={() => switchTab("login")}
                  >
                    {authCopy.loginTab}
                  </button>
                  <button
                    type="button"
                    className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
                    onClick={() => switchTab("register")}
                  >
                    {authCopy.registerTab}
                  </button>
                </div>

                {error || message ? (
                  <div className="auth-message-stack">
                    {error ? <p className="feedback error">{error}</p> : null}
                    {message ? <p className="feedback success">{message}</p> : null}
                  </div>
                ) : null}

                {activeTab === "login" ? (
                  <>
                    <form className="auth-form" onSubmit={submitLogin}>
                      <div>
                        <label className="form-label mb-1">{authCopy.usernameOrEmail}</label>
                        <input
                          className="form-control"
                          type="text"
                          autoComplete="username"
                          required
                          placeholder={authCopy.usernameOrEmailPlaceholder}
                          value={loginForm.identifier}
                          onChange={(event) =>
                            setLoginForm((prev) => ({ ...prev, identifier: event.target.value }))
                          }
                        />
                      </div>

                      <AuthPasswordField
                        label={authCopy.password}
                        value={loginForm.password}
                        placeholder={authCopy.passwordPlaceholder}
                        autoComplete="current-password"
                        visible={passwordVisibility.login}
                        showLabel={authCopy.showPassword}
                        hideLabel={authCopy.hidePassword}
                        onToggleVisibility={() => togglePasswordVisibility("login")}
                        onChange={(event) =>
                          setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                      />

                      <div className="auth-inline-row">
                        <button
                          className="auth-link-button"
                          type="button"
                          onClick={() => setShowForgot((prev) => !prev)}
                        >
                          {showForgot ? authCopy.hideForgot : authCopy.forgotToggle}
                        </button>
                      </div>

                      <button className="btn btn-primary w-100" disabled={busy} type="submit">
                        {busy ? authCopy.loginSubmitting : authCopy.loginTab}
                      </button>
                    </form>

                    {showForgot ? (
                      <div className="auth-secondary-card">
                        <div>
                          <h3>{authCopy.forgotTitle}</h3>
                          <p className="muted">{authCopy.forgotHint}</p>
                        </div>
                        <form className="auth-form" onSubmit={submitForgot}>
                          <div>
                            <label className="form-label mb-1">{authCopy.email}</label>
                            <input
                              className="form-control"
                              type="email"
                              autoComplete="email"
                              required
                              placeholder={authCopy.emailPlaceholder}
                              value={forgotEmail}
                              onChange={(event) => setForgotEmail(event.target.value)}
                            />
                          </div>
                          <button className="btn btn-secondary w-100" disabled={busy} type="submit">
                            {busy ? authCopy.forgotSubmitting : authCopy.sendReset}
                          </button>
                        </form>
                      </div>
                    ) : null}

                    <p className="auth-footnote">
                      {authCopy.noAccount}{" "}
                      <button className="auth-link-button" type="button" onClick={() => switchTab("register")}>
                        {authCopy.switchToRegister}
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <form className="auth-form" onSubmit={submitRegister}>
                      <div className="auth-form-row">
                        <div>
                          <label className="form-label mb-1">{authCopy.name}</label>
                          <input
                            className="form-control"
                            autoComplete="name"
                            required
                            placeholder={authCopy.namePlaceholder}
                            value={registerForm.name}
                            onChange={(event) =>
                              setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="form-label mb-1">{authCopy.major}</label>
                          <input
                            className="form-control"
                            list="auth-major-suggestions"
                            placeholder={authCopy.majorPlaceholder}
                            value={registerForm.major}
                            onChange={(event) =>
                              setRegisterForm((prev) => ({ ...prev, major: event.target.value }))
                            }
                          />
                          <p className="field-hint">{authCopy.majorHint}</p>
                        </div>
                      </div>

                      <div>
                        <label className="form-label mb-1">{authCopy.email}</label>
                        <input
                          className="form-control"
                          type="email"
                          autoComplete="email"
                          required
                          placeholder={authCopy.emailPlaceholder}
                          value={registerForm.email}
                          onChange={(event) =>
                            setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                          }
                        />
                        <p className={`field-hint ${academicEmailHint.tone}`}>{academicEmailHint.message}</p>
                      </div>

                      <div>
                        <label className="form-label mb-1">{authCopy.trackedCourseCodesLabel}</label>
                        <input
                          className="form-control"
                          list="auth-course-code-suggestions"
                          placeholder={authCopy.trackedCourseCodesPlaceholder}
                          value={registerForm.trackedCourseCodes}
                          onChange={(event) =>
                            setRegisterForm((prev) => ({
                              ...prev,
                              trackedCourseCodes: event.target.value,
                            }))
                          }
                        />
                        <p className="field-hint">{authCopy.trackedCourseCodesHint}</p>
                        {trackedCourseCodesPreview.length ? (
                          <div className="auth-chip-stack">
                            <span className="auth-chip-label">{authCopy.trackedCourseCodesPreview}</span>
                            <div className="auth-chip-list">
                              {trackedCourseCodesPreview.map((item) => (
                                <span key={item} className="auth-chip">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="auth-form-row">
                        <AuthPasswordField
                          label={authCopy.password}
                          value={registerForm.password}
                          placeholder={authCopy.createPasswordPlaceholder}
                          minLength={6}
                          autoComplete="new-password"
                          visible={passwordVisibility.register}
                          showLabel={authCopy.showPassword}
                          hideLabel={authCopy.hidePassword}
                          onToggleVisibility={() => togglePasswordVisibility("register")}
                          onChange={(event) =>
                            setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                          }
                        />
                        <AuthPasswordField
                          label={authCopy.confirmPassword}
                          value={registerForm.confirmPassword}
                          placeholder={authCopy.confirmPasswordPlaceholder}
                          minLength={6}
                          autoComplete="new-password"
                          visible={passwordVisibility.confirm}
                          showLabel={authCopy.showPassword}
                          hideLabel={authCopy.hidePassword}
                          onToggleVisibility={() => togglePasswordVisibility("confirm")}
                          onChange={(event) =>
                            setRegisterForm((prev) => ({
                              ...prev,
                              confirmPassword: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="auth-password-strength">
                        <div className="auth-password-strength-head">
                          <span>{authCopy.passwordStrengthLabel}</span>
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

                      <button className="btn btn-primary w-100" disabled={busy} type="submit">
                        {busy ? authCopy.registerSubmitting : authCopy.registerTab}
                      </button>
                    </form>

                    <p className="auth-footnote">
                      {authCopy.haveAccount}{" "}
                      <button className="auth-link-button" type="button" onClick={() => switchTab("login")}>
                        {authCopy.switchToLogin}
                      </button>
                    </p>
                  </>
                )}
              </div>
            </section>
          </div>

          <datalist id="auth-major-suggestions">
            {majorSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          <datalist id="auth-course-code-suggestions">
            {courseCodeSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </section>
      </section>
    </main>
  );
}

export default AuthPage;
