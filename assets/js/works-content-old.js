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
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
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
    el.style.backgroundImage = url
      ? `url('${String(url).replaceAll("'", "\\'")}')`
      : "";
  }

  function render_card(item) {
    const title = item?.title ? String(item.title) : "New work";
    const subtitle = item?.subtitle ? String(item.subtitle) : "Short description...";
    const embed_url = item?.embedUrl ? String(item.embedUrl) : "";

    return `
      <article class="work-card">
        <div class="work-card-header">
          <h3 class="work-card-title">${escape_html(title)}</h3>
          <div class="work-card-subtitle">${escape_html(subtitle)}</div>
        </div>

        <div class="work-card-media">
          <iframe
            src="${escape_html(embed_url)}"
            title="${escape_html(title)}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      </article>
    `;
  }

  function render_grid(root, videos) {
    if (!root) return;
    if (!Array.isArray(videos) || videos.length === 0) {
      root.innerHTML = "";
      return;
    }
    root.innerHTML = videos.map(render_card).join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const data = await load_json(CONTENT_URL);

      set_bg_image("works-hero-bg", data?.hero?.bgImage || "");
      set_text("works-hero-title", data?.hero?.title || "My Works");
      set_text("works-hero-subtitle", data?.hero?.subtitle || "Selected projects and edits");

      const grid = document.getElementById("works-grid");
      render_grid(grid, data?.videos || []);
    } catch (err) {
      console.error(err);
    }
  });
})();
