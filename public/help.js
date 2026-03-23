const themeToggle = document.getElementById('themeToggle');
const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');
const supportEmailLink = document.getElementById('supportEmailLink');
const businessEmailLink = document.getElementById('businessEmailLink');

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

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const data = await res.json();
    const email = data.settings?.contactEmail || 'support@anupro.me';
    supportEmailLink.href = `mailto:${email}`;
    supportEmailLink.textContent = email;
  } catch {
    // Ignore settings failures for help page resilience.
  }
}

contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  contactStatus.textContent = 'Submitting...';

  const formData = new FormData(contactForm);
  const payload = {
    fullName: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    inquiryType: String(formData.get('inquiryType') || '').trim(),
    subject: String(formData.get('subject') || '').trim(),
    message: String(formData.get('message') || '').trim()
  };

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Could not submit your request.');
    }

    contactForm.reset();
    contactStatus.textContent = `Request submitted. Ticket ID: ${data.ticketId}`;
  } catch (error) {
    contactStatus.textContent = error.message;
  }
});

document.getElementById('year').textContent = String(new Date().getFullYear());

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));

loadSettings();
businessEmailLink.href = 'mailto:business@anupro.me';
