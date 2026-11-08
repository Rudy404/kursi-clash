/* KURSI CLASH - stage: procedural 3D stages + camera. All original geometry. */
window.KC = window.KC || {};

KC.STAGE_VISUALS = {
  sansad: { sky: 0x8fc3e8, ground: 0xbfa77e, bg: 'parliament' },
  jantar: { sky: 0xa8c8e0, ground: 0x9a948a, bg: 'chowk' },
  sadak:  { sky: 0x3a3050, ground: 0x55555e, bg: 'highway' },
};

KC.Stage = class {
  constructor(scene, def) {
    this.def = def = Object.assign({}, KC.STAGE_VISUALS[def.id] || KC.STAGE_VISUALS.sansad, def);
    this.group = new THREE.Group();
    scene.add(this.group);
    const mat = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, extra));
    const box = (w, h, d, c, x, y, z, ry) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
      m.position.set(x, y, z); if (ry) m.rotation.y = ry;
      m.receiveShadow = true; this.group.add(m); return m;
    };
    const cyl = (r1, r2, h, c, x, y, z, seg) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 12), mat(c));
      m.position.set(x, y, z); m.castShadow = true; this.group.add(m); return m;
    };

    // ground
    const ground = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 14), mat(def.ground));
    ground.position.y = -0.2; ground.receiveShadow = true;
    this.group.add(ground);

    const bg = def.bg;
    if (bg === 'parliament') {
      // curved colonnade inspired by a round civic hall (original geometry)
      for (let i = 0; i < 12; i++) {
        const ang = (i / 11 - 0.5) * 1.8;
        const r = 11;
        cyl(0.28, 0.32, 4.4, 0xd9c9a8, Math.sin(ang) * r, 2.2, -Math.cos(ang) * r - 3);
      }
      // entablature band + dome
      const band = new THREE.Mesh(new THREE.CylinderGeometry(11.4, 11.4, 0.7, 32, 1, true), mat(0xcbb79a));
      band.position.set(0, 4.7, -3); band.material.side = THREE.DoubleSide; this.group.add(band);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x3f7d4e));
      dome.position.set(0, 5.2, -3); this.group.add(dome);
      box(0.5, 1.2, 0.5, 0x3f7d4e, 0, 8.6, -3);
      // flag pole
      cyl(0.05, 0.05, 3.4, 0x888888, 6.5, 5.5, -6);
      box(1.4, 0.9, 0.05, 0xff9933, 7.25, 6.6, -6);
      box(1.4, 0.3, 0.06, 0xffffff, 7.25, 6.45, -6);
      box(1.4, 0.3, 0.07, 0x138808, 7.25, 6.15, -6);
      // steps
      for (let i = 0; i < 3; i++) box(22, 0.18, 1.2, 0xbfae8e, 0, 0.09 + i * 0.18, -7.5 - i * 1.0);
    } else if (bg === 'chowk') {
      // street barricades + protest vibe (original)
      for (let i = -3; i <= 3; i++) {
        const bx = i * 3.4;
        box(2.4, 1.0, 0.25, i % 2 ? 0xffd23f : 0x2b2b2b, bx, 0.5, -5.5);
        box(0.18, 1.4, 0.18, 0x666666, bx - 1.1, 0.7, -5.5);
        box(0.18, 1.4, 0.18, 0x666666, bx + 1.1, 0.7, -5.5);
      }
      // banner poles
      for (const sx of [-8, -4, 4, 8]) {
        cyl(0.06, 0.06, 4.6, 0x777777, sx, 2.3, -6.2);
        box(1.8, 0.8, 0.06, [0xe84545, 0x3f7d4e, 0x3b6fd4, 0xff9933][Math.abs(sx) % 4], sx + 0.9, 4.1, -6.2);
      }
      // crowd silhouettes
      for (let i = 0; i < 26; i++) {
        const cxp = -12 + (i * 0.93) % 24, czp = -6.8 - (i % 3) * 0.7;
        box(0.5, 1.1 + (i % 4) * 0.15, 0.3, 0x2a2a35, cxp, 0.55, czp);
        const h = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mat(0x2a2a35));
        h.position.set(cxp, 1.3 + (i % 4) * 0.15, czp); this.group.add(h);
      }
      box(26, 0.3, 0.4, 0x8a8a8a, 0, 0.15, -4.8); // curb
    } else {
      // highway dusk: road, toll booth, skyline
      box(30, 0.08, 5.5, 0x33333a, 0, 0.05, 1.5);
      for (let i = -7; i <= 7; i++) box(1.0, 0.02, 0.18, 0xffe08a, i * 2, 0.1, 1.5);
      // toll booth
      box(2.2, 2.4, 1.6, 0x3b6fd4, -8.5, 1.2, -5);
      box(2.6, 0.3, 2.0, 0xffd23f, -8.5, 2.55, -5);
      box(6, 0.18, 0.18, 0xd43b3b, -4.8, 1.1, -4.2, 0.5);
      // skyline
      const heights = [3, 4.6, 2.6, 5.4, 3.6, 6, 3.2, 4.2, 2.8, 5, 3.8, 4.8];
      heights.forEach((h, i) => {
        box(1.8, h, 1.4, 0x23232e, -13 + i * 2.4, h / 2, -8.5);
      });
      // moon
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 14), mat(0xfff3c4, { emissive: 0xffe9a0, emissiveIntensity: 0.7 }));
      moon.position.set(7, 8.5, -12); this.group.add(moon);
      // street lights
      for (const sx of [-6, 0, 6]) {
        cyl(0.07, 0.07, 4.2, 0x555555, sx, 2.1, -3.5);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat(0xffe9a0, { emissive: 0xffd23f, emissiveIntensity: 1.2 }));
        lamp.position.set(sx, 4.25, -3.4); this.group.add(lamp);
      }
    }
  }
};

KC.Camera = class {
  constructor() {
    this.cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.baseY = 2.4; this.dist = 9.5;
    this.shake = 0; this.zoomT = 0; this.zoomTo = 1; this.focusX = 0;
  }
  addShake(v) { this.shake = Math.min(0.5, this.shake + v); }
  follow(ax, bx, dt, midOverride, distOverride) {
    const mid = midOverride !== undefined ? midOverride : (ax + bx) / 2;
    const wantDist = distOverride !== undefined ? distOverride :
      (this.portrait ? KC.util.clamp(Math.abs(ax - bx) * 0.9 + 7.5, 9.5, 15)
                     : KC.util.clamp(Math.abs(ax - bx) * 0.9 + 5.5, 7, 13));
    this.dist = KC.util.lerp(this.dist, wantDist, 1 - Math.pow(0.001, dt));
    this.focusX = KC.util.lerp(this.focusX, mid, 1 - Math.pow(0.0005, dt));
    this.shake = Math.max(0, this.shake - dt * 1.4);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    const baseY = this.portrait ? 3.0 : this.baseY;
    const lookY = this.portrait ? 2.0 : 1.6;
    this.cam.position.set(this.focusX + sx, baseY + sy, this.dist);
    this.cam.lookAt(this.focusX + sx, lookY + sy, 0);
  }
  resize(w, h) {
    const a = w / h;
    this.cam.aspect = a;
    this.portrait = a < 0.9;
    this.cam.fov = this.portrait ? 72 : 38;
    this.cam.updateProjectionMatrix();
  }
};
