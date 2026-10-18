'use strict';
// ===== 림보풍 실루엣 작화 (플레이어 / 배경 / 스킬 이펙트 / 스킬 아이콘) =====

// 훤칠한 인체 실루엣. o: coat | robe | tail(망토) | shoulder | head | hand[x,y] | run
function figure(x, y, w, h, f, t, moving, o = {}) {
  const col = INK, run = !!o.run, ph = t * (run ? 0.5 : 0.3);
  const bob = moving ? Math.sin(ph * 2) * 1 : 0, sw = moving ? Math.sin(ph) * (run ? 9 : 5) : 0;
  const mid = x + w / 2, hip = y + h * 0.56, top = y + h * 0.2 + bob, lw = w * 0.2, sh = o.shoulder || 0;
  const hand = o.hand || [mid + f * w * 0.5, y + h * 0.4];
  ctx.fillStyle = FL ? '#fff' : col;
  // 망토/코트 자락 (몸 뒤)
  if (o.tail || o.coat) {
    const wave = Math.sin(t * 0.18) * 3, lag = moving ? (run ? 14 : 6) : 0, ln = o.tail ? 0.3 : 0.2;
    ipoly([[mid, top], [mid + f * w * 0.15, top + 4], [mid + f * w * 0.2, y + h * 0.78], [mid - f * (w * 0.55 + lag), y + h * (0.6 + ln) + wave], [mid - f * (w * 0.2 + lag * 0.4), y + h * 0.4]]);
  }
  if (o.robe) {
    const wave = Math.sin(t * 0.2) * 2;
    ipoly([[mid - w * 0.28, top], [mid + w * 0.28, top], [mid + w * 0.62, y + h - 1 + wave], [mid + w * 0.2, y + h - 4], [mid - w * 0.2, y + h], [mid - w * 0.62, y + h - 1 - wave]]);
  } else {
    ipoly([[mid - lw * 1.2 + sw * 0.2, hip - 2], [mid - lw * 0.1 + sw * 0.2, hip - 2], [mid - lw * 0.1 + sw * 0.7, y + h], [mid - lw * 1.5 + sw, y + h]]);
    ipoly([[mid + lw * 0.1 - sw * 0.2, hip - 2], [mid + lw * 1.2 - sw * 0.2, hip - 2], [mid + lw * 1.5 - sw, y + h], [mid + lw * 0.1 - sw * 0.7, y + h]]);
    ipoly([[mid - w * 0.3 - sh, top], [mid + w * 0.3 + sh, top], [mid + w * (o.coat ? 0.42 : 0.24), o.coat ? y + h * 0.76 : hip + 2], [mid - w * (o.coat ? 0.42 : 0.24), o.coat ? y + h * 0.76 : hip + 2]]);
    ipoly([[mid - lw * 1.55 + sw, y + h - 3], [mid - lw * 0.05 + sw * 0.7, y + h - 3], [mid - lw * 0.05 + sw * 0.7 + f * 6, y + h + 1], [mid - lw * 1.55 + sw + f * 6, y + h + 1]]);
    ipoly([[mid + lw * 0.05 - sw * 0.7, y + h - 3], [mid + lw * 1.55 - sw, y + h - 3], [mid + lw * 1.55 - sw + f * 6, y + h + 1], [mid + lw * 0.05 - sw * 0.7 + f * 6, y + h + 1]]);
    ctx.fillStyle = '#fff'; ctx.fillRect(mid - w * 0.24, hip - 4, w * 0.48, 1.6); ctx.fillStyle = FL ? '#fff' : col;
  }
  // 팔
  ctx.lineCap = 'round'; ctx.strokeStyle = FL ? '#fff' : col; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(mid + f * w * 0.1, top + 4); ctx.lineTo(hand[0], hand[1]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mid - f * w * 0.1, top + 4); ctx.lineTo(mid - f * w * 0.28, hip - 2 + (moving ? Math.sin(ph) * 3 : 0)); ctx.stroke();
  // 머리
  icirc(mid + f * 1.5, y + h * 0.1 + bob, w * (o.head || 0.27));
  if (!FL) { ctx.globalAlpha = .45; ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(mid + f * w * 0.18, y + h * 0.1 + bob, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.fillStyle = '#fff'; ctx.fillRect(mid + f * w * 0.14 - 1.5, y + h * 0.09 + bob, 5, 2.2);
  FL = false;
}
function weaponLine(x1, y1, x2, y2, hl, w1 = 6, w2 = 2.5) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000'; ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = hl; ctx.lineWidth = w2; ctx.stroke();
}
// aimAng: 조준 각도(라디안). 공격 중이면 그 방향으로 무기를 휘두름
function drawPlayerSprite(id, x, y, w, h, f, t, moving, atk, flash, aimAng, run) {
  FL = !!flash;
  const ang = aimAng === undefined ? (f > 0 ? 0 : Math.PI) : aimAng, mid = x + w / 2;
  const hx = mid + f * w * 0.5, hy = y + h * 0.4;
  const lean = run ? f * 0.1 : 0;
  ctx.save();
  if (lean) { ctx.translate(mid, y + h); ctx.rotate(lean); ctx.translate(-mid, -(y + h)); }
  // 바닥 그림자
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(mid, y + h + 1, w * 0.7, 3, 0, 0, 7); ctx.fill();
  if (id === 'warrior') {
    const p = clamp(1 - Math.min(atk, 10) / 10, 0, 1), a = atk > 0 ? ang + (-1.3 + p * 2.6) * f : null;
    const hand = atk > 0 ? [mid + Math.cos(ang) * 6, hy + Math.sin(ang) * 6] : [hx - f * 2, hy];
    figure(x, y, w, h, f, t, moving, { tail: true, shoulder: 3, hand, run });
    ctx.fillStyle = FL ? '#fff' : INK; ctx.beginPath(); ctx.ellipse(mid + f * 7, y + h * 0.2, 5, 3, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(mid - f * 7, y + h * 0.2, 5, 3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = FL ? '#fff' : INK; ipoly([[mid - w * 0.28, y + h * 0.06], [mid - w * 0.5, y - h * 0.12], [mid - w * 0.12, y + h * 0.0]]); ipoly([[mid + w * 0.28, y + h * 0.06], [mid + w * 0.5, y - h * 0.12], [mid + w * 0.12, y + h * 0.0]]);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mid - w * 0.27, y + h * 0.15); ctx.lineTo(mid + w * 0.27, y + h * 0.15); ctx.stroke();
    ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mid - f * 8, y + h * 0.22); ctx.lineTo(mid + f * 8, y + h * 0.54); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mid - w * 0.34, y + h * 0.2); ctx.lineTo(mid + w * 0.34, y + h * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mid - f * 2, y + h * 0.1); ctx.lineTo(mid - f * (9 + Math.sin(t * 0.3) * 3), y + h * 0.12 + 3); ctx.stroke();
    if (a !== null) { weaponLine(hand[0], hand[1], hand[0] + Math.cos(a) * 54, hand[1] + Math.sin(a) * 54, '#fff', 7, 3); weaponLine(hand[0] + Math.cos(a + 1.57) * 7, hand[1] + Math.sin(a + 1.57) * 7, hand[0] + Math.cos(a - 1.57) * 7, hand[1] + Math.sin(a - 1.57) * 7, PINK, 5, 2.5); }
    else { weaponLine(hx - f * 2, hy, hx - f * 20, y - 14, '#fff', 7, 3); weaponLine(hx - f * 9, hy - 12, hx + f * 1, hy - 5, PINK, 5, 2.5); }
  } else if (id === 'mage') {
    const hand = [hx, hy + 2];
    figure(x, y, w, h, f, t, moving, { robe: true, hand, run });
    ctx.fillStyle = FL ? '#fff' : INK;
    ctx.beginPath(); ctx.ellipse(mid, y + h * 0.04, w * 0.7, 3.5, 0, 0, 7); ctx.fill();
    ipoly([[mid - w * 0.34, y + h * 0.03], [mid + f * w * 0.1 - f * 2, y - h * 0.3], [mid + f * w * 0.3, y - h * 0.22], [mid + w * 0.34, y + h * 0.03]]);
    ctx.fillStyle = PINK; ctx.fillRect(mid - w * 0.34, y + h * 0.0, w * 0.68, 2.5);
    ctx.fillStyle = FL ? '#fff' : INK; ipoly([[mid + f * 2, y + h * 0.16], [mid + f * 7, y + h * 0.17], [mid + f * 3, y + h * 0.36 + Math.sin(t * 0.15) * 2], [mid - f * 2, y + h * 0.17]]);
    if (!FL) { ctx.save(); ctx.translate(mid, y + h * 0.5); ctx.rotate(t * 0.03); ctx.strokeStyle = PINK; ctx.globalAlpha = .55; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(0, 0, w * 0.95, h * 0.2, 0, 0, 7); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; ctx.setLineDash([]); }
    const tipX = atk > 0 ? hx + Math.cos(ang) * 22 : hx + f * 2, tipY = atk > 0 ? hy + Math.sin(ang) * 22 : y - 4;
    weaponLine(hx, hy + 8, tipX, tipY, '#777', 4, 1.5);
    ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tipX, tipY, atk > 0 ? 7 : 5, 0, 7); ctx.fill(); ctx.stroke();
    if (atk > 0) { ctx.globalAlpha = .35; ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(tipX, tipY, 13, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  } else if (id === 'archer') {
    const hand = [hx + Math.cos(ang) * 10, hy + Math.sin(ang) * 10];
    figure(x, y, w, h, f, t, moving, { tail: true, hand, run });
    ctx.fillStyle = FL ? '#fff' : INK; ipoly([[mid - w * 0.34, y + h * 0.14], [mid - f * 3, y - h * 0.12], [mid + w * 0.34, y + h * 0.14]]);
    ctx.save(); ctx.translate(mid - f * 7, y + h * 0.3); ctx.rotate(-f * 0.4); ctx.fillStyle = FL ? '#fff' : INK; ctx.fillRect(-3, -10, 6, 20); ctx.fillStyle = '#fff'; ctx.fillRect(-2, -14, 1.5, 5); ctx.fillRect(1, -13, 1.5, 4); ctx.restore();
    ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mid - f * 3, y + h * 0.23); ctx.lineTo(mid - f * (11 + Math.sin(t * 0.3) * 3), y + h * 0.26 + 4); ctx.stroke();
    ctx.fillStyle = FL ? '#fff' : INK; ipoly([[mid - f * w * 0.2, y + h * 0.06], [mid - f * w * 0.75, y + h * 0.2 + Math.sin(t * 0.25) * 3], [mid - f * w * 0.3, y + h * 0.2]]);
    ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(ang);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(-9, 0, 19, -1.15, 1.15); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9 + 19 * Math.cos(1.15), 19 * Math.sin(1.15)); ctx.lineTo(atk > 0 ? -9 : -2, 0); ctx.lineTo(-9 + 19 * Math.cos(1.15), -19 * Math.sin(1.15)); ctx.stroke();
    if (atk > 0) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(12, 0); ctx.stroke(); }
    ctx.restore();
  } else {
    const hand = atk > 0 ? [mid + Math.cos(ang) * 8, hy + Math.sin(ang) * 8] : [hx - f * 2, hy + 6];
    figure(x, y, w, h, f, t, moving, { coat: true, hand, run });
    ctx.fillStyle = FL ? '#fff' : INK; ipoly([[mid - w * 0.3, y + h * 0.13], [mid - f * w * 0.1, y - h * 0.05], [mid + w * 0.3, y + h * 0.1], [mid + w * 0.12, y + h * 0.22], [mid - w * 0.3, y + h * 0.24]]);
    ctx.fillStyle = '#fff'; ctx.fillRect(mid + f * w * 0.12 - 1.5, y + h * 0.1, 5, 2.2);
    ctx.strokeStyle = PINK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mid, y + h * 0.2);
    for (let i = 1; i <= 4; i++) ctx.lineTo(mid - f * i * 6 - (run ? i * 3 : 0), y + h * 0.23 + Math.sin(t * 0.25 + i) * 3 + i * 1.5);
    ctx.stroke();
    const p = clamp(1 - Math.min(atk, 8) / 8, 0, 1);
    if (atk > 0) {
      const a = ang + (-0.8 + p * 1.6) * f;
      weaponLine(hand[0], hand[1], hand[0] + Math.cos(a) * 26, hand[1] + Math.sin(a) * 26, '#fff', 5, 2);
      weaponLine(mid - f * 4, y + h * 0.5, mid - f * 4 + Math.cos(a + 0.5) * 14, y + h * 0.5 + Math.sin(a + 0.5) * 14, '#ddd', 4, 1.5);
    } else {
      weaponLine(hand[0], hand[1], hand[0] + f * 4, hand[1] + 14, '#fff', 5, 2);
      weaponLine(mid - f * 8, y + h * 0.5, mid - f * 12, y + h * 0.62, '#ddd', 4, 1.5);
    }
  }
  ctx.restore();
  FL = false;
}

