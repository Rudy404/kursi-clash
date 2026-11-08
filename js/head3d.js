/* KURSI CLASH - head3d: parametric sculpted 3D caricature heads. Original art built from
   primitives (spheres/lathe/torus) - no photos, no scans, no real-person likeness. */
window.KC = window.KC || {};

KC.Head3D = {
  build(f) {
    const g = new THREE.Group();
    const M = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.72 : r });
    const skin = M(f.skin, 0.65);
    const hairCol = { sidepart: 0x4a4a4a, swoop: 0xe8c25a, bun: 0x333333, curly: 0x222222, receding: 0x555555, shaved: 0x3a3a3a }[f.hair] || 0x2b2b2b;
    const beardCol = { white: 0xe8e8e8, stubble: 0x4a4038, saffron: 0xc96a1e, mustache: 0x3a2a20 }[f.beard];
    const add = (geo, mat, x, y, z, sx, sy, sz, parent) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (sx != null) m.scale.set(sx, sy, sz);
      m.castShadow = true;
      (parent || g).add(m); return m;
    };
    const sph = (a, b) => new THREE.SphereGeometry(1, a || 20, b || 14);

    // cranium + jaw (slightly chibi, smooth)
    add(sph(), skin, 0, 0.30, 0, 0.34, 0.37, 0.33);
    add(sph(), skin, 0, 0.06, 0.02, 0.27, 0.24, 0.27);
    // ears
    add(sph(12, 10), skin, -0.33, 0.22, 0, 0.08, 0.11, 0.07);
    add(sph(12, 10), skin, 0.33, 0.22, 0, 0.08, 0.11, 0.07);
    // nose: bridge + tip
    add(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 8), skin, 0, 0.20, 0.33).rotation.x = 0.35;
    add(sph(12, 10), skin, 0, 0.13, 0.36, 0.075, 0.07, 0.08);

    // eyes (whites + pupils + sparkle)
    const eyeY = 0.34, eyeX = 0.115;
    for (const s of [-1, 1]) {
      add(sph(), M(0xffffff, 0.35), s * eyeX, eyeY, 0.27, 0.085, 0.065, 0.05);
      add(sph(10, 8), M(0x2b2b2b, 0.3), s * eyeX * 1.05, eyeY, 0.315, 0.028, 0.028, 0.02);
      add(sph(6, 5), M(0xffffff, 0.2), s * eyeX * 1.05 + 0.012, eyeY + 0.012, 0.33, 0.009, 0.009, 0.007);
      // brow
      const brow = add(new THREE.BoxGeometry(0.16, 0.035, 0.04), M(0x222222, 0.8), s * eyeX, eyeY + 0.105, 0.30);
      brow.rotation.z = s * -0.15;
    }

    // grin: torus arc
    const grin = add(new THREE.TorusGeometry(0.09, 0.018, 8, 16, Math.PI * 0.9), M(0x7a3b2a, 0.6), 0, 0.075, 0.28);
    grin.rotation.set(0.25, 0, Math.PI + Math.PI * 0.05);

    // glasses
    if (f.glasses) {
      const gm = M(0x3a2c14, 0.4);
      for (const s of [-1, 1]) {
        const ring = add(new THREE.TorusGeometry(0.085, 0.012, 8, 20), gm, s * eyeX, eyeY, 0.315);
        ring.rotation.x = 0.06;
        const arm = add(new THREE.BoxGeometry(0.02, 0.015, 0.22), gm, s * (eyeX + 0.085), eyeY + 0.01, 0.20);
        arm.rotation.y = s * -0.15;
      }
      add(new THREE.BoxGeometry(0.06, 0.014, 0.02), gm, 0, eyeY + 0.01, 0.315);
    }

    // hair
    const hm = M(hairCol, 0.85);
    if (f.hair === 'sidepart') {
      add(sph(), hm, 0.015, 0.52, -0.02, 0.335, 0.22, 0.325);
      add(sph(), skin, 0.06, 0.56, 0.05, 0.06, 0.10, 0.20); // part hint
    } else if (f.hair === 'swoop') {
      const sw = add(new THREE.TorusGeometry(0.24, 0.11, 10, 18, Math.PI * 1.2), hm, 0, 0.52, 0.02);
      sw.rotation.set(0.5, 0, -0.5);
      add(sph(), hm, 0, 0.55, -0.06, 0.33, 0.18, 0.30);
    } else if (f.hair === 'bun') {
      add(sph(), hm, 0, 0.52, -0.02, 0.33, 0.20, 0.32);
      add(sph(12, 10), hm, 0, 0.68, -0.10, 0.10, 0.10, 0.10);
    } else if (f.hair === 'curly') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI - Math.PI * 0.05;
        add(sph(10, 8), hm, Math.cos(a) * 0.22, 0.50 + Math.sin(i * 2.3) * 0.05, 0.10 - Math.abs(Math.cos(a)) * 0.18, 0.10, 0.10, 0.10);
      }
      add(sph(), hm, 0, 0.55, -0.05, 0.30, 0.18, 0.28);
    } else if (f.hair === 'receding') {
      add(sph(), hm, -0.20, 0.48, 0.02, 0.14, 0.12, 0.20);
      add(sph(), hm, 0.20, 0.48, 0.02, 0.14, 0.12, 0.20);
      add(sph(), hm, 0, 0.52, -0.12, 0.30, 0.16, 0.22);
    } else if (f.hair === 'shaved') {
      add(sph(), M(0x4a4a4a, 0.95), 0, 0.52, -0.02, 0.335, 0.19, 0.32);
    }

    // beards
    if (f.beard === 'white' || f.beard === 'saffron') {
      const bm = M(beardCol, 0.85);
      add(sph(), bm, 0, -0.02, 0.10, 0.26, 0.22, 0.24);           // jaw beard
      add(sph(), bm, 0, -0.14, 0.12, 0.16, 0.16, 0.15);           // beard tip
      add(sph(10, 8), bm, -0.07, 0.10, 0.30, 0.075, 0.035, 0.04); // mustache L
      add(sph(10, 8), bm, 0.07, 0.10, 0.30, 0.075, 0.035, 0.04);  // mustache R
    } else if (f.beard === 'mustache') {
      const bm = M(beardCol, 0.85);
      const ml = add(sph(10, 8), bm, -0.075, 0.10, 0.31, 0.085, 0.04, 0.045);
      const mr = add(sph(10, 8), bm, 0.075, 0.10, 0.31, 0.085, 0.04, 0.045);
      ml.rotation.z = 0.25; mr.rotation.z = -0.25;
    } else if (f.beard === 'stubble') {
      add(sph(), M(0x554a40, 0.95), 0, 0.03, 0.05, 0.265, 0.22, 0.26);
    }

    // signature extras
    if (f.id === 'mufflerman') {
      const mm = M(0xd8d2c4, 0.9);
      const wrap = add(new THREE.TorusGeometry(0.24, 0.06, 10, 20), mm, 0, -0.10, 0.02);
      wrap.rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(0.12, 0.3, 0.05), mm, 0.10, -0.28, 0.18);
    }
    if (f.id === 'chaiboss') { // chai-stain kurta legend: small chai glass in ear? no - tilak
      add(new THREE.BoxGeometry(0.03, 0.09, 0.015), M(0xd43a2a, 0.6), 0, 0.47, 0.315);
    }
    return g;
  }
};
