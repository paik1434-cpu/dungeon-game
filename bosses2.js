'use strict';
// ===== 신규 보스 4종: 히드라 / 철의 거신 / 사신 / 지옥의 군주 =====
const _drawBoss1 = drawBoss;
drawBoss = function (e) {
  const sh = e.def.shape;
  if (sh === 'hydra' || sh === 'colossus' || sh === 'reaper' || sh === 'demon') drawBoss2(e); else _drawBoss1(e);
};
function drawBoss2(e) {
  const x = e.x, y = e.y, w = e.w, h = e.h, f = e.face, t = S.t, sh = e.def.shape, fl = e.flash > 0, mid = x + w / 2;
  const rage = e.hp < e.maxhp * 0.5, col = e.slow > 0 ? '#3a4a5a' : INK, moving = Math.abs(e.vx) > 0.1, ph = t * 0.15, act = e.act ? e.act.n : '', at = e.act ? e.act.t : 0;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(mid, y + h + 1, w * 0.62, 5, 0, 0, 7); ctx.fill();
  if (rage) { ctx.fillStyle = 'rgba(255,42,100,.22)'; ctx.beginPath(); ctx.ellipse(mid, y + h * 0.5, w * 0.8, h * 0.72, 0, 0, 7); ctx.fill(); }
  FL = fl; ctx.fillStyle = fl ? '#fff' : col;
  const R = fl ? '#fff' : col, mouth = (act === 'fan' || act === 'barrage' || act === 'rain') && at < 44;

  if (sh === 'hydra') {
    ctx.beginPath(); ctx.ellipse(mid, y + h * 0.84, w * 0.46, h * 0.2, 0, 0, 7); ink();
    ctx.strokeStyle = R; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mid - f * w * 0.35, y + h * 0.9); ctx.quadraticCurveTo(mid - f * w * 0.8, y + h * 0.98 + Math.sin(t * 0.08) * 8, mid - f * w * 0.96, y + h * 0.6); ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const bx = mid + (k - 1) * w * 0.2, by = y + h * 0.82, sway = Math.sin(t * 0.05 + k * 2.1) * 16;
      const hx = mid + (k - 1) * w * 0.3 + f * 10 + sway, hy = y + h * (k === 1 ? 0.1 : 0.26) + Math.cos(t * 0.06 + k) * 6;
      ctx.strokeStyle = R; ctx.lineWidth = 22 - k * 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.bezierCurveTo(bx, by - h * 0.4, hx - sway, hy + h * 0.3, hx, hy); ctx.stroke();
      const op = mouth ? 11 : 3;
      ctx.fillStyle = R; ctx.beginPath(); ctx.ellipse(hx + f * 12, hy, 26, 15, 0, 0, 7); ink();
      ipoly([[hx + f * 2, hy + 7], [hx + f * 36, hy + 7 + op], [hx + f * 12, hy + 18 + op]]);
      ctx.fillStyle = fl ? '#fff' : '#ecebe2'; ipoly([[hx + f * 22, hy + 7], [hx + f * 26, hy + 16], [hx + f * 30, hy + 7 + op * 0.5]]); ipoly([[hx + f * 8, hy + 8], [hx + f * 11, hy + 15], [hx + f * 15, hy + 8]]);
      glowEye(hx + f * 10, hy - 4, 2.8);
      if (mouth) { ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(hx + f * 22, hy + 10, 4 + Math.sin(t) * 1.5, 0, 7); ctx.fill(); }
    }
  } else if (sh === 'colossus') {
    const sw = moving ? Math.sin(ph) * 4 : 0;
    irect(mid - w * 0.36 + sw, y + h * 0.64, w * 0.28, h * 0.36); irect(mid + w * 0.08 - sw, y + h * 0.64, w * 0.28, h * 0.36);
    irect(mid - w * 0.42 + sw, y + h * 0.93, w * 0.4, h * 0.07); irect(mid + w * 0.04 - sw, y + h * 0.93, w * 0.4, h * 0.07);
    ipoly([[mid - w * 0.5, y + h * 0.2], [mid + w * 0.5, y + h * 0.2], [mid + w * 0.38, y + h * 0.7], [mid - w * 0.38, y + h * 0.7]]);
    for (const s of [-1, 1]) {
      icirc(mid + s * w * 0.56, y + h * 0.26, w * 0.16);
      const up = act === 'slam' && at > 5 && at < 28 && s === f;
      ipoly([[mid + s * w * 0.5, y + h * 0.3], [mid + s * w * 0.64, y + h * (up ? 0.1 : 0.34)], [mid + s * w * 0.72, y + h * (up ? -0.1 : 0.78)], [mid + s * w * 0.52, y + h * (up ? 0.0 : 0.8)]]);
      icirc(mid + s * w * 0.62, y + h * (up ? -0.12 : 0.84), w * 0.15);
    }
    irect(mid - w * 0.15, y + h * 0.03, w * 0.3, h * 0.17);
    if (!fl) {
      ctx.fillStyle = PINK; ctx.fillRect(mid - w * 0.12, y + h * 0.1, w * 0.24, 4); glowEye(mid + f * w * 0.05, y + h * 0.11, 3);
      const pl = 0.55 + Math.sin(t * 0.15) * 0.25; ctx.globalAlpha = pl; ctx.fillStyle = PINK; ctx.fillRect(mid - 15, y + h * 0.38, 30, 30); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(mid - 15, y + h * 0.38, 30, 30); ctx.beginPath(); ctx.moveTo(mid, y + h * 0.38); ctx.lineTo(mid, y + h * 0.38 + 30); ctx.moveTo(mid - 15, y + h * 0.38 + 15); ctx.lineTo(mid + 15, y + h * 0.38 + 15); ctx.stroke();
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const a = ((t * 0.7 + k * 18) % 54); ctx.fillStyle = `rgba(230,230,230,${0.4 * (1 - a / 54)})`; ctx.beginPath(); ctx.arc(mid + s * w * 0.56 + Math.sin(a * 0.2) * 5, y + h * 0.1 - a, 6 + a * 0.12, 0, 7); ctx.fill(); }
    }
  } else if (sh === 'reaper') {
    const bob = Math.sin(t * 0.07) * 6; ctx.save(); ctx.translate(0, bob);
    ctx.beginPath(); ctx.moveTo(x - 10, y + h);
    for (let i = 0; i <= 8; i++) ctx.lineTo(x - 10 + (w + 20) * i / 8, y + h - (i % 2 ? 0 : 16) + Math.sin(t * 0.14 + i) * 3);
    ctx.lineTo(x + w * 0.85, y + h * 0.28); ctx.lineTo(x + w * 0.15, y + h * 0.28); ctx.closePath(); ink();
    ipoly([[x - 6, y + h * 0.3], [mid, y - 8], [x + w + 6, y + h * 0.3]]);
    glowEye(mid - 8, y + h * 0.17, 3.2); glowEye(mid + 8, y + h * 0.17, 3.2);
    const px = mid + f * (w * 0.62), top = y - h * 0.12;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px - f * 8, y + h * 0.98); ctx.lineTo(px, top); ctx.stroke(); ctx.strokeStyle = '#777'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = fl ? '#fff' : '#f4f2ea'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, top); ctx.quadraticCurveTo(px + f * 70, top - 22, px + f * 100, top + 34); ctx.quadraticCurveTo(px + f * 56, top + 6, px, top + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + f * 6, top + 4); ctx.quadraticCurveTo(px + f * 64, top - 8, px + f * 94, top + 30); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; for (const o of [-0.25, 0.1, 0.38]) { ctx.beginPath(); ctx.moveTo(mid + w * o, y + h); ctx.lineTo(mid + w * o + Math.sin(t * 0.1 + o * 9) * 4, y + h + 20 + Math.cos(t * 0.1 + o) * 4); ctx.stroke(); }
    ctx.restore();
  } else { // demon
    const flp = Math.sin(t * 0.09) * 16;
    for (const s of [-1, 1]) {
      ctx.fillStyle = R; ipoly([[mid + s * w * 0.1, y + h * 0.3], [mid + s * w * 0.55, y - h * 0.26 - flp * s * 0.0 + flp], [mid + s * w * 1.0, y - h * 0.08 + flp * 0.6], [mid + s * w * 1.12, y + h * 0.34], [mid + s * w * 0.78, y + h * 0.4], [mid + s * w * 0.55, y + h * 0.48], [mid + s * w * 0.35, y + h * 0.5]]);
      if (!fl) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(mid + s * w * 0.1, y + h * 0.32); ctx.lineTo(mid + s * w * (0.35 + k * 0.22), y - h * 0.05 + k * 14 + flp * 0.6); ctx.stroke(); } }
    }
    ctx.fillStyle = R; const sw = moving ? Math.sin(ph) * 4 : 0;
    irect(mid - w * 0.26 + sw, y + h * 0.66, w * 0.18, h * 0.34); irect(mid + w * 0.08 - sw, y + h * 0.66, w * 0.18, h * 0.34);
    ipoly([[mid - w * 0.32, y + h * 0.9], [mid - w * 0.08, y + h * 0.9], [mid - w * 0.12, y + h]]); ipoly([[mid + w * 0.08, y + h * 0.9], [mid + w * 0.32, y + h * 0.9], [mid + w * 0.12, y + h]]);
    ipoly([[mid - w * 0.34, y + h * 0.28], [mid + w * 0.34, y + h * 0.28], [mid + w * 0.26, y + h * 0.68], [mid - w * 0.26, y + h * 0.68]]);
    ctx.strokeStyle = R; ctx.lineWidth = 14; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mid + s * w * 0.3, y + h * 0.34); ctx.lineTo(mid + s * w * 0.52, y + h * 0.6); ctx.stroke(); ipoly([[mid + s * w * 0.52 - 6, y + h * 0.62], [mid + s * w * 0.52, y + h * 0.78], [mid + s * w * 0.52 + 6, y + h * 0.62]]); }
    const hx = mid + f * 5, hy = y + h * 0.17;
    icirc(hx, hy, w * 0.16);
    ctx.lineWidth = 9; ctx.strokeStyle = R; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + s * w * 0.1, hy - w * 0.1); ctx.quadraticCurveTo(hx + s * w * 0.3, hy - w * 0.34, hx + s * w * 0.22, hy - w * 0.5); ctx.stroke(); }
    glowEye(hx - w * 0.06, hy - 2, 3.4); glowEye(hx + w * 0.06, hy - 2, 3.4);
    ctx.fillStyle = fl ? '#fff' : '#ecebe2'; ipoly([[hx - 8, hy + w * 0.08], [hx - 5, hy + w * 0.18], [hx - 2, hy + w * 0.08]]); ipoly([[hx + 8, hy + w * 0.08], [hx + 5, hy + w * 0.18], [hx + 2, hy + w * 0.08]]);
    ctx.strokeStyle = R; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(mid - f * w * 0.2, y + h * 0.66); ctx.quadraticCurveTo(mid - f * w * 0.8, y + h * 0.9 + Math.sin(t * 0.1) * 8, mid - f * w * 0.9, y + h * 0.5); ctx.stroke();
    ipoly([[mid - f * w * 0.9, y + h * 0.5], [mid - f * w * 1.02, y + h * 0.42], [mid - f * w * 0.84, y + h * 0.38]]);
  }
  FL = false;
  if (e.barrier) { ctx.fillStyle = 'rgba(255,42,100,.14)'; ctx.beginPath(); ctx.ellipse(mid, y + h * 0.5, w * 0.78, h * 0.78, 0, 0, 7); ctx.fill(); ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t; ctx.stroke(); ctx.setLineDash([]); }
  if (e.tele) { const bx = mid - 18, by = y - 70 - Math.sin(t * 0.6) * 3; ctx.fillStyle = PINK; ctx.fillRect(bx, by, 36, 40); TS('!', mid, by + 34, 34, '#fff', '#000', 3); }
}
