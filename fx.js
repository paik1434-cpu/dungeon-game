'use strict';
// ===== 스킬 이펙트 / 투사체 / 파티클 (원소별 연출) =====
// 아이콘 종류 → 투사체 연출 매핑
const FXMAP = { fireball: 'fire', flame: 'fire', beam: 'fire', ice: 'ice', orb: 'arcane', arrow: 'arrow', arrows3: 'arrow', fan: 'arrow', wind: 'arrow', backstep: 'arrow',
  scope: 'pierce', pierce: 'pierce', poison: 'poison', shuriken: 'shuriken', dagger: 'dagger', bomb: 'bomb', chain: 'chain', axe: 'axe', rain: 'rainArrow', meteor: 'meteor', phoenix: 'phoenix', slash: 'arrow' };

// ── 근접 베기: 잔상 + 핑크 안쪽 선 + 끝 반짝임
function crescent(x, y, dir, rx, ry, prog, color, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(dir, 1);
  const a = clamp((1 - prog) * 1.8, 0, 1), sw = 0.8 + prog * 0.5;
  const draw = (sweep, off, al, col, outline) => {
    ctx.globalAlpha = al; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, -sweep, sweep); ctx.ellipse(-rx * off, 0, rx * 0.85, ry * 0.92, 0, sweep, -sweep, true); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); if (outline) { ctx.lineWidth = 2.5; ctx.strokeStyle = '#000'; ctx.stroke(); }
  };
  draw(0.8 + Math.max(0, prog - 0.25) * 0.5, 0.5, a * 0.35, color, false);
  draw(sw, 0.3, a, color, true);
  ctx.globalAlpha = a; ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.94, ry * 0.94, 0, -sw * 0.85, sw * 0.85); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(Math.cos(sw) * rx, s * Math.sin(sw) * ry, 3, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

// ── 투사체 그리기 (진행 방향 = +x)
function drawWaveProj(q) {
  const dir = sign(q.vx) || 1;
  ctx.save(); ctx.translate(q.x, GROUND); ctx.scale(dir, 1);
  ctx.beginPath(); [[-28, 3], [-20, -24], [-11, -6], [0, -46], [10, -12], [20, -30], [28, 3]].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#000'; ctx.stroke();
  ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -34); ctx.lineTo(7, 0); ctx.stroke();
  ctx.restore();
}
function arrowShape(L, headCol, scale) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 5 * scale; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(3, 0); ctx.stroke();
  ctx.strokeStyle = headCol; ctx.lineWidth = 2.4 * scale; ctx.stroke();
  ctx.fillStyle = headCol; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(11 * scale, 0); ctx.lineTo(1, -4.8 * scale); ctx.lineTo(1, 4.8 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L + 2, 0); ctx.lineTo(-L - 5 * scale, s * 5 * scale); ctx.lineTo(-L + 8, 0); ctx.closePath(); ctx.fill(); }
}
function drawProj(q) {
  if (q.wave) { drawWaveProj(q); return; }
  const fx = q.fx || (q.aoe ? 'fire' : 'arrow'), a = Math.atan2(q.vy, q.vx), t = S.t, fade = q.maxLife ? Math.min(1, q.life / 8) : 1, r = q.r;
  ctx.save(); ctx.translate(q.x, q.y); ctx.globalAlpha = fade; ctx.rotate(a);
  const col = q.color || '#fff';
  switch (fx) {
    case 'arrow': arrowShape(r > 5 ? 30 : 24, col, 1); break;
    case 'rainArrow':
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-22, 0); ctx.stroke();
      arrowShape(22, col, 1); break;
    case 'pierce':
      ctx.fillStyle = 'rgba(255,42,100,.28)'; ctx.beginPath(); ctx.ellipse(-8, 0, 34, 9, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5;
      for (const [oy, l] of [[-6, 40], [0, 54], [6, 36]]) { ctx.beginPath(); ctx.moveTo(-26 - l, oy); ctx.lineTo(-26, oy); ctx.stroke(); }
      arrowShape(32, col, 1.35); break;
    case 'fire': case 'phoenix': {
      const rr = r + 1, w = Math.sin(t * 0.7 + q.x) * 2;
      if (fx === 'phoenix') { // 불사조: 펄럭이는 날개
        const fl = Math.sin(t * 0.5) * 0.6;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * (1.1 + fl)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-rr * 2.6, rr * 1.2); ctx.lineTo(-rr * 0.4, rr * 2.8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      }
      ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-rr * 4 + w, 0); ctx.quadraticCurveTo(-rr * 2, -rr * 1.2, 0, -rr); ctx.arc(0, 0, rr, -Math.PI / 2, Math.PI / 2); ctx.quadraticCurveTo(-rr * 2, rr * 1.2, -rr * 4 + w, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-rr * 0.5, 0, rr * 1.3, rr * 0.55, 0, 0, 7); ctx.fill();
      break;
    }
    case 'arcane': {
      if (q.aoe) { // 중력구
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
        ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * (1.25 + 0.12 * Math.sin(t * 0.3)), 0, 7); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, 7); ctx.stroke();
        break;
      }
      ctx.fillStyle = 'rgba(255,42,100,.28)'; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, 7); ctx.stroke();
      for (let i = 0; i < 3; i++) { const o = t * 0.35 + i * 2.09; ctx.fillStyle = i ? '#fff' : PINK; ctx.beginPath(); ctx.arc(Math.cos(o) * r * 1.8, Math.sin(o) * r * 1.8, 2.2, 0, 7); ctx.fill(); }
      break;
    }
    case 'ice':
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(2, -5.5); ctx.lineTo(-14, 0); ctx.lineTo(2, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(-3, -10); ctx.lineTo(-5, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = PINK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, 0); ctx.stroke();
      break;
    case 'poison': case 'dagger': {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-4, -3.4); ctx.lineTo(-9, 0); ctx.lineTo(-4, 3.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PINK; ctx.fillRect(-12, -4, 4, 8); ctx.strokeRect(-12, -4, 4, 8);
      if (q.poison) { ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(2, 5 + Math.sin(t * 0.4) * 1.5, 2.2, 0, 7); ctx.fill(); }
      break;
    }
    case 'shuriken':
      ctx.rotate(-a);
      for (const [off, al] of [[-0.9, 0.18], [-0.45, 0.32], [0, 1]]) {
        ctx.save(); ctx.rotate(t * 0.55 + off); ctx.globalAlpha = fade * al;
        ctx.beginPath(); [[0, -10], [2.8, -2.8], [10, 0], [2.8, 2.8], [0, 10], [-2.8, 2.8], [-10, 0], [-2.8, -2.8]].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 7); ctx.fill();
      break;
    case 'bomb': {
      const rr = r + 2; ctx.rotate(-a);
      ctx.fillStyle = INK; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, rr, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-rr * 0.35, -rr * 0.35, rr * 0.28, 0, 7); ctx.fill();
      ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rr * 0.5, -rr * 0.8); ctx.quadraticCurveTo(rr * 1.0, -rr * 1.4, rr * 1.4, -rr * 1.5); ctx.stroke();
      ctx.fillStyle = Math.floor(t / 2) % 2 ? PINK : '#fff'; ctx.beginPath(); ctx.arc(rr * 1.45, -rr * 1.55, 3.4, 0, 7); ctx.fill();
      break;
    }
    case 'chain':
      for (let i = 1; i <= 6; i++) { ctx.globalAlpha = fade * (1 - i / 7); ctx.strokeStyle = '#000'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(-i * 8, 0, 5, 3, 0, 0, 7); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.globalAlpha = fade; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(3, -8); ctx.lineTo(5, 0); ctx.lineTo(3, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'axe':
      ctx.rotate(-a + t * 0.38);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.strokeStyle = '#777'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(20, -14); ctx.lineTo(22, 0); ctx.lineTo(20, 14); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, -11); ctx.lineTo(20, 0); ctx.lineTo(18, 11); ctx.stroke();
      break;
    case 'meteor': {
      const rr = r + 1;
      ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-rr * 6, 0); ctx.quadraticCurveTo(-rr * 3, -rr * 1.4, 0, -rr); ctx.lineTo(0, rr); ctx.quadraticCurveTo(-rr * 3, rr * 1.4, -rr * 6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-rr * 4, 0); ctx.quadraticCurveTo(-rr * 2, -rr * 0.6, 0, -rr * 0.5); ctx.lineTo(0, rr * 0.5); ctx.quadraticCurveTo(-rr * 2, rr * 0.6, -rr * 4, 0); ctx.closePath(); ctx.fill();
      ctx.rotate(-a + t * 0.08); ctx.fillStyle = '#16161a'; ctx.strokeStyle = PINK; ctx.lineWidth = 3;
      ctx.beginPath(); for (let i = 0; i < 9; i++) { const ang = i * Math.PI * 2 / 9, rd = rr * (0.8 + srand(i + 3) * 0.45); ctx.lineTo(Math.cos(ang) * rd, Math.sin(ang) * rd); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-rr * 0.4, -rr * 0.3); ctx.lineTo(rr * 0.1, rr * 0.1); ctx.lineTo(rr * 0.5, -rr * 0.2); ctx.stroke();
      break;
    }
    default:
      ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ── 비행 중 트레일 / 적중 이펙트 / 시전 이펙트
