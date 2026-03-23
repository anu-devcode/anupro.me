const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const adminProjects = document.getElementById('adminProjects');
const projectForm = document.getElementById('projectForm');
const resetBtn = document.getElementById('resetBtn');
const formStatus = document.getElementById('formStatus');
const formTitle = document.getElementById('formTitle');
const settingsForm = document.getElementById('settingsForm');
const settingsStatus = document.getElementById('settingsStatus');
const importForm = document.getElementById('importForm');
const importStatus = document.getElementById('importStatus');
const refreshAnalyticsBtn = document.getElementById('refreshAnalyticsBtn');
const statPageViews = document.getElementById('statPageViews');
const statProjectClicks = document.getElementById('statProjectClicks');
const statBookmarks = document.getElementById('statBookmarks');
const analyticsUpdatedAt = document.getElementById('analyticsUpdatedAt');
const topProjectsAnalytics = document.getElementById('topProjectsAnalytics');
const refreshMessagesBtn = document.getElementById('refreshMessagesBtn');
const messagesSummary = document.getElementById('messagesSummary');
const adminMessages = document.getElementById('adminMessages');

let projectsState = [];
let analyticsState = null;
let messagesState = [];

function formToPayload(form) {
  const raw = new FormData(form);
  const tags = String(raw.get('tags') || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    id: raw.get('id') || undefined,
    name: String(raw.get('name') || ''),
    description: String(raw.get('description') || ''),
    url: String(raw.get('url') || ''),
    tags,
    platform: String(raw.get('platform') || ''),
    problem: String(raw.get('problem') || ''),
    impact: String(raw.get('impact') || ''),
    metrics: String(raw.get('metrics') || ''),
    featured: raw.get('featured') === 'on',
    visible: raw.get('visible') === 'on'
  };
}

function setFormFromProject(project) {
  projectForm.elements.id.value = project.id;
  projectForm.elements.name.value = project.name || '';
  projectForm.elements.description.value = project.description || '';
  projectForm.elements.url.value = project.url || '';
  projectForm.elements.tags.value = (project.tags || []).join(', ');
  projectForm.elements.platform.value = project.platform || '';
  projectForm.elements.problem.value = project.problem || '';
  projectForm.elements.impact.value = project.impact || '';
  projectForm.elements.metrics.value = project.metrics || '';
  projectForm.elements.featured.checked = Boolean(project.featured);
  projectForm.elements.visible.checked = project.visible !== false;
  formTitle.textContent = 'Edit Project';
}

