// =============================================================================
// Landing Page Logic
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {

  // Render admin-managed news
  const newsContainer = document.getElementById('news-container');
  if (newsContainer) {
    const items = PLATFORM.get('news_items', []);
    const published = items.filter(n => n.published !== false);
    newsContainer.innerHTML = published.map(n => `
      <div class="update-card">
        <div class="update-date">${PLATFORM.esc(n.date)}</div>
        <div class="update-cat"><span class="badge ${PLATFORM.esc(n.badgeClass)}">${PLATFORM.esc(n.badge)}</span></div>
        <div class="update-title">${PLATFORM.esc(n.title)}</div>
        <div class="update-text">${PLATFORM.esc(n.body)}</div>
        ${n.link ? `<a href="${PLATFORM.esc(n.link)}" target="_blank" rel="noopener" class="update-link">${PLATFORM.esc(n.linkText || 'Read more ↗')}</a>` : ''}
      </div>
    `).join('');
  }

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
