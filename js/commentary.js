/* KURSI CLASH - commentary: two explicit layers.
   Layer 1 (instant): local persona banter (SHOR SHARMA + TWEETY TROLLWALA) - fires on every event, zero latency.
   Layer 2 (AI): Pollinations text API for big moments only - live limit 1 reply / 45s per IP (measured),
   ~9s latency (measured). Latest-event wins; late replies are recap-framed, never dropped for age.
   Voices: two original anchor personas via speechSynthesis. No celebrity voices. */
window.KC = window.KC || {};

KC.Commentary = class {
  constructor() {
    this.muted = false;
    this.b1 = KC.util.el('banter-1');
    this.b2 = KC.util.el('banter-2');
    this.bar = KC.util.el('banter-bar');
    this.personas = {
      A: { name: KC.BANTER_1.name, rate: 1.05, pitch: 1.3 },  // Shor Sharma, loud anchor
      B: { name: KC.BANTER_2.name, rate: 0.95, pitch: 0.8 },  // Tweety Trollwala, low troll
    };
    this._voices = null;
    this._queue = [];
    this._speaking = false;
    this._lastAIFetch = 0;
    this._aiBusy = false;
    this._pendingEvent = null;
    this._subT = null;
    this._lastLocal = 0;
    this._gen = 0;
    if (window.speechSynthesis) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => { this._voices = null; };
    }
    this.banks = {
      intro: ['{f1} vs {f2} - DESH LIVE mein aapka swagat hai!', 'Bhai log, {f1} aur {f2} aa gaye hain ring mein!'],
      bigHit: ['OOOH! {f} ne kya maara!', 'Yeh hui na asli baat, {f}!', 'Desh dekhta jaa raha hai, {f}!'],
      combo: ['{n} hits back to back! {f} on fire!', '{f} ka combo chalu hai bhai, {n} hits!'],
      low: ['{f} ki haalat kharaab! Doctor ko bulao!', '{f} ki battery low, kursi jaati hui!'],
      super: ['SUPER! {super} by {f}!!', 'Yeh dekhiye! {f} ka {super}! Historic moment!'],
      ko: ['{f} WINS the round! Desh hil gaya!', '{f} ne maidaan maar liya! K.O.!'],
      round: ['{f} ne round nikaala. Abhi baaki hai.', '{f} takes this one. Agla round dekho!'],
      chip: ['Block karke bhi damage? {f} ka defense leak ho raha hai!', '{f} ka guard strong, but chip chip chip.'],
      comeback: ['{f} wapasi kar raha hai! Script likhi ja rahi hai!', 'COMEBACK ALERT: {f} abhi zinda hai!'],
    };
    if (KC.extraCommentary) for (const k of ['super','ko','comeback']) {
      if (KC.extraCommentary[k]) this.banks[k] = this.banks[k].concat(KC.extraCommentary[k]);
    }
  }

  _pickVoice(cfg) {
    const vs = this._voices || (this._voices = speechSynthesis.getVoices());
    if (!vs.length) return null;  // empty list: browser default voice handles it
    // desi anchors first: hi-IN, then en-IN, then any English, then anything
    const hi = vs.filter(v => /^hi([-_]|$)/i.test(v.lang));
    const enIN = vs.filter(v => /^en[-_]IN$/i.test(v.lang));
    const en = vs.filter(v => /^en[-_]/i.test(v.lang));
    const pool = hi.length ? hi : enIN.length ? enIN : en.length ? en : vs;
    const i = cfg === this.personas.A ? 0 : 1;
    return pool[(i * 7 + 3) % pool.length];
  }

  // iOS/Safari + Chrome autoplay policies: the first speak() must ride a user
  // gesture. Call from a pointerdown/keydown handler; harmless if repeated.
  unlock() {
    if (!window.speechSynthesis || this._unlocked) return;
    this._unlocked = true;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.onend = u.onerror = () => {};
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  say(persona, text, opts) {
    if (this.muted) return;
    this._queue.push({ persona, text, opts: opts || {} });
    if (this._queue.length > 8) this._queue.splice(0, this._queue.length - 8);
    this._pump();
  }

  _pump() {
    if (this._speaking || !this._queue.length) return;
    const item = this._queue.shift();
    this._speaking = true;
    const cfg = this.personas[item.persona];
    this.b1.textContent = cfg.name.split(' ')[0] + ':';
    this.b2.textContent = item.text;
    clearTimeout(this._subT);
    this._subT = setTimeout(() => { this.b1.textContent = ''; this.b2.textContent = ''; }, Math.max(2600, item.text.length * 55));
    // pacing floor: every line displays at least minMs, advances when speech ends
    // after that; hardMs guarantees progress if speech hangs or never starts.
    const minMs = Math.max(2200, item.text.length * 40);
    const hardMs = Math.max(5000, item.text.length * 110);
    const t0 = performance.now();
    let speechEnded = false, advanced = false, fb = null;
    const gen = this._gen;
    const done = () => {
      if (advanced || gen !== this._gen) return; advanced = true;
      if (fb) clearTimeout(fb);
      this._speaking = false; setTimeout(() => this._pump(), 150);
    };
    const tick = () => {
      if (advanced || gen !== this._gen) return;
      const el2 = performance.now() - t0;
      if ((speechEnded && el2 >= minMs) || el2 >= hardMs) return done();
      fb = setTimeout(tick, 150);
    };
    fb = setTimeout(tick, 150);
    if (window.speechSynthesis && !this.muted) {
      try {
        const u = new SpeechSynthesisUtterance(item.text);
        u.rate = cfg.rate * (item.opts.rate || 1);
        u.pitch = cfg.pitch;
        u.volume = 0.9;
        const v = this._pickVoice(cfg);
        if (v) u.voice = v;
        u.onend = () => { speechEnded = true; };
        u.onerror = () => { speechEnded = true; };
        speechSynthesis.speak(u);
      } catch (e) { speechEnded = true; }
    } else speechEnded = true;
  }

  local(kind, ctx) {
    if (this.muted) return;
    const now = performance.now();
    if (now - this._lastLocal < 1600 && kind !== 'intro' && kind !== 'ko') return;
    this._lastLocal = now;
    const bank = this.banks[kind];
    if (!bank) return;
    let text = KC.util.pick(bank);
    const f = (ctx.f && ctx.f.name) || '';
    text = text.replaceAll('{f1}', (ctx.f1 && ctx.f1.name) || '').replaceAll('{f2}', (ctx.f2 && ctx.f2.name) || '')
      .replaceAll('{f}', f).replaceAll('{n}', ctx.n || '').replaceAll('{super}', ctx.superName || '');
    this.say(Math.random() < 0.6 ? 'A' : 'B', text);
  }

  aiMoment(kind, ctx) {
    if (this.muted) return;
    this._pendingEvent = { kind, ctx, at: performance.now() };
    this._maybeFetch();
  }

  async _maybeFetch() {
    if (this._aiBusy || !this._pendingEvent) return;
    const now = performance.now();
    const wait = 45000 - (now - this._lastAIFetch);
    if (wait > 0) { setTimeout(() => this._maybeFetch(), wait + 200); return; }
    const ev = this._pendingEvent; this._pendingEvent = null;
    this._aiBusy = true; this._lastAIFetch = performance.now();
    const { kind, ctx, at } = ev;
    const prompt =
      'You are a funny Indian news-debate fight commentator. One line, max 16 words, Hinglish, satirical, no real politician names. ' +
      (performance.now() - at > 8000 ? 'Recap style ("abhi abhi...", "kuch der pehle...") because it already happened. ' : '') +
      `Event: ${kind}. Fighter: ${ctx.f ? ctx.f.name : ''}. ${ctx.superName ? 'Move: ' + ctx.superName + '.' : ''} ${ctx.detail || ''}`;
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 15000);
      const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), { signal: ctl.signal });
      clearTimeout(to);
      if (res.status === 402) {
        const ra = parseInt(res.headers.get('Retry-After') || '45', 10);
        this._lastAIFetch = performance.now() - 45000 + ra * 1000;
        return;
      }
      if (!res.ok) return;
      let text = (await res.text()).trim().replace(/^["']|["']$/g, '').split('\n')[0];
      if (!text || text.length < 8) return;
      if (text.length > 160) text = text.slice(0, 157) + '...';
      this.say(Math.random() < 0.5 ? 'A' : 'B', text, { ai: true });
    } catch (e) { /* offline or blocked: local layer carries the show */ }
    finally { this._aiBusy = false; }
  }

  stopAll() {
    this._gen++;
    this._queue.length = 0;
    if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
    this._speaking = false;
    this._pendingEvent = null;
    this.b1.textContent = ''; this.b2.textContent = '';
  }
};
