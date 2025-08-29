/* Sa In Kampot — app.js
   - Year stamp
   - Lightweight carousel (click + swipe)
   - i18n loader (JSON) + applier with EN fallback and localStorage
*/
(function(){
  'use strict';

  // ---------- Utils ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // Cache-bust helper for GH Pages (change the version when you update translations)
  const VERSION = '2025-08-28-1';

  // ---------- Year ----------
  const y = $('#y'); if (y) y.textContent = new Date().getFullYear();

  // ---------- Carousel ----------
  function initCarousels(){
    $$('[data-crsl]').forEach(c=>{
      const track = $('[data-crsl-track]', c);
      const slides = $$('.crsl__slide', track);
      const prev = $('[data-crsl-prev]', c);
      const next = $('[data-crsl-next]', c);
      const dotsWrap = $('[data-crsl-dots]', c);
      if(!track || slides.length===0 || !prev || !next || !dotsWrap) return;

      let i = 0;

      // dots
      slides.forEach((_, idx)=>{
        const b=document.createElement('button');
        b.className='crsl__dot';
        b.setAttribute('aria-label','Go to slide '+(idx+1));
        b.addEventListener('click', ()=>go(idx));
        dotsWrap.appendChild(b);
      });

      function update(){
        track.style.transform = 'translateX('+(-i*100)+'%)';
        $$('.crsl__dot', dotsWrap).forEach((d,idx)=>d.setAttribute('aria-current', idx===i ? 'true':'false'));
      }
      function go(n){ i = (n+slides.length) % slides.length; update(); }

      prev.addEventListener('click', ()=>go(i-1));
      next.addEventListener('click', ()=>go(i+1));

      // touch
      let startX = null;
      track.addEventListener('touchstart', e=>{ startX = e.touches[0].clientX; }, {passive:true});
      track.addEventListener('touchmove', e=>{
        if(startX===null) return;
        const dx = e.touches[0].clientX - startX;
        if(Math.abs(dx) > 40){ go(i + (dx<0 ? 1 : -1)); startX=null; }
      }, {passive:true});
      track.addEventListener('touchend', ()=>{ startX=null; });

      update();
    });
  }

  // ---------- i18n ----------
  let ALL = null;       // all translations
  let CURRENT = 'en';   // current language

  function getVal(dict, key){
    if(!dict) return null;
    if(Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    return null;
  }

  function applyTranslations(lang){
    if(!ALL) return;
    const en = ALL.en || {};
    const dict = ALL[lang] || {};
    CURRENT = lang;

    // <html lang="">
    document.documentElement.lang = lang;

    // Title + meta description
    const title = getVal(dict,'_title') ?? getVal(en,'_title');
    if(title) document.title = title;
    const md = $('meta[name="description"]');
    const desc = getVal(dict,'_description') ?? getVal(en,'_description');
    if(md && desc) md.setAttribute('content', desc);

    // Text nodes
    $$('[data-i18n]').forEach(el=>{
      const key = el.dataset.i18n;
      const v = getVal(dict,key) ?? getVal(en,key);
      if(v != null){
        // Only set textContent; if you ever need HTML, change carefully.
        el.textContent = v;
      } else {
        console.warn(`[i18n] Missing key "${key}" for lang "${lang}" (and en)`);
      }
    });

    // Attribute mappings
    $$('[data-i18n-attr]').forEach(el=>{
      const map = (el.dataset.i18nAttr || '').trim();
      if(!map) return;

      // Two supported forms:
      // 1) "alt" (uses el.dataset.i18n as the key)
      // 2) "aria-label:key;title:key2"
      if(map.includes(':')){
        map.split(';').map(s=>s.trim()).filter(Boolean).forEach(pair=>{
          const [attr,key] = pair.split(':').map(s=>s.trim());
          if(!attr || !key) return;
          const v = getVal(dict,key) ?? getVal(en,key);
          if(v != null) el.setAttribute(attr, v);
          else console.warn(`[i18n] Missing key "${key}" for attr "${attr}"`);
        });
      } else {
        const attr = map; const key = el.dataset.i18n;
        if(!key){ console.warn('[i18n] data-i18n-attr without data-i18n key on', el); return; }
        const v = getVal(dict,key) ?? getVal(en,key);
        if(v != null) el.setAttribute(attr, v);
        else console.warn(`[i18n] Missing key "${key}" for attr "${attr}"`);
      }
    });

    // Reflect select UI
    const sel = $('#lang'); if(sel) sel.value = lang;

    try{ localStorage.setItem('lang', lang); }catch(e){}
  }

  async function loadTranslations(){
    try{
      const res = await fetch(`i18n/translations.json?v=${VERSION}`, {cache:'no-cache'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      ALL = await res.json();
    }catch(err){
      console.error('[i18n] Failed to load translations.json:', err);
      ALL = { en: {} }; // minimal fallback to avoid crashes
    }
  }

  function chooseInitialLang(){
    // Preference order: stored -> 'en' (per your decision)
    let stored = null;
    try{ stored = localStorage.getItem('lang'); }catch(e){}
    return stored || 'en';
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', async ()=>{
    initCarousels();

    await loadTranslations();
    applyTranslations( chooseInitialLang() );

    // language switcher
    const sel = $('#lang');
    if(sel){
      sel.addEventListener('change', e=>{
        const lang = e.target.value;
        applyTranslations(lang);
      });
    }
  });
})();
