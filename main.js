document.addEventListener('DOMContentLoaded', () => {
  // navbar toggle
  const btns = document.querySelectorAll('#nav-toggle');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = document.getElementById('nav');
      if (!nav) return;
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // mark current page link active
  const links = document.querySelectorAll('.site-nav a');
  links.forEach(a => {
    if (a.href === window.location.href || a.href === window.location.pathname.split('/').pop()) {
      a.classList.add('active');
    }
  });
});
