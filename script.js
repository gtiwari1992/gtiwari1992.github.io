/* Gaurav Tiwari · profile site
   Small progressive-enhancement script. The page is fully readable without it. */

(function () {
  "use strict";

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) { /* private mode */ }
  var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored || (systemDark ? "dark" : "light"));

  function applyTheme(t) {
    if (t === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- publication year filter ---------- */
  var chips = document.querySelectorAll(".pub-filters .chip");
  var pubs = document.querySelectorAll(".pub");
  var empty = document.querySelector(".pub-empty");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var year = chip.getAttribute("data-year");
      chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); });
      var shown = 0;
      pubs.forEach(function (p) {
        var match = year === "all" || p.getAttribute("data-year") === year;
        p.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });

  /* ---------- email (assembled at runtime to deter harvesting) ---------- */
  var emailLink = document.querySelector(".email-link");
  var copyBtn = document.querySelector(".copy-email");
  var address = "";
  if (emailLink) {
    address = emailLink.getAttribute("data-u") + "@" + emailLink.getAttribute("data-d");
    var subject = emailLink.getAttribute("data-s") || "";
    emailLink.href = "mailto:" + address + (subject ? "?subject=" + encodeURIComponent(subject) : "");
    var txt = emailLink.querySelector(".email-text");
    if (txt) txt.textContent = address;
  }
  if (copyBtn && address) {
    copyBtn.addEventListener("click", function () {
      var done = function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.classList.add("is-copied");
        setTimeout(function () {
          copyBtn.textContent = original;
          copyBtn.classList.remove("is-copied");
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(done, function () { fallbackCopy(address); done(); });
      } else {
        fallbackCopy(address); done();
      }
    });
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "absolute"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------- footer year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
