from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple

import markdown


ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"
SOURCE_MD = DOCS_DIR / "final_report_source.md"
OUTPUT_HTML = DOCS_DIR / "final_report_print.html"
OUTPUT_PDF = DOCS_DIR / "Group6_FinalReport.pdf"
DIAGRAM_DIR = DOCS_DIR / ".diagram_build"
MERMAID_CONFIG = DIAGRAM_DIR / "mermaid-config.json"
NPX_CMD = "npx.cmd" if sys.platform.startswith("win") else "npx"

CHROME_CANDIDATES = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
]


def extract_section(text: str, title: str) -> str:
    pattern = rf"## {re.escape(title)}\n\n(.*?)(?:\n---\n|\Z)"
    match = re.search(pattern, text, flags=re.S)
    return match.group(1).strip() if match else ""


def remove_section(text: str, title: str) -> str:
    pattern = rf"(^|\n)## {re.escape(title)}\n\n.*?(?=\n---\n|\Z)"
    return re.sub(pattern, "\n", text, count=1, flags=re.S)


def parse_cover(cover_text: str) -> dict:
    lines = [line.strip() for line in cover_text.splitlines() if line.strip()]
    values = {
        "ministry": lines[0] if len(lines) > 0 else "MINISTRY OF EDUCATION & TRAINING",
        "university": lines[1] if len(lines) > 1 else "HO CHI MINH CITY UNIVERSITY OF TECHNOLOGY (HUTECH)",
        "report_title": "FINAL PROJECT REPORT",
        "course": "[CAP126] - NEW PROGRAMMING LANGUAGE",
        "project_title": "",
        "lecturer": "Hannah Vu",
        "student": "Mai Tan Phat",
        "student_id": "2280602300",
        "class_name": "22DTHQA2",
        "group": "Group 6",
        "city_year": "Ho Chi Minh City, 2026",
    }

    project_match = re.search(r"\*\*Project Title:\*\*\s*\n\*\*(.*?)\*\*", cover_text, flags=re.S)
    if project_match:
        values["project_title"] = " ".join(project_match.group(1).split())

    for key, label in [
        ("lecturer", "Lecturer's name"),
        ("student", "Student's name"),
        ("student_id", "Student ID"),
        ("class_name", "Class"),
        ("group", "Group"),
    ]:
        field_match = re.search(rf"\*\*{re.escape(label)}:\*\*\s*(.+)", cover_text)
        if field_match:
            values[key] = field_match.group(1).strip()

    city_match = re.search(r"(Ho Chi Minh City,\s*20\d{2})", cover_text)
    if city_match:
        values["city_year"] = city_match.group(1).strip()

    return values


def parse_toc(toc_text: str) -> List[Tuple[str, str]]:
    entries: List[Tuple[str, str]] = []
    for raw_line in toc_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.endswith("  "):
            line = line.rstrip()
        page_match = re.search(r"(.+?)\s+(\d+)$", line)
        if page_match:
            title = page_match.group(1).replace("...", "").strip()
            page = page_match.group(2)
            entries.append((title, page))
        else:
            entries.append((line, ""))
    return entries


def render_cover(cover: dict) -> str:
    return f"""
    <section class="cover-page">
      <div class="cover-frame">
        <div class="cover-top">
          <div class="brand-block">
            <div class="brand-shield"></div>
            <div class="brand-text">
              <div class="brand-main">HUTECH</div>
              <div class="brand-sub">Ho Chi Minh City University of Technology</div>
            </div>
          </div>
          <div class="cover-header">
            <div>{cover['ministry']}</div>
            <div class="cover-header-strong">{cover['university']}</div>
          </div>
        </div>

        <div class="cover-center">
          <div class="cover-report-title">{cover['report_title']}</div>
          <div class="cover-course">{cover['course']}</div>
          <div class="cover-project-title">{cover['project_title']}</div>
        </div>

        <div class="cover-info">
          <div class="cover-info-row"><span>Lecturer's name:</span> <strong>{cover['lecturer']}</strong></div>
          <div class="cover-info-title">Student's information:</div>
          <div class="cover-student-row">
            <span class="cover-student-index">1.</span>
            <span class="cover-student-name">{cover['student']}</span>
            <span class="cover-student-id">ID: {cover['student_id']}</span>
            <span class="cover-student-class">Class: {cover['class_name']}</span>
          </div>
          <div class="cover-info-row"><span>Group:</span> <strong>{cover['group']}</strong></div>
        </div>

        <div class="cover-bottom">{cover['city_year']}</div>
      </div>
    </section>
    """


def render_toc(entries: List[Tuple[str, str]]) -> str:
    rows = []
    for title, page in entries:
        rows.append(
            f"""
            <div class="toc-row">
              <span class="toc-title">{title}</span>
              <span class="toc-dots"></span>
              <span class="toc-page">{page}</span>
            </div>
            """
        )
    joined_rows = "\n".join(rows)
    return f"""
    <section class="toc-sheet">
      <div class="toc-frame">
        <div class="toc-heading">TABLE OF CONTENTS</div>
        <div class="toc-list">
          {joined_rows}
        </div>
        <div class="toc-footer">1</div>
      </div>
    </section>
    """


