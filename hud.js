'use strict';
// ===== HUD (정돈된 사선 패널 스타일) =====
let hudHp = null, hudP = null, comboShown = 0, comboPop = 0, hudGold = 0, goldPop = 0, lastCdv = {}, readyFlash = {};
function hudSlant(x, y, w, h, k, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - k, y + h); ctx.lineTo(x - k, y + h); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
function hudBar(x, y, w, h, v, max, fill, trail) {
  ctx.fillStyle = '#26262b'; ctx.fillRect(x, y, w, h);
  if (trail !== undefined) { ctx.fillStyle = '#f2f0ea'; ctx.fillRect(x, y, w * clamp(trail / max, 0, 1), h); }
  ctx.fillStyle = fill; ctx.fillRect(x, y, w * clamp(v / max, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x, y, w * clamp(v / max, 0, 1), Math.max(1, h * 0.35));
}
function hudPie(cxp, cyp, r, frac, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(cxp, cyp); ctx.arc(cxp, cyp, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.closePath(); ctx.fill();
}
function coinIcon(x, y, r) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 7); ctx.fill();
}
function keycap(label, x, y, bg = '#fff', fg = INK) {
  ctx.font = `13px ${DISPLAY}`; const w = Math.max(18, ctx.measureText(label).width + 10);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 14, w + 2, 19); ctx.fillStyle = bg; ctx.fillRect(x, y - 13, w, 17);
  ctx.textAlign = 'center'; ctx.fillStyle = fg; ctx.fillText(label, x + w / 2, y); return w + 2;
}

