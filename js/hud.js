/**
 * ORBIT — HUD & Micro-Interactions Engine
 * Custom precision cursor, magnetic buttons, real-time coordinate tracker,
 * audio triggers, and HUD telemetry animations.
 */

class OrbitHUD {
  constructor() {
    this.cursor = document.getElementById('custom-cursor');
    this.cursorDot = document.getElementById('cursor-dot');
    this.cursorRing = document.getElementById('cursor-ring');

    this.mouse = { x: -100, y: -100 };
    this.ring = { x: -100, y: -100 };
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.init();
  }

  init() {
    if (!this.isTouchDevice && this.cursor) {
      this.initCursor();
      this.initMagneticButtons();
    } else if (this.cursor) {
      this.cursor.style.display = 'none';
    }

    this.initTelemetryCounters();
    this.initSoundInteractions();
    this.initUTCClock();
  }

  initCursor() {
    window.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      if (this.cursorDot) {
        this.cursorDot.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px)`;
      }
    });

    document.addEventListener('mouseenter', () => {
      if (this.cursor) this.cursor.classList.remove('is-hidden');
    });

    document.addEventListener('mouseleave', () => {
      if (this.cursor) this.cursor.classList.add('is-hidden');
    });

    // Smooth lerp loop for the lagging outer ring
    const renderCursorRing = () => {
      this.ring.x += (this.mouse.x - this.ring.x) * 0.18;
      this.ring.y += (this.mouse.y - this.ring.y) * 0.18;

      if (this.cursorRing) {
        this.cursorRing.style.transform = `translate(${this.ring.x}px, ${this.ring.y}px)`;
      }
      requestAnimationFrame(renderCursorRing);
    };
    renderCursorRing();

    // Hover scale effects on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, select, .planet-card, .clickable');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (this.cursorRing) this.cursorRing.classList.add('is-hovered');
      });
      el.addEventListener('mouseleave', () => {
        if (this.cursorRing) this.cursorRing.classList.remove('is-hovered');
      });
    });
  }

  initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
        btn.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)';
        setTimeout(() => {
          btn.style.transition = '';
        }, 350);
      });
    });
  }

  initTelemetryCounters() {
    // Fluctuating astronomical coordinates
    const raEl = document.getElementById('hud-ra');
    const decEl = document.getElementById('hud-dec');
    const signalEl = document.getElementById('hud-signal');

    let baseSeconds = 58.42;
    setInterval(() => {
      if (raEl) {
        baseSeconds = (baseSeconds + 0.04) % 60;
        raEl.textContent = `19h 44m ${baseSeconds.toFixed(2)}s`;
      }
      if (signalEl) {
        const ping = 48 + Math.floor(Math.random() * 6);
        signalEl.textContent = `${ping}ms // STABLE`;
      }
    }, 1500);
  }

  initUTCClock() {
    const clockEl = document.getElementById('hud-utc-clock');
    const updateTime = () => {
      if (!clockEl) return;
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      clockEl.textContent = `${hours}:${mins}:${secs} UTC`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  initSoundInteractions() {
    // Connect audio triggers
    document.querySelectorAll('a, button, .planet-card').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (window.orbitAudio) window.orbitAudio.playHover();
      });
      el.addEventListener('click', () => {
        if (window.orbitAudio) {
          if (el.classList.contains('btn-primary') || el.classList.contains('booking-btn')) {
            window.orbitAudio.playWarp();
          } else {
            window.orbitAudio.playClick();
          }
        }
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.orbitHUD = new OrbitHUD();
});
