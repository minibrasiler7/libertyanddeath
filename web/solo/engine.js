/* Liberty or Death — moteur de règles (sections 1 à 7 du livret de règles)
 * Fichier autonome : fonctionne dans le navigateur (window.LOD) et dans Node (module.exports).
 */
(function (root) {
'use strict';

const FACTIONS = ['british', 'patriots', 'french', 'indians'];
const SIDE = { british: 'royalist', indians: 'royalist', patriots: 'rebellion', french: 'rebellion' };
const FR = { british: 'Britanniques', patriots: 'Patriotes', french: 'Français', indians: 'Indiens' };
const WI = 'West Indies';

// 1.3 Carte : espaces, population, adjacences (terrestres uniquement — les déplacements
// de Ville à Ville sont gérés par les règles de March, pas par l'adjacence).
const SPACES = {
  'Quebec City':              { type: 'city',    pop: 1, adj: ['Quebec', 'New Hampshire'] },
  'Boston':                   { type: 'city',    pop: 1, adj: ['Massachusetts', 'Connecticut-Rhode Island'] },
  'New York City':            { type: 'city',    pop: 2, adj: ['New York', 'New Jersey'] },
  'Philadelphia':             { type: 'city',    pop: 1, adj: ['Pennsylvania', 'New Jersey', 'Maryland-Delaware'] },
  'Norfolk':                  { type: 'city',    pop: 1, adj: ['Virginia', 'North Carolina'] },
  'Charles Town':             { type: 'city',    pop: 1, adj: ['South Carolina', 'North Carolina'] },
  'Savannah':                 { type: 'city',    pop: 1, adj: ['Georgia', 'South Carolina'] },
  'New Hampshire':            { type: 'colony',  pop: 1, adj: ['Quebec City', 'Quebec', 'Massachusetts', 'New York'] },
  'Massachusetts':            { type: 'colony',  pop: 2, adj: ['New Hampshire', 'Boston', 'Connecticut-Rhode Island', 'New York'] },
  'Connecticut-Rhode Island': { type: 'colony',  pop: 2, adj: ['Massachusetts', 'Boston', 'New York'] },
  'New York':                 { type: 'colony',  pop: 2, adj: ['Quebec', 'New Hampshire', 'Massachusetts', 'Connecticut-Rhode Island', 'New York City', 'New Jersey', 'Pennsylvania', 'Northwest'] },
  'New Jersey':               { type: 'colony',  pop: 1, adj: ['New York', 'New York City', 'Pennsylvania', 'Philadelphia'] },
  'Pennsylvania':             { type: 'colony',  pop: 2, adj: ['New York', 'New Jersey', 'Philadelphia', 'Maryland-Delaware', 'Northwest'] },
  'Maryland-Delaware':        { type: 'colony',  pop: 2, adj: ['Pennsylvania', 'Philadelphia', 'Virginia', 'Northwest'] },
  'Virginia':                 { type: 'colony',  pop: 2, adj: ['Maryland-Delaware', 'Norfolk', 'North Carolina', 'Northwest', 'Southwest'] },
  'North Carolina':           { type: 'colony',  pop: 2, adj: ['Virginia', 'Norfolk', 'Charles Town', 'South Carolina', 'Southwest'] },
  'South Carolina':           { type: 'colony',  pop: 2, adj: ['North Carolina', 'Charles Town', 'Savannah', 'Georgia', 'Southwest'] },
  'Georgia':                  { type: 'colony',  pop: 1, adj: ['South Carolina', 'Savannah', 'Florida', 'Southwest'] },
  'Quebec':                   { type: 'reserve', pop: 0, adj: ['Quebec City', 'New Hampshire', 'New York', 'Northwest'] },
  'Northwest':                { type: 'reserve', pop: 0, adj: ['Quebec', 'New York', 'Pennsylvania', 'Maryland-Delaware', 'Virginia', 'Southwest'] },
  'Southwest':                { type: 'reserve', pop: 0, adj: ['Northwest', 'Virginia', 'North Carolina', 'South Carolina', 'Georgia', 'Florida'] },
  'Florida':                  { type: 'reserve', pop: 0, adj: ['Georgia', 'Southwest'] },
  'West Indies':              { type: 'wi',      pop: 0, adj: [] },
};
const SPACE_NAMES = Object.keys(SPACES);
const MAP_SPACES = SPACE_NAMES.filter(n => n !== WI);
const CITIES = MAP_SPACES.filter(n => SPACES[n].type === 'city');
const COLONIES = MAP_SPACES.filter(n => SPACES[n].type === 'colony');
const RESERVES = MAP_SPACES.filter(n => SPACES[n].type === 'reserve');
const PROVINCES = COLONIES.concat(RESERVES);
const ALIASES = {
  'Connecticut - Rhode Island': 'Connecticut-Rhode Island', 'Connecticut-RI': 'Connecticut-Rhode Island', 'CT': 'Connecticut-Rhode Island',
  'Maryland - Delaware': 'Maryland-Delaware', 'MD': 'Maryland-Delaware', 'NH': 'New Hampshire', 'MA': 'Massachusetts', 'NY': 'New York',
  'NJ': 'New Jersey', 'PA': 'Pennsylvania', 'VA': 'Virginia', 'NC': 'North Carolina', 'SC': 'South Carolina', 'GA': 'Georgia',
  'QC': 'Quebec', 'NW': 'Northwest', 'SW': 'Southwest', 'FL': 'Florida', 'NYC': 'New York City', 'WI': 'West Indies',
};
function normSpace(n) { return ALIASES[n] || n; }

// 1.4.1 / page 35 : forces totales
const POOL = {
  british: { reg: 25, tor: 25, fort: 6 },
  patriots: { cont: 20, mil: 15, fort: 6 },
  french: { reg: 15, sq: 3 },
  indians: { wp: 15, vil: 12 },
};
const LEADER_SEQ = { british: ['Gage', 'Howe', 'Clinton'], patriots: ['Washington'], french: ['Rochambeau', 'Lauzun'], indians: ['Brant', 'Cornplanter', 'Dragging Canoe'] };

// ---------------------------------------------------------------- RNG (dés)
function makeRng(seed) {
  let s = (seed >>> 0) || 123456789;
  return function () { // mulberry32
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptySpace() {
  return { b: { reg: 0, tor: 0, fort: 0 }, p: { cont: 0, milU: 0, milA: 0, fort: 0 }, f: { reg: 0 }, i: { wpU: 0, wpA: 0, vil: 0 },
    sup: 0, raid: 0, prop: 0, blk: 0 };
}

function newState() {
  const spaces = {};
  for (const n of SPACE_NAMES) spaces[n] = emptySpace();
  return {
    spaces,
    available: { british: { reg: 0, tor: 0, fort: 0 }, patriots: { cont: 0, mil: 0, fort: 0 }, french: { reg: 0 }, indians: { wp: 0, vil: 0 } },
    unavailable: { british: { reg: 0, tor: 0 }, french: { reg: 0, sq: 0 } },
    casualties: { british: { reg: 0, tor: 0 }, patriots: { cont: 0 }, french: { reg: 0 } },
    wiSquadrons: 0,              // marqueurs Squadron/Blockade côté Squadron dans les Antilles
    leaders: { british: { name: 'Gage', loc: null }, patriots: { name: 'Washington', loc: null }, french: { name: 'Rochambeau', loc: null }, indians: { name: 'Brant', loc: null } },
    resources: { british: 0, patriots: 0, french: 0, indians: 0 },
    cbc: 0, crc: 0, fni: 0,
    toa: false,
    bs: { british: true, patriots: true, french: true, indians: true }, // Brilliant Stroke encore en main
    eligible: { british: true, patriots: true, french: true, indians: true },
    seq: {}, // case de la Sequence of Play occupée pendant la carte (3 = Pass, 4/6/8 = 1re faction, 5/7/9 = 2e faction)
    players: { british: 'bot', patriots: 'bot', french: 'bot', indians: 'bot' },
    wqDone: 0, wqTotal: 6,
    release: [{ reg: 6, tor: 6 }, { reg: 6, tor: 6 }], // 6.5.3 calendrier de libération britannique (par WQ)
    seed: 1,
  };
}

class Game {
  constructor(state, opts) {
    this.state = state || newState();
    this.opts = opts || {};
    this.log = [];
    this.events = []; // flux structuré (animation)
    this.rng = makeRng(this.state.seed || 1);
    this.depth = 0;
    this.history = [];
  }
  clone() {
    const g = new Game(JSON.parse(JSON.stringify(this.state)), this.opts);
    g.rng = makeRng(this._rngState());
    g.silent = true;
    return g;
  }
  _rngState() { // dérive une graine stable pour les simulations : on consomme 1 tirage
    return Math.floor(this.rng() * 2 ** 31);
  }
  snapshot() { return JSON.parse(JSON.stringify(this.state)); }
  restore(s) { this.state = JSON.parse(JSON.stringify(s)); }

  // --------------------------------------------------------------- journal
  say(msg, level) {
    if (this.silent) return;
    this.log.push({ msg, depth: this.depth, level: level || 'info' });
    this.emit({ t: 'say', msg, level: level || 'info', depth: this.depth });
  }
  emit(ev) { if (this.silent) return; this.events.push(ev); }
  group(title, fn) { this.say(title, 'head'); this.depth++; try { return fn(); } finally { this.depth--; } }

  // ----------------------------------------------------------------- dés
  d6() { const v = 1 + Math.floor(this.rng() * 6); this.say(`Dé D6 : ${v}`, 'dice'); this.emit({ t: 'dice', sides: 6, v }); return v; }
  d3() { const v = 1 + Math.floor(this.rng() * 3); this.say(`Dé D3 : ${v}`, 'dice'); this.emit({ t: 'dice', sides: 3, v }); return v; }
  pick(arr) { if (!arr.length) return undefined; return arr[Math.floor(this.rng() * arr.length)]; }
  shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ------------------------------------------------------------- accès
  sp(n) { const s = this.state.spaces[normSpace(n)]; if (!s) throw new Error('Espace inconnu : ' + n); return s; }
  info(n) { return SPACES[normSpace(n)]; }
  isCity(n) { return SPACES[n].type === 'city'; }
  isColony(n) { return SPACES[n].type === 'colony'; }
  isReserve(n) { return SPACES[n].type === 'reserve'; }
  isProvince(n) { return SPACES[n].type === 'colony' || SPACES[n].type === 'reserve'; }
  pop(n) { const s = this.sp(n); if (this.isCity(n) && s.blk > 0) return 0; return SPACES[n].pop; } // 1.9 : ville bloquée = pop 0 pour le Support
  rawPop(n) { return SPACES[n].pop; }
  adj(n) { return SPACES[normSpace(n)].adj; }
  isAdj(a, b) { return SPACES[normSpace(a)].adj.includes(normSpace(b)); }
  blockaded(n) { return this.isCity(n) && this.sp(n).blk > 0; }

  // comptages
  britishPieces(n) { const s = this.sp(n); return s.b.reg + s.b.tor + s.b.fort; }
  britishCubes(n) { const s = this.sp(n); return s.b.reg + s.b.tor; }
  patriotPieces(n) { const s = this.sp(n); return s.p.cont + s.p.milU + s.p.milA + s.p.fort; }
  patriotUnits(n) { const s = this.sp(n); return s.p.cont + s.p.milU + s.p.milA; }
  militia(n) { const s = this.sp(n); return s.p.milU + s.p.milA; }
  frenchPieces(n) { return this.sp(n).f.reg; }
  indianPieces(n) { const s = this.sp(n); return s.i.wpU + s.i.wpA + s.i.vil; }
  warParties(n) { const s = this.sp(n); return s.i.wpU + s.i.wpA; }
  royalistPieces(n) { return this.britishPieces(n) + this.indianPieces(n); }
  rebellionPieces(n) { return this.patriotPieces(n) + this.frenchPieces(n); }
  rebellionCubes(n) { const s = this.sp(n); return s.p.cont + s.f.reg; }
  rebellionUnits(n) { return this.patriotUnits(n) + this.frenchPieces(n); }
  factionPieces(f, n) { return { british: this.britishPieces(n), patriots: this.patriotPieces(n), french: this.frenchPieces(n), indians: this.indianPieces(n) }[f]; }
  sidePieces(side, n) { return side === 'royalist' ? this.royalistPieces(n) : this.rebellionPieces(n); }
  enemySide(f) { return SIDE[f] === 'royalist' ? 'rebellion' : 'royalist'; }
  friend(f) { return { british: 'indians', indians: 'british', patriots: 'french', french: 'patriots' }[f]; }
  leaderAt(f, n) { return this.state.leaders[f].loc === n; }
  royalistLeaders(n) { return (this.leaderAt('british', n) ? 1 : 0) + (this.leaderAt('indians', n) ? 1 : 0); }
  rebellionLeaders(n) { return (this.leaderAt('patriots', n) ? 1 : 0) + (this.leaderAt('french', n) ? 1 : 0); }
  fortsVillages(n) { const s = this.sp(n); return s.b.fort + s.p.fort + s.i.vil; }
  roomForFort(n) { return n !== WI ? this.fortsVillages(n) < 2 : this.sp(n).b.fort < 2; } // 1.4.2

  // 1.7 Contrôle
  control(n) {
    if (n === WI) { const s = this.sp(n); const roy = s.b.reg + s.b.fort, reb = s.f.reg; if (reb > roy) return 'rebellion'; if (roy > reb && roy > 0) return 'british'; return null; }
    const roy = this.royalistPieces(n), reb = this.rebellionPieces(n);
    if (reb > roy) return 'rebellion';
    if (roy > reb && this.britishPieces(n) > 0) return 'british';
    return null;
  }
  britishControl(n) { return this.control(n) === 'british'; }
  rebellionControl(n) { return this.control(n) === 'rebellion'; }

  // 1.6 Support / Opposition
  supportLevel(n) { return this.sp(n).sup; }
  totalSupport() { let t = 0; for (const n of MAP_SPACES) { const s = this.sp(n).sup; if (s > 0) t += s * this.pop(n); } return t; }
  totalOpposition() { let t = 0; for (const n of MAP_SPACES) { const s = this.sp(n).sup; if (s < 0) t += -s * this.pop(n); } return t; }
  levelName(v) { return ['Opposition Active', 'Opposition Passive', 'Neutre', 'Support Passif', 'Support Actif'][v + 2]; }
  canShift(n, dir) { // dir +1 vers Support Actif, -1 vers Opposition Active
    if (this.rawPop(n) === 0) return false;
    const s = this.sp(n).sup;
    return dir > 0 ? s < 2 : s > -2;
  }
  shift(n, delta) {
    if (this.rawPop(n) === 0 || delta === 0) return 0;
    const s = this.sp(n); const before = s.sup;
    s.sup = Math.max(-2, Math.min(2, s.sup + delta));
    if (s.sup !== before) { this.say(`${n} : ${this.levelName(before)} → ${this.levelName(s.sup)}`); this.emit({ t: 'shift', n, from: before, to: s.sup }); }
    return s.sup - before;
  }
  shiftTowardNeutral(n, steps) { const s = this.sp(n).sup; if (s === 0) return 0; return this.shift(n, s > 0 ? -Math.min(steps, s) : Math.min(steps, -s)); }
  setLevel(n, lvl) { const s = this.sp(n); if (this.rawPop(n) === 0) return; const b = s.sup; s.sup = lvl; if (b !== lvl) { this.say(`${n} : ${this.levelName(b)} → ${this.levelName(lvl)}`); this.emit({ t: 'shift', n, from: b, to: lvl }); } }

  // 1.8 Ressources
  addRes(f, n) {
    const r = this.state.resources; const before = r[f];
    r[f] = Math.max(0, Math.min(50, r[f] + n));
    if (r[f] !== before) { this.say(`Ressources ${FR[f]} : ${before} → ${r[f]}`); this.emit({ t: 'res', f, from: before, to: r[f] }); }
    return r[f] - before;
  }
  pay(f, n) { if (n <= 0) return true; if (this.state.resources[f] < n) return false; this.addRes(f, -n); return true; }
  res(f) { return this.state.resources[f]; }

  // 1.9 FNI
  raiseFNI(levels, placer) { // placer : fonction (choix de la ville) sinon aléatoire parmi les villes les plus en Support
    if (!this.state.toa) { this.say('FNI ignoré (Treaty of Alliance non joué)'); return 0; }
    let done = 0;
    for (let i = 0; i < levels; i++) {
      if (this.state.wiSquadrons <= 0) { this.say('FNI : aucun Squadron disponible dans les Antilles'); break; }
      const city = placer ? placer() : this.pick(this.bestSupportCities());
      if (!city) break;
      this.state.wiSquadrons--; this.sp(city).blk++; this.state.fni++; done++;
      this.say(`FNI → ${this.state.fni} : Blocus placé sur ${city}`); this.emit({ t: 'blk', n: city, delta: 1 });
    }
    return done;
  }
  bestSupportCities() { let best = -9, out = []; for (const c of CITIES) { const v = this.sp(c).sup * this.rawPop(c); if (v > best) { best = v; out = [c]; } else if (v === best) out.push(c); } return out; }
  lowerFNI(levels, chooser) { // 1.9 : les Britanniques retirent un Blocus vers les Antilles
    let done = 0;
    for (let i = 0; i < levels; i++) {
      if (this.state.fni <= 0) break;
      const cands = CITIES.filter(c => this.sp(c).blk > 0);
      if (!cands.length) { this.state.fni = 0; break; }
      const city = chooser ? chooser(cands) : this.pick(this.bestSupportCities().filter(c => cands.includes(c)).length ? this.bestSupportCities().filter(c => cands.includes(c)) : cands);
      this.sp(city).blk--; this.state.wiSquadrons++; this.state.fni--; done++;
      this.say(`FNI → ${this.state.fni} : Blocus retiré de ${city} vers les Antilles`); this.emit({ t: 'blk', n: city, delta: -1 });
    }
    return done;
  }
  setFNI(level, placer) { level = Math.max(0, level); if (level > this.state.fni) return this.raiseFNI(level - this.state.fni, placer); if (level < this.state.fni) return this.lowerFNI(this.state.fni - level); return 0; }

  // ------------------------------------------------------- placement / retrait
  // type : 'reg','tor','fort' (british) ; 'cont','mil','fort' (patriots) ; 'reg' (french) ; 'wp','vil' (indians)
  availableOf(f, type) { return this.state.available[f][type] || 0; }
  place(f, type, n, count, opts) { // depuis Available (ou opts.from = 'unavailable' | 'casualties' | 'any')
    opts = opts || {}; n = normSpace(n);
    let placed = 0;
    for (let k = 0; k < count; k++) {
      if (!this.canPlace(f, type, n)) break;
      let src = null;
      const order = opts.from === 'unavailable' ? ['unavailable', 'available'] : opts.from === 'casualties' ? ['casualties', 'available'] : opts.from === 'any' ? ['unavailable', 'casualties', 'available'] : ['available'];
      for (const o of order) {
        if (o === 'available' && this.state.available[f][type] > 0) { this.state.available[f][type]--; src = 'Available'; break; }
        if (o === 'unavailable' && this.state.unavailable[f] && this.state.unavailable[f][type] > 0) { this.state.unavailable[f][type]--; src = 'Unavailable'; break; }
        if (o === 'casualties' && this.state.casualties[f] && this.state.casualties[f][type] > 0) { this.state.casualties[f][type]--; src = 'Casualties'; break; }
      }
      if (!src) break;
      this._addPiece(f, type, n, opts.active);
      placed++; this.emit({ t: 'place', f, type, n, active: !!opts.active, src });
      if (opts.quiet !== true) this.say(`${FR[f]} : ${this.pieceName(f, type, opts.active)} placé en ${n} (depuis ${src})`);
    }
    return placed;
  }
  pieceName(f, type, active) {
    return { british: { reg: 'Regular', tor: 'Tory', fort: 'Fort' }, patriots: { cont: 'Continental', mil: active ? 'Milice (Active)' : 'Milice (Underground)', fort: 'Fort' },
      french: { reg: 'Regular français' }, indians: { wp: active ? 'War Party (Active)' : 'War Party (Underground)', vil: 'Village' } }[f][type];
  }
  canPlace(f, type, n) {
    const s = this.sp(n);
    if (n === WI) return (f === 'british' && (type === 'reg' || (type === 'fort' && s.b.fort < 2))) || (f === 'french' && type === 'reg');
    if (f === 'indians' && this.isCity(n)) return false;
    if (type === 'fort' || type === 'vil') return this.fortsVillages(n) < 2;
    return true;
  }
  _addPiece(f, type, n, active) {
    const s = this.sp(n);
    if (f === 'british') s.b[type]++;
    else if (f === 'patriots') { if (type === 'mil') { if (active) s.p.milA++; else s.p.milU++; } else s.p[type]++; }
    else if (f === 'french') s.f.reg++;
    else if (f === 'indians') { if (type === 'wp') { if (active) s.i.wpA++; else s.i.wpU++; } else s.i.vil++; }
    if (this.state.leaders[f].loc === null && this.opts.leaderFollowsPlacement) this.state.leaders[f].loc = n;
  }
  // retire une pièce ; dest : 'available' (défaut) ou 'casualties'
  remove(f, type, n, count, dest, sub) { // sub : pour mil/wp : 'U' | 'A' (défaut : Actives d'abord)
    n = normSpace(n); const s = this.sp(n); let removed = 0;
    for (let k = 0; k < count; k++) {
      let ok = false, wasActive = null;
      if (f === 'british') { if (s.b[type] > 0) { s.b[type]--; ok = true; } }
      else if (f === 'patriots') {
        if (type === 'mil') { if ((sub !== 'U') && s.p.milA > 0) { s.p.milA--; ok = true; wasActive = true; } else if (sub !== 'A' && s.p.milU > 0) { s.p.milU--; ok = true; wasActive = false; } }
        else if (s.p[type] > 0) { s.p[type]--; ok = true; }
      } else if (f === 'french') { if (s.f.reg > 0) { s.f.reg--; ok = true; } }
      else if (f === 'indians') {
        if (type === 'wp') { if ((sub !== 'U') && s.i.wpA > 0) { s.i.wpA--; ok = true; wasActive = true; } else if (sub !== 'A' && s.i.wpU > 0) { s.i.wpU--; ok = true; wasActive = false; } }
        else if (s.i.vil > 0) { s.i.vil--; ok = true; }
      }
      if (!ok) break;
      removed++;
      this.emit({ t: 'remove', f, type, n, active: wasActive, dest: dest === 'casualties' && (type === 'reg' || type === 'tor' || type === 'cont' || type === 'fort') ? 'casualties' : 'available' });
      this._toBox(f, type, dest === 'casualties');
      this.say(`${FR[f]} : ${this.pieceName(f, type, wasActive)} retiré de ${n}${dest === 'casualties' ? ' → Casualties' : ''}`);
    }
    if (removed) this.checkLeader(f, n);
    return removed;
  }
  _toBox(f, type, casualty) {
    const st = this.state;
    if (casualty && (type === 'reg' || type === 'tor' || type === 'cont' || type === 'fort')) { // 1.6.4
      this.emit({ t: 'track', which: f === 'british' ? 'cbc' : 'crc', from: f === 'british' ? st.cbc : st.crc, to: (f === 'british' ? st.cbc : st.crc) + 1 });
      if (f === 'british') { st.cbc++; if (type === 'fort') st.available.british.fort++; else st.casualties.british[type]++; }
      if (f === 'patriots') { st.crc++; if (type === 'fort') st.available.patriots.fort++; else st.casualties.patriots.cont++; }
      if (f === 'french') { st.crc++; st.casualties.french.reg++; }
      return;
    }
    st.available[f][type]++;
  }
  // 1.10 : un Leader sans pièce de sa faction rejoint un espace avec des pièces (bot : le plus de pièces) ou Available
  checkLeader(f, n) {
    const L = this.state.leaders[f];
    if (L.loc === n && this.factionPieces(f, n) === 0) {
      const cands = SPACE_NAMES.filter(x => this.factionPieces(f, x) > 0);
      if (!cands.length) { L.loc = null; this.say(`${L.name} retourne en Available`); this.emit({ t: 'leader', f, from: n, to: null }); return; }
      const best = this.argmax(cands, x => this.factionPieces(f, x));
      L.loc = this.pick(best); this.say(`${L.name} rejoint ${L.loc}`); this.emit({ t: 'leader', f, from: n, to: L.loc });
    }
  }
  moveLeader(f, n) { const from = this.state.leaders[f].loc; this.state.leaders[f].loc = n; this.emit({ t: 'leader', f, from, to: n }); }
  // déplacement d'une pièce (sans changer son état sauf opts)
  movePiece(f, type, from, to, count, sub) {
    from = normSpace(from); to = normSpace(to); let moved = 0;
    const a = this.sp(from), b = this.sp(to);
    for (let k = 0; k < count; k++) {
      if (f === 'british') { if (a.b[type] > 0 && this.canPlace(f, type, to)) { a.b[type]--; b.b[type]++; moved++; } else break; }
      else if (f === 'french') { if (a.f.reg > 0 && this.canPlace(f, 'reg', to)) { a.f.reg--; b.f.reg++; moved++; } else break; }
      else if (f === 'patriots') {
        if (type === 'cont') { if (a.p.cont > 0 && to !== WI) { a.p.cont--; b.p.cont++; moved++; } else break; }
        else if (type === 'mil') { if (to === WI || this.isReserve(to) && false) break; if (sub === 'A' ? a.p.milA > 0 : sub === 'U' ? a.p.milU > 0 : (a.p.milA + a.p.milU) > 0) { const act = sub === 'A' ? true : sub === 'U' ? false : (a.p.milU > 0 ? false : true); if (act) { a.p.milA--; b.p.milA++; } else { a.p.milU--; b.p.milU++; } moved++; } else break; }
        else break;
      } else if (f === 'indians') {
        if (type === 'wp') { if (this.isCity(to) || to === WI) break; if (sub === 'A' ? a.i.wpA > 0 : sub === 'U' ? a.i.wpU > 0 : (a.i.wpA + a.i.wpU) > 0) { const act = sub === 'A' ? true : sub === 'U' ? false : (a.i.wpU > 0 ? false : true); if (act) { a.i.wpA--; b.i.wpA++; } else { a.i.wpU--; b.i.wpU++; } moved++; } else break; }
        else break;
      }
    }
    if (moved) { this.say(`${FR[f]} : ${moved} ${type} ${from} → ${to}`); const a2 = this.sp(to); this.emit({ t: 'move', f, type, from, to, k: moved, sub: sub || null, toU: type === 'mil' ? a2.p.milU : type === 'wp' ? a2.i.wpU : 0, toA: type === 'mil' ? a2.p.milA : type === 'wp' ? a2.i.wpA : 0 }); this.checkLeader(f, from); }
    return moved;
  }
  activateMilitia(n, count) { const s = this.sp(n); const k = Math.min(count, s.p.milU); s.p.milU -= k; s.p.milA += k; if (k) { this.say(`${n} : ${k} Milice(s) activée(s)`); this.emit({ t: 'flip', n, kind: 'mil', active: true, k }); } return k; }
  undergroundMilitia(n, count) { const s = this.sp(n); const k = Math.min(count === undefined ? 99 : count, s.p.milA); s.p.milA -= k; s.p.milU += k; if (k) { this.say(`${n} : ${k} Milice(s) passent Underground`); this.emit({ t: 'flip', n, kind: 'mil', active: false, k }); } return k; }
  activateWP(n, count) { const s = this.sp(n); const k = Math.min(count, s.i.wpU); s.i.wpU -= k; s.i.wpA += k; if (k) { this.say(`${n} : ${k} War Party(ies) activée(s)`); this.emit({ t: 'flip', n, kind: 'wp', active: true, k }); } return k; }
  undergroundWP(n, count) { const s = this.sp(n); const k = Math.min(count === undefined ? 99 : count, s.i.wpA); s.i.wpA -= k; s.i.wpU += k; if (k) { this.say(`${n} : ${k} War Party(ies) passent Underground`); this.emit({ t: 'flip', n, kind: 'wp', active: false, k }); } return k; }
  placeMarker(kind, n) { // 'raid' | 'prop' ; 12 de chaque
    const used = MAP_SPACES.reduce((a, x) => a + this.sp(x)[kind], 0);
    if (used >= 12) { this.say(`Plus de marqueur ${kind === 'raid' ? 'Raid' : 'Propaganda'} disponible`); return false; }
    this.sp(n)[kind]++; this.say(`Marqueur ${kind === 'raid' ? 'Raid' : 'Propaganda'} placé en ${n}`); this.emit({ t: 'marker', kind, n, delta: 1 }); return true;
  }
  markersOnMap(kind) { return MAP_SPACES.reduce((a, x) => a + this.sp(x)[kind], 0); }
  forts(f) { return MAP_SPACES.reduce((a, x) => a + (f === 'british' ? this.sp(x).b.fort : this.sp(x).p.fort), 0) + (f === 'british' ? this.sp(WI).b.fort : 0); }
  villages() { return MAP_SPACES.reduce((a, x) => a + this.sp(x).i.vil, 0); }
  countOnMap(f, type, sub) {
    let t = 0;
    for (const n of SPACE_NAMES) { const s = this.sp(n);
      if (f === 'british') t += s.b[type];
      else if (f === 'french') t += s.f.reg;
      else if (f === 'patriots') t += type === 'mil' ? (sub === 'U' ? s.p.milU : sub === 'A' ? s.p.milA : s.p.milU + s.p.milA) : s.p[type];
      else if (f === 'indians') t += type === 'wp' ? (sub === 'U' ? s.i.wpU : sub === 'A' ? s.i.wpA : s.i.wpU + s.i.wpA) : s.i.vil;
    }
    return t;
  }
  factionPiecesOnMap(f) { return MAP_SPACES.reduce((a, x) => a + this.factionPieces(f, x), 0) + this.factionPieces(f, WI); }

  // ------------------------------------------------------------------ utilitaires de choix
  argmax(arr, fn) { let best = -Infinity, out = []; for (const x of arr) { const v = fn(x); if (v > best) { best = v; out = [x]; } else if (v === best) out.push(x); } return out; }
  // tri par liste de priorités (chaque fn : plus grand = mieux), égalités tranchées au hasard (8.2)
  rank(arr, fns) {
    const keyed = arr.map(x => ({ x, k: fns.map(f => f(x)), r: this.rng() }));
    keyed.sort((a, b) => { for (let i = 0; i < a.k.length; i++) { if (a.k[i] !== b.k[i]) return b.k[i] - a.k[i]; } return a.r - b.r; });
    return keyed.map(o => o.x);
  }

  // ------------------------------------------------------------------ 7. Victoire
  margins() {
    const S = this.totalSupport(), O = this.totalOpposition(), st = this.state;
    const pf = this.forts('patriots'), v = this.villages();
    return {
      british: { c1: S - O - 10, c2: st.crc - st.cbc, total: S - O + st.crc - st.cbc },
      patriots: { c1: O - S - 10, c2: pf + 3 - v, total: O - S + pf + 3 - v },
      french: { c1: O - S - 10, c2: st.cbc - st.crc, total: O - S + st.cbc - st.crc, toa: st.toa },
      indians: { c1: S - O - 10, c2: v - 3 - pf, total: S - O + v - 3 - pf },
    };
  }
  victoryCheck() { // 7.2 : les deux conditions > 0
    const m = this.margins(); const winners = [];
    for (const f of FACTIONS) { if (m[f].c1 > 0 && m[f].c2 > 0 && (f !== 'french' || this.state.toa)) winners.push(f); }
    return winners;
  }

  // ------------------------------------------------------------------ 3.6 Bataille
  /* attacker : faction qui exécute ; opts : { payPatriots, payFrench, forceBonus, defLossMod, attLossMod, activateFn(side, n) }
   * Retourne { winner:'royalist'|'rebellion'|null, lossesA, lossesR, removedA, removedR } */
  battle(n, attacker, opts) {
    opts = opts || {}; n = normSpace(n);
    const s = this.sp(n); const st = this.state;
    const attSide = SIDE[attacker], defSide = attSide === 'royalist' ? 'rebellion' : 'royalist';
    this.emit({ t: 'battle', n, attacker });
    return this.group(`Bataille en ${n} — attaquant : ${FR[attacker]}`, () => {
      // 4.2.1 Common Cause : War Parties utilisées comme Tories (activées)
      if (opts.commonCause) { this.say(`Common Cause : ${opts.commonCause} War Party(ies) utilisée(s) comme Tories`); this.activateWP(n, Math.max(0, opts.commonCause - s.i.wpA)); }
      // 3.6.3 Activation des unités Underground (décision du camp)
      this._battleActivate(n, attacker, attSide, true, opts);
      this._battleActivate(n, attacker, defSide, false, opts);
      // Force levels
      const attFL = this._forceLevel(n, attacker, attSide, true, opts);
      const defFL = this._forceLevel(n, attacker, defSide, false, opts);
      this.say(`Force Level attaquant ${attFL.fl} (${attFL.detail}) ; défenseur ${defFL.fl} (${defFL.detail})`);
      const rollFor = (fl) => { const dice = Math.min(3, Math.floor(fl / 3)); if (fl <= 2) return 0; let t = 0; for (let i = 0; i < dice; i++) t += this.d3(); return t; };
      // 3.6.5 modificateurs du Loss Level du défenseur (résultat du jet de l'attaquant)
      let defMod = 0; const dm = [];
      const attPieces = this._sidePieceCounts(n, attSide, attacker, true);
      if (attPieces.total > 0 && attPieces.regulars * 2 >= attPieces.total) { defMod++; dm.push('½ attaquants Regulars +1'); }
      if (attPieces.underground > 0) { defMod++; dm.push('Underground attaquant +1'); }
      if (attPieces.leaders > 0) { defMod++; dm.push('Leader attaquant +1'); }
      if (attSide === 'rebellion' && this.leaderAt('french', n) && st.leaders.french.name === 'Lauzun' && (attacker === 'french' || opts.payFrench)) { defMod++; dm.push('Lauzun +1'); }
      if (attacker === 'british' && this.blockaded(n)) { defMod--; dm.push('Brit. attaque ville bloquée −1'); }
      if (attacker === 'british' && n === WI && st.wiSquadrons > 0) { defMod--; dm.push('Squadron aux Antilles −1'); }
      const defForts = defSide === 'rebellion' ? s.p.fort : s.b.fort;
      if (defForts) { defMod -= defForts; dm.push(`Fort(s) défenseur −${defForts}`); }
      if (defSide === 'royalist' && this.isReserve(n) && this.indianPieces(n) > 0) { defMod--; dm.push('Indiens défendent en Réserve −1'); }
      if (defSide === 'rebellion' && this.leaderAt('patriots', n)) { defMod--; dm.push('Washington défend −1'); }
      if (opts.defLossMod) { defMod += opts.defLossMod; dm.push(`événement ${opts.defLossMod > 0 ? '+' : ''}${opts.defLossMod}`); }
      // 3.6.6 modificateurs du Loss Level de l'attaquant (jet du défenseur)
      let attMod = 0; const am = [];
      const defPieces = this._sidePieceCounts(n, defSide, null, false);
      if (defPieces.total > 0 && defPieces.regulars * 2 >= defPieces.total) { attMod++; am.push('½ défenseurs Regulars +1'); }
      if (defPieces.underground > 0) { attMod++; am.push('Underground défenseur +1'); }
      if (defPieces.leaders > 0) { attMod++; am.push('Leader défenseur +1'); }
      if (defSide === 'royalist' && this.blockaded(n)) { attMod--; am.push('Brit. défend ville bloquée −1'); }
      if (defSide === 'royalist' && n === WI && st.wiSquadrons > 0) { attMod--; am.push('Squadron aux Antilles −1'); }
      if (defForts) { attMod += defForts; am.push(`Fort(s) défenseur +${defForts}`); }
      if (opts.attLossMod) { attMod += opts.attLossMod; am.push(`événement ${opts.attLossMod > 0 ? '+' : ''}${opts.attLossMod}`); }
      const attRoll = rollFor(attFL.fl), defRoll = rollFor(defFL.fl);
      const defLoss = attRoll + defMod, attLoss = defRoll + attMod;
      this.say(`Loss Level du défenseur : ${attRoll} ${defMod >= 0 ? '+' : '−'} ${Math.abs(defMod)} = ${defLoss} (${dm.join(', ') || 'aucun modificateur'})`);
      this.say(`Loss Level de l'attaquant : ${defRoll} ${attMod >= 0 ? '+' : '−'} ${Math.abs(attMod)} = ${attLoss} (${am.join(', ') || 'aucun modificateur'})`);
      // 3.6.7 Retraits : attaquant puis défenseur
      const removedA = this._battleRemove(n, attSide, attLoss, false);
      const removedR = this._battleRemove(n, defSide, defLoss, true);
      // 3.6.8 Win the Day
      const aliveA = this._sideAliveCount(n, attSide), aliveD = this._sideAliveCount(n, defSide);
      let winner = null;
      if (aliveA === 0 && aliveD === 0) winner = null;
      else if (aliveD === 0) winner = attSide;
      else if (aliveA === 0) winner = defSide;
      else winner = removedA.pieces < removedR.pieces ? attSide : removedR.pieces < removedA.pieces ? defSide : defSide;
      const loserRem = winner === attSide ? removedR : winner === defSide ? removedA : null;
      const result = { winner, loser: winner ? (winner === attSide ? defSide : attSide) : null, removedA, removedR, space: n, attSide, defSide, winTheDay: false, shifts: 0 };
      if (winner && loserRem && n !== WI && (loserRem.cubesOrForts > 0) && loserRem.pieces >= 2) {
        result.winTheDay = true;
        let shifts = Math.min(3, Math.floor(loserRem.pieces / 2));
        if (winner === 'rebellion' && this.leaderAt('patriots', n)) shifts = Math.min(6, shifts * 2);
        result.shifts = shifts;
        this.say(`Win the Day pour ${winner === 'royalist' ? 'les Royalistes' : 'la Rébellion'} : ${shifts} décalage(s)`);
      } else this.say(winner ? `Vainqueur : ${winner === 'royalist' ? 'Royalistes' : 'Rébellion'} (pas de Win the Day)` : 'Aucun vainqueur');
      return result;
    });
  }
  // Activation en bataille (bot) : activer pour maximiser les dés tout en gardant un Underground pour le +1 (3.6.3 exemple) ; 8.7.9 Indiens défendant avec Village : tout sauf 1
  _battleActivate(n, attacker, side, isAtt, opts) {
    const s = this.sp(n);
    const canUseIrregulars = side === 'royalist' ? (isAtt ? attacker === 'british' : true) : (isAtt ? (attacker === 'patriots' || opts.payPatriots) : true);
    if (!canUseIrregulars) return;
    if (opts.activateFn) { opts.activateFn(side, n, isAtt); return; }
    if (side === 'royalist') {
      if (!isAtt && s.i.vil > 0 && s.i.wpU > 1) { this.activateWP(n, s.i.wpU - 1); return; } // 8.7.9
      this._smartActivate(n, s.i.wpU, s.i.wpA, this._cubesFor(n, 'royalist', attacker, isAtt, opts), k => this.activateWP(n, k));
    } else {
      this._smartActivate(n, s.p.milU, s.p.milA, this._cubesFor(n, 'rebellion', attacker, isAtt, opts), k => this.activateMilitia(n, k));
    }
  }
  _smartActivate(n, ug, act, cubes, doIt) {
    if (ug === 0) return;
    let best = 0, bestDice = Math.min(3, Math.floor((cubes + Math.floor(act / 2)) / 3));
    for (let k = 1; k <= ug - 1; k++) { const d = Math.min(3, Math.floor((cubes + Math.floor((act + k) / 2)) / 3)); if (d > bestDice) { bestDice = d; best = k; } }
    if (best > 0) doIt(best);
  }
  _cubesFor(n, side, attacker, isAtt, opts) {
    const s = this.sp(n);
    if (side === 'royalist') { if (isAtt) return s.b.reg + Math.min(s.b.tor, s.b.reg); return s.b.reg + s.b.tor + s.b.fort; }
    if (isAtt) { if (attacker === 'patriots') return s.p.cont + (opts.payFrench ? Math.min(s.f.reg, s.p.cont) : 0); return s.f.reg + (opts.payPatriots ? Math.min(s.p.cont, s.f.reg) : 0); }
    return s.p.cont + s.f.reg + s.p.fort;
  }
  // Estimation sans dés (8.4.4, 8.5.1, 8.6.6) : Force Level + modificateurs de chaque camp
  battleEstimate(n, attacker, opts) {
    opts = opts || {}; const attSide = SIDE[attacker], defSide = attSide === 'royalist' ? 'rebellion' : 'royalist';
    const g = this.clone(); g.silent = true;
    g._battleActivate(n, attacker, attSide, true, opts); g._battleActivate(n, attacker, defSide, false, opts);
    const att = g._forceLevel(n, attacker, attSide, true, opts).fl + g._mods(n, attacker, attSide, defSide, opts).defMod;
    const def = g._forceLevel(n, attacker, defSide, false, opts).fl + g._mods(n, attacker, attSide, defSide, opts).attMod;
    return { att, def };
  }
  _mods(n, attacker, attSide, defSide, opts) {
    const s = this.sp(n), st = this.state; let defMod = 0, attMod = 0;
    const attPieces = this._sidePieceCounts(n, attSide, attacker, true);
    if (attPieces.total > 0 && attPieces.regulars * 2 >= attPieces.total) defMod++;
    if (attPieces.underground > 0) defMod++;
    if (attPieces.leaders > 0) defMod++;
    if (attSide === 'rebellion' && this.leaderAt('french', n) && st.leaders.french.name === 'Lauzun' && (attacker === 'french' || opts.payFrench)) defMod++;
    if (attacker === 'british' && this.blockaded(n)) defMod--;
    if (attacker === 'british' && n === WI && st.wiSquadrons > 0) defMod--;
    const defForts = defSide === 'rebellion' ? s.p.fort : s.b.fort;
    defMod -= defForts;
    if (defSide === 'royalist' && this.isReserve(n) && this.indianPieces(n) > 0) defMod--;
    if (defSide === 'rebellion' && this.leaderAt('patriots', n)) defMod--;
    const defPieces = this._sidePieceCounts(n, defSide, null, false);
    if (defPieces.total > 0 && defPieces.regulars * 2 >= defPieces.total) attMod++;
    if (defPieces.underground > 0) attMod++;
    if (defPieces.leaders > 0) attMod++;
    if (defSide === 'royalist' && this.blockaded(n)) attMod--;
    if (defSide === 'royalist' && n === WI && st.wiSquadrons > 0) attMod--;
    attMod += defForts;
    return { defMod, attMod };
  }
  _forceLevel(n, attacker, side, isAtt, opts) {
    const s = this.sp(n); let fl = 0; const d = [];
    if (side === 'royalist') {
      if (isAtt) { fl += s.b.reg; d.push(`${s.b.reg} Reg`); const t = Math.min(s.b.tor + (opts.commonCause || 0), s.b.reg); fl += t; d.push(`${t} Tories${opts.commonCause ? ' (dont Common Cause)' : ''}`); const w = Math.floor(Math.max(0, s.i.wpA - (opts.commonCause || 0)) / 2); fl += w; d.push(`${w} (½ WP actives)`); }
      else { fl += s.b.reg + s.b.tor + s.b.fort; d.push(`${s.b.reg} Reg, ${s.b.tor} Tories, ${s.b.fort} Fort`); const w = Math.floor(s.i.wpA / 2); fl += w; d.push(`${w} (½ WP actives)`); }
    } else {
      if (isAtt) {
        if (attacker === 'patriots') { fl += s.p.cont; d.push(`${s.p.cont} Cont`); if (opts.payFrench) { const x = Math.min(s.f.reg, s.p.cont); fl += x; d.push(`${x} Reg fr.`); } const m = Math.floor(s.p.milA / 2); fl += m; d.push(`${m} (½ Milices actives)`); }
        else { fl += s.f.reg; d.push(`${s.f.reg} Reg fr.`); if (opts.payPatriots) { const x = Math.min(s.p.cont, s.f.reg); fl += x; d.push(`${x} Cont`); const m = Math.floor(s.p.milA / 2); fl += m; d.push(`${m} (½ Milices actives)`); } }
      } else { fl += s.p.cont + s.f.reg + s.p.fort; d.push(`${s.p.cont} Cont, ${s.f.reg} Reg fr., ${s.p.fort} Fort`); const m = Math.floor(s.p.milA / 2); fl += m; d.push(`${m} (½ Milices actives)`); }
    }
    if (isAtt && opts.forceBonus) { fl += opts.forceBonus; d.push(`+${opts.forceBonus} événement`); }
    return { fl, detail: d.join(', ') };
  }
  _sidePieceCounts(n, side, attacker, isAtt) {
    const s = this.sp(n);
    if (side === 'royalist') {
      const total = s.b.reg + s.b.tor + s.b.fort + s.i.wpU + s.i.wpA + s.i.vil;
      return { total, regulars: s.b.reg, underground: s.i.wpU, leaders: this.royalistLeaders(n) };
    }
    const total = s.p.cont + s.p.milU + s.p.milA + s.p.fort + s.f.reg;
    return { total, regulars: s.f.reg, underground: s.p.milU, leaders: this.rebellionLeaders(n) }; // 3.6.5 : seuls les Regulars (pas les Continentals) comptent pour le modificateur
  }
  _sideAliveCount(n, side) { const s = this.sp(n); return side === 'royalist' ? s.b.reg + s.b.tor + s.b.fort + s.i.wpA + s.i.vil : s.p.cont + s.p.milA + s.p.fort + s.f.reg; }
  // 3.6.7 retraits par priorités
  _battleRemove(n, side, loss, defending) {
    const s = this.sp(n); let need = loss; const out = { pieces: 0, cubesOrForts: 0 };
    const rm = (f, type, cas) => { this.remove(f, type, n, 1, cas ? 'casualties' : 'available', type === 'mil' || type === 'wp' ? 'A' : undefined); out.pieces++; if (type !== 'mil' && type !== 'wp' && type !== 'vil') out.cubesOrForts++; need -= (type === 'reg' || type === 'cont' || type === 'fort') ? 2 : 1; };
    if (need <= 0) { this.say(`${side === 'royalist' ? 'Royalistes' : 'Rébellion'} : aucune perte`); return out; }
    if (side === 'royalist') {
      let turnReg = true;
      while (need > 0 && (s.b.reg > 0 || s.b.tor > 0)) { if (turnReg && s.b.reg > 0) rm('british', 'reg', true); else if (!turnReg && s.b.tor > 0) rm('british', 'tor', true); else if (s.b.reg > 0) rm('british', 'reg', true); else rm('british', 'tor', true); turnReg = !turnReg; }
      while (need > 0 && s.i.wpA > 0) rm('indians', 'wp', false);
      if (defending) { while (need > 0 && s.i.vil > 0) rm('indians', 'vil', false); while (need > 0 && s.b.fort > 0) rm('british', 'fort', true); }
    } else {
      let turn = 0; // 0 fr, 1 cont, 2 milice active
      while (need > 0 && (s.f.reg > 0 || s.p.cont > 0 || s.p.milA > 0)) {
        let done = false;
        for (let k = 0; k < 3 && !done; k++) { const t = (turn + k) % 3; if (t === 0 && s.f.reg > 0) { rm('french', 'reg', true); done = true; turn = 1; } else if (t === 1 && s.p.cont > 0) { rm('patriots', 'cont', true); done = true; turn = 2; } else if (t === 2 && s.p.milA > 0) { rm('patriots', 'mil', false); done = true; turn = 0; } }
        if (!done) break;
      }
      if (defending) { while (need > 0 && s.p.fort > 0) rm('patriots', 'fort', true); }
    }
    this.say(`${side === 'royalist' ? 'Royalistes' : 'Rébellion'} : ${out.pieces} pièce(s) retirée(s)`);
    return out;
  }
}

// --------------------------------------------------------------- scénarios (pages 37-39)
function scenario(name) {
  const st = newState();
  const S = (n, o) => { const s = st.spaces[normSpace(n)]; Object.assign(s.b, o.b || {}); Object.assign(s.p, o.p || {}); Object.assign(s.f, o.f || {}); Object.assign(s.i, o.i || {}); if (o.sup !== undefined) s.sup = o.sup; };
  if (name === 'people_numerous_armed') {
    st.resources = { british: 6, patriots: 3, french: 5, indians: 0 };
    st.wqTotal = 6; st.release = [{ reg: 6, tor: 6 }, { reg: 6, tor: 6 }];
    S('Quebec City', { b: { reg: 1, tor: 1 }, sup: 1 });
    S('Boston', { b: { reg: 3, fort: 1 }, sup: 1 }); st.leaders.british.loc = 'Boston';
    S('New York City', { b: { tor: 1 }, sup: 1 });
    S('Philadelphia', { p: { milU: 1 } });
    S('Quebec', { b: { tor: 2, fort: 1 }, i: { wpU: 1 } });
    S('Northwest', { i: { wpU: 2 } }); st.leaders.indians.loc = 'Northwest';
    S('Southwest', { i: { wpU: 1 } });
    S('Massachusetts', { p: { cont: 1, milU: 1, fort: 1 }, sup: -2 }); st.leaders.patriots.loc = 'Massachusetts';
    S('Florida', { b: { reg: 1, fort: 1 }, i: { wpU: 1 } });
    S('New York', { b: { reg: 1, tor: 2 }, p: { milU: 1 }, i: { wpU: 1 } });
    S('Virginia', { p: { milU: 1 } });
    st.available = { british: { reg: 7, tor: 7, fort: 3 }, patriots: { cont: 19, mil: 11, fort: 5 }, french: { reg: 0 }, indians: { wp: 9, vil: 12 } };
    st.unavailable = { british: { reg: 12, tor: 12 }, french: { reg: 15, sq: 3 } };
  } else if (name === 'british_return_ny') {
    st.resources = { british: 5, patriots: 2, french: 5, indians: 0 }; st.cbc = 1; st.crc = 3;
    st.wqTotal = 4; st.release = [{ reg: 6, tor: 6 }];
    S('Quebec City', { b: { reg: 1, tor: 1 }, sup: 1 });
    S('Boston', { sup: -1 });
    S('New York City', { b: { reg: 6, fort: 1 }, p: { cont: 1 }, sup: 1 }); st.leaders.british = { name: 'Howe', loc: 'New York City' };
    S('Philadelphia', { p: { milU: 1 } });
    S('Charles Town', { p: { cont: 2, fort: 1 } });
    S('Quebec', { b: { reg: 1, tor: 1, fort: 1 }, p: { milU: 1 }, i: { wpU: 1, vil: 1 } });
    S('Northwest', { i: { wpU: 1 } });
    S('Southwest', { i: { wpU: 1, vil: 1 } });
    S('Florida', { b: { reg: 1, fort: 1 }, i: { wpU: 2 } });
    S('Massachusetts', { p: { cont: 1, milU: 1, fort: 1 }, sup: -2 });
    S('New York', { b: { reg: 3, tor: 3 }, p: { cont: 3 }, i: { wpU: 2 } }); st.leaders.patriots.loc = 'New York'; st.leaders.indians.loc = 'New York';
    S('Virginia', { b: { tor: 2 } });
    S('North Carolina', { p: { cont: 1, milU: 1 }, i: { wpU: 1 } });
    S('South Carolina', { b: { tor: 2 } });
    S('Georgia', { p: { milU: 1 } });
    st.wiSquadrons = 2;
    st.available = { british: { reg: 7, tor: 10, fort: 3 }, patriots: { cont: 12, mil: 10, fort: 4 }, french: { reg: 6 }, indians: { wp: 7, vil: 10 } };
    st.unavailable = { british: { reg: 6, tor: 6 }, french: { reg: 9, sq: 1 } };
  } else if (name === 'southern_campaign') {
    st.resources = { british: 6, patriots: 3, french: 8, indians: 2 }; st.cbc = 10; st.crc = 12; st.toa = true;
    st.wqTotal = 3; st.release = [];
    S('Florida', { b: { reg: 1, fort: 1 }, i: { wpU: 1, vil: 1 } });
    S('New Hampshire', { b: { tor: 2 }, sup: 2 });
    S('Massachusetts', { p: { fort: 1 }, sup: -2 });
    S('Connecticut-Rhode Island', { b: { tor: 2 }, p: { fort: 1 }, f: { reg: 4 }, sup: -2 }); st.leaders.french.loc = 'Connecticut-Rhode Island';
    S('New York', { b: { reg: 4, tor: 2 }, p: { milU: 1 }, i: { wpU: 1, vil: 1 }, sup: 2 });
    S('Pennsylvania', { p: { cont: 5, milU: 2, fort: 1 }, i: { wpU: 1 }, sup: -1 }); st.leaders.patriots.loc = 'Pennsylvania';
    S('Maryland-Delaware', { sup: 1 });
    S('North Carolina', { p: { milU: 2 }, sup: -1 });
    S('South Carolina', { p: { milU: 2 }, i: { wpU: 1, vil: 1 } });
    S('Quebec City', { b: { reg: 2, tor: 2 }, sup: 2 });
    S('Boston', { p: { cont: 2 }, sup: -1 });
    S('West Indies', { f: { reg: 3 } }); st.wiSquadrons = 3;
    S('New York City', { b: { reg: 5, tor: 3, fort: 1 }, sup: 2 }); st.leaders.british = { name: 'Clinton', loc: 'New York City' };
    S('Philadelphia', { b: { reg: 4, tor: 2 }, sup: 2 });
    S('Norfolk', { p: { milU: 1 } });
    S('Charles Town', { p: { milU: 2, fort: 1 }, sup: -2 });
    S('Savannah', { b: { tor: 2 }, sup: 1 });
    S('Quebec', { b: { reg: 2, tor: 2, fort: 1 }, i: { wpU: 1, vil: 1 } });
    S('Northwest', { i: { wpU: 1, vil: 1 } }); st.leaders.indians = { name: 'Cornplanter', loc: 'Northwest' };
    S('New Jersey', { p: { cont: 2, milU: 4 }, sup: -1 });
    S('Southwest', { i: { wpU: 1, vil: 1 } });
    st.available = { british: { reg: 7, tor: 8, fort: 3 }, patriots: { cont: 11, mil: 1, fort: 2 }, french: { reg: 8 }, indians: { wp: 8, vil: 6 } };
    st.unavailable = { british: { reg: 0, tor: 0 }, french: { reg: 0, sq: 0 } };
    st.bs.french = true;
  }
  return st;
}

// Vérifie la cohérence des totaux de pièces (page 35) — renvoie la liste des écarts
function checkPools(g) {
  const st = g.state; const out = [];
  const tot = (f, type, sub) => g.countOnMap(f, type, sub) + (st.available[f][type] || 0) + ((st.unavailable[f] && st.unavailable[f][type]) || 0) + ((st.casualties[f] && st.casualties[f][type]) || 0);
  const chk = (label, v, exp) => { if (v !== exp) out.push(`${label} : ${v} (attendu ${exp})`); };
  chk('Regulars britanniques', tot('british', 'reg'), 25); chk('Tories', tot('british', 'tor'), 25); chk('Forts britanniques', tot('british', 'fort'), 6);
  chk('Continentals', tot('patriots', 'cont'), 20); chk('Milices', tot('patriots', 'mil'), 15); chk('Forts patriotes', tot('patriots', 'fort'), 6);
  chk('Regulars français', tot('french', 'reg'), 15); chk('Squadrons/Blocus', st.wiSquadrons + st.unavailable.french.sq + st.fni, 3);
  chk('War Parties', tot('indians', 'wp'), 15); chk('Villages', tot('indians', 'vil'), 12);
  return out;
}

const LOD = { FACTIONS, SIDE, FR, WI, SPACES, SPACE_NAMES, MAP_SPACES, CITIES, COLONIES, RESERVES, PROVINCES, POOL, LEADER_SEQ, normSpace, newState, Game, scenario, checkPools, makeRng, emptySpace };
if (typeof module !== 'undefined' && module.exports) module.exports = LOD; else root.LOD = LOD;
})(typeof window !== 'undefined' ? window : globalThis);
