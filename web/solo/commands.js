/* Liberty or Death — Commandes (3.x) et Activités Spéciales (4.x), primitives réutilisées par les bots et les événements */
(function (root) {
'use strict';
const LOD = typeof module !== 'undefined' && module.exports ? require('./engine.js') : root.LOD;
const { Game, WI, CITIES, COLONIES, MAP_SPACES, SPACE_NAMES, FR, SIDE } = LOD;
const P = Game.prototype;

// ======================================================================= BRITANNIQUES (3.2)
// 3.2.1 Muster — espaces valables pour placer des Regulars : une Ville non bloquée, une Colonie adjacente à une Ville, ou les Antilles
P.britMusterRegSpace = function (n) {
  if (n === WI) return this.state.toa; // 1.3.7 : Antilles hors jeu avant Treaty of Alliance
  if (this.isCity(n)) return !this.blockaded(n);
  if (this.isColony(n)) return this.adj(n).some(a => this.isCity(a));
  return false;
};
// espaces valables pour placer des Tories : Villes ou Colonies contenant ou adjacentes à des Regulars/Forts britanniques, pas en Opposition Active
P.britMusterTorySpace = function (n) {
  if (n === WI || !(this.isCity(n) || this.isColony(n))) return false;
  if (this.sp(n).sup === -2) return false;
  const near = [n].concat(this.adj(n));
  return near.some(a => this.sp(a).b.reg > 0 || this.sp(a).b.fort > 0);
};
P.britPlaceTories = function (n) { const k = this.sp(n).sup === -1 ? 1 : 2; return this.place('british', 'tor', n, k); };
P.britReplaceCubesWithFort = function (n) { // remplacer 3 cubes par 1 Fort (8.1.2 : retirer Regulars/Tories en alternant, en commençant par le plus nombreux, sans retirer le dernier Tory si possible)
  const s = this.sp(n); if (s.b.reg + s.b.tor < 3 || !this.roomForFort(n) || this.availableOf('british', 'fort') < 1) return false;
  this.removeBritishCubes(n, 3); return this.place('british', 'fort', n, 1) === 1;
};
P.removeBritishCubes = function (n, count) { // 8.1.2 retrait de pièces amies
  const s = this.sp(n); let turnReg = s.b.reg >= s.b.tor; let done = 0;
  while (done < count && s.b.reg + s.b.tor > 0) {
    const canTor = s.b.tor > 1 || (s.b.tor === 1 && s.b.reg === 0);
    if (turnReg && s.b.reg > 0) { this.remove('british', 'reg', n, 1); }
    else if (!turnReg && canTor) { this.remove('british', 'tor', n, 1); }
    else if (s.b.reg > 0) this.remove('british', 'reg', n, 1); else this.remove('british', 'tor', n, 1);
    done++; turnReg = !turnReg;
  }
  return done;
};
// 3.2.1 / 6.4.1 Reward Loyalty. mode 'muster' (illimité) ou 'wq' (max 2 niveaux). Retourne le nombre de niveaux obtenus.
P.canRewardLoyalty = function (n) { const s = this.sp(n); return this.britishControl(n) && s.b.reg > 0 && s.b.tor > 0 && this.rawPop(n) > 0 && (s.sup < 2 || s.raid + s.prop > 0); };
P.rewardLoyalty = function (n, mode, maxLevels, free) {
  const s = this.sp(n); let levels = 0; let spent = 0;
  const limit = mode === 'wq' ? 2 : (maxLevels === undefined ? 99 : maxLevels);
  let gageFree = free === true || (this.state.leaders.british.name === 'Gage' && this.leaderAt('british', n)); // Gage : le 1er décalage est gratuit
  // retirer d'abord les marqueurs Raid/Propaganda (1 Ressource chacun)
  while (s.raid + s.prop > 0) {
    if (!this.pay('british', 1)) return levels;
    spent++;
    if (s.raid > 0) { s.raid--; this.say(`Marqueur Raid retiré de ${n}`); this.emit({ t: 'marker', kind: 'raid', n, delta: -1 }); } else { s.prop--; this.say(`Marqueur Propaganda retiré de ${n}`); this.emit({ t: 'marker', kind: 'prop', n, delta: -1 }); }
  }
  while (levels < limit && s.sup < 2) {
    if (!gageFree && !this.pay('british', 1)) break;
    if (gageFree) gageFree = false; else spent++;
    this.shift(n, 1); levels++;
  }
  if (levels || spent) this.say(`Reward Loyalty en ${n} : ${levels} niveau(x), ${spent} Ressource(s)`);
  return levels;
};
// 3.2.2 Garrison : déplacement de Regulars vers une Ville non bloquée
P.garrisonMove = function (from, to, k) { if (this.blockaded(from) || !this.isCity(to) || this.blockaded(to)) return 0; return this.movePiece('british', 'reg', from, to, k); };
P.garrisonActivate = function () { // dans chaque Ville non bloquée : activer 1 Milice par 3 cubes britanniques
  for (const c of CITIES) { if (this.blockaded(c)) continue; const k = Math.floor(this.britishCubes(c) / 3); if (k > 0) this.activateMilitia(c, k); }
};
P.garrisonDisplace = function (city, dest) { // déplacer toutes les unités de la Rébellion vers un espace adjacent
  const s = this.sp(city); if (!this.britishControl(city) || s.p.fort > 0 || this.blockaded(city) || !this.isAdj(city, dest)) return 0;
  let m = 0; m += this.movePiece('patriots', 'cont', city, dest, 99); m += this.movePiece('patriots', 'mil', city, dest, 99); m += this.movePiece('french', 'reg', city, dest, 99);
  if (m) this.say(`Garrison : ${m} unité(s) de la Rébellion déplacée(s) de ${city} vers ${dest}`);
  return m;
};
// 3.2.3 March britannique : destinations possibles depuis "from"
P.britMarchDests = function (from) {
  const out = new Set();
  for (const a of this.adj(from)) if (!this.blockaded(a)) out.add(a);
  // depuis ou adjacent à une Ville non bloquée : vers une autre Ville non bloquée ou une Province adjacente à celle-ci
  const nearCity = (this.isCity(from) && !this.blockaded(from)) || this.adj(from).some(a => this.isCity(a) && !this.blockaded(a));
  if (nearCity) for (const c of CITIES) { if (this.blockaded(c) || c === from) continue; out.add(c); for (const p of this.adj(c)) if (this.isProvince(p)) out.add(p); }
  // 1.9 : pas de March vers une Province adjacente à une Ville bloquée sauf si destination adjacente à l'origine
  const res = [];
  for (const d of out) { if (d === from) continue; if (this.blockaded(d)) continue; const adjBlk = this.isProvince(d) && this.adj(d).some(c => this.blockaded(c)); if (adjBlk && !this.isAdj(from, d)) continue; res.push(d); }
  return res;
};
// déplacement d'un groupe britannique (Regulars + Tories ≤ Regulars, + War Parties via Common Cause) ; activation à destination gérée par britMarchActivate
P.britMarchGroup = function (from, to, reg, tor, wp) {
  reg = this.movePiece('british', 'reg', from, to, reg);
  tor = this.movePiece('british', 'tor', from, to, Math.min(tor, reg));
  let w = 0; if (wp && !this.isCity(to)) { const allow = Math.min(wp, reg - tor); const a = this.movePiece('indians', 'wp', from, to, allow, 'A'); const u = this.movePiece('indians', 'wp', from, to, allow - a, 'U'); w = a + u; if (u) this.activateWP(to, u); }
  this.followLeader('british', from, to, reg + tor);
  return { reg, tor, wp: w };
};
P.britMarchActivate = function (dest) { const k = Math.floor(this.britishCubes(dest) / 3); if (k > 0) this.activateMilitia(dest, k); };
// 8.1 : le Leader non-joueur suit le plus grand groupe qui part (ou reste)
P.followLeader = function (f, from, to, movedCount) {
  const L = this.state.leaders[f]; if (L.loc !== from) return;
  const stay = this.factionPieces(f, from);
  if (movedCount > stay || (movedCount === stay && this.rng() < 0.5)) { L.loc = to; this.say(`${L.name} accompagne le groupe vers ${to}`); this.emit({ t: 'leader', f, from, to }); }
  else this.checkLeader(f, from);
};

// ======================================================================= PATRIOTES (3.3)
P.rallySpaceOk = function (n) { return n !== WI && this.sp(n).sup !== 2; };
P.rallyPlaceMilitia = function (n) { if (this.isReserve(n)) return 0; return this.place('patriots', 'mil', n, 1); }; // 3.3.1 : pas de Milice en Réserve indienne via Rally
P.rallyReplaceWithFort = function (n) { // remplacer 2 unités par 1 Fort (8.1.2 : retirer en alternant Continentals/Milices actives…)
  if (this.patriotUnits(n) < 2 || !this.roomForFort(n) || this.availableOf('patriots', 'fort') < 1) return false;
  this.removePatriotUnits(n, 2); return this.place('patriots', 'fort', n, 1) === 1;
};
P.removePatriotUnits = function (n, count) { // 8.1.2 : Continentals d'abord, puis Milices Actives, puis Underground
  const s = this.sp(n); let done = 0;
  while (done < count && this.patriotUnits(n) > 0) {
    if (s.p.cont > 0) this.remove('patriots', 'cont', n, 1);
    else if (s.p.milA > 0) this.remove('patriots', 'mil', n, 1, 'available', 'A');
    else this.remove('patriots', 'mil', n, 1, 'available', 'U');
    done++;
  }
  return done;
};
P.rallyAtFortPlace = function (n) { // placer jusqu'à Forts + Pop Milices
  if (this.isReserve(n)) return 0; const s = this.sp(n); const k = s.p.fort + this.rawPop(n); return this.place('patriots', 'mil', n, k);
};
P.rallyAtFortGather = function (n) { // déplacer toutes les Milices adjacentes ici puis tout Underground
  let m = 0; for (const a of this.adj(n)) m += this.movePiece('patriots', 'mil', a, n, 99);
  this.undergroundMilitia(n); return m;
};
P.rallyReplaceMilitiaWithContinentals = function (n, keepUnderground) { // dans un espace avec Fort : remplacer des Milices par des Continentals
  const s = this.sp(n); let k = 0;
  while (this.availableOf('patriots', 'cont') > 0) {
    if (s.p.milA > 0) { this.remove('patriots', 'mil', n, 1, 'available', 'A'); }
    else if (s.p.milU > (keepUnderground || 0)) { this.remove('patriots', 'mil', n, 1, 'available', 'U'); }
    else break;
    this.place('patriots', 'cont', n, 1); k++;
  }
  return k;
};
// 3.3.2 March patriote : groupe (cont, milU, milA, fr) ; activation : Milices actives si destination Ville sous contrôle britannique avant le déplacement et groupe + cubes brit. > 3
P.patMarchGroup = function (from, to, cont, milU, milA, fr) {
  if (!this.isAdj(from, to)) return null;
  const britCity = this.isCity(to) && this.britishControl(to);
  const bc = this.britishCubes(to);
  cont = this.movePiece('patriots', 'cont', from, to, cont);
  fr = this.movePiece('french', 'reg', from, to, Math.min(fr, cont));
  milU = this.movePiece('patriots', 'mil', from, to, milU, 'U');
  milA = this.movePiece('patriots', 'mil', from, to, milA, 'A');
  const group = cont + fr + milU + milA;
  if (britCity && group + bc > 3 && milU > 0) { this.activateMilitia(to, milU); }
  this.followLeader('patriots', from, to, cont + milU + milA);
  if (fr) this.followLeader('french', from, to, fr);
  return { cont, fr, milU, milA };
};
P.patMarchActivateWP = function (dest) { const k = Math.floor(this.sp(dest).p.cont / 2); if (k > 0) this.activateWP(dest, k); };
// 3.3.4 Rabble-Rousing
P.rabbleOk = function (n) { if (n === WI || this.rawPop(n) === 0) return false; const s = this.sp(n); return (this.rebellionControl(n) && this.patriotPieces(n) > 0) || s.p.milU > 0; };
P.rabbleRouse = function (n) {
  const s = this.sp(n);
  this.placeMarker('prop', n);
  const shifted = this.shift(n, -1);
  if (!(this.rebellionControl(n) && this.patriotPieces(n) > 0)) this.activateMilitia(n, 1);
  return shifted;
};

// ======================================================================= INDIENS (3.4)
P.gatherOk = function (n) { return this.isProvince(n) && this.sp(n).sup > -2 && this.sp(n).sup < 2; };
P.gatherPlaceWP = function (n) { return this.place('indians', 'wp', n, 1); };
P.gatherReplaceWithVillage = function (n) { const s = this.sp(n); if (this.warParties(n) < 2 || !this.roomForFort(n) || this.availableOf('indians', 'vil') < 1) return false; this.remove('indians', 'wp', n, 2); return this.place('indians', 'vil', n, 1) === 1; };
P.gatherAtVillagePlace = function (n) { const k = this.sp(n).i.vil + 1; return this.place('indians', 'wp', n, k); };
P.gatherAtVillageGather = function (n) { let m = 0; for (const a of this.adj(n)) m += this.movePiece('indians', 'wp', a, n, 99); this.undergroundWP(n); return m; };
// 3.4.2 March indien : vers Provinces adjacentes ; activation si destination Colonie sous contrôle Rébellion avant et groupe + Milices > 3
P.indMarchGroup = function (from, to, wpU, wpA) {
  if (!this.isAdj(from, to) || !this.isProvince(to)) return null;
  const rebColony = this.isColony(to) && this.rebellionControl(to); const mil = this.militia(to);
  wpU = this.movePiece('indians', 'wp', from, to, wpU, 'U'); wpA = this.movePiece('indians', 'wp', from, to, wpA, 'A');
  if (rebColony && wpU + wpA + mil > 3 && wpU > 0) this.activateWP(to, wpU);
  this.followLeader('indians', from, to, wpU + wpA);
  return { wpU, wpA };
};
// 3.4.3 Scout : depuis une Province, 1+ WP (activées) + 1+ Regular (+Tories ≤ Regulars) vers Province adjacente ; activer toutes les Milices à destination ; puis Skirmish britannique possible
P.scout = function (from, to, wp, reg, tor) {
  if (!this.isProvince(from) || !this.isProvince(to) || !this.isAdj(from, to)) return null;
  const w = this.movePiece('indians', 'wp', from, to, wp); if (!w) return null;
  this.activateWP(to, w); // 3.4.3 : activer les War Parties qui se déplacent
  const r = this.movePiece('british', 'reg', from, to, reg); const t = this.movePiece('british', 'tor', from, to, Math.min(tor, r));
  this.activateMilitia(to, 99);
  this.followLeader('indians', from, to, w); this.followLeader('british', from, to, r + t);
  return { wp: w, reg: r, tor: t };
};
// 3.4.4 Raid : dans une Province en Opposition avec une WP Underground : activer 1 WP Underground, placer un marqueur Raid, décaler 1 niveau vers Neutre
P.raidSpace = function (n) {
  const s = this.sp(n); if (!this.isProvince(n) || s.sup >= 0 || s.i.wpU < 1) return false;
  this.activateWP(n, 1); this.placeMarker('raid', n); this.shift(n, 1); return true;
};

// ======================================================================= FRANÇAIS (3.5)
P.famSpaces = function () { return ['Quebec', 'New York', 'New Hampshire', 'Massachusetts'].filter(n => this.sp(n).sup !== 2); };
P.frenchAgentMobilization = function (n, continental) { // 2 Milices (ou 1 Continental)
  if (continental) return this.place('patriots', 'cont', n, 1);
  return this.place('patriots', 'mil', n, 2);
};
P.hortalez = function (amount) { amount = Math.min(amount, this.res('french')); if (amount <= 0) return 0; this.pay('french', amount); this.addRes('patriots', amount + 1); this.say(`Roderigue Hortalez et Cie : ${amount} Ressource(s) françaises → +${amount + 1} Patriotes`); return amount; };
P.frMusterOk = function (n) { return n === WI || ((this.isCity(n) || this.isColony(n)) && this.rebellionControl(n)); };
P.frMuster = function (n, fort) { // jusqu'à 4 Regulars, puis option : remplacer 2 Regulars par 1 Fort patriote (Patriotes paient 1)
  const k = this.place('french', 'reg', n, 4);
  if (fort && n !== WI && this.sp(n).f.reg >= 2 && this.availableOf('patriots', 'fort') > 0 && this.roomForFort(n) && this.res('patriots') >= 1) { this.pay('patriots', 1); this.remove('french', 'reg', n, 2); this.place('patriots', 'fort', n, 1); }
  return k;
};
P.frMarchDests = function (from) {
  const out = new Set();
  for (const a of this.adj(from)) if (this.patriotPieces(a) > 0) out.add(a);
  const nearRebCity = (this.isCity(from) && this.rebellionControl(from)) || this.adj(from).some(a => this.isCity(a) && this.rebellionControl(a));
  if (nearRebCity) for (const c of CITIES) { if (c === from || !this.rebellionControl(c)) continue; out.add(c); for (const p of this.adj(c)) if (this.isProvince(p)) out.add(p); }
  out.delete(from); return [...out];
};
P.frMarchGroup = function (from, to, reg, cont) {
  reg = this.movePiece('french', 'reg', from, to, reg); cont = this.movePiece('patriots', 'cont', from, to, Math.min(cont, reg));
  this.followLeader('french', from, to, reg); if (cont) this.followLeader('patriots', from, to, cont);
  return { reg, cont };
};

// ======================================================================= ACTIVITÉS SPÉCIALES (4.x)
// 4.2.2 / 4.3.3 / 4.5.2 Skirmish : f = 'british' (Regulars vs Rébellion), 'patriots' (Continentals vs Brit.), 'french' (Regulars fr. vs Brit.)
// option : 1 = retirer 1 ; 2 = retirer 2 + 1 des siens ; 3 = retirer un Fort + 1 des siens (si aucun cube/Milice active ennemi)
P.skirmishTargets = function (f, n) {
  const s = this.sp(n);
  if (f === 'british') return { own: s.b.reg, units: s.p.cont + s.f.reg + s.p.milA, fort: s.p.fort };
  if (f === 'patriots') return { own: s.p.cont, units: s.b.reg + s.b.tor, fort: s.b.fort };
  return { own: s.f.reg, units: s.b.reg + s.b.tor, fort: s.b.fort };
};
P.skirmish = function (f, n, option, prefer) { // prefer : liste de types ennemis prioritaires ; par défaut 8.1.2 (le moins nombreux d'abord)
  const t = this.skirmishTargets(f, n); if (t.own < 1) return 0;
  const removeEnemy = (k) => {
    let done = 0;
    for (let i = 0; i < k; i++) {
      const s = this.sp(n);
      if (f === 'british') {
        const opts = [['french', 'reg', s.f.reg], ['patriots', 'cont', s.p.cont], ['patriots', 'mil', s.p.milA]].filter(o => o[2] > 0);
        if (!opts.length) break;
        const cubes = opts.filter(o => o[1] !== 'mil');
        const choice = prefer === 'militia' && s.p.milA > 0 ? ['patriots', 'mil'] : cubes.length ? cubes.sort((a, b) => a[2] - b[2])[0] : opts[0];
        this.remove(choice[0], choice[1], n, 1, choice[1] === 'mil' ? 'available' : 'casualties', 'A'); done++;
      } else {
        const opts = [['british', 'reg', s.b.reg], ['british', 'tor', s.b.tor]].filter(o => o[2] > 0); if (!opts.length) break;
        const choice = opts.sort((a, b) => a[2] - b[2])[0]; this.remove('british', choice[1], n, 1, 'casualties'); done++;
      }
    }
    return done;
  };
  const ownType = f === 'patriots' ? 'cont' : 'reg';
  return this.group(`Skirmish ${FR[f]} en ${n}`, () => {
    if (option === 3) { if (t.units > 0 || t.fort < 1) return 0; this.remove(f === 'british' ? 'patriots' : 'british', 'fort', n, 1, 'casualties'); this.remove(f, ownType, n, 1, 'casualties'); return 1; }
    if (option === 2) { if (t.units < 2 || t.own < 1) return 0; const k = removeEnemy(2); this.remove(f, ownType, n, 1, 'casualties'); return k; }
    return removeEnemy(1);
  });
};
// 4.2.3 / 4.5.3 Naval Pressure
P.britNavalPressure = function (chooser) {
  if (!this.state.toa || this.state.fni === 0) { const r = this.d3(); this.addRes('british', r); this.say(`Naval Pressure britannique : +${r} Ressources`); return 'res'; }
  this.lowerFNI(1, chooser); return 'fni';
};
P.frNavalPressure = function (city) { // +1 FNI : placer un Squadron des Antilles sur une Ville (ou réarranger)
  if (!this.state.toa) return false;
  if (this.state.wiSquadrons > 0) { return this.raiseFNI(1, () => city) === 1; }
  return false; // réarrangement : pas d'effet sur FNI pour un bot (8.6.3 Naval Pressure = "Add one Blockade")
};
// 4.3.1 Persuasion : jusqu'à 3 espaces Rébellion-contrôlés avec pièces patriotes dont Milice Underground
P.persuasionOk = function (n) { return n !== WI && !this.isReserve(n) && this.rebellionControl(n) && this.sp(n).p.milU > 0; };
P.persuasion = function (spaces) { let k = 0; for (const n of spaces.slice(0, 3)) { if (!this.persuasionOk(n)) continue; this.activateMilitia(n, 1); this.addRes('patriots', 1); this.placeMarker('prop', n); k++; } return k; };
// 4.3.2 Partisans : espace avec Milice Underground et pièces royalistes, pas de bataille
P.partisansOk = function (n) { return this.sp(n).p.milU > 0 && this.royalistPieces(n) > 0; };
P.partisans = function (n, option) { // 1 : activer 1 Milice, retirer 1 unité royaliste ; 2 : activer 2, retirer 1 Milice et 2 unités ; 3 : (pas de WP) activer 2, retirer 1 Milice, retirer 1 Village
  const s = this.sp(n);
  return this.group(`Partisans en ${n}`, () => {
    if (option === 3) { if (this.warParties(n) > 0 || s.i.vil < 1 || s.p.milU < 2) return 0; this.activateMilitia(n, 2); this.remove('patriots', 'mil', n, 1, 'available', 'A'); this.remove('indians', 'vil', n, 1); return 1; }
    if (option === 2) { if (s.p.milU < 2) return 0; this.activateMilitia(n, 2); this.remove('patriots', 'mil', n, 1, 'available', 'A'); return this.removeRoyalistUnits(n, 2); }
    if (s.p.milU < 1) return 0; this.activateMilitia(n, 1); return this.removeRoyalistUnits(n, 1);
  });
};
P.removeRoyalistUnits = function (n, k) { // 8.1.2 ciblage ennemi : WP (Underground d'abord) puis Regulars/Tories en alternant (le moins nombreux d'abord)
  let done = 0; const s = this.sp(n);
  for (let i = 0; i < k; i++) {
    if (s.i.wpU > 0) { this.remove('indians', 'wp', n, 1, 'available', 'U'); done++; continue; }
    if (s.i.wpA > 0) { this.remove('indians', 'wp', n, 1, 'available', 'A'); done++; continue; }
    if (s.b.reg + s.b.tor === 0) break;
    const t = (s.b.reg > 0 && (s.b.tor === 0 || s.b.reg <= s.b.tor)) ? 'reg' : 'tor';
    this.remove('british', t, n, 1, 'casualties'); done++;
  }
  return done;
};
P.removeRebellionUnits = function (n, k) { // 8.1.2 : Milices (Underground d'abord) puis Continentals/Regulars fr. en alternant (le moins nombreux d'abord)
  let done = 0; const s = this.sp(n);
  for (let i = 0; i < k; i++) {
    if (s.p.milU > 0) { this.remove('patriots', 'mil', n, 1, 'available', 'U'); done++; continue; }
    if (s.p.milA > 0) { this.remove('patriots', 'mil', n, 1, 'available', 'A'); done++; continue; }
    if (s.p.cont + s.f.reg === 0) break;
    if (s.f.reg > 0 && (s.p.cont === 0 || s.f.reg <= s.p.cont)) this.remove('french', 'reg', n, 1, 'casualties'); else this.remove('patriots', 'cont', n, 1, 'casualties');
    done++;
  }
  return done;
};
// 4.4.1 Trade (le choix britannique est passé en paramètre : nombre de Ressources transférées)
P.trade = function (n, britishGives) {
  const s = this.sp(n); if (s.i.wpU < 1 || s.i.vil < 1) return false;
  if (britishGives > 1 && this.res('british') >= britishGives) { this.pay('british', britishGives); this.addRes('indians', britishGives); this.activateWP(n, 1); this.say(`Trade en ${n} : ${britishGives} Ressources transférées des Britanniques aux Indiens`); }
  else { this.activateWP(n, 1); this.addRes('indians', 1); this.say(`Trade en ${n} : +1 Ressource indienne`); }
  return true;
};
// 4.4.2 War Path
P.warPathOk = function (n) { return this.sp(n).i.wpU > 0 && this.rebellionPieces(n) > 0; };
P.warPath = function (n, option) {
  const s = this.sp(n);
  return this.group(`War Path en ${n}`, () => {
    let k = 0;
    if (option === 3) { if (this.rebellionUnits(n) > 0 || s.p.fort < 1 || s.i.wpU < 2) return 0; this.remove('patriots', 'fort', n, 1, 'casualties'); this.activateWP(n, 2); this.remove('indians', 'wp', n, 1, 'available', 'A'); k = 1; }
    else if (option === 2) { if (s.i.wpU < 2) return 0; this.activateWP(n, 2); this.remove('indians', 'wp', n, 1, 'available', 'A'); k = this.removeRebellionUnits(n, 2); }
    else { if (s.i.wpU < 1) return 0; this.activateWP(n, 1); k = this.removeRebellionUnits(n, 1); }
    if (this.state.leaders.indians.name === 'Brant' && this.leaderAt('indians', n) && this.militia(n) > 0) { this.say('Brant : 1 Milice supplémentaire retirée'); this.removeRebellionUnits(n, 1); }
    return k;
  });
};
// 4.4.3 Plunder : dans une Province de Raid où WP > pièces de la Rébellion
P.plunder = function (n) {
  if (this.warParties(n) <= this.rebellionPieces(n)) return 0;
  const k = Math.min(this.rawPop(n), this.res('patriots'));
  this.pay('patriots', k); this.addRes('indians', k); this.remove('indians', 'wp', n, 1);
  this.say(`Plunder en ${n} : ${k} Ressource(s) des Patriotes aux Indiens`); return k;
};
// 4.5.1 Préparer la Guerre
P.preparerLaGuerre = function (choice) { // 'sq' | 'reg' | 'res'
  const u = this.state.unavailable.french;
  if (choice === 'sq' && u.sq > 0) { u.sq--; this.state.wiSquadrons++; this.say('Préparer la Guerre : 1 Squadron Unavailable → Antilles'); return true; }
  if (choice === 'reg' && u.reg > 0) { const k = Math.min(3, u.reg); u.reg -= k; this.state.available.french.reg += k; this.say(`Préparer la Guerre : ${k} Regulars français Unavailable → Available`); return true; }
  if (choice === 'res') { this.addRes('french', 2); this.say('Préparer la Guerre : +2 Ressources françaises'); return true; }
  return false;
};
P.frenchPreparations = function () { return this.state.available.french.reg + this.state.wiSquadrons + this.state.cbc; };

// ======================================================================= Win the Day (3.6.8) : application des décalages
// winner : 'royalist' | 'rebellion' ; shifts : nombre ; retourne nombre appliqué. Les espaces adjacents sont choisis par les priorités des bots (8.3.6)
P.applyWinTheDay = function (res) {
  if (!res.winTheDay) return;
  const n = res.space; let left = res.shifts; const dir = res.winner === 'royalist' ? 1 : -1;
  while (left > 0 && this.canShift(n, dir)) { this.shift(n, dir); left--; }
  if (left > 0) {
    const cands = this.adj(n).filter(a => this.canShift(a, dir));
    const ranked = this.rank(cands, [a => this.rawPop(a), a => dir > 0 ? -this.sp(a).sup : this.sp(a).sup]);
    for (const a of ranked) { while (left > 0 && this.canShift(a, dir)) { this.shift(a, dir); left--; } if (left <= 0) break; }
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = LOD;
})(typeof window !== 'undefined' ? window : globalThis);
