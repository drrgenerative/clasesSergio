/* Capa de datos: Firebase Realtime Database (modo en vivo) o el navegador (modo demo). */
(function () {
  var params = new URLSearchParams(location.search);
  /* La sala es la clase + el grupo (si hay). Ej.: m4s1, o m3s3-grupoB para repetir la clase con otro grupo. */
  var SALA = (params.get('sala') || ((window.CLASE_ID || 'clase') + (window.GRUPO ? '-' + window.GRUPO : ''))).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'clase';
  var cfg = window.FIREBASE_CONFIG || {};
  var configurado = !!(cfg.apiKey && cfg.databaseURL && String(cfg.apiKey).indexOf('PEGA_AQUI') < 0 && String(cfg.databaseURL).indexOf('PEGA_AQUI') < 0);
  var demo = params.get('demo') === '1';
  var TS = { '.sv': 'timestamp' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Modo demo: todo vive en este navegador; sirve para probar con varias pestañas ---------- */
  function Demo() {
    var KEY = 'fbdemo:' + SALA, bc = null, subs = [];
    try { bc = new BroadcastChannel(KEY); } catch (e) {}
    function tree() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
    function save(t) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {} fire(); if (bc) bc.postMessage(1); }
    function get(t, p) { var parts = p.split('/').filter(Boolean); for (var i = 0; i < parts.length; i++) { if (t == null || typeof t !== 'object') return null; t = t[parts[i]]; } return t === undefined ? null : t; }
    function fix(v) { if (v && typeof v === 'object') { if (v['.sv'] === 'timestamp') return Date.now(); var o = Array.isArray(v) ? [] : {}; for (var k in v) o[k] = fix(v[k]); return o; } return v; }
    function setp(t, p, v) { var parts = p.split('/').filter(Boolean), o = t; for (var i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; } if (v === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = fix(v); }
    function fire() { var t = tree(); subs.forEach(function (s) { var v = get(t, s.p), j = JSON.stringify(v); if (j !== s.last) { s.last = j; s.cb(v); } }); }
    if (bc) bc.onmessage = fire;
    window.addEventListener('storage', function (e) { if (e.key === KEY) fire(); });
    var uid = null;
    try { uid = sessionStorage.getItem('demo-uid'); if (!uid) { uid = 'demo' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('demo-uid', uid); } } catch (e) { uid = 'demo' + Math.random().toString(36).slice(2, 10); }
    return {
      modo: 'demo', uid: uid,
      iniciar: function () { return Promise.resolve(uid); },
      loginProfe: function () { return Promise.resolve(true); },
      escuchar: function (p, cb) { var s = { p: 'salas/' + SALA + '/' + p, cb: cb, last: undefined }; subs.push(s); setTimeout(fire, 0); return function () { subs = subs.filter(function (x) { return x !== s; }); }; },
      poner: function (p, v) { var t = tree(); setp(t, 'salas/' + SALA + '/' + p, v); save(t); return Promise.resolve(); },
      borrar: function (p) { var t = tree(); setp(t, 'salas/' + SALA + '/' + p, null); save(t); return Promise.resolve(); },
      leer: function (p) { return Promise.resolve(get(tree(), 'salas/' + SALA + '/' + p)); },
      presencia: function () {
        var self = this, p = 'online/' + uid;
        self.poner(p, true);
        window.addEventListener('pagehide', function () { self.borrar(p); });
        window.addEventListener('pageshow', function (e) { if (e.persisted) self.poner(p, true); });
      },
      reiniciarTodo: function () { try { localStorage.removeItem(KEY); } catch (e) {} fire(); if (bc) bc.postMessage(1); }
    };
  }

  /* ---------- Modo en vivo: Firebase ---------- */
  function Live() {
    var V = '10.12.2', base = 'https://www.gstatic.com/firebasejs/' + V + '/';
    var F = {}, db = null, api = { modo: 'live', uid: null };
    api.iniciar = function () {
      return Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-database.js')]).then(function (m) {
        F.app = m[0]; F.auth = m[1]; F.db = m[2];
        var app = F.app.initializeApp(cfg);
        var auth = F.auth.getAuth(app);
        db = F.db.getDatabase(app);
        return F.auth.signInAnonymously(auth).then(function (c) { api.uid = c.user.uid; return api.uid; });
      });
    };
    function r(p) { return F.db.ref(db, p); }
    api.loginProfe = function (clave) { return F.db.set(r('profes/' + api.uid), clave).then(function () { return true; }); };
    api.escuchar = function (p, cb, err) { return F.db.onValue(r('salas/' + SALA + '/' + p), function (s) { cb(s.val()); }, function (e) { if (err) err(e); else console.warn(e); }); };
    api.poner = function (p, v) { return F.db.set(r('salas/' + SALA + '/' + p), v); };
    api.leer = function (p) { return F.db.get(r('salas/' + SALA + '/' + p)).then(function (s) { return s.val(); }); };
    api.borrar = function (p) { return F.db.remove(r('salas/' + SALA + '/' + p)); };
    /* Presencia: Firebase borra online/{uid} solo cuando se cierra la conexión (pestaña cerrada, sin internet). */
    api.presencia = function () {
      var me = r('salas/' + SALA + '/online/' + api.uid);
      F.db.onValue(r('.info/connected'), function (s) {
        if (!s.val()) return;
        F.db.onDisconnect(me).remove().then(function () { return F.db.set(me, true); }).catch(function (e) { console.warn(e); });
      });
      window.addEventListener('pagehide', function () { F.db.remove(me).catch(function () {}); });
      window.addEventListener('pageshow', function (e) { if (e.persisted) F.db.set(me, true).catch(function () {}); });
    };
    api.conexion = function (cb) { return F.db.onValue(r('.info/connected'), function (s) { cb(!!s.val()); }); };
    return api;
  }

  window.APP = {
    SALA: SALA, CLASE_ID: window.CLASE_ID, GRUPO: window.GRUPO || '', TS: TS, esc: esc, store: store, demo: demo, configurado: configurado,
    DB: demo ? Demo() : (configurado ? Live() : null),
    clase: window.CLASE,
    act: function (id) { return (window.CLASE.actividades.filter(function (a) { return a.id === id; })[0]) || null; },
    clave: function (a, q) { return (a.tipo === 'quiz' || a.tipo === 'encuesta') ? a.id + '_' + (q || 0) : a.id; },
    /* Resultado personal de madurez: promedio por dimensión */
    promedios: function (a, v) {
      var out = [], k = 0;
      a.grupos.forEach(function (g) { var s = 0, n = 0; g.items.forEach(function () { var x = +((v || [])[k++]); if (x >= 1 && x <= 5) { s += x; n++; } }); out.push(n ? s / n : 0); });
      return out;
    },
    nivel: function (x) { return x < 2 ? 'Inicial' : x < 3 ? 'En desarrollo' : x < 4 ? 'Avanzado' : 'Líder'; },
    bloqueo: function (v) { for (var i = 0; i < 5; i++) { if ((+v[i] || 0) <= 3) return i; } return -1; }
  };
})();
