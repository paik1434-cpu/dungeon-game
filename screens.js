'use strict';
// ===== 던전 선택 지도 / 스테이지 클리어 결과 / 게임오버 =====
let mapSel = 0, mapT = 0, mapMsg = 0, deadSel = 0, deadQuote = '', resT = 0, clearInfo = null;
const SEG_LABEL = { pit: '구덩이', spikes: '가시 바닥', crumble: '붕괴 발판', movers: '이동 발판', geyser: '간헐천', rock: '낙석', ice: '얼음 바닥', tower: '높은 발판' };
const REC_LV = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28];
const NODES = [[70, 316], [160, 218], [250, 316], [340, 204], [430, 316], [520, 212], [610, 312], [700, 200], [790, 310], [880, 190]];
const QUOTES = ['어둠은 아직 끝나지 않았다.', '쓰러져도, 다시 일어난다.', '다음엔 더 깊이 내려가라.', '그림자가 너를 삼켰다.', '피로 쓴 교훈은 오래 남는다.'];
const ease3 = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
function progress() { if (!P.unlocked) P.unlocked = 0; if (!P.ranks) P.ranks = {}; }
function fmtTime(s) { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

// ── 지도
function mapLogic() {
  mapT++; if (mapMsg > 0) mapMsg--; progress();
  if (AU.level !== 0) musicSet(0);
  if (pressed.ArrowRight) { mapSel = Math.min(DUNGEONS.length - 1, mapSel + 1); sfx('ui'); }
  if (pressed.ArrowLeft) { mapSel = Math.max(0, mapSel - 1); sfx('ui'); }
  if (pressed.ArrowUp) cycleDiff(1);
  if (pressed.ArrowDown) cycleDiff(-1);
  if (pressed.Enter || pressed.Space) enterDungeon(mapSel);
  if (pressed.Escape) { state = 'select'; sfx('ui'); }
  if (pressed.KeyC) archiveOpen('map');
}
function enterDungeon(i) {
  progress();
  if (i > P.unlocked) { mapMsg = 70; sfx('hurt'); return; }
  sfx('confirm'); startStage(i);
}
function cycleDiff(d) {
  const n = clamp((P.diff === undefined ? 1 : P.diff) + d, 0, DIFFS.length - 1);
  if (n === P.diff) return;
  P.diff = n; SAVE.diff = n; saveMark(); sfx('ui');
}
function drawMap() {
  UH.length = 0; progress();
  const t = mapT, df = DIFFS[P.diff === undefined ? 1 : P.diff];
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.9; ctx.drawImage(SPLAT, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = HALF; ctx.globalAlpha = 0.14; ctx.fillRect(0, 300, W, 200); ctx.globalAlpha = 1;
  // 헤더
  hudSlant(22, 22, 330, 40, 16, INK); ctx.fillStyle = PINK; ctx.fillRect(8, 22, 6, 40); T('SELECT DUNGEON', 40, 52, 28, '#fff'); T('던전 지도', 362, 50, 16, INK, 'left', BODY);
  tag('◆ ' + P.gold, W - 16, 52, 24, PINK, '#fff', DISPLAY, 'right'); ctx.font = `24px ${DISPLAY}`; const gw = ctx.measureText('◆ ' + P.gold).width + 12;
  tag('Lv.' + P.lv, W - 16 - gw - 10, 52, 24, INK, '#fff', DISPLAY, 'right');
  // 난이도 선택
  hudSlant(W - 320, 70, 300, 32, 12, INK); T('DIFFICULTY', W - 308, 92, 13, PINK, 'left');
  T('◀', W - 176, 93, 15, '#fff', 'center'); T(df.name, W - 108, 94, 19, '#fff', 'center'); T('▶', W - 40, 93, 15, '#fff', 'center');
  uhit(W - 196, 70, 40, 32, () => {}, () => cycleDiff(-1), () => true); uhit(W - 60, 70, 40, 32, () => {}, () => cycleDiff(1), () => true);
  // 길
  ctx.lineCap = 'round';
  for (let i = 0; i < NODES.length - 1; i++) {
    const [x0, y0] = NODES[i], [x1, y1] = NODES[i + 1], mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + (i % 2 ? -34 : 34), open = i + 1 <= P.unlocked;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = open ? PINK : '#bdbcb5'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -t * 0.6; ctx.stroke(); ctx.setLineDash([]);
  }
  // 노드
  DUNGEONS.forEach((D, i) => {
    const [x, y] = NODES[i], locked = i > P.unlocked, rank = P.ranks[i], sel = mapSel === i, r = 27;
    const k = ease3((t - i * 4) / 14);
    ctx.save(); ctx.translate(x, y); ctx.scale(0.4 + 0.6 * k, 0.4 + 0.6 * k); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, r + 7, r * 0.9, 6, 0, 0, 7); ctx.fill();
    if (sel) { const p = 5 + Math.sin(t * 0.18) * 3; ctx.strokeStyle = PINK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r + 9 + p, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, 7); ctx.fill();
    ctx.fillStyle = locked ? '#2a2a2e' : rank ? INK : PINK; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.strokeStyle = locked ? '#555' : '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, 7); ctx.stroke();
    if (locked) { ctx.fillStyle = '#777'; ctx.fillRect(-8, -1, 16, 13); ctx.strokeStyle = '#777'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, -2, 6, Math.PI, 0); ctx.stroke(); }
    else T(String(i + 1), 0, 11, 30, '#fff', 'center');
    if (rank) { ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r - 3, -r + 3, 12, 0, 7); ctx.fill(); ctx.stroke(); T(rank, r - 3, -r + 9, 16, '#fff', 'center'); }
    ctx.restore();
    if (sel) { ctx.globalAlpha = k; T(D.en, x, y + r + 24, 16, INK, 'center'); T('★'.repeat(D.stars), x, y + r + 40, 12, PINK, 'center'); ctx.globalAlpha = 1; }
    uhit(x - r - 6, y - r - 6, (r + 6) * 2, (r + 6) * 2, () => { mapSel = i; }, () => enterDungeon(i), () => mapSel === i);
  });
  // 플레이어 토큰
  { const [x, y] = NODES[mapSel], b = Math.sin(t * 0.1) * 4; drawThumbBox(P.cls.id, x - 28, y - 112 + b, 56); ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(x - 9, y - 46 + b); ctx.lineTo(x + 9, y - 46 + b); ctx.lineTo(x, y - 36 + b); ctx.closePath(); ctx.fill(); }
  // 정보 패널
  const D = DUNGEONS[mapSel], locked = mapSel > P.unlocked, ad = adaptFor(mapSel);
  hudSlant(22, 404, 936, 98, 22, 'rgba(11,11,13,.95)'); ctx.fillStyle = PINK; ctx.fillRect(0, 404, 8, 98);
  T('STAGE ' + (mapSel + 1) + ' / ' + DUNGEONS.length, 40, 428, 12, PINK); T(D.en, 40, 466, 32, '#fff'); T(D.name, 42, 488, 14, '#ccc', 'left', BODY);
  if (locked) { T('LOCKED', 360, 456, 34, '#777'); T('이전 던전을 클리어하면 열립니다', 360, 482, 14, '#999', 'left', BODY); }
  else {
    const hz = [...new Set(D.segs.map(s => SEG_LABEL[s]).filter(Boolean))];
    const col = (x, label, val, w) => { T(label, x, 428, 10, '#888'); wrapT(val, x, 448, w, 16, 12, '#fff'); };
    col(318, 'BOSS', D.boss.name, 120); col(444, 'ENEMIES', D.types.map(k => ETYPES[k].name).filter((v, i, a) => a.indexOf(v) === i).join(', '), 190); col(646, 'HAZARDS · EVENTS', hz.concat(['상자', '제단', '매복']).slice(0, 9).join(' · '), 200);
    T('REC LV', 872, 428, 10, '#888'); T('Lv.' + REC_LV[mapSel], 872, 456, 24, P.lv >= REC_LV[mapSel] ? '#fff' : PINK);
    const rk = P.ranks[mapSel]; T('BEST', 872, 480, 10, '#888'); T(rk || '—', 912, 482, 16, rk ? PINK : '#666');
    const hpm = D.hpMul * df.hp * ad.hp, dmm = D.dmgMul * df.dmg * ad.dmg;
    T(`적 체력 ×${hpm.toFixed(1)}  피해 ×${dmm.toFixed(1)}`, 318, 494, 12, ad.r > 1.15 ? PINK : '#bbb', 'left', BODY);
    if (ad.r > 1.15) T('▲ 적응형 강화', 560, 494, 12, PINK, 'left', BODY);
  }
  if (mapMsg > 0) { ctx.globalAlpha = Math.min(1, mapMsg / 20); hudSlant(W / 2 - 150, 366, 300, 30, 12, PINK); T('아직 잠겨 있습니다', W / 2, 388, 18, '#fff', 'center', BODY); ctx.globalAlpha = 1; }
  ctx.fillStyle = INK; ctx.fillRect(0, 508, W, 32); ctx.fillStyle = PINK; ctx.fillRect(0, 508, W, 3);
  let hx = 14; for (const [k, tx] of [['←→', '던전 선택'], ['↑↓', '난이도'], ['Enter', '입장'], ['Tab', 'ARMORY'], ['C', '도감·업적'], ['Esc', '캐릭터 선택']]) { hx += keycap(k, hx, 530) + 4; T(tx, hx, 529, 12, '#ddd', 'left', BODY); ctx.font = `12px ${BODY}`; hx += ctx.measureText(tx).width + 16; }
}
function drawThumbBox(id, x, y, s) { ctx.fillStyle = '#000'; ctx.fillRect(x - 4, y - 4, s + 8, s + 8); ctx.fillStyle = PINK; ctx.fillRect(x - 2, y - 2, s + 4, s + 4); ctx.fillStyle = PAPER; ctx.fillRect(x, y, s, s); drawThumb(id, x, y, s, true); }

