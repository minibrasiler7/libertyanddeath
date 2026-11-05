/* Liberty or Death — Événements des 96 cartes (texte transcrit depuis les images), cartes Winter Quarters (97-104)
 * et décision/évaluation pour les factions non-joueurs (8.3). */
(function (root) {
'use strict';
const LOD = typeof module !== 'undefined' && module.exports ? require('./bots.js') : root.LOD;
const { WI, CITIES, COLONIES, RESERVES, MAP_SPACES, SPACE_NAMES, FR, SIDE, FACTIONS } = LOD;
const Bots = LOD.Bots;
const LEVEL = { activeSupport: 2, passiveSupport: 1, neutral: 0, passiveOpposition: -1, activeOpposition: -2 };

// ======================================================================= aides (8.1.2, 8.3.5, 8.3.6)
function H(g, f, ctx) {
  const h = {
    g, f, ctx, flags: ctx.flags || (ctx.flags = {}),
    side: SIDE[f], friend: g.friend(f),
    enemies() { return FACTIONS.filter(x => SIDE[x] !== SIDE[f]); },
    // 8.3.5 : bénéfice → faction exécutante, puis amie, puis ennemi aléatoire (non-joueur d'abord)
    beneficiary(allowed) { const order = [f, g.friend(f)].concat(g.shuffle(h.enemies()).sort((a, b) => (g.state.players[a] === 'bot' ? 0 : 1) - (g.state.players[b] === 'bot' ? 0 : 1))); return order.find(x => !allowed || allowed.includes(x)); },
    // 8.3.5 : effet néfaste → ennemi aléatoire, joueur d'abord
    victim(allowed) { const en = g.shuffle(h.enemies()).sort((a, b) => (g.state.players[a] === 'human' ? 0 : 1) - (g.state.players[b] === 'human' ? 0 : 1)); const all = en.concat([f, g.friend(f)]); return all.find(x => !allowed || allowed.includes(x)); },
    favor() { return h.side === 'royalist' ? 1 : -1; }, // signe du (Support − Opposition) favorable
    // gain (en faveur du camp exécutant) d'un décalage de "levels" niveaux vers "target" dans n
    shiftGain(n, target, levels) { const s = g.sp(n).sup; const dir = Math.sign(target - s); if (dir === 0 || g.rawPop(n) === 0) return 0; const after = dir > 0 ? Math.min(target, s + levels) : Math.max(target, s - levels); return (after - s) * g.pop(n) * h.favor(); },
    // 8.3.6 : sélectionner jusqu'à count espaces où le décalage est favorable, par gain décroissant
    shiftSpaces(cands, count, levels, target, force) {
      const ok = cands.filter(n => (force ? h.shiftGain(n, target, levels) !== 0 : h.shiftGain(n, target, levels) > 0));
      const ranked = g.rank(ok, [n => h.shiftGain(n, target, levels)]);
      const chosen = ranked.slice(0, count); let total = 0;
      for (const n of chosen) { const s = g.sp(n).sup; const dir = Math.sign(target - s); for (let i = 0; i < levels && g.sp(n).sup !== target; i++) total += g.shift(n, dir); }
      return chosen;
    },
    shiftToward(n, target, levels) { let t = 0; for (let i = 0; i < levels; i++) { const s = g.sp(n).sup; const dir = Math.sign(target - s); if (!dir) break; t += g.shift(n, dir); } return t; },
    // retrait de pièces ennemies (8.1.2 : Forts/Villages, puis Milices/WP (Underground d'abord), puis Regulars/Continentals-Tories en alternant, le moins nombreux d'abord)
    removeEnemy(n, k, opts) { opts = opts || {}; const dest = opts.casualties ? 'casualties' : 'available'; const s = g.sp(n); let done = 0;
      const enemyRoy = h.side === 'rebellion';
      const allow = t => !opts.only || opts.only.includes(t);
      for (let i = 0; i < k; i++) {
        if (enemyRoy) {
          if (!opts.unitsOnly && !opts.fortsLast && allow('fort') && s.b.fort > 0) { g.remove('british', 'fort', n, 1, dest); done++; continue; }
          if (!opts.unitsOnly && !opts.fortsLast && allow('vil') && s.i.vil > 0) { g.remove('indians', 'vil', n, 1); done++; continue; }
          if (allow('wp') && s.i.wpU > 0) { g.remove('indians', 'wp', n, 1, 'available', 'U'); done++; continue; }
          if (allow('wp') && s.i.wpA > 0) { g.remove('indians', 'wp', n, 1, 'available', 'A'); done++; continue; }
          if ((allow('reg') && s.b.reg > 0) || (allow('tor') && s.b.tor > 0)) { const t = (allow('reg') && s.b.reg > 0 && (!allow('tor') || s.b.tor === 0 || s.b.reg <= s.b.tor)) ? 'reg' : 'tor'; g.remove('british', t, n, 1, dest); done++; continue; }
          if (!opts.unitsOnly && allow('fort') && s.b.fort > 0) { g.remove('british', 'fort', n, 1, dest); done++; continue; }
          if (!opts.unitsOnly && allow('vil') && s.i.vil > 0) { g.remove('indians', 'vil', n, 1); done++; continue; }
          break;
        } else {
          if (!opts.unitsOnly && !opts.fortsLast && allow('fort') && s.p.fort > 0) { g.remove('patriots', 'fort', n, 1, dest); done++; continue; }
          if (allow('mil') && s.p.milU > 0) { g.remove('patriots', 'mil', n, 1, 'available', 'U'); done++; continue; }
          if (allow('mil') && s.p.milA > 0) { g.remove('patriots', 'mil', n, 1, 'available', 'A'); done++; continue; }
          if ((allow('cont') && s.p.cont > 0) || (allow('freg') && s.f.reg > 0)) { if (allow('freg') && s.f.reg > 0 && (!allow('cont') || s.p.cont === 0 || s.f.reg <= s.p.cont)) g.remove('french', 'reg', n, 1, dest); else g.remove('patriots', 'cont', n, 1, dest); done++; continue; }
          if (!opts.unitsOnly && allow('fort') && s.p.fort > 0) { g.remove('patriots', 'fort', n, 1, dest); done++; continue; }
          break;
        }
      }
      return done; },
    // retrait de pièces amies d'une faction (8.1.2 : Regulars/Tories en alternant, le plus nombreux d'abord, sans retirer le dernier Tory/Continental ; Actives avant Underground ; Forts/Villages en dernier)
    removeOwn(fac, n, k, opts) { opts = opts || {}; const dest = opts.casualties ? 'casualties' : 'available'; const s = g.sp(n); let done = 0;
      const allow = t => !opts.only || opts.only.includes(t);
      for (let i = 0; i < k; i++) {
        if (fac === 'british') {
          if (allow('reg') || allow('tor')) { if (s.b.reg + s.b.tor > 0) { const t = (allow('reg') && s.b.reg > 0 && (!allow('tor') || s.b.tor === 0 || s.b.reg >= s.b.tor || s.b.tor === 1)) ? 'reg' : (allow('tor') && s.b.tor > 0 ? 'tor' : 'reg'); if (s.b[t] > 0) { g.remove('british', t, n, 1, dest); done++; continue; } } }
          if (!opts.unitsOnly && allow('fort') && s.b.fort > 0) { g.remove('british', 'fort', n, 1, dest); done++; continue; } break;
        } else if (fac === 'patriots') {
          if (allow('cont') && s.p.cont > 0 && (!allow('mil') || s.p.cont >= g.militia(n) || g.militia(n) === 1)) { g.remove('patriots', 'cont', n, 1, dest); done++; continue; }
          if (allow('mil') && s.p.milA > 0) { g.remove('patriots', 'mil', n, 1, 'available', 'A'); done++; continue; }
          if (allow('mil') && s.p.milU > 0) { g.remove('patriots', 'mil', n, 1, 'available', 'U'); done++; continue; }
          if (allow('cont') && s.p.cont > 0) { g.remove('patriots', 'cont', n, 1, dest); done++; continue; }
          if (!opts.unitsOnly && allow('fort') && s.p.fort > 0) { g.remove('patriots', 'fort', n, 1, dest); done++; continue; } break;
        } else if (fac === 'french') { if (s.f.reg > 0) { g.remove('french', 'reg', n, 1, dest); done++; continue; } break; }
        else { if (allow('wp') && s.i.wpA > 0) { g.remove('indians', 'wp', n, 1, 'available', 'A'); done++; continue; } if (allow('wp') && s.i.wpU > 0) { g.remove('indians', 'wp', n, 1, 'available', 'U'); done++; continue; } if (!opts.unitsOnly && allow('vil') && s.i.vil > 0) { g.remove('indians', 'vil', n, 1); done++; continue; } break; }
      }
      return done; },
    // choisir des espaces pour retirer le plus de pièces ennemies (8.3.5)
    spacesMostEnemy(cands, count, countFn) { return g.rank(cands.filter(n => countFn(n) > 0), [countFn]).slice(0, count); },
    // Commande gratuite exécutée par une faction selon ses priorités (8.3.5) ; les Ressources ne sont pas dépensées (5.3)
    freeCommand(fac, cmd, opts) {
      opts = opts || {}; const saved = Object.assign({}, g.state.resources);
      for (const x of FACTIONS) g.state.resources[x] = 50;
      const silentBefore = g.silent;
      const c = Object.assign({ limited: !!opts.limited, free: true, onlyDests: opts.onlyDests, onlySpaces: opts.onlySpaces, card: null, eventAllowed: false }, opts.ctx || {});
      if (g.state.players[fac] === 'human' && !g.silent) g.say(`${FR[fac]} (joueur) : ${cmd} gratuit décidé selon les priorités non-joueur — corrigez l'état si vous choisissez autrement`, 'warn');
      let r = null;
      try { r = Bots[fac][cmd](g, c, new Set(opts.tried || [])); } finally { g.state.resources = saved; g.silent = silentBefore; }
      return r;
    },
    // plusieurs Commandes gratuites limitées dans des espaces distincts ; retourne les espaces utilisés
    freeCommandsDistinct(fac, cmd, count, spaces, tried) { const used = []; let remaining = spaces.slice(); for (let i = 0; i < count && remaining.length; i++) { const r = h.freeCommand(fac, cmd, { limited: true, onlySpaces: remaining, onlyDests: remaining, tried }); const sp = r && r.spaces && r.spaces[0]; if (!sp) break; used.push(sp); remaining = remaining.filter(x => x !== sp); } return used; },
    freeBattle(fac, n, bopts) { if (g.sidePieces(h.enemySideOf(fac), n) === 0 || g.factionPieces(fac, n) === 0) { g.say(`Pas de bataille possible en ${n}`); return null; } const r = g.battle(n, fac, bopts || {}); g.applyWinTheDay(r); if (r.winTheDay && r.winner === 'rebellion') Bots.patriots.freeRallyAfterWin(g, r); return r; },
    enemySideOf(fac) { return SIDE[fac] === 'royalist' ? 'rebellion' : 'royalist'; },
    // March gratuit d'une faction vers un espace de la liste puis bataille (optionnelle) sur place
    freeMarchBattle(fac, dests, battle, bopts) {
      const r = h.freeCommand(fac, 'march', { limited: true, onlyDests: dests, tried: ['rally', 'rabble', 'muster', 'battle', 'gather', 'raid', 'scout', 'garrison'] });
      const dest = r && r.spaces && r.spaces[0]; if (dest && battle) h.freeBattle(fac, dest, bopts); return dest;
    },
    elig(fac, v) { (g.state.eligOverride = g.state.eligOverride || {})[fac] = v; h.flags.eligibility = true; g.say(`${FR[fac]} : ${v === 'ineligible' ? 'Ineligible jusqu\'à la carte suivante' : 'restent/deviennent Eligible'}`); },
    placeAny(fac, type, n, k, from) { return g.place(fac, type, n, k, { from }); },
    pick(cands) { return g.pick(cands); },
    say(m) { g.say(m); },
  };
  return h;
}

// ======================================================================= Les 96 cartes
// Chaque entrée : { u: fn(h), s: fn(h) } ; h.g = moteur, h.f = faction exécutante
const E = {};
E[1] = { // Waxhaws Massacre
  u(h) { const g = h.g; const cands = MAP_SPACES.filter(n => g.britishPieces(n) > 0 && (g.sp(n).p.cont > 0 || g.canShift(n, 1)));
    const n = g.rank(cands, [n => Math.min(2, g.sp(n).p.cont), n => h.shiftGain(n, 2, 1)])[0]; if (!n) return;
    g.remove('patriots', 'cont', n, 2, 'casualties'); g.shift(n, 1); g.placeMarker('prop', n); g.placeMarker('prop', n); },
  s(h) { const g = h.g; const n = h.freeMarchBattle('patriots', null, true); if (!n) return; g.placeMarker('prop', n); g.placeMarker('prop', n); g.shiftTowardNeutral(n, 1); },
};
E[2] = { // Common Sense
  u(h) { const g = h.g; const c = g.rank(CITIES.filter(x => !g.blockaded(x)), [x => !g.britishControl(x) ? 1 : 0, x => g.rawPop(x)])[0]; if (c) { g.place('british', 'reg', c, 2); g.place('british', 'tor', c, 2); g.placeMarker('prop', c); g.placeMarker('prop', c); } g.addRes('british', 4); },
  s(h) { const g = h.g; const ch = h.shiftSpaces(CITIES, 2, 1, -2); for (const c of ch) { g.placeMarker('prop', c); g.placeMarker('prop', c); } },
};
E[3] = { // George Rogers Clark
  u(h) { const g = h.g; for (const n of ['Northwest', 'Southwest']) { const s = g.sp(n); g.remove('patriots', 'cont', n, 99); g.remove('patriots', 'mil', n, 99); g.remove('patriots', 'fort', n, 99); } },
  s(h) { const g = h.g; for (const n of ['Northwest', 'Southwest']) { g.place('patriots', 'mil', n, 2); } for (const n of ['Northwest', 'Southwest']) { if (g.partisansOk(n)) { const s = g.sp(n); const opt = s.i.vil > 0 && g.warParties(n) === 0 && s.p.milU >= 2 ? 3 : (s.p.milU >= 2 && g.royalistUnitsCount(n) >= 2 ? 2 : 1); g.partisans(n, opt); } } },
};
E[4] = { // Penobscot
  u(h) { const g = h.g; let k = 3; const cands = g.rank(MAP_SPACES.filter(n => g.militia(n) > 0), [n => g.militia(n)]); for (const n of cands) { while (k > 0 && g.militia(n) > 0) { g.remove('patriots', 'mil', n, 1); k--; } if (k <= 0) break; } g.addRes('patriots', -2); },
  s(h) { const g = h.g; const n = 'Massachusetts'; const fac = h.beneficiary(['patriots', 'indians']); if (fac === 'indians') { g.place('indians', 'vil', n, 1); g.place('indians', 'wp', n, 3); } else { g.place('patriots', 'fort', n, 1); g.place('patriots', 'mil', n, 3); } },
};
E[5] = { u(h) { h.elig('patriots', 'ineligible'); }, s(h) { h.freeMarchBattle('patriots', null, true); } };
E[6] = { // Benedict Arnold
  u(h) { const g = h.g; const n = g.rank(COLONIES.filter(x => g.sp(x).p.fort > 0 || g.militia(x) > 0), [x => g.sp(x).p.fort, x => Math.min(2, g.militia(x))])[0]; if (!n) return; g.remove('patriots', 'fort', n, 1, 'casualties'); g.remove('patriots', 'mil', n, 2); },
  s(h) { const g = h.g; const n = g.rank(MAP_SPACES.concat([WI]).filter(x => g.sp(x).b.fort > 0 || g.britishCubes(x) > 0), [x => g.sp(x).b.fort, x => Math.min(2, g.britishCubes(x))])[0]; if (!n) return; g.remove('british', 'fort', n, 1, 'casualties'); h.removeEnemy(n, 2, { casualties: true, only: ['reg', 'tor'] }); },
};
E[7] = { // John Paul Jones
  u(h) { const g = h.g; g.addRes('british', 3); g.lowerFNI(1); const d = g.rank(CITIES.concat([WI]).filter(x => !g.blockaded(x)), [x => !g.britishControl(x) ? 1 : 0, x => g.rawPop(x)])[0]; if (d) g.place('british', 'reg', d, 2); },
  s(h) { const g = h.g; g.addRes('patriots', 5); g.raiseFNI(1); },
};
E[8] = { // Culper
  u(h) { const g = h.g; let k = 3; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).p.milU > 0), [x => g.sp(x).p.milU])) { k -= g.activateMilitia(n, Math.min(k, g.sp(n).p.milU)); if (k <= 0) break; } },
  s(h) { const g = h.g; let k = 3; for (const n of g.rank(MAP_SPACES.concat([WI]).filter(x => g.britishCubes(x) > 0), [x => g.britishCubes(x)])) { k -= h.removeEnemy(n, Math.min(k, g.britishCubes(n)), { casualties: true, only: ['reg', 'tor'] }); if (k <= 0) break; } },
};
E[9] = { // von Steuben
  u(h) { const g = h.g; const c = { battleSpaces: [], skirmishSpaces: [], free: true }; for (let i = 0; i < 3; i++) { c.saUsed = false; if (!Bots.british.skirmish(g, c)) break; } },
  s(h) { const g = h.g; const c = { battleSpaces: [], usedSpaces: [], free: true }; for (let i = 0; i < 3; i++) { c.saUsed = false; if (!Bots.patriots.skirmish(g, c)) break; } },
};
E[10] = { u(h) { h.shiftSpaces(CITIES, 2, 1, 2); }, s(h) { h.g.addRes('french', 3); h.g.addRes('patriots', 2); } };
E[11] = { // Kosciuszko
  u(h) { const g = h.g; let k = 2; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).p.fort > 0), [x => g.rawPop(x)])) { k -= g.remove('patriots', 'fort', n, Math.min(k, g.sp(n).p.fort)); if (k <= 0) break; } },
  s(h) { const g = h.g; const cands = g.rank(MAP_SPACES.filter(x => g.rebellionControl(x) && g.patriotUnits(x) > 0 && g.roomForFort(x)), [x => g.isCity(x) ? 1 : 0, x => g.rawPop(x)]).slice(0, 2); for (const n of cands) { if (g.availableOf('patriots', 'fort') === 0) break; h.removeOwn('patriots', n, 1, { unitsOnly: true }); g.place('patriots', 'fort', n, 1); } },
};
E[12] = { u(h) { LOD.WQ.patriotDesertion(h.g); }, s(h) { h.g.addRes('patriots', 5); } };
E[13] = { u(h) { LOD.WQ.patriotDesertion(h.g); }, s(h) { const g = h.g; const c = g.rank(MAP_SPACES.filter(x => g.militia(x) > 0 && g.canPlace('patriots', 'mil', x)), [x => g.control(x) !== 'rebellion' ? 1 : 0, x => g.rawPop(x)]).slice(0, 4); for (const n of c) g.place('patriots', 'mil', n, 1, { active: true }); } };
E[14] = { // Overmountain Men
  u(h) { const g = h.g; const dests = ['North Carolina', 'Southwest']; let dest = null;
    const r = h.freeCommand('indians', 'scout', { limited: true, onlyDests: dests, tried: ['raid', 'gather', 'march'] }); if (r && r.spaces && r.spaces.length) dest = r.spaces[0];
    if (!dest) { dest = h.freeMarchBattle('indians', dests, false); }
    if (!dest) return;
    if (g.warPathOk(dest)) { Bots.indians.warPath(g, { onlySpaces: [dest], free: true }); } else h.freeBattle('british', dest); },
  s(h) { h.freeMarchBattle('patriots', ['North Carolina', 'Southwest'], true); },
};
E[15] = { u(h) { const g = h.g; h.shiftToward('Virginia', 2, 2); g.place('british', 'tor', 'Virginia', 2); }, s(h) { const g = h.g; const d = h.freeMarchBattle('patriots', COLONIES, true); if (d && g.partisansOk(d)) Bots.patriots.partisans(g, { battleSpaces: [], onlySpaces: [d], free: true }); } };
E[16] = { u(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => x !== WI), [x => !g.britishControl(x) && g.royalistPieces(x) + 2 > g.rebellionPieces(x) ? 1 : 0, x => g.rawPop(x)])[0]; if (n) g.place('british', 'tor', n, 2); }, s(h) { h.shiftSpaces(CITIES, 1, 9, -1); } };
E[17] = { u(h) { const g = h.g; const n = RESERVES.find(x => g.sp(x).p.fort > 0); if (n) g.remove('patriots', 'fort', n, 1); }, s(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.sp(x).i.vil > 0), [x => g.rawPop(x), x => g.warParties(x)])[0]; if (n) g.remove('indians', 'vil', n, 1); } };
E[18] = { u(h) { const v = h.victim(); h.elig(v, 'ineligible'); } };
E[19] = { u(h) { h.g.addRes('patriots', -4); }, s(h) { const g = h.g; const c = g.rank(MAP_SPACES.filter(x => g.canPlace('patriots', 'mil', x)), [x => g.control(x) !== 'rebellion' && g.rebellionPieces(x) + 1 > g.royalistPieces(x) ? 1 : 0, x => g.rawPop(x)]); let k = 3; for (const n of c) { if (k <= 0) break; k -= g.place('patriots', 'mil', n, 1); } g.addRes('patriots', 3); } };
E[20] = { u(h) { const g = h.g; let k = 4; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).p.cont > 0), [x => g.sp(x).p.cont])) { k -= g.remove('patriots', 'cont', n, Math.min(k, g.sp(n).p.cont)); if (k <= 0) break; } }, s(h) { h.g.place('patriots', 'cont', 'New Jersey', 4); } };
E[21] = { u(h) { h.shiftSpaces(['South Carolina', 'Georgia'], 1, 2, 2); }, s(h) { h.freeMarchBattle('patriots', ['South Carolina', 'Georgia'], true); } };
E[22] = { u(h) { const g = h.g; const n = g.rank(COLONIES.filter(x => g.patriotUnits(x) > 0), [x => Math.min(4, g.patriotUnits(x))])[0]; if (!n) return; if (h.side === 'royalist') h.removeEnemy(n, 4, { unitsOnly: true, only: ['mil', 'cont'] }); else h.removeOwn('patriots', n, 4, { unitsOnly: true }); }, s(h) { LOD.WQ.toryDesertion(h.g); } };
E[23] = { // Francis Marion
  u(h) { const g = h.g; const n = g.rank(['North Carolina', 'South Carolina'].filter(x => g.patriotUnits(x) > 0), [x => g.patriotUnits(x)])[0]; if (!n) return;
    const dest = g.rank(g.adj(n).filter(a => g.isProvince(a) && !(g.isReserve(a))), [a => -(g.sp(a).sup), a => g.rebellionControl(a) ? 0 : 1])[0] || g.adj(n).find(a => g.isProvince(a)); if (!dest) return;
    g.movePiece('patriots', 'cont', n, dest, 99); g.movePiece('patriots', 'mil', n, dest, 99); g.say(`Toutes les unités patriotes de ${n} déplacées vers ${dest}`); },
  s(h) { const g = h.g; const n = g.rank(['North Carolina', 'South Carolina'].filter(x => g.militia(x) > 0 && g.britishCubes(x) + g.sp(x).b.fort > 0), [x => Math.min(4, g.britishPieces(x))])[0]; if (n) h.removeEnemy(n, 4, { only: ['reg', 'tor'], unitsOnly: true }); },
};
E[24] = { // Declaration of Independence
  u(h) { const g = h.g; let k = 2; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).p.cont > 0), [x => g.sp(x).p.cont])) { k -= g.remove('patriots', 'cont', n, Math.min(k, g.sp(n).p.cont)); if (k <= 0) break; }
    k = 2; for (const n of g.rank(MAP_SPACES.filter(x => g.militia(x) > 0), [x => g.sp(x).p.milU])) { k -= g.remove('patriots', 'mil', n, Math.min(k, g.militia(n))); if (k <= 0) break; }
    const f = g.rank(MAP_SPACES.filter(x => g.sp(x).p.fort > 0), [x => g.rawPop(x)])[0]; if (f) g.remove('patriots', 'fort', f, 1); },
  s(h) { const g = h.g; const c = g.rank(MAP_SPACES.filter(x => g.canPlace('patriots', 'mil', x)), [x => g.control(x) !== 'rebellion' && g.rebellionPieces(x) + 1 > g.royalistPieces(x) ? 1 : 0, x => g.sp(x).sup !== -2 ? 1 : 0, x => g.rawPop(x)]); let k = 3; for (const n of c) { if (k <= 0) break; if (g.place('patriots', 'mil', n, 1)) { k--; g.placeMarker('prop', n); } }
    const fc = g.rank(MAP_SPACES.filter(x => g.roomForFort(x)), [x => g.patriotUnits(x), x => g.isCity(x) ? 1 : 0, x => g.rawPop(x)])[0]; if (fc) g.place('patriots', 'fort', fc, 1); },
};
E[25] = { u(h) { h.shiftSpaces(CITIES, 2, 1, 1); }, s(h) { const g = h.g; const ch = h.shiftSpaces(CITIES, 2, 1, -1); for (const c of ch) { g.place('patriots', 'mil', c, 1); g.placeMarker('prop', c); } } };
E[26] = { u(h) { const g = h.g; const n = 'North Carolina'; if (g.availableOf('british', 'fort') > 0 && g.roomForFort(n)) g.place('british', 'fort', n, 1); else g.place('british', 'tor', n, 2); }, s(h) { h.freeMarchBattle('patriots', ['North Carolina'], true); } };
E[27] = { u(h) { const g = h.g; const c = g.rank(COLONIES.filter(x => g.britishControl(x)), [x => g.rawPop(x)]).slice(0, 2); for (const n of c) g.place('british', 'tor', n, 2, { from: 'unavailable' }); }, s(h) { const g = h.g; const ch = h.shiftSpaces(CITIES, 2, 1, -2); for (const c of ch) g.place('patriots', 'mil', c, 1); } };
E[28] = { u(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.militia(x) > 0 && !g.isReserve(x)), [x => g.militia(x)])[0]; if (!n) return; const k = g.militia(n); for (let i = 0; i < k; i++) { g.remove('patriots', 'mil', n, 1); g.place('british', 'tor', n, 2); } }, s(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.sp(x).b.tor > 0 && !g.isReserve(x)), [x => g.sp(x).b.tor])[0]; if (!n) return; const k = g.sp(n).b.tor; for (let i = 0; i < k; i++) { g.remove('british', 'tor', n, 1); g.place('patriots', 'mil', n, 2); } } };
E[29] = { u(h) { const g = h.g; const v = h.victim(['patriots', 'indians']); if (v === 'patriots') { const total = g.countOnMap('patriots', 'mil'); let need = Math.floor(total / 2) - g.countOnMap('patriots', 'mil', 'A'); for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).p.milU > 0), [x => g.sp(x).p.milU])) { if (need <= 0) break; need -= g.activateMilitia(n, Math.min(need, g.sp(n).p.milU)); } } else { const total = g.countOnMap('indians', 'wp'); let need = Math.floor(total / 2) - g.countOnMap('indians', 'wp', 'A'); for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).i.wpU > 0), [x => g.sp(x).i.wpU])) { if (need <= 0) break; need -= g.activateWP(n, Math.min(need, g.sp(n).i.wpU)); } } } };
E[30] = { u(h) { const g = h.g; const c = g.rank(MAP_SPACES.filter(x => g.britishControl(x) && g.sp(x).b.reg > 0), [x => g.rawPop(x)]).slice(0, 3); for (const n of c) g.place('british', 'reg', n, 2, { from: 'unavailable' }); g.addRes('british', 2); }, s(h) { const g = h.g; let k = Math.floor(g.countOnMap('british', 'reg') / 5); for (const n of g.rank(MAP_SPACES.concat([WI]).filter(x => g.sp(x).b.reg > 0), [x => g.sp(x).b.reg])) { if (k <= 0) break; k -= h.removeOwn('british', n, Math.min(k, g.sp(n).b.reg), { only: ['reg'] }); } } };
E[31] = { u(h) { const g = h.g; const n = g.rank(['South Carolina', 'Georgia'].filter(x => g.roomForFort(x)), [x => g.rawPop(x)])[0] || 'South Carolina'; g.place('british', 'fort', n, 1); g.place('british', 'tor', n, 2); }, s(h) { const g = h.g; const n = g.rank(['South Carolina', 'Georgia'], [x => g.royalistPieces(x), x => g.rawPop(x)])[0]; g.place('patriots', 'mil', n, 2); if (g.partisansOk(n)) { const s = g.sp(n); const opt = s.i.vil > 0 && g.warParties(n) === 0 && s.p.milU >= 2 ? 3 : (s.p.milU >= 2 && g.royalistUnitsCount(n) >= 2 ? 2 : 1); g.partisans(n, opt); } } };
E[32] = { u(h) { const g = h.g; const n = g.rank(COLONIES, [x => !g.britishControl(x) && g.royalistPieces(x) + 4 > g.rebellionPieces(x) ? 1 : 0, x => g.rawPop(x)])[0]; g.place('british', 'reg', n, 2, { from: 'unavailable' }); g.place('british', 'tor', n, 2, { from: 'unavailable' }); }, s(h) { const g = h.g; const k = Math.floor(CITIES.filter(c => g.britishControl(c)).length / 2); g.addRes(h.beneficiary(), k); } };
E[33] = { u(h) { const g = h.g; g.addRes('patriots', -3); let k = 2; for (const n of g.rank(MAP_SPACES.filter(x => g.militia(x) > 0), [x => g.sp(x).p.milU])) { k -= g.remove('patriots', 'mil', n, Math.min(k, g.militia(n))); if (k <= 0) break; } }, s(h) { const g = h.g; h.freeCommandsDistinct('patriots', 'rally', 2, g.adj('Massachusetts'), ['battle', 'rabble', 'march']); g.addRes('patriots', 3); } };
E[34] = { u(h) { h.g.addRes('british', 6); h.g.lowerFNI(1); }, s(h) { h.g.raiseFNI(1); h.elig('british', 'ineligible'); } };
E[35] = { u(h) { const g = h.g; const n = g.rank(['New York', 'New York City'].filter(x => g.patriotPieces(x) > 0), [x => Math.min(2, g.patriotPieces(x))])[0]; if (!n) return; h.removeEnemy(n, 2); g.activateMilitia(n, 99); }, s(h) { const g = h.g; const n = g.rank(['New York'].concat(g.adj('New York')).filter(x => g.sp(x).b.tor > 0), [x => g.sp(x).b.tor])[0]; if (n) g.remove('british', 'tor', n, 99); } };
E[36] = { u(h) { const g = h.g; let k = 3; for (const n of g.rank(MAP_SPACES.concat([WI]).filter(x => g.sp(x).f.reg > 0), [x => g.sp(x).f.reg])) { k -= g.remove('french', 'reg', n, Math.min(k, g.sp(n).f.reg)); if (k <= 0) break; } g.lowerFNI(1); }, s(h) { h.g.remove('british', 'reg', WI, 4); } };
E[37] = { u(h) { h.g.addRes('patriots', -2); h.g.addRes('french', -3); h.g.lowerFNI(1); }, s(h) { const g = h.g; let k = 4; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).b.reg > 0), [x => g.sp(x).b.reg])) { k -= g.remove('british', 'reg', n, Math.min(k, g.sp(n).b.reg)); if (k <= 0) break; } g.raiseFNI(1); } };
E[38] = { u(h) { const g = h.g; const n = g.rank(['Quebec', 'New York'], [x => !g.britishControl(x) ? 1 : 0, x => g.rawPop(x)])[0]; let k = 4; k -= g.place('british', 'reg', n, Math.min(k, 2), { from: 'unavailable' }); k -= g.place('british', 'tor', n, k, { from: 'unavailable' }); if (k > 0) g.place('british', 'reg', n, k, { from: 'unavailable' }); h.elig('british', 'eligible'); }, s(h) { const g = h.g; const fac = h.beneficiary(['patriots', 'indians']); if (fac === 'indians') g.place('indians', 'wp', 'New York', 3); else g.place('patriots', 'mil', 'New York', 3); } };
E[39] = { u(h) { const g = h.g; const cands = CITIES.filter(c => g.sp(c).sup !== 0); const favorable = cands.filter(c => (g.sp(c).sup < 0 ? 1 : -1) * h.favor() > 0); const ch = g.rank(favorable, [c => g.rawPop(c)]).slice(0, 3); for (const c of ch) g.shiftTowardNeutral(c, 1); } };
E[40] = { u(h) { h.g.setFNI(0); h.g.addRes('british', 2); }, s(h) { h.g.setFNI(3); } };
E[41] = { u(h) { h.shiftSpaces(COLONIES, 2, 2, 1); }, s(h) { h.shiftSpaces(COLONIES, 2, 2, -1); } };
E[42] = { u(h) { h.g.addRes('patriots', -3); h.g.place('british', 'tor', 'Connecticut-Rhode Island', 1); }, s(h) { h.g.place('patriots', 'mil', 'Connecticut-Rhode Island', 3); h.g.place('patriots', 'cont', 'Connecticut-Rhode Island', 1); } };
E[43] = { u(h) { const g = h.g; const c = g.rank(MAP_SPACES.concat([WI]).filter(x => g.sp(x).b.reg > 0 && x !== WI), [x => g.sp(x).sup === -2 && g.sp(x).b.tor === 0 ? 1 : 0, x => !g.britishControl(x) ? 1 : 0, x => g.rawPop(x)]).slice(0, 3); for (const n of c) g.place('british', 'tor', n, 2, { from: 'unavailable' }); }, s(h) { const g = h.g; let k = Math.floor(g.countOnMap('british', 'tor') / 3); for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).b.tor > 0), [x => g.sp(x).b.tor])) { if (k <= 0) break; k -= h.removeOwn('british', n, Math.min(k, g.sp(n).b.tor), { only: ['tor'] }); } } };
E[44] = { u(h) { h.elig(h.victim(), 'ineligible'); } };
E[45] = { u(h) { h.g.addRes('british', 6); }, s(h) { h.g.addRes('british', -4); } };
E[46] = { u(h) { const g = h.g; const c = g.rank(MAP_SPACES, [x => !g.britishControl(x) && g.royalistPieces(x) + 1 > g.rebellionPieces(x) && g.britishPieces(x) + 1 > 0 ? 1 : 0, x => g.sp(x).b.reg > 0 && g.sp(x).b.tor === 0 ? 1 : 0, x => g.rawPop(x)]).slice(0, 3); for (const n of c) g.place('british', 'tor', n, 1, { from: 'unavailable' }); }, s(h) { h.shiftSpaces(CITIES, 2, 1, -1); } };
E[47] = { u(h) { const g = h.g; const n = g.rank(COLONIES.filter(x => g.britishControl(x)), [x => g.rawPop(x)])[0]; if (n) g.place('british', 'tor', n, 3); }, s(h) { const g = h.g; const n = g.rank(COLONIES.filter(x => g.sp(x).b.tor > 0), [x => g.sp(x).b.tor])[0]; if (!n) return; const k = g.sp(n).b.tor; g.remove('british', 'tor', n, k); g.place('patriots', 'mil', n, k); g.placeMarker('prop', n); g.placeMarker('prop', n); } };
E[48] = { u(h) { h.freeMarchBattle('british', null, true); }, s(h) { const g = h.g; const fac = h.beneficiary(['patriots', 'french', 'indians']); const srcs = g.rank(MAP_SPACES.filter(x => g.sp(x).b.reg > 0 && g.factionPieces(fac, x) > 0), [x => g.factionPieces(fac, x)]).slice(0, 3); for (const n of srcs) { const dest = g.rank(g.adj(n).filter(a => fac === 'indians' ? g.isProvince(a) : true), [a => g.sidePieces(SIDE[fac], a) - g.sidePieces(h.enemySideOf(fac), a)])[0]; if (!dest) continue; if (fac === 'patriots') { g.movePiece('patriots', 'cont', n, dest, 99); g.movePiece('patriots', 'mil', n, dest, 99); } else if (fac === 'french') g.movePiece('french', 'reg', n, dest, 99); else g.movePiece('indians', 'wp', n, dest, 99); } } };
E[49] = { u(h) { const g = h.g; const k = Math.min(5, g.state.available.french.reg); g.state.available.french.reg -= k; g.state.unavailable.french.reg += k; g.say(`${k} Regulars français Available → Unavailable`); }, s(h) { const g = h.g; const k = Math.min(5, g.state.unavailable.french.reg); g.state.unavailable.french.reg -= k; g.state.available.french.reg += k; g.say(`${k} Regulars français Unavailable → Available`); } };
E[50] = { u(h) { const g = h.g; h.elig('french', 'ineligible'); let k = 2; for (const n of [WI].concat(g.rank(MAP_SPACES.filter(x => g.sp(x).f.reg > 0), [x => g.sp(x).f.reg]))) { if (k <= 0) break; k -= g.remove('french', 'reg', n, Math.min(k, g.sp(n).f.reg)); } }, s(h) { const g = h.g; if (!g.state.toa) { g.say('Treaty of Alliance non joué : pas de pièces françaises sur la carte'); const n = g.rank(COLONIES, [x => g.patriotPieces(x), x => g.rawPop(x)])[0]; g.place('patriots', 'cont', n, 2); return; } const n = g.rank(COLONIES, [x => g.rebellionControl(x) ? 1 : 0, x => g.sp(x).p.cont, x => g.rawPop(x)])[0]; g.place('patriots', 'cont', n, 2); let k = 2; k -= g.place('french', 'reg', n, 2); if (k > 0) g.movePiece('french', 'reg', WI, n, k); } };
E[51] = { u(h) { h.freeMarchBattle('british', null, true, { attLossMod: -2 }); }, s(h) { h.freeMarchBattle('patriots', null, true, { defLossMod: 2 }); } };
E[52] = { u(h) { const g = h.g; let k = h.side === 'royalist' ? 4 : 0; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).f.reg > 0), [x => g.sp(x).f.reg])) { if (k <= 0) break; k -= g.remove('french', 'reg', n, Math.min(k, g.sp(n).f.reg)); } const cands = SPACE_NAMES.filter(n => g.factionPieces(h.f, n) > 0 && g.sidePieces(h.enemySideOf(h.f), n) > 0 && h.f !== 'indians'); if (!cands.length) return; const best = g.rank(cands, [n => { const e = g.battleEstimate(n, h.f, { forceBonus: 2 }); return e.att - e.def; }])[0]; h.freeBattle(h.f, best, { forceBonus: 2 }); } };
E[53] = { u(h) { h.g.addRes('british', 3); h.g.lowerFNI(2); }, s(h) { h.g.addRes('british', -2); h.g.addRes('patriots', 2); h.g.raiseFNI(1); } };
E[54] = { u(h) { const g = h.g; if (g.state.wiSquadrons > 0) { g.state.wiSquadrons--; g.state.unavailable.french.sq++; g.say('1 Squadron Antilles → Unavailable'); } }, s(h) { const g = h.g; const k = Math.min(2, g.state.unavailable.french.sq); g.state.unavailable.french.sq -= k; g.state.wiSquadrons += k; g.say(`${k} Squadron(s) Unavailable → Antilles`); } };
E[55] = { u(h) { const g = h.g; let k = 3; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).f.reg > 0), [x => g.sp(x).f.reg])) { if (k <= 0) break; k -= g.movePiece('french', 'reg', n, WI, Math.min(k, g.sp(n).f.reg)); } if (g.sp(WI).f.reg > 0 && g.britishPieces(WI) > 0) h.freeBattle('french', WI); g.lowerFNI(1); }, s(h) { const g = h.g; let k = 4; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).b.reg > 0), [x => g.sp(x).b.reg])) { if (k <= 0) break; k -= g.movePiece('british', 'reg', n, WI, Math.min(k, g.sp(n).b.reg)); } if (g.sp(WI).b.reg > 0 && g.frenchPieces(WI) > 0) h.freeBattle('british', WI); } };
E[56] = { u(h) { h.g.addRes('patriots', -3); }, s(h) { h.g.addRes('patriots', 3); } };
E[57] = { u(h) { const g = h.g; if (g.state.toa) { const k = Math.min(2, g.availableOf('french', 'reg')); g.state.available.french.reg -= k; g.sp(WI).f.reg += k; g.say(`${k} Regulars français Available → Antilles`); } h.elig('french', 'ineligible'); g.lowerFNI(1); }, s(h) { const g = h.g; let k = 2; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).b.reg > 0), [x => g.sp(x).b.reg])) { if (k <= 0) break; k -= g.movePiece('british', 'reg', n, WI, Math.min(k, g.sp(n).b.reg)); } h.elig('british', 'ineligible'); } };
E[58] = { u(h) { h.g.addRes('patriots', -4); }, s(h) { const g = h.g; for (const n of ['New York', 'Quebec', 'Northwest']) { const k = g.sp(n).b.tor; for (let i = 0; i < k; i++) { g.remove('british', 'tor', n, 1); g.place('patriots', 'mil', n, 1); } } } };
E[59] = { u(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.sp(x).p.cont > 0 || g.sp(x).f.reg > 0), [x => Math.min(2, g.sp(x).p.cont) + Math.min(2, g.sp(x).f.reg)])[0]; if (!n) return; g.remove('patriots', 'cont', n, 2); g.remove('french', 'reg', n, 2); }, s(h) { h.g.addRes('patriots', 3); } };
E[60] = { u(h) { h.g.lowerFNI(2); h.g.addRes('french', -4); }, s(h) { h.g.raiseFNI(1); h.g.addRes('british', -3); } };
E[61] = { u(h) { h.elig('patriots', 'ineligible'); }, s(h) { h.g.addRes('patriots', 3); h.g.addRes('french', 2); } };
E[62] = { u(h) { const g = h.g; const fac = h.beneficiary(['british', 'indians']); const n = g.rank(['New York', 'Quebec', 'Northwest'], [x => !g.britishControl(x) ? 1 : 0, x => fac === 'indians' ? g.sp(x).i.vil : g.rawPop(x)])[0]; if (fac === 'indians') g.place('indians', 'wp', n, 3); else g.place('british', 'tor', n, 3); }, s(h) { const g = h.g; if (g.state.toa && g.availableOf('french', 'reg') > 0 && (h.f === 'french' || g.availableOf('patriots', 'mil') === 0)) g.place('french', 'reg', 'Quebec', 3); else g.place('patriots', 'mil', 'Northwest', 3); } };
E[63] = { u(h) { h.g.addRes('british', 1); h.g.lowerFNI(1); h.g.remove('british', 'reg', WI, 2); }, s(h) { h.g.addRes('british', -5); } };
E[64] = { u(h) { h.g.addRes('british', 3); h.g.lowerFNI(1); }, s(h) { h.g.addRes('patriots', 5); } };
E[65] = { u(h) { h.g.addRes('french', -4); }, s(h) { h.g.addRes('french', 3); } };
E[66] = { u(h) { const g = h.g; const n = g.rank(['Florida', 'Southwest'], [x => g.rebellionPieces(x), x => !g.britishControl(x) ? 1 : 0])[0]; let k = 6; const r = Math.min(k, g.availableOf('british', 'reg')); k -= g.place('british', 'reg', n, r); g.place('british', 'tor', n, k); }, s(h) { const fac = h.beneficiary(['french', 'patriots']); h.freeMarchBattle(fac, ['Florida'], true, { forceBonus: 2 }); } };
E[67] = { u(h) { h.g.lowerFNI(1); h.g.remove('french', 'reg', WI, 3); }, s(h) { const g = h.g; let fac = h.beneficiary(['french', 'patriots']); if (fac === 'french' && !g.state.toa) fac = 'patriots'; if (fac === 'french') h.freeCommand('french', 'muster', { limited: true, tried: ['rhc', 'march', 'battle'] }); else h.freeCommand('patriots', 'rally', { limited: true, tried: ['battle', 'rabble', 'march'] }); h.elig(fac, 'eligible'); } };
E[68] = { u(h) { const g = h.g; const f = h.f; if (f === 'indians') { g.say('Les Indiens n\'ont pas de cubes ni de Fort : sans effet'); return; } let k = 6; const type = f === 'british' ? ['reg', 'tor'] : f === 'patriots' ? ['cont'] : ['reg'];
  for (const n of g.rank(MAP_SPACES.filter(x => x !== 'Quebec'), [x => g.isAdj(x, 'Quebec') ? 1 : 0, x => g.factionPieces(f, x)])) { if (k <= 0) break; for (const t of type) { if (k <= 0) break; k -= g.movePiece(f, t, n, 'Quebec', k); } }
  if (f !== 'french') g.place(f, 'fort', 'Quebec', 1); else g.place('patriots', 'fort', 'Quebec', 1); } };
