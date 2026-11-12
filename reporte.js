/* Reportes descargables, armados según el tipo de cada actividad de la clase:
   - del grupo: anónimo y agregado (promedios y porcentajes, sin nombres)
   - personal: se arma en el celular de cada estudiante con sus propias respuestas */
(function () {
  var A = window.APP, C = A.clase;
  function esc(s) { return A.esc(s); }
  function num(x, d) { return (+x || 0).toFixed(d == null ? 1 : d).replace('.', ','); }
  function pct(n, d) { return d ? Math.round(100 * n / d) : 0; }
  function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function maxi(a) { return a.reduce(function (bi, x, i, arr) { return x > arr[bi] ? i : bi; }, 0); }
  function mini(a) { return a.reduce(function (bi, x, i, arr) { return x < arr[bi] ? i : bi; }, 0); }
  function vals(resp, key) { var o = (resp || {})[key] || {}; return Object.keys(o).map(function (u) { return o[u] && o[u].v; }).filter(function (v) { return v != null; }); }
  function fecha() { try { return new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return new Date().toISOString().slice(0, 10); } }

  var CSS = 'body{font-family:Archivo,"Segoe UI",Roboto,Arial,sans-serif;color:#161616;background:#fff;margin:0;line-height:1.45}' +
    '.w{max-width:860px;margin:0 auto;padding:28px 22px 50px}' +
    'header{border-bottom:4px solid #F2B705;padding-bottom:14px;margin-bottom:8px}' +
    '.ey{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1565B0}' +
    'h1{font-size:28px;line-height:1.15;margin:6px 0}h2{font-size:19px;margin:28px 0 8px;padding-top:6px;border-top:1px solid #e3e3dc}h3{font-size:15px;margin:14px 0 6px}' +
    '.mu{color:#5f5f58;font-size:13px}.kpi{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.kpi div{background:#f6f6f2;border:1px solid #e3e3dc;border-radius:10px;padding:10px 14px}.kpi b{display:block;font-size:22px}' +
    '.b{display:grid;grid-template-columns:220px 1fr 64px;gap:10px;align-items:center;margin:6px 0;font-size:14px}' +
    '.t{height:12px;background:#f1f1ec;border:1px solid #e3e3dc;border-radius:7px;overflow:hidden}.t i{display:block;height:100%;background:#1565B0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.t i.g{background:#9a9a92}.t i.y{background:#F2B705}.t i.r{background:#B83A2B}.t i.k{background:#2E7D4F}.v{text-align:right;font-weight:800}' +
    '.box{background:#fff4d2;border-radius:10px;padding:12px 14px;margin:10px 0;font-size:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.box.b2{background:#e7f0fa}' +
    'table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}th,td{text-align:left;border-bottom:1px solid #e3e3dc;padding:7px 6px;vertical-align:top}th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#5f5f58}' +
    'ul,ol{padding-left:20px}li{margin:4px 0}.lg{font-size:12px;color:#5f5f58}.lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 10px;vertical-align:-1px}' +
    '.ok{color:#2E7D4F;font-weight:700}.no{color:#B83A2B;font-weight:700}footer{margin-top:30px;border-top:1px solid #e3e3dc;padding-top:10px;font-size:12px;color:#5f5f58}' +
    '@media(max-width:600px){.b{grid-template-columns:110px 1fr 52px}h1{font-size:23px}}@media print{h2{break-after:avoid}.b,.box,tr{break-inside:avoid}}';

  function doc(title, body) { return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><style>' + CSS + '</style></head><body><div class="w">' + body + '</div></body></html>'; }
  function bar(l, v, max, cls, txt) { return '<div class="b"><span>' + esc(l) + '</span><span class="t"><i class="' + (cls || '') + '" style="width:' + Math.max(0, Math.min(100, max ? v / max * 100 : 0)) + '%"></i></span><span class="v">' + (txt != null ? txt : num(v)) + '</span></div>'; }
  function dbl(l, a, b, max, txt) { return '<div class="b"><span>' + esc(l) + '</span><span><span class="t" style="display:block;margin-bottom:3px"><i class="g" style="width:' + (a / max * 100) + '%"></i></span><span class="t" style="display:block"><i style="width:' + (b / max * 100) + '%"></i></span></span><span class="v">' + txt + '</span></div>'; }
  function cab(t, sub) { return '<header><div class="ey">Universidad Sergio Arboleda · Colsubsidio</div><h1>' + esc(t) + '</h1><div class="mu">' + esc(C.titulo) + ' · ' + fecha() + (sub ? ' · ' + esc(sub) : '') + '</div></header>'; }
  function uso() {
    var u = (C.reporte && C.reporte.uso) || [];
    return u.length ? '<h2>Cómo usar este reporte en tu organización</h2><ol>' + u.map(function (x) { return '<li><b>' + esc(x[0]) + '</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ol>' : '';
  }
  function pie() { return '<footer>Diplomado en Estrategia y Dirección de la Transformación Digital · Universidad Sergio Arboleda · Colsubsidio.' + (C.reporte && C.reporte.fuentes ? ' Fuentes: ' + esc(C.reporte.fuentes) : '') + '</footer>'; }

  /* ---------- Agregados por actividad (también se publican para los celulares) ---------- */
  function resumen(resp) {
    var R = { t: Date.now() };
    C.actividades.forEach(function (a) {
      var v = vals(resp, a.id);
      if (a.tipo === 'escala' && v.length) {
        var ps = v.map(function (x) { return A.promedios(a, x); }), niv = { 'Inicial': 0, 'En desarrollo': 0, 'Avanzado': 0, 'Líder': 0 };
        ps.forEach(function (p) { niv[A.nivel(avg(p))]++; });
        R[a.id] = { n: v.length, prom: a.grupos.map(function (g, i) { return +avg(ps.map(function (p) { return p[i]; })).toFixed(2); }), nivel: niv };
      } else if (a.tipo === 'puntos' && v.length) {
        R[a.id] = { n: v.length, prom: [0, 1].map(function (p) { return a.tipos.map(function (t, k) { return +avg(v.map(function (x) { return +x[p][k] || 0; })).toFixed(1); }); }) };
      } else if (a.tipo === 'multi' && v.length) {
        R[a.id] = { n: v.length, pct: a.opciones.map(function (o, i) { return pct(v.filter(function (x) { return (x || []).indexOf(i) >= 0; }).length, v.length); }) };
      } else if (a.tipo === 'adkar' && v.length) {
        var bl = [0, 0, 0, 0, 0, 0]; v.forEach(function (x) { var b = A.bloqueo(x.s); bl[b < 0 ? 5 : b]++; });
        R[a.id] = { n: v.length, bloqueo: bl, prom: [0, 1, 2, 3, 4].map(function (i) { return +avg(v.map(function (x) { return +x.s[i] || 0; })).toFixed(2); }) };
      } else if (a.tipo === 'reparto' && v.length) {
        R[a.id] = { n: v.length, prom: a.opciones.map(function (o, i) { return +avg(v.map(function (x) { return +(x || [])[i] || 0; })).toFixed(1); }) };
      } else if ((a.tipo === 'quiz' || a.tipo === 'encuesta') && a.items) {
        var dist = a.items.map(function (it, i) { var vv = vals(resp, a.id + '_' + i); return a.opciones.map(function (o, k) { return vv.filter(function (x) { return x === k; }).length; }); });
        if (dist.some(function (d) { return d.some(Boolean); })) R[a.id] = { dist: dist };
      }
    });
    return R;
  }

  function tablaQuiz(a, resp, mine, R) {
    var h = '<p class="mu">' + esc(a.intro || '') + '</p><table><thead><tr><th>Caso</th><th>Respuesta</th><th>Por qué</th><th>' + (mine ? 'Tú' : 'Aciertos del grupo') + '</th></tr></thead><tbody>';
    a.items.forEach(function (it, i) {
      var col;
      if (mine) { var m = mine[a.id + '_' + i]; col = m == null ? '<span class="mu">—</span>' : (m === it.a ? '<span class="ok">✓</span>' : '<span class="no">' + esc(a.opciones[m]) + '</span>'); }
      else { var vv = vals(resp, a.id + '_' + i); col = vv.length ? pct(vv.filter(function (v) { return v === it.a; }).length, vv.length) + ' %' : '—'; }
      h += '<tr><td>' + esc(it.q) + '</td><td><b>' + esc(a.opciones[it.a]) + '</b></td><td>' + esc(it.exp) + '</td><td>' + col + '</td></tr>';
    });
    return h + '</tbody></table>';
  }
  function tablaEncuesta(a, resp, mine, R) {
    var h = '<p class="mu">' + esc(a.intro || '') + '</p><table><thead><tr><th>Caso</th>' + (mine ? '<th>Tú</th>' : '') + '<th>Lo que votó el grupo</th><th>Lectura sugerida</th></tr></thead><tbody>';
    a.items.forEach(function (it, i) {
      var d = resp ? a.opciones.map(function (o, k) { return vals(resp, a.id + '_' + i).filter(function (x) { return x === k; }).length; }) : (R && R[a.id] ? R[a.id].dist[i] : null);
      var n = d ? d.reduce(function (s, x) { return s + x; }, 0) : 0;
      var m = mine ? mine[a.id + '_' + i] : null;
      h += '<tr><td><b>' + esc(it.q) + '</b></td>' + (mine ? '<td>' + (m != null ? esc(a.opciones[m]) : '—') + '</td>' : '') + '<td>' + (n ? a.opciones.map(function (o, k) { return esc(o) + ': ' + pct(d[k], n) + ' %'; }).join('<br>') : '—') + '</td><td>' + esc(it.nota || '') + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  /* ---------- Reporte del grupo ---------- */
  function grupo(resp, alias) {
    var R = resumen(resp), nP = Object.keys(alias || {}).length, sec = 0, h = cab('Reporte de la clase');
    h += '<div class="kpi"><div><b>' + nP + '</b>participantes</div></div>';
    h += '<div class="box b2">Este reporte es <b>anónimo y agregado</b>: muestra promedios y porcentajes del grupo, sin nombres ni respuestas individuales. Cada participante puede descargar su reporte personal desde su celular.</div>';
    C.actividades.forEach(function (a) {
      var v = vals(resp, a.id), body = '';
      if (a.tipo === 'texto' && v.length) {
        if (a.vista === 'nube') {
          var c = {}; v.forEach(function (x) { var k = String(x).trim().toLowerCase(); c[k] = (c[k] || 0) + 1; });
          body = '<p>' + Object.keys(c).sort(function (x, y) { return c[y] - c[x]; }).slice(0, 15).map(function (k) { return '<b>' + esc(k) + '</b>' + (c[k] > 1 ? ' (' + c[k] + ')' : ''); }).join(' · ') + '</p>';
        } else body = '<p class="mu">Sin nombres.</p><ul>' + v.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      } else if (a.tipo === 'quiz') body = tablaQuiz(a, resp);
      else if (a.tipo === 'encuesta') body = tablaEncuesta(a, resp);
      else if (a.tipo === 'escala' && R[a.id]) {
        var E = R[a.id], lo = mini(E.prom), hi = maxi(E.prom);
        body = '<p class="mu">' + E.n + ' respuestas · escala de 1 a 5 · promedio general ' + num(avg(E.prom)) + '</p>' + a.grupos.map(function (g, i) { return bar(g.k, E.prom[i], 5, i === lo ? 'y' : (i === hi ? 'k' : '')); }).join('') +
          '<h3>¿En qué nivel están las organizaciones?</h3>' + Object.keys(E.nivel).map(function (k) { return bar(k, E.nivel[k], E.n, 'g', E.nivel[k]); }).join('') +
          '<div class="box">La dimensión más débil del grupo es <b>' + esc(a.grupos[lo].k) + '</b> (' + num(E.prom[lo]) + ').' + (a.reco && a.reco[a.grupos[lo].k] ? ' Recomendación: ' + esc(a.reco[a.grupos[lo].k]) : '') + '</div>';
      } else if (a.tipo === 'puntos' && R[a.id]) {
        var P = R[a.id].prom, gap = P[1].map(function (x, i) { return x - P[0][i]; }), up = maxi(gap), dn = mini(gap);
        body = '<p class="lg"><i style="background:#9a9a92"></i>' + esc(a.partes[0]) + '<i style="background:#1565B0"></i>' + esc(a.partes[1]) + ' · ' + R[a.id].n + ' respuestas · promedio de 100 puntos</p>' + a.tipos.map(function (t, i) { return dbl(t, P[0][i], P[1][i], 100, (gap[i] >= 0 ? '+' : '') + num(gap[i], 0)); }).join('') +
          '<div class="box">El grupo quiere más <b>' + esc(a.tipos[up]) + '</b>' + (a.desc && a.desc[a.tipos[up]] ? ' (' + esc(a.desc[a.tipos[up]]) + ')' : '') + ' y menos <b>' + esc(a.tipos[dn]) + '</b>.</div>';
      } else if (a.tipo === 'multi' && R[a.id]) {
        var M = R[a.id].pct, idx = a.opciones.map(function (o, i) { return i; }).sort(function (x, y) { return M[y] - M[x]; });
        body = '<p class="mu">% de participantes que marcaron cada opción · ' + R[a.id].n + ' respuestas</p>' + idx.map(function (i, k) { return bar(a.opciones[i], M[i], 100, k < 3 ? (a.color ? '' : 'r') : 'g', M[i] + ' %'); }).join('');
      } else if (a.tipo === 'adkar' && R[a.id]) {
        var D = R[a.id], mx = maxi(D.bloqueo.slice(0, 5));
        body = '<p class="mu">Punto de bloqueo: el primer elemento calificado con 3 o menos · ' + D.n + ' cambios diagnosticados</p>' + a.etapas.map(function (e, i) { return bar(e.k, D.bloqueo[i], D.n, i === mx ? 'r' : 'g', D.bloqueo[i]); }).join('') + bar('Sin bloqueo', D.bloqueo[5], D.n, 'k', D.bloqueo[5]) +
          '<h3>Qué hacer en cada etapa</h3><ul>' + a.etapas.map(function (e, i) { return '<li><b>' + esc(e.k) + ':</b> ' + esc(a.accion[i]) + '</li>'; }).join('') + '</ul>';
      } else if (a.tipo === 'comite' && v.length) {
        body = '<table><thead><tr><th>Comité</th><th>Presupuesto (' + a.dimensiones.map(function (d) { return d.slice(0, 4) + '.'; }).join(' / ') + ')</th><th>Bloqueo</th><th>Estrategias</th><th>Acción de 90 días</th></tr></thead><tbody>' +
          v.sort(function (x, y) { return String(x.n).localeCompare(String(y.n), 'es', { numeric: true }); }).map(function (x) { return '<tr><td><b>' + esc(x.n) + '</b></td><td>' + (x.p || []).join(' / ') + '</td><td>' + esc(a.etapas[x.e] || '') + '</td><td>' + (x.s || []).map(function (i) { return esc(a.estrategias[i]); }).join('<br>') + '</td><td>' + esc(x.x) + '</td></tr>'; }).join('') + '</tbody></table>';
      } else if (a.tipo === 'reparto' && R[a.id]) {
        var Q = R[a.id].prom, ix = a.opciones.map(function (o, i) { return i; }).sort(function (x, y) { return Q[y] - Q[x]; });
        body = '<p class="mu">Promedio de puntos por persona · ' + R[a.id].n + ' respuestas</p>' + ix.map(function (i, k) { return bar(a.opciones[i], Q[i], 100, k === 0 ? 'k' : '', num(Q[i], 0)); }).join('');
      } else if (a.tipo === 'pasos' && v.length) {
        var EQ = C.equipos || [], PR = C.procesos || [], OPS = ['Robot', 'Persona', 'Eliminar'];
        body = '<table><thead><tr><th>Equipo</th><th>Proceso</th><th>Pasos bien clasificados</th><th>Cuello de botella</th><th>Puntos</th></tr></thead><tbody>' + v.map(function (x) { var sc = A.puntosPasos(x); return { x: x, sc: sc }; }).sort(function (p, q) { return q.sc.pts - p.sc.pts; }).map(function (o) { return '<tr><td><b>' + esc(EQ[o.x.e] || '') + '</b></td><td>' + esc((PR[o.x.p] || {}).n || '') + '</td><td>' + o.sc.ok + ' / ' + o.sc.total + '</td><td>' + (o.sc.cuello ? '<span class="ok">✓</span>' : '<span class="no">✗</span>') + '</td><td><b>' + o.sc.pts + '</b></td></tr>'; }).join('') + '</tbody></table>' +
          PR.map(function (pr) { return '<h3>Clave: ' + esc(pr.n) + '</h3><table><tbody>' + pr.pasos.map(function (st, i) { return '<tr><td>' + (i + 1) + '. ' + esc(st.t) + (i === pr.cuello ? ' <b>(cuello de botella)</b>' : '') + '</td><td style="width:90px"><b>' + OPS[st.a] + '</b></td><td>' + esc(st.exp) + '</td></tr>'; }).join('') + '</tbody></table>'; }).join('');
      } else if (a.tipo === 'mibot' && v.length) {
        var tot = v.reduce(function (s0, x) { return s0 + A.horasMes(x); }, 0);
        body = '<div class="kpi"><div><b>' + num(tot, 0) + ' h/mes</b>liberadas entre todos</div><div><b>' + Math.round(tot * 12) + ' h</b>al año</div><div><b>' + v.length + '</b>tareas analizadas</div></div><p class="mu">Sin nombres.</p><table><thead><tr><th>Tarea</th><th>Pasos para el robot</th><th>Horas al mes</th></tr></thead><tbody>' +
          v.slice().sort(function (p, q) { return A.horasMes(q) - A.horasMes(p); }).map(function (x) { var st = x.s || []; return '<tr><td>' + esc(x.t) + '</td><td>' + st.filter(function (y) { return y.r; }).length + ' de ' + st.length + '</td><td>' + num(A.horasMes(x)) + '</td></tr>'; }).join('') + '</tbody></table>';
      } else if (a.tipo === 'consultoria' && v.length) {
        body = consultoriaTabla(v);
      }
      if (body) h += '<h2>' + (++sec) + '. ' + esc(a.titulo) + '</h2>' + body;
    });
    if (C.empresas && C.actividades.some(function (a) { return a.tipo === 'consultoria'; })) h += claveEmpresas();
    return doc('Reporte de la clase', h + uso() + pie());
  }

  function consultoriaTabla(v) {
    var E = C.empresas || [], T = C.tecnologias || [];
    return '<table><thead><tr><th>Equipo</th><th>Empresa</th><th>Tecnología elegida por reto</th><th>Piloto, riesgo y métrica</th></tr></thead><tbody>' + v.map(function (x) {
      var em = E[x.emp] || { n: '', retos: [] };
      return '<tr><td><b>' + esc(x.n) + '</b></td><td>' + esc(em.n) + '</td><td>' + em.retos.map(function (r, i) { var ok = x.r[i] === r.a; return (i + 1) + '. ' + esc(T[x.r[i]] || '—') + (ok ? ' <span class="ok">✓</span>' : ' <span class="mu">(sugerida: ' + esc(T[r.a]) + ')</span>'); }).join('<br>') + '</td><td><b>Piloto:</b> ' + esc((em.retos[x.p] || {}).t || '') + '<br><b>Riesgo:</b> ' + esc(x.k) + '<br><b>Métrica:</b> ' + esc(x.m) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function claveEmpresas() {
    var E = C.empresas || [], T = C.tecnologias || [];
    return '<h2>Clave del taller: tecnología sugerida para cada reto</h2>' + E.map(function (e) {
      return '<h3>' + esc(e.n) + ' · ' + esc(e.sector) + '</h3><table><tbody>' + e.retos.map(function (r) { return '<tr><td>' + esc(r.t) + '</td><td style="width:130px"><b>' + esc(T[r.a]) + '</b></td><td>' + esc(r.exp) + '</td></tr>'; }).join('') + '</tbody></table><div class="box">Riesgo a cuidar: ' + esc(e.riesgo) + '</div>';
    }).join('');
  }

  /* ---------- Reporte personal ---------- */
  function personal(nombre, mine, R) {
    R = R || {};
    var h = cab('Mi reporte: ' + nombre), any = false, comp = Object.keys(R).length > 1;
    if (R.rank && R.rank.pts && window.APP.DB && R.rank.pts[window.APP.DB.uid] != null) h += '<div class="kpi"><div><b>' + R.rank.pts[window.APP.DB.uid] + ' pts</b>puntaje final en los juegos</div><div><b>#' + R.rank.pos[window.APP.DB.uid] + '</b>puesto en el ranking</div></div>';
    h += '<div class="box b2">Este reporte se generó en tu celular con tus respuestas. Nadie más lo recibe. ' + (comp ? 'Las comparaciones con el grupo son promedios anónimos de toda la clase.' : 'El profesor aún no ha compartido los promedios del grupo.') + '</div>';
    C.actividades.forEach(function (a) {
      var v = mine[a.id], body = '', G = R[a.id];
      if (a.tipo === 'texto' && v) body = '<div class="box">' + esc(v) + '</div>';
      else if (a.tipo === 'quiz' && a.items.some(function (it, i) { return mine[a.id + '_' + i] != null; })) body = tablaQuiz(a, null, mine);
      else if (a.tipo === 'encuesta' && a.items.some(function (it, i) { return mine[a.id + '_' + i] != null; })) body = tablaEncuesta(a, null, mine, R);
      else if (a.tipo === 'escala' && v) {
        var p = A.promedios(a, v), g = avg(p), lo = mini(p);
        body = '<div class="kpi"><div><b>' + num(g) + ' / 5</b>' + A.nivel(g) + '</div>' + (G ? '<div><b>' + num(avg(G.prom)) + ' / 5</b>promedio del grupo</div>' : '') + '</div>' +
          (G ? '<p class="lg"><i style="background:#1565B0"></i>Mi organización<i style="background:#9a9a92"></i>Promedio del grupo</p>' + a.grupos.map(function (gr, i) { return dbl(gr.k, G.prom[i], p[i], 5, num(p[i])); }).join('') : a.grupos.map(function (gr, i) { return bar(gr.k, p[i], 5, i === lo ? 'y' : ''); }).join('')) +
          '<div class="box">Mi dimensión más débil: <b>' + esc(a.grupos[lo].k) + '</b>.' + (a.reco && a.reco[a.grupos[lo].k] ? ' Primer paso sugerido: ' + esc(a.reco[a.grupos[lo].k]) : '') + '</div>';
        var bajos = [], k = 0; a.grupos.forEach(function (gr) { gr.items.forEach(function (t) { if (+v[k] <= 2) bajos.push(gr.k + ': ' + t); k++; }); });
        if (bajos.length) body += '<h3>Indicadores que calificaste con 1 o 2</h3><ul>' + bajos.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>';
      } else if (a.tipo === 'puntos' && v) {
        var gp = v[1].map(function (x, i) { return x - v[0][i]; }), up = maxi(gp), dn = mini(gp);
        body = '<p class="lg"><i style="background:#9a9a92"></i>' + esc(a.partes[0]) + '<i style="background:#1565B0"></i>' + esc(a.partes[1]) + '</p>' + a.tipos.map(function (t, i) { return dbl(t, v[0][i], v[1][i], 100, v[0][i] + '→' + v[1][i]); }).join('') +
          '<div class="box">Mi mayor brecha: más <b>' + esc(a.tipos[up]) + '</b>' + (a.desc && a.desc[a.tipos[up]] ? ' (' + esc(a.desc[a.tipos[up]]) + ')' : '') + ' y menos <b>' + esc(a.tipos[dn]) + '</b>.' + (G ? ' El grupo, en promedio, quiere más <b>' + esc(a.tipos[maxi(G.prom[1].map(function (x, i) { return x - G.prom[0][i]; }))]) + '</b>.' : '') + '</div>';
      } else if (a.tipo === 'multi' && v) {
        var mis = v.filter(function (i) { return i >= 0; });
        body = mis.length ? '<ul>' + mis.map(function (i) { return '<li>' + esc(a.opciones[i]) + (G ? ' <span class="mu">(también la marcó el ' + G.pct[i] + ' % del grupo)</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p>No marcaste ninguna.</p>';
      } else if (a.tipo === 'adkar' && v) {
        var b = A.bloqueo(v.s);
        body = (v.c ? '<p><b>Cambio:</b> ' + esc(v.c) + '</p>' : '') + a.etapas.map(function (e, i) { return bar(e.k, v.s[i], 5, i === b ? 'r' : (b >= 0 && i > b ? 'g' : 'k'), v.s[i]); }).join('') +
          (b >= 0 ? '<div class="box">Mi punto de bloqueo: <b>' + esc(a.etapas[b].k) + '</b>. Qué hacer: ' + esc(a.accion[b]) + '</div>' : '<div class="box">Sin punto de bloqueo: todos los elementos están en 4 o 5. El reto es sostener el cambio.</div>') +
          '<h3>Qué hacer en cada etapa</h3><ul>' + a.etapas.map(function (e, i) { return '<li><b>' + esc(e.k) + ':</b> ' + esc(a.accion[i]) + '</li>'; }).join('') + '</ul>';
      } else if (a.tipo === 'reparto' && v) {
        body = (G ? '<p class="lg"><i style="background:#9a9a92"></i>Promedio del grupo<i style="background:#1565B0"></i>Mis puntos</p>' + a.opciones.map(function (o, i) { return dbl(o, G.prom[i], v[i], 100, v[i]); }).join('') : a.opciones.map(function (o, i) { return bar(o, v[i], 100, '', v[i]); }).join(''));
      } else if (a.tipo === 'consultoria' && v) body = consultoriaTabla([v]);
      else if (a.tipo === 'equipo' && v != null) body = '<p>Tu equipo: <b>' + esc((C.equipos || [])[v] || '') + '</b>' + (R.rank && R.rank.equipos ? '. Puntaje final del equipo: <b>' + ((R.rank.equipos.filter(function (e) { return e.n === (C.equipos || [])[v]; })[0] || {}).total || 0) + '</b>' : '') + '</p>';
      else if (a.tipo === 'pasos' && v) { var sc = A.puntosPasos(v), pr = (C.procesos || [])[v.p] || { pasos: [] }, OP = ['🤖 Robot', '🙋 Persona', '🗑️ Eliminar']; body = '<div class="kpi"><div><b>' + sc.pts + ' / ' + sc.max + '</b>puntos de la misión</div></div><table><tbody>' + pr.pasos.map(function (st, i) { var ok = v.r[i] === st.a; return '<tr><td>' + (i + 1) + '. ' + esc(st.t) + (i === pr.cuello ? ' <b>(cuello de botella)</b>' : '') + '</td><td>' + (ok ? '<span class="ok">✓</span> ' : '<span class="no">✗</span> ') + OP[st.a] + '</td></tr>'; }).join('') + '</tbody></table>'; }
      else if (a.tipo === 'mibot' && v) { var hm = A.horasMes(v); body = '<p><b>Tarea:</b> ' + esc(v.t) + '</p><div class="kpi"><div><b>' + num(hm) + ' h/mes</b>que liberarías</div><div><b>' + Math.round(hm * 12) + ' h</b>al año</div>' + (R.horas ? '<div><b>' + num(R.horas, 0) + ' h/mes</b>liberadas por todo el grupo</div>' : '') + '</div><h3>Mi proceso TO-BE</h3><ol>' + (v.s || []).map(function (st) { return '<li>' + (st.r ? '🤖 <b>Robot:</b> ' : '🙋 ') + esc(st.x) + '</li>'; }).join('') + '</ol><div class="box">Siguiente paso: dibuja este mapa en draw.io o Lucidchart y prueba automatizar un paso con Power Automate Desktop (gratis en Windows).</div>'; }
      else if (a.tipo === 'comite' && v) body = '<p>Decisión enviada por tu comité: <b>' + esc(v.n) + '</b>. Acción de 90 días: ' + esc(v.x) + '</p>';
      if (body) { any = true; h += '<h2>' + esc(a.titulo) + '</h2>' + body; }
    });
    if (!any) h += '<p>Todavía no hay respuestas tuyas guardadas en este celular.</p>';
    if (C.empresas && C.actividades.some(function (a) { return a.tipo === 'consultoria'; })) h += claveEmpresas();
    return doc('Mi reporte', h + uso() + pie());
  }

  /* ---------- Visor: vista previa, descarga y PDF ---------- */
  function visor(html, archivo) {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="card" style="max-width:980px;width:100%;height:92vh;display:flex;flex-direction:column;gap:10px;padding:14px"><div class="row" style="justify-content:space-between"><b>Vista previa del reporte</b><span class="row"><button class="btn sm" data-a="dl">Descargar</button><button class="btn sec sm" data-a="pdf">Guardar como PDF</button><button class="btn sec sm" data-a="x">Cerrar</button></span></div><iframe title="Reporte" style="flex:1;border:1px solid var(--line);border-radius:10px;width:100%;background:#fff"></iframe></div>';
    document.body.appendChild(ov);
    var fr = ov.querySelector('iframe'); fr.srcdoc = html;
    ov.querySelector('[data-a="x"]').onclick = function () { ov.remove(); };
    ov.querySelector('[data-a="pdf"]').onclick = function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) {} };
    ov.querySelector('[data-a="dl"]').onclick = function () {
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' }), u = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = u; a.download = archivo; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    };
    return ov;
  }

  window.REPORTE = { grupo: grupo, personal: personal, resumen: resumen, visor: visor };
})();
