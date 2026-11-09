/* Actividades de la clase. Para otra clase, basta con cambiar este archivo. */
window.CLASE = {
  titulo: 'Módulo 3 · Madurez digital, cultura y resistencia al cambio',
  actividades: [
    {
      id: 'palabra', tipo: 'texto', diap: 3, titulo: 'Puente con los 4 líderes',
      pregunta: 'En una palabra: ¿qué hizo diferente el líder que analizaste en la clase pasada?',
      ayuda: 'Una o dos palabras.', max: 40, vista: 'nube'
    },
    {
      id: 'perfil', tipo: 'quiz', diap: 6, titulo: '¿Qué perfil es?',
      intro: 'Según la matriz MIT-Capgemini, ¿qué perfil tiene cada empresa?',
      opciones: ['Principiante', 'Conservadora', 'Fashionista', 'Digital master'],
      items: [
        { q: 'Tiene app, chatbot, redes sociales y pilotos de IA, pero cada área compra tecnología por su lado y nadie mide resultados.', a: 2, exp: 'Mucha tecnología, poca dirección: alta intensidad digital y baja gestión de la transformación.' },
        { q: 'La junta tiene una visión digital clara y un comité que la gobierna, pero casi todo sigue en papel y en sistemas antiguos.', a: 1, exp: 'Buena gestión y gobierno, pero poca tecnología en uso: avanza con cautela.' },
        { q: 'No tiene estrategia digital, trabaja con correo y hojas de cálculo, y el gerente cree que "lo digital es para las empresas grandes".', a: 0, exp: 'Baja intensidad digital y baja gestión: está empezando.' },
        { q: 'Tiene una estrategia digital clara, decide con datos en tiempo real, automatizó sus procesos y sus equipos experimentan cada semana.', a: 3, exp: 'Alta tecnología y alta gestión: tecnología con propósito y liderazgo.' },
        { q: 'Lanzó una billetera digital muy llamativa, pero la junta no la conoce y la operación sigue igual detrás de la pantalla.', a: 2, exp: 'Una iniciativa vistosa sin estrategia ni cambio en la operación.' },
        { q: 'Aprobó un plan de transformación con presupuesto y responsables, pero todavía usa pocas herramientas digitales.', a: 1, exp: 'Primero el gobierno y el plan; la tecnología viene después.' }
      ]
    },
    {
      id: 'madurez', tipo: 'escala', diap: 12, titulo: 'Autodiagnóstico de madurez digital',
      intro: 'Piensa en tu organización. Califica cada afirmación de 1 (nada cierto) a 5 (totalmente cierto).',
      grupos: [
        { k: 'Estrategia', items: ['Tenemos una hoja de ruta o un plan estratégico digital.', 'Los objetivos digitales están dentro del plan estratégico general.', 'Medimos el impacto de lo digital (ROI, OKR, indicadores de adopción).', 'Existe una visión compartida sobre el papel de la transformación digital.'] },
        { k: 'Liderazgo', items: ['El comité directivo participa activamente en las decisiones digitales.', 'Los líderes reciben formación en competencias digitales.', 'Los líderes comunican el propósito digital a sus equipos.', 'Hay presupuesto, tiempo y recursos asignados a iniciativas digitales.'] },
        { k: 'Infraestructura', items: ['Usamos plataformas en la nube y sistemas integrados.', 'Los procesos críticos están automatizados.', 'La seguridad de la información sigue estándares internacionales (ej. ISO 27001).', 'Podemos lanzar nuevos servicios digitales con rapidez.'] },
        { k: 'Talento', items: ['Conocemos las brechas de habilidades digitales de la gente.', 'Hay formación continua: reskilling y upskilling.', 'Hay prácticas de innovación abierta o emprendimiento interno.', 'Se estimula la experimentación controlada.'] },
        { k: 'Cambio', items: ['Hay una estrategia de gestión del cambio (comunicación, formación, acompañamiento).', 'Trabajamos con modelos ágiles (Scrum, células, equipos multidisciplinarios).', 'Ajustamos procesos con métricas y ciclos cortos de mejora.', 'Escuchamos a la gente con encuestas, foros o acompañamiento.'] }
      ]
    },
    {
      id: 'cultura4', tipo: 'encuesta', diap: 15, titulo: '¿Qué cultura tenía?',
      intro: 'Con lo que analizaron de los 4 líderes: ¿qué tipo de cultura predominaba?',
      opciones: ['Jerárquica', 'De mercado', 'De clan', 'Adhocrática'],
      items: [
        { q: 'Microsoft antes de Nadella', nota: 'Lectura sugerida: de mercado. Competencia interna feroz y "stack ranking", que enfrentaba a los equipos entre sí.' },
        { q: 'Microsoft con Nadella', nota: 'Lectura sugerida: movimiento hacia clan y adhocracia. "Growth mindset", colaboración y apertura.' },
        { q: 'IBM con Rometty', nota: 'Lectura sugerida: jerárquica. Una gran estructura con procesos pesados; Watson nació en una cultura poco ágil.' },
        { q: 'HP con Lores', nota: 'Lectura sugerida: jerárquica y de mercado. Disciplina operativa y foco en resultados de un negocio maduro.' },
        { q: 'Nubank con Vélez', nota: 'Lectura sugerida: adhocrática. Nació digital, con experimentación y foco en el cliente.' }
      ]
    },
    {
      id: 'ocai', tipo: 'puntos', diap: 16, titulo: 'Cultura hoy vs. la que necesitamos',
      intro: 'Reparte 100 puntos entre los cuatro tipos de cultura: primero cómo es tu organización hoy y luego la cultura que necesita para transformarse.',
      tipos: ['Jerárquica', 'De mercado', 'De clan', 'Adhocrática'],
      partes: ['Hoy', 'La que necesitamos']
    },
    {
      id: 'senales', tipo: 'multi', diap: 17, titulo: 'Termómetro de resistencia',
      intro: 'Marca las señales que ves en tu organización.',
      opciones: ['"Aquí siempre se ha hecho así."', '"No es necesario, ya funciona."', '"La tecnología nos va a reemplazar."', '"El jefe no lo ha pedido, así que no vale la pena."', 'Sabotaje pasivo o inacción.', 'Búsqueda constante de aprobación jerárquica.', 'Miedo al error o castigo por equivocarse.', 'Áreas aisladas o falta de colaboración.']
    },
    {
      id: 'etapa', tipo: 'quiz', diap: 22, titulo: '¿En qué etapa se atascó?',
      intro: 'Según ADKAR, ¿qué le falta a esta persona?',
      opciones: ['Conciencia', 'Deseo', 'Conocimiento', 'Habilidad', 'Refuerzo'],
      items: [
        { q: 'Los asesores no saben por qué se cambia el sistema de créditos: "el anterior funcionaba bien".', a: 0, exp: 'No entienden por qué hay que cambiar. Falta conciencia: explicar el problema y el costo de no cambiar.' },
        { q: 'Entienden por qué se cambia, pero dicen: "¿y yo qué gano? Esto solo me da más trabajo".', a: 1, exp: 'Entienden, pero no quieren. Falta deseo: mostrar el beneficio personal e involucrarlos.' },
        { q: 'Quieren usar la nueva plataforma, pero nadie les ha enseñado cómo funciona.', a: 2, exp: 'Quieren, pero no saben. Falta conocimiento: formación concreta.' },
        { q: 'Hicieron el curso y aprobaron el examen, pero en el día a día se enredan y vuelven al Excel.', a: 3, exp: 'Saben, pero no pueden aplicarlo todavía. Falta habilidad: práctica, acompañamiento y tiempo.' },
        { q: 'Tres meses después del lanzamiento todos volvieron al proceso antiguo, porque nadie revisa ni reconoce el uso del nuevo.', a: 4, exp: 'El cambio no se sostuvo. Falta refuerzo: medir, reconocer y corregir.' },
        { q: 'El gerente anunció el cambio con un correo de una línea, sin explicar qué problema resuelve.', a: 0, exp: 'Sin el porqué, el cambio arranca mal. Falta conciencia.' }
      ]
    },
    {
      id: 'adkar', tipo: 'adkar', diap: 23, titulo: 'Tu cambio, en ADKAR',
      intro: 'Piensa en un cambio que estés viviendo o liderando en tu organización. Califica de 1 a 5 qué tanto tiene la gente afectada cada elemento.',
      etapas: [
        { k: 'Conciencia', q: '¿Entienden por qué hay que cambiar?' },
        { k: 'Deseo', q: '¿Quieren participar en el cambio?' },
        { k: 'Conocimiento', q: '¿Saben cómo hacerlo?' },
        { k: 'Habilidad', q: '¿Pueden hacerlo en la práctica?' },
        { k: 'Refuerzo', q: '¿Hay algo que sostenga el cambio?' }
      ],
      accion: [
        'Explica el problema y el costo de no cambiar. Que lo cuente el líder, con datos.',
        'Involúcralos en el diseño, muestra qué gana cada uno y activa agentes de cambio.',
        'Formación concreta y a tiempo: cómo se hace, paso a paso.',
        'Práctica acompañada, coaching y espacio seguro para equivocarse.',
        'Mide, reconoce y celebra el uso de lo nuevo. Retira lo viejo.'
      ]
    },
    {
      id: 'comite', tipo: 'comite', diap: 29, titulo: 'Decisión del comité',
      intro: 'Solo quien tenga el rol de CEO envía la decisión del comité.',
      dimensiones: ['Estrategia', 'Liderazgo', 'Infraestructura', 'Talento', 'Cambio'],
      etapas: ['Conciencia', 'Deseo', 'Conocimiento', 'Habilidad', 'Refuerzo'],
      estrategias: ['Escucha activa y participación', 'Liderazgo ejemplar', 'Rituales, símbolos y narrativas', 'Formación y empoderamiento continuo', 'Agentes de cambio']
    },
    {
      id: 'compromiso', tipo: 'texto', diap: 30, titulo: 'Mi compromiso',
      pregunta: 'Quiero mover mi cultura de ___ a ___, y mi primera acción será ___.',
      ayuda: 'Una frase concreta.', max: 220, vista: 'muro'
    }
  ]
};
