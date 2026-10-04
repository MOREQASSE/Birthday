// ===== Interactive Birthday Card for Safaa =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// SVG icon helper (emoji replacements — sprite lives in index.html)
const svgIcon = (name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true"><use href="#${name}"/></svg>`;
const ICON_MUSIC = svgIcon('i-music');
const ICON_MIC = svgIcon('i-mic');
const ICON_MAIL = svgIcon('i-mail');
const ICON_BURST = svgIcon('i-burst');
const PETAL_ICONS = ['i-flower', 'i-heart', 'i-sparkle'];
const SPARK_ICONS = ['i-sparkle', 'i-heart', 'i-flower'];
const BALLOON_ICONS = ['i-balloon', 'i-heart', 'i-flower', 'i-crown', 'i-sparkle'];
const PETAL_COLORS = ['#f27ba7', '#e75d90', '#c9a24b', '#d46a8a'];

// --- Scroll progress + reveal ---
const progressBar = $('#progressBar');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progressBar.style.width = pct + '%';
}, { passive: true });

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
$$('.reveal').forEach(el => io.observe(el));

// --- Petals falling (SVG icons, no emojis) ---
const petalField = $('#petalField');
setInterval(() => {
  if (document.hidden) return;
  const p = document.createElement('span');
  p.className = 'petal';
  const name = PETAL_ICONS[Math.floor(Math.random() * PETAL_ICONS.length)];
  p.innerHTML = svgIcon(name);
  p.style.left = Math.random() * 100 + 'vw';
  const size = 14 + Math.random() * 16;
  p.style.width = size + 'px';
  p.style.height = size + 'px';
  p.style.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
  p.style.animationDuration = (4 + Math.random() * 5) + 's';
  petalField.appendChild(p);
  setTimeout(() => p.remove(), 9500);
}, 900);

// --- Cursor sparkles (SVG icons) ---
window.addEventListener('pointermove', (e) => {
  if (Math.random() > 0.25) return;
  const s = document.createElement('span');
  s.className = 'sparkle';
  const name = SPARK_ICONS[Math.floor(Math.random() * SPARK_ICONS.length)];
  s.innerHTML = svgIcon(name);
  s.style.left = e.clientX + 'px';
  s.style.top = e.clientY + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 800);
}, { passive: true });

// --- Sound (WebAudio, no files) ---
let audioCtx = null, soundOn = true;
function tone(freq = 660, dur = 0.15, type = 'sine', vol = 0.15) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
function popSound() { tone(500 + Math.random() * 500, .12, 'square', .08); tone(900, .08, 'sine', .06); }
function chime() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .3, 'sine', .12), i * 120)); }
$('#musicBtn').addEventListener('click', (e) => {
  soundOn = !soundOn;
  const btn = e.currentTarget;
  btn.classList.toggle('on', !soundOn);
  btn.innerHTML = ICON_MUSIC;
  btn.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Unmute sound');
  btn.style.opacity = soundOn ? '1' : '.45';
  if (soundOn) chime();
});

// --- Love song player ("We Belong Together", loops) ---
const song = new Audio('We%20Belong%20Together.mp3');
song.loop = true;
song.preload = 'auto';
song.volume = 0.9;
const playPauseBtn = $('#playPauseBtn'), rewindBtn = $('#rewindBtn');
const mpTrack = $('#mpTrack'), mpFill = $('#mpFill'), mpKnob = document.querySelector('.mp-knob');
const curTime = $('#curTime'), durTime = $('#durTime');
const entryOverlay = $('#entryOverlay');
const ICON_PLAY = svgIcon('i-play'), ICON_PAUSE = svgIcon('i-pause');
const enterBtn = $('#enterBtn');
const LOAD_DOTS = '<span class="load-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>';
function setLoadingUI() {
  $('#musicPlayer').classList.add('is-loading');
  const t = document.querySelector('.mp-title');
  if (t) t.innerHTML = `${ICON_MUSIC} Loading our song${LOAD_DOTS}`;
  if (enterBtn && !entryOverlay.classList.contains('hidden'))
    enterBtn.innerHTML = `${ICON_MUSIC} Loading our song${LOAD_DOTS}`;
}
function setReadyUI() {
  $('#musicPlayer').classList.remove('is-loading');
  const t = document.querySelector('.mp-title');
  if (t) t.innerHTML = `${ICON_MUSIC} We Belong Together <span class="mp-for">· for Safaa</span>`;
  if (enterBtn) enterBtn.innerHTML = `${ICON_PLAY} Play our song`;
}
function fmt(t) { if (!isFinite(t)) return '0:00'; const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }
function setPlayingUI(playing) {
  playPauseBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
  playPauseBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}