function fxTrail(q) {
  if (q.wave) { if (S.t % 2 === 0 && S.parts.length < 420) { S.parts.push({ kind: 'dust', x: q.x, y: GROUND - 3, vx: rnd(-1, 1), vy: -rnd(0.5, 2.5), size: rnd(2, 5), life: 18, t: 0 }); if (S.t % 4 === 0) S.parts.push({ kind: 'shard', x: q.x, y: GROUND - 6, vx: rnd(-2, 2), vy: -rnd(2, 4.5), size: rnd(3, 6), rot: 0, vr: rnd(-0.3, 0.3), dark: true, life: 24, t: 0 }); } return; }
  if (S.parts.length > 420) return;
  const fx = q.fx || (q.aoe ? 'fire' : 'arrow'), t = S.t, a = Math.atan2(q.vy, q.vx);
  const mk = (kind, o) => S.parts.push(Object.assign({ kind, x: q.x, y: q.y, t: 0, life: 14 }, o));
  switch (fx) {
    case 'fire': case 'bomb': mk('ember', { vx: rnd(-0.6, 0.6), vy: rnd(-0.6, 0.4), size: rnd(2, 4.5), life: rnd(14, 24) }); if (t % 3 === 0) mk('smoke', { vx: rnd(-0.3, 0.3), vy: -0.3, size: rnd(4, 7), life: 22 }); break;
    case 'phoenix': mk('ember', { vx: rnd(-0.8, 0.8), vy: rnd(-0.8, 0.5), size: rnd(2.5, 5), life: rnd(16, 26) }); mk('ember', { vx: rnd(-0.8, 0.8), vy: rnd(-0.8, 0.5), size: rnd(2, 4), life: rnd(14, 22) }); break;
    case 'meteor': mk('ember', { x: q.x - q.vx * 1.5, y: q.y - q.vy * 1.5, vx: rnd(-0.8, 0.8), vy: rnd(-0.6, 0.6), size: rnd(3, 6), life: rnd(16, 26) }); if (t % 2 === 0) mk('smoke', { x: q.x - q.vx * 3, y: q.y - q.vy * 3, vx: rnd(-0.4, 0.4), vy: rnd(-0.4, 0.2), size: rnd(6, 10), life: 28 }); break;
    case 'ice': if (t % 2 === 0) mk('snow', { x: q.x + rnd(-6, 6), y: q.y + rnd(-6, 6), vx: rnd(-0.5, 0.5), vy: rnd(0.2, 0.8), size: rnd(2, 4), life: 24 }); break;
    case 'arcane': if (t % 2 === 0) mk('glint', { x: q.x + rnd(-6, 6), y: q.y + rnd(-6, 6), size: rnd(3, 6), life: 12 }); break;
    case 'pierce': case 'rainArrow': mk('streak', { ang: a, len: 22, life: 7 }); break;
    case 'shuriken': case 'axe': if (t % 2 === 0) mk('streak', { ang: a, len: 12, life: 6 }); break;
    case 'poison': case 'dagger': if (q.poison && t % 3 === 0) mk('drop', { vx: rnd(-0.2, 0.2), vy: 0, size: rnd(2, 3), life: 20 }); break;
  }
}
function efxTrail(q) { // 적 투사체 꼬리
  if (q.wave || S.parts.length > 420 || S.t % 3) return;
  S.parts.push({ kind: 'ember', x: q.x, y: q.y, vx: rnd(-0.4, 0.4), vy: rnd(-0.4, 0.4), size: rnd(2, 3.5), life: rnd(10, 16), t: 0 });
}
function fxImpact(q, x, y) {
  if (S.parts.length > 430) return;
  const fx = q.fx || (q.aoe ? 'fire' : 'arrow'), mk = (kind, o) => S.parts.push(Object.assign({ kind, x, y, t: 0, life: 16 }, o));
  switch (fx) {
    case 'fire': case 'bomb': case 'phoenix':
      for (let i = 0; i < 10; i++) mk('ember', { vx: rnd(-4, 4), vy: rnd(-5, 1), size: rnd(2, 5), life: rnd(18, 30) });
      for (let i = 0; i < 3; i++) mk('smoke', { vx: rnd(-1, 1), vy: rnd(-1.5, -0.3), size: rnd(8, 14), life: 30 }); break;
    case 'meteor':
      for (let i = 0; i < 14; i++) mk('ember', { vx: rnd(-5, 5), vy: rnd(-6, 1), size: rnd(3, 6), life: rnd(18, 32) });
      for (let i = 0; i < 5; i++) mk('smoke', { vx: rnd(-1.5, 1.5), vy: rnd(-2, -0.4), size: rnd(10, 16), life: 36 });
      for (let i = 0; i < 8; i++) mk('shard', { vx: rnd(-5, 5), vy: -rnd(3, 8), size: rnd(4, 8), rot: rnd(0, 6), vr: rnd(-0.3, 0.3), dark: true, life: 34 }); break;
    case 'ice':
      for (let i = 0; i < 8; i++) mk('shard', { vx: rnd(-4, 4), vy: rnd(-5, 0), size: rnd(3, 6), rot: rnd(0, 6), vr: rnd(-0.4, 0.4), life: 26 });
      for (let i = 0; i < 5; i++) mk('snow', { vx: rnd(-1.5, 1.5), vy: rnd(-1, 0.5), size: rnd(2, 4), life: 28 }); ring(x, y); break;
    case 'arcane': for (let i = 0; i < 5; i++) mk('glint', { x: x + rnd(-10, 10), y: y + rnd(-10, 10), size: rnd(4, 8), life: 14 }); sparks(x, y, 4, PINK, 16); break;
    case 'poison': case 'dagger': for (let i = 0; i < 6; i++) mk('drop', { vx: rnd(-2.5, 2.5), vy: -rnd(1, 4), size: rnd(2, 3.5), life: 24 }); break;
    case 'shuriken': case 'axe': case 'chain': sparks(x, y, 5, '#fff', 16); mk('cut', { ang: rnd(-0.8, 0.8), size: 30, life: 8 }); break;
    default: sparks(x, y, 4, '#fff', 14); for (let i = 0; i < 3; i++) mk('dust', { vx: rnd(-2, 2), vy: rnd(-2, 0), size: rnd(2, 4), life: 16 });
  }
}
function castFx(ico, basic) { // 시전 순간: 총구 섬광 + 원소별 파티클
  if (ico === 'slash' && basic) return;
  const fx = FXMAP[ico] || 'arcane', ax = P.aim.x, ay = P.aim.y, mx = cx(P) + ax * 24, my = P.y + P.h * 0.38 + ay * 24, ang = Math.atan2(ay, ax);
  S.parts.push({ kind: 'flash', x: mx, y: my, ang, size: basic ? 13 : 24, life: basic ? 5 : 9, t: 0 });
  if (basic || S.parts.length > 400) return;
  const mk = (kind, o) => S.parts.push(Object.assign({ kind, x: mx, y: my, t: 0, life: 20 }, o));
  if (fx === 'fire' || fx === 'phoenix' || fx === 'bomb' || fx === 'meteor') for (let i = 0; i < 6; i++) mk('ember', { vx: ax * rnd(1, 3) + rnd(-1, 1), vy: ay * rnd(1, 3) + rnd(-1.5, 0.5), size: rnd(2, 4) });
  else if (fx === 'ice') for (let i = 0; i < 6; i++) mk('snow', { vx: ax * rnd(1, 3) + rnd(-1, 1), vy: ay * rnd(1, 3) + rnd(-1, 1), size: rnd(2, 4), life: 26 });
  else if (fx === 'arcane') for (let i = 0; i < 5; i++) mk('glint', { x: mx + rnd(-12, 12), y: my + rnd(-12, 12), size: rnd(4, 8), life: 14 });
  ring(cx(P), cy(P));
}
// ── 신규 파티클 그리기 (처리했으면 true)
function drawFxPart(p, k) {
  switch (p.kind) {
    case 'ember': ctx.globalAlpha = k; ctx.fillStyle = k > 0.55 ? '#fff' : PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; { const s = p.size * k + 1.5; ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); } ctx.globalAlpha = 1; return true;
    case 'smoke': ctx.fillStyle = `rgba(30,30,34,${0.3 * k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (2.2 - k), 0, 7); ctx.fill(); return true;
    case 'snow': { ctx.globalAlpha = k; const s = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s * 0.7, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s * 0.7, p.y); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.globalAlpha = 1; return true; }
    case 'glint': { ctx.globalAlpha = k; const s = p.size * (0.5 + k * 0.5); ctx.lineCap = 'round'; for (const [w, c] of [[4, '#000'], [1.8, '#fff']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s); ctx.stroke(); } ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; return true; }
    case 'shard': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = k; ctx.fillStyle = p.dark ? '#16161a' : '#fff'; ctx.strokeStyle = p.dark ? PINK : '#000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.size, 0); ctx.lineTo(-p.size * 0.6, -p.size * 0.6); ctx.lineTo(-p.size * 0.4, p.size * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; return true;
    case 'cut': ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = k; ctx.lineCap = 'round';
      for (const ang of [p.ang, p.ang + 1.1]) { const l = p.size * (1.15 - 0.3 * k); for (const [w, c] of [[6, '#000'], [2.6, '#fff']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-Math.cos(ang) * l, -Math.sin(ang) * l); ctx.lineTo(Math.cos(ang) * l, Math.sin(ang) * l); ctx.stroke(); } }
      ctx.restore(); ctx.globalAlpha = 1; return true;
    case 'flash': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.globalAlpha = Math.min(1, k * 1.6); const sz = p.size * (0.7 + (1 - k) * 0.9);
      ctx.beginPath(); for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6, rr = i % 2 ? sz * 0.32 : (i % 4 === 0 ? sz * 1.2 : sz * 0.8); ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(0, 0, sz * 0.3, 0, 7); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; return true;
    case 'streak': ctx.globalAlpha = k * 0.8; ctx.lineCap = 'round'; for (const [w, c] of [[5, '#000'], [2, '#fff']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - Math.cos(p.ang) * p.len, p.y - Math.sin(p.ang) * p.len); ctx.stroke(); } ctx.globalAlpha = 1; return true;
    case 'drop': ctx.globalAlpha = k; ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + k * 0.4), 0, 7); ctx.fill(); ctx.globalAlpha = 1; return true;
  }
  return false;
}