// ===== 배경 (비계 / 폐허 / 종유석 + 역광 안개) =====
function scaffold(x, base, hh, w, r, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'butt';
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - hh); ctx.moveTo(x + w, base); ctx.lineTo(x + w, base - hh); ctx.stroke();
  const lv = 2 + Math.floor(r * 2);
  for (let i = 1; i <= lv; i++) {
    const yy = base - hh * i / lv;
    ctx.fillRect(x - 16, yy, w + 32, 7);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, yy + 7); ctx.lineTo(x + w, yy + hh / lv); ctx.stroke();
  }
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.5, base - hh); ctx.lineTo(x + w * 0.5, base - hh + 50 + r * 60); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + w * 0.5, base - hh + 56 + r * 60, 4, 0, 7); ctx.fill();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + w, base - hh); ctx.lineTo(x + w + 90 + r * 70, base - hh - 28); ctx.stroke();
}
function layer(color, par, seed, kind, offOv, span = W) {
  ctx.fillStyle = color; ctx.strokeStyle = color;
  const TW = 280 + seed * 90, off = offOv === undefined ? S.cam * par : offOv, i0 = Math.floor(off / TW) - 1;
  for (let i = i0; i < i0 + Math.ceil(span / TW) + 3; i++) {
    const r = srand(i * 7 + seed * 31), r2 = srand(i * 13 + seed * 17 + 5), x = i * TW + r * TW * 0.6 - off;
    const hh = (seed ? 150 : 210) + r2 * (seed ? 170 : 250), base = GROUND + 12;
    if (r > 0.45) scaffold(x, base, hh, 50 + r2 * 60, r2, color);
    else if (kind === 'pillar') {
      const pw = 26 + r * 44; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - hh);
      ctx.lineTo(x + pw * 0.3, base - hh - 14); ctx.lineTo(x + pw * 0.6, base - hh + 8); ctx.lineTo(x + pw, base - hh - 6); ctx.lineTo(x + pw, base); ctx.fill();
    } else if (kind === 'tree') {
      ctx.lineCap = 'round'; ctx.lineWidth = 12 + r * 8; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + (r - 0.5) * 30, base - hh); ctx.stroke();
      ctx.lineWidth = 5;
      for (let k = 1; k <= 3; k++) { const bx = x + (r - 0.5) * 30 * k / 3, by = base - hh * k / 3.2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (k % 2 ? 1 : -1) * (30 + r2 * 30), by - 30 - r * 20); ctx.stroke(); }
    } else {
      const sw = 40 + r * 50; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + sw * 0.5, base - hh * 1.1); ctx.lineTo(x + sw, base); ctx.fill();
    }
    const sx = i * TW + r2 * TW - off, sh = 30 + r * 110 * (seed ? 1.3 : 1);
    ctx.beginPath(); ctx.moveTo(sx - 22, -4); ctx.lineTo(sx + 22, -4); ctx.lineTo(sx + (r - 0.5) * 10, sh); ctx.fill();
    if (r2 > 0.5) { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + 60, 0); ctx.lineTo(sx + 60, 60 + r * 160); ctx.stroke(); }
  }
}
// 배경은 던전 시작 때 한 번만 오프스크린에 그려 두고, 매 프레임엔 drawImage만 한다.
function buildBG() {
  const D = S.D, main = ctx, out = {};
  const use = c => { ctx = c.getContext('2d'); return c; };
  // 하늘 + 역광 블룸 + 빛줄기
  out.sky = use(mkCanvas(W, H));
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, D.sky[0]); g.addColorStop(0.6, D.sky[1]); g.addColorStop(1, D.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const bl = ctx.createRadialGradient(W * 0.62, GROUND * 0.5, 10, W * 0.62, GROUND * 0.5, 480);
  bl.addColorStop(0, S.D.pinky ? 'rgba(255,190,205,.75)' : 'rgba(255,255,255,.85)'); bl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bl; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.1; ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) { const x = 160 + i * 230; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 260, GROUND); ctx.lineTo(x + 120, GROUND); ctx.fill(); }
  ctx.globalAlpha = 1;
  // 원경(블러) / 중경 스트립
  const spanF = S.worldW * 0.2 + W + 300, spanM = S.worldW * 0.5 + W + 300;
  out.far = use(mkCanvas(Math.ceil(spanF), H)); ctx.filter = 'blur(2px)'; layer(D.far, 0.2, 0, D.shapeKind, 0, spanF); ctx.filter = 'none';
  out.mid = use(mkCanvas(Math.ceil(spanM), H)); layer(D.mid, 0.5, 1, D.shapeKind, 0, spanM);
  // 지면 안개
  out.fog = use(mkCanvas(W, H));
  const fg = ctx.createLinearGradient(0, GROUND - 170, 0, GROUND + 10);
  fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(1, S.D.pinky ? 'rgba(255,60,110,.45)' : 'rgba(255,255,255,.55)');
  ctx.fillStyle = fg; ctx.fillRect(0, GROUND - 170, W, 180);
  ctx = main; S.bg = out;
}
function drawBG() {
  const b = S.bg;
  ctx.drawImage(b.sky, 0, 0);
  ctx.drawImage(b.far, -Math.round(S.cam * 0.2), 0);
  ctx.drawImage(b.mid, -Math.round(S.cam * 0.5), 0);
  ctx.drawImage(b.fog, 0, 0);
}

