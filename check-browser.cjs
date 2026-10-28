const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 's2-browser-'));
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=9237', '--user-data-dir=' + profile, 'about:blank'
  ], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    let targets;
    for (let i = 0; i < 40; i++) {
      try { targets = await (await fetch('http://127.0.0.1:9237/json')).json(); break; }
      catch { await delay(150); }
    }
    if (!targets) throw Error('Chrome debugging connection unavailable');
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let id = 0;
    const pending = new Map();
    const errors = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const task = pending.get(message.id); pending.delete(message.id);
        if (message.error) task.reject(Error(message.error.message)); else task.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    });
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
      return result.result.value;
    };
    await cdp('Runtime.enable');
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url: pathToFileURL(path.resolve('dist/index.html')).href });
    await delay(3000);
    await evaluate('document.fonts.ready.then(() => true)');
    assert.equal(await evaluate('document.querySelectorAll(".hero-word").length > 3'), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Desktop overflow');
    const shot = async name => {
      const result = await cdp('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(os.tmpdir(), name), Buffer.from(result.data, 'base64'));
    };
    await shot('s2-reviewed-desktop.png');
    await evaluate('document.documentElement.style.scrollBehavior="auto"; scrollTo(0,document.querySelector("#services h2").getBoundingClientRect().top+scrollY-innerHeight*.7)');
    await delay(900);
    const opacities = await evaluate('[...document.querySelectorAll("#services .scroll-word")].map(word => Number(getComputedStyle(word).opacity))');
    assert.ok(opacities[0] > opacities.at(-1), 'Words must reveal sequentially with scroll');
    await shot('s2-reviewed-services.png');
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate('scrollTo(0,0)');
    await delay(600);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Mobile overflow');
    await shot('s2-reviewed-mobile.png');
    await evaluate('document.querySelector(".menu-toggle").click()');
    assert.equal(await evaluate('document.querySelector("nav").classList.contains("open")'), true);
    await evaluate('document.querySelector(".menu-toggle").click(); document.querySelector("#assistant-toggle").click(); document.querySelector("[data-question]").click()');
    assert.equal(await evaluate('document.querySelectorAll(".user-message").length'), 1);
    assert.equal(await evaluate('document.querySelector("#assistant").hidden'), false);
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await delay(300);
    assert.equal(await evaluate('[...document.querySelectorAll(".scroll-word")].every(word => getComputedStyle(word).opacity === "1")'), true);
    assert.deepEqual(errors, [], 'Browser runtime errors');
    console.log('PASS: desktop/mobile overflow, hero words, scroll word sequence, mobile menu, demo chat, reduced motion, and browser runtime.');
    await cdp('Browser.close');
  } finally {
    socket?.close();
    chrome.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
