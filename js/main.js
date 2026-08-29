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

  function playRoughRadioSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const duration = 0.22;
      const now = ctx.currentTime;

      // 1. Rough radio static burst
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const grain = Math.random() * 2 - 1;
        const am = Math.sin(i * 0.08) > 0.2 ? 1.2 : 0.4;
        data[i] = grain * am;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter for analog AM / shortwave radio wave tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration);
      filter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.24, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // 2. Radio carrier heterodyne whistle wave
      const carrier = ctx.createOscillator();
      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(1300, now);
      carrier.frequency.exponentialRampToValueAtTime(240, now + duration);

      // Rough FM modulation for radio distortion
      const mod = ctx.createOscillator();
      mod.type = 'square';
      mod.frequency.setValueAtTime(70, now);

      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(260, now);
      mod.connect(carrier.frequency);

      const carrierGain = ctx.createGain();
      carrierGain.gain.setValueAtTime(0.07, now);
      carrierGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      carrier.connect(carrierGain);
      carrierGain.connect(ctx.destination);

      noise.start(now);
      carrier.start(now);
      mod.start(now);

      noise.stop(now + duration);
      carrier.stop(now + duration);
      mod.stop(now + duration);
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  }

  if (profileAvatar && typeof site !== 'undefined') {
    let currentAvatar = 1;
    let rotationAngle = 0;

    const switchAvatar = () => {
      playRoughRadioSound();

      // Cumulative rotation: spins 360deg forward every single time you click infinitely
      if (toggleAvatarBtn) {
        const svgIcon = toggleAvatarBtn.querySelector('svg');
        if (svgIcon) {
          rotationAngle += 360;
          svgIcon.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
          svgIcon.style.transform = `rotate(${rotationAngle}deg)`;
        }
      }

      profileAvatar.style.opacity = 0;
      setTimeout(() => {
        currentAvatar = currentAvatar === 1 ? 2 : 1;
        profileAvatar.src = currentAvatar === 1 ? site.assets.avatar1 : site.assets.avatar2;
        profileAvatar.style.opacity = 1;
      }, 150);
    };

    if (toggleAvatarBtn) {
      toggleAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchAvatar();
      });
    }
    profileAvatar.addEventListener('click', switchAvatar);
  }
});
