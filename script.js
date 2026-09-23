/* Gaurav Tiwari · profile site
   Progressive-enhancement script. The page is fully readable without it. */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* =====================================================
     Theme
     ===================================================== */
  function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function applyTheme(t) {
    if (t === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    try { localStorage.setItem("theme", t); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent("themechange"));
  }
  function toggleTheme() { applyTheme(currentTheme() === "dark" ? "light" : "dark"); }
  var themeBtn = $(".theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  /* =====================================================
     Toast
     ===================================================== */
  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-shown"); }, 2200);
  }

  /* =====================================================
     Clipboard helper
     ===================================================== */
  function copyText(text, onDone) {
    var fallback = function () {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.position = "absolute"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
      onDone && onDone();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onDone || function () {}, fallback);
    } else fallback();
  }

  /* =====================================================
     Header: scroll state, progress bar, active section, back-to-top
     ===================================================== */
  var header = $(".site-header"), progress = $(".progress"), toTop = $(".to-top");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    if (toTop) toTop.classList.toggle("is-shown", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  var navLinks = $$("[data-nav]");
  var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var activeId = null;
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activeId = en.target.id;
      });
      navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + activeId); });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { secObs.observe(s); });
  }

  /* =====================================================
     Mobile nav
     ===================================================== */
  var navToggle = $(".nav-toggle"), navList = $("#nav-links");
  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      var open = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("a", navList).forEach(function (a) {
      a.addEventListener("click", function () {
        navList.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* =====================================================
     Reveal on scroll
     ===================================================== */
  var revealEls = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); revObs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { revObs.observe(el); });
  }

  /* =====================================================
     Hero: rotating phrase (typewriter)
     ===================================================== */
  var rot = $(".rotator");
  if (rot) {
    var phrases = [];
    try { phrases = JSON.parse(rot.getAttribute("data-phrases").replace(/&amp;/g, "&")); } catch (e) { phrases = [rot.textContent]; }
    if (reduceMotion || phrases.length < 2) {
      rot.textContent = phrases[0] || rot.textContent;
      var caret = $(".caret"); if (caret) caret.style.display = "none";
    } else {
      var pi = 0, ci = phrases[0].length, deleting = false;
      var tick = function () {
        var word = phrases[pi];
        if (!deleting) {
          ci++;
          rot.textContent = word.slice(0, ci);
          if (ci >= word.length) { deleting = true; return setTimeout(tick, 2200); }
          return setTimeout(tick, 55 + Math.random() * 40);
        }
        ci--;
        rot.textContent = word.slice(0, ci);
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; return setTimeout(tick, 350); }
        return setTimeout(tick, 28);
      };
      setTimeout(tick, 1800);
    }
  }

  /* =====================================================
     Hero: network canvas (nodes + edges, reacts to pointer)
     ===================================================== */
  (function heroCanvas() {
    var canvas = $(".hero-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var wrap = canvas.parentElement;
    var W = 0, H = 0, dpr = 1, nodes = [], mouse = { x: -9999, y: -9999 }, raf = null, visible = true;
    var colors = {};

    function readColors() {
      var cs = getComputedStyle(root);
      colors.a = cs.getPropertyValue("--accent").trim() || "#3f3bd1";
      colors.b = cs.getPropertyValue("--accent-2").trim() || "#0f8f86";
      colors.dark = currentTheme() === "dark";
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth; H = wrap.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(22, Math.min(60, Math.round((W * H) / 22000)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
          r: 1 + Math.random() * 1.4, hue: Math.random() < .8 ? "a" : "b"
        });
      }
    }
    function hexToRgb(hex) {
      hex = hex.replace("#", "");
      if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
      var n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rgba(hex, a) { var c = hexToRgb(hex); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var linkDist = 120, i, j, a, b;
      var baseAlpha = colors.dark ? .32 : .26;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          var dx = a.x - mouse.x, dy = a.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 160 * 160 && d2 > 0) {
            var f = (160 - Math.sqrt(d2)) / 160 * .06;
            a.vx += dx / Math.sqrt(d2) * f; a.vy += dy / Math.sqrt(d2) * f;
          }
          a.vx *= .985; a.vy *= .985;
          if (a.x < -10) a.x = W + 10; if (a.x > W + 10) a.x = -10;
          if (a.y < -10) a.y = H + 10; if (a.y > H + 10) a.y = -10;
        }
      }
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          var ddx = a.x - b.x, ddy = a.y - b.y, dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < linkDist) {
            var alpha = (1 - dist / linkDist) * baseAlpha * .55;
            ctx.strokeStyle = rgba(colors[a.hue], alpha);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        var md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        var glow = md < 160 ? (1 - md / 160) : 0;
        ctx.fillStyle = rgba(colors[a.hue], baseAlpha + glow * .25);
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + glow * 1.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    function loop() { if (!visible) return; draw(); if (!reduceMotion) raf = requestAnimationFrame(loop); }
    function start() { if (raf) cancelAnimationFrame(raf); raf = null; loop(); }

    readColors(); resize(); start();
    window.addEventListener("resize", function () { resize(); draw(); });
    document.addEventListener("themechange", function () { readColors(); draw(); });
    wrap.addEventListener("pointermove", function (e) { var r = wrap.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    wrap.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(wrap);
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) { visible = false; } else { visible = true; start(); } });
  })();

  /* =====================================================
     Counters
     ===================================================== */
  (function counters() {
    var els = $$("[data-count], [data-count-years]");
    if (!els.length) return;
    var now = new Date();
    function target(el) {
      if (el.hasAttribute("data-count-years")) {
        var y0 = parseInt(el.getAttribute("data-count-years"), 10);
        return Math.max(1, now.getFullYear() - y0 + (now.getMonth() >= 6 ? 0 : -1));
      }
      return parseInt(el.getAttribute("data-count"), 10);
    }
    function render(el, v) {
      var sup = el.querySelector("sup");
      el.textContent = String(v);
      if (sup) el.appendChild(sup);
    }
    function animate(el) {
      var to = target(el), dur = 1300, t0 = null;
      if (reduceMotion) return render(el, to);
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        render(el, Math.round(to * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); } });
      }, { threshold: .4 });
      els.forEach(function (el) { io.observe(el); });
    } else els.forEach(animate);
  })();

  /* =====================================================
     Spotlight (cursor-following glow) + tilt cards
     ===================================================== */
  $$(".spotlight, .stat").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    $$(".tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = "perspective(900px) rotateX(" + (-py * 6) + "deg) rotateY(" + (px * 8) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* =====================================================
     Publications: search, type, year, topic, chart, copy citation
     ===================================================== */
  (function publications() {
    var list = $("#pub-list");
    if (!list) return;
    var pubs = $$(".pub", list);
    var search = $("#pub-search"), searchWrap = search && search.closest(".search"), clearBtn = searchWrap && $(".clear", searchWrap);
    var typeBtns = $$(".segmented [data-type]");
    var yearChips = $$(".pub-filters [data-year]");
    var tagChip = $("#active-tag"), tagName = tagChip && $(".tag-name", tagChip);
    var countEl = $("#pub-count"), emptyEl = $("#pub-empty"), resetBtn = $("#pub-reset");
    var chart = $("#pub-chart"), cloud = $("#topic-cloud");

    var state = { q: "", type: "all", year: "all", tag: null };

    /* Build per-pub tag lists, action buttons, and cache searchable text */
    var tagCounts = {};
    pubs.forEach(function (p) {
      var tags = (p.getAttribute("data-tags") || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
      p._tags = tags;
      tags.forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      var ul = $(".pub-tags", p);
      if (ul) {
        tags.forEach(function (t) {
          var li = document.createElement("li");
          li.textContent = t; li.setAttribute("role", "button"); li.tabIndex = 0; li.title = "Filter by " + t;
          li.addEventListener("click", function () { setTag(t); });
          li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTag(t); } });
          ul.appendChild(li);
        });
      }
      var titleEl = $("h3 a", p), authorsEl = $(".pub-authors", p), venueEl = $(".pub-venue", p);
      p._title = titleEl ? titleEl.textContent.trim() : "";
      p._authors = authorsEl ? authorsEl.textContent.trim() : "";
      p._venue = venueEl ? venueEl.textContent.trim() : "";
      p._text = (p._title + " " + p._authors + " " + p._venue + " " + tags.join(" ")).toLowerCase();
      p._orig = { title: titleEl ? titleEl.innerHTML : "", authors: authorsEl ? authorsEl.innerHTML : "", venue: venueEl ? venueEl.innerHTML : "" };

      var actions = $(".pub-actions", p);
      if (actions) {
        var copy = document.createElement("button");
        copy.type = "button";
        copy.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Cite</span>';
        copy.title = "Copy citation";
        copy.addEventListener("click", function () {
          var cite = p._authors + " " + p._title + ". " + p._venue + ".";
          copyText(cite, function () {
            copy.classList.add("is-copied"); $("span", copy).textContent = "Copied";
            toast("Citation copied to clipboard");
            setTimeout(function () { copy.classList.remove("is-copied"); $("span", copy).textContent = "Cite"; }, 1600);
          });
        });
        actions.appendChild(copy);
        if (titleEl && titleEl.href) {
          var open = document.createElement("a");
          open.href = titleEl.href; open.target = "_blank"; open.rel = "noopener noreferrer";
          open.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg><span>Open</span>';
          actions.appendChild(open);
        }
      }
    });

    /* Topic cloud */
    var topicBtns = [];
    if (cloud) {
      Object.keys(tagCounts).sort(function (a, b) { return tagCounts[b] - tagCounts[a] || a.localeCompare(b); }).forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = t + " · " + tagCounts[t]; b.setAttribute("data-tag", t);
        b.addEventListener("click", function () { setTag(state.tag === t ? null : t, true); });
        cloud.appendChild(b); topicBtns.push(b);
      });
    }

    /* Chart */
    var bars = [];
    if (chart) {
      var years = {};
      pubs.forEach(function (p) { var y = p.getAttribute("data-year"); years[y] = (years[y] || 0) + 1; });
      var keys = Object.keys(years).sort();
      var max = Math.max.apply(null, keys.map(function (k) { return years[k]; }));
      var w = 200, h = 120, padB = 22, padT = 16, gap = 10;
      var bw = (w - gap * (keys.length + 1)) / keys.length;
      var svgNS = "http://www.w3.org/2000/svg";
      keys.forEach(function (k, i) {
        var bh = (years[k] / max) * (h - padB - padT);
        var x = gap + i * (bw + gap), y = h - padB - bh;
        var rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", x); rect.setAttribute("y", y); rect.setAttribute("width", bw); rect.setAttribute("height", bh);
        rect.setAttribute("rx", 4); rect.setAttribute("class", "bar"); rect.setAttribute("data-year", k);
        rect.setAttribute("tabindex", "0"); rect.setAttribute("role", "button");
        rect.setAttribute("aria-label", years[k] + " publications in " + k + ". Filter by this year.");
        var t = document.createElementNS(svgNS, "title"); t.textContent = years[k] + " in " + k; rect.appendChild(t);
        rect.addEventListener("click", function () { setYear(state.year === k ? "all" : k); });
        rect.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setYear(state.year === k ? "all" : k); } });
        chart.appendChild(rect); bars.push(rect);
        var lbl = document.createElementNS(svgNS, "text");
        lbl.setAttribute("x", x + bw / 2); lbl.setAttribute("y", h - 6); lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("class", "lbl"); lbl.textContent = k;
        chart.appendChild(lbl);
        var val = document.createElementNS(svgNS, "text");
        val.setAttribute("x", x + bw / 2); val.setAttribute("y", y - 4); val.setAttribute("text-anchor", "middle"); val.setAttribute("class", "val"); val.textContent = years[k];
        chart.appendChild(val);
      });
    }

    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function highlight(html, q) {
      if (!q) return html;
      // Only highlight in text nodes, not inside tags
      var re = new RegExp("(" + escapeRe(q) + ")", "ig");
      return html.split(/(<[^>]+>)/g).map(function (part) {
        return part.charAt(0) === "<" ? part : part.replace(re, "<mark>$1</mark>");
      }).join("");
    }

    function apply() {
      var q = state.q.trim().toLowerCase(), shown = 0;
      pubs.forEach(function (p) {
        var ok = (state.type === "all" || p.getAttribute("data-type") === state.type) &&
                 (state.year === "all" || p.getAttribute("data-year") === state.year) &&
                 (!state.tag || p._tags.indexOf(state.tag) !== -1) &&
                 (!q || p._text.indexOf(q) !== -1);
        p.hidden = !ok;
        if (ok) shown++;
        var t = $("h3 a", p), a = $(".pub-authors", p), v = $(".pub-venue", p);
        if (t) t.innerHTML = highlight(p._orig.title, q);
        if (a) a.innerHTML = highlight(p._orig.authors, q);
        if (v) v.innerHTML = highlight(p._orig.venue, q);
        $$(".pub-tags li", p).forEach(function (li) { li.classList.toggle("is-hot", !!state.tag && li.textContent === state.tag); });
      });
      if (countEl) countEl.textContent = shown + " of " + pubs.length;
      if (emptyEl) emptyEl.hidden = shown !== 0;
      if (list) list.style.display = shown === 0 ? "none" : "";
      yearChips.forEach(function (c) { c.classList.toggle("is-active", c.getAttribute("data-year") === state.year); });
      typeBtns.forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-type") === state.type); });
      bars.forEach(function (b) {
        var y = b.getAttribute("data-year");
        b.classList.toggle("is-active", state.year === y);
        b.classList.toggle("is-dim", state.year !== "all" && state.year !== y);
      });
      topicBtns.forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-tag") === state.tag); });
      if (tagChip) { tagChip.classList.toggle("is-shown", !!state.tag); if (tagName) tagName.textContent = state.tag || ""; }
      if (searchWrap) searchWrap.classList.toggle("has-value", !!state.q);
    }
    function setTag(t, noScroll) {
      state.tag = t; apply();
      if (t && !noScroll) {
        var sec = $("#publications");
        if (sec) sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    }
    function setYear(y) { state.year = y; apply(); }
    function reset() { state = { q: "", type: "all", year: "all", tag: null }; if (search) search.value = ""; apply(); }

    if (search) {
      search.addEventListener("input", function () { state.q = search.value; apply(); });
      search.addEventListener("keydown", function (e) { if (e.key === "Escape") { search.value = ""; state.q = ""; apply(); search.blur(); } });
    }
    if (clearBtn) clearBtn.addEventListener("click", function () { search.value = ""; state.q = ""; apply(); search.focus(); });
    typeBtns.forEach(function (b) { b.addEventListener("click", function () { state.type = b.getAttribute("data-type"); apply(); }); });
    yearChips.forEach(function (c) { c.addEventListener("click", function () { setYear(c.getAttribute("data-year")); }); });
    if (tagChip) tagChip.addEventListener("click", function () { setTag(null, true); });
    if (resetBtn) resetBtn.addEventListener("click", reset);
    $$("[data-filter-tag]").forEach(function (b) {
      b.addEventListener("click", function () { state.type = "all"; state.year = "all"; setTag(b.getAttribute("data-filter-tag")); });
    });

    /* "/" focuses search */
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        var tag = (document.activeElement && document.activeElement.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable)) return;
        e.preventDefault();
        if (search) { search.focus(); search.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
      }
    });

    apply();
  })();

  /* =====================================================
     Experience: durations
     ===================================================== */
  $$(".tl-dates[data-start]").forEach(function (el) {
    var out = el.parentElement && $("[data-duration]", el.parentElement);
    if (!out) return;
    var s = el.getAttribute("data-start").split("-"), e = el.getAttribute("data-end");
    var start = new Date(+s[0], +s[1] - 1, 1), end = e ? new Date(+e.split("-")[0], +e.split("-")[1], 0) : new Date();
    var months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    var y = Math.floor(months / 12), m = months % 12, parts = [];
    if (y) parts.push(y + (y === 1 ? " yr" : " yrs"));
    if (m) parts.push(m + (m === 1 ? " mo" : " mos"));
    out.textContent = parts.join(" ");
  });

  /* =====================================================
     Projects: filter
     ===================================================== */
  (function projects() {
    var chips = $$(".proj-filters [data-proj]"), cards = $$(".cards .card");
    if (!chips.length) return;
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var v = c.getAttribute("data-proj");
        chips.forEach(function (x) { x.classList.toggle("is-active", x === c); });
        cards.forEach(function (card) {
          var tech = (card.getAttribute("data-tech") || "").split(",").map(function (t) { return t.trim(); });
          card.hidden = !(v === "all" || tech.indexOf(v) !== -1);
        });
      });
    });
  })();

  /* =====================================================
     Skills: tabs
     ===================================================== */
  (function skills() {
    var tabs = $$(".skill-tabs [data-tab]"), panels = $$(".skill-panel");
    if (!tabs.length) return;
    function select(id) {
      tabs.forEach(function (t) { var on = t.getAttribute("data-tab") === id; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", String(on)); });
      panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === id); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t.getAttribute("data-tab")); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (!n) return;
        e.preventDefault();
        var next = tabs[(i + n + tabs.length) % tabs.length];
        next.focus(); select(next.getAttribute("data-tab"));
      });
    });
  })();

  /* =====================================================
     Email (assembled at runtime to deter harvesting)
     ===================================================== */
  var emailLink = $(".email-link"), copyBtn = $(".copy-email"), address = "";
  if (emailLink) {
    address = emailLink.getAttribute("data-u") + "@" + emailLink.getAttribute("data-d");
    var subject = emailLink.getAttribute("data-s") || "";
    emailLink.href = "mailto:" + address + (subject ? "?subject=" + encodeURIComponent(subject) : "");
    var txt = $(".email-text", emailLink);
    if (txt) txt.textContent = address;
  }
  function copyEmail() {
    if (!address) return;
    copyText(address, function () {
      toast("Email address copied");
      if (copyBtn) {
        var span = $("span", copyBtn), original = span ? span.textContent : "";
        copyBtn.classList.add("is-copied"); if (span) span.textContent = "Copied!";
        setTimeout(function () { copyBtn.classList.remove("is-copied"); if (span) span.textContent = original; }, 1800);
      }
    });
  }
  if (copyBtn) copyBtn.addEventListener("click", copyEmail);

  /* =====================================================
     Command palette (⌘K / Ctrl+K)
     ===================================================== */
  (function cmdk() {
    var dlg = $("#cmdk"), input = $("#cmdk-input"), listEl = $("#cmdk-list"), openBtn = $(".cmdk-btn");
    if (!dlg || !input || !listEl || typeof dlg.showModal !== "function") { if (openBtn) openBtn.style.display = "none"; return; }

    var ICON = {
      section: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
      link: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
      action: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-2 9h6l-6 11 2-9H7z"/></svg>',
      paper: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'
    };
    var items = [
      { g: "Sections", t: "About", h: "#about", i: "section" },
      { g: "Sections", t: "Research themes", h: "#research", i: "section" },
      { g: "Sections", t: "Publications", h: "#publications", i: "section" },
      { g: "Sections", t: "Experience", h: "#experience", i: "section" },
      { g: "Sections", t: "Projects", h: "#projects", i: "section" },
      { g: "Sections", t: "Skills", h: "#skills", i: "section" },
      { g: "Sections", t: "Education", h: "#education", i: "section" },
      { g: "Sections", t: "Contact", h: "#contact", i: "section" },
      { g: "Actions", t: "Toggle dark / light theme", i: "action", run: toggleTheme, hint: "theme" },
      { g: "Actions", t: "Copy email address", i: "action", run: copyEmail, hint: "clipboard" },
      { g: "Actions", t: "Download resume (PDF)", i: "action", run: function () { var a = document.createElement("a"); a.href = "assets/Gaurav_Tiwari_Resume.pdf"; a.download = "Gaurav_Tiwari_Resume.pdf"; document.body.appendChild(a); a.click(); a.remove(); } },
      { g: "Profiles", t: "Google Scholar", h: "https://scholar.google.com/citations?user=_j1UHCoAAAAJ&hl=en", i: "link", ext: true },
      { g: "Profiles", t: "LinkedIn", h: "https://www.linkedin.com/in/gaurav-tiwari-15031992/", i: "link", ext: true },
      { g: "Profiles", t: "GitHub", h: "https://github.com/gtiwari1992", i: "link", ext: true },
      { g: "Profiles", t: "Kaggle", h: "https://www.kaggle.com/gtiwari1992", i: "link", ext: true }
    ];
    /* Add publications as searchable items */
    $$(".pub").forEach(function (p) {
      var a = $("h3 a", p);
      if (a) items.push({ g: "Publications", t: a.textContent.trim(), h: a.href, i: "paper", ext: true, hint: p.getAttribute("data-year") });
    });

    var filtered = items, sel = 0;
    function render() {
      var q = input.value.trim().toLowerCase();
      filtered = items.filter(function (it) { return !q || it.t.toLowerCase().indexOf(q) !== -1 || it.g.toLowerCase().indexOf(q) !== -1; });
      if (q) filtered = filtered.slice(0, 14); else filtered = filtered.filter(function (it) { return it.g !== "Publications"; });
      sel = Math.min(sel, Math.max(0, filtered.length - 1));
      listEl.innerHTML = "";
      if (!filtered.length) { listEl.innerHTML = '<li class="cmdk-empty">No matches</li>'; return; }
      var lastGroup = null;
      filtered.forEach(function (it, idx) {
        if (it.g !== lastGroup) { var g = document.createElement("li"); g.className = "cmdk-group"; g.textContent = it.g; listEl.appendChild(g); lastGroup = it.g; }
        var li = document.createElement("li");
        li.className = "cmdk-item" + (idx === sel ? " is-selected" : ""); li.setAttribute("role", "option"); li.setAttribute("aria-selected", String(idx === sel));
        li.innerHTML = '<span class="ck-icon">' + ICON[it.i] + "</span><span>" + escapeHtml(it.t) + "</span>" + (it.hint ? '<span class="hint">' + escapeHtml(it.hint) + "</span>" : it.ext ? '<span class="hint">↗</span>' : "");
        li.addEventListener("click", function () { choose(it); });
        li.addEventListener("pointermove", function () { if (sel !== idx) { sel = idx; render(); } });
        listEl.appendChild(li);
      });
      var selEl = $(".is-selected", listEl); if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: "nearest" });
    }
    function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function choose(it) {
      close();
      if (it.run) return it.run();
      if (it.ext) return window.open(it.h, "_blank", "noopener");
      var target = $(it.h); if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", it.h);
    }
    function open() { input.value = ""; sel = 0; render(); dlg.showModal(); document.body.classList.add("no-scroll"); setTimeout(function () { input.focus(); }, 0); }
    function close() { if (dlg.open) dlg.close(); document.body.classList.remove("no-scroll"); }

    input.addEventListener("input", function () { sel = 0; render(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % filtered.length; render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + filtered.length) % filtered.length; render(); }
      else if (e.key === "Enter") { e.preventDefault(); if (filtered[sel]) choose(filtered[sel]); }
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener("close", function () { document.body.classList.remove("no-scroll"); });
    if (openBtn) openBtn.addEventListener("click", open);
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? close() : open(); }
    });
    if (!/Mac|iPhone|iPad/.test(navigator.platform || "")) $$("kbd").forEach(function (k) { if (k.textContent === "⌘K") k.textContent = "Ctrl K"; });
  })();

  /* =====================================================
     Footer year
     ===================================================== */
  var y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
