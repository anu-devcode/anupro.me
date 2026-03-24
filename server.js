require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;
const DOMAIN = process.env.APP_DOMAIN || 'anupro.me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const DEFAULT_ADMIN_PASSWORD_HASH = '$2a$10$i.rwNe91p5W7.HsZeHhlBOlx3CsS.etn6snpKQ1ul9oMdRxg9KOyK';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace-this-session-secret';
const IS_PROD = process.env.NODE_ENV === 'production';
const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || IS_PROD;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const ADMIN_HASH_IS_BCRYPT = BCRYPT_HASH_PATTERN.test(ADMIN_PASSWORD_HASH);

const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

if (TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    name: 'anupro.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    const cleanHost = host.replace(/^www\./, '');
    return res.redirect(301, `${req.protocol}://${cleanHost}${req.originalUrl}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d', etag: true }));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    const starter = {
      projects: [
        {
          id: cryptoRandomId(),
          name: 'Realtime Ops Monitor',
          description: 'A low-latency observability dashboard for distributed services with smart anomaly hints.',
          url: 'https://ops.anupro.me',
          tags: ['backend', 'systems', 'monitoring'],
          platform: 'Vercel',
          featured: true,
          visible: true,
          problem: 'Teams lacked a simple way to identify service regressions quickly.',
          impact: 'Reduced average triage time by 41% in internal tests.',
          metrics: 'P95 query 120ms'
        },
        {
          id: cryptoRandomId(),
          name: 'PromptForge Studio',
          description: 'A project workspace for prompt testing, versioning, and A/B output comparison.',
          url: 'https://forge.anupro.me',
          tags: ['ai', 'web', 'productivity'],
          platform: 'Netlify',
          featured: true,
          visible: true,
          problem: 'Prompt iteration was inconsistent across teams.',
          impact: 'Improved output consistency and reduced manual retries.',
          metrics: '32% faster iteration cycles'
        },
        {
          id: cryptoRandomId(),
          name: 'Edge Notes API',
          description: 'A stateless notes backend optimized for global reads and lightweight auth.',
          url: 'https://notes.anupro.me',
          tags: ['api', 'edge', 'backend'],
          platform: 'Cloudflare Workers',
          featured: false,
          visible: true,
          problem: 'Needed globally fast note retrieval without heavyweight infra.',
          impact: 'Consistent sub-100ms reads across test regions.',
          metrics: 'Global avg latency 86ms'
        }
      ]
    };
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(starter, null, 2));
  }

  if (!fs.existsSync(SETTINGS_FILE)) {
    const starterSettings = {
      ownerName: 'Anup Ro',
      contactEmail: 'hello@anupro.me',
      social: {
        github: 'https://github.com',
        linkedin: 'https://www.linkedin.com',
        x: 'https://x.com'
      }
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(starterSettings, null, 2));
  }

  if (!fs.existsSync(ANALYTICS_FILE)) {
    const starterAnalytics = {
      totals: {
        pageViews: 0,
        projectClicks: 0,
        projectBookmarks: 0
      },
      projects: {},
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(starterAnalytics, null, 2));
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    const starterMessages = {
      messages: []
    };
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(starterMessages, null, 2));
  }
}

function cryptoRandomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readProjectsData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
}

function writeProjectsData(data) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

function readSettings() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
}

function writeSettings(data) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

function readAnalytics() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
}

function writeAnalytics(data) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

function readMessages() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
}

function writeMessages(data) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
}

function sanitizeProjectPayload(payload) {
  const tags = Array.isArray(payload.tags)
    ? payload.tags
    : String(payload.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

  return {
    id: payload.id || cryptoRandomId(),
    name: String(payload.name || '').trim(),
    description: String(payload.description || '').trim(),
    url: String(payload.url || '').trim(),
    tags,
    platform: String(payload.platform || 'Custom').trim(),
    featured: Boolean(payload.featured),
    visible: payload.visible !== false,
    problem: String(payload.problem || '').trim(),
    impact: String(payload.impact || '').trim(),
    metrics: String(payload.metrics || '').trim()
  };
}

function sanitizeSettingsPayload(payload) {
  const social = payload && payload.social ? payload.social : {};
  return {
    ownerName: String(payload.ownerName || 'Anup Ro').trim(),
    contactEmail: String(payload.contactEmail || 'hello@anupro.me').trim(),
    social: {
      github: String(social.github || '').trim(),
      linkedin: String(social.linkedin || '').trim(),
      x: String(social.x || '').trim()
    }
  };
}

function sanitizeMessagePayload(payload) {
  return {
    id: cryptoRandomId(),
    fullName: String(payload.fullName || '').trim(),
    email: String(payload.email || '').trim(),
    inquiryType: String(payload.inquiryType || 'support').trim().toLowerCase(),
    subject: String(payload.subject || '').trim(),
    message: String(payload.message || '').trim(),
    createdAt: new Date().toISOString()
  };
}

function getPublicSettings(settings) {
  return {
    ownerName: settings.ownerName,
    contactEmail: settings.contactEmail,
    social: settings.social
  };
}

function ensureProjectAnalytics(analytics, projectId) {
  if (!projectId) return;
  if (!analytics.projects[projectId]) {
    analytics.projects[projectId] = {
      views: 0,
      clicks: 0,
      bookmarks: 0,
      updatedAt: new Date().toISOString()
    };
  }
}

function recordAnalyticsEvent(eventType, projectId) {
  const analytics = readAnalytics();
  const now = new Date().toISOString();

  if (eventType === 'view') {
    analytics.totals.pageViews = (analytics.totals.pageViews || 0) + 1;
  }

  if (projectId) {
    ensureProjectAnalytics(analytics, projectId);
    if (eventType === 'click') {
      analytics.projects[projectId].clicks = (analytics.projects[projectId].clicks || 0) + 1;
      analytics.totals.projectClicks = (analytics.totals.projectClicks || 0) + 1;
    }

    if (eventType === 'bookmark') {
      analytics.projects[projectId].bookmarks = (analytics.projects[projectId].bookmarks || 0) + 1;
      analytics.totals.projectBookmarks = (analytics.totals.projectBookmarks || 0) + 1;
    }

    analytics.projects[projectId].updatedAt = now;
  }

  analytics.updatedAt = now;
  writeAnalytics(analytics);
  return analytics;
}

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

app.get('/health', (req, res) => {
  res.json({ ok: true, domain: DOMAIN });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (!ADMIN_HASH_IS_BCRYPT) {
    return res.status(500).json({ message: 'Server auth configuration is invalid.' });
  }

  const usernameOk = username === ADMIN_USER;
  const passwordOk = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  req.session.isAdmin = true;
  req.session.user = ADMIN_USER;
  return res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('anupro.sid');
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  return res.json({ authenticated: false });
});

app.get('/api/projects', (req, res) => {
  const { projects } = readProjectsData();
  const settings = readSettings();
  const analytics = readAnalytics();
  const publicView = projects
    .filter((project) => project.visible)
    .sort((a, b) => (Number(b.featured) - Number(a.featured)) || (a.order || 0) - (b.order || 0))
    .map((project, index) => {
      const projectAnalytics = analytics.projects[project.id] || {};
      return {
        ...project,
        order: typeof project.order === 'number' ? project.order : index,
        clicks: Number(projectAnalytics.clicks || 0),
        bookmarks: Number(projectAnalytics.bookmarks || 0)
      };
    });

  res.json({
    projects: publicView,
    settings: getPublicSettings(settings),
    stats: {
      totalProjects: publicView.length,
      totalPageViews: Number(analytics.totals.pageViews || 0),
      totalProjectClicks: Number(analytics.totals.projectClicks || 0)
    }
  });
});

app.get('/api/settings', (req, res) => {
  const settings = readSettings();
  res.json({ settings: getPublicSettings(settings) });
});

app.post('/api/track/:event', (req, res) => {
  const event = String(req.params.event || '').trim();
  if (!['view', 'click', 'bookmark'].includes(event)) {
    return res.status(400).json({ message: 'Invalid event.' });
  }

  const projectId = String((req.body && req.body.projectId) || '').trim();
  const analytics = recordAnalyticsEvent(event, projectId || undefined);
  return res.json({ ok: true, updatedAt: analytics.updatedAt });
});

app.post('/api/contact', (req, res) => {
  const data = readMessages();
  const entry = sanitizeMessagePayload(req.body || {});

  if (!entry.fullName || !entry.email || !entry.subject || !entry.message) {
    return res.status(400).json({ message: 'Full name, email, subject, and message are required.' });
  }

  if (!entry.email.includes('@')) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }

  if (!['support', 'business', 'dispute'].includes(entry.inquiryType)) {
    return res.status(400).json({ message: 'Invalid inquiry type.' });
  }

  data.messages.unshift(entry);
  if (data.messages.length > 500) {
    data.messages = data.messages.slice(0, 500);
  }
  writeMessages(data);

  return res.status(201).json({ ok: true, ticketId: entry.id });
});

app.get('/api/admin/projects', requireAuth, (req, res) => {
  const { projects } = readProjectsData();
  res.json({ projects });
});

app.post('/api/admin/projects', requireAuth, (req, res) => {
  const data = readProjectsData();
  const project = sanitizeProjectPayload(req.body);

  if (!project.name || !project.url) {
    return res.status(400).json({ message: 'Project name and URL are required.' });
  }

  if (typeof req.body.order === 'number') {
    project.order = req.body.order;
  } else {
    project.order = data.projects.length;
  }

  data.projects.push(project);
  writeProjectsData(data);
  return res.status(201).json({ project });
});

app.post('/api/admin/projects/import', requireAuth, (req, res) => {
  const mode = String((req.body && req.body.mode) || 'append').toLowerCase();
  const rawProjects = req.body && req.body.projects;

  if (!Array.isArray(rawProjects) || rawProjects.length === 0) {
    return res.status(400).json({ message: 'projects array is required.' });
  }

  if (!['append', 'replace'].includes(mode)) {
    return res.status(400).json({ message: 'mode must be append or replace.' });
  }

  const data = readProjectsData();
  const base = mode === 'replace' ? [] : data.projects;
  const nextProjects = [...base];

  for (const rawProject of rawProjects) {
    const sanitized = sanitizeProjectPayload(rawProject || {});
    if (!sanitized.name || !sanitized.url) {
      continue;
    }
    sanitized.id = sanitized.id || cryptoRandomId();
    sanitized.order = nextProjects.length;
    nextProjects.push(sanitized);
  }

  data.projects = nextProjects;
  writeProjectsData(data);
  return res.json({ ok: true, projects: data.projects });
});

app.put('/api/admin/projects/:id', requireAuth, (req, res) => {
  const data = readProjectsData();
  const idx = data.projects.findIndex((p) => p.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  const updated = sanitizeProjectPayload({ ...data.projects[idx], ...req.body, id: req.params.id });
  updated.order = typeof req.body.order === 'number' ? req.body.order : data.projects[idx].order || idx;
  data.projects[idx] = updated;
  writeProjectsData(data);
  return res.json({ project: updated });
});

app.delete('/api/admin/projects/:id', requireAuth, (req, res) => {
  const data = readProjectsData();
  const nextProjects = data.projects.filter((p) => p.id !== req.params.id);

  if (nextProjects.length === data.projects.length) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  data.projects = nextProjects;
  writeProjectsData(data);
  return res.json({ ok: true });
});

app.post('/api/admin/projects/reorder', requireAuth, (req, res) => {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ message: 'orderedIds array is required.' });
  }

  const data = readProjectsData();
  const idSet = new Set(orderedIds);

  for (const project of data.projects) {
    if (!idSet.has(project.id)) {
      orderedIds.push(project.id);
    }
  }

  const indexMap = new Map(orderedIds.map((id, index) => [id, index]));
  data.projects = data.projects
    .map((project) => ({ ...project, order: indexMap.get(project.id) ?? 9999 }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  writeProjectsData(data);
  return res.json({ ok: true, projects: data.projects });
});

app.get('/api/admin/settings', requireAuth, (req, res) => {
  const settings = readSettings();
  return res.json({ settings });
});

app.put('/api/admin/settings', requireAuth, (req, res) => {
  const current = readSettings();
  const merged = sanitizeSettingsPayload({
    ...current,
    ...req.body,
    social: {
      ...(current.social || {}),
      ...((req.body && req.body.social) || {})
    }
  });
  writeSettings(merged);
  return res.json({ ok: true, settings: merged });
});

app.get('/api/admin/analytics', requireAuth, (req, res) => {
  const analytics = readAnalytics();
  const { projects } = readProjectsData();

  const perProject = projects
    .map((project) => {
      const event = analytics.projects[project.id] || {};
      return {
        id: project.id,
        name: project.name,
        visible: project.visible !== false,
        clicks: Number(event.clicks || 0),
        bookmarks: Number(event.bookmarks || 0)
      };
    })
    .sort((a, b) => b.clicks - a.clicks);

  return res.json({
    totals: {
      pageViews: Number(analytics.totals.pageViews || 0),
      projectClicks: Number(analytics.totals.projectClicks || 0),
      projectBookmarks: Number(analytics.totals.projectBookmarks || 0)
    },
    updatedAt: analytics.updatedAt,
    projects: perProject
  });
});

app.get('/api/admin/messages', requireAuth, (req, res) => {
  const data = readMessages();
  return res.json({ messages: data.messages || [] });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'help.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDataFile();

if (SESSION_SECRET === 'replace-this-session-secret') {
  console.warn('[security] SESSION_SECRET is using a default value. Set a strong secret in environment variables.');
}

if (ADMIN_PASSWORD_HASH === DEFAULT_ADMIN_PASSWORD_HASH) {
  console.warn('[security] ADMIN_PASSWORD_HASH is using a development default. Set ADMIN_PASSWORD_HASH in environment variables.');
}

if (!ADMIN_HASH_IS_BCRYPT) {
  const message = '[security] ADMIN_PASSWORD_HASH is not a valid bcrypt hash. Generate one and set it in environment variables.';
  if (IS_PROD) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
}

if (IS_PROD && SESSION_SECRET === 'replace-this-session-secret') {
  console.error('[security] Refusing to start in production with default SESSION_SECRET.');
  process.exit(1);
}

if (IS_PROD && ADMIN_PASSWORD_HASH === DEFAULT_ADMIN_PASSWORD_HASH) {
  console.error('[security] Refusing to start in production with default ADMIN_PASSWORD_HASH.');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`anupro landing listening on http://localhost:${PORT}`);
});