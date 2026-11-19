/**
 * ORBIT — Main Application Controller
 * Preloader lifecycle, navigation, modal dialogs, scroll reveals,
 * and audio UI state synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Preloader Sequence
  initPreloader();

  // 2. Navigation Bar & Mobile Drawer
  initNavigation();

  // 3. Audio Toggle Control
  initAudioToggle();

  // 4. Modal Dialogs (Booking, Planet Discover, Mission)
  initModals();

  // 5. Scroll Reveals & Navbar Scroll State
  initScrollEffects();

  // 6. Smooth Scroll for Anchor Links
  initAnchorLinks();
});

/* -----------------------------------------------------------
 * 1. PRELOADER LIFECYCLE
 * ----------------------------------------------------------- */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const percentEl = document.getElementById('preloader-percent');
  const statusEl = document.getElementById('preloader-status');
  if (!preloader || !percentEl) return;

  const steps = [
    { p: 25, msg: 'INITIALIZING THREE.JS WEBGL...' },
    { p: 55, msg: 'LOADING ASTRONAUT PBR TELEMETRY...' },
    { p: 85, msg: 'COMPUTING CELESTIAL EPHEMERIS...' },
    { p: 100, msg: 'SYSTEM READY // WELCOME TO ORBIT' }
  ];

  let currentPercent = 0;
  let targetPercent = 35;
  let stepIndex = 0;

  const interval = setInterval(() => {
    if (currentPercent < targetPercent) {
      currentPercent += 2;
      percentEl.textContent = `${currentPercent}%`;
    }
  }, 25);

  const advanceStep = () => {
    if (stepIndex < steps.length) {
      targetPercent = steps[stepIndex].p;
      if (statusEl) statusEl.textContent = steps[stepIndex].msg;
      stepIndex++;
    }
  };

  setTimeout(advanceStep, 400);
  setTimeout(advanceStep, 900);

  // When scene signals ready or fallback timeout
  const dismissPreloader = () => {
    targetPercent = 100;
    currentPercent = 100;
    percentEl.textContent = '100%';
    if (statusEl) statusEl.textContent = 'ORBIT ESTABLISHED // ENTRANCE GRANTED';

    setTimeout(() => {
      clearInterval(interval);
      preloader.classList.add('is-dismissed');
      document.body.classList.remove('is-loading');

      // Trigger hero entrance animations
      const hero = document.querySelector('.hero');
      if (hero) hero.classList.add('hero-active');
    }, 450);
  };

  window.addEventListener('orbit:sceneReady', dismissPreloader, { once: true });
  // Fallback safe timeout in case asset loading is delayed
  setTimeout(dismissPreloader, 3200);
}

/* -----------------------------------------------------------
 * 2. NAVIGATION BAR & MOBILE DRAWER
 * ----------------------------------------------------------- */
function initNavigation() {
  const nav = document.querySelector('.navbar');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  // Sticky blur and border elevation on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav?.classList.add('nav-scrolled');
    } else {
      nav?.classList.remove('nav-scrolled');
    }
  }, { passive: true });

  // Mobile Drawer Toggle
  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.classList.toggle('is-active', isOpen);
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    // Close when clicking any nav link in drawer
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    });

    // Close on escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
        mobileDrawer.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    });
  }
}

/* -----------------------------------------------------------
 * 3. AUDIO TOGGLE
 * ----------------------------------------------------------- */
function initAudioToggle() {
  const audioBtn = document.getElementById('audio-toggle-btn');
  const audioLabel = document.getElementById('audio-toggle-label');
  const audioWave = document.getElementById('audio-wave');
  if (!audioBtn) return;

  audioBtn.addEventListener('click', () => {
    if (!window.orbitAudio) return;
    const isPlaying = window.orbitAudio.toggle();

    if (isPlaying) {
      audioBtn.classList.add('audio-active');
      if (audioLabel) audioLabel.textContent = 'AUDIO: ON';
      if (audioWave) audioWave.classList.add('is-animating');
    } else {
      audioBtn.classList.remove('audio-active');
      if (audioLabel) audioLabel.textContent = 'AUDIO: OFF';
      if (audioWave) audioWave.classList.remove('is-animating');
    }
  });
}

/* -----------------------------------------------------------
 * 4. MODAL DIALOGS (Booking, Planet Discover, Mission)
 * ----------------------------------------------------------- */
