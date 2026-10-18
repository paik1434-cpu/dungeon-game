'use strict';
// ===== 기본 설정 =====
const cv = document.getElementById('c'); let ctx = cv.getContext('2d');
const W = 960, H = 540, GROUND = 470, G = 0.65;
const keys = {}, pressed = {};
addEventListener('keydown', e => {
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sign = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
const choice = a => a[Math.floor(Math.random() * a.length)];
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const circleRect = (c, r) => {
  const nx = clamp(c.x, r.x, r.x + r.w), ny = clamp(c.y, r.y, r.y + r.h);
  return (c.x - nx) ** 2 + (c.y - ny) ** 2 <= c.r * c.r;
};
const cx = e => e.x + e.w / 2, cy = e => e.y + e.h / 2;
const PINK = '#ff2a64', INK = '#0b0b0d', PAPER = '#efede6';

// ===== 상태 =====
let state = 'title', sel = 0, P = null, S = null, stageIdx = 0, lastCrit = false, curSrc = 'basic', curLvm = 1, curFx = 'arrow', curIco = 'slash', menuPrev = 'play';
let freeze = 0, shake = 0, scrFlash = { c: '#fff', a: 0 }, combo = { n: 0, t: 0, best: 0 };

// ===== 타격감 헬퍼 =====
const hitstop = n => { freeze = Math.min(8, Math.max(freeze, n)); };
const addShake = m => { shake = Math.max(shake, m); };
const flashScreen = (c, a) => { scrFlash = { c, a }; };

// ===== 캐릭터 / 스킬 정의 =====
function front(w, off = 0) { return P.facing * (P.w / 2 + off + w / 2); }
function sched(t, fn) { S.sched.push({ t, fn, src: curSrc, lvm: curLvm, fx: curFx, ico: curIco }); }

// ===== 적 / 던전 정의 =====
const ETYPES = {
  slime:    { name: '슬라임',     hp: 30,  dmg: 8,  spd: 1.0, w: 34, h: 26, ai: 'walk', hop: true, shape: 'slime' },
  bat:      { name: '박쥐',       hp: 20,  dmg: 7,  spd: 1.8, w: 30, h: 20, ai: 'fly',  shape: 'bat' },
  goblin:   { name: '고블린',     hp: 40,  dmg: 10, spd: 1.4, w: 30, h: 40, ai: 'walk', shape: 'goblin' },
  garcher:  { name: '고블린 궁수', hp: 30,  dmg: 9,  spd: 1.0, w: 28, h: 40, ai: 'shoot', shape: 'goblin' },
  skeleton: { name: '해골',       hp: 55,  dmg: 12, spd: 1.3, w: 30, h: 46, ai: 'walk', shape: 'skeleton' },
  ghost:    { name: '유령',       hp: 35,  dmg: 10, spd: 1.5, w: 32, h: 40, ai: 'fly',  shape: 'ghost' },
  mage:     { name: '어둠 마법사', hp: 40,  dmg: 11, spd: 1.0, w: 28, h: 44, ai: 'shoot', shape: 'hood' },
  golem:    { name: '골렘',       hp: 130, dmg: 18, spd: 0.8, w: 48, h: 58, ai: 'walk', shape: 'golem' },
  imp:      { name: '임프',       hp: 40,  dmg: 12, spd: 2.0, w: 28, h: 28, ai: 'fly',  shape: 'imp' },
  caster:   { name: '화염술사',   hp: 50,  dmg: 14, spd: 1.0, w: 28, h: 44, ai: 'shoot', shape: 'hood' }
};

// ===== 플레이어 =====
function makePlayer(cls) {
  return { cls, x: 80, y: GROUND - 54, w: 24, h: 54, aim: { x: 1, y: 0 }, running: false, vx: 0, vy: 0, facing: 1, onGround: true, jumps: 0, coyote: 0, lv: 1, exp: 0,
    maxhp: cls.hp, hp: cls.hp, maxmp: cls.mp, mp: cls.mp, inv: 0, cd: {}, buffAtk: 0, haste: 0, stealth: 0,
    dash: 0, dashV: 0, slam: 0, hurtT: 0, drop: 0, nextCrit: false, atkT: 0, lungeT: 0, lunge: 0,
    gold: 0, points: 0, stats: { basic: 0, aspd: 0, skill: 0, cdr: 0, move: 0, dodge: 0, crit: 0, hp: 0 }, owned: {}, slots: [null, null, null, null, null],
    skillLv: {}, bag: [], equip: { weapon: null, armor: null, acc: null }, g: { atk: 0, hp: 0, crit: 0, aspd: 0, cdr: 0, move: 0, dodge: 0, gold: 0 }, checkX: null };
}
// 레벨/스탯에 따른 최대 HP·MP 재계산
function recalcP() {
  P.maxhp = P.cls.hp + (P.lv - 1) * 10 + P.stats.hp * 15 + Math.round(P.g.hp);
  P.maxmp = P.cls.mp + (P.lv - 1) * 8;
  P.hp = Math.min(P.hp, P.maxhp); P.mp = Math.min(P.mp, P.maxmp);
}
const needExp = lv => 40 * lv;
function addExp(n) {
  P.exp += n;
  while (P.exp >= needExp(P.lv)) {
    P.exp -= needExp(P.lv); P.lv++; P.points += 3;
    recalcP(); P.hp = P.maxhp; P.mp = P.maxmp;
    text(cx(P), P.y - 30, 'LEVEL UP  Lv.' + P.lv, '#ff2a64', 100, 22);
    text(cx(P), P.y - 54, 'STAT POINT +3  (TAB)', '#111', 130, 16);
    ring(cx(P), cy(P)); sfx('levelup'); flashScreen('#fff', 0.35);
  }
}
function hurtP(d, dir) {
  if (P.inv > 0 || state !== 'play') return;
  if (Math.random() < Math.min(0.5, P.stats.dodge * 0.03 + P.g.dodge)) { // 회피
    P.inv = 20; text(cx(P), P.y - 6, 'DODGE!', '#ff2a64', 40, 20); sfx('blink'); burst(cx(P), cy(P), 6, 'dust'); return;
  }
  d = Math.max(1, Math.round(d));
  S.hits = (S.hits || 0) + 1;
  P.hp -= d; P.inv = 50; P.hurtT = 10; P.vx = dir * 5; P.vy = -6; P.dash = 0; P.slam = 0;
  text(cx(P), P.y, '-' + d, '#ff2a64', 50, 22); burst(cx(P), cy(P), 10, 'ink');
  hitstop(5); addShake(9); flashScreen('#ff2a64', 0.45); sfx('hurt'); combo.n = 0;
  if (P.hp <= 0) { P.hp = 0; state = 'dead'; hitstop(8); sfx('die'); musicSet(-1); deadT = 0; deadSel = 0; SAVE.deaths++; saveMark(); }
}
let deadT = 0;
function pd(mul, src, lvm = 1) {
  const st = P.stats;
  let d = P.cls.base * (1 + 0.06 * (P.lv - 1)) * mul * (src === 'skill' ? 1 + 0.08 * st.skill : 1 + 0.10 * st.basic) * (P.buffAtk > 0 ? 1.5 : 1) * (P.haste > 0 ? 1.2 : 1) * (1 + P.g.atk) * lvm;
  lastCrit = Math.random() < P.cls.crit + 0.02 * st.crit + P.g.crit || P.nextCrit;
  P.nextCrit = false;
  if (lastCrit) d *= 1.7;
  return Math.max(1, Math.round(d * rnd(0.9, 1.1)));
}

// ===== 스테이지 =====
function spawnE(type, x, y) {
  const t = ETYPES[type], D = S.D;
  const e = { type, def: t, x, y: 0, w: t.w, h: t.h, vx: 0, vy: 0, kbv: 0, hp: Math.round(t.hp * D.hpMul * S.dfh), dmg: t.dmg * D.dmgMul * S.dfd,
    spd: t.spd, face: -1, patrol: Math.random() < .5 ? 1 : -1, ph: rnd(0, 6), fire: rnd(40, 140), flash: 0, stun: 0, slow: 0, poison: 0, pd: 0,
    dead: false, onGround: false, drop: 0 };
  e.maxhp = e.hp; seenMark(type);
  e.y = y !== undefined ? y : (t.ai === 'fly' ? rnd(150, 300) : GROUND - t.h);
  S.enemies.push(e);
  return e;
}
function spawnBoss() {
  const B = S.D.boss;
  const b = { type: 'boss', boss: true, minions: [], barrier: false, tele: false, last: '', def: B, x: S.arenaL + W - 220, y: GROUND - B.h, w: B.w, h: B.h, vx: 0, vy: 0, kbv: 0, hp: Math.round(B.hp * S.dfh), maxhp: Math.round(B.hp * S.dfh),
    dmg: B.dmg * S.dfd, spd: 1.1, face: -1, flash: 0, stun: 0, slow: 0, poison: 0, pd: 0, dead: false, onGround: true, cd: 90, act: null, drop: 0, ph: 0, fire: 0 };
  S.enemies.push(b); S.boss = b; seenMark(B.shape);
  text(S.arenaL + W / 2, 200, 'BOSS: ' + B.name, '#ff2a64', 150, 32);
  sfx('roar'); addShake(10); musicSet(2); flashScreen('#000', 0.5);
}

// ===== 이펙트 =====
function text(x, y, s, color = '#111', life = 50, size = 16) { S.texts.push({ x, y, s, color, t: 0, life, size }); }
function burst(x, y, n = 8, kind = 'ink') {
  for (let i = 0; i < n; i++) S.parts.push({ kind, x, y, vx: rnd(-4, 4), vy: rnd(-5, 1), life: rnd(16, 34), t: 0, size: rnd(2, 6) });
}
function sparks(x, y, n, color = '#fff', len = 14, dirx = 0) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), sp = rnd(4, 9);
    S.parts.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp + dirx, vy: Math.sin(a) * sp, life: rnd(8, 16), t: 0, size: len, color });
  }
}
function ring(x, y) { S.parts.push({ kind: 'ring', x, y, life: 26, t: 0, size: 10 }); }
function addBox(o) {
  const b = Object.assign({ t: 0, hit: new Set(), shape: 'rect', kb: 0, rx: P ? P.facing : 1, src: curSrc, lvm: curLvm, elem: curFx, ico: curIco }, o);
  if (!b.follow) { b.x = o.cx - o.w / 2; b.y = o.cy - o.h / 2; }
  S.boxes.push(b);
}
function explode(q) {
  fxImpact(q, q.x, Math.min(q.y, GROUND - 10));
  if (q.fx === 'phoenix') { addBox({ cx: q.x, cy: GROUND - 50, w: 280, h: 100, mul: 0.7, life: 150, every: 12, shape: 'circle', fx: 'zone', tint: PINK, src: 'skill', lvm: q.lvm || 1, elem: 'fire', ico: q.ico }); impactFrame(2); zoomPunch(0.1); addShake(16); flashScreen('#fff', 0.7); }
  if (q.fx === 'meteor') { addShake(9); hitstop(2); crackFx(q.x, 1, 100); crackFx(q.x, -1, 100); }
  addBox({ cx: q.x, cy: Math.min(q.y, GROUND - 10), w: q.aoe * 2, h: q.aoe * 2, mul: q.mul, src: q.src || 'skill', lvm: q.lvm || 1, elem: q.fx, ico: q.ico, kb: 5, life: 10, shape: 'circle', slow: q.slow });
  burst(q.x, q.y, 14); sparks(q.x, q.y, 8, '#ff2a64', 18); sfx('boom'); addShake(q.aoe > 60 ? 5 : 2);
  ring(q.x, Math.min(q.y, GROUND - 10));
}

