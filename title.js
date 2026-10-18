'use strict';
// ===== 타이틀 화면 / 캐릭터 선택 화면 =====
const TT = { sel: 0, page: 'main', t: 0 };
const UH = []; // 클릭 영역 {x,y,w,h,go,act,sel}
const MOUSE = { x: -1, y: -1, moved: false };
const TITLE_ITEMS = [['START', '게임 시작'], ['ARCHIVE', '도감 · 업적'], ['CONTROLS', '조작법'], ['SOUND', '사운드']];
function mouseCanvas(ev) { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; }
addEventListener('mousemove', ev => { [MOUSE.x, MOUSE.y] = mouseCanvas(ev); MOUSE.moved = true; });
addEventListener('mousedown', ev => {
  if (state !== 'title' && state !== 'select' && state !== 'map' && state !== 'dead' && state !== 'archive') return;
  const [mx, my] = mouseCanvas(ev);
  if (state === 'title' && TT.page === 'help') { TT.page = 'main'; sfx('ui'); return; }
  if (state === 'title' && TT.page === 'sound') return;
  for (let i = UH.length - 1; i >= 0; i--) {
    const h = UH[i];
    if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) { if (h.sel && h.sel()) h.act(); else { h.go(); sfx('ui'); } return; }
  }
});
function uhit(x, y, w, h, go, act, sel) { UH.push({ x, y, w, h, go, act, sel }); }

function titleAct(i) {
  sfx('confirm');
  if (i === 0) { state = 'select'; }
  else if (i === 1) archiveOpen('title');
  else if (i === 2) TT.page = 'help';
  else { TT.page = 'sound'; VSEL = 0; }
}
function titleLogic() {
  TT.t++;
  if (AU.level !== 0) musicSet(0);
  if (TT.page === 'help') { if (pressed.Escape || pressed.Enter || pressed.Space || pressed.Tab) { TT.page = 'main'; sfx('ui'); } return; }
  if (TT.page === 'sound') { soundPageLogic(); return; }
  if (MOUSE.moved) {
    MOUSE.moved = false;
    TITLE_ITEMS.forEach((it, i) => { const y = 304 + i * 48; if (MOUSE.x >= 30 && MOUSE.x <= 350 && MOUSE.y >= y && MOUSE.y <= y + 44 && TT.sel !== i) { TT.sel = i; sfx('ui'); } });
  }
  if (pressed.ArrowUp) { TT.sel = (TT.sel + 3) % 4; sfx('ui'); }
  if (pressed.ArrowDown) { TT.sel = (TT.sel + 1) % 4; sfx('ui'); }
  if (pressed.Enter || pressed.Space) titleAct(TT.sel);
}
function ticker(y, text, speed, col) {
  ctx.font = `18px ${DISPLAY}`; const tw = ctx.measureText(text).width + 40, off = (performance.now() / 16 * speed) % tw;
  ctx.fillStyle = col; ctx.textAlign = 'left';
  for (let x = -off; x < W; x += tw) ctx.fillText(text, x, y);
}
const TICK = 'DUNGEON ADVENTURE  ✦  SELECT YOUR HUNTER  ✦  DESCEND INTO THE DARK  ✦  SLAY THE BOSS  ✦  ';

