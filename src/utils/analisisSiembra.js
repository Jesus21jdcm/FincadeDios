const CULTIVOS = {
  Cacao: {
    ciclo: 365,
    descripcion: 'Cultivo perenne de alta demanda de nutrientes. Requiere sombra temporal y manejo fitosanitario constante.',
    tareas: [
      { tipo: 'riego', titulo: 'Riego de establecimiento', descripcion: 'Riego moderado para mantener humedad sin encharcar. Aplicar 20L/planta si no hay lluvia.', dias: 3, recurrencia: 14 },
      { tipo: 'fertilizacion', titulo: 'Fertilización de inicio', descripcion: 'Aplicar 150g/planta de NPK 15-15-15 más 5kg de materia orgánica. Incorporar al suelo alrededor de la planta.', dias: 30, recurrencia: 45 },
      { tipo: 'control_plagas', titulo: 'Monitoreo fitosanitario', descripcion: 'Inspeccionar presencia de Monilla, Phytophthora y chinches. Aplicar caldo bordelés si hay síntomas.', dias: 15, recurrencia: 30 },
      { tipo: 'poda', titulo: 'Poda de formación', descripcion: 'Eliminar brotes laterales bajos y mantener un solo tallo principal. Desinfectar herramientas.', dias: 90, recurrencia: 120 },
      { tipo: 'fertilizacion', titulo: 'Fertilización de mantenimiento', descripcion: 'Aplicar 200g/planta de NPK 18-5-15-6(CaO)-3(MgO) más micronutrientes. Dividir en 2 aplicaciones.', dias: 75, recurrencia: 60 },
      { tipo: 'control_plagas', titulo: 'Control preventivo de Monilla', descripcion: 'Eliminar mazorcas infectadas y aplicar fungicida a base de cobre cada 15 días en época lluviosa.', dias: 45, recurrencia: 30 },
      { tipo: 'poda', titulo: 'Poda sanitaria', descripcion: 'Eliminar ramas secas, enfermas o quebradas. Airear el dosel para reducir humedad.', dias: 180, recurrencia: 90 },
      { tipo: 'fertilizacion', titulo: 'Fertilización potásica', descripcion: 'Aplicar 150g/planta de KCl (cloruro de potasio) para fortalecer frutos y resistencia a enfermedades.', dias: 120, recurrencia: 90 },
      { tipo: 'riego', titulo: 'Riego en época seca', descripcion: 'Si hay sequía prolongada, aplicar 30L/planta cada 7 días en horas de la mañana.', dias: 60, recurrencia: 14 },
      { tipo: 'control_plagas', titulo: 'Manejo integrado de plagas', descripcion: 'Revisar trampas y monitorear población de insectos. Aplicar solo si umbral económico se supera.', dias: 210, recurrencia: 30 },
    ],
  },
  Plátano: {
    ciclo: 300,
    descripcion: 'Cultivo de rápido crecimiento con alta demanda de potasio. Requiere manejo de hijuelos y control de sigatoka.',
    tareas: [
      { tipo: 'riego', titulo: 'Riego de establecimiento', descripcion: 'Aplicar 25L/planta cada 3 días durante las primeras 2 semanas si no hay lluvia.', dias: 1, recurrencia: 3 },
      { tipo: 'fertilizacion', titulo: 'Fertilización de siembra', descripcion: 'Aplicar 200g/planta de NPK 10-30-10 más 3kg de materia orgánica en el hoyo de siembra.', dias: 1, recurrencia: null },
      { tipo: 'control_plagas', titulo: 'Control de Sigatoka negra', descripcion: 'Aplicar fungicida sistémico (triazoles + estrobilurinas) con aceite agrícola. Rotar mecanismos de acción.', dias: 21, recurrencia: 21 },
      { tipo: 'fertilizacion', titulo: 'Fertilización nitrogenada', descripcion: 'Aplicar 150g/planta de urea (46-0-0) al voleo alrededor de la planta, sin tocar el pseudotallo.', dias: 30, recurrencia: 30 },
      { tipo: 'poda', titulo: 'Deshije', descripcion: 'Seleccionar y dejar solo 1-2 hijos de reemplazo por planta. Eliminar hijos sobrantes con corte oblicuo.', dias: 60, recurrencia: 60 },
      { tipo: 'fertilizacion', titulo: 'Fertilización potásica', descripcion: 'Aplicar 200g/planta de KCl (cloruro de potasio) para llenado de frutos. Es el nutriente más crítico.', dias: 90, recurrencia: 45 },
      { tipo: 'control_plagas', titulo: 'Control de picudo negro', descripcion: 'Aplicar nemátodos entomopatógenos o insecticida al pseudotallo. Mantener trampas con feromona.', dias: 60, recurrencia: 60 },
      { tipo: 'poda', titulo: 'Deshoje fitosanitario', descripcion: 'Eliminar hojas viejas, secas o con síntomas de enfermedad. Mantener 8-10 hojas funcionales por planta.', dias: 45, recurrencia: 30 },
      { tipo: 'riego', titulo: 'Rego de mantenimiento', descripcion: 'Aplicar 30L/planta cada 7 días en época seca. El plátano requiere 1800-2000mm/año.', dias: 30, recurrencia: 7 },
      { tipo: 'fertilizacion', titulo: 'Fertilización foliar', descripcion: 'Aplicar microelementos (Zn, B, Fe, Mn) vía foliar cada 45 días para prevenir deficiencias.', dias: 150, recurrencia: 45 },
    ],
  },
  Maíz: {
    ciclo: 120,
    descripcion: 'Cultivo anual de alta demanda nutricional en período corto. Crítico en floración y llenado de grano.',
    tareas: [
      { tipo: 'fertilizacion', titulo: 'Fertilización de fondo', descripcion: 'Aplicar 200kg/ha de NPK 10-30-10 en la banda de siembra. Incorporar 5cm debajo de la semilla.', dias: 1, recurrencia: null },
      { tipo: 'control_plagas', titulo: 'Control de malezas pre-emergente', descripcion: 'Aplicar herbicida pre-emergente (atrazina + pendimentalina) dentro de las 48h posteriores a la siembra.', dias: 2, recurrencia: null },
      { tipo: 'fertilizacion', titulo: 'Fertilización nitrogenada V4-V6', descripcion: 'Aplicar 150kg/ha de urea (46-0-0) al voleo cuando el maíz tenga 4-6 hojas verdaderas.', dias: 25, recurrencia: null },
      { tipo: 'riego', titulo: 'Riego en etapa vegetativa', descripcion: 'Aplicar lámina de 30mm si no ha llovido en 7 días. El estrés hídrico en V6-V10 reduce rendimiento.', dias: 20, recurrencia: 7 },
      { tipo: 'control_plagas', titulo: 'Control de cogollero (Spodoptera)', descripcion: 'Monitorear daño en cogollo. Aplicar Bacillus thuringiensis o espinosad si >15% de plantas afectadas.', dias: 30, recurrencia: 15 },
      { tipo: 'fertilizacion', titulo: 'Fertilización en VT (pre-floración)', descripcion: 'Aplicar 100kg/ha de urea más 50kg/ha de KCl. Crítico para rendimiento potencial de grano.', dias: 55, recurrencia: null },
      { tipo: 'riego', titulo: 'Riego en floración', descripcion: 'Riego crítico en floración (VT-R1). Aplicar 35mm si no hay lluvia. Estrés aquí reduce drásticamente el rendimiento.', dias: 60, recurrencia: 5 },
      { tipo: 'control_plagas', titulo: 'Control de enfermedades foliares', descripcion: 'Aplicar fungicida (triazol + estrobilurina) si hay condiciones de alta humedad y temperatura moderada.', dias: 50, recurrencia: 20 },
      { tipo: 'riego', titulo: 'Riego en llenado de grano', descripcion: 'Aplicar 30mm cada 7 días durante R2-R4 (llenado de grano). Mantener humedad uniforme.', dias: 75, recurrencia: 7 },
      { tipo: 'control_plagas', titulo: 'Control de cosecha', descripcion: 'Monitorear humedad del grano (ideal 14-15%). Programar cosecha mecánica o manual según disponibilidad.', dias: 110, recurrencia: null },
    ],
  },
  Yuca: {
    ciclo: 270,
    descripcion: 'Cultivo rústico tolerante a sequía. Baja exigencia nutricional pero sensible a malezas en etapa inicial.',
    tareas: [
      { tipo: 'fertilizacion', titulo: 'Fertilización de siembra', descripcion: 'Aplicar 5kg de materia orgánica + 100g de NPK 10-30-10 por metro lineal de surco.', dias: 1, recurrencia: null },
      { tipo: 'control_plagas', titulo: 'Control de malezas inicial', descripcion: 'Aplicar herbicida pre-emergente o realizar desmalezado manual a los 15 días. Crítico primeros 60 días.', dias: 15, recurrencia: 30 },
      { tipo: 'fertilizacion', titulo: 'Fertilización de desarrollo', descripcion: 'Aplicar 100g/planta de NPK 15-15-15 más 50g/planta de KCl al voleo alrededor de la planta.', dias: 45, recurrencia: null },
      { tipo: 'control_plagas', titulo: 'Control de ácaros y mosca blanca', descripcion: 'Monitorear envés de hojas. Aplicar azufre o jabón potásico si se detectan colonias.', dias: 45, recurrencia: 30 },
      { tipo: 'fertilizacion', titulo: 'Fertilización potásica de engrosamiento', descripcion: 'Aplicar 80g/planta de KCl para promover el engrosamiento de raíces. El K es el nutriente más importante.', dias: 90, recurrencia: 60 },
      { tipo: 'control_plagas', titulo: 'Aporque y control de malezas', descripcion: 'Realizar aporque para cubrir raíces en formación y eliminar malezas. Repetir cada 45 días.', dias: 60, recurrencia: 45 },
      { tipo: 'riego', titulo: 'Riego en período seco prolongado', descripcion: 'La yuca es tolerante a sequía. Aplicar 15L/planta cada 15 días solo si sequía >20 días.', dias: 60, recurrencia: 15 },
      { tipo: 'control_plagas', titulo: 'Control de trips y hormigas', descripcion: 'Aplicar insecticida biológico (Beauveria bassiana) para control de trips. Cebos para hormigas.', dias: 90, recurrencia: 45 },
      { tipo: 'poda', titulo: 'Poda de formación', descripcion: 'Eliminar brotes laterales en los primeros 30cm del tallo para concentrar energía en raíces.', dias: 120, recurrencia: null },
      { tipo: 'control_plagas', titulo: 'Evaluación pre-cosecha', descripcion: 'Realizar muestreo de raíces a los 8-9 meses. Verificar peso y contenido de almidón antes de cosechar.', dias: 240, recurrencia: null },
    ],
  },
};