function drawHUD() {
  const cls = P.cls;
  if (hudP !== P) { hudP = P; hudHp = P.hp; hudGold = P.gold; }
  hudHp += (P.hp - hudHp) * 0.07;
  if (P.gold !== hudGold) { if (P.gold > hudGold) goldPop = 8; hudGold += Math.sign(P.gold - hudGold) * Math.max(1, Math.ceil(Math.abs(P.gold - hudGold) * 0.2)); }
  if (goldPop > 0) goldPop--;

  // ── 플레이어 카드
  hudSlant(14, 12, 344, 104, 16, 'rgba(11,11,13,.93)');
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(21, 12); ctx.lineTo(5, 116); ctx.lineTo(-2, 116); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PAPER; ctx.fillRect(26, 20, 64, 76); drawPortrait(cls.id, 26, 20, 64, 76);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(26, 20, 64, 76);
  ctx.fillStyle = PINK; ctx.fillRect(26, 96, 64, 4);
  T(cls.en, 102, 44, 25, '#fff');
  ctx.font = `25px ${DISPLAY}`; const nw = ctx.measureText(cls.en).width;
  tag('Lv.' + P.lv, 102 + nw + 10, 42, 15, PINK, '#fff');
  hudBar(102, 52, 222, 15, P.hp, P.maxhp, P.hp / P.maxhp < 0.3 ? '#ff6a8c' : PINK, hudHp);
  T(`HP ${Math.ceil(P.hp)} / ${P.maxhp}`, 108, 64, 11, '#fff', 'left', BODY);
  hudBar(102, 71, 222, 8, P.mp, P.maxmp, '#f2f0ea');
  hudBar(102, 85, 222, 4, P.exp, needExp(P.lv), PINK);
  T('MP', 328, 79, 9, '#999', 'left', BODY); T('XP', 328, 90, 9, '#999', 'left', BODY);
  // 버프 칩
  const chips = [];
  if (P.buffAtk > 0) chips.push(['ATK', P.buffAtk]); if (P.haste > 0) chips.push(['HST', P.haste]); if (P.focus > 0) chips.push(['EYE', P.focus]);
  if (P.stealth > 0) chips.push(['HID', P.stealth]); else if (P.inv > 70) chips.push(['INV', P.inv]);
  chips.forEach((c, i) => {
    const x = 30 + i * 52;
    hudSlant(x, 124, 46, 20, 6, PINK); T(c[0], x + 5, 139, 13, '#fff'); T((c[1] / 60).toFixed(0) + 's', x + 28, 139, 11, '#fff', 'left', BODY);
  });

  // ── 우상단: 스테이지 / 골드 / 포인트
  const D = S.D;
  ctx.font = `26px ${DISPLAY}`; const sw = Math.max(ctx.measureText(D.en).width, 120) + 40;
  hudSlant(W - 14 - sw + 16, 12, sw, 48, 16, 'rgba(11,11,13,.93)');
  ctx.fillStyle = PINK; ctx.fillRect(W - 14 + 16 - sw - 16 + 16, 12, 4, 48);
  T('STAGE ' + (stageIdx + 1), W - 30 - sw + 44, 28, 12, PINK, 'left'); T(D.en, W - 30 - sw + 44, 52, 26, '#fff', 'left');
  T('★'.repeat(D.stars) + '☆'.repeat(6 - D.stars), W - 22, 74, 13, PINK, 'right');
  // 골드
  const gs = 1 + goldPop * 0.03, gtxt = String(Math.round(hudGold)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  ctx.save(); ctx.translate(W - 22, 98); ctx.scale(gs, gs);
  ctx.font = `22px ${DISPLAY}`; const gw = ctx.measureText(gtxt).width + 46;
  hudSlant(-gw + 14, -20, gw, 28, 8, 'rgba(11,11,13,.93)'); coinIcon(-gw + 24, -6, 8); T(gtxt, 0, 2, 22, '#fff', 'right');
  ctx.restore();
  let yy = 124;
  if (P.points > 0) { ctx.globalAlpha = 0.7 + Math.sin(S.t * 0.15) * 0.3; hudSlant(W - 150, yy - 16, 136, 22, 8, PINK); T('STAT +' + P.points, W - 28, yy, 16, '#fff', 'right'); T('TAB', W - 142, yy - 2, 10, '#fff', 'left', BODY); ctx.globalAlpha = 1; yy += 28; }
  T('TAB 메뉴 · P 일시정지 · M 음소거', W - 16, yy + 2, 11, 'rgba(20,20,20,.65)', 'right', BODY);

  // ── 진행도 바 (체크포인트 / 보스)
  { const px = 392, pw = 190, prog = clamp(P.x / S.arenaL, 0, 1);
    ctx.fillStyle = 'rgba(11,11,13,.9)'; ctx.fillRect(px - 8, 8, pw + 56, 18);
    ctx.fillStyle = '#44444a'; ctx.fillRect(px, 15, pw, 4);
    ctx.fillStyle = PINK; ctx.fillRect(px, 15, pw * prog, 4);
    for (const c of S.checkpoints) { const mx = px + pw * c.x / S.arenaL; ctx.fillStyle = c.on ? PINK : '#fff'; ctx.beginPath(); ctx.moveTo(mx, 11); ctx.lineTo(mx + 4, 17); ctx.lineTo(mx, 23); ctx.lineTo(mx - 4, 17); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px + pw * prog, 10); ctx.lineTo(px + pw * prog + 4, 3); ctx.lineTo(px + pw * prog - 4, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PINK; ctx.fillRect(px + pw + 8, 11, 12, 12); T('B', px + pw + 10, 21, 11, '#fff'); }

  // ── 보스 바
  if (S.boss && !S.boss.dead) {
    const b = S.boss, bw = 520, bx = (W - bw) / 2, by = 126;
    hudSlant(bx - 20, by - 8, bw + 40, 56, 14, 'rgba(11,11,13,.94)');
    tag('BOSS', bx, by + 14, 14, PINK, '#fff');
    T(b.def.name, bx + 62, by + 15, 22, '#fff');
    T('PHASE ' + ((b.phase || 0) + 1) + '/3', bx + bw, by + 13, 12, '#aaa', 'right');
    if (b.barrier) {
      const left = (b.minions || []).filter(m => !m.dead).length;
      hudBar(bx, by + 24, bw, 10, 1, 1, '#555');
      ctx.fillStyle = PINK; ctx.globalAlpha = 0.6 + Math.sin(S.t * 0.3) * 0.4; ctx.fillRect(bx, by + 24, bw, 10); ctx.globalAlpha = 1;
      T('BARRIER  ·  하수인 ' + left + '마리를 처치하라', bx + bw / 2, by + 33, 11, '#fff', 'center', BODY);
    } else {
      hudBar(bx, by + 24, bw, 10, b.hp, b.maxhp, b.hp < b.maxhp * 0.33 ? '#ff6a8c' : PINK);
      for (const f of [0.66, 0.33]) { ctx.fillStyle = '#fff'; ctx.fillRect(bx + bw * f - 1, by + 22, 2, 14); }
    }
  }

  // ── 콤보
  if (combo.n !== comboShown) { if (combo.n > comboShown) comboPop = 8; comboShown = combo.n; }
  if (comboPop > 0) comboPop--;
  if (combo.n >= 2) {
    const s = 1 + comboPop * 0.05, a = clamp(combo.t / 30, 0, 1);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W - 26, 232); ctx.scale(s, s);
    TS(String(combo.n), 0, 0, 68, PINK, '#000', 8, 'right'); TS('HIT COMBO', 0, 24, 20, '#fff', '#000', 5, 'right'); ctx.restore();
  }

  // ── 스킬 바
  const items = [{ label: 'A', ico: cls.basic.ico, key: 'J', cd: cls.basic.cd, mp: 0, basic: true }, ...P.slots.map((id, i) => id ? SKILLDB[id] : { label: SLOT_LABELS[i], empty: true, key: SLOT_KEYS[i], cd: 1, mp: 0 })];
  const bs = 58, ss = 50, gap = 8, total = bs + 20 + 5 * ss + 4 * gap, sx0 = (W - total) / 2, sy0 = H - 72;
  items.forEach((s, i) => {
    const big = i === 0, w = big ? bs : ss, h = big ? bs : ss;
    const x = big ? sx0 : sx0 + bs + 20 + (i - 1) * (ss + gap), y = big ? sy0 - 4 : sy0;
    const locked = !!s.empty, cdv = Math.max(0, P.cd[s.key] || 0), cdm = s.key === 'J' ? s.cd : s.cd * 60 + (s.dur || 0), act = !!s.dur && cdv > cdm - s.dur;
    const ready = !locked && cdv <= 0 && P.mp >= s.mp;
    if (lastCdv[s.key] > 0 && cdv <= 0 && !locked) readyFlash[s.key] = 12;
    lastCdv[s.key] = cdv; if (readyFlash[s.key] > 0) readyFlash[s.key]--;
    const ult = s.tier === 5;
    // 본체
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle = locked ? 'rgba(30,30,34,.9)' : '#16161a'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = locked ? '#555' : ready ? (ult ? PINK : PAPER) : '#777'; ctx.lineWidth = 2; if (locked) ctx.setLineDash([4, 4]); ctx.strokeRect(x - 1, y - 1, w + 2, h + 2); ctx.setLineDash([]);
    if (locked) { ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w / 2 - 7, y + h / 2); ctx.lineTo(x + w / 2 + 7, y + h / 2); ctx.moveTo(x + w / 2, y + h / 2 - 7); ctx.lineTo(x + w / 2, y + h / 2 + 7); ctx.stroke(); }
    else skillIcon(s.ico, x + w / 2, y + h / 2 - 1, big ? 44 : 38, false);
    // 쿨타임 / 지속 / 준비 완료
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (act && !locked) {
      ctx.fillStyle = 'rgba(255,42,100,.88)'; ctx.fillRect(x, y, w, h); TS('ON', x + w / 2, y + h / 2 + 7, 20, '#fff', '#000', 3);
      const rem = (cdv - (cdm - s.dur)) / s.dur; ctx.fillStyle = '#fff'; ctx.fillRect(x, y + h - 4, w * rem, 4);
    } else if (cdv > 0 && !locked) {
      hudPie(x + w / 2, y + h / 2, w, cdv / cdm, 'rgba(0,0,0,.72)');
      if (s.key !== 'J') TS((cdv / 60).toFixed(cdv > 600 ? 0 : 1), x + w / 2, y + h / 2 + 6, 15, '#fff', '#000', 3);
    } else if (!locked && P.mp < s.mp) { ctx.fillStyle = 'rgba(40,60,120,.55)'; ctx.fillRect(x, y, w, h); }
    if (readyFlash[s.key] > 0) { ctx.fillStyle = `rgba(255,255,255,${readyFlash[s.key] / 12 * 0.8})`; ctx.fillRect(x, y, w, h); }
    ctx.restore();
    // 키 / MP / 레벨
    keycap(s.label, x - 4, y + h + 2, ult && !locked ? PINK : '#fff', ult && !locked ? '#fff' : INK);
    if (!locked && s.mp) T(String(s.mp), x + w - 3, y + h - 3, 11, P.mp >= s.mp ? '#fff' : PINK, 'right', BODY);
    if (s.id && !locked) { const lv = P.skillLv[s.id] || 1; for (let k = 0; k < 5; k++) { ctx.fillStyle = k < lv ? PINK : '#444'; ctx.fillRect(x + 3 + k * 6, y + 3, 4, 4); } }
    if (ult && !locked) T('ULT', x + w - 3, y + 12, 9, PINK, 'right');
  });

  // ── 스킬 시전 타이포
  if (S.skillBanner) {
    const sb = S.skillBanner, slide = Math.min(1, sb.t / 6), a = sb.t > 40 ? (60 - sb.t) / 20 : 1;
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(-260 * (1 - slide) + 24, 338);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, 0); ctx.lineTo(284, 46); ctx.lineTo(0, 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(318, 0); ctx.lineTo(302, 46); ctx.lineTo(284, 46); ctx.closePath(); ctx.fill();
    T(sb.en, 12, 31, 28, '#fff'); T(sb.name, 12, 62, 13, '#222', 'left', BODY);
    ctx.restore();
  }
  // ── 스테이지 시작 배너
  if (S.banner > 0) {
    const t = 200 - S.banner, a = S.banner < 40 ? S.banner / 40 : 1, slide = Math.min(1, t / 14);
    ctx.globalAlpha = a;
    ctx.fillStyle = INK; ctx.fillRect(0, 170, W * slide, 96);
    ctx.fillStyle = PINK; ctx.fillRect(0, 170, 26 * slide, 96); ctx.fillRect(W * slide - 220, 170, 220 * slide, 8);
    if (slide >= 1) {
      T(`STAGE ${stageIdx + 1}`, 50, 238, 76, '#fff'); T(D.en, 350, 214, 34, PINK); T(D.name, 352, 244, 20, '#fff', 'left', BODY);
      T('DIFFICULT ' + '■'.repeat(D.stars) + '□'.repeat(6 - D.stars) + '   ·   ' + DIFFS[P.diff === undefined ? 1 : P.diff].name, 352, 262, 12, '#aaa', 'left', BODY);
    }
    ctx.globalAlpha = 1;
    if (stageIdx === 0 && slide >= 1) {
      ctx.globalAlpha = a; hudSlant(W / 2 - 400, 288, 800, 26, 10, 'rgba(11,11,13,.9)');
      T('이동 ←→  달리기 Shift  점프 Space  조준 ↑  공격 A  스킬 Q W E R F  메뉴 Tab  상점 Enter', W / 2, 307, 15, '#fff', 'center', BODY); ctx.globalAlpha = 1;
    }
  }
}
