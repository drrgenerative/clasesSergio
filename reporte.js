/* Reportes descargables: del grupo (anónimo y agregado) y personal (solo en el celular de cada estudiante). */
(function () {
  var A = window.APP;
  function esc(s) { return A.esc(s); }
  function act(id) { return A.act(id); }
  function num(x, d) { return (+x || 0).toFixed(d == null ? 1 : d).replace('.', ','); }
  function pct(n, d) { return d ? Math.round(100 * n / d) : 0; }
  function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function vals(resp, key) { var o = (resp || {})[key] || {}; return Object.keys(o).map(function (u) { return o[u] && o[u].v; }).filter(function (v) { return v != null; }); }
  function fecha() { try { return new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return new Date().toISOString().slice(0, 10); } }

  var RECO = {
    Estrategia: 'Construir una hoja de ruta digital ligada al plan estratégico, con 2 o 3 indicadores de impacto (adopción, ROI u OKR).',
    Liderazgo: 'Que el comité directivo patrocine una iniciativa visible, le asigne presupuesto y comunique el propósito digital en persona.',
    Infraestructura: 'Priorizar la integración de sistemas y automatizar 1 o 2 procesos críticos; evaluar servicios en la nube y la seguridad de la información.',
    Talento: 'Diagnosticar las brechas de habilidades digitales, armar un plan de formación continua y abrir espacios seguros para experimentar.',
    Cambio: 'Diseñar la gestión del cambio desde el inicio: comunicación, formación, acompañamiento y escucha. Usar ADKAR para encontrar el bloqueo.'
  };
  var CULT = { 'Jerárquica': 'procesos claros, estabilidad y control del riesgo', 'De mercado': 'metas claras y resultados medibles', 'De clan': 'colaboración, participación y desarrollo de las personas', 'Adhocrática': 'experimentación, innovación y tolerancia al error' };

  var CSS = 'body{font-family:Archivo,"Segoe UI",Roboto,Arial,sans-serif;color:#161616;background:#fff;margin:0;line-height:1.45}' +
    '.w{max-width:860px;margin:0 auto;padding:28px 22px 50px}' +
    'header{border-bottom:4px solid #F2B705;padding-bottom:14px;margin-bottom:8px}' +
    '.ey{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1565B0}' +
    'h1{font-size:28px;line-height:1.15;margin:6px 0}h2{font-size:19px;margin:28px 0 8px;padding-top:6px;border-top:1px solid #e3e3dc}h3{font-size:15px;margin:14px 0 6px}' +
    '.mu{color:#5f5f58;font-size:13px}.kpi{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.kpi div{background:#f6f6f2;border:1px solid #e3e3dc;border-radius:10px;padding:10px 14px}.kpi b{display:block;font-size:22px}' +
    '.b{display:grid;grid-template-columns:200px 1fr 64px;gap:10px;align-items:center;margin:6px 0;font-size:14px}' +
    '.t{height:12px;background:#f1f1ec;border:1px solid #e3e3dc;border-radius:7px;overflow:hidden}.t i{display:block;height:100%;background:#1565B0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.t i.g{background:#9a9a92}.t i.y{background:#F2B705}.t i.r{background:#B83A2B}.t i.k{background:#2E7D4F}.v{text-align:right;font-weight:800}' +
    '.box{background:#fff4d2;border-radius:10px;padding:12px 14px;margin:10px 0;font-size:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.box.b2{background:#e7f0fa}' +
    'table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}th,td{text-align:left;border-bottom:1px solid #e3e3dc;padding:7px 6px;vertical-align:top}th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#5f5f58}' +
    'ul{padding-left:20px}li{margin:4px 0}.lg{font-size:12px;color:#5f5f58}.lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 10px;vertical-align:-1px}' +
    '.ok{color:#2E7D4F;font-weight:700}.no{color:#B83A2B;font-weight:700}footer{margin-top:30px;border-top:1px solid #e3e3dc;padding-top:10px;font-size:12px;color:#5f5f58}' +
    '@media(max-width:600px){.b{grid-template-columns:110px 1fr 52px}h1{font-size:23px}}@media print{h2{break-after:avoid}.b,.box,tr{break-inside:avoid}}';

  function doc(title, body) {
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><style>' + CSS + '</style></head><body><div class="w">' + body + '</div></body></html>';
  }
  function bar(l, v, max, cls, txt) { return '<div class="b"><span>' + esc(l) + '</span><span class="t"><i class="' + (cls || '') + '" style="width:' + Math.max(0, Math.min(100, v / max * 100)) + '%"></i></span><span class="v">' + (txt != null ? txt : num(v)) + '</span></div>'; }
  function dbl(l, a, b, max, txt) { return '<div class="b"><span>' + esc(l) + '</span><span><span class="t" style="display:block;margin-bottom:3px"><i class="g" style="width:' + (a / max * 100) + '%"></i></span><span class="t" style="display:block"><i style="width:' + (b / max * 100) + '%"></i></span></span><span class="v">' + txt + '</span></div>'; }

  /* ---------- Cálculos agregados (también se publican como resumen para los celulares) ---------- */
  function resumen(resp) {
    var R = { t: Date.now() };
    var m = act('madurez'), vm = vals(resp, 'madurez');
    if (m && vm.length) {
      var ps = vm.map(function (v) { return A.promedios(m, v); });
      R.madurez = m.grupos.map(function (g, i) { return +avg(ps.map(function (p) { return p[i]; })).toFixed(2); });
      R.nivel = { 'Inicial': 0, 'En desarrollo': 0, 'Avanzado': 0, 'Líder': 0 };
      ps.forEach(function (p) { R.nivel[A.nivel(avg(p))]++; });
      R.nMadurez = vm.length;
    }
    var vo = vals(resp, 'ocai');
    if (vo.length) { R.ocai = [0, 1].map(function (p) { return [0, 1, 2, 3].map(function (t) { return +avg(vo.map(function (v) { return +v[p][t] || 0; })).toFixed(1); }); }); R.nOcai = vo.length; }
    var s = act('senales'), vs = vals(resp, 'senales');
    if (s && vs.length) { R.senales = s.opciones.map(function (o, i) { return pct(vs.filter(function (v) { return (v || []).indexOf(i) >= 0; }).length, vs.length); }); R.nSenales = vs.length; }
    var va = vals(resp, 'adkar');
    if (va.length) {
      R.bloqueo = [0, 0, 0, 0, 0, 0];
      va.forEach(function (v) { var b = A.bloqueo(v.s); R.bloqueo[b < 0 ? 5 : b]++; });
      R.adkar = [0, 1, 2, 3, 4].map(function (i) { return +avg(va.map(function (v) { return +v.s[i] || 0; })).toFixed(2); });
      R.nAdkar = va.length;
    }
    return R;
  }

  function seccionQuiz(a, resp, mine) {
    var h = '<p class="mu">' + esc(a.intro || '') + '</p><table><thead><tr><th>Situación</th><th>Respuesta</th><th>Por qué</th>' + (mine ? '<th>Tú</th>' : '<th>Aciertos del grupo</th>') + '</tr></thead><tbody>';
    a.items.forEach(function (it, i) {
      var key = a.id + '_' + i, col;
      if (mine) { var m = mine[key]; col = m == null ? '<span class="mu">—</span>' : (m === it.a ? '<span class="ok">✓</span>' : '<span class="no">' + esc(a.opciones[m]) + '</span>'); }
      else { var vv = vals(resp, key); col = vv.length ? pct(vv.filter(function (v) { return v === it.a; }).length, vv.length) + ' %' : '—'; }
      h += '<tr><td>' + esc(it.q) + '</td><td><b>' + esc(a.opciones[it.a]) + '</b></td><td>' + esc(it.exp) + '</td><td>' + col + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  /* ---------- Reporte del grupo ---------- */
  function grupo(resp, alias, opts) {
    opts = opts || {};
    var R = resumen(resp), C = A.clase, nP = Object.keys(alias || {}).length;
    var h = '<header><div class="ey">Universidad Sergio Arboleda · Colsubsidio</div><h1>Reporte de la clase</h1><div class="mu">' + esc(C.titulo) + ' · ' + fecha() + '</div></header>';
    h += '<div class="kpi"><div><b>' + nP + '</b>participantes</div>' + (R.madurez ? '<div><b>' + num(avg(R.madurez)) + ' / 5</b>madurez digital promedio</div>' : '') + (R.bloqueo ? '<div><b>' + esc(act('adkar').etapas[R.bloqueo.slice(0, 5).indexOf(Math.max.apply(null, R.bloqueo.slice(0, 5)))].k) + '</b>bloqueo ADKAR más común</div>' : '') + '</div>';
    h += '<div class="box b2">Este reporte es <b>anónimo y agregado</b>: muestra promedios y porcentajes del grupo, sin nombres ni respuestas individuales. Cada participante puede descargar su reporte personal desde su celular.</div>';

    var vp = vals(resp, 'palabra');
    if (vp.length) {
      var c = {}; vp.forEach(function (v) { var k = String(v).trim().toLowerCase(); c[k] = (c[k] || 0) + 1; });
      var ks = Object.keys(c).sort(function (x, y) { return c[y] - c[x]; }).slice(0, 12);
      h += '<h2>1. Lo que hizo diferente a los 4 líderes</h2><p>' + ks.map(function (k) { return '<b>' + esc(k) + '</b>' + (c[k] > 1 ? ' (' + c[k] + ')' : ''); }).join(' · ') + '</p>';
    }
    if (act('perfil')) h += '<h2>2. Perfiles de madurez (MIT-Capgemini)</h2>' + seccionQuiz(act('perfil'), resp);
    var m = act('madurez');
    if (R.madurez) {
      var lo = R.madurez.indexOf(Math.min.apply(null, R.madurez)), hi = R.madurez.indexOf(Math.max.apply(null, R.madurez));
      h += '<h2>3. Madurez digital del grupo</h2><p class="mu">' + R.nMadurez + ' respuestas · escala de 1 a 5</p>' + m.grupos.map(function (g, i) { return bar(g.k, R.madurez[i], 5, i === lo ? 'y' : (i === hi ? 'k' : '')); }).join('');
      h += '<h3>¿En qué nivel están las organizaciones?</h3>' + Object.keys(R.nivel).map(function (k) { return bar(k, R.nivel[k], R.nMadurez, 'g', R.nivel[k]); }).join('');
      h += '<div class="box">La dimensión más débil del grupo es <b>' + esc(m.grupos[lo].k) + '</b> (' + num(R.madurez[lo]) + '). Recomendación: ' + esc(RECO[m.grupos[lo].k]) + '</div>';
    }
    var c4 = act('cultura4');
    if (c4) {
      h += '<h2>4. ¿Qué cultura tenían los 4 líderes?</h2><table><thead><tr><th>Caso</th><th>Lo que votó el grupo</th><th>Lectura sugerida</th></tr></thead><tbody>';
      c4.items.forEach(function (it, i) { var vv = vals(resp, 'cultura4_' + i), d = c4.opciones.map(function (o, k) { return vv.filter(function (v) { return v === k; }).length; }); h += '<tr><td><b>' + esc(it.q) + '</b></td><td>' + (vv.length ? c4.opciones.map(function (o, k) { return esc(o) + ' ' + pct(d[k], vv.length) + ' %'; }).join('<br>') : '—') + '</td><td>' + esc(it.nota) + '</td></tr>'; });
      h += '</tbody></table>';
    }
    var oc = act('ocai');
    if (R.ocai) {
      var gap = R.ocai[1].map(function (x, i) { return x - R.ocai[0][i]; }), up = gap.indexOf(Math.max.apply(null, gap)), dn = gap.indexOf(Math.min.apply(null, gap));
      h += '<h2>5. Cultura: hoy vs. la que necesitamos</h2><p class="lg"><i style="background:#9a9a92"></i>Hoy<i style="background:#1565B0"></i>La que necesitamos · ' + R.nOcai + ' respuestas · promedio de 100 puntos</p>' + oc.tipos.map(function (t, i) { return dbl(t, R.ocai[0][i], R.ocai[1][i], 100, (gap[i] >= 0 ? '+' : '') + num(gap[i], 0)); }).join('');
      h += '<div class="box">El grupo quiere más cultura <b>' + esc(oc.tipos[up]) + '</b> (' + esc(CULT[oc.tipos[up]]) + ') y menos <b>' + esc(oc.tipos[dn]) + '</b>.</div>';
    }
    var se = act('senales');
    if (R.senales) {
      var idx = se.opciones.map(function (o, i) { return i; }).sort(function (x, y) { return R.senales[y] - R.senales[x]; });
      h += '<h2>6. Señales de resistencia que ven en sus organizaciones</h2><p class="mu">% de participantes que marcaron cada señal · ' + R.nSenales + ' respuestas</p>' + idx.map(function (i, k) { return bar(se.opciones[i], R.senales[i], 100, k < 3 ? 'r' : 'g', R.senales[i] + ' %'); }).join('');
    }
    if (act('etapa')) h += '<h2>7. ¿En qué etapa de ADKAR se atascó?</h2>' + seccionQuiz(act('etapa'), resp);
    var ad = act('adkar');
    if (R.bloqueo) {
      var mx = R.bloqueo.slice(0, 5).indexOf(Math.max.apply(null, R.bloqueo.slice(0, 5)));
      h += '<h2>8. Dónde se atascan los cambios del grupo (ADKAR)</h2><p class="mu">Punto de bloqueo: el primer elemento calificado con 3 o menos · ' + R.nAdkar + ' cambios diagnosticados</p>' + ad.etapas.map(function (e, i) { return bar(e.k, R.bloqueo[i], R.nAdkar, i === mx ? 'r' : 'g', R.bloqueo[i]); }).join('') + bar('Sin bloqueo', R.bloqueo[5], R.nAdkar, 'k', R.bloqueo[5]);
      h += '<h3>Qué hacer en cada etapa</h3><ul>' + ad.etapas.map(function (e, i) { return '<li><b>' + esc(e.k) + ':</b> ' + esc(ad.accion[i]) + '</li>'; }).join('') + '</ul>';
    }
    var co = act('comite'), vc = vals(resp, 'comite');
    if (co && vc.length) {
      h += '<h2>9. Decisiones de los comités (role-play)</h2><table><thead><tr><th>Comité</th><th>Presupuesto (' + co.dimensiones.map(function (d) { return d.slice(0, 4) + '.'; }).join(' / ') + ')</th><th>Bloqueo</th><th>Estrategias</th><th>Acción de 90 días</th></tr></thead><tbody>' +
        vc.sort(function (x, y) { return String(x.n).localeCompare(String(y.n), 'es', { numeric: true }); }).map(function (v) { return '<tr><td><b>' + esc(v.n) + '</b></td><td>' + (v.p || []).join(' / ') + '</td><td>' + esc(co.etapas[v.e] || '') + '</td><td>' + (v.s || []).map(function (i) { return esc(co.estrategias[i]); }).join('<br>') + '</td><td>' + esc(v.x) + '</td></tr>'; }).join('') + '</tbody></table>';
    }
    var vk = vals(resp, 'compromiso');
    if (vk.length && opts.compromisos !== false) h += '<h2>10. Compromisos del grupo</h2><p class="mu">Sin nombres.</p><ul>' + vk.map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('') + '</ul>';
    h += guiaUso() + '<footer>Diplomado en Estrategia y Dirección de la Transformación Digital · Universidad Sergio Arboleda · Colsubsidio. Fuentes: MIT-Capgemini (2012), Cameron y Quinn (Competing Values Framework), Kotter y Schlesinger (HBR, 1979), modelo ADKAR de Prosci.</footer>';
    return doc('Reporte de la clase', h);
  }

  function guiaUso() {
    return '<h2>Cómo usar este reporte en tu organización</h2><ol>' +
      '<li><b>Repite el autodiagnóstico con tu equipo.</b> Pide a 4 o 5 personas de distintas áreas que califiquen los mismos 20 indicadores y comparen: las diferencias de percepción son el primer hallazgo.</li>' +
      '<li><b>Elige una sola dimensión para empezar:</b> la más débil, o la que bloquea a las demás.</li>' +
      '<li><b>Antes de lanzar un cambio, haz el diagnóstico ADKAR</b> de las personas afectadas y trabaja primero en el punto de bloqueo.</li>' +
      '<li><b>Mide la cultura dos veces al año</b> (hoy vs. la que necesitamos) para ver si la brecha se cierra.</li></ol>';
  }

  /* ---------- Reporte personal ---------- */
  function personal(nombre, mine, R) {
    R = R || {};
    var C = A.clase, h = '<header><div class="ey">Universidad Sergio Arboleda · Colsubsidio</div><h1>Mi reporte: ' + esc(nombre) + '</h1><div class="mu">' + esc(C.titulo) + ' · ' + fecha() + '</div></header>';
    h += '<div class="box b2">Este reporte se generó en tu celular con tus respuestas. Nadie más lo recibe. ' + (R.madurez || R.ocai ? 'Las barras del grupo son promedios anónimos de toda la clase.' : 'El profesor aún no ha compartido los promedios del grupo.') + '</div>';
    var m = act('madurez'), v = mine.madurez, any = false;
    if (m && v) {
      any = true;
      var p = A.promedios(m, v), g = avg(p), lo = p.indexOf(Math.min.apply(null, p));
      h += '<h2>Madurez digital de mi organización</h2><div class="kpi"><div><b>' + num(g) + ' / 5</b>' + A.nivel(g) + '</div>' + (R.madurez ? '<div><b>' + num(avg(R.madurez)) + ' / 5</b>promedio del grupo</div>' : '') + '</div>';
      h += R.madurez ? '<p class="lg"><i style="background:#1565B0"></i>Mi organización<i style="background:#9a9a92"></i>Promedio del grupo</p>' + m.grupos.map(function (gr, i) { return dbl(gr.k, R.madurez[i], p[i], 5, num(p[i])).replace('class="g"', 'class="g"'); }).join('') : m.grupos.map(function (gr, i) { return bar(gr.k, p[i], 5, i === lo ? 'y' : ''); }).join('');
      h += '<div class="box">Mi dimensión más débil: <b>' + esc(m.grupos[lo].k) + '</b>. Primer paso sugerido: ' + esc(RECO[m.grupos[lo].k]) + '</div>';
      var bajos = [], k = 0;
      m.grupos.forEach(function (gr) { gr.items.forEach(function (t) { if (+v[k] <= 2) bajos.push(gr.k + ': ' + t); k++; }); });
      if (bajos.length) h += '<h3>Indicadores que calificaste con 1 o 2</h3><ul>' + bajos.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>';
    }
    var oc = act('ocai'), vo = mine.ocai;
    if (oc && vo) {
      any = true;
      var gp = vo[1].map(function (x, i) { return x - vo[0][i]; }), up = gp.indexOf(Math.max.apply(null, gp)), dn = gp.indexOf(Math.min.apply(null, gp));
      h += '<h2>Cultura de mi organización: hoy vs. la que necesita</h2><p class="lg"><i style="background:#9a9a92"></i>Hoy<i style="background:#1565B0"></i>La que necesita</p>' + oc.tipos.map(function (t, i) { return dbl(t, vo[0][i], vo[1][i], 100, vo[0][i] + '→' + vo[1][i]); }).join('');
      h += '<div class="box">Mi mayor brecha: más cultura <b>' + esc(oc.tipos[up]) + '</b> (' + esc(CULT[oc.tipos[up]]) + ') y menos <b>' + esc(oc.tipos[dn]) + '</b>.' + (R.ocai ? ' El grupo, en promedio, quiere más <b>' + esc(oc.tipos[R.ocai[1].map(function (x, i) { return x - R.ocai[0][i]; }).reduce(function (bi, x, i, arr) { return x > arr[bi] ? i : bi; }, 0)]) + '</b>.' : '') + '</div>';
    }
    var se = act('senales'), vs = mine.senales;
    if (se && vs) {
      any = true; var mis = vs.filter(function (i) { return i >= 0; });
      h += '<h2>Señales de resistencia que marqué</h2>' + (mis.length ? '<ul>' + mis.map(function (i) { return '<li>' + esc(se.opciones[i]) + (R.senales ? ' <span class="mu">(también la marcó el ' + R.senales[i] + ' % del grupo)</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p>No marcaste ninguna.</p>');
    }
    var ad = act('adkar'), va = mine.adkar;
    if (ad && va) {
      any = true; var b = A.bloqueo(va.s);
      h += '<h2>Mi cambio en ADKAR</h2>' + (va.c ? '<p><b>Cambio:</b> ' + esc(va.c) + '</p>' : '') + ad.etapas.map(function (e, i) { return bar(e.k, va.s[i], 5, i === b ? 'r' : (b >= 0 && i > b ? 'g' : 'k'), va.s[i]); }).join('');
      h += b >= 0 ? '<div class="box">Mi punto de bloqueo: <b>' + esc(ad.etapas[b].k) + '</b>. Qué hacer: ' + esc(ad.accion[b]) + '</div>' : '<div class="box">Sin punto de bloqueo: todos los elementos están en 4 o 5. El reto es sostener el cambio.</div>';
      h += '<h3>Qué hacer en cada etapa</h3><ul>' + ad.etapas.map(function (e, i) { return '<li><b>' + esc(e.k) + ':</b> ' + esc(ad.accion[i]) + '</li>'; }).join('') + '</ul>';
    }
    if (mine.compromiso) { any = true; h += '<h2>Mi compromiso</h2><div class="box">' + esc(mine.compromiso) + '</div>'; }
    ['perfil', 'etapa'].forEach(function (id) { var a = act(id); if (a && a.items.some(function (it, i) { return mine[id + '_' + i] != null; })) { any = true; h += '<h2>Repaso: ' + esc(a.titulo) + '</h2>' + seccionQuiz(a, null, mine); } });
    if (!any) h += '<p>Todavía no hay respuestas tuyas guardadas en este celular.</p>';
    h += guiaUso() + '<footer>Diplomado en Estrategia y Dirección de la Transformación Digital · Universidad Sergio Arboleda · Colsubsidio.</footer>';
    return doc('Mi reporte', h);
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
