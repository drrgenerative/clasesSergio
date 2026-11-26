/* Módulo 6 · Sesión 1: Business intelligence y tipos de analítica. Clase por equipos fijos: Del dato a la decisión. */
(function () {
  var TIPOS = ['Descriptiva', 'Diagnóstica', 'Predictiva', 'Prescriptiva'];
  var ROLES = [
    { n: 'Líder de negocio', d: 'Define el problema y la decisión. Modera el consenso del equipo.', tarea: 'En el reto moderas el consenso; en el canvas llenas el problema y la decisión.' },
    { n: 'Ingeniero(a) de datos', d: 'Identifica las fuentes de datos y cómo se integran.', tarea: 'En el canvas llenas las fuentes de datos y el flujo (ETL, almacén, herramienta).' },
    { n: 'Analista', d: 'Formula las preguntas y los indicadores. Registra las respuestas del equipo en el celular.', tarea: 'Envías las respuestas del equipo; en el canvas llenas la pregunta clave y el indicador.' },
    { n: 'Comunicador(a)', d: 'Cuida el tiempo, revisa la calidad del argumento y presenta el pitch.', tarea: 'En el canvas llenas el riesgo de calidad del dato y la frase del pitch; presentas en 2 minutos.' }
  ];
  window.CLASE = {
    titulo: 'Módulo 6 · Del dato a la decisión: business intelligence y analítica',
    juego: true,
    soloEquipos: true,
    juegoNombre: 'Del dato a la decisión',
    rankingTitulo: '🤝 Ranking de equipos',
    reglaPuntos: 'Reto: 25 por escenario bien clasificado y 25 por cada pregunta propia (máx. 300). Canvas: 20 por campo completo y 20 por el tipo de analítica (máx. 180). Voto del público: 20 por voto (no cuentan los votos por el propio equipo). Bonos del profesor: +25 o −25.',
    medallas: [
      ['equipo', '🏆', 'Mejor equipo', ' pts'],
      ['clasif', '🔎', 'Mejor clasificación', ' pts'],
      ['canvas', '🧭', 'Canvas más completo', ' pts'],
      ['votos', '📣', 'Voto del público', ' votos']
    ],
    equipos: ['Equipo 1 · FrescoYa', 'Equipo 2 · SaludCerca', 'Equipo 3 · RutaÁgil', 'Equipo 4 · EducaMás', 'Equipo 5 · AgroAndes', 'Equipo 6 · MoviPagos'],
    reporte: {
      uso: [
        ['Empieza por la decisión, no por los datos:', 'escribe qué decisión quieres mejorar, quién la toma y cada cuánto.'],
        ['Sube un escalón a la vez:', 'si hoy solo describes, el siguiente paso es preguntar por qué pasó (diagnóstica) antes de intentar predecir.'],
        ['Haz el inventario de tus fuentes:', 'qué datos ya tienes, dónde están y quién responde por su calidad.'],
        ['Define un indicador con meta', 'para saber si la decisión mejoró gracias a los datos.'],
        ['Verifica antes de citar:', 'un dato o una frase sin fuente puede ser falso, aunque todo el mundo lo repita.']
      ],
      fuentes: 'Gartner, modelo de madurez analítica (descriptiva, diagnóstica, predictiva y prescriptiva); INFORMS, caso UPS ORION (2016); Gomez-Uribe y Hunt, The Netflix Recommender System (2015). Las seis empresas cliente son ficticias.'
    },
    actividades: [
      {
        id: 'equipo', tipo: 'equipo', diap: 3, titulo: 'Paso 1 · Elige tu equipo',
        intro: 'Cada equipo es una consultora de analítica con una empresa cliente. Es tu equipo para todo el módulo.'
      },
      {
        id: 'rol', tipo: 'rol', diap: 3, titulo: 'Paso 2 · Elige tu rol en el equipo',
        intro: 'Pónganse de acuerdo: cada rol debe quedar cubierto. Si son 3, alguien asume dos roles.',
        roles: ROLES
      },
      {
        id: 'entrada', tipo: 'texto', diap: 5, titulo: 'Arranque · ¿Con qué decidiste?',
        pregunta: 'Piensa en una decisión de trabajo de esta semana. ¿Con qué la tomaste?',
        ayuda: 'Una o dos palabras: intuición, Excel, experiencia, un reporte, el jefe…', max: 30, vista: 'nube'
      },
      {
        id: 'nivel', tipo: 'encuesta', diap: 18, titulo: '¿En qué escalón está tu organización?',
        intro: 'Respuesta anónima.',
        opciones: ['Decidimos sobre todo por intuición', 'Descriptiva: sabemos qué pasó', 'Diagnóstica: entendemos por qué pasó', 'Predictiva: anticipamos qué pasará', 'Prescriptiva: los datos nos recomiendan qué hacer'],
        items: [{ q: '¿En qué escalón de la analítica está tu organización hoy, en la mayoría de sus decisiones?', nota: 'La mayoría de las organizaciones se queda entre la intuición y la analítica descriptiva. El salto más rentable suele ser el siguiente escalón, no el último.' }]
      },
      {
        id: 'reto', tipo: 'clasifica', diap: 19, titulo: 'Sala 1 · Reto "Clasifica y pregunta"',
        intro: 'La persona con el rol de analista envía la respuesta del equipo. Pueden corregirla hasta que el profesor revele los resultados.',
        opciones: TIPOS,
        items: [
          { q: 'Un informe de ausentismo laboral mensual por área.', a: 0, exp: 'Describe lo que ya pasó: ¿qué pasó?' },
          { q: 'Un modelo que predice qué trabajadores tienen mayor riesgo de sufrir un accidente laboral.', a: 2, exp: 'Estima lo que probablemente pasará: ¿qué pasará?' },
          { q: 'Un sistema que asigna los turnos óptimos del personal según la demanda esperada.', a: 3, exp: 'Recomienda o decide la mejor acción: ¿qué hacer?' },
          { q: 'Un análisis que cruza ventas y clima para entender por qué cayeron las ventas de helado en abril.', a: 1, exp: 'Busca la causa de algo que ya pasó: ¿por qué pasó?' },
          { q: 'Un tablero con las ventas de ayer por tienda.', a: 0, exp: 'Muestra lo que pasó, aunque sea reciente: descriptiva.' },
          { q: 'Un modelo que calcula la probabilidad de que cada cliente cancele su plan el próximo mes.', a: 2, exp: 'Predicción de abandono (churn): ¿qué pasará?' },
          { q: 'Un sistema que decide la ruta de cada conductor para entregar más con menos combustible, como ORION de UPS.', a: 3, exp: 'Optimización: elige la mejor acción entre miles de opciones.' },
          { q: 'Revisar quejas y datos de entrega para descubrir por qué aumentaron los reclamos en Medellín.', a: 1, exp: 'Análisis de causa raíz: ¿por qué pasó?' }
        ],
        introB: 'Para su empresa cliente, una pregunta de cada tipo. El líder de negocio propone el problema; todos aportan.',
        preguntas: [
          { c: 'Descriptiva', l: 'Pregunta descriptiva (¿qué pasó?)', ph: 'Ej.: ¿cuántas entregas fallaron el mes pasado por zona?' },
          { c: 'Diagnóstica', l: 'Pregunta diagnóstica (¿por qué pasó?)', ph: 'Ej.: ¿por qué fallan más las entregas los lunes?' },
          { c: 'Predictiva', l: 'Pregunta predictiva (¿qué pasará?)', ph: 'Ej.: ¿qué entregas tienen alta probabilidad de fallar mañana?' },
          { c: 'Prescriptiva', l: 'Pregunta prescriptiva (¿qué deberíamos hacer?)', ph: 'Ej.: ¿en qué orden y a qué hora visitar a cada cliente?' }
        ],
        pesos: { item: 25, pregunta: 25 }
      },
      {
        id: 'canvas', tipo: 'canvas', diap: 23, titulo: 'Sala 2 · Canvas "Del dato a la decisión"',
        intro: 'Cada rol llena su parte; la persona analista envía el canvas. Pueden corregirlo hasta el pitch.',
        roles: ROLES, niveles: TIPOS, nivelLabel: '¿Qué tipo de analítica es esa pregunta?', nivelCorto: 'Tipo de analítica',
        campos: [
          { rol: 0, c: 'Problema', l: 'Problema de negocio, en una frase', ph: 'Ej.: botamos el 8 % de los perecederos cada semana', ej: 'Perdemos el 15 % de las entregas en el primer intento.' },
          { rol: 0, c: 'Decisión', l: '¿Qué decisión queremos mejorar? ¿Quién la toma y cada cuánto?', ph: 'Ej.: el jefe de compras decide cada lunes cuánto pedir', ej: 'El coordinador de rutas asigna los pedidos cada mañana.' },
          { rol: 1, c: 'Fuentes de datos', l: 'Fuentes de datos (internas y externas)', ph: 'Ej.: ventas por caja, inventario, clima, festivos', ej: 'GPS, estados de entrega, reclamos, tráfico y clima.' },
          { rol: 1, c: 'Flujo de datos', l: '¿Cómo llegan los datos a un solo lugar? (ETL o ELT, almacén, herramienta)', ph: 'Ej.: cada noche se cargan al data warehouse y se analizan en la herramienta de BI', ej: 'Carga diaria al almacén de datos en la nube.' },
          { rol: 2, c: 'Pregunta clave', l: 'La pregunta clave que responderán', ph: 'Ej.: ¿cuánto venderemos de cada perecedero el próximo fin de semana?', ej: '¿Qué entregas tienen alta probabilidad de fallar mañana?', nivelDespues: true },
          { rol: 2, c: 'Indicador y meta', l: 'Indicador (KPI) que mostrará si la decisión mejoró, con su meta', ph: 'Ej.: % de perecederos botados; meta: de 8 % a 4 % en 6 meses', ej: '% de entregas exitosas al primer intento: de 85 % a 93 %.' },
          { rol: 3, c: 'Calidad del dato', l: 'Riesgo de calidad del dato y cómo lo validarían', ph: 'Ej.: el inventario del sistema no coincide con la bodega; conteos semanales', ej: 'Direcciones mal escritas; validación al tomar el pedido.' },
          { rol: 3, c: 'Frase del pitch', l: 'Frase del pitch: "Con este caso, [empresa] podrá… para…"', ph: 'Con este caso, nuestra empresa podrá… para…', ej: 'Con este caso, RutaÁgil podrá anticipar fallas para entregar a la primera.' }
        ],
        pesos: { campo: 20, nivel: 20 }
      },
      {
        id: 'voto', tipo: 'voto', diap: 25, titulo: 'Voto del público',
        pregunta: '¿Qué equipo presentó el caso que más ayudaría a su empresa a decidir mejor?',
        ayuda: 'Piensa en claridad del problema, datos realistas y valor para la decisión. No puedes votar por tu propio equipo.',
        pesos: { voto: 20 }
      },
      {
        id: 'cierre', tipo: 'texto', diap: 26, titulo: 'Cierre · Mi decisión con datos',
        pregunta: 'Una decisión de mi trabajo que podría tomar mejor con datos es…',
        ayuda: 'Una frase, sin datos confidenciales.', max: 160, vista: 'muro'
      }
    ]
  };
})();
