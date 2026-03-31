from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = "http://127.0.0.1:5173"
API_BASE = "http://127.0.0.1:5000/api"
SCREENSHOT_DIR = Path(__file__).resolve().parents[1] / "docs" / "screenshots"
CHROME_BINARY = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def api_request(method: str, path: str, payload: dict | None = None, token: str | None = None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def login(identifier: str, password: str) -> dict:
    return api_request("POST", "/auth/login", {"identifier": identifier, "password": password})


def get_listing_map() -> dict[str, str]:
    payload = api_request("GET", "/listings?limit=30&page=1")
    listings = payload.get("listings", [])
    return {item["title"]: item["_id"] for item in listings}


def build_driver() -> webdriver.Chrome:
    options = Options()
    options.binary_location = str(CHROME_BINARY)
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1600,1500")
    options.add_argument("--disable-gpu")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--force-device-scale-factor=1")
    return webdriver.Chrome(options=options)


def inject_display_prefs(driver: webdriver.Chrome, token: str | None = None):
    driver.get(BASE_URL)
    driver.execute_script(
        """
        localStorage.setItem('edushare_language', 'en');
        localStorage.setItem('edushare_theme', 'light');
        localStorage.removeItem('edushare_search_history');
        localStorage.removeItem('edushare_recent_items');
        localStorage.removeItem('edushare_saved_items');
        if (arguments[0]) {
          localStorage.setItem('edushare_token', arguments[0]);
        } else {
          localStorage.removeItem('edushare_token');
        }
        """,
        token,
    )
    driver.refresh()


def tidy_page(driver: webdriver.Chrome):
    driver.execute_script(
        """
        const styleId = 'codex-report-screenshot-style';
        let style = document.getElementById(styleId);
        if (!style) {
          style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            .floating-create-button,
            .floating-create-dock,
            .leaflet-control-container,
            .user-menu-dropdown,
            .nav-search-dropdown {
              display: none !important;
            }
            html, body {
              scroll-behavior: auto !important;
            }
          `;
          document.head.appendChild(style);
        }
        document.body.style.zoom = '0.92';
        window.scrollTo(0, 0);
        """
    )


def wait_and_capture(driver: webdriver.Chrome, path: str, wait_css: str, file_name: str, extra_wait: float = 1.8):
    driver.get(f"{BASE_URL}{path}")
    WebDriverWait(driver, 25).until(EC.presence_of_element_located((By.CSS_SELECTOR, wait_css)))
    time.sleep(extra_wait)
    tidy_page(driver)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = SCREENSHOT_DIR / file_name
    driver.save_screenshot(str(output_path))
    return output_path


def fill_listing_form_for_screenshot(driver: webdriver.Chrome, output_name: str):
    driver.get(f"{BASE_URL}/listing/new")
    WebDriverWait(driver, 25).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".form-with-sidebar"))
    )
    time.sleep(1.5)

    title_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='e.g. Calculus Textbook for Sale']")
    description_input = driver.find_element(
        By.CSS_SELECTOR, "textarea[placeholder='Describe condition, included notes, and meetup preference.']"
    )
    course_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='e.g. MATH101']")
    edition_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='8th Edition']")
    price_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='e.g. 120000']")

    for element, value in [
        (title_input, "Calculus Textbook"),
        (description_input, "Early transcendentals textbook in good condition with some highlights."),
        (course_input, "MATH101"),
        (edition_input, "8th Edition"),
        (price_input, "180000"),
    ]:
        element.clear()
        element.send_keys(value)

    WebDriverWait(driver, 25).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Smart Price Suggestion')]"))
    )
    WebDriverWait(driver, 25).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Use Midpoint')]"))
    )
    time.sleep(2.0)
    tidy_page(driver)
    output_path = SCREENSHOT_DIR / output_name
    driver.save_screenshot(str(output_path))
    return output_path


def main():
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    user_auth = login("phuong@edushare.dev", "123456")
    admin_auth = login("admin", "123456")
    listings = get_listing_map()

    detail_listing_id = listings["Programming Fundamentals Book"]
    chemistry_id = listings["Chemistry Lab Kit"]

    driver = build_driver()
    try:
        inject_display_prefs(driver, user_auth["token"])

        wait_and_capture(driver, "/", ".market-hero", "home_page.png", extra_wait=2.2)
        wait_and_capture(
            driver,
            f"/search?q={urllib.parse.quote('calculus')}",
            ".search-layout",
            "search_page.png",
            extra_wait=2.0,
        )
        wait_and_capture(driver, f"/listing/{detail_listing_id}", ".detail-layout", "listing_detail.png", extra_wait=2.2)
        fill_listing_form_for_screenshot(driver, "listing_form_pricing.png")
        wait_and_capture(driver, "/messages", ".chat-layout", "messages_page.png", extra_wait=2.3)
        wait_and_capture(driver, f"/meetup/{chemistry_id}", ".meetup-layout", "meetup_page.png", extra_wait=3.5)

        inject_display_prefs(driver, admin_auth["token"])
        wait_and_capture(driver, "/admin", ".admin-summary-grid", "admin_dashboard.png", extra_wait=2.5)
    finally:
        driver.quit()

    for path in sorted(SCREENSHOT_DIR.glob("*.png")):
        print(path)


if __name__ == "__main__":
    main()
