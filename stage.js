'use strict';
// ===== 던전 정의 / 스테이지 생성 / 지형 기믹 =====
ETYPES.spider = { name: '거미', hp: 45, dmg: 11, spd: 1.6, w: 42, h: 24, ai: 'walk', hop: true, shape: 'spider' };
ETYPES.knight = { name: '타락한 기사', hp: 110, dmg: 16, spd: 1.0, w: 34, h: 52, ai: 'walk', shape: 'knight' };


function coin(x, y, amt) { S.drops.push({ kind: 'gold', x, y, vx: 0, vy: 0, amt, age: 0, fixed: true }); }
function groundMobs(x0, x1, n) {
  for (let i = 0; i < n; i++) {
    const tp = choice(S.D.types), x = rnd(x0, x1);
    if (ETYPES[tp].ai === 'fly') spawnE(tp, x, rnd(150, 300)); else spawnE(tp, x);
  }
}
function airMobs(x0, x1, n) {
  const fl = S.D.types.filter(t => ETYPES[t].ai === 'fly');
  if (!fl.length) return;
  for (let i = 0; i < n; i++) spawnE(choice(fl), rnd(x0, x1), rnd(160, 280));
}
function platShooter(px, py) {
  const sh = S.D.types.filter(t => ETYPES[t].ai === 'shoot');
  if (sh.length) { const tp = choice(sh); spawnE(tp, px, py - ETYPES[tp].h); }
}
// 지형 조각: 각 함수는 소비한 가로 길이를 반환
const SEG = {
  flat(x) {
    const w = rnd(480, 760); groundMobs(x + 60, x + w - 60, 2 + Math.floor(w / 190));
    const np = Math.floor(rnd(0, 3));
    for (let i = 0; i < np; i++) {
      const px = x + 80 + i * 230 + rnd(0, 50), py = choice([380, 330]);
      S.plats.push({ x: px, y: py, w: rnd(120, 170) });
      if (Math.random() < 0.5) coin(px + 60, py - 24, 6);
      if (Math.random() < 0.35) platShooter(px + 50, py);
    }
    return w;
  },
  pit(x) {
    const pre = 150, pw = rnd(170, 250), post = 150;
    S.pits.push({ x: x + pre, w: pw });
    if (Math.random() < 0.55) S.plats.push({ x: x + pre + pw / 2 - 45, y: 410, w: 90 });
    coin(x + pre + pw / 2 - 30, 330, 8); coin(x + pre + pw / 2 + 30, 330, 8);
    groundMobs(x + 30, x + pre - 40, 1); groundMobs(x + pre + pw + 40, x + pre + pw + post - 20, 1); airMobs(x + pre, x + pre + pw, 1);
    return pre + pw + post;
  },
  movers(x) {
    const pre = 130, pw = rnd(440, 560), post = 130, n = pw > 500 ? 3 : 2;
    S.pits.push({ x: x + pre, w: pw });
    for (let k = 0; k < n; k++) {
      const x0 = x + pre + (k + 0.5) * pw / n - 50;
      S.plats.push({ x: x0, y: 400, w: 100, kind: 'mov', x0, y0: 400, ax: rnd(45, 80), ay: Math.random() < 0.4 ? 28 : 0, sp: rnd(0.018, 0.028), ph: rnd(0, 6) });
      coin(x0 + 50, 340, 8);
    }
    groundMobs(x + 30, x + pre - 30, 1); groundMobs(x + pre + pw + 30, x + pre + pw + post - 20, 1); airMobs(x + pre, x + pre + pw, 2);
    return pre + pw + post;
  },
  crumble(x) {
    const pre = 130, pw = rnd(390, 520), post = 130, n = Math.floor(pw / 118);
    S.pits.push({ x: x + pre, w: pw });
    for (let k = 0; k < n; k++) {
      const px = x + pre + 8 + k * (pw - 16) / n;
      S.plats.push({ x: px, y: 400, w: 92, kind: 'crumble', state: 0, timer: 0, gone: false, back: 0 });
      coin(px + 46, 350, 7);
    }
    groundMobs(x + 30, x + pre - 30, 1); groundMobs(x + pre + pw + 30, x + pre + pw + post - 20, 1);
    return pre + pw + post;
  },
  spikes(x) {
    const w = rnd(200, 320); S.spikes.push({ x: x + 110, w });
    if (Math.random() < 0.6) { S.plats.push({ x: x + 110 + w / 2 - 60, y: 350, w: 120 }); coin(x + 110 + w / 2, 320, 10); }
    groundMobs(x + 10, x + 90, 1); groundMobs(x + 110 + w + 30, x + w + 200, 1);
    return w + 220;
  },
  geyser(x) {
    const w = 560;
    for (let k = 0; k < 3; k++) S.geysers.push({ x: x + 120 + k * 150, w: 46, t: k * 85, period: 270, warn: false, on: false });
    groundMobs(x + 20, x + 100, 1); groundMobs(x + w - 120, x + w - 20, 2);
    return w;
  },
  rock(x) {
    const w = rnd(560, 760); S.rockZones.push({ x0: x, x1: x + w, t: rnd(0, 60), period: Math.floor(rnd(90, 130)) });
    groundMobs(x + 60, x + w - 60, 3 + Math.floor(w / 250));
    return w;
  },
  ice(x) {
    const w = rnd(520, 760); S.ice.push({ x, w });
    groundMobs(x + 60, x + w - 60, 3 + Math.floor(w / 250));
    return w;
  },
  tower(x) {
    const w = 580, ys = [400, 340, 280, 220];
    ys.forEach((py, k) => S.plats.push({ x: x + 70 + k * 120, y: py, w: 110 }));
    coin(x + 70 + 3 * 120 + 55, 190, 20); coin(x + 70 + 3 * 120 + 30, 190, 12); coin(x + 70 + 3 * 120 + 80, 190, 12);
    platShooter(x + 70 + 3 * 120 + 55, 220);
    groundMobs(x + 20, x + w - 20, 3);
    return w;
  }
};
function genStage(D) {
  let x = 600, guard = 0;
  const end = D.len - 560;
  while (x < end && guard++ < 300) x += SEG[choice(D.segs)](x);
}
function startStage(i) {
  stageIdx = i;
  const D = DUNGEONS[i], AD = adaptFor(i), DF = DIFFS[P.diff === undefined ? 1 : P.diff];
  S = { D, dfh: DF.hp * AD.hp, dfd: DF.dmg * AD.dmg, adapt: AD, dIdx: i, events: [], lockL: -1, lockR: 1e9, nearInter: null, worldW: D.len + W, arenaL: D.len, leftBound: 0, enemies: [], boxes: [], projs: [], eprojs: [], parts: [], texts: [], drops: [], plats: [],
    pits: [], spikes: [], geysers: [], rockZones: [], warns: [], ice: [], erupts: [], marks: [], webs: [], checkpoints: [], merchants: [], shop: [], lastCp: null, nearMerch: null, cut: null,
    sched: [], cam: 0, boss: null, locked: false, banner: 200, clearT: 0, t: 0 };
  genStage(D); placeCheckpoints(D); genArena(D); S.shop = genShop(i, P.cls.id);
  Object.assign(P, { x: 80, y: GROUND - P.h, vx: 0, vy: 0, hp: P.maxhp, mp: P.maxmp, inv: 60, cd: {}, buffAtk: 0, haste: 0, stealth: 0, dash: 0, slam: 0, safeX: 80, onIce: false, pvx: 0, plat: null });
  buildBG();
  freeze = 0; shake = 0; combo = { n: 0, t: 0, best: 0 };
  state = 'play';
  musicSet(1);
}

