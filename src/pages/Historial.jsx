import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './Historial.module.css';

export default function Historial() {
  const [tareas, setTareas] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [todasLasFotos, setTodasLasFotos] = useState([]);

  const today = new Date();
  const inicioSemana = new Date(today);
  inicioSemana.setDate(today.getDate() - today.getDay() + 1);
  const finSemana = new Date(today);
  finSemana.setDate(today.getDate() - today.getDay() + 7);

  const formatDateLocal = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [fechaInicio, setFechaInicio] = useState(formatDateLocal(inicioSemana));
  const [fechaFin, setFechaFin] = useState(formatDateLocal(finSemana));

  useEffect(() => {
    const unsubT = onSnapshot(query(collection(db, 'tareas'), orderBy('fechaSugerida', 'asc')), snap => {
      setTareas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubA = onSnapshot(query(collection(db, 'aplicaciones'), orderBy('fecha', 'desc')), snap => {
      setAplicaciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubI = onSnapshot(query(collection(db, 'inventario')), snap => {
      setInsumos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubE = onSnapshot(query(collection(db, 'usuarios')), snap => {
      setEmpleados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubT(); unsubA(); unsubI(); unsubE(); };
  }, []);

  useEffect(() => {
    const unsubL = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubL();
  }, []);

  useEffect(() => {
    if (lotes.length === 0) return;
    const unsubs = lotes.map(lote => {
      return onSnapshot(
        query(collection(db, 'lotes', lote.id, 'fotos')),
        (snap) => {
          const fotosLote = snap.docs.map(d => ({
            id: d.id,
            loteId: lote.id,
            loteNombre: lote.nombre,
            ...d.data()
          }));
          setTodasLasFotos(prev => {
            const otrasFotos = prev.filter(f => f.loteId !== lote.id);
            return [...otrasFotos, ...fotosLote];
          });
        }
      );
    });
    return () => unsubs.forEach(u => u());
  }, [lotes]);

  const getNombreEmpleado = (id) => {
    const emp = empleados.find(e => e.id === id || e.uid === id);
    if (emp) return emp.nombre;
    if (!id) return 'Sin asignar';
    return 'Usuario no encontrado';
  };

  const eliminarActividad = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta actividad del reporte? Esta acción borrará la tarea.')) {
      try {
        await deleteDoc(doc(db, 'tareas', id));
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  const eliminarReporte = async (loteId, fotoId) => {
    if (window.confirm('¿Seguro que deseas eliminar este reporte de monitoreo?')) {
      try {
        await deleteDoc(doc(db, 'lotes', loteId, 'fotos', fotoId));
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };
  const getNombreInsumo = (id) => insumos.find(i => i.id === id)?.nombre || id || '—';

  const parseDate = (fecha) => {
    if (!fecha) return null;
    let d;
    if (typeof fecha.toDate === 'function') {
      d = fecha.toDate();
    } else if (fecha && typeof fecha === 'object' && fecha.seconds !== undefined) {
      d = new Date(fecha.seconds * 1000);
    } else {
      d = new Date(fecha);
      // Fallback para formatos DD/MM/YYYY o DD-MM-YYYY
      if (isNaN(d.getTime()) && typeof fecha === 'string') {
        const parts = fecha.split(/[-/]/);
        if (parts.length === 3) {
          d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
        }
      }
    }
    return isNaN(d.getTime()) ? null : d;
  };

  const enRango = (fecha) => {
    const d = parseDate(fecha);
    if (!d) return false;
    const dStr = formatDateLocal(d);
    return dStr >= fechaInicio && dStr <= fechaFin;
  };

  const formatFechaDisplay = (fecha, short = false) => {
    const d = parseDate(fecha);
    if (!d) return '—';
    return d.toLocaleDateString('es-ES', short ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatFechaExport = (fecha) => {
    const d = parseDate(fecha);
    if (!d) return '—';
    return d.toLocaleDateString('es-ES');
  };

  // Tareas ejecutadas en el periodo
  const tareasEjecutadas = tareas.filter(t =>
    (t.estado === 'Ejecutado' || t.estado === 'Validado') &&
    enRango(t.fechaEjecucion || t.fechaSugerida)
  );

  // Tareas asignadas en el periodo para comparar
  const tareasAsignadasRango = tareas.filter(t => enRango(t.fechaSugerida));

  // Empleados que trabajaron en el periodo
  const fotosRango = todasLasFotos;
  const empleadosTareas = tareasEjecutadas.map(t => t.idEmpleado).filter(Boolean);
  const empleadosFotos = fotosRango.map(f => f.usuario).filter(Boolean);
  const aplicacionesRango = aplicaciones;
  const empleadosAplicaciones = aplicacionesRango.map(a => a.usuario).filter(Boolean);
  const empleadosQueTrabajaron = [...new Set([...empleadosTareas, ...empleadosFotos, ...empleadosAplicaciones])];

  // Insumos gastados en tareas y aplicaciones (DETALLE)
  const usosInsumos = [];
  tareasEjecutadas.forEach(t => {
    const insumosArray = t.insumosConsumidos || t.insumosUsados;
    if (insumosArray && Array.isArray(insumosArray)) {
      insumosArray.forEach(item => {
        const ins = insumos.find(i => i.id === item.id);
        usosInsumos.push({
          id: `t_${t.id}_${item.id}`,
          tipo: 'Tarea',
          actividad: t.titulo,
          insumoNombre: getNombreInsumo(item.id),
          cantidad: Number(item.cantidad),
          unidad: ins?.unidad || '',
          fecha: t.fechaEjecucion || t.fechaSugerida,
          usuario: t.idEmpleado
        });
      });
    } else if (t.insumoUsado && t.cantidadUsada) {
      const ins = insumos.find(i => i.id === t.insumoUsado);
      usosInsumos.push({
        id: `t_${t.id}`,
        tipo: 'Tarea',
        actividad: t.titulo,
        insumoNombre: getNombreInsumo(t.insumoUsado),
        cantidad: Number(t.cantidadUsada),
        unidad: ins?.unidad || '',
        fecha: t.fechaEjecucion || t.fechaSugerida,
        usuario: t.idEmpleado
      });
    }
  });
  aplicacionesRango.forEach(a => {
    const ins = insumos.find(i => i.id === a.insumoId);
    usosInsumos.push({
      id: `a_${a.id}`,
      tipo: 'Aplicación',
      actividad: a.tipo || 'Aplicación en Lote',
      insumoNombre: getNombreInsumo(a.insumoId),
      cantidad: Number(a.cantidad),
      unidad: ins?.unidad || '',
      fecha: a.fecha,
      usuario: a.usuario
    });
  });
  usosInsumos.sort((a, b) => {
    const da = parseDate(a.fecha);
    const db = parseDate(b.fecha);
    return (db || new Date(0)) - (da || new Date(0));
  });

  // Insumos gastados (Agrupados para los stats cards)
  const insumosAgrupados = usosInsumos.reduce((acc, uso) => {
    if (!acc[uso.insumoNombre]) acc[uso.insumoNombre] = 0;
    acc[uso.insumoNombre] += uso.cantidad;
    return acc;
  }, {});
  const cantidadTiposInsumos = Object.keys(insumosAgrupados).length;

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    const wsData = [];
    wsData.push([{ v: 'Informe Semanal', s: { font: { bold: true, sz: 16 } } }]);
    wsData.push([{ v: `Periodo: ${fechaInicio} a ${fechaFin}`, s: { font: { italic: true } } }]);
    wsData.push([{ v: `Generado: ${new Date().toLocaleDateString('es-ES')}`, s: { font: { italic: true } } }]);
    wsData.push([]);

    const styleTitle = { font: { bold: true, color: { rgb: "006B3C" }, sz: 12 } };
    const styleHeader = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "006B3C" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    const styleCell = { alignment: { vertical: "center" } };

    // 1. Quien trabajo
    wsData.push([{ v: 'QUIEN TRABAJO', s: styleTitle }]);
    wsData.push([
      { v: 'Empleado', s: styleHeader }, { v: 'Tareas', s: styleHeader },
      { v: 'Reportes', s: styleHeader }, { v: 'Aplicaciones', s: styleHeader }
    ]);
    if (empleadosQueTrabajaron.length === 0) {
      wsData.push([{ v: 'Sin datos', s: styleCell }]);
    } else {
      empleadosQueTrabajaron.forEach(id => {
        wsData.push([
          { v: getNombreEmpleado(id), s: styleCell },
          { v: tareasEjecutadas.filter(t => t.idEmpleado === id).length, s: styleCell },
          { v: fotosRango.filter(f => f.usuario === id).length, s: styleCell },
          { v: aplicacionesRango.filter(a => a.usuario === id).length, s: styleCell }
        ]);
      });
    }
    wsData.push([]);

    // 2. Actividades
    wsData.push([{ v: 'ACTIVIDADES REALIZADAS', s: styleTitle }]);
    wsData.push([
      { v: 'Tarea', s: styleHeader }, { v: 'Cultivo', s: styleHeader },
      { v: 'Empleado', s: styleHeader }, { v: 'Fecha', s: styleHeader },
      { v: 'Estado', s: styleHeader }
    ]);
    if (tareasEjecutadas.length === 0) {
      wsData.push([{ v: 'Sin datos', s: styleCell }]);
    } else {
      tareasEjecutadas.forEach(t => {
        wsData.push([
          { v: t.titulo, s: styleCell },
          { v: t.cultivo || '', s: styleCell },
          { v: getNombreEmpleado(t.idEmpleado), s: styleCell },
          { v: formatFechaExport(t.fechaEjecucion || t.fechaSugerida), s: styleCell },
          { v: t.estado, s: styleCell }
        ]);
      });
    }
    wsData.push([]);

    // 3. Insumos
    wsData.push([{ v: 'DETALLE DE INSUMOS UTILIZADOS', s: styleTitle }]);
    wsData.push([
      { v: 'Fecha', s: styleHeader }, { v: 'Insumo', s: styleHeader },
      { v: 'Cantidad', s: styleHeader }, { v: 'Actividad', s: styleHeader },
      { v: 'Empleado', s: styleHeader }
    ]);
    if (usosInsumos.length === 0) {
      wsData.push([{ v: 'Sin datos', s: styleCell }]);
    } else {
      usosInsumos.forEach(uso => {
        wsData.push([
          { v: formatFechaExport(uso.fecha), s: styleCell },
          { v: uso.insumoNombre, s: styleCell },
          { v: `${uso.cantidad} ${uso.unidad}`, s: styleCell },
          { v: uso.actividad, s: styleCell },
          { v: getNombreEmpleado(uso.usuario), s: styleCell }
        ]);
      });
    }
    wsData.push([]);

    // 4. Reportes
    wsData.push([{ v: 'REPORTES DE MONITOREO', s: styleTitle }]);
    wsData.push([
      { v: 'Lote', s: styleHeader }, { v: 'Salud', s: styleHeader },
      { v: 'Empleado', s: styleHeader }, { v: 'Fecha', s: styleHeader },
      { v: 'Comentario', s: styleHeader }
    ]);
    if (fotosRango.length === 0) {
      wsData.push([{ v: 'Sin datos', s: styleCell }]);
    } else {
      fotosRango.forEach(f => {
        wsData.push([
          { v: f.loteNombre, s: styleCell },
          { v: f.salud, s: styleCell },
          { v: getNombreEmpleado(f.usuario), s: styleCell },
          { v: formatFechaExport(f.fecha), s: styleCell },
          { v: f.comentario || '—', s: styleCell }
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Informe Semanal');

    XLSX.writeFile(wb, `Informe_semanal_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Informe Semanal', 14, 20);
    doc.setFontSize(10);
    doc.text(`Periodo: ${fechaInicio} a ${fechaFin}`, 14, 28);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 34);

    doc.setFontSize(12);
    doc.text('Quien trabajo', 14, 44);
    autoTable(doc, {
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [0, 107, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      head: [['Empleado', 'Tareas', 'Reportes', 'Aplicaciones']],
      body: empleadosQueTrabajaron.map(id => [
        getNombreEmpleado(id),
        tareasEjecutadas.filter(t => t.idEmpleado === id).length,
        fotosRango.filter(f => f.usuario === id).length,
        aplicacionesRango.filter(a => a.usuario === id).length
      ]),
    });

    doc.text('Actividades realizadas', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      theme: 'grid',
      headStyles: { fillColor: [0, 107, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      head: [['Tarea', 'Cultivo', 'Empleado', 'Fecha', 'Estado']],
      body: tareasEjecutadas.map(t => [
        t.titulo,
        t.cultivo || '',
        getNombreEmpleado(t.idEmpleado),
        formatFechaExport(t.fechaEjecucion || t.fechaSugerida),
        t.estado,
      ]),
    });

    doc.text('Detalle de Insumos Utilizados', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      theme: 'grid',
      headStyles: { fillColor: [0, 107, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      head: [['Fecha', 'Insumo', 'Cantidad', 'Actividad', 'Empleado']],
      body: usosInsumos.map(uso => [
        formatFechaExport(uso.fecha),
        uso.insumoNombre,
        `${uso.cantidad} ${uso.unidad}`,
        uso.actividad,
        getNombreEmpleado(uso.usuario)
      ]),
    });

    doc.text('Reportes de Monitoreo', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      theme: 'grid',
      headStyles: { fillColor: [0, 107, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      head: [['Lote', 'Salud', 'Empleado', 'Fecha', 'Comentario']],
      body: fotosRango.map(f => [
        f.loteNombre,
        f.salud,
        getNombreEmpleado(f.usuario),
        formatFechaExport(f.fecha),
        f.comentario || '—',
      ]),
    });

    doc.save(`Informe_semanal_${fechaInicio}_a_${fechaFin}.pdf`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Informe Semanal</h1>
        <p className={styles.subtitle}>Reporte de actividades, personal e insumos</p>
      </div>

      <div className={styles.filtros}>
        <div className={styles.filtroRow}>
          <input className={styles.input} type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          <input className={styles.input} type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          <button className={styles.btnExport} onClick={exportarExcel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Excel
          </button>
          <button className={styles.btnExport} onClick={exportarPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            PDF
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className={styles.statsRow}>
        <span className={styles.statCard}>
          <strong>{empleadosQueTrabajaron.length}</strong>
          <small>Empleados que trabajaron</small>
        </span>
        <span className={styles.statCard}>
          <strong>{tareasEjecutadas.length} / {tareasAsignadasRango.length}</strong>
          <small>Tareas realizadas (vs Asignadas)</small>
        </span>
        <span className={styles.statCard}>
          <strong>{cantidadTiposInsumos}</strong>
          <small>Tipos de insumos usados</small>
        </span>
        <span className={styles.statCard}>
          <strong>{fotosRango.length}</strong>
          <small>Reportes de monitoreo</small>
        </span>
      </div>

      {/* Quien trabajo */}
      <section className={styles.seccion}>
        <h2 className={styles.seccionTitle}>Quien trabajo</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Tareas realizadas</th>
                <th>Ultima tarea</th>
              </tr>
            </thead>
            <tbody>
              {empleadosQueTrabajaron.map(id => {
                const tareasEmp = tareasEjecutadas.filter(t => t.idEmpleado === id);
                const ultima = tareasEmp.sort((a, b) => {
                  const da = parseDate(a.fechaEjecucion || a.fechaSugerida);
                  const db = parseDate(b.fechaEjecucion || b.fechaSugerida);
                  return (db || new Date(0)) - (da || new Date(0));
                })[0];
                return (
                  <tr key={id}>
                    <td><strong>{getNombreEmpleado(id)}</strong></td>
                    <td>{tareasEmp.length}</td>
                    <td className={styles.cellFecha}>{ultima ? formatFechaDisplay(ultima.fechaEjecucion || ultima.fechaSugerida, true) : '—'}</td>
                  </tr>
                );
              })}
              {empleadosQueTrabajaron.length === 0 && (
                <tr><td colSpan={3} className={styles.empty}>No hay actividad en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actividades realizadas */}
      <section className={styles.seccion}>
        <h2 className={styles.seccionTitle}>Actividades realizadas</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Cultivo</th>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tareasEjecutadas.map(t => (
                <tr key={t.id}>
                  <td className={styles.cellTitulo}>
                    <strong>{t.titulo}</strong>
                    {t.descripcion && <span className={styles.cellDesc}>{t.descripcion.slice(0, 60)}</span>}
                    {((t.insumosConsumidos && t.insumosConsumidos.length > 0) || (t.insumosUsados && t.insumosUsados.length > 0)) && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
                        <strong style={{ color: '#475569' }}>Insumos:</strong>
                        <ul style={{ margin: '2px 0 0 16px', padding: 0 }}>
                          {(t.insumosConsumidos || t.insumosUsados).map((ins, i) => (
                            <li key={i}>{ins.cantidad}x {getNombreInsumo(ins.id)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                  <td>{t.cultivo || '—'}</td>
                  <td>{getNombreEmpleado(t.idEmpleado)}</td>
                  <td className={styles.cellFecha}>
                    {formatFechaDisplay(t.fechaEjecucion || t.fechaSugerida)}
                  </td>
                  <td><span className={`${styles.estadoBadge} ${styles[t.estado] || ''}`}>{t.estado}</span></td>
                  <td>
                    <button className={styles.btnDelete} onClick={() => eliminarActividad(t.id)} title="Eliminar actividad">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {tareasEjecutadas.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No hay actividades en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reportes de monitoreo */}
      <section className={styles.seccion}>
        <h2 className={styles.seccionTitle}>Reportes de Monitoreo</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lote</th>
                <th>Salud</th>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Comentario / Foto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fotosRango.map(f => (
                <tr key={f.id}>
                  <td><strong>{f.loteNombre}</strong></td>
                  <td><span className={`${styles.estadoBadge} ${styles[f.salud] || ''}`}>{f.salud}</span></td>
                  <td>{getNombreEmpleado(f.usuario)}</td>
                  <td className={styles.cellFecha}>{formatFechaDisplay(f.fecha)}</td>
                  <td className={styles.cellTitulo}>
                    {f.comentario && <span className={styles.cellDesc}>{f.comentario}</span>}
                    {f.url && <a href={f.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontSize: '11px', textDecoration: 'underline' }}>Ver foto</a>}
                  </td>
                  <td>
                    <button className={styles.btnDelete} onClick={() => eliminarReporte(f.loteId, f.id)} title="Eliminar reporte">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {fotosRango.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No hay reportes de monitoreo en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insumos gastados */}
      <section className={styles.seccion}>
        <h2 className={styles.seccionTitle}>Detalle de Insumos Utilizados</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Actividad</th>
                <th>Empleado</th>
              </tr>
            </thead>
            <tbody>
              {usosInsumos.map(uso => (
                <tr key={uso.id}>
                  <td className={styles.cellFecha}>{formatFechaDisplay(uso.fecha)}</td>
                  <td><strong>{uso.insumoNombre}</strong></td>
                  <td>{uso.cantidad} {uso.unidad}</td>
                  <td>{uso.actividad} <span className={styles.cellDesc}>({uso.tipo})</span></td>
                  <td>{getNombreEmpleado(uso.usuario)}</td>
                </tr>
              ))}
              {usosInsumos.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No se registraron usos de insumos en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
