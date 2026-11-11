(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);

  // ======================================================================
  // Settings
  // ======================================================================
  const DEFAULTS = {
    theme: 'system',
    letters: true, numbers: false, punctuation: false,
    tape: true, labels: true, hints: true, showCode: true,
    wpm: 12, farnsworth: true, fwpm: 8,
    sound: true, pitch: 600, volume: 0.5,
    passage: 'free', custom: ''
  };
  const S = (() => {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('morse.settings') || '{}')); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  })();
  function save() { try { localStorage.setItem('morse.settings', JSON.stringify(S)); } catch (e) { /* private mode */ } }

  // Timing (all ms). One dot = 1200 / WPM (the "PARIS" standard).
  const unit = () => 1200 / S.wpm;
  function gapUnit() {
    // Farnsworth: characters at S.wpm, spacing stretched so overall speed is S.fwpm.
    if (!S.farnsworth || S.fwpm >= S.wpm) return unit();
    const c = S.wpm, s = S.fwpm;
    const ta = (60 * c - 37.2 * s) / (s * c); // seconds of total spacing per "PARIS "
    return (ta / 19) * 1000;
  }
  const dashThreshold = () => 2 * unit();
  const letterGap = () => 3 * gapUnit();
  const wordGap = () => 7 * gapUnit();

  // ======================================================================
  // Character tables (respecting enabled sets)
  // ======================================================================
  let codeToChar = {}, charToCode = {};
  function rebuildTables() {
    codeToChar = {}; charToCode = {};
    for (const set of ['letters', 'numbers', 'punctuation']) {
      if (!S[set]) continue;
      for (const [ch, code] of Object.entries(MORSE[set])) { codeToChar[code] = ch; charToCode[ch] = code; }
    }
  }
  const pretty = (code) => code.replace(/\./g, '·').replace(/-/g, '−').split('').join(' ');
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function normalizeText(t) {
    return t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-').replace(/…/g, '...')
      .replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // ======================================================================
  // DOM
  // ======================================================================
  const cardEl = $('#card'), treeEl = $('#tree'), keyBtn = $('#key'), statusEl = $('#status');
  const tapeWrap = $('#tapeWrap'), tapeView = $('#tapeView'), tapeEl = $('#tape');
  const passageSel = $('#passage'), customBox = $('#customBox'), customText = $('#customText');
  const attributionEl = $('#attribution'), restartBtn = $('#restart'), clearBtn = $('#clear');

  // ======================================================================
  // Card rendering (SVG generated from the tree layout)
  // ======================================================================
  const CW = 64, CH = 60, PAD = 34, TOP = 46;
  let nodeEls = new Map(), edgeEls = new Map(), antennaEl = null;

  function renderCard() {
    const { items, edges } = layoutMorseTree(buildMorseTree(codeToChar));
    let minX = 0, maxX = 0, maxY = 0;
    for (const it of items) { minX = Math.min(minX, it.x); maxX = Math.max(maxX, it.x); maxY = Math.max(maxY, it.y); }
    const W = (maxX - minX) * CW + PAD * 2;
    const H = maxY * CH + PAD * 2 + TOP;
    const X = (x) => (x - minX) * CW + PAD;
    const Y = (y) => y * CH + PAD + TOP;

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Morse code tree">`;
    for (const e of edges) {
      svg += `<line class="trace" data-code="${e.code}" x1="${X(e.x1)}" y1="${Y(e.y1)}" x2="${X(e.x2)}" y2="${Y(e.y2)}"/>`;
    }
    // Antenna at the root.
    const ax = X(0), ay = Y(0);
    svg += `<g class="antenna" id="antenna">
      <line class="stem" x1="${ax}" y1="${ay}" x2="${ax}" y2="${ay - 22}"/>
      <path class="flare" d="M${ax - 14} ${ay - 44} L${ax + 14} ${ay - 44} L${ax + 3} ${ay - 22} L${ax - 3} ${ay - 22} Z"/>
      <path class="wave" d="M${ax - 22} ${ay - 52} q-8 10 0 20 M${ax + 22} ${ay - 52} q8 10 0 20"/>
      <path class="wave" d="M${ax - 30} ${ay - 58} q-12 16 0 32 M${ax + 30} ${ay - 58} q12 16 0 32"/>
    </g>`;
    for (const it of items) {
      const n = it.node, cx = X(it.x), cy = Y(it.y);
      const isDash = n.code[n.code.length - 1] === '-';
      const junction = !n.ch;
      const k = junction ? 0.65 : 1;
      let shape;
      if (isDash) {
        const w = (it.via === 'h' ? 36 : 16) * k, h = (it.via === 'h' ? 16 : 36) * k;
        shape = `<rect class="shape" x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="2"/>`;
      } else {
        shape = `<circle class="shape" cx="${cx}" cy="${cy}" r="${13 * k}"/>`;
      }
      let label = '';
      if (n.ch) {
        let lx, ly, anchor;
        if (it.via === 'h') { lx = cx; ly = cy - (isDash ? 15 : 20); anchor = 'middle'; }
        else {
          const off = isDash ? 15 : 20;
          lx = cx - it.side * off; ly = cy + 7; anchor = it.side > 0 ? 'end' : 'start';
        }
        label = `<text x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(n.ch)}</text>`;
      }
      svg += `<g class="node ${isDash ? 'dash' : 'dot'}${junction ? ' junction' : ''}" data-code="${n.code}">${shape}${label}</g>`;
    }
    svg += '</svg>';
    treeEl.innerHTML = svg;

    nodeEls = new Map(); edgeEls = new Map();
    treeEl.querySelectorAll('.node').forEach((g) => nodeEls.set(g.dataset.code, g));
    treeEl.querySelectorAll('.trace').forEach((l) => edgeEls.set(l.dataset.code, l));
    antennaEl = treeEl.querySelector('#antenna');
    cardEl.style.maxWidth = Math.round(W + 44) + 'px';
    cardEl.classList.toggle('labels-off', !S.labels);
    updateHints();
  }

  function clearClass(cls) { treeEl.querySelectorAll('.' + cls).forEach((el) => el.classList.remove(cls)); }

  function lightPath(c) {
    clearClass('lit'); clearClass('current');
    for (let i = 1; i <= c.length; i++) {
      const p = c.slice(0, i), g = nodeEls.get(p);
      if (!g) break;
      g.classList.add('lit');
      edgeEls.get(p)?.classList.add('lit');
      if (i === c.length) g.classList.add('current');
    }
  }

  let pendingCode = null;
  function setPending(c) {
    if (c === pendingCode) return;
    if (pendingCode) nodeEls.get(pendingCode)?.classList.remove('pending');
    pendingCode = c;
    if (c) nodeEls.get(c)?.classList.add('pending');
  }

  let badTimer = 0;
  function flashError(c) {
    clearTimeout(badTimer);
    clearClass('bad'); clearClass('lit'); clearClass('current');
    for (let i = 1; i <= c.length; i++) nodeEls.get(c.slice(0, i))?.classList.add('bad');
    antennaEl?.classList.add('err');
    cardEl.classList.remove('shake'); void cardEl.offsetWidth; cardEl.classList.add('shake');
    badTimer = setTimeout(() => { clearClass('bad'); antennaEl?.classList.remove('err'); }, 650);
  }

  // ======================================================================
  // Audio sidetone
  // ======================================================================
  let ac = null, osc = null, gain = null;
  function ensureAudio() {
    if (!ac) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      ac = new Ctx();
      osc = ac.createOscillator(); gain = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = S.pitch; gain.gain.value = 0;
      osc.connect(gain).connect(ac.destination); osc.start();
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }
  function toneOn() {
    if (!S.sound || !ensureAudio()) return;
    const t = ac.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(S.volume * 0.5, t, 0.004);
  }
  function toneOff() {
    if (!ac) return;
    const t = ac.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0, t, 0.006);
  }

  // ======================================================================
  // Keyer
  // ======================================================================
  let down = false, t0 = 0, code = '', rafId = 0;
  let letterTimer = 0, wordTimer = 0, fadeTimer = 0;
  let freeTape = [];   // [{ch, code, bad}]
  let goal = null;     // {chars:[{ch, code}], idx, startTime, finished, errors}

  const symFor = (ms) => (ms >= dashThreshold() ? '-' : '.');
  function clearTimers() { clearTimeout(letterTimer); clearTimeout(wordTimer); clearTimeout(fadeTimer); }

  function pressKey() {
    if (down) return;
    down = true; t0 = performance.now();
    clearTimers();
    toneOn();
    antennaEl?.classList.add('tx'); keyBtn.classList.add('down');
    if (code === '') lightPath('');
    if (goal && !goal.startTime && !goal.finished) goal.startTime = t0;
    preview();
  }
  function preview() {
    if (!down) return;
    setPending(code + symFor(performance.now() - t0));
    rafId = requestAnimationFrame(preview);
  }
  function releaseKey() {
    if (!down) return;
    down = false;
    cancelAnimationFrame(rafId); setPending(null);
    toneOff();
    antennaEl?.classList.remove('tx'); keyBtn.classList.remove('down');
    addSymbol(symFor(performance.now() - t0));
  }

  function addSymbol(sym) {
    if (goal) {
      if (goal.finished) return;
      code += sym;
      return goalSymbol();
    }
    code += sym;
    lightPath(code);
    if (!nodeEls.has(code)) flashError(code);
    renderTape();
    letterTimer = setTimeout(commitLetter, letterGap());
    wordTimer = setTimeout(commitSpace, wordGap());
  }

  // ---- Free keying -------------------------------------------------------
  function commitLetter() {
    if (!code) return;
    const ch = codeToChar[code];
    freeTape.push({ ch: ch || '?', code, bad: !ch });
    if (freeTape.length > 400) freeTape.splice(0, freeTape.length - 400);
    if (ch) setStatus(`<span class="big">${esc(ch)}</span>${pretty(code)}`);
    else setStatus(`${pretty(code)} isn't a character${S.numbers && S.punctuation ? '' : ' with your current settings'}.`, 'err');
    code = '';
    clearClass('lit'); clearClass('current');
    renderTape();
  }
  function commitSpace() {
    const last = freeTape[freeTape.length - 1];
    if (last && last.ch !== ' ') { freeTape.push({ ch: ' ', code: '' }); renderTape(); }
  }

  // ---- Keying a goal text ------------------------------------------------
  function nextKeyable(i) {
    while (goal && i < goal.chars.length && !goal.chars[i].code) i++;
    return i;
  }
  function goalSymbol() {
    const target = goal.chars[goal.idx];
    if (target.code.startsWith(code)) {
      lightPath(code);
      if (code === target.code) {
        code = '';
        goal.idx = nextKeyable(goal.idx + 1);
        if (goal.idx >= goal.chars.length) finishGoal();
        else setStatus(defaultStatus());
        // Leave the finished letter lit briefly, then show the next hint.
        fadeTimer = setTimeout(() => { clearClass('lit'); clearClass('current'); updateHints(); }, Math.min(letterGap(), 700));
      } else {
        letterTimer = setTimeout(goalTimeout, letterGap());
      }
      renderTape();
      if (code) updateHints();
    } else {
      goal.errors++;
      flashError(code);
      code = '';
      setStatus(`Not quite. “${esc(target.ch)}” is ${pretty(target.code)}`, 'err');
      renderTape(); updateHints();
    }
  }
  function goalTimeout() {
    if (!goal || !code) return;
    const target = goal.chars[goal.idx];
    goal.errors++;
    flashError(code);
    code = '';
    setStatus(`That pause ended the letter too soon. “${esc(target.ch)}” is ${pretty(target.code)}, so start it again.`, 'err');
    renderTape(); updateHints();
  }
  function finishGoal() {
    goal.finished = true;
    const secs = Math.max(1, (performance.now() - goal.startTime) / 1000);
    const keyed = goal.chars.filter((c) => c.code).length;
    const words = goal.chars.filter((c) => c.ch !== ' ').length / 5;
    const wpm = (words / (secs / 60)).toFixed(1);
    const m = Math.floor(secs / 60), s = String(Math.round(secs % 60)).padStart(2, '0');
    setStatus(`Done! ${keyed} characters in ${m}:${s}, about ${wpm} WPM, with ${goal.errors} mistake${goal.errors === 1 ? '' : 's'}. Press Restart to go again.`, 'ok');
    updateHints();
  }

  function updateHints() {
    clearClass('hint'); clearClass('hint-next');
    if (!goal || goal.finished || !S.hints) return;
    const tgt = goal.chars[goal.idx].code;
    for (let i = 1; i <= tgt.length; i++) nodeEls.get(tgt.slice(0, i))?.classList.add('hint');
    if (tgt.startsWith(code) && code.length < tgt.length) nodeEls.get(tgt.slice(0, code.length + 1))?.classList.add('hint-next');
  }

  // ======================================================================
  // Paper tape
  // ======================================================================
  function marksHtml(c, nOn, showRest) {
    let h = '';
    for (let i = 0; i < c.length; i++) {
      const on = i < nOn;
      if (!on && !showRest) continue;
      h += `<i class="${c[i] === '.' ? 'd' : 'h'}${on ? ' on' : ''}"></i>`;
    }
    return `<span class="marks">${h}</span>`;
  }
  const cellHtml = (cls, ch, marks) => `<span class="cell ${cls}"><span class="ch">${ch}</span>${marks}</span>`;

  function renderTape() {
    tapeView.classList.toggle('goal', !!goal);
    if (!S.tape) return;
    let html = '';
    if (goal) {
      goal.chars.forEach((c, i) => {
        if (c.ch === ' ') { html += '<span class="cell space"></span>'; return; }
        if (!c.code) { html += cellHtml('skip', esc(c.ch), '<span class="marks"></span>'); return; }
        if (i < goal.idx) html += cellHtml('done', esc(c.ch), marksHtml(c.code, c.code.length, true));
        else if (i === goal.idx && !goal.finished) html += cellHtml('current', esc(c.ch), marksHtml(c.code, code.length, S.showCode));
        else html += cellHtml('todo', esc(c.ch), marksHtml(c.code, 0, S.showCode));
      });
    } else {
      for (const c of freeTape) {
        if (c.ch === ' ') html += '<span class="cell space"></span>';
        else html += cellHtml(c.bad ? 'bad' : 'done', esc(c.ch), marksHtml(c.code, c.code.length, true));
      }
      if (code) html += cellHtml('live', '&nbsp;', marksHtml(code, code.length, true));
      if (!html) html = '<span class="tape-empty">Your keyed letters will print here…</span>';
    }
    tapeEl.innerHTML = html;
    positionTape();
  }
  function positionTape() {
    if (!S.tape) return;
    const vw = tapeView.clientWidth;
    let tx = 0;
    if (goal) {
      const cur = tapeEl.querySelector('.current') || tapeEl.lastElementChild;
      if (cur) tx = vw * 0.35 - (cur.offsetLeft + cur.offsetWidth / 2);
    } else {
      tx = Math.min(0, vw * 0.85 - tapeEl.offsetWidth);
    }
    tapeEl.style.transform = `translateX(${tx}px)`;
  }

  // ======================================================================
  // Passages
  // ======================================================================
  function buildPassageSelect() {
    let html = '<option value="free">Free keying (no goal text)</option><option value="custom">My own text…</option>';
    PASSAGES.forEach((g, gi) => {
      html += `<optgroup label="${esc(g.group)}">`;
      g.items.forEach((p, pi) => { html += `<option value="${gi}:${pi}">${esc(p.title)}</option>`; });
      html += '</optgroup>';
    });
    passageSel.innerHTML = html;
    if (![...passageSel.options].some((o) => o.value === S.passage)) S.passage = 'free';
    passageSel.value = S.passage;
    customText.value = S.custom;
  }
  function currentPassage() {
    if (S.passage === 'free') return null;
    if (S.passage === 'custom') return S.custom.trim() ? { text: S.custom } : null;
    const [gi, pi] = S.passage.split(':').map(Number);
    return PASSAGES[gi]?.items[pi] || null;
  }

  function startPassage() {
    clearTimers();
    code = ''; lightPath(''); setPending(null);
    const p = currentPassage();
    customBox.hidden = S.passage !== 'custom';
    attributionEl.textContent = p && p.by ? '— ' + p.by : '';
    if (!p) {
      goal = null;
    } else {
      const chars = Array.from(normalizeText(p.text)).map((ch) => ({ ch, code: ch === ' ' ? null : charToCode[ch] || null }));
      goal = { chars, idx: 0, startTime: 0, finished: false, errors: 0 };
      goal.idx = nextKeyable(0);
      if (goal.idx >= chars.length) goal.finished = true;
    }
    restartBtn.hidden = !goal;
    $('#showCodeRow').hidden = !goal;
    clearBtn.hidden = !!goal;
    if (goal && goal.finished) setStatus('Nothing in this text can be keyed with your current character settings.', 'err');
    else if (S.passage === 'custom' && !goal) setStatus('Type your text above, then press “Use this text”.');
    else setStatus(defaultStatus());
    renderTape(); updateHints();
  }

  function defaultStatus() {
    if (goal) return 'Key the highlighted character on the tape.';
    return 'Short press = dot, long press = dash. Pause to finish a letter.';
  }
  function setStatus(html, kind) {
    statusEl.innerHTML = html;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  // ======================================================================
  // Settings UI
  // ======================================================================
  function applyTheme() {
    if (S.theme === 'light' || S.theme === 'dark') document.documentElement.setAttribute('data-theme', S.theme);
    else document.documentElement.removeAttribute('data-theme');
  }
  function updateSpeedUI() {
    $('#wpm').value = S.wpm;
    $('#fwpm').max = S.wpm;
    $('#fwpm').value = Math.min(S.fwpm, S.wpm);
    $('#wpmOut').textContent = `${S.wpm} WPM`;
    $('#fwpmOut').textContent = `${Math.min(S.fwpm, S.wpm)} WPM`;
    $('#fwpm').disabled = !S.farnsworth;
    $('#fwpmRow').classList.toggle('disabled', !S.farnsworth);
    const r = (ms) => Math.round(ms) + ' ms';
    const rows = [
      ['Dot (1 unit)', r(unit())],
      ['Dash (3 units)', r(3 * unit())],
      ['A press longer than this is a dash', r(dashThreshold())],
      ['Gap between symbols in a letter', r(unit())],
      ['Silence that ends a letter', r(letterGap())],
      ['Silence that adds a word space', r(wordGap())]
    ];
    $('#timing').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
  }

  function bindSettings() {
    document.querySelectorAll('input[name="theme"]').forEach((r) => {
      r.checked = r.value === S.theme;
      r.addEventListener('change', () => { S.theme = r.value; applyTheme(); save(); });
    });

    for (const id of ['letters', 'numbers', 'punctuation']) {
      const el = $('#' + id);
      el.checked = S[id];
      el.addEventListener('change', () => {
        S[id] = el.checked;
        if (!S.letters && !S.numbers && !S.punctuation) { S[id] = true; el.checked = true; return; }
        save(); rebuildTables(); renderCard(); startPassage();
      });
    }
    const toggles = {
      tape: () => { tapeWrap.hidden = !S.tape; renderTape(); },
      labels: () => cardEl.classList.toggle('labels-off', !S.labels),
      hints: updateHints,
      showCode: renderTape,
      farnsworth: updateSpeedUI,
      sound: () => { if (!S.sound) toneOff(); }
    };
    for (const [id, fn] of Object.entries(toggles)) {
      const el = $('#' + id);
      el.checked = S[id];
      el.addEventListener('change', () => { S[id] = el.checked; save(); fn(); });
    }

    $('#wpm').addEventListener('input', (e) => { S.wpm = +e.target.value; if (S.fwpm > S.wpm) S.fwpm = S.wpm; save(); updateSpeedUI(); });
    $('#fwpm').addEventListener('input', (e) => { S.fwpm = +e.target.value; save(); updateSpeedUI(); });

    const pitch = $('#pitch'), vol = $('#volume');
    pitch.value = S.pitch; vol.value = Math.round(S.volume * 100);
    const soundOut = () => { $('#pitchOut').textContent = S.pitch + ' Hz'; $('#volumeOut').textContent = Math.round(S.volume * 100) + '%'; };
    pitch.addEventListener('input', () => {
      S.pitch = +pitch.value; save(); soundOut();
      if (osc) osc.frequency.setTargetAtTime(S.pitch, ac.currentTime, 0.01);
    });
    vol.addEventListener('input', () => { S.volume = vol.value / 100; save(); soundOut(); });
    soundOut();
    updateSpeedUI();
    tapeWrap.hidden = !S.tape;
  }

  const drawer = $('#settings'), scrim = $('#scrim');
  function openSettings() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); scrim.hidden = false; }
  function closeSettings() {
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
    if (drawer.contains(document.activeElement)) document.activeElement.blur();
  }

  // ======================================================================
  // Input wiring
  // ======================================================================
  const isTyping = (t) => t && (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' ||
    (t.tagName === 'INPUT' && /^(text|search|email|number|url|password)$/i.test(t.type)));
  const isSpace = (e) => e.code === 'Space' || e.key === ' ';

  document.addEventListener('keydown', (e) => {
    if (isSpace(e)) {
      if (isTyping(e.target)) return;
      e.preventDefault();
      if (!e.repeat) pressKey();
    } else if (e.key === 'Escape') {
      closeSettings();
    } else if (e.key === 'Backspace' && !goal && !isTyping(e.target)) {
      e.preventDefault();
      if (code) { code = ''; clearTimers(); lightPath(''); } else freeTape.pop();
      renderTape();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (!isSpace(e) || isTyping(e.target)) return;
    e.preventDefault();
    releaseKey();
  });
  window.addEventListener('blur', releaseKey);

  for (const el of [cardEl, keyBtn]) {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      pressKey();
    });
    el.addEventListener('pointerup', releaseKey);
    el.addEventListener('pointercancel', releaseKey);
    el.addEventListener('lostpointercapture', releaseKey);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  passageSel.addEventListener('change', () => {
    S.passage = passageSel.value; save();
    startPassage();
    if (S.passage === 'custom') customText.focus(); else passageSel.blur(); // so Space keys again
  });
  $('#useCustom').addEventListener('click', (e) => {
    S.custom = customText.value; save();
    startPassage();
    e.currentTarget.blur(); customText.blur();
  });
  restartBtn.addEventListener('click', (e) => { startPassage(); e.currentTarget.blur(); });
  clearBtn.addEventListener('click', (e) => {
    freeTape = []; code = ''; clearTimers(); lightPath('');
    setStatus(defaultStatus()); renderTape(); e.currentTarget.blur();
  });
  $('#openSettings').addEventListener('click', openSettings);
  $('#closeSettings').addEventListener('click', closeSettings);
  scrim.addEventListener('click', closeSettings);
  window.addEventListener('resize', positionTape);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionTape);

  // ======================================================================
  // Boot
  // ======================================================================
  applyTheme();
  rebuildTables();
  bindSettings();
  buildPassageSelect();
  renderCard();
  startPassage();
})();