def ensure_mermaid_config() -> Path:
    DIAGRAM_DIR.mkdir(parents=True, exist_ok=True)
    config = {
        "theme": "neutral",
        "fontFamily": "Times New Roman",
        "flowchart": {"curve": "linear"},
        "er": {"useMaxWidth": False},
        "securityLevel": "loose",
    }
    MERMAID_CONFIG.write_text(json.dumps(config, indent=2), encoding="utf-8")
    return MERMAID_CONFIG


def render_mermaid_block(code: str, index: int) -> str:
    config_path = ensure_mermaid_config()
    mmd_path = DIAGRAM_DIR / f"diagram_{index}.mmd"
    svg_path = DIAGRAM_DIR / f"diagram_{index}.svg"

    diagram_kind = "generic"
    width = 1400
    height = 1000

    stripped = code.strip()
    if stripped.startswith("erDiagram"):
        diagram_kind = "er"
        width = 1700
        height = 1400
    elif "subgraph EduShare System" in stripped:
        diagram_kind = "usecase"
        width = 1800
        height = 1500
    elif stripped.startswith("flowchart"):
        diagram_kind = "architecture"
        width = 1200
        height = 900

    mmd_path.write_text(stripped, encoding="utf-8")

    subprocess.run(
        [
            NPX_CMD,
            "-y",
            "@mermaid-js/mermaid-cli",
            "-i",
            str(mmd_path),
            "-o",
            str(svg_path),
            "-w",
            str(width),
            "-H",
            str(height),
            "-b",
            "white",
            "-t",
            "neutral",
            "-c",
            str(config_path),
            "-q",
        ],
        check=True,
    )

    svg_text = svg_path.read_text(encoding="utf-8")
    svg_text = re.sub(r"<\?xml[^>]*>\s*", "", svg_text)
    svg_text = re.sub(r"<!DOCTYPE[^>]*>\s*", "", svg_text)

    return f'\n<div class="diagram-svg diagram-svg-{diagram_kind}">\n{svg_text}\n</div>\n'


def render_mermaid_blocks(text: str) -> str:
    block_index = 0

    def replacer(match: re.Match[str]) -> str:
        nonlocal block_index
        block_index += 1
        return render_mermaid_block(match.group(1), block_index)

    return re.sub(r"```mermaid\n(.*?)```", replacer, text, flags=re.S)


