import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { analizarCultivo, getCultivos } from '../utils/analisisSiembra';
import { useAppContext } from '../context/AppContext';
import cacaoImg from '../assets/images/Cacao.webp';
import platanoImg from '../assets/images/platano.webp';
import maizImg from '../assets/images/maiz.webp';
import yucaImg from '../assets/yuca.webp';
import styles from './Siembras.module.css';

const SvgIcon = ({ name, size = 16 }) => {
  const icons = {
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
    wheat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 16 8" /><path d="M17 3c0 2.5-1.5 4-4 4" /><path d="M17 7c0 2.5-1.5 4-4 4" /><path d="M17 11c0 2.5-1.5 4-4 4" /><path d="M10 22 12 18" /></svg>,
    corn: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22 12 2l8 20" /><path d="M6 16h12" /><path d="M8 10h8" /></svg>,
    root: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M5 10c2-1 4-2 7-2s5 1 7 2" /><path d="M5 14c2 1 4 2 7 2s5-1 7-2" /></svg>,
    flask: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v5l4 11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l4-11V3" /><path d="M9 3v5H7" /></svg>,
    scissors: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="8.12" y1="8.12" x2="15.88" y2="15.88" /><line x1="15.88" y1="8.12" x2="8.12" y2="15.88" /></svg>,
    bug: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M4 10h16" /><path d="M4 14h16" /><path d="M12 10v8" /><path d="M8 14a4 4 0 0 0 8 0" /></svg>,
    droplet: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S13 6 12 2C11 6 9 8.5 8 9.5S5 13 5 15a7 7 0 0 0 7 7Z" /></svg>,
    clipboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    layers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  };
  return icons[name] || null;
};

