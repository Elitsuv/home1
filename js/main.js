document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
  elementsToAnimate.forEach(el => observer.observe(el));

  const toggleAvatarBtn = document.getElementById('toggle-avatar');
  const profileAvatar = document.getElementById('profile-avatar');

  if (toggleAvatarBtn && profileAvatar && typeof site !== 'undefined') {
    let currentAvatar = 1;
    toggleAvatarBtn.addEventListener('click', () => {
      profileAvatar.style.opacity = 0;
      setTimeout(() => {
        currentAvatar = currentAvatar === 1 ? 2 : 1;
        profileAvatar.src = currentAvatar === 1 ? site.assets.avatar1 : site.assets.avatar2;
        profileAvatar.style.opacity = 1;
      }, 200);
    });
  }
});
