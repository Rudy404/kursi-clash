/* KURSI CLASH - main: screens, input (keyboard + joystick touch), renderer, boot. */
window.KC = window.KC || {};

(function () {
  const el = KC.util.el, show = KC.util.show, hide = KC.util.hide;
  const screens = ['notice', 'title', 'select', 'hud', 'pause-menu', 'end-screen'];
  const only = id => screens.forEach(s => el(s) && el(s).classList.toggle('visible', s === id));

  const state = { difficulty: 1, selStage: 0, p1: null, p2: null };
  const online = { active: false, role: null, guestPick: null,
    remoteInput: { move: 0, punch: 0, kick: 0, grab: 0, block: 0, super: null } };

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
  [...KC.ROSTER, KC.BOSS].forEach(f => {
    const card = document.createElement('button');
    card.className = 'face-cell'; card.dataset.id = f.id;
    const port = KC.Faces.portrait(f, 104);
    card.appendChild(port);
    card.insertAdjacentHTML('beforeend', `<span class="fname">${f.name}</span>`);
    card.onclick = () => {
      state.p1 = f;
      [...grid.children].forEach(c => { c.classList.remove('sel-1'); const t = c.querySelector('.tag.cpu'); if (t) t.remove(); });
      card.classList.add('sel-1');
      const others = [...KC.ROSTER, KC.BOSS].filter(o => o.id !== f.id);
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
  el('notice-ok').onclick = () => {
    KC.Audio._ensure();
    el('notice-ok').disabled = true;
    only('title');
  };
  el('title').onclick = () => only('select');
  // ---------- online friend mode (PeerJS cloud signaling, free public server) ----------
  const onlineStatus = t => { el('online-status').textContent = t; };
  el('friend-btn').onclick = () => el('online-panel').classList.toggle('hidden');
  el('join-btn').onclick = () => {
    const code = el('join-code').value.toUpperCase().trim();
    if (code.length !== 6) { onlineStatus('Enter the 6-letter room code.'); return; }
    onlineStatus('Joining room ' + code + '...');
    KC.Online.join(code, res => {
      if (!res.ok) { onlineStatus('Could not join: ' + res.error); return; }
      online.role = 'guest';
      onlineStatus('Connected! Pick your neta and hit FIGHT.');
    });
  };
  el('host-btn').onclick = () => {
    onlineStatus('Creating room...');
    KC.Online.host(res => {
      if (!res.ok) { onlineStatus('Could not create room: ' + res.error); return; }
      online.role = 'host';
      onlineStatus('Room code: ' + res.code + ' - share it with your friend. Waiting for them to join...');
    });
  };
  KC.Online.onOpen(() => {
    if (online.role === 'host') onlineStatus('Friend connected! Pick your neta and hit FIGHT when they have picked theirs.');
    if (online.role === 'guest') onlineStatus('Connected! Pick your neta and hit FIGHT.');
  });
  KC.Online.onClose(() => {
    onlineStatus('Connection closed.');
    if (online.active) { online.active = false; if (game.fight) { game.fight = null; game.hud.hide(); game.commentary.stopAll(); only('select'); } }
  });
  KC.Online.onMessage(d => {
    if (!d || !d.t) return;
    if (d.t === 'pick') { online.guestPick = d.name; onlineStatus('Friend picked ' + d.name + '. Your turn - pick and FIGHT!'); }
    if (d.t === 'start' && online.role === 'guest') {
      state.p1 = KC.ROSTER.find(r => r.name === d.p1) || state.p1;
      state.p2 = KC.ROSTER.find(r => r.name === d.p2) || state.p2;
      state.selStage = d.stage | 0;
      startFightOnline('guest');
    }
    if (d.t === 'in' && online.role === 'host') online.remoteInput = d.i;
    if (d.t === 'snap' && online.role === 'guest' && game.fight) game.fight.netSnap = d.s;
    if (d.t === 'ev' && online.role === 'guest' && game.fight && d.kind === 'super') game.fight.netSuperEvent(d);
  });
  async function startFightOnline(role) {
    online.active = true; online.role = role;
    await KC.FighterAssets.ensure([KC.FighterAssets.bodyFor(state.p1.id), KC.FighterAssets.bodyFor(state.p2.id)]);
    const stage = KC.STAGES[state.selStage];
    only('hud');
    setStage(stage);
    game.commentary.stopAll();
    if (game.fight) game.fight.dispose();
    game.fight = new KC.Fight(scene, stage, state.p1, state.p2, role === 'host' ? 'friend' : 'puppet', state.difficulty);
    online.active = true;
    el('touch-ui').classList.add('ingame');
    if (role === 'host') game.fight.startRound();
    else { game.fight.phase = 'intro'; KC.game.hud.show(state.p1, state.p2, 0, 0); }
    resize();
  }
  el('host-btn').disabled = false;

  el('fight-btn').onclick = () => {
    if (!state.p1) { el('select-hint').textContent = 'Pehle neta chuno!'; return; }
    if (online.role === 'host' && KC.Online.connected()) {
      if (!online.guestPick) { onlineStatus('Waiting for your friend to pick their neta...'); return; }
      state.p2 = KC.ROSTER.find(r => r.name === online.guestPick) || state.p2;
      KC.Online.send({ t: 'start', p1: state.p1.name, p2: state.p2.name, stage: state.selStage });
      startFightOnline('host');
      return;
    }
    if (online.role === 'guest' && KC.Online.connected()) {
      KC.Online.send({ t: 'pick', name: state.p1.name });
      state.p2 = state.p1; // placeholder until host sends start
      onlineStatus('Picked ' + state.p1.name + '. Waiting for host to start...');
      return;
    }
    startFight();
  };
  el('rematch-btn').onclick = () => startFight();
  el('change-btn').onclick = () => { only('select'); game.hud.hide(); el('touch-ui').classList.remove('ingame'); if (game.fight) { game.fight.dispose(); game.fight = null; } };
  el('pause-btn').onclick = () => togglePause();
  el('resume-btn').onclick = () => togglePause();
  el('quit-btn').onclick = () => {
    paused = false; hide('pause-menu');
    el('touch-ui').classList.remove('ingame');
    if (online.active) { online.active = false; KC.Online.close(); online.role = null; onlineStatus(''); }
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

  async function startFight() {
    const btn = el('fight-btn');
    btn.disabled = true; btn.textContent = 'LOADING...';
    await KC.FighterAssets.ensure([KC.FighterAssets.bodyFor(state.p1.id), KC.FighterAssets.bodyFor(state.p2.id)]);
    btn.disabled = false; btn.textContent = 'FIGHT!';
    const stage = KC.STAGES[state.selStage];
    only('hud');
    el('touch-ui').classList.add('ingame');
    setStage(stage);
    game.commentary.stopAll();
    if (game.fight) game.fight.dispose();
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
      if (online.active && online.role === 'host') {
        game.fight.update(rawDt, input1, online.remoteInput);
        online._acc = (online._acc || 0) + rawDt;
        if (online._acc > 0.066) {
          online._acc = 0;
          const f = game.fight, pack = p => ({ x: +p.x.toFixed(3), hp: +p.hp.toFixed(3), shakti: +p.shakti.toFixed(3),
            state: p.state, facing: p.facing, blocking: p.blocking, liftY: +p.liftY.toFixed(3), airborne: p.airborne, anim: p.f3d.anim });
          KC.Online.send({ t: 'snap', s: { p1: pack(f.p1), p2: pack(f.p2), phase: f.phase,
            timeLeft: +f.timeLeft.toFixed(2), round: f.round, wins: f.wins.slice(), timeUp: f.timeLeft <= 0 } });
        }
        while (f.events.length) {
          const ev = f.events.shift();
          if (ev.t === 'super') KC.Online.send({ t: 'ev', kind: 'super', i: ev.i, who: ev.who });
        }
      } else if (online.active && online.role === 'guest') {
        game.fight.update(rawDt, input1, input1);
        online._acc = (online._acc || 0) + rawDt;
        if (online._acc > 0.033) {
          online._acc = 0;
          KC.Online.send({ t: 'in', i: { move: input1.move, punch: input1.punch, kick: input1.kick,
            grab: input1.grab, block: input1.block, super: input1.super } });
        }
      } else {
        game.fight.update(rawDt, input1, input1);
      }
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
