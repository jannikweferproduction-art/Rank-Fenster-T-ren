(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------------------- */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var navMobile = document.querySelector('[data-nav-mobile]');

  function closeNav() {
    if (!navToggle || !navMobile) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navMobile.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
  }

  function openNav() {
    if (!navToggle || !navMobile) return;
    navToggle.setAttribute('aria-expanded', 'true');
    navMobile.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) { closeNav(); } else { openNav(); }
    });

    navMobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    var mqDesktop = window.matchMedia('(min-width: 1024px)');
    mqDesktop.addEventListener('change', function (event) {
      if (event.matches) closeNav();
    });
  }

  /* ---------------------------------------------------------------------
     Sticky header shadow on scroll
     --------------------------------------------------------------------- */
  var header = document.querySelector('[data-site-header]');
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 8 ? 'var(--shadow-sm)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------------
     Scroll reveal (IntersectionObserver, no scroll-position math)
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && !reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) {
      // Erst jetzt (JS läuft nachweislich) auf die unsichtbare Startklasse
      // umschalten; ohne JS bleibt der Inhalt beim CSS-Default sichtbar.
      el.classList.add('reveal-init');
      io.observe(el);
    });
    // Sicherheitsnetz: falls der Observer (z. B. durch sehr schnelles
    // Scrollen oder Browser-Eigenheiten) für ein Element nie auslöst,
    // wird der Inhalt spätestens nach 2.5s trotzdem eingeblendet.
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }, 2500);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------------------
     Kontaktformular
     Kein Server-Backend vorhanden: baut bei gültiger Eingabe einen
     mailto-Link mit vorausgefülltem Betreff/Text. Für den produktiven
     Einsatz durch ein echtes Formular-Backend ersetzen (siehe Hinweis
     in kontakt.html).
     --------------------------------------------------------------------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var statusBox = form.querySelector('[data-form-status]');
    var toEmail = form.getAttribute('data-to-email') || 'info@beispiel-domain.de';

    var validators = {
      name: function (v) { return v.trim().length > 1; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      message: function (v) { return v.trim().length > 9; }
    };

    function setFieldState(fieldEl, valid) {
      fieldEl.setAttribute('data-invalid', valid ? 'false' : 'true');
    }

    function validateField(input) {
      var name = input.name;
      var fieldEl = input.closest('.field');
      if (!fieldEl || !validators[name]) return true;
      var valid = validators[name](input.value);
      setFieldState(fieldEl, valid);
      return valid;
    }

    form.querySelectorAll('input[required], textarea[required]').forEach(function (input) {
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        var fieldEl = input.closest('.field');
        if (fieldEl && fieldEl.getAttribute('data-invalid') === 'true') validateField(input);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var requiredInputs = form.querySelectorAll('input[required], textarea[required]');
      var allValid = true;
      requiredInputs.forEach(function (input) {
        if (!validateField(input)) allValid = false;
      });

      var consent = form.querySelector('[data-consent]');
      if (consent && !consent.checked) {
        allValid = false;
        consent.closest('.consent').style.color = 'var(--error)';
      }

      if (!allValid) {
        if (statusBox) {
          statusBox.textContent = 'Bitte prüfen Sie die markierten Felder.';
          statusBox.setAttribute('data-state', 'error');
        }
        var firstInvalid = form.querySelector('[data-invalid="true"] input, [data-invalid="true"] textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = new FormData(form);
      var lines = [
        'Name: ' + data.get('name'),
        'Telefon: ' + (data.get('phone') || '-'),
        'E-Mail: ' + data.get('email'),
        'Anliegen: ' + (data.get('topic') || '-'),
        '',
        data.get('message')
      ];
      var subject = encodeURIComponent('Anfrage über die Website: ' + (data.get('topic') || 'Kontakt'));
      var body = encodeURIComponent(lines.join('\n'));
      var mailto = 'mailto:' + toEmail + '?subject=' + subject + '&body=' + body;

      if (statusBox) {
        statusBox.textContent = 'Ihr E-Mail-Programm wird geöffnet, damit Sie die Anfrage direkt versenden können.';
        statusBox.setAttribute('data-state', 'success');
      }
      window.location.href = mailto;
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-current-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
