(function () {
  var A = APP, DB = A.DB, esc = A.esc, $ = function (id) { return document.getElementById(id); };
  var rank = null, estado = null, aliasName = A.store('alias:' + A.SALA) || '', borrador = {};
  $('ctitle').textContent = A.clase.titulo;
  function show(id) { ['s-carga', 's-error', 's-alias', 's-espera', 's-act'].forEach(function (s) { $(s).hidden = s !== id; }); }
  function fail(msg) { $('errtxt').textContent = msg; show('s-error'); }
  function gen(k) { return (estado && estado.borrado && estado.borrado[k]) || 0; }
  function local(k, v) {
    var key = 'r:' + A.SALA + ':' + k;
    if (v === undefined) { try { var o = JSON.parse(A.store(key) || 'null'); return o && o.g === gen(k) ? o.v : null; } catch (e) { return null; } }
    A.store(key, v === null ? null : JSON.stringify({ v: v, g: gen(k) }));
  }
  function conn(on) { $('cdot').className = 'dot' + (on ? ' on' : ''); $('ctxt').textContent = on ? 'Conectado' : 'Sin conexión'; }

  if (!DB) { fail('La página aún no está configurada. El profesor debe pegar la configuración de Firebase en config.js.'); return; }

  DB.iniciar().then(function () {
    if (DB.conexion) DB.conexion(conn); else conn(true);
    if (!aliasName) { show('s-alias'); setTimeout(function () { $('alias').focus(); }, 50); }
    else entrar();
  }).catch(function (e) { fail('Revisa tu conexión a internet e intenta de nuevo. (' + (e && e.code || e && e.message || e) + ')'); });

  $('falias').onsubmit = function (ev) {
    ev.preventDefault();
    var v = $('alias').value.trim().slice(0, 40); if (!v) return;
    aliasName = v; A.store('alias:' + A.SALA, v); entrar();
  };

  function entrar() {
    $('me').textContent = aliasName;
    DB.poner('alias/' + DB.uid, aliasName).catch(function () {});
    if (DB.presencia) DB.presencia();
    $('brep').hidden = false;
    show('s-espera');
    if (A.clase.juego) {
      var pill = document.createElement('span'); pill.className = 'pill'; pill.id = 'ppts'; pill.hidden = true; pill.style.marginTop = '6px'; pill.style.background = 'var(--y2)';
      $('brep').parentNode.insertBefore(pill, $('brep')); $('brep').insertAdjacentHTML('beforebegin', '<br>');
      DB.escuchar('resumen/rank', function (r) {
        rank = r || null;
        var p = rank && rank.pts ? rank.pts[DB.uid] : null;
        if (p != null && !A.clase.soloEquipos) { pill.hidden = false; pill.textContent = '⭐ ' + p + ' pts · #' + (rank.pos[DB.uid] || '—'); }
        if (estado && (estado.act === '__ranking' || ((A.act(estado.act) || {}).tipo === 'presupuesto' && estado.q > 0))) { $('s-act').dataset.sig = ''; render(); }
      });
    }
    DB.escuchar('estado', function (e) { estado = e; render(); }, function (e) { fail('No hay permiso para leer la clase. Revisa las reglas de Firebase. (' + (e && e.code || '') + ')'); });
  }

  $('brep').onclick = function () {
    var mine = {};
    A.clase.actividades.forEach(function (a) {
      if (a.items) a.items.forEach(function (it, i) { var k = A.clave(a, i), x = local(k); if (x != null) mine[k] = x; });
      else { var x = local(A.clave(a)); if (x != null) mine[a.id] = x; }
    });
    var b = this; b.disabled = true;
    DB.leer('resumen').catch(function () { return null; }).then(function (R) {
      b.disabled = false;
      REPORTE.visor(REPORTE.personal(aliasName, mine, R), 'Mi_reporte_' + aliasName.replace(/[^\wáéíóúñÁÉÍÓÚÑ-]+/g, '_') + '.html');
    });
  };

  function enviar(key, v) {
    return DB.poner('resp/' + key + '/' + DB.uid, { v: v, t: A.TS }).then(function () { local(key, v); });
  }
  function errBox(el, e) { var d = document.createElement('div'); d.className = 'err'; d.textContent = 'No se pudo enviar. Revisa tu conexión y vuelve a intentar.' + (e && e.code ? ' (' + e.code + ')' : ''); el.appendChild(d); }

  function render() {
    if (estado && estado.act === '__ranking') { show('s-act'); var bx = $('s-act'); bx.dataset.sig = '__r'; bx.dataset.act = '__ranking'; rRanking(bx); return; }
    var a = estado && estado.act ? A.act(estado.act) : null;
    if (!a) { show('s-espera'); return; }
    var box = $('s-act'); show('s-act');
    var f = { texto: rTexto, quiz: rQuiz, encuesta: rQuiz, escala: rEscala, puntos: rPuntos, multi: rMulti, adkar: rAdkar, comite: rComite, reparto: rReparto, consultoria: rConsultoria, equipo: rEquipo, pasos: rPasos, mibot: rMibot, riesgos: rRiesgos, presupuesto: rPresupuesto, rol: rRol, clasifica: rClasifica, canvas: rCanvas, voto: rVoto }[a.tipo];
    var sig = a.id + '|' + (estado.q || 0) + '|' + (!!estado.revelar) + '|' + (!!estado.alerta) + '|' + (a.tipo === 'presupuesto' && rank ? rank.t : '') + '|' + gen(A.clave(a, estado.q || 0));
    if (box.dataset.sig === sig) return;
    var keepScroll = box.dataset.act === a.id && (a.tipo === 'escala' || a.tipo === 'comite' || a.tipo === 'consultoria' || a.tipo === 'reparto' || a.tipo === 'pasos' || a.tipo === 'mibot' || a.tipo === 'riesgos' || a.tipo === 'presupuesto' || a.tipo === 'clasifica' || a.tipo === 'canvas');
    box.dataset.sig = sig; box.dataset.act = a.id;
    f(a, box);
    if (!keepScroll) window.scrollTo(0, 0);
  }
  function head(a, extra) { return '<div class="eyebrow">' + esc(a.titulo) + (extra ? ' · ' + extra : '') + '</div>'; }

  /* ---- Texto ---- */
  function rTexto(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev != null && !borrador[key]) {
      box.innerHTML = head(a) + '<p class="q">' + esc(a.pregunta) + '</p><div class="note ok"><b>Enviado:</b> ' + esc(prev) + '</div><div style="margin-top:12px"><button class="btn sec" id="edit">Cambiar mi respuesta</button></div>';
      $('edit').onclick = function () { borrador[key] = 1; box.dataset.sig = ''; render(); };
      return;
    }
    var big = a.max > 60;
    box.innerHTML = head(a) + '<p class="q">' + esc(a.pregunta) + '</p>' +
      (big ? '<textarea id="tx" class="input" rows="4" maxlength="' + a.max + '"></textarea>' : '<input id="tx" class="input" maxlength="' + a.max + '">') +
      '<p class="muted" style="font-size:.85rem">' + esc(a.ayuda || '') + '</p><button class="btn" id="go">Enviar</button>';
    $('tx').value = prev || '';
    $('go').onclick = function () {
      var v = $('tx').value.trim(); if (!v) return; this.disabled = true;
      enviar(key, v).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); });
    };
  }

  /* ---- Quiz y encuesta ---- */
  function rQuiz(a, box) {
    var qi = Math.min(estado.q || 0, a.items.length - 1), it = a.items[qi], key = A.clave(a, qi), mine = local(key), rev = !!estado.revelar;
    var html = head(a, 'Pregunta ' + (qi + 1) + ' de ' + a.items.length) + '<p class="q">' + esc(it.q) + '</p><div class="opts">';
    a.opciones.forEach(function (o, i) {
      var cls = 'opt';
      if (mine === i) cls += ' sel';
      if (rev && a.tipo === 'quiz') { if (i === it.a) cls += ' ok'; else if (mine === i) cls += ' bad'; }
      html += '<button class="' + cls + '" data-i="' + i + '"' + (mine != null || rev ? ' disabled' : '') + '><span class="k">' + String.fromCharCode(65 + i) + '</span><span>' + esc(o) + '</span></button>';
    });
    html += '</div>';
    if (rev && a.tipo === 'quiz') html += '<div class="note ' + (mine === it.a ? 'ok' : 'bad') + '"><b>' + (mine === it.a ? '¡Correcto!' : (mine == null ? 'Respuesta correcta: ' + esc(a.opciones[it.a]) + '.' : 'No era esa. Era ' + esc(a.opciones[it.a]) + '.')) + '</b> ' + esc(it.exp) + '</div>';
    else if (rev) html += '<div class="note">' + esc(it.nota || '') + '</div>';
    else if (mine != null) html += '<p class="muted center" style="margin-top:14px">Respuesta enviada. Espera a que el profesor revele.</p>';
    box.innerHTML = html;
    box.querySelectorAll('.opt').forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.i; box.querySelectorAll('.opt').forEach(function (x) { x.disabled = true; }); b.classList.add('sel');
        enviar(key, i).then(function () { box.dataset.sig = ''; render(); }).catch(function (e) { box.querySelectorAll('.opt').forEach(function (x) { x.disabled = false; }); b.classList.remove('sel'); errBox(box, e); });
      };
    });
  }

  /* ---- Escala (autodiagnóstico de madurez) ---- */
  function rEscala(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev && !borrador[key]) { resultadoEscala(a, box, prev); return; }
    var total = 0; a.grupos.forEach(function (g) { total += g.items.length; });
    var vals = borrador[key + ':v'] || (prev ? prev.slice() : new Array(total).fill(0)); borrador[key + ':v'] = vals;
    var html = head(a) + '<p>' + esc(a.intro) + '</p>', k = 0;
    a.grupos.forEach(function (g) {
      html += '<div class="group"><b>' + esc(g.k) + '</b>';
      g.items.forEach(function (t) {
        html += '<div class="item"><p>' + esc(t) + '</p><div class="seg" data-k="' + k + '">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" class="' + (vals[k] === n ? 'sel' : '') + '">' + n + '</button>'; }).join('') + '</div></div>';
        k++;
      });
      html += '</div>';
    });
    html += '<div class="sticky"><div class="prog"><i id="pg"></i></div><button class="btn" id="go" style="width:100%">Ver mi resultado y enviar</button></div>';
    box.innerHTML = html;
    function upd() { var n = vals.filter(function (x) { return x > 0; }).length; $('pg').style.width = (100 * n / total) + '%'; $('go').disabled = n < total; $('go').textContent = n < total ? 'Te faltan ' + (total - n) : 'Ver mi resultado y enviar'; }
    box.querySelectorAll('.seg').forEach(function (s) {
      s.onclick = function (ev) { var b = ev.target.closest('button'); if (!b) return; vals[+s.dataset.k] = +b.dataset.n; s.querySelectorAll('button').forEach(function (x) { x.classList.toggle('sel', x === b); }); upd(); };
    });
    upd();
    $('go').onclick = function () {
      this.disabled = true;
      enviar(key, vals).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); });
    };
  }
  function resultadoEscala(a, box, v) {
    var p = A.promedios(a, v), g = p.reduce(function (s, x) { return s + x; }, 0) / p.length, low = p.indexOf(Math.min.apply(null, p));
    var html = head(a, 'Tu resultado') + '<div class="center" style="margin:10px 0 16px"><div class="muted">' + esc(a.etiqueta || 'Madurez digital de tu organización') + '</div><div class="big">' + g.toFixed(1) + ' / 5</div><div class="pill" style="margin-top:6px">' + A.nivel(g) + '</div></div><div class="bars">';
    a.grupos.forEach(function (gr, i) { html += '<div class="bar"><span class="lbl">' + esc(gr.k) + '</span><span class="trk"><i class="' + (i === low ? 'y' : '') + '" style="width:' + (p[i] / 5 * 100) + '%"></i></span><span class="val">' + p[i].toFixed(1) + '</span></div>'; });
    html += '</div><div class="note">Tu dimensión más débil es <b>' + esc(a.grupos[low].k) + '</b>. Tus respuestas ya llegaron al panel del profesor.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir respuestas</button></div>';
    box.innerHTML = html;
    $('edit').onclick = function () { borrador[A.clave(a)] = 1; borrador[A.clave(a) + ':v'] = v.slice(); box.dataset.sig = ''; render(); };
  }

  /* ---- Puntos (cultura hoy vs. deseada) ---- */
  function rPuntos(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev && !borrador[key]) { resultadoPuntos(a, box, prev); return; }
    var vals = borrador[key + ':v'] || (prev ? JSON.parse(JSON.stringify(prev)) : [[25, 25, 25, 25], [25, 25, 25, 25]]); borrador[key + ':v'] = vals;
    var html = head(a) + '<p>' + esc(a.intro) + '</p>';
    a.partes.forEach(function (pt, pi) {
      html += '<h2>' + (pi + 1) + '. ' + esc(pt) + '</h2><div class="pts">';
      a.tipos.forEach(function (t, ti) { html += '<div class="pt"><span><b>' + esc(t) + '</b></span><span class="ctl"><button type="button" data-p="' + pi + '" data-t="' + ti + '" data-d="-5">−</button><input inputmode="numeric" data-p="' + pi + '" data-t="' + ti + '" value="' + vals[pi][ti] + '"><button type="button" data-p="' + pi + '" data-t="' + ti + '" data-d="5">+</button></span></div>'; });
      html += '</div><span class="sum" id="sum' + pi + '"></span>';
    });
    html += '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar</button></div>';
    box.innerHTML = html;
    function clamp(x) { x = Math.round(+x || 0); return Math.max(0, Math.min(100, x)); }
    function upd() {
      var ok = true;
      [0, 1].forEach(function (pi) { var s = vals[pi].reduce(function (a, b) { return a + b; }, 0), el = $('sum' + pi); el.className = 'sum' + (s === 100 ? ' ok' : ''); el.textContent = s === 100 ? 'Suma 100 ✓' : 'Suma ' + s + ' (debe ser 100)'; if (s !== 100) ok = false; });
      $('go').disabled = !ok;
    }
    box.querySelectorAll('.ctl button').forEach(function (b) { b.onclick = function () { var p = +b.dataset.p, t = +b.dataset.t; vals[p][t] = clamp(vals[p][t] + (+b.dataset.d)); box.querySelector('input[data-p="' + p + '"][data-t="' + t + '"]').value = vals[p][t]; upd(); }; });
    box.querySelectorAll('.ctl input').forEach(function (i) { i.oninput = function () { vals[+i.dataset.p][+i.dataset.t] = clamp(i.value); upd(); }; i.onblur = function () { i.value = vals[+i.dataset.p][+i.dataset.t]; }; });
    upd();
    $('go').onclick = function () { this.disabled = true; enviar(key, vals).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
  }
  function resultadoPuntos(a, box, v) {
    var html = head(a, 'Tu resultado') + '<div class="legend"><span><i style="background:#c9c9c0"></i>Hoy</span><span><i style="background:var(--blue)"></i>La que necesitamos</span></div><div class="bars">';
    a.tipos.forEach(function (t, i) {
      var d = v[1][i] - v[0][i];
      html += '<div class="bar"><span class="lbl">' + esc(t) + '</span><span><span class="trk" style="display:block;margin-bottom:3px"><i class="k" style="width:' + v[0][i] + '%;background:#c9c9c0"></i></span><span class="trk" style="display:block"><i style="width:' + v[1][i] + '%"></i></span></span><span class="val">' + (d > 0 ? '+' : '') + d + '</span></div>';
    });
    var gaps = v[1].map(function (x, i) { return x - v[0][i]; }), up = gaps.indexOf(Math.max.apply(null, gaps)), dn = gaps.indexOf(Math.min.apply(null, gaps));
    html += '</div><div class="note">Tu mayor brecha: más <b>' + esc(a.tipos[up]) + '</b> y menos <b>' + esc(a.tipos[dn]) + '</b>.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
    box.innerHTML = html;
    $('edit').onclick = function () { borrador[A.clave(a)] = 1; borrador[A.clave(a) + ':v'] = JSON.parse(JSON.stringify(v)); box.dataset.sig = ''; render(); };
  }

  /* ---- Selección múltiple ---- */
  function rMulti(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev && !borrador[key]) {
      box.innerHTML = head(a) + '<p class="q">Marcaste ' + prev.length + ' de ' + a.opciones.length + ' señales.</p><ul>' + prev.map(function (i) { return '<li>' + esc(a.opciones[i]) + '</li>'; }).join('') + '</ul><div class="note ok">Enviado.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Cambiar</button></div>';
      $('edit').onclick = function () { borrador[key] = 1; box.dataset.sig = ''; render(); }; return;
    }
    var sel = (prev || []).slice();
    box.innerHTML = head(a) + '<p>' + esc(a.intro) + '</p>' + a.opciones.map(function (o, i) { return '<label class="chk' + (sel.indexOf(i) >= 0 ? ' on' : '') + '"><input type="checkbox" value="' + i + '"' + (sel.indexOf(i) >= 0 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>'; }).join('') + '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar</button></div>';
    box.querySelectorAll('.chk input').forEach(function (c) { c.onchange = function () { c.parentNode.classList.toggle('on', c.checked); }; });
    $('go').onclick = function () {
      var v = [].map.call(box.querySelectorAll('.chk input:checked'), function (c) { return +c.value; }); this.disabled = true;
      enviar(key, v.length ? v : [-1]).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); });
    };
  }

  /* ---- ADKAR personal ---- */
  function rAdkar(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev && !borrador[key]) { resultadoAdkar(a, box, prev); return; }
    var st = borrador[key + ':v'] || (prev ? JSON.parse(JSON.stringify(prev)) : { c: '', s: [0, 0, 0, 0, 0] }); borrador[key + ':v'] = st;
    var html = head(a) + '<p>' + esc(a.intro) + '</p><label class="f" for="cmb">El cambio (opcional)</label><input id="cmb" class="input" maxlength="80" placeholder="Ej.: nuevo sistema de créditos">';
    a.etapas.forEach(function (e, i) { html += '<div class="item"><p><b>' + esc(e.k) + '</b> · ' + esc(e.q) + '</p><div class="seg" data-k="' + i + '">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" class="' + (st.s[i] === n ? 'sel' : '') + '">' + n + '</button>'; }).join('') + '</div></div>'; });
    html += '<div class="scale-legend"><span>1 = nada</span><span>5 = totalmente</span></div><div class="sticky"><button class="btn" id="go" style="width:100%">Ver mi punto de bloqueo</button></div>';
    box.innerHTML = html;
    $('cmb').value = st.c || ''; $('cmb').oninput = function () { st.c = this.value; };
    function upd() { $('go').disabled = st.s.some(function (x) { return !x; }); }
    box.querySelectorAll('.seg').forEach(function (s) { s.onclick = function (ev) { var b = ev.target.closest('button'); if (!b) return; st.s[+s.dataset.k] = +b.dataset.n; s.querySelectorAll('button').forEach(function (x) { x.classList.toggle('sel', x === b); }); upd(); }; });
    upd();
    $('go').onclick = function () { this.disabled = true; st.c = $('cmb').value.trim().slice(0, 80); enviar(key, st).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
  }
  function resultadoAdkar(a, box, v) {
    var b = A.bloqueo(v.s), html = head(a, 'Tu resultado') + (v.c ? '<p class="muted">Cambio: ' + esc(v.c) + '</p>' : '') + '<div class="bars">';
    a.etapas.forEach(function (e, i) { html += '<div class="bar"><span class="lbl">' + esc(e.k) + '</span><span class="trk"><i class="' + (i === b ? 'r' : (b >= 0 && i > b ? '' : 'g')) + '" style="width:' + (v.s[i] / 5 * 100) + '%;' + (b >= 0 && i > b ? 'background:#c9c9c0' : '') + '"></i></span><span class="val">' + v.s[i] + '</span></div>'; });
    html += '</div>';
    if (b >= 0) html += '<div class="note bad"><b>Tu punto de bloqueo: ' + esc(a.etapas[b].k) + '.</b> Es el primer elemento con 3 o menos. Mientras no se resuelva, trabajar en los siguientes rinde poco.<br><br><b>Qué hacer:</b> ' + esc(a.accion[b]) + '</div>';
    else html += '<div class="note ok"><b>No hay punto de bloqueo:</b> todos los elementos están en 4 o 5. Concéntrate en sostener el cambio.</div>';
    html += '<div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
    box.innerHTML = html;
    $('edit').onclick = function () { borrador[A.clave(a)] = 1; borrador[A.clave(a) + ':v'] = JSON.parse(JSON.stringify(v)); box.dataset.sig = ''; render(); };
  }

  /* ---- Decisión del comité ---- */
  function rComite(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev && !borrador[key]) {
      box.innerHTML = head(a) + '<p class="q">Decisión enviada: ' + esc(prev.n) + '</p><div class="note ok">El panel del profesor ya la tiene. Prepárense para presentarla en 2 minutos.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      $('edit').onclick = function () { borrador[key] = 1; box.dataset.sig = ''; render(); }; return;
    }
    var v = borrador[key + ':v'] || (prev ? JSON.parse(JSON.stringify(prev)) : { n: '', e: -1, p: [20, 20, 20, 20, 20], s: [], x: '' }); borrador[key + ':v'] = v;
    var html = head(a) + '<p class="muted">' + esc(a.intro) + '</p>' +
      '<label class="f" for="cn">Nombre del comité o número de sala</label><input id="cn" class="input" maxlength="30" placeholder="Ej.: Sala 3">' +
      '<label class="f" for="ce">Etapa ADKAR donde está el bloqueo</label><select id="ce" class="input"><option value="-1">Elige una etapa</option>' + a.etapas.map(function (e, i) { return '<option value="' + i + '">' + esc(e) + '</option>'; }).join('') + '</select>' +
      '<label class="f">Reparte 100 puntos de presupuesto</label><div class="pts">' + a.dimensiones.map(function (d, i) { return '<div class="pt"><span><b>' + esc(d) + '</b></span><span class="ctl"><button type="button" data-t="' + i + '" data-d="-5">−</button><input inputmode="numeric" data-t="' + i + '" value="' + v.p[i] + '"><button type="button" data-t="' + i + '" data-d="5">+</button></span></div>'; }).join('') + '</div><span class="sum" id="sum"></span>' +
      '<label class="f">Elige 2 estrategias</label>' + a.estrategias.map(function (s, i) { return '<label class="chk' + (v.s.indexOf(i) >= 0 ? ' on' : '') + '"><input type="checkbox" value="' + i + '"' + (v.s.indexOf(i) >= 0 ? ' checked' : '') + '><span>' + esc(s) + '</span></label>'; }).join('') +
      '<label class="f" for="cx">Acción de los primeros 90 días</label><textarea id="cx" class="input" rows="3" maxlength="200"></textarea>' +
      '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar decisión</button></div>';
    box.innerHTML = html;
    $('cn').value = v.n; $('ce').value = String(v.e); $('cx').value = v.x;
    function clamp(x) { x = Math.round(+x || 0); return Math.max(0, Math.min(100, x)); }
    function upd() {
      v.n = $('cn').value.trim().slice(0, 30); v.e = +$('ce').value; v.x = $('cx').value.trim().slice(0, 200);
      v.s = [].map.call(box.querySelectorAll('.chk input:checked'), function (c) { return +c.value; });
      var s = v.p.reduce(function (a, b) { return a + b; }, 0), el = $('sum'); el.className = 'sum' + (s === 100 ? ' ok' : ''); el.textContent = s === 100 ? 'Suma 100 ✓' : 'Suma ' + s + ' (debe ser 100)';
      box.querySelectorAll('.chk input').forEach(function (c) { c.disabled = !c.checked && v.s.length >= 2; c.parentNode.classList.toggle('on', c.checked); });
      $('go').disabled = !(v.n && v.e >= 0 && s === 100 && v.s.length === 2 && v.x);
    }
    box.querySelectorAll('.ctl button').forEach(function (b) { b.onclick = function () { var t = +b.dataset.t; v.p[t] = clamp(v.p[t] + (+b.dataset.d)); box.querySelector('.ctl input[data-t="' + t + '"]').value = v.p[t]; upd(); }; });
    box.querySelectorAll('.ctl input').forEach(function (i) { i.oninput = function () { v.p[+i.dataset.t] = clamp(i.value); upd(); }; i.onblur = function () { i.value = v.p[+i.dataset.t]; }; });
    ['cn', 'ce', 'cx'].forEach(function (id) { $(id).oninput = upd; $(id).onchange = upd; });
    box.querySelectorAll('.chk input').forEach(function (c) { c.onchange = upd; });
    upd();
    $('go').onclick = function () { upd(); this.disabled = true; enviar(key, v).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
  }
  /* ---- Reparto de 100 puntos entre opciones ---- */
  function rReparto(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev && !borrador[key]) {
      var h = head(a, 'Tu reparto') + '<div class="bars" style="margin-top:10px">';
      a.opciones.forEach(function (o, i) { h += '<div class="bar"><span class="lbl">' + esc(o) + '</span><span class="trk"><i style="width:' + prev[i] + '%"></i></span><span class="val">' + prev[i] + '</span></div>'; });
      box.innerHTML = h + '</div><div class="note ok">Enviado.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Cambiar</button></div>';
      $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = prev.slice(); box.dataset.sig = ''; render(); };
      return;
    }
    var vals = borrador[key + ':v'] || a.opciones.map(function () { return 0; }); borrador[key + ':v'] = vals;
    box.innerHTML = head(a) + '<p>' + esc(a.intro) + '</p><div class="pts">' + a.opciones.map(function (o, i) {
      return '<div class="pt"><span><b>' + esc(o) + '</b></span><span class="ctl"><button type="button" data-t="' + i + '" data-d="-10">−</button><input inputmode="numeric" data-t="' + i + '" value="' + vals[i] + '"><button type="button" data-t="' + i + '" data-d="10">+</button></span></div>';
    }).join('') + '</div><span class="sum" id="sum"></span><div class="sticky"><button class="btn" id="go" style="width:100%">Enviar</button></div>';
    function clamp(x) { x = Math.round(+x || 0); return Math.max(0, Math.min(100, x)); }
    function upd() { var s = vals.reduce(function (x, y) { return x + y; }, 0), el = $('sum'); el.className = 'sum' + (s === 100 ? ' ok' : ''); el.textContent = s === 100 ? 'Suma 100 ✓' : 'Suma ' + s + ' (debe ser 100)'; $('go').disabled = s !== 100; }
    box.querySelectorAll('.ctl button').forEach(function (b) { b.onclick = function () { var t = +b.dataset.t; vals[t] = clamp(vals[t] + (+b.dataset.d)); box.querySelector('.ctl input[data-t="' + t + '"]').value = vals[t]; upd(); }; });
    box.querySelectorAll('.ctl input').forEach(function (i) { i.oninput = function () { vals[+i.dataset.t] = clamp(i.value); upd(); }; i.onblur = function () { i.value = vals[+i.dataset.t]; }; });
    upd();
    $('go').onclick = function () { this.disabled = true; enviar(key, vals).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
  }

  /* ---- Consultoría: análisis de una empresa ficticia ---- */
  function rConsultoria(a, box) {
    var key = A.clave(a), prev = local(key), E = A.clase.empresas || [], T = A.clase.tecnologias || [];
    if (prev && !borrador[key]) {
      var em = E[prev.emp] || { n: '', retos: [] };
      box.innerHTML = head(a) + '<p class="q">Análisis enviado: ' + esc(prev.n) + ' · ' + esc(em.n) + '</p><ul>' + em.retos.map(function (r, i) { return '<li>' + esc(r.t) + ' <b>→ ' + esc(T[prev.r[i]] || '') + '</b>' + (i === prev.p ? ' ⭐ piloto' : '') + '</li>'; }).join('') + '</ul><div class="note ok">El panel del profesor ya lo tiene. Prepárense para presentar el piloto en 2 minutos.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = JSON.parse(JSON.stringify(prev)); box.dataset.sig = ''; render(); };
      return;
    }
    var v = borrador[key + ':v'] || { n: '', emp: -1, r: [-1, -1, -1, -1, -1], p: -1, k: '', m: '' }; borrador[key + ':v'] = v;
    function dibujar() {
      var em = E[v.emp];
      var h = head(a) + '<p class="muted">' + esc(a.intro) + '</p>' +
        '<label class="f" for="cn">Nombre del equipo o número de sala</label><input id="cn" class="input" maxlength="30" placeholder="Ej.: Sala 2">' +
        '<label class="f" for="ce">Empresa que analizaron</label><select id="ce" class="input"><option value="-1">Elige la empresa</option>' + E.map(function (e, i) { return '<option value="' + i + '">' + esc(e.n + ' · ' + e.sector) + '</option>'; }).join('') + '</select>';
      if (em) {
        h += '<h2>¿Qué tecnología usarían en cada reto?</h2>' + em.retos.map(function (r, i) {
          return '<div class="item"><p><b>' + (i + 1) + '.</b> ' + esc(r.t) + '</p><select class="input rt" data-i="' + i + '"><option value="-1">Elige…</option>' + T.map(function (t, j) { return '<option value="' + j + '"' + (v.r[i] === j ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>';
        }).join('') +
        '<label class="f" for="cp">El reto que elegirían como piloto</label><select id="cp" class="input"><option value="-1">Elige el piloto</option>' + em.retos.map(function (r, i) { return '<option value="' + i + '"' + (v.p === i ? ' selected' : '') + '>Reto ' + (i + 1) + ': ' + esc(r.t.slice(0, 60)) + (r.t.length > 60 ? '…' : '') + '</option>'; }).join('') + '</select>' +
        '<label class="f" for="ck">Principal riesgo ético del piloto y cómo lo cuidarían</label><textarea id="ck" class="input" rows="3" maxlength="200"></textarea>' +
        '<label class="f" for="cm">¿Cómo medirían el éxito del piloto?</label><input id="cm" class="input" maxlength="120" placeholder="Ej.: reducir de 2 días a 2 horas la respuesta">';
      }
      h += '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar análisis</button></div>';
      box.innerHTML = h;
      $('cn').value = v.n; $('ce').value = String(v.emp);
      if (em) { $('ck').value = v.k; $('cm').value = v.m; }
      $('ce').onchange = function () { leer(); var n = +this.value; if (n !== v.emp) { v.emp = n; v.r = [-1, -1, -1, -1, -1]; v.p = -1; } dibujar(); };
      box.querySelectorAll('input,textarea,select').forEach(function (el) { if (el.id !== 'ce') { el.oninput = upd; el.onchange = upd; } });
      upd();
      $('go').onclick = function () { leer(); if (!ok()) return; this.disabled = true; enviar(key, v).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
    }
    function leer() {
      v.n = ($('cn') || {}).value ? $('cn').value.trim().slice(0, 30) : '';
      box.querySelectorAll('.rt').forEach(function (s) { v.r[+s.dataset.i] = +s.value; });
      if ($('cp')) v.p = +$('cp').value;
      if ($('ck')) v.k = $('ck').value.trim().slice(0, 200);
      if ($('cm')) v.m = $('cm').value.trim().slice(0, 120);
    }
    function ok() { return v.n && v.emp >= 0 && v.r.every(function (x) { return x >= 0; }) && v.p >= 0 && v.k && v.m; }
    function upd() { leer(); $('go').disabled = !ok(); }
    dibujar();
  }
  /* ===================== BotFactory ===================== */
  function rRanking(box) {
    var r = rank;
    if (!r || !r.top) { box.innerHTML = '<div class="eyebrow">Ranking</div><p class="q">El ranking aparecerá aquí en un momento…</p>'; return; }
    var yo = !A.clase.soloEquipos && r.pts && r.pts[DB.uid] != null ? '<div class="note ok center" style="font-size:1.1rem"><b>Tú: ' + r.pts[DB.uid] + ' puntos · puesto #' + r.pos[DB.uid] + '</b></div>' : '';
    var h = '<div class="eyebrow">' + esc(A.clase.juegoNombre || 'BotFactory') + ' · Ranking</div><h1>' + esc(A.clase.rankingTitulo || '🏆 Los mejores consultores') + '</h1>' + yo + '<div class="bars" style="margin-top:12px">';
    var mx = r.top.length ? r.top[0].p || 1 : 1;
    if (!A.clase.soloEquipos) r.top.forEach(function (t, i) { h += '<div class="bar"><span class="lbl">' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(t.n) + '</span><span class="trk"><i class="y" style="width:' + (100 * t.p / mx) + '%"></i></span><span class="val">' + t.p + '</span></div>'; });
    h += '</div>';
    if (r.equipos && r.equipos.length) {
      var me = r.equipos.slice().sort(function (x, y) { return y.total - x.total; }), m2 = me[0].total || 1;
      h += '<h2>Equipos</h2><div class="bars">' + me.map(function (e, i) { return '<div class="bar"><span class="lbl">' + (['🥇', '🥈', '🥉'][i] || '') + ' ' + esc(e.n) + '</span><span class="trk"><i style="width:' + (100 * e.total / m2) + '%"></i></span><span class="val">' + e.total + '</span></div>'; }).join('') + '</div>';
    }
    box.innerHTML = h;
  }

  function rEquipo(a, box) {
    var key = A.clave(a), prev = local(key), EQ = A.clase.equipos || [];
    box.innerHTML = head(a) + '<p class="q">' + esc(a.intro) + '</p><div class="opts">' + EQ.map(function (e, i) { return '<button class="opt' + (prev === i ? ' sel' : '') + '" data-i="' + i + '"><span class="k">' + (i + 1) + '</span><span>' + esc(e) + '</span></button>'; }).join('') + '</div>' + (prev != null ? '<div class="note ok">Estás en <b>' + esc(EQ[prev]) + '</b>. Puedes cambiarlo si te equivocaste.</div>' : '');
    box.querySelectorAll('.opt').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; enviar(key, i).then(function () { box.dataset.sig = ''; render(); }).catch(function (e) { errBox(box, e); }); }; });
  }

  function rPasos(a, box) {
    var key = A.clave(a), prev = local(key), PR = A.clase.procesos || [], EQ = A.clase.equipos || [], rev = !!(estado && estado.revelar);
    var OPS = [['🤖', 'Robot'], ['🙋', 'Persona'], ['🗑️', 'Eliminar']];
    if (prev && (rev || !borrador[key])) {
      var pr = PR[prev.p], sc = A.puntosPasos(prev), h = head(a) + '<p class="q">' + esc(EQ[prev.e] || '') + ' · ' + esc(pr.n) + '</p>';
      if (rev) {
        h += '<div class="center" style="margin:6px 0 12px"><div class="big">' + sc.pts + ' / ' + sc.max + ' pts</div><div class="muted">' + sc.ok + ' de ' + sc.total + ' pasos bien clasificados · cuello de botella ' + (sc.cuello ? '✓' : '✗') + '</div></div><ol>';
        pr.pasos.forEach(function (st, i) { var ok = prev.r[i] === st.a; h += '<li style="margin-bottom:8px">' + esc(st.t) + '<br><b>' + (ok ? '✓ ' : '✗ ') + OPS[st.a][0] + ' ' + OPS[st.a][1] + '</b>' + (i === pr.cuello ? ' · <b>⏳ cuello de botella</b>' : '') + '<br><small class="muted">' + esc(st.exp) + '</small></li>'; });
        h += '</ol>';
      } else h += '<div class="note ok">Misión enviada. El profesor revelará los puntajes cuando todos los equipos terminen.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      box.innerHTML = h;
      if ($('edit')) $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = JSON.parse(JSON.stringify(prev)); box.dataset.sig = ''; render(); };
      return;
    }
    if (rev) { box.innerHTML = head(a) + '<p class="q">La misión ya cerró.</p>'; return; }
    var v = borrador[key + ':v'] || { e: -1, p: -1, r: [], c: -1 }; borrador[key + ':v'] = v;
    function dibujar() {
      var pr = PR[v.p];
      var h = head(a) + '<p class="muted">' + esc(a.intro) + '</p><label class="f" for="pe">Tu equipo</label><select id="pe" class="input"><option value="-1">Elige el equipo</option>' + EQ.map(function (e, i) { return '<option value="' + i + '">' + esc(e) + '</option>'; }).join('') + '</select>' +
        '<label class="f" for="pp">Proceso que les asignaron</label><select id="pp" class="input"><option value="-1">Elige el proceso</option>' + PR.map(function (x, i) { return '<option value="' + i + '">' + esc(x.n) + '</option>'; }).join('') + '</select>';
      if (pr) {
        h += '<h2>¿Qué hacer con cada paso?</h2><p class="muted" style="font-size:.9rem">🤖 lo hace un robot · 🙋 lo sigue haciendo una persona · 🗑️ se elimina porque no agrega valor</p>' + pr.pasos.map(function (st, i) {
          return '<div class="item"><p><b>' + (i + 1) + '.</b> ' + esc(st.t) + ' <span class="pill">' + esc(st.d) + '</span></p><div class="seg" style="grid-template-columns:repeat(3,1fr)" data-k="' + i + '">' + OPS.map(function (o, j) { return '<button type="button" data-n="' + j + '" class="' + (v.r[i] === j ? 'sel' : '') + '">' + o[0] + ' ' + o[1] + '</button>'; }).join('') + '</div></div>';
        }).join('') + '<label class="f" for="pc">⏳ ¿Cuál paso es el cuello de botella?</label><select id="pc" class="input"><option value="-1">Elige el paso</option>' + pr.pasos.map(function (st, i) { return '<option value="' + i + '"' + (v.c === i ? ' selected' : '') + '>Paso ' + (i + 1) + ': ' + esc(st.t.slice(0, 55)) + (st.t.length > 55 ? '…' : '') + '</option>'; }).join('') + '</select>';
      }
      h += '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar misión</button></div>';
      box.innerHTML = h;
      $('pe').value = String(v.e); $('pp').value = String(v.p);
      $('pe').onchange = function () { v.e = +this.value; upd(); };
      $('pp').onchange = function () { var n = +this.value; if (n !== v.p) { v.p = n; v.r = []; v.c = -1; } dibujar(); };
      if ($('pc')) $('pc').onchange = function () { v.c = +this.value; upd(); };
      box.querySelectorAll('.seg').forEach(function (sg) { sg.onclick = function (ev) { var b = ev.target.closest('button'); if (!b) return; v.r[+sg.dataset.k] = +b.dataset.n; sg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('sel', x === b); }); upd(); }; });
      upd();
      $('go').onclick = function () { this.disabled = true; enviar(key, v).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
    }
    function upd() { var pr = PR[v.p]; $('go').disabled = !(v.e >= 0 && pr && pr.pasos.every(function (x, i) { return v.r[i] >= 0; }) && v.c >= 0); }
    dibujar();
  }

  /* ---- Misión de riesgos con Zero Trust (una tabla por equipo) ---- */
  function rRiesgos(a, box) {
    var key = A.clave(a), prev = local(key), EQ = A.clase.equipos || [], CT = a.controles || [], IMP = ['Alto', 'Medio', 'Bajo'];
    var rev = !!(estado && estado.revelar), alerta = !!(estado && estado.alerta);
    var banner = alerta ? '<div class="note bad" style="margin:10px 0"><b>🚨 ' + esc(a.alerta) + '</b><br>¿Qué control aplican de inmediato y qué harían en las próximas 24 horas?</div>' : '';
    if (prev && (rev || !borrador[key])) {
      var sc = A.puntosRiesgos(a, prev), h = head(a) + '<p class="q">' + esc(EQ[prev.e] || '') + '</p>';
      if (rev) {
        h += '<div class="center" style="margin:6px 0 12px"><div class="big">' + sc.pts + ' / ' + sc.max + ' pts</div><div class="muted">' + sc.filas + ' de 3 riesgos completos · alerta ' + (sc.alerta ? '✓' : '✗') + ' · ' + sc.bloq + ' de ' + a.fases.length + ' fases del ataque frenadas</div></div><h2>El ataque real a Digitech</h2><ol>';
        a.fases.forEach(function (f, i) { h += '<li style="margin-bottom:8px">' + esc(f.t) + '<br><b>' + (sc.fases[i] ? '🛡️ Su estrategia lo frenaba' : '✗ Pasó') + '</b><br><small class="muted">Lo frenaban: ' + f.b.map(function (c) { return esc(CT[c]); }).join(' · ') + '</small></li>'; });
        h += '</ol>';
      } else {
        h += banner + '<ul>' + (prev.f || []).filter(function (x) { return x.r; }).map(function (x) { return '<li>' + esc(x.r) + ' <b>(' + esc(IMP[x.i] || '') + ')</b> → ' + esc(CT[x.c] || '') + '</li>'; }).join('') + '</ul>' +
          (prev.ac >= 0 && prev.ax ? '<p>🚨 Respuesta a la alerta: <b>' + esc(CT[prev.ac]) + '</b>. ' + esc(prev.ax) + '</p>' : '') +
          '<div class="note ok">Tabla enviada.' + (alerta && !(prev.ac >= 0 && prev.ax) ? ' <b>Falta la respuesta a la alerta: toquen "Corregir" y agréguenla.</b>' : ' Prepárense para presentarla en 2 minutos.') + '</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      }
      box.innerHTML = h;
      if ($('edit')) $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = JSON.parse(JSON.stringify(prev)); box.dataset.sig = ''; render(); };
      return;
    }
    if (rev) { box.innerHTML = head(a) + '<p class="q">La misión ya cerró.</p>'; return; }
    var v = borrador[key + ':v'] || { e: -1, act: '', f: [0, 1, 2].map(function () { return { r: '', i: -1, c: -1, m: '' }; }), ac: -1, ax: '' }; borrador[key + ':v'] = v;
    function opts(sel) { return '<option value="-1">Elige el control…</option>' + CT.map(function (c, j) { return '<option value="' + j + '"' + (sel === j ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join(''); }
    var h = head(a) + '<p class="muted">' + esc(a.intro) + '</p>' + banner +
      '<label class="f" for="re">Tu equipo</label><select id="re" class="input"><option value="-1">Elige el equipo</option>' + EQ.map(function (e, i) { return '<option value="' + i + '">' + esc(e) + '</option>'; }).join('') + '</select>' +
      '<label class="f" for="ra">¿Qué activo de Digitech protegerían primero?</label><input id="ra" class="input" maxlength="80" placeholder="Ej.: la base de datos de clientes">' +
      v.f.map(function (x, i) {
        return '<h2>Riesgo ' + (i + 1) + '</h2><label class="f">Riesgo identificado</label><input class="input fr" data-i="' + i + '" maxlength="80" placeholder="Ej.: proveedores entran con una cuenta compartida">' +
          '<label class="f">Impacto potencial</label><div class="seg fi" style="grid-template-columns:repeat(3,1fr)" data-i="' + i + '">' + IMP.map(function (t, j) { return '<button type="button" data-n="' + j + '" class="' + (x.i === j ? 'sel' : '') + '">' + t + '</button>'; }).join('') + '</div>' +
          '<label class="f">Control Zero Trust</label><select class="input fc" data-i="' + i + '">' + opts(x.c) + '</select>' +
          '<label class="f">¿Cómo lo aplicarían?</label><input class="input fm" data-i="' + i + '" maxlength="120" placeholder="Una frase concreta">';
      }).join('') +
      (alerta ? '<h2>🚨 Respuesta a la alerta</h2><label class="f" for="rac">Control que aplican de inmediato</label><select id="rac" class="input">' + opts(v.ac) + '</select><label class="f" for="rax">¿Qué harían en las próximas 24 horas?</label><textarea id="rax" class="input" rows="3" maxlength="140"></textarea>' : '') +
      '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar tabla</button></div>';
    box.innerHTML = h;
    $('re').value = String(v.e); $('ra').value = v.act;
    box.querySelectorAll('.fr').forEach(function (el) { el.value = v.f[+el.dataset.i].r; });
    box.querySelectorAll('.fm').forEach(function (el) { el.value = v.f[+el.dataset.i].m; });
    if ($('rax')) $('rax').value = v.ax;
    function upd() {
      v.e = +$('re').value; v.act = $('ra').value;
      box.querySelectorAll('.fr').forEach(function (el) { v.f[+el.dataset.i].r = el.value; });
      box.querySelectorAll('.fm').forEach(function (el) { v.f[+el.dataset.i].m = el.value; });
      box.querySelectorAll('.fc').forEach(function (el) { v.f[+el.dataset.i].c = +el.value; });
      if ($('rac')) { v.ac = +$('rac').value; v.ax = $('rax').value; }
      var una = v.f.some(function (x) { return x.r.trim() && x.i >= 0 && x.c >= 0 && x.m.trim(); });
      $('go').disabled = !(v.e >= 0 && v.act.trim() && una);
      $('go').textContent = v.e < 0 ? 'Elige tu equipo' : (!v.act.trim() ? 'Escribe el activo a proteger' : (!una ? 'Completa al menos un riesgo' : 'Enviar tabla'));
    }
    box.querySelectorAll('input,select,textarea').forEach(function (el) { el.oninput = upd; el.onchange = upd; });
    box.querySelectorAll('.fi').forEach(function (sg) { sg.onclick = function (ev) { var b = ev.target.closest('button'); if (!b) return; v.f[+sg.dataset.i].i = +b.dataset.n; sg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('sel', x === b); }); upd(); }; });
    upd();
    $('go').onclick = function () {
      upd();
      var out = { e: v.e, act: v.act.trim().slice(0, 80), f: v.f.map(function (x) { return { r: x.r.trim().slice(0, 80), i: x.i, c: x.c, m: x.m.trim().slice(0, 120) }; }), ac: v.ac, ax: String(v.ax || '').trim().slice(0, 140) };
      this.disabled = true; enviar(key, out).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); });
    };
  }

  /* ---- Plan con presupuesto + simulacro de incidentes ---- */
  function rPresupuesto(a, box) {
    var key = A.clave(a), prev = local(key), EQ = A.clase.equipos || [], EL = a.elementos, CORTO = a.corto || EL, I = a.incidentes, TOT = a.total || 100, PASO = a.paso || 5;
    var n = (estado && estado.q) || 0;
    if (n > 0) {
      var eqAct = A.clase.actividades.filter(function (x) { return x.tipo === 'equipo'; })[0];
      var myE = prev ? prev.e : (eqAct ? local(A.clave(eqAct)) : null);
      var sc = prev ? A.puntosPresupuesto(a, prev, n) : null;
      var st = sc ? sc.inc.map(function (x) { return x.st; }) : (rank && rank.sim && rank.sim[a.id] && myE != null ? rank.sim[a.id][myE] : null);
      var ICON = ['💥 No lo contuvieron', '⚠️ Contención parcial', '🛡️ ¡Contenido!'];
      var h = head(a, 'Simulacro') + '<p class="q">Mes ' + Math.min(12, n * 2) + ' de 12' + (myE != null && EQ[myE] ? ' · ' + esc(EQ[myE]) : '') + '</p>';
      for (var i = n - 1; i >= 0; i--) {
        var it = I[i], s0 = st ? st[i] : null;
        h += '<div class="item" style="' + (i === n - 1 ? 'border-color:var(--red)' : 'opacity:.75') + '"><b>' + esc(it.t) + '</b><br><span class="muted">' + esc(it.d) + '</span>' +
          (s0 != null ? '<div class="note ' + (s0 === 2 ? 'ok' : 'bad') + '" style="margin-top:8px"><b>' + ICON[s0] + '</b></div>' : '') +
          '<small class="muted">Lo frenaba invertir en: ' + it.b.map(function (j) { return esc(CORTO[j]); }).join(' + ') + ' (' + (a.umbral || [10, 20])[1] + ' millones o más)</small></div>';
      }
      if (sc) h += '<div class="center" style="margin-top:10px"><div class="big">' + sc.pts + ' pts</div><div class="muted">Plan escrito: ' + sc.plan + ' · Incidentes contenidos: ' + sc.cont + ' de ' + n + '</div></div>';
      else if (st == null) h += '<p class="muted">Mira en la pantalla del profesor cómo le fue a tu equipo.</p>';
      box.innerHTML = h; return;
    }
    if (prev && !borrador[key]) {
      var h2 = head(a) + '<p class="q">' + esc(EQ[prev.e] || '') + ' · plan enviado</p><div class="pts">' + EL.map(function (o, i) { return '<div class="bar"><span class="lbl">' + esc(CORTO[i]) + '</span><span class="trk"><i style="width:' + (100 * (prev.b[i] || 0) / TOT) + '%"></i></span><span class="val">' + (prev.b[i] || 0) + '</span></div>'; }).join('') + '</div>' +
        '<div class="note ok">Plan enviado. Cuando empiece el simulacro, la app les mostrará qué incidentes contuvieron.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      box.innerHTML = h2;
      $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = JSON.parse(JSON.stringify(prev)); box.dataset.sig = ''; render(); };
      return;
    }
    var v = borrador[key + ':v'] || { e: -1, b: EL.map(function () { return 0; }), p: ['', '', ''], c: '', z: -1, zx: '' }; borrador[key + ':v'] = v;
    var POL = a.politicas || ['Accesos', 'Redes', 'Usuarios'], ZT = a.principios || [];
    var h3 = head(a) + '<p class="muted">' + esc(a.intro) + '</p>' +
      '<label class="f" for="pe">Tu equipo</label><select id="pe" class="input"><option value="-1">Elige el equipo</option>' + EQ.map(function (e, i) { return '<option value="' + i + '">' + esc(e) + '</option>'; }).join('') + '</select>' +
      '<h2>1. Presupuesto: ' + TOT + ' millones</h2><p class="muted" style="margin-top:-4px">Repártanlo entre los 8 elementos del plan, de ' + PASO + ' en ' + PASO + '.</p>' +
      EL.map(function (o, i) { return '<div class="row" style="display:flex;align-items:center;gap:8px;margin:6px 0"><span style="flex:1;min-width:0">' + esc(o) + '</span><button type="button" class="btn sec sm bm" data-i="' + i + '" aria-label="Quitar">−</button><b class="bv" data-i="' + i + '" style="width:42px;text-align:center">' + v.b[i] + '</b><button type="button" class="btn sec sm bp" data-i="' + i + '" aria-label="Agregar">+</button></div>'; }).join('') +
      '<div class="note" id="pleft" style="margin:8px 0"></div>' +
      '<h2>2. Políticas mínimas</h2>' + POL.map(function (t, i) { return '<label class="f" for="pp' + i + '">Política para proteger ' + esc(t.toLowerCase()) + '</label><input id="pp' + i + '" class="input pp" data-i="' + i + '" maxlength="120" placeholder="Una regla concreta">'; }).join('') +
      '<h2>3. Cultura</h2><label class="f" for="pc">Una estrategia para crear una cultura proactiva en ciberseguridad</label><textarea id="pc" class="input" rows="2" maxlength="140"></textarea>' +
      '<h2>4. Zero Trust</h2><label class="f" for="pz">Principio que aplicarían primero</label><select id="pz" class="input"><option value="-1">Elige el principio</option>' + ZT.map(function (t, i) { return '<option value="' + i + '">' + esc(t) + '</option>'; }).join('') + '</select>' +
      '<label class="f" for="pzx">¿Dónde y cómo lo aplicarían?</label><input id="pzx" class="input" maxlength="120" placeholder="Ej.: MFA para entrar al sistema central">' +
      '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar plan</button></div>';
    box.innerHTML = h3;
    $('pe').value = String(v.e); box.querySelectorAll('.pp').forEach(function (el) { el.value = v.p[+el.dataset.i]; }); $('pc').value = v.c; $('pz').value = String(v.z); $('pzx').value = v.zx;
    function sum() { return v.b.reduce(function (t, x) { return t + x; }, 0); }
    function upd() {
      v.e = +$('pe').value; box.querySelectorAll('.pp').forEach(function (el) { v.p[+el.dataset.i] = el.value; }); v.c = $('pc').value; v.z = +$('pz').value; v.zx = $('pzx').value;
      box.querySelectorAll('.bv').forEach(function (el) { el.textContent = v.b[+el.dataset.i]; });
      var left = TOT - sum(); $('pleft').innerHTML = left === 0 ? '✓ Presupuesto completo' : 'Les quedan <b>' + left + '</b> millones por asignar';
      $('pleft').className = 'note' + (left === 0 ? ' ok' : '');
      var okPol = v.p.every(function (x) { return x.trim(); });
      $('go').disabled = !(v.e >= 0 && left === 0 && okPol && v.c.trim() && v.z >= 0 && v.zx.trim());
      $('go').textContent = v.e < 0 ? 'Elige tu equipo' : (left !== 0 ? 'Asignen todo el presupuesto' : (!okPol ? 'Escriban las 3 políticas' : (!v.c.trim() ? 'Escriban la estrategia de cultura' : (v.z < 0 || !v.zx.trim() ? 'Completen Zero Trust' : 'Enviar plan'))));
    }
    box.querySelectorAll('.bm,.bp').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i, d = b.classList.contains('bp') ? PASO : -PASO; if (d > 0 && sum() + d > TOT) return; v.b[i] = Math.max(0, v.b[i] + d); upd(); }; });
    box.querySelectorAll('input,select,textarea').forEach(function (el) { el.oninput = upd; el.onchange = upd; });
    upd();
    $('go').onclick = function () {
      upd(); var out = { e: v.e, b: v.b.slice(), p: v.p.map(function (x) { return x.trim().slice(0, 120); }), c: v.c.trim().slice(0, 140), z: v.z, zx: v.zx.trim().slice(0, 120) };
      this.disabled = true; enviar(key, out).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); });
    };
  }

  /* ---- Rol dentro del equipo (individual) ---- */
  function rRol(a, box) {
    var key = A.clave(a), prev = local(key), R = a.roles || [];
    box.innerHTML = head(a) + '<p class="q">' + esc(a.intro) + '</p><div class="opts">' + R.map(function (r, i) { return '<button class="opt' + (prev === i ? ' sel' : '') + '" data-i="' + i + '"><span class="k">' + (i + 1) + '</span><span><b>' + esc(r.n) + '</b><br><small class="muted">' + esc(r.d) + '</small></span></button>'; }).join('') + '</div>' +
      (prev != null && R[prev] ? '<div class="note ok">Tu rol: <b>' + esc(R[prev].n) + '</b>. ' + esc(R[prev].tarea || '') + '</div>' : '');
    box.querySelectorAll('.opt').forEach(function (b) { b.onclick = function () { enviar(key, +b.dataset.i).then(function () { box.dataset.sig = ''; render(); }).catch(function (e) { errBox(box, e); }); }; });
  }
  function miEquipo() { var ea = A.clase.actividades.filter(function (x) { return x.tipo === 'equipo'; })[0]; var v = ea ? local(A.clave(ea)) : null; return v == null ? -1 : v; }
  function selEquipo(id, val) { var EQ = A.clase.equipos || []; return '<label class="f" for="' + id + '">Tu equipo</label><select id="' + id + '" class="input"><option value="-1">Elige el equipo</option>' + EQ.map(function (e, i) { return '<option value="' + i + '"' + (val === i ? ' selected' : '') + '>' + esc(e) + '</option>'; }).join('') + '</select>'; }

  /* ---- Reto por equipos: clasificar por consenso + escribir preguntas ---- */
  function rClasifica(a, box) {
    var key = A.clave(a), prev = local(key), EQ = A.clase.equipos || [], O = a.opciones, rev = !!(estado && estado.revelar);
    if (prev && (rev || !borrador[key])) {
      var sc = A.puntosClasifica(a, prev), h = head(a) + '<p class="q">' + esc(EQ[prev.e] || '') + '</p>';
      if (rev) {
        h += '<div class="center" style="margin:6px 0 12px"><div class="big">' + sc.pts + ' / ' + sc.max + ' pts</div><div class="muted">' + sc.ok + ' de ' + sc.total + ' escenarios bien clasificados · ' + sc.q + ' preguntas propias</div></div><ol>';
        a.items.forEach(function (it, i) { var ok = prev.r[i] === it.a; h += '<li style="margin-bottom:8px">' + esc(it.q) + '<br><b>' + (ok ? '✓ ' : '✗ ') + esc(O[it.a]) + '</b>' + (!ok && prev.r[i] >= 0 ? ' <small class="muted">(ustedes: ' + esc(O[prev.r[i]]) + ')</small>' : '') + '<br><small class="muted">' + esc(it.exp) + '</small></li>'; });
        h += '</ol>';
      } else h += '<div class="note ok">Respuesta del equipo enviada. El profesor revelará los resultados cuando todos terminen.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      box.innerHTML = h;
      if ($('edit')) $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = JSON.parse(JSON.stringify(prev)); box.dataset.sig = ''; render(); };
      return;
    }
    if (rev) { box.innerHTML = head(a) + '<p class="q">El reto ya cerró.</p>'; return; }
    var v = borrador[key + ':v'] || { e: miEquipo(), r: a.items.map(function () { return -1; }), q: (a.preguntas || []).map(function () { return ''; }) }; borrador[key + ':v'] = v;
    var h2 = head(a) + '<p class="muted">' + esc(a.intro) + '</p>' + selEquipo('ce', v.e) + '<h2>Parte A · Clasifiquen por consenso</h2>' +
      a.items.map(function (it, i) { return '<div class="item"><p><b>' + (i + 1) + '.</b> ' + esc(it.q) + '</p><div class="seg" style="grid-template-columns:repeat(2,1fr)" data-k="' + i + '">' + O.map(function (o, j) { return '<button type="button" data-n="' + j + '" class="' + (v.r[i] === j ? 'sel' : '') + '">' + esc(o) + '</button>'; }).join('') + '</div></div>'; }).join('') +
      '<h2>Parte B · Las preguntas de su empresa</h2><p class="muted" style="margin-top:-4px">' + esc(a.introB || '') + '</p>' +
      (a.preguntas || []).map(function (p, i) { return '<label class="f" for="cq' + i + '">' + esc(p.l) + '</label><input id="cq' + i + '" class="input cq" data-i="' + i + '" maxlength="140" placeholder="' + esc(p.ph) + '">'; }).join('') +
      '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar respuesta del equipo</button></div>';
    box.innerHTML = h2;
    box.querySelectorAll('.cq').forEach(function (el) { el.value = v.q[+el.dataset.i]; });
    function upd() {
      v.e = +$('ce').value; box.querySelectorAll('.cq').forEach(function (el) { v.q[+el.dataset.i] = el.value; });
      var falt = v.r.filter(function (x) { return x < 0; }).length;
      $('go').disabled = !(v.e >= 0 && falt === 0);
      $('go').textContent = v.e < 0 ? 'Elige tu equipo' : (falt ? 'Faltan ' + falt + ' escenarios por clasificar' : 'Enviar respuesta del equipo');
    }
    box.querySelectorAll('.seg').forEach(function (sg) { sg.onclick = function (ev) { var b = ev.target.closest('button'); if (!b) return; v.r[+sg.dataset.k] = +b.dataset.n; sg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('sel', x === b); }); upd(); }; });
    box.querySelectorAll('input,select').forEach(function (el) { el.oninput = upd; el.onchange = upd; });
    upd();
    $('go').onclick = function () { upd(); var out = { e: v.e, r: v.r.slice(), q: v.q.map(function (x) { return x.trim().slice(0, 140); }) }; this.disabled = true; enviar(key, out).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
  }

  /* ---- Canvas por equipos ---- */
  function rCanvas(a, box) {
    var key = A.clave(a), prev = local(key), EQ = A.clase.equipos || [], F = a.campos, N = a.niveles || [], R = a.roles || [];
    if (prev && !borrador[key]) {
      var sc = A.puntosCanvas(a, prev), h = head(a) + '<p class="q">' + esc(EQ[prev.e] || '') + ' · canvas enviado</p>' +
        F.map(function (f, i) { return '<div class="item"><small class="muted">' + esc(f.l) + '</small><br>' + (prev.f[i] ? esc(prev.f[i]) : '<span class="muted">—</span>') + '</div>'; }).join('') +
        '<div class="item"><small class="muted">' + esc(a.nivelCorto || 'Tipo de analítica') + '</small><br><b>' + esc(N[prev.n] || '—') + '</b></div>' +
        '<div class="note ok">Canvas enviado (' + sc.n + ' de ' + sc.total + ' campos). Pueden corregirlo hasta el pitch.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      box.innerHTML = h;
      $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = JSON.parse(JSON.stringify(prev)); box.dataset.sig = ''; render(); };
      return;
    }
    var v = borrador[key + ':v'] || { e: miEquipo(), f: F.map(function () { return ''; }), n: -1 }; borrador[key + ':v'] = v;
    var grupo = null, h2 = head(a) + '<p class="muted">' + esc(a.intro) + '</p>' + selEquipo('ve', v.e);
    F.forEach(function (f, i) {
      if (f.rol !== grupo) { grupo = f.rol; h2 += '<h2>' + esc(R[f.rol] ? R[f.rol].n : '') + '</h2>'; }
      h2 += '<label class="f" for="vf' + i + '">' + esc(f.l) + '</label><textarea id="vf' + i + '" class="input vf" data-i="' + i + '" rows="2" maxlength="' + (f.max || 160) + '" placeholder="' + esc(f.ph || '') + '"></textarea>';
      if (f.nivelDespues) h2 += '<label class="f" for="vn">' + esc(a.nivelLabel || 'Nivel de analítica') + '</label><select id="vn" class="input"><option value="-1">Elige el nivel</option>' + N.map(function (t, j) { return '<option value="' + j + '"' + (v.n === j ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>';
    });
    h2 += '<div class="sticky"><button class="btn" id="go" style="width:100%">Enviar canvas del equipo</button></div>';
    box.innerHTML = h2;
    box.querySelectorAll('.vf').forEach(function (el) { el.value = v.f[+el.dataset.i]; });
    function upd() {
      v.e = +$('ve').value; box.querySelectorAll('.vf').forEach(function (el) { v.f[+el.dataset.i] = el.value; }); if ($('vn')) v.n = +$('vn').value;
      var n = v.f.filter(function (x) { return x.trim(); }).length;
      $('go').disabled = !(v.e >= 0 && n >= 1);
      $('go').textContent = v.e < 0 ? 'Elige tu equipo' : (n === 0 ? 'Escriban al menos un campo' : 'Enviar canvas (' + n + ' de ' + F.length + ' campos)');
    }
    box.querySelectorAll('textarea,select').forEach(function (el) { el.oninput = upd; el.onchange = upd; });
    upd();
    $('go').onclick = function () { upd(); var out = { e: v.e, f: v.f.map(function (x, i) { return x.trim().slice(0, F[i].max || 160); }), n: v.n }; this.disabled = true; enviar(key, out).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); }); };
  }

  /* ---- Voto de pares: no se puede votar por el propio equipo ---- */
  function rVoto(a, box) {
    var key = A.clave(a), prev = local(key), EQ = A.clase.equipos || [], mine = miEquipo();
    box.innerHTML = head(a) + '<p class="q">' + esc(a.pregunta) + '</p>' + (a.ayuda ? '<p class="muted">' + esc(a.ayuda) + '</p>' : '') + '<div class="opts">' + EQ.map(function (e, i) { var own = i === mine; return '<button class="opt' + (prev === i ? ' sel' : '') + '" data-i="' + i + '"' + (own ? ' disabled style="opacity:.45"' : '') + '><span class="k">' + (i + 1) + '</span><span>' + esc(e) + (own ? ' <small>(tu equipo)</small>' : '') + '</span></button>'; }).join('') + '</div>' +
      (prev != null ? '<div class="note ok">Votaste por <b>' + esc(EQ[prev]) + '</b>. Puedes cambiar tu voto mientras la votación esté abierta.</div>' : '') + (mine < 0 ? '<p class="muted">Si no elegiste equipo al inicio, vota por la propuesta que más te convenció, sin contar la tuya.</p>' : '');
    box.querySelectorAll('.opt:not([disabled])').forEach(function (b) { b.onclick = function () { enviar(key, +b.dataset.i).then(function () { box.dataset.sig = ''; render(); }).catch(function (e) { errBox(box, e); }); }; });
  }

  function rMibot(a, box) {
    var key = A.clave(a), prev = local(key);
    if (prev && !borrador[key]) {
      var hm = A.horasMes(prev), h = head(a, 'Tu bot') + '<p class="q">' + esc(prev.t) + '</p><div class="center" style="margin:6px 0 14px"><div class="muted">Tiempo que liberarías</div><div class="big">' + hm.toFixed(1).replace('.', ',') + ' h/mes</div><div class="muted">≈ ' + Math.round(hm * 12) + ' horas al año</div></div><h2>Tu proceso TO-BE</h2><ol>';
      prev.s.forEach(function (st) { h += '<li>' + (st.r ? '🤖 <b>Robot:</b> ' : '🙋 ') + esc(st.x) + '</li>'; });
      box.innerHTML = h + '</ol><div class="note ok">Enviado. Ya sumaste tus horas al contador del grupo.</div><div style="margin-top:12px"><button class="btn sec sm" id="edit">Corregir</button></div>';
      $('edit').onclick = function () { borrador[key] = 1; borrador[key + ':v'] = JSON.parse(JSON.stringify(prev)); box.dataset.sig = ''; render(); };
      return;
    }
    var v = borrador[key + ':v'] || { t: '', s: [{ x: '', r: false }, { x: '', r: false }, { x: '', r: false }, { x: '', r: false }], f: '', a: '', b: '' }; borrador[key + ':v'] = v;
    function dibujar() {
      var h = head(a) + '<p class="muted">' + esc(a.intro) + '</p><label class="f" for="mt">1. ¿Cuál es la tarea?</label><input id="mt" class="input" maxlength="70" placeholder="Ej.: consolidar el reporte semanal de ventas">' +
        '<label class="f">2. Escríbela paso a paso y marca con 🤖 los pasos que haría un robot</label>' +
        v.s.map(function (st, i) { return '<div class="row" style="margin-bottom:8px;flex-wrap:nowrap"><span style="font-weight:800;width:22px">' + (i + 1) + '.</span><input class="input sx" data-i="' + i + '" maxlength="90" style="flex:1;min-width:0" placeholder="Paso ' + (i + 1) + '"><button type="button" class="btn sm ' + (st.r ? '' : 'sec') + ' sr" data-i="' + i + '" style="min-width:64px" aria-pressed="' + st.r + '">' + (st.r ? '🤖' : '🙋') + '</button></div>'; }).join('') +
        (v.s.length < 10 ? '<button type="button" class="btn sec sm" id="madd">+ Agregar paso</button>' : '') +
        '<label class="f">3. ¿Cuánto tiempo toma?</label><div class="pts">' +
        '<div class="pt"><span>Veces por semana</span><input id="mf" class="input" inputmode="decimal" style="width:90px;min-height:40px;text-align:center"></div>' +
        '<div class="pt"><span>Minutos cada vez, hoy</span><input id="ma" class="input" inputmode="decimal" style="width:90px;min-height:40px;text-align:center"></div>' +
        '<div class="pt"><span>Minutos cada vez, con el robot</span><input id="mb" class="input" inputmode="decimal" style="width:90px;min-height:40px;text-align:center"></div></div>' +
        '<div class="note" id="mcalc"></div><div class="sticky"><button class="btn" id="go" style="width:100%">Enviar mi bot</button></div>';
      box.innerHTML = h;
      $('mt').value = v.t; $('mf').value = v.f; $('ma').value = v.a; $('mb').value = v.b;
      box.querySelectorAll('.sx').forEach(function (inp) { inp.value = v.s[+inp.dataset.i].x; inp.oninput = function () { v.s[+inp.dataset.i].x = inp.value; upd(); }; });
      box.querySelectorAll('.sr').forEach(function (b) { b.onclick = function () { var st = v.s[+b.dataset.i]; st.r = !st.r; b.textContent = st.r ? '🤖' : '🙋'; b.classList.toggle('sec', !st.r); b.setAttribute('aria-pressed', st.r); upd(); }; });
      if ($('madd')) $('madd').onclick = function () { v.s.push({ x: '', r: false }); dibujar(); };
      ['mt', 'mf', 'ma', 'mb'].forEach(function (id) { $(id).oninput = upd; });
      upd();
      $('go').onclick = function () {
        var out = { t: v.t.trim().slice(0, 70), s: v.s.filter(function (st) { return st.x.trim(); }).map(function (st) { return { x: st.x.trim().slice(0, 90), r: !!st.r }; }), f: num(v.f), a: num(v.a), b: num(v.b) };
        this.disabled = true; enviar(key, out).then(function () { delete borrador[key]; box.dataset.sig = ''; render(); }).catch(function (e) { $('go').disabled = false; errBox(box, e); });
      };
    }
    function num(x) { return +String(x).replace(',', '.'); }
    function upd() {
      v.t = $('mt').value; v.f = $('mf').value; v.a = $('ma').value; v.b = $('mb').value;
      var f = num(v.f), aa = num(v.a), bb = num(v.b), llenos = v.s.filter(function (st) { return st.x.trim(); }), robots = llenos.filter(function (st) { return st.r; }).length;
      var ok = v.t.trim() && llenos.length >= 3 && robots >= 1 && f > 0 && aa > 0 && bb >= 0 && bb < aa;
      var hm = ok ? A.horasMes({ f: f, a: aa, b: bb }) : 0;
      $('mcalc').innerHTML = ok ? 'Liberarías <b>' + hm.toFixed(1).replace('.', ',') + ' horas al mes</b> (≈ ' + Math.round(hm * 12) + ' al año).' : 'Necesitas al menos 3 pasos, 1 paso con 🤖 y que el tiempo con el robot sea menor que el de hoy.';
      $('go').disabled = !ok;
    }
    dibujar();
  }
})();
