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
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStock, setFilterStock] = useState('');

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

  const getTypeTheme = (tipo) => {
    const colors = {
      Semilla: { border: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', color: '#10B981' },
      Herbicida: { border: '#A78BFA', bg: 'rgba(167, 139, 250, 0.1)', color: '#8B5CF6' },
      Fertilizante: { border: '#FB923C', bg: 'rgba(251, 146, 60, 0.1)', color: '#F97316' },
      Fungicida: { border: '#38BDF8', bg: 'rgba(56, 189, 248, 0.1)', color: '#0EA5E9' },
      Insecticida: { border: '#F87171', bg: 'rgba(248, 113, 113, 0.1)', color: '#EF4444' },
    };
    return colors[tipo] || { border: '#9CA3AF', bg: '#F3F4F6', color: '#6B7280' };
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Inventario</h1>
          <p className={styles.subtitle}>{insumos.length} insumos registrados</p>
        </div>
        {userRole !== 'empleado' && (
          <button className={styles.btnNuevo} onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true); } }}>
            {showForm ? 'Cancelar' : '+ Nuevo insumo'}
          </button>
        )}
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.filterWrap}>
          <select className={styles.filterSelect} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="Fertilizante">Fertilizante</option>
            <option value="Herbicida">Herbicida</option>
            <option value="Fungicida">Fungicida</option>
            <option value="Insecticida">Insecticida</option>
            <option value="Semilla">Semilla</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className={styles.filterWrap}>
          <select className={styles.filterSelect} value={filterStock} onChange={e => setFilterStock(e.target.value)}>
            <option value="">Todos los stocks</option>
            <option value="conStock">Con stock</option>
            <option value="stockBajo">Stock bajo</option>
            <option value="sinStock">Sin stock</option>
          </select>
        </div>
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
          <button className={styles.btnNuevo} type="submit">{editing ? 'Guardar cambios' : 'Guardar insumo'}</button>
        </form>
      )}

      <div className={styles.cardsContainer}>
        {insumos.filter(i => {
           if (filterTipo && i.tipo !== filterTipo) return false;
           if (filterStock === 'conStock' && i.stock <= 0) return false;
           if (filterStock === 'stockBajo' && (i.stock > (i.stockMinimo || 5) || i.stock <= 0)) return false;
           if (filterStock === 'sinStock' && i.stock > 0) return false;
           return true;
        }).map(i => {
           const theme = getTypeTheme(i.tipo);
           return (
              <div key={i.id} className={styles.insumoCard} style={{ borderLeftColor: theme.border }}>
                <div className={styles.cardMain}>
                  <div className={styles.cardIconBox} style={{ background: theme.bg, color: theme.color }}>
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                  </div>
                  <div className={styles.cardDetails}>
                    <div className={styles.cardTitle}>{i.nombre}</div>
                    <div className={styles.cardTags}>
                      <span className={styles.badge} style={{ background: theme.bg, color: theme.color }}>{i.tipo}</span>
                      <span className={styles.stockAmount}>{i.stock} {i.unidad}</span>
                    </div>
                  </div>
                  {userRole !== 'empleado' && (
                    <div className={styles.cardActions}>
                       <button className={styles.btnIcon} onClick={() => handleEdit(i)} title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                       <button className={styles.btnIcon} onClick={() => confirmDelete(i)} title="Eliminar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg></button>
                    </div>
                  )}
                </div>
                <div className={styles.cardFooter}>
                   <span className={styles.fechaText}>
                     Vence: {i.fechaVencimiento ? new Date(i.fechaVencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                   </span>
                   {vencido(i.fechaVencimiento) && <span className={styles.vencidoTag}>VENCIDO</span>}
                </div>
              </div>
           );
        })}
        {insumos.length === 0 && (
          <div className={styles.empty}>No hay insumos registrados</div>
        )}
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
