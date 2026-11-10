/* Carga la clase elegida (?clase=m4s1) y luego los scripts de la página. */
(function () {
  var me = document.currentScript, pagina = me.getAttribute('data-pagina');
  var p = new URLSearchParams(location.search);
  var limpio = function (s) { return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30); };
  var id = limpio(p.get('clase')) || limpio(window.CLASE_DEFECTO) || 'm4s1';
  window.CLASE_ID = id;
  window.GRUPO = limpio(p.get('grupo'));
  var lista = ['clases/indice.js', 'clases/' + id + '.js', 'comun.js', 'reporte.js', pagina];
  (function sig(i) {
    if (i >= lista.length) return;
    var s = document.createElement('script');
    s.src = lista[i] + '?v=4';
    s.onload = function () { sig(i + 1); };
    s.onerror = function () {
      if (i === 0) { window.INDICE_CLASES = []; return sig(1); }
      document.body.insertAdjacentHTML('beforeend', '<div style="max-width:560px;margin:40px auto;padding:20px;border-radius:12px;background:#fbe9e6;color:#B83A2B;font-family:system-ui">No se encontró la clase <b>' + id + '</b> (archivo <code>' + lista[i] + '</code>). Revisa el enlace.</div>');
    };
    document.body.appendChild(s);
  })(0);
})();