E[69] = { u(h) { h.g.lowerFNI(2); h.g.addRes('british', 2); }, s(h) { h.g.raiseFNI(1); h.g.addRes('french', 3); } };
E[70] = { u(h) { const g = h.g; const victimFac = h.side === 'royalist' ? 'french' : 'british'; let k = 3; for (const n of g.rank(MAP_SPACES.concat([WI]).filter(x => victimFac === 'french' ? g.sp(x).f.reg > 0 : g.sp(x).b.reg > 0), [x => victimFac === 'french' ? g.sp(x).f.reg : g.sp(x).b.reg])) { if (k <= 0) break; k -= g.remove(victimFac, 'reg', n, Math.min(k, victimFac === 'french' ? g.sp(n).f.reg : g.sp(n).b.reg)); } } };
E[71] = { u(h) { const g = h.g; const k = CITIES.filter(c => g.rebellionControl(c)).reduce((a, c) => a + g.rawPop(c), 0); g.addRes('patriots', k); }, s(h) { h.g.addRes('french', 5); } };
E[72] = { u(h) { const g = h.g; const f = h.f; const n = g.rank(RESERVES.filter(x => g.roomForFort(x) || true), [x => g.roomForFort(x) ? 1 : 0, x => g.factionPieces(f, x)])[0];
  if (f === 'indians') { g.place('indians', 'vil', n, 1); g.place('indians', 'wp', n, 3); } else if (f === 'british') { g.place('british', 'fort', n, 1); let k = 3; k -= g.place('british', 'reg', n, k); g.place('british', 'tor', n, k); } else if (f === 'patriots') { g.place('patriots', 'fort', n, 1); g.place('patriots', 'cont', n, 3); } else { g.place('patriots', 'fort', n, 1); if (g.state.toa) g.place('french', 'reg', n, 3); else g.place('patriots', 'cont', n, 3); } } };