// ===== 스킬 이펙트 =====
function starPoly(bx, by, rx, ry, n, seed, spike) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = i * Math.PI / n + srand(seed) * 3, rr = (i % 2 ? spike : 1.12) * (0.85 + srand(i * 3 + seed) * 0.3);
    const px = bx + Math.cos(a) * rx * rr, py = by + Math.sin(a) * ry * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function drawBox(b) {
  const prog = b.t / b.life;
  if (b.shape === 'circle') {
    const bx = b.x + b.w / 2, by = b.y + b.h / 2, k = 0.5 + prog * 0.5, rx = b.w / 2 * k, ry = b.h / 2 * k;
    ctx.save(); ctx.globalAlpha = clamp(1 - prog * 0.9, 0, 1); ctx.lineJoin = 'miter';
    if (b.fx === 'spin') {
      const bxp = cx(P), byp = cy(P);
      for (let i = 0; i < 3; i++) crescent(bxp, byp, 1, rx * 0.95, rx * 0.95, 0.15, '#fff', S.t * 0.55 + i * 2.094);
      ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(bxp, byp, rx * 0.5, 0, 7); ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.stroke();
    } else if (b.fx === 'zone') {
      const zr = b.w / 2, zc = b.tint || '#fff', pul = 0.55 + Math.sin(S.t * 0.25 + b.x) * 0.2;
      ctx.globalAlpha = clamp((1 - prog) * 1.4, 0, 1) * pul;
      ctx.beginPath(); ctx.ellipse(bx, GROUND - 4, zr, 14, 0, 0, 7); ctx.fillStyle = zc === '#fff' ? 'rgba(255,255,255,.55)' : 'rgba(255,42,100,.4)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = zc; ctx.stroke();
      ctx.lineCap = 'round';
      for (let i = 0; i < Math.max(4, Math.floor(zr / 14)); i++) {
        const px = bx - zr * 0.9 + i * (zr * 1.8) / Math.max(4, Math.floor(zr / 14)) + Math.sin(S.t * 0.2 + i) * 4, hh = b.h * (0.4 + srand(i + b.x + Math.floor(S.t / 6)) * 0.6);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, GROUND - 4); ctx.lineTo(px + Math.sin(S.t * 0.3 + i) * 3, GROUND - 4 - hh); ctx.stroke();
        ctx.strokeStyle = zc; ctx.lineWidth = 2.2; ctx.stroke();
      }
    } else if (b.fx === 'nova') {
      ctx.beginPath(); ctx.ellipse(bx, by, rx * 0.6, ry * 0.6, 0, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
      for (let i = 0; i < 18; i++) {
        const a = i * Math.PI * 2 / 18, r0 = 0.55, r1 = 0.8 + srand(i + b.x) * 0.45, d = 0.07;
        ctx.beginPath(); ctx.moveTo(bx + Math.cos(a - d) * rx * r0, by + Math.sin(a - d) * ry * r0); ctx.lineTo(bx + Math.cos(a) * rx * r1, by + Math.sin(a) * ry * r1); ctx.lineTo(bx + Math.cos(a + d) * rx * r0, by + Math.sin(a + d) * ry * r0); ctx.closePath();
        ctx.fillStyle = i % 3 ? '#fff' : PINK; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
      }
    } else {
      starPoly(bx, by, rx, ry, 11, b.x, 0.45); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.stroke();
      starPoly(bx, by, rx * 0.6, ry * 0.6, 11, b.x + 5, 0.4); ctx.fillStyle = PINK; ctx.fill();
    }
    ctx.restore();
  } else if (b.h > 400) {
    ctx.save(); ctx.globalAlpha = clamp(1 - prog, 0, 1);
    const bx = b.x + b.w / 2, pts = [[bx, 0]];
    for (let y = 30; y < GROUND; y += 30) pts.push([bx + (srand(y + b.t * 3 + bx) - 0.5) * 44, y]);
    pts.push([bx, GROUND]);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(bx - 26, 0, 52, GROUND);
    ctx.fillStyle = 'rgba(255,42,100,.12)'; ctx.fillRect(bx - 60, 0, 120, GROUND);
    const path = arr => { ctx.beginPath(); arr.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const idx of [3, 6]) {
      if (!pts[idx]) continue;
      const sg = srand(idx + b.t + bx) > 0.5 ? 1 : -1, q0 = pts[idx], br = [q0, [q0[0] + sg * 26, q0[1] + 22], [q0[0] + sg * 14, q0[1] + 48], [q0[0] + sg * 40, q0[1] + 70]];
      path(br); ctx.lineWidth = 7; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = PINK; ctx.stroke();
    }
    path(pts); ctx.lineWidth = 14; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = PINK; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(bx, GROUND - 2, 38 * (1 - prog * 0.5), 9, 0, 0, 7); ctx.fill();
    ctx.restore();
  } else {
    const hasAng = b.ang !== undefined, dir = hasAng ? 1 : (sign(b.rx) || 1);
    const px = b.follow ? cx(P) : b.x + b.w / 2, py = b.follow ? cy(P) : b.y + b.h / 2;
    const r = b.follow ? Math.hypot(b.rx, b.ry) + b.w / 2 : b.w * 0.6;
    const rot = hasAng ? b.ang : (b.follow ? 0 : (srand(b.t + b.x) - 0.5) * 1.2);
    crescent(px - (b.follow ? 0 : dir * r * 0.3), py, dir, r, b.h * 0.65, prog, '#fff', rot);
    if (b.fx === 'great') crescent(px, py, dir, r * 0.92, b.h * 0.5, prog, PINK, rot);
  }
}

