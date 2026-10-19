(() => {
  const button = document.querySelector('.fc-menu');
  const links = document.querySelector('.fc-nav-links');
  if (!button || !links) return;
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    button.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    links.classList.toggle('is-open', !open);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Abrir menú');
  }));
})();
