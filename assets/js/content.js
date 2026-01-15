// assets/js/content.js
async function load_json(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

async function load_content() {
  const [content, works] = await Promise.all([
    load_json("/assets/data/content.json"),
    load_json("/assets/data/works.json")
  ]);

  const footer = document.querySelector("#footer-text");
  if (footer) footer.textContent = content.site.footerText;

  const home_title = document.querySelector("#home-title");
  if (home_title) home_title.textContent = content.home.title;

  const home_subtitle = document.querySelector("#home-subtitle");
  if (home_subtitle) home_subtitle.textContent = content.home.subtitle;

  const home_hero_image = document.querySelector("#home-hero-image");
  if (home_hero_image) {
    home_hero_image.src = content.home.heroImage;
    home_hero_image.alt = content.home.title;
  }

  const contacts_text = document.querySelector("#contacts-text");
  if (contacts_text) contacts_text.textContent = content.contacts.text;

  const contacts_links = document.querySelector("#contacts-links");
  if (contacts_links) {
    contacts_links.innerHTML = content.contacts.links
      .map(
        (l) => `<li><a target="_blank" rel="noopener noreferrer" href="${l.href}">${l.label}</a></li>`
      )
      .join("");
  }

  const works_grid = document.querySelector("#works-grid");
  if (works_grid) {
    works_grid.innerHTML = works.items
      .map(
        (w) => `
          <article class="card">
            <a class="card-link" href="${w.url}" target="_blank" rel="noopener noreferrer">
              <img class="card-img" src="${w.cover}" alt="${w.title}" loading="lazy" />
              <div class="card-body">
                <h3 class="card-title">${w.title}</h3>
                <p class="card-tags">${(w.tags || []).join(" · ")}</p>
              </div>
            </a>
          </article>
        `
      )
      .join("");
  }
}

window.__load_content = load_content;
