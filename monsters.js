'use strict';
// ===== 몬스터 작화 (림보풍 실루엣 + 발광하는 눈) =====
function glowEye(x, y, r, col) {
  if (FL) return;
  col = col || PINK;
  ctx.globalAlpha = 0.28; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * 2.8, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, 7); ctx.fill();
}
function wingShape(mx, my, s, span, fl, drop) {
  ipoly([[mx, my], [mx + s * span * 0.5, my - fl - 6], [mx + s * span, my - fl], [mx + s * span * 0.8, my + drop * 0.5], [mx + s * span * 0.55, my + drop * 0.3 + 4], [mx + s * span * 0.35, my + drop * 0.8], [mx + s * span * 0.15, my + drop * 0.5]]);
}
function drawEnemy(e) {
  const fl = e.flash > 0, x = e.x, y = e.y, w = e.w, h = e.h, f = e.face, t = S.t + e.ph * 10, mid = x + w / 2, sh = e.def.shape;
  const moving = Math.abs(e.vx) > 0.05;
  FL = fl;
  if (e.boss) drawBoss(e);
  else {
    if (e.def.ai !== 'fly') { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(mid, y + h + 1, w * 0.6, 3, 0, 0, 7); ctx.fill(); }
    const hx = mid + f * 1.5, hy = y + h * 0.1, hr = w * 0.27;
    if (sh === 'slime') {
      const sq = 1 + clamp(-e.vy * 0.03, -0.2, 0.3), bw = w / 2 * (2 - sq), bh = h * sq;
      ctx.fillStyle = fl ? '#fff' : INK;
      ctx.beginPath(); ctx.moveTo(mid - bw, y + h);
      ctx.bezierCurveTo(mid - bw, y + h - bh * 1.35, mid + bw, y + h - bh * 1.35, mid + bw, y + h);
      for (let i = 4; i >= 0; i--) ctx.lineTo(mid - bw + bw * 2 * i / 4, y + h + (i % 2 ? 3 : -1) + Math.sin(t * 0.1 + i));
      ctx.closePath(); ink();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(mid - bw * 0.35, y + h - bh * 0.7, 4, 2.5, -0.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(mid - 7, y + h - bh * 0.45, 4, 5, 0, 0, 7); ctx.ellipse(mid + 7, y + h - bh * 0.45, 4, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = PINK; ctx.fillRect(mid - 8 + f * 1.5, y + h - bh * 0.45 - 1, 3, 4); ctx.fillRect(mid + 6 + f * 1.5, y + h - bh * 0.45 - 1, 3, 4);
    } else if (sh === 'bat' || sh === 'imp') {
      const flp = Math.sin(t * 0.4) * 10, imp = sh === 'imp', my = y + h * 0.5, span = imp ? 22 : 30;
      ctx.fillStyle = fl ? '#fff' : INK;
      wingShape(mid - 3, my - 2, -1, span, flp, imp ? 14 : 18); wingShape(mid + 3, my - 2, 1, span, flp, imp ? 14 : 18);
      ctx.beginPath(); ctx.ellipse(mid, my + 2, w * 0.28, h * 0.4, 0, 0, 7); ink();
      icirc(mid, my - h * 0.28, w * 0.26);
      ipoly([[mid - w * 0.22, my - h * 0.4], [mid - w * (imp ? 0.34 : 0.3), my - h * (imp ? 0.85 : 0.75)], [mid - w * 0.06, my - h * 0.46]]);
      ipoly([[mid + w * 0.22, my - h * 0.4], [mid + w * (imp ? 0.34 : 0.3), my - h * (imp ? 0.85 : 0.75)], [mid + w * 0.06, my - h * 0.46]]);
      if (imp) { ctx.strokeStyle = fl ? '#fff' : INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mid, my + h * 0.35); ctx.quadraticCurveTo(mid - f * 14, my + h * 0.9 + Math.sin(t * 0.2) * 4, mid - f * 8, my + h * 1.2); ctx.stroke(); ipoly([[mid - f * 8, my + h * 1.2], [mid - f * 14, my + h * 1.05], [mid - f * 3, my + h * 1.1]]); }
      glowEye(mid - 4, my - h * 0.28, 2); glowEye(mid + 4, my - h * 0.28, 2);
    } else if (sh === 'ghost') {
      const bob = Math.sin(t * 0.08) * 3;
      ctx.globalAlpha = fl ? 1 : 0.8; ctx.fillStyle = fl ? '#fff' : INK;
      ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + h + bob);
      for (let i = 0; i <= 6; i++) ctx.lineTo(x + w * (0.1 + 0.8 * i / 6), y + h + bob - (i % 2 ? 0 : 12) + Math.sin(t * 0.2 + i) * 3);
      ctx.lineTo(x + w * 0.9, y + h * 0.4 + bob); ctx.arc(mid, y + h * 0.28 + bob, w * 0.38, 0, Math.PI, true); ctx.closePath(); ink();
      ipoly([[x + w * 0.05, y + h * 0.4 + bob], [x - 12, y + h * 0.85 + bob + Math.sin(t * 0.15) * 4], [x + w * 0.25, y + h * 0.65 + bob]]);
      ipoly([[x + w * 0.95, y + h * 0.4 + bob], [x + w + 12, y + h * 0.85 + bob + Math.sin(t * 0.15 + 2) * 4], [x + w * 0.75, y + h * 0.65 + bob]]);
      ctx.globalAlpha = 1;
      glowEye(mid - 6, y + h * 0.3 + bob, 2.4); glowEye(mid + 6, y + h * 0.3 + bob, 2.4);
    } else if (sh === 'golem') {
      ctx.fillStyle = fl ? '#fff' : INK;
      const sw = moving ? Math.sin(t * 0.15) * 3 : 0;
      irect(mid - w * 0.3 + sw, y + h * 0.7, w * 0.24, h * 0.3); irect(mid + w * 0.06 - sw, y + h * 0.7, w * 0.24, h * 0.3);
      ipoly([[mid - w * 0.42, y + h * 0.2], [mid + w * 0.42, y + h * 0.2], [mid + w * 0.34, y + h * 0.76], [mid - w * 0.34, y + h * 0.76]]);
      icirc(mid - w * 0.48, y + h * 0.27, w * 0.18); icirc(mid + w * 0.48, y + h * 0.27, w * 0.18);
      ipoly([[mid - w * 0.62, y + h * 0.3], [mid - w * 0.4, y + h * 0.3], [mid - w * 0.5, y + h * 0.66], [mid - w * 0.7, y + h * 0.66]]); icirc(mid - w * 0.6, y + h * 0.7, w * 0.16);
      ipoly([[mid + w * 0.62, y + h * 0.3], [mid + w * 0.4, y + h * 0.3], [mid + w * 0.5, y + h * 0.66], [mid + w * 0.7, y + h * 0.66]]); icirc(mid + w * 0.6, y + h * 0.7, w * 0.16);
      ipoly([[mid - w * 0.17, y + h * 0.02], [mid + w * 0.17, y + h * 0.02], [mid + w * 0.2, y + h * 0.2], [mid - w * 0.2, y + h * 0.2]]);
      if (!fl) {
        ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mid - w * 0.2, y + h * 0.32); ctx.lineTo(mid - w * 0.05, y + h * 0.42); ctx.lineTo(mid - w * 0.18, y + h * 0.55); ctx.moveTo(mid + w * 0.22, y + h * 0.3); ctx.lineTo(mid + w * 0.1, y + h * 0.5); ctx.stroke();
        glowEye(mid, y + h * 0.45, 4 + Math.sin(t * 0.1) * 1);
        ctx.fillStyle = PINK; ctx.fillRect(mid - 7, y + h * 0.1, 14, 3);
      }
    } else if (sh === 'hood') {
      const caster = e.type === 'caster', hand = [mid + f * w * 0.5, y + h * 0.45];
      figure(x, y, w, h, f, t, moving, { robe: true, hand }); FL = fl;
      ctx.fillStyle = fl ? '#fff' : INK; ipoly([[hx - hr * 1.5, hy + hr * 0.8], [hx - f * 2, y - h * 0.3], [hx + hr * 1.5, hy + hr * 0.8]]);
      icirc(hx, hy, hr);
      glowEye(hx + f * 3, hy, 1.8); if (!fl) glowEye(hx - f * 2, hy, 1.4);
      weaponLine(hand[0], y + h, hand[0], y + h * 0.1, '#666', 4, 1.5);
      if (!fl) {
        if (caster) { ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ipoly([[hand[0] - 6, y + h * 0.12], [hand[0], y - h * 0.18 + Math.sin(t * 0.3) * 3], [hand[0] + 6, y + h * 0.12], [hand[0], y + h * 0.2]]); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hand[0], y + h * 0.08, 2.5, 0, 7); ctx.fill(); }
        else { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(hand[0], y + h * 0.06, 6, 0.6, Math.PI * 2 - 0.6); ctx.stroke(); glowEye(hand[0] + 1, y + h * 0.06, 2.2); }
      }
    } else if (sh === 'skeleton') {
      const hand = [mid + f * w * 0.5, y + h * 0.5];
      figure(x, y, w, h, f, t, moving, { hand }); FL = fl;
      weaponLine(hand[0], hand[1], hand[0] + f * 8, hand[1] - 22, '#999', 4, 1.8);
      ctx.fillStyle = fl ? '#fff' : '#ecebe2'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, hr * 1.15, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillRect(hx - hr * 0.6, hy + hr * 0.8, hr * 1.2, hr * 0.6); ctx.strokeRect(hx - hr * 0.6, hy + hr * 0.8, hr * 1.2, hr * 0.6);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(hx - 3, hy, 2.4, 0, 7); ctx.arc(hx + 3, hy, 2.4, 0, 7); ctx.fill();
      if (!fl) { ctx.fillStyle = PINK; ctx.fillRect(hx - 4, hy - 1, 2, 2); ctx.fillRect(hx + 2, hy - 1, 2, 2); }
      ctx.strokeStyle = fl ? '#000' : '#ecebe2'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(mid - w * 0.2, y + h * (0.26 + i * 0.07)); ctx.lineTo(mid + w * 0.2, y + h * (0.26 + i * 0.07)); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(mid, y + h * 0.2); ctx.lineTo(mid, y + h * 0.56); ctx.stroke();
    } else if (sh === 'mimic') {
      const op = 0.35 + Math.abs(Math.sin(t * 0.18)) * 0.5, by = y + h * 0.48;
      ctx.fillStyle = fl ? '#fff' : INK;
      irect(x, by, w, h * 0.52);
      ctx.save(); ctx.translate(x, by); ctx.rotate(-op); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w / 2, -h * 0.75, w, 0); ctx.closePath(); ink(); ctx.restore();
      ctx.fillStyle = fl ? '#fff' : '#ecebe2';
      for (let i = 0; i < 6; i++) ipoly([[x + i * w / 6, by], [x + (i + 0.5) * w / 6, by + 8], [x + (i + 1) * w / 6, by]]);
      ctx.save(); ctx.translate(x, by); ctx.rotate(-op);
      for (let i = 0; i < 5; i++) ipoly([[w * 0.1 + i * w * 0.2, 0], [w * 0.2 + i * w * 0.2, -8], [w * 0.3 + i * w * 0.2, 0]]);
      ctx.restore();
      if (!fl) { ctx.fillStyle = PINK; ipoly([[x + w * 0.3, by + 1], [x + w * 0.7, by + 1], [x + w * 0.62, by + 12 + Math.sin(t * 0.3) * 3], [x + w * 0.38, by + 12]]); glowEye(x + w * 0.3, by - h * 0.28 * op - 6, 2.6); glowEye(x + w * 0.7, by - h * 0.28 * op - 6, 2.6); }
      irect(x + 3, y + h - 6, 10, 6); irect(x + w - 13, y + h - 6, 10, 6);
    } else if (sh === 'spider') {
      const cyb = y + h * 0.5;
      ctx.strokeStyle = fl ? '#fff' : INK; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
        const bx = mid + s * 3, sw = moving || !e.onGround ? Math.sin(t * 0.4 + k * 1.6) * 3 : 0;
        ctx.beginPath(); ctx.moveTo(bx, cyb); ctx.lineTo(bx + s * (12 + k * 3), y - 5 - k * 1.5 + sw); ctx.lineTo(bx + s * (22 + k * 5), y + h + 1); ctx.stroke();
      }
      ctx.fillStyle = fl ? '#fff' : INK;
      ctx.beginPath(); ctx.ellipse(mid - f * 8, cyb, 13, 10, 0, 0, 7); ink();
      ctx.beginPath(); ctx.ellipse(mid + f * 9, cyb + 1, 8, 7, 0, 0, 7); ink();
      if (!fl) { ctx.fillStyle = PINK; ctx.fillRect(mid - f * 8 - 1, cyb - 6, 2, 8); ctx.fillRect(mid - f * 8 - 4, cyb - 2, 8, 2); }
      glowEye(mid + f * 11, cyb - 1, 1.4); glowEye(mid + f * 7, cyb - 2, 1.2); glowEye(mid + f * 13, cyb + 2, 1);
      ipoly([[mid + f * 14, cyb + 4], [mid + f * 17, cyb + 11], [mid + f * 12, cyb + 7]]);
    } else if (sh === 'knight') {
      const hand = [mid + f * w * 0.5, y + h * 0.5];
      figure(x, y, w, h, f, t, moving, { coat: true, shoulder: 4, hand }); FL = fl;
      ctx.fillStyle = fl ? '#fff' : INK;
      ctx.beginPath(); ctx.ellipse(mid - f * 8, y + h * 0.22, 8, 5, 0, 0, 7); ink(); ctx.beginPath(); ctx.ellipse(mid + f * 8, y + h * 0.22, 8, 5, 0, 0, 7); ink();
      ipoly([[hx - hr * 1.2, hy + hr * 1.1], [hx - hr * 1.2, hy - hr * 1.1], [hx, hy - hr * 1.9], [hx + hr * 1.2, hy - hr * 1.1], [hx + hr * 1.2, hy + hr * 1.1]]);
      if (!fl) { ctx.fillStyle = PINK; ctx.fillRect(hx - hr * 0.9 + f * 1, hy - 1, hr * 1.8, 2.5); glowEye(hx + f * hr * 0.5, hy, 1.2); }
      ipoly([[hx - 2, hy - hr * 1.9], [hx - f * (12 + Math.sin(t * 0.2) * 3), hy - hr * 2.3], [hx + 2, hy - hr * 1.3]]);
      weaponLine(hand[0], hand[1], hand[0] + f * 10, hand[1] - 34, '#bbb', 5, 2);
      ctx.fillStyle = fl ? '#fff' : '#222'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(mid - f * 12, y + h * 0.5, 7, 13, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (!fl) { ctx.fillStyle = PINK; ctx.fillRect(mid - f * 12 - 1, y + h * 0.5 - 8, 2, 16); }
    } else { // goblin / 고블린 궁수
      const arch = e.type === 'garcher', hand = [mid + f * w * 0.55, y + h * 0.46];
      figure(x, y, w, h, f, t, moving, { shoulder: 1, hand }); FL = fl;
      ctx.fillStyle = fl ? '#fff' : INK;
      ipoly([[hx - hr, hy], [hx - hr - 11, hy - 7], [hx - hr + 1, hy + 5]]); ipoly([[hx + hr, hy], [hx + hr + 11, hy - 7], [hx + hr - 1, hy + 5]]);
      glowEye(hx + f * 3, hy, 1.8);
      if (arch) { ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hand[0] - f * 3, hand[1], 14, f > 0 ? -1.2 : Math.PI - 1.2, f > 0 ? 1.2 : Math.PI + 1.2); ctx.stroke(); }
      else { weaponLine(hand[0], hand[1], hand[0] + f * 8, hand[1] - 18, '#777', 6, 3); icirc(hand[0] + f * 9, hand[1] - 20, 5); }
    }
    if (e.slow > 0) { ctx.fillStyle = 'rgba(130,190,255,.3)'; ctx.beginPath(); ctx.ellipse(mid, y + h / 2, w * 0.75, h * 0.62, 0, 0, 7); ctx.fill(); }
  }
  FL = false;
  drawStatus(e);
  if (!e.boss) {
    if (e.hp < e.maxhp) { ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 13, w + 2, 6); ctx.fillStyle = PINK; ctx.fillRect(x, y - 12, w * Math.max(0, e.hp / e.maxhp), 4); }
    if (e.stun > 0) TS('★', mid, y - 18, 16, PINK, '#000', 3);
    if (e.poison > 0) { ctx.fillStyle = PINK; ctx.fillRect(x, y + h + 2, w, 2); }
  }
}
