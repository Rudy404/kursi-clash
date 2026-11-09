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
   Server messages pass through unchanged ({t:'welcome'|'peer'|'reject'} included);
   welcome/peer are relay-internal but surfaced so the game can resync on rejoin. */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  root.KC = root.KC || {};

  function makeTransport() {
    let ws = null, role = null, roomId = null, hostKey = null, guestKey = null;
    let onMessageCb = null, onOpenCb = null, onCloseCb = null;

    function wire(cb) {
      ws.onopen = () => { if (onOpenCb) onOpenCb(); cb && cb({ ok: true }); };
      ws.onmessage = e => {
        let m;
        try { m = JSON.parse(e.data); } catch { return; }
        if (onMessageCb) onMessageCb(m);
      };
      ws.onclose = () => { if (onCloseCb) onCloseCb(); };
      ws.onerror = () => { cb && cb({ ok: false, error: 'connect-failed' }); };
    }

    async function host(base, cb) {
      try {
        const r = await fetch(`${base.replace(/\/$/, '')}/create`, { method: 'POST' });
        if (!r.ok) { cb({ ok: false, error: r.status === 429 ? 'create-rate-limited' : 'create-failed' }); return; }
        const j = await r.json();
        roomId = j.roomId; hostKey = j.hostKey; guestKey = j.guestKey; role = 'host';
        ws = new WebSocket(`${base.replace(/^http/, 'ws').replace(/\/$/, '')}/ws/${roomId}`, [`kc1.${hostKey}`]);
        wire(cb);
      } catch (e) { cb({ ok: false, error: String(e) }); }
    }

    function join(base, room, key, cb) {
      try {
        roomId = room; role = 'guest';
        ws = new WebSocket(`${base.replace(/^http/, 'ws').replace(/\/$/, '')}/ws/${room}`, [`kc1.${key}`]);
        wire(cb);
      } catch (e) { cb({ ok: false, error: String(e) }); }
    }

    function send(obj) {
      if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(obj)); } catch (e) { /* dropped frame */ } }
    }
    function connected() { return !!(ws && ws.readyState === 1); }
    function getRole() { return role; }
    // the guest needs this to share with the friend; never logged
    function getGuestKey() { return guestKey; }
    function getRoomId() { return roomId; }
    function onMessage(cb) { onMessageCb = cb; }
    function onOpen(cb) { onOpenCb = cb; }
    function onClose(cb) { onCloseCb = cb; }
    function close() { try { if (ws) ws.close(); } catch (e) {} ws = null; role = null; }

    return { host, join, send, connected, getRole, getGuestKey, getRoomId, onMessage, onOpen, onClose, close };
  }

  root.KC.NetRelay = { make: makeTransport };
})();
