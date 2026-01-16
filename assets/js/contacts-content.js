// assets/js/contacts-content.js
(function init_contacts_page() {
  "use strict";

  const CONTENT_URL = "assets/data/contacts.json";

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
    el.style.backgroundImage = url ? `url('${String(url).replaceAll("'", "\\'")}')` : "";
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const data = await load_json(CONTENT_URL);

      set_bg_image("contact-hero-bg", data?.hero?.bgImage || "");
      set_text("contact-hero-title", data?.hero?.title || "Contact");
      set_text(
        "contact-hero-subtitle",
        data?.hero?.subtitle || "Tell me about your project — I’ll reply within 24 hours"
      );

      const form = document.querySelector(".contact-form");
      if (form && data?.form?.mailto) {
        form.setAttribute("action", `mailto:${String(data.form.mailto)}`);
      }
    } catch (err) {
      console.error(err);
    }
  });
})();
