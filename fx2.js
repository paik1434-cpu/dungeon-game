'use strict';
// ===== 궁극기 연출 엔진: 임팩트 프레임 / 줌 펀치 / 슬로모션 / 대형 베기 / 화염 분사 / 오라 =====
let impactT = 0, zoomK = 1.02, slowT = 0, frostT = 0, ultBoost = 0;
function impactFrame(n) { impactT = Math.max(impactT, n); }
function zoomPunch(a) { zoomK = Math.max(zoomK, 1.02 + a); }
function slowmo(n) { slowT = Math.max(slowT, n); }
function bigSlash(x, y, ang, len) { S.parts.push({ kind: 'bigslash', x, y, ang, len: len || 720, life: 12, t: 0 }); }
function ghostAt(x, y, f) { S.parts.push({ kind: 'ghost', x, y, w: P.w, h: P.h, f, life: 14, t: 0 }); }
function fxDecay() {
  zoomK += (1.02 - zoomK) * 0.12;
  if (impactT > 0) impactT--; if (frostT > 0) frostT--;
}
function worldBreakFx() {
  impactFrame(3); zoomPunch(0.14); addShake(22); slowmo(28); flashScreen('#fff', 0.9); ultBoost = 100;
  for (const d of [-1, 1]) for (let k = 0; k < 4; k++) crackFx(cx(P), d, rnd(120, 320));
  for (let i = 0; i < 18; i++) S.parts.push({ kind: 'shard', x: cx(P) + rnd(-160, 160), y: GROUND - 4, vx: rnd(-4, 4), vy: -rnd(5, 12), size: rnd(5, 10), rot: rnd(0, 6), vr: rnd(-0.3, 0.3), dark: true, life: 44, t: 0 });
  for (let i = 0; i < 24; i++) S.parts.push({ kind: 'ember', x: cx(P) + rnd(-120, 120), y: GROUND - 8, vx: rnd(-3, 3), vy: -rnd(2, 7), size: rnd(3, 6), life: rnd(24, 40), t: 0 });
  for (let k = 0; k < 3; k++) ring(cx(P), GROUND - 10 - k * 14);
}
// ── 새 파티클: bigslash(화면을 가르는 베기선) / jet(화염 분사)
const _fxPart0 = drawFxPart;
drawFxPart = function (p, k) {
  if (p.kind === 'bigslash') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.globalAlpha = Math.min(1, k * 2.2);
    const L = p.len * (0.55 + (1 - k) * 0.45), w = 34 * Math.pow(k, 0.8);
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L * 0.2, -w); ctx.lineTo(L * 0.25, -w * 0.9); ctx.lineTo(L, 0); ctx.lineTo(L * 0.25, w * 0.9); ctx.lineTo(-L * 0.2, w); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-L * 0.9, 0); ctx.lineTo(L * 0.9, 0); ctx.stroke();
    ctx.restore(); return true;
  }
  if (p.kind === 'jet') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.globalAlpha = Math.min(0.8, k * 2);
    const L = p.len * Math.min(1, p.t / 5), wob = Math.sin(S.t * 0.8) * 9;
    for (const [sc, col, ol] of [[1, PINK, true], [0.62, '#fff', false]]) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5 * sc, -L * 0.08 * sc + wob, L * sc, -L * 0.2 * sc); ctx.quadraticCurveTo(L * 1.05 * sc, 0, L * sc, L * 0.2 * sc); ctx.quadraticCurveTo(L * 0.5 * sc, L * 0.08 * sc - wob, 0, 0);
      ctx.fillStyle = col; ctx.fill(); if (ol) { ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke(); }
    }
    ctx.restore(); return true;
  }
  return _fxPart0(p, k);
};
// ── 오라: 공격 버프(핑크 불꽃) / 광폭화(큰 불꽃) / 사냥꾼의 눈(회전 문양)
function drawAura() {
  const big = P.berserk > 0, buff = P.buffAtk > 0;
  if (buff || big) {
    const n = big ? 7 : 4, h = big ? 78 : 46, t = S.t;
    ctx.save(); ctx.translate(cx(P), P.y + P.h);
    for (let i = 0; i < n; i++) {
      const xo = (i - (n - 1) / 2) * (big ? 12 : 10), hh = h * (0.6 + 0.4 * Math.sin(t * 0.35 + i * 1.7)), wd = 8 + (i % 2) * 3;
      ctx.beginPath(); ctx.moveTo(xo - wd, 0); ctx.quadraticCurveTo(xo - wd * 1.3, -hh * 0.5, xo + Math.sin(t * 0.3 + i) * 4, -hh); ctx.quadraticCurveTo(xo + wd * 1.3, -hh * 0.5, xo + wd, 0); ctx.closePath();
      ctx.fillStyle = big ? 'rgba(255,42,100,.82)' : 'rgba(255,42,100,.5)'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = big ? 2.5 : 1.5; ctx.stroke();
    }
    ctx.restore();
  }
  if (P.eye > 0) {
    const x = cx(P), y = P.y - 30, t = S.t;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.stroke(); ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 6, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(Math.sin(t * 0.1) * 3, 0, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = t * 0.06 + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 21, Math.sin(a) * 21); ctx.lineTo(Math.cos(a) * 27, Math.sin(a) * 27); ctx.stroke(); }
    ctx.restore();
  }
}
// ── 화면 단위 후처리: 서리 비네트 / 임팩트 프레임(반전)
function drawFrost() {
  if (frostT <= 0) return;
  const a = Math.min(1, frostT / 50);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9); g.addColorStop(0, 'rgba(225,244,255,0)'); g.addColorStop(1, `rgba(225,244,255,${0.7 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const side = i % 4, base = srand(i * 7) * (side < 2 ? W : H), len = 40 + srand(i * 3) * 70;
    ctx.beginPath();
    if (side === 0) { ctx.moveTo(base - 14, 0); ctx.lineTo(base, len); ctx.lineTo(base + 14, 0); }
    else if (side === 1) { ctx.moveTo(base - 14, H); ctx.lineTo(base, H - len); ctx.lineTo(base + 14, H); }
    else if (side === 2) { ctx.moveTo(0, base - 14); ctx.lineTo(len, base); ctx.lineTo(0, base + 14); }
    else { ctx.moveTo(W, base - 14); ctx.lineTo(W - len, base); ctx.lineTo(W, base + 14); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawImpactFrame() {
  if (impactT <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