// ===== 데미지 =====
function dmgE(e, d, o = {}) {
  if (e.dead) return;
  if (e.barrier) { d = Math.max(1, Math.round(d * 0.08)); if (S.t % 8 === 0) text(cx(e), e.y - 24, 'BARRIER', PINK, 30, 14); }
  e.hp -= d; e.flash = 6;
  const crit = lastCrit && !o.tick, heavy = crit || (o.mul || 0) >= 1.4 || ultBoost > 0;
  text(cx(e) + rnd(-8, 8), e.y - 4, d, o.tick ? (o.kind === 'burn' ? '#ff2a64' : '#111') : crit ? '#ff2a64' : '#111', crit ? 55 : 40, crit ? 30 : 17);
  if (!o.tick) {
    combo.n++; combo.t = 110; combo.best = Math.max(combo.best, combo.n);
    const pitch = 1 + Math.min(combo.n, 20) * 0.02;
    hitstop(o.multi ? 1 : crit ? 5 : heavy ? 4 : 2);
    addShake(crit ? 6 : heavy ? 4 : 1.5);
    sparks(cx(e), cy(e), crit ? 10 : 5, crit ? '#ff2a64' : '#fff', crit ? 22 : 14, (o.kb || 0) * 0.5);
    burst(cx(e), cy(e), crit ? 8 : 4, 'ink');
    if (S.parts.length < 430) S.parts.push({ kind: 'cut', x: cx(e), y: cy(e), ang: rnd(-0.7, 0.7), size: heavy ? 46 : 30, life: 8, t: 0 });
    sfx(crit ? 'crit' : heavy ? 'hitHeavy' : 'hit', pitch);
    if (ultBoost > 0) { hitstop(o.multi ? 2 : 5); addShake(5); sparks(cx(e), cy(e), 6, '#fff', 24); }
    if (crit) flashScreen('#fff', 0.18);
  }
  if (!e.boss && o.kb) e.kbv = o.kb * 1.6;
  if (o.stun) e.stun = Math.max(e.stun, e.boss ? Math.floor(o.stun * 0.2) : o.stun);
  if (o.slow) e.slow = Math.max(e.slow, o.slow);
  if (o.poison) { e.poison = o.poison; e.pd = Math.max(1, Math.round(d * 0.35)); }
  if (o.burn) { if (!e.burn) SAVE.burns++; e.burn = 180; e.burnD = Math.max(1, Math.round(d * 0.16)); }
  if (o.bleed) { if (!e.bleed) SAVE.bleeds++; e.bleedN = Math.min(5, (e.bleedN || 0) + 1); e.bleed = 240; e.bleedD = Math.max(1, Math.round(d * 0.12)); }
  if (e.hp <= 0) killE(e);
}
function killE(e) {
  e.dead = true;
  if (!e.boss) S.kills = (S.kills || 0) + 1;
  SAVE.kills++; if (e.boss) SAVE.boss[e.def.shape] = (SAVE.boss[e.def.shape] || 0) + 1; else SAVE.mon[e.type] = (SAVE.mon[e.type] || 0) + 1; saveMark();
  if (e.isMimic) mimicDrop(e);
  if (P.berserk > 0) { burst(cx(e), cy(e), 16, 'ink'); sparks(cx(e), cy(e), 14, PINK, 30); hitstop(4); addShake(6); }
  burst(cx(e), cy(e), e.boss ? 50 : 16, 'ink'); sparks(cx(e), cy(e), e.boss ? 24 : 8, '#ff2a64', 22);
  addExp(Math.round((e.boss ? e.def.exp : e.maxhp / 3 / (S.D.hpMul * S.dfh) * (1 + stageIdx * 0.4)) * DIFFS[P.diff === undefined ? 1 : P.diff].exp));
  sfx('kill');
  if (e.boss) {
    S.clearT = 1; hitstop(8); freeze = 30; addShake(16); flashScreen('#fff', 0.9); sfx('boom');
    for (const m of S.enemies) if (!m.dead && m !== e) { m.dead = true; burst(cx(m), cy(m), 8, 'ink'); }
  } else {
    hitstop(3); addShake(3);
    if (Math.random() < 0.35) S.drops.push({ x: cx(e), y: e.y, vy: -4, kind: 'hp' });
    if (Math.random() < 0.35) S.drops.push({ x: cx(e), y: e.y, vy: -4, kind: 'mp' });
  }
  // 장비 드랍: 보스는 희귀 이상 2개, 일반 몬스터는 낮은 확률
  if (e.boss) { for (let i = 0; i < 2; i++) S.drops.push({ kind: 'item', x: cx(e) + rnd(-60, 60), y: cy(e), vx: rnd(-3, 3), vy: -rnd(5, 9), age: 0, item: makeItem(choice(['weapon', 'armor', 'acc']), rollRarity(stageIdx + 2, 1), stageIdx, P.cls.id) }); }
  else if (Math.random() < 0.07 + stageIdx * 0.006) S.drops.push({ kind: 'item', x: cx(e), y: cy(e), vx: rnd(-2, 2), vy: -rnd(4, 7), age: 0, item: makeItem(choice(['weapon', 'armor', 'acc']), rollRarity(stageIdx, 0), stageIdx, P.cls.id) });
  // 골드: 보스는 큰 보상, 일반 몬스터는 체력 비례
  const total = Math.round((e.boss ? 260 + stageIdx * 220 : e.def.hp * 0.45 * (1 + stageIdx * 0.6)) * DIFFS[P.diff === undefined ? 1 : P.diff].gold);
  const n = e.boss ? 12 : total >= 40 ? 4 : total >= 20 ? 2 : 1;
  for (let i = 0; i < n; i++) S.drops.push({ x: cx(e) + rnd(-10, 10), y: cy(e), vx: rnd(-3, 3), vy: -rnd(4, 8), kind: 'gold', amt: Math.max(1, Math.round(total / n)), age: 0 });
}