function clearForm() {
  projectForm.reset();
  projectForm.elements.id.value = '';
  projectForm.elements.visible.checked = true;
  formTitle.textContent = 'Add Project';
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function renderAdminProjects() {
  if (!projectsState.length) {
    adminProjects.innerHTML = '<p>No projects yet.</p>';
    return;
  }

  adminProjects.innerHTML = projectsState
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(
      (project, index) => `
      <article class="project-row" data-id="${project.id}">
        <h4>${project.name}</h4>
        <p>${project.description || ''}</p>
        <div class="row-meta">
          <span>${project.platform || 'Custom'}</span>
          <span>${project.featured ? 'Featured' : 'Standard'} · ${project.visible ? 'Public' : 'Private'} · ${project.clicks || 0} clicks</span>
        </div>
        <div class="row-actions">
          <button class="mini-btn" data-action="up" ${index === 0 ? 'disabled' : ''}>Move Up</button>
          <button class="mini-btn" data-action="down" ${index === projectsState.length - 1 ? 'disabled' : ''}>Move Down</button>
          <button class="mini-btn" data-action="edit">Edit</button>
          <button class="mini-btn" data-action="delete">Delete</button>
        </div>
      </article>
    `
    )
    .join('');
}

async function loadAdminProjects() {
  const data = await request('/api/admin/projects');
  projectsState = data.projects || [];

  if (analyticsState && Array.isArray(analyticsState.projects)) {
    const clickMap = new Map(analyticsState.projects.map((item) => [item.id, item.clicks]));
    projectsState = projectsState.map((project) => ({ ...project, clicks: clickMap.get(project.id) || 0 }));
  }

  renderAdminProjects();
}

function fillSettingsForm(settings) {
  if (!settings) return;
  settingsForm.elements.ownerName.value = settings.ownerName || '';
  settingsForm.elements.contactEmail.value = settings.contactEmail || '';
  settingsForm.elements.github.value = settings.social?.github || '';
  settingsForm.elements.linkedin.value = settings.social?.linkedin || '';
  settingsForm.elements.x.value = settings.social?.x || '';
}

async function loadSettings() {
  const data = await request('/api/admin/settings');
  fillSettingsForm(data.settings || {});
}

function renderAnalytics() {
  const totals = analyticsState?.totals || {};
  statPageViews.textContent = String(totals.pageViews || 0);
  statProjectClicks.textContent = String(totals.projectClicks || 0);
  statBookmarks.textContent = String(totals.projectBookmarks || 0);
  analyticsUpdatedAt.textContent = `Last updated: ${analyticsState?.updatedAt ? new Date(analyticsState.updatedAt).toLocaleString() : '--'}`;

  const top = (analyticsState?.projects || []).slice(0, 5);
  if (!top.length) {
    topProjectsAnalytics.innerHTML = '<p>No engagement data yet.</p>';
    return;
  }

  topProjectsAnalytics.innerHTML = top
    .map(
      (project) => `
      <article class="project-row">
        <h4>${project.name}</h4>
        <div class="row-meta">
          <span>${project.visible ? 'Public' : 'Private'}</span>
          <span>${project.clicks} clicks · ${project.bookmarks} bookmarks</span>
        </div>
      </article>
    `
    )
    .join('');
}

async function loadAnalytics() {
  const data = await request('/api/admin/analytics');
  analyticsState = data;
  renderAnalytics();
}

function formatInquiryType(type) {
  const value = String(type || '').toLowerCase();
  if (value === 'business') return 'Business Inquiry';
  if (value === 'dispute') return 'Dispute Resolution';
  return 'Support';
}

function renderMessages() {
  if (!messagesState.length) {
    messagesSummary.textContent = 'No messages yet.';
    adminMessages.innerHTML = '<p>No submissions yet.</p>';
    return;
  }

  messagesSummary.textContent = `${messagesState.length} message${messagesState.length === 1 ? '' : 's'} received`;
  adminMessages.innerHTML = messagesState
    .map(
      (message) => `
      <article class="project-row message-row">
        <div class="row-meta">
          <strong>${message.fullName}</strong>
          <span class="inquiry-pill ${String(message.inquiryType || '').toLowerCase()}">${formatInquiryType(message.inquiryType)}</span>
        </div>
        <p class="message-subject">${message.subject}</p>
        <p>${message.message}</p>
        <div class="row-meta">
          <span>${message.email}</span>
          <span>${new Date(message.createdAt).toLocaleString()}</span>
        </div>
        <div class="row-actions">
          <a class="mini-btn" href="mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject || 'Support request')}">Reply by Email</a>
        </div>
      </article>
    `
    )
    .join('');
}

async function loadMessages() {
  const data = await request('/api/admin/messages');
  messagesState = data.messages || [];
  renderMessages();
}

function swapProjectOrder(indexA, indexB) {
  const sorted = [...projectsState].sort((a, b) => (a.order || 0) - (b.order || 0));
  const temp = sorted[indexA];
  sorted[indexA] = sorted[indexB];
  sorted[indexB] = temp;
  projectsState = sorted.map((project, idx) => ({ ...project, order: idx }));
  return sorted.map((project) => project.id);
}

async function ensureAuth() {
  try {
    const auth = await request('/api/auth/me', { method: 'GET' });
    if (auth.authenticated) {
      loginCard.classList.add('hidden');
      dashboard.classList.remove('hidden');
      await loadAnalytics();
      await loadSettings();
      await loadAdminProjects();
      await loadMessages();
      return;
    }
  } catch {
    // Keep login visible on failure.
  }

  loginCard.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const body = {
    username: loginForm.elements.username.value,
    password: loginForm.elements.password.value
  };

  try {
    await request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
    loginForm.reset();
    await ensureAuth();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', async () => {
  await request('/api/auth/logout', { method: 'POST' });
  clearForm();
  await ensureAuth();
});

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formStatus.textContent = '';
  const payload = formToPayload(projectForm);

  try {
    if (payload.id) {
      await request(`/api/admin/projects/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      formStatus.textContent = 'Project updated.';
    } else {
      delete payload.id;
      await request('/api/admin/projects', { method: 'POST', body: JSON.stringify(payload) });
      formStatus.textContent = 'Project added.';
    }

    clearForm();
    await loadAdminProjects();
  } catch (error) {
    formStatus.textContent = error.message;
  }
});

resetBtn.addEventListener('click', () => {
  clearForm();
  formStatus.textContent = '';
});

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  settingsStatus.textContent = '';

  const payload = {
    ownerName: settingsForm.elements.ownerName.value,
    contactEmail: settingsForm.elements.contactEmail.value,
    social: {
      github: settingsForm.elements.github.value,
      linkedin: settingsForm.elements.linkedin.value,
      x: settingsForm.elements.x.value
    }
  };

  try {
    await request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    settingsStatus.textContent = 'Settings saved.';
  } catch (error) {
    settingsStatus.textContent = error.message;
  }
});

importForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  importStatus.textContent = '';

  let parsed;
  try {
    parsed = JSON.parse(importForm.elements.json.value || '[]');
  } catch {
    importStatus.textContent = 'Invalid JSON. Please paste a valid array.';
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    importStatus.textContent = 'Provide a non-empty array of projects.';
    return;
  }

  try {
    await request('/api/admin/projects/import', {
      method: 'POST',
      body: JSON.stringify({
        mode: importForm.elements.mode.value,
        projects: parsed
      })
    });

    importForm.elements.json.value = '';
    importStatus.textContent = `Imported ${parsed.length} project entries.`;
    await loadAdminProjects();
  } catch (error) {
    importStatus.textContent = error.message;
  }
});

refreshAnalyticsBtn.addEventListener('click', async () => {
  await loadAnalytics();
  await loadAdminProjects();
});

refreshMessagesBtn.addEventListener('click', async () => {
  await loadMessages();
});

adminProjects.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const card = event.target.closest('.project-row');
  const projectId = card?.getAttribute('data-id');
  if (!projectId) return;

  const action = button.getAttribute('data-action');
  const sorted = [...projectsState].sort((a, b) => (a.order || 0) - (b.order || 0));
  const index = sorted.findIndex((project) => project.id === projectId);

  if (action === 'edit') {
    const project = projectsState.find((p) => p.id === projectId);
    if (project) setFormFromProject(project);
    return;
  }

  if (action === 'delete') {
    if (!window.confirm('Delete this project?')) return;

    try {
      await request(`/api/admin/projects/${projectId}`, { method: 'DELETE' });
      await loadAnalytics();
      await loadAdminProjects();
      clearForm();
      formStatus.textContent = 'Project deleted.';
    } catch (error) {
      formStatus.textContent = error.message;
    }
    return;
  }

  if (action === 'up' && index > 0) {
    const orderedIds = swapProjectOrder(index, index - 1);
    await request('/api/admin/projects/reorder', { method: 'POST', body: JSON.stringify({ orderedIds }) });
    await loadAnalytics();
    await loadAdminProjects();
    return;
  }

  if (action === 'down' && index < sorted.length - 1) {
    const orderedIds = swapProjectOrder(index, index + 1);
    await request('/api/admin/projects/reorder', { method: 'POST', body: JSON.stringify({ orderedIds }) });
    await loadAnalytics();
    await loadAdminProjects();
  }
});

ensureAuth();
