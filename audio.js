'use strict';
// ===== WebAudio 합성 사운드 (외부 파일 없음) =====
const AU = { ctx: null, master: null, sfxG: null, musG: null, nb: null, muted: false, last: {}, level: -1, step: 0, next: 0, drone: null, vol: { master: 1, sfx: 1, music: 1 } };
(function () { try { const v = JSON.parse(localStorage.getItem('dgn_vol') || 'null'); if (v) for (const k in AU.vol) if (typeof v[k] === 'number') AU.vol[k] = Math.max(0, Math.min(1, v[k])); if (localStorage.getItem('dgn_mute') === '1') AU.muted = true; } catch (e) { /* 저장소 사용 불가 */ } })();
function applyVol() {
  if (!AU.ctx) return;
  AU.master.gain.value = AU.muted ? 0 : AU.vol.master * 0.6; AU.sfxG.gain.value = AU.vol.sfx * 0.9; AU.musG.gain.value = AU.vol.music * 0.35;
}
function setVol(k, v) { AU.vol[k] = Math.max(0, Math.min(1, Math.round(v * 20) / 20)); applyVol(); try { localStorage.setItem('dgn_vol', JSON.stringify(AU.vol)); } catch (e) { /* ignore */ } }

function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    const c = AU.ctx = new C();
    const comp = c.createDynamicsCompressor();
    AU.master = c.createGain(); AU.master.gain.value = AU.muted ? 0 : AU.vol.master * 0.6;
    AU.master.connect(comp); comp.connect(c.destination);
    AU.sfxG = c.createGain(); AU.sfxG.gain.value = AU.vol.sfx * 0.9; AU.sfxG.connect(AU.master);
    AU.musG = c.createGain(); AU.musG.gain.value = AU.vol.music * 0.35; AU.musG.connect(AU.master);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AU.nb = buf;
    // 드론(저음 패드)
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    const dg = c.createGain(); dg.gain.value = 0;
    for (const f of [55, 55.35, 82.4]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); }
    lp.connect(dg); dg.connect(AU.musG); AU.drone = dg;
    setInterval(musicTick, 40);
    musicSet(AU.level);
  } catch (e) { AU.ctx = null; }
}
addEventListener('keydown', auInit);
addEventListener('mousedown', auInit);

