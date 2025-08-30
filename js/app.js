// Minimal helpers
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Create a carousel controller for a given container.
 * Expected markup inside `c`:
 *  - .crsl__track (or [data-crsl-track])
 *  - .crsl__slide (multiple)
 *  - .crsl__dots  (optional wrapper; dots auto-generated)
 *  - .crsl__btn--prev / .crsl__btn--next (optional)
 */
function createCarousel(c){
  const track = c.querySelector("[data-crsl-track]") || c.querySelector(".crsl__track");
  const slides = Array.from(track ? track.querySelectorAll(".crsl__slide") : []);
  const prevBtn = c.querySelector("[data-crsl-prev]") || c.querySelector(".crsl__btn--prev");
  const nextBtn = c.querySelector("[data-crsl-next]") || c.querySelector(".crsl__btn--next");
  const dotsWrap = c.querySelector("[data-crsl-dots]") || c.querySelector(".crsl__dots");

  if (!track || !slides.length) return null;

  // Build dots if a container exists
  let dots = [];
  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, idx) => {
      const d = document.createElement("button");
      d.className = "crsl__dot";
      d.type = "button";
      d.setAttribute("aria-label", `Go to slide ${idx+1}`);
      d.addEventListener("click", () => setActive(idx));
      dotsWrap.appendChild(d);
      dots.push(d);
    });
  }

  let i = 0; // current index

  function setActive(nextIndex){
    // wrap-around behavior
    if (nextIndex < 0) nextIndex = slides.length - 1;
    if (nextIndex >= slides.length) nextIndex = 0;
    i = nextIndex;
    // slide
    track.style.transition = "transform .45s ease";
    track.style.transform = `translateX(${-i * 100}%)`;
    // dots
    dots.forEach((d, idx) => {
      if (idx === i) {
        d.setAttribute("aria-current", "true");
      } else {
        d.removeAttribute("aria-current");
      }
    });
  }

  // Keyboard support
  c.setAttribute("tabindex", "0");
  c.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft")  { setActive(i - 1); }
    if (e.key === "ArrowRight") { setActive(i + 1); }
  });

  // Prev/Next buttons (if present)
  prevBtn && prevBtn.addEventListener("click", () => setActive(i - 1));
  nextBtn && nextBtn.addEventListener("click", () => setActive(i + 1));

  // Pointer (touch/mouse/pen) swipe
  let dragging = false, startX = 0, currX = 0;
  const threshold = 40; // px
  const width = () => c.clientWidth || 1;

  const onPointerDown = (e) => {
    // Left mouse only; touch/pen allowed
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    startX = currX = e.clientX;
    track.style.transition = "none";
    try { c.setPointerCapture(e.pointerId); } catch(_) {}
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    currX = e.clientX;
    const delta = currX - startX;
    const pct = (delta / width()) * 100;
    track.style.transform = `translateX(${-(i * 100) + pct}%)`;
    // prevent native horizontal scroll while dragging
    e.preventDefault();
  };
  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    try { c.releasePointerCapture(e.pointerId); } catch(_) {}
    const delta = currX - startX;
    if (Math.abs(delta) > threshold) {
      setActive(delta < 0 ? i + 1 : i - 1);
    } else {
      track.style.transition = "transform .3s ease";
      track.style.transform = `translateX(${-i * 100}%)`;
    }
  };

  c.addEventListener("pointerdown", onPointerDown);
  // passive: false so preventDefault works in pointermove
  c.addEventListener("pointermove", onPointerMove, { passive: false });
  c.addEventListener("pointerup", onPointerUp);
  c.addEventListener("pointercancel", onPointerUp);

  // Initialize
  setActive(0);

  // Provide a tiny controller API
  return {
    next: () => setActive(i + 1),
    prev: () => setActive(i - 1)
  };
}

// Drive all carousels in sync every 5s (pause when tab is hidden)
function initCarousels(){
  const carousels = $$(".crsl").map(c => createCarousel(c)).filter(Boolean);
  if (!carousels.length) return;

  let timer = null;
  const start = () => {
    if (timer) return;
    timer = setInterval(() => carousels.forEach(c => c.next()), 5000);
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else start();
  });

  start();
}

document.addEventListener("DOMContentLoaded", initCarousels);
