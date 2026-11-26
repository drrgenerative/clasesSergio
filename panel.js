(function () {
  var A = APP, DB = A.DB, esc = A.esc, acts = A.clase.actividades, $ = function (id) { return document.getElementById(id); };
  var estado = {}, aliases = {}, online = {}, cur = acts[0].id, viewQ = 0, resp = {}, unsub = null, hl = {};
  var COL = ['#1565B0', '#F2B705', '#2E7D4F', '#B83A2B', '#7A4FB5', '#161616'];

  $('ptitle').textContent = A.clase.titulo;
  $('psala').textContent = 'Sala: ' + A.SALA;
  var linkEst = new URL('index.html', location.href);
  linkEst.search = '?clase=' + encodeURIComponent(A.CLASE_ID) + (A.GRUPO ? '&grupo=' + encodeURIComponent(A.GRUPO) : '') + (A.demo ? '&demo=1' : '');
  /* Selector de clase y grupo */
  (function () {
    var box = $('selclase'); if (!box) return;
    var lista = window.INDICE_CLASES || [];
    box.innerHTML = '<label style="font-size:.75rem;color:#bbb;display:block;margin-bottom:4px">Clase</label><select id="sc" class="input" style="min-height:38px;padding:.4em .6em;background:#222;color:#fff;border-color:#444">' +
      lista.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === A.CLASE_ID ? ' selected' : '') + '>' + esc(c.titulo) + '</option>'; }).join('') +
      (lista.some(function (c) { return c.id === A.CLASE_ID; }) ? '' : '<option selected value="' + esc(A.CLASE_ID) + '">' + esc(A.CLASE_ID) + '</option>') +
      '</select><label style="font-size:.75rem;color:#bbb;display:block;margin:8px 0 4px">Grupo (opcional)</label><div style="display:flex;gap:6px"><input id="sg" class="input" maxlength="20" placeholder="Ej.: grupoB" style="min-height:38px;padding:.4em .6em;background:#222;color:#fff;border-color:#444"><button class="btn y sm" id="sgo">Abrir</button></div>';
    $('sg').value = A.GRUPO || '';
    $('sgo').onclick = function () {
      var q = '?clase=' + encodeURIComponent($('sc').value) + ($('sg').value.trim() ? '&grupo=' + encodeURIComponent($('sg').value.trim().replace(/[^a-zA-Z0-9_-]/g, '')) : '') + (A.demo ? '&demo=1' : '');
      location.href = location.pathname + q;
    };
  })();
  if (A.demo) $('pmodo').textContent = 'Modo demo (solo este navegador)'; else $('pmodo').hidden = true;

  function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1800); }
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Copiado'); }).catch(function () { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Copiado'); } catch (e) {} ta.remove(); }); }
  function fatal(t) { $('ftxt').innerHTML = t; $('fatal').hidden = false; }

  if (!DB) { fatal('Falta la configuración de Firebase en <code>config.js</code>. Mientras tanto puedes probar el <a href="?demo=1">modo demo</a>.'); return; }

  DB.iniciar().then(function () {
    if (DB.conexion) DB.conexion(function (on) { $('cdot').className = 'dot' + (on ? ' on' : ''); $('ctxt').textContent = on ? 'Conectado' : 'Sin conexión'; });
    else { $('cdot').className = 'dot on'; $('ctxt').textContent = 'Demo'; }
    var saved = A.store('profe-clave');
    if (A.demo) return arrancar();
    if (saved) DB.loginProfe(saved).then(arrancar).catch(function () { $('login').hidden = false; });
    else $('login').hidden = false;
  }).catch(function (e) { fatal('No se pudo conectar con Firebase: ' + esc(e && (e.code || e.message) || e) + '.<br>Revisa <code>config.js</code> y que el acceso anónimo esté activado.'); });

  $('flogin').onsubmit = function (ev) {
    ev.preventDefault(); var c = $('clave').value;
    DB.loginProfe(c).then(function () { A.store('profe-clave', c); $('login').hidden = true; arrancar(); })
      .catch(function (e) { $('lerr').hidden = false; $('lerr').textContent = 'Clave incorrecta, o las reglas todavía no están publicadas. (' + (e && e.code || e) + ')'; });
  };

  function arrancar() {
    DB.escuchar('estado', function (e) { estado = e || {}; nav(); if (estado.act === cur && A.act(cur) && (A.act(cur).tipo === 'quiz' || A.act(cur).tipo === 'encuesta')) { if ((estado.q || 0) !== viewQ) { viewQ = estado.q || 0; suscribir(); } } stage(); });
    DB.escuchar('alias', function (v) { aliases = v || {}; stage(); });
    DB.escuchar('resp/_sim', function (v) { SIM = v || {}; });
    if (acts.some(function (x) { return x.tipo === 'voto'; })) DB.escuchar('resp/equipo', function (v) { EQRESP = v || {}; });
    DB.escuchar('online', function (v) { online = v || {}; $('nalias').textContent = Object.keys(online).length; stage(); });
    var h = (location.hash || '').slice(1); if (A.act(h) || (h === '__ranking' && A.clase.juego)) cur = h;
    nav(); suscribir();
  }

  function suscribir() {
    if (unsub) unsub();
    if (cur === '__ranking') { resp = {}; unsub = DB.escuchar('resp', function (v) { resp = v || {}; stage(); }); return; }
    var a = A.act(cur), key = A.clave(a, viewQ);
    resp = {}; stage();
    unsub = DB.escuchar('resp/' + key, function (v) { resp = v || {}; stage(); });
  }

  function nav() {
    $('nav').innerHTML = acts.map(function (a) {
      return '<li><button data-id="' + a.id + '" class="' + (a.id === cur ? 'cur' : '') + '"><span class="n">D' + a.diap + '</span><span>' + esc(a.titulo) + '</span>' + (estado.act === a.id ? '<span class="live">EN VIVO</span>' : '<span></span>') + '</button></li>';
    }).join('') + (A.clase.juego ? '<li><button data-id="__ranking" class="' + (cur === '__ranking' ? 'cur' : '') + '"><span class="n">🏆</span><span><b>Ranking y medallas</b></span>' + (estado.act === '__ranking' ? '<span class="live">EN VIVO</span>' : '<span></span>') + '</button></li>' : '');
    $('nav').querySelectorAll('button').forEach(function (b) { b.onclick = function () { ver(b.dataset.id); }; });
  }
  function ver(id) { cur = id; var a = A.act(id); viewQ = (estado.act === id) ? (estado.q || 0) : 0; history.replaceState(null, '', '#' + id); nav(); suscribir(); }

  function setEstado(o) { o.borrado = estado.borrado || null; o.t = A.TS; return DB.poner('estado', o); }
  function activar() { setEstado({ act: cur, q: viewQ, revelar: false }); }
  function irQ(d) {
    var a = A.act(cur); if (a && a.tipo === 'presupuesto') { simN(a, simActual(a) + d); return; } if (!a.items || !(a.tipo === 'quiz' || a.tipo === 'encuesta')) return;
    var n = Math.max(0, Math.min(a.items.length - 1, viewQ + d)); if (n === viewQ) return;
    viewQ = n; if (estado.act === cur) setEstado({ act: cur, q: n, revelar: false }); suscribir();
  }
  var SIM = {}, EQRESP = {};
  function simActual(a) { return estado.act === a.id ? (estado.q || 0) : ((SIM[a.id] || {}).v || 0); }
  function simN(a, n) {
    n = Math.max(0, Math.min(a.incidentes.length, n));
    var p = estado.act !== a.id ? setEstado({ act: a.id, q: n, revelar: false }) : DB.poner('estado/q', n);
    SIM[a.id] = { v: n }; DB.poner('resp/_sim/' + a.id, { v: n, t: A.TS });
    Promise.resolve(p).then(function () { if (A.clase.juego) setTimeout(publicarRanking, 500); stage(); });
  }
  function revelar() {
    var a = A.act(cur); if (!a || !(a.items || a.tipo === 'pasos' || a.tipo === 'riesgos' || a.tipo === 'voto')) return;
    var on = estado.act !== cur ? true : !estado.revelar;
    if (estado.act !== cur) setEstado({ act: cur, q: viewQ, revelar: true }); else DB.poner('estado/revelar', on);
    if (on && A.clase.juego && a.tipo !== 'encuesta') setTimeout(publicarRanking, 600);
  }

  $('bstop').onclick = function () { setEstado({ act: null }); };
  $('bqr').onclick = function () {
    $('qlink').textContent = linkEst.href; $('qrbox').innerHTML = '';
    try { new QRCode($('qrbox'), { text: linkEst.href, width: 260, height: 260 }); } catch (e) { $('qrbox').textContent = 'No se pudo generar el QR; comparte el enlace.'; }
    $('qr').hidden = false;
  };
  $('brep').onclick = function () {
    var b = this; b.disabled = true; b.textContent = 'Generando…';
    Promise.all([DB.leer('resp'), DB.leer('alias')]).then(function (r) {
      var resp = r[0] || {}, al = r[1] || {}, R = REPORTE.resumen(resp);
      if (A.clase.juego) { var K = calcRank(resp, al); R.rank = K.pub; R.equipos = K.equipos; R.horas = K.horasTot; }
      REPORTE.visor(REPORTE.grupo(resp, al), 'Reporte_clase_' + A.SALA + '.html');
      return DB.poner('resumen', R).then(function () { toast('Promedios del grupo compartidos con los celulares'); });
    }).catch(function (e) { toast('No se pudo generar el reporte (' + (e && e.code || e) + ')'); })
      .then(function () { b.disabled = false; b.textContent = 'Reporte final'; });
  };
  $('bqrclose').onclick = function () { $('qr').hidden = true; };
  $('bcopy').onclick = function () { copy(linkEst.href); };
  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { irQ(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { irQ(-1); e.preventDefault(); }
    if (e.key === ' ') { revelar(); e.preventDefault(); }
  });

  function vals() { return Object.keys(resp).map(function (u) { return { u: u, v: resp[u] && resp[u].v, t: resp[u] && resp[u].t || 0 }; }).filter(function (r) { return r.v != null; }); }
  function nombre(u) { return aliases[u] || 'Anónimo'; }
  function pct(n, d) { return d ? Math.round(100 * n / d) : 0; }

  function textoChat(a) {
    var url = linkEst.href;
    if (a.tipo === 'texto') return a.pregunta + '\n(Respóndelo en: ' + url + ' o aquí en el chat)';
    if (a.tipo === 'quiz' || a.tipo === 'encuesta') { var it = a.items[viewQ]; return (a.intro ? a.intro + '\n' : '') + it.q + '\n' + a.opciones.map(function (o, i) { return String.fromCharCode(65 + i) + ') ' + o; }).join('\n') + '\nResponde con la letra.'; }
    if (a.tipo === 'escala') return a.intro + '\nResponde con 5 números (uno por dimensión): ' + a.grupos.map(function (g) { return g.k; }).join(', ') + '.\nEj.: 3 2 4 2 3';
    if (a.tipo === 'puntos') return a.intro + '\nResponde así: HOY J M C A / NECESITAMOS J M C A (cada parte suma 100).\nEj.: 40 30 20 10 / 20 25 25 30';
    if (a.tipo === 'multi') return a.intro + '\n' + a.opciones.map(function (o, i) { return (i + 1) + '. ' + o; }).join('\n') + '\nResponde con los números.';
    if (a.tipo === 'adkar') return a.intro + '\nResponde con 5 números del 1 al 5: Conciencia, Deseo, Conocimiento, Habilidad, Refuerzo.\nEj.: 4 2 3 3 1';
    if (a.tipo === 'reparto') return a.intro + '\n' + a.opciones.map(function (o, i) { return (i + 1) + '. ' + o; }).join('\n') + '\nResponde con los puntos de cada uno, en orden. Ej.: 30 0 20 50 0 0';
    if (a.tipo === 'consultoria') { var T = A.clase.tecnologias || []; return 'Una persona por sala: envíen el análisis.\nPara cada uno de los 5 retos, la tecnología (' + T.join(', ') + ').\nLuego: el piloto elegido, el principal riesgo ético y cómo medirían el éxito.'; }
    if (a.tipo === 'equipo') return a.intro + '\n' + (A.clase.equipos || []).map(function (e, i) { return (i + 1) + '. ' + e; }).join('\n');
    if (a.tipo === 'pasos') return 'MISIÓN: Caza del cuello de botella. Para cada paso del proceso, decidan: 🤖 Robot, 🙋 Persona o 🗑️ Eliminar. Luego marquen el cuello de botella. Una persona por equipo envía la misión.';
    if (a.tipo === 'rol') return a.titulo + ': ' + url + '\n' + (a.roles || []).map(function (r, i) { return (i + 1) + '. ' + r.n + ': ' + r.d; }).join('\n');
    if (a.tipo === 'clasifica') return a.titulo.toUpperCase() + '. Una persona por equipo envía la respuesta en ' + url + '\nParte A: clasifiquen por consenso ' + a.items.length + ' escenarios.\nParte B: escriban una pregunta de cada tipo de analítica para su empresa.';
    if (a.tipo === 'canvas') return a.titulo.toUpperCase() + '. Una persona por equipo envía el canvas en ' + url + '\nCada rol llena su parte:\n' + (a.roles || []).map(function (r, k) { return '· ' + r.n + ': ' + a.campos.filter(function (f) { return f.rol === k; }).map(function (f) { return f.l; }).join(' / '); }).join('\n');
    if (a.tipo === 'voto') return a.pregunta + ' Vota en ' + url + ' (no puedes votar por tu propio equipo).';
    if (a.tipo === 'presupuesto') { var n0 = simActual(a); if (n0 > 0) { var it0 = a.incidentes[n0 - 1]; return '🚨 SIMULACRO · ' + it0.t + '\n' + it0.d + '\nMiren en su celular si su equipo lo contuvo.'; } return 'MISIÓN · Plan Crediahorro. Una persona por equipo lo envía en ' + url + '\n1) Repartan ' + (a.total || 100) + ' millones entre los 8 elementos del plan\n2) 3 políticas mínimas: accesos, redes y usuarios\n3) Una estrategia de cultura\n4) El principio Zero Trust que aplicarían primero'; }
    if (a.tipo === 'riesgos') return 'MISIÓN 5 · Rescate Digitech. Una persona por equipo envía la tabla en ' + url + '\n1) El activo que protegerían primero\n2) Tres riesgos: riesgo, impacto (alto, medio o bajo), control Zero Trust y cómo lo aplicarían' + (estado.alerta ? '\n🚨 ' + a.alerta + '\nAgreguen: el control que aplican de inmediato y qué harían en 24 horas.' : '');
    if (a.tipo === 'mibot') return a.intro + '\nEscribe: la tarea, sus pasos (marca los que haría un robot), cuántas veces por semana la haces y cuántos minutos toma hoy y con el robot.';
    if (a.tipo === 'comite') return 'CEO de cada comité: envíen su decisión.\n1) Etapa ADKAR del bloqueo\n2) 100 puntos en: ' + a.dimensiones.join(', ') + '\n3) 2 estrategias\n4) Acción de 90 días';
    return '';
  }

  function simular() {
    var a = A.act(cur), key = A.clave(a, viewQ), names = ['Ana', 'Luis', 'Marta', 'Jorge', 'Sofía', 'Camilo', 'Paula', 'Andrés', 'Diana', 'Felipe', 'Carolina', 'Julián'];
    function r(n) { return Math.floor(Math.random() * n); }
    function lean(n, bias) { return Math.max(1, Math.min(5, Math.round(bias + (Math.random() - .5) * 2.4))); }
    names.forEach(function (nm, i) {
      var u = 'sim' + i, v;
      if (a.tipo === 'texto') v = a.vista === 'nube' ? ['Empatía', 'Visión', 'Escucha', 'Cultura', 'Visión', 'Datos', 'Empatía', 'Coraje', 'Cliente', 'Visión', 'Apertura', 'Empatía'][i] : ['Quiero mover mi cultura de jerárquica a colaborativa; mi primera acción será hacer una retro mensual con mi equipo.', 'De control a confianza: voy a delegar la aprobación de gastos pequeños.', 'De silos a equipos: invitaré a TI a mi comité semanal.'][i % 3];
      else if (a.tipo === 'quiz') v = Math.random() < .65 ? a.items[viewQ].a : r(a.opciones.length);
      else if (a.tipo === 'encuesta') v = r(a.opciones.length);
      else if (a.tipo === 'escala') { var bias = [3.2, 2.6, 2.9, 2.2, 1.9]; v = []; a.grupos.forEach(function (g, gi) { g.items.forEach(function () { v.push(lean(5, bias[gi])); }); }); }
      else if (a.tipo === 'puntos') v = [[40, 30, 20, 10], [15, 25, 30, 30]].map(function (p) { var x = p.map(function (y) { return Math.max(0, y + (r(3) - 1) * 5); }); x[0] += 100 - x.reduce(function (s, y) { return s + y; }, 0); return x; });
      else if (a.tipo === 'multi') { v = []; a.opciones.forEach(function (o, k) { if (Math.random() < [.8, .5, .3, .6, .4, .7, .6, .5][k]) v.push(k); }); if (!v.length) v = [0]; }
      else if (a.tipo === 'adkar') v = { c: ['Nuevo CRM', 'Firma digital', 'Trabajo híbrido', 'App para asesores'][i % 4], s: [lean(5, 3.8), lean(5, 2.6), lean(5, 3), lean(5, 2.8), lean(5, 2)] };
      else if (a.tipo === 'reparto') { v = a.opciones.map(function () { return 0; }); var left = 100; while (left > 0) { var k = r(a.opciones.length), d = Math.min(left, 10 * (1 + r(3))); v[k] += d; left -= d; } }
      else if (a.tipo === 'consultoria') { if (i > 5) return; var em = (A.clase.empresas || [])[i]; if (!em) return; v = { n: 'Sala ' + (i + 1), emp: i, r: em.retos.map(function (x) { return Math.random() < .7 ? x.a : r(5); }), p: r(5), k: ['Datos sensibles: pedir autorización y revisión humana.', 'Puede discriminar: definir reglas y auditar.', 'Privacidad de los conductores: informarles qué se mide.', 'Decisiones sobre estudiantes con revisión docente.', 'Datos poco confiables: digitalizar primero.', 'Ningún corte sin revisión humana.'][i], m: ['Reducir inasistencias 20 %', 'Fichas en 1 día y no en 2 semanas', 'Entregas a tiempo del 85 % al 95 %', 'Bajar la deserción 10 %', 'Detectar plagas 1 semana antes', 'Responder PQRS en 2 días y no en 15'][i] }; }
      else if (a.tipo === 'equipo') v = i % 4;
      else if (a.tipo === 'pasos') { if (i > 3) return; var pr = A.clase.procesos[i % 3]; v = { e: i, p: i % 3, r: pr.pasos.map(function (x) { return Math.random() < .75 ? x.a : r(3); }), c: Math.random() < .6 ? pr.cuello : r(pr.pasos.length) }; }
      else if (a.tipo === 'mibot') { var fa = 1 + r(5), ma = 20 + 10 * r(8); v = { t: ['Reporte semanal de ventas', 'Conciliación de pagos', 'Actualizar la base de clientes', 'Enviar recordatorios de cobro'][i % 4], s: [{ x: 'Descargar el archivo del sistema', r: true }, { x: 'Pegar los datos en Excel', r: true }, { x: 'Revisar inconsistencias', r: false }, { x: 'Enviar el correo al jefe', r: true }], f: fa, a: ma, b: Math.round(ma / 4) }; }
      else if (a.tipo === 'rol') v = i % (a.roles || [1]).length;
      else if (a.tipo === 'clasifica') { if (i > 3) return; v = { e: i, r: a.items.map(function (it) { return Math.random() < .75 ? it.a : r(a.opciones.length); }), q: (a.preguntas || []).map(function (p, k) { return k <= i ? ['¿Cuánto vendimos por tienda el mes pasado?', '¿Por qué cayeron las ventas en abril?', '¿Cuántos clientes se irán el próximo trimestre?', '¿Qué precio poner a cada producto esta semana?'][k] : ''; }) }; }
      else if (a.tipo === 'canvas') { if (i > 3) return; v = { e: i, f: a.campos.map(function (f, k) { return k < 5 + i ? (f.ej || 'Texto de ejemplo del equipo.') : ''; }), n: r((a.niveles || [1]).length) }; }
      else if (a.tipo === 'voto') { v = (i + 1 + r(3)) % EQ.length; }
      else if (a.tipo === 'presupuesto') { if (i > 3) return; var bb = a.elementos.map(function () { return 0; }), lf = a.total || 100, st = a.paso || 5; while (lf > 0) { var kk = r(bb.length), dd = Math.min(lf, st * (1 + r(4))); bb[kk] += dd; lf -= dd; } v = { e: i, b: bb, p: ['MFA para todos los accesos remotos', 'Separar la red del sistema central', 'Retirar accesos el mismo día del retiro'], c: 'Simulacro de phishing mensual y reconocimiento a quien reporta.', z: r(3), zx: 'En el acceso al sistema central.' }; }
      else if (a.tipo === 'riesgos') { if (i > 3) return; var nc = (a.controles || []).length; v = { e: i, act: ['Base de datos de clientes', 'ERP en la nube', 'Correo corporativo', 'Pasarela de pagos'][i], f: [['Proveedores con cuenta compartida', 1], ['Exempleados con cuentas activas', 3], ['VPN que da acceso a toda la red', 4], ['Copias de seguridad en la misma red', 6], ['Equipos personales sin control', 9], ['Sin alertas de accesos raros', 5]].slice(i, i + 3).map(function (x, k) { return { r: x[0], i: k % 3, c: Math.random() < .7 ? x[1] : r(nc), m: 'Aplicarlo primero en las cuentas críticas.' }; }), ac: estado.alerta ? [0, 2, 3, 5][i] : -1, ax: estado.alerta ? 'Bloquear la cuenta del técnico, cambiar claves y revisar registros.' : '' }; }
      else if (a.tipo === 'comite') { if (i > 3) return; v = { n: 'Sala ' + (i + 1), e: [1, 0, 1, 3][i], p: [[20, 25, 15, 25, 15], [30, 20, 20, 15, 15], [10, 20, 30, 20, 20], [15, 15, 20, 25, 25]][i], s: [[0, 4], [1, 0], [3, 2], [1, 3]][i], x: ['Talleres con oficinas para co-diseñar el nuevo proceso.', 'El CEO usa la plataforma en vivo en el comité mensual.', 'Migrar el proceso de créditos a la nube con un piloto.', 'Formar 20 agentes de cambio en 60 días.'][i] }; }
      DB.poner('alias/' + u, nm); DB.poner('online/' + u, true); DB.poner('resp/' + key + '/' + u, { v: v, t: Date.now() + i * 400 });
    });
  }

  function stage() {
    if (cur === '__ranking') return stageRanking();
    var a = A.act(cur); if (!a) return;
    var rs = vals(), live = estado.act === cur, nA = Object.keys(online).length;
    var html = '<div class="eyebrow">Diapositiva ' + a.diap + ' · ' + esc(a.titulo) + '</div>';
    var isQ = a.tipo === 'quiz' || a.tipo === 'encuesta';
    html += '<div class="tools">' +
      (live ? '<button class="btn sec sm" id="bdeact">✓ Activa en los celulares · pausar</button>' : '<button class="btn y" id="bact">Activar en los celulares</button>') +
      (isQ ? '<button class="btn sec sm" id="bprev">←</button><button class="btn sec sm" id="bnext">→</button>' : '') +
      (a.tipo === 'presupuesto' ? (function () { var n = simActual(a), N = a.incidentes.length; return (n > 0 ? '<button class="btn sec sm" id="bsprev">← Incidente anterior</button>' : '') + (n < N ? '<button class="btn warn sm" id="bsnext">' + (n === 0 ? '🚨 Iniciar simulacro' : 'Siguiente incidente (' + (n + 1) + ' de ' + N + ')') + '</button>' : '<span class="pill">Simulacro terminado</span>'); })() : '') +
      (a.tipo === 'riesgos' ? '<button class="btn ' + (live && estado.alerta ? 'sec ' : 'warn ') + 'sm" id="balerta">' + (live && estado.alerta ? '🚨 Alerta lanzada · quitar' : '🚨 Lanzar alerta') + '</button>' : '') +
      (isQ || a.tipo === 'pasos' || a.tipo === 'riesgos' || a.tipo === 'clasifica' || a.tipo === 'voto' ? '<button class="btn sm" id="brev">' + (live && estado.revelar ? (a.tipo === 'voto' ? 'Ocultar resultados' : 'Ocultar respuesta') : (a.tipo === 'pasos' || a.tipo === 'riesgos' || a.tipo === 'clasifica' ? 'Revelar puntajes' : (a.tipo === 'voto' ? 'Revelar votos' : 'Revelar'))) + '</button>' : '') +
      '<button class="btn sec sm" id="bchat">Copiar para el chat</button>' +
      (A.demo ? '<button class="btn sec sm" id="bsim">Simular respuestas</button>' : '') +
      '<button class="btn warn sm" id="bclr">Borrar respuestas</button></div>';
    html += '<p class="count"><b>' + rs.length + '</b> respuesta' + (rs.length === 1 ? '' : 's') + (nA ? ' de ' + nA + ' conectados' : '') + '</p>';
    html += ({ texto: vTexto, quiz: vQuiz, encuesta: vQuiz, escala: vEscala, puntos: vPuntos, multi: vMulti, adkar: vAdkar, comite: vComite, reparto: vReparto, consultoria: vConsultoria, equipo: vEquipo, pasos: vPasos, mibot: vMibot, riesgos: vRiesgos, presupuesto: vPresupuesto, rol: vRol, clasifica: vClasifica, canvas: vCanvas, voto: vVoto }[a.tipo])(a, rs, live);
    $('stage').innerHTML = html;
    var on = function (id, f) { var el = $(id); if (el) el.onclick = f; };
    on('bact', activar); on('bdeact', function () { setEstado({ act: null }); });
    on('bprev', function () { irQ(-1); }); on('bnext', function () { irQ(1); }); on('brev', revelar);
    on('bchat', function () { copy(textoChat(a)); }); on('bsim', simular);
    on('bsnext', function () { simN(a, simActual(a) + 1); }); on('bsprev', function () { simN(a, simActual(a) - 1); });
    on('balerta', function () { if (estado.act !== cur) { setEstado({ act: cur, q: 0, revelar: false }).then(function () { DB.poner('estado/alerta', true); }); } else DB.poner('estado/alerta', !estado.alerta); });
    on('bclr', function () { var b = this; if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = '¿Seguro? Clic otra vez'; setTimeout(function () { if (b.isConnected) { b.classList.remove('arm'); b.textContent = 'Borrar respuestas'; } }, 3000); return; } var k = A.clave(a, viewQ); DB.borrar('resp/' + k); if (a.tipo === 'presupuesto') { DB.borrar('resp/_sim/' + a.id); SIM[a.id] = { v: 0 }; if (estado.act === a.id) DB.poner('estado/q', 0); } DB.poner('estado/borrado/' + k, Date.now()); b.classList.remove('arm'); b.textContent = 'Borrar respuestas'; toast('Respuestas borradas'); });
    $('stage').querySelectorAll('.sticky-note').forEach(function (n) { n.onclick = function () { hl[n.dataset.u] = !hl[n.dataset.u]; n.classList.toggle('hl'); }; });
  }

  /* ---------- Vistas ---------- */
  function vTexto(a, rs) {
    var h = '<h2>' + esc(a.pregunta) + '</h2>';
    if (!rs.length) return h + '<p class="muted">Aún no hay respuestas.</p>';
    if (a.vista === 'nube') {
      var c = {}, disp = {};
      rs.forEach(function (r) { var k = String(r.v).trim().toLowerCase().replace(/[.!¡¿?,;:]+$/g, ''); c[k] = (c[k] || 0) + 1; disp[k] = disp[k] || String(r.v).trim(); });
      var ks = Object.keys(c).sort(function (x, y) { return c[y] - c[x]; }), mx = c[ks[0]];
      return h + '<div class="cloud">' + ks.map(function (k, i) { var s = 1 + 2.2 * (c[k] / mx); return '<span style="font-size:' + s.toFixed(2) + 'rem;color:' + COL[i % COL.length] + '">' + esc(disp[k]) + (c[k] > 1 ? ' <small style="font-size:.8rem;color:var(--muted)">×' + c[k] + '</small>' : '') + '</span>'; }).join('') + '</div>';
    }
    return h + '<div class="wall">' + rs.sort(function (x, y) { return x.t - y.t; }).map(function (r) { return '<div class="sticky-note' + (hl[r.u] ? ' hl' : '') + '" data-u="' + esc(r.u) + '">' + esc(r.v) + '<small>' + esc(nombre(r.u)) + '</small></div>'; }).join('') + '</div><p class="muted" style="font-size:.85rem">Haz clic en una nota para resaltarla.</p>';
  }

  function vQuiz(a, rs, live) {
    var it = a.items[viewQ], rev = live && estado.revelar, cnt = a.opciones.map(function () { return 0; });
    rs.forEach(function (r) { if (cnt[r.v] != null) cnt[r.v]++; });
    var h = '<div class="muted" style="font-weight:700">Pregunta ' + (viewQ + 1) + ' de ' + a.items.length + (live ? '' : ' · (vista previa: no está activa)') + '</div><p class="q">' + esc(it.q) + '</p><div class="optbars">';
    a.opciones.forEach(function (o, i) { var ok = rev && a.tipo === 'quiz' && i === it.a; h += '<div class="ob' + (ok ? ' ok' : '') + '"><span class="lbl">' + String.fromCharCode(65 + i) + ') ' + esc(o) + (ok ? ' ✓' : '') + '</span><span class="trk"><i style="width:' + pct(cnt[i], rs.length) + '%"></i></span><span class="val">' + cnt[i] + ' · ' + pct(cnt[i], rs.length) + '%</span></div>'; });
    h += '</div>';
    if (rev && a.tipo === 'quiz') {
      var ok = rs.filter(function (r) { return r.v === it.a; }).sort(function (x, y) { return x.t - y.t; }).slice(0, 3);
      h += '<div class="callout"><b>' + esc(a.opciones[it.a]) + '.</b> ' + esc(it.exp) + '</div>';
      if (ok.length) h += '<div class="fast"><b>Más rápidos:</b> ' + ok.map(function (r, i) { return '<span class="pill">' + ['🥇', '🥈', '🥉'][i] + ' ' + esc(nombre(r.u)) + '</span>'; }).join('') + '</div>';
    } else if (rev) h += '<div class="callout">' + esc(it.nota) + '</div>';
    return h;
  }

  function vEscala(a, rs) {
    if (!rs.length) return '<h2>Perfil de madurez del grupo</h2><p class="muted">Aún no hay respuestas.</p>';
    var sums = a.grupos.map(function () { return 0; }), lv = { 'Inicial': 0, 'En desarrollo': 0, 'Avanzado': 0, 'Líder': 0 };
    rs.forEach(function (r) { var p = A.promedios(a, r.v); p.forEach(function (x, i) { sums[i] += x; }); lv[A.nivel(p.reduce(function (s, x) { return s + x; }, 0) / p.length)]++; });
    var av = sums.map(function (s) { return s / rs.length; }), lo = av.indexOf(Math.min.apply(null, av)), hi = av.indexOf(Math.max.apply(null, av));
    var g = av.reduce(function (s, x) { return s + x; }, 0) / av.length;
    var h = '<h2>' + esc(a.etiqueta ? a.etiqueta.replace(/ de tu organización$/, '') + ' del grupo' : 'Perfil de madurez del grupo') + ' · ' + g.toFixed(1) + ' / 5</h2><div class="grid2"><div class="optbars">';
    a.grupos.forEach(function (gr, i) { h += '<div class="ob' + (i === hi ? ' ok' : '') + '"><span class="lbl">' + esc(gr.k) + '</span><span class="trk"><i style="width:' + (av[i] / 5 * 100) + '%;' + (i === lo ? 'background:var(--y)' : '') + '"></i></span><span class="val">' + av[i].toFixed(1) + '</span></div>'; });
    h += '</div><div><b>¿En qué nivel están las organizaciones?</b><div class="bars" style="margin-top:10px">';
    Object.keys(lv).forEach(function (k) { h += '<div class="bar"><span class="lbl">' + k + '</span><span class="trk"><i class="k" style="width:' + pct(lv[k], rs.length) + '%"></i></span><span class="val">' + lv[k] + '</span></div>'; });
    h += '</div></div></div><div class="callout">La dimensión más débil del grupo es <b>' + esc(a.grupos[lo].k) + '</b> (' + av[lo].toFixed(1) + ') y la más fuerte es <b>' + esc(a.grupos[hi].k) + '</b> (' + av[hi].toFixed(1) + '). ¿Por qué creen que pasa?</div>';
    return h;
  }

  function vPuntos(a, rs) {
    if (!rs.length) return '<h2>Cultura del grupo: hoy vs. la que necesitamos</h2><p class="muted">Aún no hay respuestas.</p>';
    var s = [[0, 0, 0, 0], [0, 0, 0, 0]];
    rs.forEach(function (r) { for (var p = 0; p < 2; p++) for (var t = 0; t < 4; t++) s[p][t] += +r.v[p][t] || 0; });
    var av = s.map(function (p) { return p.map(function (x) { return x / rs.length; }); }), gap = av[1].map(function (x, i) { return x - av[0][i]; });
    var h = '<h2>Cultura del grupo: hoy vs. la que necesitamos</h2><div class="legend"><span><i style="background:#9a9a92"></i>Hoy</span><span><i style="background:var(--blue)"></i>La que necesitamos</span></div><div class="optbars">';
    a.tipos.forEach(function (t, i) {
      h += '<div class="ob"><span class="lbl">' + esc(t) + '</span><span><span class="trk" style="display:block;height:22px;margin-bottom:4px"><i style="width:' + av[0][i] + '%;background:#9a9a92"></i></span><span class="trk" style="display:block;height:22px"><i style="width:' + av[1][i] + '%;background:var(--blue)"></i></span></span><span class="val" style="color:' + (gap[i] >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (gap[i] >= 0 ? '+' : '') + gap[i].toFixed(0) + '</span></div>';
    });
    var up = gap.indexOf(Math.max.apply(null, gap)), dn = gap.indexOf(Math.min.apply(null, gap));
    h += '</div><div class="callout">Hoy predomina la cultura <b>' + esc(a.tipos[av[0].indexOf(Math.max.apply(null, av[0]))]) + '</b>. El grupo quiere más <b>' + esc(a.tipos[up]) + '</b> (' + (gap[up] >= 0 ? '+' : '') + gap[up].toFixed(0) + ') y menos <b>' + esc(a.tipos[dn]) + '</b> (' + gap[dn].toFixed(0) + ').</div>';
    return h;
  }

  function vMulti(a, rs) {
    var c = a.opciones.map(function () { return 0; });
    rs.forEach(function (r) { (r.v || []).forEach(function (i) { if (c[i] != null) c[i]++; }); });
    var idx = a.opciones.map(function (o, i) { return i; }).sort(function (x, y) { return c[y] - c[x]; });
    var h = '<h2>' + esc(a.titulo) + '</h2><div class="optbars">';
    idx.forEach(function (i, k) { h += '<div class="ob"><span class="lbl" style="font-size:1rem">' + esc(a.opciones[i]) + '</span><span class="trk"><i style="width:' + pct(c[i], rs.length) + '%;background:' + (k < 3 ? (a.color || 'var(--red)') : '#c9c9c0') + '"></i></span><span class="val">' + pct(c[i], rs.length) + '%</span></div>'; });
    return h + '</div>' + (rs.length ? '<div class="callout">La señal más común: <b>' + esc(a.opciones[idx[0]]) + '</b></div>' : '');
  }

  function vAdkar(a, rs) {
    if (!rs.length) return '<h2>Puntos de bloqueo del grupo</h2><p class="muted">Aún no hay respuestas.</p>';
    var b = [0, 0, 0, 0, 0], none = 0, s = [0, 0, 0, 0, 0];
    rs.forEach(function (r) { var k = A.bloqueo(r.v.s); if (k < 0) none++; else b[k]++; r.v.s.forEach(function (x, i) { s[i] += +x; }); });
    var mx = b.indexOf(Math.max.apply(null, b));
    var h = '<h2>Puntos de bloqueo del grupo</h2><div class="grid2"><div><b>¿Dónde se atascan los cambios?</b><div class="optbars" style="margin-top:8px">';
    a.etapas.forEach(function (e, i) { h += '<div class="ob"><span class="lbl">' + esc(e.k) + '</span><span class="trk"><i style="width:' + pct(b[i], rs.length) + '%;background:' + (i === mx ? 'var(--red)' : '#c9c9c0') + '"></i></span><span class="val">' + b[i] + '</span></div>'; });
    h += '<div class="ob"><span class="lbl">Sin bloqueo</span><span class="trk"><i style="width:' + pct(none, rs.length) + '%;background:var(--green)"></i></span><span class="val">' + none + '</span></div></div></div><div><b>Promedio por elemento</b><div class="bars" style="margin-top:10px">';
    a.etapas.forEach(function (e, i) { h += '<div class="bar"><span class="lbl">' + esc(e.k) + '</span><span class="trk"><i style="width:' + (s[i] / rs.length / 5 * 100) + '%"></i></span><span class="val">' + (s[i] / rs.length).toFixed(1) + '</span></div>'; });
    h += '</div>';
    var cambios = rs.map(function (r) { return r.v.c; }).filter(Boolean).slice(0, 8);
    if (cambios.length) h += '<p class="muted" style="margin-top:12px"><b>Algunos cambios:</b> ' + cambios.map(esc).join(' · ') + '</p>';
    h += '</div></div><div class="callout">El bloqueo más común es <b>' + esc(a.etapas[mx].k) + '</b>. Qué hacer: ' + esc(a.accion[mx]) + '</div>';
    return h;
  }

  function vComite(a, rs) {
    var h = '<h2>Decisiones de los comités</h2>';
    if (!rs.length) return h + '<p class="muted">Aún no hay decisiones. Solo el CEO de cada comité envía.</p>';
    h += '<div class="legend">' + a.dimensiones.map(function (d, i) { return '<span><i style="background:' + COL[i] + '"></i>' + esc(d) + '</span>'; }).join('') + '</div>';
    h += '<table class="t"><thead><tr><th>Comité</th><th>Presupuesto</th><th>Bloqueo</th><th>Estrategias</th><th>Acción de 90 días</th></tr></thead><tbody>';
    var tot = [0, 0, 0, 0, 0];
    rs.sort(function (x, y) { return String(x.v.n).localeCompare(String(y.v.n), 'es', { numeric: true }); }).forEach(function (r) {
      var v = r.v; v.p.forEach(function (x, i) { tot[i] += +x; });
      h += '<tr><td><b>' + esc(v.n) + '</b></td><td><div class="stack">' + v.p.map(function (x, i) { return '<i title="' + esc(a.dimensiones[i]) + ': ' + x + '" style="width:' + x + '%;background:' + COL[i] + '"></i>'; }).join('') + '</div><small class="muted">' + v.p.join(' · ') + '</small></td><td>' + esc(a.etapas[v.e] || '') + '</td><td>' + (v.s || []).map(function (i) { return esc(a.estrategias[i]); }).join('<br>') + '</td><td>' + esc(v.x) + '</td></tr>';
    });
    h += '</tbody></table>';
    var mx = tot.indexOf(Math.max.apply(null, tot));
    h += '<div class="callout">Entre todos los comités, la dimensión con más presupuesto fue <b>' + esc(a.dimensiones[mx]) + '</b> (' + (tot[mx] / rs.length).toFixed(0) + ' puntos en promedio). ¿Quién ganó la negociación?</div>';
    return h;
  }
  function vReparto(a, rs) {
    var h = '<h2>' + esc(a.titulo) + '</h2>';
    if (!rs.length) return h + '<p class="muted">Aún no hay respuestas.</p>';
    var s = a.opciones.map(function () { return 0; });
    rs.forEach(function (r) { (r.v || []).forEach(function (x, i) { if (s[i] != null) s[i] += +x || 0; }); });
    var av = s.map(function (x) { return x / rs.length; }), idx = a.opciones.map(function (o, i) { return i; }).sort(function (x, y) { return av[y] - av[x]; });
    h += '<p class="muted">Promedio de puntos por persona</p><div class="optbars">';
    idx.forEach(function (i, k) { h += '<div class="ob' + (k === 0 ? ' ok' : '') + '"><span class="lbl">' + (k === 0 ? '🏆 ' : '') + esc(a.opciones[i]) + '</span><span class="trk"><i style="width:' + av[i] + '%"></i></span><span class="val">' + av[i].toFixed(0) + '</span></div>'; });
    return h + '</div><div class="callout">El piloto con más inversión: <b>' + esc(a.opciones[idx[0]]) + '</b>. ¿Qué lo hizo más convincente?</div>';
  }

  function vConsultoria(a, rs) {
    var E = A.clase.empresas || [], T = A.clase.tecnologias || [];
    var h = '<h2>Análisis de los equipos</h2>';
    if (!rs.length) return h + '<p class="muted">Aún no hay análisis. Una persona por sala lo envía.</p>';
    h += '<table class="t"><thead><tr><th>Equipo</th><th>Empresa</th><th>Tecnología por reto (✓ coincide con la sugerida)</th><th>Piloto, riesgo y métrica</th></tr></thead><tbody>';
    var tot = 0, ok = 0;
    rs.sort(function (x, y) { return String(x.v.n).localeCompare(String(y.v.n), 'es', { numeric: true }); }).forEach(function (r) {
      var v = r.v, em = E[v.emp] || { n: '?', retos: [] };
      h += '<tr><td><b>' + esc(v.n) + '</b></td><td>' + esc(em.n) + '<br><small class="muted">' + esc(em.sector || '') + '</small></td><td>' + em.retos.map(function (rt, i) {
        var hit = v.r[i] === rt.a; tot++; if (hit) ok++;
        return '<div style="margin-bottom:4px">' + (hit ? '✓' : '✗') + ' <b>' + (i + 1) + '.</b> ' + esc(T[v.r[i]] || '—') + (hit ? '' : ' <small class="muted">(sugerida: ' + esc(T[rt.a]) + ')</small>') + '</div>';
      }).join('') + '</td><td><b>Piloto:</b> ' + esc((em.retos[v.p] || {}).t || '') + '<br><b>Riesgo:</b> ' + esc(v.k) + '<br><b>Métrica:</b> ' + esc(v.m) + '</td></tr>';
    });
    h += '</tbody></table><div class="callout">Coincidencia con la tecnología sugerida: <b>' + pct(ok, tot) + ' %</b>. Las diferencias son la mejor discusión: ¿cuándo un reto de RPA necesita IA, o un agente es demasiado?</div>';
    return h;
  }
  /* ===================== BotFactory: equipos, misión, mi bot y ranking ===================== */
  var EQ = A.clase.equipos || [];
  function vEquipo(a, rs) {
    var h = '<h2>Equipos</h2><table class="t"><thead><tr><th>Equipo</th><th>Integrantes</th></tr></thead><tbody>';
    EQ.forEach(function (e, i) { var m = rs.filter(function (r) { return r.v === i; }); h += '<tr><td><b>' + esc(e) + '</b> (' + m.length + ')</td><td>' + m.map(function (r) { return esc(nombre(r.u)); }).join(', ') + '</td></tr>'; });
    return h + '</tbody></table>';
  }
  function vPasos(a, rs, live) {
    var PR = A.clase.procesos || [], rev = live && estado.revelar, OPS = ['🤖 Robot', '🙋 Persona', '🗑️ Eliminar'];
    var h = '<h2>Misiones enviadas</h2>';
    if (!rs.length) return h + '<p class="muted">Aún no hay misiones. Una persona por equipo la envía.</p>';
    var rows = rs.map(function (r) { return { r: r, s: A.puntosPasos(r.v) }; }).sort(function (x, y) { return rev ? y.s.pts - x.s.pts : (x.r.v.e - y.r.v.e); });
    h += '<table class="t"><thead><tr><th>Equipo</th><th>Proceso</th><th>Pasos bien clasificados</th><th>Cuello de botella</th><th>Puntos</th></tr></thead><tbody>' + rows.map(function (x, i) {
      return '<tr><td><b>' + (rev ? (['🥇 ', '🥈 ', '🥉 '][i] || '') : '') + esc(EQ[x.r.v.e] || '') + '</b><br><small class="muted">' + esc(nombre(x.r.u)) + '</small></td><td>' + esc((PR[x.r.v.p] || {}).n || '') + '</td><td>' + (rev ? x.s.ok + ' / ' + x.s.total : '🔒') + '</td><td>' + (rev ? (x.s.cuello ? '✓' : '✗') : '🔒') + '</td><td><b>' + (rev ? x.s.pts : '🔒') + '</b></td></tr>';
    }).join('') + '</tbody></table>';
    if (rev) h += PR.map(function (pr) { return '<h3 style="margin-top:18px">Clave: ' + esc(pr.n) + '</h3><ol>' + pr.pasos.map(function (st, i) { return '<li>' + esc(st.t) + ' → <b>' + OPS[st.a] + '</b>' + (i === pr.cuello ? ' · <b>⏳ cuello de botella</b>' : '') + '</li>'; }).join('') + '</ol>'; }).join('');
    else h += '<p class="muted">Los puntajes están ocultos. Pulsa "Revelar puntajes" cuando todos los equipos hayan enviado.</p>';
    return h;
  }
  function vRol(a, rs) {
    var R = a.roles || [], c = R.map(function () { return 0; }); rs.forEach(function (r) { if (r.v != null && c[r.v] != null) c[r.v]++; });
    var mx = Math.max.apply(null, c.concat([1]));
    return '<h2>Roles elegidos (' + rs.length + ')</h2><div class="optbars">' + R.map(function (r, i) { return '<div class="ob"><span class="lbl">' + esc(r.n) + '</span><span class="trk"><i style="width:' + (100 * c[i] / mx) + '%"></i></span><span class="val">' + c[i] + '</span></div>'; }).join('') + '</div><p class="muted">Cada equipo debería tener al menos una persona en cada rol. Si son 3, una persona asume dos roles.</p>';
  }
  function mejorPorEquipo(rs, fn) { var b = {}; rs.forEach(function (r) { var v = r.v; if (v && v.e >= 0) { var p = fn(v); if (!b[v.e] || p >= b[v.e].p) b[v.e] = { p: p, v: v }; } }); return Object.keys(b).map(Number).sort(function (x, y) { return x - y; }).map(function (e) { return b[e]; }); }
  function vClasifica(a, rs, live) {
    var rev = live && estado.revelar, O = a.opciones, L = mejorPorEquipo(rs, function (v) { return A.puntosClasifica(a, v).pts; });
    if (!L.length) return '<p class="muted">Aún no hay respuestas. Una persona por equipo envía la respuesta del equipo.</p>';
    if (rev) L.sort(function (x, y) { return y.p - x.p; });
    var h = '<h2>Respuestas de los equipos</h2><div class="tablewrap"><table class="t"><thead><tr><th>Equipo</th>' + (rev ? '<th>Aciertos</th>' : '') + (a.preguntas || []).map(function (p) { return '<th>' + esc(p.c) + '</th>'; }).join('') + '<th>Puntos</th></tr></thead><tbody>' +
      L.map(function (x, k) { var sc = A.puntosClasifica(a, x.v); return '<tr><td><b>' + (rev ? (['🥇 ', '🥈 ', '🥉 '][k] || '') : '') + esc(EQ[x.v.e] || '') + '</b></td>' + (rev ? '<td><b>' + sc.ok + ' / ' + sc.total + '</b></td>' : '') + (a.preguntas || []).map(function (p, i) { return '<td style="font-size:.85rem">' + esc((x.v.q || [])[i] || '—') + '</td>'; }).join('') + '<td><b>' + (rev ? sc.pts : '🔒') + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
    if (rev) h += '<h3 style="margin-top:16px">Clave y aciertos por escenario</h3><ol>' + a.items.map(function (it, i) { var ok = L.filter(function (x) { return x.v.r[i] === it.a; }).length; return '<li style="margin-bottom:6px">' + esc(it.q) + ' → <b>' + esc(O[it.a]) + '</b> <span class="pill">' + ok + ' de ' + L.length + ' equipos</span><br><small class="muted">' + esc(it.exp) + '</small></li>'; }).join('') + '</ol>';
    else h += '<p class="muted">Las preguntas propias se ven desde ya: léelas en voz alta. Los aciertos se revelan con "Revelar puntajes".</p>';
    return h;
  }
  function vCanvas(a, rs) {
    var L = mejorPorEquipo(rs, function (v) { return A.puntosCanvas(a, v).pts; }), N = a.niveles || [];
    if (!L.length) return '<p class="muted">Aún no hay canvas. Una persona por equipo lo envía.</p>';
    return '<h2>Canvas de los equipos (' + L.length + ')</h2>' + L.map(function (x) { var v = x.v, sc = A.puntosCanvas(a, v); return '<div class="card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b style="font-size:1.15rem">' + esc(EQ[v.e] || '') + '</b><span class="pill">' + sc.n + ' de ' + sc.total + ' campos · ' + sc.pts + ' pts</span></div><div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin-top:8px">' + a.campos.map(function (f, i) { return '<div><small class="muted" style="font-weight:700">' + esc(f.c || f.l) + '</small><div>' + (v.f[i] ? esc(v.f[i]) : '<span class="muted">—</span>') + '</div></div>'; }).join('') + '<div><small class="muted" style="font-weight:700">' + esc(a.nivelCorto || 'Tipo de analítica') + '</small><div><b>' + esc(N[v.n] || '—') + '</b></div></div></div></div>'; }).join('');
  }
  function vVoto(a, rs, live) {
    var rev = live && estado.revelar, c = EQ.map(function () { return 0; }), eqOf = {};
    var eo = EQRESP; Object.keys(eo).forEach(function (u) { if (eo[u] && eo[u].v != null) eqOf[u] = eo[u].v; });
    var val = 0; rs.forEach(function (r) { if (r.v != null && r.v >= 0 && r.v < EQ.length && eqOf[r.u] !== r.v) { c[r.v]++; val++; } });
    if (!rev) return '<h2>Votos recibidos: ' + rs.length + '</h2><p class="muted">Los resultados están ocultos para no influir. Pulsa "Revelar votos" cuando todos hayan votado.</p>';
    var mx = Math.max.apply(null, c.concat([1])), ord = EQ.map(function (n, i) { return i; }).filter(function (i) { return c[i] > 0; }).sort(function (x, y) { return c[y] - c[x]; });
    return '<h2>Voto del público (' + val + ' votos válidos)</h2><div class="optbars">' + ord.map(function (i, k) { return '<div class="ob' + (k === 0 ? ' ok' : '') + '"><span class="lbl">' + (['🥇 ', '🥈 ', '🥉 '][k] || '') + esc(EQ[i]) + '</span><span class="trk"><i style="width:' + (100 * c[i] / mx) + '%"></i></span><span class="val">' + c[i] + '</span></div>'; }).join('') + '</div><p class="muted">Cada voto suma ' + ((a.pesos && a.pesos.voto) || 20) + ' puntos al equipo. No cuentan los votos por el propio equipo.</p>';
  }
  function vPresupuesto(a, rs, live) {
    var n = simActual(a), I = a.incidentes, CORTO = a.corto || a.elementos, TOT = a.total || 100, ZT = a.principios || [], POL = a.politicas || ['Accesos', 'Redes', 'Usuarios'];
    var best = {}; rs.forEach(function (r) { var v = r.v; if (v && v.e >= 0) { var sc = A.puntosPresupuesto(a, v, n); if (!best[v.e] || sc.pts >= best[v.e].sc.pts) best[v.e] = { v: v, sc: sc }; } });
    var teams = Object.keys(best).map(Number).sort(function (x, y) { return x - y; });
    var h = '';
    if (n > 0) {
      var it = I[n - 1], ok = teams.filter(function (e) { return best[e].sc.inc[n - 1].st === 2; }).length;
      h += '<div class="callout" style="border-color:var(--red)"><div class="muted" style="font-weight:700">Mes ' + Math.min(12, n * 2) + ' de 12 · Incidente ' + n + ' de ' + I.length + '</div><div style="font-size:1.5rem;font-weight:800;margin:4px 0">' + esc(it.t) + '</div><div>' + esc(it.d) + '</div><div class="muted" style="margin-top:6px">Lo frenaba invertir en: <b>' + it.b.map(function (j) { return esc(CORTO[j]); }).join(' + ') + '</b> (' + a.umbral[1] + ' millones o más; parcial desde ' + a.umbral[0] + ')</div><div style="margin-top:6px"><b>' + ok + ' de ' + teams.length + '</b> equipos lo contuvieron.</div></div>';
    }
    if (!teams.length) return h + '<p class="muted">Aún no hay planes. Una persona por equipo envía el plan.</p>';
    var ICO = ['💥', '⚠️', '🛡️'];
    h += '<div class="tablewrap"><table class="t"><thead><tr><th>Equipo</th>' + CORTO.map(function (c) { return '<th style="font-size:.75rem">' + esc(c) + '</th>'; }).join('') + (n > 0 ? I.slice(0, n).map(function (x, i) { return '<th>I' + (i + 1) + '</th>'; }).join('') + '<th>Puntos</th>' : '') + '</tr></thead><tbody>' +
      teams.slice().sort(function (x, y) { return n > 0 ? best[y].sc.pts - best[x].sc.pts : x - y; }).map(function (e) {
        var b = best[e];
        return '<tr><td><b>' + esc(EQ[e] || '') + '</b></td>' + CORTO.map(function (c, j) { var val = b.v.b[j] || 0; return '<td style="text-align:center;font-variant-numeric:tabular-nums;' + (val >= a.umbral[1] ? 'font-weight:800' : (val === 0 ? 'color:#aaa' : '')) + '">' + val + '</td>'; }).join('') +
          (n > 0 ? b.sc.inc.slice(0, n).map(function (x) { return '<td style="text-align:center">' + ICO[x.st] + '</td>'; }).join('') + '<td><b>' + b.sc.pts + '</b></td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
    if (n === 0) {
      var avg = CORTO.map(function (c, j) { return teams.reduce(function (t, e) { return t + (best[e].v.b[j] || 0); }, 0) / teams.length; });
      h += '<h3 style="margin-top:16px">Dónde puso el grupo su presupuesto (promedio)</h3><div class="optbars">' + CORTO.map(function (c, j) { return '<div class="ob"><span class="lbl">' + esc(c) + '</span><span class="trk"><i style="width:' + (100 * avg[j] / TOT) + '%"></i></span><span class="val">' + avg[j].toFixed(0) + '</span></div>'; }).join('') + '</div>';
      h += '<h3 style="margin-top:16px">Políticas, cultura y Zero Trust</h3>' + teams.map(function (e) { var v = best[e].v; return '<div class="card" style="margin-bottom:10px"><b>' + esc(EQ[e] || '') + '</b><ul style="margin:6px 0 0">' + POL.map(function (t, i) { return '<li><b>' + esc(t) + ':</b> ' + esc(v.p[i] || '—') + '</li>'; }).join('') + '<li><b>Cultura:</b> ' + esc(v.c || '—') + '</li><li><b>Zero Trust:</b> ' + esc(ZT[v.z] || '—') + '. ' + esc(v.zx || '') + '</li></ul></div>'; }).join('');
      h += '<p class="muted">Cuando todos hayan enviado, pulsa "🚨 Iniciar simulacro". Desde ese momento los planes quedan cerrados.</p>';
    } else h += '<p class="muted" style="font-size:.85rem">🛡️ contenido (+' + a.pesos.contenido + ') · ⚠️ parcial (+' + a.pesos.parcial + ') · 💥 no contenido. El plan escrito suma hasta ' + (3 * a.pesos.politica + a.pesos.cultura + a.pesos.zt) + ' puntos.</p>';
    return h;
  }
  function vRiesgos(a, rs, live) {
    var rev = live && estado.revelar, CT = a.controles || [], IMP = ['Alto', 'Medio', 'Bajo'];
    var h = (live && estado.alerta ? '<div class="callout" style="border-color:var(--red)"><b>🚨 Alerta lanzada:</b> ' + esc(a.alerta) + '</div>' : '') + '<h2>Tablas de los equipos</h2>';
    if (!rs.length) return h + '<p class="muted">Aún no hay tablas. Una persona por equipo la envía.</p>';
    var rows = rs.map(function (r) { return { r: r, s: A.puntosRiesgos(a, r.v) }; }).sort(function (x, y) { return rev ? y.s.pts - x.s.pts : (x.r.v.e - y.r.v.e); });
    h += '<table class="t"><thead><tr><th>Equipo</th><th>Riesgo → impacto → control Zero Trust</th><th>🚨 Alerta</th>' + (rev ? '<th>Fases frenadas</th>' : '') + '<th>Puntos</th></tr></thead><tbody>' + rows.map(function (x, i) {
      var v = x.r.v;
      return '<tr><td><b>' + (rev ? (['🥇 ', '🥈 ', '🥉 '][i] || '') : '') + esc(EQ[v.e] || '') + '</b><br><small class="muted">Protegen primero: ' + esc(v.act) + '</small></td><td>' + (v.f || []).filter(function (f) { return f.r; }).map(function (f) { return '<div style="margin-bottom:6px">' + esc(f.r) + ' <span class="pill">' + esc(IMP[f.i] || '—') + '</span><br>→ <b>' + esc(CT[f.c] || '—') + '</b>' + (f.m ? '<br><small class="muted">' + esc(f.m) + '</small>' : '') + '</div>'; }).join('') + '</td><td>' + (v.ac >= 0 && v.ax ? '<b>' + esc(CT[v.ac]) + '</b><br><small>' + esc(v.ax) + '</small>' : '—') + '</td>' + (rev ? '<td>' + x.s.fases.map(function (ok, k) { return (ok ? '🛡️' : '✗') + ' ' + (k + 1); }).join('<br>') + '</td>' : '') + '<td><b>' + (rev ? x.s.pts : '🔒') + '</b></td></tr>';
    }).join('') + '</tbody></table>';
    if (rev) h += '<h3 style="margin-top:18px">El ataque real a Digitech: ¿lo habrían frenado?</h3><ol>' + a.fases.map(function (f) { return '<li style="margin-bottom:6px">' + esc(f.t) + '<br><small class="muted">Lo frenaban: ' + f.b.map(function (c) { return esc(CT[c]); }).join(' · ') + '</small></li>'; }).join('') + '</ol><p class="muted" style="font-size:.85rem">Puntos: ' + a.pesos.fila + ' por riesgo completo (máx. 3) + ' + a.pesos.alerta + ' por responder la alerta + ' + a.pesos.fase + ' por cada fase del ataque que su estrategia frenaba.</p>';
    else h += '<p class="muted">Los puntajes están ocultos. Pulsa "Revelar puntajes" después de las presentaciones.</p>';
    return h;
  }
  function vMibot(a, rs) {
    var tot = rs.reduce(function (s, r) { return s + A.horasMes(r.v); }, 0);
    var h = '<div class="center" style="padding:10px 0 6px"><div class="muted" style="font-size:1.1rem">Entre todos liberamos</div><div style="font-size:4.2rem;font-weight:800;line-height:1.05;color:var(--blue)">' + tot.toFixed(0) + ' horas</div><div style="font-size:1.2rem;font-weight:700">al mes · ≈ ' + Math.round(tot * 12) + ' al año · ' + Math.round(tot / 8) + ' jornadas de 8 horas cada mes</div></div>';
    if (!rs.length) return h + '<p class="muted center">Aún no hay bots.</p>';
    var rows = rs.map(function (r) { return { r: r, h: A.horasMes(r.v) }; }).sort(function (x, y) { return y.h - x.h; });
    h += '<table class="t"><thead><tr><th>Tarea</th><th>Pasos para el robot</th><th>Horas al mes</th></tr></thead><tbody>' + rows.map(function (x) { var s = x.r.v.s || []; return '<tr><td>' + esc(x.r.v.t) + '</td><td>' + s.filter(function (st) { return st.r; }).length + ' de ' + s.length + '</td><td><b>' + x.h.toFixed(1).replace('.', ',') + '</b></td></tr>'; }).join('') + '</tbody></table><p class="muted" style="font-size:.85rem">Sin nombres en esta vista. El mayor ahorro se premia en el ranking.</p>';
    return h;
  }

  /* Puntos: 100 por acierto + bonificación por rapidez (50, 40, 30, 20, 10 para los 5 primeros en acertar) */
  function calcRank(R, al) {
    R = R || {}; al = al || {};
    var pts = {}, speed = {}, BON = [50, 40, 30, 20, 10];
    acts.filter(function (a) { return a.tipo === 'quiz'; }).forEach(function (a) {
      a.items.forEach(function (it, i) {
        var o = R[a.id + '_' + i] || {};
        Object.keys(o).filter(function (u) { return o[u] && o[u].v === it.a; }).sort(function (x, y) { return (o[x].t || 0) - (o[y].t || 0); }).forEach(function (u, k) {
          var b = BON[k] || 0; pts[u] = (pts[u] || 0) + 100 + b; speed[u] = (speed[u] || 0) + b;
        });
      });
    });
    var eqOf = {}, eo = R.equipo || {}; Object.keys(eo).forEach(function (u) { if (eo[u] && eo[u].v != null) eqOf[u] = eo[u].v; });
    var mision = EQ.map(function () { return 0; });
    acts.filter(function (a) { return a.tipo === 'pasos' || a.tipo === 'riesgos'; }).forEach(function (a) {
      var best = EQ.map(function () { return 0; }), mo = R[a.id] || {};
      Object.keys(mo).forEach(function (u) { var v = mo[u] && mo[u].v; if (v && v.e >= 0 && v.e < EQ.length) best[v.e] = Math.max(best[v.e], a.tipo === 'pasos' ? A.puntosPasos(v).pts : A.puntosRiesgos(a, v).pts); });
      best.forEach(function (x, i) { mision[i] += x; });
    });
    var simPub = {};
    acts.filter(function (a) { return a.tipo === 'presupuesto'; }).forEach(function (a) {
      var nS = ((R._sim || {})[a.id] || {}).v || 0, best = EQ.map(function () { return null; }), mo = R[a.id] || {};
      Object.keys(mo).forEach(function (u) { var v = mo[u] && mo[u].v; if (v && v.e >= 0 && v.e < EQ.length) { var sc = A.puntosPresupuesto(a, v, nS); if (!best[v.e] || sc.pts >= best[v.e].pts) best[v.e] = sc; } });
      simPub[a.id] = {}; best.forEach(function (sc, i) { if (sc) { mision[i] += nS > 0 ? sc.pts : 0; simPub[a.id][i] = sc.inc.map(function (x) { return x.st; }); } });
    });
    var sub = { clasif: EQ.map(function () { return 0; }), canvas: EQ.map(function () { return 0; }), votos: EQ.map(function () { return 0; }) };
    acts.filter(function (a) { return a.tipo === 'clasifica' || a.tipo === 'canvas'; }).forEach(function (a) {
      var best = EQ.map(function () { return 0; }), mo = R[a.id] || {};
      Object.keys(mo).forEach(function (u) { var v = mo[u] && mo[u].v; if (v && v.e >= 0 && v.e < EQ.length) best[v.e] = Math.max(best[v.e], a.tipo === 'clasifica' ? A.puntosClasifica(a, v).pts : A.puntosCanvas(a, v).pts); });
      best.forEach(function (x, i) { mision[i] += x; sub[a.tipo === 'clasifica' ? 'clasif' : 'canvas'][i] += x; });
    });
    acts.filter(function (a) { return a.tipo === 'voto'; }).forEach(function (a) {
      var mo = R[a.id] || {}, w = (a.pesos && a.pesos.voto) || 20;
      Object.keys(mo).forEach(function (u) { var v = mo[u] && mo[u].v; if (v != null && v >= 0 && v < EQ.length && eqOf[u] !== v) { sub.votos[v] += 1; mision[v] += w; } });
    });
    var bonus = EQ.map(function (e, i) { var b = (R._bonus || {})[i]; return b ? +b.v || 0 : 0; });
    var equipos = EQ.map(function (n, i) {
      var mem = Object.keys(eqOf).filter(function (u) { return eqOf[u] === i; });
      var prom = mem.length ? Math.round(mem.reduce(function (s, u) { return s + (pts[u] || 0); }, 0) / mem.length) : 0;
      return { n: n, miembros: mem.length, quiz: prom, mision: mision[i], bonus: bonus[i], total: prom + mision[i] + bonus[i], clasif: sub.clasif[i], canvas: sub.canvas[i], votos: sub.votos[i] };
    }).filter(function (e) { return e.miembros || e.mision || e.bonus; });
    var gente = Object.keys(al).map(function (u) { return { u: u, n: al[u], p: pts[u] || 0 }; }).sort(function (x, y) { return y.p - x.p; });
    var pos = {}, last = null, lastPos = 0; gente.forEach(function (g, i) { if (g.p !== last) { lastPos = i + 1; last = g.p; } pos[g.u] = lastPos; });
    var horas = {}, ho = R.mibot || {}; Object.keys(ho).forEach(function (u) { horas[u] = A.horasMes(ho[u] && ho[u].v); });
    var horasTot = Object.keys(horas).reduce(function (s, u) { return s + horas[u]; }, 0);
    function best(map) { var u = Object.keys(map).sort(function (x, y) { return map[y] - map[x]; })[0]; return u && map[u] > 0 ? { n: al[u] || 'Anónimo', v: map[u] } : null; }
    var eqBest = equipos.slice().sort(function (x, y) { return y.total - x.total; })[0], misBest = equipos.slice().sort(function (x, y) { return y.mision - x.mision; })[0];
    var med = {
      top: gente[0] && gente[0].p ? { n: gente[0].n, v: gente[0].p } : null,
      rapido: best(speed), ahorro: best(horas),
      cazadores: misBest && misBest.mision ? { n: misBest.n, v: misBest.mision } : null,
      equipo: eqBest && eqBest.total ? { n: eqBest.n, v: eqBest.total } : null
    };
    ['clasif', 'canvas', 'votos'].forEach(function (k) { var b = equipos.slice().sort(function (x, y) { return y[k] - x[k]; })[0]; med[k] = b && b[k] ? { n: b.n, v: b[k] } : null; });
    var pp = {}; gente.forEach(function (g) { pp[g.u] = g.p; });
    return { gente: gente, equipos: equipos, med: med, horasTot: horasTot, pub: { pts: pp, pos: pos, top: gente.slice(0, 10).map(function (g) { return { n: g.n, p: g.p }; }), equipos: equipos.map(function (e) { return { n: e.n, total: e.total }; }), sim: simPub, t: Date.now() } };
  }
  function publicarRanking() {
    return Promise.all([DB.leer('resp'), DB.leer('alias')]).then(function (r) { return DB.poner('resumen/rank', calcRank(r[0], r[1]).pub); }).catch(function (e) { console.warn(e); });
  }
  function stageRanking() {
    var K = calcRank(resp, aliases), live = estado.act === '__ranking';
    var h = '<div class="eyebrow">' + esc(A.clase.juegoNombre || 'BotFactory') + ' · Ranking</div><div class="tools">' +
      (live ? '<button class="btn sec sm" id="rdeact">✓ En los celulares · pausar</button>' : '<button class="btn y" id="ract">Mostrar el ranking en los celulares</button>') +
      '<button class="btn sec sm" id="rpub">Actualizar puntajes en los celulares</button></div>';
    var MED = A.clase.medallas || [['top', '🏆', 'Consultor estrella', ' pts'], ['rapido', '⚡', 'Bot más rápido', ' pts de rapidez'], ['cazadores', '🔍', 'Cazadores de cuellos de botella', ' pts'], ['ahorro', '⏱️', 'Mayor ahorro', ' h/mes'], ['equipo', '🤝', 'Mejor equipo', ' pts']];
    h += '<div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));margin-top:10px">' + MED.map(function (m) { var x = K.med[m[0]]; return '<div class="card" style="padding:14px;text-align:center"><div style="font-size:2rem">' + m[1] + '</div><div class="muted" style="font-weight:700">' + m[2] + '</div><div style="font-size:1.25rem;font-weight:800;margin-top:4px">' + (x ? esc(x.n) : '—') + '</div><div class="muted">' + (x ? (m[0] === 'ahorro' ? x.v.toFixed(1).replace('.', ',') : x.v) + m[3] : '') + '</div></div>'; }).join('') + '</div>';
    if (A.clase.soloEquipos) {
      h += '<h2 style="font-size:1.4rem;margin-top:18px">Equipos</h2>' + (!K.equipos.length ? '<p class="muted">Todavía no hay equipos.</p>' : '<div class="tablewrap"><table class="t"><thead><tr><th>Equipo</th><th>Reto</th><th>Canvas</th><th>Votos</th><th>Bono</th><th>Total</th></tr></thead><tbody>' + K.equipos.slice().sort(function (x, y) { return y.total - x.total; }).map(function (e, k) { var i = EQ.indexOf(e.n); return '<tr><td><b>' + (['🥇 ', '🥈 ', '🥉 '][k] || '') + esc(e.n) + '</b> <small class="muted">(' + e.miembros + ')</small></td><td>' + e.clasif + '</td><td>' + e.canvas + '</td><td>' + e.votos + '</td><td style="white-space:nowrap">' + e.bonus + ' <button class="btn sec sm bb" data-i="' + i + '" data-d="25" style="min-height:28px;padding:0 .5em">+25</button> <button class="btn sec sm bb" data-i="' + i + '" data-d="-25" style="min-height:28px;padding:0 .5em">−25</button></td><td><b>' + e.total + '</b></td></tr>'; }).join('') + '</tbody></table></div>') + '<p class="muted" style="font-size:.85rem;margin-top:10px">' + esc(A.clase.reglaPuntos || '') + '</p>';
      $('stage').innerHTML = h;
    } else {
    h += '<div class="grid2" style="margin-top:18px"><div><h2 style="font-size:1.4rem">' + esc(A.clase.juegoNombre ? 'Participantes' : 'Consultores') + '</h2><div class="optbars">';
    var mx = K.gente.length ? K.gente[0].p || 1 : 1;
    K.gente.slice(0, 12).forEach(function (g, i) { h += '<div class="ob' + (i < 3 ? ' ok' : '') + '"><span class="lbl">' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(g.n) + '</span><span class="trk"><i style="width:' + (100 * g.p / mx) + '%;background:' + (i < 3 ? 'var(--y)' : '#c9c9c0') + '"></i></span><span class="val">' + g.p + '</span></div>'; });
    h += '</div></div><div><h2 style="font-size:1.4rem">Equipos</h2>'; var actEq = acts.filter(function (x) { return x.tipo === 'equipo'; })[0];
    if (!K.equipos.length) h += '<p class="muted">Todavía no hay equipos: activa "' + esc(actEq ? actEq.titulo : 'Elige tu equipo') + '".</p>';
    else h += '<table class="t"><thead><tr><th>Equipo</th><th>Juegos (promedio)</th><th>Misión</th><th>Bono</th><th>Total</th></tr></thead><tbody>' + K.equipos.slice().sort(function (x, y) { return y.total - x.total; }).map(function (e) {
      var i = EQ.indexOf(e.n);
      return '<tr><td><b>' + esc(e.n) + '</b> <small class="muted">(' + e.miembros + ')</small></td><td>' + e.quiz + '</td><td>' + e.mision + '</td><td style="white-space:nowrap">' + e.bonus + ' <button class="btn sec sm bb" data-i="' + i + '" data-d="25" style="min-height:28px;padding:0 .5em">+25</button> <button class="btn sec sm bb" data-i="' + i + '" data-d="-25" style="min-height:28px;padding:0 .5em">−25</button></td><td><b>' + e.total + '</b></td></tr>';
    }).join('') + '</tbody></table>';
    h += '<p class="muted" style="font-size:.85rem;margin-top:10px">Puntos: 100 por acierto en los juegos + bonificación por rapidez (50, 40, 30, 20 y 10 para los 5 primeros en acertar). Equipo = promedio de sus integrantes + misión + bonos.</p>' + (acts.some(function (x) { return x.tipo === 'mibot'; }) ? '<div class="callout">Horas liberadas por el grupo: <b>' + K.horasTot.toFixed(0) + ' h/mes</b></div>' : '') + '</div></div>';
    $('stage').innerHTML = h;
    }
    var on = function (id, f) { var el = $(id); if (el) el.onclick = f; };
    on('ract', function () { publicarRanking().then(function () { setEstado({ act: '__ranking' }); }); });
    on('rdeact', function () { setEstado({ act: null }); });
    on('rpub', function () { publicarRanking().then(function () { toast('Puntajes actualizados en los celulares'); }); });
    $('stage').querySelectorAll('.bb').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i, cur0 = ((resp._bonus || {})[i] || {}).v || 0; DB.poner('resp/_bonus/' + i, { v: cur0 + (+b.dataset.d), t: A.TS }).then(publicarRanking); }; });
  }
})();
