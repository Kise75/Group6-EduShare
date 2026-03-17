import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";

function DisplayPreferences() {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="display-preferences">
      <div className="segmented-control" role="group" aria-label={t("preferences.language")}>
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

      <div className="segmented-control" role="group" aria-label={t("preferences.theme")}>
        <button
          type="button"
          className={theme === "light" ? "active" : ""}
          onClick={() => setTheme("light")}
        >
          {t("preferences.light")}
        </button>
        <button
          type="button"
          className={theme === "dark" ? "active" : ""}
          onClick={() => setTheme("dark")}
        >
          {t("preferences.dark")}
        </button>
      </div>
    </div>
  );
}

export default DisplayPreferences;
