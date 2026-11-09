/* KURSI CLASH - online: friend-vs-friend over WebRTC via PeerJS cloud signaling (free public server, no account).
   Host gets a 6-letter room code; friend joins with it. Host simulates the fight and streams snapshots;
   guest renders puppets and sends inputs. All fight data is P2P after the free signaling handshake. */
window.KC = window.KC || {};

KC.Online = (function () {
  const PREFIX = 'kursi-clash-v1-';
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let peer = null, conn = null, role = null;
  let onMessageCb = null, onOpenCb = null, onCloseCb = null;

  // Loopback transport for automated subsystem verification: ?bc=1 swaps the
  // PeerJS/WebRTC transport for a same-browser BroadcastChannel room. Exercises
  // the real host/join/pick/start/input/snapshot protocol between two tabs.
  // NOT internet multiplayer - no network, no signaling, same machine only.
  const BC_MODE = new URLSearchParams(location.search).has('bc');
  let bcChan = null, bcWired = false;
  function bcHost(cb) {
    close();
    role = 'host';
    const code = makeCode();
    bcChan = new BroadcastChannel(PREFIX + code);
    bcChan.onmessage = e => {
      const d = e.data;
      if (!d) return;
      if (d.t === 'bc-hello' && !bcWired) {
        bcWired = true;
        bcChan.postMessage({ t: 'bc-ack' });
        if (onOpenCb) onOpenCb();
        return;
      }
      if (bcWired && onMessageCb) onMessageCb(d);
    };
    setTimeout(() => cb({ ok: true, code }), 30);
  }
  function bcJoin(code, cb) {
    close();
    role = 'guest';
    bcChan = new BroadcastChannel(PREFIX + code.toUpperCase().trim());
    let opened = false;
    bcChan.onmessage = e => {
      const d = e.data;
      if (!d) return;
      if (d.t === 'bc-ack' && !opened) {
        opened = true; bcWired = true;
        cb({ ok: true });
        if (onOpenCb) onOpenCb();
        return;
      }
      if (bcWired && onMessageCb) onMessageCb(d);
    };
    const hello = () => { if (!opened) { bcChan.postMessage({ t: 'bc-hello' }); setTimeout(hello, 400); } };
    hello();
    setTimeout(() => { if (!opened) cb({ ok: false, error: 'timeout' }); }, 12000);
  }

  function makeCode() {
    let c = '';
    for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return c;
  }

  function wire(c) {
    conn = c;
    c.on('data', d => { if (onMessageCb) onMessageCb(d); });
    c.on('open', () => { if (onOpenCb) onOpenCb(); });
    c.on('close', () => { if (onCloseCb) onCloseCb(); });
    c.on('error', () => { if (onCloseCb) onCloseCb(); });
  }

  function host(cb) {
    if (BC_MODE) { bcHost(cb); return; }
    close();
    role = 'host';
    const code = makeCode();
    peer = new Peer(PREFIX + code, { debug: 0 });
    peer.on('open', () => cb({ ok: true, code }));
    peer.on('connection', c => { if (!conn) wire(c); });
    peer.on('error', e => cb({ ok: false, error: String((e && e.type) || e) }));
  }

  function join(code, cb) {
    if (BC_MODE) { bcJoin(code, cb); return; }
    close();
    role = 'guest';
    peer = new Peer({ debug: 0 });
    peer.on('open', () => {
      const c = peer.connect(PREFIX + code.toUpperCase().trim(), { reliable: true });
      let opened = false;
      c.on('open', () => { opened = true; wire(c); cb({ ok: true }); });
      c.on('error', () => { if (!opened) cb({ ok: false, error: 'connect-failed' }); });
      setTimeout(() => { if (!opened) cb({ ok: false, error: 'timeout' }); }, 12000);
    });
    peer.on('error', e => cb({ ok: false, error: String((e && e.type) || e) }));
  }

  function send(obj) {
    if (BC_MODE) { if (bcChan && bcWired) { try { bcChan.postMessage(obj); } catch (e) { /* dropped frame */ } } return; }
    if (conn && conn.open) { try { conn.send(obj); } catch (e) { /* dropped frame */ } }
  }

  function connected() { return BC_MODE ? bcWired : !!(conn && conn.open); }
  function getRole() { return role; }
  function onMessage(cb) { onMessageCb = cb; }
  function onOpen(cb) { onOpenCb = cb; }
  function onClose(cb) { onCloseCb = cb; }

  function close() {
    try { if (bcChan) bcChan.close(); } catch (e) {}
    bcChan = null; bcWired = false;
    try { if (conn) conn.close(); } catch (e) {}
    try { if (peer) peer.destroy(); } catch (e) {}
    peer = null; conn = null; role = null;
  }

  return { host, join, send, connected, getRole, onMessage, onOpen, onClose, close };
})();
