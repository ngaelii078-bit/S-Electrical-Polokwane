/* Dependency-free, scroll-scrubbed typography. Content remains readable without JS. */
(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headings = [];
  const clamp = value => Math.min(1, Math.max(0, value));
  let frame = 0;
  let lastTime = 0;

  function wrapWords(element, className, offset = 0) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    const words = [];
    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const piece of node.textContent.split(/(\s+)/)) {
        if (!piece) continue;
        if (/^\s+$/.test(piece)) { fragment.append(document.createTextNode(piece)); continue; }
        const word = document.createElement('span');
        word.className = className;
        word.textContent = piece;
        word.style.setProperty('--word-index', offset + words.length);
        if (className === 'hero-word') {
          const clip = document.createElement('span');
          clip.className = 'hero-word-clip';
          clip.append(word);
          fragment.append(clip);
        } else fragment.append(word);
        words.push(word);
      }
      node.replaceWith(fragment);
    }
    return words;
  }

  // Keep one continuous, accessible heading label while visual words move independently.
  function labelHeading(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    element.setAttribute('aria-label', clone.textContent.replace(/\s+/g, ' ').trim());
  }

  const hero = document.querySelector('h1');
  if (hero && !preference.matches) {
    labelHeading(hero);
    let index = 0;
    hero.querySelectorAll('.hero-line').forEach(line => {
      // Adjacent block spans require a space in the accessible name.
      line.setAttribute('aria-hidden', 'true');
      index += wrapWords(line, 'hero-word', index).length;
    });
    hero.setAttribute('aria-label', [...hero.querySelectorAll('.hero-line')].map(line => line.textContent).join(' '));
  }

  document.querySelectorAll('main h2').forEach(element => {
    labelHeading(element);
    element.classList.add('word-heading');
    element.querySelectorAll(':scope > span').forEach(span => span.classList.add('heading-accent'));
    const words = wrapWords(element, 'scroll-word');
    words.forEach(word => word.setAttribute('aria-hidden', 'true'));
    // Preserve the accent container, line breaks and natural wrapping.
    element.querySelectorAll('.heading-accent').forEach(span => span.setAttribute('aria-hidden', 'true'));
    element.closest('.reveal')?.classList.add('heading-container');
    headings.push({ element, words, current: 0, target: 0 });
  });

  function measure() {
    const height = window.innerHeight;
    // A generous scroll interval makes every word visibly progress, rather than pop in.
    headings.forEach(heading => {
      const rect = heading.element.getBoundingClientRect();
      const start = height * .91;
      const end = height * .43 - Math.min(rect.height * .2, 40);
      heading.target = preference.matches ? 1 : clamp((start - rect.top) / (start - end));
    });
  }

  function render(heading) {
    const count = heading.words.length;
    heading.words.forEach((word, index) => {
      // Overlap each word's transition slightly, creating a fluid reading rhythm.
      const progress = clamp((heading.current * (count + 1.8) - index) / 2.8);
      const eased = 1 - Math.pow(1 - progress, 3);
      word.style.setProperty('--word-opacity', (.17 + .83 * eased).toFixed(3));
      word.style.setProperty('--word-rise', ((1 - eased) * 24).toFixed(2) + 'px');
    });
  }

  function tick(time) {
    frame = 0;
    measure();
    const elapsed = Math.min(64, lastTime ? time - lastTime : 16.67);
    const smoothing = 1 - Math.exp(-elapsed / 105);
    lastTime = time;
    let pending = false;
    headings.forEach(heading => {
      const distance = heading.target - heading.current;
      heading.current = preference.matches || Math.abs(distance) < .0005
        ? heading.target : heading.current + distance * smoothing;
      if (Math.abs(heading.target - heading.current) > .0005) pending = true;
      render(heading);
    });
    if (pending) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(tick); }
  measure();
  headings.forEach(heading => { heading.current = heading.target; render(heading); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  preference.addEventListener('change', schedule);
  if (document.fonts) document.fonts.ready.then(schedule);
})();
