'use strict';
// ===== 보스 아레나: 보스 컨셉에 맞는 지형지물 =====
function genArena(D) {
  const AL = D.len, sh = D.boss.shape;
  const plat = (x, y, w) => S.plats.push({ x: AL + x, y, w });
  const mov = (x, y, w, ax, ay, sp) => S.plats.push({ x: AL + x, y, w, kind: 'mov', x0: AL + x, y0: y, ax, ay, sp, ph: rnd(0, 6) });
  const crum = (x, y, w) => S.plats.push({ x: AL + x, y, w, kind: 'crumble', state: 0, timer: 0, gone: false, back: 0 });
  if (sh === 'ogre') { // 석실: 층층이 놓인 돌 선반
    plat(110, 365, 150); plat(405, 295, 160); plat(700, 365, 150);
  } else if (sh === 'lich') { // 묘지: 바닥 전체가 얼음 + 떠다니는 묘비
    S.ice.push({ x: AL, w: 960 });
    mov(190, 360, 110, 90, 0, 0.02); mov(660, 360, 110, 90, 0, 0.02); plat(405, 285, 130);
  } else if (sh === 'spider') { // 둥지: 끈적한 거미줄 바닥 + 비단 발판
    S.webs.push({ x: AL + 190, w: 210 }, { x: AL + 560, w: 230 });
    plat(90, 340, 130); plat(380, 280, 200); plat(740, 340, 130);
  } else if (sh === 'knight') { // 성채: 기둥 + 중앙 가시 바닥
    plat(150, 365, 110); plat(700, 365, 110); plat(420, 285, 120);
    S.spikes.push({ x: AL + 400, w: 160 });
  } else if (sh === 'dragon') { // 용암: 간헐천 3개 + 바위 발판
    for (let k = 0; k < 3; k++) S.geysers.push({ x: AL + 250 + k * 230, w: 48, t: k * 100, period: 300, warn: false, on: false });
    plat(80, 350, 130); plat(780, 350, 130); plat(430, 280, 140);
  } else if (sh === 'hydra') { // 신전: 이동 발판 + 물기둥
    for (let k = 0; k < 2; k++) S.geysers.push({ x: AL + 300 + k * 330, w: 48, t: k * 150, period: 300, warn: false, on: false });
    mov(120, 365, 110, 80, 0, 0.02); mov(720, 365, 110, 80, 0, 0.02); plat(420, 285, 140);
  } else if (sh === 'colossus') { // 제련소: 증기 분출 + 중앙 가시 + 높은 발판
    for (let k = 0; k < 2; k++) S.geysers.push({ x: AL + 200 + k * 520, w: 48, t: k * 120, period: 280, warn: false, on: false });
    S.spikes.push({ x: AL + 420, w: 120 }); plat(100, 350, 130); plat(730, 350, 130); plat(410, 280, 150);
  } else if (sh === 'reaper') { // 지하묘: 얼음 바닥 + 낙석 + 이동 발판
    S.ice.push({ x: AL + 60, w: 840 }); S.rockZones.push({ x0: AL + 20, x1: AL + 940, t: 0, period: 170 });
    mov(160, 365, 100, 70, 20, 0.022); mov(700, 365, 100, 70, 20, 0.022); plat(420, 285, 120);
  } else if (sh === 'demon') { // 지옥문: 간헐천 4개 + 붕괴 발판
    for (let k = 0; k < 4; k++) S.geysers.push({ x: AL + 160 + k * 200, w: 46, t: k * 75, period: 300, warn: false, on: false });
    crum(80, 345, 100); crum(780, 345, 100); plat(420, 280, 130);
  } else { // 심연: 허공의 이동·붕괴 발판 + 천장 낙석
    mov(120, 370, 100, 80, 30, 0.025); mov(420, 300, 110, 100, 0, 0.02); mov(720, 370, 100, 80, 30, 0.025); crum(300, 280, 90);
    S.rockZones.push({ x0: AL + 20, x1: AL + 940, t: 0, period: 140 });
  }
}
function webEffect(p) {
  p.webbed = false;
  for (const w of S.webs) if (p.onGround && cx(p) > w.x && cx(p) < w.x + w.w) { p.webbed = true; p.x -= p.vx * 0.55; }
}
function drawWebs() {
  const x0 = S.cam - 60, x1 = S.cam + W + 60;
  for (const w of S.webs) {
    if (w.x > x1 || w.x + w.w < x0) continue;
    const mx = w.x + w.w / 2, rx = w.w / 2;
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(mx, GROUND - 2, rx, 13, 0, 0, 7); ctx.fill();
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? '#fff' : '#000'; ctx.lineWidth = pass ? 1.6 : 4;
      for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(mx, GROUND - 2, rx * k / 3, 13 * k / 3, 0, 0, 7); ctx.stroke(); }
      for (let i = 0; i < 9; i++) { const a = i * Math.PI / 4.5; ctx.beginPath(); ctx.moveTo(mx, GROUND - 2); ctx.lineTo(mx + Math.cos(a) * rx, GROUND - 2 + Math.sin(a) * 13); ctx.stroke(); }
    }
    ctx.fillStyle = PINK; ctx.fillRect(mx - 1, GROUND - 7, 2, 10);
  }
}