async function startSong() {
  try { await song.play(); setPlayingUI(true); entryOverlay.classList.add('hidden'); }
  catch (e) { setPlayingUI(false); entryOverlay.classList.remove('hidden'); }
}
function seekFromEvent(e) {
  const r = mpTrack.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  if (song.duration) {
    song.currentTime = ratio * song.duration;
    mpTrack.setAttribute('aria-valuenow', Math.round(ratio * 100));
  }
}
song.addEventListener('loadedmetadata', () => { durTime.textContent = fmt(song.duration); });
song.addEventListener('timeupdate', () => {
  if (!song.duration) return;
  const pct = (song.currentTime / song.duration) * 100;
  mpFill.style.width = pct + '%';
  if (mpKnob) mpKnob.style.left = pct + '%';
  curTime.textContent = fmt(song.currentTime);
});
song.addEventListener('play', () => { setPlayingUI(true); entryOverlay.classList.add('hidden'); });
song.addEventListener('pause', () => setPlayingUI(false));
// loading lifecycle: spinner + shimmer until fully loadable, rebuffer guard mid-play
song.addEventListener('canplaythrough', () => { setReadyUI(); startSong(); });
song.addEventListener('playing', () => setReadyUI());
song.addEventListener('waiting', () => setLoadingUI());
song.addEventListener('progress', () => {
  try {
    if (song.duration && song.buffered.length) {
      const pct = (song.buffered.end(song.buffered.length - 1) / song.duration) * 100;
      const buf = $('#mpBuffer');
      if (buf) buf.style.width = Math.min(100, pct) + '%';
    }
  } catch (e) {}
});
playPauseBtn.addEventListener('click', () => { if (song.paused) startSong(); else song.pause(); });
rewindBtn.addEventListener('click', async () => {
  song.currentTime = 0;
  if (song.paused) await startSong();
  tone(520, .12, 'sine', .08);
});
mpTrack.addEventListener('click', seekFromEvent);
mpTrack.addEventListener('keydown', (e) => {
  if (!song.duration) return;
  if (e.key === 'ArrowRight') song.currentTime = Math.min(song.duration, song.currentTime + 5);
  if (e.key === 'ArrowLeft') song.currentTime = Math.max(0, song.currentTime - 5);
});
enterBtn.addEventListener('click', async () => {
  await startSong();
  burstConfetti(80);
  chime();
});
// autoplay attempt on entry + first-gesture fallback (browsers block unmuted autoplay)
setLoadingUI();
startSong();
window.addEventListener('pointerdown', () => startSong(), { once: true });
window.addEventListener('keydown', () => startSong(), { once: true });

// --- Confetti engine (shapes only, no emojis) ---
const canvas = $('#confettiCanvas'), ctx = canvas.getContext('2d');
let parts = [];
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); window.addEventListener('resize', resize);
function burstConfetti(n = 120, x = innerWidth / 2, y = innerHeight / 3) {
  const colors = ['#f27ba7', '#e75d90', '#ffc9d9', '#c9a24b', '#ff8fab', '#ffffff', '#f9a8c4'];
  for (let i = 0; i < n; i++) {
    parts.push({
      x: x + (Math.random() - 0.5) * 100, y,
      vx: (Math.random() - 0.5) * 9, vy: Math.random() * -7 - 2,
      s: 4 + Math.random() * 7, r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3, c: colors[Math.floor(Math.random() * colors.length)],
      life: 90 + Math.random() * 60, shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }
}
(function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  parts = parts.filter(p => p.life > 0);
  parts.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.vx *= 0.99; p.r += p.vr; p.life--;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.fillStyle = p.c;
    if (p.shape === 'rect') ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
    else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
    ctx.restore();
  });
  requestAnimationFrame(loop);
})();

