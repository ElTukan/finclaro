/* FinClaro - consentimiento de cookies.
   Sin dependencias. Guarda la decision en cookie y localStorage durante 1 ano.
   AdSense y Google Analytics solo se cargan tras aceptar. */
(function () {
  "use strict";

  var COOKIE_NAME = "finclaro_consent";
  var COOKIE_AGE = 31536000; // 1 ano
  var ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2993676855543434";
  var GTAG_SRC = "https://www.googletagmanager.com/gtag/js?id=G-ECDR680DVZ";
  var GA_ID = "G-ECDR680DVZ";

  function readCookie() {
    var parts = document.cookie ? document.cookie.split(";") : [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].replace(/^\s+/, "");
      if (part.indexOf(COOKIE_NAME + "=") === 0) {
        return decodeURIComponent(part.slice(COOKIE_NAME.length + 1));
      }
    }
    return null;
  }

  function writeCookie(value) {
    document.cookie = COOKIE_NAME + "=" + encodeURIComponent(value) +
      "; Max-Age=" + COOKIE_AGE + "; Path=/; SameSite=Lax";
  }

  function clearCookie() {
    document.cookie = COOKIE_NAME + "=; Max-Age=0; Path=/; SameSite=Lax";
  }

  function readStorage() {
    try {
      var value = window.localStorage.getItem(COOKIE_NAME);
      return value === "accepted" || value === "rejected" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function readDecision() {
    var cookie = readCookie();
    if (cookie === "accepted" || cookie === "rejected") return cookie;
    var stored = readStorage();
    if (stored) {
      writeCookie(stored);
      return stored;
    }
    return null;
  }

  function saveDecision(value) {
    writeCookie(value);
    try { window.localStorage.setItem(COOKIE_NAME, value); } catch (e) {}
  }

  function clearDecision() {
    clearCookie();
    try { window.localStorage.removeItem(COOKIE_NAME); } catch (e) {}
  }

  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function () { window.dataLayer.push(arguments); };
    }
  }

  function setConsent(state) {
    ensureGtag();
    window.gtag("consent", state, {
      ad_storage: state === "update" ? "granted" : "denied",
      ad_user_data: state === "update" ? "granted" : "denied",
      ad_personalization: state === "update" ? "granted" : "denied",
      analytics_storage: state === "update" ? "granted" : "denied",
      functionality_storage: "granted",
      security_storage: "granted"
    });
  }

  function loadScript(src, marker, crossOrigin) {
    var scripts = document.querySelectorAll("script[src]");
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf(src.split("?")[0]) === 0) return;
    }
    var script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.setAttribute(marker, "1");
    if (crossOrigin) script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }

  function grant() {
    ensureGtag();
    window.gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
      functionality_storage: "granted",
      security_storage: "granted"
    });
    loadScript(GTAG_SRC, "data-finclaro-gtag");
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    loadScript(ADSENSE_SRC, "data-finclaro-adsense", true);
  }

  function buildBanner() {
    if (document.getElementById("fc-consent-banner")) return;

    var style = document.createElement("style");
    style.id = "fc-consent-style";
    style.textContent = [
      "#fc-consent-banner{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#FFFFFF;color:#11151A;border-top:1px solid #E0DCD1;box-shadow:0 -6px 24px rgba(14,18,24,.10);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;padding:14px 20px;}",
      "#fc-consent-banner .fc-consent-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}",
      "#fc-consent-banner p{margin:0;font-size:13px;line-height:1.55;color:#2A2F38;max-width:760px;}",
      "#fc-consent-banner a{color:#083D32;text-decoration:underline;text-underline-offset:2px;}",
      "#fc-consent-banner .fc-consent-actions{display:flex;gap:8px;flex-shrink:0;}",
      "#fc-consent-banner button{font:inherit;font-size:13px;font-weight:600;line-height:1;padding:10px 16px;border-radius:6px;cursor:pointer;}",
      "#fc-consent-banner .fc-consent-accept{background:#083D32;color:#FFFFFF;border:1px solid #083D32;}",
      "#fc-consent-banner .fc-consent-accept:hover{background:#0C5446;border-color:#0C5446;}",
      "#fc-consent-banner .fc-consent-reject{background:#FFFFFF;color:#11151A;border:1px solid #C9C4B8;}",
      "#fc-consent-banner .fc-consent-reject:hover{background:#F3F1EB;}",
      "#fc-consent-banner button:focus-visible{outline:2px solid #A87C38;outline-offset:2px;}",
      "@media (max-width:640px){#fc-consent-banner{padding:14px 16px;}#fc-consent-banner .fc-consent-inner{flex-direction:column;align-items:stretch;}#fc-consent-banner .fc-consent-actions{flex-direction:column;}#fc-consent-banner button{width:100%;}}"
    ].join("");
    document.head.appendChild(style);

    var banner = document.createElement("div");
    banner.id = "fc-consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Consentimiento de cookies");
    banner.innerHTML = '<div class="fc-consent-inner">' +
      '<p>Usamos cookies necesarias para que el sitio funcione y, solo si lo aceptas, cookies de Google Analytics y Google AdSense para medir visitas y mostrar publicidad. Puedes cambiar tu decisión cuando quieras en <a href="/cookies.html">Cookies</a>.</p>' +
      '<div class="fc-consent-actions">' +
      '<button type="button" class="fc-consent-accept">Aceptar</button>' +
      '<button type="button" class="fc-consent-reject">Solo necesarias</button>' +
      '</div></div>';

    banner.querySelector(".fc-consent-accept").addEventListener("click", function () {
      saveDecision("accepted");
      grant();
      banner.parentNode.removeChild(banner);
    });

    banner.querySelector(".fc-consent-reject").addEventListener("click", function () {
      saveDecision("rejected");
      banner.parentNode.removeChild(banner);
    });

    document.body.appendChild(banner);
  }

  var decision = readDecision();

  // Consent Mode: por defecto denegado mientras no haya una decision guardada.
  if (decision !== "accepted") {
    setConsent("default");
  } else {
    grant();
  }

  window.finclaroConsent = {
    get: function () { return readDecision(); },
    reset: function () {
      clearDecision();
      window.location.reload();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (!readDecision()) buildBanner();
    });
  } else if (!readDecision()) {
    buildBanner();
  }
})();
