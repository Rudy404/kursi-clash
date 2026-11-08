/* KURSI CLASH - util */
window.KC = window.KC || {};
KC.util = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(KC.util.rand(a, b + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  el: (id) => document.getElementById(id),
  show(id) { KC.util.el(id).classList.add('visible'); },
  hide(id) { KC.util.el(id).classList.remove('visible'); },
  // simple tween runner
  tweens: [],
  tween(obj, prop, to, dur, ease, onDone) {
    KC.util.tweens.push({ obj, prop, from: obj[prop], to, t: 0, dur, ease: ease || (x => x), onDone });
  },
  tickTweens(dt) {
    const T = KC.util.tweens;
    for (let i = T.length - 1; i >= 0; i--) {
      const tw = T[i]; tw.t += dt;
      const k = KC.util.clamp(tw.t / tw.dur, 0, 1);
      tw.obj[tw.prop] = KC.util.lerp(tw.from, tw.to, tw.ease(k));
      if (k >= 1) { T.splice(i, 1); tw.onDone && tw.onDone(); }
    }
  },
  easeOut: x => 1 - Math.pow(1 - x, 3),
  easeIn: x => x * x * x,
  // Hinglish-safe fetch with timeout
  async fetchText(url, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs || 12000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      const body = await r.text();
      return { status: r.status, body, retryAfter: r.headers.get('retry-after') };
    } finally { clearTimeout(t); }
  }
};