E[73] = { u(h) { const g = h.g; const sp = ['New York', 'Northwest', 'Quebec']; const enemyRoy = h.side === 'rebellion'; const cands = sp.filter(n => enemyRoy ? (g.sp(n).b.fort > 0 || g.sp(n).i.vil > 0) : g.sp(n).p.fort > 0); const n = g.rank(cands, [x => g.rawPop(x)])[0]; if (!n) return; if (enemyRoy) { if (g.sp(n).i.vil > 0) g.remove('indians', 'vil', n, 1); else g.remove('british', 'fort', n, 1); } else g.remove('patriots', 'fort', n, 1); } };
E[74] = { u(h) { const g = h.g; const fac = h.beneficiary(['indians', 'british']); g.addRes(fac, Math.floor(g.villages() / 2)); }, s(h) { const g = h.g; const cands = g.rank(MAP_SPACES.filter(n => g.warParties(n) > 0 && g.militia(n) > 0), [n => g.warParties(n) + g.militia(n)]).slice(0, 2); for (const n of cands) { if (h.side === 'rebellion') { g.remove('indians', 'wp', n, 2); g.remove('patriots', 'mil', n, 1); } else { g.remove('patriots', 'mil', n, 2); g.remove('indians', 'wp', n, 1); } } } };
E[75] = { u(h) { const g = h.g; h.flags.freeGather = true; const used = h.freeCommandsDistinct('indians', 'gather', 3, RESERVES, ['raid', 'march', 'scout']); if (used.length) Bots.indians.warPath(g, { onlySpaces: used, free: true }); }, s(h) { const g = h.g; const n = 'Northwest'; let k = 3; k -= g.remove('indians', 'wp', n, Math.min(k, g.warParties(n))); if (k > 0) g.remove('indians', 'vil', n, k); } };
E[76] = { u(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.isProvince(x) && g.militia(x) > 0), [x => Math.min(3, g.militia(x))])[0]; if (!n) return; const k = Math.min(3, g.militia(n)); for (let i = 0; i < k; i++) { g.remove('patriots', 'mil', n, 1); g.place('british', 'tor', n, 1); } }, s(h) { const g = h.g; let k = 2; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).i.vil > 0), [x => g.rawPop(x)])) { if (k <= 0) break; k -= g.remove('indians', 'vil', n, Math.min(k, g.sp(n).i.vil)); } } };
E[77] = { u(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.britishPieces(x) > 0 && g.indianPieces(x) > 0 && g.roomForFort(x) && !g.isCity(x)), [x => g.warParties(x)])[0]; if (n) g.place('indians', 'vil', n, 1); for (const x of MAP_SPACES) g.undergroundWP(x); }, s(h) { const g = h.g; const cands = g.rank(MAP_SPACES.filter(x => g.isProvince(x) && g.indianPieces(x) > 0 && g.britishPieces(x) > 0), [x => g.rawPop(x)]).slice(0, 3); for (const n of cands) { h.removeEnemy(n, 1, { only: ['reg', 'tor', 'fort'], fortsLast: true }); g.placeMarker('raid', n); } } };
E[78] = { u(h) { const g = h.g; let k = Math.floor((g.countOnMap('patriots', 'cont') + g.countOnMap('patriots', 'mil')) / 4); for (const n of g.rank(MAP_SPACES.filter(x => g.patriotUnits(x) > 0), [x => g.patriotUnits(x)])) { if (k <= 0) break; k -= (h.side === 'royalist' ? h.removeEnemy(n, Math.min(k, g.patriotUnits(n)), { unitsOnly: true, only: ['mil', 'cont'] }) : h.removeOwn('patriots', n, Math.min(k, g.patriotUnits(n)), { unitsOnly: true })); } }, s(h) { const g = h.g; const c = g.rank(MAP_SPACES.filter(x => (g.sp(x).b.tor > 0 || g.indianPieces(x) > 0) && g.canPlace('patriots', 'mil', x)), [x => g.control(x) !== 'rebellion' && g.rebellionPieces(x) + 1 > g.royalistPieces(x) ? 1 : 0, x => g.rawPop(x)]).slice(0, 4); for (const n of c) g.place('patriots', 'mil', n, 1); } };
E[79] = { u(h) { const g = h.g; const n = g.rank(COLONIES.filter(x => g.roomForFort(x)), [x => g.warParties(x), x => g.rawPop(x)])[0]; if (!n) return; g.place('indians', 'vil', n, 1); g.place('indians', 'wp', n, 2); }, s(h) { const g = h.g; const n = g.rank(COLONIES.filter(x => g.sp(x).i.vil > 0 || g.warParties(x) > 0), [x => g.sp(x).i.vil, x => Math.min(2, g.warParties(x))])[0]; if (!n) return; g.remove('indians', 'vil', n, 1); g.remove('indians', 'wp', n, 2); } };
E[80] = { u(h) { const g = h.g; const v = h.victim(); const cands = g.rank(SPACE_NAMES.filter(x => g.factionPieces(v, x) > 0), [x => Math.min(2, g.factionPieces(v, x))]).slice(0, 2); for (const n of cands) h.removeOwn(v, n, 2); } };
E[81] = { u(h) { const g = h.g; const n = g.rank(['South Carolina', 'Georgia'].filter(x => g.roomForFort(x)), [x => g.warParties(x), x => g.sp(x).sup < 0 ? 1 : 0])[0] || 'South Carolina'; g.place('indians', 'wp', n, 2); g.placeMarker('raid', n); g.place('indians', 'vil', n, 1); }, s(h) { const g = h.g; let k = 2; for (const n of g.rank(['South Carolina', 'Georgia'].filter(x => g.warParties(x) > 0), [x => g.warParties(x)])) { if (k <= 0) break; k -= g.remove('indians', 'wp', n, Math.min(k, g.warParties(n))); } } };
E[82] = { u(h) { const g = h.g; for (const n of ['Virginia', 'Georgia', 'North Carolina', 'South Carolina']) { g.place('indians', 'wp', n, 1); g.placeMarker('raid', n); } }, s(h) { const g = h.g; let k = 3; const sp = ['Virginia', 'Georgia', 'North Carolina', 'South Carolina']; for (const n of g.rank(sp.filter(x => g.warParties(x) > 0), [x => g.warParties(x)])) { if (k <= 0) break; k -= g.remove('indians', 'wp', n, Math.min(k, g.warParties(n))); } for (const n of g.rank(sp.filter(x => g.sp(x).i.vil > 0), [x => g.rawPop(x)])) { if (k <= 0) break; k -= g.remove('indians', 'vil', n, Math.min(k, g.sp(n).i.vil)); } } };
E[83] = { u(h) { const g = h.g; g.setLevel('Quebec City', 2); g.place('indians', 'wp', 'Quebec', 2); }, s(h) { const g = h.g; const f = h.f; const n = f === 'indians' ? 'Quebec' : g.rank(['Quebec', 'Quebec City'], [x => !g.control(x) || g.control(x) !== (SIDE[f] === 'royalist' ? 'british' : 'rebellion') ? 1 : 0, x => g.rawPop(x)])[0]; let k = 3;
  if (f === 'patriots') { if (g.roomForFort(n) && g.place('patriots', 'fort', n, 1)) k--; k -= g.place('patriots', 'cont', n, k); g.place('patriots', 'mil', n, k); }
  else if (f === 'british') { if (g.roomForFort(n) && g.place('british', 'fort', n, 1)) k--; k -= g.place('british', 'reg', n, k); g.place('british', 'tor', n, k); }
  else if (f === 'french') { if (g.state.toa) g.place('french', 'reg', n, 3); else { g.place('patriots', 'mil', n, 3); } }
  else { if (g.roomForFort(n) && g.place('indians', 'vil', n, 1)) k--; g.place('indians', 'wp', n, k); } } };
