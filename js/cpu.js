/* KURSI CLASH - cpu: opponent AI, 3 difficulties. */
window.KC = window.KC || {};

KC.CPU = class {
  constructor(difficulty) {
    this.d = difficulty; // 0 easy, 1 normal, 2 hard
    this.decisionT = 0;
    this.intent = { move: 0, punch: false, kick: false, sweep: false, block: false, super: false };
    this.cfg = [
      { react: 0.45, aggro: 0.35, blockCh: 0.10, superCh: 0.25, walkSp: 0.8 },
      { react: 0.28, aggro: 0.55, blockCh: 0.25, superCh: 0.55, walkSp: 1.0 },
      { react: 0.14, aggro: 0.75, blockCh: 0.45, superCh: 0.85, walkSp: 1.2 },
    ][difficulty];
  }

  update(dt, me, foe, fight) {
    const c = this.cfg;
    this.decisionT -= dt;
    const i = this.intent;
    i.punch = i.kick = i.sweep = i.super = false;
    i.block = false; i.move = 0;
    if (me.busy() || fight.cinematic.active) return;

    const dist = Math.abs(foe.x - me.x);
    const dir = Math.sign(foe.x - me.x);

    // react to foe attacking
    if (foe.attacking && this.decisionT <= 0 && Math.random() < c.blockCh) {
      i.block = true; this.decisionT = c.react;
      return;
    }
    if (this.decisionT > 0) return;

    // super when ready
    if (me.shakti >= 1 && dist < 3.4 && Math.random() < c.superCh) {
      i.super = true; this.decisionT = c.react * 2; return;
    }
    if (dist > 2.2) {
      i.move = dir * c.walkSp;
      if (Math.random() < 0.02 * c.aggro) i.move = 0;
      this.decisionT = 0.12 + Math.random() * 0.2;
    } else {
      const r = Math.random();
      if (r < c.aggro * 0.5) { i.punch = true; }
      else if (r < c.aggro * 0.8) { i.kick = true; }
      else if (r < c.aggro) { i.sweep = true; }
      else if (r < c.aggro + 0.15) { i.move = -dir; } // back off
      else { i.block = true; }
      this.decisionT = c.react * (0.7 + Math.random() * 0.8);
    }
  }
};
