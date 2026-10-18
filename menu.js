'use strict';
// ===== ARMORY: 스킬 / 스탯 / 장비 / 상점 메뉴 (Tab, 상점은 NPC 앞에서 Enter) =====
const STAT_DEFS = [
  { id: 'basic', en: 'BASIC POWER',  name: '기본공격 강화', desc: '기본 공격(A) 피해 +10%', max: 10 },
  { id: 'aspd',  en: 'ATTACK SPEED', name: '공격 속도',     desc: '기본 공격 간격 -4%', max: 10 },
  { id: 'skill', en: 'SKILL POWER',  name: '스킬 강화',     desc: '스킬 피해 +8%', max: 10 },
  { id: 'cdr',   en: 'COOLDOWN',     name: '쿨타임 감소',   desc: '스킬 쿨타임 -4%', max: 10 },
  { id: 'move',  en: 'SPEED',        name: '속도 강화',     desc: '이동 속도 +5%', max: 10 },
  { id: 'dodge', en: 'EVASION',      name: '회피 확률',     desc: '피격을 회피할 확률 +3% (최대 50%)', max: 10 },
  { id: 'crit',  en: 'CRITICAL',     name: '치명타 확률',   desc: '치명타 확률 +2%', max: 10 },
  { id: 'hp',    en: 'VITALITY',     name: '체력 강화',     desc: '최대 체력 +15', max: 10 }
];
const TABS = [['1', 'SKILLS', '스킬'], ['2', 'STATS', '스탯'], ['3', 'GEAR', '장비'], ['4', 'SHOP', '상점']];
function tierSkills(r) { return P.cls.skills.slice(r * 4, r * 4 + 4); }
const MN = { tab: 0, row: 0, col: 0, srow: 0, gz: 'bag', gi: 0, shi: 0, msg: '', msgT: 0, shopOK: false, hits: [], t: 0 };
const CARD = { x0: 118, dx: 205, w: 197, y0: 68, dy: 70, h: 62 };
const SROW = { x: 24, y0: 70, dy: 50, h: 44, w: 912 };
const skillUpCost = (s, lv) => Math.round(s.price * 0.5 * lv + 30);
const shopRerollCost = () => 100 + stageIdx * 60;

