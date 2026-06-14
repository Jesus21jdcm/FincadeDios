import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import styles from './Historial.module.css';

export default function Historial() {
  const [tareas, setTareas] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const today = new Date();
  const inicioSemana = new Date(today);
  inicioSemana.setDate(today.getDate() - today.getDay() + 1);
  const finSemana = new Date(today);
  finSemana.setDate(today.getDate() - today.getDay() + 7);

  const [fechaInicio, setFechaInicio] = useState(inicioSemana.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(finSemana.toISOString().split('T')[0]);

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

  const getNombreEmpleado = (id) => empleados.find(e => e.id === id)?.nombre || id || '—';
  const getNombreInsumo = (id) => insumos.find(i => i.id === id)?.nombre || id || '—';

  const enRango = (fecha) => {
    if (!fecha) return false;
    const d = new Date(fecha);
    const desde = new Date(fechaInicio);
    const hasta = new Date(fechaFin + 'T23:59:59');
    return d >= desde && d <= hasta;
  };

  // Tareas ejecutadas en el periodo
  const tareasEjecutadas = tareas.filter(t =>
    (t.estado === 'Ejecutado' || t.estado === 'Validado') &&
    enRango(t.fechaEjecucion || t.fechaSugerida)
  );

  // Empleados que trabajaron en el periodo
  const empleadosQueTrabajaron = [...new Set(tareasEjecutadas.map(t => t.idEmpleado).filter(Boolean))];

  // Insumos gastados en tareas
  const insumosTareas = tareasEjecutadas
    .filter(t => t.insumoUsado && t.cantidadUsada)
    .reduce((acc, t) => {
      const key = t.insumoUsado;
      if (!acc[key]) acc[key] = { id: key, nombre: getNombreInsumo(key), cantidad: 0, unidad: '' };
      const ins = insumos.find(i => i.id === key);
      acc[key].cantidad += Number(t.cantidadUsada);
      acc[key].unidad = ins?.unidad || '';
      return acc;
    }, {});

  // Insumos gastados en aplicaciones
  const aplicacionesRango = aplicaciones.filter(a => enRango(a.fecha));
  const insumosAplicaciones = aplicacionesRango
    .reduce((acc, a) => {
      const key = a.insumoId;
      if (!acc[key]) acc[key] = { id: key, nombre: getNombreInsumo(key), cantidad: 0, unidad: '' };
      const ins = insumos.find(i => i.id === key);
      acc[key].cantidad += Number(a.cantidad);
      acc[key].unidad = ins?.unidad || '';
      return acc;
    }, {});

  // Combinar insumos de tareas y aplicaciones
  const todosInsumos = { ...insumosAplicaciones };
  Object.keys(insumosTareas).forEach(key => {
    if (todosInsumos[key]) {
      todosInsumos[key].cantidad += insumosTareas[key].cantidad;
    } else {
      todosInsumos[key] = insumosTareas[key];
    }
  });
  const insumosGastados = Object.values(todosInsumos);

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    const dataEmpleados = empleadosQueTrabajaron.map(id => ({
      Empleado: getNombreEmpleado(id),
      Tareas: tareasEjecutadas.filter(t => t.idEmpleado === id).length,
    }));
    if (dataEmpleados.length === 0) dataEmpleados.push({ Empleado: 'Sin datos', Tareas: 0 });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataEmpleados), 'Quien trabajo');

    const dataActividades = tareasEjecutadas.map(t => ({
      Tarea: t.titulo,
      Descripcion: t.descripcion || '',
      Cultivo: t.cultivo || '',
      Empleado: getNombreEmpleado(t.idEmpleado),
      Fecha: new Date(t.fechaEjecucion || t.fechaSugerida).toLocaleDateString('es-ES'),
      Estado: t.estado,
    }));
    if (dataActividades.length === 0) dataActividades.push({ Tarea: 'Sin datos' });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataActividades), 'Actividades');

    const dataInsumos = insumosGastados.map(i => ({
      Insumo: i.nombre,
      Cantidad: i.cantidad,
      Unidad: i.unidad,
    }));
    if (dataInsumos.length === 0) dataInsumos.push({ Insumo: 'Sin datos', Cantidad: 0, Unidad: '' });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataInsumos), 'Insumos gastados');

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
    doc.autoTable({
      startY: 48,
      head: [['Empleado', 'Tareas realizadas']],
      body: empleadosQueTrabajaron.map(id => [getNombreEmpleado(id), tareasEjecutadas.filter(t => t.idEmpleado === id).length]),
    });

    doc.text('Actividades realizadas', 14, doc.lastAutoTable.finalY + 12);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Tarea', 'Cultivo', 'Empleado', 'Fecha', 'Estado']],
      body: tareasEjecutadas.map(t => [
        t.titulo,
        t.cultivo || '',
        getNombreEmpleado(t.idEmpleado),
        new Date(t.fechaEjecucion || t.fechaSugerida).toLocaleDateString('es-ES'),
        t.estado,
      ]),
    });

    doc.text('Insumos gastados', 14, doc.lastAutoTable.finalY + 12);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Insumo', 'Cantidad', 'Unidad']],
      body: insumosGastados.map(i => [i.nombre, i.cantidad, i.unidad]),
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Excel
          </button>
          <button className={styles.btnExport} onClick={exportarPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
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
          <strong>{tareasEjecutadas.length}</strong>
          <small>Tareas realizadas</small>
        </span>
        <span className={styles.statCard}>
          <strong>{insumosGastados.length}</strong>
          <small>Insumos utilizados</small>
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
                const ultima = tareasEmp.sort((a, b) => new Date(b.fechaEjecucion || b.fechaSugerida) - new Date(a.fechaEjecucion || a.fechaSugerida))[0];
                return (
                  <tr key={id}>
                    <td><strong>{getNombreEmpleado(id)}</strong></td>
                    <td>{tareasEmp.length}</td>
                    <td className={styles.cellFecha}>{ultima ? new Date(ultima.fechaEjecucion || ultima.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}</td>
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
              </tr>
            </thead>
            <tbody>
              {tareasEjecutadas.map(t => (
                <tr key={t.id}>
                  <td className={styles.cellTitulo}>
                    <strong>{t.titulo}</strong>
                    {t.descripcion && <span className={styles.cellDesc}>{t.descripcion.slice(0, 60)}</span>}
                  </td>
                  <td>{t.cultivo || '—'}</td>
                  <td>{getNombreEmpleado(t.idEmpleado)}</td>
                  <td className={styles.cellFecha}>
                    {new Date(t.fechaEjecucion || t.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td><span className={`${styles.estadoBadge} ${styles[t.estado] || ''}`}>{t.estado}</span></td>
                </tr>
              ))}
              {tareasEjecutadas.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No hay actividades en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insumos gastados */}
      <section className={styles.seccion}>
        <h2 className={styles.seccionTitle}>Insumos gastados</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {insumosGastados.map(i => (
                <tr key={i.id}>
                  <td><strong>{i.nombre}</strong></td>
                  <td>{i.cantidad}</td>
                  <td>{i.unidad}</td>
                </tr>
              ))}
              {insumosGastados.length === 0 && (
                <tr><td colSpan={3} className={styles.empty}>No se gastaron insumos en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
