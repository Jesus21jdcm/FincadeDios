import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, getDocs, where, orderBy } from 'firebase/firestore';
import { notificarCorrectivaCreada, enviarReporteSemanal, enviarRecordatorioDiario } from '../utils/whatsapp';
import styles from './PanelAdmin.module.css';

const stages = [
  { id: 'todas', label: 'Todas' },
  { id: 'Generado', label: 'Generadas' },
  { id: 'Asignado', label: 'Asignadas' },
  { id: 'Ejecutado', label: 'Ejecutadas' },
  { id: 'Validado', label: 'Validadas' },
];

export default function PanelAdmin() {
  const [tareasRaw, setTareasRaw] = useState([]);
  const [siembras, setSiembras] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [filter, setFilter] = useState('todas');
  const [asignando, setAsignando] = useState(null);
  const [evidenciaModal, setEvidenciaModal] = useState(null);
  const [excepciones, setExcepciones] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [tareaCorrectiva, setTareaCorrectiva] = useState(null);

  const tareas = tareasRaw.filter(t => {
    if (!t.siembraId) return false;
    return siembras.some(s => s.id === t.siembraId);
  });

  useEffect(() => {
    const unsubT = onSnapshot(
      query(collection(db, 'tareas'), orderBy('fechaSugerida', 'asc')),
      snap => setTareasRaw(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubS = onSnapshot(query(collection(db, 'siembras')), snap => {
      setSiembras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubE = onSnapshot(
      query(collection(db, 'usuarios'), where('rol', '==', 'empleado')),
      snap => setEmpleados(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubC = onSnapshot(
      query(collection(db, 'usuarios'), where('rol', '==', 'encargado')),
      snap => setEncargados(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubEx = onSnapshot(query(collection(db, 'excepciones'), where('estado', '==', 'pendiente')),
      snap => setExcepciones(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubAl = onSnapshot(query(collection(db, 'alertas'), where('estado', '==', 'pendiente')),
      snap => setAlertas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubT(); unsubS(); unsubE(); unsubC(); unsubEx(); unsubAl(); };
  }, []);

  const asignar = async (tareaId, empleadoId) => {
    const emp = empleados.find(e => e.id === empleadoId);
    await updateDoc(doc(db, 'tareas', tareaId), {
      idEmpleado: empleadoId,
      nombreEmpleado: emp?.nombre || empleadoId,
      estado: 'Asignado',
    });
    setAsignando(null);
  };

  const reasignar = async (tareaId) => {
    await updateDoc(doc(db, 'tareas', tareaId), {
      idEmpleado: null,
      nombreEmpleado: null,
      estado: 'Generado',
    });
  };

  const isVencida = (t) => new Date(t.fechaSugerida) < new Date() && t.estado !== 'Validado' && t.estado !== 'Ejecutado';

  const vencidasPorStage = {
    todas: tareas.filter(isVencida).length,
    Generado: tareas.filter(t => t.estado === 'Generado' && isVencida(t)).length,
    Asignado: tareas.filter(t => t.estado === 'Asignado' && isVencida(t)).length,
    Ejecutado: tareas.filter(t => t.estado === 'Ejecutado' && isVencida(t)).length,
    Validado: 0,
  };

  const filtradas = filter === 'todas' ? tareas : tareas.filter(t => t.estado === filter);

  const conteo = {
    todas: tareas.length,
    Generado: tareas.filter(t => t.estado === 'Generado').length,
    Asignado: tareas.filter(t => t.estado === 'Asignado').length,
    Ejecutado: tareas.filter(t => t.estado === 'Ejecutado').length,
    Validado: tareas.filter(t => t.estado === 'Validado').length,
  };

  const resolverExcepcion = async (id) => {
    await updateDoc(doc(db, 'excepciones', id), { estado: 'resuelto' });
  };

  const crearCorrectiva = async (alerta) => {
    const titulo = prompt('Título de la tarea correctiva:');
    if (!titulo) return;
    const desc = prompt('Descripción (opcional):');
    const fechaLimite = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await addDoc(collection(db, 'tareas'), {
      titulo,
      descripcion: desc || '',
      estado: 'Generado',
      siembraId: alerta.loteId || '',
      cultivo: alerta.cultivo || '',
      fechaSugerida: fechaLimite,
      idEncargado: null,
      idEmpleado: null,
      esCorrectiva: true,
      alertaOrigen: alerta.id,
    });
    await updateDoc(doc(db, 'alertas', alerta.id), { estado: 'en_proceso' });
    setTareaCorrectiva(null);

    // Notificar al encargado vía WhatsApp
    const qEnc = query(collection(db, 'usuarios'), where('rol', '==', 'encargado'));
    const encargados = await getDocs(qEnc);
    encargados.forEach(d => {
      if (d.data().telefono) {
        notificarCorrectivaCreada({
          encargadoTelefono: d.data().telefono,
          tareaTitulo: titulo,
          loteNombre: alerta.loteNombre || alerta.cultivo || '—',
          fechaLimite,
        });
      }
    });
  };

  const completadas = conteo.Validado;
  const total = tareas.length || 1;
  const pct = Math.round((completadas / total) * 100);

  const enviarReporte = async () => {
    const lotesSnap = await getDocs(collection(db, 'lotes'));
    const lotes = lotesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const qEmp = query(collection(db, 'usuarios'), where('rol', '==', 'empleado'));
    const empleados = await getDocs(qEmp);
    empleados.forEach(d => {
      if (d.data().telefono) {
        enviarReporteSemanal({
          empleadoTelefono: d.data().telefono,
          tareasPendientes: tareas.filter(t => t.estado !== 'Validado' && t.estado !== 'Ejecutado').length,
          tareasCompletadas: completadas,
          lotesActivos: lotes.length,
          excepcionesPendientes: excepciones.length,
          alertasPendientes: alertas.length,
        });
      }
    });
  };

  const enviarRecordatorio = async () => {
    const qEmp = query(collection(db, 'usuarios'), where('rol', '==', 'empleado'));
    const empleados = await getDocs(qEmp);
    empleados.forEach(d => {
      if (d.data().telefono) {
        enviarRecordatorioDiario({
          empleadoTelefono: d.data().telefono,
          tareas: tareas.filter(t => t.estado === 'Generado' || t.estado === 'Asignado').map(t => ({
            titulo: t.titulo,
            fechaLimiteLabel: t.fechaSugerida ? new Date(t.fechaSugerida).toLocaleDateString('es-ES') : 'hoy',
          })),
        });
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Panel de Administracion</h1>
          <p className={styles.subtitle}>Gestion de tareas, semaforo operativo y flujo de trabajo</p>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.metaTotal}>{tareas.length} tareas</span>
          <span className={styles.metaPct}>{pct}% completado</span>
          <button className={styles.btnWsp} onClick={enviarRecordatorio} title="Enviar recordatorio diario">📋 Recordar</button>
          <button className={styles.btnWsp} onClick={enviarReporte} title="Enviar reporte semanal">📊 Reporte</button>
        </div>
      </div>

      <div className={styles.pipeline}>
        <div className={styles.pipelineBar}>
          {stages.map((stage, i) => (
            <div key={stage.id} className={styles.pipelineItem}>
              {i > 0 && (
                <svg className={styles.pipelineArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
              <button
                className={`${styles.pipelineStep} ${styles[`step${stage.id}`] || ''} ${filter === stage.id ? styles.pipelineActive : ''}`}
                onClick={() => setFilter(stage.id)}
              >
                {vencidasPorStage[stage.id] > 0 && (
                  <span className={`${styles.notifBell} ${styles[`bell${stage.id}`] || ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </span>
                )}
                <div className={styles.pipelineCircle}>
                  {conteo[stage.id] || 0}
                </div>
                <span className={styles.pipelineLabel}>{stage.label}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {alertas.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionInfo}>
              <h3 className={styles.sectionTitle}>🚨 Alertas críticas de salud vegetal</h3>
              <span className={styles.sectionMeta}>{alertas.length} pendientes</span>
            </div>
          </div>
          <div className={styles.alertList}>
            {alertas.map(a => (
              <div key={a.id} className={styles.alertItem}>
                <div className={styles.alertContent}>
                  <strong>{a.loteNombre}</strong>
                  <span>{a.cultivo} · {new Date(a.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit' })}</span>
                  {a.comentario && <p>{a.comentario}</p>}
                </div>
                <div className={styles.alertActions}>
                  {a.fotoUrl && <img src={a.fotoUrl} alt="Evidencia" className={styles.alertFoto} onClick={() => setEvidenciaModal(a.fotoUrl)} />}
                  <button className={styles.btnCorrectiva} onClick={() => crearCorrectiva(a)}>Crear tarea correctiva</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {excepciones.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionInfo}>
              <h3 className={styles.sectionTitle}>⚠️ Excepciones Ad-Hoc pendientes</h3>
              <span className={styles.sectionMeta}>{excepciones.length} sin conciliar</span>
            </div>
          </div>
          <div className={styles.alertList}>
            {excepciones.map(e => (
              <div key={e.id} className={styles.alertItem}>
                <div className={styles.alertContent}>
                  <strong>{e.insumoNombre}</strong>
                  <span>{e.cantidad} unidades · Reportado por {e.nombreEmpleado || '—'}</span>
                  <span className={styles.alertFecha}>{new Date(e.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit' })}</span>
                </div>
                <div className={styles.alertActions}>
                  <button className={styles.btnConciliar} onClick={() => resolverExcepcion(e.id)}>Conciliar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtradas.length === 0 && (
        <div className={styles.emptyState}>No hay tareas en este estado</div>
      )}

      {siembras.filter(s => filtradas.some(t => t.siembraId === s.id)).map(s => {
        const tareasSiembra = filtradas.filter(t => t.siembraId === s.id);
        return (
          <div key={s.id} className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionInfo}>
                <h3 className={styles.sectionTitle}>{s.cultivo}</h3>
                <span className={styles.sectionMeta}>
                  {tareasSiembra.length} tareas &middot; {new Date(s.fechaSiembra).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Empleado</th>
                    <th>Fecha límite</th>
                    <th>Estado</th>
                    <th>Evidencia</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {tareasSiembra.map(t => (
                      <tr key={t.id} className={isVencida(t) ? styles.rowRojo : ''}>
                        <td className={styles.cellTitulo}>
                          <strong>{t.titulo}</strong>
                          <span className={styles.cellDesc}>{t.descripcion?.slice(0, 60)}</span>
                        </td>
                        <td>
                          {t.idEmpleado ? (
                            <span className={styles.empleadoTag}>
                              <span className={styles.empAvatar}>{t.nombreEmpleado?.charAt(0).toUpperCase() || '?'}</span>
                              <span className={styles.empNombre}>{t.nombreEmpleado || 'Asignado'}</span>
                            </span>
                          ) : (
                            <span className={styles.sinEmpleado}>—</span>
                          )}
                        </td>
                        <td className={styles.cellFecha}>
                          {new Date(t.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {isVencida(t) && <span className={styles.vencido}>VENCIDO</span>}
                        </td>
                        <td>
                          <span className={`${styles.estadoBadge} ${styles[t.estado] || ''}`}>{t.estado}</span>
                        </td>
                        <td>
                          {t.evidencia ? (
                            <img src={t.evidencia} alt="Evidencia" className={styles.evidenciaThumb} onClick={() => setEvidenciaModal(t.evidencia)} />
                          ) : (
                            <span className={styles.sinEvidencia}>—</span>
                          )}
                        </td>
                        <td>
                          {asignando === t.id ? (
                            <div className={styles.asignador}>
                              <select className={styles.select} onChange={e => asignar(t.id, e.target.value)} defaultValue="">
                                <option value="" disabled>Seleccionar empleado</option>
                                {empleados.map(e => (
                                  <option key={e.id} value={e.id}>{e.nombre}</option>
                                ))}
                              </select>
                              <button className={styles.btnAsignarClose} onClick={() => setAsignando(null)} title="Cancelar">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          ) : !t.idEmpleado ? (
                            <button className={styles.btnAsignar} onClick={() => setAsignando(t.id)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              Asignar
                            </button>
                          ) : t.estado === 'Ejecutado' ? (
                            <button className={styles.btnValidar} onClick={() => updateDoc(doc(db, 'tareas', t.id), { estado: 'Validado' })}>
                              Aprobar
                            </button>
                          ) : t.estado !== 'Validado' && (
                            <button className={styles.btnEmpReasignar} onClick={() => reasignar(t.id)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                              Reasignar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {evidenciaModal && (
        <div className={styles.modalOverlay} onClick={() => setEvidenciaModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setEvidenciaModal(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img src={evidenciaModal} alt="Evidencia" className={styles.evidenciaFull} />
          </div>
        </div>
      )}
    </div>
  );
}
