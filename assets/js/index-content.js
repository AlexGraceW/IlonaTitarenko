// assets/js/index-content.js
(function init_index_content() {
  "use strict";

  const CONTENT_URL = "/assets/data/content.json";

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

  function set_text(selector, text) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.textContent = text == null ? "" : String(text);
  }

  function set_html(selector, html) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = html;
  }

  function set_attr(selector, attr, value) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (value == null || value === "") {
      el.removeAttribute(attr);
      return;
    }
    el.setAttribute(attr, String(value));
  }

  function set_style_bg_image(selector, image_url) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (!image_url) {
      el.style.backgroundImage = "";
      return;
    }
    el.style.backgroundImage = `url('${String(image_url).replaceAll("'", "\\'")}')`;
  }

  function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  function setup_carousel(root) {
    const track = root.querySelector("[data-carousel-track]");
    const prev_btn = root.querySelector("[data-carousel-prev]");
    const next_btn = root.querySelector("[data-carousel-next]");
    const dots_root = root.querySelector("[data-carousel-dots]");
    const slides = Array.from(track.querySelectorAll(".carousel-slide"));

    let index = 0;

    function render_dots() {
      if (!dots_root) return;
      dots_root.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot" + (i === index ? " is-active" : "");
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.addEventListener("click", () => {
          index = i;
          update();
        });
        dots_root.appendChild(dot);
      });
    }

    function update() {
      index = clamp(index, 0, Math.max(0, slides.length - 1));
      if (track) track.style.transform = `translateX(${-index * 100}%)`;

      if (dots_root) {
        const dots = Array.from(dots_root.querySelectorAll(".carousel-dot"));
        dots.forEach((d, i) => {
          if (i === index) d.classList.add("is-active");
          else d.classList.remove("is-active");
        });
      }

      if (prev_btn) prev_btn.disabled = index === 0;
      if (next_btn) next_btn.disabled = index === slides.length - 1;
    }

    if (prev_btn) {
      prev_btn.addEventListener("click", () => {
        index -= 1;
        update();
      });
    }

    if (next_btn) {
      next_btn.addEventListener("click", () => {
        index += 1;
        update();
      });
    }

    const viewport = root.querySelector("[data-carousel-viewport]");
    if (viewport) {
      let start_x = 0;
      let is_down = false;

      function on_down(client_x) {
        is_down = true;
        start_x = client_x;
      }

      function on_up(client_x) {
        if (!is_down) return;
        is_down = false;

        const delta = client_x - start_x;
        const threshold = 40;

        if (delta > threshold) {
          index -= 1;
          update();
        } else if (delta < -threshold) {
          index += 1;
          update();
        }
      }

      viewport.addEventListener("mousedown", (e) => on_down(e.clientX));
      window.addEventListener("mouseup", (e) => on_up(e.clientX));

      viewport.addEventListener("touchstart", (e) => {
        if (!e.touches || e.touches.length === 0) return;
        on_down(e.touches[0].clientX);
      });

      viewport.addEventListener("touchend", (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        on_up(e.changedTouches[0].clientX);
      });
    }

    render_dots();
    update();
  }

  function mount_intro_video(slot_el, intro) {
    if (!slot_el) return;

    if (intro && intro.videoEmbedUrl) {
      const url = String(intro.videoEmbedUrl);
      slot_el.innerHTML = `
        <iframe
          src="${escape_html(url)}"
          title="${escape_html(intro.videoTitle || "Intro video")}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      `;
      return;
    }

    if (intro && intro.videoMp4Url) {
      const mp4 = String(intro.videoMp4Url);
      const poster = intro.videoPosterUrl ? String(intro.videoPosterUrl) : "";
      slot_el.innerHTML = `
        <video
          controls
          playsinline
          preload="metadata"
          ${poster ? `poster="${escape_html(poster)}"` : ""}
        >
          <source src="${escape_html(mp4)}" type="video/mp4" />
        </video>
      `;
      return;
    }

    slot_el.innerHTML = "";
  }

  function render_sections(root_el, sections) {
    if (!root_el) return;

    if (!Array.isArray(sections) || sections.length === 0) {
      root_el.innerHTML = "";
      return;
    }

    const html = sections
      .map((section, idx) => {
        const title =
          section && section.title ? String(section.title) : `Section ${idx + 1}`;
        const text_arr = Array.isArray(section && section.text) ? section.text : [];
        const images = Array.isArray(section && section.images) ? section.images : [];

        const text_html =
          text_arr.length > 0
            ? text_arr
                .map((p) => `<p class="section-paragraph">${escape_html(p)}</p>`)
                .join("")
            : "";

        const slides_html =
          images.length > 0
            ? images
                .map((src, i) => {
                  const safe_src = escape_html(src);
                  const alt = escape_html(`${title} image ${i + 1}`);
                  return `<img class="carousel-slide" src="${safe_src}" alt="${alt}" loading="lazy" />`;
                })
                .join("")
            : `<div class="carousel-empty">No images</div>`;

        const divider_html = idx < sections.length - 1 ? `<hr class="divider subtle" />` : "";

        return `
          <article class="content-section">
            <div class="content-section-grid">
              <div class="content-text">
                <h2 class="section-title">${escape_html(title)}</h2>
                ${text_html}
              </div>

              <div class="content-carousel">
                <div class="carousel" data-carousel>
                  <button
                    class="carousel-btn"
                    type="button"
                    data-carousel-prev
                    aria-label="Previous"
                  >‹</button>

                  <div class="carousel-viewport" data-carousel-viewport>
                    <div class="carousel-track" data-carousel-track>
                      ${slides_html}
                    </div>
                  </div>

                  <button
                    class="carousel-btn"
                    type="button"
                    data-carousel-next
                    aria-label="Next"
                  >›</button>

                  <div class="carousel-dots" data-carousel-dots></div>
                </div>
              </div>
            </div>
          </article>
          ${divider_html}
        `;
      })
      .join("");

    root_el.innerHTML = html;

    const carousels = root_el.querySelectorAll("[data-carousel]");
    carousels.forEach((c) => setup_carousel(c));
  }

  async function render_page() {
    const data = await load_json(CONTENT_URL);

    // Footer
    set_text("#footer-text", data?.site?.footerText || "");

    // Hero
    set_style_bg_image("#hero-bg", data?.home?.hero?.bgImage || "");
    set_attr("#hero-avatar", "src", data?.home?.hero?.avatarImage || "");
    set_text("#hero-title", data?.home?.hero?.title || "");
    set_text("#hero-subtitle", data?.home?.hero?.subtitle || "");

    // If avatar path is wrong, hide alt text inside circle
    const avatar_img = document.querySelector("#hero-avatar");
    if (avatar_img) {
      avatar_img.addEventListener(
        "error",
        () => {
          avatar_img.alt = "";
        },
        { once: true }
      );
    }

    // Intro video + About
    const intro = data?.home?.intro || {};
    const video_slot = document.querySelector("#intro-video-slot");
    mount_intro_video(video_slot, intro);

    set_text("#about-title", intro.aboutTitle || "About");

    const about_text = Array.isArray(intro.aboutText) ? intro.aboutText : [];
    set_html(
      "#about-text",
      about_text.map((p) => `<p class="about-text">${escape_html(p)}</p>`).join("")
    );

    // Sections
    const sections_root = document.querySelector("#sections-root");
    render_sections(sections_root, data?.home?.sections || []);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await render_page();
    } catch (err) {
      console.error(err);
    }
  });
})();