// ── 스테이지 클리어
function onClear() {
  progress();
  const D = S.D, sec = S.t / 60, par = D.len / 120 + 45, hits = S.hits || 0;
  const score = 100 - hits * 6 - Math.max(0, (sec - par) / 3), ri = score >= 88 ? 0 : score >= 70 ? 1 : score >= 50 ? 2 : 3, rank = 'SABC'[ri];
  const bonus = [150, 90, 40, 0][ri] * (stageIdx + 1); P.gold += bonus;
  SAVE.clears[stageIdx] = (SAVE.clears[stageIdx] && 'SABC'.indexOf(SAVE.clears[stageIdx]) < 'SABC'.indexOf(rank)) ? SAVE.clears[stageIdx] : rank;
  if (rank === 'S') SAVE.sRanks++; if (hits === 0) SAVE.noHit++;
  { const dd = P.diff === undefined ? 1 : P.diff; SAVE.diffClear[dd] = Math.max(SAVE.diffClear[dd] || 0, stageIdx + 1); } SAVE.gold += bonus; saveMark();
  const prev = P.ranks[stageIdx]; if (!prev || 'SABC'.indexOf(rank) < 'SABC'.indexOf(prev)) P.ranks[stageIdx] = rank;
  P.unlocked = Math.max(P.unlocked, Math.min(stageIdx + 1, DUNGEONS.length - 1));
  clearInfo = { sec, kills: S.kills || 0, combo: combo.best, hits, gold: S.goldGot || 0, bonus, rank, ri, items: (S.itemsGot || []).slice(0, 9), last: stageIdx >= DUNGEONS.length - 1, stamped: false };
  resT = 0; sfx('clear'); achCheck();
}
function clearLogic() {
  resT++;
  if (pressed.Enter || pressed.Space) {
    if (resT < 70) resT = 100;
    else { sfx('confirm'); if (clearInfo.last) { state = 'title'; TT.page = 'main'; } else { state = 'map'; mapSel = Math.min(stageIdx + 1, DUNGEONS.length - 1); mapT = 0; } }
  }
}
function drawClear() {
  const I = clearInfo, t = resT, D = S.D;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 0.9; ctx.drawImage(SPLAT, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = HALF; ctx.globalAlpha = 0.14; ctx.fillRect(0, 280, 560, 230); ctx.globalAlpha = 1;
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(610, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(480, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(598, 0); ctx.lineTo(616, 0); ctx.lineTo(486, H); ctx.lineTo(468, H); ctx.closePath(); ctx.fill();
  if (artOk(P.cls.id)) { const im = ART[P.cls.id], hh = 520, ww = im.naturalWidth * hh / im.naturalHeight; withMultiply(() => { ctx.globalAlpha = ease3(t / 18); ctx.drawImage(im, 580 + (1 - ease3(t / 22)) * 200, 28, ww, hh); }); }
  // 타이틀
  const k0 = ease3(t / 16);
  ctx.save(); ctx.translate(-(1 - k0) * 160, 0);
  hudSlant(22, 24, 290, 36, 14, INK); ctx.fillStyle = PINK; ctx.fillRect(8, 24, 6, 36); T(I.last ? 'FINAL STAGE' : 'STAGE ' + (stageIdx + 1), 40, 50, 24, '#fff');
  T(I.last ? 'ALL CLEAR' : 'CLEARED', 24, 160, I.last ? 104 : 118, INK);
  hudSlant(22, 176, 470, 40, 14, PINK); T(D.en, 40, 205, 28, '#fff'); T(DIFFS[P.diff === undefined ? 1 : P.diff].name, 470, 204, 18, '#fff', 'right');
  ctx.restore();
  // 기록
  const rows = [['TIME', fmtTime(I.sec)], ['KILLS', I.kills], ['MAX COMBO', I.combo], ['HITS TAKEN', I.hits], ['GOLD', '◆ ' + I.gold]], cnt = clamp(t / 60, 0, 1);
  rows.forEach((r, i) => {
    const y = 242 + i * 40, k = ease3((t - 10 - i * 6) / 12); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(-(1 - k) * 100, 0);
    hudSlant(22, y, 190, 32, 12, INK); T(r[0], 38, y + 23, 17, '#fff');
    const v = typeof r[1] === 'number' ? Math.round(r[1] * cnt) : r[1];
    T(String(v), 232, y + 28, 30, INK); ctx.restore();
  });
  // 랭크 도장
  if (t > 70) {
    if (!I.stamped) { I.stamped = true; sfx('boom'); addShake(10); }
    const k = ease3((t - 70) / 10), sc = 3.2 - 2.2 * k;
    ctx.save(); ctx.translate(450, 330); ctx.rotate(-0.16); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, k * 1.5);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, 78, 0, 7); ctx.fill(); ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fill();
    ctx.strokeStyle = PINK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 60, 0, 7); ctx.stroke();
    T('RANK', 0, -34, 18, INK, 'center'); T(I.rank, 0, 48, 108, PINK, 'center');
    ctx.restore();
  }
  // 보상
  const k5 = ease3((t - 50) / 14);
  if (k5 > 0) {
    ctx.globalAlpha = k5; hudSlant(22, 452, 118, 26, 10, INK); T('BONUS', 36, 471, 15, '#fff'); T('◆ +' + I.bonus, 150, 472, 22, PINK);
    T('LOOT', 280, 471, 15, INK); I.items.forEach((it, i) => drawItemIcon(it, 338 + i * 40, 448, 34)); if (!I.items.length) T('—', 340, 472, 18, '#999');
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = INK; ctx.fillRect(0, 508, W, 32); ctx.fillStyle = PINK; ctx.fillRect(0, 508, W, 3);
  let hx = 14; for (const [k, tx] of [['Enter', I.last ? '타이틀로' : '던전 지도로'], ['Tab', 'ARMORY (보상으로 장비·스킬 강화)']]) { hx += keycap(k, hx, 530) + 4; T(tx, hx, 529, 12, '#ddd', 'left', BODY); ctx.font = `12px ${BODY}`; hx += ctx.measureText(tx).width + 18; }
}

// ── 게임오버
function deadLogic() {
  deadT++;
  if (deadT === 1) deadQuote = choice(QUOTES);
  if (deadT < 40) return;
  if (pressed.ArrowUp) { deadSel = (deadSel + 3) % 4; sfx('ui'); }
  if (pressed.ArrowDown) { deadSel = (deadSel + 1) % 4; sfx('ui'); }
  if (pressed.Enter || pressed.Space) deadAct(deadSel);
  if (pressed.Escape) deadAct(2);
}
function deadAct(i) {
  sfx('confirm');
  if (i === 0) reviveAtCheckpoint();
  else if (i === 1) { menuPrev = 'dead'; state = 'menu'; menuOpen(0); }
  else if (i === 2) { state = 'map'; mapT = 0; progress(); mapSel = Math.min(stageIdx, P.unlocked); musicSet(0); }
  else { state = 'title'; TT.page = 'main'; }
}
function drawDead() {
  UH.length = 0;
  const t = deadT, a = clamp(t / 30, 0, 1);
  ctx.fillStyle = `rgba(8,6,10,${0.84 * a})`; ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H); vg.addColorStop(0, 'rgba(255,42,100,0)'); vg.addColorStop(1, `rgba(255,42,100,${0.3 * a})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // 위에서 흘러내리는 먹물
  ctx.strokeStyle = 'rgba(255,42,100,.55)'; ctx.fillStyle = 'rgba(255,42,100,.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const x = srand(i * 5) * W, len = (30 + srand(i + 9) * 240) * ease3(t / 60); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke(); ctx.beginPath(); ctx.arc(x, len, 5, 0, 7); ctx.fill(); }
  // 거대 타이포
  const sc = 0.88 + 0.12 * ease3(t / 22);
  ctx.save(); ctx.translate(W / 2, 168); ctx.scale(sc, sc); ctx.globalAlpha = a;
  hudSlant(-360, -118, 740, 156, 34, PINK);
  T('YOU DIED', -6, 30, 150, '#000', 'center'); T('YOU DIED', 0, 24, 150, '#fff', 'center');
  ctx.restore();
  ctx.globalAlpha = a; T(deadQuote, W / 2, 238, 18, '#ddd', 'center', BODY);
  // 기록
  const prog = clamp(P.x / S.arenaL, 0, 1), rows = [['PROGRESS', S.locked ? 'BOSS' : Math.round(prog * 100) + '%'], ['KILLS', S.kills || 0], ['TIME', fmtTime(S.t / 60)], ['GOLD', '◆ ' + P.gold]];
  rows.forEach((r, i) => { const x = 200 + i * 150; T(r[0], x, 276, 11, '#888', 'center'); T(String(r[1]), x, 304, 28, '#fff', 'center'); });
  // 선택지
  const opts = [[S.lastCp ? 'RESPAWN' : 'RETRY', S.lastCp ? '체크포인트에서 부활 (골드 -10%)' : '던전 재도전'], ['ARMORY', '상점 · 장비 · 스킬 강화'], ['MAP', '던전 지도로'], ['TITLE', '타이틀로']];
  opts.forEach((o, i) => {
    const y = 330 + i * 44, on = deadSel === i && t >= 40, off = on ? 12 : 0;
    ctx.globalAlpha = a * (t >= 40 ? 1 : 0.4); hudSlant(300 + off, y, 380, 38, 14, on ? PINK : 'rgba(30,28,34,.95)');
    T(o[0], 322 + off, y + 28, 24, '#fff'); T(o[1], 672 + off, y + 25, 12, on ? '#fff' : '#aaa', 'right', BODY);
    ctx.globalAlpha = 1;
    uhit(300, y, 400, 38, () => { deadSel = i; }, () => { if (deadT >= 40) deadAct(i); }, () => deadSel === i);
  });
  T('↑↓ 선택  ·  Enter 확인', W / 2, 520, 12, '#777', 'center', BODY);
}
