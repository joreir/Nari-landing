/* Nari — theme toggle, phase interaction, FAQ, contact form */
(function () {
  'use strict';

  var root = document.documentElement;
  var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */

  var themeToggle = document.getElementById('theme-toggle');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      root.setAttribute('data-theme-manual', '');
      try { localStorage.setItem('nari-theme', next); } catch (e) {}
    });
  }

  // Follow system changes unless the user has chosen manually
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!root.hasAttribute('data-theme-manual')) {
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

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

  if (chip) {
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
    if (!answer) return;

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close any other open item (one-at-a-time accordion)
      document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(function (openBtn) {
        if (openBtn !== btn && openBtn.nextElementSibling) {
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
  if (form) {
    var formError = document.getElementById('form-error');
    var formSuccess = document.getElementById('form-success');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.querySelector('.btn-label') : null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = Array.prototype.every.call(
        form.querySelectorAll('input, textarea'),
        function (field) { return field.value.trim() !== '' && field.checkValidity(); }
      );

      if (!valid) {
        if (formError) formError.hidden = false;
        return;
      }

      if (formError) formError.hidden = true;
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending…';

      setTimeout(function () {
        form.hidden = true;
        if (formSuccess) formSuccess.hidden = false;
      }, reducedMotion ? 100 : 900);
    });

    var resetBtn = document.getElementById('form-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Send message';
        if (formSuccess) formSuccess.hidden = true;
        form.hidden = false;
        var firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
      });
    }
  }
})();