def build_html() -> str:
    source = SOURCE_MD.read_text(encoding="utf-8")
    source = re.sub(
        r"^# FINAL PROJECT REPORT SOURCE\n\nReplace all bracketed placeholders before exporting this document to PDF\.\n\n",
        "",
        source,
        count=1,
    )

    cover_text = extract_section(source, "Cover Page")
    toc_text = extract_section(source, "Table of Contents")

    body = remove_section(source, "Cover Page")
    body = remove_section(body, "Table of Contents")
    body = body.replace("\n---\n\n## 1. Introduction", "\n\n## 1. Introduction", 1)
    body = render_mermaid_blocks(body.strip())

    cover_data = parse_cover(cover_text)
    toc_entries = parse_toc(toc_text)
    body_html = markdown.markdown(
        body,
        extensions=["tables", "fenced_code", "sane_lists", "toc"],
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Group 6 Final Report</title>
  <style>
    @page {{
      size: A4;
      margin: 2.5cm;
    }}
    body {{
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #111;
    }}
    .cover-page, .toc-sheet {{
      page-break-after: always;
    }}
    .cover-frame {{
      min-height: 24.7cm;
      border: 3px solid #173a91;
      padding: 0.9cm 1.1cm;
      box-sizing: border-box;
      position: relative;
    }}
    .cover-top {{
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }}
    .brand-block {{
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 235px;
    }}
    .brand-shield {{
      width: 46px;
      height: 56px;
      background: linear-gradient(180deg, #f3c323 0%, #f8df6a 100%);
      clip-path: polygon(50% 0%, 92% 16%, 92% 58%, 50% 100%, 8% 58%, 8% 16%);
      border: 2px solid #173a91;
      box-sizing: border-box;
    }}
    .brand-main {{
      color: #0b77c5;
      font-size: 24pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      line-height: 1;
    }}
    .brand-sub {{
      font-size: 8.5pt;
      color: #ca3a2f;
      margin-top: 2px;
    }}
    .cover-header {{
      flex: 1;
      text-align: center;
      font-size: 10.5pt;
      padding-top: 4px;
    }}
    .cover-header-strong {{
      font-weight: 700;
      margin-top: 2px;
    }}
    .cover-center {{
      text-align: center;
      margin-top: 4.8cm;
    }}
    .cover-report-title {{
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 0.6cm;
    }}
    .cover-course {{
      font-size: 11.5pt;
      font-weight: 700;
      margin-bottom: 1.1cm;
    }}
    .cover-project-title {{
      font-size: 13pt;
      font-weight: 700;
      line-height: 1.45;
      max-width: 78%;
      margin: 0 auto;
    }}
    .cover-info {{
      margin-top: 4.2cm;
      font-size: 12pt;
    }}
    .cover-info-row {{
      margin-bottom: 0.35cm;
    }}
    .cover-info-title {{
      margin: 0.35cm 0 0.2cm;
    }}
    .cover-student-row {{
      display: grid;
      grid-template-columns: 24px 1fr 150px 135px;
      gap: 12px;
      align-items: start;
      margin-bottom: 0.35cm;
    }}
    .cover-bottom {{
      position: absolute;
      bottom: 1.4cm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 14pt;
    }}
    .toc-frame {{
      min-height: 24.7cm;
      border: 1px solid #c9c9c9;
      padding: 1.2cm 1.3cm 1.2cm;
      box-sizing: border-box;
      position: relative;
    }}
    .toc-heading {{
      text-align: center;
      font-size: 16pt;
      font-weight: 700;
      margin-top: 1.2cm;
      margin-bottom: 0.7cm;
    }}
    .toc-list {{
      margin-top: 0.4cm;
      font-size: 10.5pt;
    }}
    .toc-row {{
      display: flex;
      align-items: flex-end;
      gap: 6px;
      margin: 0.16cm 0;
    }}
    .toc-title {{
      white-space: nowrap;
    }}
    .toc-dots {{
      flex: 1;
      border-bottom: 1px dotted #333;
      transform: translateY(-2px);
    }}
    .toc-page {{
      min-width: 18px;
      text-align: right;
    }}
    .toc-footer {{
      position: absolute;
      bottom: 0.85cm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9.5pt;
    }}
    h1 {{ font-size: 18pt; }}
    h2 {{ font-size: 16pt; margin-top: 1.2em; }}
    h3 {{ font-size: 14pt; margin-top: 1em; }}
    h4 {{ font-size: 12pt; margin-top: 0.8em; }}
    p, li {{
      text-align: justify;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 0.8em 0 1.2em;
      font-size: 10.5pt;
    }}
    th, td {{
      border: 1px solid #444;
      padding: 6px 8px;
      vertical-align: top;
    }}
    th {{
      background: #f0f0f0;
      text-align: left;
    }}
    code {{
      font-family: Consolas, monospace;
      font-size: 10pt;
    }}
    pre {{
      white-space: pre-wrap;
      border: 1px solid #ccc;
      padding: 10px;
      font-size: 9.5pt;
      overflow-wrap: anywhere;
      background: #fafafa;
    }}
    .diagram-svg {{
      border: 1px solid #c9c9c9;
      padding: 12px 10px;
      margin: 1em auto 1.2em;
      max-width: 94%;
      text-align: center;
      page-break-inside: avoid;
      background: #fafafa;
    }}
    .diagram-svg svg {{
      max-width: 100%;
      height: auto;
    }}
    .diagram-svg-usecase {{
      max-width: 100%;
    }}
    .diagram-svg-architecture {{
      max-width: 82%;
    }}
    .diagram-svg-er {{
      max-width: 84%;
    }}
    .report-figure {{
      margin: 1.1em 0 1.6em;
      page-break-inside: avoid;
      text-align: center;
    }}
    .report-figure img {{
      max-width: 100%;
      height: auto;
      border: 1px solid #d4d4d4;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      background: white;
    }}
    .report-figure figcaption {{
      margin-top: 0.45em;
      font-size: 10.5pt;
      font-style: italic;
      text-align: center;
    }}
    hr {{
      border: none;
      border-top: 1px solid #bbb;
      margin: 1.2em 0;
    }}
    ol, ul {{
      margin-top: 0.3em;
    }}
  </style>
</head>
<body>
  {render_cover(cover_data)}
  {render_toc(toc_entries)}
  {body_html}
</body>
</html>
"""


def find_browser() -> Path:
    for candidate in CHROME_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Chrome or Edge was not found in the expected locations.")


def write_outputs(output_pdf: Path | None = None) -> Path:
    html = build_html()
    OUTPUT_HTML.write_text(html, encoding="utf-8")

    browser = find_browser()
    target_pdf = output_pdf or OUTPUT_PDF
    subprocess.run(
        [
            str(browser),
            "--headless",
            "--disable-gpu",
            "--allow-file-access-from-files",
            "--no-pdf-header-footer",
            "--virtual-time-budget=12000",
            f"--print-to-pdf={target_pdf}",
            OUTPUT_HTML.as_uri(),
        ],
        check=True,
    )
    return target_pdf


if __name__ == "__main__":
    custom_output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
    pdf_path = write_outputs(custom_output)
    print(OUTPUT_HTML)
    print(pdf_path)
