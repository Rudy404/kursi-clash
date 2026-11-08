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

    // tiled plaza surface (procedural canvas texture, subtle)
    const base = new THREE.Color(def.ground);
    const tc = document.createElement('canvas'); tc.width = tc.height = 256;
    const tg = tc.getContext('2d');
    const shade = f => '#' + base.clone().multiplyScalar(f).getHexString();
    tg.fillStyle = shade(1.0); tg.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      tg.fillStyle = shade((x + y) % 2 ? 0.94 : 1.05);
      tg.fillRect(x * 64 + 1, y * 64 + 1, 62, 62);
    }
    tg.strokeStyle = shade(0.8); tg.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      tg.beginPath(); tg.moveTo(i * 64, 0); tg.lineTo(i * 64, 256); tg.stroke();
      tg.beginPath(); tg.moveTo(0, i * 64); tg.lineTo(256, i * 64); tg.stroke();
    }
    const tileTex = new THREE.CanvasTexture(tc);
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(6, 3);
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.95 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; plaza.receiveShadow = true;
    this.group.add(plaza);

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
      // red carpet down the fight lane
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.6), mat(0xa02430, { roughness: 1 }));
      carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.03, 0); carpet.receiveShadow = true;
      this.group.add(carpet);
      // carpet border stripes
      for (const cz of [-1.28, 1.28]) box(16, 0.02, 0.09, 0xd4af37, 0, 0.04, cz);
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
      // signature red-and-cream yantra geometry rising behind the chowk (original)
      for (const [yx, yy, s, ry] of [[-9.5, 2.2, 4.4, 0.5], [9.5, 2.2, 4.4, -0.5], [0, 3.0, 5.6, 0]]) {
        const tri = new THREE.Mesh(new THREE.ConeGeometry(s * 0.55, s, 4), mat(0xb3402a));
        tri.position.set(yx, yy, -10); tri.rotation.y = ry; tri.castShadow = true; this.group.add(tri);
        const trim = new THREE.Mesh(new THREE.ConeGeometry(s * 0.45, s * 0.16, 4), mat(0xe8dcc0));
        trim.position.set(yx, yy + s * 0.33, -10); trim.rotation.y = ry; this.group.add(trim);
      }
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
      // overhead highway sign gantry (original), set back into the skyline layer
      cyl(0.11, 0.11, 7.6, 0x777777, -5.5, 3.8, -7.2);
      cyl(0.11, 0.11, 7.6, 0x777777, 5.5, 3.8, -7.2);
      box(11.6, 0.26, 0.26, 0x777777, 0, 7.5, -7.2);
      box(2.2, 0.95, 0.13, 0x1a6b3c, -2.6, 6.8, -7.2);
      box(2.2, 0.95, 0.13, 0x1a6b3c, 2.6, 6.8, -7.2);
      box(0.34, 0.34, 0.15, 0xffd23f, -2.6, 7.25, -7.2);
      box(0.34, 0.34, 0.15, 0xffd23f, 2.6, 7.25, -7.2);
      // roadside direction sign (original), inside typical portrait framing
      cyl(0.07, 0.07, 3.0, 0x666666, 2.7, 1.5, -3.0);
      box(1.5, 0.9, 0.1, 0x1a6b3c, 2.7, 3.1, -3.0);
      box(0.9, 0.16, 0.11, 0xffffff, 2.7, 3.25, -3.0);
      box(0.5, 0.16, 0.11, 0xffffff, 2.55, 2.95, -3.0);
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
    const sep = Math.abs(ax - bx);
    // portrait: derive distance from the real aspect so BOTH fighters always fit,
    // plus margin for arm reach and impact FX; cinematic zooms pass distOverride.
    const tanH = Math.tan((this.cam.fov * Math.PI / 180) / 2) * this.cam.aspect;
    const fitDist = this.portrait ? KC.util.clamp((sep / 2 + 0.65) / Math.max(tanH, 0.05), 4.6, 21)
                                  : KC.util.clamp(sep * 0.9 + 5.5, 7, 13);
    // cinematic override zooms in for drama, but never crops a fighter out of frame
    const wantDist = distOverride !== undefined ? Math.max(distOverride, fitDist) : fitDist;
    this.dist = KC.util.lerp(this.dist, wantDist, 1 - Math.pow(0.001, dt));
    this.focusX = KC.util.lerp(this.focusX, mid, 1 - Math.pow(0.0005, dt));
    this.shake = Math.max(0, this.shake - dt * 1.4);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    const baseY = this.portrait ? 2.1 : this.baseY;
    const lookY = this.portrait ? 1.25 : 1.6;
    this.cam.position.set(this.focusX + sx, baseY + sy, this.dist);
    this.cam.lookAt(this.focusX + sx, lookY + sy, 0);
  }
  resize(w, h) {
    const a = w / h;
    this.cam.aspect = a;
    this.portrait = a < 0.9;
    this.cam.fov = this.portrait ? 55 : 38;
    this.cam.updateProjectionMatrix();
  }
};
