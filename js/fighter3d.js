/* KURSI CLASH - fighter3d: low-poly cartoon neta rig + procedural animation. Original art direction: big-head desi mascots. */
window.KC = window.KC || {};

KC.BoxFighter = class {
  constructor(fdef, faceLeft) {
    this.def = fdef;
    const g = new THREE.Group();
    this.root = g;
    const mat = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, extra));
    const skin = mat(fdef.skin), kurta = mat(fdef.kurta), pants = mat(fdef.pants), chappal = mat(fdef.chappal);

    const box = (w, h, d, m, x, y, z, parent) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z); mesh.castShadow = true;
      (parent || g).add(mesh); return mesh;
    };

    // legs + chappals
    this.legL = new THREE.Group(); this.legL.position.set(-0.16, 0.95, 0); g.add(this.legL);
    this.legR = new THREE.Group(); this.legR.position.set(0.16, 0.95, 0); g.add(this.legR);
    box(0.2, 0.8, 0.22, pants, 0, -0.4, 0, this.legL);
    box(0.2, 0.8, 0.22, pants, 0, -0.4, 0, this.legR);
    box(0.24, 0.12, 0.34, chappal, 0, -0.86, 0.05, this.legL);
    box(0.24, 0.12, 0.34, chappal, 0, -0.86, 0.05, this.legR);

    // torso (kurta) + kurta tail
    this.torso = new THREE.Group(); this.torso.position.y = 1.0; g.add(this.torso);
    box(0.62, 0.72, 0.4, kurta, 0, 0.36, 0, this.torso);
    box(0.66, 0.22, 0.44, kurta, 0, -0.06, 0, this.torso);

    // arms
    this.armL = new THREE.Group(); this.armL.position.set(-0.38, 0.62, 0); this.torso.add(this.armL);
    this.armR = new THREE.Group(); this.armR.position.set(0.38, 0.62, 0); this.torso.add(this.armR);
    box(0.16, 0.62, 0.18, kurta, 0, -0.26, 0, this.armL);
    box(0.16, 0.62, 0.18, kurta, 0, -0.26, 0, this.armR);
    this.fistL = box(0.2, 0.18, 0.2, skin, 0, -0.62, 0, this.armL);
    this.fistR = box(0.2, 0.18, 0.2, skin, 0, -0.62, 0, this.armR);

    // head with caricature face texture
    this.head = new THREE.Group(); this.head.position.y = 0.92; this.torso.add(this.head);
    const face = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(KC.Faces.get(fdef)), roughness: 0.85 });
    const side = mat(fdef.skin);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.5),
      [side, side, side, side, face, side]); // face on +z
    headMesh.castShadow = true;
    this.head.add(headMesh);

    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.facing = faceLeft ? -1 : 1;
    g.rotation.y = faceLeft ? -Math.PI / 2 + 0.55 : Math.PI / 2 - 0.55;

    this.t = 0;
    this.anim = 'idle'; this.animT = 0; this.animDur = 0;
    this.baseY = 0;
  }

  play(name, dur) { this.anim = name; this.animT = 0; this.animDur = dur || 0.4; }

  update(dt, state) {
    this.t += dt; this.animT += dt;
    const p = this.animDur > 0 ? KC.util.clamp(this.animT / this.animDur, 0, 1) : 0;
    const swing = Math.sin(this.t * 4);
    const a = this.anim;

    const t = { armL: [-0.15, 0, 0.25], armR: [-0.15, 0, -0.25], legL: [0, 0, 0], legR: [0, 0, 0], torso: [0, 0, 0], head: [0, 0, 0], y: 0 };

    if (a === 'idle') {
      const b = Math.sin(this.t * 3);
      t.armL = [-0.5 + b * 0.05, 0, 0.35]; t.armR = [-0.5 - b * 0.05, 0, -0.35];
      t.head = [0, Math.sin(this.t * 0.8) * 0.12, 0];
      t.y = Math.abs(Math.sin(this.t * 3)) * 0.03;
    } else if (a === 'walk') {
      t.legL = [swing * 0.7, 0, 0]; t.legR = [-swing * 0.7, 0, 0];
      t.armL = [-swing * 0.5 - 0.2, 0, 0.2]; t.armR = [swing * 0.5 - 0.2, 0, -0.2];
      t.y = Math.abs(Math.sin(this.t * 8)) * 0.04;
    } else if (a === 'punch') {
      const e = KC.util.easeOut(p < 0.5 ? p * 2 : (1 - p) * 2);
      t.armR = [-1.57 * e, 0, 0]; t.armL = [-0.6, 0, 0.4];
      t.torso = [0, -0.35 * e, 0];
    } else if (a === 'kick') {
      const e = KC.util.easeOut(p < 0.5 ? p * 2 : (1 - p) * 2);
      t.legR = [-1.5 * e, 0, 0]; t.legL = [0.1, 0, 0];
      t.torso = [0.15 * e, 0, 0]; t.armL = [-0.8, 0, 0.6]; t.armR = [-0.3, 0, -0.5];
    } else if (a === 'sweep') {
      const e = p < 0.6 ? KC.util.easeOut(p / 0.6) : 1;
      t.legR = [-1.4 * e, 0, 0.9 * e]; t.y = -0.5 * e; t.torso = [0, 0, 0.1 * e];
      t.armL = [-0.6, 0, 0.7]; t.armR = [-0.6, 0, -0.7];
    } else if (a === 'grab') {
      const e = KC.util.easeOut(p < 0.5 ? p * 2 : (1 - p) * 2);
      t.armL = [-1.2 * e, 0, 0.5]; t.armR = [-1.2 * e, 0, -0.5];
      t.torso = [0.2 * e, 0, 0];
    } else if (a === 'block') {
      t.armL = [-1.3, 0, 0.6]; t.armR = [-1.3, 0, -0.6];
      t.torso = [-0.08, 0, 0];
    } else if (a === 'hurt') {
      const e = 1 - p;
      t.torso = [0, 0.4 * e, 0]; t.head = [0.2 * e, 0, 0];
      t.armL = [0.4 * e, 0, 0.9 * e]; t.armR = [0.4 * e, 0, -0.9 * e];
    } else if (a === 'air') {
      t.legL = [-0.5, 0, 0.2]; t.legR = [-0.3, 0, -0.2];
      t.armL = [-1.2, 0, 0.8]; t.armR = [-1.2, 0, -0.8];
    } else if (a === 'supercast') {
      if (p < 0.5) {
        const e = KC.util.easeOut(p * 2);
        t.armL = [-1.4 * e, 0, 1.2 * e]; t.armR = [-1.4 * e, 0, -1.2 * e];
        t.torso = [-0.15 * e, 0, 0]; t.head = [-0.2 * e, 0, 0];
      } else {
        const e = KC.util.easeOut((p - 0.5) * 2);
        t.armL = [-1.57, 0, 0.15]; t.armR = [-1.57, 0, -0.15];
        t.torso = [0.1 * e, 0, 0];
      }
    } else if (a === 'launched') {
      t.torso = [p * 2.5, 0, 0];
      t.armL = [-1.5, 0, 1.0]; t.armR = [-1.5, 0, -1.0];
      t.legL = [0.6, 0, 0.2]; t.legR = [0.4, 0, -0.2];
    } else if (a === 'ko') {
      const e = KC.util.easeOut(Math.min(1, p * 2));
      this.root.rotation.z = -this.facing * 1.57 * e;
      t.armL = [0.3, 0, 0.8]; t.armR = [0.3, 0, -0.8];
      t.legL = [0.2, 0, 0.15]; t.legR = [0.1, 0, -0.15];
    } else if (a === 'win') {
      const j = Math.abs(Math.sin(this.t * 6));
      t.y = j * 0.35;
      t.armL = [-2.8, 0, 0.5]; t.armR = [-2.8, 0, -0.5];
      t.head = [-0.15, 0, 0];
    } else if (a === 'lose') {
      t.head = [0.4, 0, 0]; t.armL = [0.2, 0, 0.15]; t.armR = [0.2, 0, -0.15];
      t.torso = [0.12, 0, 0];
    } else if (a === 'intro') {
      const e = p;
      t.armR = [-2.9 * e, 0, -0.3];
      t.head = [-0.2 * e, 0, 0];
    }

    if (a !== 'ko') this.root.rotation.z = 0;
    this.armL.rotation.set(t.armL[0], t.armL[1], t.armL[2]);
    this.armR.rotation.set(t.armR[0], t.armR[1], t.armR[2]);
    this.legL.rotation.set(t.legL[0], t.legL[1], t.legL[2]);
    this.legR.rotation.set(t.legR[0], t.legR[1], t.legR[2]);
    this.torso.rotation.set(t.torso[0], t.torso[1], t.torso[2]);
    this.head.rotation.set(t.head[0], t.head[1], t.head[2]);
    this.root.position.y = this.baseY + t.y + (state ? state.liftY : 0);
    if (p >= 1 && !['idle', 'walk', 'ko', 'win', 'lose', 'block', 'air'].includes(a)) this.play('idle');
  }
};

