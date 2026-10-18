'use strict';
// ===== 장비 아이템 =====
const RARITY = [
  { en: 'COMMON', ko: '일반', mul: 1, n: 1, col: '#8a8a86' },
  { en: 'RARE', ko: '희귀', mul: 1.6, n: 2, col: '#111' },
  { en: 'EPIC', ko: '영웅', mul: 2.4, n: 3, col: '#ff2a64' },
  { en: 'LEGEND', ko: '전설', mul: 3.5, n: 4, col: '#ff2a64' }
];
const SLOT_META = { weapon: { ko: '무기', en: 'WEAPON' }, armor: { ko: '방어구', en: 'ARMOR' }, acc: { ko: '장신구', en: 'ACCESSORY' } };
const SLOT_ORDER = ['weapon', 'armor', 'acc'];
const GSTAT = {
  atk: { ko: '공격력', base: 0.05, pct: true }, hp: { ko: '체력', base: 14 }, crit: { ko: '치명타 확률', base: 0.02, pct: true },
  aspd: { ko: '공격 속도', base: 0.025, pct: true }, cdr: { ko: '쿨타임 감소', base: 0.025, pct: true }, move: { ko: '이동 속도', base: 0.03, pct: true },
  dodge: { ko: '회피 확률', base: 0.02, pct: true }, gold: { ko: '골드 획득', base: 0.06, pct: true }
};
const GCAP = { crit: 0.4, aspd: 0.3, cdr: 0.35, move: 0.5, dodge: 0.3 };
const NOUNS = {
  weapon: { warrior: ['대검', '장검', '전투 도끼'], mage: ['지팡이', '마도서', '수정 구슬'], archer: ['장궁', '단궁', '석궁'], rogue: ['단검', '쌍검', '비수'] },
  armor: ['갑옷', '외투', '로브', '가죽 갑옷'], acc: ['반지', '목걸이', '부적', '귀걸이']
};
const PREF = [['낡은', '평범한', '무딘'], ['날카로운', '견고한', '민첩한'], ['핏빛', '그림자', '폭풍'], ['심연의', '불멸의', '종말의']];
const WICON = { warrior: 'greatsword', mage: 'orb', archer: 'arrow', rogue: 'dagger' };
let itemSeq = 1;
const BAG_MAX = 24;

function fmtStat(k, v) { return GSTAT[k].pct ? '+' + (v * 100).toFixed(v * 100 < 10 ? 1 : 0) + '%' : '+' + Math.round(v); }
function rollRarity(stage, minR = 0) {
  const w = [Math.max(20, 70 - stage * 8), 24 + stage * 2, 5 + stage * 3, 1 + stage * 1.2];
  let r = Math.random() * (w[0] + w[1] + w[2] + w[3]), i = 0;
  while (i < 3 && r >= w[i]) { r -= w[i]; i++; }
  return Math.max(i, minR);
}
function makeItem(slot, ri, stage, clsId) {
  const R = RARITY[ri], keys = [slot === 'weapon' ? 'atk' : slot === 'armor' ? 'hp' : choice(['crit', 'cdr', 'dodge', 'gold', 'move', 'aspd'])];
  const others = Object.keys(GSTAT).filter(k => k !== keys[0]);
  while (keys.length < R.n) { const k = choice(others); if (!keys.includes(k)) keys.push(k); }
  const stats = {}, sc = 1 + 0.3 * stage;
  keys.forEach((k, i) => { let v = GSTAT[k].base * R.mul * sc * (i === 0 ? 1.25 : 0.8) * rnd(0.85, 1.15); if (k === 'hp') v = Math.round(v); stats[k] = v; });
  const noun = slot === 'weapon' ? choice(NOUNS.weapon[clsId]) : choice(NOUNS[slot]);
  return { id: itemSeq++, slot, ri, name: choice(PREF[ri]) + ' ' + noun, stats, stage, cls: clsId, price: Math.round(35 * R.mul * R.mul * (1 + stage * 0.55) * (0.8 + keys.length * 0.15)) };
}
const sellValue = it => Math.round(it.price * 0.4);
function recalcGear() {
  const g = { atk: 0, hp: 0, crit: 0, aspd: 0, cdr: 0, move: 0, dodge: 0, gold: 0 };
  for (const s of SLOT_ORDER) { const it = P.equip[s]; if (it) for (const k in it.stats) g[k] += it.stats[k]; }
  for (const k in GCAP) g[k] = Math.min(g[k], GCAP[k]);
  P.g = g; recalcP();
}
function giveItem(it) {
  SAVE.items[it.ri]++; saveMark();
  if (P.bag.length >= BAG_MAX) { const v = sellValue(it); P.gold += v; text(cx(P), P.y - 20, '가방 가득 · 자동 판매 +' + v, '#111', 80, 14); return false; }
  P.bag.push(it); return true;
}
function equipFromBag(i) {
  const it = P.bag[i]; if (!it) return;
  const old = P.equip[it.slot]; P.equip[it.slot] = it; P.bag.splice(i, 1); if (old) P.bag.push(old);
  recalcGear();
}
function unequipSlot(slot) {
  const it = P.equip[slot]; if (!it || P.bag.length >= BAG_MAX) return false;
  P.equip[slot] = null; P.bag.push(it); recalcGear(); return true;
}
function sellFromBag(i) { const it = P.bag[i]; if (!it) return 0; const v = sellValue(it); P.gold += v; P.bag.splice(i, 1); return v; }
function genShop(stage, clsId) {
  const slots = ['weapon', 'armor', 'acc', 'weapon', 'armor', 'acc'], a = [];
  for (let i = 0; i < 6; i++) a.push(makeItem(slots[i], rollRarity(stage + 1, i < 2 ? 1 : 0), stage, clsId));
  return a;
}
const itemIco = it => it.slot === 'weapon' ? WICON[it.cls] : it.slot === 'armor' ? ['shield', 'wave', 'cloud'][it.id % 3] : ['sun', 'mark', 'burst', 'wind', 'blood', 'clock'][it.id % 6];
// 아이템 아이콘 (등급 색 프레임)
function drawItemIcon(it, x, y, s) {
  const R = RARITY[it.ri], hot = it.ri >= 2;
  ctx.fillStyle = hot ? PINK : INK; ctx.fillRect(x - 2, y - 2, s + 4, s + 4);
  ctx.fillStyle = it.ri === 3 ? PINK : '#1a1a1e'; ctx.fillRect(x, y, s, s);
  if (it.ri === 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 3, y + 3, s - 6, s - 6); }
  if (it.ri === 3) { ctx.fillStyle = HALF; ctx.globalAlpha = 0.5; ctx.fillRect(x, y, s, s); ctx.globalAlpha = 1; }
  skillIcon(itemIco(it), x + s / 2, y + s / 2, s * 0.72, false);
  if (it.ri === 0) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y, s, s); }
}
