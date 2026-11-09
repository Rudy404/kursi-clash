/* KURSI CLASH - cinematics: automatic anime-style cinematic exchanges + FX particles.
   Choreography is original code (slow-mo beats, launcher, juggle, push-style shockwave). */
window.KC = window.KC || {};

KC.FX = class {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    this.flashMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0 });
    this.flash = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), this.flashMat);
    this.flash.visible = false; scene.add(this.flash);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 32), this.ringMat);
    this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; scene.add(this.ring);
    this._flashT = 1; this._ringT = 1; this._ringPos = new THREE.Vector3();
  }
  burst(x, y, z, color, n, speed) {
    for (let i = 0; i < (n || 10); i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09),
        new THREE.MeshBasicMaterial({ color: color || 0xffd23f }));
      m.position.set(x, y, z);
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      const s = (speed || 3) * (0.5 + Math.random());
      this.parts.push({ m, vx: Math.cos(a) * Math.cos(b) * s, vy: Math.sin(b) * s + 2, vz: Math.sin(a) * Math.cos(b) * s, life: 0.5 + Math.random() * 0.3 });
      this.scene.add(m);
    }
  }
  impactFlash(x, y, z) {
    this.flash.position.set(x, y, z); this.flash.visible = true; this._flashT = 0;
  }
  shockwave(x, z) {
    this._ringPos.set(x, 0.1, z); this.ring.visible = true; this._ringT = 0;
  }
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.scene.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); this.parts.splice(i, 1); continue; }
      p.vy -= 9 * dt;
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      if (p.m.position.y < 0.05) { p.m.position.y = 0.05; p.vy *= -0.4; p.vx *= 0.7; }
      p.m.rotation.x += dt * 6; p.m.rotation.y += dt * 5;
    }
    if (this._flashT < 1) {
      this._flashT = Math.min(1, this._flashT + dt * 6);
      this.flashMat.opacity = (1 - this._flashT) * 0.9;
      this.flash.scale.setScalar(0.5 + this._flashT * 2.2);
      if (this._flashT >= 1) this.flash.visible = false;
    }
    if (this._ringT < 1) {
      this._ringT = Math.min(1, this._ringT + dt * 1.6);
      this.ring.position.copy(this._ringPos);
      this.ring.scale.setScalar(1 + this._ringT * 9);
      this.ringMat.opacity = (1 - this._ringT) * 0.8;
      if (this._ringT >= 1) this.ring.visible = false;
    }
  }
};