// ===== 물리 =====
function inPit(e) {
  const m = e.x + e.w / 2;
  for (const p of S.pits) if (m > p.x + 6 && m < p.x + p.w - 6) return true;
  return false;
}
function phys(e, grav = G) {
  const pb = e.y + e.h;
  e.x += e.vx;
  e.vy = Math.min(e.vy + grav, 18);
  e.y += e.vy;
  e.onGround = false; e.plat = null;
  if (e.vy >= 0) {
    if (e.y + e.h >= GROUND && pb <= GROUND + 4 && !inPit(e)) { e.y = GROUND - e.h; e.vy = 0; e.onGround = true; }
    else if (!(e.drop > 0)) {
      for (const pl of S.plats) {
        if (pl.gone) continue;
        if (e.x + e.w > pl.x && e.x < pl.x + pl.w && pb <= pl.y + 3 && e.y + e.h >= pl.y) { e.y = pl.y - e.h; e.vy = 0; e.onGround = true; e.plat = pl; break; }
      }
    }
  }
  if (e.drop > 0) e.drop--;
}

// ===== 플레이어 업데이트 =====
function castSkill(s) {
  const p = P;
  if (p.cd[s.key] > 0) return;
  if (p.mp < s.mp) { text(cx(p), p.y - 10, 'NO MP', '#555'); return; }
  const lvl = p.skillLv[s.id] || 1, lvm = 1 + 0.12 * (lvl - 1);
  p.mp -= s.mp; p.cd[s.key] = s.cd * 60 * (1 - Math.min(0.55, 0.04 * p.stats.cdr + p.g.cdr + 0.03 * (lvl - 1))) + (s.dur || 0); p.atkT = 14;
  if (s.tier === 5 && !S.cut) { SAVE.ults++; S.cut = { t: 0, dur: 60, fire: 48, s, lvm }; p.inv = Math.max(p.inv, 130); sfx('ult'); return; } // 궁극기 컷신
  sfx(s.snd); curSrc = 'skill'; curLvm = lvm; curIco = s.ico; curFx = FXMAP[s.ico] || 'arcane'; castFx(s.ico, false); s.fn();
  S.skillBanner = { en: s.en, name: s.name, t: 0 };
}
function updP() {
  const p = P, wasGround = p.onGround, wasVy = p.vy;
  if (p.inv > 0) p.inv--;
  if (p.buffAtk > 0) p.buffAtk--;
  if (p.haste > 0) p.haste--;
  if (p.focus > 0) p.focus--;
  if (p.berserk > 0) p.berserk--;
  if (p.eye > 0) p.eye--;
  if ((p.buffAtk > 0 || p.haste > 0 || p.focus > 0) && S.t % 3 === 0 && S.parts.length < 420) S.parts.push({ kind: 'ember', x: p.x + rnd(0, p.w), y: p.y + p.h - rnd(0, 24), vx: rnd(-0.3, 0.3), vy: -rnd(0.6, 1.6), life: rnd(20, 34), t: 0, size: rnd(2, 4) });
  if (p.stealth > 0) p.stealth--;
  if (p.hurtT > 0) p.hurtT--;
  if (p.atkT > 0) p.atkT--;
  const tick = p.haste > 0 ? 2 : 1;
  for (const k in p.cd) if (p.cd[k] > 0) p.cd[k] -= tick;
  p.mp = Math.min(p.maxmp, p.mp + p.cls.mpr);

  const dir = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
  // 조준: ↑ = 위, ↑+←/→ = 대각 위, 공중에서 ↓(+←/→) = 아래/대각 아래
  const up = keys.ArrowUp, dn = keys.ArrowDown;
  let ax = p.facing, ay = 0;
  if (up) { ay = -1; ax = dir; }
  else if (dn && !p.onGround) { ay = 1; ax = dir; }
  if (ay !== 0) { const l = Math.hypot(ax, ay); ax /= l; ay /= l; }
  p.aim.x = ax; p.aim.y = ay;

  const runKey = keys.ShiftLeft || keys.ShiftRight;
  p.running = !!(runKey && dir && p.hurtT <= 0 && p.dash <= 0);
  if (p.dash > 0) {
    p.dash--; p.vx = p.dashV; p.vy = Math.min(p.vy, 0) * 0.5;
    if (S.t % 2 === 0) S.parts.push({ kind: 'ghost', x: p.x, y: p.y, w: p.w, h: p.h, life: 12, t: 0, f: p.facing });
    speedLines(2);
  } else if (p.hurtT > 0) { p.vx *= 0.9; }
  else {
    p.vx = dir * (p.cls.spd + (p.haste > 0 ? 0.8 : 0)) * (1 + 0.05 * p.stats.move + p.g.move) * (p.running ? 1.7 : 1);
    if (dir) p.facing = dir;
    if (dir && p.onGround) {
      const every = p.running ? 8 : 18;
      if (S.t % every === 0) { sfx('step'); if (p.running) burst(cx(p) - p.facing * 8, p.y + p.h - 2, 2, 'dust'); }
      if (p.running && S.t % 3 === 0) S.parts.push({ kind: 'speed', x: p.x - p.facing * 6, y: p.y + rnd(8, p.h - 6), len: rnd(14, 34), dir: -p.facing, life: 7, t: 0 });
    }
  }
  if (p.dash <= 0 && p.hurtT <= 0) { // 얼음 바닥: 미끄러짐
    if (p.onIce && p.onGround) p.vx = (p.pvx || 0) + (p.vx - (p.pvx || 0)) * 0.05;
    p.pvx = p.vx;
  } else p.pvx = p.vx;
  if (p.lungeT > 0) { p.lungeT--; p.x += p.lunge; }

  if (p.onGround) p.coyote = 6; else if (p.coyote > 0) p.coyote--;
  if (pressed.Space) {
    if (keys.ArrowDown) { p.drop = 14; }
    else if (p.coyote > 0 && p.jumps === 0) { p.vy = -12.5; p.jumps = 1; p.coyote = 0; burst(cx(p), p.y + p.h, 4, 'dust'); sfx('jump'); }
    else if (p.jumps < 2) { p.vy = -11; p.jumps = 2; burst(cx(p), p.y + p.h, 6, 'dust'); sfx('jump'); }
  }
  if (p.slam === 1 && p.vy > 0) { p.vy = 18; p.slam = 2; }
  phys(p);
  p.x = clamp(p.x, Math.max(S.leftBound, S.lockL), Math.min(S.worldW - p.w, S.lockR - p.w));
  if (p.onGround) {
    p.jumps = 0;
    if (!wasGround && wasVy > 6) { burst(cx(p), p.y + p.h, 4, 'dust'); sfx('land'); }
    if (!wasGround && p.slam === 2) {
      p.slam = 0; curSrc = 'skill';
      const big = p.slamBig; p.slamBig = false;
      addBox({ cx: cx(p), cy: GROUND - 30, w: big ? 560 : 220, h: 90, mul: big ? 4.8 : 1.6, kb: 7, life: 10, stun: 50 });
      for (const d of [-1, 1]) S.projs.push({ x: cx(p), y: GROUND - 16, vx: d * 7, vy: 0, r: 14, mul: big ? 2.6 : 1.2, life: big ? 75 : 40, maxLife: big ? 75 : 40, pierce: 99, color: '#fff', hit: new Set(), kb: 5, wave: true, src: 'skill', lvm: curLvm });
      burst(cx(p), GROUND, 18, 'dust'); ring(cx(p), GROUND - 10); sfx('boom'); addShake(10); hitstop(3);
      for (const d of [-1, 1]) for (let k = 0; k < 2; k++) crackFx(cx(p), d, rnd(70, 190));
      if (big) worldBreakFx();
    }
  }

  // 공격 / 스킬
  const b = p.cls.basic;
  if (keys.KeyA && !(p.cd.J > 0)) {
    p.cd.J = Math.max(5, b.cd * Math.max(0.5, 1 - 0.04 * p.stats.aspd - p.g.aspd)); p.atkT = 10; sfx(b.snd); curSrc = 'basic'; curIco = b.ico; curFx = FXMAP[b.ico] || 'arrow'; castFx(b.ico, true); b.fn();
    if (p.cls.lunge) { p.lunge = p.facing * p.cls.lunge; p.lungeT = 5; }
  }
  SLOT_KEYS.forEach((k, i) => {
    if (!pressed[k]) return;
    const id = p.slots[i];
    if (id) castSkill(SKILLDB[id]); else text(cx(p), p.y - 10, 'EMPTY (TAB)', '#555');
  });
}

