'use strict';
// ===== 도감 · 기록 · 업적 =====
let archPrev = 'title';
const AR = { tab: 0, mi: 0, bi: 0, scroll: 0, ai: 0, t: 0 };
const AR_TABS = [['1', 'MONSTERS', '몬스터'], ['2', 'BOSSES', '보스'], ['3', 'RECORDS', '기록'], ['4', 'ACHIEVE', '업적']];
const monKeys = () => Object.keys(ETYPES);
function archiveOpen(prev) { archPrev = prev; state = 'archive'; AR.t = 0; sfx('ui'); }
function archiveLogic() {
  AR.t++;
  if (AU.level !== 0) musicSet(0);
  for (let i = 0; i < 4; i++) if (pressed['Digit' + (i + 1)]) { AR.tab = i; sfx('ui'); }
  if (pressed.Tab || pressed.Escape) { state = archPrev; sfx('ui'); return; }
  const n = AR.tab === 0 ? monKeys().length : AR.tab === 1 ? DUNGEONS.length : 0, cols = 5;
  const key = AR.tab === 0 ? 'mi' : 'bi';
  if (AR.tab <= 1) {
    if (pressed.ArrowRight) { AR[key] = (AR[key] + 1) % n; sfx('ui'); }
    if (pressed.ArrowLeft) { AR[key] = (AR[key] + n - 1) % n; sfx('ui'); }
    if (pressed.ArrowDown) { AR[key] = Math.min(n - 1, AR[key] + cols); sfx('ui'); }
    if (pressed.ArrowUp) { AR[key] = Math.max(0, AR[key] - cols); sfx('ui'); }
  } else if (AR.tab === 3) {
    if (pressed.ArrowDown) { AR.ai = Math.min(ACH.length - 1, AR.ai + 1); sfx('ui'); }
    if (pressed.ArrowUp) { AR.ai = Math.max(0, AR.ai - 1); sfx('ui'); }
    AR.scroll = clamp(AR.ai - 4, 0, Math.max(0, ACH.length - 9));
  }
}
// ── 도감용 스프라이트 그리기 (게임 월드 없이 그리기 위해 임시 S/P 사용)
function withDummy(fn) {
  const sp = S, pp = P;
  S = { t: AR.t, parts: [], cam: 0 }; if (!P) P = { x: 0, y: 0, w: 24, h: 54, facing: 1 };
  try { fn(); } finally { S = sp; P = pp; }
}
function drawCodexMon(key, bx, by, sc) {
  const t = ETYPES[key], e = { type: key, def: t, x: 0, y: 0, w: t.w, h: t.h, vx: 0, vy: 0, kbv: 0, hp: 1, maxhp: 1, face: 1, ph: 1, flash: 0, stun: 0, slow: 0, poison: 0, onGround: true, boss: false };
  ctx.save(); ctx.translate(bx - t.w * sc / 2, by - t.h * sc); ctx.scale(sc, sc);
  withDummy(() => drawEnemy(e)); ctx.restore();
}
function drawCodexBoss(B, bx, by, sc) {
  const e = { type: 'boss', boss: true, def: B, x: 0, y: 0, w: B.w, h: B.h, vx: 0, vy: 0, hp: 1, maxhp: 1, face: -1, ph: 0, flash: 0, stun: 0, slow: 0, poison: 0, act: null, tele: false, barrier: false, phase: 0, minions: [] };
  ctx.save(); ctx.translate(bx - B.w * sc / 2, by - B.h * sc); ctx.scale(sc, sc);
  withDummy(() => drawEnemy(e)); ctx.restore();
}
function drawArchive() {
  UH.length = 0;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 0.5; ctx.drawImage(SPLAT, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 56); ctx.fillStyle = PINK; ctx.fillRect(0, 0, 10, 56); ctx.fillRect(0, 53, W, 3);
  T('ARCHIVE', 26, 42, 34, '#fff');
  AR_TABS.forEach((tb, i) => {
    const x = 214 + i * 138, on = AR.tab === i;
    hudSlant(x, 12, 128, 34, 12, on ? PINK : '#2e2e33'); T(tb[0], x + 12, 35, 15, on ? '#fff' : '#777'); T(tb[1], x + 30, 35, 16, '#fff'); T(tb[2], x + 100, 34, 10, on ? '#fff' : '#888', 'left', BODY);
    uhit(x - 6, 12, 128, 34, () => { AR.tab = i; }, () => {}, () => AR.tab === i);
  });
  const ach = Object.keys(SAVE.ach).length;
  tag(`${ach} / ${ACH.length}`, W - 16, 38, 20, PINK, '#fff', DISPLAY, 'right'); T('ACH', W - 100, 20, 10, '#aaa', 'left');
  if (AR.tab === 0) drawArchMon(); else if (AR.tab === 1) drawArchBoss(); else if (AR.tab === 2) drawArchRecords(); else drawArchAch();
  ctx.fillStyle = INK; ctx.fillRect(0, 508, W, 32); ctx.fillStyle = PINK; ctx.fillRect(0, 508, W, 3);
  let hx = 14; for (const [k, tx] of [['←→↑↓', '선택'], ['1~4', '탭 전환'], ['Tab/Esc', '닫기']]) { hx += keycap(k, hx, 530) + 4; T(tx, hx, 529, 12, '#ddd', 'left', BODY); ctx.font = `12px ${BODY}`; hx += ctx.measureText(tx).width + 18; }
}
function drawArchMon() {
  const keys = monKeys(), cw = 176, ch = 112;
  keys.forEach((k, i) => {
    const x = 22 + (i % 5) * 186, y = 68 + Math.floor(i / 5) * 122, sel = AR.mi === i, seen = SAVE.seen[k];
    ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 3, cw + 6, ch + 6); ctx.fillStyle = seen ? PAPER : '#2a2a2e'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = HALF; ctx.globalAlpha = 0.12; ctx.fillRect(x, y, cw, ch); ctx.globalAlpha = 1;
    if (seen) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, cw, ch - 20); ctx.clip();
      const t = ETYPES[k], sc = Math.min(2.4, 62 / Math.max(t.w, t.h) * 1.6); drawCodexMon(k, x + cw / 2, y + ch - 30 - (t.ai === 'fly' ? 6 : 0), sc); ctx.restore();
      ctx.fillStyle = INK; ctx.fillRect(x, y + ch - 20, cw, 20); T(MON_LORE[k] ? MON_LORE[k][0] : ETYPES[k].name, x + 8, y + ch - 6, 13, '#fff', 'left', BODY);
      const kc = SAVE.mon[k] || 0; T('×' + kc, x + cw - 8, y + ch - 6, 13, PINK, 'right');
    } else { T('?', x + cw / 2, y + 62, 64, '#555', 'center'); ctx.fillStyle = '#16161a'; ctx.fillRect(x, y + ch - 20, cw, 20); T('???', x + 8, y + ch - 6, 13, '#777', 'left', BODY); }
    if (sel) { const p = 2 + Math.sin(AR.t * 0.2); ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.strokeRect(x - 3 - p, y - 3 - p, cw + 6 + p * 2, ch + 6 + p * 2); }
    uhit(x, y, cw, ch, () => { AR.mi = i; }, () => {}, () => AR.mi === i);
  });
  const k = keys[AR.mi], t = ETYPES[k], seen = SAVE.seen[k], dy = 436;
  ctx.fillStyle = INK; ctx.fillRect(22, dy, 916, 66); ctx.fillStyle = PINK; ctx.fillRect(22, dy, 7, 66);
  if (seen) {
    T(MON_LORE[k][0], 44, dy + 28, 24, '#fff', 'left', BODY); T(k.toUpperCase(), 44, dy + 50, 12, PINK);
    ctx.font = `13px ${BODY}`; wrapT(MON_LORE[k][1], 210, dy + 26, 480, 18, 13, '#ccc');
    T('HP ' + t.hp, 730, dy + 26, 13, '#fff', 'left', BODY); T('ATK ' + t.dmg, 730, dy + 46, 13, '#fff', 'left', BODY); T('처치 ' + (SAVE.mon[k] || 0), 830, dy + 26, 13, PINK, 'left', BODY);
    T({ walk: '지상 근접', fly: '비행', shoot: '원거리' }[t.ai] || '', 830, dy + 46, 13, '#aaa', 'left', BODY);
  } else T('아직 조우하지 못한 몬스터입니다.', 44, dy + 40, 16, '#888', 'left', BODY);
}
function drawArchBoss() {
  const cw = 176, ch = 150;
  DUNGEONS.forEach((D, i) => {
    const x = 22 + (i % 5) * 186, y = 68 + Math.floor(i / 5) * 160, sel = AR.bi === i, B = D.boss, seen = SAVE.seen[B.shape], kill = SAVE.boss[B.shape] || 0;
    ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 3, cw + 6, ch + 6); ctx.fillStyle = seen ? PAPER : '#2a2a2e'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = HALF; ctx.globalAlpha = 0.12; ctx.fillRect(x, y, cw, ch); ctx.globalAlpha = 1;
    ctx.fillStyle = INK; ctx.fillRect(x, y, 34, 24); T(String(i + 1), x + 17, y + 20, 18, '#fff', 'center');
    if (seen) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y + 2, cw, ch - 22); ctx.clip(); const sc = Math.min(0.9, 96 / Math.max(B.w, B.h)); drawCodexBoss(B, x + cw / 2, y + ch - 26, sc); ctx.restore();
      ctx.fillStyle = INK; ctx.fillRect(x, y + ch - 22, cw, 22); T(B.name, x + 8, y + ch - 6, 13, '#fff', 'left', BODY);
      if (kill) { ctx.fillStyle = PINK; ctx.fillRect(x + cw - 34, y, 34, 24); T('✔', x + cw - 17, y + 19, 18, '#fff', 'center'); }
    } else { T('?', x + cw / 2, y + 96, 70, '#555', 'center'); ctx.fillStyle = '#16161a'; ctx.fillRect(x, y + ch - 22, cw, 22); T('???', x + 8, y + ch - 6, 13, '#777', 'left', BODY); }
    if (sel) { const p = 2 + Math.sin(AR.t * 0.2); ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.strokeRect(x - 3 - p, y - 3 - p, cw + 6 + p * 2, ch + 6 + p * 2); }
    uhit(x, y, cw, ch, () => { AR.bi = i; }, () => {}, () => AR.bi === i);
  });
  const D = DUNGEONS[AR.bi], B = D.boss, seen = SAVE.seen[B.shape], dy = 394;
  ctx.fillStyle = INK; ctx.fillRect(22, dy, 916, 108); ctx.fillStyle = PINK; ctx.fillRect(22, dy, 7, 108);
  if (seen) {
    T('STAGE ' + (AR.bi + 1) + ' · ' + D.en, 44, dy + 24, 13, PINK); T(B.name, 44, dy + 60, 32, '#fff', 'left', BODY);
    ctx.font = `13px ${BODY}`; wrapT(BOSS_LORE[B.shape][1], 44, dy + 84, 420, 18, 13, '#ccc');
    const rows = [['HP', B.hp], ['ATK', B.dmg], ['PATTERN', B.pat.length + '종'], ['처치', SAVE.boss[B.shape] || 0]];
    rows.forEach((r, i) => { T(r[0], 520 + (i % 2) * 200, dy + 30 + Math.floor(i / 2) * 36, 11, '#888'); T(String(r[1]), 520 + (i % 2) * 200, dy + 50 + Math.floor(i / 2) * 36, 20, '#fff'); });
    const pn = { charge: '돌진', slam: '내려찍기', fan: '탄막', summon: '소환', rain: '낙하', leap: '도약', erupt: '분출', barrage: '링 탄막', rockfall: '낙석' };
    T('패턴: ' + [...new Set(B.pat)].map(p => pn[p]).join(' · '), 520, dy + 100, 12, '#aaa', 'left', BODY);
  } else T('아직 조우하지 못한 보스입니다.', 44, dy + 60, 18, '#888', 'left', BODY);
}
function drawArchRecords() {
  const rows = [
    ['TOTAL KILLS', SAVE.kills], ['BOSSES SLAIN', Object.keys(SAVE.boss).length + ' / ' + DUNGEONS.length], ['DUNGEONS CLEARED', Object.keys(SAVE.clears).length + ' / ' + DUNGEONS.length], ['DEATHS', SAVE.deaths],
    ['GOLD EARNED', SAVE.gold], ['HIGHEST COMBO', SAVE.maxCombo], ['S RANKS', SAVE.sRanks], ['NO-HIT CLEARS', SAVE.noHit],
    ['CHESTS OPENED', SAVE.chests], ['MIMICS SLAIN', SAVE.mimics], ['AMBUSHES CLEARED', SAVE.ambushes], ['SHRINES USED', SAVE.shrines],
    ['ULTIMATES CAST', SAVE.ults], ['BURNS INFLICTED', SAVE.burns], ['BLEEDS INFLICTED', SAVE.bleeds], ['ITEMS FOUND', sumItems()]
  ];
  rows.forEach((r, i) => {
    const x = 28 + (i % 2) * 462, y = 74 + Math.floor(i / 2) * 44;
    hudSlant(x, y, 200, 34, 12, INK); T(r[0], x + 12, y + 23, 14, '#fff');
    T(String(r[1]), x + 214, y + 28, 28, INK);
  });
  T('ITEMS BY RARITY', 28, 446, 14, PINK);
  RARITY.forEach((R, i) => { const x = 28 + i * 226; ctx.fillStyle = INK; ctx.fillRect(x, 454, 214, 40); ctx.fillStyle = i === 0 ? '#8a8a86' : (i >= 2 ? PINK : '#333'); ctx.fillRect(x, 454, 8, 40); T(R.en, x + 20, 480, 18, '#fff'); T('×' + (SAVE.items[i] || 0), x + 204, 482, 22, '#fff', 'right'); });
  T('난이도별 최고 클리어', 520, 446, 12, '#555', 'left', BODY);
  T(DIFFS.map((d, i) => d.name + ' ' + (SAVE.diffClear[i] || 0)).join('   ·   '), 520, 466, 13, '#222', 'left', BODY);
}
function drawArchAch() {
  const vis = 9, rh = 46;
  for (let k = 0; k < vis; k++) {
    const i = AR.scroll + k; if (i >= ACH.length) break;
    const a = ACH[i], un = !!SAVE.ach[a.id], y = 68 + k * (rh + 4), sel = AR.ai === i, cur = Math.min(a.max, a.cur());
    ctx.fillStyle = INK; ctx.fillRect(20, y - 2, 920, rh + 4); ctx.fillStyle = un ? '#241018' : '#1a1a1e'; ctx.fillRect(22, y, 916, rh);
    ctx.fillStyle = un ? PINK : '#3a3a40'; ctx.fillRect(22, y, 8, rh);
    ctx.fillStyle = un ? PINK : '#2c2c31'; ctx.fillRect(40, y + 6, 34, 34); T(un ? '★' : '🔒', 57, y + 30, un ? 22 : 14, '#fff', 'center', BODY);
    T(a.name, 88, y + 20, 18, un ? '#fff' : '#aaa'); T(a.desc, 88, y + 38, 12, un ? '#ddd' : '#777', 'left', BODY);
    ctx.fillStyle = '#000'; ctx.fillRect(560, y + 15, 250, 14); ctx.fillStyle = '#3a3a40'; ctx.fillRect(562, y + 17, 246, 10); ctx.fillStyle = un ? PINK : '#8a8a86'; ctx.fillRect(562, y + 17, 246 * cur / a.max, 10);
    T(un ? 'DONE' : `${Math.floor(cur)} / ${a.max}`, 920, y + 29, 14, un ? PINK : '#bbb', 'right');
    if (sel) { ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.strokeRect(19, y - 3, 922, rh + 6); }
  }
  T(`${AR.scroll + 1}-${Math.min(ACH.length, AR.scroll + vis)} / ${ACH.length}`, 940, 500, 11, '#555', 'right', BODY);
}
