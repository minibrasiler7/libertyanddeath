// Simulation automatique : 4 bots, cartes au hasard, pour détecter les erreurs
const LOD = require('../cards.js');
function makeDeck(g, rng) { const ids = []; for (let i = 1; i <= 96; i++) ids.push(i); const sh = g.shuffle(ids); const deck = []; let w = 97; const total = g.state.wqTotal;
  for (let c = 0; c < total; c++) { const pile = sh.slice(c * 10, c * 10 + 10); const pos = 6 + Math.floor(rng() * 4); pile.splice(pos, 0, w++); deck.push(...pile); } return deck; }
function invariants(g) { const out = []; const st = g.state;
  for (const n of LOD.SPACE_NAMES) { const s = g.sp(n); for (const k of ['b','p','f','i']) for (const t in s[k]) if (s[k][t] < 0) out.push(`${n}.${k}.${t}<0`); if (s.sup < -2 || s.sup > 2) out.push(n+' sup'); if (g.rawPop(n) === 0 && s.sup !== 0) out.push(n+' pop0 sup'); if (n !== 'West Indies' && s.b.fort + s.p.fort + s.i.vil > 2) out.push(n+' stacking'); if (g.isCity(n) && (s.i.wpU+s.i.wpA+s.i.vil) > 0) out.push(n+' indians in city'); if (s.blk<0) out.push(n+' blk'); }
  for (const f of LOD.FACTIONS) { for (const t in st.available[f]) if (st.available[f][t] < 0) out.push('avail '+f+t); const L = st.leaders[f]; if (L.loc && g.factionPieces(f, L.loc) === 0) out.push('leader alone '+f+' '+L.loc); }
  const blk = LOD.CITIES.reduce((a,c)=>a+g.sp(c).blk,0); if (blk !== st.fni) out.push('fni '+st.fni+' blk '+blk);
  if (g.markersOnMap('raid')>12||g.markersOnMap('prop')>12) out.push('markers');
  return out; }
function run(seed, scenario, verbose) {
  const st = LOD.scenario(scenario); st.seed = seed; const g = new LOD.Game(st, {});
  const deck = makeDeck(g, g.rng); let steps = 0;
  for (let i = 0; i < deck.length; i++) {
    const card = LOD.CARDS[deck[i]], next = LOD.CARDS[deck[i + 1]];
    const gen = LOD.Turn.run(g, card, next); let r = gen.next();
    while (!r.done) { r = gen.next({ choice: 'pass' }); }
    steps++;
    const inv = invariants(g); if (inv.length) { console.log('INVARIANT seed', seed, 'card', card.id, inv); return false; }
    const pools = LOD.checkPools(g); if (pools.length) { console.log('POOL MISMATCH seed', seed, 'card', card.id, pools); return false; }
    for (const f of LOD.FACTIONS) if (g.state.resources[f] < 0 || g.state.resources[f] > 50) { console.log('RES out of range', seed, f); return false; }
    if (r.value && r.value.gameOver) break;
  }
  if (verbose) console.log(g.log.map(l => ' '.repeat(l.depth * 2) + l.msg).join('\n'));
  return true;
}
const seed = +process.argv[2] || 1; const n = +process.argv[3] || 1; const scen = process.argv[4] || 'people_numerous_armed';
let ok = 0; for (let s = seed; s < seed + n; s++) { try { if (run(s, scen, n === 1)) ok++; } catch (e) { console.log('ERROR seed', s, e.stack.split('\n').slice(0, 4).join('\n')); } }
console.log(`${ok}/${n} simulations OK`);
