/* Liberty or Death — Winter Quarters (6.0) et déroulement d'une carte Événement (2.3), avec pauses pour le(s) joueur(s) humain(s).
 * Les fonctions "run*" sont des générateurs : chaque `yield` est une demande d'action au joueur humain ; l'interface reprend avec next(réponse). */
(function (root) {
'use strict';
const LOD = typeof module !== 'undefined' && module.exports ? require('./events.js') : root.LOD;
const { WI, CITIES, COLONIES, RESERVES, MAP_SPACES, SPACE_NAMES, FR, SIDE, FACTIONS, LEADER_SEQ } = LOD;
const Bots = LOD.Bots, Events = LOD.Events;

const WQ = {};
// ----------------------------------------------------------------------- 6.2 Supply
WQ.outOfSupply = function (g, f) {
  const out = [];
  for (const n of MAP_SPACES) {
    const s = g.sp(n);
    if (f === 'british' && g.britishCubes(n) > 0 && !(s.b.fort > 0 || (g.isCity(n) && g.britishControl(n)))) out.push(n);
    if (f === 'patriots' && g.patriotUnits(n) > 0 && !(s.p.fort > 0 || ((g.isCity(n) || g.isColony(n)) && g.rebellionControl(n)))) out.push(n);
    if (f === 'french' && s.f.reg > 0 && !(s.p.fort > 0 || ((g.isCity(n) || g.isColony(n)) && g.rebellionControl(n)))) out.push(n);
    if (f === 'indians' && g.warParties(n) > 0 && !(s.i.vil > 0 || g.isReserve(n))) out.push(n);
  }
  return out;
};
function nearest(g, from, pred) { // BFS
  const seen = new Set([from]); let frontier = [from];
  while (frontier.length) { const next = []; for (const x of frontier) for (const a of g.adj(x)) { if (seen.has(a)) continue; seen.add(a); if (pred(a)) return a; next.push(a); } frontier = next; }
  return null;
}
WQ.supplyBritish = function (g) { // 8.4.7
  const spaces = WQ.outOfSupply(g, 'british'); if (!spaces.length) { g.say('Britanniques : toutes les unités sont ravitaillées'); return; }
  const important = n => g.britishControl(n) || (g.rebellionPieces(n) > 0 && g.rebellionPieces(n) >= g.royalistPieces(n) - g.britishCubes(n));
  const imp = g.rank(spaces.filter(important), [n => g.rawPop(n)]); const rest = spaces.filter(n => !important(n));
  const unpaid = [];
  for (const n of imp) { if (g.pay('british', 1)) g.say(`Supply britannique payé en ${n}`); else unpaid.push(n); }
  for (const n of rest) { const s = g.sp(n); g.say(`Supply : cubes britanniques de ${n} retirés en Available`); g.remove('british', 'reg', n, s.b.reg); g.remove('british', 'tor', n, s.b.tor); }
  for (const n of unpaid) {
    if (g.canShift(n, -1)) { g.say(`Supply britannique non payé en ${n} : décalage vers l'Opposition`); g.shift(n, -1); }
    else { const a = g.rank(g.adj(n).filter(x => g.canShift(x, -1)), [x => -g.rawPop(x)])[0]; if (a) { g.say(`Supply non payé en ${n} : décalage en ${a}`); g.shift(a, -1); } else { const s = g.sp(n); g.remove('british', 'reg', n, s.b.reg); g.remove('british', 'tor', n, s.b.tor); } }
  }
};
WQ.supplyPatriots = function (g) { // 8.5.5
  const spaces = WQ.outOfSupply(g, 'patriots'); if (!spaces.length) { g.say('Patriotes : toutes les unités sont ravitaillées'); return; }
  const removeCount = n => Math.floor(g.patriotUnits(n) / 2);
  const changesControl = n => { const sim = g.clone(); sim.removePatriotUnits(n, removeCount(n)); return sim.control(n) !== g.control(n); };
  const rlPossible = n => { const sim = g.clone(); sim.removePatriotUnits(n, removeCount(n)); return sim.canRewardLoyalty(n); };
  const pay = g.rank(spaces.filter(changesControl), [n => rlPossible(n) ? 1 : 0, n => g.sp(n).i.vil, n => g.rawPop(n)]);
  const paid = new Set();
  for (const n of pay) { if (g.pay('patriots', 1)) { paid.add(n); g.say(`Supply patriote payé en ${n}`); } }
  for (const n of spaces) { if (paid.has(n)) continue; const k = removeCount(n); if (k > 0) { g.say(`Supply : ${k} unité(s) patriote(s) retirée(s) de ${n}`); g.removePatriotUnits(n, k); } }
};
WQ.supplyFrench = function (g) { // 8.6.7
  const spaces = WQ.outOfSupply(g, 'french'); if (!spaces.length) { g.say('Français : toutes les unités sont ravitaillées'); return; }
  const changesControl = n => { const sim = g.clone(); sim.sp(n).f.reg = 0; return sim.control(n) !== g.control(n); };
  const rlPossible = n => { const sim = g.clone(); sim.sp(n).f.reg = 0; return sim.canRewardLoyalty(n); };
  const pay = g.rank(spaces.filter(changesControl), [n => rlPossible(n) ? 1 : 0, n => g.rawPop(n)]); const paid = new Set();
  for (const n of pay) { if (g.pay('french', 1)) { paid.add(n); g.say(`Supply français payé en ${n}`); } }
  for (const n of spaces) { if (paid.has(n)) continue; const dest = nearest(g, n, x => g.sp(x).p.fort > 0); const k = g.sp(n).f.reg; if (dest) { g.say(`Supply : Regulars français de ${n} déplacés vers ${dest}`); g.movePiece('french', 'reg', n, dest, k); } else g.remove('french', 'reg', n, k); }
};
WQ.supplyIndians = function (g) { // 8.7.5 + 6.2.1 (aucun Village : en placer un)
  if (g.villages() === 0 && g.availableOf('indians', 'vil') > 0) { const n = g.rank(RESERVES, [x => g.warParties(x)])[0]; g.say('Aucun Village sur la carte : placement d\'un Village'); g.place('indians', 'vil', n, 1); }
  const spaces = WQ.outOfSupply(g, 'indians'); if (!spaces.length) { g.say('Indiens : toutes les War Parties sont ravitaillées'); return; }
  const addsReb = n => { const sim = g.clone(); sim.sp(n).i.wpU = 0; sim.sp(n).i.wpA = 0; return sim.control(n) === 'rebellion' && g.control(n) !== 'rebellion'; };
  const gatherVillage = n => g.gatherOk(n) && g.roomForFort(n) && g.warParties(n) >= 2;
  const ranked = g.rank(spaces, [n => addsReb(n) ? 1 : 0, n => gatherVillage(n) ? 1 : 0]);
  for (const n of ranked) {
    if ((addsReb(n) || gatherVillage(n)) && g.pay('indians', 1)) { g.say(`Supply indien payé en ${n}`); continue; }
    const dest = nearest(g, n, x => g.sp(x).i.vil > 0 && !g.isCity(x)); const k = g.warParties(n);
    if (dest) { g.say(`Supply : War Parties de ${n} déplacées vers ${dest}`); g.movePiece('indians', 'wp', n, dest, k); } else { g.say(`Supply : aucun Village atteignable, War Parties de ${n} restent`); }
  }
};
// ----------------------------------------------------------------------- 6.3 Ressources
WQ.resources = function (g) {
  const st = g.state;
  const b = g.forts('british') + CITIES.filter(c => g.britishControl(c) && !g.blockaded(c)).reduce((a, c) => a + g.rawPop(c), 0) + (g.control(WI) === 'british' ? 5 : 0);
  const i = Math.floor(g.villages() / 2);
  const p = g.forts('patriots') + Math.floor(MAP_SPACES.filter(n => g.rebellionControl(n)).length / 2);
  const f = st.toa ? st.fni + CITIES.filter(c => !g.britishControl(c)).reduce((a, c) => a + g.pop(c), 0) + (g.control(WI) === 'rebellion' ? 5 : 0) : 2 * st.wiSquadrons;
  g.say(`Revenus : Britanniques +${b}, Indiens +${i}, Patriotes +${p}, Français +${f}`);
  g.addRes('british', b); g.addRes('indians', i); g.addRes('patriots', p); g.addRes('french', f);
};
// ----------------------------------------------------------------------- 6.4 Support Phase (bots)
WQ.rewardLoyaltyBot = function (g, reserve) { // 8.4.5 ; dépense jusqu'à garder `reserve` Ressources (hypothèse, voir notes)
  const cands = () => SPACE_NAMES.filter(n => g.canRewardLoyalty(n) && g.sp(n).sup < 2);
  let guard = 0;
  while (g.res('british') > reserve && guard++ < 30) {
    const c = g.rank(cands(), [n => -(g.sp(n).raid + g.sp(n).prop), n => (2 - g.sp(n).sup) * g.rawPop(n)]);
    if (!c.length) break; const n = c[0]; const before = g.res('british');
    const spent = Math.min(g.res('british') - reserve, 99);
    // retirer marqueurs puis jusqu'à 2 niveaux
    const s = g.sp(n); let budget = spent;
    while (budget > 0 && s.raid + s.prop > 0) { g.pay('british', 1); budget--; if (s.raid > 0) { s.raid--; g.say(`Marqueur Raid retiré de ${n}`); g.emit({ t: 'marker', kind: 'raid', n, delta: -1 }); } else { s.prop--; g.say(`Marqueur Propaganda retiré de ${n}`); g.emit({ t: 'marker', kind: 'prop', n, delta: -1 }); } }
    let lv = 0; while (budget > 0 && lv < 2 && s.sup < 2) { g.pay('british', 1); budget--; g.shift(n, 1); lv++; }
    if (g.res('british') === before) break;
    g.say(`Reward Loyalty en ${n} : ${before - g.res('british')} Ressource(s)`);
    if (s.sup === 2 || lv === 2) continue; else break;
  }
};
WQ.committeesBot = function (g, reserve) { // Patriotes : espaces Rébellion-contrôlés avec pièces patriotes ; priorité Pop puis niveau (hypothèse)
  let guard = 0; const done = {};
  while (g.res('patriots') > reserve && guard++ < 30) {
    const c = g.rank(MAP_SPACES.filter(n => g.rebellionControl(n) && g.patriotPieces(n) > 0 && (g.sp(n).raid > 0 || g.sp(n).sup > -2) && (done[n] || 0) < 2), [n => g.rawPop(n), n => g.sp(n).sup]);
    if (!c.length) break; const n = c[0]; const s = g.sp(n);
    g.pay('patriots', 1);
    if (s.raid > 0) { s.raid--; g.say(`Committees of Correspondence en ${n} : marqueur Raid retiré`); g.emit({ t: 'marker', kind: 'raid', n, delta: -1 }); }
    else { g.shift(n, -1); done[n] = (done[n] || 0) + 1; g.say(`Committees of Correspondence en ${n}`); }
  }
};
// ----------------------------------------------------------------------- 6.5 Redeploiement
WQ.leaderChange = function (g, nextCard) {
  if (!nextCard || nextCard.winter || !nextCard.order) { g.say('Pas de changement de Leader (pas de carte Événement visible)'); return; }
  const f = nextCard.order[0]; const L = g.state.leaders[f]; const seq = LEADER_SEQ[f]; const i = seq.indexOf(L.name);
  if (f === 'french' && !g.state.toa) { g.say('Français : pas de changement de Leader avant Treaty of Alliance'); return; }
  if (i < 0 || i >= seq.length - 1) { g.say(`${FR[f]} : aucun changement de Leader possible (${L.name})`); return; }
  g.say(`Changement de Leader ${FR[f]} : ${L.name} → ${seq[i + 1]}`); L.name = seq[i + 1]; g.emit({ t: 'leadername', f, name: L.name });
};
WQ.redeployLeaderBot = function (g, f) {
  const L = g.state.leaders[f]; let n = null;
  if (f === 'british') n = g.rank(SPACE_NAMES.filter(x => g.sp(x).b.reg > 0), [x => g.sp(x).b.reg])[0];
  if (f === 'patriots') n = g.rank(MAP_SPACES.filter(x => g.sp(x).p.cont > 0), [x => g.sp(x).p.cont])[0] || g.rank(MAP_SPACES.filter(x => g.patriotPieces(x) > 0), [x => g.patriotPieces(x)])[0];
  if (f === 'french') { if (!g.state.toa) return; n = g.rank(SPACE_NAMES.filter(x => g.sp(x).f.reg > 0), [x => g.sp(x).p.cont > 0 ? 1 : 0, x => g.sp(x).f.reg])[0]; }
  if (f === 'indians') { if (L.name === 'Cornplanter') { n = g.rank(MAP_SPACES.filter(x => g.gatherOk(x) && g.warParties(x) >= 2 && g.roomForFort(x)), [x => g.warParties(x)])[0]; } if (!n) n = g.rank(MAP_SPACES.filter(x => g.warParties(x) > 0), [x => g.warParties(x)])[0] || g.rank(MAP_SPACES.filter(x => g.indianPieces(x) > 0), [x => g.indianPieces(x)])[0]; }
  if (n && n !== L.loc) { g.say(`${L.name} redéployé en ${n}`); g.emit({ t: 'leader', f, from: L.loc, to: n }); L.loc = n; }
};
WQ.britishRelease = function (g) {
  const st = g.state; const r = st.release[st.wqDone]; if (!r) { g.say('Aucune libération britannique prévue'); return; }
  const reg = Math.min(r.reg, st.unavailable.british.reg), tor = Math.min(r.tor, st.unavailable.british.tor);
  st.unavailable.british.reg -= reg; st.available.british.reg += reg; st.unavailable.british.tor -= tor; st.available.british.tor += tor;
  g.say(`British Release Date : ${reg} Regulars et ${tor} Tories Unavailable → Available`);
};
// ----------------------------------------------------------------------- 6.6 Désertion
WQ.patriotDesertion = function (g) {
  const mil = g.countOnMap('patriots', 'mil'), cont = g.countOnMap('patriots', 'cont');
  const km = Math.floor(mil / 5), kc = Math.floor(cont / 5);
  g.say(`Désertion patriote : ${km} Milice(s) et ${kc} Continental(s) (${mil} Milices, ${cont} Continentals sur la carte)`);
  const pickIndian = (type) => { // 8.7.6 : d'abord espaces avec Villages, puis retirer le Contrôle Rébellion, puis la dernière unité de ce type, puis hasard
    const has = n => type === 'mil' ? g.militia(n) > 0 : g.sp(n).p.cont > 0;
    const remCtl = n => { const sim = g.clone(); sim.remove('patriots', type, n, 1); return g.rebellionControl(n) && !sim.rebellionControl(n) ? 1 : 0; };
    return g.rank(MAP_SPACES.filter(has), [n => g.sp(n).i.vil, remCtl, n => (type === 'mil' ? g.militia(n) : g.sp(n).p.cont) === 1 ? 1 : 0])[0]; };
  const pickPatriot = (type) => { // 8.5.7 : changer le moins de Contrôle, sans retirer la dernière unité patriote d'un espace
    const has = n => type === 'mil' ? g.militia(n) > 0 : g.sp(n).p.cont > 0;
    const keepCtl = n => { const sim = g.clone(); sim.remove('patriots', type, n, 1); return sim.control(n) === g.control(n) ? 1 : 0; };
    return g.rank(MAP_SPACES.filter(has), [keepCtl, n => g.patriotUnits(n) > 1 ? 1 : 0, n => type === 'mil' ? g.sp(n).p.milA : 0])[0]; };
  for (const [type, k] of [['mil', km], ['cont', kc]]) {
    for (let i = 0; i < k; i++) { const n = i === 0 ? pickIndian(type) : pickPatriot(type); if (!n) break; g.remove('patriots', type, n, 1, 'available', 'A'); }
  }
};
WQ.toryDesertion = function (g) {
  const tor = g.countOnMap('british', 'tor'); const k = Math.floor(tor / 5);
  g.say(`Désertion des Tories : ${k} (${tor} Tories sur la carte)`);
  const pickFrench = () => g.rank(MAP_SPACES.filter(n => g.sp(n).b.tor > 0), [n => { const sim = g.clone(); sim.remove('british', 'tor', n, 1); return sim.control(n) !== g.control(n) ? 1 : 0; }, n => g.sp(n).b.tor === 1 && g.sp(n).sup !== 2 ? g.rawPop(n) : -1])[0];
  const pickBritish = () => g.rank(MAP_SPACES.filter(n => g.sp(n).b.tor > 0), [n => { const sim = g.clone(); sim.remove('british', 'tor', n, 1); return sim.control(n) === g.control(n) ? 1 : 0; }, n => g.sp(n).b.tor > 1 ? 1 : 0])[0];
  for (let i = 0; i < k; i++) { const n = i === 0 ? pickFrench() : pickBritish(); if (!n) break; g.remove('british', 'tor', n, 1); }
};
// ----------------------------------------------------------------------- 6.7 Reset
WQ.reset = function (g, card) {
  const st = g.state;
  for (const n of MAP_SPACES) { const s = g.sp(n); if (s.raid) { g.emit({ t: 'marker', kind: 'raid', n, delta: -s.raid }); s.raid = 0; } if (s.prop) { g.emit({ t: 'marker', kind: 'prop', n, delta: -s.prop }); s.prop = 0; } g.undergroundMilitia(n); g.undergroundWP(n); }
  for (const f of FACTIONS) st.eligible[f] = true;
  st.available.british.reg += st.casualties.british.reg; st.available.british.tor += st.casualties.british.tor; st.casualties.british = { reg: 0, tor: 0 };
  st.available.patriots.cont += st.casualties.patriots.cont; st.casualties.patriots = { cont: 0 };
  st.available.french.reg += st.casualties.french.reg; st.casualties.french = { reg: 0 };
  g.say('Reset : marqueurs Raid/Propaganda retirés, toutes les factions Eligible, Casualties → Available, Milices et War Parties Underground');
  if (card && Events.WQEVENT[card.id]) g.group(`Événement de la carte Winter Quarters #${card.id}`, () => Events.WQEVENT[card.id](g));
  st.wqDone++;
};

// ======================================================================= Déroulement d'un Winter Quarters (générateur)
WQ.run = function* (g, card, nextCard) {
  const st = g.state; const human = f => st.players[f] === 'human';
  g.say(`WINTER QUARTERS #${st.wqDone + 1} (carte #${card.id})`, 'head');
  // 6.1 Victoire
  const winners = g.victoryCheck();
  if (winners.length) { g.say(`Phase de victoire : ${winners.map(w => FR[w]).join(', ')} remplissent leurs deux conditions — fin de partie (7.2)`, 'act'); return { gameOver: true, winners }; }
  g.say('Phase de victoire : aucune faction ne remplit ses deux conditions');
  // 6.2 Supply
  yield* g.groupGen('Phase Supply (6.2)', function* () {
    for (const f of ['british', 'patriots', 'french', 'indians']) {
      const spaces = WQ.outOfSupply(g, f);
      if (human(f)) { if (f === 'indians' && g.villages() === 0) WQ.supplyIndians(g); if (spaces.length) yield { type: 'human', faction: f, phase: 'supply', msg: `Phase Supply — ${FR[f]} (vous) : unités hors ravitaillement en ${spaces.join(', ')}. Appliquez la règle 6.2.1 (payer 1 Ressource, retirer, ou décaler) et corrigez l'état.` }; else g.say(`${FR[f]} : toutes les unités sont ravitaillées`); }
      else ({ british: WQ.supplyBritish, patriots: WQ.supplyPatriots, french: WQ.supplyFrench, indians: WQ.supplyIndians })[f](g);
    }
    // 6.2.2 Bataille aux Antilles
    if (g.sp(WI).f.reg > 0 && g.britishPieces(WI) > 0) {
      g.say('Bataille obligatoire aux Antilles (6.2.2)'); const r = g.battle(WI, 'french', {});
      for (const f of ['french', 'british']) {
        const k = f === 'french' ? g.sp(WI).f.reg : g.sp(WI).b.reg; if (!k) continue;
        if (human(f)) yield { type: 'human', faction: f, phase: 'wi', msg: `Antilles : ${FR[f]} (vous) pouvez retirer vos unités en Available et/ou payer 1 Ressource pour celles qui restent (6.2.2). Corrigez l'état.` };
        else if (f === 'french') { if (g.pay('french', 1)) g.say('Français : 1 Ressource payée pour rester aux Antilles'); else g.remove('french', 'reg', WI, k); }
        else { if (g.control(WI) === 'british' && g.pay('british', 1)) g.say('Britanniques : 1 Ressource payée pour rester aux Antilles'); else g.remove('british', 'reg', WI, k); }
      }
    }
  });
  // 6.3 Ressources
  g.group('Phase Ressources (6.3)', () => WQ.resources(g));
  // 6.4 Support
  const finalRound = st.wqDone + 1 >= st.wqTotal;
  yield* g.groupGen('Phase Support (6.4)', function* () {
    if (human('british')) yield { type: 'human', faction: 'british', phase: 'support', msg: `Phase Support — Reward Loyalty (6.4.1) : Britanniques (vous), dépensez des Ressources si vous le souhaitez et corrigez l'état.` };
    else WQ.rewardLoyaltyBot(g, g.opts.wqReserve !== undefined ? g.opts.wqReserve : 3);
    if (human('patriots')) yield { type: 'human', faction: 'patriots', phase: 'support', msg: `Phase Support — Committees of Correspondence (6.4.2) : Patriotes (vous), dépensez des Ressources si vous le souhaitez et corrigez l'état.` };
    else WQ.committeesBot(g, g.opts.wqReserve !== undefined ? g.opts.wqReserve : 3);
  });
  if (finalRound) { const m = g.margins(); g.say(`FIN DE PARTIE (6.4.3 / 7.3) — marges : Britanniques ${m.british.total}, Patriotes ${m.patriots.total}, Français ${st.toa ? m.french.total : 'dernier (TOA non joué)'}, Indiens ${m.indians.total}`, 'act'); st.wqDone++; return { gameOver: true, final: true, margins: m }; }
  // 6.5 Redeploiement
  yield* g.groupGen('Phase Redéploiement (6.5)', function* () {
    WQ.leaderChange(g, nextCard);
    for (const f of ['indians', 'french', 'british', 'patriots']) {
      if (human(f)) yield { type: 'human', faction: f, phase: 'leader', msg: `Redéploiement du Leader ${FR[f]} (vous) : placez ${st.leaders[f].name} dans un espace avec vos pièces (ou Available) et corrigez l'état.` };
      else WQ.redeployLeaderBot(g, f);
    }
    WQ.britishRelease(g);
    if (st.toa && st.fni > 0) { g.say('FNI baissé d\'un niveau (6.5.4)'); g.lowerFNI(1); if (human('french')) yield { type: 'human', faction: 'french', phase: 'fni', msg: 'Les Français (vous) peuvent réarranger les Blocus restants sur les Villes (6.5.4). Corrigez l\'état si besoin.' }; }
  });
  // 6.6 Désertion
  yield* g.groupGen('Phase Désertion (6.6)', function* () {
    if (human('patriots') || human('indians')) { const km = Math.floor(g.countOnMap('patriots', 'mil') / 5), kc = Math.floor(g.countOnMap('patriots', 'cont') / 5); if (km + kc > 0) yield { type: 'human', faction: human('indians') ? 'indians' : 'patriots', phase: 'desertion', msg: `Désertion patriote (6.6.1) : retirez ${km} Milice(s) et ${kc} Continental(s) — les Indiens choisissent la première de chaque type, les Patriotes le reste. Corrigez l'état.` }; else g.say('Désertion patriote : aucune'); }
    else WQ.patriotDesertion(g);
    if (human('british') || human('french')) { const k = Math.floor(g.countOnMap('british', 'tor') / 5); if (k > 0) yield { type: 'human', faction: human('french') ? 'french' : 'british', phase: 'desertion', msg: `Désertion des Tories (6.6.2) : retirez ${k} Tory(ies) — les Français choisissent le premier, les Britanniques le reste. Corrigez l'état.` }; else g.say('Désertion des Tories : aucune'); }
    else WQ.toryDesertion(g);
  });
  // 6.7 Reset
  g.group('Phase Reset (6.7)', () => WQ.reset(g, card));
  return { gameOver: false };
};
// groupe de journal pour générateurs
LOD.Game.prototype.groupGen = function* (title, genFn) { this.say(title, 'head'); this.depth++; try { return yield* genFn(); } finally { this.depth--; } };

// ======================================================================= Déroulement d'une carte Événement (2.3)
/* Réponse attendue du joueur humain (après avoir joué sur le vrai plateau et mis à jour l'état) :
 *   { choice: 'event' | 'command' | 'commandSA' | 'limited' | 'pass', autoEvent: bool }  */
const Turn = {};
Turn.run = function* (g, card, nextCard) {
  const st = g.state; const human = f => st.players[f] === 'human';
  if (card.winter) return yield* WQ.run(g, card, nextCard);
  g.say(`CARTE #${card.id} « ${card.title} » — ordre : ${card.order.map(f => FR[f] + ({ sword: ' (sabre)', musket: ' (mousquet)', none: '' })[card.icons[f]]).join(' › ')}`, 'head');
  g.say(`Éligibles : ${FACTIONS.filter(f => st.eligible[f]).map(f => FR[f]).join(', ') || 'aucune'}`);
  st.eligOverride = {}; st.seq = {};
  const acted = {}; let bsPlayed = false;
  const mark = (f, box) => { st.seq[f] = box; g.emit({ t: 'seq', f, box }); }; // case de la Sequence of Play (2.2 Record Steps)
  const eligibleOrder = () => card.order.filter(f => st.eligible[f]);
  // ---- 2.3.9 Treaty of Alliance (Français non-joueur : dès qu'ils sont éligibles)
  if (!st.toa && st.eligible.french) {
    if (!human('french') && Bots.french.toaWanted(g)) { yield* Turn.playTOA(g); return { bs: 'toa' }; }
    if (human('french') && g.frenchPreparations() > 15) { const r = yield { type: 'human', faction: 'french', phase: 'toa', msg: `Les Français (vous) peuvent jouer la Treaty of Alliance (French Preparations = ${g.frenchPreparations()} > 15). La jouer maintenant ?`, options: ['oui', 'non'] }; if (r && r.choice === 'oui') { yield* Turn.playTOA(g); return { bs: 'toa' }; } }
  }
  // ---- 2.3.8 Brilliant Stroke (bots : 8.3.7 ; humains : question)
  const order0 = eligibleOrder(); const first = order0[0];
  for (const f of FACTIONS) {
    if (!st.eligible[f] || !st.bs[f]) continue;
    const ctx = { firstEligible: first };
    if (!human(f)) { if (Bots[f].brilliantStrokeWanted(g, ctx)) { yield* Turn.playBS(g, f); return { bs: f }; } }
  }
  for (const f of FACTIONS) {
    if (!st.eligible[f] || !st.bs[f] || !human(f) || !g.opts.askBS) continue;
    if (!st.toa && f === 'french') continue;
    const r = yield { type: 'human', faction: f, phase: 'bs', msg: `${FR[f]} (vous) : jouer votre Brilliant Stroke maintenant ? (annule la carte ; Leader requis dans un espace concerné ; toutes les factions redeviennent Eligible). Si oui, exécutez-la sur le plateau et corrigez l'état.`, options: ['non', 'oui'] };
    if (r && r.choice === 'oui') { st.bs[f] = false; for (const x of FACTIONS) st.eligible[x] = true; g.say(`${FR[f]} jouent leur Brilliant Stroke : carte annulée, toutes les factions Eligible`, 'act'); return { bs: f }; }
  }
  // ---- 1er et 2e éligibles
  let firstAction = null; let idx = 0; let slot = 1;
  while (slot <= 2) {
    const order = eligibleOrder().filter(f => !acted[f]);
    if (idx >= order.length) break;
    const f = order[idx];
    const ctx = { card, limited: false, eventAllowed: slot === 1 || firstAction === 'commandSA', firstEligible: first,
      execEvent: which => { const t = Turn.execEventBot(g, f, card, which); acted[f] = 'event'; return { action: 'event', which }; } };
    if (slot === 2) { ctx.limited = firstAction === 'command' || firstAction === 'commandSA'; }
    let result;
    if (human(f)) {
      const opts = slot === 1 ? ['event', 'commandSA', 'command', 'pass'] : firstAction === 'event' ? ['commandSA', 'command', 'pass'] : firstAction === 'commandSA' ? ['event', 'limited', 'pass'] : ['limited', 'pass'];
      if (slot === 1 && st.bs[f] && (st.toa || f !== 'french')) opts.push('bs');
      const r = yield { type: 'human', faction: f, phase: 'turn', slot, options: opts, card, msg: `${FR[f]} (vous) êtes ${slot === 1 ? '1er' : '2e'} éligible. Jouez sur le plateau, mettez l'état à jour, puis indiquez ce que vous avez fait.` };
      const choice = r && r.choice || 'pass';
      if (choice === 'pass') { Bots.pass(g, f); acted[f] = 'pass'; mark(f, 3); continue; }
      if (choice === 'bs') { st.bs[f] = false; for (const x of FACTIONS) st.eligible[x] = true; g.say(`${FR[f]} jouent leur Brilliant Stroke : carte annulée, toutes les factions Eligible (appliquée par le joueur)`, 'act'); return { bs: f }; }
      if (choice === 'event') { if (r.autoEvent) { const which = r.which || Events.whichText(card, f); Turn.execEventBot(g, f, card, which); } else g.say(`${FR[f]} exécutent l'événement (appliqué par le joueur)`, 'act'); acted[f] = 'event'; result = { action: 'event' }; }
      else { acted[f] = choice; }
      mark(f, slot === 1 ? (acted[f] === 'event' ? 8 : acted[f] === 'commandSA' ? 6 : 4) : (acted[f] === 'event' || firstAction === 'commandSA' ? 7 : firstAction === 'event' ? 9 : 5));
      if (choice !== 'event') { g.say(`${FR[f]} exécutent une ${choice === 'limited' ? 'Commande limitée' : choice === 'commandSA' ? 'Commande + Activité spéciale' : 'Commande'} (appliquée par le joueur)`, 'act'); result = { action: choice }; }
    } else {
      g.say(`${FR[f]} (${slot === 1 ? '1er' : '2e'} éligible)${ctx.limited ? ' — Commande limitée → exécutée comme Commande + Activité spéciale (8.1)' : ''}`, 'head');
      if (ctx.limited) ctx.limited = false; // 8.1 Commands Not Limited
      result = Bots[f].turn(g, ctx);
      if (result.action === 'pass') { acted[f] = 'pass'; mark(f, 3); continue; }
      acted[f] = result.action === 'event' ? 'event' : (result.sa ? 'commandSA' : 'command');
      mark(f, slot === 1 ? (acted[f] === 'event' ? 8 : acted[f] === 'commandSA' ? 6 : 4) : (acted[f] === 'event' || firstAction === 'commandSA' ? 7 : firstAction === 'event' ? 9 : 5));
    }
    if (slot === 1) firstAction = acted[f]; slot++; idx = 0;
  }
  // ---- 2.3.6 ajustement de l'éligibilité
  for (const f of FACTIONS) { st.eligible[f] = !acted[f] || acted[f] === 'pass'; }
  for (const f in st.eligOverride) { st.eligible[f] = st.eligOverride[f] === 'eligible'; }
  st.eligOverride = {}; st.seq = {};
  g.say(`Éligibilité pour la carte suivante : ${FACTIONS.filter(f => st.eligible[f]).map(f => FR[f]).join(', ') || 'aucune'}`);
  g.emit({ t: 'elig', eligible: Object.assign({}, st.eligible) });
  return { acted };
};
Turn.execEventBot = function (g, f, card, which) { const flags = Events.execute(g, f, card, which, {}); return flags; };
Turn.playTOA = function* (g) { // carte #109 : « French free Muster and place Rochambeau there. Raise FNI 1 level. Place 3 French and 3 British Regulars first from Unavailable then, if necessary, from Available in West Indies. All Factions to Eligible. »
  const st = g.state; st.toa = true; st.bs.french = true;
  g.say('TREATY OF ALLIANCE (#109) jouée par les Français : la carte Événement en cours est annulée (2.3.9)', 'act');
  g.group('Événement #109 « Treaty of Alliance »', () => {
    const saved = Object.assign({}, st.resources); for (const x of FACTIONS) st.resources[x] = 50;
    const r = Bots.french.muster(g, { limited: true, free: true, allowSA: false }, new Set(['rhc', 'march', 'battle']));
    st.resources = saved;
    const where = r && r.spaces && r.spaces[0]; if (where) g.moveLeader('french', where);
    g.raiseFNI(1);
    for (const f of ['french', 'british']) { let k = 3; const u = st.unavailable[f]; const take = Math.min(k, u.reg); u.reg -= take; st.available[f].reg += take; g.place(f, 'reg', WI, 3); }
    for (const f of FACTIONS) st.eligible[f] = true; g.say('Toutes les factions redeviennent Eligible');
  });
  if (g.state.players.french === 'human') yield { type: 'human', faction: 'french', phase: 'toa-text', msg: 'Treaty of Alliance appliquée automatiquement (Muster gratuit, Rochambeau, FNI +1, 3 Regulars français et 3 britanniques aux Antilles). Corrigez l\'état si vous choisissez un autre espace de Muster.' };
};
Turn.playBS = function* (g, f) { // 8.3.7 : deux Commandes limitées impliquant le Leader + une Activité spéciale, sans coût
  const st = g.state; const L = st.leaders[f];
  g.say(`${FR[f]} jouent leur Brilliant Stroke (8.3.7) — Leader ${L.name} en ${L.loc}`, 'act');
  const snap = g.snapshot();
  const saved = Object.assign({}, st.resources); for (const x of FACTIONS) st.resources[x] = 50;
  const results = [];
  for (let i = 0; i < 2; i++) { const ctx = { card: null, eventAllowed: false, limited: true, allowSA: i === 0, onlyDests: [L.loc].concat(g.adj(L.loc)), onlySpaces: [L.loc].concat(g.adj(L.loc)) }; results.push(g.group(`Commande limitée ${i + 1}`, () => Bots[f].command(g, ctx))); }
  st.resources = saved;
  if (results.every(r => !r || r.action === 'pass')) { g.restore(snap); g.say('Aucune Commande limitée possible avec le Leader : Brilliant Stroke annulé (8.3.7)', 'warn'); return; }
  st.bs[f] = false;
  for (const x of FACTIONS) st.eligible[x] = true;
  g.say('Toutes les factions redeviennent Eligible');
  if (false) yield null;
};

LOD.WQ = WQ; LOD.Turn = Turn;
if (typeof module !== 'undefined' && module.exports) module.exports = LOD;
})(typeof window !== 'undefined' ? window : globalThis);
