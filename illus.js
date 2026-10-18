'use strict';
// ===== 캐릭터 일러스트 / 궁극기 컷신 =====
const ART = {};
for (const id of ['warrior', 'mage', 'archer', 'rogue']) { const im = new Image(); im.src = 'art/' + id + '.png'; ART[id] = im; }
const artOk = id => ART[id] && ART[id].complete && ART[id].naturalWidth > 0;
// 초상화 크롭 (720x1080 원본 기준 x,y,w,h)
const PORTRAIT = { warrior: [200, 80, 330, 392], mage: [170, 60, 360, 428], archer: [180, 100, 330, 392], rogue: [280, 260, 340, 404] };
let selLast = -1, selAt = 0;

// 흰 배경은 multiply 합성으로 사라지고 잉크만 남는다
function withMultiply(fn) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; fn(); ctx.restore(); }

function drawSelArt(id, tt) {
  if (selLast !== sel) { selLast = sel; selAt = performance.now(); }
  const a = clamp((performance.now() - selAt) / 280, 0, 1), e = 1 - Math.pow(1 - a, 3);
  if (!artOk(id)) {
    ctx.save(); ctx.translate(345, 120); ctx.scale(5, 5); drawPlayerSprite(id, 0, 0, 24, 54, 1, tt, false, 0, false); ctx.restore(); return;
  }
  const im = ART[id], hh = 480, ww = im.naturalWidth * hh / im.naturalHeight;
  withMultiply(() => {
    ctx.globalAlpha = e;
    ctx.drawImage(im, 222 + (1 - e) * 70, 40, ww, hh);
  });
  // 발치 먹 그림자
  ctx.fillStyle = INK; ctx.globalAlpha = 0.55 * e; ctx.fillRect(300, 528, 200, 6); ctx.globalAlpha = 1;
}
function drawThumb(id, x, y, s, on) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
  if (artOk(id)) {
    const im = ART[id], sw = im.naturalWidth, sh = im.naturalHeight * 0.62;
    withMultiply(() => ctx.drawImage(im, 0, 0, sw, sh, x - 6, y - 2, s + 12, (s + 12) * sh / sw));
  } else { ctx.translate(x + s / 2 - 14 * 1.4, y + 12); ctx.scale(1.4, 1.4); drawPlayerSprite(id, 0, 0, 24, 54, 1, 0, false, 0, !on); }
  if (!on) { ctx.fillStyle = 'rgba(11,11,13,.55)'; ctx.fillRect(x, y, s, s); }
  ctx.restore();
}
function drawPortrait(id, x, y, w, h) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (artOk(id)) {
    const im = ART[id], k = im.naturalWidth / 720, c = PORTRAIT[id];
    withMultiply(() => ctx.drawImage(im, c[0] * k, c[1] * k, c[2] * k, c[3] * k, x, y, w, h));
  } else { ctx.translate(x + w / 2 - 12 * 1.3, y + 4); ctx.scale(1.3, 1.3); drawPlayerSprite(id, 0, 0, 24, 54, 1, 0, false, 0, false); }
  ctx.restore();
}

// ===== 궁극기 컷신 =====
function cutLogic() {
  const c = S.cut; c.t++;
  P.inv = Math.max(P.inv, 30);
  if (c.t === c.fire) {
    sfx(c.s.snd); curSrc = 'skill'; curLvm = c.lvm || 1; curFx = FXMAP[c.s.ico] || 'arcane'; flashScreen('#fff', 0.95); addShake(12); P.atkT = 14;
    c.s.fn();
    S.skillBanner = { en: c.s.en, name: c.s.name, t: 0 };
  }
  if (c.t >= c.dur) S.cut = null;
}
function drawCut() {
  const c = S.cut, t = c.t, D = c.dur, s = c.s, cls = P.cls;
  const ease = v => 1 - Math.pow(1 - clamp(v, 0, 1), 3);
  const inA = ease(t / 10), outA = clamp((D - t) / 8, 0, 1), A = Math.min(inA, outA);
  ctx.fillStyle = `rgba(0,0,0,${0.62 * A})`; ctx.fillRect(0, 0, W, H);
  // 레터박스
  const bar = 62 * ease(t / 8) * outA;
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  ctx.fillStyle = PINK; ctx.fillRect(0, bar - 3, W, 3); ctx.fillRect(0, H - bar, W, 3);
  // 만화 컷 패널 (슬라이드 인)
  const slide = ease(t / 12), off = (1 - slide) * -W * 1.1;
  ctx.save(); ctx.globalAlpha = outA; ctx.translate(off, 0);
  ctx.beginPath(); ctx.moveTo(-40, 150); ctx.lineTo(W + 40, 108); ctx.lineTo(W + 40, 398); ctx.lineTo(-40, 440); ctx.closePath();
  ctx.save(); ctx.clip();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.5 * outA; ctx.drawImage(SPLAT, 0, 0); ctx.globalAlpha = outA;
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(190, 0); ctx.lineTo(500, 0); ctx.lineTo(430, H); ctx.lineTo(120, H); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.18 * outA; ctx.fillStyle = HALF; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA;
  // 속도선
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    const yy = 100 + ((i * 41 + t * 19) % 360), x1 = ((i * 97 - t * 64) % (W + 260) + W + 260) % (W + 260) - 130, len = 90 + (i % 5) * 40;
    ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x1 + len, yy); ctx.stroke();
  }
  // 캐릭터 일러스트 (상반신, 서서히 확대)
  if (artOk(cls.id)) {
    const im = ART[cls.id], sw = im.naturalWidth, sh = im.naturalHeight * 0.74, zoom = 1 + t * 0.004;
    const dh = 440 * zoom, dw = dh * sw / sh;
    withMultiply(() => ctx.drawImage(im, 0, 0, sw, sh, 300 - dw / 2 + (1 - slide) * 80, 112 - (zoom - 1) * 90, dw, dh));
  }
  ctx.restore(); // clip 해제
  ctx.restore();
  // 타이포
  ctx.save(); ctx.globalAlpha = outA * ease((t - 6) / 10);
  const tx = 480 + (1 - ease((t - 6) / 10)) * 160;
  ctx.translate(tx, 0);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-20, 236); ctx.lineTo(480, 226); ctx.lineTo(470, 330); ctx.lineTo(-30, 340); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PINK; ctx.fillRect(-30, 226, 12, 118);
  tag('ULTIMATE', 0, 222, 22, PINK, '#fff');
  ctx.font = `64px ${DISPLAY}`; const maxW = 440; let fs = 64; ctx.font = `${fs}px ${DISPLAY}`; while (ctx.measureText(s.en).width > maxW && fs > 30) { fs -= 2; ctx.font = `${fs}px ${DISPLAY}`; }
  TS(s.en, 6, 300, fs, '#fff', '#000', 6, 'left');
  T(s.name + '  ·  ' + cls.en, 8, 326, 16, '#ddd', 'left', BODY);
  ctx.restore();
  // 마지막 프레임 번쩍임
  if (t >= D - 6) { ctx.globalAlpha = (t - (D - 6)) / 6 * 0.25; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
