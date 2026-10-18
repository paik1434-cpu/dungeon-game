'use strict';
// ===== 체크포인트 / 상점 NPC / 보스 기믹 지형 =====
function clearAt(x, half) { // 위험 지형이 없는 평지인가
  for (const p of S.pits) if (x + half > p.x && x - half < p.x + p.w) return false;
  for (const s of S.spikes) if (x + half > s.x && x - half < s.x + s.w) return false;
  for (const g of S.geysers) if (x + half > g.x - 30 && x - half < g.x + g.w + 30) return false;
  for (const z of S.rockZones) if (x + half > z.x0 && x - half < z.x1) return false;
  for (const z of S.ice) if (x + half > z.x && x - half < z.x + z.w) return false;
  for (const pl of S.plats) if (pl.kind && x + half > pl.x && x - half < pl.x + pl.w) return false;
  for (const ev of S.events) { const a = ev.x0 !== undefined ? ev.x0 : ev.x - 70, b = ev.x1 !== undefined ? ev.x1 : ev.x + 70; if (x + half > a && x - half < b) return false; }
  return true;
}
function placeCheckpoints(D) {
  [D.len * 0.36, D.len * 0.68, D.len - 430].forEach((t, i) => {
    let best = null;
    for (let d = 0; d < 900 && best === null; d += 25) for (const s of [1, -1]) { const x = t + s * d; if (x > 300 && x < D.len - 300 && clearAt(x, 170)) { best = x; break; } }
    const x = best === null ? t : best;
    S.checkpoints.push({ x, on: false, merch: i !== 1 });
    if (i !== 1) S.merchants.push({ x: x + 95 });
    S.enemies = S.enemies.filter(e => Math.abs(cx(e) - x) > 240);
  });
}
function reviveAtCheckpoint() {
  const c = S.lastCp;
  if (!c) { startStage(stageIdx); return; }
  const loss = Math.round(P.gold * 0.1); P.gold -= loss;
  if (S.boss) { S.enemies = S.enemies.filter(e => !e.boss && e.x < S.arenaL); S.boss = null; }
  S.locked = false; S.leftBound = 0; S.lockL = -1; S.lockR = 1e9; for (const ev of S.events) if (ev.type === 'ambush' && ev.state === 1) { for (const m of ev.mobs) m.dead = true; ev.state = 0; ev.mobs = []; ev.wave = 0; } S.eprojs = []; S.warns = []; S.erupts = []; S.marks = []; S.cut = null; S.sched = []; S.boxes = []; S.projs = [];
  Object.assign(P, { x: c.x - 20, y: GROUND - P.h, vx: 0, vy: 0, hp: P.maxhp, mp: P.maxmp, inv: 150, hurtT: 0, dash: 0, slam: 0, cd: {}, buffAtk: 0, haste: 0, focus: 0, stealth: 0 });
  S.cam = clamp(P.x - W / 2, 0, S.arenaL);
  text(c.x, GROUND - 120, '부활  골드 -' + loss, PINK, 90, 22);
  state = 'play'; freeze = 0; combo = { n: 0, t: 0, best: combo.best }; musicSet(1);
}
function updHazards2() {
  for (const c of S.checkpoints) if (!c.on && Math.abs(cx(P) - c.x) < 60) {
    c.on = true; S.lastCp = c; P.safeX = c.x;
    P.hp = Math.min(P.maxhp, P.hp + Math.round(P.maxhp * 0.5)); P.mp = P.maxmp;
    text(c.x, GROUND - 130, 'CHECKPOINT', PINK, 100, 24); ring(c.x, GROUND - 30); sfx('levelup'); flashScreen('#fff', 0.3);
  }
  S.nearMerch = null;
  for (const m of S.merchants) if (Math.abs(cx(P) - m.x) < 80) S.nearMerch = m;
  for (const m of S.marks) m.t++;
  S.marks = S.marks.filter(m => m.t < m.life);
  for (const q of S.erupts) {
    q.t++;
    if (q.t > q.warn && q.t <= q.warn + q.on && overlap(P, { x: q.x - 24, y: GROUND - 170, w: 48, h: 170 })) hurtP(q.dmg, sign(cx(P) - q.x) || 1);
    if (q.t === q.warn + 1) { addShake(3); burst(q.x, GROUND, 6, 'dust'); }
  }
  S.erupts = S.erupts.filter(q => q.t < q.warn + q.on + 6);
}
function drawGround2() {
  const x0 = S.cam - 100, x1 = S.cam + W + 100;
  // 체크포인트 (화로)
  for (const c of S.checkpoints) {
    if (c.x < x0 || c.x > x1) continue;
    const x = c.x, y = GROUND;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - 17, y - 30); ctx.lineTo(x + 17, y - 30); ctx.lineTo(x + 10, y - 16); ctx.lineTo(x - 10, y - 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 8, y - 16); ctx.lineTo(x - 15, y + 3); ctx.moveTo(x + 8, y - 16); ctx.lineTo(x + 15, y + 3); ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 2); ctx.stroke();
    if (c.on) {
      const fl = Math.sin(S.t * 0.3 + x) * 3;
      ctx.fillStyle = 'rgba(255,42,100,.16)'; ctx.beginPath(); ctx.ellipse(x, y - 40, 60, 46, 0, 0, 7); ctx.fill();
      ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 13, y - 30); ctx.quadraticCurveTo(x - 15, y - 54, x + fl, y - 76 + fl); ctx.quadraticCurveTo(x + 15, y - 52, x + 13, y - 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 6, y - 30); ctx.quadraticCurveTo(x - 6, y - 46, x + fl * 0.5, y - 56); ctx.quadraticCurveTo(x + 7, y - 44, x + 6, y - 30); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#666'; ctx.fillRect(x - 3, y - 36, 6, 6);
      ctx.globalAlpha = 0.7 + Math.sin(S.t * 0.1) * 0.3; tag('CHECKPOINT', x - 44, y - 62, 13, INK, '#fff'); ctx.globalAlpha = 1;
    }
  }
  // 상점 NPC
  for (const m of S.merchants) {
    if (m.x < x0 || m.x > x1) continue;
    const f = sign(cx(P) - m.x) || 1, x = m.x - 14, y = GROUND - 52;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(m.x, GROUND + 1, 24, 3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = INK; ctx.fillRect(m.x - f * 24 - 12, y + 12, 24, 30); ctx.fillRect(m.x - f * 24 - 9, y + 2, 18, 12);
    ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m.x - f * 12, y + 14); ctx.lineTo(m.x + f * 4, y + 26); ctx.stroke();
    figure(x, y, 28, 52, f, S.t, false, { robe: true, hand: [m.x + f * 17, y + 30] });
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(m.x - 12, y + 12); ctx.lineTo(m.x + f * 1, y - 9); ctx.lineTo(m.x + 12, y + 12); ctx.closePath(); ctx.fill();
    glowEye(m.x + f * 3, y + 6, 1.8);
    const lx = m.x + f * 20, ly = y + 38 + Math.sin(S.t * 0.08) * 1.5;
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m.x + f * 17, y + 30); ctx.lineTo(lx, ly - 6); ctx.stroke();
    ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.fillRect(lx - 5, ly - 6, 10, 13); ctx.strokeRect(lx - 5, ly - 6, 10, 13);
    ctx.fillStyle = 'rgba(255,42,100,.2)'; ctx.beginPath(); ctx.arc(lx, ly, 18, 0, 7); ctx.fill();
    if (S.nearMerch === m) { const by = y - 30 + Math.sin(S.t * 0.12) * 3; tag('ENTER  상점', m.x - 46, by, 16, PINK, '#fff', BODY); }
    else tag('SHOP', m.x - 20, y - 18, 12, INK, '#fff');
  }
  // 보스 지면 폭발 (경고 → 분출)
  for (const q of S.erupts) {
    if (q.t < 0 || q.x < x0 || q.x > x1) continue;
    const x = q.x;
    if (q.t <= q.warn) {
      const a = 0.4 + Math.sin(q.t * 0.6) * 0.3;
      ctx.fillStyle = `rgba(255,42,100,${a})`; ctx.beginPath(); ctx.moveTo(x - 20, GROUND + 2); ctx.lineTo(x, GROUND - 24); ctx.lineTo(x + 20, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(255,42,100,${a * 0.7})`; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(x, GROUND - 28); ctx.lineTo(x, GROUND - 120); ctx.stroke(); ctx.setLineDash([]);
    } else {
      const k = Math.min(1, (q.t - q.warn) / 5), hh = 170 * k;
      ctx.beginPath(); ctx.moveTo(x - 24, GROUND); ctx.lineTo(x - 14, GROUND - hh); ctx.lineTo(x, GROUND - hh - 14); ctx.lineTo(x + 14, GROUND - hh); ctx.lineTo(x + 24, GROUND); ctx.closePath();
      ctx.fillStyle = PINK; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 8, GROUND); ctx.lineTo(x, GROUND - hh * 0.8); ctx.lineTo(x + 8, GROUND); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    }
  }
  // 도약 착지 표식
  for (const m of S.marks) {
    const k = m.t / m.life, pul = 0.5 + Math.sin(m.t * 0.5) * 0.3;
    ctx.fillStyle = `rgba(255,42,100,${0.22 * pul})`; ctx.beginPath(); ctx.ellipse(m.x, GROUND - 2, 70 * (1 - k * 0.2), 12, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(m.x, GROUND - 2, 70 * (1 - k * 0.2), 12, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m.x - 12, GROUND - 2); ctx.lineTo(m.x + 12, GROUND - 2); ctx.moveTo(m.x, GROUND - 8); ctx.lineTo(m.x, GROUND + 4); ctx.stroke();
  }
}
// 아이템 드랍 표시
function drawItemDrop(d) {
  const it = d.item, hot = it.ri >= 2, b = Math.sin(S.t * 0.15 + d.x) * 2, y = d.y - 10 + b;
  if (hot) { ctx.fillStyle = 'rgba(255,42,100,.22)'; ctx.fillRect(d.x - 6, y - 70, 12, 70); }
  ctx.beginPath(); ctx.moveTo(d.x, y - 11); ctx.lineTo(d.x + 9, y); ctx.lineTo(d.x, y + 11); ctx.lineTo(d.x - 9, y); ctx.closePath();
  ctx.fillStyle = hot ? PINK : it.ri === 1 ? '#222' : '#c8c8c4'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d.x, y, 2.5, 0, 7); ctx.fill();
}
