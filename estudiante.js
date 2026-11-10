(function () {
  var A = APP, DB = A.DB, esc = A.esc, $ = function (id) { return document.getElementById(id); };
  var estado = null, aliasName = A.store('alias:' + A.SALA) || '', borrador = {};
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
    var a = estado && estado.act ? A.act(estado.act) : null;
    if (!a) { show('s-espera'); return; }
    var box = $('s-act'); show('s-act');
    var f = { texto: rTexto, quiz: rQuiz, encuesta: rQuiz, escala: rEscala, puntos: rPuntos, multi: rMulti, adkar: rAdkar, comite: rComite, reparto: rReparto, consultoria: rConsultoria }[a.tipo];
    var sig = a.id + '|' + (estado.q || 0) + '|' + (!!estado.revelar) + '|' + gen(A.clave(a, estado.q || 0));
    if (box.dataset.sig === sig) return;
    var keepScroll = box.dataset.act === a.id && (a.tipo === 'escala' || a.tipo === 'comite' || a.tipo === 'consultoria' || a.tipo === 'reparto');
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
    var html = head(a, 'Tu resultado') + '<div class="center" style="margin:10px 0 16px"><div class="muted">Madurez digital de tu organización</div><div class="big">' + g.toFixed(1) + ' / 5</div><div class="pill" style="margin-top:6px">' + A.nivel(g) + '</div></div><div class="bars">';
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
})();
