/* KURSI CLASH - fighter3d: low-poly cartoon neta rig + procedural animation. Original art direction: big-head desi mascots. */
window.KC = window.KC || {};

KC.Fighter3D = class {
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
