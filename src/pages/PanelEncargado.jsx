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
    await updateDoc(doc(db, 'tareas', tareaId), { estado: 'Validado' });
    setModalTarea(null);
  };

  const editarTarea = async (tareaId, campos) => {
    await updateDoc(doc(db, 'tareas', tareaId), campos);
    setModalTarea(null);
  };

  const getNombreEmpleado = (id) => empleados.find(e => e.id === id)?.nombre || id;

  const pendientes = tareas.filter(t => t.estado === 'Ejecutado');
  const asignadas = tareas.filter(t => t.estado === 'Asignado' || t.estado === 'Generado');

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>🔍 Panel de Encargado</h1>
          <p className={styles.subtitle}>
            {pendientes.length} tarea{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de validación
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🟡 Pendientes de validar
          {pendientes.length > 0 && <span className={styles.badge}>{pendientes.length}</span>}
        </h2>
        {pendientes.length === 0 ? (
          <div className={styles.empty}>No hay tareas pendientes de validación ✅</div>
        ) : (
          <div className={styles.list}>
            {pendientes.map(t => (
              <div key={t.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardInfo}>
                    <strong>{t.titulo}</strong>
                    <p className={styles.cardMeta}>
                      👤 {getNombreEmpleado(t.idEmpleado)} · 🌱 {t.cultivo || '—'}
                    </p>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.btnPrimary} onClick={() => validarTarea(t.id)}>✅ Validar</button>
                    <button className={styles.btnSecondary} onClick={() => setModalTarea(t)}>✏️ Editar</button>
                  </div>
                </div>
                {t.evidencia && (
                  <div className={styles.evidencia}>
                    <img src={t.evidencia} alt="Evidencia" className={styles.evidenciaImg} />
                  </div>
                )}
                {t.descripcion && <p className={styles.cardDesc}>{t.descripcion}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📋 Tareas asignadas</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Empleado</th>
                <th>Fecha límite</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {asignadas.map(t => (
                <tr key={t.id}>
                  <td className={styles.cellTitulo}>
                    <strong>{t.titulo}</strong>
                    <span className={styles.cellDesc}>{t.cultivo}</span>
                  </td>
                  <td>{getNombreEmpleado(t.idEmpleado) || 'Sin asignar'}</td>
                  <td className={styles.cellFecha}>
                    {new Date(t.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </td>
                  <td><span className={`${styles.estadoBadge} ${styles[t.estado]}`}>{t.estado}</span></td>
                </tr>
              ))}
              {asignadas.length === 0 && (
                <tr><td colSpan={4} className={styles.empty}>Sin tareas asignadas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalTarea && (
        <div className={styles.modalOverlay} onClick={() => setModalTarea(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>✏️ Editar tarea</h3>
            <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.target); editarTarea(modalTarea.id, { titulo: fd.get('titulo'), descripcion: fd.get('descripcion'), fechaSugerida: new Date(fd.get('fechaSugerida')).toISOString() }); }}>
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
                  <h4>📸 Evidencia</h4>
                  <img src={modalTarea.evidencia} alt="Evidencia" className={styles.evidenciaImg} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
