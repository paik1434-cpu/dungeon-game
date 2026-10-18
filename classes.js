'use strict';
// ===== 조준 기반 공격 헬퍼 =====
// P.aim = {x,y} 단위벡터: 기본은 바라보는 방향, ↑(+←/→)는 위/대각 위, 공중에서 ↓는 아래/대각 아래
function melee(w, h, mul, extra = {}) {
  const ax = P.aim.x, ay = P.aim.y;
  if (ay === 0) {
    addBox(Object.assign({ follow: true, rx: front(w), ry: 0, w, h, mul, kb: 4, life: 9 }, extra));
  } else {
    const d = Math.max(w, h) * 0.55 + P.w / 2, s = Math.round(Math.max(w * 0.85, h));
    addBox(Object.assign({ follow: true, rx: ax * d, ry: ay * d, w: s, h: s, mul, kb: 4, life: 9, ang: Math.atan2(ay, ax) }, extra));
  }
}
// range = 최대 사거리(px). 속도와 사거리로 수명이 정해진다.
function shoot(o) {
  const sp = o.speed || 9; let a = Math.atan2(P.aim.y, P.aim.x) + (o.da || 0);
  if (o.homing) { // 발사각 보정: 조준 방향 근처의 가장 가까운 적 쪽으로 살짝 꺾는다
    let best = null, bd = 1e9;
    for (const e of S.enemies) {
      if (e.dead) continue;
      const ex = cx(e) - cx(P), ey = cy(e) - cy(P), d = Math.hypot(ex, ey);
      if (d > (o.range || 300) * 1.15) continue;
      let df = Math.atan2(ey, ex) - a; df = Math.atan2(Math.sin(df), Math.cos(df));
      if (Math.abs(df) > (o.cone || 0.5)) continue;
      if (d < bd) { bd = d; best = df; }
    }
    if (best !== null) a += best * 0.75;
  }
  const q = Object.assign({
    x: cx(P) + Math.cos(a) * 18, y: P.y + P.h * 0.38 + Math.sin(a) * 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: 5, mul: 1, range: 300, pierce: 0, color: '#fff', hit: new Set(), kb: 2, src: curSrc, lvm: curLvm, fx: curFx, ico: curIco
  }, o);
  q.life = Math.ceil(q.range / sp); q.maxLife = q.life;
  if (P.focus > 0 && !q.wave) { q.pierce = Math.max(q.pierce, 99); q.fx = 'pierce'; } // 사냥꾼의 눈: 모든 화살 관통
  S.projs.push(q);
}
function crackFx(x, dir, len) {
  const pts = []; let px = 0, py = 0;
  for (let i = 0; i < 7; i++) { px += len / 7; py = (Math.random() - 0.5) * 16; pts.push([px, py]); }
  S.parts.push({ kind: 'crack', x, y: GROUND, dir, pts, life: 46, t: 0 });
}
function speedLines(n) {
  for (let i = 0; i < n; i++) S.parts.push({ kind: 'speed', x: P.x + rnd(-10, P.w + 10) - Math.sign(P.dashV || P.facing) * rnd(0, 30), y: P.y + rnd(2, P.h - 4), len: rnd(30, 80), dir: -Math.sign(P.dashV || P.facing), life: 9, t: 0 });
}

// ===== 슬롯 / 티어 =====
// 슬롯 Q W E R F = 티어 1~5. 직업마다 티어별 4종(총 20종)이 있고, 요구 레벨을 넘으면 골드로 구매해 장착한다.
const SLOT_KEYS = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyF'], SLOT_LABELS = ['Q', 'W', 'E', 'R', 'F'];
const TIER_PRICE = [80, 160, 280, 450, 700], TIER_LV = [1, 3, 5, 8, 11];
const SKILLDB = {};
const cl = o => { const r = {}; for (const k in o) if (o[k] !== undefined) r[k] = o[k]; return r; };
const nearest = (n, range) => S.enemies.filter(e => !e.dead && Math.abs(cx(e) - cx(P)) < range).sort((a, b) => Math.abs(cx(a) - cx(P)) - Math.abs(cx(b) - cx(P))).slice(0, n);

