/* Módulo 5 · Sesión 2: Ciberseguridad, Zero Trust y gestión del riesgo. Versión gamificada: Operación Confianza Cero. */
(function () {
  var CONTROLES = [
    'MFA resistente a phishing (llaves o passkeys)',
    'Gestión del riesgo de proveedores',
    'Mínimo privilegio (acceso por rol)',
    'Revisión y retiro de accesos',
    'Microsegmentación de la red',
    'Monitoreo y alertas en tiempo real',
    'Copias de seguridad aisladas',
    'Cifrado de datos sensibles',
    'Inventario y clasificación de activos',
    'Capacitación y cultura',
    'Plan de respuesta a incidentes'
  ];
  window.CLASE = {
    titulo: 'Módulo 5 · Operación Confianza Cero: ciberseguridad y gestión del riesgo',
    juego: true,
    juegoNombre: 'Operación Confianza Cero',
    rankingTitulo: '🛡️ Los mejores analistas',
    medallas: [
      ['top', '🏆', 'Analista estrella', ' pts'],
      ['rapido', '⚡', 'Respuesta más rápida', ' pts de rapidez'],
      ['cazadores', '🛡️', 'Mejor estrategia Zero Trust', ' pts'],
      ['equipo', '🤝', 'Mejor equipo', ' pts']
    ],
    equipos: ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4', 'Equipo 5', 'Equipo 6'],
    reporte: {
      uso: [
        ['Haz el inventario de tus joyas de la corona:', 'los 5 sistemas o bases de datos que, si se caen o se filtran, detienen el negocio. Sin inventario no hay protección.'],
        ['Activa MFA en el correo y en los sistemas críticos', 'esta semana, empezando por las cuentas con más privilegios y las de proveedores.'],
        ['Revisa quién tiene acceso a qué', 'y retira hoy mismo las cuentas de personas que ya se fueron.'],
        ['Ensaya el "¿qué haríamos si…?"', 'con tu equipo: quién decide, a quién se avisa y dónde están las copias de seguridad aisladas.'],
        ['Lleva la conversación a la alta dirección', 'con 3 indicadores simples (cuentas con MFA, accesos revisados, días desde la última prueba de restauración).']
      ],
      fuentes: 'NIST SP 800-207 (Zero Trust Architecture, 2020); NIST CSF 2.0 (2024); Microsoft, principios de Zero Trust; Verizon DBIR 2025; casos públicos Keralty (2022) e IFX Networks (2023).'
    },
    actividades: [
      {
        id: 'equipo', tipo: 'equipo', diap: 3, titulo: 'Misión 0 · Elige tu equipo',
        intro: 'Bienvenido a la Operación Confianza Cero. ¿En qué equipo estás? Tu profesor te dirá cuál (es el número de tu sala).'
      },
      {
        id: 'entrada', tipo: 'texto', diap: 4, titulo: 'Arranque · Si mañana secuestran tus datos…',
        pregunta: 'Si mañana secuestran la base de datos de tu organización, ¿qué es lo primero que harías?',
        ayuda: 'Una o dos palabras.', max: 30, vista: 'nube'
      },
      {
        id: 'amenaza', tipo: 'quiz', diap: 5, titulo: 'Misión 1 · Detecta la amenaza',
        intro: '¿Qué tipo de amenaza es?',
        opciones: ['Phishing', 'Malware', 'Ransomware', 'Ingeniería social', 'Fuga de datos', 'Ataque interno', 'Error humano'],
        items: [
          { q: 'Te llega un SMS: "Tu envío está retenido. Paga $8.900 de reenvío aquí" con un enlace acortado.', a: 0, exp: 'Suplanta a una empresa confiable para robar datos de pago. Por SMS se llama smishing; por voz, vishing; con un código QR, quishing.' },
          { q: 'Un contratista instala un "visor de facturas" gratuito y desde entonces su equipo envía capturas de pantalla a un servidor desconocido.', a: 1, exp: 'Software malicioso que se instala sin consentimiento: en este caso, un programa espía (spyware).' },
          { q: 'Los servidores de una EPS amanecen bloqueados. Los atacantes piden un pago y amenazan con publicar las historias clínicas.', a: 2, exp: 'Ransomware con doble extorsión: cifran los datos y además los roban para presionar el pago. Así ocurrió con Keralty/Sanitas en noviembre de 2022.' },
          { q: 'Alguien llama a recepción, dice ser el gerente de TI, habla de una "emergencia" y pide el código que acaba de llegarle al celular.', a: 3, exp: 'Manipulación psicológica (urgencia y autoridad) para saltarse la verificación en dos pasos. Ningún área de TI legítima pide ese código.' },
          { q: 'Aparece a la venta en un foro un archivo con los datos de 40.000 clientes de una tienda en línea. Aún nadie sabe cómo salió.', a: 4, exp: 'La información sensible quedó expuesta fuera de la organización. La causa se investiga después: puede ser un ataque, un error o alguien de adentro.' },
          { q: 'Un administrador de sistemas, molesto porque no lo ascendieron, borra a propósito las copias de seguridad antes de renunciar.', a: 5, exp: 'Daño deliberado de alguien con acceso legítimo. Se previene con mínimo privilegio, registro de actividad y retiro inmediato de accesos.' },
          { q: 'Alguien comparte la carpeta de contratos con "cualquier persona con el enlace" y el enlace termina en un grupo público.', a: 6, exp: 'Una configuración equivocada, sin mala intención. El factor humano está presente en cerca del 60 % de las brechas (Verizon DBIR 2025).' },
          { q: 'Recibes un audio de WhatsApp con la voz del gerente pidiendo transferir urgente a un proveedor nuevo. La voz fue clonada con IA.', a: 3, exp: 'Ingeniería social potenciada con IA (deepfake de voz). Regla de oro: verificar por otro canal antes de mover dinero.' }
        ]
      },
      {
        id: 'auditoria', tipo: 'escala', diap: 15, titulo: 'Misión 2 · Auditoría relámpago',
        etiqueta: 'Nivel de protección de tu organización',
        intro: 'Califica tu organización de 1 (nada cierto) a 5 (totalmente cierto). Es anónimo y no debes escribir datos confidenciales.',
        grupos: [
          { k: 'Gestión de activos', items: ['Sabemos cuáles son nuestros sistemas e información críticos (CRM, ERP, bases de clientes).', 'Cada tecnología nueva (nube, IA, IoT) se inventaría y se evalúa su riesgo antes de usarla.'] },
          { k: 'Control de accesos', items: ['Cada persona solo tiene acceso a lo que necesita para su cargo.', 'Usamos verificación en dos pasos (MFA) en el correo y en los sistemas críticos.', 'Cuando alguien se va, sus accesos se retiran el mismo día.'] },
          { k: 'Seguridad física', items: ['Las áreas con servidores o equipos críticos tienen control de ingreso.', 'Hay reglas claras para usar equipos fuera de la oficina (trabajo híbrido).'] },
          { k: 'Roles y gobierno', items: ['La alta dirección revisa los riesgos digitales con indicadores, no solo el área de TI.', 'Todos sabemos qué hacer y a quién avisar ante un incidente.'] }
        ],
        reco: {
          'Gestión de activos': 'haz una lista de los 5 sistemas o bases de datos sin los cuales el negocio se detiene, con su dueño y su nivel de sensibilidad.',
          'Control de accesos': 'activa MFA en el correo y en las cuentas con más privilegios, y revisa cada trimestre quién tiene acceso a qué.',
          'Seguridad física': 'define reglas mínimas para portátiles fuera de la oficina: cifrado de disco, bloqueo de pantalla y borrado remoto.',
          'Roles y gobierno': 'nombra un responsable, define a quién se avisa ante un incidente y lleva 3 indicadores de riesgo al comité directivo.'
        }
      },
      {
        id: 'zt', tipo: 'quiz', diap: 18, titulo: 'Misión 3 · ¿Qué principio de Zero Trust es?',
        intro: '¿Qué principio de Zero Trust se está aplicando?',
        opciones: ['Verificar explícitamente', 'Mínimo privilegio', 'Asumir la brecha'],
        items: [
          { q: 'Aunque Juan ya inició sesión hoy, al abrir la nómina desde un país nuevo el sistema le pide otra vez su huella.', a: 0, exp: 'Cada acceso se evalúa con todas las señales disponibles (identidad, ubicación, dispositivo), no solo al entrar a la red.' },
          { q: 'El practicante de mercadeo puede ver las campañas, pero no la base de datos de nómina.', a: 1, exp: 'Cada persona accede solo a lo que necesita para su trabajo (acceso por rol).' },
          { q: 'La red está dividida en zonas: si un atacante entra por el wifi de invitados, no llega a los servidores de pagos.', a: 2, exp: 'Microsegmentación: se diseña pensando que alguien ya entró, para limitar hasta dónde puede llegar.' },
          { q: 'El proveedor de soporte recibe acceso solo al servidor que debe reparar y solo por 4 horas.', a: 1, exp: 'Mínimo privilegio también en el tiempo: acceso justo a tiempo (just-in-time) y que vence solo.' },
          { q: 'Un portátil sin actualizaciones de seguridad no puede entrar al ERP, aunque la contraseña sea correcta.', a: 0, exp: 'Se verifica también el estado del dispositivo, no solo quién es la persona.' },
          { q: 'La empresa cifra la base de clientes y ensaya cada trimestre su plan de respuesta, como si el atacante ya estuviera adentro.', a: 2, exp: 'Asumir la brecha: reducir el daño posible (cifrado, segmentación) y estar listos para responder y recuperarse.' }
        ]
      },
      {
        id: 'superficie', tipo: 'multi', diap: 22, titulo: 'Misión 4 · Mapa de superficie de ataque', color: 'var(--blue)',
        intro: '¿Qué hace parte del ecosistema digital de tu organización? Marca todo lo que aplique.',
        opciones: ['Equipos personales de los empleados (BYOD)', 'Aplicaciones en la nube (SaaS)', 'Proveedores con acceso a nuestros sistemas', 'Clientes conectados (app o portal)', 'Trabajo híbrido o remoto', 'APIs e integraciones con otras empresas', 'IA generativa usada por los empleados', 'Dispositivos IoT (cámaras, sensores)']
      },
      {
        id: 'mision', tipo: 'riesgos', diap: 25, titulo: 'Misión 5 · Rescate Digitech',
        intro: 'Una persona por equipo envía la tabla. Pueden corregirla hasta que el profesor revele los puntajes.',
        controles: CONTROLES,
        alerta: 'ALERTA: el proveedor de soporte TI de Digitech confirma que le robaron la contraseña a un técnico que tiene acceso remoto a los servidores.',
        fases: [
          { t: 'Un técnico del proveedor de soporte cae en un phishing y entrega su contraseña. No tenía MFA.', b: [0, 1, 9] },
          { t: 'Esa cuenta tenía permisos de administrador sobre toda la nube de Digitech, y nadie los había revisado en dos años.', b: [2, 3] },
          { t: 'Desde la nube, el atacante se mueve hasta la base de clientes a las 3 a. m., sin que suene ninguna alerta.', b: [4, 5] },
          { t: 'Roba la base de clientes, cifra los servidores y pide rescate. Las copias de seguridad estaban en la misma red.', b: [6, 7, 8, 10] }
        ],
        pesos: { fila: 40, alerta: 40, fase: 35 }
      },
      {
        id: 'cierre', tipo: 'texto', diap: 30, titulo: 'Cierre · Mi decisión Zero Trust',
        pregunta: 'Una decisión Zero Trust que tomaría el lunes en mi organización es…',
        ayuda: 'Una frase, sin datos confidenciales.', max: 160, vista: 'muro'
      }
    ]
  };
})();
