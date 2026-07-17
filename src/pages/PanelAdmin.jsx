import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, getDocs, where, orderBy } from 'firebase/firestore';
import { notificarCorrectivaCreada, enviarReporteSemanal, enviarRecordatorioDiario } from '../utils/whatsapp';
import styles from './PanelAdmin.module.css';

const stages = [
  { id: 'todas', label: 'Todas' },
  { id: 'Generado', label: 'Por Asignar' },
  { id: 'Asignado', label: 'En Progreso' },
  { id: 'Ejecutado', label: 'Por Revisar' },
  { id: 'Validado', label: 'Completadas' },
];

export default function PanelAdmin() {
  const [tareasRaw, setTareasRaw] = useState([]);
  const [siembras, setSiembras] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [filter, setFilter] = useState('todas');
  const [filterSiembra, setFilterSiembra] = useState('todas');
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
    const unsubL = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubT(); unsubS(); unsubE(); unsubC(); unsubEx(); unsubAl(); unsubL(); };
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

  const handleAprobarTarea = async (t) => {
    await updateDoc(doc(db, 'tareas', t.id), { estado: 'Validado' });
    if (t.siembraId) {
      const otrasTareas = tareasRaw.filter(x => x.siembraId === t.siembraId && x.id !== t.id);
      const todasCompletadas = otrasTareas.every(x => x.estado === 'Validado');
      if (todasCompletadas) {
        await updateDoc(doc(db, 'siembras', t.siembraId), { estado: 'finalizada' });
        alert('🌱 ¡Cosecha Culminada! Todas las tareas de esta siembra han sido completadas con éxito.');
      }
    }
  };

  const isVencida = (t) => new Date(t.fechaSugerida) < new Date() && t.estado !== 'Validado' && t.estado !== 'Ejecutado';

  const vencidasPorStage = {
    todas: tareas.filter(isVencida).length,
    Generado: tareas.filter(t => t.estado === 'Generado' && isVencida(t)).length,
    Asignado: tareas.filter(t => t.estado === 'Asignado' && isVencida(t)).length,
    Ejecutado: tareas.filter(t => t.estado === 'Ejecutado' && isVencida(t)).length,
    Validado: 0,
  };

  const filtradas = tareas.filter(t => {
    const matchStage = filter === 'todas' || t.estado === filter;
    const matchSiembra = filterSiembra === 'todas' || t.siembraId === filterSiembra;
    return matchStage && matchSiembra;
  });

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
          <h1 className={styles.title}>Panel de Control</h1>
          <p className={styles.subtitle}>Gestión operativa y seguimiento en tiempo real</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className={styles.selectFilterContainer}>
            <label className={styles.filterLabel}>Filtrar por etapa:</label>
            <select
              className={styles.filterSelect}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label} ({conteo[stage.id] || 0})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectFilterContainer}>
            <label className={styles.filterLabel}>Filtrar por siembra:</label>
            <select
              className={styles.filterSelect}
              value={filterSiembra}
              onChange={(e) => setFilterSiembra(e.target.value)}
            >
              <option value="todas">Todas</option>
              {siembras.map((s) => {
                const lote = lotes.find(l => l.id === s.loteId);
                const loteNombre = lote ? lote.nombre : 'Lote desconocido';
                return (
                  <option key={s.id} value={s.id}>
                    {s.cultivo} ({loteNombre})
                  </option>
                );
              })}
            </select>
          </div>
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

      {filtradas.length > 0 && (
        <div className={styles.taskList}>
          {filtradas.map(t => {
            const siembra = siembras.find(s => s.id === t.siembraId);
            const lote = lotes.find(l => l.id === siembra?.loteId);
            const vencida = isVencida(t);

            return (
              <div key={t.id} className={`${styles.taskCard} ${vencida ? styles.taskCardVencida : ''}`}>
                
                {/* Contenedor Izquierdo: Estado, Título y Descripción */}
                <div className={styles.taskCardMain}>
                  <span className={`${styles.estadoBadge} ${styles[t.estado] || ''}`}>
                    {t.estado.toUpperCase()}
                  </span>
                  <div className={styles.taskCardContent}>
                    <h4 className={styles.taskCardTitle}>{t.titulo}</h4>
                    {t.descripcion && <p className={styles.taskCardDesc}>{t.descripcion}</p>}
                  </div>
                </div>

                {/* Contenedor Centro: Ubicación, Cultivo, Fecha límite */}
                <div className={styles.taskCardMeta}>
                  <div className={styles.taskCardUbicacion}>
                    <span className={styles.badgeCultivo}>{siembra?.cultivo || t.cultivo}</span>
                    <span className={styles.badgeLote}>{lote?.nombre || (siembra?.loteId ? 'Lote eliminado' : '—')}</span>
                  </div>

                  <div className={`${styles.metaItem} ${vencida ? styles.metaItemVencida : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.metaIcon}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>
                      {new Date(t.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {vencida && <span className={styles.vencidaLabel}> (Vencida)</span>}
                    </span>
                  </div>

                  <div className={styles.metaItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.metaIcon}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>
                      {t.idEmpleado ? (
                        <span className={styles.empleadoAsignado}>{t.nombreEmpleado}</span>
                      ) : (
                        <span className={styles.sinAsignar}>Sin asignar</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Contenedor Derecho: Acciones (Evidencia, Reasignar, Asignar, Aprobar) */}
                <div className={styles.taskCardActions}>
                  {t.evidencia && (
                    <button className={styles.btnIconAction} onClick={() => setEvidenciaModal(t.evidencia)} title="Ver evidencia">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      <span>Evidencia</span>
                    </button>
                  )}
                  
                  {t.estado !== 'Validado' && t.estado !== 'Ejecutado' && t.idEmpleado && (
                    <button className={styles.btnReasignar} onClick={() => reasignar(t.id)} title="Reasignar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                      <span>Reasignar</span>
                    </button>
                  )}
                  
                  {!t.idEmpleado && t.estado !== 'Validado' && t.estado !== 'Ejecutado' && (
                    asignando === t.id ? (
                      <div className={styles.asignadorInline}>
                        <select className={styles.selectSmall} onChange={e => asignar(t.id, e.target.value)} defaultValue="">
                          <option value="" disabled>Asignar a...</option>
                          {empleados.map(e => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                          ))}
                        </select>
                        <button className={styles.btnCancelAsignar} onClick={() => setAsignando(null)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ) : (
                      <button className={styles.btnAsignarBlue} onClick={() => setAsignando(t.id)}>
                        Asignar
                      </button>
                    )
                  )}
                  
                  {t.estado === 'Ejecutado' && (
                    <button className={styles.btnAprobar} onClick={() => handleAprobarTarea(t)}>
                      Aprobar Tarea
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {evidenciaModal && (
        <div className={styles.modalOverlay} onClick={() => setEvidenciaModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setEvidenciaModal(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <img src={evidenciaModal} alt="Evidencia" className={styles.evidenciaFull} />
          </div>
        </div>
      )}
    </div>
  );
}