// ===== 스킬 아이콘 (먹선 일러스트풍) =====
function skillIconRaw(k, x, y, s, locked) {
  ctx.save(); ctx.translate(x, y); const u = s / 40; ctx.scale(u, u); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const Wc = locked ? '#666' : '#fff', Pc = locked ? '#555' : PINK;
  const ln = (a, b, c, d, w = 3, col = Wc) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
  const arc = (r, a0, a1, w = 3, col = Wc, ox = 0, oy = 0) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(ox, oy, r, a0, a1); ctx.stroke(); };
  const poly = (pts, fill, stroke, w = 2) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); } };
  const dot = (px, py, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); };
  switch (k) {
    case 'slash': arc(19, -1.15, 1.15, 5); arc(12, -0.95, 0.95, 2); ln(-16, 14, 12, -12, 2, Pc); dot(-16, 14, 2.5, Pc); break;
    case 'spin': for (let i = 0; i < 3; i++) arc(15, i * 2.094, i * 2.094 + 1.4, 5); dot(0, 0, 4, Pc); arc(7, 0, 6.3, 1.5, Pc); break;
    case 'dash': ln(-19, -9, 4, -9, 3); ln(-20, 0, 12, 0, 4); ln(-19, 9, 4, 9, 3); poly([[8, -11], [21, 0], [8, 11]], Pc); break;
    case 'quake': ln(-20, 16, 20, 16, 3); ctx.strokeStyle = Wc; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(-5, 7); ctx.lineTo(3, 1); ctx.lineTo(-3, -6); ctx.stroke(); ln(-13, 16, -17, 8, 2); ln(13, 16, 17, 9, 2); poly([[-8, -19], [8, -19], [0, -7]], Pc); break;
    case 'roar': dot(-12, 0, 5, Pc); arc(9, -0.95, 0.95, 3, Wc, -10, 0); arc(16, -0.95, 0.95, 3, Wc, -10, 0); arc(23, -0.95, 0.95, 2, Wc, -10, 0); break;
    case 'greatsword': ln(-9, 9, 16, -16, 6, Wc); poly([[16, -16], [20, -20], [18, -12]], Wc); ln(-13, 3, -3, 13, 4, Pc); ln(-14, 14, -9, 9, 5, Pc); break;
    case 'orb': dot(0, 0, 10, Wc); dot(0, 0, 5, Pc); for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; ln(Math.cos(a) * 14, Math.sin(a) * 14, Math.cos(a) * 19, Math.sin(a) * 19, 2); } break;
    case 'fireball': poly([[-19, 12], [-5, -3], [2, -15], [8, -4], [15, 0], [9, 11], [0, 17], [-9, 13]], Pc, Wc, 2); poly([[-2, 12], [2, 2], [7, 8], [3, 14]], Wc); break;
    case 'nova': for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, c = Math.cos(a), s2 = Math.sin(a); ln(0, 0, c * 19, s2 * 19, 3); ln(c * 11, s2 * 11, c * 11 + Math.cos(a + 0.8) * 6, s2 * 11 + Math.sin(a + 0.8) * 6, 2); ln(c * 11, s2 * 11, c * 11 + Math.cos(a - 0.8) * 6, s2 * 11 + Math.sin(a - 0.8) * 6, 2); } dot(0, 0, 4, Pc); break;
    case 'bolt': poly([[5, -20], [-9, 2], [0, 2], [-5, 20], [11, -5], [1, -5]], Wc, Pc, 2); break;
    case 'blink': arc(8, 0, 6.3, 2, Wc, -11, 2); dot(11, 2, 8, Wc); ln(-3, -12, 5, -12, 2, Pc); ln(-1, -16, 7, -16, 2, Pc); poly([[2, -9], [-4, -6], [2, -3]], Pc); break;
    case 'meteor': ln(-20, -12, 2, 5, 3, Pc); ln(-13, -20, 5, -4, 4, Wc); ln(-20, -3, -4, 9, 2, Wc); dot(8, 9, 10, Wc); dot(8, 9, 5, Pc); break;
    case 'arrow': ln(-17, 15, 13, -13, 3); poly([[17, -17], [4, -13], [13, -4]], Pc); ln(-17, 15, -10, 15, 2); ln(-17, 15, -17, 8, 2); break;
    case 'arrows3': for (const a of [-0.5, 0, 0.5]) { ctx.save(); ctx.rotate(a); ln(-16, 0, 12, 0, 2.5); poly([[18, 0], [10, -4], [10, 4]], Pc); ln(-16, 0, -20, -3, 2); ln(-16, 0, -20, 3, 2); ctx.restore(); } break;
    case 'pierce': ln(-21, 0, 17, 0, 3); poly([[20, 0], [9, -7], [9, 7]], Pc); arc(9, 0, 6.3, 2, Wc, 0, 0); ln(-21, 0, -16, -5, 2); ln(-21, 0, -16, 5, 2); break;
    case 'backstep': ln(19, 9, -6, 9, 3); poly([[-6, 2], [-19, 9], [-6, 16]], Pc); dot(9, -9, 4.5, Wc); ln(9, -5, 9, 3, 3); ln(9, -2, 15, 3, 2); break;
    case 'rain': for (let i = 0; i < 5; i++) { const xx = -16 + i * 8, y0 = -19 + (i % 2) * 7; ln(xx + 3, y0, xx, y0 + 14, 2.5); poly([[xx - 3, y0 + 12], [xx + 3, y0 + 12], [xx, y0 + 18]], Wc); } ln(-21, 17, 21, 17, 3, Pc); break;
    case 'focus': arc(13, 0, 6.3, 3); ln(-21, 0, -8, 0, 2); ln(8, 0, 21, 0, 2); ln(0, -21, 0, -8, 2); ln(0, 8, 0, 21, 2); dot(0, 0, 5, Pc); break;
    case 'shuriken': poly([[0, -19], [4, -4], [19, 0], [4, 4], [0, 19], [-4, 4], [-19, 0], [-4, -4]], Wc); dot(0, 0, 4, Pc); break;
    case 'shadow': dot(9, -9, 5, Wc); poly([[4, -3], [14, -3], [16, 10], [3, 10]], Wc); ln(-19, -5, -2, -5, 2); ln(-20, 3, -3, 3, 2); ln(-17, 11, -2, 11, 2, Pc); break;
    case 'dagger': ln(0, 19, 0, -8, 5); poly([[0, -20], [6, -7], [-6, -7]], Wc); ln(-9, -2, 9, -2, 4, Pc); dot(12, 6, 3, Pc); dot(-11, 11, 2.5, Pc); dot(10, 15, 2, Pc); break;
    case 'smoke': dot(-9, 6, 9, Wc); dot(7, 5, 10, Wc); dot(0, -6, 9, Wc); dot(-2, 0, 2.6, Pc); dot(6, -2, 2.6, Pc); break;
    case 'flurry': ln(-17, -17, 17, 17, 3); ln(17, -17, -17, 17, 3); ln(-20, 0, 20, 0, 2, Pc); ln(0, -20, 0, 20, 2, Pc); dot(0, 0, 3, Wc); break;
    case 'empty': ln(-10, 0, 10, 0, 2, '#555'); ln(0, -10, 0, 10, 2, '#555'); break;
    case 'hammer': ln(-12, 16, 6, -4, 5); poly([[0, -18], [20, -8], [13, 2], [-7, -8]], Wc); ln(-4, -6, 10, 0, 2, Pc); break;
    case 'spear': ln(-18, 17, 12, -13, 3); poly([[11, -19], [22, -22], [19, -9]], Wc); dot(-12, 11, 3, Pc); ln(-4, 5, 2, -1, 5, Pc); break;
    case 'shield': poly([[0, -19], [16, -11], [13, 8], [0, 19], [-13, 8], [-16, -11]], null, Wc, 3); ln(0, -12, 0, 14, 2, Pc); ln(-9, -2, 9, -2, 2, Pc); break;
    case 'wave': arc(8, -1.2, 1.2, 3, Wc, -14, 0); arc(15, -1.1, 1.1, 3, Wc, -14, 0); arc(22, -1, 1, 2, Wc, -14, 0); ln(-20, 16, 20, 16, 3, Pc); poly([[-20, 16], [-12, 6], [-6, 16]], Pc); break;
    case 'burst': { const pts = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? 8 : 19; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } poly(pts, Pc, Wc, 2); dot(0, 0, 4, Wc); break; }
    case 'axe': ln(-12, 17, 9, -14, 4); poly([[2, -19], [19, -12], [14, 3], [3, -4]], Wc); ln(6, -12, 13, -5, 2, Pc); break;
    case 'flame': poly([[0, -20], [10, -4], [14, 6], [6, 17], [-6, 17], [-14, 6], [-8, -6], [-3, -2]], Pc, Wc, 2); poly([[0, -2], [5, 7], [0, 15], [-5, 7]], Wc); break;
    case 'ice': poly([[0, -20], [6, 0], [0, 20], [-6, 0]], Wc); poly([[-20, 0], [0, -6], [20, 0], [0, 6]], null, Wc, 2); dot(0, 0, 3.5, Pc); ln(-12, -12, 12, 12, 1.5, Wc); ln(12, -12, -12, 12, 1.5, Wc); break;
    case 'chain': arc(6, 0, 6.3, 3, Wc, -11, 8); arc(6, 0, 6.3, 3, Wc, 2, -3); arc(6, 0, 6.3, 3, Pc, 13, -13); break;
    case 'bomb': dot(-2, 5, 12, Wc); ln(5, -4, 12, -13, 3); dot(14, -15, 3.5, Pc); ln(18, -20, 21, -23, 2, Pc); ln(10, -20, 7, -23, 2, Pc); dot(-6, 1, 3, Pc); break;
    case 'clock': arc(15, 0, 6.3, 3); ln(0, 0, 0, -10, 3); ln(0, 0, 8, 4, 3, Pc); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ln(Math.cos(a) * 12, Math.sin(a) * 12, Math.cos(a) * 15, Math.sin(a) * 15, 2); } break;
    case 'skull': dot(0, -3, 12, Wc); poly([[-7, 6], [7, 6], [6, 17], [-6, 17]], Wc); dot(-5, -3, 3.6, Pc); dot(5, -3, 3.6, Pc); ln(-3, 11, -3, 16, 1.5, Pc); ln(3, 11, 3, 16, 1.5, Pc); break;
    case 'scope': arc(13, 0, 6.3, 2.5); ln(-21, 0, 21, 0, 2); ln(0, -21, 0, 21, 2); dot(0, 0, 3, Pc); arc(5, 0, 6.3, 1.5, Pc); break;
    case 'trap': ln(-17, 12, 17, 12, 3); for (let i = 0; i < 4; i++) poly([[-17 + i * 9, 12], [-12.5 + i * 9, -2], [-8 + i * 9, 12]], Wc); arc(18, 3.4, 6.0, 2.5, Pc, 0, 16); break;
    case 'poison': poly([[0, -19], [10, 0], [9, 10], [0, 17], [-9, 10], [-10, 0]], Pc, Wc, 2); dot(-3, 5, 3, Wc); break;
    case 'fan': for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) ln(0, 15, Math.sin(a) * 24, 15 - Math.cos(a) * 30, 2.5); dot(0, 15, 4, Pc); break;
    case 'wind': ln(-20, -8, 8, -8, 3); ln(-20, 0, 15, 0, 3); ln(-20, 8, 6, 8, 3); arc(5, -1.6, 1.6, 3, Pc, 8, -3); arc(5, 0, 4.4, 3, Pc, 15, 5); break;
    case 'phoenix': poly([[0, -4], [-18, -14], [-12, 0], [-20, 8], [-6, 6], [0, 17], [6, 6], [20, 8], [12, 0], [18, -14]], Pc, Wc, 2); dot(0, -8, 4, Wc); break;
    case 'mark': arc(14, 0, 6.3, 3, Pc); ln(-9, -9, 9, 9, 3); ln(9, -9, -9, 9, 3); dot(0, 0, 3, Wc); break;
    case 'cloud': dot(-8, -2, 8, Wc); dot(6, -4, 10, Wc); dot(0, 1, 9, Wc); poly([[3, 4], [-4, 14], [1, 14], [-3, 21], [8, 10], [3, 10]], Pc); break;
    case 'beam': ln(-20, 0, 18, 0, 7, Pc); ln(-20, 0, 18, 0, 2.5, Wc); dot(-18, 0, 4, Wc); poly([[14, -8], [22, 0], [14, 8]], Wc); break;
    case 'twin': ln(-14, 15, 3, -14, 3); ln(14, 15, -3, -14, 3); dot(3, -14, 3.2, Pc); dot(-3, -14, 3.2, Pc); ln(-14, 15, -10, 11, 4, Pc); ln(14, 15, 10, 11, 4, Pc); break;
    case 'blood': poly([[0, -19], [10, 0], [9, 10], [0, 17], [-9, 10], [-10, 0]], Pc, Wc, 2); ln(-15, 15, 15, -15, 2.5, Wc); break;
    case 'sun': dot(0, 0, 8, Wc); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ln(Math.cos(a) * 12, Math.sin(a) * 12, Math.cos(a) * 20, Math.sin(a) * 20, 3, Pc); } break;
    default: ln(-14, 14, 14, -14, 4);
  }
  ctx.restore();
}
