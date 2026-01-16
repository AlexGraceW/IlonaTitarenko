import os
import re
from pathlib import Path


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def backup_file(path: Path) -> None:
    bak = path.with_suffix(path.suffix + ".bak")
    if not bak.exists():
        bak.write_bytes(path.read_bytes())


def rel_assets_prefix_for_html(html_path: Path) -> str:
    """
    Возвращает префикс до assets из текущего html:
    - index.html -> "assets/"
    - works/index.html -> "../assets/"
    """
    depth = len(html_path.relative_to(PROJECT_ROOT).parts) - 1
    if depth <= 0:
        return "assets/"
    return "../" * depth + "assets/"


def rel_root_prefix_for_html(html_path: Path) -> str:
    """
    Относительный путь из текущего html в корень сайта:
    - index.html -> "./"
    - works/index.html -> "../"
    """
    depth = len(html_path.relative_to(PROJECT_ROOT).parts) - 1
    if depth <= 0:
        return "./"
    return "../" * depth


def fix_html_paths(html_path: Path, text: str) -> str:
    assets_prefix = rel_assets_prefix_for_html(html_path)
    root_prefix = rel_root_prefix_for_html(html_path)

    # 1) /assets/... -> assets_prefix...
    text = re.sub(r'(\b(?:href|src)=["\'])/assets/', r"\1" + assets_prefix, text)

    # 2) fetch("/assets/...") -> fetch("assets_prefix...")
    text = re.sub(r'fetch\(\s*["\']/assets/', 'fetch("' + assets_prefix, text)

    # 3) Внутренняя навигация (под GitHub Pages root-relative ломается)
    # Приводим к относительным ссылкам
    # "/" -> root_prefix
    text = re.sub(r'(\bhref=["\'])/(")', r"\1" + root_prefix + r"\2", text)

    # "/works/" и "/contacts/" -> относительные
    # works link
    if html_path.name == "index.html" and html_path.parent == PROJECT_ROOT:
        # из корня
        text = re.sub(r'(\bhref=["\'])/works/(")', r"\1works/\2", text)
        text = re.sub(r'(\bhref=["\'])/contacts/(")', r"\1contacts/\2", text)
    else:
        # из вложенных страниц
        # works/index.html: works -> "./", contacts -> "../contacts/", home -> "../"
        parts = html_path.relative_to(PROJECT_ROOT).parts
        if len(parts) >= 2 and parts[0] == "works":
            text = re.sub(r'(\bhref=["\'])/works/(")', r"\1./\2", text)
            text = re.sub(r'(\bhref=["\'])/contacts/(")', r"\1../contacts/\2", text)
            text = re.sub(r'(\bhref=["\'])/(")', r"\1../\2", text)
        elif len(parts) >= 2 and parts[0] == "contacts":
            text = re.sub(r'(\bhref=["\'])/contacts/(")', r"\1./\2", text)
            text = re.sub(r'(\bhref=["\'])/works/(")', r"\1../works/\2", text)
            text = re.sub(r'(\bhref=["\'])/(")', r"\1../\2", text)

    return text


def fix_css_paths(css_path: Path, text: str) -> str:
    """
    В CSS лучше, чтобы url(...) были относительны к assets/css/.
    Поэтому: url(/assets/...) -> url(../...)
    Также поддерживаем url("/assets/...") и url('/assets/...')
    """
    text = re.sub(r'url\(\s*([\'"]?)/assets/', r"url(\1../", text)
    return text


def fix_js_paths(js_path: Path, text: str) -> str:
    """
    JS файлы лежат в assets/js/.
    Но fetch должен быть относителен к странице, где запускается скрипт.
    У тебя works-content.js используется на /works/, contacts-content.js на /contacts/.
    Поэтому: "/assets/data/works.json" -> "../assets/data/works.json" (для вложенных страниц)
    """
    name = js_path.name.lower()

    # общий фикс /assets/... -> assets/... (на всякий)
    text = re.sub(r'(["\'])/assets/', r"\1assets/", text)

    # точечные: works/contacts content
    if name == "works-content.js":
        text = re.sub(
            r'(const\s+CONTENT_URL\s*=\s*["\'])[^"\']*(assets/data/works\.json)(["\'])',
            r"\1../\2\3",
            text,
        )
        text = re.sub(r'fetch\(\s*["\']assets/data/works\.json', 'fetch("../assets/data/works.json', text)

    if name == "contacts-content.js":
        text = re.sub(
            r'(const\s+CONTENT_URL\s*=\s*["\'])[^"\']*(assets/data/contacts\.json)(["\'])',
            r"\1../\2\3",
            text,
        )
        text = re.sub(r'fetch\(\s*["\']assets/data/contacts\.json', 'fetch("../assets/data/contacts.json', text)

    return text


def iter_files(root: Path):
    for path in root.rglob("*"):
        if path.is_file():
            yield path


def should_skip(path: Path) -> bool:
    lower = str(path).lower()
    # не трогаем бэкапы, git, node_modules и т.п.
    if lower.endswith(".bak"):
        return True
    if "/.git/" in lower or "\\.git\\" in lower:
        return True
    if "/node_modules/" in lower or "\\node_modules\\" in lower:
        return True
    return False


def process_file(path: Path) -> bool:
    if should_skip(path):
        return False

    suffix = path.suffix.lower()
    if suffix not in {".html", ".css", ".js"}:
        return False

    original = read_text(path)
    updated = original

    if suffix == ".html":
        updated = fix_html_paths(path, updated)
    elif suffix == ".css":
        updated = fix_css_paths(path, updated)
    elif suffix == ".js":
        updated = fix_js_paths(path, updated)

    if updated != original:
        backup_file(path)
        write_text(path, updated)
        print(f"UPDATED: {path}")
        return True

    return False


PROJECT_ROOT = Path(__file__).resolve().parent


def main() -> None:
    changed = 0
    for file_path in iter_files(PROJECT_ROOT):
        if process_file(file_path):
            changed += 1
    print(f"\nDone. Changed files: {changed}")
    print("Backups created as *.bak рядом с изменёнными файлами.")


if __name__ == "__main__":
    main()
