'use strict';
// ===== 음량 조절 (전체 / 효과음 / 배경음) =====
const VOLS = [['MASTER', '전체', 'master'], ['SFX', '효과음', 'sfx'], ['MUSIC', '배경음', 'music']];
const VS = [], VM = { x: 0, y: 0, w: 0, h: 0 };
let VSEL = 0, volToast = 0, vdrag = null;

function volAdjust(i, d) {
  const k = VOLS[i][2]; setVol(k, AU.vol[k] + d); volToast = 0;
  if (k === 'sfx') sfx('hit'); else if (k === 'master') sfx('ui');
}
function volKeys() {
  if (volToast > 0) volToast--;
  if (pressed.Minus) { setVol('master', AU.vol.master - 0.1); volToast = 90; sfx('ui'); }
  if (pressed.Equal) { setVol('master', AU.vol.master + 0.1); volToast = 90; sfx('ui'); }
}
function drawVolToast() {
  if (volToast <= 0) return;
  ctx.globalAlpha = Math.min(1, volToast / 15);
  const txt = AU.muted ? 'MUTED' : 'VOLUME ' + Math.round(AU.vol.master * 100) + '%';
  ctx.font = `22px ${DISPLAY}`; const w = ctx.measureText(txt).width + 60;
  hudSlant(W / 2 - w / 2 + 8, 70, w, 32, 12, PINK); T(txt, W / 2, 94, 22, '#fff', 'center'); ctx.globalAlpha = 1;
}
function drawVolPanel(x, y, w, sel) {
  VS.length = 0;
  VOLS.forEach((v, i) => {
    const yy = y + i * 40, on = sel === i, tx = x + 154, tw = w - 154 - 64, val = AU.vol[v[2]];
    hudSlant(x, yy, w, 32, 10, on ? PINK : 'rgba(11,11,13,.92)');
    T(v[0], x + 16, yy + 23, 18, '#fff'); T(v[1], x + 96, yy + 22, 11, on ? '#fff' : '#aaa', 'left', BODY);
    ctx.fillStyle = '#000'; ctx.fillRect(tx - 2, yy + 11, tw + 4, 12); ctx.fillStyle = '#3a3a40'; ctx.fillRect(tx, yy + 13, tw, 8);
    for (let k = 1; k < 10; k++) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(tx + tw * k / 10, yy + 13, 1, 8); }
    ctx.fillStyle = on ? '#fff' : PINK; ctx.fillRect(tx, yy + 13, tw * val, 8);
    ctx.fillStyle = '#fff'; ctx.fillRect(tx + tw * val - 4, yy + 8, 8, 18); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(tx + tw * val - 4, yy + 8, 8, 18);
    T(Math.round(val * 100) + '%', x + w - 8, yy + 23, 16, '#fff', 'right');
    VS.push({ x: tx - 8, y: yy, w: tw + 16, h: 32, i, tx, tw });
  });
}
function pauseVolLogic() {
  if (pressed.ArrowUp) { VSEL = (VSEL + 2) % 3; sfx('ui'); }
  if (pressed.ArrowDown) { VSEL = (VSEL + 1) % 3; sfx('ui'); }
  if (pressed.ArrowLeft) volAdjust(VSEL, -0.05);
  if (pressed.ArrowRight) volAdjust(VSEL, 0.05);
}
function soundPageLogic() {
  if (pressed.Escape || pressed.Tab) { TT.page = 'main'; sfx('ui'); return; }
  if (pressed.ArrowUp) { VSEL = (VSEL + 3) % 4; sfx('ui'); }
  if (pressed.ArrowDown) { VSEL = (VSEL + 1) % 4; sfx('ui'); }
  if (VSEL < 3) {
    if (pressed.ArrowLeft) volAdjust(VSEL, -0.05);
    if (pressed.ArrowRight) volAdjust(VSEL, 0.05);
    if (pressed.Enter || pressed.Space) { TT.page = 'main'; sfx('confirm'); }
  } else if (pressed.Enter || pressed.Space || pressed.ArrowLeft || pressed.ArrowRight) { toggleMute(); sfx('ui'); }
}
function drawSoundPage() {
  ctx.fillStyle = 'rgba(11,11,13,.82)'; ctx.fillRect(0, 0, W, H);
  hudSlant(210, 100, 560, 312, 22, 'rgba(239,237,230,.98)'); ctx.fillStyle = INK; ctx.fillRect(188, 100, 22, 312);
  hudSlant(210, 100, 560, 52, 22, INK); ctx.fillStyle = PINK; ctx.fillRect(188, 100, 6, 52);
  T('SOUND', 232, 142, 36, '#fff'); T('사운드 설정', 372, 140, 16, '#bbb', 'left', BODY);
  drawVolPanel(250, 180, 480, VSEL);
  const y = 300, on = VSEL === 3;
  hudSlant(250, y, 480, 38, 10, on ? PINK : 'rgba(11,11,13,.92)');
  T('MUTE', 266, y + 27, 20, '#fff'); T(AU.muted ? 'ON  (소리 끔)' : 'OFF', 710, y + 26, 16, AU.muted ? '#fff' : '#bbb', 'right', BODY);
  VM.x = 250; VM.y = y; VM.w = 480; VM.h = 38;
  T('↑↓ 선택  ←→ 조절  ·  게임 중에는  -  /  =  키로 전체 음량 조절', 490, 372, 12, '#555', 'center', BODY);
  T('Esc 닫기', 490, 396, 12, PINK, 'center', BODY);
}
// 마우스: 슬라이더 클릭/드래그
function volMouse(ev) { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; }
function volSet(s, mx) { const k = VOLS[s.i][2]; setVol(k, (mx - s.tx) / s.tw); }
addEventListener('mousedown', ev => {
  const inSound = state === 'title' && TT.page === 'sound';
  if (!inSound && state !== 'pause') return;
  const [mx, my] = volMouse(ev);
  for (const s of VS) if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) { vdrag = s; VSEL = s.i; volSet(s, mx); if (VOLS[s.i][2] === 'sfx') sfx('hit'); return; }
  if (inSound && mx >= VM.x && mx <= VM.x + VM.w && my >= VM.y && my <= VM.y + VM.h) { VSEL = 3; toggleMute(); sfx('ui'); }
});
addEventListener('mousemove', ev => { if (!vdrag) return; const [mx] = volMouse(ev); volSet(vdrag, mx); });
addEventListener('mouseup', () => { vdrag = null; });

// ===== 스킬 아이콘: 은은한 핑크 광원 + 모서리 브래킷 + 글로우로 통일감 =====
function skillIcon(k, x, y, s, locked) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 2, x, y, s * 0.66);
  g.addColorStop(0, locked ? 'rgba(255,255,255,.05)' : 'rgba(255,42,100,.30)'); g.addColorStop(1, 'rgba(255,42,100,0)');
  ctx.fillStyle = g; ctx.fillRect(x - s * 0.66, y - s * 0.66, s * 1.32, s * 1.32);
  ctx.strokeStyle = locked ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.4; ctx.lineCap = 'butt';
  const r = s * 0.58, l = s * 0.16;
  ctx.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(x + sx * r, y + sy * (r - l)); ctx.lineTo(x + sx * r, y + sy * r); ctx.lineTo(x + sx * (r - l), y + sy * r); }
  ctx.stroke();
  if (!locked) { ctx.shadowColor = 'rgba(255,42,100,.65)'; ctx.shadowBlur = 5; }
  skillIconRaw(k, x, y, s * 0.94, locked);
  ctx.restore();
}