/* ---------- GLB bodies: CC0 KayKit Adventurers + original caricature box heads ---------- */
KC.FighterAssets = {
  BODIES: {
    barbarian: 'assets/models/Barbarian.glb',
    knight: 'assets/models/Knight.glb',
    mage: 'assets/models/Mage.glb',
    rogue: 'assets/models/Rogue.glb',
    hooded: 'assets/models/Rogue_Hooded.glb',
    business: 'assets/models/BusinessMan.glb',
    worker: 'assets/models/Worker.glb',
    king: 'assets/models/King.glb',
    hoodie: 'assets/models/Hoodie.glb',
    punk: 'assets/models/Punk.glb'
  },
  cache: {}, ready: false, failed: 0,
  bodyFor(id) { return (typeof KC_BODY_MAP !== 'undefined' && KC_BODY_MAP[id]) || 'knight'; },
  loadBody(name) {
    if (this.cache[name] || !this.BODIES[name]) return Promise.resolve();
    this._pending = this._pending || {};
    if (this._pending[name]) return this._pending[name];
    const loader = new THREE.GLTFLoader();
    this._pending[name] = new Promise(res => {
      loader.load(this.BODIES[name], g => { this.cache[name] = g; this.ready = true; res(); },
        undefined, () => { this.failed++; res(); });
    });
    return this._pending[name];
  },
  ensure(names) { return Promise.all([...new Set(names)].map(n => this.loadBody(n))); },
  preload(onProgress) {
    const names = Object.keys(this.BODIES);
    let done = 0;
    const loader = new THREE.GLTFLoader();
    return Promise.all(names.map(n => new Promise(res => {
      loader.load(this.BODIES[n], g => { this.cache[n] = g; done++; onProgress && onProgress(done / names.length); res(); },
        undefined, () => { this.failed++; done++; onProgress && onProgress(done / names.length); res(); });
    }))).then(() => { this.ready = true; });
  }
};