// --- Candle blow logic (locked idle -> one-shot blow -> frozen blown-out) ---
const candles = $('#candles'), fire = $('#candleFire');
const wishReveal = $('#wishReveal'), meterFill = $('#blowMeterFill');
let blown = false, blowing = false;
let blowTimers = [];
function clearBlowTimers() { blowTimers.forEach(clearTimeout); blowTimers = []; }
function stopMic() {
  if (typeof micStream !== 'undefined' && micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
    const mb = $('#micBtn');
    if (mb) mb.innerHTML = ICON_MIC + ' Enable real blow (mic)';
  }
}
function blowOut(celebrate = true) {
  if (blown || blowing) return;
  blowing = true;
  candles.classList.remove('is-blown');
  candles.classList.remove('locked'); // play the tall-blows-short sequence once
  tone(300, .5, 'sawtooth', .05);
  // flame dies with the animation (~59% of the 3s loop): force it out so it never flickers back
  blowTimers.push(setTimeout(() => candles.classList.add('is-blown'), 1800));
  // freeze clean at loop end: paused 0% + flame forced out = calm blown-out candles
  blowTimers.push(setTimeout(() => {
    candles.classList.add('locked');
    blowing = false; blown = true;
    wishReveal.classList.add('show');
    meterFill.style.width = '100%';
    tone(880, .4, 'sine', .1);
    if (celebrate) { burstConfetti(140); chime(); }
    $('#micStatus').textContent = 'Wish sent! Select Relight to light them again.';
    stopMic();
  }, 3050));
}
function relight() {
  clearBlowTimers();
  stopMic();
  blowing = false; blown = false;
  candles.classList.remove('is-blown');
  // rewind every timeline to 0%, then hold paused = lit idle
  candles.classList.add('locked');
  candles.classList.add('restart');
  void candles.offsetWidth;
  candles.classList.remove('restart');
  wishReveal.classList.remove('show');
  meterFill.style.width = '0%';
  tone(600, .15, 'sine', .1);
  $('#micStatus').textContent = 'Tip: click a flame to puff it out too. Move your mouse for sparkles.';
}
$('#blowBtn').addEventListener('click', () => blowOut(true));
$('#relightBtn').addEventListener('click', relight);
fire.addEventListener('click', () => blown ? relight() : blowOut(true));

// mic blow detection
let micStream = null;
$('#micBtn').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  try {
    if (micStream) {
      btn.innerHTML = ICON_MIC + ' Enable real blow (mic)';
      micStream.getTracks().forEach(t => t.stop()); micStream = null;
      $('#micStatus').textContent = 'Mic off. Use the Blow button instead.';
      return;
    }
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    btn.innerHTML = ICON_MIC + ' Listening... blow now!';
    $('#micStatus').textContent = 'Blow into your mic to blow out the candles!';
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const src = actx.createMediaStreamSource(micStream);
    const an = actx.createAnalyser(); an.fftSize = 512;
    src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    (function check() {
      if (!micStream) return;
      an.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      meterFill.style.width = Math.min(100, avg * 2) + '%';
      if (avg > 45) { blowOut(true); }
      else requestAnimationFrame(check);
    })();
  } catch (err) { $('#micStatus').textContent = 'Mic blocked — no worries, the Blow button works with love too.'; }
});

