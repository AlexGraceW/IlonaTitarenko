// assets/js/app.js
(function init() {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await window.__load_content();
    } catch (err) {
      // без console.log — минимально, но информативно
      console.error(err);
    }
  });
})();
