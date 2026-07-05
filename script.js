(function () {
  'use strict';

  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const topBtn = document.getElementById('topBtn');
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  /* Header scroll effect */
  function handleScroll() {
    const scrolled = window.scrollY > 40;
    header.classList.toggle('scrolled', scrolled);
    topBtn.classList.toggle('visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* Mobile menu */
  menuToggle.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    menuToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', '메뉴 열기');
      document.body.style.overflow = '';
    });
  });

  /* Active nav link on scroll */
  const sections = document.querySelectorAll('section[id]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* Counter animation */
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const duration = 1800;
      const start = performance.now();

      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
      }

      requestAnimationFrame(step);
    });
  }

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounters();
            counterObserver.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    counterObserver.observe(heroStats);
  }

  /* Scroll fade-in */
  const fadeElements = document.querySelectorAll(
    '.service-card, .process-step, .portfolio-item, .benefit-card, .faq-item, .about-text, .about-visual, .gallery-item, .process-showcase img'
  );

  fadeElements.forEach(function (el) {
    el.classList.add('fade-in');
  });

  const fadeObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  fadeElements.forEach(function (el) {
    fadeObserver.observe(el);
  });

  /* Top button */
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Contact form */
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const space = document.getElementById('space').value;
    const message = document.getElementById('message').value.trim();

    formNote.className = 'form-note';

    if (!name || !phone || !space || !message) {
      formNote.textContent = '필수 항목을 모두 입력해 주세요.';
      formNote.classList.add('error');
      return;
    }

    const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phonePattern.test(phone.replace(/\s/g, ''))) {
      formNote.textContent = '올바른 연락처 형식을 입력해 주세요. (예: 010-1234-5678)';
      formNote.classList.add('error');
      return;
    }

    formNote.textContent = '상담 신청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.';
    formNote.classList.add('success');
    contactForm.reset();

    setTimeout(function () {
      formNote.textContent = '';
      formNote.className = 'form-note';
    }, 5000);
  });

  /* FAQ: close others when one opens */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        document.querySelectorAll('.faq-item').forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
