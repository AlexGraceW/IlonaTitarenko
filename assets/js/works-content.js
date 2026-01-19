// assets/js/works-content.js
(function init_works_page() {
  "use strict";

  const CONTENT_URL = "../assets/data/works.json";

  function escape_html(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function load_json(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
  }

  function set_text(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text == null ? "" : String(text);
  }

  function set_bg_image(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.backgroundImage = url ? `url('${String(url).replaceAll("'", "\\'")}')` : "";
  }

  function with_autoplay(embedUrl) {
    // добавим autoplay, не ломая существующие параметры
    try {
      const u = new URL(embedUrl);
      u.searchParams.set("autoplay", "1");
      u.searchParams.set("playsinline", "1");
      u.searchParams.set("rel", "0");
      return u.toString();
    } catch {
      // если вдруг пришло невалидное — просто вернём как есть
      return embedUrl;
    }
  }

  function resolve_url(maybeRelative) {
    if (!maybeRelative) return "";
    try {
      return new URL(String(maybeRelative), document.baseURI).toString();
    } catch {
      return String(maybeRelative);
    }
  }

  function render_card(item) {
    const title = item?.title ? String(item.title) : "New work";
    const subtitle = item?.subtitle ? String(item.subtitle) : "Short description...";
    const embedUrl = item?.embedUrl ? String(item.embedUrl) : "";
    const posterUrl = item?.posterUrl ? String(item.posterUrl) : "";

    const posterResolved = resolve_url(posterUrl);

    // data-embed нужен для клика -> iframe
    return `
      <article class="work-card">
        <div class="work-card-header">
          <h3 class="work-card-title">${escape_html(title)}</h3>
          <div class="work-card-subtitle">${escape_html(subtitle)}</div>
        </div>

        <div class="work-card-media">
          <button
            class="video-preview"
            type="button"
            data-video-preview
            data-embed="${escape_html(embedUrl)}"
            aria-label="Play: ${escape_html(title)}"
            style="background-image: url('${escape_html(posterResolved)}');"
          >
            <span class="video-preview__play" aria-hidden="true"></span>
          </button>
        </div>
      </article>
    `;
  }

  function mount_video_preview_handlers(scope) {
  const buttons = scope.querySelectorAll("[data-video-preview]");
  buttons.forEach((btn) => {
    btn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        const embed = btn.getAttribute("data-embed") || "";
        if (!embed) return;

        const iframe = document.createElement("iframe");
        iframe.src = with_autoplay(embed);
        iframe.title = btn.getAttribute("aria-label") || "Video";
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );
        iframe.setAttribute("allowfullscreen", "");

        // чтобы iframe 100% занял media-окно
        iframe.className = "work-video-iframe";

        // КЛЮЧ: заменяем саму кнопку, а не innerHTML родителя
        btn.replaceWith(iframe);
      },
      { once: true }
    );
  });
}


  function render_grid(root, videos) {
    if (!root) return;

    if (!Array.isArray(videos) || videos.length === 0) {
      root.innerHTML = "";
      return;
    }

    root.innerHTML = videos.map(render_card).join("");
    mount_video_preview_handlers(root);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const data = await load_json(CONTENT_URL);

      // hero
      set_bg_image("works-hero-bg", data?.hero?.bgImage || "");
      set_text("works-hero-title", data?.hero?.title || "My Works");
      set_text("works-hero-subtitle", data?.hero?.subtitle || "Selected projects and edits");

      // grid
      const grid = document.getElementById("works-grid");
      render_grid(grid, data?.videos || []);
    } catch (err) {
      console.error(err);
    }
  });
})();