// --- Flip cards + tilt ---
$$('.flip-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
    popSound();
    burstConfetti(25, event.clientX || innerWidth / 2, event.clientY || innerHeight / 2);
  });
  if (card.hasAttribute('data-tilt')) {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.querySelector('.flip-inner').style.transform = `rotateY(${card.classList.contains('flipped') ? 180 : 0}deg) rotateX(${-y * 10}deg) rotateY(${x * 12}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.querySelector('.flip-inner').style.transform = card.classList.contains('flipped') ? 'rotateY(180deg)' : '';
    });
  }
});

// --- Roses ---
const roseNote = $('#roseNote');
$$('.rose').forEach(rose => {
  rose.addEventListener('click', () => {
    $$('.rose').forEach(r => r.classList.remove('bloomed'));
    rose.classList.add('bloomed');
    roseNote.innerHTML = ICON_MAIL + ' ' + rose.dataset.note;
    popSound(); chime();
    const r = rose.getBoundingClientRect();
    burstConfetti(40, r.left + r.width / 2, r.top);
  });
});

// --- Balloon pop game ---
const field = $('#balloonField');
const popScore = $('#popScore'), popMessage = $('#popMessage');
const loveReasons = ["You are Beautiful", "You are Kind", "Your Laugh Heals Me", "My Best Friend", "So Brave at 21", "My Home", "My Adventure", "My Sunshine", "So Talented", "My Peace", "My Sparkle", "My Forever"];
let score = 0, spawned = 0;
const balloonColors = ['#f27ba7', '#e75d90', '#c94a7a', '#ff8fab', '#e9a0b8', '#f7b267', '#d46a8a'];
function spawnBalloon() {
  const b = document.createElement('button');
  b.className = 'pop-balloon';
  const reason = loveReasons[spawned % loveReasons.length];
  const iconName = BALLOON_ICONS[Math.floor(Math.random() * BALLOON_ICONS.length)];
  b.innerHTML = svgIcon(iconName);
  b.title = reason;
  b.setAttribute('aria-label', 'Pop balloon: ' + reason);
  b.style.left = (5 + Math.random() * 80) + '%';
  b.style.background = balloonColors[Math.floor(Math.random() * balloonColors.length)];
  const dur = 5 + Math.random() * 4;
  b.style.animationDuration = dur + 's';
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    score++;
    popScore.textContent = `${Math.min(score, 21)} / 21`;
    popMessage.textContent = `${reason}!`;
    popSound();
    const burst = document.createElement('span');
    burst.className = 'burst';
    burst.innerHTML = ICON_BURST;
    burst.style.left = b.style.left; burst.style.bottom = '50%';
    field.appendChild(burst);
    setTimeout(() => burst.remove(), 600);
    const r = b.getBoundingClientRect();
    burstConfetti(35, r.left + r.width / 2, r.top);
    b.remove();
    if (score === 21) { popMessage.textContent = 'All 21 popped — one for every year! Safaa, you are LOVED beyond measure!'; burstConfetti(250); chime(); }
    else if (score > 21) { popMessage.textContent = `${score} pops! Keep going, queen!`; if (score % 5 === 0) burstConfetti(150); }
  });
  field.appendChild(b);
  spawned++;
  setTimeout(() => { if (b.parentNode) b.remove(); }, (dur + 1) * 1000);
}
function releaseBalloons(n = 8) {
  document.querySelector('.field-hint')?.remove();
  for (let i = 0; i < n; i++) setTimeout(spawnBalloon, i * 350);
  tone(660, .2, 'sine', .1);
}
$('#spawnBalloons').addEventListener('click', () => releaseBalloons(8));
const _heroPopBtn = $('#heroPopBtn');
if (_heroPopBtn) _heroPopBtn.addEventListener('click', () => {
  document.querySelector('#garden').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => releaseBalloons(10), 600);
});
$('#autoPop').addEventListener('click', () => {
  releaseBalloons(21);
  setTimeout(() => {
    $$('.pop-balloon').forEach((b, i) => setTimeout(() => b.click(), 600 + i * 250));
  }, 1500);
});
// ambient auto-spawn
releaseBalloons(5);
setInterval(() => { if (!document.hidden && field.querySelectorAll('.pop-balloon').length < 4) spawnBalloon(); }, 2500);

// --- Finale celebrate (removed with finale section) ---
const _celebrateBtn = $('#celebrateBtn');
if (_celebrateBtn) _celebrateBtn.addEventListener('click', () => {
  const wish = $('#wishInput').value.trim();
  $('#wishEcho').textContent = wish ? `"${wish}" — sealed with a kiss, sent to the stars for your 21st` : 'A secret wish is the most powerful kind';
  chime();
  burstConfetti(220);
  setTimeout(() => burstConfetti(180, innerWidth * 0.2, innerHeight * 0.4), 400);
  setTimeout(() => burstConfetti(180, innerWidth * 0.8, innerHeight * 0.4), 800);
  blowOut(false);
});
const _replayBtn = $('#replayBtn');
if (_replayBtn) _replayBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