// ===== 기믹 동작 =====
function guardPit(e) { // 적이 스스로 구덩이에 떨어지지 않도록
  if (!e.onGround || !e.vx) return;
  const px = e.x + e.w / 2 + sign(e.vx) * (e.w / 2 + 16);
  for (const p of S.pits) if (px > p.x && px < p.x + p.w) { e.vx = 0; e.patrol *= -1; return; }
}
function movePlats() {
  for (const pl of S.plats) {
    if (pl.kind === 'mov') {
      const ox = pl.x, oy = pl.y;
      pl.ph += pl.sp; pl.x = pl.x0 + Math.sin(pl.ph) * pl.ax; pl.y = pl.y0 + Math.sin(pl.ph * 1.3) * pl.ay;
      const dx = pl.x - ox, dy = pl.y - oy;
      if (P.plat === pl) { P.x += dx; P.y += dy; }
      for (const e of S.enemies) if (e.plat === pl) { e.x += dx; e.y += dy; }
    } else if (pl.kind === 'crumble') {
      if (pl.gone) { if (--pl.back <= 0) { pl.gone = false; pl.state = 0; } }
      else if (pl.state === 1) { if (--pl.timer <= 0) { pl.gone = true; pl.back = 260; pl.state = 0; burst(pl.x + pl.w / 2, pl.y, 12, 'dust'); sfx('land'); } }
      else if (P.plat === pl) { pl.state = 1; pl.timer = 36; sfx('ui'); }
    }
  }
}
function terrainP() {
  const p = P;
  p.onIce = false; webEffect(p);
  for (const z of S.ice) if (cx(p) > z.x && cx(p) < z.x + z.w) { p.onIce = true; break; }
  if (p.onGround && !p.plat) { // 마지막 안전 지점
    let safe = true;
    for (const q of S.pits) if (cx(p) > q.x - 70 && cx(p) < q.x + q.w + 70) safe = false;
    if (safe) p.safeX = p.x;
  }
  if (p.y > H + 30 && state === 'play') { // 낙사: 체력 20% 잃고 안전 지점에서 재시작
    const d = Math.round(p.maxhp * 0.2);
    p.hp = Math.max(1, p.hp - d); p.x = p.safeX; p.y = GROUND - p.h; p.vy = 0; p.vx = 0; p.inv = 90; p.hurtT = 0; p.dash = 0; p.slam = 0;
    text(cx(p), p.y - 10, 'FELL  -' + d, '#ff2a64', 70, 22); sfx('hurt'); addShake(8); flashScreen('#ff2a64', 0.4); combo.n = 0;
  }
  for (const s of S.spikes) {
    if (p.x + p.w > s.x + 4 && p.x < s.x + s.w - 4 && p.y + p.h > GROUND - 14) hurtP(10 * S.D.dmgMul, -p.facing || 1);
  }
}
function updHazards() {
  for (const g of S.geysers) {
    g.t = (g.t + 1) % g.period; g.warn = g.t >= 110 && g.t < 150; g.on = g.t >= 150 && g.t < 205;
    if (g.t === 150 && Math.abs(g.x - cx(P)) < 700) { sfx('fire'); addShake(2); }
    if (g.on && overlap(P, { x: g.x, y: GROUND - 190, w: g.w, h: 190 })) hurtP(14 * S.D.dmgMul, sign(cx(P) - (g.x + g.w / 2)) || 1);
  }
  for (const z of S.rockZones) {
    if (cx(P) < z.x0 - 300 || cx(P) > z.x1 + 300) continue;
    if (++z.t >= z.period) { z.t = 0; S.warns.push({ x: clamp(cx(P) + rnd(-220, 220), z.x0 + 20, z.x1 - 20), t: 0 }); }
  }
  for (const w of S.warns) if (++w.t === 55) S.eprojs.push({ x: w.x, y: -20, vx: 0, vy: 10, r: 14, dmg: w.dmg || 14 * S.D.dmgMul, life: 120, fall: true });
  S.warns = S.warns.filter(w => w.t < 60);
}