function sumarDias(fecha, dias) {
  const r = new Date(fecha);
  r.setDate(r.getDate() + dias);
  return r;
}

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function generarId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

export function analizarCultivo(cultivo, fechaSiembra) {
  const info = CULTIVOS[cultivo];
  if (!info) return null;

  const siembra = new Date(fechaSiembra);
  const semana = (n) => `Semana ${n} (${formatearFecha(sumarDias(siembra, n * 7))})`;

  const tareas = info.tareas.map((t, i) => {
    const fechaSugerida = sumarDias(siembra, t.dias);
    const recurrencia = t.recurrencia;
    return {
      id: generarId(),
      tipo: t.tipo,
      titulo: t.titulo,
      descripcion: t.descripcion,
      fechaSugerida: fechaSugerida.toISOString(),
      fechaSugeridaLabel: formatearFecha(fechaSugerida),
      recurrencia: recurrencia ? `${recurrencia} días` : 'Una vez',
      estado: 'pendiente',
      orden: i,
    };
  });

  const etapas = [];

  if (cultivo === 'Maíz') {
    etapas.push(
      { nombre: 'Germinación (VE)', dias: '1-10', desc: 'Emergencia de plántulas. Mantener humedad superficial.' },
      { nombre: 'Vegetativo (V3-V6)', dias: '11-30', desc: 'Crecimiento acelerado. Aplicar N en V4-V6.' },
      { nombre: 'Vegetativo (V6-VT)', dias: '31-55', desc: 'Máxima acumulación de biomasa. Crítico evitar estrés.' },
      { nombre: 'Floración (VT-R1)', dias: '56-70', desc: 'Período más sensible al estrés hídrico.' },
      { nombre: 'Llenado de grano (R2-R4)', dias: '71-95', desc: 'Acumulación de almidón en grano.' },
      { nombre: 'Madurez (R5-R6)', dias: '96-120', desc: 'Secado de grano. Cosechar a 14-15% humedad.' },
    );
  } else if (cultivo === 'Plátano') {
    etapas.push(
      { nombre: 'Establecimiento (mes 1-2)', dias: '1-60', desc: 'Enraizamiento y emisión de primeras hojas.' },
      { nombre: 'Crecimiento vegetativo (mes 3-5)', dias: '61-150', desc: 'Desarrollo foliar y de pseudotallo.' },
      { nombre: 'Diferenciación floral (mes 5-6)', dias: '151-180', desc: 'Inicio de formación de inflorescencia.' },
      { nombre: 'Floración a cosecha (mes 7-10)', dias: '181-300', desc: 'Llenado de racimo y maduración de frutos.' },
    );
  } else if (cultivo === 'Cacao') {
    etapas.push(
      { nombre: 'Establecimiento (mes 1-3)', dias: '1-90', desc: 'Adaptación de plántulas. Sombra temporal requerida.' },
      { nombre: 'Crecimiento vegetativo (mes 4-12)', dias: '91-365', desc: 'Formación de dosel y sistema radicular profundo.' },
      { nombre: 'Producción (año 2+)', dias: '366+', desc: 'Entrada en producción. Manejo de floración y frutos.' },
    );
  } else if (cultivo === 'Yuca') {
    etapas.push(
      { nombre: 'Enraizamiento (mes 1-2)', dias: '1-60', desc: 'Formación de raíces adventicias a partir de estacas.' },
      { nombre: 'Desarrollo vegetativo (mes 3-5)', dias: '61-150', desc: 'Crecimiento de biomasa aérea y llenado de raíces.' },
      { nombre: 'Engrosamiento de raíces (mes 6-9)', dias: '151-270', desc: 'Acumulación de almidón en raíces de almacenamiento.' },
    );
  }

  return {
    cultivo,
    descripcion: info.descripcion,
    fechaSiembra: siembra.toISOString(),
    fechaCosechaEstimada: sumarDias(siembra, info.ciclo).toISOString(),
    fechaCosechaLabel: formatearFecha(sumarDias(siembra, info.ciclo)),
    ciclo: `${info.ciclo} días`,
    tareas,
    etapas,
    resumen: {
      totalTareas: tareas.length,
      fertilizacion: tareas.filter(t => t.tipo === 'fertilizacion').length,
      controlPlagas: tareas.filter(t => t.tipo === 'control_plagas').length,
      poda: tareas.filter(t => t.tipo === 'poda').length,
      riego: tareas.filter(t => t.tipo === 'riego').length,
    },
  };
}

export function getCultivos() {
  return Object.keys(CULTIVOS);
}
