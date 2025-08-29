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
    const sel = $("#lang");
    if (sel && sel.value !== current) sel.value = current;
  }

  function initSelector() {
    const sel = $("#lang");
    if (!sel) return;
    sel.value = current;
    sel.addEventListener("change", () => set(sel.value));
  }

  return { load, set, initSelector };
})();

// Carousel with synchronized autoplay

function initCarousels(){
  const controllers = []; // collect per-carousel controllers so we can drive them in sync

  $$(".crsl").forEach(c => {
    const track = c.querySelector("[data-crsl-track]") || c.querySelector(".crsl__track");
    const slides = Array.from(track ? track.querySelectorAll(".crsl__slide") : []);
    const prev = c.querySelector("[data-crsl-prev]") || c.querySelector(".crsl__btn--prev");
    const nextBtn = c.querySelector("[data-crsl-next]") || c.querySelector(".crsl__btn--next");
    const dotsWrap = c.querySelector("[data-crsl-dots]") || c.querySelector(".crsl__dots");

    if (!track || !slides.length) return;

    // Create dots dynamically if none exist
    let dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "crsl__dot";
        b.setAttribute("aria-label", `Slide ${idx+1}`);
        b.setAttribute("aria-current", "false");
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    let i = Math.max(0, slides.findIndex(s => s.classList.contains("is-active")));
    if (i < 0) i = 0;

    // core setter
    const setActive = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
      if (dots.length) {
        dots.forEach((d, idx) => d.setAttribute("aria-current", idx === i ? "true" : "false"));
      }
      track.style.transition = "transform .45s ease";
      track.style.transform = `translateX(${-i * 100}%)`;
    };

    // local next/prev so the controller can advance this carousel
    const next = () => setActive(i + 1);
    const prevFn = () => setActive(i - 1);

    // button clicks
    if (prev) prev.addEventListener("click", prevFn);
    if (nextBtn) nextBtn.addEventListener("click", next);
    if (dots.length) dots.forEach((d, idx) => d.addEventListener("click", () => setActive(idx)));

    // keyboard support
    c.setAttribute("tabindex","0");
    c.addEventListener("keydown", (e)=>{
      if(e.key === "ArrowLeft") prev && prev.click();
      if(e.key === "ArrowRight") nextBtn && nextBtn.click();
    });

    // swipe via pointer events only (works for touch + pen + mouse)
    let startX = 0, currentX = 0, dragging = false;
    const threshold = 40; // px to trigger a slide
    const width = () => c.clientWidth || 1;

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return; // left button only
      dragging = true;
      startX = currentX = e.clientX;
      track.style.transition = 'none';
      try { c.setPointerCapture(e.pointerId); } catch(_) {}
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      currentX = e.clientX;
      const delta = currentX - startX;
      const pct = (delta / width()) * 100;
      track.style.transform = `translateX(${-(i * 100) + pct}%)`;
      e.preventDefault(); // tell the browser we're handling horizontal panning
    };
    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      try { c.releasePointerCapture(e.pointerId); } catch(_) {}
      const delta = currentX - startX;
      if (Math.abs(delta) > threshold) {
        setActive(delta < 0 ? i + 1 : i - 1);
      } else {
        track.style.transition = 'transform .3s ease';
        track.style.transform = `translateX(${-i * 100}%)`;
      }
    };

    c.addEventListener('pointerdown', onPointerDown);
    c.addEventListener('pointermove', onPointerMove, { passive: false });
    c.addEventListener('pointerup', onPointerUp);
    c.addEventListener('pointercancel', onPointerUp);

    // initialize
    setActive(i);

    // register controller for sync autoplay
    controllers.push({ next });
  });

  // Synchronized autoplay: advance all carousels together every 5s
  if (controllers.length) {
    setInterval(() => {
      controllers.forEach(ctrl => ctrl.next());
    }, 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  I18N.load();
  I18N.initSelector();
  initCarousels();
});
