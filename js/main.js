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
        online.matchStarted = false; // a new match needs a fresh FIGHT press (and fresh start one-shot)
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
    if (k === 'p') input1.super = 3; // bonus strike super
    if (k === 'h') input1.super = 4; // strike super 2
    if (k === 'n') input1.super = 5; // second cine super
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
  // SUPER: quick tap = signature cine (index 2). Hold ~450ms = super picker with all
  // six moves listed by name; tapping a name fires exactly that super. Discoverable and
  // intentional on touch; desktop keys u/i/o/p/h/n hit 0-5 directly.
  const picker = el('super-picker');
  let pickerOpenFor = null;
  const closePicker = () => { picker.classList.add('hidden'); pickerOpenFor = null; };
  const openPicker = () => {
    // the LOCAL player's fighter: host/CPU = p1, online guest = p2
    const def = game.fight ? (online.active && online.role === 'guest' ? game.fight.p2.def : game.fight.p1.def) : state.p1;
    if (!def || !def.supers) return false;
    picker.innerHTML = '<div class="sp-title">CHOOSE SUPER</div>' + def.supers.map((s, i) =>
      `<button data-si="${i}" class="${i === 2 ? 'sig' : ''}">${s.name}</button>`).join('');
    picker.querySelectorAll('button').forEach(b => {
      b.addEventListener('touchstart', ev => { ev.preventDefault(); ev.stopPropagation(); input1.super = +b.dataset.si; closePicker(); }, { passive: false });
      b.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); input1.super = +b.dataset.si; closePicker(); });
    });
    picker.classList.remove('hidden');
    pickerOpenFor = def.id;
    return true;
  };
  document.querySelectorAll('#touch-buttons .tbtn').forEach(btn => {
    const b = btn.dataset.btn;
    let holdT = null, held = false;
    const press = e => {
      e.preventDefault();
      if (b === 'super') {
        held = false;
        holdT = setTimeout(() => { held = openPicker(); }, 450);
      }
      else input1[b] = 1;
    };
    const release = e => {
      if (b !== 'super') return;
      clearTimeout(holdT);
      if (!held) { input1.super = 2; closePicker(); }
      held = false;
    };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release);
    btn.addEventListener('touchcancel', () => clearTimeout(holdT));
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
  });
  // tapping anywhere outside the picker closes it without firing
  document.addEventListener('touchstart', e => {
    if (pickerOpenFor && !picker.contains(e.target)) closePicker();
  }, { passive: true });

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
  // ---------- online friend mode (default PeerJS; optional WS room relay) ----------
  const onlineStatus = t => { el('online-status').textContent = t; };
  el('friend-btn').onclick = () => el('online-panel').classList.toggle('hidden');
  // relay transport is dev opt-in only (?relay=<base>) - no public UI until a live
  // verified relay endpoint exists. The join input widens for room keys in that mode.
  if (KC.NetRouter.getMode() === 'relay') {
    el('join-code').placeholder = 'Paste the full room key';
    el('join-code').removeAttribute('maxlength');
  }
  el('join-btn').onclick = () => {
    const code = el('join-code').value.trim();
    const isRelay = KC.NetRouter.getMode() === 'relay';
    if (!isRelay && code.length !== 6) { onlineStatus('Enter the 6-letter room code.'); return; }
    if (isRelay && !/^[0-9a-f]{32}:[0-9a-f]{32}$/.test(code)) { onlineStatus('Paste the full room key (room:secret).'); return; }
    onlineStatus('Joining room...');
    KC.NetRouter.join(code, res => {
      if (!res.ok) { onlineStatus('Could not join: ' + res.error); return; }
      online.role = 'guest';
      onlineStatus('Connected! Pick your neta and hit FIGHT.');
    });
  };
  el('host-btn').onclick = () => {
    onlineStatus('Creating room...');
    KC.NetRouter.host(res => {
      if (!res.ok) { onlineStatus('Could not create room: ' + res.error); return; }
      online.role = 'host';
      onlineStatus('Room code: ' + res.code + ' - share it with your friend. Waiting for them to join...');
    });
  };
  KC.NetRouter.onOpen(() => {
    // fires when OUR socket opens: meaningful for the guest (join succeeded);
    // the host learns about the friend via the peer-joined notice instead
    if (online.role === 'guest') onlineStatus('Connected! Pick your neta and hit FIGHT.');
  });
  KC.NetRouter.onClose(() => {
    // mid-match drop on the relay: try to rejoin with stored credentials before
    // tearing down - the snap stream converges the match after rejoin
    if (online.active && KC.NetRouter.getMode() === 'relay') {
      if (online.rejoining) return; // closes from superseded attempt transports
      online.rejoining = true;
      let tries = 0;
      onlineStatus('Connection dropped - rejoining...');
      const attempt = () => {
        tries++;
        KC.NetRouter.rejoin(res => {
          if (res.ok) {
            online.rejoining = false;
            onlineStatus('Reconnected!');
            // a rejoined GUEST tells the host whether its match object survived:
            // started=false makes the host resend 'start' (we never got it or the
            // fight is gone); started=true means the snap stream re-converges us.
            // the host never sends ready (authoritative; schema is guest-only)
            if (online.role === 'guest') KC.NetRouter.send({ t: 'ready', started: !!(online.matchStarted && game.fight) });
            return;
          }
          if (tries < 5) { onlineStatus('Connection dropped - retry ' + tries + '/5...'); setTimeout(attempt, 3000); return; }
          online.rejoining = false;
          onlineStatus('Connection closed.');
          online.active = false;
          if (game.fight) { game.fight = null; game.hud.hide(); game.commentary.stopAll(); only('select'); }
        });
      };
      setTimeout(attempt, 1000);
      return;
    }
    onlineStatus('Connection closed.');
    if (online.active) { online.active = false; if (game.fight) { game.fight = null; game.hud.hide(); game.commentary.stopAll(); only('select'); } }
  });
  KC.NetRouter.onMessage(d => {
    if (!d || !d.t) return;
    if (d.t === 'pick') { online.guestPick = d.name; onlineStatus('Friend picked ' + d.name + '. Your turn - pick and FIGHT!'); }
    if (d.t === 'peer' && d.state === 'joined' && online.role === 'host' && !online.matchStarted) {
      onlineStatus('Friend connected! Pick your neta and hit FIGHT when they have picked theirs.');
    }
    if (d.t === 'ready' && online.role === 'host') {
      // rejoined guest declares its state: if it never started (or lost the fight
      // object) while our match is running, resend the start one-shot so it can
      // build the fight; if it started, the 15Hz snap stream converges its puppet
      if (!d.started && online.matchStarted && game.fight && !game.fight.over) {
        KC.NetRouter.send({ t: 'start', p1: state.p1.name, p2: state.p2.name, stage: state.selStage });
      }
    }
    if (d.t === 'start' && online.role === 'guest') {
      online.matchStarted = true;
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
    if (online.role === 'host' && KC.NetRouter.connected()) {
      if (!online.guestPick) { onlineStatus('Waiting for your friend to pick their neta...'); return; }
      state.p2 = KC.ROSTER.find(r => r.name === online.guestPick) || state.p2;
      KC.NetRouter.send({ t: 'start', p1: state.p1.name, p2: state.p2.name, stage: state.selStage });
      online.matchStarted = true;
      startFightOnline('host');
      return;
    }
    if (online.role === 'guest' && KC.NetRouter.connected()) {
      KC.NetRouter.send({ t: 'pick', name: state.p1.name });
      state.p2 = state.p1; // placeholder until host sends start
      onlineStatus('Picked ' + state.p1.name + '. Waiting for host to start...');
      return;
    }
    startFight();
  };
  el('rematch-btn').onclick = () => {
    // online rematch: the host restarts over the wire (mode 'friend'), the guest
    // waits for the host's start one-shot - never fall back to a local CPU fight
    // while connected, or the friend's inputs silently stop mattering
    if (online.active && online.role === 'host' && KC.NetRouter.connected()) {
      KC.NetRouter.send({ t: 'start', p1: state.p1.name, p2: state.p2.name, stage: state.selStage });
      online.matchStarted = true;
      startFightOnline('host');
      return;
    }
    if (online.active && online.role === 'guest') {
      onlineStatus('Waiting for host to start the rematch...');
      return;
    }
    startFight();
  };
  el('change-btn').onclick = () => { only('select'); game.hud.hide(); el('touch-ui').classList.remove('ingame'); if (game.fight) { game.fight.dispose(); game.fight = null; } };
  el('pause-btn').onclick = () => togglePause();
  el('resume-btn').onclick = () => togglePause();
  el('quit-btn').onclick = () => {
    paused = false; hide('pause-menu');
    el('touch-ui').classList.remove('ingame');
    if (online.active) { online.active = false; online.matchStarted = false; KC.NetRouter.close(); online.role = null; onlineStatus(''); }
    if (game.fight) game.fight.dispose();
    game.fight = null; game.hud.hide(); game.commentary.stopAll();
    only('select');
  };
  // TTS autoplay unlock: first real gesture anywhere primes speechSynthesis.
  const unlockTTS = () => { game.commentary.unlock(); };
  window.addEventListener('pointerdown', unlockTTS, { passive: true });
  window.addEventListener('keydown', unlockTTS);
  el('mute-btn').onclick = () => {
    const m = !game.commentary.muted;
    game.commentary.muted = m; KC.Audio.muted = m;
    if (m) game.commentary.stopAll();
    el('mute-btn').textContent = m ? '🔇' : '🔊';
  };
  // flash-safe mode: kills the fullscreen impact flash and the animated speed lines.
  // honors the OS reduced-motion setting by default; the FX button overrides either way.
  {
    const fxBtn = el('fx-btn');
    const stored = localStorage.getItem('kc-lowfx');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const applyFx = low => { document.body.classList.toggle('lowfx', low); fxBtn.textContent = low ? '\u26A1\uFE0E' : '\u26A1'; fxBtn.style.opacity = low ? 0.45 : 1; };
    applyFx(stored === null ? reduced : stored === '1');
    fxBtn.onclick = () => {
      const low = !document.body.classList.contains('lowfx');
      localStorage.setItem('kc-lowfx', low ? '1' : '0');
      applyFx(low);
    };
  }

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
        const f = game.fight;
        if (online._acc > 0.066) {
          online._acc = 0;
          const pack = p => ({ x: +p.x.toFixed(3), hp: +p.hp.toFixed(3), shakti: +p.shakti.toFixed(3),
            state: p.state, facing: p.facing, blocking: p.blocking, liftY: +p.liftY.toFixed(3), airborne: p.airborne, anim: p.f3d.anim });
          KC.NetRouter.send({ t: 'snap', s: { p1: pack(f.p1), p2: pack(f.p2), phase: f.phase,
            timeLeft: +f.timeLeft.toFixed(2), round: f.round, wins: f.wins.slice(), timeUp: f.timeLeft <= 0 } });
        }
        while (f.events.length) {
          const ev = f.events.shift();
          if (ev.t === 'super') KC.NetRouter.send({ t: 'ev', kind: 'super', i: ev.i, who: ev.who });
        }
      } else if (online.active && online.role === 'guest') {
        game.fight.update(rawDt, input1, input1);
        online._acc = (online._acc || 0) + rawDt;
        // latch one-shot flags until the next send: taps used to vanish if no
        // packet went out on the exact frame the key was pressed
        const pd = online._pend || (online._pend = { punch: 0, kick: 0, grab: 0, super: null });
        pd.punch |= input1.punch; pd.kick |= input1.kick; pd.grab |= input1.grab;
        if (input1.super !== null && input1.super !== undefined) pd.super = input1.super;
        if (online._acc > 0.033) {
          online._acc = 0;
          KC.NetRouter.send({ t: 'in', i: { move: input1.move, punch: pd.punch, kick: pd.kick,
            grab: pd.grab, block: input1.block, super: pd.super } });
          pd.punch = pd.kick = pd.grab = 0; pd.super = null;
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
      const cine = game.fight.cinematic;
      camera.follow(game.fight.p1.x, game.fight.p2.x, rawDt,
        cine.active ? (cine.attacker.x + cine.defender.x) / 2 : undefined,
        cine.active ? (cine.camDist || 5.5) : undefined);
    }
    if (stageObj) renderer.render(scene, camera.cam);
  }

  only('notice');
  resize();
  requestAnimationFrame(loop);
})();