function menuOpen(tab = 0) {
  MN.tab = tab; MN.msg = ''; MN.msgT = 0; MN.t = 0; MN.shopOK = !!(S && S.nearMerch);
  if (tab === 3 && !MN.shopOK) MN.tab = 0;
  MN.row = 0; const id = P.slots[0]; MN.col = Math.max(0, tierSkills(0).findIndex(s => s.id === id));
  MN.gz = 'bag'; MN.gi = 0; MN.shi = 0;
}
function menuMsg(s) { MN.msg = s; MN.msgT = 100; }
function menuAct(row, col) {
  const s = tierSkills(row)[col];
  if (P.lv < s.lv && !P.owned[s.id]) { menuMsg('레벨 ' + s.lv + ' 이상 필요합니다'); sfx('hurt'); return; }
  if (P.slots[row] === s.id) { menuMsg('이미 장착 중'); sfx('ui'); return; }
  if (P.owned[s.id]) { P.slots[row] = s.id; menuMsg(`${s.name} 장착`); sfx('confirm'); return; }
  if (P.gold >= s.price) { P.gold -= s.price; P.owned[s.id] = true; P.skillLv[s.id] = 1; P.slots[row] = s.id; menuMsg(`${s.name} 구매 · 장착!`); sfx('levelup'); return; }
  menuMsg(`골드가 부족합니다 (${s.price - P.gold}G 부족)`); sfx('hurt');
}
function upgradeSkill(s) {
  if (!P.owned[s.id]) { menuMsg('먼저 스킬을 구매하세요'); sfx('ui'); return; }
  const lv = P.skillLv[s.id] || 1;
  if (lv >= 5) { menuMsg('최대 강화입니다'); sfx('ui'); return; }
  const c = skillUpCost(s, lv);
  if (P.gold < c) { menuMsg(`골드가 부족합니다 (${c - P.gold}G 부족)`); sfx('hurt'); return; }
  P.gold -= c; P.skillLv[s.id] = lv + 1; menuMsg(`${s.name} Lv.${lv + 1} 강화!`); sfx('levelup');
}
function statAdd(i) {
  const d = STAT_DEFS[i];
  if (P.points <= 0) { menuMsg('스탯 포인트가 없습니다 (레벨업 시 +3)'); sfx('ui'); return; }
  if (P.stats[d.id] >= d.max) { menuMsg('최대 단계입니다'); sfx('ui'); return; }
  P.stats[d.id]++; P.points--; if (d.id === 'hp') P.hp += 15;
  recalcP(); sfx('confirm');
}
function statSub(i) {
  const d = STAT_DEFS[i];
  if (P.stats[d.id] <= 0) return;
  P.stats[d.id]--; P.points++; recalcP(); sfx('ui');
}
function gearEnter() {
  if (MN.gz === 'eq') { const sl = SLOT_ORDER[MN.gi]; if (!P.equip[sl]) return; if (unequipSlot(sl)) { menuMsg('장착 해제'); sfx('ui'); } else menuMsg('가방이 가득 찼습니다'); }
  else { const it = P.bag[MN.gi]; if (!it) return; equipFromBag(MN.gi); menuMsg(it.name + ' 장착'); sfx('confirm'); }
}
function shopBuy(i) {
  const it = S.shop[i];
  if (!it) { menuMsg('품절입니다'); return; }
  if (P.gold < it.price) { menuMsg(`골드가 부족합니다 (${it.price - P.gold}G 부족)`); sfx('hurt'); return; }
  if (P.bag.length >= BAG_MAX) { menuMsg('가방이 가득 찼습니다'); sfx('hurt'); return; }
  P.gold -= it.price; P.bag.push(it); S.shop[i] = null; menuMsg(it.name + ' 구매!'); sfx('levelup');
}
function menuLogic() {
  MN.t++; if (MN.msgT > 0) MN.msgT--;
  if (pressed.Digit1) { MN.tab = 0; sfx('ui'); }
  if (pressed.Digit2) { MN.tab = 1; sfx('ui'); }
  if (pressed.Digit3) { MN.tab = 2; sfx('ui'); }
  if (pressed.Digit4) { if (MN.shopOK) { MN.tab = 3; sfx('ui'); } else { menuMsg('상점 NPC 앞에서 Enter로 열 수 있습니다'); sfx('hurt'); } }
  if (MN.tab === 0) {
    const s = tierSkills(MN.row)[MN.col];
    if (pressed.ArrowUp) { MN.row = (MN.row + 4) % 5; sfx('ui'); }
    if (pressed.ArrowDown) { MN.row = (MN.row + 1) % 5; sfx('ui'); }
    if (pressed.ArrowLeft) { MN.col = (MN.col + 3) % 4; sfx('ui'); }
    if (pressed.ArrowRight) { MN.col = (MN.col + 1) % 4; sfx('ui'); }
    if (pressed.Enter || pressed.Space) menuAct(MN.row, MN.col);
    if (pressed.KeyU) upgradeSkill(s);
    if (pressed.Backspace || pressed.Delete) { if (P.slots[MN.row]) { P.slots[MN.row] = null; menuMsg('장착 해제'); sfx('ui'); } }
  } else if (MN.tab === 1) {
    if (pressed.ArrowUp) { MN.srow = (MN.srow + 7) % 8; sfx('ui'); }
    if (pressed.ArrowDown) { MN.srow = (MN.srow + 1) % 8; sfx('ui'); }
    if (pressed.ArrowRight || pressed.Enter || pressed.Space) statAdd(MN.srow);
    if (pressed.ArrowLeft || pressed.Backspace) statSub(MN.srow);
    if (pressed.KeyX) { for (const d of STAT_DEFS) { P.points += P.stats[d.id]; P.stats[d.id] = 0; } recalcP(); menuMsg('스탯 초기화'); sfx('ui'); }
  } else if (MN.tab === 2) {
    if (MN.gz === 'eq') {
      if (pressed.ArrowUp) { MN.gi = (MN.gi + 2) % 3; sfx('ui'); }
      if (pressed.ArrowDown) { MN.gi = (MN.gi + 1) % 3; sfx('ui'); }
      if (pressed.ArrowRight) { MN.gz = 'bag'; MN.gi = 0; sfx('ui'); }
    } else {
      if (pressed.ArrowLeft) { if (MN.gi % 8 === 0) { MN.gz = 'eq'; MN.gi = Math.min(2, Math.floor(MN.gi / 8)); } else MN.gi--; sfx('ui'); }
      if (pressed.ArrowRight) { MN.gi = Math.min(BAG_MAX - 1, MN.gi + 1); sfx('ui'); }
      if (pressed.ArrowUp) { if (MN.gi >= 8) MN.gi -= 8; sfx('ui'); }
      if (pressed.ArrowDown) { if (MN.gi + 8 < BAG_MAX) MN.gi += 8; sfx('ui'); }
      if (pressed.KeyX) { const it = P.bag[MN.gi]; if (it) { const v = sellFromBag(MN.gi); menuMsg(`${it.name} 판매 +${v}G`); sfx('coin'); } }
    }
    if (pressed.Enter || pressed.Space) gearEnter();
  } else if (MN.tab === 3 && MN.shopOK) {
    if (pressed.ArrowLeft) { MN.shi = (MN.shi + 5) % 6; sfx('ui'); }
    if (pressed.ArrowRight) { MN.shi = (MN.shi + 1) % 6; sfx('ui'); }
    if (pressed.ArrowUp || pressed.ArrowDown) { MN.shi = (MN.shi + 3) % 6; sfx('ui'); }
    if (pressed.Enter || pressed.Space) shopBuy(MN.shi);
    if (pressed.KeyR) {
      const c = shopRerollCost();
      if (P.gold < c) { menuMsg('새로고침 골드가 부족합니다'); sfx('hurt'); } else { P.gold -= c; S.shop = genShop(stageIdx, P.cls.id); menuMsg('상품을 새로 들여왔습니다'); sfx('confirm'); }
    }
  }
  if (pressed.Tab || pressed.Escape) { state = menuPrev; sfx('ui'); }
}
addEventListener('mousedown', ev => {
  if (state !== 'menu') return;
  const r = cv.getBoundingClientRect(), mx = (ev.clientX - r.left) * W / r.width, my = (ev.clientY - r.top) * H / r.height;
  for (let i = MN.hits.length - 1; i >= 0; i--) {
    const h = MN.hits[i];
    if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) { if (h.sel()) h.act(); else { h.go(); sfx('ui'); } return; }
  }
});
function hit(x, y, w, h, sel, go, act) { MN.hits.push({ x, y, w, h, sel, go, act }); }

