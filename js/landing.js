// =============================================================================
// Landing Page Logic
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {

  // Sticky nav scroll effect
  const nav = document.getElementById('landing-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Days elapsed since Act commencement
  const el = document.getElementById('days-elapsed');
  if (el) {
    const days = Math.floor((Date.now() - new Date('2024-06-03').getTime()) / 86400000);
    el.textContent = days.toLocaleString() + ' Days';
  }

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Animate elements into view
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-tile, .area-tile, .update-card, .how-step, .pricing-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(el);
  });

});
