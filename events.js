'use strict';
// ===== 던전 이벤트: 보물 상자(미믹) / 매복방 / 제단 =====
SEG.chest = function (x) {
  const w = rnd(420, 600); groundMobs(x + 60, x + w - 60, 2);
  S.events.push({ type: 'chest', x: x + w / 2, opened: false, mimic: stageIdx >= 1 && Math.random() < 0.2 });
  return w;
};
SEG.shrine = function (x) {
  const w = 480; groundMobs(x + 40, x + 140, 1);
  S.events.push({ type: 'shrine', x: x + w / 2, used: false });
  return w;
};
SEG.ambush = function (x) {
  const w = 1000, b = 3 + Math.floor(stageIdx / 3);
  S.events.push({ type: 'ambush', x0: x, x1: x + w, state: 0, wave: 0, mobs: [], waves: [b, b + 1, b + 2] });
  return w;
};
function interact(ev) { if (ev.type === 'chest') openChest(ev); else if (ev.type === 'shrine') prayShrine(ev); }
function dropItemAt(x, y, minR, bias) {
  S.drops.push({ kind: 'item', x, y, vx: rnd(-3, 3), vy: -rnd(5, 9), age: 0, item: makeItem(choice(SLOT_ORDER), rollRarity(stageIdx + bias, minR), stageIdx, P.cls.id) });
}
function openChest(ev) {
  ev.opened = true; sfx('levelup'); ring(ev.x, GROUND - 20); addShake(4);
  if (ev.mimic) {
    const m = spawnE('mimic', ev.x - 23); m.isMimic = true; m.dmg *= 1.2;
    text(ev.x, GROUND - 70, 'MIMIC!', PINK, 80, 28); sfx('roar'); addShake(10); flashScreen('#000', 0.5); burst(ev.x, GROUND - 20, 14, 'ink'); return;
  }
  const rich = !!ev.rich, total = Math.round((50 + 45 * stageIdx) * (rich ? 2.5 : 1) * DIFFS[P.diff === undefined ? 1 : P.diff].gold);
  for (let i = 0; i < 8; i++) S.drops.push({ kind: 'gold', x: ev.x + rnd(-14, 14), y: GROUND - 30, vx: rnd(-3.5, 3.5), vy: -rnd(5, 9), amt: Math.max(1, Math.round(total / 8)), age: 0 });
  const n = rich ? 2 : (Math.random() < 0.65 ? 1 : 0) + (Math.random() < 0.12 ? 1 : 0);
  for (let i = 0; i < n; i++) dropItemAt(ev.x + rnd(-10, 10), GROUND - 40, rich ? 1 : 0, rich ? 2 : 1);
  sparks(ev.x, GROUND - 30, 16, '#fff', 28); SAVE.chests++; saveMark();
}
function mimicDrop(e) {
  for (let i = 0; i < 2; i++) dropItemAt(cx(e) + rnd(-12, 12), cy(e), 1, 2);
  const total = Math.round((60 + 50 * stageIdx) * 2);
  for (let i = 0; i < 6; i++) S.drops.push({ kind: 'gold', x: cx(e) + rnd(-10, 10), y: cy(e), vx: rnd(-3.5, 3.5), vy: -rnd(5, 9), amt: Math.round(total / 6), age: 0 });
  SAVE.mimics++; saveMark();
}
function prayShrine(ev) {
  if (P.hp <= P.maxhp * 0.25) { text(cx(P), P.y - 14, 'HP가 부족합니다', '#555', 60, 16); sfx('hurt'); return; }
  ev.used = true; const cost = Math.round(P.maxhp * 0.15); P.hp -= cost; text(cx(P), P.y - 6, '-' + cost, PINK, 50, 20);
  ring(ev.x, GROUND - 60); flashScreen('#ff2a64', 0.45); addShake(5); sfx('roar'); SAVE.shrines++; saveMark();
  const r = Math.floor(Math.random() * 5);
  if (r === 0) { P.buffAtk = Math.max(P.buffAtk, 3600); text(ev.x, GROUND - 120, '축복: 공격력 UP (60초)', PINK, 110, 18); }
  else if (r === 1) { P.haste = Math.max(P.haste, 3600); text(ev.x, GROUND - 120, '축복: 가속 (60초)', PINK, 110, 18); }
  else if (r === 2) { const g = Math.round((120 + 80 * stageIdx) * DIFFS[P.diff === undefined ? 1 : P.diff].gold); P.gold += g; SAVE.gold += g; text(ev.x, GROUND - 120, '축복: 골드 +' + g, PINK, 110, 18); }
  else if (r === 3) { dropItemAt(ev.x, GROUND - 80, 1, 2); text(ev.x, GROUND - 120, '축복: 장비 하사', PINK, 110, 18); }
  else { P.hp = Math.min(P.maxhp, P.hp + Math.round(P.maxhp * 0.6)); P.mp = P.maxmp; text(ev.x, GROUND - 120, '축복: 회복', PINK, 110, 18); }
}
function ambushWave(ev) {
  const n = ev.waves[ev.wave];
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, x = side > 0 ? ev.x1 - 160 - rnd(0, 120) : ev.x0 + 160 + rnd(0, 120), tp = choice(S.D.types);
    const e = ETYPES[tp].ai === 'fly' ? spawnE(tp, x, rnd(150, 280)) : spawnE(tp, x);
    ev.mobs.push(e); burst(cx(e), cy(e), 6, 'ink');
  }
  text((ev.x0 + ev.x1) / 2, 200, 'WAVE ' + (ev.wave + 1) + ' / ' + ev.waves.length, PINK, 70, 26); sfx('warn');
}
function ambushUpdate(ev) {
  if (ev.state === 0) {
    if (cx(P) > ev.x0 + 280 && cx(P) < ev.x1 - 280) {
      ev.state = 1; ev.wave = 0; S.lockL = ev.x0 + 120; S.lockR = ev.x1 - 120;
      text(cx(P), P.y - 50, 'AMBUSH!', PINK, 90, 32); sfx('roar'); addShake(10); flashScreen('#000', 0.45); ambushWave(ev);
    }
  } else if (ev.state === 1) {
    ev.mobs = ev.mobs.filter(m => !m.dead);
    if (!ev.mobs.length) {
      ev.wave++;
      if (ev.wave >= ev.waves.length) {
        ev.state = 2; S.lockL = -1; S.lockR = 1e9;
        text((ev.x0 + ev.x1) / 2, 200, 'CLEAR!', '#fff', 110, 36); sfx('clear'); flashScreen('#fff', 0.4); addShake(6);
        S.events.push({ type: 'chest', x: (ev.x0 + ev.x1) / 2, opened: false, mimic: false, rich: true });
        SAVE.ambushes++; saveMark();
      } else ambushWave(ev);
    }
  }
}
function updEvents() {
  S.nearInter = null;
  for (const ev of S.events) {
    if (ev.type === 'chest' && !ev.opened && Math.abs(cx(P) - ev.x) < 64) S.nearInter = ev;
    else if (ev.type === 'shrine' && !ev.used && Math.abs(cx(P) - ev.x) < 64) S.nearInter = ev;
    else if (ev.type === 'ambush') ambushUpdate(ev);
  }
}
function drawEvents() {
  const x0 = S.cam - 120, x1 = S.cam + W + 120;
  for (const ev of S.events) {
    if (ev.type === 'chest' || ev.type === 'shrine') {
      if (ev.x < x0 || ev.x > x1) continue;
      const x = ev.x, y = GROUND;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 30, 4, 0, 0, 7); ctx.fill();
      if (ev.type === 'chest') {
        const open = ev.opened, rich = ev.rich;
        ctx.fillStyle = INK; ctx.strokeStyle = rich ? PINK : '#555'; ctx.lineWidth = 2;
        ctx.fillRect(x - 24, y - 26, 48, 26); ctx.strokeRect(x - 24, y - 26, 48, 26);
        ctx.save(); ctx.translate(x - 24, y - 26); if (open) ctx.rotate(-0.9);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(24, -26, 48, 0); ctx.closePath(); ctx.fillStyle = INK; ctx.fill(); ctx.stroke(); ctx.restore();
        ctx.fillStyle = PINK; ctx.fillRect(x - 5, y - 24, 10, 10);
        if (open) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - 20, y - 30, 40, 5); }
        else if (rich) { ctx.fillStyle = 'rgba(255,42,100,.2)'; ctx.beginPath(); ctx.arc(x, y - 20, 34 + Math.sin(S.t * 0.15) * 4, 0, 7); ctx.fill(); }
        if (!open && S.nearInter === ev) tag('ENTER  열기', x - 38, y - 52 + Math.sin(S.t * 0.12) * 3, 16, PINK, '#fff', BODY);
      } else {
        const used = ev.used;
        ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 20, y - 22); ctx.lineTo(x + 20, y - 22); ctx.lineTo(x + 30, y); ctx.closePath(); ctx.fill();
        ctx.fillRect(x - 8, y - 56, 16, 36); ctx.beginPath(); ctx.moveTo(x - 18, y - 56); ctx.lineTo(x + 18, y - 56); ctx.lineTo(x + 8, y - 62); ctx.lineTo(x - 8, y - 62); ctx.closePath(); ctx.fill();
        const fy = y - 80 + Math.sin(S.t * 0.1) * 3;
        if (!used) { ctx.fillStyle = 'rgba(255,42,100,.2)'; ctx.beginPath(); ctx.arc(x, fy, 22, 0, 7); ctx.fill(); ctx.fillStyle = PINK; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, fy, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, fy, 3.5, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(x, fy, 6, 0, 7); ctx.fill(); }
        if (!used && S.nearInter === ev) tag('ENTER  기도 (HP -15%)', x - 70, y - 100 + Math.sin(S.t * 0.12) * 3, 16, PINK, '#fff', BODY);
        else if (!used) tag('SHRINE', x - 26, y - 106, 12, INK, '#fff');
      }
    } else if (ev.type === 'ambush' && ev.state === 1) {
      for (const gx of [S.lockL, S.lockR]) {
        if (gx < x0 || gx > x1) continue;
        for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,42,100,.55)' : 'rgba(11,11,13,.8)'; ctx.fillRect(gx - 6, i * 60, 12, 60); }
        ctx.fillStyle = 'rgba(255,42,100,.12)'; ctx.fillRect(gx - 24, 0, 48, GROUND);
        tag('LOCKED', gx - 30, 120, 14, PINK, '#fff');
      }
    }
  }
}
