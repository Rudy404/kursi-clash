/* KURSI CLASH - WebSocket room-relay transport (prototype, not wired into the UI).
   Mirrors the KC.Online interface slice used by main.js: host/join/send/connected/
   getRole/onMessage/onOpen/onClose/close. The default production path stays PeerJS;
   this module only runs when explicitly selected. Isomorphic: uses global WebSocket,
   so the same file runs in the browser and in the node integration test.

   Protocol against the room relay worker:
   - host:   POST {base}/create -> {roomId, hostKey, guestKey}; connect ws with
             subprotocol 'kc1.<hostKey>'. The guestKey is shared with the friend
             out of band (copy link).
   - guest:  connect ws {base}/ws/<roomId> with subprotocol 'kc1.<guestKey>'.
   - Every connect attempt is bounded by a handshake timeout (CONNECTING can hang
     indefinitely on some failure paths; we close and report 'timeout' instead).
   - One-shot control messages ({t:'start'|'pick'|'ev'}) go through sendReliable:
     they carry a mid, are retried every 600ms (max 8 tries) until the peer's
     {t:'ack', k, mid} arrives, and the receiver auto-acks + dedupes by mid so the
     game sees each one-shot exactly once. Inputs/snapshots stay fire-and-forget:
     the next frame always converges, retrying them would only add stale load. */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  root.KC = root.KC || {};

  const HANDSHAKE_TIMEOUT_MS = 8000; // below undici/native ~10s connect timeout, so our timer wins on true hangs
  const RETRY_MS = 600, RETRY_MAX = 8;
  const RELIABLE_TYPES = new Set(['start', 'pick', 'ev']);

  function makeTransport() {
    let ws = null, role = null, roomId = null, guestKey = null, hostKey = null;
    let onMessageCb = null, onOpenCb = null, onCloseCb = null;
    let opened = false, handshakeTimer = null, settled = false;
    let midCounter = 0;
    const pending = new Map(); // mid -> {obj, tries, timer}
    const seen = new Set();    // received mids (dedupe window)

    function nextMid() { return (Date.now() % 100000).toString(36) + (++midCounter).toString(36); }

    function clearHandshake() { if (handshakeTimer) { clearTimeout(handshakeTimer); handshakeTimer = null; } }

    function settle(cb, res) {
      if (settled) return;
      settled = true; clearHandshake();
      cb && cb(res);
    }

    function armHandshake(cb) {
      clearHandshake();
      handshakeTimer = setTimeout(() => {
        if (!opened) {
          settle(cb, { ok: false, error: 'timeout' }); // settle before close: close() can synchronously fire onerror
          try { ws && ws.close(); } catch (e) {}
        }
      }, HANDSHAKE_TIMEOUT_MS);
    }

    function wire(cb) {
      ws.onopen = () => {
        opened = true;
        if (onOpenCb) onOpenCb();
        settle(cb, { ok: true });
      };
      ws.onmessage = e => {
        let m;
        try { m = JSON.parse(e.data); } catch { return; }
        if (m.t === 'ack' && pending.has(m.mid)) {
          const p = pending.get(m.mid);
          clearTimeout(p.timer); pending.delete(m.mid);
          return; // acks are transport-internal
        }
        if (RELIABLE_TYPES.has(m.t) && typeof m.mid === 'string') {
          // ack first, deliver once
          send({ t: 'ack', k: m.t, mid: m.mid });
          if (seen.has(m.mid)) return;
          seen.add(m.mid);
          if (seen.size > 200) seen.delete(seen.values().next().value);
        }
        if (onMessageCb) onMessageCb(m);
      };
      ws.onclose = () => {
        for (const [, p] of pending) clearTimeout(p.timer);
        pending.clear();
        if (onCloseCb) onCloseCb();
      };
      ws.onerror = () => {
        if (!opened) settle(cb, { ok: false, error: 'connect-failed' });
      };
    }

    function wsUrl(base, room) {
      return `${base.replace(/^http/, 'ws').replace(/\/$/, '')}/ws/${room}`;
    }

    async function host(base, cb) {
      try {
        opened = false; settled = false;
        const r = await fetch(`${base.replace(/\/$/, '')}/create`, { method: 'POST' });
        if (!r.ok) { cb({ ok: false, error: r.status === 429 ? 'create-rate-limited' : 'create-failed' }); return; }
        const j = await r.json();
        roomId = j.roomId; guestKey = j.guestKey; hostKey = j.hostKey; role = 'host';
        ws = new WebSocket(wsUrl(base, roomId), [`kc1.${j.hostKey}`]);
        wire(cb); armHandshake(cb);
      } catch (e) { cb({ ok: false, error: String(e) }); }
    }

    // (re)connect to an existing room with a capability key; the server assigns
    // the role from the key, so pass the role the caller expects for getRole().
    function join(base, room, key, cb, expectedRole) {
      try {
        opened = false; settled = false;
        roomId = room; role = expectedRole || 'guest';
        ws = new WebSocket(wsUrl(base, room), [`kc1.${key}`]);
        wire(cb); armHandshake(cb);
      } catch (e) { cb({ ok: false, error: String(e) }); }
    }

    function send(obj) {
      if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(obj)); } catch (e) { /* dropped frame */ } }
    }

    // reliable path for one-shot control messages; plain sends for everything else
    function sendReliable(obj) {
      if (!RELIABLE_TYPES.has(obj.t)) { send(obj); return; }
      const mid = obj.mid || nextMid();
      obj.mid = mid;
      if (pending.has(mid)) return;
      const p = { obj, tries: 0, timer: null };
      const attempt = () => {
        if (!pending.has(mid)) return;
        if (++p.tries > RETRY_MAX) { pending.delete(mid); return; } // gave up; peer likely gone
        send(obj);
        p.timer = setTimeout(attempt, RETRY_MS);
      };
      pending.set(mid, p);
      attempt();
    }

    function connected() { return !!(ws && ws.readyState === 1); }
    function getRole() { return role; }
    function getGuestKey() { return guestKey; } // host shares this with the friend; never logged
    function getHostKey() { return hostKey; }   // stays local; used only for host reconnect
    function getRoomId() { return roomId; }
    function onMessage(cb) { onMessageCb = cb; }
    function onOpen(cb) { onOpenCb = cb; }
    function onClose(cb) { onCloseCb = cb; }
    function close() {
      clearHandshake();
      for (const [, p] of pending) clearTimeout(p.timer);
      pending.clear();
      try { if (ws) ws.close(); } catch (e) {}
      ws = null; role = null;
    }

    return { host, join, send, sendReliable, connected, getRole, getGuestKey, getHostKey, getRoomId, onMessage, onOpen, onClose, close };
  }

  root.KC.NetRelay = { make: makeTransport };
})();