// ===== 적 업데이트 =====
function eShoot(e, speed = 4.5) {
  const dx = cx(P) - cx(e), dy = cy(P) - cy(e), l = Math.hypot(dx, dy) || 1;
  S.eprojs.push({ x: cx(e), y: cy(e), vx: dx / l * speed, vy: dy / l * speed, r: 7, dmg: e.dmg * 0.9, life: 200 });
  sfx('eshot');
}
function updE(e) {
  if (e.flash > 0) e.flash--;
  if (e.poison > 0) { e.poison--; if (e.poison % 30 === 0) dmgE(e, e.pd, { tick: true }); }
  tickStatus(e);
  if (e.dead) return;
  e.x += e.kbv; e.kbv *= 0.85;
  if (e.stun > 0) { e.stun--; e.vx = 0; if (e.def.ai !== 'fly') phys(e); else e.y += 0.5; return; }
  const sp = e.spd * (e.slow > 0 ? 0.5 : 1);
  if (e.slow > 0) e.slow--;
  const dx = cx(P) - cx(e), dist = Math.abs(dx);
  const ai = e.def.ai;
  if (e.boss) bossAI(e, dx, dist);
  else if (ai === 'walk') {
    if (dist < 450) { e.face = sign(dx) || 1; e.vx = e.face * sp; }
    else { e.vx = e.patrol * sp * 0.5; if (Math.random() < 0.01) e.patrol *= -1; }
    if (e.def.hop && e.onGround && dist < 450 && Math.random() < 0.03) e.vy = -9;
    guardPit(e);
    phys(e);
  } else if (ai === 'fly') {
    const ty = P.y - 20 + Math.sin(S.t * 0.05 + e.ph) * 50;
    e.face = sign(dx) || 1;
    e.vx = dist < 520 ? e.face * sp : 0;
    e.x += e.vx; e.y += (ty - e.y) * 0.03;
  } else if (ai === 'shoot') {
    e.face = sign(dx) || 1;
    e.vx = dist < 500 ? (dist < 220 ? -e.face * sp : dist > 330 ? e.face * sp : 0) : 0;
    if (--e.fire <= 0 && dist < 560) { e.fire = rnd(110, 150); eShoot(e); }
    guardPit(e);
    phys(e);
  }
  e.x = clamp(e.x, 0, S.worldW - e.w);
  if (!e.boss && overlap(P, e)) hurtP(e.dmg, sign(cx(P) - cx(e)) || 1);
}