const KC_BODY_MAP = {
  yatrayodha: 'knight', dididhamaka: 'hooded',
  bulldozerbaba: 'barbarian', highwayman: 'worker', starneta: 'business', railrustom: 'barbarian',
  chanakyaboss: 'business', mufflerman: 'hoodie', factbhai: 'punk', mahabapu: 'barbarian',
  chaiboss: 'king', tariffchacha: 'king'
};

const KC_ANIM = {
  idle:      { clip: 'Idle', loop: true },
  walk:      { clip: 'Running_A', loop: true, ts: 1.15 },
  block:     { clip: 'Blocking', loop: true },
  win:       { clip: 'Cheer', loop: true },
  punch:     { clip: ['Unarmed_Melee_Attack_Punch_A', 'Unarmed_Melee_Attack_Punch_B'] },
  kick:      { clip: 'Unarmed_Melee_Attack_Kick' },
  grab:      { clip: 'Throw' },
  hurt:      { clip: 'Hit_A' },
  hit:       { clip: 'Hit_A' },
  sweep:     { clip: 'Unarmed_Melee_Attack_Kick' },
  launched:  { clip: 'Hit_B' },
  air:       { clip: 'Jump_Idle', loop: true },
  supercast: { clip: 'Spellcast_Raise' },
  super:     { clip: '2H_Melee_Attack_Spin' },
  swing:     { clip: '2H_Melee_Attack_Slice' },
  intro:     { clip: 'Jump_Full_Short' },
  ko:        { clip: 'Death_A', hold: true },
  lose:      { clip: 'Death_B', hold: true }
};

