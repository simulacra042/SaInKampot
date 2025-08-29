<<<<<<< HEAD
// Utilities
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// i18n
const I18N = (() => {
  const STORAGE_KEY = "lang";
  let translations = {};
  let current = localStorage.getItem(STORAGE_KEY) || document.documentElement.lang || "en";

  async function load() {
    try {
      const res = await fetch("i18n/translations.json", { cache: "no-cache" });
      translations = await res.json();
      set(current, false);
    } catch (e) {
      console.error("i18n load failed", e);
    }
  }

  function set(lang, persist = true) {
    current = translations[lang] ? lang : "en";
    if (persist) localStorage.setItem(STORAGE_KEY, current);
    document.documentElement.lang = current;
    apply();
  }

  function apply() {
    $$("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = translations[current]?.[key];
      if (typeof value === "string") {
        if (el.tagName === "TITLE") { document.title = value; }
        else { el.textContent = value; }
      }
    });
    // live region announce
    const live = $("#live-region");
    if (live) { live.textContent = translations[current]?.language_changed || `Language: ${current}`; }
    // set select
    const sel = $("#lang-select");
    if (sel && sel.value !== current) sel.value = current;
  }

  function initSelector() {
    const sel = $("#lang-select");
    if (!sel) return;
    sel.value = current;
    sel.addEventListener("change", () => set(sel.value));
  }

  return { load, set, initSelector };
})();

// Carousel
function initCarousels(){
  $$(".crsl").forEach(c => {
    const track = $(".crsl__track", c);
    const slides = $$(".crsl__slide", c);
    const prev = $(".crsl__btn--prev", c);
    const next = $(".crsl__btn--next", c);
    const dots = $$(".crsl__dot", c);
    let i = slides.findIndex(s => s.classList.contains("is-active"));
    if (i < 0) i = 0;

    const setActive = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
      dots.forEach((d, idx) => {
        d.classList.toggle("is-active", idx === i);
        d.setAttribute("aria-selected", String(idx === i));
      });
      track.style.transform = `translateX(${-i * 100}%)`;
    };

    prev.addEventListener("click", () => setActive(i - 1));
    next.addEventListener("click", () => setActive(i + 1));
    dots.forEach((d, idx) => d.addEventListener("click", () => setActive(idx)));

    // Keyboard support
    c.setAttribute("tabindex","0");
    c.addEventListener("keydown", (e)=>{
      if(e.key === "ArrowLeft") prev.click();
      if(e.key === "ArrowRight") next.click();
    });

    setActive(i);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  I18N.load();
  I18N.initSelector();
  initCarousels();
});
=======
>>>>>>> parent of 7651e09 (added version)