function tone(o) {
  const c = AU.ctx, t0 = c.currentTime + (o.delay || 0), dur = o.t || 0.1;
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.v || 0.3, t0 + (o.att || 0.003));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(o.dest || AU.sfxG);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}
function noise(o) {
  const c = AU.ctx, t0 = c.currentTime + (o.delay || 0), dur = o.t || 0.1;
  const src = c.createBufferSource(); src.buffer = AU.nb;
  const fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.Q.value = o.q || 1;
  fl.frequency.setValueAtTime(o.f, t0);
  if (o.f2) fl.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.v || 0.3, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(fl); fl.connect(g); g.connect(o.dest || AU.sfxG);
  src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.02);
}
const SFX = {
  hit: p => { noise({ f: 1800, f2: 400, t: .08, v: .35 }); tone({ f: 160 * p, f2: 60, t: .1, v: .4 }); },
  hitHeavy: p => { noise({ type: 'lowpass', f: 2500, f2: 200, t: .16, v: .5 }); tone({ f: 120 * p, f2: 40, t: .22, v: .6 }); tone({ type: 'sawtooth', f: 300, f2: 80, t: .08, v: .2 }); },
  crit: p => { SFX.hitHeavy(p); tone({ type: 'square', f: 1200, f2: 1800, t: .08, v: .12 }); tone({ f: 2400, t: .18, v: .12 }); },
  slash: () => { noise({ f: 800, f2: 4500, t: .1, v: .35, q: .8 }); },
  slashBig: () => { noise({ f: 400, f2: 3000, t: .25, v: .45, q: .7 }); tone({ type: 'sawtooth', f: 180, f2: 60, t: .2, v: .2 }); },
  shot: () => { tone({ type: 'triangle', f: 700, f2: 300, t: .09, v: .25 }); noise({ type: 'highpass', f: 3000, t: .04, v: .15 }); },
  arrow: () => { noise({ f: 2500, f2: 6000, t: .1, v: .25 }); tone({ f: 900, f2: 500, t: .05, v: .1 }); },
  fire: () => { noise({ type: 'lowpass', f: 1500, f2: 300, t: .25, v: .4 }); tone({ type: 'sawtooth', f: 200, f2: 120, t: .2, v: .2 }); },
  ice: () => { tone({ f: 1600, f2: 2400, t: .25, v: .15 }); tone({ type: 'triangle', f: 1000, f2: 600, t: .3, v: .15 }); noise({ type: 'highpass', f: 5000, t: .15, v: .2 }); },
  zap: () => { tone({ type: 'square', f: 1800, f2: 100, t: .2, v: .22 }); noise({ type: 'highpass', f: 2000, t: .25, v: .3 }); },
  boom: () => { noise({ type: 'lowpass', f: 1200, f2: 60, t: .6, v: .7 }); tone({ f: 90, f2: 30, t: .5, v: .7 }); },
  dash: () => { noise({ f: 500, f2: 3000, t: .18, v: .35 }); },
  coin: () => { tone({ type: 'square', f: 1300, f2: 1700, t: .06, v: .1 }); tone({ type: 'square', f: 1900, t: .09, v: .1, delay: .05 }); },
  step: () => { noise({ type: 'lowpass', f: 700, f2: 300, t: .035, v: .1 }); },
  jump: () => { tone({ f: 250, f2: 500, t: .1, v: .18 }); },
  land: () => { noise({ type: 'lowpass', f: 400, t: .06, v: .25 }); tone({ f: 90, f2: 50, t: .08, v: .25 }); },
  hurt: () => { tone({ type: 'sawtooth', f: 300, f2: 60, t: .3, v: .4 }); noise({ type: 'lowpass', f: 800, t: .2, v: .4 }); },
  pickup: () => { tone({ f: 800, f2: 1400, t: .1, v: .2 }); },
  levelup: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'square', f, t: .18, v: .15, delay: i * .08 })); },
  buff: () => { tone({ f: 300, f2: 900, t: .4, v: .25 }); tone({ type: 'triangle', f: 450, f2: 1350, t: .4, v: .15 }); },
  blink: () => { tone({ f: 1200, f2: 200, t: .15, v: .25 }); noise({ type: 'highpass', f: 4000, t: .1, v: .2 }); },
  meteor: () => { tone({ f: 600, f2: 100, t: .6, v: .2 }); noise({ f: 300, f2: 100, t: .6, v: .2 }); },
  warn: () => { tone({ type: 'square', f: 220, t: .12, v: .18 }); tone({ type: 'square', f: 220, t: .12, v: .18, delay: .16 }); },
  eshot: () => { tone({ type: 'sawtooth', f: 400, f2: 200, t: .12, v: .15 }); },
  kill: () => { noise({ f: 1000, f2: 200, t: .15, v: .3 }); tone({ f: 200, f2: 50, t: .2, v: .3 }); },
  roar: () => { tone({ type: 'sawtooth', f: 90, f2: 50, t: .9, v: .45 }); tone({ type: 'sawtooth', f: 95, f2: 45, t: .9, v: .35 }); noise({ type: 'lowpass', f: 600, t: .9, v: .3 }); },
  ui: () => { tone({ type: 'square', f: 600, t: .05, v: .13 }); },
  confirm: () => { tone({ type: 'square', f: 400, f2: 800, t: .12, v: .18 }); noise({ f: 2000, t: .08, v: .2 }); },
  die: () => { tone({ type: 'sawtooth', f: 400, f2: 40, t: 1.0, v: .4 }); },
  clear: () => { [392, 494, 587, 784, 988].forEach((f, i) => tone({ type: 'triangle', f, t: .4, v: .22, delay: i * .12 })); }
};
function sfx(name, pitch = 1) {
  if (!AU.ctx || AU.muted) return;
  const now = performance.now();
  if (AU.last[name] && now - AU.last[name] < 35) return; // 동시 폭주 방지
  AU.last[name] = now;
  try { SFX[name] && SFX[name](pitch); } catch (e) { /* ignore */ }
}
function toggleMute() {
  AU.muted = !AU.muted;
  applyVol(); try { localStorage.setItem('dgn_mute', AU.muted ? '1' : '0'); } catch (e) { /* ignore */ }
}
// 음악: 레벨 -1 무음 / 0 메뉴 / 1 던전 / 2 보스
function musicSet(l) {
  AU.level = l;
  if (!AU.ctx) return;
  AU.drone.gain.linearRampToValueAtTime(l < 0 ? 0 : l === 0 ? 0.16 : 0.09, AU.ctx.currentTime + 0.6);
}
const BASS = [55, 55, 65.4, 55, 49, 49, 65.4, 73.4], PLUCK = [220, 261.6, 293.7, 329.6, 392, 440];
function musicTick() {
  const c = AU.ctx;
  if (!c || AU.level < 1 || AU.muted) { if (c) AU.next = Math.max(AU.next, c.currentTime); return; }
  const bpm = AU.level === 2 ? 150 : 104, sd = 60 / bpm / 4;
  if (AU.next < c.currentTime) AU.next = c.currentTime + 0.05;
  while (AU.next < c.currentTime + 0.2) {
    const s = AU.step++, dl = AU.next - c.currentTime, boss = AU.level === 2;
    if (s % (boss ? 4 : 8) === 0) tone({ f: 130, f2: 40, t: .18, v: .5, delay: dl, dest: AU.musG });
    if (s % 8 === 4) noise({ f: 1800, t: .12, v: boss ? .35 : .2, delay: dl, dest: AU.musG, q: .6 });
    if (s % 2 === 1) noise({ type: 'highpass', f: 7000, t: .03, v: .12, delay: dl, dest: AU.musG });
    if (s % 2 === 0) tone({ type: 'sawtooth', f: BASS[(s >> 1) % BASS.length] * (boss ? 1 : 1), t: sd * 1.6, v: .16, delay: dl, dest: AU.musG });
    if (Math.random() < (boss ? 0.3 : 0.18)) tone({ type: 'triangle', f: choice(PLUCK) * (boss ? 2 : 1), t: .25, v: .12, delay: dl, dest: AU.musG });
    AU.next += sd;
  }
}
SFX.ult = () => {
  tone({ type: 'sawtooth', f: 70, f2: 420, t: .55, v: .3 }); tone({ type: 'square', f: 140, f2: 840, t: .55, v: .12 });
  noise({ type: 'highpass', f: 800, f2: 7000, t: .55, v: .25 });
  tone({ f: 60, f2: 30, t: .7, v: .6, delay: .5 }); noise({ type: 'lowpass', f: 2000, f2: 80, t: .7, v: .5, delay: .5 });
  [392, 523, 659, 784].forEach((f, i) => tone({ type: 'triangle', f, t: .5, v: .16, delay: .46 + i * .02 }));
};