const KC_ANIM_Q = {
  idle:      { clip: 'CharacterArmature|Idle_Neutral', loop: true },
  walk:      { clip: 'CharacterArmature|Run', loop: true, ts: 1.1 },
  block:     { clip: 'CharacterArmature|Idle_Sword', loop: true },
  win:       { clip: 'CharacterArmature|Wave', loop: true },
  punch:     { clip: ['CharacterArmature|Punch_Right', 'CharacterArmature|Punch_Left'] },
  kick:      { clip: ['CharacterArmature|Kick_Right', 'CharacterArmature|Kick_Left'] },
  grab:      { clip: 'CharacterArmature|Interact' },
  hurt:      { clip: 'CharacterArmature|HitRecieve' },
  hit:       { clip: 'CharacterArmature|HitRecieve' },
  sweep:     { clip: 'CharacterArmature|Kick_Left' },
  launched:  { clip: 'CharacterArmature|HitRecieve_2' },
  air:       { clip: 'CharacterArmature|Roll' },
  supercast: { clip: 'CharacterArmature|Interact' },
  super:     { clip: 'CharacterArmature|Sword_Slash' },
  swing:     { clip: 'CharacterArmature|Sword_Slash' },
  intro:     { clip: 'CharacterArmature|Wave' },
  ko:        { clip: 'CharacterArmature|Death', hold: true },
  lose:      { clip: 'CharacterArmature|Death', hold: true, ts: 0.7 }
};

const KC_BODY_ANIMMAP = { business: 'q', worker: 'q', king: 'q', hoodie: 'q', punk: 'q' };

const KC_HIDE_RE = /axe|shield|mug|sword|staff|wand|bow|arrow|dagger|knife|crossbow|quiver|head|helmet|hat|throw/i;

/* per-body silhouette tuning so realistic bodies keep coherent caricature proportions */
const KC_BODY_TUNE = {
  business: { headScale: 0.75, headPitch: -0.12, widen: 1.32, ySquash: 0.88 },
  worker: { headScale: 0.75, headPitch: -0.12, widen: 1.32, ySquash: 0.88 },
  king: { headScale: 0.75, headPitch: -0.12, widen: 1.32, ySquash: 0.88 },
  hoodie: { headScale: 0.75, headPitch: -0.12, widen: 1.32, ySquash: 0.88 },
  punk: { headScale: 0.75, headPitch: -0.12, widen: 1.32, ySquash: 0.88 }
};

