const LOD = require('../cards.js');
let errors = {}; let count = 0;
for (let seed = 1; seed <= 12; seed++) {
  for (const scen of ['people_numerous_armed', 'british_return_ny', 'southern_campaign']) {
    const st = LOD.scenario(scen); st.seed = seed; const g = new LOD.Game(st, {});
    // avancer quelques cartes au hasard
    const ids = g.shuffle([...Array(96).keys()].map(i => i + 1)).slice(0, 8);
    for (const id of ids) { const gen = LOD.Turn.run(g, LOD.CARDS[id], LOD.CARDS[ids[0]]); let r = gen.next(); while (!r.done) r = gen.next({ choice: 'pass' }); }
    for (let id = 1; id <= 96; id++) for (const f of LOD.FACTIONS) for (const which of ['unshaded', 'shaded']) {
      const card = LOD.CARDS[id]; if (which === 'shaded' && !card.shaded) continue;
      const sim = g.clone(); sim.silent = false; sim.log = [];
      try { LOD.Events.execute(sim, f, card, which, {}); const inv = LOD.checkPools(sim); if (inv.length) throw new Error('pools ' + inv.join('; ')); count++; }
      catch (e) { const k = id + which + f; if (!errors[k]) { errors[k] = e.stack.split('\n').slice(0, 3).join(' | '); } }
      try { LOD.Events.evaluate(g, f, card, which, {}); } catch (e) { errors['eval' + id] = e.message; }
    }
  }
}
console.log('exécutions OK :', count); for (const k in errors) console.log(k, errors[k]);
