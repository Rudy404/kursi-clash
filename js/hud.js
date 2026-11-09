/* KURSI CLASH - hud: DOM HUD updates against the shipped markup. */
window.KC = window.KC || {};

KC.HUD = class {
  constructor() {
    this.el = {
      hud: KC.util.el('hud'),
      h1: KC.util.el('health-1'), h2: KC.util.el('health-2'),
      c1: KC.util.el('chip-1'), c2: KC.util.el('chip-2'),
      s1: KC.util.el('shakti-1'), s2: KC.util.el('shakti-2'),
      n1: KC.util.el('hud-name-1'), n2: KC.util.el('hud-name-2'),
      p1: KC.util.el('pips-1'), p2: KC.util.el('pips-2'),
      timer: KC.util.el('timer'),
      ticker: KC.util.el('ticker-text'),
      splash: KC.util.el('splash'),
    };
    this._splashT = null;
    this._lastHp = [1, 1];
  }
  show(f1, f2, w1, w2) {
    KC.util.show('hud');
    this.el.n1.textContent = f1.name;
    this.el.n2.textContent = f2.name;
    this._pips(this.el.p1, w1); this._pips(this.el.p2, w2);
    this.el.h1.style.width = '100%'; this.el.h2.style.width = '100%';
    this.el.c1.style.width = '100%'; this.el.c2.style.width = '100%';
    this.el.s1.style.width = '0%'; this.el.s2.style.width = '0%';
    this._lastHp = [1, 1];
    const items = KC.TICKER_LINES.concat([`LIVE: ${f1.name} vs ${f2.name} - sab dekhte jao!`]);
    this.el.ticker.textContent = items.join('  +++  ') + '  +++  ';
  }
  _pips(el, wins) {
    el.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      const d = document.createElement('span');
      d.className = 'pip' + (i < wins ? ' won' : '');
      el.appendChild(d);
    }
  }
  hide() { KC.util.hide('hud'); }
  update(p1, p2, timeLeft) {
    const w1 = Math.max(0, p1.hp * 100), w2 = Math.max(0, p2.hp * 100);
    this.el.h1.style.width = w1 + '%'; this.el.h2.style.width = w2 + '%';
    // ghost chip trails damage
    if (p1.hp < this._lastHp[0] - 0.001) { this.el.c1.style.width = w1 + '%'; }
    else this.el.c1.style.width = w1 + '%';
    if (p2.hp < this._lastHp[1] - 0.001) { this.el.c2.style.width = w2 + '%'; }
    else this.el.c2.style.width = w2 + '%';
    this._lastHp = [p1.hp, p2.hp];
    this.el.s1.style.width = (p1.shakti * 100) + '%';
    this.el.s2.style.width = (p2.shakti * 100) + '%';
    this.el.timer.textContent = Math.ceil(timeLeft);
    this.el.timer.classList.toggle('low', timeLeft <= 10);
  }
  splash(text, dur, small) {
    this.el.splash.innerHTML = `<div class="spl"${small ? ' style="font-size:min(7vw,54px)"' : ''}>${text}</div>`;
    clearTimeout(this._splashT);
    this._splashT = setTimeout(() => { this.el.splash.innerHTML = ''; }, dur || 1400);
  }
  cineLabel(text) {
    if (!text) { this.el.splash.innerHTML = ''; return; }
    this.el.splash.innerHTML = `<div class="spl" style="font-size:min(6vw,44px);-webkit-text-stroke:2px var(--ink);text-shadow:0 4px 0 rgba(0,0,0,.45)">${text}</div>`;
  }
};
