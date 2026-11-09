/* KURSI CLASH - transport router for friend-online.
   Default: PeerJS/WebRTC via KC.Online (production path, unchanged).
   Optional: WebSocket room relay via KC.NetRelay when the player picks RELAY mode
   (or ?relay=<base-url> is present). One interface for main.js either way:
   host/join/send/connected/getRole/onMessage/onOpen/onClose/close.
   On the relay transport, one-shot control messages (start/pick/ev) are sent over
   the ack/retry path automatically; streams stay fire-and-forget.
   Isomorphic: node-testable with globalThis.WebSocket/fetch. */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  root.KC = root.KC || {};

  const RELIABLE_TYPES = new Set(['start', 'pick', 'ev', 'ready']);

  let mode = 'peerjs'; // 'peerjs' | 'relay'
  let relayBase = null;
  let relay = null;          // KC.NetRelay transport instance
  let relayCreds = null;     // {roomId, key} for reconnect
  let onMessageCb = null, onOpenCb = null, onCloseCb = null;
  let gen = 0; // connection generation: transports from superseded attempts go silent

  // URL/config: ?relay=https://host.workers.dev enables relay mode with that base
  try {
    const q = new URLSearchParams(root.location ? root.location.search : '');
    const rb = q.get('relay');
    if (rb) { mode = 'relay'; relayBase = rb; }
  } catch (e) {}

  function wireRelayCbs(myGen) {
    // every callback is generation-guarded: a failed rejoin attempt's transport
    // must never surface close/open/message events once a newer attempt exists
    relay.onMessage(d => { if (myGen === gen && onMessageCb) onMessageCb(d); });
    relay.onOpen(() => { if (myGen === gen && onOpenCb) onOpenCb(); });
    relay.onClose(() => { if (myGen === gen && onCloseCb) onCloseCb(); });
    // a reliable one-shot exhausted its retries: the match state is no longer
    // trustworthy, so surface it as a connection loss (triggers rejoin/teardown)
    relay.onDrop(() => { if (myGen === gen && onCloseCb) onCloseCb(); });
  }

  function host(cb) {
    if (mode !== 'relay') return KC.Online.host(cb);
    relay = KC.NetRelay.make();
    wireRelayCbs(++gen);
    relay.host(relayBase, res => {
      if (res.ok) {
        relayCreds = { roomId: relay.getRoomId(), key: relay.getHostKey(), role: 'host' };
        // share string the host sends their friend; holds the guest capability
        res.code = relay.getRoomId() + ':' + relay.getGuestKey();
        res.shareNote = 'Share this whole code - it is the room key, not just a name.';
      }
      cb(res);
    });
  }

  function join(code, cb) {
    if (mode !== 'relay') return KC.Online.join(code, cb);
    const m = /^([0-9a-f]{32}):([0-9a-f]{32})$/.exec(String(code).trim());
    if (!m) { cb({ ok: false, error: 'bad-code' }); return; }
    relay = KC.NetRelay.make();
    wireRelayCbs(++gen);
    relay.join(relayBase, m[1], m[2], res => {
      if (res.ok) relayCreds = { roomId: m[1], key: m[2], role: 'guest' };
      cb(res);
    });
  }

  // reconnect with stored credentials after a blip. The seat freed on disconnect;
  // room capabilities live in DO storage until the room TTL expires.
  function rejoin(cb) {
    if (mode !== 'relay' || !relayCreds) { cb({ ok: false, error: 'no-creds' }); return; }
    relay = KC.NetRelay.make();
    wireRelayCbs(++gen);
    relay.join(relayBase, relayCreds.roomId, relayCreds.key, cb, relayCreds.role);
  }

  function send(obj) {
    if (mode !== 'relay') return KC.Online.send(obj);
    if (relay && RELIABLE_TYPES.has(obj.t)) relay.sendReliable(obj);
    else if (relay) relay.send(obj);
  }
  function connected() { return mode !== 'relay' ? KC.Online.connected() : !!(relay && relay.connected()); }
  function getRole() { return mode !== 'relay' ? KC.Online.getRole() : (relay ? relay.getRole() : null); }
  function onMessage(cb) { onMessageCb = cb; if (mode !== 'relay') KC.Online.onMessage(cb); }
  function onOpen(cb) { onOpenCb = cb; if (mode !== 'relay') KC.Online.onOpen(cb); }
  function onClose(cb) { onCloseCb = cb; if (mode !== 'relay') KC.Online.onClose(cb); }
  function close() { if (mode !== 'relay') return KC.Online.close(); if (relay) relay.close(); relay = null; relayCreds = null; }

  function getMode() { return mode; }
  function getRelayBase() { return relayBase; }
  function setRelay(base) { mode = 'relay'; relayBase = base; }
  function setPeerJS() { mode = 'peerjs'; relayBase = null; }

  root.KC.NetRouter = { host, join, rejoin, send, connected, getRole, onMessage, onOpen, onClose, close, getMode, getRelayBase, setRelay, setPeerJS };
})();
