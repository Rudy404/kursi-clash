/* KURSI CLASH - faces: original cartoon caricature faces drawn on canvas. No photos, no likeness assets. */
window.KC = window.KC || {};

KC.Faces = {
  cache: {},
  get(f) {
    if (this.cache[f.id]) return this.cache[f.id];
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const skin = '#' + f.skin.toString(16).padStart(6, '0');
    // head base
    x.fillStyle = skin; x.fillRect(0, 0, 256, 256);
    // jaw shading
    x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(0, 200, 256, 56);

    const cx = 128, eyeY = 108;
    // ears
    x.fillStyle = skin;
    x.beginPath(); x.arc(26, 130, 18, 0, 7); x.arc(230, 130, 18, 0, 7); x.fill();

    // hair
    x.fillStyle = f.hair === 'none' || f.hair === 'shaved' ? skin : '#2b2b2b';
    if (f.hair === 'sidepart') { x.fillStyle = '#4a4a4a'; x.fillRect(30, 10, 196, 46); x.fillStyle = skin; x.fillRect(120, 10, 14, 30); }
    if (f.hair === 'swoop') { x.fillStyle = '#e8c25a'; x.beginPath(); x.moveTo(20, 60); x.quadraticCurveTo(120, -30, 240, 40); x.lineTo(240, 66); x.quadraticCurveTo(140, 10, 20, 76); x.fill(); }
    if (f.hair === 'bun') { x.fillStyle = '#333'; x.fillRect(34, 20, 188, 40); x.beginPath(); x.arc(128, 18, 24, 0, 7); x.fill(); }
    if (f.hair === 'curly') { x.fillStyle = '#222'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(40 + i * 22, 38 + (i % 2) * 8, 16, 0, 7); x.fill(); } }
    if (f.hair === 'receding') { x.fillStyle = '#555'; x.fillRect(30, 26, 60, 26); x.fillRect(166, 26, 60, 26); }
    if (f.hair === 'shaved') { x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(30, 8, 196, 26); }

    // brows
    x.strokeStyle = '#222'; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.moveTo(62, eyeY - 26); x.lineTo(106, eyeY - 32); x.moveTo(150, eyeY - 32); x.lineTo(194, eyeY - 26); x.stroke();

    // eyes
    x.fillStyle = '#fff';
    x.beginPath(); x.ellipse(84, eyeY, 22, 14, 0, 0, 7); x.ellipse(172, eyeY, 22, 14, 0, 0, 7); x.fill();
    x.fillStyle = '#2b2b2b';
    x.beginPath(); x.arc(86, eyeY + 1, 7, 0, 7); x.arc(170, eyeY + 1, 7, 0, 7); x.fill();
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(88, eyeY - 1, 2.4, 0, 7); x.arc(172, eyeY - 1, 2.4, 0, 7); x.fill();

    // superstar sunglasses
    if (f.shades) {
      x.fillStyle = '#14181f';
      x.beginPath(); x.roundRect(54, eyeY - 22, 62, 42, 10); x.roundRect(140, eyeY - 22, 62, 42, 10); x.fill();
      x.fillStyle = '#1a1a1a'; x.fillRect(50, eyeY - 30, 156, 12); x.fillRect(112, eyeY - 4, 32, 8);
      x.fillStyle = 'rgba(255,255,255,.28)';
      x.beginPath(); x.ellipse(74, eyeY - 10, 10, 5, -0.5, 0, 7); x.ellipse(160, eyeY - 10, 10, 5, -0.5, 0, 7); x.fill();
    }

    // glasses
    if (f.glasses) {
      x.strokeStyle = '#3a2c14'; x.lineWidth = 5;
      x.strokeRect(56, eyeY - 18, 56, 38); x.strokeRect(144, eyeY - 18, 56, 38);
      x.beginPath(); x.moveTo(112, eyeY); x.lineTo(144, eyeY); x.stroke();
    }

    // nose
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(128, 122); x.quadraticCurveTo(138, 148, 126, 156); x.stroke();

    // mouth: confident grin
    x.strokeStyle = '#7a3b2a'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(96, 186); x.quadraticCurveTo(128, 202, 160, 186); x.stroke();

    // beard styles
    const beardCol = { white: '#e8e8e8', stubble: 'rgba(40,40,40,.45)', saffron: '#c96a1e', mustache: '#3a2a20', none: null }[f.beard];
    if (f.beard === 'stubble') { x.fillStyle = beardCol; x.fillRect(58, 172, 140, 66); }
    if (f.beard === 'mustache') { x.fillStyle = beardCol; x.fillRect(92, 168, 72, 14); }
    if (f.beard === 'white' || f.beard === 'saffron') {
      x.fillStyle = beardCol;
      x.fillRect(92, 166, 72, 12); // mustache
      x.beginPath(); x.moveTo(66, 190); x.quadraticCurveTo(128, 260, 190, 190); x.lineTo(190, 214); x.quadraticCurveTo(128, 268, 66, 214); x.fill();
    }
    this.cache[f.id] = c;
    return c;
  },
  // small portrait canvas for select grid / HUD
  portrait(f, size) {
    const src = this.get(f);
    const c = document.createElement('canvas'); c.width = c.height = size;
    c.getContext('2d').drawImage(src, 0, 0, size, size);
    return c;
  }
};