// ===== 스킬 팩토리 (데이터로 스킬을 정의) =====
const F = {
  proj(o) { return () => {
    const n = o.n || 1, rep = o.rep || 1;
    const fire = () => { for (let i = 0; i < n; i++) shoot(cl({ speed: o.speed || 10, da: (n === 1 ? 0 : (i - (n - 1) / 2) * (o.spread || 0.12)) + (o.jit ? rnd(-o.jit, o.jit) : 0), mul: o.mul || 1, r: o.r || 5, range: o.range || 300, pierce: o.pierce, color: o.color, aoe: o.aoe, poison: o.poison, slow: o.slow, stun: o.stun, kb: o.kb, homing: o.homing, cone: o.cone })); };
    fire(); for (let k = 1; k < rep; k++) sched(k * (o.gap || 5), () => { fire(); if (k % 2 === 0) sfx(o.snd2 || 'arrow'); });
    if (o.back) { P.dash = 9; P.dashV = -P.facing * 9; P.inv = 12; }
  }; },
  melee(o) { return () => {
    const hit = () => { if (o.nc) P.nextCrit = true; melee(o.w, o.h, o.mul, cl({ kb: o.kb, life: o.life, every: o.every, stun: o.stun, slow: o.slow, fx: o.fx })); if (o.lunge) { P.lunge = P.facing * o.lunge; P.lungeT = 6; } };
    hit(); for (let k = 1; k < (o.rep || 1); k++) sched(k * (o.gap || 6), () => { hit(); sfx('slash'); });
    if (o.heal) { P.hp = Math.min(P.maxhp, P.hp + o.heal); text(cx(P), P.y - 12, '+' + o.heal, PINK, 50, 16); }
    if (o.inv) P.inv = Math.max(P.inv, o.inv);
    if (o.dash) { P.dash = o.dash; P.dashV = P.facing * (o.dv || 10); }
  }; },
  around(o) { return () => {
    addBox(cl({ follow: true, rx: 0, ry: 0, w: o.w, h: o.h, mul: o.mul, kb: o.kb || 6, life: o.life || 12, every: o.every, shape: 'circle', fx: o.fx || 'burst', slow: o.slow, stun: o.stun }));
    ring(cx(P), cy(P)); addShake(o.shake || 3);
    if (o.atk) P.buffAtk = Math.max(P.buffAtk, o.atk);
    if (o.inv) P.inv = Math.max(P.inv, o.inv);
  }; },
  dash(o) { return () => {
    P.dash = o.f || 14; P.dashV = P.facing * (o.v || 12); P.inv = o.inv || o.f || 14;
    if (o.w) addBox(cl({ follow: true, rx: front(o.w), ry: 0, w: o.w, h: o.h || 54, mul: o.mul, kb: o.kb || 4, life: o.f || 14, every: o.every || 6, stun: o.stun, slow: o.slow }));
  }; },
  buff(o) { return () => {
    if (o.atk) P.buffAtk = Math.max(P.buffAtk, o.atk);
    if (o.haste) P.haste = Math.max(P.haste, o.haste);
    if (o.heal) { const h = Math.round(P.maxhp * o.heal); P.hp = Math.min(P.maxhp, P.hp + h); text(cx(P), P.y - 14, '+' + h, PINK, 50, 18); }
    if (o.mp) P.mp = Math.min(P.maxmp, P.mp + o.mp);
    if (o.inv) P.inv = Math.max(P.inv, o.inv);
    if (o.crit) P.nextCrit = true;
    ring(cx(P), cy(P)); if (o.txt) text(cx(P), P.y - 10, o.txt, PINK, 60, 18);
  }; },
  rain(o) { return () => {
    for (let i = 0; i < o.n; i++) sched(i * (o.gap || 5), () => {
      const side = o.both ? (Math.random() < 0.5 ? -1 : 1) : P.facing;
      S.projs.push(cl({ x: cx(P) + side * rnd(o.xmin || 80, o.xmax || 340), y: -20, vx: o.vx || 0, vy: o.vy || 14, r: o.r || 6, mul: o.mul, src: 'skill', lvm: curLvm, fx: curFx, ico: curIco, life: 140, maxLife: 140, aoe: o.aoe, color: o.color || '#fff', hit: new Set(), kb: 3, slow: o.slow }));
      if (i % 4 === 0) sfx(o.snd2 || 'arrow');
    });
  }; },
  strike(o) { return function () {
    const t = nearest(o.n, o.range);
    if (!t.length) { text(cx(P), P.y - 10, '대상 없음', '#555'); P.cd[this.key] = 0; P.mp += this.mp; return; }
    addShake(o.shake || 4);
    for (const e of t) { addBox({ cx: cx(e), cy: 200, w: 56, h: 520, mul: o.mul, kb: 0, life: 10, stun: o.stun }); sparks(cx(e), GROUND - 4, 8, '#fff', 20); }
  }; },
  zone(o) { return () => {
    addBox(cl({ cx: cx(P) + P.facing * (o.dist === undefined ? 110 : o.dist), cy: GROUND - o.h / 2, w: o.w, h: o.h, mul: o.mul, kb: o.kb || 0, life: o.life, every: o.every, shape: 'circle', fx: 'zone', tint: o.tint, slow: o.slow, stun: o.stun, poison: o.poison }));
    if (o.inv) P.inv = Math.max(P.inv, o.inv);
    burst(cx(P) + P.facing * (o.dist || 0), GROUND - 6, 6, 'dust');
  }; },
  leap(o) { return () => {
    P.vy = -(o.vy || 11); P.dash = o.f || 16; P.dashV = P.facing * (o.v || 6); P.jumps = 2;
    addBox(cl({ follow: true, rx: front(o.w), ry: 10, w: o.w, h: o.h || 70, mul: o.mul, kb: o.kb || 6, life: o.f || 16, every: o.every || 6, stun: o.stun }));
  }; },
  wave(o) { return () => {
    const sp = o.speed || 8, life = Math.ceil(o.range / sp);
    S.projs.push(cl({ x: cx(P) + P.facing * 20, y: GROUND - 16, vx: P.facing * sp, vy: 0, r: 14, mul: o.mul, life, maxLife: life, pierce: 99, color: '#fff', hit: new Set(), kb: 6, wave: true, src: 'skill', lvm: curLvm, fx: curFx, ico: curIco, stun: o.stun }));
    crackFx(cx(P) + P.facing * 30, P.facing, 110);
  }; }
};
const sk = (tier, name, en, ico, cd, mp, snd, desc, fn) => ({ tier, name, en, ico, cd, mp, snd, desc, fn, lv: TIER_LV[tier - 1], price: TIER_PRICE[tier - 1], key: SLOT_KEYS[tier - 1], label: SLOT_LABELS[tier - 1] });
const nearEnemy = r => nearest(1, r)[0];

