'use strict';
// ===== 영구 저장 / 난이도 / 적응형 강도 / 업적 / 도감 설명 =====
const SAVE = { kills: 0, mon: {}, seen: {}, boss: {}, gold: 0, items: [0, 0, 0, 0], deaths: 0, clears: {}, sRanks: 0, maxCombo: 0, chests: 0, mimics: 0, ambushes: 0, shrines: 0, ults: 0, burns: 0, bleeds: 0, noHit: 0, diffClear: {}, ach: {}, diff: 1 };
(function () { try { const s = JSON.parse(localStorage.getItem('dgn_save') || 'null'); if (s) for (const k in s) SAVE[k] = s[k]; } catch (e) { /* 저장소 사용 불가 */ } })();
let saveDirty = false;
const saveMark = () => { saveDirty = true; };
function saveFlush() { if (!saveDirty) return; try { localStorage.setItem('dgn_save', JSON.stringify(SAVE)); } catch (e) { /* ignore */ } saveDirty = false; }
setInterval(saveFlush, 2500); addEventListener('beforeunload', saveFlush);
function seenMark(k) { if (!SAVE.seen[k]) { SAVE.seen[k] = 1; saveMark(); } }

// ===== 난이도 =====
const DIFFS = [
  { id: 'easy', name: 'EASY', ko: '쉬움', hp: 0.75, dmg: 0.7, gold: 0.9, exp: 0.9 },
  { id: 'normal', name: 'NORMAL', ko: '보통', hp: 1, dmg: 1, gold: 1, exp: 1 },
  { id: 'hard', name: 'HARD', ko: '어려움', hp: 1.7, dmg: 1.5, gold: 1.35, exp: 1.3 },
  { id: 'night', name: 'NIGHTMARE', ko: '악몽', hp: 2.8, dmg: 2.2, gold: 2.0, exp: 1.7 }
];
// ===== 적응형 강도: 스탯·장비·강화로 강해질수록 적도 그만큼 강해진다 =====
function avgSkillLv() { let s = 0, n = 0; for (const id of P.slots) if (id) { s += P.skillLv[id] || 1; n++; } return n ? s / n : 1; }
function playerPower() {
  const st = P.stats, g = P.g;
  const lvl = 1 + 0.06 * (P.lv - 1);
  const atk = (1 + g.atk) * (1 + 0.09 * (st.basic + st.skill) / 2) * (1 + g.crit * 0.7 + 0.014 * st.crit);
  const spd = 1 + 0.35 * (0.04 * st.aspd + g.aspd) + 0.3 * (0.04 * st.cdr + g.cdr);
  const sk = 1 + 0.06 * (avgSkillLv() - 1);
  const off = lvl * atk * spd * sk;
  const def = Math.sqrt(P.maxhp / P.cls.hp) * (1 + 0.8 * Math.min(0.5, 0.03 * st.dodge + g.dodge));
  return off * Math.pow(def, 0.6);
}
const expectedPower = i => 1.1 + 0.8 * i;
function adaptFor(i) { const r = playerPower() / expectedPower(i); return { hp: clamp(Math.pow(r, 0.95), 0.85, 4.0), dmg: clamp(Math.pow(r, 0.5), 0.9, 2.2), r }; }