E[84] = { u(h) { h.flags.freeGather = true; h.freeCommandsDistinct('indians', 'gather', 2, COLONIES, ['raid', 'march', 'scout']); }, s(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.sp(x).i.vil > 0), [x => g.rawPop(x), x => g.patriotPieces(x)])[0]; if (n) g.remove('indians', 'vil', n, 1); } };
E[85] = { u(h) { const g = h.g; let k = 3; k -= g.place('british', 'reg', 'Southwest', Math.min(k, g.availableOf('british', 'reg'))); g.place('british', 'tor', 'Southwest', k); }, s(h) { const g = h.g; let k = 2; k -= g.place('patriots', 'mil', 'Southwest', k); if (k > 0) g.place('patriots', 'cont', 'Southwest', k); if (g.state.toa) g.place('french', 'reg', 'Southwest', 2); } };
E[86] = { u(h) { const g = h.g; const cands = ['Massachusetts'].concat(MAP_SPACES.filter(x => g.indianPieces(x) > 0)); const n = g.rank(cands.filter(x => g.sp(x).p.milU > 0), [x => g.sp(x).p.milU])[0]; if (n) g.activateMilitia(n, 99); }, s(h) { const g = h.g; const cands = ['Massachusetts'].concat(MAP_SPACES.filter(x => g.indianPieces(x) > 0 && g.canPlace('patriots', 'mil', x))); const n = g.rank(cands, [x => g.control(x) !== 'rebellion' && g.rebellionPieces(x) + 3 > g.royalistPieces(x) ? 1 : 0, x => g.rawPop(x)])[0]; g.place('patriots', 'mil', n, 3); } };
E[87] = { u(h) { const g = h.g; const n = 'Pennsylvania'; if (g.sidePieces(h.enemySideOf(h.f), n) > 0) h.removeEnemy(n, 1); else if (g.factionPieces(h.friend, n) > 0) h.removeOwn(h.friend, n, 1); else if (g.factionPieces(h.f, n) > 0) h.removeOwn(h.f, n, 1); h.elig(h.f, 'eligible'); } };
E[88] = { u(h) { const g = h.g; const f = h.f; const target = h.victim(); for (const n of MAP_SPACES.filter(x => g.factionPieces(f, x) > 0 && g.factionPieces(target, x) > 0)) { const dest = g.rank(g.adj(n).filter(a => f === 'indians' ? g.isProvince(a) : true), [a => g.sidePieces(SIDE[f], a) - g.sidePieces(h.enemySideOf(f), a)])[0]; if (!dest) continue; if (f === 'british') { g.movePiece('british', 'reg', n, dest, 99); g.movePiece('british', 'tor', n, dest, 99); } else if (f === 'patriots') { g.movePiece('patriots', 'cont', n, dest, 99); g.movePiece('patriots', 'mil', n, dest, 99); } else if (f === 'french') g.movePiece('french', 'reg', n, dest, 99); else g.movePiece('indians', 'wp', n, dest, 99); } } };
E[89] = { u(h) { const g = h.g; let k = 4; for (const n of g.rank(MAP_SPACES.filter(x => g.patriotUnits(x) > 0 && !g.isReserve(x)), [x => g.patriotUnits(x)])) { while (k > 0 && g.patriotUnits(n) > 0) { if (g.sp(n).p.milU > 0) g.remove('patriots', 'mil', n, 1, 'available', 'U'); else if (g.sp(n).p.milA > 0) g.remove('patriots', 'mil', n, 1, 'available', 'A'); else g.remove('patriots', 'cont', n, 1); g.place('british', 'tor', n, 1); k--; } if (k <= 0) break; } }, s(h) { const g = h.g; let k = 3; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).b.tor > 0 && !g.isReserve(x)), [x => g.sp(x).b.tor])) { while (k > 0 && g.sp(n).b.tor > 0) { g.remove('british', 'tor', n, 1); g.place('patriots', 'mil', n, 1); k--; } if (k <= 0) break; } } };
E[90] = { u(h) { const g = h.g; const f = h.f === 'french' ? 'patriots' : h.f; const type = f === 'indians' ? 'vil' : 'fort'; const cands = MAP_SPACES.filter(x => g.canPlace(f, type, x) && g.factionPieces(f, x) + (h.f === 'french' ? g.frenchPieces(x) : 0) > 0); const n = g.rank(cands, [x => f === 'indians' ? g.warParties(x) : g.factionPieces(f, x), x => g.rawPop(x)])[0]; if (n) g.place(f, type, n, 1); }, s(h) { const g = h.g; let k = 2; for (const n of g.rank(MAP_SPACES.filter(x => g.sp(x).b.reg > 0), [x => g.sp(x).b.reg])) { if (k <= 0) break; k -= g.remove('british', 'reg', n, Math.min(k, g.sp(n).b.reg), 'casualties'); } } };
E[91] = { u(h) { const g = h.g; const n = g.rank(RESERVES.filter(x => g.roomForFort(x)), [x => g.warParties(x)])[0]; if (!n) return; g.place('indians', 'vil', n, 1); g.place('indians', 'wp', n, 2); }, s(h) { const g = h.g; const n = g.rank(RESERVES.filter(x => g.sp(x).i.vil > 0), [x => g.sp(x).i.vil])[0]; if (n) g.remove('indians', 'vil', n, 1); } };
E[92] = { u(h) { const g = h.g; const f = h.f; if (f === 'french') { g.say('Les Français n\'ont pas de Fort : sans effet'); return; } const type = f === 'indians' ? 'vil' : 'fort'; const has = x => f === 'indians' ? g.sp(x).i.vil === 1 : (f === 'british' ? g.sp(x).b.fort === 1 : g.sp(x).p.fort === 1); const n = g.rank(MAP_SPACES.filter(x => has(x) && g.roomForFort(x)), [x => g.rawPop(x)])[0]; if (n) g.place(f, type, n, 1); } };
E[93] = { u(h) { const g = h.g; const cands = COLONIES.filter(c => g.adj(c).some(a => g.isReserve(a)) && g.sp(c).sup !== 0 && (g.sp(c).sup < 0 ? 1 : -1) * h.favor() > 0); const ch = g.rank(cands, [c => g.rawPop(c)]).slice(0, 3); for (const c of ch) { g.shiftTowardNeutral(c, 1); g.placeMarker('raid', c); } }, s(h) { const g = h.g; let k = 4; for (const n of g.rank(['Pennsylvania'].concat(g.adj('Pennsylvania')).filter(x => g.warParties(x) > 0), [x => g.warParties(x)])) { if (k <= 0) break; k -= g.remove('indians', 'wp', n, Math.min(k, g.warParties(n))); } } };
E[94] = { u(h) { const g = h.g; h.flags.freeGather = true; h.freeCommand('indians', 'gather', { limited: true, onlySpaces: ['New York'], tried: ['raid', 'march', 'scout'] }); if (g.britMusterTorySpace('New York')) g.britPlaceTories('New York'); g.remove('patriots', 'mil', 'New York', 99); }, s(h) { const g = h.g; g.remove('indians', 'wp', 'New York', 99); g.remove('indians', 'vil', 'New York', 99); } };
E[95] = { u(h) { const g = h.g; const n = 'Northwest'; const f = h.f; if (h.side === 'royalist') g.remove('patriots', 'fort', n, 1); else { if (g.sp(n).i.vil > 0) g.remove('indians', 'vil', n, 1); else g.remove('british', 'fort', n, 1); }
  let k = 3; if (f === 'british') { k -= g.place('british', 'reg', n, k); g.place('british', 'tor', n, k); } else if (f === 'patriots') g.place('patriots', 'cont', n, 3); else if (f === 'french') { if (g.state.toa) g.place('french', 'reg', n, 3); } else g.place('indians', 'wp', n, 3); } };
