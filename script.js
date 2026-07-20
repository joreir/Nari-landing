/* Nari — hash router, phase interaction, theme toggle, FAQ, contact form */
(function () {
  'use strict';

  var root = document.documentElement;
  var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */

  var themeToggle = document.getElementById('theme-toggle');

  themeToggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    root.setAttribute('data-theme-manual', '');
    try { localStorage.setItem('nari-theme', next); } catch (e) {}
  });

  // Follow system changes unless the user has chosen manually
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!root.hasAttribute('data-theme-manual')) {
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

  /* ---------- hash router ---------- */

  var routes = Array.prototype.slice.call(document.querySelectorAll('.route'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-route]'));
  var currentPath = null;
  var transitioning = false;

  function normalizePath() {
    var hash = location.hash.replace(/^#/, '');
    if (hash === '' || hash === '/') return '/';
    if (hash.charAt(0) !== '/') hash = '/' + hash; // tolerate #privacy
    return routes.some(function (r) { return r.dataset.path === hash; }) ? hash : '/';
  }

  function showRoute(path, animate) {
    var incoming = routes.find(function (r) { return r.dataset.path === path; });
    var outgoing = routes.find(function (r) { return !r.hidden; });
    if (!incoming || incoming === outgoing) return;

    navLinks.forEach(function (a) {
      if (a.dataset.route === path) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    function swap() {
      if (outgoing) {
        outgoing.hidden = true;
        outgoing.classList.remove('route-leaving');
      }
      incoming.hidden = false;
      window.scrollTo(0, 0);
      // Move focus to the new section's heading for screen readers
      var heading = incoming.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      transitioning = false;
    }

    if (animate && outgoing && !reducedMotion) {
      transitioning = true;
      outgoing.classList.add('route-leaving');
      outgoing.addEventListener('animationend', swap, { once: true });
      // Safety net if animationend never fires
      setTimeout(function () { if (transitioning) swap(); }, 400);
    } else {
      swap();
    }
  }

  function onRouteChange(animate) {
    var path = normalizePath();
    if (path === currentPath) return;
    currentPath = path;
    showRoute(path, animate);
  }

  window.addEventListener('hashchange', function () { onRouteChange(true); });
  onRouteChange(false);

  /* ---------- partner demo: phase chip drives the ambient tint ---------- */

  var PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'];
  var PHASES = {
    menstrual:  { label: 'Menstrual',  color: '#FF99B3', deep: '#FF8099' },
    follicular: { label: 'Follicular', color: '#FFE680', deep: '#F2CC33' },
    ovulation:  { label: 'Ovulation',  color: '#99CCFF', deep: '#66B3FF' },
    luteal:     { label: 'Luteal',     color: '#99E699', deep: '#66CC80' }
  };

  var chip = document.getElementById('phase-chip');
  var phaseIndex = PHASE_ORDER.indexOf('ovulation');

  function applyPhase() {
    var phase = PHASES[PHASE_ORDER[phaseIndex]];
    root.style.setProperty('--phase', phase.color);
    root.style.setProperty('--phase-deep', phase.deep);
    if (chip) chip.textContent = phase.label;
  }
  applyPhase();

  // The ambient light drifts slowly through the four phases until the
  // visitor takes over by tapping the chip.
  var autoCycle = null;
  if (!reducedMotion) {
    autoCycle = setInterval(function () {
      phaseIndex = (phaseIndex + 1) % PHASE_ORDER.length;
      applyPhase();
    }, 8000);
  }

  if (chip) {
    chip.addEventListener('click', function () {
      if (autoCycle) { clearInterval(autoCycle); autoCycle = null; }
      phaseIndex = (phaseIndex + 1) % PHASE_ORDER.length;
      applyPhase();
    });
  }

  /* ---------- partner demo: field-sharing toggles ---------- */

  document.querySelectorAll('input[data-share]').forEach(function (input) {
    var row = document.querySelector('.p-row[data-field="' + input.dataset.share + '"]');
    if (!row) return;
    function sync() { row.classList.toggle('is-hidden', !input.checked); }
    input.addEventListener('change', sync);
    sync();
  });

  /* ---------- FAQ accordion ---------- */

  document.querySelectorAll('.faq-q').forEach(function (btn) {
    var answer = btn.nextElementSibling;

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close any other open item (one-at-a-time accordion)
      document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(function (openBtn) {
        if (openBtn !== btn) {
          openBtn.setAttribute('aria-expanded', 'false');
          openBtn.nextElementSibling.style.maxHeight = '0px';
        }
      });

      btn.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) {
        answer.style.maxHeight = '0px';
      } else {
        answer.hidden = false;
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });

    // Start collapsed but measurable
    answer.hidden = false;
    answer.style.maxHeight = '0px';
  });

  /* ---------- contact form (simulated submission) ---------- */

  var form = document.getElementById('contact-form');
  var formError = document.getElementById('form-error');
  var formSuccess = document.getElementById('form-success');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn.querySelector('.btn-label');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var valid = Array.prototype.every.call(
      form.querySelectorAll('input, textarea'),
      function (field) { return field.value.trim() !== '' && field.checkValidity(); }
    );

    if (!valid) {
      formError.hidden = false;
      return;
    }

    formError.hidden = true;
    submitBtn.disabled = true;
    submitLabel.textContent = 'Sending…';

    setTimeout(function () {
      form.hidden = true;
      formSuccess.hidden = false;
    }, reducedMotion ? 100 : 900);
  });

  document.getElementById('form-reset').addEventListener('click', function () {
    form.reset();
    submitBtn.disabled = false;
    submitLabel.textContent = 'Send message';
    formSuccess.hidden = true;
    form.hidden = false;
    form.querySelector('input').focus();
  });
})();