export default function Siembras({ autoOpenForm }) {
  const { userRole } = useAppContext();
  const [lotes, setLotes] = useState([]);
  const [siembras, setSiembras] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);
  const [analisis, setAnalisis] = useState(null);
  const [paso, setPaso] = useState('form');
  const [form, setForm] = useState({ loteId: '', cultivo: '', fechaSiembra: new Date().toISOString().split('T')[0], area: '' });
  const [error, setError] = useState('');
  const [modalTareas, setModalTareas] = useState(null);
  const [filtroCultivo, setFiltroCultivo] = useState('');
  const [editingTaskModal, setEditingTaskModal] = useState(null);
  const [editingTaskData, setEditingTaskData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    const unsubL = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.filter(d => d.data().activo !== false).map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubS = onSnapshot(query(collection(db, 'siembras'), orderBy('fechaSiembra', 'desc')), snap => {
      setSiembras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubT = onSnapshot(query(collection(db, 'tareas')), snap => {
      setTareas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubE = onSnapshot(query(collection(db, 'usuarios')), snap => {
      setEmpleados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubL(); unsubS(); unsubT(); unsubE(); };
  }, []);

  const handleAnalizar = (e) => {
    e.preventDefault();
    setError('');
    if (!form.loteId || !form.cultivo || !form.fechaSiembra) {
      setError('Completa todos los campos obligatorios');
      return;
    }

    const selectedLote = lotes.find(l => l.id === form.loteId);
    const totalAreaLote = selectedLote?.area || 0;
    const areaUsada = siembras
      .filter(s => s.loteId === form.loteId)
      .reduce((acc, s) => acc + (Number(s.area) || 0), 0);
    const areaDisponible = Math.max(0, totalAreaLote - areaUsada);

    if (form.area && Number(form.area) > areaDisponible) {
      setError(`El área supera el espacio disponible. Solo quedan ${areaDisponible} hectáreas en este lote.`);
      return;
    }

    const resultado = analizarCultivo(form.cultivo, form.fechaSiembra);
    if (!resultado) {
      setError('Cultivo no reconocido');
      return;
    }
    setAnalisis(resultado);
    setPaso('revision');
  };

  const handleEditTareaRevision = (index, field, value) => {
    setAnalisis(prev => {
      if (!prev) return prev;
      const nuevas = [...prev.tareas];
      nuevas[index] = { ...nuevas[index], [field]: value };
      return { ...prev, tareas: nuevas };
    });
  };

  const handleAgregarTareaRevision = () => {
    setAnalisis(prev => {
      if (!prev) return prev;
      const nuevaTarea = {
        id: 'tmp_' + Date.now(),
        tipo: 'clipboard',
        titulo: 'Nueva tarea',
        descripcion: '',
        fechaSugerida: prev.tareas.length > 0 ? prev.tareas[prev.tareas.length - 1].fechaSugerida : new Date().toISOString(),
        isEditing: true
      };
      return { ...prev, tareas: [...prev.tareas, nuevaTarea] };
    });
  };

  const handleEliminarTareaRevision = (index) => {
    setAnalisis(prev => {
      if (!prev) return prev;
      const nuevas = prev.tareas.filter((_, i) => i !== index);
      return { ...prev, tareas: nuevas };
    });
  };

  const handleConfirmar = async () => {
    if (!analisis) return;
    try {
      setGuardando(true);
      const siembraRef = await addDoc(collection(db, 'siembras'), {
        loteId: form.loteId,
        cultivo: form.cultivo,
        fechaSiembra: new Date(form.fechaSiembra).toISOString(),
        area: Number(form.area) || 0,
        fechaCosechaEstimada: analisis.fechaCosechaEstimada,
        usuario: auth.currentUser.uid,
        estado: 'activa',
        createdAt: serverTimestamp(),
      });

      for (const t of analisis.tareas) {
        await addDoc(collection(db, 'tareas'), {
          siembraId: siembraRef.id,
          tipo: t.tipo,
          titulo: t.titulo,
          descripcion: t.descripcion,
          fechaSugerida: t.fechaSugerida,
          estado: 'Generado',
          orden: t.orden,
          cultivo: form.cultivo,
          createdAt: serverTimestamp(),
        });
      }

      const loteRef = doc(db, 'lotes', form.loteId);
      await updateDoc(loteRef, {
        fechaSiembra: new Date(form.fechaSiembra).toISOString(),
        cultivo: form.cultivo,
      });

      resetForm();
      setSuccessToast('Siembra registrada con éxito');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setPaso('form');
    setAnalisis(null);
    setForm({ loteId: '', cultivo: '', fechaSiembra: new Date().toISOString().split('T')[0], area: '' });
    setError('');
  };

  const eliminarSiembra = (id) => {
    setConfirmDelete(id);
  };

  const ejecutarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const id = confirmDelete;
      const tareasSnap = await getDocs(query(collection(db, 'tareas'), where('siembraId', '==', id)));
      const deleteOps = tareasSnap.docs.map(d => deleteDoc(doc(db, 'tareas', d.id)));
      await Promise.all(deleteOps);
      await deleteDoc(doc(db, 'siembras', id));
      setConfirmDelete(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateSiembraField = async (id, field, value) => {
    try {
      await updateDoc(doc(db, 'siembras', id), { [field]: value });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsignarTarea = async (tareaId, empleadoId) => {
    try {
      await updateDoc(doc(db, 'tareas', tareaId), {
        idEmpleado: empleadoId,
        estado: 'Asignado',
        fechaAsignacion: serverTimestamp(),
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const cultivoIcon = (c) => {
    if (c === 'Cacao') return <SvgIcon name="leaf" />;
    if (c === 'Plátano') return <SvgIcon name="leaf" />;
    if (c === 'Maíz') return <SvgIcon name="corn" />;
    if (c === 'Yuca') return <SvgIcon name="root" />;
    return <SvgIcon name="wheat" />;
  };

  const tipoIcon = (t) => {
    if (t === 'fertilizacion') return <SvgIcon name="flask" />;
    if (t === 'poda') return <SvgIcon name="scissors" />;
    if (t === 'control_plagas') return <SvgIcon name="bug" />;
    if (t === 'riego') return <SvgIcon name="droplet" />;
    return <SvgIcon name="clipboard" />;
  };

  const cropImageMap = {
    Cacao: cacaoImg,
    'Pl\u00e1tano': platanoImg,
    'Ma\u00edz': maizImg,
    Yuca: yucaImg,
  };

  const estadoColor = (e) => {
    switch (e) {
      case 'Generado': return styles.estGen;
      case 'Asignado': return styles.estAsig;
      case 'Ejecutado': return styles.estEjec;
      case 'Validado': return styles.estVal;
      default: return '';
    }
  };



  const getAreaDisponible = () => {
    if (!form.loteId) return null;
    const selectedLote = lotes.find(l => l.id === form.loteId);
    const totalAreaLote = selectedLote?.area || 0;
    const areaUsada = siembras
      .filter(s => s.loteId === form.loteId)
      .reduce((acc, s) => acc + (Number(s.area) || 0), 0);
    return Math.max(0, totalAreaLote - areaUsada);
  };
  const areaDisponible = getAreaDisponible();


  return (
    <div className={styles.container}>
      {successToast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '500', animation: 'fadeIn 0.3s ease' }}>
          <SvgIcon name="check" size={18} />
          {successToast}
        </div>
      )}

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Gestion de Siembras</h1>
          <p className={styles.subtitle}>Planificacion inteligente con cronograma automatico de tareas</p>
        </div>
        <div className={styles.headerActions}>
          <select className={styles.filterSelect} value={filtroCultivo} onChange={e => setFiltroCultivo(e.target.value)}>
            <option value="">Todos los cultivos</option>
            <option value="Cacao">Cacao</option>
            <option value="Plátano">Plátano</option>
            <option value="Maíz">Maíz</option>
            <option value="Yuca">Yuca</option>
          </select>
          {userRole !== 'empleado' && (
            <button className={styles.btnPrimary} style={{ background: '#006B3C' }} onClick={() => { setShowForm(!showForm); setPaso('form'); setAnalisis(null); }}>
              {showForm ? 'Cancelar' : <><SvgIcon name="plus" /> Nueva siembra</>}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          {paso === 'form' && (
            <form onSubmit={handleAnalizar}>
              <h2 className={styles.formTitle}>Registrar nueva siembra</h2>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Lote</label>
                  <select className={styles.select} value={form.loteId} onChange={e => {
                    const selectedLoteId = e.target.value;
                    const selectedLote = lotes.find(l => l.id === selectedLoteId);
                    setForm(f => ({ 
                      ...f, 
                      loteId: selectedLoteId, 
                      cultivo: selectedLote ? selectedLote.cultivo : '' 
                    }));
                  }} required>
                    <option value="">Seleccionar lote</option>
                    {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Cultivo</label>
                  <select className={styles.select} value={form.cultivo} onChange={e => setForm(f => ({ ...f, cultivo: e.target.value }))} required disabled={!!form.loteId}>
                    <option value="">Seleccionar</option>
                    {getCultivos().map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Fecha de siembra</label>
                  <input className={styles.input} type="date" value={form.fechaSiembra} onChange={e => setForm(f => ({ ...f, fechaSiembra: e.target.value }))} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Área (hectáreas)
                    {areaDisponible !== null && (
                      <span style={{ color: 'var(--color-muted-foreground)', fontSize: '13px', marginLeft: '6px', fontWeight: 'normal' }}>
                        (Disponibles: <strong>{areaDisponible}</strong> ha)
                      </span>
                    )}
                  </label>
                  <input className={styles.input} type="number" step="any" min="0" max={areaDisponible !== null ? areaDisponible : undefined} value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="2.5" />
                </div>
              </div>
              <button className={styles.btnPrimary} type="submit" style={{ width: '100%', background: '#FF8A20' }}><SvgIcon name="search" /> Analizar y generar plan</button>
            </form>
          )}

          {paso === 'revision' && analisis && (
            <div className={styles.revisionSection}>
              <h2 className={styles.formTitle}><SvgIcon name="clipboard" /> Plan de manejo para {form.cultivo}</h2>

              <div className={styles.infoBar}>
                <span><SvgIcon name="calendar" /> Cosecha estimada: <strong>{analisis.fechaCosechaLabel}</strong></span>
                <span><SvgIcon name="clock" /> Ciclo: <strong>{analisis.ciclo}</strong></span>
                <span><SvgIcon name="clipboard" /> <strong>{analisis.resumen.totalTareas}</strong> tareas generadas</span>
              </div>

              <div className={styles.descBox}>{analisis.descripcion}</div>

              <h3 className={styles.sectionTitle}><SvgIcon name="leaf" /> Etapas fenologicas</h3>
              <div className={styles.etapasGrid}>
                {analisis.etapas.map((e, i) => (
                  <div key={i} className={styles.etapaCard}>
                    <span className={styles.etapaDias}>{e.dias}</span>
                    <strong className={styles.etapaNombre}>{e.nombre}</strong>
                    <p className={styles.etapaDesc}>{e.desc}</p>
                  </div>
                ))}
              </div>

              <h3 className={styles.sectionTitle}><SvgIcon name="clipboard" /> Cronograma de tareas sugerido</h3>
              <div className={styles.resumenStats}>
                <span><SvgIcon name="flask" /> {analisis.resumen.fertilizacion} fertilizaciones</span>
                <span><SvgIcon name="scissors" /> {analisis.resumen.poda} podas</span>
                <span><SvgIcon name="bug" /> {analisis.resumen.controlPlagas} controles</span>
                <span><SvgIcon name="droplet" /> {analisis.resumen.riego} riegos</span>
              </div>

              <div className={styles.tareasEditList}>
                {analisis.tareas.map((t, i) => (
                  <div key={t.id || i} className={styles.tareaEditCard}>
                    {t.isEditing ? (
                      <div className={styles.tareaEditFormInline}>
                        <div className={styles.inlineFieldRow}>
                          <input type="text" className={styles.input} style={{ flex: 1 }} value={t.titulo} onChange={e => handleEditTareaRevision(i, 'titulo', e.target.value)} placeholder="Título de la tarea" autoFocus />
                          <select className={styles.select} style={{ width: '150px' }} value={t.tipo} onChange={e => handleEditTareaRevision(i, 'tipo', e.target.value)}>
                            <option value="fertilizacion">Fertilización</option>
                            <option value="poda">Poda</option>
                            <option value="control_plagas">Plagas</option>
                            <option value="riego">Riego</option>
                            <option value="clipboard">Otra</option>
                          </select>
                        </div>
                        <input type="text" className={styles.input} value={t.descripcion} onChange={e => handleEditTareaRevision(i, 'descripcion', e.target.value)} placeholder="Descripción (opcional)" />
                        <div className={styles.inlineFieldActions}>
                          <input
                            type="date"
                            className={styles.inputDateSmall}
                            value={t.fechaSugerida ? t.fechaSugerida.split('T')[0] : ''}
                            onChange={e => handleEditTareaRevision(i, 'fechaSugerida', new Date(e.target.value).toISOString())}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className={styles.btnSecondary} style={{ padding: '4px 12px', height: '32px' }} onClick={() => handleEditTareaRevision(i, 'isEditing', false)}>OK</button>
                            <button type="button" className={styles.btnIcon} onClick={() => handleEliminarTareaRevision(i)} title="Eliminar tarea">
                              <SvgIcon name="trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.tareaEditIcon}>{tipoIcon(t.tipo)}</div>
                        <div className={styles.tareaEditInfo}>
                          <strong className={styles.tareaEditTitulo}>{t.titulo}</strong>
                          <p className={styles.tareaEditDesc}>{t.descripcion}</p>
                        </div>
                        <div className={styles.tareaEditActions}>
                          <input
                            type="date"
                            className={styles.inputDateSmall}
                            value={t.fechaSugerida ? t.fechaSugerida.split('T')[0] : ''}
                            onChange={e => handleEditTareaRevision(i, 'fechaSugerida', new Date(e.target.value).toISOString())}
                          />
                          <button type="button" className={styles.btnIcon} onClick={() => handleEditTareaRevision(i, 'isEditing', true)} title="Editar detalle">
                            <SvgIcon name="edit" />
                          </button>
                          <button type="button" className={styles.btnIcon} onClick={() => handleEliminarTareaRevision(i)} title="Eliminar tarea">
                            <SvgIcon name="trash" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <button type="button" className={styles.btnSecondary} onClick={handleAgregarTareaRevision} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                  <SvgIcon name="plus" /> Agregar tarea manual
                </button>
              </div>

              <div className={styles.actionsRowSticky}>
                <button type="button" className={styles.btnSecondary} onClick={() => setPaso('form')} disabled={guardando}>Cancelar</button>
                <button type="button" className={styles.btnPrimary} style={{ background: '#006B3C', opacity: guardando ? 0.7 : 1 }} onClick={handleConfirmar} disabled={guardando}>
                  {guardando ? 'Guardando...' : <><SvgIcon name="check" /> Confirmar y registrar siembra</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <h2 className={styles.listTitle}>Historial de siembras</h2>
      <div className={styles.grid}>
        {siembras.filter(s => !filtroCultivo || s.cultivo === filtroCultivo).map(s => {
          const lote = lotes.find(l => l.id === s.loteId);
          const tareasSiembra = tareas.filter(t => t.siembraId === s.id);
          return (
            <div key={s.id} className={styles.siembraCard}>
              <div className={styles.leftSection}>
                <div className={styles.imgWrapper}>
                  {cropImageMap[s.cultivo] ? (
                    <img src={cropImageMap[s.cultivo]} alt="" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.cardIconWrap}>{cultivoIcon(s.cultivo)}</div>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardCultivo}>{s.cultivo}</h3>
                  <p className={styles.cardLote}>{lote?.nombre || 'Lote eliminado'} - {s.area || '&mdash;'} ha</p>
                </div>
              </div>

              <div className={styles.rightSection}>
                <div className={styles.dateItem}>
                  <SvgIcon name="calendar" /> {new Date(s.fechaSiembra).toLocaleDateString('es-ES')}
                </div>
                <div className={styles.dateItem}>
                  <SvgIcon name="calendar" /> Cosecha: {new Date(s.fechaCosechaEstimada).toLocaleDateString('es-ES')}
                </div>
                <span className={`${styles.badgeEstado} ${s.estado === 'activa' ? styles.badgeActiva : styles.badgeFinalizada}`}>
                  {s.estado}
                </span>

                {userRole !== 'empleado' && (
                  <div className={styles.cardActions}>
                    <button className={styles.btnIcon} onClick={() => setModalTareas(s.id)} title="Editar tareas">
                      <SvgIcon name="edit" />
                    </button>
                    <button className={styles.btnIcon} onClick={() => eliminarSiembra(s.id)} title="Eliminar siembra">
                      <SvgIcon name="trash" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {siembras.length === 0 && (
          <div className={styles.empty}>No hay siembras registradas. Crea la primera!</div>
        )}
      </div>

      {modalTareas && (() => {
        const siembra = siembras.find(s => s.id === modalTareas);
        if (!siembra) return null;
        const tareasSiembra = tareas.filter(t => t.siembraId === modalTareas).sort((a, b) => (a.orden || 0) - (b.orden || 0));

        return (
          <div className={styles.modalOverlay} onClick={() => setModalTareas(null)}>
            <div className={styles.modalFull} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}><SvgIcon name="edit" /> Editar siembra</h3>
                <button className={styles.modalClose} onClick={() => setModalTareas(null)}><SvgIcon name="x" /></button>
              </div>
              <div className={styles.modalBodyFull}>
                <div className={styles.editFormGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Lote</label>
                    <select className={styles.select} value={siembra.loteId} onChange={e => handleUpdateSiembraField(siembra.id, 'loteId', e.target.value)}>
                      {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Cultivo</label>
                    <select className={styles.select} value={siembra.cultivo} onChange={e => handleUpdateSiembraField(siembra.id, 'cultivo', e.target.value)}>
                      {getCultivos().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Fecha de siembra</label>
                    <input className={styles.input} type="date" value={siembra.fechaSiembra ? siembra.fechaSiembra.split('T')[0] : ''} onChange={e => handleUpdateSiembraField(siembra.id, 'fechaSiembra', new Date(e.target.value).toISOString())} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Area (ha)</label>
                    <input className={styles.input} type="number" value={siembra.area} onChange={e => handleUpdateSiembraField(siembra.id, 'area', Number(e.target.value))} />
                  </div>
                </div>

                <h4 className={styles.sectionTitleModal}><SvgIcon name="clipboard" /> Tareas ({tareasSiembra.length})</h4>
                <div className={styles.tareasEditList}>
                  {tareasSiembra.map(t => (
                    <div key={t.id} className={styles.tareaEditCard}>
                      {editingTaskModal === t.id ? (
                        <div className={styles.tareaEditFormInline}>
                          <div className={styles.inlineFieldRow}>
                            <input type="text" className={styles.input} style={{ flex: 1 }} value={editingTaskData.titulo} onChange={e => setEditingTaskData({ ...editingTaskData, titulo: e.target.value })} placeholder="Título de la tarea" autoFocus />
                            <select className={styles.select} style={{ width: '150px' }} value={editingTaskData.tipo} onChange={e => setEditingTaskData({ ...editingTaskData, tipo: e.target.value })}>
                              <option value="fertilizacion">Fertilización</option>
                              <option value="poda">Poda</option>
                              <option value="control_plagas">Plagas</option>
                              <option value="riego">Riego</option>
                              <option value="clipboard">Otra</option>
                            </select>
                          </div>
                          <input type="text" className={styles.input} value={editingTaskData.descripcion} onChange={e => setEditingTaskData({ ...editingTaskData, descripcion: e.target.value })} placeholder="Descripción (opcional)" />
                          <div className={styles.inlineFieldActions}>
                            <input
                              type="date"
                              className={styles.inputDateSmall}
                              value={editingTaskData.fechaSugerida ? editingTaskData.fechaSugerida.split('T')[0] : ''}
                              onChange={e => setEditingTaskData({ ...editingTaskData, fechaSugerida: new Date(e.target.value).toISOString() })}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="button" className={styles.btnSecondary} style={{ padding: '4px 12px', height: '32px' }} onClick={async () => {
                                try {
                                  await updateDoc(doc(db, 'tareas', t.id), {
                                    titulo: editingTaskData.titulo,
                                    descripcion: editingTaskData.descripcion,
                                    tipo: editingTaskData.tipo,
                                    fechaSugerida: editingTaskData.fechaSugerida
                                  });
                                  setEditingTaskModal(null);
                                } catch (e) { console.error(e); }
                              }}>OK</button>
                              <button type="button" className={styles.btnIcon} onClick={() => deleteDoc(doc(db, 'tareas', t.id))} title="Eliminar tarea">
                                <SvgIcon name="trash" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.tareaEditIcon}>{tipoIcon(t.tipo)}</div>
                          <div className={styles.tareaEditInfo}>
                            <strong className={styles.tareaEditTitulo}>{t.titulo}</strong>
                            <p className={styles.tareaEditDesc}>{t.descripcion}</p>
                          </div>
                          <div className={styles.tareaEditActions}>
                            <input
                              type="date"
                              className={styles.inputDateSmall}
                              value={t.fechaSugerida ? t.fechaSugerida.split('T')[0] : ''}
                              onChange={e => updateDoc(doc(db, 'tareas', t.id), { fechaSugerida: new Date(e.target.value).toISOString() })}
                            />
                            <button type="button" className={styles.btnIcon} onClick={() => { setEditingTaskModal(t.id); setEditingTaskData(t); }} title="Editar detalle">
                              <SvgIcon name="edit" />
                            </button>
                            <button className={styles.btnIcon} onClick={() => deleteDoc(doc(db, 'tareas', t.id))} title="Eliminar tarea">
                              <SvgIcon name="trash" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {tareasSiembra.length === 0 && (
                    <div className={styles.empty}>Esta siembra no tiene tareas generadas</div>
                  )}
                  <button type="button" className={styles.btnSecondary} onClick={async () => {
                    try {
                      await addDoc(collection(db, 'tareas'), {
                        siembraId: siembra.id,
                        tipo: 'clipboard',
                        titulo: 'Nueva tarea',
                        descripcion: '',
                        fechaSugerida: new Date().toISOString(),
                        estado: 'Generado',
                        createdAt: serverTimestamp(),
                        cultivo: siembra.cultivo,
                      });
                    } catch (err) { console.error(err); }
                  }} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                    <SvgIcon name="plus" /> Agregar tarea manual
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Eliminar siembra?</h3>
            <p className={styles.confirmText}>Esta acción no se puede deshacer. Se eliminarán la siembra y todas sus tareas asociadas.</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnSecondary} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className={styles.btnDanger} onClick={ejecutarEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