function initModals() {
  // Booking Modal
  const bookingModal = document.getElementById('booking-modal');
  const bookingOpenBtns = document.querySelectorAll('.open-booking-modal');
  const bookingCloseBtn = document.getElementById('close-booking-modal');
  const bookingForm = document.getElementById('booking-form');
  const bookingConfirmation = document.getElementById('booking-confirmation');

  bookingOpenBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (bookingModal) {
        bookingConfirmation?.classList.add('hidden');
        bookingForm?.classList.remove('hidden');
        bookingModal.showModal();
        if (window.orbitAudio) window.orbitAudio.playWarp();
      }
    });
  });

  bookingCloseBtn?.addEventListener('click', () => {
    bookingModal?.close();
  });

  // Light dismiss on backdrop click
  bookingModal?.addEventListener('click', (e) => {
    const dialogDimensions = bookingModal.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      bookingModal.close();
    }
  });

  bookingForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    bookingForm.classList.add('hidden');
    bookingConfirmation?.classList.remove('hidden');
    if (window.orbitAudio) window.orbitAudio.playWarp();
  });

  // Planet Discover Modal
  const planetModal = document.getElementById('planet-modal');
  const planetCloseBtn = document.getElementById('close-planet-modal');
  const discoverPlanetBtns = document.querySelectorAll('.discover-planet-btn');

  const planetDataMap = {
    'kepler': {
      name: 'Kepler-452b // Oceania Prime',
      class: 'Habitable Super-Earth',
      distance: '1,402 Light-Years',
      gravity: '1.12 G',
      temp: '14°C (Nominal)',
      atmosphere: 'Nitrogen (74%), Oxygen (21%), Argon (3%)',
      period: '384.8 Earth Days',
      image: 'assets/images/planet_kepler.jpg',
      description: 'Kepler-452b orbits a solar-type G2 star in the habitable zone. Known for deep azure oceans covering 86% of its planetary crust, Oceania Prime provides ideal conditions for low-orbit atmospheric sampling and luxury orbital observation expeditions.'
    },
    'aurelia': {
      name: 'Aurelia-VI // The Cryo Jewel',
      class: 'Sub-Saturnian Gas Giant',
      distance: '38.6 Light-Years',
      gravity: '0.94 G (Cloud Tops)',
      temp: '-48°C',
      atmosphere: 'Hydrogen (82%), Helium (15%), Methane (2%)',
      period: '12.4 Earth Years',
      image: 'assets/images/planet_aurelia.jpg',
      description: 'Aurelia-VI is encircled by a crystalline ring system composed of pure water ice and silicate dust. The rings reflect stellar irradiance in brilliant ultraviolet and turquoise sheens, creating the most famous panoramic vista in the Centauri sector.'
    },
    'proxima': {
      name: 'Proxima Centauri b // Twilight Frontier',
      class: 'Tidally-Locked Terrestrial World',
      distance: '4.24 Light-Years',
      gravity: '1.08 G',
      temp: '-39°C to +18°C (Terminator)',
      atmosphere: 'CO2-N2 Enriched with Trace Ozone',
      period: '11.2 Earth Days',
      image: 'assets/images/planet_proxima.jpg',
      description: 'Tidally locked to Proxima Centauri, this frontier world features a perpetual dusk ribbon known as the Solitude Ring. The crimson twilight horizon provides unhindered vantage points for high-energy astrophysics research.'
    },
    'gliese': {
      name: 'Gliese 667Cc // The Luminary',
      class: 'Triple-Sun Super-Earth',
      distance: '23.6 Light-Years',
      gravity: '1.34 G',
      temp: '4.5°C',
      atmosphere: 'High-Density Oxygenated Biosphere Candidate',
      period: '28.1 Earth Days',
      image: 'assets/images/planet_gliese.jpg',
      description: 'Illuminated by a trinary star system, Gliese 667Cc experiences bioluminescent crystalline aurorae along its tectonic rift valleys. The planet remains one of ORBIT\'s premier deep-space research destinations.'
    }
  };

  discoverPlanetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const planetKey = btn.dataset.planet;
      const data = planetDataMap[planetKey];
      if (!data || !planetModal) return;

      document.getElementById('planet-modal-name').textContent = data.name;
      document.getElementById('planet-modal-class').textContent = data.class;
      document.getElementById('planet-modal-distance').textContent = data.distance;
      document.getElementById('planet-modal-gravity').textContent = data.gravity;
      document.getElementById('planet-modal-temp').textContent = data.temp;
      document.getElementById('planet-modal-atmosphere').textContent = data.atmosphere;
      document.getElementById('planet-modal-period').textContent = data.period;
      document.getElementById('planet-modal-description').textContent = data.description;
      
      const imgEl = document.getElementById('planet-modal-img');
      if (imgEl) {
        imgEl.src = data.image;
        imgEl.alt = data.name;
      }

      planetModal.showModal();
      if (window.orbitAudio) window.orbitAudio.playClick();
    });
  });

  planetCloseBtn?.addEventListener('click', () => {
    planetModal?.close();
  });

  planetModal?.addEventListener('click', (e) => {
    const rect = planetModal.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      planetModal.close();
    }
  });

  // Mission Discover Modal
  const missionModal = document.getElementById('mission-modal');
  const missionCloseBtn = document.getElementById('close-mission-modal');
  const discoverMissionBtn = document.getElementById('discover-mission-btn');

  discoverMissionBtn?.addEventListener('click', () => {
    if (missionModal) {
      missionModal.showModal();
      if (window.orbitAudio) window.orbitAudio.playWarp();
    }
  });

  missionCloseBtn?.addEventListener('click', () => {
    missionModal?.close();
  });

  missionModal?.addEventListener('click', (e) => {
    const rect = missionModal.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      missionModal.close();
    }
  });
}

/* -----------------------------------------------------------
 * 5. SCROLL REVEALS & INTERSECTION OBSERVER
 * ----------------------------------------------------------- */
function initScrollEffects() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* -----------------------------------------------------------
 * 6. SMOOTH SCROLLING FOR ANCHOR LINKS
 * ----------------------------------------------------------- */
function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