const CLASSES = [
  {
    id: 'warrior', en: 'WARRIOR', name: '전사', hp: 170, mp: 70, spd: 3.2, base: 14, crit: 0.1, mpr: 0.06, lunge: 3.5,
    desc: '단단한 체력과 묵직한 근접 타격. 대검 하나로 전장을 가른다.',
    basic: { name: '베기', en: 'SLASH', ico: 'slash', cd: 18, snd: 'slash', fn() { melee(64, 54, 1, { kb: 4 }); } },
    skills: [
      // ---- T1
      sk(1, '회전베기', 'CRIMSON WHIRL', 'spin', 4, 10, 'slashBig', '자신을 중심으로 칼날이 회전하며 주변 적을 연속으로 벤다.', () => {
        addBox({ follow: true, rx: 0, ry: 0, w: 150, h: 84, mul: 0.8, kb: 6, life: 24, every: 8, shape: 'circle', fx: 'spin' }); }),
      sk(1, '강타', 'HEAVY BLOW', 'hammer', 3.5, 9, 'slashBig', '느리지만 묵직한 일격. 적을 크게 밀쳐내고 잠시 기절시킨다.', F.melee({ w: 96, h: 74, mul: 2.1, kb: 12, stun: 30, life: 10, lunge: 3 })),
      sk(1, '삼연 찌르기', 'TRIPLE THRUST', 'spear', 3, 8, 'slash', '앞으로 세 번 빠르게 찌른다.', F.melee({ w: 92, h: 26, mul: 0.8, rep: 3, gap: 5, lunge: 3, kb: 2 })),
      sk(1, '도약 베기', 'LEAPING CUT', 'slash', 4, 10, 'jump', '앞으로 도약하며 내려베어 적을 기절시킨다.', F.leap({ vy: 11, v: 7, f: 18, w: 74, h: 80, mul: 1.6, kb: 8, stun: 20 })),
      // ---- T2
      sk(2, '돌진', 'IRON CHARGE', 'dash', 5, 12, 'dash', '앞으로 돌진하며 적을 밀쳐내고 기절시킨다. 돌진 중 무적.', () => {
        P.dash = 18; P.dashV = P.facing * 11; P.inv = 18;
        addBox({ follow: true, rx: front(54), ry: 0, w: 54, h: 54, mul: 1.1, kb: 8, life: 18, every: 6, stun: 40 }); }),
      sk(2, '방패 밀치기', 'SHIELD BASH', 'shield', 4, 8, 'slashBig', '방패로 밀쳐 적을 길게 기절시킨다. 짧은 무적.', F.melee({ w: 64, h: 74, mul: 1.3, kb: 14, stun: 55, inv: 20, life: 10 })),
      sk(2, '충격파', 'SHOCKWAVE', 'wave', 4.5, 12, 'boom', '땅을 가르는 충격파가 앞으로 뻗어 나가며 관통한다.', F.wave({ speed: 8, range: 380, mul: 1.7, stun: 25 })),
      sk(2, '칼날 폭풍', 'BLADE STORM', 'spin', 7, 16, 'slashBig', '긴 시간 회전하며 주변을 갈아버린다.', F.around({ w: 190, h: 100, mul: 0.55, every: 6, life: 42, fx: 'spin', kb: 4 })),
      // ---- T3
      sk(3, '대지 강타', 'EARTHBREAKER', 'quake', 7, 18, 'jump', '높이 뛴 뒤 내려찍어 충격파를 양옆으로 날린다.', () => { P.vy = -12; P.slam = 1; P.jumps = 2; }),
      sk(3, '분노 폭발', 'RAGE BURST', 'burst', 8, 18, 'slashBig', '분노를 터뜨려 주변 적을 날려 보내고 잠시 공격력이 오른다.', F.around({ w: 260, h: 130, mul: 1.8, kb: 12, stun: 40, atk: 240, shake: 6, life: 14 })),
      sk(3, '철벽', 'IRON WALL', 'shield', 12, 14, 'buff', '2초 이상 무적이 되고 체력을 회복한다.', F.buff({ inv: 130, heal: 0.12, txt: 'IRON WALL' })),
      sk(3, '투척 도끼', 'THROWN AXE', 'axe', 4, 12, 'shot', '묵직한 도끼를 던져 적을 관통한다.', F.proj({ speed: 9, r: 10, mul: 2.6, pierce: 1, range: 320, kb: 6 })),
      // ---- T4
      sk(4, '전투 함성', 'WAR CRY', 'roar', 14, 20, 'buff', '함성으로 일정 시간 공격력 +50%, 체력 소량 회복.', () => {
        P.buffAtk = 420; P.hp = Math.min(P.maxhp, P.hp + 30); ring(cx(P), cy(P)); text(cx(P), P.y - 10, 'POWER UP!', PINK, 60, 20); sfx('roar'); addShake(4); }),
      sk(4, '화염 대검', 'FLAME BLADE', 'flame', 6, 18, 'slashBig', '불꽃을 두른 대검으로 넓은 범위를 베어낸다.', F.melee({ w: 210, h: 100, mul: 2.3, kb: 8, life: 14, fx: 'great' })),
      sk(4, '지진', 'TREMOR', 'quake', 7, 20, 'boom', '앞으로 연달아 땅이 솟구치며 적을 기절시킨다.', () => {
        for (let k = 0; k < 4; k++) sched(k * 8, () => {
          const x = cx(P) + P.facing * (80 + k * 90);
          addBox({ cx: x, cy: GROUND - 30, w: 110, h: 70, mul: 1.4, kb: 4, life: 8, shape: 'circle', stun: 40 }); crackFx(x, 1, 60); addShake(4); sfx('land');
        }); }),
      sk(4, '흡혈 베기', 'BLOOD REAP', 'blood', 6, 16, 'slashBig', '넓게 베어 피해를 주고 체력을 회복한다.', F.melee({ w: 120, h: 86, mul: 1.7, kb: 6, heal: 28, life: 10 })),
      // ---- T5
      sk(5, '대검 해방', 'EXECUTION', 'greatsword', 22, 32, 'slashBig', '시간이 멈춘 듯한 세 번의 참격과 대지를 가르는 마지막 충격파. 화면을 가르는 필살기. 시전 중 무적.', () => {
        P.inv = 130; ultBoost = 130;
        const hit = (k, w, h, mul, shake, ang, last) => sched(k, () => {
          addBox({ follow: true, rx: front(w), ry: 0, w, h, mul, kb: 9, life: 12, fx: 'great', stun: 26 });
          addShake(shake); sfx('slashBig'); zoomPunch(last ? 0.12 : 0.05); ghostAt(P.x, P.y, P.facing);
          bigSlash(cx(P) + P.facing * 90, cy(P) - 8, P.facing > 0 ? ang : Math.PI - ang, last ? 900 : 700);
          burst(cx(P) + P.facing * w * 0.6, cy(P), 12, 'ink'); sparks(cx(P) + P.facing * w * 0.5, cy(P), 12, '#fff', 28);
          if (last) {
            impactFrame(3); slowmo(26); flashScreen('#fff', 0.9); crackFx(cx(P), P.facing, 360); crackFx(cx(P), P.facing, 260);
            for (const sp of [9, 6]) S.projs.push({ x: cx(P) + P.facing * 20, y: GROUND - 16, vx: P.facing * sp, vy: 0, r: 18, mul: 3, life: 60, maxLife: 60, pierce: 99, color: '#fff', hit: new Set(), kb: 10, wave: true, src: 'skill', lvm: curLvm, stun: 50 });
          }
        });
        hit(0, 320, 140, 1.9, 8, -0.55); hit(14, 360, 160, 2.1, 10, 0.55); hit(30, 460, 200, 3.8, 16, 1.4, true); }),
      sk(5, '천벌', 'DIVINE SMITE', 'sun', 20, 30, 'zap', '하늘이 갈라지며 가까운 적 8명에게 성스러운 번개 기둥이 연달아 내리꽂힌다. 큰 피해와 긴 기절.', function () {
        const t = nearest(8, 600);
        if (!t.length) { text(cx(P), P.y - 10, '대상 없음', '#555'); P.cd[this.key] = 0; P.mp += this.mp; return; }
        P.inv = 90; ultBoost = 130; flashScreen('#fff', 0.85); addShake(12); impactFrame(2); slowmo(36); zoomPunch(0.08);
        t.forEach((e, i) => sched(i * 5, () => {
          const x = cx(e);
          addBox({ cx: x, cy: 200, w: 120, h: 560, mul: 3.8, kb: 0, life: 14, stun: 90 });
          addBox({ cx: x, cy: GROUND - 40, w: 280, h: 130, mul: 2.6, kb: 9, life: 10, shape: 'circle' });
          sparks(x, GROUND - 4, 18, '#fff', 32); ring(x, GROUND - 20); crackFx(x, 1, 130); crackFx(x, -1, 130);
          sfx('zap'); addShake(9); zoomPunch(0.04); hitstop(3); burst(x, GROUND - 10, 8, 'dust');
        })); }),
      sk(5, '광폭화', 'BERSERK', 'skull', 24, 24, 'roar', '충격파를 터뜨리며 광폭화. 지속시간 동안 공격력·속도가 크게 오르고 처치할 때마다 폭발한다. 지속시간이 끝난 뒤에야 쿨타임이 돈다.', () => {
        P.buffAtk = Math.max(P.buffAtk, 600); P.haste = Math.max(P.haste, 600); P.berserk = 600; ultBoost = 150;
        P.hp = Math.min(P.maxhp, P.hp + Math.round(P.maxhp * 0.2));
        addBox({ follow: true, rx: 0, ry: 0, w: 420, h: 200, mul: 2, kb: 14, life: 14, shape: 'circle', stun: 60 });
        for (let k = 0; k < 3; k++) ring(cx(P), cy(P) - k * 6);
        addShake(16); impactFrame(2); zoomPunch(0.12); flashScreen('#ff2a64', 0.7); sfx('roar'); speedLines(14); text(cx(P), P.y - 10, 'BERSERK', PINK, 80, 26); }),
      sk(5, '대지 분쇄', 'WORLD BREAKER', 'quake', 22, 34, 'jump', '하늘 높이 뛰어올랐다 내리꽂아 대지를 부수는 초거대 충격파. 착지 순간 화면이 정지하고 땅이 갈라진다. 도약 중 무적.', () => { P.vy = -16; P.slam = 1; P.slamBig = true; P.jumps = 2; P.inv = 160; zoomPunch(0.05); speedLines(8); })
    ]
  },
  {
    id: 'mage', en: 'MAGE', name: '마법사', hp: 135, mp: 170, spd: 3.1, base: 16, crit: 0.12, mpr: 0.18, lunge: 0,
    desc: '광역 마법과 압도적인 원거리 화력. 체력은 약하니 거리를 유지하라.',
    basic: { name: '마법탄', en: 'ARCANE BOLT', ico: 'orb', cd: 17, snd: 'shot', fn() { shoot({ speed: 9.5, mul: 1.15, r: 6, range: 300, homing: 0.075, cone: 0.55 }); } },
    skills: [
      sk(1, '파이어볼', 'HELLFIRE', 'fireball', 3, 12, 'fire', '폭발하는 불덩이를 던진다. 사거리 끝에서도 터진다.', () => { shoot({ speed: 7, r: 10, mul: 2.3, aoe: 82, color: PINK, range: 340 }); }),
      sk(1, '마법 화살', 'MAGIC MISSILES', 'orb', 2.5, 8, 'shot', '마력 화살 3발을 부채꼴로 발사한다.', F.proj({ n: 3, spread: 0.1, speed: 10, mul: 1.05, range: 310, homing: 0.07, cone: 0.5 })),
      sk(1, '얼음 창', 'ICE LANCE', 'ice', 3, 10, 'ice', '적을 꿰뚫고 느리게 만드는 얼음 창.', F.proj({ speed: 14, mul: 1.8, pierce: 1, slow: 150, range: 350, r: 6 })),
      sk(1, '화염 장벽', 'FLAME WALL', 'flame', 6, 14, 'fire', '앞에 불길의 벽을 세워 지나가는 적을 태운다.', F.zone({ dist: 130, w: 70, h: 130, mul: 0.6, life: 110, every: 10, tint: PINK })),
      sk(2, '아이스 노바', 'FROST NOVA', 'nova', 6, 18, 'ice', '주변 적을 얼려 느리게 만들고 결정 파편으로 피해를 준다.', () => {
        addBox({ follow: true, rx: 0, ry: 0, w: 300, h: 160, mul: 1.6, kb: 5, life: 14, slow: 200, shape: 'circle', fx: 'nova' }); ring(cx(P), cy(P)); addShake(3); }),
      sk(2, '연쇄 번개', 'CHAIN LIGHTNING', 'chain', 4, 12, 'zap', '가까운 적 3명에게 번개를 떨어뜨린다.', F.strike({ n: 3, range: 340, mul: 2.1, stun: 20 })),
      sk(2, '중력구', 'GRAVITY ORB', 'orb', 5, 14, 'fire', '느린 중력구가 폭발하며 범위 안의 적을 크게 둔화시킨다.', F.proj({ speed: 6, r: 11, aoe: 95, slow: 260, mul: 1.1, range: 280 })),
      sk(2, '마나 방벽', 'MANA SHIELD', 'shield', 12, 0, 'buff', '잠시 무적이 되고 MP를 회복한다.', F.buff({ inv: 100, mp: 25, heal: 0.05, txt: 'SHIELD' })),
      sk(3, '번개', 'THUNDERFALL', 'bolt', 6, 20, 'zap', '가까운 적 최대 4명에게 번개를 내리꽂아 기절시킨다.', F.strike({ n: 4, range: 400, mul: 2.7, stun: 40, shake: 5 })),
      sk(3, '폭염', 'INFERNO', 'flame', 7, 22, 'fire', '자신을 중심으로 거대한 불꽃이 폭발한다.', F.around({ w: 300, h: 160, mul: 2.5, kb: 8, life: 14 })),
      sk(3, '화염 광선', 'FLAME BEAM', 'beam', 6, 20, 'fire', '불꽃 광선을 연속으로 쏘아 적을 관통한다.', F.proj({ rep: 6, gap: 3, speed: 18, mul: 0.9, pierce: 99, range: 390, color: PINK, snd2: 'fire' })),
      sk(3, '서리 지대', 'FROST FIELD', 'ice', 8, 16, 'ice', '바닥을 얼려 그 위의 적을 느리게 하며 피해를 준다.', F.zone({ dist: 150, w: 320, h: 50, mul: 0.4, life: 160, every: 12, slow: 240, tint: '#fff' })),
      sk(4, '순간이동', 'PHASE SHIFT', 'blink', 4, 8, 'blink', '조준 방향으로 순간이동. 이동 중 짧은 무적.', () => {
        burst(cx(P), cy(P), 14); P.x = clamp(P.x + (P.aim.x ? sign(P.aim.x) : P.facing) * 190, S.leftBound, S.worldW - P.w); P.inv = 18; burst(cx(P), cy(P), 14); }),
      sk(4, '폭풍 구름', 'STORM CLOUD', 'cloud', 10, 28, 'zap', '앞쪽 하늘에서 번개가 여덟 번 연달아 떨어진다.', () => {
        for (let i = 0; i < 8; i++) sched(i * 10, () => {
          const x = cx(P) + P.facing * rnd(60, 360);
          addBox({ cx: x, cy: 200, w: 56, h: 520, mul: 1.5, kb: 0, life: 8, stun: 20 }); sparks(x, GROUND - 4, 6, '#fff', 18); sfx('zap'); addShake(2);
        }); }),
      sk(4, '시간 정지', 'TIME STOP', 'clock', 15, 30, 'blink', '주변 모든 적의 시간을 멈춘다.', () => {
        for (const e of S.enemies) if (!e.dead && Math.abs(cx(e) - cx(P)) < 620) { e.stun = Math.max(e.stun, e.boss ? 40 : 160); e.slow = Math.max(e.slow, 300); }
        ring(cx(P), cy(P)); flashScreen('#fff', 0.5); text(cx(P), P.y - 10, 'TIME STOP', PINK, 70, 22); }),
      sk(4, '별빛 폭격', 'STARFALL', 'meteor', 9, 26, 'meteor', '양쪽 하늘에서 별빛이 쏟아져 폭발한다.', F.rain({ n: 12, gap: 5, xmin: 50, xmax: 380, both: true, mul: 1.5, aoe: 60, r: 7, vy: 15, snd2: 'meteor' })),
      sk(5, '메테오', 'METEOR RAIN', 'meteor', 22, 48, 'meteor', '하늘을 찢고 거대한 유성 18개가 낙하 지점을 표시하며 쏟아진다. 직격은 화상.', () => {
        ultBoost = 180; addShake(8); zoomPunch(0.07); flashScreen('#ff2a64', 0.45);
        for (let i = 0; i < 18; i++) sched(i * 6, () => {
          const x = cx(P) + P.facing * rnd(40, 420) * (i % 3 === 0 ? -0.5 : 1);
          S.marks.push({ x, t: 0, life: 40 });
          S.projs.push({ x: x - 10, y: -30, vx: -0.3, vy: 14.5, r: 15, mul: 3.0, src: 'skill', lvm: curLvm, fx: curFx, ico: curIco, life: 140, maxLife: 140, aoe: 120, color: PINK, hit: new Set(), kb: 6 });
        }); }),
      sk(5, '대폭발', 'BIG BANG', 'bomb', 24, 40, 'boom', '주변의 모든 것을 한 점으로 빨아들인 뒤 거대한 폭발을 일으킨다. 시전 중 무적.', () => {
        const x = cx(P) + P.facing * 230; ring(x, GROUND - 70); text(x, GROUND - 130, 'BIG BANG', PINK, 54, 28); P.inv = 110; ultBoost = 130;
        for (let k = 0; k < 46; k++) sched(k, () => {
          for (const e of S.enemies) if (!e.dead && !e.boss && Math.abs(cx(e) - x) < 460) e.x += sign(x - cx(e)) * Math.min(4.5, Math.abs(x - cx(e)));
          if (S.parts.length < 400) for (let j = 0; j < 4; j++) { const an = rnd(0, 6.28), rd = rnd(120, 210); S.parts.push({ kind: 'ember', x: x + Math.cos(an) * rd, y: GROUND - 70 + Math.sin(an) * rd * 0.7, vx: -Math.cos(an) * rd / 22, vy: -Math.sin(an) * rd * 0.7 / 22, size: rnd(2, 5), life: 22, t: 0 }); }
          if (k % 6 === 0) { ring(x, GROUND - 70); sfx('buff'); }
          if (k === 30) slowmo(24);
        });
        sched(50, () => {
          addBox({ cx: x, cy: GROUND - 160, w: 640, h: 580, mul: 9, kb: 16, life: 16, shape: 'circle', stun: 110 });
          impactFrame(3); zoomPunch(0.16); addShake(24); sfx('boom'); flashScreen('#fff', 1); burst(x, GROUND - 80, 50, 'ink'); sparks(x, GROUND - 80, 30, PINK, 40);
          for (let k = 0; k < 3; k++) ring(x, GROUND - 40 - k * 20);
          for (const d of [-1, 1]) for (let k = 0; k < 3; k++) crackFx(x, d, rnd(160, 340));
          for (let i = 0; i < 14; i++) S.parts.push({ kind: 'shard', x: x + rnd(-120, 120), y: GROUND - 8, vx: rnd(-5, 5), vy: -rnd(5, 12), size: rnd(5, 10), rot: rnd(0, 6), vr: rnd(-0.3, 0.3), dark: true, life: 40, t: 0 });
        }); }),
      sk(5, '절대영도', 'ABSOLUTE ZERO', 'nova', 22, 38, 'ice', '시간이 얼어붙는 초거대 냉기 폭발. 화면 전체에 서리가 퍼지고 범위 안의 적이 얼음에 갇혀 오래 기절한다.', () => {
        addBox({ follow: true, rx: 0, ry: 0, w: 720, h: 300, mul: 3.8, kb: 8, life: 24, slow: 600, stun: 150, shape: 'circle', fx: 'nova' });
        for (const e of S.enemies) if (!e.dead && Math.abs(cx(e) - cx(P)) < 380) e.frozen = e.boss ? 40 : 160;
        frostT = 110; impactFrame(2); zoomPunch(0.1); flashScreen('#fff', 0.9); ultBoost = 150; addShake(14); ring(cx(P), cy(P));
        for (let i = 0; i < 44; i++) S.parts.push({ kind: 'shard', x: S.cam + rnd(0, W), y: rnd(0, GROUND), vx: rnd(-1, 1), vy: rnd(-0.5, 2.2), size: rnd(5, 12), rot: rnd(0, 6), vr: rnd(-0.2, 0.2), life: 50 + rnd(0, 36), t: 0 });
        for (let i = 0; i < 30; i++) S.parts.push({ kind: 'snow', x: S.cam + rnd(0, W), y: rnd(0, GROUND), vx: rnd(-1, 1), vy: rnd(0.5, 2), size: rnd(2, 5), life: 60 + rnd(0, 40), t: 0 }); }),
      sk(5, '용의 숨결', 'DRAGON BREATH', 'phoenix', 20, 34, 'fire', '입에서 끝없는 화염 기둥을 내뿜어 전방을 불바다로 만든다. 관통, 강한 화상.', () => {
        ultBoost = 110; addShake(12); flashScreen('#ff2a64', 0.5); zoomPunch(0.08);
        S.parts.push({ kind: 'jet', x: cx(P) + P.facing * 18, y: cy(P) - 8, ang: Math.atan2(P.aim.y, P.aim.x), len: 400, life: 44, t: 0 });
        F.proj({ n: 9, spread: 0.08, rep: 5, gap: 6, speed: 13, mul: 1.9, pierce: 99, range: 420, color: PINK, r: 7, snd2: 'fire' })();
        for (let k = 0; k < 36; k++) sched(k, () => {
          if (S.parts.length < 430) for (let j = 0; j < 3; j++) S.parts.push({ kind: 'ember', x: cx(P) + P.facing * rnd(20, 360), y: cy(P) + rnd(-50, 40), vx: P.facing * rnd(1, 5), vy: rnd(-1.5, 0.5), size: rnd(3, 6), life: rnd(16, 28), t: 0 });
          if (k % 6 === 0) addShake(6);
        }); })
    ]
  },
  {
    id: 'archer', en: 'ARCHER', name: '궁수', hp: 115, mp: 90, spd: 3.4, base: 11, crit: 0.15, mpr: 0.09, lunge: 0,
    desc: '빠른 연사와 관통, 하늘을 덮는 화살비. 움직이며 쏘는 사냥꾼.',
    basic: { name: '화살', en: 'QUICK SHOT', ico: 'arrow', cd: 14, snd: 'arrow', fn() { shoot({ speed: 12, mul: 1, r: 4, range: 340, homing: 0.06, cone: 0.5 }); } },
    skills: [
      sk(1, '3연발', 'TRIPLE SHOT', 'arrows3', 3, 8, 'arrow', '화살 3발을 부채꼴로 발사한다.', () => { for (const a of [-0.14, 0, 0.14]) shoot({ speed: 12, da: a, mul: 0.9, r: 4, range: 300 }); }),
      sk(1, '정조준', 'AIMED SHOT', 'scope', 3, 8, 'arrow', '빠르고 강력한 한 발. 적 하나를 관통한다.', F.proj({ speed: 20, mul: 2.4, pierce: 1, range: 420, homing: 0.05, cone: 0.35 })),
      sk(1, '폭발 화살', 'BLAST ARROW', 'bomb', 3.5, 10, 'fire', '명중하면 터지는 화살.', F.proj({ speed: 13, aoe: 60, mul: 1.6, range: 330, r: 6, color: PINK })),
      sk(1, '속사', 'RAPID FIRE', 'arrow', 4, 10, 'arrow', '화살 5발을 빠르게 연달아 쏜다.', F.proj({ rep: 5, gap: 4, speed: 14, mul: 0.7, range: 320, jit: 0.04 })),
      sk(2, '관통 화살', 'PIERCING GALE', 'pierce', 4, 12, 'arrow', '적을 모두 관통하는 강력한 화살. 사거리가 길다.', () => { shoot({ speed: 17, mul: 1.8, r: 7, pierce: 99, color: PINK, range: 420 }); }),
      sk(2, '덫 설치', 'BEAR TRAP', 'trap', 6, 10, 'land', '앞에 덫을 설치한다. 밟은 적을 오래 기절시킨다.', F.zone({ dist: 90, w: 80, h: 30, mul: 1.2, life: 240, stun: 100, tint: '#fff' })),
      sk(2, '독 화살', 'POISON ARROW', 'poison', 4, 10, 'arrow', '맞은 적에게 지속 독 피해를 입힌다.', F.proj({ speed: 13, mul: 1, poison: 300, pierce: 1, range: 330, color: PINK })),
      sk(2, '회피 사격', 'EVASIVE SHOT', 'backstep', 5, 12, 'dash', '뒤로 물러나며 화살 3발을 쏜다. 이동 중 무적.', F.proj({ n: 3, spread: 0.1, back: true, speed: 13, mul: 1, range: 300 })),
      sk(3, '백스텝', 'SHADOW STEP', 'backstep', 4, 10, 'dash', '뒤로 물러나며 화살 2발을 쏜다. 이동 중 무적.', () => {
        P.dash = 10; P.dashV = -P.facing * 10; P.inv = 12;
        for (const a of [-0.08, 0.08]) shoot({ speed: 12, da: a, mul: 1.1, r: 4, range: 280 }); }),
      sk(3, '서리 화살', 'FROST ARROW', 'ice', 4, 12, 'ice', '맞으면 폭발해 주변 적을 느리게 만든다.', F.proj({ aoe: 55, slow: 240, mul: 1.3, speed: 13, range: 340 })),
      sk(3, '부채 난사', 'FAN OF ARROWS', 'fan', 5, 14, 'arrow', '화살 9발을 넓은 부채꼴로 흩뿌린다.', F.proj({ n: 9, spread: 0.12, speed: 12, mul: 0.6, range: 280 })),
      sk(3, '올가미 사격', 'SNARE SHOT', 'chain', 5, 12, 'arrow', '적을 꿰뚫고 기절시키는 올가미 화살.', F.proj({ stun: 70, pierce: 1, mul: 0.9, speed: 15, range: 340 })),
      sk(4, '화살비', 'ARROW STORM', 'rain', 9, 28, 'arrow', '화살 16발이 전방 하늘에서 쏟아진다.', () => {
        for (let i = 0; i < 16; i++) sched(i * 4, () => {
          const x = cx(P) + P.facing * rnd(90, 320);
          S.projs.push({ x, y: -10, vx: 0, vy: 14, r: 5, mul: 1, src: 'skill', lvm: curLvm, fx: curFx, ico: curIco, life: 80, maxLife: 80, aoe: 38, color: '#fff', hit: new Set(), kb: 1 });
          if (i % 3 === 0) sfx('arrow');
        }); }),
      sk(4, '회오리 화살', 'HURRICANE', 'wind', 9, 26, 'arrow', '사방으로 흩어지는 화살을 여덟 번 연속으로 쏜다.', F.proj({ n: 2, rep: 8, gap: 4, spread: 0.5, jit: 0.35, speed: 12, mul: 0.6, range: 300 })),
      sk(4, '불화살 비', 'FIRE RAIN', 'rain', 10, 26, 'fire', '양쪽 하늘에서 불화살이 쏟아져 터진다.', F.rain({ n: 14, gap: 4, xmin: 70, xmax: 360, both: true, mul: 1.3, aoe: 55, r: 6, color: PINK })),
      sk(4, '저격', 'SNIPE', 'scope', 8, 22, 'arrow', '초장거리 저격. 모든 적을 관통하는 일격.', F.proj({ speed: 28, mul: 4.5, pierce: 99, range: 560, r: 6, color: PINK })),
      sk(5, '집중', "HUNTER'S EYE", 'focus', 22, 25, 'buff', '사냥꾼의 눈이 열린다. 시간이 느려지고 이동·공격·쿨타임이 빨라지며 모든 화살이 적을 관통한다. 지속시간이 끝난 뒤에야 쿨타임이 돈다.', () => {
        P.haste = Math.max(P.haste, 420); P.focus = 420; P.eye = 420; ring(cx(P), cy(P)); slowmo(34); zoomPunch(0.08); impactFrame(1); flashScreen('#ff2a64', 0.5); text(cx(P), P.y - 46, "HUNTER'S EYE", PINK, 80, 20); }),
      sk(5, '불사조 화살', 'PHOENIX ARROW', 'phoenix', 20, 32, 'fire', '거대한 불사조가 날아가 폭발하며 불바다를 남긴다. 강한 폭발과 지속 화상 지대.', () => { ultBoost = 130; zoomPunch(0.06); addShake(6); F.proj({ speed: 15, aoe: 200, mul: 7.5, range: 540, r: 14, color: PINK })(); }),
      sk(5, '천공 화살', 'SKYFALL', 'rain', 22, 36, 'arrow', '하늘이 열리며 화살 56발이 양쪽으로 쏟아져 터진다. 빛줄기와 진동이 전장을 뒤덮는다.', () => {
        ultBoost = 170; zoomPunch(0.06); flashScreen('#fff', 0.5);
        F.rain({ n: 56, gap: 2, xmin: 20, xmax: 500, both: true, mul: 1.6, aoe: 62, r: 6 })();
        for (let k = 0; k < 28; k++) sched(k * 4, () => { S.parts.push({ kind: 'streak', x: S.cam + rnd(0, W), y: rnd(60, GROUND - 60), ang: Math.PI / 2, len: 90, life: 9, t: 0 }); if (k % 3 === 0) addShake(5); }); }),
      sk(5, '살육', 'SLAUGHTER', 'skull', 24, 28, 'buff', '살육의 광기. 공격력·속도 상승, 모든 화살이 관통하며 처치할 때마다 폭발한다. 첫 공격은 반드시 치명타. 지속시간이 끝난 뒤에야 쿨타임이 돈다.', () => {
        P.buffAtk = Math.max(P.buffAtk, 480); P.haste = Math.max(P.haste, 480); P.focus = 480; P.berserk = 480; P.nextCrit = true; ultBoost = 150;
        ring(cx(P), cy(P)); impactFrame(2); zoomPunch(0.1); flashScreen('#ff2a64', 0.7); addShake(10); text(cx(P), P.y - 10, 'SLAUGHTER', PINK, 80, 22); })
    ]
  },
  {
    id: 'rogue', en: 'ROGUE', name: '도적', hp: 105, mp: 90, spd: 4.2, base: 10, crit: 0.28, mpr: 0.1, lunge: 4,
    desc: '번개 같은 기동력과 높은 치명타. 한 번의 틈에 모든 것을 건다.',
    basic: { name: '단검', en: 'FANG', ico: 'slash', cd: 10, snd: 'slash', fn() { melee(48, 40, 0.8, { life: 6, kb: 2 }); } },
    skills: [
      sk(1, '표창 투척', 'STAR STORM', 'shuriken', 3, 8, 'arrow', '표창 5개를 부채꼴로 던진다.', () => { for (const a of [-0.3, -0.15, 0, 0.15, 0.3]) shoot({ speed: 10, da: a, mul: 0.7, r: 4, range: 250 }); }),
      sk(1, '암습', 'BACKSTAB', 'dagger', 3, 8, 'slash', '치명타가 보장된 빠른 일격.', F.melee({ w: 62, h: 50, mul: 2.2, nc: true, lunge: 6, kb: 3 })),
      sk(1, '쌍단검', 'TWIN FANGS', 'twin', 2.5, 7, 'slash', '두 단검으로 연속 두 번 벤다.', F.melee({ w: 56, h: 46, mul: 0.9, rep: 2, gap: 4, lunge: 3, kb: 2 })),
      sk(1, '독 바르기', 'POISON COAT', 'poison', 4, 9, 'shot', '독 묻은 단검 2자루를 던진다.', F.proj({ n: 2, spread: 0.1, poison: 240, mul: 0.8, speed: 11, range: 280, color: PINK })),
      sk(2, '그림자 질주', 'SHADOW RUSH', 'shadow', 4, 10, 'dash', '그림자처럼 앞으로 질주하며 적을 벤다. 질주 중 무적.', () => {
        P.dash = 16; P.dashV = P.facing * 14; P.inv = 16;
        addBox({ follow: true, rx: front(60), ry: 0, w: 60, h: 54, mul: 1, kb: 3, life: 16, every: 5 }); }),
      sk(2, '연막탄', 'SMOKE BOMB', 'smoke', 8, 12, 'blink', '연막을 터뜨려 범위 안 적을 둔화시키고 잠시 무적이 된다.', F.zone({ dist: 0, w: 200, h: 60, mul: 0.3, life: 120, every: 15, slow: 240, tint: '#fff', inv: 30 })),
      sk(2, '회전 단검', 'SPINNING BLADES', 'spin', 5, 12, 'slashBig', '단검을 휘두르며 회전해 주변을 벤다.', F.around({ w: 150, h: 90, mul: 0.6, every: 6, life: 36, fx: 'spin', kb: 3 })),
      sk(2, '쇄도', 'FLASH STEP', 'dash', 3.5, 10, 'dash', '번개처럼 빠르게 파고들며 적을 벤다.', F.dash({ f: 12, v: 17, mul: 1.2, w: 56, stun: 20 })),
      sk(3, '독 단검', 'VENOM EDGE', 'dagger', 5, 12, 'shot', '맞은 적에게 지속 독 피해를 입히는 단검.', () => { shoot({ speed: 11, mul: 1, r: 6, color: PINK, poison: 300, pierce: 1, range: 290 }); }),
      sk(3, '그림자 분신', 'SHADOW CLONE', 'shadow', 9, 18, 'blink', '잠시 무적이 되어 분신과 함께 세 번 베고, 첫 공격은 치명타.', () => {
        P.inv = 70; P.nextCrit = true;
        for (let k = 0; k < 3; k++) sched(k * 10, () => { melee(76, 54, 1.4, { life: 6, kb: 3 }); sfx('slash'); burst(cx(P), cy(P), 4); }); }),
      sk(3, '폭탄 투척', 'BOMB TOSS', 'bomb', 4, 12, 'shot', '터지는 폭탄을 던진다.', F.proj({ speed: 8, aoe: 75, mul: 1.8, range: 250, r: 8, color: PINK })),
      sk(3, '사슬 갈고리', 'CHAIN HOOK', 'chain', 5, 12, 'arrow', '적을 관통하며 기절시키는 사슬 갈고리.', F.proj({ speed: 16, pierce: 99, stun: 45, mul: 0.9, range: 300, r: 6 })),
      sk(4, '연막', 'SMOKE VEIL', 'smoke', 10, 15, 'blink', '연막으로 몸을 숨기고 다음 공격이 반드시 치명타.', () => {
        P.inv = 100; P.stealth = 100; P.nextCrit = true; ring(cx(P), cy(P)); text(cx(P), P.y - 10, 'CRIT READY', PINK, 60, 18);
        for (let i = 0; i < 4; i++) burst(cx(P), cy(P) + 10, 10, 'dust'); }),
      sk(4, '표창 폭풍', 'SHURIKEN STORM', 'shuriken', 8, 22, 'arrow', '표창 5개를 네 차례 연속으로 던진다.', F.proj({ n: 5, spread: 0.25, rep: 4, gap: 6, speed: 10, mul: 0.6, range: 270 })),
      sk(4, '처형', 'EXECUTE', 'skull', 7, 18, 'slashBig', '돌진해 치명타로 내려치는 강력한 일격.', F.melee({ w: 92, h: 70, mul: 3.8, nc: true, kb: 10, dash: 8, dv: 14, life: 10 })),
      sk(4, '맹독 구름', 'TOXIC CLOUD', 'cloud', 9, 20, 'blink', '독구름을 만들어 안의 적에게 지속 독 피해를 입힌다.', F.zone({ dist: 140, w: 240, h: 110, mul: 0.3, life: 200, every: 20, tint: PINK, poison: 260 })),
      sk(5, '난무', 'DANCE OF BLADES', 'flurry', 22, 36, 'dash', '그림자 속을 오가며 16연속 베기. 마지막은 화면을 가르는 일격. 시전 중 무적.', () => {
        P.inv = 130; ultBoost = 130;
        for (let i = 0; i < 16; i++) sched(i * 5, () => {
          const t = nearEnemy(440);
          ghostAt(P.x, P.y, P.facing);
          if (t) { P.x = clamp(cx(t) - P.facing * 30 - P.w / 2, S.leftBound, S.worldW - P.w); P.facing = sign(cx(t) - cx(P)) || P.facing; }
          const last = i === 15;
          addBox({ cx: cx(P) + P.facing * 30, cy: cy(P), w: last ? 200 : 110, h: last ? 140 : 90, mul: last ? 5 : 1.3, kb: last ? 12 : 0, life: 5, rx: P.facing, ry: 0 });
          sfx('slash'); burst(cx(P), cy(P), 5); bigSlash(cx(P) + P.facing * 20, cy(P), rnd(-1.2, 1.2) + (P.facing > 0 ? 0 : Math.PI), 560); addShake(i % 3 === 0 ? 5 : 2);
          if (last) { addShake(18); impactFrame(3); slowmo(26); zoomPunch(0.14); flashScreen('#fff', 0.9); sparks(cx(P) + P.facing * 40, cy(P), 24, PINK, 36); burst(cx(P), cy(P), 24, 'ink'); }
        }); }),
      sk(5, '암살', 'ASSASSINATE', 'dagger', 16, 30, 'blink', '시간이 멈춘 순간 적 뒤로 이동해 치명타 일격을 꽂는다. 단일 대상에게 엄청난 피해와 출혈.', function () {
        const t = nearEnemy(480);
        if (!t) { text(cx(P), P.y - 10, '대상 없음', '#555'); P.cd[this.key] = 0; P.mp += this.mp; return; }
        ultBoost = 110; slowmo(30); impactFrame(1); ghostAt(P.x, P.y, P.facing); burst(cx(P), cy(P), 12);
        P.facing = sign(cx(t) - cx(P)) || P.facing; P.x = clamp(cx(t) + P.facing * 34 - P.w / 2, S.leftBound, S.worldW - P.w); P.inv = 70; P.nextCrit = true;
        sched(12, () => {
          addBox({ cx: cx(t), cy: cy(t), w: t.w + 40, h: t.h + 30, mul: 12, kb: 4, life: 6, rx: P.facing, ry: 0 });
          bigSlash(cx(t), cy(t), -0.7, 640); bigSlash(cx(t), cy(t), 0.7, 640);
          for (let i = 0; i < 16; i++) S.parts.push({ kind: 'drop', x: cx(t), y: cy(t), vx: rnd(-4, 4), vy: -rnd(1, 6), size: rnd(2, 4), life: 30, t: 0 });
          sparks(cx(t), cy(t), 22, PINK, 38); addShake(20); impactFrame(3); zoomPunch(0.16); flashScreen('#fff', 0.9);
          if (!t.dead) { t.bleedN = 5; t.bleed = 300; t.bleedD = Math.max(2, Math.round(t.maxhp * 0.008)); }
        }); }),
      sk(5, '그림자 군단', 'SHADOW LEGION', 'shadow', 24, 38, 'dash', '그림자 군단이 주변 적들을 동시에 열네 번 습격한다. 분신이 적 사이에서 쏟아져 나온다. 시전 중 무적.', () => {
        P.inv = 100; ultBoost = 120; zoomPunch(0.06);
        for (let i = 0; i < 14; i++) sched(i * 4, () => {
          const pool = S.enemies.filter(e => !e.dead && Math.abs(cx(e) - cx(P)) < 560);
          if (!pool.length) return;
          const t = choice(pool), f = Math.random() < 0.5 ? 1 : -1;
          S.parts.push({ kind: 'ghost', x: cx(t) - f * 36 - P.w / 2, y: t.y + t.h - P.h, w: P.w, h: P.h, f, life: 14, t: 0 });
          addBox({ cx: cx(t), cy: cy(t), w: 120, h: 120, mul: 2.2, kb: 3, life: 4, rx: f, ry: 0 }); bigSlash(cx(t), cy(t), rnd(-1, 1), 500); sfx('slash'); burst(cx(t), cy(t), 4); addShake(4);
          if (i === 13) { impactFrame(2); flashScreen('#fff', 0.7); addShake(14); }
        }); }),
      sk(5, '죽음의 표식', 'DEATH MARK', 'mark', 24, 32, 'roar', '범위 안 모든 적에게 맹독 표식을 새긴다. 2초 뒤 표식이 일제히 폭발하며 연쇄 피해를 준다.', () => {
        const d = Math.max(1, pd(0.55, 'skill')), marks = S.enemies.filter(e => !e.dead && Math.abs(cx(e) - cx(P)) < 580);
        for (const e of marks) { e.poison = 360; e.pd = d; e.slow = Math.max(e.slow, 200); e.marked = 120; burst(cx(e), cy(e), 4, 'ink'); }
        ring(cx(P), cy(P)); flashScreen('#000', 0.4); addShake(6); impactFrame(1); zoomPunch(0.06); ultBoost = 220;
        sched(60, () => { for (const e of marks) if (!e.dead) ring(cx(e), cy(e)); sfx('warn'); });
        sched(120, () => {
          marks.forEach((e, i) => sched(i * 3, () => { if (e.dead) return; addBox({ cx: cx(e), cy: cy(e), w: 170, h: 170, mul: 6, kb: 8, life: 6, shape: 'circle' }); sparks(cx(e), cy(e), 14, PINK, 30); bigSlash(cx(e), cy(e), rnd(-1, 1), 360); addShake(7); sfx('hitHeavy'); }));
          addShake(16); impactFrame(3); zoomPunch(0.12); sfx('boom'); flashScreen('#fff', 0.8);
        }); })
    ]
  }
];
// 지속시간(프레임): 지속시간이 끝난 뒤에 쿨타임이 돌기 시작한다 (쿨타임 = 지속시간 + 기본 쿨타임)
const DURS = { warrior7: 42, warrior9: 240, warrior10: 130, warrior12: 420, warrior16: 100, warrior18: 600, warrior19: 140, mage7: 100, mage14: 160, mage16: 100, mage17: 110, mage19: 30, archer12: 64, archer13: 32, archer16: 420, archer18: 126, archer19: 480, rogue5: 120, rogue6: 36, rogue12: 100, rogue16: 150, rogue18: 100, rogue19: 110 };
CLASSES.forEach(c => c.skills.forEach((s, i) => { s.id = c.id + i; s.cls = c.id; s.dur = DURS[s.id] || 0; SKILLDB[s.id] = s; }));
