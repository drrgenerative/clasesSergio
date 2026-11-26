/* Módulo 5 · Sesión 3: Plan básico de ciberseguridad. Versión gamificada: Operación Confianza Cero · Fase final. */
(function () {
  var ELEMENTOS = ['Inventario de activos digitales', 'Análisis de riesgos', 'Políticas y controles de acceso', 'Gestión de parches y actualizaciones', 'Monitoreo y respuesta ante incidentes', 'Concientización y formación', 'Respaldo y recuperación', 'Gobernanza y cumplimiento'];
  var CORTO = ['Inventario', 'Riesgos', 'Accesos', 'Parches', 'Monitoreo', 'Formación', 'Respaldo', 'Gobernanza'];
  window.CLASE = {
    titulo: 'Módulo 5 · Operación Confianza Cero · Fase final: el plan',
    juego: true,
    juegoNombre: 'Confianza Cero · Fase final',
    rankingTitulo: '🛡️ Los mejores estrategas',
    medallas: [
      ['top', '🏆', 'Analista estrella', ' pts'],
      ['rapido', '⚡', 'Respuesta más rápida', ' pts de rapidez'],
      ['cazadores', '🛡️', 'Plan más resiliente', ' pts'],
      ['equipo', '🤝', 'Mejor equipo', ' pts']
    ],
    equipos: ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4', 'Equipo 5', 'Equipo 6'],
    reporte: {
      uso: [
        ['Empieza por el inventario:', 'una hoja con los sistemas, bases de datos y aplicaciones en la nube de tu organización, con su dueño y qué tan sensible es la información.'],
        ['Cubre lo básico en los 8 frentes', 'antes de comprar lo sofisticado. En el simulacro, los planes equilibrados resistieron más que los que apostaron todo a una sola cosa.'],
        ['Prueba tus copias de seguridad:', 'una copia que nunca se ha restaurado no es una copia.'],
        ['Escribe tu plan de respuesta en una página:', 'quién decide, a quién se avisa (incluida la SIC si hay datos personales) y en qué orden se actúa.'],
        ['Lleva el riesgo digital a la junta', 'con 3 indicadores simples y un responsable con nombre propio.']
      ],
      fuentes: 'NIST CSF 2.0 (2024); ISO/IEC 27001:2022; Verizon DBIR 2025; Superintendencia Financiera, Circular Externa 007 de 2018; SIC, Circular Única (Título V); Leyes 1266 de 2008 y 1581 de 2012. Crediahorro y sus incidentes son ficticios.'
    },
    actividades: [
      {
        id: 'equipo', tipo: 'equipo', diap: 3, titulo: 'Fase final · Elige tu equipo',
        intro: 'Bienvenido a la fase final de la Operación Confianza Cero. ¿En qué equipo estás? Es el número de tu sala.'
      },
      {
        id: 'repaso', tipo: 'quiz', diap: 4, titulo: 'Calentamiento · ¿Verdadero o falso?',
        intro: '¿Verdadero o falso?',
        opciones: ['Verdadero', 'Falso'],
        items: [
          { q: 'Zero Trust significa que quien ya está dentro de la red de la empresa no necesita verificarse.', a: 1, exp: 'Es al revés: nunca confíes, siempre verifica, estés dentro o fuera de la red.' },
          { q: 'Hoy el phishing puede llegar por SMS, por una llamada o con un código QR.', a: 0, exp: 'Smishing, vishing y quishing. Y cada vez más mensajes se escriben con IA, sin errores de ortografía.' },
          { q: '"Asumir la brecha" es uno de los tres principios de Zero Trust.', a: 0, exp: 'Junto con verificar explícitamente y el mínimo privilegio: diseñar como si el atacante ya estuviera adentro.' },
          { q: 'Si atacan a un proveedor de la empresa, el riesgo es solo del proveedor.', a: 1, exp: 'El caso IFX Networks (2023) tumbó servicios de decenas de entidades. El 30 % de las brechas involucra a un tercero (DBIR 2025).' }
        ]
      },
      {
        id: 'tienePlan', tipo: 'encuesta', diap: 5, titulo: '¿Tu organización tiene un plan?',
        intro: 'Respuesta anónima.',
        opciones: ['Sí, escrito y probado en el último año', 'Sí, escrito, pero nunca lo hemos probado', 'Hay prácticas, pero nada escrito', 'No tenemos', 'No sé'],
        items: [{ q: '¿Tu organización tiene un plan de ciberseguridad?', nota: 'Un plan que nunca se ha probado con un simulacro suele fallar el día del incidente. "No sé" también es una respuesta importante: si no lo conoces, no lo vas a usar.' }]
      },
      {
        id: 'elemento', tipo: 'quiz', diap: 13, titulo: 'Juego · ¿A qué elemento del plan pertenece?',
        intro: '¿A qué elemento del plan pertenece esta acción?',
        opciones: CORTO,
        items: [
          { q: 'Hacer una lista de todos los sistemas, bases de datos y aplicaciones en la nube, con su dueño.', a: 0, exp: 'Inventario de activos digitales: no se puede proteger lo que no se conoce.' },
          { q: 'Calificar cada amenaza según su probabilidad y su impacto, y decidir cuáles atender primero.', a: 1, exp: 'Análisis de riesgos: identificar, evaluar y priorizar.' },
          { q: 'Exigir MFA para entrar al correo y darle a cada cargo solo los permisos que necesita.', a: 2, exp: 'Políticas y controles de acceso: autenticación robusta y mínimo privilegio.' },
          { q: 'Instalar la actualización crítica de seguridad de la VPN apenas el fabricante la publica.', a: 3, exp: 'Gestión de parches: los equipos expuestos a internet van primero.' },
          { q: 'Recibir una alerta cuando alguien descarga miles de registros a las 3 a. m.', a: 4, exp: 'Monitoreo y respuesta: registros (logs) y alertas de comportamiento anómalo.' },
          { q: 'Hacer cada mes un simulacro de phishing y felicitar públicamente a quien lo reporta.', a: 5, exp: 'Concientización y formación: la meta es que la gente reporte, no castigar a quien cae.' },
          { q: 'Guardar una copia de los datos fuera de la red y probar cada trimestre que se puede restaurar.', a: 6, exp: 'Respaldo y recuperación: regla 3-2-1, con una copia aislada y pruebas de restauración.' },
          { q: 'Definir quién responde ante la junta por el riesgo digital y cumplir la Ley 1581 de protección de datos.', a: 7, exp: 'Gobernanza y cumplimiento: roles claros y alineación con normas.' }
        ]
      },
      {
        id: 'plan', tipo: 'presupuesto', diap: 17, titulo: 'Misión · Plan Crediahorro y simulacro',
        intro: 'Una persona por equipo envía el plan. Pueden corregirlo hasta que empiece el simulacro.',
        elementos: ELEMENTOS, corto: CORTO, total: 100, paso: 5, umbral: [10, 20],
        politicas: ['Accesos', 'Redes', 'Usuarios'],
        principios: ['Verificar explícitamente', 'Mínimo privilegio', 'Asumir la brecha'],
        pesos: { politica: 20, cultura: 20, zt: 20, contenido: 50, parcial: 20 },
        incidentes: [
          { t: 'Enero-febrero · Phishing de nómina', d: 'Llega a todos un correo idéntico al del portal de nómina. 40 empleados entregan su usuario y contraseña.', b: [5, 2], leccion: 'La formación reduce los clics y el MFA vuelve inútil la contraseña robada.' },
          { t: 'Marzo-abril · La VPN vulnerable', d: 'Se publica una falla crítica en el modelo de VPN de Crediahorro. A los pocos días, atacantes de todo el mundo la están explotando.', b: [3], leccion: 'La explotación de vulnerabilidades fue la puerta de entrada en el 20 % de las brechas (Verizon DBIR 2025).' },
          { t: 'Mayo-junio · Ransomware', d: 'Un sábado a las 2 a. m. se cifran los servidores del sistema central. Los asociados no pueden retirar su dinero.', b: [6], leccion: 'Sin una copia aislada y probada no hay recuperación, solo negociación.' },
          { t: 'Julio-agosto · Visita de la Superfinanciera', d: 'La Superintendencia Financiera pide evidencia de la gestión del riesgo de ciberseguridad: responsables, riesgos evaluados e informes a la junta.', b: [7, 1], leccion: 'La Circular Externa 007 de 2018 exige a las entidades vigiladas gestionar el riesgo de ciberseguridad.' },
          { t: 'Septiembre-octubre · Fuga silenciosa', d: 'Durante tres semanas, alguien descarga de madrugada pequeños lotes de datos de asociados. Nadie lo nota.', b: [4], leccion: 'Sin registros ni alertas, la fuga se descubre cuando ya es noticia.' },
          { t: 'Noviembre-diciembre · La base que nadie conocía', d: 'Un periodista avisa que una base con datos de 40.000 asociados está expuesta en una aplicación en la nube que contrató mercadeo sin avisar a TI.', b: [0], leccion: 'No se puede proteger lo que no está inventariado. Y hay que reportarlo a la SIC.' }
        ]
      },
      {
        id: 'csirp', tipo: 'quiz', diap: 22, titulo: 'Respuesta al ransomware · ¿En qué fase estamos?',
        intro: '¿En qué fase de la respuesta a incidentes estamos?',
        opciones: ['Preparar', 'Detectar', 'Contener', 'Erradicar', 'Recuperar', 'Aprender'],
        items: [
          { q: '2:07 a. m.: el monitoreo alerta que cientos de archivos se están cifrando.', a: 1, exp: 'Detectar: sin registros ni alertas, esto se descubre el lunes a las 8 a. m.' },
          { q: 'Desconectar de la red los servidores afectados para que el cifrado no se propague.', a: 2, exp: 'Contener: limitar el daño. En paralelo se activa el comité de crisis; si hay datos personales comprometidos, se reporta a la SIC dentro de los 15 días hábiles siguientes a la detección.' },
          { q: 'Cerrar la cuenta que usó el atacante y corregir la falla por la que entró.', a: 3, exp: 'Erradicar: si no se cierra la puerta, el atacante vuelve a entrar después de la restauración.' },
          { q: 'Restaurar el sistema central desde la copia aislada y verificar que funcione.', a: 4, exp: 'Recuperar: volver a operar. Aquí se nota si las copias se habían probado.' },
          { q: 'Reunir al equipo, revisar qué falló y actualizar el plan.', a: 5, exp: 'Aprender: sin esta fase, el mismo incidente se repite.' }
        ]
      },
      {
        id: 'cierre', tipo: 'texto', diap: 27, titulo: 'Cierre del módulo · Mi primera propuesta',
        pregunta: 'Lo primero que voy a proponer en mi organización después de este módulo es…',
        ayuda: 'Una frase, sin datos confidenciales.', max: 160, vista: 'muro'
      }
    ]
  };
})();