// ===== 지형 그리기 =====
function drawGround() {
  const x0 = Math.floor(S.cam / 16) * 16, x1 = x0 + W + 48;
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x0, H);
  for (let x = x0; x <= x1; x += 16) ctx.lineTo(x, GROUND + 3 - srand(x * .37) * 8);
  ctx.lineTo(x1, H); ctx.fill();
  // 구덩이: 밝은 안개 심연 + 들쭉날쭉한 절벽
  const pg = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  pg.addColorStop(0, S.D.sky[1]); pg.addColorStop(1, '#fff');
  for (const p of S.pits) {
    if (p.x > x1 || p.x + p.w < x0) continue;
    ctx.fillStyle = pg; ctx.fillRect(p.x, GROUND - 8, p.w, H - GROUND + 10);
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.moveTo(p.x, GROUND - 8); for (let y = GROUND - 8; y <= H; y += 14) ctx.lineTo(p.x + srand(y + p.x) * 10, y); ctx.lineTo(p.x, H); ctx.fill();
    ctx.beginPath(); ctx.moveTo(p.x + p.w, GROUND - 8); for (let y = GROUND - 8; y <= H; y += 14) ctx.lineTo(p.x + p.w - srand(y + p.x * 3) * 10, y); ctx.lineTo(p.x + p.w, H); ctx.fill();
    // 구덩이 경고 표지 (양쪽 가장자리)
    for (const ex of [p.x - 10, p.x + p.w + 6]) {
      ctx.fillStyle = INK; ctx.fillRect(ex, GROUND - 34, 3, 34);
      ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(ex - 8, GROUND - 34); ctx.lineTo(ex + 11, GROUND - 34); ctx.lineTo(ex + 1.5, GROUND - 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(ex + 0.5, GROUND - 46, 2, 7);
    }
  }
  // 얼음 바닥
  for (const z of S.ice) {
    if (z.x > x1 || z.x + z.w < x0) continue;
    ctx.fillStyle = '#d6ecff'; ctx.fillRect(z.x, GROUND - 3, z.w, 11);
    ctx.fillStyle = '#fff'; ctx.fillRect(z.x, GROUND - 3, z.w, 3);
    ctx.strokeStyle = '#7fb8ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = z.x + 10; x < z.x + z.w; x += 44) { ctx.moveTo(x, GROUND + 3); ctx.lineTo(x + 18, GROUND + 3); ctx.moveTo(x + 8, GROUND + 7); ctx.lineTo(x + 22, GROUND + 7); }
    ctx.stroke();
  }
  // 가시
  for (const s of S.spikes) {
    if (s.x > x1 || s.x + s.w < x0) continue;
    for (let x = s.x; x < s.x + s.w; x += 14) {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x, GROUND + 3); ctx.lineTo(x + 7, GROUND - 20 - srand(x) * 6); ctx.lineTo(x + 14, GROUND + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.fillStyle = PINK; for (let x = s.x + 7; x < s.x + s.w; x += 28) ctx.fillRect(x - 1, GROUND - 22, 2, 3);
  }
  // 간헐천
  for (const g of S.geysers) {
    if (g.x > x1 || g.x + g.w < x0) continue;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(g.x - 8, GROUND + 3); ctx.lineTo(g.x + g.w / 2, GROUND - 12); ctx.lineTo(g.x + g.w + 8, GROUND + 3); ctx.closePath(); ctx.fill();
    if (g.warn) {
      const a = 0.35 + Math.sin(S.t * 0.6) * 0.25;
      ctx.fillStyle = `rgba(255,42,100,${a})`; ctx.beginPath(); ctx.ellipse(g.x + g.w / 2, GROUND - 2, g.w * 0.8, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = PINK; ctx.fillRect(g.x + g.w / 2 - 1, GROUND - 26 - (S.t % 10), 2, 8);
    }
    if (g.on) {
      const fl = 6 + Math.sin(S.t * 0.9) * 4, top = GROUND - 190;
      ctx.beginPath(); ctx.moveTo(g.x - 4, GROUND); ctx.lineTo(g.x + 2 - fl * 0.3, top + 30); ctx.lineTo(g.x + g.w / 2, top - fl); ctx.lineTo(g.x + g.w - 2 + fl * 0.3, top + 30); ctx.lineTo(g.x + g.w + 4, GROUND); ctx.closePath();
      ctx.fillStyle = PINK; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.x + 10, GROUND); ctx.lineTo(g.x + g.w / 2, top + 40); ctx.lineTo(g.x + g.w - 10, GROUND); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    }
  }
  // 낙석 경고
  for (const w of S.warns) {
    if (w.t < 0 || w.x < x0 - 20 || w.x > x1) continue;
    const a = 0.4 + Math.sin(w.t * 0.7) * 0.3;
    ctx.fillStyle = `rgba(255,42,100,${a})`; ctx.beginPath(); ctx.moveTo(w.x - 16, GROUND + 2); ctx.lineTo(w.x, GROUND - 22); ctx.lineTo(w.x + 16, GROUND + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(255,42,100,${a * 0.7})`; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(w.x, GROUND - 24); ctx.lineTo(w.x, 0); ctx.stroke(); ctx.setLineDash([]);
  }
  // 발판
  for (const pl of S.plats) {
    if (pl.gone || pl.x > x1 || pl.x + pl.w < x0 - 20) continue;
    const sh = pl.kind === 'crumble' && pl.state === 1 ? (Math.random() - 0.5) * 3 : 0, px = pl.x + sh;
    ctx.fillStyle = pl.kind === 'crumble' ? '#2c2c33' : INK;
    ctx.beginPath(); ctx.moveTo(px, pl.y + 2);
    for (let x = px; x <= px + pl.w; x += 14) ctx.lineTo(x, pl.y - srand(x) * 4);
    for (let x = px + pl.w; x >= px; x -= 14) ctx.lineTo(x, pl.y + 11 + srand(x * 3) * 9);
    ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    if (pl.kind === 'mov') { // 천장에서 늘어진 사슬
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 12, pl.y + 2); ctx.lineTo(px + 12, 0); ctx.moveTo(px + pl.w - 12, pl.y + 2); ctx.lineTo(px + pl.w - 12, 0); ctx.stroke();
      ctx.fillStyle = PINK; ctx.fillRect(px + pl.w / 2 - 6, pl.y - 3, 12, 3);
    } else if (pl.kind === 'crumble') {
      ctx.strokeStyle = pl.state === 1 ? PINK : '#fff'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(px + pl.w * 0.3, pl.y + 1); ctx.lineTo(px + pl.w * 0.4, pl.y + 8); ctx.lineTo(px + pl.w * 0.33, pl.y + 14); ctx.moveTo(px + pl.w * 0.7, pl.y + 1); ctx.lineTo(px + pl.w * 0.62, pl.y + 9); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(px + 12, pl.y + 8); ctx.lineTo(px + 12, GROUND); ctx.moveTo(px + pl.w - 12, pl.y + 8); ctx.lineTo(px + pl.w - 12, GROUND);
      ctx.moveTo(px + 12, pl.y + 8); ctx.lineTo(px + pl.w - 12, (pl.y + GROUND) / 2 + 20); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + pl.w * 0.5, pl.y - 2); ctx.lineTo(px + pl.w * 0.5, pl.y - 50 - srand(pl.x) * 40); ctx.stroke();
    }
  }
}
