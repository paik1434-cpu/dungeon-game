'use strict';
// ===== 보스 작화 (6종) =====
function drawBoss(e) {
  const x = e.x, y = e.y, w = e.w, h = e.h, f = e.face, t = S.t, sh = e.def.shape, fl = e.flash > 0, mid = x + w / 2;
  const rage = e.hp < e.maxhp * 0.5, col = e.slow > 0 ? '#3a4a5a' : INK;
  const moving = Math.abs(e.vx) > 0.1, ph = t * 0.15, act = e.act ? e.act.n : '', at = e.act ? e.act.t : 0;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(mid, y + h + 1, w * 0.62, 5, 0, 0, 7); ctx.fill();
  if (rage) { ctx.fillStyle = 'rgba(255,42,100,.22)'; ctx.beginPath(); ctx.ellipse(mid, y + h * 0.5, w * 0.8, h * 0.72, 0, 0, 7); ctx.fill(); }
  FL = fl; ctx.fillStyle = fl ? '#fff' : col;
  const R = fl ? '#fff' : col;

  if (sh === 'ogre') {
    const sw = moving ? Math.sin(ph) * 5 : 0;
    irect(mid - w * 0.3 + sw, y + h * 0.7, w * 0.22, h * 0.3); irect(mid + w * 0.08 - sw, y + h * 0.7, w * 0.22, h * 0.3);
    ipoly([[mid - f * w * 0.08 - w * 0.44, y + h * 0.28], [mid - f * w * 0.08 + w * 0.44, y + h * 0.28], [mid + w * 0.38, y + h * 0.76], [mid - w * 0.38, y + h * 0.76]]);
    ctx.beginPath(); ctx.ellipse(mid, y + h * 0.56, w * 0.36, h * 0.2, 0, 0, 7); ink();
    // 어깨 가시
    for (const s of [-1, 1]) { icirc(mid + s * w * 0.42, y + h * 0.3, w * 0.15); ipoly([[mid + s * w * 0.36, y + h * 0.2], [mid + s * w * 0.42, y + h * 0.02], [mid + s * w * 0.5, y + h * 0.22]]); }
    // 뒷팔
    ipoly([[mid - f * w * 0.4, y + h * 0.3], [mid - f * w * 0.5, y + h * 0.34], [mid - f * w * 0.62, y + h * 0.78], [mid - f * w * 0.46, y + h * 0.8]]); icirc(mid - f * w * 0.55, y + h * 0.82, w * 0.12);
    // 머리/뿔/엄니
    const hx = mid + f * w * 0.16, hy = y + h * 0.17;
    icirc(hx, hy, w * 0.17);
    ipoly([[hx - w * 0.12, hy - w * 0.08], [hx - w * 0.22, hy - w * 0.3], [hx - w * 0.04, hy - w * 0.14]]); ipoly([[hx + w * 0.12, hy - w * 0.08], [hx + w * 0.22, hy - w * 0.3], [hx + w * 0.04, hy - w * 0.14]]);
    ctx.fillStyle = fl ? '#fff' : '#ecebe2'; ipoly([[hx - w * 0.1, hy + w * 0.08], [hx - w * 0.07, hy + w * 0.2], [hx - w * 0.03, hy + w * 0.08]]); ipoly([[hx + w * 0.1, hy + w * 0.08], [hx + w * 0.07, hy + w * 0.2], [hx + w * 0.03, hy + w * 0.08]]);
    glowEye(hx - w * 0.06 + f * 2, hy - 2, 3); glowEye(hx + w * 0.07 + f * 2, hy - 2, 3);
    // 앞팔 + 가시 곤봉
    const up = act === 'slam' && at > 5 && at < 28, hand = [mid + f * w * 0.55, y + h * (up ? 0.1 : 0.58)];
    ctx.strokeStyle = R; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mid + f * w * 0.4, y + h * 0.32); ctx.lineTo(hand[0], hand[1]); ctx.stroke();
    weaponLine(hand[0], hand[1], hand[0] + f * (up ? 6 : 14), hand[1] - h * 0.55, '#555', 16, 8);
    ctx.fillStyle = fl ? '#fff' : INK; icirc(hand[0] + f * (up ? 6 : 14), hand[1] - h * 0.58, 14);
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4; ipoly([[hand[0] + f * (up ? 6 : 14) + Math.cos(a) * 11, hand[1] - h * 0.58 + Math.sin(a) * 11], [hand[0] + f * (up ? 6 : 14) + Math.cos(a) * 20, hand[1] - h * 0.58 + Math.sin(a) * 20], [hand[0] + f * (up ? 6 : 14) + Math.cos(a + 0.5) * 11, hand[1] - h * 0.58 + Math.sin(a + 0.5) * 11]]); }
    ctx.strokeStyle = fl ? '#000' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mid - w * 0.2, y + h * 0.4); ctx.lineTo(mid, y + h * 0.5); ctx.moveTo(mid - w * 0.1, y + h * 0.36); ctx.lineTo(mid + w * 0.1, y + h * 0.52); ctx.stroke();
  } else if (sh === 'lich') {
    const bob = Math.sin(t * 0.08) * 6; ctx.save(); ctx.translate(0, bob);
    ctx.beginPath(); ctx.moveTo(x - 6, y + h);
    for (let i = 0; i <= 7; i++) ctx.lineTo(x - 6 + (w + 12) * i / 7, y + h - (i % 2 ? 0 : 14) + Math.sin(t * 0.15 + i) * 3);
    ctx.lineTo(x + w * 0.85, y + h * 0.3); ctx.lineTo(x + w * 0.15, y + h * 0.3); ctx.closePath(); ink();
    ipoly([[x - 8, y + h * 0.36], [mid, y - 4], [x + w + 8, y + h * 0.36]]);
    if (!fl) { ctx.strokeStyle = '#ecebe2'; ctx.lineWidth = 1.8; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(mid - w * 0.16, y + h * (0.46 + i * 0.07)); ctx.lineTo(mid + w * 0.16, y + h * (0.46 + i * 0.07)); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(mid, y + h * 0.4); ctx.lineTo(mid, y + h * 0.7); ctx.stroke(); }
    ctx.fillStyle = fl ? '#fff' : '#ecebe2'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mid, y + h * 0.25, w * 0.24, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillRect(mid - w * 0.12, y + h * 0.35, w * 0.24, h * 0.06);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(mid - 8, y + h * 0.24, 5, 0, 7); ctx.arc(mid + 8, y + h * 0.24, 5, 0, 7); ctx.fill();
    glowEye(mid - 8, y + h * 0.24, 3); glowEye(mid + 8, y + h * 0.24, 3);
    ctx.fillStyle = fl ? '#fff' : INK; ipoly([[mid - 24, y - 2], [mid - 18, y - 24], [mid - 7, y - 8], [mid, y - 30], [mid + 7, y - 8], [mid + 18, y - 24], [mid + 24, y - 2]]);
    if (!fl) { ctx.fillStyle = PINK; ctx.fillRect(mid - 20, y - 8, 40, 3); }
    const sx = mid + f * (w * 0.7 + 8);
    weaponLine(sx, y + h * 0.95, sx, y - h * 0.1, '#777', 5, 2);
    ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, y - h * 0.16, 10, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, y - h * 0.16, 4, 0, 7); ctx.fill();
    for (let k = 0; k < 3; k++) { const a = t * 0.05 + k * 2.09, px = sx + Math.cos(a) * 26, py = y - h * 0.16 + Math.sin(a) * 12; ctx.fillStyle = fl ? '#fff' : '#ecebe2'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#000'; ctx.fillRect(px - 3, py - 1, 2, 2); ctx.fillRect(px + 1, py - 1, 2, 2); }
    ctx.restore();
  } else if (sh === 'spider') {
    const cyb = y + h * 0.5;
    ctx.strokeStyle = R; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
      const bx = mid + (k - 1.5) * w * 0.07, sw = (moving || act === 'charge') ? Math.sin(ph * 2 + k * 1.5) * 6 : Math.sin(t * 0.05 + k) * 2;
      ctx.lineWidth = 9 - k; ctx.beginPath(); ctx.moveTo(bx, cyb);
      ctx.lineTo(bx + s * w * (0.26 + k * 0.05), y - h * (0.32 - k * 0.04) + sw); ctx.lineTo(bx + s * w * (0.5 + k * 0.03), y + h + 1); ctx.stroke();
    }
    ctx.fillStyle = R; ctx.beginPath(); ctx.ellipse(mid - f * w * 0.22, cyb - 4, w * 0.3, h * 0.44, 0, 0, 7); ink();
    ctx.beginPath(); ctx.ellipse(mid + f * w * 0.2, cyb + 2, w * 0.18, h * 0.3, 0, 0, 7); ink();
    if (!fl) { ctx.fillStyle = PINK; ipoly([[mid - f * w * 0.22 - 8, cyb - 22], [mid - f * w * 0.22 + 8, cyb - 22], [mid - f * w * 0.22, cyb - 6], [mid - f * w * 0.22 + 8, cyb + 10], [mid - f * w * 0.22 - 8, cyb + 10], [mid - f * w * 0.22, cyb - 6]]); }
    const hx = mid + f * w * 0.26;
    for (const [dx, dy, r] of [[0, -6, 3.4], [-8, -4, 2.6], [8, -4, 2.6], [-4, 3, 2], [4, 3, 2], [0, 0, 1.6]]) glowEye(hx + dx * f, cyb + dy, r);
    ctx.fillStyle = fl ? '#fff' : '#ecebe2'; ipoly([[hx + f * 4, cyb + 8], [hx + f * 8, cyb + 22], [hx + f * 11, cyb + 8]]); ipoly([[hx - f * 4, cyb + 8], [hx - f * 8, cyb + 22], [hx - f * 11, cyb + 8]]);
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mid, -10); ctx.lineTo(mid - f * w * 0.22, cyb - h * 0.42); ctx.stroke();
  } else if (sh === 'knight') {
    const sw = moving ? Math.sin(ph) * 5 : 0, charge = act === 'charge' && at >= 40;
    // 망토
    const wave = Math.sin(t * 0.18) * 4, lag = moving ? 16 : 4;
    ipoly([[mid - f * w * 0.1, y + h * 0.24], [mid + f * w * 0.1, y + h * 0.26], [mid + f * w * 0.1, y + h * 0.9], [mid - f * (w * 0.8 + lag), y + h * 0.95 + wave], [mid - f * (w * 0.4 + lag), y + h * 0.5]]);
    irect(mid - w * 0.28 + sw, y + h * 0.64, w * 0.22, h * 0.36); irect(mid + w * 0.06 - sw, y + h * 0.64, w * 0.22, h * 0.36);
    ipoly([[mid - w * 0.34, y + h * 0.22], [mid + w * 0.34, y + h * 0.22], [mid + w * 0.28, y + h * 0.66], [mid - w * 0.28, y + h * 0.66]]);
    for (const s of [-1, 1]) { icirc(mid + s * w * 0.4, y + h * 0.24, w * 0.16); ipoly([[mid + s * w * 0.34, y + h * 0.16], [mid + s * w * 0.42, y + h * 0.0], [mid + s * w * 0.5, y + h * 0.18]]); }
    const hx = mid + f * 2, hy = y + h * 0.1, hr = w * 0.2;
    ipoly([[hx - hr, hy + hr], [hx - hr, hy - hr * 0.8], [hx, hy - hr * 1.5], [hx + hr, hy - hr * 0.8], [hx + hr, hy + hr]]);
    ipoly([[hx - hr * 0.9, hy - hr], [hx - hr * 2, hy - hr * 2.4], [hx - hr * 0.2, hy - hr * 1.3]]); ipoly([[hx + hr * 0.9, hy - hr], [hx + hr * 2, hy - hr * 2.4], [hx + hr * 0.2, hy - hr * 1.3]]);
    if (!fl) { ctx.fillStyle = PINK; ctx.fillRect(hx - hr * 0.9, hy - 1, hr * 1.8, 3); glowEye(hx + f * hr * 0.4, hy + 0.5, 2.2); ipoly([[hx, hy - hr * 1.5], [hx - f * (18 + Math.sin(t * 0.25) * 4), hy - hr * 1.9], [hx - f * 4, hy - hr * 0.8]]); }
    // 대검
    const hand = [mid + f * w * 0.5, y + h * (charge ? 0.4 : 0.46)];
    ctx.strokeStyle = R; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mid + f * w * 0.3, y + h * 0.3); ctx.lineTo(hand[0], hand[1]); ctx.stroke();
    const ang = charge ? -0.2 : (act === 'slam' ? -1.9 : -1.2);
    weaponLine(hand[0], hand[1], hand[0] + f * Math.cos(Math.abs(ang)) * h * 0.95 * (ang < -1.57 ? -0.3 : 1), hand[1] + Math.sin(ang) * h * 0.95, '#cfcfd6', 11, 5);
  } else if (sh === 'dragon') {
    const fl2 = Math.sin(t * 0.1) * 14, open = act === 'fan' && at < 34;
    // 날개
    for (const [bx, s] of [[mid - f * 8, -1], [mid + f * 8, 1]]) {
      ctx.fillStyle = R; ipoly([[bx, y + h * 0.3], [bx + s * f * 30, y - 58 + (s < 0 ? -fl2 : fl2)], [bx + s * f * 78, y - 12 + (s < 0 ? -fl2 : fl2) * 0.6], [bx + s * f * 66, y + h * 0.28], [bx + s * f * 40, y + h * 0.44]]);
      if (!fl) { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(bx, y + h * 0.3); ctx.lineTo(bx + s * f * (30 + k * 16), y - 40 + k * 8 + (s < 0 ? -fl2 : fl2) * 0.7); ctx.stroke(); } }
    }
    ctx.fillStyle = R;
    ctx.beginPath(); ctx.ellipse(mid, y + h * 0.6, w * 0.42, h * 0.32, 0, 0, 7); ink();
    // 꼬리
    ipoly([[mid - f * w * 0.3, y + h * 0.66], [mid - f * w * 0.85, y + h * 0.95 + Math.sin(t * 0.1) * 6], [mid - f * w * 0.95, y + h * 0.78], [mid - f * w * 0.4, y + h * 0.5]]);
    ipoly([[mid - f * w * 0.85, y + h * 0.95 + Math.sin(t * 0.1) * 6], [mid - f * w * 1.05, y + h * 0.7], [mid - f * w * 0.93, y + h * 1.0]]);
    // 등 가시
    for (let k = 0; k < 5; k++) ipoly([[mid - f * w * (0.3 - k * 0.1) - 6, y + h * (0.32 + Math.abs(k - 2) * 0.03)], [mid - f * w * (0.3 - k * 0.1), y + h * (0.12 + Math.abs(k - 2) * 0.04)], [mid - f * w * (0.3 - k * 0.1) + 6, y + h * (0.32 + Math.abs(k - 2) * 0.03)]]);
    irect(mid - 28, y + h * 0.78, 14, h * 0.22); irect(mid + 14, y + h * 0.78, 14, h * 0.22);
    // 목 + 머리
    ipoly([[mid + f * w * 0.22, y + h * 0.5], [mid + f * w * 0.36, y + h * 0.06], [mid + f * w * 0.5, y + h * 0.12], [mid + f * w * 0.48, y + h * 0.42]]);
    const hx = mid + f * w * 0.55, hy = y + h * 0.1;
    ipoly([[hx - f * w * 0.14, hy - 6], [hx + f * w * 0.2, hy + (open ? -2 : 6)], [hx + f * w * 0.18, hy + 16 - (open ? 0 : 8)], [hx - f * w * 0.12, hy + 20]]);
    if (open) { ipoly([[hx - f * w * 0.1, hy + 22], [hx + f * w * 0.18, hy + 16], [hx + f * w * 0.14, hy + 34], [hx - f * w * 0.06, hy + 32]]); if (!fl) { ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(hx + f * w * 0.06, hy + 18, 7 + Math.sin(t * 0.7) * 2, 0, 7); ctx.fill(); } ctx.fillStyle = R; }
    ipoly([[hx - f * w * 0.1, hy - 4], [hx - f * w * 0.2, hy - 24], [hx - f * w * 0.02, hy - 6]]); ipoly([[hx + f * w * 0.02, hy - 4], [hx - f * w * 0.06, hy - 26], [hx + f * w * 0.08, hy - 6]]);
    glowEye(hx + f * w * 0.04, hy + 2, 3.4);
  } else { // eye: 심연의 눈
    const bob = Math.sin(t * 0.07) * 8, ex = mid, ey = y + h * 0.42 + bob;
    ctx.save();
    for (let k = 0; k < 9; k++) { // 촉수
      const bx = ex + (k - 4) * w * 0.1; ctx.strokeStyle = R; ctx.lineWidth = 8 - Math.abs(k - 4) * 0.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, ey + h * 0.2);
      for (let j = 1; j <= 5; j++) ctx.lineTo(bx + Math.sin(t * 0.08 + k + j * 0.9) * (6 + j * 3), ey + h * 0.2 + j * h * 0.12 + bob * 0.2);
      ctx.stroke();
    }
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + t * 0.01; ipoly([[ex + Math.cos(a - 0.1) * w * 0.5, ey + Math.sin(a - 0.1) * w * 0.5], [ex + Math.cos(a) * (w * 0.5 + 16 + (k % 2) * 8), ey + Math.sin(a) * (w * 0.5 + 16 + (k % 2) * 8)], [ex + Math.cos(a + 0.1) * w * 0.5, ey + Math.sin(a + 0.1) * w * 0.5]]); }
    ctx.beginPath(); ctx.arc(ex, ey, w * 0.5, 0, 7); ink();
    ctx.fillStyle = fl ? '#fff' : '#f4f2ea'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(ex, ey, w * 0.38, h * 0.26, 0, 0, 7); ctx.fill(); ctx.stroke();
    const dx = clamp((cx(P) - ex) * 0.04, -12, 12), dy = clamp((cy(P) - ey) * 0.04, -8, 8);
    ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(ex + dx, ey + dy, h * 0.19, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(ex + dx, ey + dy, 5 + (open0(e) ? 3 : 0), h * 0.17, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + dx - 7, ey + dy - 8, 3, 0, 7); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : INK; ipoly([[ex - w * 0.46, ey - h * 0.1], [ex + w * 0.46, ey - h * 0.1], [ex + w * 0.3, ey - h * 0.28], [ex - w * 0.3, ey - h * 0.28]]);
    ctx.restore();
  }
  FL = false;
  if (e.barrier) { const t2 = S.t; ctx.fillStyle = 'rgba(255,42,100,.14)'; ctx.beginPath(); ctx.ellipse(mid, y + h * 0.5, w * 0.78, h * 0.78, 0, 0, 7); ctx.fill(); ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t2; ctx.stroke(); ctx.setLineDash([]); }
  if (e.tele) {
    const bx = mid - 18, by = y - 70 - Math.sin(t * 0.6) * 3;
    ctx.fillStyle = PINK; ctx.fillRect(bx, by, 36, 40); TS('!', mid, by + 34, 34, '#fff', '#000', 3);
  }
}
function open0(e) { return e.act && e.act.n === 'fan' && e.act.t < 34; }