KC.GLBFighter = class {
  constructor(fdef, faceLeft) {
    this.def = fdef;
    const bodyName = KC_BODY_MAP[fdef.id] || 'knight';
    const src = KC.FighterAssets.cache[bodyName];
    this.root = new THREE.Group();
    const model = THREE.SkeletonUtils.clone(src.scene);
    this.model = model;

    // materials: clone + tint lightly toward fighter identity color
    const kurta = new THREE.Color(fdef.kurta);
    model.traverse(o => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // skinned meshes can vanish when bones leave the static bounds
        if (KC_HIDE_RE.test(o.name)) { o.visible = false; return; }
        o.material = o.material.clone();
        if (o.material.color) o.material.color.lerp(kurta, 0.22);
      }
    });

    this.root.add(model);

    this.animMap = KC_BODY_ANIMMAP[bodyName] === 'q' ? KC_ANIM_Q : KC_ANIM;
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = {};
    src.animations.forEach(c => { this.actions[c.name] = this.mixer.clipAction(c); });
    this.current = null;
    this.punchFlip = false;

    // normalize body scale from the head-bone bind position (rig-agnostic: handles
    // KayKit metre rigs and Quaternius centimetre armatures alike)
    this.headBone = model.getObjectByName('head') || model.getObjectByName('Head');
    let boneWorldScale = 1;
    if (this.headBone) {
      const idleClip = this.animMap.idle.clip;
      const idleAction = this.actions[Array.isArray(idleClip) ? idleClip[0] : idleClip];
      if (idleAction) { idleAction.play(); this.mixer.update(0); }
      this.root.updateMatrixWorld(true);
      const hy = new THREE.Vector3();
      this.headBone.getWorldPosition(hy);
      let s = 1.05 / (hy.y || 1);
      if (fdef.id === 'mahabapu') s *= 1.25;
      model.scale.setScalar(s);
      this.root.updateMatrixWorld(true);
      const ws = new THREE.Vector3();
      this.headBone.getWorldScale(ws);
      boneWorldScale = ws.y || 1;
    }
    if (this.headBone) {
      const headMesh = KC.Head3D.build(fdef);
      this.headBone.add(headMesh);
      const tune = KC_BODY_TUNE[bodyName] || {};
      if (tune.widen) { model.scale.x *= tune.widen; model.scale.z *= tune.widen; }
      if (tune.ySquash) model.scale.y *= tune.ySquash;
      const scaleFix = (tune.headScale || 1) / boneWorldScale;
      headMesh.scale.setScalar(scaleFix);
      headMesh.position.set(0, 0.12 * scaleFix, 0.06 * scaleFix);
      if (tune.headPitch) headMesh.rotation.x += tune.headPitch;
    }
    this.facing = faceLeft ? -1 : 1;
    this.root.rotation.y = faceLeft ? -Math.PI / 2 + 0.55 : Math.PI / 2 - 0.55;
    this.anim = 'idle'; this.animT = 0; this.animDur = 0; this.t = 0;
    this.baseY = 0;
    this._playMapped('idle');
    this.mixer.addEventListener('finished', () => {
      const m = this.animMap[this.anim];
      if (m && !m.loop && !m.hold) this.play('idle');
    });
  }

  _playMapped(name, dur) {
    const m = this.animMap[name] || this.animMap.idle;
    let clipName = Array.isArray(m.clip) ? m.clip[this.punchFlip ? 1 : 0] : m.clip;
    if (Array.isArray(m.clip)) this.punchFlip = !this.punchFlip;
    const next = this.actions[clipName];
    if (!next) return;
    next.reset();
    if (m.loop) { next.setLoop(THREE.LoopRepeat, Infinity); }
    else { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
    let ts = m.ts || 1;
    const clipDur = next.getClip().duration;
    if (!m.loop && dur && clipDur > 0) ts = clipDur / dur;
    next.timeScale = ts;
    if (this.current && this.current !== next) { next.crossFadeFrom(this.current, 0.08, false); }
    next.play();
    this.current = next;
  }

  play(name, dur) {
    if (name === this.anim && (KC_ANIM[name] || {}).loop) return;
    this.anim = name; this.animT = 0; this.animDur = dur || 0.4;
    this._playMapped(name, dur);
  }

  update(dt, state) {
    this.t += dt; this.animT += dt;
    this.mixer.update(dt);
    this.root.position.y = this.baseY + (state ? state.liftY : 0);
  }
};

/* factory: GLB body when assets are ready, box-man fallback otherwise */
KC.Fighter3D = function (fdef, faceLeft) {
  const body = KC_BODY_MAP[fdef.id];
  if (KC.FighterAssets.ready && body && KC.FighterAssets.cache[body]) return new KC.GLBFighter(fdef, faceLeft);
  return new KC.BoxFighter(fdef, faceLeft);
};
