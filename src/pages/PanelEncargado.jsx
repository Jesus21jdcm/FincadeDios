import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, where, orderBy, getDoc } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import { notificarEncargado } from '../utils/whatsapp';
import styles from './PanelEncargado.module.css';

export default function PanelEncargado() {
  const { userData } = useAppContext();
  const [tareas, setTareas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [modalTarea, setModalTarea] = useState(null);
  const [modalEvidencia, setModalEvidencia] = useState(null);

  useEffect(() => {
    const constraints = [orderBy('fechaSugerida', 'asc')];
    if (userData?.idEncargado) {
      constraints.unshift(where('idEncargado', '==', userData.idEncargado));
    }
    const unsubT = onSnapshot(
      query(collection(db, 'tareas'), ...constraints),
      snap => setTareas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubE = onSnapshot(
      query(collection(db, 'usuarios'), where('rol', '==', 'empleado')),
      snap => setEmpleados(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubT(); unsubE(); };
  }, [userData]);

  const validarTarea = async (tareaId) => {
    const t = tareas.find(x => x.id === tareaId);
    await updateDoc(doc(db, 'tareas', tareaId), { estado: 'Validado' });

    if (t && t.siembraId) {
      const otrasTareas = tareas.filter(x => x.siembraId === t.siembraId && x.id !== t.id);
      const todasCompletadas = otrasTareas.every(x => x.estado === 'Validado');

      if (todasCompletadas) {
        await updateDoc(doc(db, 'siembras', t.siembraId), { estado: 'finalizada' });
        alert('Cosecha Culminada! Todas las tareas de esta siembra han sido completadas con éxito.');
      }
    }
    setModalTarea(null);
  };

  const editarTarea = async (tareaId, campos) => {
    await updateDoc(doc(db, 'tareas', tareaId), campos);
    setModalTarea(null);
  };

  const getNombreEmpleado = (id) => empleados.find(e => e.id === id)?.nombre || id;

  const pendientes = tareas.filter(t => t.estado === 'Ejecutado');
  const asignadas = tareas.filter(t => t.estado === 'Asignado' || t.estado === 'Generado' || t.estado === 'Atrasado');

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Panel de Encargado</h1>
          <p className={styles.subtitle}>
            {pendientes.length} tarea{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de validación
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Pendientes de validar
            {pendientes.length > 0 && <span className={styles.badge}>{pendientes.length}</span>}
          </h2>
        </div>
        {pendientes.length === 0 ? (
          <div className={styles.emptyState}>No hay tareas pendientes de validación</div>
        ) : (
          <div className={styles.taskList}>
            {pendientes.map(t => (
              <div key={t.id} className={styles.taskCard}>
                <div className={styles.taskCardMain}>
                  <span className={`${styles.estadoBadge} ${styles[t.estado] || ''}`}>
                    {t.estado.toUpperCase()}
                  </span>
                  <div className={styles.taskCardContent}>
                    <h4 className={styles.taskCardTitle}>{t.titulo}</h4>
                    {t.descripcion && <p className={styles.taskCardDesc}>{t.descripcion}</p>}
                  </div>
                </div>

                <div className={styles.taskCardMeta}>
                  <div className={styles.taskCardUbicacion}>
                    <span className={styles.badgeCultivo}>{t.cultivo || '—'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.metaIcon}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className={styles.empleadoAsignado}>{getNombreEmpleado(t.idEmpleado) || 'Sin asignar'}</span>
                  </div>
                </div>

                <div className={styles.taskCardActions}>
                  {t.evidencia && (
                    <button className={styles.btnIconAction} onClick={() => setModalEvidencia(t.evidencia)} title="Ver evidencia">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      <span>Evidencia</span>
                    </button>
                  )}
                  <button className={styles.btnAprobar} onClick={() => validarTarea(t.id)}>
                    Validar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tareas asignadas</h2>
        </div>
        {asignadas.length === 0 ? (
          <div className={styles.emptyState}>Sin tareas asignadas</div>
        ) : (
          <div className={styles.taskList}>
            {asignadas.map(t => (
              <div key={t.id} className={styles.taskCard}>
                <div className={styles.taskCardMain}>
                  <span className={`${styles.estadoBadge} ${styles[t.estado] || ''}`}>
                    {t.estado.toUpperCase()}
                  </span>
                  <div className={styles.taskCardContent}>
                    <h4 className={styles.taskCardTitle}>{t.titulo}</h4>
                    {t.descripcion && <p className={styles.taskCardDesc}>{t.descripcion}</p>}
                  </div>
                </div>

                <div className={styles.taskCardMeta}>
                  <div className={styles.taskCardUbicacion}>
                    <span className={styles.badgeCultivo}>{t.cultivo || '—'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.metaIcon}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{t.fechaSugerida ? new Date(t.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.metaIcon}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className={styles.empleadoAsignado}>{getNombreEmpleado(t.idEmpleado) || 'Sin asignar'}</span>
                  </div>
                </div>

                <div className={styles.taskCardActions}>
                  <button className={styles.btnReasignar} onClick={() => setModalTarea(t)}>
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalTarea && (
        <div className={styles.modalOverlay} onClick={() => setModalTarea(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Editar tarea</h3>
            <form onSubmit={e => { 
              e.preventDefault(); 
              const fd = new FormData(e.target); 
              const updates = { 
                titulo: fd.get('titulo'), 
                descripcion: fd.get('descripcion'), 
                fechaSugerida: new Date(fd.get('fechaSugerida')).toISOString() 
              };
              if (modalTarea.estado === 'Atrasado') updates.estado = 'Asignado';
              editarTarea(modalTarea.id, updates); 
            }}>
              <div className={styles.field}>
                <label className={styles.label}>Título</label>
                <input className={styles.input} name="titulo" defaultValue={modalTarea.titulo} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <textarea className={styles.textarea} name="descripcion" rows={3} defaultValue={modalTarea.descripcion} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Fecha límite</label>
                <input className={styles.input} name="fechaSugerida" type="date" defaultValue={modalTarea.fechaSugerida?.split('T')[0]} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalTarea(null)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Guardar cambios</button>
              </div>
            </form>
            <div className={styles.evidenciaModal}>
              {modalTarea.evidencia && (
                <>
                  <h4>Evidencia</h4>
                  <img src={modalTarea.evidencia} alt="Evidencia" className={styles.evidenciaImg} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {modalEvidencia && (
        <div className={styles.modalOverlay} onClick={() => setModalEvidencia(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h3 className={styles.modalTitle}>Evidencia</h3>
            <img src={modalEvidencia} alt="Evidencia de la tarea" className={styles.evidenciaImg} style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setModalEvidencia(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
