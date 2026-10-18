'use strict';
// ===== 스타일: 흑백 잉크 + 핫핑크 =====
const DISPLAY = "Impact, 'Arial Black', 'Malgun Gothic', sans-serif", BODY = "'Malgun Gothic', Arial, sans-serif";
const srand = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function T(s, x, y, size, color = INK, align = 'left', font = DISPLAY) {
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function TS(s, x, y, size, color, stroke, sw = 4, align = 'center', font = DISPLAY) {
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.lineJoin = 'round';
  ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function tag(s, x, y, size, bg = INK, fg = '#fff', font = DISPLAY, align = 'left') {
  ctx.font = `${size}px ${font}`;
  const w = ctx.measureText(s).width + 12, x0 = align === 'right' ? x - w : x;
  ctx.fillStyle = bg; ctx.fillRect(x0, y - size, w, size + 6);
  ctx.textAlign = 'left'; ctx.fillStyle = fg; ctx.fillText(s, x0 + 6, y);
  return w;
}

// ===== 사전 렌더 텍스처 =====
const SPLAT = (() => {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.strokeStyle = '#000';
  let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let k = 0; k < 28; k++) {
    const x = r() * W, y = r() * H, n = 6 + r() * 16;
    for (let i = 0; i < n; i++) { g.beginPath(); g.arc(x + (r() - .5) * 80, y + (r() - .5) * 44, r() * r() * 8 + .6, 0, 7); g.fill(); }
  }
  for (let k = 0; k < 90; k++) { g.beginPath(); g.arc(r() * W, r() * H, r() * 1.8, 0, 7); g.fill(); }
  g.globalAlpha = .45; g.lineWidth = 1;
  for (let k = 0; k < 18; k++) { const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 160, y + (r() - .5) * 60); g.stroke(); }
  return c;
})();
const GRAIN = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const g = c.getContext('2d'), id = g.createImageData(160, 160);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() < .5 ? 0 : 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() < .35 ? Math.random() * 40 : 0; }
  g.putImageData(id, 0, 0); return c;
})();
const HALF = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 6;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.beginPath(); g.arc(3, 3, 1.3, 0, 7); g.fill();
  return ctx.createPattern(c, 'repeat');
})();

// ===== 실루엣 그리기 도구 =====
let FL = false; // 피격 플래시(흰색 + 검은 테두리)
function ink() { ctx.fill(); if (FL) { ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke(); } }
function irect(x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); ink(); }
function icirc(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ink(); }
function ipoly(pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ink(); }

function humanoid(x, y, w, h, f, t, moving, col, o = {}) {
  ctx.fillStyle = FL ? '#fff' : col;
  const bob = moving ? Math.sin(t * .3) * 1.5 : 0, sw = moving ? Math.sin(t * .3) * 5 : 0;
  irect(x + w * .15 + sw, y + h * .68, w * .28, h * .32);
  irect(x + w * .57 - sw, y + h * .68, w * .28, h * .32);
  const top = y + h * .3 + bob, sh = o.shoulder || 0;
  ipoly([[x + w * .2 - sh, top], [x + w * .8 + sh, top], [x + w * (o.coat ? 1.05 : .92), y + h * .76], [x + w * (o.coat ? -.05 : .08), y + h * .76]]);
  icirc(x + w / 2, y + h * .2 + bob, w * (o.head || .34));
  if (!o.noEye) { ctx.fillStyle = o.eye || '#fff'; ctx.fillRect(x + w / 2 + f * w * .12 - 1.5, y + h * .17 + bob, 4, 3); }
}

