'use strict';
const $ = (selector) => document.querySelector(selector);
$('#year').textContent = new Date().getFullYear();
const menu = $('.menu-toggle');
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); $('nav').classList.toggle('open', open); });
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => { $('nav').classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
document.querySelectorAll('[data-service]').forEach(card => card.addEventListener('click', () => { $('#service').value = card.dataset.service; }));
const whatsappUrl = (text) => 'https://wa.me/27791512446?text=' + encodeURIComponent(text);
$('#quote-form').addEventListener('submit', event => { event.preventDefault(); const name = $('#name').value.trim(), message = $('#message').value.trim(); if (!name || !message) return; const url = whatsappUrl(`Hi S² Electrical, my name is ${name}.\nI’m interested in: ${$('#service').value}.\n\n${message}`); window.open(url, '_blank', 'noopener,noreferrer'); });
const panel = $('#assistant'), toggle = $('#assistant-toggle');
function setAssistant(open) { panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); if (open) $('#chat-input').focus(); else toggle.focus(); }
toggle.addEventListener('click', () => setAssistant(panel.hidden));
$('#assistant-close').addEventListener('click', () => setAssistant(false));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) setAssistant(false); });
function answer(question) {
  const q = question.toLowerCase();
  if (/emergency|urgent|spark|smoke|shock|burn/.test(q)) return 'For urgent electrical assistance, call S² Electrical on 079 151 2446. This demo cannot assess faults or dispatch a technician. Keep clear of exposed wiring or damaged equipment.';
  if (/solar|inverter|battery|panel|backup/.test(q)) return 'S² Electrical designs and installs solar systems for homes, farms and industrial applications. The team will need your location and energy requirements to discuss a suitable system. Would you like to start a WhatsApp enquiry?';
  if (/quote|price|cost|book/.test(q)) return 'Pricing depends on the work and site requirements. Use the enquiry form to share your name, location and project details with the team on WhatsApp. No quote or booking is confirmed by this demo.';
  if (/contact|phone|address|location|where|hour/.test(q)) return 'You can reach S² Electrical on 079 151 2446 or info@s2electrical.co.za. The office is at 135 Genl Kritzinger Street, Welgelegen, Polokwane. Please contact the team directly to confirm availability.';
  if (/business|commercial|industrial|contract/.test(q)) return 'S² Electrical handles commercial and industrial electrical contracting, including larger projects with electrical consultants. Share your site location and scope with the team to discuss your requirements.';
  if (/home|domestic|wire|installation|service|repair|maintenance/.test(q)) return 'The team works on domestic, commercial and industrial electrical installations, general electrical work and solar systems. Tell the team what you need and where the property is located.';
  if (/hello|^hi\b|hey/.test(q)) return 'Hello! Are you looking for electrical work, solar solutions, or a quote? I can guide you to the right next step.';
  return 'I’m a scripted demo guide, so I can help with services, solar enquiries, quotes and contact details. For a specific technical question, please speak with the S² Electrical team on WhatsApp.';
}
function send(question) {
  question = question.trim().slice(0,500); if (!question) return;
  const log = $('#chat-log'), user = document.createElement('p'), bot = document.createElement('p');
  user.className = 'user-message'; user.textContent = question; log.append(user);
  bot.className = 'bot-message'; bot.textContent = answer(question); log.append(bot);
  const link = document.createElement('a'); link.href = whatsappUrl('Hi S² Electrical, ' + question); link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Continue with the team on WhatsApp ↗'; bot.append(document.createElement('br'),document.createElement('br'),link);
  log.scrollTop = log.scrollHeight;
}
$('#chat-form').addEventListener('submit', event => { event.preventDefault(); send($('#chat-input').value); $('#chat-input').value = ''; });
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => send(button.dataset.question)));