// ── 공용 그리기
function wrapT(s, x, y, maxW, lh, size, color) {
  ctx.font = `${size}px ${BODY}`; ctx.textAlign = 'left'; ctx.fillStyle = color;
  let line = '';
  for (const ch of s) { if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, y); y += lh; line = ch; } else line += ch; }
  ctx.fillText(line, x, y);
}
function rarityTag(it, x, y, size = 12, align = 'left') { const R = RARITY[it.ri]; return tag(R.en, x, y, size, it.ri >= 2 ? PINK : it.ri === 1 ? '#333' : '#8a8a86', '#fff', DISPLAY, align); }
function menuFooter(pairs) {
  ctx.fillStyle = INK; ctx.fillRect(0, 508, W, 32); ctx.fillStyle = PINK; ctx.fillRect(0, 508, W, 3);
  let x = 18;
  for (const [k, t] of pairs) { x += keycap(k, x, 530) + 4; T(t, x, 529, 12, '#ddd', 'left', BODY); ctx.font = `12px ${BODY}`; x += ctx.measureText(t).width + 18; }
}
function drawSkillCard(s, x, y, selected, row) {
  const equipped = P.slots[row] === s.id, owned = !!P.owned[s.id], afford = P.gold >= s.price, locked = P.lv < s.lv && !owned;
  ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 3, CARD.w + 6, CARD.h + 6);
  ctx.fillStyle = owned ? '#1a1a1e' : PAPER; ctx.fillRect(x, y, CARD.w, CARD.h);
  if (equipped) { ctx.fillStyle = PINK; ctx.fillRect(x, y, 6, CARD.h); }
  ctx.fillStyle = owned ? '#000' : INK; ctx.fillRect(x + 10, y + 9, 44, 44);
  skillIcon(s.ico, x + 32, y + 31, 38, false);
  const fg = owned ? '#fff' : INK;
  T(s.name, x + 62, y + 24, 17, fg, 'left', BODY);
  T(s.en, x + 62, y + 40, 12, owned ? '#bbb' : '#555');
  if (owned) { const lv = P.skillLv[s.id] || 1; for (let k = 0; k < 5; k++) { ctx.fillStyle = k < lv ? PINK : '#444'; ctx.fillRect(x + 62 + k * 9, y + 48, 7, 6); } }
  else T('TIER ' + s.tier + ' · Lv.' + s.lv, x + 62, y + 55, 10, PINK);
  if (equipped) tag('EQUIPPED', x + CARD.w - 4, y + 55, 12, PINK, '#fff', DISPLAY, 'right');
  else if (owned) tag('OWNED', x + CARD.w - 4, y + 55, 12, '#555', '#fff', DISPLAY, 'right');
  else tag('◆ ' + s.price, x + CARD.w - 4, y + 55, 13, afford ? INK : '#999', '#fff', DISPLAY, 'right');
  if (locked) { ctx.fillStyle = 'rgba(239,237,230,.78)'; ctx.fillRect(x, y, CARD.w, CARD.h); tag('LOCKED  Lv.' + s.lv, x + 36, y + 38, 20, INK, '#fff'); }
  if (selected) { const p = 3 + Math.sin(MN.t * 0.2) * 1.5; ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.strokeRect(x - 3 - p, y - 3 - p, CARD.w + 6 + p * 2, CARD.h + 6 + p * 2); }
}

