/* Liberty or Death — Factions non-joueurs (section 8 du livret) : flowcharts 8.4 Britanniques, 8.5 Patriotes, 8.6 Français, 8.7 Indiens */
(function (root) {
'use strict';
const LOD = typeof module !== 'undefined' && module.exports ? require('./commands.js') : root.LOD;
const { WI, CITIES, COLONIES, RESERVES, MAP_SPACES, SPACE_NAMES, FR, SIDE, FACTIONS } = LOD;

const PASS_GAIN = { british: 2, french: 2, patriots: 1, indians: 1 };

// ======================================================================= utilitaires communs
function pass(g, f) { g.addRes(f, PASS_GAIN[f]); g.say(`${FR[f]} passent (+${PASS_GAIN[f]} Ressource${PASS_GAIN[f] > 1 ? 's' : ''})`, 'act'); return { action: 'pass' }; }

// Décalage Support/Opposition "en faveur" d'un camp (8.3.6)
function soDiff(g) { return g.totalSupport() - g.totalOpposition(); }

// Capacité de Howe : "When executing a British SA also lower FNI 1 level"
function howeFNI(g) { if (g.state.leaders.british.name === 'Howe' && g.state.leaders.british.loc && g.state.fni > 0) { g.say('Howe : FNI baissé d\'un niveau'); g.lowerFNI(1); } }
function saOk(ctx) { return (!ctx.limited || ctx.allowSA) && !ctx.saUsed; }

// Espaces où des Regulars britanniques peuvent partir : nombre de Regulars "libres" (8.4.1 / 8.4.3)
function britSpareRegulars(g, n, mode) {
  const s = g.sp(n); if (s.b.reg === 0 || g.blockaded(n)) return 0;
  let spare = s.b.reg;
  if (g.britishControl(n)) {
    const margin = g.royalistPieces(n) - g.rebellionPieces(n);
    const keepForControl = mode === 'garrison' ? Math.max(0, 2 - (margin - 0)) : Math.max(0, 1 - margin + 0); // garrison : garder 2 de plus ; march : garder le contrôle
    // nombre de Regulars qui doivent rester : tel que margin − moved ≥ 2 (garrison) ou ≥ 1 (march)
    const minMargin = mode === 'garrison' ? 2 : 1;
    spare = Math.min(spare, Math.max(0, margin - minMargin));
    // dernier Regular : seulement si Pop 0 ou Support Actif (garrison) ; march : pas le dernier Regular d'un espace sous contrôle brit. sans Support Actif
    if (mode === 'garrison') { if (!(g.rawPop(n) === 0 || s.sup === 2)) spare = Math.min(spare, s.b.reg - 1); }
    else { if (s.sup !== 2) spare = Math.min(spare, s.b.reg - 1); }
  } else if (mode === 'garrison') {
    if (!(g.rawPop(n) === 0 || s.sup === 2)) spare = Math.min(spare, s.b.reg - 1);
  }
  return Math.max(0, spare);
}

// ======================================================================= 8.4 BRITANNIQUES
const British = {
  // Décision Événement / Commande / Passe
  turn(g, ctx) {
    const f = 'british';
    if (ctx.eventAllowed && ctx.card && !ctx.card.winter) {
      const dec = eventDecision(g, f, ctx);
      if (dec.play) return ctx.execEvent(dec.which);
    }
    if (g.res(f) <= 0) return pass(g, f);
    return British.command(g, ctx);
  },
  eventWanted(g, m, ctx) { // conditions 8.4
    const S = g.totalSupport(), O = g.totalOpposition();
    if (O > S && m.soDelta > 0) return 'Opposition > Support et l\'événement déplace le Support/Opposition en faveur des Royalistes';
    if (m.fromUnavailable.british > 0) return 'l\'événement place des pièces britanniques depuis Unavailable';
    if (m.toriesInActiveOppNone || m.fortInColonyNone || m.regularsPlacedCityColony) return 'l\'événement place des Tories (Opp. Active sans Tories), un Fort (Colonie sans Fort) ou des Regulars';
    if (m.crcDelta > 0) return 'l\'événement inflige des pertes à la Rébellion';
    if (CITIES.filter(c => g.britishControl(c)).length >= 5 && m.effective) { const d = g.d6(); if (d >= 5) return 'au moins 5 Villes contrôlées et D6 ≥ 5'; }
    return null;
  },
  command(g, ctx, tried) {
    tried = tried || new Set(); const f = 'british';
    const regOnMap = g.countOnMap(f, 'reg') - g.sp(WI).b.reg;
    const garrisonCond = regOnMap >= 10 && CITIES.some(c => g.rebellionControl(c) && g.sp(c).p.fort === 0);
    if (!tried.has('garrison') && garrisonCond && !ctx.limited) { tried.add('garrison'); const r = British.garrison(g, ctx); if (!r.aborted) return r; tried.add('garrison'); return British.muster(g, ctx, tried); }
    if (!tried.has('muster')) { const d = g.d6(); if (d < g.availableOf(f, 'reg')) { g.say(`D6 ${d} < ${g.availableOf(f, 'reg')} Regulars disponibles → Muster`); return British.muster(g, ctx, tried); } }
    const battleCond = SPACE_NAMES.some(n => g.rebellionPieces(n) >= 2 && g.sp(n).b.reg + (g.leaderAt(f, n) ? 1 : 0) > g.rebellionPieces(n) + g.rebellionLeaders(n));
    if (!tried.has('battle') && battleCond) return British.battle(g, ctx, tried);
    if (!tried.has('march')) return British.march(g, ctx, tried);
    if (!tried.has('muster')) return British.muster(g, ctx, tried);
    return pass(g, f);
  },
  // ---- Activités spéciales (8.4.1)
  navalPressure(g, ctx) {
    const st = g.state;
    if (st.fni > 0 && (st.leaders.british.name === 'Gage' || st.leaders.british.name === 'Clinton')) {
      g.say('Activité spéciale : Naval Pressure', 'act');
      g.lowerFNI(1, cands => {
        const r = g.rank(cands, [c => (ctx.battleSpaces || []).includes(c) ? 1 : 0, c => g.sp(c).p.fort === 0 ? g.rebellionPieces(c) : -1, c => g.sp(c).sup]);
        return r[0];
      });
      howeFNI(g); ctx.saUsed = true; return true;
    }
    if (st.fni === 0) { g.say('Activité spéciale : Naval Pressure', 'act'); g.britNavalPressure(); howeFNI(g); ctx.saUsed = true; return true; }
    return false;
  },
  skirmish(g, ctx) {
    const f = 'british'; const excl = new Set([...(ctx.battleSpaces || []), ...(ctx.garrisonDests || []), ...(ctx.musterSpaces || []), ...(ctx.skirmishSpaces || [])]);
    let cands = SPACE_NAMES.filter(n => !excl.has(n) && g.sp(n).b.reg > 0 && g.rebellionPieces(n) > 0);
    if (!cands.length) return false;
    const score = n => { const t = g.skirmishTargets(f, n); const s = g.sp(n); const cubes = s.p.cont + s.f.reg;
      // priorité : Antilles, puis exactement 1 Regular, puis le plus de cubes retirables, sinon 1 pièce (espace avec 1 seule pièce, Ville d'abord)
      return [n === WI ? 1 : 0, s.b.reg === 1 ? 1 : 0, Math.min(2, cubes), cubes === 0 ? (g.rebellionPieces(n) === 1 ? 2 : 1) : 0, cubes === 0 && g.isCity(n) ? 1 : 0, t.units + t.fort > 0 ? 1 : 0]; };
    const ranked = g.rank(cands, [n => score(n)[0], n => score(n)[1], n => score(n)[2], n => score(n)[3], n => score(n)[4]]);
    for (const n of ranked) {
      const s = g.sp(n); const cubes = s.p.cont + s.f.reg; const t = g.skirmishTargets(f, n);
      if (t.units === 0 && t.fort === 0) continue;
      g.say(`Activité spéciale : Skirmish en ${n}`, 'act');
      let k;
      if (cubes >= 2 && s.b.reg >= 1 && (s.b.reg > 1 || true)) k = g.skirmish(f, n, 2);
      else if (t.units >= 1) k = g.skirmish(f, n, 1);
      else k = g.skirmish(f, n, 3);
      if (g.state.leaders.british.name === 'Clinton' && g.leaderAt(f, n) && g.sp(n).p.milA > 0) { g.say('Clinton : 1 Milice supplémentaire retirée'); g.remove('patriots', 'mil', n, 1, 'available', 'A'); }
      howeFNI(g); ctx.saUsed = true; (ctx.skirmishSpaces = ctx.skirmishSpaces || []).push(n);
      return true;
    }
    return false;
  },
  sa(g, ctx, order) { // order : ['naval','skirmish'] ou ['skirmish','naval']
    if (!saOk(ctx)) return false;
    for (const o of order) { if (o === 'naval' && British.navalPressure(g, ctx)) return true; if (o === 'skirmish' && British.skirmish(g, ctx)) return true; }
    g.say('Aucune Activité spéciale possible'); return false;
  },
  // ---- 8.4.1 Garrison
  garrison(g, ctx) {
    const f = 'british';
    return g.group('Britanniques : Garrison (8.4.1)', () => {
      ctx.garrisonDests = []; ctx.skirmishSpaces = ctx.skirmishSpaces || [];
      if (g.res(f) < 2) { g.say('Garrison impossible (2 Ressources nécessaires) → Muster'); return { aborted: true }; }
      British.sa(g, ctx, ['naval', 'skirmish']);
      // mouvements
      const moved = [];
      const spare = {}; for (const n of SPACE_NAMES) spare[n] = britSpareRegulars(g, n, 'garrison');
      const takeFrom = (to, k) => { // prend k Regulars depuis les espaces avec le plus de Regulars libres
        let got = 0;
        while (got < k) {
          const srcs = SPACE_NAMES.filter(n => n !== to && spare[n] > 0);
          if (!srcs.length) break;
          const src = g.rank(srcs, [n => spare[n], n => -g.rawPop(n)])[0];
          if (g.garrisonMove(src, to, 1)) { spare[src]--; got++; moved.push([src, to]); } else spare[src] = 0;
        }
        return got;
      };
      // 1. juste assez de Regulars pour prendre le contrôle des Villes de la Rébellion sans Fort patriote
      let targets = CITIES.filter(c => !g.blockaded(c) && !g.britishControl(c) && !(ctx.skirmishSpaces || []).includes(c));
      targets = g.rank(targets, [c => g.sp(c).p.fort === 0 ? g.rebellionPieces(c) : -1, c => c === 'New York City' ? 1 : 0]);
      for (const c of targets) { const need = g.rebellionPieces(c) - g.royalistPieces(c) + 1; if (need > 0) takeFrom(c, need); if (g.britishControl(c)) ctx.garrisonDests.push(c); }
      // 2. chaque Ville sous contrôle brit. sans Support Actif : au moins 1 Regular ; puis au moins 3 cubes (d'abord celles avec Milices Underground)
      for (const c of CITIES) if (!g.blockaded(c) && !(ctx.skirmishSpaces || []).includes(c) && g.britishControl(c) && g.sp(c).sup !== 2 && g.sp(c).b.reg === 0) { if (takeFrom(c, 1)) ctx.garrisonDests.push(c); }
      const c3 = g.rank(CITIES.filter(c => !g.blockaded(c) && !(ctx.skirmishSpaces || []).includes(c) && g.britishControl(c) && g.britishCubes(c) < 3), [c => g.sp(c).p.milU]);
      for (const c of c3) { const need = 3 - g.britishCubes(c); if (need > 0 && takeFrom(c, need)) ctx.garrisonDests.push(c); }
      if (!moved.length) { g.say('Aucun Regular n\'a pu être déplacé : Garrison abandonné → Muster'); return { aborted: true }; }
      g.pay(f, 2); g.say('Garrison : 2 Ressources payées');
      ctx.saUsedBefore = true;
      g.garrisonActivate();
      // déplacement des unités de la Rébellion depuis une Ville
      const dc = g.rank(CITIES.filter(c => g.britishControl(c) && g.sp(c).p.fort === 0 && !g.blockaded(c) && g.rebellionUnits(c) > 0 && g.adj(c).some(a => g.isProvince(a))), [c => g.rebellionUnits(c)]);
      if (dc.length) { const c = dc[0]; const dest = g.rank(g.adj(c).filter(a => g.isProvince(a)), [a => -g.sp(a).sup, a => -g.rawPop(a)])[0]; g.garrisonDisplace(c, dest); }
      return { action: 'command', command: 'Garrison', sa: !!ctx.saUsed };
    });
  },
  // ---- 8.4.2 Muster
  muster(g, ctx, tried) {
    tried = tried || new Set(); tried.add('muster'); const f = 'british';
    return g.group('Britanniques : Muster (8.4.2)', () => {
      const selected = []; ctx.musterSpaces = selected; let executed = false; const maxSpaces = ctx.limited ? 1 : 4;
      const canSelect = () => selected.length < maxSpaces && g.res(f) >= 1;
      const select = n => { if (selected.includes(n)) return true; if (!canSelect()) return false; g.pay(f, 1); selected.push(n); g.say(`Espace sélectionné : ${n} (1 Ressource)`); return true; };
      // Regulars : un seul espace
      if (g.availableOf(f, 'reg') > 0) {
        const cands = SPACE_NAMES.filter(n => g.britMusterRegSpace(n));
        const ranked = g.rank(cands, [n => g.sp(n).sup !== -2 && g.sp(n).sup !== 2 ? 1 : 0, n => !g.britishControl(n) && g.royalistPieces(n) + Math.min(6, g.availableOf(f, 'reg')) > g.rebellionPieces(n) ? 1 : 0, n => g.sp(n).b.tor > 0 && g.sp(n).b.reg === 0 && g.sp(n).b.fort === 0 ? 1 : 0, n => g.rawPop(n)]);
        if (ranked.length && select(ranked[0])) { const k = g.place(f, 'reg', ranked[0], 6); if (k) { executed = true; ctx.regSpace = ranked[0]; } }
      }
      // Tories
      if (g.availableOf(f, 'tor') > 0) {
        const cands = SPACE_NAMES.filter(n => g.britMusterTorySpace(n));
        const ranked = g.rank(cands, [n => g.sp(n).b.reg > 0 && g.sp(n).b.tor === 0 ? 1 : 0, n => n === ctx.regSpace ? 1 : 0,
          n => !g.britishControl(n) && g.royalistPieces(n) + (g.sp(n).sup === -1 ? 1 : 2) > g.rebellionPieces(n) && g.britishPieces(n) + 2 > 0 ? g.rawPop(n) : 0,
          n => g.isColony(n) && g.britishCubes(n) < 5 && g.sp(n).b.fort === 0 ? 1 : 0]);
        for (const n of ranked) {
          const useful = (g.sp(n).b.reg > 0 && g.sp(n).b.tor === 0) || (!g.britishControl(n) && g.royalistPieces(n) + (g.sp(n).sup === -1 ? 1 : 2) > g.rebellionPieces(n)) || (g.isColony(n) && g.britishCubes(n) < 5 && g.sp(n).b.fort === 0);
          if (!useful) continue;
          if (!selected.includes(n) && !canSelect()) break;
          if (g.availableOf(f, 'tor') === 0) break;
          if (select(n)) { if (g.britPlaceTories(n)) executed = true; }
        }
      }
      // Reward Loyalty ou Fort
      const d = g.d3();
      let rlDone = false;
      if (g.totalOpposition() > g.totalSupport() + d || g.availableOf(f, 'fort') === 0) {
        const cands = SPACE_NAMES.filter(n => g.canRewardLoyalty(n) && (selected.includes(n) || canSelect()) && !(g.sp(n).sup === 2 && true));
        const ok = cands.filter(n => g.sp(n).sup < 2); // 8.4.5 : ne pas Reward Loyalty si seuls des marqueurs seraient retirés
        const ranked = g.rank(ok, [n => selected.includes(n) ? 1 : 0, n => -(g.sp(n).raid + g.sp(n).prop), n => (2 - g.sp(n).sup) * g.rawPop(n)]);
        for (const n of ranked) { if (select(n)) { if (g.rewardLoyalty(n, 'muster') > 0) { rlDone = true; executed = true; } break; } }
      }
      if (!rlDone && g.availableOf(f, 'fort') > 0) {
        const cands = COLONIES.filter(n => g.sp(n).b.fort === 0 && g.britishCubes(n) >= 5 && g.roomForFort(n) && (selected.includes(n) || canSelect()));
        const ranked = g.rank(cands, [n => selected.includes(n) ? 1 : 0, n => g.britishCubes(n), n => g.rawPop(n)]);
        if (ranked.length && select(ranked[0])) { if (g.britReplaceCubesWithFort(ranked[0])) executed = true; }
      }
      if (!executed) { g.say('Aucun Muster possible'); if (!tried.has('march')) return British.march(g, ctx, tried); return pass(g, f); }
      British.sa(g, ctx, ['skirmish', 'naval']);
      return { action: 'command', command: 'Muster', spaces: selected.slice(), sa: !!ctx.saUsed };
    });
  },
  // ---- 8.4.3 March
  march(g, ctx, tried) {
    tried = tried || new Set(); tried.add('march'); const f = 'british';
    return g.group('Britanniques : March (8.4.3)', () => {
      const dests = []; const maxDest = ctx.limited ? 1 : 4; let commonCauseUsed = false; let anyMove = false;
      const canAdd = () => dests.length < maxDest && g.res(f) >= 1;
      const selectDest = n => { if (dests.includes(n)) return true; if (!canAdd()) return false; g.pay(f, 1); dests.push(n); g.say(`Destination sélectionnée : ${n} (1 Ressource)`); return true; };
      // groupes capables de marcher
      const groups = () => SPACE_NAMES.filter(n => n !== WI && britSpareRegulars(g, n, 'march') > 0).map(n => {
        const s = g.sp(n); const reg = britSpareRegulars(g, n, 'march'); const tor = Math.min(reg, Math.max(0, s.b.tor - 1));
        return { from: n, reg, tor, size: reg + tor };
      });
      // 1. prendre le contrôle : Villes puis Colonies (max 2 espaces), d'abord avec cubes de la Rébellion puis Pop
      let controlDests = 0;
      for (const kind of ['city', 'colony']) {
        const targets = g.rank(SPACE_NAMES.filter(n => okDest(ctx, n) && (kind === 'city' ? g.isCity(n) : g.isColony(n)) && !g.britishControl(n) && !g.blockaded(n)), [n => g.rebellionCubes(n) > 0 ? 1 : 0, n => g.rawPop(n)]);
        for (const t of targets) {
          if (controlDests >= 2 || !canAdd()) break;
          // groupes pouvant atteindre t, du plus grand au plus petit
          let gs = groups().filter(gr => g.britMarchDests(gr.from).includes(t)).map(gr => {
            let wp = 0; if (saOk(ctx) && g.isProvince(t) && g.isAdj(gr.from, t)) { const s = g.sp(gr.from); const w = g.warParties(gr.from); wp = Math.min(Math.max(0, w - 1), gr.reg - gr.tor); } // Common Cause
            return Object.assign({}, gr, { wp, size: gr.reg + gr.tor + wp }); });
          gs.sort((a, b) => b.size - a.size);
          const need = g.rebellionPieces(t) - g.royalistPieces(t) + 1 + (g.britishPieces(t) === 0 ? 0 : 0);
          const total = gs.reduce((a, x) => a + x.size, 0);
          if (total < need || need <= 0) continue;
          if (!selectDest(t)) break;
          for (const gr of gs) {
            if (g.britishControl(t)) break;
            const r = g.britMarchGroup(gr.from, t, gr.reg, gr.tor, gr.wp); anyMove = anyMove || r.reg > 0; if (r.wp > 0) commonCauseUsed = true;
          }
          if (g.britishControl(t)) { controlDests++; g.say(`Contrôle britannique établi en ${t}`); }
        }
      }
      // 2. Pop 1-2 non Support Actif : ajouter des Tories où seuls des Regulars, Regulars où seuls des Tories
      for (const mode of ['tories', 'regulars']) {
        const targets = g.rank(SPACE_NAMES.filter(n => okDest(ctx, n) && n !== WI && g.rawPop(n) >= 1 && g.sp(n).sup !== 2 && !g.blockaded(n) && (mode === 'tories' ? (g.sp(n).b.reg > 0 && g.sp(n).b.tor === 0) : (g.sp(n).b.tor > 0 && g.sp(n).b.reg === 0))), [n => dests.includes(n) ? 1 : 0, n => g.rawPop(n)]);
        for (const t of targets) {
          if (!dests.includes(t) && !canAdd()) break;
          const gs = groups().filter(gr => g.britMarchDests(gr.from).includes(t) && (mode === 'tories' ? gr.tor > 0 : gr.reg > 0)).sort((a, b) => b.size - a.size);
          if (!gs.length) continue;
          if (!selectDest(t)) break;
          const gr = gs[0]; const r = g.britMarchGroup(gr.from, t, mode === 'tories' ? Math.min(gr.reg, gr.tor) : gr.reg, mode === 'tories' ? gr.tor : 0, 0); anyMove = anyMove || r.reg > 0;
        }
      }
      // 3. March sur place pour activer des Milices (d'abord espaces en Support)
      const inPlace = g.rank(SPACE_NAMES.filter(n => okDest(ctx, n) && n !== WI && !dests.includes(n) && g.britishCubes(n) >= 3 && g.sp(n).p.milU > 0 && !g.blockaded(n)), [n => g.sp(n).sup > 0 ? 1 : 0, n => g.sp(n).p.milU]);
      for (const n of inPlace) { if (!canAdd()) break; selectDest(n); anyMove = true; }
      if (!dests.length && ctx.onlyDests) { // March gratuit "vers 1 espace"
        for (const t of g.rank(ctx.onlyDests.filter(t => SPACE_NAMES.includes(t)), [t => g.rebellionPieces(t)])) {
          const gs = groups().filter(gr => g.britMarchDests(gr.from).includes(t)).sort((a, b) => b.size - a.size);
          if (!gs.length || !selectDest(t)) continue;
          for (const gr of gs) { const r = g.britMarchGroup(gr.from, t, gr.reg, gr.tor, 0); anyMove = anyMove || r.reg > 0; }
          break;
        }
      }
      if (!dests.length) { g.say('Aucun March possible'); if (!tried.has('muster')) return British.muster(g, ctx, tried); return pass(g, f); }
      for (const d of dests) g.britMarchActivate(d);
      if (commonCauseUsed) { ctx.saUsed = true; g.say('Activité spéciale : Common Cause (utilisée pendant le March)', 'act'); }
      else British.sa(g, ctx, ['skirmish', 'naval']);
      return { action: 'command', command: 'March', spaces: dests.slice(), sa: !!ctx.saUsed };
    });
  },
  // ---- 8.4.4 Battle
  battle(g, ctx, tried) {
    tried = tried || new Set(); tried.add('battle'); const f = 'british';
    return g.group('Britanniques : Battle (8.4.4)', () => {
      const cands = SPACE_NAMES.filter(n => g.britishPieces(n) > 0 && (g.rebellionCubes(n) > 0 || g.sp(n).p.fort > 0));
      const plan = [];
      for (const n of cands) {
        const s = g.sp(n); const wpAvail = Math.max(0, g.warParties(n) - (s.i.wpU > 0 ? 1 : 0)); // pas la dernière WP Underground
        const cc = n === WI || g.isCity(n) ? 0 : Math.min(wpAvail, Math.max(0, s.b.reg - s.b.tor));
        const est = g.battleEstimate(n, f, { commonCause: cc });
        if (est.att > est.def) plan.push({ n, cc, est });
      }
      if (!plan.length) { g.say('Aucune bataille favorable'); if (!tried.has('march')) return British.march(g, ctx, tried); return pass(g, f); }
      const ranked = g.rank(plan, [p => g.britishPieces(p.n)]);
      const chosen = []; for (const p of ranked) { if (chosen.length >= (ctx.limited ? 1 : 99)) break; if (!g.pay(f, 1)) break; chosen.push(p); g.say(`Bataille sélectionnée : ${p.n} (estimation ${p.est.att} vs ${p.est.def})`); }
      ctx.battleSpaces = chosen.map(p => p.n);
      const ccUsed = chosen.some(p => p.cc > 0);
      if (ccUsed) { if (saOk(ctx)) { ctx.saUsed = true; g.say('Activité spéciale : Common Cause', 'act'); } else chosen.forEach(p => p.cc = 0); }
      else British.sa(g, ctx, ['skirmish', 'naval']);
      for (const p of chosen) { const r = g.battle(p.n, f, { commonCause: p.cc }); g.applyWinTheDay(r); if (r.winTheDay && r.winner === 'rebellion') Patriots.freeRallyAfterWin(g, r); }
      return { action: 'command', command: 'Battle', spaces: chosen.map(p => p.n), sa: !!ctx.saUsed };
    });
  },
  // 8.4.6 Trade : réponse britannique à une demande indienne
  tradeOffer(g) {
    if (g.res('indians') >= g.res('british')) return 0;
    const d = g.d6(); if (d < g.res('british')) return Math.ceil(d / 2); return 0;
  },
  // 8.4.11 Brilliant Stroke
  brilliantStrokeWanted(g, ctx) {
    const L = g.state.leaders.british; if (!g.state.toa || !L.loc) return false;
    if (g.sp(L.loc).b.reg < 4) return false;
    return (ctx.firstEligible && SIDE[ctx.firstEligible] === 'rebellion' && g.state.players[ctx.firstEligible] === 'human') || ctx.patriotsPlayedBS;
  },
};

// ======================================================================= 8.5 PATRIOTES
const Patriots = {
  turn(g, ctx) {
    const f = 'patriots';
    if (ctx.eventAllowed && ctx.card && !ctx.card.winter) { const dec = eventDecision(g, f, ctx); if (dec.play) return ctx.execEvent(dec.which); }
    if (g.res(f) <= 0) return pass(g, f);
    return Patriots.command(g, ctx);
  },
  eventWanted(g, m) {
    const S = g.totalSupport(), O = g.totalOpposition();
    if (S > O && m.soDelta < 0) return 'Support > Opposition et l\'événement déplace le Support/Opposition en faveur de la Rébellion';
    if (m.undergroundMilitiaInSupportOrVillage) return 'l\'événement place des Milices Underground dans un espace en Support Actif ou avec Village sans Milice';
    if (m.patriotFortPlaced || m.villageRemoved) return 'l\'événement place un Fort patriote ou retire un Village';
    if (m.resDelta.patriots >= 3) return 'l\'événement ajoute au moins 3 Ressources patriotes';
    if (g.factionPiecesOnMap('patriots') >= 25 && m.effective) { const d = g.d6(); if (d >= 5) return 'au moins 25 pièces patriotes et D6 ≥ 5'; }
    return null;
  },
  command(g, ctx, tried) {
    tried = tried || new Set(); const f = 'patriots';
    const battleCond = SPACE_NAMES.some(n => g.royalistPieces(n) > 0 && g.rebellionCubes(n) > 0 && g.rebellionCubes(n) + g.rebellionLeaders(n) > activeRoyalist(g, n));
    if (!tried.has('battle') && battleCond) return Patriots.battle(g, ctx, tried);
    if (!tried.has('rally')) {
      const wouldFort = SPACE_NAMES.some(n => g.rallySpaceOk(n) && g.patriotUnits(n) >= 4 && g.roomForFort(n)) && g.availableOf(f, 'fort') > 0;
      const d = g.d6(); const ug = g.countOnMap(f, 'mil', 'U');
      if (wouldFort || d > ug) { g.say(wouldFort ? 'Rally placerait un Fort → Rally' : `D6 ${d} > ${ug} Milices Underground → Rally`); return Patriots.rally(g, ctx, tried); }
    }
    if (!tried.has('rabble')) { const can = MAP_SPACES.some(n => g.rabbleOk(n) && g.canShift(n, -1)); if (can) return Patriots.rabble(g, ctx, tried); }
    if (!tried.has('march')) return Patriots.march(g, ctx, tried);
    if (!tried.has('rally')) return Patriots.rally(g, ctx, tried);
    return pass(g, f);
  },
  // ---- Activités spéciales (8.5.1)
  partisans(g, ctx) {
    const f = 'patriots'; if (g.res(f) === 0 && !ctx.free) return Patriots.persuasion(g, ctx);
    const excl = new Set([...(ctx.battleSpaces || []), ...(ctx.usedSpaces || [])]);
    const cands = SPACE_NAMES.filter(n => !excl.has(n) && g.partisansOk(n) && (!ctx.onlySpaces || ctx.onlySpaces.includes(n)));
    if (!cands.length) return false;
    const evalSpace = n => { const s = g.sp(n); const ctl = g.control(n);
      const sim = g.clone(); const opt = s.i.vil > 0 && g.warParties(n) === 0 && s.p.milU >= 2 ? 3 : (s.p.milU >= 2 && g.royalistUnitsCount(n) >= 2 ? 2 : 1);
      sim.partisans(n, opt); const after = sim.control(n);
      return { opt, vil: opt === 3 ? 1 : 0, wp: Math.min(opt === 2 ? 2 : 1, g.warParties(n)), brit: opt === 2 ? 2 : 1, addReb: ctl !== 'rebellion' && after === 'rebellion' ? 1 : 0, remBrit: ctl === 'british' && after !== 'british' ? 1 : 0 }; };
    const ranked = g.rank(cands, [n => evalSpace(n).vil, n => evalSpace(n).wp, n => evalSpace(n).brit, n => evalSpace(n).addReb, n => evalSpace(n).remBrit]);
    const n = ranked[0]; g.say(`Activité spéciale : Partisans en ${n}`, 'act'); g.partisans(n, evalSpace(n).opt); ctx.saUsed = true; (ctx.usedSpaces = ctx.usedSpaces || []).push(n); return true;
  },
  skirmish(g, ctx) {
    const f = 'patriots'; if (g.res(f) === 0 && !ctx.free) return Patriots.persuasion(g, ctx);
    const excl = new Set([...(ctx.battleSpaces || []), ...(ctx.usedSpaces || [])]);
    const cands = SPACE_NAMES.filter(n => !excl.has(n) && g.sp(n).p.cont > 0 && g.britishPieces(n) > 0 && (!ctx.onlySpaces || ctx.onlySpaces.includes(n)));
    if (!cands.length) return false;
    const ev = n => { const s = g.sp(n); const opt = g.britishCubes(n) === 0 && s.b.fort > 0 ? 3 : (g.britishCubes(n) >= 2 && s.p.cont >= 1 ? 2 : 1); const sim = g.clone(); const ctl = g.control(n); sim.skirmish(f, n, opt); const a = sim.control(n); return { opt, fort: opt === 3 ? 1 : 0, addReb: ctl !== 'rebellion' && a === 'rebellion' ? 1 : 0, remBrit: ctl === 'british' && a !== 'british' ? 1 : 0 }; };
    const ranked = g.rank(cands, [n => ev(n).fort, n => ev(n).addReb, n => ev(n).remBrit]);
    const n = ranked[0]; g.say(`Activité spéciale : Skirmish en ${n}`, 'act'); g.skirmish(f, n, ev(n).opt); ctx.saUsed = true; (ctx.usedSpaces = ctx.usedSpaces || []).push(n); return true;
  },
  persuasion(g, ctx) {
    const cands = g.rank(SPACE_NAMES.filter(n => g.persuasionOk(n)), [n => g.sp(n).p.fort]);
    if (!cands.length) return false;
    g.say(`Activité spéciale : Persuasion (${cands.slice(0, 3).join(', ')})`, 'act'); g.persuasion(cands.slice(0, 3)); ctx.saUsed = true; return true;
  },
  sa(g, ctx) { if (!saOk(ctx)) return false; if (Patriots.partisans(g, ctx)) return true; if (Patriots.skirmish(g, ctx)) return true; if (Patriots.persuasion(g, ctx)) return true; g.say('Aucune Activité spéciale possible'); return false; },
  // ---- 8.5.1 Battle
  battle(g, ctx, tried) {
    tried = tried || new Set(); tried.add('battle'); const f = 'patriots';
    return g.group('Patriotes : Battle (8.5.1)', () => {
      const plan = [];
      for (const n of MAP_SPACES) {
        if (!(g.royalistPieces(n) > 0 && g.patriotPieces(n) > 0)) continue;
        const payFrench = g.sp(n).f.reg > 0 && g.res('french') > 0;
        const est = g.battleEstimate(n, f, { payFrench });
        if (est.att > est.def) plan.push({ n, payFrench, est });
      }
      if (!plan.length) { g.say('Aucune bataille favorable → Rally'); return Patriots.rally(g, ctx, tried); }
      const ranked = g.rank(plan, [p => g.leaderAt(f, p.n) ? 1 : 0, p => g.rawPop(p.n), p => g.sp(p.n).i.vil]);
      const chosen = []; for (const p of ranked) { if (chosen.length >= (ctx.limited ? 1 : 99)) break; if (!g.pay(f, 1)) break; if (p.payFrench) { if (g.res('french') > 0) g.pay('french', 1); else p.payFrench = false; } chosen.push(p); g.say(`Bataille sélectionnée : ${p.n} (estimation ${p.est.att} vs ${p.est.def})`); }
      ctx.battleSpaces = chosen.map(p => p.n);
      for (const p of chosen) { const r = g.battle(p.n, f, { payFrench: p.payFrench }); g.applyWinTheDay(r); if (r.winTheDay && r.winner === 'rebellion') Patriots.freeRallyAfterWin(g, r); }
      Patriots.sa(g, ctx);
      return { action: 'command', command: 'Battle', spaces: chosen.map(p => p.n), sa: !!ctx.saUsed };
    });
  },
  freeRallyAfterWin(g, r) { // 3.6.8 : Rally gratuit dans 1 espace ; Français : déplacer les Blocus de la Ville vers une Ville avec plus de Support
    g.group('Win the Day : Rally gratuit des Patriotes (1 espace)', () => Patriots.rally(g, { limited: true, free: true }, new Set(['battle', 'rabble', 'march'])));
    if (g.isCity(r.space) && g.sp(r.space).blk > 0) {
      const dest = g.rank(CITIES.filter(c => c !== r.space && g.sp(c).sup > g.sp(r.space).sup), [c => g.sp(c).sup * g.rawPop(c)])[0];
      if (dest) { const k = g.sp(r.space).blk; g.sp(r.space).blk = 0; g.sp(dest).blk += k; g.say(`Blocus déplacé(s) de ${r.space} vers ${dest}`); }
    }
  },
  // ---- 8.5.2 Rally
  rally(g, ctx, tried) {
    tried = tried || new Set(); tried.add('rally'); const f = 'patriots';
    return g.group('Patriotes : Rally (8.5.2)', () => {
      const selected = []; let executed = false; let persuasionUsed = false; const maxSpaces = ctx.limited ? 1 : 4;
      const canSelect = () => selected.length < maxSpaces && (ctx.free || g.res(f) >= 1);
      const select = n => { if (selected.includes(n)) return true; if (!canSelect() || !g.rallySpaceOk(n) || !okDest(ctx, n)) return false; if (!ctx.free) g.pay(f, 1); selected.push(n); g.say(`Espace sélectionné : ${n}${ctx.free ? '' : ' (1 Ressource)'}`); if (g.res(f) === 0 && !ctx.free && !persuasionUsed && saOk(ctx)) { persuasionUsed = Patriots.persuasion(g, ctx) || persuasionUsed; } return true; };
      // Forts : espaces avec 4+ unités patriotes et place, Villes d'abord puis Pop
      if (g.availableOf(f, 'fort') > 0) {
        const cands = g.rank(SPACE_NAMES.filter(n => g.rallySpaceOk(n) && g.patriotUnits(n) >= 4 && g.roomForFort(n)), [n => g.isCity(n) ? 1 : 0, n => g.rawPop(n)]);
        for (const n of cands) { if (g.availableOf(f, 'fort') === 0 || !canSelect()) break; if (select(n)) { if (g.rallyReplaceWithFort(n)) executed = true; } }
      }
      // Milices : à chaque Fort patriote sans autre pièce de la Rébellion, puis (si Continentals disponibles) au Fort avec le plus de Milices
      const forts = SPACE_NAMES.filter(n => g.sp(n).p.fort > 0 && g.rallySpaceOk(n));
      for (const n of forts) { if (g.rebellionPieces(n) - g.sp(n).p.fort === 0 && g.availableOf(f, 'mil') > 0) { if (select(n)) { if (g.rallyAtFortPlace(n)) executed = true; } } }
      if (g.availableOf(f, 'cont') > 0 && g.availableOf(f, 'mil') > 0) {
        const best = g.rank(forts.filter(n => !selected.includes(n)), [n => g.militia(n)])[0];
        if (best && select(best)) { if (g.rallyAtFortPlace(best)) executed = true; }
      }
      // Dans l'espace à Fort avec le plus de Milices parmi les sélectionnés : remplacer toutes les Milices sauf 1 Underground par des Continentals
      const fsel = g.rank(selected.filter(n => g.sp(n).p.fort > 0 && g.militia(n) > 0), [n => g.militia(n)])[0];
      if (fsel && g.availableOf(f, 'cont') > 0) { if (g.rallyReplaceMilitiaWithContinentals(fsel, 1)) executed = true; }
      // Si un Fort est disponible : Milices dans l'espace avec le plus d'unités patriotes sans Fort
      if (g.availableOf(f, 'fort') > 0 && g.availableOf(f, 'mil') > 0) {
        const best = g.rank(SPACE_NAMES.filter(n => g.rallySpaceOk(n) && !g.isReserve(n) && g.sp(n).p.fort === 0 && g.patriotUnits(n) > 0 && g.canPlace(f, 'mil', n) && !selected.includes(n)), [n => g.patriotUnits(n)])[0];
        if (best && select(best)) { if (g.rallyPlaceMilitia(best)) executed = true; }
      }
      // Milices : d'abord pour changer le Contrôle, puis espaces pas en Opposition Active ; Villes d'abord, puis Pop
      if (g.availableOf(f, 'mil') > 0) {
        const cands = g.rank(SPACE_NAMES.filter(n => g.rallySpaceOk(n) && !g.isReserve(n) && g.canPlace(f, 'mil', n) && !selected.includes(n)), [n => g.control(n) !== 'rebellion' && g.rebellionPieces(n) + 1 > g.royalistPieces(n) ? 1 : 0, n => g.sp(n).sup !== -2 ? 1 : 0, n => g.isCity(n) ? 1 : 0, n => g.rawPop(n)]);
        for (const n of cands) { if (g.availableOf(f, 'mil') === 0 || !canSelect()) break; if (select(n)) { if (g.rallyPlaceMilitia(n)) executed = true; } }
      }
      // Dans un espace à Fort non sélectionné : rapatrier les Milices actives adjacentes (sans changer le Contrôle de l'origine) puis tout Underground
      if (canSelect()) {
        const cands = SPACE_NAMES.filter(n => g.sp(n).p.fort > 0 && g.rallySpaceOk(n) && !selected.includes(n));
        const score = n => g.adj(n).reduce((a, x) => a + movableActiveMilitia(g, x), 0) + (g.sp(n).p.milA > 0 ? 1 : 0);
        const best = g.rank(cands.filter(n => score(n) > 0), [n => score(n)])[0];
        if (best && select(best)) { for (const a of g.adj(best)) { const k = movableActiveMilitia(g, a); if (k) g.movePiece('patriots', 'mil', a, best, k, 'A'); } g.undergroundMilitia(best); executed = true; }
      }
      if (!executed) { g.say('Aucun Rally possible'); if (ctx.free) return { action: 'none' }; if (!tried.has('rabble')) return Patriots.rabble(g, ctx, tried); return pass(g, f); }
      if (!persuasionUsed && !ctx.free) Patriots.sa(g, ctx);
      return { action: 'command', command: 'Rally', spaces: selected.slice(), sa: !!ctx.saUsed };
    });
  },
  // ---- 8.5.3 Rabble-Rousing
  rabble(g, ctx, tried) {
    tried = tried || new Set(); tried.add('rabble'); const f = 'patriots';
    return g.group('Patriotes : Rabble-Rousing (8.5.3)', () => {
      const selected = []; let persuasionUsed = false; const maxSpaces = ctx.limited ? 1 : 99;
      const cands = g.rank(MAP_SPACES.filter(n => g.rabbleOk(n) && g.canShift(n, -1)), [n => g.sp(n).sup === 2 ? 1 : 0, n => g.rawPop(n)]);
      for (const n of cands) {
        if (selected.length >= maxSpaces || g.res(f) < 1) break;
        g.pay(f, 1); selected.push(n); g.say(`Rabble-Rousing en ${n} (1 Ressource)`); g.rabbleRouse(n);
        if (g.res(f) === 0 && !persuasionUsed && saOk(ctx)) persuasionUsed = Patriots.persuasion(g, ctx);
      }
      if (!selected.length) { g.say('Aucun Rabble-Rousing possible'); if (!tried.has('rally')) return Patriots.rally(g, ctx, tried); return pass(g, f); }
      if (!persuasionUsed) Patriots.sa(g, ctx);
      return { action: 'command', command: 'Rabble-Rousing', spaces: selected, sa: !!ctx.saUsed };
    });
  },
  // ---- 8.5.4 March
  march(g, ctx, tried) {
    tried = tried || new Set(); tried.add('march'); const f = 'patriots';
    return g.group('Patriotes : March (8.5.4)', () => {
      const dests = []; let anyMove = false; const maxDest = ctx.limited ? 1 : 99;
      const canAdd = () => dests.length < maxDest && g.res(f) >= 1;
      const selectDest = n => { if (dests.includes(n)) return true; if (!canAdd()) return false; g.pay(f, 1); dests.push(n); g.say(`Destination sélectionnée : ${n} (1 Ressource)`); return true; };
      const groups = () => MAP_SPACES.filter(n => g.patriotUnits(n) > 0).map(n => patMovable(g, n)).filter(gr => gr.size > 0);
      // 1. contrôle Rébellion dans 2 espaces : Villages, puis Villes, puis ailleurs ; Pop
      let ctl = 0;
      const targets = g.rank(MAP_SPACES.filter(n => okDest(ctx, n) && !g.rebellionControl(n)), [n => g.sp(n).i.vil > 0 ? 2 : g.isCity(n) ? 1 : 0, n => g.rawPop(n)]);
      for (const t of targets) {
        if (ctl >= 2 || !canAdd()) break;
        const gs = groups().filter(gr => g.isAdj(gr.from, t)).sort((a, b) => b.size - a.size);
        const need = g.royalistPieces(t) - g.rebellionPieces(t) + 1;
        const total = gs.reduce((a, x) => a + x.size, 0);
        if (need <= 0 || total < need) continue;
        if (!selectDest(t)) break;
        let frPaid = false;
        for (const gr of gs) { if (g.rebellionControl(t)) break; const fr = g.res('french') > 0 ? gr.fr : 0; const r = g.patMarchGroup(gr.from, t, gr.cont, gr.milU, gr.milA, fr); if (r && r.fr > 0 && !frPaid) { g.pay('french', 1); frPaid = true; } anyMove = true; }
        if (g.rebellionControl(t)) { ctl++; g.say(`Contrôle de la Rébellion établi en ${t}`); }
      }
      // 2. une Milice (Underground si possible) dans chaque espace sans Milice ; d'abord pour changer le plus de Contrôle, puis au hasard
      const empt = g.rank(MAP_SPACES.filter(n => okDest(ctx, n) && g.militia(n) === 0), [n => g.control(n) !== 'rebellion' && g.rebellionPieces(n) + 1 > g.royalistPieces(n) ? 1 : 0]);
      for (const t of empt) {
        if (!canAdd()) break;
        const gs = groups().filter(gr => g.isAdj(gr.from, t) && gr.milU + gr.milA > 0).sort((a, b) => (b.milU - a.milU) || (b.size - a.size));
        if (!gs.length) continue;
        if (!selectDest(t)) break;
        const gr = gs[0]; g.patMarchGroup(gr.from, t, 0, gr.milU > 0 ? 1 : 0, gr.milU > 0 ? 0 : 1, 0); anyMove = true;
      }
      if (!anyMove && ctx.onlyDests) { // March gratuit "vers 1 espace" : y amener le plus grand groupe adjacent (Continentals et Milices)
        for (const t of g.rank(ctx.onlyDests.filter(t => MAP_SPACES.includes(t)), [t => g.royalistPieces(t)])) {
          const gs = groups().filter(gr => g.isAdj(gr.from, t)).sort((a, b) => b.size - a.size);
          if (!gs.length || !selectDest(t)) continue;
          let frPaid = false;
          for (const gr of gs) { const fr = g.res('french') > 0 ? gr.fr : 0; const r = g.patMarchGroup(gr.from, t, gr.cont, gr.milU, gr.milA, fr); if (r && r.fr > 0 && !frPaid) { g.pay('french', 1); frPaid = true; } anyMove = true; }
          break;
        }
      }
      if (!anyMove) { g.say('Aucun March possible'); if (!tried.has('rally')) return Patriots.rally(g, ctx, tried); return pass(g, f); }
      for (const d of dests) g.patMarchActivateWP(d);
      Patriots.sa(g, ctx);
      return { action: 'command', command: 'March', spaces: dests, sa: !!ctx.saUsed };
    });
  },
  brilliantStrokeWanted(g, ctx) {
    const L = g.state.leaders.patriots; if (!g.state.toa || !L.loc || g.sp(L.loc).p.cont < 4) return false;
    return ctx.firstEligible && g.state.players[ctx.firstEligible] === 'human';
  },
};
function activeRoyalist(g, n) { const s = g.sp(n); return s.b.reg + s.b.tor + s.b.fort + s.i.wpA + s.i.vil; }
LOD.Game.prototype.royalistUnitsCount = function (n) { const s = this.sp(n); return s.b.reg + s.b.tor + s.i.wpU + s.i.wpA; };
// Milices actives déplaçables depuis x sans changer le Contrôle de x
function movableActiveMilitia(g, x) {
  const s = g.sp(x); if (s.p.milA === 0) return 0;
  const ctl = g.control(x); if (ctl !== 'rebellion') return s.p.milA;
  const margin = g.rebellionPieces(x) - g.royalistPieces(x); return Math.max(0, Math.min(s.p.milA, margin - 1));
}
// 8.5.4 : unités patriotes déplaçables depuis n : ne pas perdre le Contrôle, laisser une unité active avec chaque Fort, laisser une unité (Underground si possible) sauf si Opposition Active
function patMovable(g, n) {
  const s = g.sp(n); let cont = s.p.cont, milU = s.p.milU, milA = s.p.milA, fr = s.f.reg;
  let mustStay = 0;
  if (s.p.fort > 0) mustStay = Math.max(mustStay, 1);
  if (s.sup !== -2) mustStay = Math.max(mustStay, 1);
  if (g.rebellionControl(n)) { const margin = g.rebellionPieces(n) - g.royalistPieces(n); mustStay = Math.max(mustStay, g.patriotUnits(n) + fr - (margin - 1)); }
  let total = cont + milU + milA; let keep = Math.min(total, Math.max(0, mustStay));
  let k = keep;
  if (s.p.fort > 0 && k > 0) { if (milA > 0) { milA--; k--; } else if (cont > 0) { cont--; k--; } } // laisser une unité Active avec chaque Fort
  // garder ensuite des Milices Underground, puis Actives, puis Continentals
  const kU = Math.min(k, milU); k -= kU; milU -= kU; const kA = Math.min(k, milA); k -= kA; milA -= kA; const kC = Math.min(k, cont); cont -= kC;
  return { from: n, cont, milU, milA, fr: Math.min(fr, cont), size: cont + milU + milA };
}

// ======================================================================= 8.6 FRANÇAIS
const French = {
  turn(g, ctx) {
    const f = 'french';
    if (ctx.eventAllowed && ctx.card && !ctx.card.winter) { const dec = eventDecision(g, f, ctx); if (dec.play) return ctx.execEvent(dec.which); }
    if (g.res(f) <= 0) return pass(g, f);
    return French.command(g, ctx);
  },
  eventWanted(g, m) {
    const S = g.totalSupport(), O = g.totalOpposition();
    if (S > O && m.soDelta < 0) return 'Support > Opposition et l\'événement déplace le Support/Opposition en faveur de la Rébellion';
    if (m.fromUnavailable.french > 0) return 'l\'événement sort des Regulars/Squadrons français d\'Unavailable';
    if (m.frenchPlaced > 0) return 'l\'événement place des pièces françaises sur la carte';
    if (m.cbcDelta > 0) return 'l\'événement inflige des pertes britanniques';
    if (m.resDelta.french > 0) return 'l\'événement ajoute des Ressources françaises';
    if (g.state.toa && m.effective) { const d = g.d6(); if (d >= 5) return 'Treaty of Alliance joué et D6 ≥ 5'; }
    return null;
  },
  command(g, ctx, tried) {
    tried = tried || new Set(); const f = 'french';
    if (!g.state.toa) {
      if (!tried.has('rhc')) { const d = g.d3(); if (d > g.res('patriots')) { g.say(`D3 ${d} > Ressources patriotes ${g.res('patriots')} → Roderigue Hortalez et Cie`); return French.hortalezPre(g, ctx, tried); } }
      if (!tried.has('fam')) return French.fam(g, ctx, tried);
      if (!tried.has('rhc')) return French.hortalezPre(g, ctx, tried);
      return pass(g, f);
    }
    if (!tried.has('muster')) { const d = g.d6(); if (d < g.availableOf(f, 'reg')) { g.say(`D6 ${d} < ${g.availableOf(f, 'reg')} Regulars français disponibles → Muster`); return French.muster(g, ctx, tried); } }
    const battleCond = MAP_SPACES.concat([WI]).some(n => g.frenchPieces(n) > 0 && g.britishPieces(n) > 0 && g.rebellionCubes(n) + g.rebellionLeaders(n) > g.britishPieces(n));
    if (!tried.has('battle') && battleCond) return French.battle(g, ctx, tried);
    if (!tried.has('march')) return French.march(g, ctx, tried);
    if (!tried.has('muster')) return French.muster(g, ctx, tried);
    if (!tried.has('rhc')) return French.hortalezPost(g, ctx, tried);
    return pass(g, f);
  },
  // ---- Activités spéciales
  preparerPre(g, ctx) { if (ctx && !saOk(ctx)) return false; const u = g.state.unavailable.french; if (u.sq > 0) { g.say('Activité spéciale : Préparer la Guerre', 'act'); if (ctx) ctx.saUsed = true; return g.preparerLaGuerre('sq'); } if (u.reg > 0) { g.say('Activité spéciale : Préparer la Guerre', 'act'); if (ctx) ctx.saUsed = true; return g.preparerLaGuerre('reg'); } g.say('Préparer la Guerre impossible (rien en Unavailable)'); return false; },
  preparerPost(g, ctx) {
    const u = g.state.unavailable.french; const d = g.d6();
    if (d <= u.reg + u.sq) { g.say('Activité spéciale : Préparer la Guerre', 'act'); ctx.saUsed = true; if (u.sq > 0) return g.preparerLaGuerre('sq'); if (u.reg > 0) return g.preparerLaGuerre('reg'); }
    if (g.res('french') === 0) { g.say('Activité spéciale : Préparer la Guerre (+2 Ressources)', 'act'); ctx.saUsed = true; return g.preparerLaGuerre('res'); }
    return false;
  },
  skirmish(g, ctx) {
    const excl = new Set([...(ctx.battleSpaces || []), ...(ctx.musterSpaces || [])]);
    const cands = SPACE_NAMES.filter(n => !excl.has(n) && g.sp(n).f.reg > 0 && g.britishPieces(n) > 0);
    if (!cands.length) return false;
    const n = cands.includes(WI) ? WI : g.pick(cands);
    const s = g.sp(n); g.say(`Activité spéciale : Skirmish français en ${n}`, 'act');
    if (g.britishCubes(n) === 0 && s.b.fort > 0) g.skirmish('french', n, 3); else if (g.britishCubes(n) >= 2) g.skirmish('french', n, 2); else g.skirmish('french', n, 1);
    ctx.saUsed = true; return true;
  },
  navalPressure(g, ctx) {
    if (!g.state.toa || g.state.wiSquadrons === 0) return false;
    const city = g.rank(CITIES, [c => (ctx.battleSpaces || []).includes(c) ? 1 : 0, c => g.sp(c).sup * g.rawPop(c)])[0];
    g.say('Activité spéciale : Naval Pressure française', 'act'); ctx.saUsed = true; return g.frNavalPressure(city);
  },
  saStd(g, ctx) { if (!saOk(ctx)) return false; if (French.skirmish(g, ctx)) return true; if (French.preparerPost(g, ctx)) return true; if (French.navalPressure(g, ctx)) return true; g.say('Aucune Activité spéciale possible'); return false; },
  // ---- 8.6.1 RHC avant TOA
  hortalezPre(g, ctx, tried) {
    tried = tried || new Set(); tried.add('rhc'); const f = 'french';
    return g.group('Français : Roderigue Hortalez et Cie (8.6.1)', () => {
      const d = g.d3(); const k = g.hortalez(d);
      if (k === 0) { g.say('Aucune Ressource française'); return pass(g, f); }
      French.preparerPre(g, ctx);
      return { action: 'command', command: 'Roderigue Hortalez et Cie', spaces: [], sa: !!ctx.saUsed };
    });
  },
  // ---- 8.6.2 French Agent Mobilization
  fam(g, ctx, tried) {
    tried = tried || new Set(); tried.add('fam'); const f = 'french';
    return g.group('Français : French Agent Mobilization (8.6.2)', () => {
      const cands = g.famSpaces().filter(n => g.availableOf('patriots', 'mil') >= 2 || g.availableOf('patriots', 'cont') >= 1);
      if (!cands.length || g.res(f) < 1) { g.say('French Agent Mobilization impossible'); if (!tried.has('rhc')) return French.hortalezPre(g, ctx, tried); return pass(g, f); }
      const addCtl = n => { const k = g.availableOf('patriots', 'mil') >= 2 ? 2 : 1; return !g.rebellionControl(n) && g.rebellionPieces(n) + k > g.royalistPieces(n) ? 1 : 0; };
      const n = g.rank(cands, [n => addCtl(n), n => g.patriotUnits(n)])[0];
      g.pay(f, 1); g.say(`French Agent Mobilization en ${n} (1 Ressource)`);
      if (g.availableOf('patriots', 'mil') >= 2) g.frenchAgentMobilization(n, false); else g.frenchAgentMobilization(n, true);
      French.preparerPre(g, ctx);
      return { action: 'command', command: 'French Agent Mobilization', spaces: [n], sa: !!ctx.saUsed };
    });
  },
  // ---- 8.6.3 RHC après TOA
  hortalezPost(g, ctx, tried) {
    tried = tried || new Set(); tried.add('rhc'); const f = 'french';
    return g.group('Français : Roderigue Hortalez et Cie (8.6.3)', () => {
      const d = g.d3(); const k = g.hortalez(d);
      if (k === 0) { g.say('Aucune Ressource française'); return pass(g, f); }
      French.saStd(g, ctx);
      return { action: 'command', command: 'Roderigue Hortalez et Cie', spaces: [], sa: !!ctx.saUsed };
    });
  },
  // ---- 8.6.4 Muster
  muster(g, ctx, tried) {
    tried = tried || new Set(); tried.add('muster'); const f = 'french';
    return g.group('Français : Muster (8.6.4)', () => {
      if (g.res(f) < 2 || g.availableOf(f, 'reg') === 0) { g.say('Muster impossible'); if (!tried.has('rhc')) return French.hortalezPost(g, ctx, tried); return pass(g, f); }
      let n;
      if (g.availableOf(f, 'reg') < 4 && !g.rebellionControl(WI)) n = WI;
      else { const cands = MAP_SPACES.filter(x => g.frMusterOk(x)); if (!cands.length) { g.say('Aucune Ville/Colonie sous contrôle de la Rébellion → Roderigue Hortalez et Cie'); if (!tried.has('rhc')) return French.hortalezPost(g, ctx, tried); return pass(g, f); } n = g.rank(cands, [x => g.sp(x).p.cont > 0 ? 1 : 0])[0]; }
      g.pay(f, 2); g.say(`Muster français en ${n} (2 Ressources)`); ctx.musterSpaces = [n];
      g.frMuster(n, false);
      French.saStd(g, ctx);
      return { action: 'command', command: 'Muster', spaces: [n], sa: !!ctx.saUsed };
    });
  },
  // ---- 8.6.5 March
  march(g, ctx, tried) {
    tried = tried || new Set(); tried.add('march'); const f = 'french';
    return g.group('Français : March (8.6.5)', () => {
      const dests = []; let anyMove = false; const maxDest = ctx.limited ? 1 : 99;
      const canAdd = () => dests.length < maxDest && g.res(f) >= 1;
      const selectDest = n => { if (dests.includes(n)) return true; if (!canAdd()) return false; g.pay(f, 1); dests.push(n); g.say(`Destination sélectionnée : ${n} (1 Ressource)`); return true; };
      const movable = from => { const s = g.sp(from); let reg = s.f.reg, cont = g.res('patriots') > 0 ? Math.min(s.p.cont, reg) : 0; if (g.rebellionControl(from)) { const margin = g.rebellionPieces(from) - g.royalistPieces(from); const allowed = Math.max(0, margin - 1); if (reg + cont > allowed) { cont = Math.max(0, Math.min(cont, allowed - reg)); reg = Math.min(reg, allowed - cont); } } return { from, reg, cont }; };
      // 1. ajouter le Contrôle Rébellion : Villes puis Colonies, d'abord avec pièces britanniques
      const targets = g.rank(MAP_SPACES.filter(n => okDest(ctx, n) && !g.rebellionControl(n) && (g.isCity(n) || g.isColony(n))), [n => g.isCity(n) ? 1 : 0, n => g.britishPieces(n) > 0 ? 1 : 0, n => g.rawPop(n)]);
      for (const t of targets) {
        if (!canAdd()) break;
        const gs = MAP_SPACES.filter(fr => g.sp(fr).f.reg > 0 && g.frMarchDests(fr).includes(t)).map(movable).filter(m => m.reg > 0).sort((a, b) => (b.reg + b.cont) - (a.reg + a.cont));
        const need = g.royalistPieces(t) - g.rebellionPieces(t) + 1; const total = gs.reduce((a, x) => a + x.reg + x.cont, 0);
        if (need <= 0 || total < need) continue;
        if (!selectDest(t)) break;
        let patPaid = false;
        for (const m of gs) { if (g.rebellionControl(t)) break; const r = g.frMarchGroup(m.from, t, m.reg, m.cont); if (r.cont > 0 && !patPaid) { g.pay('patriots', 1); patPaid = true; } anyMove = true; }
      }
      // 2. Regulars français ni dans ni adjacents à des Britanniques : vers les Britanniques les plus proches
      {
        const far = MAP_SPACES.filter(n => g.sp(n).f.reg > 0 && g.britishPieces(n) === 0 && !g.adj(n).some(a => g.britishPieces(a) > 0));
        for (const from of far) {
          if (!canAdd()) break;
          const ds = g.frMarchDests(from).filter(d => okDest(ctx, d) && (g.adj(d).some(a => g.britishPieces(a) > 0) || g.britishPieces(d) > 0));
          if (!ds.length) continue;
          const m = movable(from); if (m.reg === 0) continue;
          const t = g.rank(ds, [d => g.britishPieces(d), d => g.rawPop(d)])[0];
          if (!selectDest(t)) break; const r = g.frMarchGroup(from, t, m.reg, m.cont); if (r.cont > 0) g.pay('patriots', 1); anyMove = true;
        }
      }
      // 3. sinon 1 Regular vers un espace avec Patriotes et Britanniques
      if (!anyMove) {
        for (const from of MAP_SPACES.filter(n => g.sp(n).f.reg > 0)) {
          const ds = g.frMarchDests(from).filter(d => okDest(ctx, d) && g.patriotPieces(d) > 0 && g.britishPieces(d) > 0);
          if (!ds.length || movable(from).reg === 0) continue;
          const t = g.pick(ds); if (!selectDest(t)) break; g.frMarchGroup(from, t, 1, 0); anyMove = true; break;
        }
      }
      if (!anyMove && ctx.onlyDests) { for (const t of ctx.onlyDests) { const srcs = MAP_SPACES.filter(fr => g.sp(fr).f.reg > 0 && g.frMarchDests(fr).includes(t)).map(movable).filter(m => m.reg > 0); if (!srcs.length || !selectDest(t)) continue; for (const m of srcs) { const r = g.frMarchGroup(m.from, t, m.reg, m.cont); if (r.cont > 0) g.pay('patriots', 1); anyMove = true; } break; } }
      if (!anyMove) { g.say('Aucun March français possible'); if (!tried.has('muster')) return French.muster(g, ctx, tried); return pass(g, f); }
      French.saStd(g, ctx);
      return { action: 'command', command: 'March', spaces: dests, sa: !!ctx.saUsed };
    });
  },
  // ---- 8.6.6 Battle
  battle(g, ctx, tried) {
    tried = tried || new Set(); tried.add('battle'); const f = 'french';
    return g.group('Français : Battle (8.6.6)', () => {
      const plan = [];
      for (const n of SPACE_NAMES) {
        if (!(g.frenchPieces(n) > 0 && g.britishPieces(n) > 0)) continue;
        const payPatriots = g.sp(n).p.cont > 0 && g.res('patriots') > 0;
        const est = g.battleEstimate(n, f, { payPatriots }); if (est.att > est.def) plan.push({ n, payPatriots, est });
      }
      if (!plan.length) { g.say('Aucune bataille favorable → March'); if (!tried.has('march')) return French.march(g, ctx, tried); return pass(g, f); }
      const ranked = g.rank(plan, [p => g.rawPop(p.n)]);
      const chosen = []; for (const p of ranked) { if (chosen.length >= (ctx.limited ? 1 : 99)) break; if (!g.pay(f, 1)) break; if (p.payPatriots) { if (g.res('patriots') > 0) g.pay('patriots', 1); else p.payPatriots = false; } chosen.push(p); g.say(`Bataille sélectionnée : ${p.n} (estimation ${p.est.att} vs ${p.est.def})`); }
      ctx.battleSpaces = chosen.map(p => p.n);
      if (saOk(ctx)) { if (!French.navalPressure(g, ctx)) if (!French.skirmish(g, ctx)) if (!French.preparerPost(g, ctx)) g.say('Aucune Activité spéciale possible'); }
      for (const p of chosen) { const r = g.battle(p.n, f, { payPatriots: p.payPatriots }); g.applyWinTheDay(r); if (r.winTheDay && r.winner === 'rebellion') Patriots.freeRallyAfterWin(g, r); }
      return { action: 'command', command: 'Battle', spaces: chosen.map(p => p.n), sa: !!ctx.saUsed };
    });
  },
  // 8.1 Treaty of Alliance
  toaWanted(g) { return !g.state.toa && (g.state.wiSquadrons + g.availableOf('french', 'reg') + Math.floor(g.state.cbc / 2)) > 15; },
  brilliantStrokeWanted(g, ctx) {
    const L = g.state.leaders.french; if (!g.state.toa || !L.loc || g.sp(L.loc).f.reg < 4) return false;
    return (ctx.firstEligible && g.state.players[ctx.firstEligible] === 'human') || ctx.britishPlayedBS;
  },
};

// ======================================================================= 8.7 INDIENS
const Indians = {
  turn(g, ctx) {
    const f = 'indians';
    if (ctx.eventAllowed && ctx.card && !ctx.card.winter) { const dec = eventDecision(g, f, ctx); if (dec.play) return ctx.execEvent(dec.which); }
    return Indians.command(g, ctx);
  },
  eventWanted(g, m) {
    const S = g.totalSupport(), O = g.totalOpposition();
    if (O > S && m.soDelta > 0) return 'Opposition > Support et l\'événement déplace le Support/Opposition en faveur des Royalistes';
    if (m.villagePlaced || m.flags.freeGather) return 'l\'événement place un Village ou accorde un Gather gratuit';
    if (m.patriotFortRemoved) return 'l\'événement retire un Fort patriote';
    if (g.villages() >= 4 && m.effective) { const d = g.d6(); if (d >= 5) return 'au moins 4 Villages et D6 ≥ 5'; }
    return null;
  },
  command(g, ctx, tried) {
    tried = tried || new Set(); const f = 'indians';
    if (!tried.has('raid')) { const d = g.d6(); if (g.totalSupport() + d <= g.totalOpposition()) { g.say(`Support ${g.totalSupport()} + D6 ${d} ≤ Opposition ${g.totalOpposition()} → Raid`); return Indians.raid(g, ctx, tried); } }
    if (!tried.has('gather')) {
      const twoVillages = g.availableOf(f, 'vil') >= 2 && MAP_SPACES.filter(n => g.gatherOk(n) && g.roomForFort(n) && g.warParties(n) >= (g.state.leaders.indians.name === 'Cornplanter' && g.leaderAt(f, n) ? 2 : 3)).length >= 2;
      const d = g.d6();
      if (twoVillages || d < g.availableOf(f, 'wp')) { g.say(twoVillages ? 'Gather placerait 2 Villages → Gather' : `D6 ${d} < ${g.availableOf(f, 'wp')} War Parties disponibles → Gather`); return Indians.gather(g, ctx, tried); }
    }
    const scoutCond = MAP_SPACES.some(n => g.isProvince(n) && g.warParties(n) > 0 && g.sp(n).b.reg > 0);
    if (!tried.has('scout') && scoutCond) return Indians.scout(g, ctx, tried);
    if (!tried.has('march')) return Indians.march(g, ctx, tried);
    if (!tried.has('gather')) return Indians.gather(g, ctx, tried);
    return pass(g, f);
  },
  // ---- Activités spéciales (8.7.1)
  plunder(g, ctx) {
    const cands = g.rank((ctx.raidSpaces || []).filter(n => g.warParties(n) > g.rebellionPieces(n)), [n => g.rawPop(n)]);
    if (!cands.length) return false; g.say(`Activité spéciale : Plunder en ${cands[0]}`, 'act'); g.plunder(cands[0]); ctx.saUsed = true; return true;
  },
  warPath(g, ctx) {
    if (g.res('indians') === 0 && !ctx.free) { if (Indians.trade(g, ctx)) return true; }
    const cands = SPACE_NAMES.filter(n => g.warPathOk(n) && (!ctx.onlySpaces || ctx.onlySpaces.includes(n)) && !(ctx.usedSpaces || []).includes(n));
    if (!cands.length) return false;
    const ev = n => { const s = g.sp(n); const opt = g.rebellionUnits(n) === 0 && s.p.fort > 0 && s.i.wpU >= 2 ? 3 : (s.i.wpU >= 2 && g.rebellionUnits(n) >= 2 ? 2 : 1); return { opt, fort: opt === 3 ? 1 : 0, units: opt === 2 ? 2 : opt === 1 ? 1 : 0, vil: s.i.vil > 0 ? 1 : 0 }; };
    const n = g.rank(cands, [x => ev(x).fort, x => ev(x).units, x => ev(x).vil])[0];
    g.say(`Activité spéciale : War Path en ${n}`, 'act'); g.warPath(n, ev(n).opt); ctx.saUsed = true; (ctx.usedSpaces = ctx.usedSpaces || []).push(n); return true;
  },
  trade(g, ctx) {
    const cands = SPACE_NAMES.filter(n => g.sp(n).i.vil > 0 && g.sp(n).i.wpU > 0);
    if (!cands.length) return false;
    const n = g.rank(cands, [x => g.sp(x).i.wpU])[0];
    let gives = 0;
    if (g.state.players.british === 'bot') gives = British.tradeOffer(g); else gives = ctx.humanTradeOffer ? ctx.humanTradeOffer() : 0;
    g.say(`Activité spéciale : Trade en ${n}${gives > 1 ? ` (les Britanniques transfèrent ${gives})` : ''}`, 'act'); g.trade(n, gives); ctx.saUsed = true; return true;
  },
  saWarPathTrade(g, ctx) { if (!saOk(ctx)) return false; if (Indians.warPath(g, ctx)) return true; if (Indians.trade(g, ctx)) return true; g.say('Aucune Activité spéciale possible'); return false; },
  // ---- 8.7.1 Raid
  raid(g, ctx, tried) {
    tried = tried || new Set(); tried.add('raid'); const f = 'indians';
    return g.group('Indiens : Raid (8.7.1)', () => {
      const dc = g.state.leaders.indians.name === 'Dragging Canoe' ? g.state.leaders.indians.loc : null;
      const within2 = n => dc && (n === dc || g.isAdj(n, dc) || g.adj(dc).some(a => g.isAdj(a, n)));
      // cibles : Colonies en Opposition avec ou adjacentes à des WP Underground (ou à 2 espaces de Dragging Canoe)
      const hasUG = n => g.sp(n).i.wpU > 0 || g.adj(n).some(a => g.sp(a).i.wpU > 0 && g.isProvince(a)) || within2(n);
      let targets = COLONIES.filter(n => g.sp(n).sup < 0 && hasUG(n));
      const plunderPossible = n => { const wp = g.warParties(n) + (g.sp(n).i.wpU === 0 || g.warParties(n) <= g.rebellionPieces(n) ? 1 : 0); return wp > g.rebellionPieces(n) ? 1 : 0; };
      targets = g.rank(targets, [n => plunderPossible(n), n => g.rawPop(n)]);
      const selected = []; let saUsed = false; const maxSpaces = ctx.limited ? 1 : 3;
      ctx.raidSpaces = selected;
      for (const t of targets) {
        if (selected.length >= maxSpaces || g.res(f) < 1) break;
        // déplacer une WP Underground adjacente si nécessaire (sans retirer la dernière WP d'un espace à Village)
        if (g.sp(t).i.wpU === 0 || g.warParties(t) <= g.rebellionPieces(t)) {
          const srcs = g.adj(t).filter(a => g.isProvince(a) && g.sp(a).i.wpU > 0 && !(g.sp(a).i.vil > 0 && g.warParties(a) <= 1));
          const src = g.rank(srcs, [a => g.sp(a).i.wpU])[0];
          if (src) g.movePiece('indians', 'wp', src, t, 1, 'U');
        }
        if (g.sp(t).i.wpU === 0) continue;
        g.pay(f, 1); selected.push(t); g.say(`Raid en ${t} (1 Ressource)`); g.raidSpace(t);
        if (g.res(f) === 0 && !saUsed && saOk(ctx)) { saUsed = Indians.plunder(g, ctx) || Indians.trade(g, ctx); }
      }
      if (!selected.length) { g.say('Aucun Raid possible → Gather'); return Indians.gather(g, ctx, tried); }
      if (!saUsed) Indians.saWarPathTrade(g, ctx); // 8.7.1 : sinon War Path après le Raid, ou Trade
      return { action: 'command', command: 'Raid', spaces: selected, sa: !!ctx.saUsed };
    });
  },
  // ---- 8.7.2 Gather
  gather(g, ctx, tried) {
    tried = tried || new Set(); tried.add('gather'); const f = 'indians';
    return g.group('Indiens : Gather (8.7.2)', () => {
      const selected = []; let executed = false; const maxSpaces = ctx.limited ? 1 : 4; let firstReserveFree = true;
      const cost = n => (firstReserveFree && g.isReserve(n)) ? 0 : 1;
      const canSelect = n => selected.length < maxSpaces && g.res(f) >= cost(n) && g.gatherOk(n) && okDest(ctx, n);
      const select = n => { if (selected.includes(n)) return true; if (!canSelect(n)) return false; const c = cost(n); if (c === 0) firstReserveFree = false; else g.pay(f, c); selected.push(n); g.say(`Espace sélectionné : ${n} (${c} Ressource)`); return true; };
      const L = g.state.leaders.indians; const needWP = n => (L.name === 'Cornplanter' && L.loc === n) ? 2 : 3;
      // Villages
      if (g.availableOf(f, 'vil') > 0) {
        const cands = g.rank(PROVINCES_OK(g).filter(n => g.roomForFort(n) && g.warParties(n) >= needWP(n)), [n => L.loc === n ? 1 : 0]);
        for (const n of cands) { if (g.availableOf(f, 'vil') === 0) break; if (!canSelect(n)) continue; if (select(n)) { if (needWP(n) === 2) { g.remove('indians', 'wp', n, 1); if (g.place('indians', 'vil', n, 1)) executed = true; } else if (g.gatherReplaceWithVillage(n)) executed = true; } }
      }
      // War Parties aux Villages : d'abord avec pièces ennemies, puis sans WP Underground, puis avec Leader
      if (g.availableOf(f, 'wp') > 0) {
        const cands = g.rank(PROVINCES_OK(g).filter(n => g.sp(n).i.vil > 0), [n => g.rebellionPieces(n) > 0 ? 1 : 0, n => g.sp(n).i.wpU === 0 ? 1 : 0, n => L.loc === n ? 1 : 0]);
        for (const n of cands) { if (g.availableOf(f, 'wp') === 0) break; if (!canSelect(n) && !selected.includes(n)) continue; if (select(n)) { if (g.gatherAtVillagePlace(n)) executed = true; } }
      }
      // Si Villages disponibles : WP dans jusqu'à 2 espaces avec place pour un Village (2 WP déjà, puis 1 WP, puis hasard)
      if (g.availableOf(f, 'vil') > 0 && g.availableOf(f, 'wp') > 0) {
        const cands = g.rank(PROVINCES_OK(g).filter(n => g.roomForFort(n) && g.sp(n).i.vil === 0 && !selected.includes(n)), [n => g.warParties(n) === 2 ? 2 : g.warParties(n) === 1 ? 1 : 0]);
        let k = 0; for (const n of cands) { if (k >= 2 || g.availableOf(f, 'wp') === 0) break; if (select(n)) { if (g.gatherPlaceWP(n)) { executed = true; k++; } } }
      }
      // Plus de WP disponibles et < 4 espaces : rassembler dans un espace à Village
      if (g.availableOf(f, 'wp') === 0 && selected.length < maxSpaces) {
        const cands = PROVINCES_OK(g).filter(n => g.sp(n).i.vil > 0 && !selected.includes(n));
        const score = n => g.adj(n).reduce((a, x) => a + movableActiveWP(g, x), 0);
        const best = g.rank(cands.filter(n => score(n) > 0 || g.sp(n).i.wpA > 0), [n => score(n)])[0];
        if (best && select(best)) { for (const a of g.adj(best)) { const k = movableActiveWP(g, a); if (k) g.movePiece('indians', 'wp', a, best, k, 'A'); } g.undergroundWP(best); executed = true; }
      }
      if (!executed) { g.say('Aucun Gather possible'); if (!tried.has('march')) return Indians.march(g, ctx, tried); return pass(g, f); }
      Indians.saWarPathTrade(g, ctx);
      return { action: 'command', command: 'Gather', spaces: selected, sa: !!ctx.saUsed };
    });
  },
  // ---- 8.7.3 March
  march(g, ctx, tried) {
    tried = tried || new Set(); tried.add('march'); const f = 'indians';
    return g.group('Indiens : March (8.7.3)', () => {
      const dests = []; let anyMove = false; const maxDest = ctx.limited ? 1 : 3; let firstFree = true;
      const allFromReserve = (srcs) => srcs.every(s => g.isReserve(s));
      const canAdd = () => dests.length < maxDest;
      const selectDest = (n, srcs) => { if (dests.includes(n)) return true; if (!canAdd()) return false; const free = firstFree && allFromReserve(srcs); if (!free && g.res(f) < 1) return false; if (free) firstFree = false; else g.pay(f, 1); dests.push(n); g.say(`Destination sélectionnée : ${n} (${free ? 0 : 1} Ressource)`); return true; };
      const movable = from => { const s = g.sp(from); let u = s.i.wpU, a = s.i.wpA; if (s.i.vil > 0) { const keep = 1; let k = keep; const kU = Math.min(k, u); k -= kU; u -= kU; const kA = Math.min(k, a); a -= kA; } return { from, u, a, size: u + a }; };
      const noRebCtl = (from, t, k) => { // ne pas ajouter de Contrôle Rébellion (à l'origine)
        const margin = g.royalistPieces(from) - g.rebellionPieces(from); return !(margin >= 0 && margin - k < 0 && g.rebellionPieces(from) > 0); };
      // 1. si Village disponible : 3+ WP dans un espace Neutre/Passif de plus avec place pour un Village
      if (g.availableOf(f, 'vil') > 0 && canAdd()) {
        const existing = new Set(PROVINCES_OK(g).filter(n => g.roomForFort(n) && g.warParties(n) >= 3));
        const targets = g.rank(PROVINCES_OK(g).filter(n => okDest(ctx, n) && g.roomForFort(n) && !existing.has(n) && g.sp(n).i.vil === 0), [n => g.warParties(n)]);
        for (const t of targets) {
          const srcs = g.adj(t).filter(a => g.isProvince(a) && !existing.has(a)).map(movable).filter(m => m.size > 0).sort((a, b) => b.size - a.size);
          const total = srcs.reduce((a, x) => a + x.size, 0); const need = 3 - g.warParties(t);
          if (need <= 0 || total < need) continue;
          if (!selectDest(t, srcs.map(s => s.from))) break;
          let left = need; for (const m of srcs) { if (left <= 0) break; const k = Math.min(left, m.size); if (!noRebCtl(m.from, t, k)) continue; const r = g.indMarchGroup(m.from, t, Math.min(k, m.u), Math.max(0, k - m.u)); left -= r.wpU + r.wpA; anyMove = true; }
          break;
        }
      }
      // 2. retirer le plus de Contrôle Rébellion possible, d'abord espaces sans Support Actif
      const targets = g.rank(PROVINCES_ALL(g).filter(n => okDest(ctx, n) && g.rebellionControl(n)), [n => g.sp(n).sup !== 2 ? 1 : 0, n => g.rawPop(n)]);
      for (const t of targets) {
        if (!canAdd()) break;
        const srcs = g.adj(t).filter(a => g.isProvince(a)).map(movable).filter(m => m.size > 0).sort((a, b) => b.size - a.size);
        const need = g.rebellionPieces(t) - g.royalistPieces(t); const total = srcs.reduce((a, x) => a + x.size, 0);
        if (total < need) continue;
        if (!selectDest(t, srcs.map(s => s.from))) break;
        let left = need; for (const m of srcs) { if (left <= 0) break; const k = Math.min(left, m.size); if (!noRebCtl(m.from, t, k)) continue; const r = g.indMarchGroup(m.from, t, Math.min(k, m.u), Math.max(0, k - m.u)); left -= r.wpU + r.wpA; anyMove = true; }
      }
      if (!anyMove && ctx.onlyDests) { for (const t of ctx.onlyDests.filter(t => g.isProvince(t))) { const srcs = g.adj(t).filter(a => g.isProvince(a)).map(movable).filter(m => m.size > 0).sort((a, b) => b.size - a.size); if (!srcs.length || !selectDest(t, srcs.map(s => s.from))) continue; for (const m of srcs) { const r = g.indMarchGroup(m.from, t, m.u, m.a); anyMove = true; } break; } }
      if (!anyMove) { g.say('Aucun March indien possible'); if (!tried.has('gather')) return Indians.gather(g, ctx, tried); return pass(g, f); }
      Indians.saWarPathTrade(g, ctx);
      return { action: 'command', command: 'March', spaces: dests, sa: !!ctx.saUsed };
    });
  },
  // ---- 8.7.4 Scout
  scout(g, ctx, tried) {
    tried = tried || new Set(); tried.add('scout'); const f = 'indians';
    return g.group('Indiens : Scout (8.7.4)', () => {
      if (g.res(f) < 1 || g.res('british') < 1) { g.say('Scout impossible (Ressources insuffisantes : Indiens et Britanniques paient 1 chacun) → March'); if (!tried.has('march')) return Indians.march(g, ctx, tried); return pass(g, f); }
      const origins = MAP_SPACES.filter(n => g.isProvince(n) && g.warParties(n) > 0 && g.sp(n).b.reg > 0);
      let best = null;
      for (const o of origins) {
        const s = g.sp(o);
        // Regulars/Tories déplaçables sans perdre le Contrôle britannique ni ajouter le Contrôle Rébellion
        let reg = s.b.reg, tor = s.b.tor; const margin = g.royalistPieces(o) - g.rebellionPieces(o);
        const maxLeave = g.britishControl(o) ? Math.max(0, margin - 2) : (g.rebellionPieces(o) > 0 ? Math.max(0, margin - 1) : 99); // la War Party qui part compte aussi
        let moveReg = Math.min(reg, maxLeave), moveTor = Math.min(tor, Math.max(0, maxLeave - moveReg), moveReg);
        if (moveReg < 1) continue;
        for (const t of g.adj(o).filter(a => g.isProvince(a) && okDest(ctx, a))) {
          const sc = [g.sp(t).p.fort > 0 ? 1 : 0, g.sp(t).i.vil > 0 && g.rebellionPieces(t) > 0 ? 1 : 0, g.rebellionControl(t) && g.royalistPieces(t) + 1 + moveReg + moveTor >= g.rebellionPieces(t) ? 1 : 0, moveReg + moveTor];
          const cand = { o, t, reg: moveReg, tor: moveTor, sc, r: g.rng() };
          if (!best || cmpArr(sc, best.sc) > 0 || (cmpArr(sc, best.sc) === 0 && cand.r < best.r)) best = cand;
        }
      }
      if (!best || best.sc[0] + best.sc[1] + best.sc[2] === 0 && false) { g.say('Aucun Scout possible → March'); if (!tried.has('march')) return Indians.march(g, ctx, tried); return pass(g, f); }
      g.pay(f, 1); g.pay('british', 1); g.say(`Scout de ${best.o} vers ${best.t} (1 Ressource indienne + 1 britannique)`);
      g.scout(best.o, best.t, 1, best.reg, best.tor);
      // Skirmish britannique à destination : Fort patriote si possible, sinon le plus de pièces
      const s = g.sp(best.t); const tg = g.skirmishTargets('british', best.t);
      if (s.b.reg > 0 && (tg.units > 0 || tg.fort > 0)) { g.say(`Skirmish (via Scout) en ${best.t}`, 'act'); if (tg.units === 0 && tg.fort > 0) g.skirmish('british', best.t, 3); else if (tg.units >= 2) g.skirmish('british', best.t, 2); else g.skirmish('british', best.t, 1); }
      Indians.saWarPathTrade(g, ctx);
      return { action: 'command', command: 'Scout', spaces: [best.t], sa: !!ctx.saUsed };
    });
  },
  brilliantStrokeWanted(g, ctx) {
    const L = g.state.leaders.indians; if (!g.state.toa || !L.loc || g.warParties(L.loc) < 3) return false;
    return (ctx.firstEligible && g.state.players[ctx.firstEligible] === 'human') || ctx.rebellionPlayedBS;
  },
};
function okDest(ctx, n) { return !ctx.onlyDests && !ctx.onlySpaces || (ctx.onlyDests && ctx.onlyDests.includes(n)) || (ctx.onlySpaces && ctx.onlySpaces.includes(n)); }
function cmpArr(a, b) { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] - b[i]; } return 0; }
function PROVINCES_OK(g) { return MAP_SPACES.filter(n => g.gatherOk(n)); }
function PROVINCES_ALL(g) { return MAP_SPACES.filter(n => g.isProvince(n)); }
function movableActiveWP(g, x) { const s = g.sp(x); if (s.i.wpA === 0) return 0; if (s.i.vil > 0 && g.warParties(x) <= 1) return 0; const margin = g.royalistPieces(x) - g.rebellionPieces(x); if (g.rebellionPieces(x) > 0 && margin >= 0) return Math.max(0, Math.min(s.i.wpA, margin)); return s.i.wpA; }