E[96] = { u(h) { const g = h.g; h.flags.freeGather = true; const used = h.freeCommandsDistinct('indians', 'gather', 2, RESERVES, ['raid', 'march', 'scout']); const c = { onlySpaces: used, free: true, usedSpaces: [] }; for (let i = 0; i < used.length; i++) { c.saUsed = false; if (!Bots.indians.warPath(g, c)) break; } }, s(h) { const g = h.g; const n = g.rank(MAP_SPACES.filter(x => g.sp(x).i.vil > 0), [x => g.rawPop(x)])[0]; if (n) g.remove('indians', 'vil', n, 1); } };

// ======================================================================= Cartes Winter Quarters (97-104) : effet en fin de phase Reset
const WQEVENT = {
  97(g) { if (g.state.crc > g.state.cbc) g.addRes('french', 5); else g.addRes('british', 5); },
  98(g) { if (g.state.crc > g.state.cbc) g.addRes('british', -3); else g.addRes('french', -3); },
  99(g) { const st = g.state; const d = Math.floor(Math.abs(st.crc - st.cbc) / 2); if (st.crc > st.cbc) st.crc -= d; else if (st.cbc > st.crc) st.cbc -= d; g.say(`CRC ${st.crc} / CBC ${st.cbc}`); },
  100(g) { WQEVENT[99](g); },
  101(g) { const m = g.margins(); const f = m.patriots.c2 > m.indians.c2 ? 'patriots' : m.indians.c2 > m.patriots.c2 ? 'indians' : null; if (f) g.addRes(f, -2); else g.say('Égalité sur la 2e condition de victoire : sans effet'); },
  102(g) { const m = g.margins(); const f = m.patriots.c2 > m.indians.c2 ? 'patriots' : m.indians.c2 > m.patriots.c2 ? 'indians' : null; if (!f) { g.say('Égalité : sans effet'); return; } const type = f === 'patriots' ? 'fort' : 'vil'; const n = g.rank(MAP_SPACES.filter(x => f === 'patriots' ? g.sp(x).p.fort > 0 : g.sp(x).i.vil > 0), [x => -g.rawPop(x), x => -(f === 'patriots' ? g.patriotUnits(x) : g.warParties(x))])[0]; if (n) g.remove(f, type, n, 1); },
  103(g) { WQEVENT[102](g); },
  104(g) { WQEVENT[101](g); },
};