// ===== 배경 =====
// ===== 월드 =====
function drawWorld() {
  ctx.save();
  ctx.translate(-Math.round(S.cam), 0);
  const x0 = Math.floor(S.cam / 16) * 16;
  // 바닥 (들쭉날쭉한 잉크 실루엣)
  drawGround(); drawGround2(); drawWebs(); drawEvents();
  if (!S.locked) { // 보스방 입구
    ctx.fillStyle = PINK; ctx.fillRect(S.arenaL, 0, 8, GROUND);
    ctx.save(); ctx.fillStyle = HALF; ctx.fillRect(S.arenaL - 120, 0, 120, GROUND); ctx.restore();
    tag('BOSS ▶', S.arenaL - 110, GROUND - 60, 22, PINK, '#fff');
  }
  for (const d of S.drops) {
    if (d.kind === 'item') { drawItemDrop(d); continue; }
    ctx.fillStyle = d.kind === 'hp' ? PINK : '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.kind === 'gold' ? 6 : 7, 0, 7); ctx.fill(); ctx.stroke();
    if (d.kind === 'gold') { ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(d.x, d.y, 2.5, 0, 7); ctx.fill(); }
  }
  for (const e of S.enemies) if (e.x > S.cam - 200 && e.x < S.cam + W + 200) drawEnemy(e);
  for (const p of S.parts) if (p.kind === 'ghost') { ctx.globalAlpha = .35 * (1 - p.t / p.life); drawPlayerSprite(P.cls.id, p.x, p.y, p.w, p.h, p.f, 0, true, 0, false); ctx.globalAlpha = 1; }
  // 플레이어
  const blink = P.inv > 0 && P.hurtT > 0 && S.t % 4 < 2;
  ctx.globalAlpha = P.stealth > 0 ? .35 : blink ? .4 : 1;
  drawAura();
  drawPlayerSprite(P.cls.id, P.x, P.y, P.w, P.h, P.facing, S.t, P.vx !== 0 && P.onGround, P.atkT, false, Math.atan2(P.aim.y, P.aim.x), P.running);
  ctx.globalAlpha = 1;
  if (P.aim.y !== 0) { // 대각/위/아래 조준 표시
    const ax = cx(P) + P.aim.x * 46, ay = cy(P) - 6 + P.aim.y * 46;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx(P) + P.aim.x * 34, cy(P) - 6 + P.aim.y * 34); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.stroke();
  }
  for (const b of S.boxes) drawBox(b);
  for (const q of S.projs) drawProj(q);
  for (const q of S.eprojs) {
    ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (q.wave) { ctx.moveTo(q.x - 16, GROUND); ctx.lineTo(q.x, GROUND - 46); ctx.lineTo(q.x + 16, GROUND); ctx.closePath(); }
    else { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + S.t * .15, rr = i % 2 ? q.r * .6 : q.r * 1.25; ctx.lineTo(q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr); } ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    if (!q.wave) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * .3, 0, 7); ctx.fill(); }
  }
  for (const p of S.parts) {
    const k = 1 - p.t / p.life;
    if (drawFxPart(p, k)) continue;
    if (p.kind === 'ink') { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k + .5, 0, 7); ctx.fill(); }
    else if (p.kind === 'dust') { ctx.fillStyle = `rgba(0,0,0,${.22 * k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (2 - k) + 2, 0, 7); ctx.fill(); }
    else if (p.kind === 'spark') {
      const l = Math.hypot(p.vx, p.vy) || 1, len = p.size * k; ctx.lineCap = 'round';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / l * len, p.y - p.vy / l * len); ctx.stroke();
      ctx.strokeStyle = p.color; ctx.lineWidth = 2.5; ctx.stroke();
    } else if (p.kind === 'crack') {
      ctx.globalAlpha = Math.min(1, k * 1.5); ctx.lineJoin = 'miter'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      const grow = Math.min(1, p.t / 6), n = Math.ceil(p.pts.length * grow);
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      for (let i = 0; i < n; i++) ctx.lineTo(p.x + p.dir * p.pts[i][0], p.y + p.pts[i][1]);
      ctx.stroke(); ctx.globalAlpha = 1;
    } else if (p.kind === 'speed') {
      ctx.globalAlpha = k; ctx.lineCap = 'round';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.dir * p.len, p.y); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    } else if (p.kind === 'ring') {
      ctx.globalAlpha = k; ctx.strokeStyle = '#000'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(p.x, p.y, p.size + p.t * 4.5, 0, 7); ctx.stroke();
      ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  for (const t of S.texts) {
    ctx.globalAlpha = Math.min(1, (t.life - t.t) / 15);
    const pop = t.t < 8 ? 1.6 - t.t * .075 : 1;
    ctx.save(); ctx.translate(t.x, t.y); ctx.scale(pop, pop);
    TS(String(t.s), 0, 0, t.size, t.color, t.color === PINK ? '#000' : '#fff', 4);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ===== HUD =====
function glyph(kind, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const r = s / 2;
  switch (kind % 7) {
    case 0: ctx.beginPath(); ctx.arc(0, 0, r * .8, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, 7); ctx.fill(); break;
    case 1: ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, r * .8); ctx.lineTo(-r, r * .8); ctx.closePath(); ctx.stroke(); break;
    case 2: ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(r, r); ctx.moveTo(r, -r); ctx.lineTo(-r, r); ctx.stroke(); break;
    case 3: ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath(); ctx.stroke(); break;
    case 4: for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .3, Math.sin(a) * r * .3); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); } break;
    case 5: ctx.beginPath(); ctx.moveTo(-r, -r * .7); ctx.lineTo(0, 0); ctx.lineTo(-r, r * .7); ctx.moveTo(0, -r * .7); ctx.lineTo(r, 0); ctx.lineTo(0, r * .7); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.moveTo(-r, r); ctx.lineTo(r, -r); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * .2, r); ctx.lineTo(r, -r * .1); ctx.stroke();
  }
  ctx.restore();
}
function hbar(x, y, w, h, v, max, fill, bg = '#fff') {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w * clamp(v / max, 0, 1), h);
}
function bandPanel(big, sub, hl, extra) {
  ctx.fillStyle = 'rgba(239,237,230,.78)'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .6; ctx.drawImage(SPLAT, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = INK; ctx.fillRect(0, 170, W, 170);
  ctx.font = `110px ${DISPLAY}`; const w = ctx.measureText(big).width;
  ctx.fillStyle = PINK; ctx.fillRect(W / 2 - w / 2 - 14, 186, w + 28, 128);
  T(big, W / 2, 292, 110, '#fff', 'center');
  tag(hl, 40, 200, 20, '#fff', INK);
  T(sub, W / 2, 372, 20, INK, 'center', BODY);
  if (extra) T(extra, W / 2, 400, 16, '#444', 'center', BODY);
}

function beginGame(skip) { P = makePlayer(CLASSES[sel]); const st = CLASSES[sel].id + '0'; P.owned[st] = true; P.slots[0] = st; P.unlocked = 0; P.ranks = {}; P.diff = SAVE.diff === undefined ? 1 : SAVE.diff; if (skip) startStage(0); else { state = 'map'; mapSel = 0; mapT = 0; musicSet(0); } }

// ===== 후처리 / 메인 루프 =====
// 비네트/그레인은 한 번만 만들어 두고 매 프레임 drawImage 한 번으로 처리
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const VIG = (() => {
  const c = mkCanvas(W, H), g = c.getContext('2d'), v = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H); return c;
})();
const LOWHP = (() => {
  const c = mkCanvas(W, H), g = c.getContext('2d'), v = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H);
  v.addColorStop(0, 'rgba(255,42,100,0)'); v.addColorStop(1, 'rgba(255,42,100,.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H); return c;
})();
const NOISE = (() => {
  const c = mkCanvas(W + 200, H + 200), g = c.getContext('2d');
  for (let x = 0; x < c.width; x += 160) for (let y = 0; y < c.height; y += 160) g.drawImage(GRAIN, x, y);
  return c;
})();
let noiseOx = 0, noiseOy = 0;
function postFX() {
  ctx.drawImage(VIG, 0, 0);
  if (P && P.hp / P.maxhp < .3 && state === 'play') { ctx.globalAlpha = clamp(.4 + Math.sin(performance.now() / 150) * .3, 0, 1); ctx.drawImage(LOWHP, 0, 0); ctx.globalAlpha = 1; }
  if (S === null || (S.t & 1) === 0) { noiseOx = Math.floor(Math.random() * 200); noiseOy = Math.floor(Math.random() * 200); }
  ctx.globalAlpha = .7; ctx.drawImage(NOISE, -noiseOx, -noiseOy); ctx.globalAlpha = 1;
  if (scrFlash.a > 0.01) { ctx.globalAlpha = scrFlash.a; ctx.fillStyle = scrFlash.c; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; scrFlash.a *= .82; }
  drawVolToast(); drawAchToast();
}
// 로직(입력 포함)과 그리기를 분리: 느린 PC에서 로직만 따라잡고 그리기는 프레임당 1회
function logic() {
  if (pressed.KeyM) toggleMute();
  volKeys(); fxDecay();
  if (state === 'title') titleLogic();
  else if (state === 'select') {
    if (AU.level !== 0) musicSet(0);
    if (pressed.ArrowRight) { sel = (sel + 1) % 4; sfx('ui'); }
    if (pressed.ArrowLeft) { sel = (sel + 3) % 4; sfx('ui'); }
    for (let i = 0; i < 4; i++) if (pressed['Digit' + (i + 1)]) { sel = i; sfx('ui'); }
    if (pressed.Enter || pressed.Space) { sfx('confirm'); beginGame(); }
    if (pressed.Escape) { state = 'title'; sfx('ui'); }
  } else if (state === 'map') mapLogic();
  else if (state === 'archive') archiveLogic();
  else {
    let handled = false;
    if (state === 'pause') pauseVolLogic();
    if (pressed.Enter && state === 'play' && S.nearInter && !S.nearMerch && !S.cut) { interact(S.nearInter); pressed.Enter = false; }
    const wantMenu = pressed.Tab || (pressed.Enter && state === 'play' && S.nearMerch);
    if (wantMenu && !(S && S.cut) && (state === 'play' || state === 'dead' || state === 'clear' || state === 'map')) { menuPrev = state; state = 'menu'; menuOpen(pressed.Tab ? 0 : 3); sfx('ui'); handled = true; }
    else if (state === 'menu') { menuLogic(); handled = true; }
    if (!handled) {
    if (pressed.KeyP && (state === 'play' || state === 'pause')) state = state === 'play' ? 'pause' : 'play';
    if (state === 'play') { if (S.cut) cutLogic(); else if (freeze > 0) freeze--; else if (slowT > 0 && (slowT-- % 2)) { /* 슬로모션: 한 프레임 걸러 진행 */ } else update(); }
    else if (state === 'dead') deadLogic();
    else if (state === 'clear') clearLogic();
    }
    shake = shake > 0.3 ? shake * 0.86 : 0;
  }
  for (const k in pressed) delete pressed[k];
}
function render() {
  if (state === 'title') { drawTitle(); postFX(); return; }
  if (state === 'select') { drawSelect(); postFX(); return; }
  if (state === 'map') { drawMap(); postFX(); return; }
  if (state === 'archive') { drawArchive(); postFX(); return; }
  if (state === 'clear') { drawClear(); postFX(); return; }
  if (state === 'menu' && menuPrev === 'map') { drawMap(); drawMenu(); postFX(); return; }
  if (state === 'menu' && menuPrev === 'clear') { drawClear(); drawMenu(); postFX(); return; }
  const sx = (Math.random() - .5) * shake * 2, sy = (Math.random() - .5) * shake * 2;
  const pvx = clamp(cx(P) - S.cam, 0, W), pvy = clamp(cy(P), 0, H);
  ctx.save(); ctx.translate(sx, sy); ctx.translate(pvx, pvy); ctx.scale(zoomK, zoomK); ctx.translate(-pvx, -pvy);
  drawBG(); drawWorld(); ctx.restore(); drawFrost(); drawImpactFrame();
  drawHUD(); if (S && S.cut) drawCut();
  if (state === 'menu') drawMenu();
  else if (state === 'pause') { bandPanel('PAUSE', 'P 를 눌러 계속 · ↑↓ ←→ 로 음량 조절', 'PAUSED'); drawVolPanel(300, 394, 360, VSEL); }
  else if (state === 'dead') drawDead();
  else if (state === 'clear') {
    const last = stageIdx >= DUNGEONS.length - 1;
    bandPanel(last ? 'ALL CLEAR' : 'CLEARED', last ? '축하합니다!  Enter: 캐릭터 선택으로' : `Enter: 다음 던전 — ${DUNGEONS[stageIdx + 1].name}`, `STAGE ${stageIdx + 1} COMPLETE`, `최대 콤보 ${combo.best}  ·  Lv.${P.lv}`);
  }
  postFX();
}
function frame() { logic(); render(); }
let acc = 0, prev = performance.now();
function loop(now) {
  acc += Math.min(50, now - prev); prev = now;
  let steps = 0;
  while (acc >= 1000 / 60 && steps < 2) { logic(); acc -= 1000 / 60; steps++; }
  if (acc >= 1000 / 60) acc = 0; // 못 따라잡으면 버린다 (렉 누적 방지)
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