function drawMenu() {
  MN.hits = [];
  ctx.fillStyle = 'rgba(239,237,230,.97)'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.4; ctx.drawImage(SPLAT, 0, 0); ctx.globalAlpha = 1;
  // 헤더
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 56); ctx.fillStyle = PINK; ctx.fillRect(0, 0, 10, 56); ctx.fillRect(0, 53, W, 3);
  T('ARMORY', 26, 42, 34, '#fff');
  TABS.forEach((t, i) => {
    const x = 196 + i * 138, on = MN.tab === i, off = i === 3 && !MN.shopOK;
    hudSlant(x, 12, 128, 34, 12, on ? PINK : off ? '#1d1d21' : '#2e2e33');
    T(t[0], x + 12, 35, 15, on ? '#fff' : '#777'); T(t[1], x + 30, 35, 17, off ? '#555' : '#fff'); T(t[2], x + 98, 34, 11, on ? '#fff' : '#888', 'left', BODY);
    hit(x - 6, 12, 128, 34, () => MN.tab === i, () => { if (i === 3 && !MN.shopOK) menuMsg('상점 NPC 앞에서 Enter로 열 수 있습니다'); else MN.tab = i; }, () => {});
  });
  const gtxt = '◆ ' + P.gold;
  tag(gtxt, W - 16, 38, 24, PINK, '#fff', DISPLAY, 'right'); ctx.font = `24px ${DISPLAY}`; const gw = ctx.measureText(gtxt).width + 12;
  tag('PT ' + P.points, W - 16 - gw - 10, 38, 24, P.points > 0 ? '#fff' : '#555', P.points > 0 ? INK : '#bbb', DISPLAY, 'right');

  if (MN.tab === 0) {
    for (let r = 0; r < 5; r++) {
      const y = CARD.y0 + r * CARD.dy, req = TIER_LV[r], lockedTier = P.lv < req;
      ctx.fillStyle = r === MN.row ? PINK : INK; ctx.fillRect(20, y, 90, CARD.h);
      T(SLOT_LABELS[r], 34, y + 46, 46, '#fff'); T('TIER ' + (r + 1), 74, y + 16, 11, r === MN.row ? '#fff' : PINK);
      T('Lv.' + req + (lockedTier ? ' 잠김' : ''), 74, y + 30, 11, '#ccc', 'left', BODY);
      const eq = P.slots[r] ? SKILLDB[P.slots[r]] : null;
      T(eq ? eq.en.split(' ')[0] : 'EMPTY', 74, y + 56, 10, '#aaa');
      for (let c = 0; c < 4; c++) {
        const s = tierSkills(r)[c], x = CARD.x0 + c * CARD.dx;
        drawSkillCard(s, x, y, MN.row === r && MN.col === c, r);
        hit(x, y, CARD.w, CARD.h, () => MN.row === r && MN.col === c, () => { MN.row = r; MN.col = c; }, () => menuAct(r, c));
      }
    }
    const s = tierSkills(MN.row)[MN.col], py = 428, owned = !!P.owned[s.id], lv = P.skillLv[s.id] || 1;
    ctx.fillStyle = INK; ctx.fillRect(20, py, 916, 76); ctx.fillStyle = PINK; ctx.fillRect(20, py, 7, 76);
    ctx.fillStyle = '#000'; ctx.fillRect(38, py + 8, 60, 60); skillIcon(s.ico, 68, py + 38, 52, false);
    T(s.en, 114, py + 32, 28, '#fff'); T(s.name, 116, py + 50, 14, '#ddd', 'left', BODY);
    wrapT(s.desc, 116, py + 68, 470, 16, 12, '#bbb');
    T('COOLDOWN', 610, py + 24, 10, '#888'); T(s.cd + 's' + (s.dur ? ' +' + (s.dur / 60).toFixed(0) + 's' : ''), 610, py + 50, 22, '#fff');
    T('MP', 710, py + 24, 10, '#888'); T(String(s.mp), 710, py + 50, 22, '#fff');
    T('LEVEL', 760, py + 24, 10, '#888');
    for (let k = 0; k < 5; k++) { ctx.fillStyle = owned && k < lv ? PINK : '#444'; ctx.fillRect(760 + k * 16, py + 32, 12, 14); }
    if (owned && lv < 5) { T('U  강화 ◆' + skillUpCost(s, lv), 760, py + 66, 12, '#fff', 'left', BODY); T('피해 +12% · 쿨 -3%', 850, py + 66, 10, '#aaa', 'left', BODY); }
    else if (owned) T('MAX LEVEL', 760, py + 66, 12, PINK, 'left', BODY);
    else T('Enter  구매 ◆' + s.price, 760, py + 66, 12, P.gold >= s.price ? '#fff' : PINK, 'left', BODY);
    menuFooter([['↑↓←→', '선택'], ['Enter', '구매/장착'], ['U', '스킬 강화'], ['Bksp', '해제'], ['Tab', '닫기']]);
  } else if (MN.tab === 1) {
    T('STAT POINTS', 24, 66, 13, '#555'); T(String(P.points), 130, 68, 22, P.points > 0 ? PINK : '#999');
    T('레벨업마다 +3 포인트 · 회수는 무료', 936, 66, 12, '#555', 'right', BODY);
    STAT_DEFS.forEach((d, i) => {
      const y = SROW.y0 + 12 + i * SROW.dy, sel = i === MN.srow, v = P.stats[d.id];
      ctx.fillStyle = INK; ctx.fillRect(SROW.x - 3, y - 3, SROW.w + 6, SROW.h + 6);
      ctx.fillStyle = sel ? '#1a1a1e' : PAPER; ctx.fillRect(SROW.x, y, SROW.w, SROW.h);
      ctx.fillStyle = sel ? PINK : INK; ctx.fillRect(SROW.x, y, 250, SROW.h);
      T(d.en, SROW.x + 12, y + 26, 22, '#fff'); T(d.name, SROW.x + 12, y + 39, 11, '#eee', 'left', BODY);
      for (let k = 0; k < d.max; k++) { ctx.fillStyle = k < v ? PINK : (sel ? '#444' : '#ccc'); ctx.fillRect(SROW.x + 270 + k * 26, y + 11, 20, 22); }
      T(`Lv.${v}/${d.max}`, SROW.x + 540, y + 29, 18, sel ? '#fff' : INK);
      T(d.desc, SROW.x + 640, y + 28, 13, sel ? '#ddd' : '#333', 'left', BODY);
      if (sel) tag('+', SROW.x + SROW.w - 6, y + 30, 22, PINK, '#fff', DISPLAY, 'right');
      hit(SROW.x, y, SROW.w, SROW.h, () => MN.srow === i, () => { MN.srow = i; }, () => statAdd(i));
    });
    menuFooter([['↑↓', '선택'], ['→/Enter', '투자'], ['←', '회수'], ['X', '전체 초기화'], ['Tab', '닫기']]);
  } else if (MN.tab === 2) {
    T('EQUIPPED', 22, 80, 14, PINK);
    SLOT_ORDER.forEach((sl, i) => {
      const x = 20, y = 88 + i * 102, it = P.equip[sl], sel = MN.gz === 'eq' && MN.gi === i;
      ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 3, 286, 96); ctx.fillStyle = it ? '#1a1a1e' : PAPER; ctx.fillRect(x, y, 280, 90);
      if (it) { ctx.fillStyle = RARITY[it.ri].col === '#111' ? '#fff' : RARITY[it.ri].col; ctx.fillRect(x, y, 5, 90); }
      T(SLOT_META[sl].en, x + 14, y + 16, 11, it ? '#999' : '#888');
      if (it) { drawItemIcon(it, x + 14, y + 24, 56); T(it.name, x + 80, y + 38, 15, '#fff', 'left', BODY); rarityTag(it, x + 80, y + 56, 11); Object.keys(it.stats).slice(0, 2).forEach((k, j) => T(GSTAT[k].ko + ' ' + fmtStat(k, it.stats[k]), x + 80, y + 72 + j * 13, 11, '#bbb', 'left', BODY)); }
      else { ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeRect(x + 14, y + 24, 56, 56); ctx.setLineDash([]); T(SLOT_META[sl].ko + ' 없음', x + 82, y + 56, 14, '#888', 'left', BODY); }
      if (sel) { ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.strokeRect(x - 7, y - 7, 294, 104); }
      hit(x, y, 280, 90, () => MN.gz === 'eq' && MN.gi === i, () => { MN.gz = 'eq'; MN.gi = i; }, () => gearEnter());
    });
    ctx.fillStyle = INK; ctx.fillRect(20, 398, 280, 100); T('GEAR TOTAL', 30, 416, 12, PINK);
    Object.keys(GSTAT).forEach((k, i) => { const cx0 = 30 + (i % 2) * 138, cy0 = 434 + Math.floor(i / 2) * 16; T(GSTAT[k].ko, cx0, cy0, 11, '#aaa', 'left', BODY); T(fmtStat(k, P.g[k]), cx0 + 128, cy0, 12, P.g[k] ? '#fff' : '#555', 'right'); });
    T('BAG', 322, 80, 14, PINK); T(`${P.bag.length} / ${BAG_MAX}`, 360, 80, 14, INK);
    for (let i = 0; i < BAG_MAX; i++) {
      const x = 322 + (i % 8) * 76, y = 90 + Math.floor(i / 8) * 76, it = P.bag[i], sel = MN.gz === 'bag' && MN.gi === i;
      ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 3, 66, 66); ctx.fillStyle = PAPER; ctx.fillRect(x, y, 60, 60);
      if (it) drawItemIcon(it, x + 2, y + 2, 56); else { ctx.fillStyle = HALF; ctx.globalAlpha = 0.25; ctx.fillRect(x, y, 60, 60); ctx.globalAlpha = 1; }
      if (sel) { const p = 2 + Math.sin(MN.t * 0.25); ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.strokeRect(x - 3 - p, y - 3 - p, 66 + p * 2, 66 + p * 2); }
      hit(x, y, 60, 60, () => MN.gz === 'bag' && MN.gi === i, () => { MN.gz = 'bag'; MN.gi = i; }, () => gearEnter());
    }
    const it = MN.gz === 'bag' ? P.bag[MN.gi] : P.equip[SLOT_ORDER[MN.gi]], dy = 326;
    ctx.fillStyle = INK; ctx.fillRect(316, dy, 620, 172); ctx.fillStyle = PINK; ctx.fillRect(316, dy, 6, 172);
    if (it) {
      const cmp = MN.gz === 'bag' ? P.equip[it.slot] : null;
      drawItemIcon(it, 336, dy + 16, 64); T(it.name, 416, dy + 38, 22, '#fff', 'left', BODY); rarityTag(it, 416, dy + 60, 13);
      T(SLOT_META[it.slot].ko + ' · 던전 ' + (it.stage + 1) + ' 드랍', 480, dy + 59, 12, '#aaa', 'left', BODY);
      Object.keys(it.stats).forEach((k, j) => {
        T(GSTAT[k].ko, 416, dy + 90 + j * 18, 13, '#ccc', 'left', BODY); T(fmtStat(k, it.stats[k]), 560, dy + 90 + j * 18, 14, '#fff', 'right');
        if (cmp) { const d = it.stats[k] - (cmp.stats[k] || 0); T(Math.abs(d) < 1e-6 ? '=' : d > 0 ? '▲' : '▼', 572, dy + 90 + j * 18, 12, d > 0 ? PINK : '#999', 'left', BODY); }
      });
      if (cmp) T('장착 중인 ' + cmp.name + ' 와 비교', 640, dy + 90, 12, '#aaa', 'left', BODY);
      else if (MN.gz === 'bag') T('빈 슬롯입니다 · Enter로 바로 장착', 640, dy + 90, 12, '#aaa', 'left', BODY);
      if (MN.gz === 'bag') T('판매가 ◆' + sellValue(it), 640, dy + 150, 14, '#fff', 'left', BODY);
    } else T(MN.gz === 'bag' ? '빈 칸' : '비어 있는 장비 칸', 336, dy + 90, 16, '#777', 'left', BODY);
    menuFooter([['방향키', '이동'], ['Enter', '장착/해제'], ['X', '판매'], ['Tab', '닫기']]);
  } else {
    if (!MN.shopOK) T('상점 NPC 앞에서 Enter로 열 수 있습니다', W / 2, 270, 22, '#555', 'center', BODY);
    else {
      T('MERCHANT', 22, 80, 14, PINK); T('체크포인트 근처의 떠돌이 상인 · 상품은 던전마다 다릅니다', 118, 80, 12, '#555', 'left', BODY);
      for (let i = 0; i < 6; i++) {
        const x = 20 + (i % 3) * 308, y = 92 + Math.floor(i / 3) * 202, it = S.shop[i], sel = MN.shi === i, w = 296, h = 190;
        ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.fillStyle = it ? '#1a1a1e' : '#d8d6cf'; ctx.fillRect(x, y, w, h);
        if (it) {
          ctx.fillStyle = RARITY[it.ri].col === '#111' ? '#fff' : RARITY[it.ri].col; ctx.fillRect(x, y, 5, h);
          drawItemIcon(it, x + 18, y + 16, 64); T(it.name, x + 94, y + 36, 18, '#fff', 'left', BODY); rarityTag(it, x + 94, y + 56, 12);
          T(SLOT_META[it.slot].ko, x + 160, y + 55, 11, '#aaa', 'left', BODY);
          Object.keys(it.stats).forEach((k, j) => { T(GSTAT[k].ko, x + 18, y + 106 + j * 17, 12, '#bbb', 'left', BODY); T(fmtStat(k, it.stats[k]), x + 170, y + 106 + j * 17, 13, '#fff', 'right'); });
          const cur = P.equip[it.slot]; if (cur) T('장착: ' + cur.name, x + 18, y + 90, 10, '#888', 'left', BODY);
          tag('◆ ' + it.price, x + w - 10, y + h - 12, 18, P.gold >= it.price ? PINK : '#555', '#fff', DISPLAY, 'right');
        } else T('SOLD OUT', x + w / 2, y + h / 2 + 8, 26, '#999', 'center');
        if (sel) { const p = 3 + Math.sin(MN.t * 0.2) * 1.5; ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.strokeRect(x - 3 - p, y - 3 - p, w + 6 + p * 2, h + 6 + p * 2); }
        hit(x, y, w, h, () => MN.shi === i, () => { MN.shi = i; }, () => shopBuy(i));
      }
      menuFooter([['방향키', '선택'], ['Enter', '구매'], ['R', '새로고침 ◆' + shopRerollCost()], ['Tab', '닫기']]);
    }
  }
  if (MN.msgT > 0) {
    ctx.globalAlpha = Math.min(1, MN.msgT / 20);
    ctx.font = `18px ${BODY}`; const mw = ctx.measureText(MN.msg).width + 30;
    hudSlant(W / 2 - mw / 2 + 8, 470, mw, 28, 10, PINK); T(MN.msg, W / 2, 490, 18, '#fff', 'center', BODY); ctx.globalAlpha = 1;
  }
}
