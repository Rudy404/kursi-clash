/* KURSI CLASH - fight: rounds, movement, combat, shakti, supers, cinematics hook. */
window.KC = window.KC || {};

KC.Fighter = class {
  constructor(def, f3d, side) {
    this.def = def; this.f3d = f3d;
    this.side = side;
    this.facing = side === 0 ? 1 : -1;
    this.x = side === 0 ? -2.2 : 2.2;
    this.vx = 0; this.liftY = 0; this.liftV = 0; this.airborne = false;
    this.hp = 1; this.shakti = 0;
    this.state = 'idle'; this.stateT = 0; this.stateDur = 0;
    this.attack = null; this.attacking = false;
    this.blocking = false;
    this.comboCount = 0; this.lastHitT = 0;
    this.pendingSuper = null;
    this._lowCalled = false;
  }
  busy() { return ['punch', 'kick', 'grab', 'hurt', 'super', 'launched', 'ko'].includes(this.state) && this.stateT < this.stateDur; }
  grounded() { return !this.airborne && this.liftY <= 0.01; }
};

KC.Fight = class {
  constructor(scene, stageDef, f1def, f2def, mode, cpuLevel) {
    this.scene = scene; this.stageDef = stageDef;
    this.mode = mode; // 'cpu' | 'local' | 'friend'
    this.fx = new KC.FX(scene);
    this.p1 = new KC.Fighter(f1def, new KC.Fighter3D(f1def, false), 0);
    this.p2 = new KC.Fighter(f2def, new KC.Fighter3D(f2def, true), 1);
    scene.add(this.p1.f3d.root); scene.add(this.p2.f3d.root);
    this.cpu = mode === 'cpu' ? new KC.CPU(cpuLevel) : null;
    this.cinematic = new KC.Cinematic(this);
    this.round = 1; this.wins = [0, 0];
    this.timeLeft = 60;
    this.phase = 'intro'; this.phaseT = 0;
    this.timeScale = 1; this._hitstop = 0;
    this.over = false;
    this.events = [];
  }

  dispose() {
    this.scene.remove(this.p1.f3d.root);
    this.scene.remove(this.p2.f3d.root);
  }

  hitstop(t) { this._hitstop = Math.max(this._hitstop, t); }
  slowmo(s) { this.timeScale = s; }

  startRound() {
    const reset = (p, x) => {
      p.hp = 1; p.x = x; p.vx = 0; p.liftY = 0; p.liftV = 0; p.airborne = false;
      p.state = 'idle'; p.stateT = 0; p.attacking = false; p.blocking = false;
      p.comboCount = 0; p.pendingSuper = null; p._lowCalled = false;
      p.f3d.root.rotation.z = 0; p.f3d.play('intro', 1.0);
      p.f3d.root.position.x = x;
    };
    reset(this.p1, -2.2); reset(this.p2, 2.2);
    this.timeLeft = 60;
    this.phase = 'intro'; this.phaseT = 0;
    const h = KC.game.hud;
    h.show(this.p1.def, this.p2.def, this.wins[0], this.wins[1]);
    h.splash('ROUND ' + this.round, 1500);
    const com = KC.game.commentary;
    const rk = [this.p1.def.name, this.p2.def.name].sort().join('|');
    const rb = this.round === 1 && KC.rivalBanter && KC.rivalBanter[rk];
    this._introDur = 1.6;
    this._introWait = false;
    // boss finale gets the full 7-exchange cinematic intro; regular matchups keep
    // it to 5 so every match doesn't make players wait (always skippable).
    this._introBoss = this.p1.def.id === 'mahabapu' || this.p2.def.id === 'mahabapu';
    if (rb) { rb.slice(0, this._introBoss ? 7 : 5).forEach((ln, i) => com.say(i % 2 ? 'B' : 'A', ln.replace(/^[^:]+:\s*/, ''))); this._introWait = true; }
    else {
      com.say('A', KC.util.pick(this.p1.def.intro));
      com.say('B', KC.util.pick(this.p2.def.intro));
    }
    const sh = document.getElementById('skip-hint');
    if (sh) sh.classList.toggle('hidden', !this._introWait);
    com.local('intro', { f1: this.p1.def, f2: this.p2.def });
    if (this.round === 1) com.aiMoment('intro', { f: this.p1.def, detail: this.p1.def.name + ' versus ' + this.p2.def.name + ', round 1 of a satirical political fighting game' });
  }

  attacks = {
    punch: { range: 1.45, dmg: 0.055, dur: 0.32, hitAt: 0.14, push: 0.7 },
    kick:  { range: 1.7,  dmg: 0.075, dur: 0.42, hitAt: 0.2,  push: 1.0 },
    grab:  { range: 1.3,  dmg: 0.11,  dur: 0.55, hitAt: 0.28, push: 2.0 },
  };

  tryAttack(p, kind) {
    if (p.busy() || !p.grounded() || this.cinematic.active) return;
    p.state = kind; p.stateT = 0; p.stateDur = this.attacks[kind].dur;
    p.attacking = true; p.attack = { kind, didHit: false };
    p.f3d.play(kind === 'grab' ? 'grab' : kind, this.attacks[kind].dur);
    this.events.push({ t: 'attack', k: kind });
    if (KC.Audio) KC.Audio.play('swing');
  }

  /* SUPER button cycles supers[2..5] (first press = signature cine).
     Desktop: u/i/o = supers[0..2], p = 3, h = 4, n = 5. Non-cine supers = heavy strike + FX. */
  trySuper(p, idx) {
    if (p.busy() || !p.grounded() || this.cinematic.active) return;
    if (p.shakti < 1) return;
    const sup = p.def.supers[idx];
    if (!sup) return;
    p.shakti = 0;
    p.pendingSuper = sup;
    p.state = 'super'; p.stateT = 0; p.stateDur = 9;
    this.events.push({ t: 'super', i: idx, who: p === this.p1 ? 0 : 1 });
    const foe = p === this.p1 ? this.p2 : this.p1;
    const done = () => { if (p.state === 'super') { p.state = 'idle'; p.stateT = 0; } p.pendingSuper = null; };
    if (sup.cine) {
      if (KC.Audio) KC.Audio.play('super');
      this.cinematic.start(sup.cine, p, foe, done);
    } else {
      // strike super: charge pose, heavy hit with FX, brief slowmo
      p.f3d.play('supercast', 0.8);
      this.slowmo(0.4);
      if (KC.Audio) KC.Audio.play('super');
      KC.game.hud.splash(sup.name, 1200, true);
      KC.game.commentary.local('super', { f: p.def, superName: sup.name });
      KC.game.commentary.aiMoment('super', { f: p.def, superName: sup.name, detail: 'a big super move just landed' });
      setTimeout(() => {
        this.slowmo(1);
        if (foe.state === 'ko') { done(); return; }
        const dist = Math.abs(foe.x - p.x);
        if (dist <= 3.2) {
          this.applyDamage(p, foe, sup.dmg / 100, true);
          foe.vx = p.facing * 7; foe.liftV = 5; foe.liftY = 0.1; foe.airborne = true;
          foe.f3d.play('launched', 0.7);
          this.fx.impactFlash(foe.x, 1.4, 0.25);
          this.fx.burst(foe.x, 1.4, 0.25, 0xffd23f, 18, 5);
          KC.game.camera.addShake(0.35);
          this.hitstop(0.1);
          if (KC.Audio) KC.Audio.play('hit');
        }
        done();
      }, 800);
    }
  }

  applyDamage(attacker, defender, dmg, isSuper) {
    const blocked = defender.blocking && defender.grounded() && !isSuper;
    const eff = blocked ? dmg * 0.25 : dmg;
    defender.hp = Math.max(0, defender.hp - eff);
    attacker.shakti = Math.min(1, attacker.shakti + 0.08);
    defender.shakti = Math.min(1, defender.shakti + 0.05);
    if (!blocked && defender.state !== 'ko') {
      defender.state = 'hurt'; defender.stateT = 0; defender.stateDur = 0.3;
      if (!defender.airborne) defender.f3d.play('hurt', 0.3);
    }
    const now = performance.now();
    if (attacker.lastHitT && now - attacker.lastHitT < 1400) attacker.comboCount++;
    else attacker.comboCount = 1;
    attacker.lastHitT = now;

    const com = KC.game.commentary;
    if (isSuper) { com.local('bigHit', { f: attacker.def }); }
    else if (attacker.comboCount >= 4) { com.local('combo', { f: attacker.def, n: attacker.comboCount }); }
    else if (blocked && Math.random() < 0.3) { com.local('chip', { f: defender.def }); }
    if (defender.hp <= 0.3 && !defender._lowCalled) {
      defender._lowCalled = true;
      com.local('low', { f: defender.def });
      com.aiMoment('lowhp', { f: defender.def, detail: 'fighter is nearly knocked out' });
    }
    if (attacker.hp < 0.25 && defender.hp < attacker.hp && Math.random() < 0.3) com.local('comeback', { f: attacker.def });
  }

  resolveHit(p, foe) {
    const a = p.attack; if (!a || a.didHit) return;
    const spec = this.attacks[a.kind];
    if (p.stateT < spec.hitAt) return;
    a.didHit = true;
    const dist = Math.abs(foe.x - p.x);
    const facingFoe = Math.sign(foe.x - p.x) === p.facing || dist < 0.2;
    if (dist <= spec.range && facingFoe && foe.grounded() && foe.state !== 'ko') {
      const blocked = foe.blocking;
      this.applyDamage(p, foe, spec.dmg, false);
      this.hitstop(blocked ? 0.03 : 0.07);
      KC.game.camera.addShake(blocked ? 0.08 : 0.16);
      this.fx.impactFlash(foe.x - p.facing * 0.5, 1.4, 0.25);
      this.fx.burst(foe.x - p.facing * 0.5, 1.4, 0.25, blocked ? 0x9ec9ff : 0xffd23f, blocked ? 4 : 9, blocked ? 2 : 3.5);
      if (KC.Audio) KC.Audio.play(blocked ? 'block' : 'hit');
      if (!blocked) foe.vx += p.facing * spec.push;
      if (a.kind === 'grab' && !blocked) { foe.liftV = 3.2; foe.liftY = 0.05; foe.airborne = true; foe.f3d.play('launched', 0.5); }
    }
  }

  updateFighter(p, foe, input, dt) {
    p.stateT += dt;
    if (p.state === 'hurt' && p.stateT >= p.stateDur) { p.state = 'idle'; }
    if (['punch', 'kick', 'grab'].includes(p.state) && p.stateT >= p.stateDur) { p.state = 'idle'; p.attacking = false; p.attack = null; }

    if (!p.busy() && p.state !== 'ko') {
      const want = Math.sign(foe.x - p.x) || p.facing;
      if (want !== p.facing) {
        p.facing = want; p.f3d.facing = want;
        p.f3d.root.rotation.y = want === 1 ? Math.PI / 2 - 0.55 : -Math.PI / 2 + 0.55;
      }
    }

    if (p.state !== 'ko' && !this.cinematic.active) {
      p.blocking = !!input.block && p.grounded() && !p.busy();
      if (p.blocking && p.f3d.anim !== 'block') p.f3d.play('block');
      if (input.punch) this.tryAttack(p, 'punch');
      if (input.kick) this.tryAttack(p, 'kick');
      if (input.grab) this.tryAttack(p, 'grab');
      if (input.super !== undefined && input.super !== null) this.trySuper(p, input.super);
      if (!p.busy() && !p.blocking && input.move) {
        p.vx = input.move * 4.2;
        if (p.f3d.anim === 'idle' || p.f3d.anim === 'block') p.f3d.play('walk');
      } else if (!p.busy() && !p.blocking && p.f3d.anim === 'walk') p.f3d.play('idle');
    }

    p.x += p.vx * dt;
    p.vx *= Math.pow(0.0001, dt);
    p.x = KC.util.clamp(p.x, -8, 8);
    if (p.airborne) {
      p.liftY += p.liftV * dt;
      p.liftV -= 16 * dt;
      if (p.liftY <= 0) {
        p.liftY = 0; p.airborne = false;
        this.fx.burst(p.x, 0.1, 0, 0xcccccc, 8, 2);
        KC.game.camera.addShake(0.15);
        if (p.state !== 'ko') { p.state = 'hurt'; p.stateT = 0; p.stateDur = 0.35; p.f3d.play('hurt', 0.35); }
      }
    }
    const minD = 0.9, d = foe.x - p.x;
    if (Math.abs(d) < minD && p.state !== 'ko' && foe.state !== 'ko') {
      p.x -= Math.sign(d || 1) * (minD - Math.abs(d)) / 2;
    }
    p.f3d.root.position.x = p.x;
    this.resolveHit(p, foe);
    p.f3d.update(dt, p);
  }

  ko(loser, winner, byTimeout) {
    loser.state = 'ko'; loser.stateT = 0; loser.stateDur = 99;
    loser.f3d.play('ko');
    this.wins[winner.side]++;
    this.phase = 'roundEnd'; this.phaseT = 0;
    this.hitstop(0.25); this.slowmo(0.3);
    setTimeout(() => this.slowmo(1), 700);
    KC.game.camera.addShake(0.4);
    this.fx.burst(loser.x, 1.2, 0, 0xff6b6b, 20, 5);
    if (KC.Audio) KC.Audio.play('ko');
    KC.game.hud.splash(byTimeout ? "TIME'S UP!" : 'K.O.!', 1800);
    const com = KC.game.commentary;
    com.local('ko', { f: winner.def });
    com.aiMoment('ko', { f: winner.def, detail: winner.def.name + ' just knocked out ' + loser.def.name + ' in round ' + this.round });
  }

  update(rawDt, input1, input2) {
    if (this.mode === 'puppet') { this._puppetUpdate(rawDt); return; }
    if (this._hitstop > 0) { this._hitstop -= rawDt; this.fx.update(rawDt); return; }
    const dt = rawDt * this.timeScale;
    this.cinematic.update(dt);
    this.fx.update(dt);

    if (this.phase === 'intro') {
      this.phaseT += dt;
      this.p1.f3d.update(dt, this.p1); this.p2.f3d.update(dt, this.p2);
      // round-1 banter: intro ends when the pre-fight queue drains (bounded, skippable)
      let done = this.phaseT > (this._introDur || 1.6);
      if (this._introWait) {
        const c = KC.game.commentary;
        const queueBusy = c._queue.length > 0 || c._speaking;
        const skip = input1.punch || input1.kick || input1.grab;
        done = this.phaseT > 2.5 && (!queueBusy || this.phaseT > (this._introBoss ? 30 : 20) || skip);
      }
      if (done) {
        this.phase = 'fight'; KC.game.hud.splash('FIGHT!', 800);
        const sh = document.getElementById('skip-hint');
        if (sh) sh.classList.add('hidden');
      }
      return;
    }
    if (this.phase === 'roundEnd') {
      this.phaseT += dt;
      this.p1.f3d.update(dt, this.p1); this.p2.f3d.update(dt, this.p2);
      if (this.phaseT > 2.4) {
        if (this.wins[0] >= 2 || this.wins[1] >= 2) { this.matchOver(); return; }
        this.round++;
        KC.game.hud.show(this.p1.def, this.p2.def, this.wins[0], this.wins[1]);
        this.startRound();
      }
      return;
    }
    if (this.phase !== 'fight') return;

    this.timeLeft -= dt;
    const i2 = this.cpu ? (this.cpu.update(dt, this.p2, this.p1, this), KC.cpuInput(this.cpu.intent)) : input2;
    this.updateFighter(this.p1, this.p2, input1, dt);
    this.updateFighter(this.p2, this.p1, i2, dt);

    if (this.p1.hp <= 0) this.ko(this.p1, this.p2, false);
    else if (this.p2.hp <= 0) this.ko(this.p2, this.p1, false);
    else if (this.timeLeft <= 0) {
      const w = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
      this.ko(w === this.p1 ? this.p2 : this.p1, w, true);
    }
    KC.game.hud.update(this.p1, this.p2, Math.max(0, this.timeLeft));
  }

  /* ---- online guest puppet: render host snapshots, no simulation ---- */
  _puppetUpdate(rawDt) {
    const s = this.netSnap;
    if (s) {
      const prevPhase = this.phase, prevRound = this.round, prevWins = this.wins.slice();
      this.phase = s.phase; this.timeLeft = s.timeLeft; this.round = s.round;
      if (s.wins[0] !== this.wins[0] || s.wins[1] !== this.wins[1]) {
        this.wins = s.wins.slice();
        KC.game.hud.show(this.p1.def, this.p2.def, this.wins[0], this.wins[1]);
      }
      const roundWinner = s.wins[0] > prevWins[0] ? this.p1.def : (s.wins[1] > prevWins[1] ? this.p2.def : null);
      for (const [p, ps] of [[this.p1, s.p1], [this.p2, s.p2]]) {
        if (ps.anim && p.f3d.anim !== ps.anim) p.f3d.play(ps.anim, 0.45);
        p.x = ps.x; p.hp = ps.hp; p.shakti = ps.shakti;
        p.state = ps.state; p.blocking = ps.blocking;
        p.liftY = ps.liftY; p.airborne = ps.airborne;
        if (ps.facing !== p.facing) {
          p.facing = ps.facing; p.f3d.facing = ps.facing;
          p.f3d.root.rotation.y = ps.facing === 1 ? Math.PI / 2 - 0.55 : -Math.PI / 2 + 0.55;
        }
        p.f3d.root.position.x = ps.x;
      }
      if (prevPhase !== 'roundEnd' && s.phase === 'roundEnd') {
        KC.game.hud.splash(s.timeUp ? "TIME'S UP!" : 'K.O.!', 1800);
        if (roundWinner) KC.game.commentary.local('ko', { f: roundWinner });
      }
      if (prevRound !== s.round && s.phase === 'intro') {
        KC.game.hud.show(this.p1.def, this.p2.def, this.wins[0], this.wins[1]);
        KC.game.hud.splash('ROUND ' + s.round, 1500);
      }
      if (prevPhase === 'intro' && s.phase === 'fight') KC.game.hud.splash('FIGHT!', 800);
      if (s.phase === 'over' && !this.over) {
        this.over = true;
        const winner = this.wins[0] >= 2 ? this.p1 : this.p2;
        const loser = winner === this.p1 ? this.p2 : this.p1;
        KC.game.onMatchOver(winner.def, loser.def, this.wins);
      }
    }
    this.cinematic.update(rawDt);
    this.fx.update(rawDt);
    this.p1.f3d.update(rawDt, this.p1);
    this.p2.f3d.update(rawDt, this.p2);
    if (this.phase === 'fight') KC.game.hud.update(this.p1, this.p2, Math.max(0, this.timeLeft));
  }

  netSuperEvent(ev) {
    const attacker = ev.who === 0 ? this.p1 : this.p2;
    const foe = ev.who === 0 ? this.p2 : this.p1;
    const sup = attacker.def.supers[ev.i];
    if (!sup) return;
    KC.game.commentary.local('super', { f: attacker.def, superName: sup.name });
    if (sup.cine) {
      if (KC.Audio) KC.Audio.play('super');
      this.cinematic.start(sup.cine, attacker, foe, () => {});
    } else {
      attacker.f3d.play('supercast', 0.8);
      if (KC.Audio) KC.Audio.play('super');
      KC.game.hud.splash(sup.name, 1200, true);
    }
  }

  matchOver() {
    this.over = true;
    const winner = this.wins[0] >= 2 ? this.p1 : this.p2;
    const loser = winner === this.p1 ? this.p2 : this.p1;
    winner.f3d.play('win'); loser.f3d.play('lose');
    this.phase = 'over';
    KC.game.onMatchOver(winner.def, loser.def, this.wins);
  }
};

// CPU mostly fires the signature cine (2), sometimes mixes in the other supers
KC.cpuInput = (intent) => ({
  move: intent.move || 0,
  punch: !!intent.punch, kick: !!intent.kick, grab: !!intent.sweep,
  block: !!intent.block,
  super: intent.super ? (Math.random() < 0.6 ? 2 : 3 + Math.floor(Math.random() * 3)) : null,
});