// ===== 업적 =====
const sumItems = () => SAVE.items.reduce((a, b) => a + b, 0);
const ACH = [
  ['first', 'FIRST BLOOD', '첫 몬스터를 처치한다', 1, () => SAVE.kills],
  ['k100', 'SLAYER I', '몬스터 100마리 처치', 100, () => SAVE.kills],
  ['k1000', 'SLAYER II', '몬스터 1,000마리 처치', 1000, () => SAVE.kills],
  ['k5000', 'SLAYER III', '몬스터 5,000마리 처치', 5000, () => SAVE.kills],
  ['b1', 'BOSS HUNTER I', '보스를 처치한다', 1, () => Object.keys(SAVE.boss).length],
  ['b5', 'BOSS HUNTER II', '서로 다른 보스 5체 처치', 5, () => Object.keys(SAVE.boss).length],
  ['b10', 'BOSS HUNTER III', '보스 10체를 모두 처치', 10, () => Object.keys(SAVE.boss).length],
  ['c10', 'DUNGEON MASTER', '던전 10개를 모두 클리어', 10, () => Object.keys(SAVE.clears).length],
  ['g5k', 'COIN COLLECTOR', '골드 5,000 획득', 5000, () => SAVE.gold],
  ['g50k', 'TYCOON', '골드 50,000 획득', 50000, () => SAVE.gold],
  ['i25', 'COLLECTOR I', '장비 25개 획득', 25, sumItems],
  ['i150', 'COLLECTOR II', '장비 150개 획득', 150, sumItems],
  ['leg', 'LEGENDARY', '전설 장비를 획득', 1, () => SAVE.items[3]],
  ['kit', 'FULL KIT', '영웅 이상 장비 3종을 동시에 장착', 3, () => (typeof P !== 'undefined' && P) ? SLOT_ORDER.filter(s => P.equip[s] && P.equip[s].ri >= 2).length : 0],
  ['cb50', 'COMBO MASTER', '50콤보 달성', 50, () => SAVE.maxCombo],
  ['cb150', 'COMBO GOD', '150콤보 달성', 150, () => SAVE.maxCombo],
  ['s1', 'PERFECTIONIST', 'S랭크를 획득', 1, () => SAVE.sRanks],
  ['s5', 'S-RANKER', 'S랭크 5회 획득', 5, () => SAVE.sRanks],
  ['nohit', 'UNTOUCHABLE', '한 대도 맞지 않고 던전 클리어', 1, () => SAVE.noHit],
  ['hard', 'HARD MODE', 'HARD 이상으로 던전 5개 클리어', 5, () => Math.max(SAVE.diffClear[2] || 0, SAVE.diffClear[3] || 0)],
  ['night', 'NIGHTMARE', 'NIGHTMARE로 던전 1 클리어', 1, () => SAVE.diffClear[3] || 0],
  ['chest10', 'TREASURE HUNTER', '보물 상자 10개 열기', 10, () => SAVE.chests],
  ['mimic', 'MIMIC SLAYER', '미믹을 처치', 1, () => SAVE.mimics],
  ['amb5', 'AMBUSH SURVIVOR', '매복 5회 돌파', 5, () => SAVE.ambushes],
  ['shr5', 'DEVOUT', '제단에 5회 기도', 5, () => SAVE.shrines],
  ['ult20', 'ULTIMATE', '궁극기 20회 사용', 20, () => SAVE.ults],
  ['burn', 'PYROMANIAC', '화상 100회 부여', 100, () => SAVE.burns],
  ['bleed', 'BUTCHER', '출혈 100회 부여', 100, () => SAVE.bleeds]
].map(a => ({ id: a[0], name: a[1], desc: a[2], max: a[3], cur: a[4] }));
const ACHQ = [];
function achCheck() {
  if (SAVE.maxCombo < (combo.best || 0)) { SAVE.maxCombo = combo.best; saveMark(); }
  for (const a of ACH) {
    if (SAVE.ach[a.id]) continue;
    if (a.cur() >= a.max) { SAVE.ach[a.id] = Date.now(); ACHQ.push({ name: a.name, t: 0 }); saveMark(); sfx('levelup'); }
  }
}
function drawAchToast() {
  if (!ACHQ.length) return;
  const q = ACHQ[0]; q.t++;
  const k = q.t < 14 ? q.t / 14 : q.t > 170 ? (190 - q.t) / 20 : 1;
  if (q.t > 190) { ACHQ.shift(); return; }
  const e = 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  ctx.save(); ctx.translate(0, -70 * (1 - e));
  hudSlant(W / 2 - 190, 14, 400, 52, 18, INK); ctx.fillStyle = PINK; ctx.fillRect(W / 2 - 208, 14, 8, 52);
  ctx.font = `13px ${DISPLAY}`; T('ACHIEVEMENT UNLOCKED', W / 2 - 170, 34, 13, PINK, 'left'); T(q.name, W / 2 - 170, 58, 24, '#fff', 'left');
  ctx.restore();
}

// ===== 도감 설명 =====
const MON_LORE = {
  slime: ['슬라임', '동굴 바닥에서 스며 나온 끈적한 덩어리. 통통 튀며 달려든다.'],
  bat: ['박쥐', '천장에 매달려 있다가 침입자를 발견하면 급강하한다.'],
  goblin: ['고블린', '몽둥이를 든 약탈자. 무리 지어 다니며 동굴을 점령했다.'],
  garcher: ['고블린 궁수', '멀찍이서 화살을 쏘는 겁쟁이. 가까이 다가가면 도망친다.'],
  skeleton: ['해골', '묘지에서 일어난 병사의 잔해. 녹슨 검을 아직 쥐고 있다.'],
  ghost: ['유령', '미련을 떨치지 못한 영혼. 벽을 타고 미끄러지듯 다가온다.'],
  mage: ['어둠 마법사', '금지된 마도서를 읽다 정체성을 잃은 자. 어둠의 탄을 쏜다.'],
  golem: ['골렘', '균열 사이로 코어가 빛나는 돌 거인. 느리지만 한 방이 무겁다.'],
  imp: ['임프', '불길에서 태어난 작은 악마. 날아다니며 물어뜯는다.'],
  caster: ['화염술사', '불꽃 구슬을 다루는 주술사. 거리를 유지하며 화염을 던진다.'],
  spider: ['거미', '둥지를 지키는 사냥꾼. 낮게 웅크렸다 높이 뛰어오른다.'],
  knight: ['타락한 기사', '맹세를 잃은 중갑 기사. 방패와 검을 들고 천천히 압박해 온다.'],
  mimic: ['미믹', '보물 상자로 위장한 괴물. 열어 보는 순간 이빨을 드러낸다.']
};
const BOSS_LORE = {
  ogre: ['오우거 킹', '고블린 동굴의 지배자. 가시 곤봉으로 땅을 내려친다.'],
  lich: ['리치', '묘지의 주인. 떠도는 해골과 함께 어둠의 탄을 쏟아 낸다.'],
  spider: ['거미 여왕', '둥지의 어머니. 끈적한 거미줄과 새끼 거미들을 부린다.'],
  knight: ['타락한 기사단장', '성채를 지키다 타락한 기사단장. 거대한 대검을 휘두른다.'],
  dragon: ['불의 용', '용암 둥지의 군주. 불길과 유성으로 하늘을 뒤덮는다.'],
  hydra: ['히드라', '침수된 신전에 잠든 머리 셋 달린 뱀. 하나를 베면 둘이 솟는다.'],
  colossus: ['철의 거신', '제련소가 만든 마지막 병기. 증기를 내뿜으며 대지를 짓밟는다.'],
  reaper: ['사신', '지하묘의 심판자. 시간을 가르는 낫으로 생명을 거둔다.'],
  demon: ['지옥의 군주', '지옥문 너머의 지배자. 날개를 펴면 하늘이 붉게 물든다.'],
  eye: ['심연의 눈', '탑의 끝에서 모든 것을 내려다보는 존재. 그 시선이 곧 심판이다.']
};
