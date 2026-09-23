// FinClaro — animaciones y detalles compartidos en todo el sitio.
// Progresivo: si algo falla, la página se ve y funciona igual (todo empieza visible).
(function(){
  "use strict";

  // Cabecera con sombra al hacer scroll
  var header = document.querySelector(".site-header");
  if(header){
    var onScroll = function(){ header.classList.toggle("scrolled", window.scrollY > 10); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Aparición progresiva de tarjetas y bloques al entrar en pantalla
  if(!reduceMotion && "IntersectionObserver" in window){
    var selector = ".card,.article-card,.topic-card,.mini,.tool-link,.feature-main,.quote,.calc-box,.tool";
    var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
    if(targets.length){
      targets.forEach(function(el){ el.classList.add("reveal"); });
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry, i){
          if(entry.isIntersecting){
            var el = entry.target;
            el.style.transitionDelay = ((i % 4) * 60) + "ms";
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      }, { threshold: .12 });
      targets.forEach(function(el){ io.observe(el); });
      // Red de seguridad: si algo no dispara, todo queda visible igualmente
      setTimeout(function(){ targets.forEach(function(el){ el.classList.add("in"); }); }, 2000);
    }
  }

  // Contadores animados para cifras destacadas (data-count-to="29")
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count-to]"));
  if(counters.length){
    var animateCounter = function(el){
      var target = parseFloat(el.getAttribute("data-count-to"));
      if(isNaN(target)) return;
      var prefix = el.getAttribute("data-count-prefix") || "";
      var suffix = el.getAttribute("data-count-suffix") || "";
      var duration = 900, start = null;
      function step(ts){
        if(start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        el.textContent = prefix + value.toLocaleString("es-ES") + suffix;
        if(progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if(!reduceMotion && "IntersectionObserver" in window){
      var cio = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){ animateCounter(entry.target); cio.unobserve(entry.target); }
        });
      }, { threshold: .4 });
      counters.forEach(function(el){ cio.observe(el); });
    }
  }
})();
