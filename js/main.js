/* KURSI CLASH - main: screens, input (keyboard + joystick touch), renderer, boot. */
window.KC = window.KC || {};

(function () {
  const el = KC.util.el, show = KC.util.show, hide = KC.util.hide;
  const screens = ['notice', 'title', 'select', 'hud', 'pause-menu', 'end-screen'];
  const only = id => screens.forEach(s => el(s) && el(s).classList.toggle('visible', s === id));

  const state = { difficulty: 1, selStage: 0, p1: null, p2: null };

  // ---------- renderer ----------
  const canvas = el('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new KC.Camera();
  let stageObj = null;

  function setStage(def) {
    if (stageObj) scene.remove(stageObj.group);
    const v = KC.STAGE_VISUALS[def.id];
    scene.background = new THREE.Color(v.sky);
    scene.fog = new THREE.Fog(v.sky, 18, 42);
    scene.children.filter(c => c.isLight).forEach(c => scene.remove(c));
    const dusk = v.bg === 'highway';
    scene.add(new THREE.AmbientLight(0xffffff, dusk ? 0.45 : 0.7));
    const sun = new THREE.DirectionalLight(dusk ? 0xffd9a0 : 0xfff5e0, dusk ? 0.8 : 1.2);
    sun.position.set(6, 12, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
    scene.add(sun);
    stageObj = new KC.Stage(scene, def);
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.resize(innerWidth, innerHeight);
  }
  addEventListener('resize', resize);

  // ---------- game object ----------
  const game = KC.game = {
    camera,
    hud: new KC.HUD(),
    commentary: new KC.Commentary(),
    fight: null,
    onMatchOver(winner, loser, wins) {
      setTimeout(() => {
        only('end-screen');
        el('end-title').textContent = winner.name + ' WINS!';
        el('end-quote').textContent = '"' + KC.util.pick(winner.win) + '"';
        game.commentary.say('A', winner.name + ' wins the kursi! ' + wins[0] + '-' + wins[1] + '!');
      }, 2400);
    }
  };

  // ---------- input ----------
  const input1 = { move: 0, punch: 0, kick: 0, grab: 0, block: 0, super: null };
  const keys = {};
  addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === 'j') input1.punch = 1;
    if (k === 'k') input1.kick = 1;
    if (k === 's' || k === 'g') input1.grab = 1;
    if (k === 'u') input1.super = 0;
    if (k === 'i') input1.super = 1;
    if (k === 'o' || k === 'l') input1.super = 2;
    if (k === 'enter' && el('title').classList.contains('visible')) only('select');
    if (k === 'escape' && game.fight && !game.fight.over) togglePause();
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  function pollKeys() {
    input1.move = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
    input1.block = !!keys['arrowdown'] || !!keys['w'];
  }

  // joystick
  const stickZone = el('stick-zone'), nub = el('stick-nub');
  let stickId = null, stickCX = 0, stickCY = 0;
  stickZone.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    stickId = t.identifier; stickCX = t.clientX; stickCY = t.clientY;
    e.preventDefault();
  }, { passive: false });
  stickZone.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== stickId) continue;
      const dx = t.clientX - stickCX, dy = t.clientY - stickCY;
      const max = 50;
      const nx = KC.util.clamp(dx / max, -1, 1), ny = KC.util.clamp(dy / max, -1, 1);
      input1.move = Math.abs(nx) > 0.25 ? nx : 0;
      input1.block = ny > 0.55;
      nub.style.transform = `translate(${KC.util.clamp(dx, -max, max)}px, ${KC.util.clamp(dy, -max, max)}px)`;
    }
    e.preventDefault();
  }, { passive: false });
  const stickEnd = e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== stickId) continue;
      stickId = null; input1.move = 0; input1.block = false;
      nub.style.transform = '';
    }
  };
  stickZone.addEventListener('touchend', stickEnd);
  stickZone.addEventListener('touchcancel', stickEnd);

  // action buttons
  document.querySelectorAll('#touch-buttons .tbtn').forEach(btn => {
    const b = btn.dataset.btn;
    const press = e => {
      e.preventDefault();
      if (b === 'super') input1.super = 2; // signature cine super
      else input1[b] = 1;
    };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('mousedown', press);
  });

  // ---------- select screen ----------
  const grid = el('roster-grid');
  KC.ROSTER.forEach(f => {
    const card = document.createElement('button');
    card.className = 'face-cell'; card.dataset.id = f.id;
    const port = KC.Faces.portrait(f, 104);
    card.appendChild(port);
    card.insertAdjacentHTML('beforeend', `<span class="fname">${f.name}</span>`);
    card.onclick = () => {
      state.p1 = f;
      [...grid.children].forEach(c => { c.classList.remove('sel-1'); const t = c.querySelector('.tag.cpu'); if (t) t.remove(); });
      card.classList.add('sel-1');
      const others = KC.ROSTER.filter(o => o.id !== f.id);
      state.p2 = KC.util.pick(others);
      const cpuCard = [...grid.children].find(c => c.dataset.id === state.p2.id);
      if (cpuCard) cpuCard.insertAdjacentHTML('beforeend', '<span class="tag cpu">CPU</span>');
      el('select-hint').textContent = f.name + '  vs  ' + state.p2.name + ' (random CPU)';
      const info = (f2, side) => {
        const box = el('fighter-info-' + side);
        box.innerHTML = `<h3>${f2.name}</h3><div class="fteam">${f2.team}</div><div class="fsuper">${f2.supers.map(sp => '<b>' + sp.name + '</b> - ' + sp.desc).join('<br>')}</div>`;
        box.style.display = 'block';
      };
      info(f, 'left'); info(state.p2, 'right');
    };
    grid.appendChild(card);
  });

  const stageRow = el('stage-row');
  KC.STAGES.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'opt-btn' + (i === 0 ? ' on' : '');
    b.textContent = s.name; b.title = s.desc;
    b.onclick = () => { state.selStage = i; [...stageRow.children].forEach((c, j) => c.classList.toggle('on', j === i)); };
    stageRow.appendChild(b);
  });

  const diffRow = el('diff-row');
  ['EASY', 'NORMAL', 'HARD'].forEach((d, i) => {
    const b = document.createElement('button');
    b.className = 'opt-btn' + (i === 1 ? ' on' : '');
    b.textContent = d;
    b.onclick = () => { state.difficulty = i; [...diffRow.children].forEach((c, j) => c.classList.toggle('on', j === i)); };
    diffRow.appendChild(b);
  });

  // ---------- screen wiring ----------
  el('notice-ok').onclick = () => { only('title'); KC.Audio._ensure(); };
  el('title').onclick = () => only('select');
  el('fight-btn').onclick = () => {
    if (!state.p1) { el('select-hint').textContent = 'Pehle neta chuno!'; return; }
    startFight();
  };
  el('rematch-btn').onclick = () => startFight();
  el('change-btn').onclick = () => { only('select'); game.hud.hide(); };
  el('pause-btn').onclick = () => togglePause();
  el('resume-btn').onclick = () => togglePause();
  el('quit-btn').onclick = () => {
    paused = false; hide('pause-menu');
    game.fight = null; game.hud.hide(); game.commentary.stopAll();
    only('select');
  };
  el('mute-btn').onclick = () => {
    const m = !game.commentary.muted;
    game.commentary.muted = m; KC.Audio.muted = m;
    if (m) game.commentary.stopAll();
    el('mute-btn').textContent = m ? '🔇' : '🔊';
  };

  let paused = false;
  function togglePause() {
    paused = !paused;
    el('pause-menu').classList.toggle('visible', paused);
  }

  function startFight() {
    const stage = KC.STAGES[state.selStage];
    only('hud');
    setStage(stage);
    game.commentary.stopAll();
    game.fight = new KC.Fight(scene, stage, state.p1, state.p2, 'cpu', state.difficulty);
    game.fight.startRound();
    resize();
  }

  // ---------- main loop ----------
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const rawDt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused && game.fight && !game.fight.over) {
      if (stickId === null) pollKeys();
      game.fight.update(rawDt, input1, input1);
      input1.punch = input1.kick = input1.grab = 0; input1.super = null;
    } else if (game.fight) {
      game.fight.p1.f3d.update(rawDt, game.fight.p1);
      game.fight.p2.f3d.update(rawDt, game.fight.p2);
      game.fight.fx.update(rawDt);
    }
    if (game.fight) {
      camera.follow(game.fight.p1.x, game.fight.p2.x, rawDt,
        game.fight.cinematic.active ? (game.fight.cinematic.attacker.x + game.fight.cinematic.defender.x) / 2 : undefined,
        game.fight.cinematic.active ? 5.5 : undefined);
    }
    if (stageObj) renderer.render(scene, camera.cam);
  }

  only('notice');
  resize();
  requestAnimationFrame(loop);
})();