function drawTitle() {
  UH.length = 0;
  const t = TT.t, e = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.95; ctx.drawImage(SPLAT, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = HALF; ctx.globalAlpha = 0.14; ctx.fillRect(0, 290, W, 250); ctx.globalAlpha = 1;
  // 핑크 사선 슬랩 + 검은 경계선
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(330, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(458, 0); ctx.lineTo(476, 0); ctx.lineTo(336, H); ctx.lineTo(318, H); ctx.closePath(); ctx.fill();
  // 캐릭터 4인 포스터
  const ids = ['warrior', 'mage', 'archer', 'rogue'], xs = [300, 440, 580, 700], ys = [-4, 14, 0, 22];
  ids.forEach((id, i) => {
    if (!artOk(id)) return;
    const k = e((t - 6 - i * 9) / 26), im = ART[id], hh = 548, ww = im.naturalWidth * hh / im.naturalHeight;
    withMultiply(() => { ctx.globalAlpha = k; ctx.drawImage(im, xs[i] + (1 - k) * 220, ys[i] + Math.sin(t * 0.025 + i * 1.7) * 3, ww, hh); });
  });
  // 타이틀 타이포
  ctx.save(); ctx.translate(-(1 - e(t / 18)) * 120, 0);
  T('DUNGEON', 26, 172, 156, INK);
  hudSlant(22, 190, 462, 66, 20, INK); ctx.fillStyle = PINK; ctx.fillRect(22 - 20, 190, 8, 66);
  T('ADVENTURE', 52, 241, 52, '#fff'); T('✦', 440, 238, 30, PINK);
  tag('던전 어드벤처', 30, 284, 19, PINK, '#fff', BODY);
  tag('INK  ·  SHADOW  ·  PINK', 186, 282, 13, INK, '#fff');
  ctx.restore();
  // 메뉴
  TITLE_ITEMS.forEach((it, i) => {
    const y = 304 + i * 48, on = TT.sel === i, off = on ? 14 : 0, k = e((t - 14 - i * 4) / 14);
    ctx.save(); ctx.globalAlpha = k; ctx.translate(-(1 - k) * 80, 0);
    hudSlant(30 + off, y, 300, 40, 14, on ? PINK : 'rgba(11,11,13,.92)');
    T(it[0], 52 + off, y + 30, 26, '#fff');
    const sub = i === 3 ? (AU.muted ? 'MUTED' : Math.round(AU.vol.master * 100) + '%') : it[1];
    T(sub, 318 + off, y + 27, 14, on ? '#fff' : '#bbb', 'right', i === 3 ? DISPLAY : BODY);
    if (on) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(34, y + 12); ctx.lineTo(44, y + 20); ctx.lineTo(34, y + 28); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    uhit(30, y, 320, 40, () => { TT.sel = i; }, () => titleAct(i), () => TT.sel === i);
  });
  if (Math.floor(t / 30) % 2 === 0) T('PRESS ENTER', 40, 502, 14, INK, 'left');
  // 하단 티커 + 키 안내
  ctx.fillStyle = INK; ctx.fillRect(0, 508, W, 32); ctx.fillStyle = PINK; ctx.fillRect(0, 508, W, 3);
  ticker(530, TICK, 1.4, 'rgba(255,255,255,.75)');
  ctx.fillStyle = INK; ctx.fillRect(0, 511, 322, 29);
  let hx = 14; for (const [k, tx] of [['↑↓', '선택'], ['Enter', '확인'], ['M', '음소거']]) { hx += keycap(k, hx, 530) + 4; T(tx, hx, 529, 12, '#ddd', 'left', BODY); ctx.font = `12px ${BODY}`; hx += ctx.measureText(tx).width + 14; }
  T('v1.0', W - 14, 528, 12, '#888', 'right', BODY);
  if (TT.page === 'help') drawHelp();
  if (TT.page === 'sound') drawSoundPage();
}
function drawHelp() {
  ctx.fillStyle = 'rgba(11,11,13,.82)'; ctx.fillRect(0, 0, W, H);
  hudSlant(110, 56, 760, 400, 24, 'rgba(239,237,230,.98)'); ctx.fillStyle = INK; ctx.fillRect(86, 56, 24, 400);
  hudSlant(110, 56, 760, 52, 24, INK); ctx.fillStyle = PINK; ctx.fillRect(86, 56, 6, 52);
  T('CONTROLS', 132, 98, 36, '#fff'); T('조작법', 306, 96, 16, '#bbb', 'left', BODY);
  const rows = [['이동', ['←', '→']], ['달리기', ['Shift']], ['점프 (2단)', ['Space']], ['조준 · 대각', ['↑', '↑+←/→']], ['기본 공격', ['A']], ['스킬', ['Q', 'W', 'E', 'R', 'F']], ['메뉴 · 장비 · 스킬 강화', ['Tab']], ['상점 (NPC 앞)', ['Enter']], ['일시정지 / 음소거', ['P', 'M']]];
  rows.forEach((r, i) => {
    const y = 148 + i * 34;
    T(r[0], 150, y + 4, 16, INK, 'left', BODY);
    let x = 470; for (const k of r[1]) x += keycap(k, x, y + 6) + 6;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(150, y + 14, 700, 1);
  });
  T('아래 + 점프 : 발판 아래로 내려가기', 150, 446, 12, '#555', 'left', BODY);
  T('아무 키나 눌러 닫기', 850, 446, 12, PINK, 'right', BODY);
}

// ===== 캐릭터 선택 =====
function selBar(x, y, w, h, v, max, col) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillStyle = '#d6d4cd'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(v / max, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x, y, w * clamp(v / max, 0, 1), Math.max(1, h * 0.35));
}
function drawSelect() {
  UH.length = 0;
  const c = CLASSES[sel], tt = performance.now() / 16;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = HALF; ctx.globalAlpha = 0.16; ctx.fillRect(0, 300, 560, 210); ctx.globalAlpha = 1;
  ctx.drawImage(SPLAT, 0, 0);
  // 핑크 평행사변형 + 얇은 검은 선
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(530, 0); ctx.lineTo(452, 508); ctx.lineTo(222, 508); ctx.closePath(); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(524, 0); ctx.lineTo(536, 0); ctx.lineTo(458, 508); ctx.lineTo(446, 508); ctx.closePath(); ctx.fill();
  drawSelArt(c.id, tt);
  // 좌측 타이포
  hudSlant(22, 26, 232, 36, 14, INK); ctx.fillStyle = PINK; ctx.fillRect(8, 26, 6, 36); T('SELECT HUNTER', 38, 52, 22, '#fff');
  ctx.font = `150px ${DISPLAY}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(String(sel + 1).padStart(2, '0'), 20, 184);
  T('/04', 196, 184, 36, PINK);
  ctx.save(); ctx.font = `74px ${DISPLAY}`; ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText(c.en, 24, 300); ctx.restore();
  tag(c.name, 28, 350, 26, INK, '#fff', BODY);
  ctx.font = `13px ${BODY}`; wrapT(c.desc, 28, 384, 186, 18, 13, '#222');
  // READY 버튼
  const pul = 1 + Math.sin(tt * 0.12) * 0.03;
  ctx.save(); ctx.translate(133, 480); ctx.scale(pul, pul); ctx.translate(-133, -480);
  hudSlant(28, 458, 214, 44, 16, PINK); T('READY, GO', 52, 490, 26, '#fff'); keycap('Enter', 172, 484, '#fff', INK); ctx.restore();
  uhit(20, 458, 230, 44, () => {}, () => { sfx('confirm'); beginGame(); }, () => true);
  // 우측 정보
  const rx = 566;
  hudSlant(rx, 24, 372, 32, 14, INK); T('COMBAT EFFECTIVENESS', rx + 14, 47, 19, '#fff');
  const power = Math.round(c.hp * 40 + c.mp * 18 + c.spd * 1500 + c.base * 600 + c.crit * 5000);
  T(String(power), rx, 126, 80, INK);
  const stars = clamp(Math.round((power - 15000) / 1000), 2, 7);
  T('★'.repeat(stars) + '☆'.repeat(7 - stars), rx + 2, 156, 26, PINK);
  const stats = [['HP', c.hp, 180, PINK], ['MP', c.mp, 170, INK], ['SPD', c.spd, 4.5, '#777'], ['ATK', c.base, 16, PINK], ['CRIT', Math.round(c.crit * 100), 30, '#777']];
  stats.forEach((s, i) => { const y = 180 + i * 25; T(s[0], rx, y + 12, 14, INK); selBar(rx + 54, y, 250, 12, s[1], s[2], s[3]); T(String(s[1]), rx + 372, y + 12, 15, INK, 'right'); });
  hudSlant(rx, 314, 372, 26, 12, INK); T('SKILLS', rx + 14, 333, 16, '#fff'); T('티어별 4종 중 선택', rx + 372, 332, 11, '#bbb', 'right', BODY);
  const all = [{ label: 'A', ico: c.basic.ico, name: c.basic.name, tier: 0 }, ...c.skills.filter((s, i) => i % 4 === 0)];
  all.forEach((s, i) => {
    const x = rx + i * 64, y = 346;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, 56, 56); ctx.fillStyle = INK; ctx.fillRect(x, y, 52, 52); skillIcon(s.ico, x + 26, y + 26, 44, false);
    keycap(s.label, x - 2, y + 66, s.tier === 5 ? PINK : '#fff', s.tier === 5 ? '#fff' : INK);
    T(s.name, x + 26, y + 78, 11, INK, 'center', BODY);
  });
  // 썸네일 4칸
  CLASSES.forEach((k, i) => {
    const x = rx + i * 96, y = 442, on = i === sel;
    ctx.save(); ctx.fillStyle = on ? PINK : INK; ctx.fillRect(x - 4, y - 4, 84, 72); ctx.fillStyle = PAPER; ctx.fillRect(x, y, 76, 64);
    drawThumb(k.id, x, y, 76, on); ctx.restore();
    ctx.fillStyle = on ? PINK : INK; ctx.fillRect(x - 4, y + 54, 84, 14); T(k.en, x + 38, y + 65, 11, '#fff', 'center');
    keycap(String(i + 1), x - 4, y + 14, on ? PINK : '#fff', on ? '#fff' : INK);
    uhit(x - 4, y - 4, 84, 72, () => { sel = i; }, () => { sfx('confirm'); beginGame(); }, () => sel === i);
  });
  // 하단 안내 바
  ctx.fillStyle = INK; ctx.fillRect(0, 508, W, 32); ctx.fillStyle = PINK; ctx.fillRect(0, 508, W, 3);
  let hx = 14; for (const [k, tx] of [['←→', '캐릭터 선택'], ['1~4', '바로 선택'], ['Enter', '시작'], ['Esc', '타이틀'], ['M', '음소거']]) { hx += keycap(k, hx, 530) + 4; T(tx, hx, 529, 12, '#ddd', 'left', BODY); ctx.font = `12px ${BODY}`; hx += ctx.measureText(tx).width + 18; }
}
