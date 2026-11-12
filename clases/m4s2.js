/* Módulo 4 · Sesión 2: Automatización de procesos con RPA. Versión gamificada: BotFactory. */
(function () {
  var R = 0, P = 1, E = 2; /* Robot, Persona, Eliminar */
  window.CLASE = {
    titulo: 'Módulo 4 · BotFactory: automatización de procesos con RPA',
    juego: true,
    equipos: ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4', 'Equipo 5', 'Equipo 6'],
    procesos: [
      { n: 'Reembolso de gastos de viaje', pasos: [
        { t: 'El empleado diligencia el formulario de gastos y adjunta las facturas.', d: '20 min', a: P, exp: 'Es la entrada del proceso: la persona sabe qué gastó. Puede hacerlo en un formulario digital.' },
        { t: 'Imprime el formulario, lo firma, lo escanea y lo envía por correo a su jefe.', d: '15 min', a: E, exp: 'No agrega valor: con un formulario digital y aprobación en línea, este paso sobra.' },
        { t: 'El jefe revisa y aprueba el gasto.', d: 'Espera promedio: 6 días', a: P, exp: 'Requiere criterio. Es el cuello de botella: un robot puede recordarle al jefe, pero la decisión es humana.' },
        { t: 'Contabilidad copia los datos del formulario al sistema contable.', d: '10 min', a: R, exp: 'Copiar datos estructurados de un sistema a otro: trabajo típico de RPA.' },
        { t: 'Contabilidad verifica que cada factura tenga NIT, fecha y valor correctos.', d: '15 min', a: R, exp: 'Reglas claras y verificables: lo puede hacer un robot.' },
        { t: 'Si falta algo, le escribe al empleado para que corrija y el proceso vuelve a empezar.', d: '1 a 3 días', a: R, exp: 'El aviso puede ser automático en el momento en que se detecta el error.' },
        { t: 'Tesorería programa el pago en el portal del banco.', d: '10 min', a: R, exp: 'Pasos fijos en un portal: RPA, con un control humano del lote de pagos.' },
        { t: 'Se envía un correo al empleado avisando que se hizo el pago.', d: '5 min', a: R, exp: 'Notificación con plantilla: automatizable.' }
      ], cuello: 2 },
      { n: 'Ingreso de un empleado nuevo', pasos: [
        { t: 'Talento humano verifica que el contrato y los documentos estén completos y firmados.', d: '30 min', a: P, exp: 'Tiene implicaciones legales: una persona lo revisa (un robot puede preparar la lista de chequeo).' },
        { t: 'Copia los datos del empleado en el sistema de nómina.', d: '15 min', a: R, exp: 'Copiar datos estructurados: RPA.' },
        { t: 'Copia los mismos datos en el sistema de seguridad social.', d: '15 min', a: R, exp: 'Es la misma información digitada dos veces: RPA.' },
        { t: 'Envía un correo a TI pidiendo crear el usuario, el correo y los accesos.', d: '5 min', a: R, exp: 'Solicitud con datos fijos: se genera sola.' },
        { t: 'TI crea el usuario y los accesos según el cargo.', d: 'Espera promedio: 4 días', a: R, exp: 'Es el cuello de botella. Con reglas por cargo, un robot crea los accesos en minutos.' },
        { t: 'Imprime el reglamento interno para que el empleado lo firme.', d: '10 min', a: E, exp: 'Con firma electrónica, imprimir sobra.' },
        { t: 'El jefe da la bienvenida y explica las funciones del cargo.', d: '1 hora', a: P, exp: 'Es relación humana: no se automatiza.' },
        { t: 'Se agenda la inducción en el calendario del empleado.', d: '5 min', a: R, exp: 'Agenda con reglas fijas: automatizable.' }
      ], cuello: 4 },
      { n: 'Atención de una queja (PQRS)', pasos: [
        { t: 'El cliente envía la queja por el formulario web.', d: '—', a: P, exp: 'Es la entrada del proceso: la hace el cliente.' },
        { t: 'Un auxiliar copia la queja del formulario a una hoja de Excel.', d: '10 min', a: R, exp: 'Copiar datos de un formulario a otro: RPA.' },
        { t: 'El auxiliar reenvía la queja por correo al área responsable.', d: '5 min', a: R, exp: 'Con reglas por tipo de queja, el robot la asigna solo.' },
        { t: 'La queja espera en la bandeja del área hasta que alguien la lee.', d: 'Espera promedio: 5 días', a: R, exp: 'Es el cuello de botella. Asignación automática y alertas de vencimiento la reducen.' },
        { t: 'Un analista estudia el caso y decide la solución.', d: '40 min', a: P, exp: 'Requiere criterio y empatía.' },
        { t: 'Se imprime la respuesta, se firma y se escanea.', d: '15 min', a: E, exp: 'No agrega valor: con firma digital, sobra.' },
        { t: 'Se envía la respuesta al cliente y se actualiza el Excel.', d: '10 min', a: R, exp: 'Envío y registro con plantilla: RPA.' },
        { t: 'Cada mes se cuenta cuántas quejas se respondieron a tiempo.', d: '3 horas', a: R, exp: 'Un reporte con datos ya registrados: automatizable.' }
      ], cuello: 3 }
    ],
    reporte: {
      uso: [
        ['Escoge una tarea repetitiva y basada en reglas', 'que hagas cada semana. Escríbela paso a paso, como una receta.'],
        ['Dibuja el AS-IS y busca el cuello de botella', 'antes de pensar en el robot: a veces la mejora es eliminar un paso.'],
        ['Mide antes de automatizar', '(cuánto tiempo toma hoy) para poder demostrar el ahorro después.'],
        ['Prueba gratis', 'con Power Automate Desktop (incluido en Windows) o UiPath Community, empezando por un flujo sencillo.']
      ],
      fuentes: 'BPMN 2.0 (Object Management Group); Microsoft, Power Automate Desktop; UiPath Community; ANDI, caso Ecopetrol.'
    },
    actividades: [
      {
        id: 'equipo', tipo: 'equipo', diap: 3, titulo: 'Nivel 0 · Elige tu equipo',
        intro: 'Bienvenido a BotFactory. ¿En qué equipo estás? Tu profesor te dirá cuál.'
      },
      {
        id: 'robot', tipo: 'quiz', diap: 6, titulo: 'Nivel 1 · ¿Robot o humano?',
        intro: '¿Quién debería hacer esta tarea?',
        opciones: ['Robot de RPA', 'Necesita IA', 'Una persona'],
        items: [
          { q: 'Descargar cada mañana el reporte de ventas del sistema, pegarlo en Excel y enviarlo por correo al gerente.', a: 0, exp: 'Pasos fijos, datos estructurados y alto volumen: RPA puro.' },
          { q: 'Leer los correos de clientes molestos y decidir qué tan urgente es cada uno.', a: 1, exp: 'El texto es libre y hay que entender el tono: necesita IA (y supervisión).' },
          { q: 'Negociar con un proveedor un descuento por volumen.', a: 2, exp: 'Negociar requiere criterio, relación y confianza.' },
          { q: 'Conciliar cada mes los pagos del extracto bancario con las facturas del sistema.', a: 0, exp: 'Comparar datos con reglas claras: un clásico de RPA.' },
          { q: 'Extraer los datos de fotos de documentos de identidad escaneados.', a: 1, exp: 'Leer imágenes requiere reconocimiento con IA; luego un robot puede registrar los datos.' },
          { q: 'Crear el usuario, el correo y los accesos de cada empleado nuevo según su cargo.', a: 0, exp: 'Con reglas por cargo, es una tarea repetitiva perfecta para RPA.' },
          { q: 'Contarle a un empleado que su cargo va a cambiar por la automatización.', a: 2, exp: 'Una conversación difícil siempre es humana.' },
          { q: 'Aprobar o rechazar solicitudes de vacaciones según una tabla fija de días disponibles y fechas bloqueadas.', a: 0, exp: 'Si las reglas son fijas, un robot puede decidir. Los casos especiales van a una persona.' }
        ]
      },
      {
        id: 'bpmn', tipo: 'quiz', diap: 12, titulo: 'Nivel 2 · Habla BPMN',
        intro: '¿Con qué símbolo se dibuja esto en un mapa de procesos?',
        opciones: ['Tarea (rectángulo)', 'Decisión (rombo)', 'Inicio o fin (círculo)'],
        items: [
          { q: 'Llega la solicitud de compra.', a: 2, exp: 'Es lo que dispara el proceso: un evento de inicio, que en BPMN es un círculo.' },
          { q: 'Revisar que la factura tenga todos los datos.', a: 0, exp: 'Es una actividad que alguien realiza: una tarea.' },
          { q: '¿El monto supera los 5 millones de pesos?', a: 1, exp: 'Es una pregunta que divide el camino: una decisión (en BPMN, una compuerta).' },
          { q: 'Pago realizado.', a: 2, exp: 'Es el resultado final: un evento de fin, un círculo de borde grueso.' },
          { q: 'Registrar el pago en el sistema contable.', a: 0, exp: 'Es una actividad: una tarea.' },
          { q: '¿El proveedor ya está registrado?', a: 1, exp: 'Pregunta con dos caminos posibles: una decisión.' }
        ]
      },
      {
        id: 'cuello', tipo: 'pasos', diap: 13, titulo: 'Nivel 3 · Caza del cuello de botella',
        intro: 'Una persona por equipo envía la misión.'
      },
      {
        id: 'roto', tipo: 'quiz', diap: 18, titulo: 'Jefe final · ¡El bot se rompió!',
        intro: '¿Cuál es el desafío detrás de esta falla?',
        opciones: ['Datos de mala calidad', 'El sistema o el formato cambió', 'Falta de gobierno y seguridad', 'El proceso no estaba bien definido', 'No se midió el resultado'],
        items: [
          { q: 'El proveedor cambió el diseño de su portal web y el bot ya no encuentra el botón "Descargar".', a: 1, exp: 'Los bots dependen de la pantalla: hay que monitorearlos y darles mantenimiento.' },
          { q: 'El bot registró 300 clientes con la cédula en el campo del teléfono porque el Excel venía desordenado.', a: 0, exp: 'Basura entra, basura sale: hay que validar la calidad de los datos de entrada.' },
          { q: 'Nadie sabe quién creó el bot; usa la contraseña personal de alguien que se fue de la empresa y dejó de funcionar.', a: 2, exp: 'Cada bot necesita un dueño y credenciales propias. Para eso sirve un centro de excelencia en automatización.' },
          { q: 'Cada área hacía las compras a su manera y el bot falla con la mitad de las solicitudes.', a: 3, exp: 'Primero se mapea y se estandariza el proceso (AS-IS → TO-BE), después se automatiza.' },
          { q: 'El bot funciona, pero nadie midió cuánto tiempo tomaba antes y la gerencia no sabe si valió la pena.', a: 4, exp: 'Sin línea base no hay ROI que mostrar: mide antes de automatizar.' }
        ]
      },
      {
        id: 'mibot', tipo: 'mibot', diap: 19, titulo: 'Nivel 5 · Mi primer bot',
        intro: 'Piensa en una tarea que haces cada semana en tu trabajo y escríbela paso a paso, como una receta. No incluyas datos confidenciales.'
      },
      {
        id: 'cierre', tipo: 'texto', diap: 20, titulo: 'Lo que me llevo de BotFactory',
        pregunta: 'La primera tarea que le daría a un robot en mi trabajo es…',
        ayuda: 'Una frase.', max: 160, vista: 'muro'
      }
    ]
  };
})();