function ringBurst(b, n, speed, off, dmgMul = 0.8) {
  for (let i = 0; i < n; i++) { const an = off + i * Math.PI * 2 / n; S.eprojs.push({ x: cx(b), y: cy(b), vx: Math.cos(an) * speed, vy: Math.sin(an) * speed, r: 8, dmg: b.dmg * dmgMul, life: 260 }); }
}
// 배리어: 체력 66% / 33%에서 발동. 소환된 하수인을 모두 처치해야 해제되고, 해제되면 보스가 잠시 기절한다.
function startBarrier(b) {
  b.barrier = true; b.act = null; b.tele = false; b.minions = []; b.vx = 0;
  for (const o of [-170, 0, 170]) {
    const m = spawnE(b.def.minion, clamp(cx(b) + o, S.arenaL + 30, S.worldW - 70));
    if (m.def.ai === 'fly') m.y = 250;
    m.dmg *= 0.9; m.hp = Math.round(m.hp * 0.8); m.maxhp = m.hp; b.minions.push(m); burst(cx(m), cy(m), 8, 'ink');
  }
  text(cx(b), b.y - 70, 'BARRIER!', PINK, 80, 28); sfx('roar'); addShake(10); flashScreen('#fff', 0.5);
}
function bossAI(b, dx, dist) {
  const hpr = b.hp / b.maxhp, phase = hpr > 0.66 ? 0 : hpr > 0.33 ? 1 : 2;
  b.phase = phase;
  const spd = 1 + 0.15 * phase, cdm = 1 - 0.14 * phase;
  const sp = b.spd * (b.slow > 0 ? 0.5 : 1) * spd;
  b.face = sign(dx) || 1; b.tele = false; b.drop = 5; // 보스는 발판에 올라타지 않는다
  b.barrierDone = b.barrierDone || {};
  if (phase > 0 && !b.barrierDone[phase] && !b.act && !b.barrier) { b.barrierDone[phase] = true; startBarrier(b); }
  if (b.barrier) {
    b.vx = 0; b.minions = b.minions.filter(m => !m.dead);
    if (S.t % 90 === 0) ringBurst(b, 8 + phase * 2, 3.4, S.t * 0.05, 0.7);
    if (!b.minions.length) { b.barrier = false; b.stun = 120; b.cd = 50; text(cx(b), b.y - 70, 'BARRIER BREAK!', '#fff', 80, 26); flashScreen('#fff', 0.7); addShake(12); sfx('boom'); hitstop(6); }
    phys(b); b.x = clamp(b.x, S.arenaL, S.worldW - b.w);
    if (overlap(P, b)) hurtP(b.dmg * 0.8, sign(cx(P) - cx(b)) || 1);
    return;
  }
  if (b.act) {
    const a = b.act; a.t++;
    const n = a.n, done = cd => { b.act = null; b.vx = 0; b.cd = Math.round(cd * cdm); };
    if (a.t === 1 && n !== 'summon') sfx('warn');
    if (n === 'charge') {
      b.tele = a.t < 40;
      if (a.t < 40) b.vx = 0;
      else if (a.t === 40) { b.dir = b.face; b.vx = b.dir * 7 * spd; sfx('dash'); }
      else if (a.t >= 85) done(80);
      if (a.t > 40 && a.t < 85 && a.t % 6 === 0) { burst(cx(b), b.y + b.h, 3, 'dust'); addShake(3); }
    } else if (n === 'slam') {
      b.tele = a.t < 25; b.vx = 0;
      if (a.t === 25) b.vy = -15;
      if (a.t > 28 && b.onGround) {
        for (const d of [-1, 1]) { S.eprojs.push({ x: cx(b), y: GROUND - 14, vx: d * 6 * spd, vy: 0, r: 16, dmg: b.dmg, life: 110, wave: true }); if (phase >= 2) S.eprojs.push({ x: cx(b), y: GROUND - 14, vx: d * 3.6, vy: 0, r: 16, dmg: b.dmg, life: 140, wave: true }); }
        burst(cx(b), GROUND, 22, 'dust'); ring(cx(b), GROUND - 10); sfx('boom'); addShake(12); hitstop(3);
        for (const d of [-1, 1]) for (let k = 0; k < 3; k++) crackFx(cx(b), d, rnd(90, 260));
        done(80);
      }
    } else if (n === 'fan') {
      b.tele = a.t < 30; b.vx = 0;
      const vol = 2 + phase;
      if (a.t >= 30 && (a.t - 30) % 20 === 0 && (a.t - 30) / 20 < vol) {
        const base = Math.atan2(cy(P) - cy(b), cx(P) - cx(b)), cnt = 5 + phase * 2;
        for (let i = 0; i < cnt; i++) { const an = base + (i - (cnt - 1) / 2) * 0.2; S.eprojs.push({ x: cx(b), y: cy(b), vx: Math.cos(an) * 5.2, vy: Math.sin(an) * 5.2, r: 9, dmg: b.dmg * 0.9, life: 220 }); }
        sfx('fire'); addShake(3);
      }
      if (a.t >= 30 + 20 * (vol - 1) + 30) done(75);
    } else if (n === 'summon') {
      b.vx = 0;
      if (a.t === 40) {
        sfx('roar');
        const cnt = 2 + phase;
        for (let k = 0; k < cnt; k++) { const m = spawnE(b.def.minion, clamp(cx(b) + (k - (cnt - 1) / 2) * 190, S.arenaL + 20, S.worldW - 60)); if (m.def.ai === 'fly') m.y = 250; m.dmg *= 0.9; burst(cx(m), cy(m), 8, 'ink'); }
      }
      if (a.t >= 70) done(110);
    } else if (n === 'rain') {
      b.vx = 0;
      if (a.t === 1) sfx('meteor');
      if (a.t >= 20 && a.t <= 90 && a.t % Math.max(3, 6 - phase * 2) === 0)
        S.eprojs.push({ x: clamp(cx(P) + rnd(-260, 260), S.arenaL + 10, S.worldW - 10), y: -10, vx: 0, vy: 7, r: 11, dmg: b.dmg * 0.9, life: 120, fall: true });
      if (a.t >= 110) done(80);
    } else if (n === 'leap') {
      if (a.t === 1) { a.tx = clamp(cx(P), S.arenaL + 60, S.worldW - 60); S.marks.push({ x: a.tx, t: 0, life: 70 }); }
      b.tele = a.t < 30;
      if (a.t < 30) b.vx = 0;
      else if (a.t === 30) { b.vy = -18; b.vx = (a.tx - cx(b)) / 55; sfx('jump'); }
      else if (a.t > 36 && b.onGround) {
        b.vx = 0;
        for (const d of [-1, 1]) S.eprojs.push({ x: cx(b), y: GROUND - 14, vx: d * 7, vy: 0, r: 16, dmg: b.dmg, life: 90, wave: true });
        if (Math.abs(cx(P) - cx(b)) < 120 && P.y + P.h > GROUND - 60) hurtP(b.dmg * 1.3, sign(cx(P) - cx(b)) || 1);
        burst(cx(b), GROUND, 22, 'dust'); ring(cx(b), GROUND - 10); sfx('boom'); addShake(14); hitstop(3);
        for (const d of [-1, 1]) crackFx(cx(b), d, rnd(120, 240));
        done(70);
      } else if (a.t > 150) done(70);
    } else if (n === 'erupt') {
      b.tele = a.t < 28; b.vx = 0;
      if (a.t === 12) {
        const cnt = 5 + phase * 2;
        for (let k = 0; k < cnt; k++) S.erupts.push({ x: clamp(cx(P) + (k - (cnt - 1) / 2) * 95 + rnd(-25, 25), S.arenaL + 20, S.worldW - 20), t: -k * 3, warn: 34, on: 26, dmg: b.dmg * 1.1 });
      }
      if (a.t >= 80) done(90);
    } else if (n === 'barrage') {
      b.tele = a.t < 25; b.vx = 0;
      const bursts = 3 + phase;
      if (a.t >= 25 && (a.t - 25) % 12 === 0 && (a.t - 25) / 12 < bursts) { const k = (a.t - 25) / 12; ringBurst(b, 10 + phase * 2, 3.3 + phase * 0.3, k * 0.37 + a.t * 0.01, 0.8); sfx('eshot'); addShake(2); }
      if (a.t >= 25 + 12 * bursts + 30) done(80);
    } else if (n === 'rockfall') {
      b.tele = a.t < 20; b.vx = 0;
      if (a.t === 20) {
        const cnt = 8 + phase * 3;
        for (let i = 0; i < cnt; i++) S.warns.push({ x: rnd(S.arenaL + 30, S.worldW - 30), t: -i * 4, dmg: b.dmg * 0.9 });
        addShake(6); sfx('boom');
      }
      if (a.t >= 100) done(80);
    }
  } else {
    b.cd--;
    b.vx = dist > 140 ? b.face * sp * 0.6 : 0;
    if (b.cd <= 0) {
      const pool = b.def.pat.filter(p => p !== b.last), pick = choice(pool.length ? pool : b.def.pat);
      b.last = pick; b.act = { n: pick, t: 0 };
    }
  }
  phys(b);
  b.x = clamp(b.x, S.arenaL, S.worldW - b.w);
  if (b.act && b.act.n === 'charge' && b.act.t > 40 && (b.x <= S.arenaL || b.x >= S.worldW - b.w)) b.act.t = 85;
  if (overlap(P, b)) hurtP(b.dmg * (b.act && b.act.n === 'charge' && b.act.t >= 40 ? 1.4 : 0.8), sign(cx(P) - cx(b)) || 1);
}

