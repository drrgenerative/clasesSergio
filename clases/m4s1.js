/* Módulo 4 · Sesión 1: panorama de la inteligencia artificial en la empresa. */
(function () {
  var TEC = ['RPA', 'IA predictiva', 'IA generativa', 'Agente de IA', 'Todavía no'];
  var EMPRESAS = [
    { n: 'Clínica Andes', sector: 'Salud', riesgo: 'Los datos de salud son datos sensibles: requieren autorización expresa y mucha seguridad. Toda sugerencia clínica la revisa un médico.', retos: [
      { t: 'Pasar cada día las citas de 3 sistemas distintos a una sola agenda y enviar los recordatorios.', a: 0, exp: 'Tarea repetitiva, con reglas fijas y datos estructurados.' },
      { t: 'Priorizar las radiografías con sospecha de neumonía para que el radiólogo las vea primero.', a: 1, exp: 'Reconocer patrones en imágenes, como Zebra (hoy Nanox AI). Siempre con revisión médica.' },
      { t: 'Resumir la historia clínica del paciente antes de la consulta.', a: 2, exp: 'Crea un texto nuevo a partir de información existente. El médico revisa antes de usarlo.' },
      { t: 'Predecir qué pacientes probablemente no asistirán a su cita.', a: 1, exp: 'Aprende de datos históricos para anticipar un comportamiento.' },
      { t: 'Un asistente que, por WhatsApp, consulta la agenda, reprograma la cita y confirma con el paciente.', a: 3, exp: 'Cumple un objetivo de varios pasos usando varias herramientas.' }
    ] },
    { n: 'MercaYa', sector: 'Retail', riesgo: 'Fijar precios o mostrar ofertas según el perfil de las personas puede discriminar. Hay que definir reglas claras y revisarlas.', retos: [
      { t: 'Pronosticar cuánto venderá cada tienda la próxima semana.', a: 1, exp: 'Predicción a partir de ventas históricas, clima y temporada.' },
      { t: 'Escribir las fichas de 5.000 productos nuevos y los textos de las campañas.', a: 2, exp: 'Contenido nuevo a partir de instrucciones. Una persona revisa antes de publicar.' },
      { t: 'Cruzar cada factura de proveedor con su orden de compra en el sistema contable.', a: 0, exp: 'Reglas fijas y datos estructurados: el caso típico de RPA.' },
      { t: 'Atender una devolución de punta a punta: revisar la foto del producto, aprobar y generar la guía de envío.', a: 3, exp: 'Varios pasos y herramientas, escalando a una persona los casos dudosos (como hace Mercado Libre).' },
      { t: 'Subir o bajar precios por barrio según el perfil de quienes viven ahí.', a: 4, exp: 'Técnicamente es IA predictiva, pero puede discriminar. Sin reglas claras y revisión, todavía no.' }
    ] },
    { n: 'TransCarga', sector: 'Logística', riesgo: 'Monitorear a los conductores con IA toca su privacidad: hay que informarles qué se mide y para qué.', retos: [
      { t: 'Optimizar las rutas de 200 camiones según el tráfico y las entregas del día.', a: 1, exp: 'Optimización y predicción con muchos datos cambiantes.' },
      { t: 'Digitar en el sistema los manifiestos que los clientes envían en una plantilla de Excel fija.', a: 0, exp: 'Datos estructurados y siempre el mismo formato.' },
      { t: 'Anticipar qué camión va a fallar según los sensores del motor.', a: 1, exp: 'Mantenimiento predictivo: aprende de patrones previos a una falla.' },
      { t: 'Responder "¿dónde está mi envío?" y reprogramar la entrega con el cliente.', a: 3, exp: 'Consulta sistemas, decide y actúa para resolver la solicitud completa.' },
      { t: 'Convertir las notas de voz de los conductores en informes de incidentes.', a: 2, exp: 'Transcribe y redacta un texto nuevo y ordenado.' }
    ] },
    { n: 'EduFuturo', sector: 'Educación', riesgo: 'Las decisiones sobre las personas (notas, admisiones, becas) necesitan revisión humana y una forma de reclamar.', retos: [
      { t: 'Validar que los documentos de matrícula estén completos y pasar los datos entre sistemas.', a: 0, exp: 'Reglas claras sobre datos estructurados.' },
      { t: 'Identificar a los estudiantes en riesgo de abandonar el programa.', a: 1, exp: 'Predicción con datos académicos y de asistencia, para intervenir a tiempo.' },
      { t: 'Generar bancos de preguntas de práctica para cada curso.', a: 2, exp: 'Contenido nuevo que el docente revisa.' },
      { t: 'Acompañar al aspirante en toda la inscripción: resolver dudas, revisar requisitos y agendar la entrevista.', a: 3, exp: 'Objetivo de varios pasos con varias herramientas.' },
      { t: 'Que la IA califique sola los exámenes finales, sin revisión del docente.', a: 4, exp: 'Decisión con impacto importante en la persona: necesita revisión humana.' }
    ] },
    { n: 'AgroValle', sector: 'Agroindustria', riesgo: 'Sin datos digitales y confiables no hay IA que funcione: primero hay que ordenar los datos.', retos: [
      { t: 'Detectar plagas en las fotos que toman los drones.', a: 1, exp: 'Reconocimiento de patrones en imágenes.' },
      { t: 'Consolidar cada lunes los reportes de 30 fincas en un mismo Excel.', a: 0, exp: 'Tarea repetitiva con formato fijo.' },
      { t: 'Redactar y traducir la documentación de exportación.', a: 2, exp: 'Redacción y traducción, con revisión de una persona.' },
      { t: 'Predecir el precio de venta de la cosecha, aunque los datos de ventas están en cuadernos de cada finca.', a: 4, exp: 'Sin datos digitales y confiables no hay IA: primero hay que digitalizar.' },
      { t: 'Un sistema que monitorea los sensores de riego, decide cuándo regar, abre las válvulas y avisa al agrónomo.', a: 3, exp: 'Percibe, decide y actúa por sí solo dentro de límites definidos.' }
    ] },
    { n: 'Luz del Caribe', sector: 'Servicios públicos', riesgo: 'Una decisión con efectos graves (como cortar un servicio) no debe tomarse sin revisión humana ni posibilidad de reclamar.', retos: [
      { t: 'Detectar posibles conexiones ilegales analizando los patrones de consumo.', a: 1, exp: 'Detección de anomalías en datos históricos.' },
      { t: 'Copiar las PQRS que llegan por el formulario web al sistema comercial.', a: 0, exp: 'Datos estructurados y pasos fijos.' },
      { t: 'Redactar respuestas a las PQRS en lenguaje claro.', a: 2, exp: 'Redacción de texto nuevo, revisado por una persona.' },
      { t: 'Atender un reporte de daño: crear la orden de trabajo, asignar la cuadrilla y avisar al cliente.', a: 3, exp: 'Varios pasos coordinados entre sistemas.' },
      { t: 'Cortar el servicio automáticamente a quien la IA marque como sospechoso de fraude.', a: 4, exp: 'Decisión con efectos graves sin revisión humana: así no.' }
    ] }
  ];

  window.CLASE = {
    titulo: 'Módulo 4 · Panorama de la IA en la empresa',
    tecnologias: TEC,
    empresas: EMPRESAS,
    reporte: {
      uso: [
        ['Empieza por el reto de negocio, no por la tecnología.', 'Escribe el problema en una frase y cómo medirías el éxito.'],
        ['Elige la tecnología según la tarea:', 'reglas fijas → RPA; patrones y predicción → IA; contenido nuevo → IA generativa; objetivos de varios pasos → agente de IA, siempre con supervisión.'],
        ['Pasa el semáforo ético antes de cualquier piloto:', 'datos personales (Ley 1581 de 2012), revisión humana en las decisiones importantes y transparencia con clientes y empleados.'],
        ['Empieza con un piloto pequeño y medible', 'y revisa si tu organización está lista (madurez digital, módulo 3).']
      ],
      fuentes: 'WEF, Future of Jobs Report 2025; CONPES 4144 de 2025; SIC, Circular Externa 002 de 2024; OpenAI, caso Mercado Libre; ANDI, caso Ecopetrol.'
    },
    actividades: [
      {
        id: 'uso', tipo: 'multi', diap: 3, titulo: 'La IA y tú', color: 'var(--blue)',
        intro: '¿Qué herramientas de IA usaste en la última semana? Marca todas las que apliquen.',
        opciones: ['ChatGPT', 'Gemini', 'Microsoft Copilot', 'Meta AI (WhatsApp, Instagram)', 'Claude', 'Otra', 'Ninguna']
      },
      {
        id: 'sentir', tipo: 'texto', diap: 3, titulo: 'Lo que sientes',
        pregunta: 'En una palabra: ¿qué sientes frente a la IA en tu trabajo?',
        ayuda: 'Una o dos palabras.', max: 40, vista: 'nube'
      },
      {
        id: 'tecnologia', tipo: 'quiz', diap: 11, titulo: '¿Qué tecnología es?',
        intro: '¿Qué tecnología resuelve mejor este caso?',
        opciones: ['RPA', 'IA predictiva', 'IA generativa', 'Agente de IA'],
        items: [
          { q: 'Cada noche, un robot de software copia los pedidos que llegan por correo al sistema contable, siguiendo siempre los mismos pasos.', a: 0, exp: 'Reglas fijas, datos estructurados y siempre los mismos pasos.' },
          { q: 'Netflix te recomienda series según lo que has visto.', a: 1, exp: 'Aprende de tu historial y del de millones de personas para predecir qué te gustará.' },
          { q: 'Una herramienta escribe el primer borrador de un contrato a partir de una instrucción.', a: 2, exp: 'Crea contenido nuevo a partir de una instrucción en lenguaje natural.' },
          { q: 'Le pides "organiza mi viaje a Medellín el jueves": busca vuelos, compara precios, reserva dentro del presupuesto y lo agenda, pidiéndote confirmación antes de pagar.', a: 3, exp: 'Recibe un objetivo, planea los pasos y usa varias herramientas para cumplirlo, con un humano que aprueba.' },
          { q: 'Una aseguradora detecta reclamaciones sospechosas comparándolas con millones de casos anteriores.', a: 1, exp: 'Detecta patrones y anomalías en datos históricos.' },
          { q: 'Mercado Libre resume en un párrafo las cientos de reseñas de un producto.', a: 2, exp: 'Genera un texto nuevo a partir de muchos textos. Mercado Libre lo hace con un modelo de lenguaje.' },
          { q: 'Cada mes, un sistema genera el certificado de ingresos de 2.000 empleados y se lo envía a cada uno por correo.', a: 0, exp: 'Tarea masiva, repetitiva y basada en reglas.' },
          { q: 'Un asistente lee el reclamo, revisa la foto del producto dañado, aprueba la devolución y genera la guía de envío. Los casos dudosos los pasa a una persona.', a: 3, exp: 'Combina varias capacidades y herramientas para resolver el caso completo. Así funciona el agente de servicio al cliente de Mercado Libre.' }
        ]
      },
      {
        id: 'roles', tipo: 'encuesta', diap: 18, titulo: '¿Qué pasará con estos roles?',
        intro: 'De aquí a 2030, ¿qué crees que pasará con la demanda de este rol?',
        opciones: ['Disminuye', 'Se transforma', 'Crece'],
        items: [
          { q: 'Cajero o cajera', nota: 'Según el Foro Económico Mundial, está entre los roles que más disminuirán hacia 2030.' },
          { q: 'Asistente administrativo', nota: 'También está entre los que más disminuirán: muchas de sus tareas son repetitivas y basadas en reglas.' },
          { q: 'Diseñador o diseñadora gráfica', nota: 'Aparece por primera vez entre los roles que más disminuyen, por la IA generativa. Quien integra la IA a su trabajo se transforma.' },
          { q: 'Conductor o conductora de entregas', nota: 'Está entre los que más crecerán en número de empleos, impulsado por el comercio electrónico.' },
          { q: 'Profesional de enfermería', nota: 'Crece: los trabajos de cuidado son de los más difíciles de automatizar.' },
          { q: 'Especialista en IA y datos', nota: 'Está entre los de mayor crecimiento. Las habilidades de IA y datos son las de demanda que más rápido sube.' }
        ]
      },
      {
        id: 'semaforo', tipo: 'encuesta', diap: 21, titulo: 'Semáforo ético',
        intro: '¿Verde, amarillo o rojo?',
        opciones: ['Verde: adelante', 'Amarillo: con cuidado', 'Rojo: así no'],
        items: [
          { q: 'Una aerolínea pone un chatbot en su web. El chatbot le dice a un cliente que puede pedir un descuento después del viaje, aunque la política real no lo permite.', nota: 'Caso real: Air Canada (2024). Un tribunal de Canadá obligó a la aerolínea a cumplir lo que dijo su chatbot. La empresa responde por lo que dice su IA.' },
          { q: 'Unos ingenieros pegan código confidencial de su empresa en un chatbot público para que les ayude a corregirlo.', nota: 'Caso real: Samsung (2023). Tras la filtración, la empresa restringió el uso de IA generativa. Regla de oro: no pegar información confidencial en herramientas públicas.' },
          { q: 'Una empresa entrena una IA con las hojas de vida de sus contrataciones de los últimos 10 años para filtrar candidatos.', nota: 'Caso real: Amazon (2018). La herramienta penalizaba hojas de vida de mujeres porque aprendió de un histórico mayoritariamente masculino, y la empresa la abandonó. Los datos históricos traen sesgos.' },
          { q: 'Una clínica usa IA para resumir historias clínicas. El médico revisa el resumen antes de usarlo y los pacientes autorizaron el tratamiento de sus datos.', nota: 'Lectura sugerida: amarillo o verde. Hay revisión humana y autorización, pero son datos sensibles: el proveedor debe garantizar la seguridad (Ley 1581 y Circular 002 de 2024 de la SIC).' },
          { q: 'Una empresa de servicios públicos corta el servicio automáticamente cuando la IA detecta un posible fraude.', nota: 'Lectura sugerida: rojo. Una decisión con efectos graves para una persona no debería tomarse sin revisión humana ni posibilidad de reclamar.' },
          { q: 'Mercadeo usa IA generativa para crear imágenes de campaña, revisa que no copien obras protegidas y lo indica cuando corresponde.', nota: 'Lectura sugerida: verde. Hay revisión humana, cuidado con los derechos de autor y transparencia.' }
        ]
      },
      {
        id: 'consultoria', tipo: 'consultoria', diap: 24, titulo: 'Consultores de IA',
        intro: 'Una sola persona por sala envía el análisis del equipo.'
      },
      {
        id: 'feria', tipo: 'reparto', diap: 25, titulo: 'Feria de pilotos',
        intro: 'Eres el comité de inversión. Reparte 100 puntos entre los pilotos que más te convencieron. No le des puntos al de tu propio equipo.',
        opciones: EMPRESAS.map(function (e) { return e.n + ' (' + e.sector + ')'; })
      },
      {
        id: 'cierre', tipo: 'texto', diap: 26, titulo: 'Me llevo…',
        pregunta: 'Una idea que me llevo de hoy y una pregunta que me queda sobre la IA.',
        ayuda: 'Una o dos frases.', max: 220, vista: 'muro'
      }
    ]
  };
})();