// ======================================================================= Évaluation (8.3.3, conditions 8.4-8.7) par simulation
function whichText(card, f) { if (!card.shaded) return 'unshaded'; return SIDE[f] === 'rebellion' ? 'shaded' : 'unshaded'; }
function snapshotMetrics(g) {
  const st = g.state; const m = { so: g.totalSupport() - g.totalOpposition(), res: Object.assign({}, st.resources), cbc: st.cbc, crc: st.crc, fni: st.fni,
    unav: { british: st.unavailable.british.reg + st.unavailable.british.tor, french: st.unavailable.french.reg + st.unavailable.french.sq },
    onMap: {}, spaces: JSON.stringify(st.spaces), pf: g.forts('patriots'), bf: g.forts('british'), vil: g.villages(), frenchOnMap: g.countOnMap('french', 'reg') };
  for (const f of FACTIONS) m.onMap[f] = g.factionPiecesOnMap(f);
  return m;
}
function evaluate(g, f, card, which, ctx) {
  const sim = g.clone(); sim.silent = true; sim.state.players = Object.assign({}, g.state.players);
  const before = snapshotMetrics(sim); const beforeSpaces = JSON.parse(JSON.stringify(sim.state.spaces));
  const flags = {};
  try { execute(sim, f, card, which, { flags, silentSim: true }); } catch (e) { return { effective: false, error: e.message, flags, soDelta: 0, resDelta: {}, fromUnavailable: {} }; }
  const after = snapshotMetrics(sim);
  const favor = SIDE[f] === 'royalist' ? 1 : -1;
  const soDelta = after.so - before.so;
  const resDelta = {}; for (const x of FACTIONS) resDelta[x] = after.res[x] - before.res[x];
  const changed = JSON.stringify(after) !== JSON.stringify(before) || !!flags.eligibility || !!(sim.state.eligOverride);
  // retrait de pièces amies uniquement (8.3.3)
  const friendlyLoss = (before.onMap[f] - after.onMap[f]) + (before.onMap[g.friend(f)] - after.onMap[g.friend(f)]);
  const enemies = FACTIONS.filter(x => SIDE[x] !== SIDE[f]);
  const enemyLoss = enemies.reduce((a, x) => a + (before.onMap[x] - after.onMap[x]), 0);
  const onlyFriendlyRemoval = friendlyLoss > 0 && enemyLoss <= 0 && soDelta === 0 && Object.values(resDelta).every(v => v === 0) && !flags.eligibility && after.fni === before.fni && after.unav.british === before.unav.british && after.unav.french === before.unav.french;
  const unfavorableShift = soDelta * favor < 0;
  const m = { effective: changed && !onlyFriendlyRemoval && !unfavorableShift, soDelta, resDelta, flags, cbcDelta: after.cbc - before.cbc, crcDelta: after.crc - before.crc,
    fromUnavailable: { british: before.unav.british - after.unav.british, french: before.unav.french - after.unav.french },
    patriotFortPlaced: after.pf > before.pf, patriotFortRemoved: after.pf < before.pf, villagePlaced: after.vil > before.vil, villageRemoved: after.vil < before.vil,
    frenchPlaced: after.frenchOnMap > before.frenchOnMap, toriesInActiveOppNone: false, fortInColonyNone: false, regularsPlacedCityColony: false, undergroundMilitiaInSupportOrVillage: false };
  for (const n of MAP_SPACES) { const b = beforeSpaces[n], a = sim.state.spaces[n];
    if (b.sup === -2 && b.b.tor === 0 && a.b.tor > 0) m.toriesInActiveOppNone = true;
    if (COLONIES.includes(n) && b.b.fort === 0 && a.b.fort > 0) m.fortInColonyNone = true;
    if (a.b.reg > b.b.reg) m.regularsPlacedCityColony = true;
    if ((b.sup === 2 || b.i.vil > 0) && b.p.milU + b.p.milA === 0 && a.p.milU > 0) m.undergroundMilitiaInSupportOrVillage = true; }
  return m;
}
function execute(g, f, card, which, opts) {
  opts = opts || {}; const ctx = { flags: opts.flags || {} }; const h = H(g, f, ctx);
  const fn = E[card.id] && E[card.id][which === 'shaded' ? 's' : 'u'];
  if (!fn) throw new Error('Événement non codé : ' + card.id);
  const run = () => fn(h);
  if (opts.silentSim) run(); else g.group(`Événement #${card.id} « ${card.title} » — ${which === 'shaded' ? 'texte ombré' : 'texte non ombré'} — exécuté par les ${FR[f]}`, run);
  return ctx.flags;
}
const Events = { E, WQEVENT, has: id => !!E[id], whichText, evaluate, execute, H, LEVEL };
LOD.Events = Events;
if (typeof module !== 'undefined' && module.exports) module.exports = LOD;
})(typeof window !== 'undefined' ? window : globalThis);