/* Cinematic director: pauses normal fight, runs scripted beats, returns control. */
KC.Cinematic = class {
  constructor(fight) {
    this.fight = fight;
    this.active = false;
    this.beats = [];
    this.t = 0;
    this.sfx = document.getElementById('cine-sfx');
  }

  /* kind: 'push' | 'flurry' | signature kinds 'rise' (divine charge-blast) |
     'gatling' (dash-through barrage) | 'zoomblast' (slow dolly-in mystery charge) */
  _impactFlash() {
    const el = document.getElementById('impact-flash');
    if (!el) return;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  }
  start(kind, attacker, defender, onDone) {
    this.active = true;
    this.kind = kind;
    this.attacker = attacker; this.defender = defender;
    this.onDone = onDone;
    this.t = 0; this.beat = 0;
    this.camDist = 5.5;
    document.body.classList.add('cine');
    const name = attacker.def.name;
    const sup = attacker.pendingSuper;
    KC.game.hud.cineLabel(sup ? sup.name : '');
    KC.game.commentary.local('super', { f: attacker.def, superName: sup ? sup.name : '' });
    KC.game.commentary.aiMoment('super', { f: attacker.def, superName: sup ? sup.name : '', detail: 'anime-style cinematic super just landed' });
    this.beats = kind === 'push' ? this._pushBeats()
      : kind === 'rise' ? this._riseBeats()
      : kind === 'gatling' ? this._gatlingBeats()
      : kind === 'zoomblast' ? this._zoomblastBeats()
      : this._flurryBeats();
  }

  /* ALMIGHTY AASHIRWAD signature: three ascending golden ring pulses while charging,
     then an enormous repel that launches the defender sky-high. */
  _riseBeats() {
    const A = this.attacker, D = this.defender;
    return [
      { d: 0.55, run: () => { A.f3d.play('supercast', 1.35); this.fight.slowmo(0.25);
          this.fight.fx.shockwave(A.x, 0); this.fight.fx.burst(A.x, 1.0, 0, 0xffd23f, 10, 2.5); } },
      { d: 0.45, run: () => { this.fight.fx.shockwave(A.x, 0); this.fight.fx.burst(A.x, 1.8, 0, 0xffe08a, 14, 3);
          KC.game.camera.addFovKick(3); } },
      { d: 0.4, run: () => { this.fight.fx.shockwave(A.x, 0); this.fight.fx.burst(A.x, 2.4, 0, 0xfff2b0, 18, 3.5);
          KC.game.camera.addShake(0.2); } },
      { d: 0.15, run: () => {
          this.fight.slowmo(1);
          this.fight.fx.shockwave(A.x, 0);
          this.fight.fx.burst(A.x + A.facing * 0.8, 1.6, 0, 0xfff2b0, 34, 7);
          KC.game.camera.addShake(0.6);
          KC.game.camera.addFovKick(11);
          this._impactFlash();
          this.fight.hitstop(0.14);
          D.vx = A.facing * 15; D.liftV = 10; D.liftY = 0.2; D.airborne = true;
          D.f3d.play('launched', 1.1);
          this.fight.applyDamage(A, D, A.pendingSuper.dmg / 100, true);
        } },
      { d: 1.2, run: () => {} },
      { d: 0.4, run: () => this._end() },
    ];
  }

  /* GATLING GALEEBI signature: the attacker dashes THROUGH the defender, swapping sides
     between hits - a proper anime rush-down. 12 hits, alternating sides, pink mohabbat sparks. */
  _gatlingBeats() {
    const beats = [];
    const A = this.attacker, D = this.defender;
    beats.push({ d: 0.5, run: () => { A.f3d.play('supercast', 0.5); this.fight.slowmo(0.35); } });
    const total = 12;
    let side = 1;
    for (let i = 0; i < total; i++) {
      beats.push({ d: 0.12, run: () => {
        this.fight.slowmo(0.6);
        side = -side;
        A.x = KC.util.clamp(D.x + side * 1.1, -7.5, 7.5);
        A.facing = -side; A.f3d.facing = -side;
        A.f3d.root.rotation.y = A.facing === 1 ? Math.PI / 2 - 0.55 : -Math.PI / 2 + 0.55;
        A.f3d.play(i % 2 ? 'punch' : 'kick', 0.12);
        D.f3d.play('hurt', 0.15);
        this.fight.fx.impactFlash(D.x, 1.3 + Math.random() * 0.6, 0.2);
        this.fight.fx.burst(D.x, 1.4, 0.2, i % 2 ? 0xff7eb9 : 0xffd23f, 5, 3);
        KC.game.camera.addShake(0.14);
        KC.game.camera.addFovKick(2);
        this.fight.hitstop(0.04);
        this.fight.applyDamage(A, D, (A.pendingSuper.dmg / 100) / total, true);
      } });
    }
    beats.push({ d: 0.2, run: () => {
      this.fight.slowmo(1);
      D.vx = -side * 9; D.liftV = 7; D.liftY = 0.2; D.airborne = true;
      D.f3d.play('launched', 0.8);
      this.fight.fx.shockwave(D.x, 0);
      this.fight.fx.burst(D.x, 1.5, 0, 0xff7eb9, 16, 5);
      KC.game.camera.addShake(0.45);
      KC.game.camera.addFovKick(7);
      this._impactFlash();
    } });
    beats.push({ d: 0.9, run: () => {} });
    beats.push({ d: 0.3, run: () => this._end() });
    return beats;
  }

  /* COVFEFE CATACLYSM signature: nobody knows what is happening. A long slow dolly-in
     while golden question marks spiral up around Chacha, then a very tremendous blast. */
  _zoomblastBeats() {
    const A = this.attacker, D = this.defender;
    const qColors = [0xffd23f, 0xff6b6b, 0x7ec8ff];
    return [
      { d: 1.2, run: () => { A.f3d.play('supercast', 1.2); this.fight.slowmo(0.3); this.camDist = 7.5; } },
      { d: 0.4, run: () => { this.camDist = 6.4; this.fight.fx.burst(A.x + (Math.random()-0.5), 1.2, 0, qColors[0], 8, 2); } },
      { d: 0.4, run: () => { this.camDist = 5.2; this.fight.fx.burst(A.x + (Math.random()-0.5), 1.7, 0, qColors[1], 8, 2); } },
      { d: 0.4, run: () => { this.camDist = 4.2; this.fight.fx.burst(A.x + (Math.random()-0.5), 2.1, 0, qColors[2], 8, 2);
          KC.game.camera.addShake(0.15); } },
      { d: 0.15, run: () => {
          this.fight.slowmo(1);
          this.camDist = 6.5;
          this.fight.fx.shockwave(A.x, 0);
          for (const c of qColors) this.fight.fx.burst(A.x + A.facing * 0.9, 1.5, 0, c, 12, 6);
          KC.game.camera.addShake(0.65);
          KC.game.camera.addFovKick(12);
          this._impactFlash();
          this.fight.hitstop(0.15);
          D.vx = A.facing * 14; D.liftV = 8; D.liftY = 0.2; D.airborne = true;
          D.f3d.play('launched', 1.0);
          this.fight.applyDamage(A, D, A.pendingSuper.dmg / 100, true);
        } },
      { d: 1.1, run: () => {} },
      { d: 0.4, run: () => this._end() },
    ];
  }

  _pushBeats() {
    // charge -> repel shockwave -> defender blasted back, tumble, crater dust -> resume
    return [
      { d: 0.9, run: () => { this.attacker.f3d.play('supercast', 0.9); this.fight.slowmo(0.25); } },
      { d: 0.15, run: () => {
          this.fight.slowmo(1);
          this.fight.fx.shockwave(this.attacker.x, 0);
          this.fight.fx.burst(this.attacker.x + this.attacker.facing * 0.8, 1.4, 0, 0xfff2b0, 26, 6);
          KC.game.camera.addShake(0.5);
          KC.game.camera.addFovKick(9);
          this._impactFlash();
          this.fight.hitstop(0.12);
          const d = this.defender;
          d.vx = this.attacker.facing * 14; d.liftV = 7; d.liftY = 0.2; d.airborne = true;
          d.f3d.play('launched', 0.8);
          this.fight.applyDamage(this.attacker, this.defender, this.attacker.pendingSuper.dmg / 100, true);
        } },
      { d: 1.0, run: () => {} },
      { d: 0.4, run: () => this._end() },
    ];
  }

  _flurryBeats() {
    const beats = [];
    const A = this.attacker, D = this.defender;
    beats.push({ d: 0.6, run: () => { A.f3d.play('supercast', 0.6); this.fight.slowmo(0.3); } });
    const total = 8;
    for (let i = 0; i < total; i++) {
      beats.push({ d: 0.16, run: () => {
        this.fight.slowmo(0.55);
        A.x = KC.util.clamp(D.x - A.facing * 1.1, -7.5, 7.5);
        A.f3d.play(i % 2 ? 'punch' : 'kick', 0.16);
        D.f3d.play('hurt', 0.2);
        this.fight.fx.impactFlash(D.x, 1.4 + Math.random() * 0.5, 0.2);
        this.fight.fx.burst(D.x, 1.4, 0.2, i % 2 ? 0xffd23f : 0xff6b6b, 6, 3);
        KC.game.camera.addShake(0.18);
        KC.game.camera.addFovKick(2.5);
        this.fight.hitstop(0.05);
        this.fight.applyDamage(A, D, (A.pendingSuper.dmg / 100) / total, true);
      } });
    }
    beats.push({ d: 0.2, run: () => {
      this.fight.slowmo(1);
      D.vx = A.facing * 9; D.liftV = 6; D.liftY = 0.2; D.airborne = true;
      D.f3d.play('launched', 0.8);
      this.fight.fx.shockwave(D.x, 0);
      KC.game.camera.addShake(0.4);
      KC.game.camera.addFovKick(7);
      this._impactFlash();
    } });
    beats.push({ d: 0.9, run: () => {} });
    beats.push({ d: 0.3, run: () => this._end() });
    return beats;
  }

  _end() {
    document.body.classList.remove('cine');
    KC.game.hud.cineLabel(null);
    this.active = false;
    this.camDist = 5.5;
    this.fight.slowmo(1);
    const cb = this.onDone; this.onDone = null;
    if (cb) cb();
  }

  update(dt) {
    if (!this.active) return;
    if (this.beat >= this.beats.length) { this._end(); return; }
    const b = this.beats[this.beat];
    if (!b.started) { b.started = true; b.run(); }
    this.t += dt;
    if (this.t >= b.d) { this.t = 0; this.beat++; }
  }
};