// ===== 전체 업데이트 =====
function update() {
  S.t++;
  if (S.t % 30 === 0) achCheck();
  if (ultBoost > 0) ultBoost--;
  if (S.banner > 0) S.banner--;
  if (S.skillBanner && ++S.skillBanner.t > 60) S.skillBanner = null;
  if (combo.t > 0 && --combo.t <= 0) combo.n = 0;
  movePlats();
  updP();
  terrainP();
  if (!S.locked && P.x > S.arenaL + 60) { S.locked = true; S.leftBound = S.arenaL; spawnBoss(); }
  for (const e of S.enemies) {
    if (!e.boss && Math.abs(cx(e) - cx(P)) > 1300) continue; // 멀리 있는 적은 잠들어 있다
    updE(e);
    if (e.y > H + 40) e.dead = true; // 구덩이에 빠짐
  }
  S.enemies = S.enemies.filter(e => !e.dead);
  updHazards(); updHazards2(); updEvents();

  // 히트박스
  for (const b of S.boxes) {
    if (b.follow) { b.x = cx(P) + b.rx - b.w / 2; b.y = cy(P) + b.ry - b.h / 2; }
    b.t++;
    if (b.every && b.t % b.every === 0) b.hit = new Set();
    const bcx = b.follow ? cx(P) : b.x + b.w / 2;
    for (const e of S.enemies) {
      if (e.dead || b.hit.has(e) || !overlap(b, e)) continue;
      b.hit.add(e);
      const dir = sign(cx(e) - bcx) || P.facing;
      dmgE(e, pd(b.mul, b.src, b.lvm), { kb: b.kb * dir, stun: b.stun, slow: b.slow, poison: b.poison, burn: FIREFX.has(b.elem), bleed: procBleed(b), mul: b.mul, multi: !!b.every });
    }
  }
  S.boxes = S.boxes.filter(b => b.t < b.life);

  // 플레이어 투사체
  for (const q of S.projs) {
    if (q.homing && !q.wave) { // 약한 유도: 가까운 적 쪽으로 서서히 방향을 튼다
      const hd = Math.atan2(q.vy, q.vx), spd = Math.hypot(q.vx, q.vy);
      if (!q.tgt || q.tgt.dead) {
        let best = null, bd = 1e9;
        for (const e of S.enemies) {
          if (e.dead) continue;
          const ex = cx(e) - q.x, ey = cy(e) - q.y, d = Math.hypot(ex, ey);
          if (d > 380) continue;
          let df = Math.atan2(ey, ex) - hd; df = Math.atan2(Math.sin(df), Math.cos(df));
          if (Math.abs(df) > 1.0) continue;
          if (d < bd) { bd = d; best = e; }
        }
        q.tgt = best;
      }
      if (q.tgt) {
        let df = Math.atan2(cy(q.tgt) - q.y, cx(q.tgt) - q.x) - hd; df = Math.atan2(Math.sin(df), Math.cos(df));
        const nh = hd + clamp(df, -q.homing, q.homing); q.vx = Math.cos(nh) * spd; q.vy = Math.sin(nh) * spd;
      }
    }
    q.x += q.vx; q.y += q.vy; q.life--; fxTrail(q);
    let boom = false;
    for (const e of S.enemies) {
      if (e.dead || q.hit.has(e) || !circleRect(q, e)) continue;
      q.hit.add(e);
      if (q.aoe) { boom = true; break; }
      dmgE(e, pd(q.mul, q.src, q.lvm), { kb: q.kb * sign(q.vx), poison: q.poison, slow: q.slow, stun: q.stun, burn: FIREFX.has(q.fx), bleed: procBleed(q), mul: q.mul });
      fxImpact(q, q.x, q.y);
      q.pierce--;
      if (q.pierce < 0) { q.life = 0; break; }
    }
    if (!q.wave && q.y + q.r >= GROUND) { if (q.aoe) boom = true; else q.life = 0; }
    if (q.life <= 0 && q.aoe && !boom) boom = true; // 사거리 끝에서 폭발
    if (boom) { explode(q); q.life = 0; }
    if (q.x < -50 || q.x > S.worldW + 50) q.life = 0;
  }
  S.projs = S.projs.filter(q => q.life > 0);

  // 적 투사체
  for (const q of S.eprojs) {
    q.x += q.vx; q.y += q.vy; q.life--; efxTrail(q);
    if (circleRect(q, P)) { hurtP(q.dmg, sign(q.vx) || 1); if (!q.wave) q.life = 0; }
    if (q.fall && q.y >= GROUND - 6) { q.life = 0; burst(q.x, GROUND, 6, 'dust'); addShake(2); }
  }
  S.eprojs = S.eprojs.filter(q => q.life > 0);

  // 예약 실행
  for (const s of S.sched) s.t--;
  const ready = S.sched.filter(s => s.t <= 0);
  S.sched = S.sched.filter(s => s.t > 0);
  for (const s of ready) { curSrc = s.src; curLvm = s.lvm || 1; curFx = s.fx || 'arrow'; curIco = s.ico || 'slash'; s.fn(); }

  // 드랍
  for (const d of S.drops) {
    if (d.kind === 'item') { // 장비 드랍: 튀어 오르다 가까워지면 빨려옴
      d.vy += 0.4; d.x += d.vx; d.vx *= 0.96; d.y = Math.min(d.y + d.vy, GROUND - 10); d.age++;
      const dx = cx(P) - d.x, dy = cy(P) - d.y, dist = Math.hypot(dx, dy);
      if (d.age > 25 && dist < 120) { d.x += dx * 0.12; d.y += dy * 0.12; }
      if (dist < 28) { d.got = true; if (giveItem(d.item)) { (S.itemsGot = S.itemsGot || []).push(d.item); text(d.x, d.y - 14, RARITY[d.item.ri].en + ' · ' + d.item.name, RARITY[d.item.ri].col, 100, 15); sfx('levelup'); } }
      continue;
    }
    if (d.kind === 'gold') { // 골드: 튀어 오르다 가까워지면 자석처럼 빨려옴
      if (!d.fixed) { d.vy += 0.4; d.x += d.vx; d.vx *= 0.96; d.y = Math.min(d.y + d.vy, GROUND - 8); }
      d.age++;
      const dx = cx(P) - d.x, dy = cy(P) - d.y, dist = Math.hypot(dx, dy);
      if (d.age > 25 && dist < 180) { d.x += dx * 0.14; d.y += dy * 0.14; }
      if (dist < 26) { d.got = true; const gv = Math.round(d.amt * (1 + P.g.gold)); P.gold += gv; S.goldGot = (S.goldGot || 0) + gv; SAVE.gold += gv; saveMark(); sfx('coin'); text(d.x, d.y - 10, '+' + gv, '#111', 30, 14); }
      continue;
    }
    d.vy += 0.4; d.y = Math.min(d.y + d.vy, GROUND - 8);
    if (Math.abs(d.x - cx(P)) < 28 && Math.abs(d.y - cy(P)) < 40) {
      d.got = true; sfx('pickup');
      if (d.kind === 'hp') { P.hp = Math.min(P.maxhp, P.hp + 20); text(d.x, d.y - 10, '+HP', '#ff2a64'); }
      else { P.mp = Math.min(P.maxmp, P.mp + 15); text(d.x, d.y - 10, '+MP', '#111'); }
    }
  }
  S.drops = S.drops.filter(d => !d.got);

  // 파티클 / 텍스트
  for (const p of S.parts) {
    p.t++; const kd = p.kind;
    if (kd === 'speed') p.x += p.dir * 2;
    else if (kd === 'ink' || kd === 'dust' || kd === 'spark') { p.x += p.vx; p.y += p.vy; if (kd !== 'spark') p.vy += 0.2; p.vx *= 0.96; }
    else if (kd === 'ember') { p.x += p.vx; p.y += p.vy; p.vy -= 0.04; p.vx *= 0.97; }
    else if (kd === 'snow') { p.x += p.vx + Math.sin(p.t * 0.2) * 0.3; p.y += p.vy; p.vy += 0.01; }
    else if (kd === 'smoke') { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; }
    else if (kd === 'shard') { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.rot += p.vr || 0.2; }
    else if (kd === 'drop') { p.x += p.vx; p.y += p.vy; p.vy += 0.25; }
  }
  S.parts = S.parts.filter(p => p.t < p.life);
  if (S.parts.length > 480) S.parts.splice(0, S.parts.length - 480);
  for (const t of S.texts) { t.t++; t.y -= 0.6; }
  S.texts = S.texts.filter(t => t.t < t.life);

  // 카메라
  const target = S.locked ? S.arenaL : clamp(cx(P) - W / 2 + P.facing * 40, 0, S.arenaL);
  S.cam += (target - S.cam) * 0.12;

  if (S.clearT > 0) { S.clearT++; if (S.clearT === 100) { sfx('clear'); } if (S.clearT > 150) { state = 'clear'; musicSet(-1); onClear(); } }
}
