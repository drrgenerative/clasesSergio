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
    var a = A.act(cur); if (!a.items) return;
    var n = Math.max(0, Math.min(a.items.length - 1, viewQ + d)); if (n === viewQ) return;
    viewQ = n; if (estado.act === cur) setEstado({ act: cur, q: n, revelar: false }); suscribir();
  }
  function revelar() {
    var a = A.act(cur); if (!a || !(a.items || a.tipo === 'pasos')) return;
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
      (isQ || a.tipo === 'pasos' ? '<button class="btn sm" id="brev">' + (live && estado.revelar ? 'Ocultar respuesta' : (a.tipo === 'pasos' ? 'Revelar puntajes' : 'Revelar')) + '</button>' : '') +
      '<button class="btn sec sm" id="bchat">Copiar para el chat</button>' +
      (A.demo ? '<button class="btn sec sm" id="bsim">Simular respuestas</button>' : '') +
      '<button class="btn warn sm" id="bclr">Borrar respuestas</button></div>';
    html += '<p class="count"><b>' + rs.length + '</b> respuesta' + (rs.length === 1 ? '' : 's') + (nA ? ' de ' + nA + ' conectados' : '') + '</p>';
    html += ({ texto: vTexto, quiz: vQuiz, encuesta: vQuiz, escala: vEscala, puntos: vPuntos, multi: vMulti, adkar: vAdkar, comite: vComite, reparto: vReparto, consultoria: vConsultoria, equipo: vEquipo, pasos: vPasos, mibot: vMibot }[a.tipo])(a, rs, live);
    $('stage').innerHTML = html;
    var on = function (id, f) { var el = $(id); if (el) el.onclick = f; };
    on('bact', activar); on('bdeact', function () { setEstado({ act: null }); });
    on('bprev', function () { irQ(-1); }); on('bnext', function () { irQ(1); }); on('brev', revelar);
    on('bchat', function () { copy(textoChat(a)); }); on('bsim', simular);
    on('bclr', function () { var b = this; if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = '¿Seguro? Clic otra vez'; setTimeout(function () { if (b.isConnected) { b.classList.remove('arm'); b.textContent = 'Borrar respuestas'; } }, 3000); return; } var k = A.clave(a, viewQ); DB.borrar('resp/' + k); DB.poner('estado/borrado/' + k, Date.now()); b.classList.remove('arm'); b.textContent = 'Borrar respuestas'; toast('Respuestas borradas'); });
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
    var h = '<h2>Perfil de madurez del grupo · ' + g.toFixed(1) + ' / 5</h2><div class="grid2"><div class="optbars">';
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
    var mision = EQ.map(function () { return 0; }), mo = R.cuello || {};
    Object.keys(mo).forEach(function (u) { var v = mo[u] && mo[u].v; if (v && v.e >= 0 && v.e < EQ.length) mision[v.e] = Math.max(mision[v.e], A.puntosPasos(v).pts); });
    var bonus = EQ.map(function (e, i) { var b = (R._bonus || {})[i]; return b ? +b.v || 0 : 0; });
    var equipos = EQ.map(function (n, i) {
      var mem = Object.keys(eqOf).filter(function (u) { return eqOf[u] === i; });
      var prom = mem.length ? Math.round(mem.reduce(function (s, u) { return s + (pts[u] || 0); }, 0) / mem.length) : 0;
      return { n: n, miembros: mem.length, quiz: prom, mision: mision[i], bonus: bonus[i], total: prom + mision[i] + bonus[i] };
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
    var pp = {}; gente.forEach(function (g) { pp[g.u] = g.p; });
    return { gente: gente, equipos: equipos, med: med, horasTot: horasTot, pub: { pts: pp, pos: pos, top: gente.slice(0, 10).map(function (g) { return { n: g.n, p: g.p }; }), equipos: equipos.map(function (e) { return { n: e.n, total: e.total }; }), t: Date.now() } };
  }
  function publicarRanking() {
    return Promise.all([DB.leer('resp'), DB.leer('alias')]).then(function (r) { return DB.poner('resumen/rank', calcRank(r[0], r[1]).pub); }).catch(function (e) { console.warn(e); });
  }
  function stageRanking() {
    var K = calcRank(resp, aliases), live = estado.act === '__ranking';
    var h = '<div class="eyebrow">BotFactory · Ranking</div><div class="tools">' +
      (live ? '<button class="btn sec sm" id="rdeact">✓ En los celulares · pausar</button>' : '<button class="btn y" id="ract">Mostrar el ranking en los celulares</button>') +
      '<button class="btn sec sm" id="rpub">Actualizar puntajes en los celulares</button></div>';
    var MED = [['top', '🏆', 'Consultor estrella', ' pts'], ['rapido', '⚡', 'Bot más rápido', ' pts de rapidez'], ['cazadores', '🔍', 'Cazadores de cuellos de botella', ' pts'], ['ahorro', '⏱️', 'Mayor ahorro', ' h/mes'], ['equipo', '🤝', 'Mejor equipo', ' pts']];
    h += '<div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));margin-top:10px">' + MED.map(function (m) { var x = K.med[m[0]]; return '<div class="card" style="padding:14px;text-align:center"><div style="font-size:2rem">' + m[1] + '</div><div class="muted" style="font-weight:700">' + m[2] + '</div><div style="font-size:1.25rem;font-weight:800;margin-top:4px">' + (x ? esc(x.n) : '—') + '</div><div class="muted">' + (x ? (m[0] === 'ahorro' ? x.v.toFixed(1).replace('.', ',') : x.v) + m[3] : '') + '</div></div>'; }).join('') + '</div>';
    h += '<div class="grid2" style="margin-top:18px"><div><h2 style="font-size:1.4rem">Consultores</h2><div class="optbars">';
    var mx = K.gente.length ? K.gente[0].p || 1 : 1;
    K.gente.slice(0, 12).forEach(function (g, i) { h += '<div class="ob' + (i < 3 ? ' ok' : '') + '"><span class="lbl">' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(g.n) + '</span><span class="trk"><i style="width:' + (100 * g.p / mx) + '%;background:' + (i < 3 ? 'var(--y)' : '#c9c9c0') + '"></i></span><span class="val">' + g.p + '</span></div>'; });
    h += '</div></div><div><h2 style="font-size:1.4rem">Equipos</h2>';
    if (!K.equipos.length) h += '<p class="muted">Todavía no hay equipos: activa "Nivel 0 · Elige tu equipo".</p>';
    else h += '<table class="t"><thead><tr><th>Equipo</th><th>Juegos (promedio)</th><th>Misión</th><th>Bono</th><th>Total</th></tr></thead><tbody>' + K.equipos.slice().sort(function (x, y) { return y.total - x.total; }).map(function (e) {
      var i = EQ.indexOf(e.n);
      return '<tr><td><b>' + esc(e.n) + '</b> <small class="muted">(' + e.miembros + ')</small></td><td>' + e.quiz + '</td><td>' + e.mision + '</td><td style="white-space:nowrap">' + e.bonus + ' <button class="btn sec sm bb" data-i="' + i + '" data-d="25" style="min-height:28px;padding:0 .5em">+25</button> <button class="btn sec sm bb" data-i="' + i + '" data-d="-25" style="min-height:28px;padding:0 .5em">−25</button></td><td><b>' + e.total + '</b></td></tr>';
    }).join('') + '</tbody></table>';
    h += '<p class="muted" style="font-size:.85rem;margin-top:10px">Puntos: 100 por acierto en los juegos + bonificación por rapidez (50, 40, 30, 20 y 10 para los 5 primeros en acertar). Equipo = promedio de sus integrantes + misión + bonos.</p><div class="callout">Horas liberadas por el grupo: <b>' + K.horasTot.toFixed(0) + ' h/mes</b></div></div></div>';
    $('stage').innerHTML = h;
    var on = function (id, f) { var el = $(id); if (el) el.onclick = f; };
    on('ract', function () { publicarRanking().then(function () { setEstado({ act: '__ranking' }); }); });
    on('rdeact', function () { setEstado({ act: null }); });
    on('rpub', function () { publicarRanking().then(function () { toast('Puntajes actualizados en los celulares'); }); });
    $('stage').querySelectorAll('.bb').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i, cur0 = ((resp._bonus || {})[i] || {}).v || 0; DB.poner('resp/_bonus/' + i, { v: cur0 + (+b.dataset.d), t: A.TS }).then(publicarRanking); }; });
  }
})();
