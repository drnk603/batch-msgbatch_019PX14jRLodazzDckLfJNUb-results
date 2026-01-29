(function() {
  'use strict';

  const CONFIG = {
    HEADER_HEIGHT: 72,
    DEBOUNCE_DELAY: 200,
    THROTTLE_LIMIT: 100,
    SCROLL_OFFSET: 20,
    MOBILE_BREAKPOINT: 1024,
    NOTIFICATION_DURATION: 5000
  };

  const util = {
    debounce(fn, delay) {
      let timer;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    throttle(fn, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    isHomepage() {
      const path = window.location.pathname;
      return path === '/' || path === '/index.html' || path === '/index.htm' || path === '';
    },

    getHeaderHeight() {
      const header = document.querySelector('.l-header');
      return header ? header.offsetHeight : CONFIG.HEADER_HEIGHT;
    },

    trapFocus(container) {
      const focusable = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      container.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      });
    },

    sanitizeInput(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  const burgerMenu = {
    initialized: false,
    nav: null,
    toggle: null,
    list: null,
    isOpen: false,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      this.nav = document.querySelector('.c-nav#main-nav');
      this.toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
      this.list = document.querySelector('.c-nav__list, .navbar-collapse');

      if (!this.nav || !this.toggle || !this.list) return;

      this.toggle.addEventListener('click', () => this.handleToggle());
      document.addEventListener('keydown', e => this.handleEscape(e));
      document.addEventListener('click', e => this.handleOutsideClick(e));

      const links = this.list.querySelectorAll('.c-nav__link, .nav-link');
      links.forEach(link => link.addEventListener('click', () => this.close()));

      window.addEventListener('resize', util.debounce(() => this.handleResize(), CONFIG.DEBOUNCE_DELAY));
    },

    handleToggle() {
      this.isOpen ? this.close() : this.open();
    },

    open() {
      this.isOpen = true;
      this.nav.classList.add('is-open');
      this.list.classList.add('show');
      this.toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      util.trapFocus(this.list);
    },

    close() {
      this.isOpen = false;
      this.nav.classList.remove('is-open');
      this.list.classList.remove('show');
      this.toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    },

    handleEscape(e) {
      if (e.key === 'Escape' && this.isOpen) this.close();
    },

    handleOutsideClick(e) {
      if (!this.isOpen || !this.nav) return;
      if (!this.nav.contains(e.target)) this.close();
    },

    handleResize() {
      if (window.innerWidth >= CONFIG.MOBILE_BREAKPOINT && this.isOpen) {
        this.close();
      }
    }
  };

  const scrollSpy = {
    initialized: false,
    sections: [],
    links: [],

    init() {
      if (this.initialized) return;
      this.initialized = true;

      if (!util.isHomepage()) return;

      this.links = Array.from(document.querySelectorAll('.c-nav__link[href^="#"], .nav-link[href^="#"]'));
      this.sections = this.links
        .map(link => {
          const href = link.getAttribute('href');
          if (href && href !== '#') {
            const id = href.substring(1);
            return document.getElementById(id);
          }
          return null;
        })
        .filter(Boolean);

      if (!this.sections.length) return;

      window.addEventListener('scroll', util.throttle(() => this.update(), CONFIG.THROTTLE_LIMIT));
      this.update();
    },

    update() {
      const scrollPos = window.scrollY + util.getHeaderHeight() + CONFIG.SCROLL_OFFSET;

      let currentSection = null;
      for (const section of this.sections) {
        if (section.offsetTop <= scrollPos) {
          currentSection = section;
        }
      }

      this.links.forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      });

      if (currentSection) {
        const activeLink = this.links.find(link => {
          const href = link.getAttribute('href');
          return href === `#${currentSection.id}`;
        });
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.setAttribute('aria-current', 'page');
        }
      }
    }
  };

  const smoothScroll = {
    initialized: false,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      document.addEventListener('click', e => this.handleClick(e));

      if (util.isHomepage() && window.location.hash) {
        setTimeout(() => {
          const id = window.location.hash.substring(1);
          if (id) this.scrollToSection(id);
        }, 100);
      }
    },

    handleClick(e) {
      const anchor = e.target.closest('a[href^="#"], a[href^="/#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      let targetId = null;
      if (href.indexOf('#') === 0) {
        targetId = href.substring(1);
      } else if (util.isHomepage() && href.indexOf('/#') === 0) {
        targetId = href.substring(2);
      }

      if (targetId) {
        e.preventDefault();
        this.scrollToSection(targetId);
        if (burgerMenu.isOpen) burgerMenu.close();
      }
    },

    scrollToSection(id) {
      const target = document.getElementById(id);
      if (!target) return;

      const offset = util.getHeaderHeight();
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: top,
        behavior: 'smooth'
      });
    }
  };

  const formValidation = {
    initialized: false,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        form.addEventListener('submit', e => this.handleSubmit(e, form));
      });

      this.createNotificationContainer();
    },

    handleSubmit(e, form) {
      e.preventDefault();

      this.clearErrors(form);

      const isValid = this.validateForm(form);
      if (!isValid) {
        form.classList.add('was-validated');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        window.location.href = 'thank_you.html';
      }, 1500);
    },

    validateForm(form) {
      let isValid = true;

      const nameField = form.querySelector('#name, input[name="name"]');
      if (nameField) {
        const name = nameField.value.trim();
        if (!name) {
          this.showError(nameField, 'Bitte geben Sie Ihren Namen ein.');
          isValid = false;
        } else if (name.length < 2) {
          this.showError(nameField, 'Der Name muss mindestens 2 Zeichen lang sein.');
          isValid = false;
        }
      }

      const emailField = form.querySelector('#email, input[name="email"]');
      if (emailField) {
        const email = emailField.value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
          this.showError(emailField, 'Bitte geben Sie Ihre E-Mail-Adresse ein.');
          isValid = false;
        } else if (!emailPattern.test(email)) {
          this.showError(emailField, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
          isValid = false;
        }
      }

      const phoneField = form.querySelector('#phone, input[name="phone"]');
      if (phoneField) {
        const phone = phoneField.value.trim();
        const phonePattern = /^[\d\s\+\-\(\)]{10,20}$/;
        if (!phone) {
          this.showError(phoneField, 'Bitte geben Sie Ihre Telefonnummer ein.');
          isValid = false;
        } else if (!phonePattern.test(phone)) {
          this.showError(phoneField, 'Bitte geben Sie eine gültige Telefonnummer ein.');
          isValid = false;
        }
      }

      const messageField = form.querySelector('#message, textarea[name="message"]');
      if (messageField) {
        const message = messageField.value.trim();
        if (!message) {
          this.showError(messageField, 'Bitte geben Sie eine Nachricht ein.');
          isValid = false;
        } else if (message.length < 10) {
          this.showError(messageField, 'Die Nachricht muss mindestens 10 Zeichen lang sein.');
          isValid = false;
        }
      }

      const privacyField = form.querySelector('#privacy, input[name="privacy"]');
      if (privacyField && privacyField.type === 'checkbox') {
        if (!privacyField.checked) {
          this.showError(privacyField, 'Bitte akzeptieren Sie die Datenschutzerklärung.');
          isValid = false;
        }
      }

      return isValid;
    },

    showError(field, message) {
      field.classList.add('is-invalid', 'has-error');

      let errorMsg = field.nextElementSibling;
      if (!errorMsg || !errorMsg.classList.contains('invalid-feedback')) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'invalid-feedback c-form__error-msg';
        field.parentNode.insertBefore(errorMsg, field.nextSibling);
      }
      errorMsg.textContent = message;
      errorMsg.style.display = 'block';
    },

    clearErrors(form) {
      const invalidFields = form.querySelectorAll('.is-invalid, .has-error');
      invalidFields.forEach(field => {
        field.classList.remove('is-invalid', 'has-error');
      });

      const errorMessages = form.querySelectorAll('.invalid-feedback, .c-form__error-msg');
      errorMessages.forEach(msg => msg.style.display = 'none');

      form.classList.remove('was-validated');
    },

    createNotificationContainer() {
      if (document.getElementById('notification-container')) return;

      const container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
      document.body.appendChild(container);

      window.notify = (message, type = 'success') => this.notify(message, type);
    },

    notify(message, type) {
      const container = document.getElementById('notification-container');
      if (!container) return;

      const alert = document.createElement('div');
      alert.className = `alert alert-${type} alert-dismissible fade show`;
      alert.setAttribute('role', 'alert');
      alert.innerHTML = `${util.sanitizeInput(message)}<button type="button" class="btn-close" aria-label="Schließen"></button>`;

      const closeBtn = alert.querySelector('.btn-close');
      closeBtn.addEventListener('click', () => this.removeNotification(alert));

      container.appendChild(alert);

      setTimeout(() => this.removeNotification(alert), CONFIG.NOTIFICATION_DURATION);
    },

    removeNotification(alert) {
      if (!alert.parentNode) return;
      alert.classList.remove('show');
      setTimeout(() => {
        if (alert.parentNode) alert.parentNode.removeChild(alert);
      }, 150);
    }
  };

  const lazyLoad = {
    initialized: false,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img')) {
          img.setAttribute('loading', 'lazy');
        }
      });

      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (!video.hasAttribute('loading')) {
          video.setAttribute('loading', 'lazy');
        }
      });
    }
  };

  const headerScroll = {
    initialized: false,
    header: null,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      this.header = document.querySelector('.l-header');
      if (!this.header) return;

      window.addEventListener('scroll', util.throttle(() => this.update(), CONFIG.THROTTLE_LIMIT));
      this.update();
    },

    update() {
      if (window.scrollY > 50) {
        this.header.classList.add('is-scrolled');
      } else {
        this.header.classList.remove('is-scrolled');
      }
    }
  };

  const app = {
    init() {
      burgerMenu.init();
      scrollSpy.init();
      smoothScroll.init();
      formValidation.init();
      lazyLoad.init();
      headerScroll.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }

})();
