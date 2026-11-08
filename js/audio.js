/* KURSI CLASH - audio: tiny WebAudio synth SFX. No audio assets. */
window.KC = window.KC || {};

KC.Audio = {
  ctx: null,
  muted: false,
  _ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },
  play(kind) {
    if (this.muted) return;
    const ctx = this._ensure(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    const conf = {
      swing: { f: 220, f2: 120, type: 'triangle', d: 0.12, v: 0.12 },
      hit:   { f: 140, f2: 60,  type: 'square',   d: 0.16, v: 0.22 },
      block: { f: 300, f2: 240, type: 'triangle', d: 0.08, v: 0.1 },
      super: { f: 100, f2: 600, type: 'sawtooth', d: 0.5,  v: 0.18 },
      ko:    { f: 400, f2: 50,  type: 'sawtooth', d: 0.7,  v: 0.25 },
    }[kind] || { f: 200, f2: 100, type: 'sine', d: 0.1, v: 0.1 };
    osc.type = conf.type;
    osc.frequency.setValueAtTime(conf.f, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, conf.f2), t + conf.d);
    g.gain.setValueAtTime(conf.v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + conf.d);
    osc.start(t); osc.stop(t + conf.d + 0.02);
  }
};
