// assets/js/index.js
(function init_index_page() {
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
      index = clamp(index, 0, slides.length - 1);
      track.style.transform = `translateX(${-index * 100}%)`;

      const dots = Array.from(dots_root.querySelectorAll(".carousel-dot"));
      dots.forEach((d, i) => {
        if (i === index) d.classList.add("is-active");
        else d.classList.remove("is-active");
      });

      prev_btn.disabled = index === 0;
      next_btn.disabled = index === slides.length - 1;
    }

    prev_btn.addEventListener("click", () => {
      index -= 1;
      update();
    });

    next_btn.addEventListener("click", () => {
      index += 1;
      update();
    });

    // поддержка свайпа мышью/тачем (минимально)
    let start_x = 0;
    let is_down = false;

    const viewport = root.querySelector("[data-carousel-viewport]");

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

    render_dots();
    update();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const carousels = document.querySelectorAll("[data-carousel]");
    carousels.forEach((c) => setup_carousel(c));
  });
})();