// ======================================================================= Décision Événement (8.3, 8.4-8.7)
function eventDecision(g, f, ctx) {
  const card = ctx.card; const E = LOD.Events;
  const icon = card.icons ? card.icons[f] : 'none';
  if (icon === 'sword') { g.say(`${FR[f]} : symbole sabre sur la carte → l'événement est ignoré`); return { play: false }; }
  if (!E || !E.has(card.id)) { g.say(`${FR[f]} : événement #${card.id} non codé → Commande`); return { play: false }; }
  if (icon === 'musket') g.say(`${FR[f]} : symbole mousquet — les instructions spéciales de la feuille "Non-player Events" ne sont pas disponibles ; décision selon les conditions générales (8.3, 8.${{ british: 4, patriots: 5, french: 6, indians: 7 }[f]})`, 'warn');
  const which = E.whichText(card, f); // 8.3.2
  const m = E.evaluate(g, f, card, which, ctx);
  const BOT = { british: British, patriots: Patriots, french: French, indians: Indians }[f];
  if (!m.effective) { g.say(`${FR[f]} : l'événement « ${card.title} » serait sans effet utile (8.3.3) → Commande`); return { play: false }; }
  const why = BOT.eventWanted(g, m, ctx);
  if (why) { g.say(`${FR[f]} jouent l'événement « ${card.title} » (${which === 'shaded' ? 'texte ombré' : 'texte non ombré'}) : ${why}`, 'act'); return { play: true, which }; }
  g.say(`${FR[f]} : aucune condition pour jouer l'événement « ${card.title} » → Commande`);
  return { play: false };
}

const Bots = { british: British, patriots: Patriots, french: French, indians: Indians, pass, eventDecision };
LOD.Bots = Bots;
if (typeof module !== 'undefined' && module.exports) module.exports = LOD;
})(typeof window !== 'undefined' ? window : globalThis);
