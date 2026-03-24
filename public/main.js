const projectsGrid = document.getElementById('projectsGrid');
const themeToggle = document.getElementById('themeToggle');
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
const heroProjectCount = document.getElementById('heroProjectCount');
const heroProjectClicks = document.getElementById('heroProjectClicks');
const contactLink = document.getElementById('contactLink');
const githubLink = document.getElementById('githubLink');
const linkedinLink = document.getElementById('linkedinLink');
const xLink = document.getElementById('xLink');

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
}

themeToggle.textContent = document.documentElement.dataset.theme === 'dark' ? 'Light' : 'Dark';

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  themeToggle.textContent = next === 'dark' ? 'Light' : 'Dark';
});

if (navToggle && mobileNav) {
  let closeTimerId = null;
  const mobileBreakpoint = window.matchMedia('(max-width: 920px)');

  const setBodyScrollLock = (isLocked) => {
    if (!mobileBreakpoint.matches) {
      document.body.classList.remove('nav-open');
      return;
    }
    document.body.classList.toggle('nav-open', isLocked);
  };

  const closeMobileNav = () => {
    if (closeTimerId) {
      clearTimeout(closeTimerId);
      closeTimerId = null;
    }
    mobileNav.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    setBodyScrollLock(false);
    closeTimerId = window.setTimeout(() => {
      mobileNav.hidden = true;
    }, 220);
  };

  const openMobileNav = () => {
    if (closeTimerId) {
      clearTimeout(closeTimerId);
      closeTimerId = null;
    }
    mobileNav.hidden = false;
    window.requestAnimationFrame(() => {
      mobileNav.classList.add('is-open');
    });
    navToggle.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation menu');
    setBodyScrollLock(true);
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMobileNav();
      return;
    }
    openMobileNav();
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) {
      closeMobileNav();
    }
  });

  document.addEventListener('pointerdown', (event) => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (!isOpen) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickedInsideMenu = mobileNav.contains(target);
    const clickedToggle = navToggle.contains(target);
    if (!clickedInsideMenu && !clickedToggle) {
      closeMobileNav();
    }
  });

  window.addEventListener('hashchange', closeMobileNav);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNav();
    }
  });
}

const sectionNavLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"], .mobile-nav a[href^="#"]'));
const sectionTargets = Array.from(document.querySelectorAll('main section[id]'));

function setActiveNavLink(sectionId) {
  sectionNavLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const isActive = href === `#${sectionId}`;
    link.classList.toggle('active-nav-link', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function syncActiveNavFromHash() {
  const hash = window.location.hash || '';
  if (!hash.startsWith('#')) return;
  const id = hash.slice(1);
  if (sectionTargets.some((section) => section.id === id)) {
    setActiveNavLink(id);
  }
}

if (sectionNavLinks.length && sectionTargets.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        const activeId = visible[0].target.getAttribute('id');
        if (activeId) {
          setActiveNavLink(activeId);
        }
      }
    },
    {
      threshold: [0.35, 0.55],
      rootMargin: '-12% 0px -48% 0px'
    }
  );

  sectionTargets.forEach((section) => sectionObserver.observe(section));
  syncActiveNavFromHash();
  window.addEventListener('hashchange', syncActiveNavFromHash);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function loadBookmarks() {
  try {
    return new Set(JSON.parse(localStorage.getItem('bookmarks') || '[]'));
  } catch {
    return new Set();
  }
}

function saveBookmarks(set) {
  localStorage.setItem('bookmarks', JSON.stringify(Array.from(set)));
}

function applySettings(settings) {
  if (!settings) return;

  const email = settings.contactEmail || 'hello@anupro.me';
  contactLink.href = `mailto:${email}`;

  if (settings.social && settings.social.github) {
    githubLink.href = settings.social.github;
  }

  if (settings.social && settings.social.linkedin) {
    linkedinLink.href = settings.social.linkedin;
  }

  if (settings.social && settings.social.x) {
    xLink.href = settings.social.x;
    xLink.classList.remove('hidden-link');
  } else {
    xLink.classList.add('hidden-link');
  }
}

function trackEvent(eventName, projectId) {
  fetch(`/api/track/${eventName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify(projectId ? { projectId } : {})
  }).catch(() => {
    // Ignore analytics failures to keep UX responsive.
  });
}

function renderProjects(projects) {
  const bookmarks = loadBookmarks();

  heroProjectCount.textContent = String(projects.length || 0);

  projectsGrid.innerHTML = projects
    .map((project, index) => {
      const tags = (project.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
      const isBookmarked = bookmarks.has(project.id);
      return `
        <article class="project-card card-entrance" style="--stagger:${index % 8}">
          <div class="card-head">
            <h3>${escapeHtml(project.name)}</h3>
            <span class="platform-pill">${escapeHtml(project.platform || 'Custom')}</span>
          </div>
          <p>${escapeHtml(project.description || '')}</p>
          <div class="tag-row">${tags}</div>
          <p class="project-stat">${escapeHtml(String(project.clicks || 0))} clicks · ${escapeHtml(String(project.bookmarks || 0))} bookmarks</p>
          <div class="card-actions">
            <a class="btn secondary open-project-link" data-project-id="${escapeHtml(project.id)}" href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">Open Project</a>
            <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" data-bookmark-id="${escapeHtml(project.id)}">${
              isBookmarked ? 'Saved' : 'Save'
            }</button>
          </div>
        </article>
      `;
    })
    .join('');

  projectsGrid.querySelectorAll('[data-bookmark-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-bookmark-id');
      const current = loadBookmarks();

      if (current.has(id)) {
        current.delete(id);
        button.textContent = 'Save';
        button.classList.remove('active');
      } else {
        current.add(id);
        button.textContent = 'Saved';
        button.classList.add('active');
        trackEvent('bookmark', id);
      }

      saveBookmarks(current);
    });
  });

  projectsGrid.querySelectorAll('.open-project-link').forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('data-project-id');
      trackEvent('click', id);
    });
  });
}

async function loadProjects() {
  try {
    const fetchProjects = async (url) => {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Projects request failed with status ${response.status}`);
      }

      return response.json();
    };

    let data;
    try {
      data = await fetchProjects('/api/projects');
    } catch {
      const retryUrl = `/api/projects?ts=${Date.now()}`;
      data = await fetchProjects(retryUrl);
    }

    const projects = data.projects || [];
    const settings = data.settings || null;
    const stats = data.stats || {};
    applySettings(settings);
    heroProjectClicks.textContent = String(stats.totalProjectClicks || 0);
    renderProjects(projects);
  } catch (error) {
    console.error('[projects] load failed:', error);
    projectsGrid.innerHTML = '<p>Could not load projects right now.</p>';
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: '0px 0px -8% 0px'
  }
);

document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
document.getElementById('year').textContent = String(new Date().getFullYear());

trackEvent('view');
loadProjects();
