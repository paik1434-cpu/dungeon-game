'use strict';
// ===== 상태이상: 화상 / 출혈 / 빙결 / 죽음의 표식 =====
const FIREFX = new Set(['fire', 'phoenix', 'meteor', 'bomb']);
const BLADE_ICO = new Set(['slash', 'dagger', 'shuriken', 'twin', 'blood', 'axe', 'greatsword', 'spear', 'flurry', 'chain', 'shadow', 'spin', 'dash', 'hammer']);
const BOW_ICO = new Set(['scope', 'pierce', 'arrow', 'arrows3', 'fan', 'wind']);
// 출혈 확률: 도적 50% · 전사 30% (날붙이), 궁수 22% (관통 화살류)
function procBleed(a) {
  const c = P.cls.id, ico = a.ico;
  if (BLADE_ICO.has(ico) && (c === 'rogue' || c === 'warrior')) return Math.random() < (c === 'rogue' ? 0.5 : 0.3);
  if (c === 'archer' && BOW_ICO.has(ico)) return Math.random() < 0.22;
  return false;
}
function tickStatus(e) {
  if (e.burn > 0) {
    e.burn--;
    if (e.burn % 20 === 0) dmgE(e, e.burnD, { tick: true, kind: 'burn' });
    if (S.t % 4 === 0 && S.parts.length < 420) S.parts.push({ kind: 'ember', x: e.x + rnd(0, e.w), y: e.y + rnd(0, e.h), vx: rnd(-0.3, 0.3), vy: -rnd(0.6, 1.4), size: rnd(2, 4), life: 18, t: 0 });
  }
  if (e.bleed > 0) {
    e.bleed--;
    if (e.bleed % 30 === 0) dmgE(e, e.bleedD * e.bleedN, { tick: true, kind: 'bleed' });
    if (e.bleed % 12 === 0 && S.parts.length < 420) S.parts.push({ kind: 'drop', x: cx(e) + rnd(-8, 8), y: e.y + e.h * 0.5, vx: rnd(-0.4, 0.4), vy: 0, size: rnd(2, 3), life: 20, t: 0 });
    if (e.bleed <= 0) e.bleedN = 0;
  }
  if (e.frozen > 0) e.frozen--;
  if (e.marked > 0) e.marked--;
}
function drawStatus(e) {
  const x = e.x, my = cx(e);
  if (e.frozen > 0) { // 얼음 블록
    const a = Math.min(1, e.frozen / 20);
    ctx.save(); ctx.globalAlpha = 0.85 * a; ctx.fillStyle = 'rgba(235,248,255,.7)'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 4, e.y + e.h * 0.2); ctx.lineTo(x + e.w * 0.3, e.y - 6); ctx.lineTo(x + e.w + 4, e.y + e.h * 0.1); ctx.lineTo(x + e.w + 6, e.y + e.h * 0.9); ctx.lineTo(x + e.w * 0.6, e.y + e.h + 4); ctx.lineTo(x - 5, e.y + e.h * 0.85); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4, e.y + e.h * 0.3); ctx.lineTo(x + e.w * 0.4, e.y + e.h * 0.1); ctx.moveTo(x + e.w * 0.7, e.y + e.h * 0.6); ctx.lineTo(x + e.w * 0.9, e.y + e.h * 0.3); ctx.stroke();
    ctx.restore();
  }
  if (e.marked > 0) { // 죽음의 표식
    const r = 15 + Math.sin(S.t * 0.4) * 2, yy = e.y - 36;
    ctx.save(); ctx.translate(my, yy); ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (e.marked / 120)); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, 9); ctx.moveTo(9, -9); ctx.lineTo(-9, 9); ctx.stroke(); ctx.restore();
  }
  let ix = x; const iy = e.y - 22;
  if (e.burn > 0) { // 화상: 불꽃
    ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ix + 5, iy - 11); ctx.quadraticCurveTo(ix + 11, iy - 3, ix + 8, iy + 1); ctx.lineTo(ix + 2, iy + 1); ctx.quadraticCurveTo(ix - 1, iy - 4, ix + 5, iy - 11); ctx.closePath(); ctx.fill(); ctx.stroke(); ix += 14;
  }
  if (e.bleed > 0) { // 출혈: 방울 + 중첩 수
    ctx.fillStyle = INK; ctx.strokeStyle = PINK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ix + 5, iy - 11); ctx.quadraticCurveTo(ix + 11, iy - 3, ix + 5, iy + 1); ctx.quadraticCurveTo(ix - 1, iy - 3, ix + 5, iy - 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    T(String(e.bleedN || 1), ix + 12, iy, 11, PINK, 'left'); ix += 24;
  }
}
