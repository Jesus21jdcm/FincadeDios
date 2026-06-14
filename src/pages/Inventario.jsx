import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import styles from './Inventario.module.css';

export default function Inventario() {
  const { userRole } = useAppContext();
  const [insumos, setInsumos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', tipo: '', unidad: '', cantidad: '', fechaVencimiento: '' });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'inventario')), snap => {
      setInsumos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCompras = onSnapshot(query(collection(db, 'compras'), orderBy('fecha', 'desc')), snap => {
      setCompras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub(); unsubCompras(); };
  }, []);

  const resetForm = () => {
    setForm({ nombre: '', tipo: '', unidad: '', cantidad: '', fechaVencimiento: '' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const handleCrearInsumo = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre || !form.tipo || !form.unidad) {
      setError('Completa todos los campos');
      return;
    }
    try {
      const data = {
        nombre: form.nombre,
        tipo: form.tipo,
        unidad: form.unidad,
        stock: Number(form.cantidad) || 0,
        fechaVencimiento: form.fechaVencimiento || null,
        ultimaActualizacion: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, 'inventario', editing.id), data);
      } else {
        await addDoc(collection(db, 'inventario'), data);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (insumo) => {
    setForm({
      nombre: insumo.nombre || '',
      tipo: insumo.tipo || '',
      unidad: insumo.unidad || '',
      cantidad: insumo.stock?.toString() || '',
      fechaVencimiento: insumo.fechaVencimiento ? insumo.fechaVencimiento.split('T')[0] : '',
    });
    setEditing(insumo);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'inventario', deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
      setDeleteTarget(null);
    }
  };

  const confirmDelete = (insumo) => {
    setDeleteTarget(insumo);
  };

  const today = new Date();
  const vencido = (fecha) => {
    if (!fecha) return false;
    return new Date(fecha) < today;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>📦 Inventario</h1>
          <p className={styles.subtitle}>{insumos.length} insumos registrados</p>
        </div>
        {userRole !== 'empleado' && (
          <button className={styles.btnPrimary} onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true); } }}>
            {showForm ? 'Cancelar' : '+ Nuevo insumo'}
          </button>
        )}
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleCrearInsumo}>
          {error && <div className={styles.error}>{error}</div>}
          <h3 className={styles.formTitle}>{editing ? `Editar: ${editing.nombre}` : 'Nuevo insumo'}</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre</label>
              <input className={styles.input} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Fertilizante NPK" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tipo</label>
              <select className={styles.select} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="">Seleccionar</option>
                <option value="Fertilizante">Fertilizante</option>
                <option value="Herbicida">Herbicida</option>
                <option value="Fungicida">Fungicida</option>
                <option value="Insecticida">Insecticida</option>
                <option value="Semilla">Semilla</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Unidad</label>
              <select className={styles.select} value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
                <option value="">Seleccionar</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="unidad">unidad</option>
                <option value="bolsa">bolsa</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Cantidad</label>
              <input className={styles.input} type="number" step="any" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} placeholder="0" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Fecha de vencimiento</label>
              <input className={styles.input} type="date" value={form.fechaVencimiento} onChange={e => setForm(f => ({ ...f, fechaVencimiento: e.target.value }))} />
            </div>
          </div>
          <button className={styles.btnPrimary} type="submit">{editing ? 'Guardar cambios' : 'Guardar insumo'}</button>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Tipo</th>
              <th>Stock</th>
              <th>Fecha de vencimiento</th>
              {userRole !== 'empleado' && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {insumos.map(i => (
              <tr key={i.id}>
                <td className={styles.cellName}>{i.nombre}</td>
                <td><span className={`${styles.tipoBadge} ${styles[i.tipo] || ''}`}>{i.tipo}</span></td>
                <td className={styles.cellStock}>
                  <span className={i.stock <= 0 ? styles.stockEmpty : ''}>{i.stock} {i.unidad}</span>
                </td>
                <td className={styles.cellFecha}>
                  {i.fechaVencimiento ? (
                    <span className={vencido(i.fechaVencimiento) ? styles.vencido : ''}>
                      {new Date(i.fechaVencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {vencido(i.fechaVencimiento) && <span className={styles.vencidoTag}>VENCIDO</span>}
                    </span>
                  ) : '—'}
                </td>
                {userRole !== 'empleado' && (
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.btnEdit} onClick={() => handleEdit(i)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className={styles.btnDelete} onClick={() => confirmDelete(i)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {insumos.length === 0 && (
              <tr><td colSpan={userRole !== 'empleado' ? 5 : 4} className={styles.empty}>No hay insumos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className={styles.modalTitle}>¿Eliminar insumo?</h3>
            <p className={styles.modalText}>
              Se eliminará <strong>{deleteTarget.nombre}</strong> del inventario. Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className={styles.btnConfirmDelete} onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
