import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from '../context/AppContext';
import styles from './Lotes.module.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickMarker({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function LoteMap({ lote, onSaveUbicacion }) {
  const pos = lote?.ubicacion ? [lote.ubicacion.lat, lote.ubicacion.lng] : [7.5, -72.5];

  return (
    <MapContainer center={pos} zoom={lote?.ubicacion ? 15 : 6} className={styles.map} scrollWheelZoom={true}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {lote?.ubicacion && (
        <Marker position={pos}>
          <Popup>{lote.nombre}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

const SvgMapPin = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const SvgPlus = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SvgEdit = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const SvgTrash = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const SvgImage = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const SvgAlertCircle = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const SvgCheck = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const SvgMountain = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3l4 8 5-5 5 15H2L8 3z"/></svg>;

const getCultivoImage = (cultivo) => {
  const norm = cultivo?.toLowerCase() || '';
  if (norm.includes('cacao')) return '/cacao.perfil.jpg';
  if (norm.includes('maíz') || norm.includes('maiz')) return '/maiz.perfil.jpg';
  if (norm.includes('plátano') || norm.includes('platano')) return '/platano.perfil.jpg';
  if (norm.includes('yuca')) return '/yuca.perfil.jpg';
  return null;
};

export default function Lotes({ autoOpenForm }) {
  const { userRole } = useAppContext();
  const [lotes, setLotes] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);
  const [form, setForm] = useState({ nombre: '', cultivo: '', area: '', ubicacion: null, foto: null });
  const [editLote, setEditLote] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre || !form.cultivo) {
      setError('Nombre y cultivo son obligatorios');
      return;
    }
    try {
      setSubiendo(true);
      let fotoUrl = editLote?.fotoUrl || null;
      if (form.foto) {
        const ext = form.foto.name.split('.').pop();
        const fileName = `lotes/${Date.now()}.${ext}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, form.foto);
        fotoUrl = await getDownloadURL(storageRef);
      }
      const data = {
        nombre: form.nombre,
        cultivo: form.cultivo,
        area: Number(form.area) || 0,
        ubicacion: form.ubicacion || null,
        activo: true,
        aplicaciones: [],
        fechaSiembra: null,
        fechaCosecha: null,
        fotoUrl,
      };
      if (editLote) {
        await updateDoc(doc(db, 'lotes', editLote.id), data);
      } else {
        await addDoc(collection(db, 'lotes'), data);
      }
      setForm({ nombre: '', cultivo: '', area: '', ubicacion: null, foto: null });
      setShowForm(false);
      setEditLote(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const handleEdit = (lote) => {
    setEditLote(lote);
    setForm({
      nombre: lote.nombre,
      cultivo: lote.cultivo,
      area: lote.area?.toString() || '',
      ubicacion: lote.ubicacion || null,
      foto: null,
    });
    setShowForm(true);
  };

  const cultivoOptions = ['Cacao', 'Plátano', 'Maíz', 'Yuca'];

  const confirmDelete = (lote) => {
    setDeleteTarget(lote);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setEliminando(true);
      await deleteDoc(doc(db, 'lotes', deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
      setDeleteTarget(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Lotes y Cultivos</h1>
          <p className={styles.subtitle}>{lotes.length} lotes registrados</p>
        </div>
        {userRole !== 'empleado' && (
          <button 
            className={showForm ? styles.btnCancelarTop : styles.btnNuevo} 
            onClick={() => { setShowForm(!showForm); setEditLote(null); setForm({ nombre: '', cultivo: '', area: '', ubicacion: null, foto: null }); }}
          >
            {showForm ? 'Cancelar' : <>{SvgPlus} Nuevo lote</>}
          </button>
        )}
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre del lote</label>
              <input className={styles.input} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Lote-001" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Cultivo</label>
              <select className={styles.select} value={form.cultivo} onChange={e => setForm(f => ({ ...f, cultivo: e.target.value }))}>
                <option value="">Seleccionar</option>
                <option value="Cacao">Cacao</option>
                <option value="Plátano">Plátano</option>
                <option value="Maíz">Maíz</option>
                <option value="Yuca">Yuca</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Area (hectareas)</label>
              <input className={styles.input} type="number" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="2.5" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Foto del area</label>
              <div className={styles.fileInputWrapper}>
                <label className={styles.fileInputLabel}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {form.foto ? form.foto.name : (editLote?.fotoUrl ? 'Cambiar foto' : 'Seleccionar foto')}
                  <input type="file" accept="image/*" className={styles.fileInputHidden} onChange={e => setForm(f => ({ ...f, foto: e.target.files[0] }))} />
                </label>
                {editLote?.fotoUrl && !form.foto && (
                  <span className={styles.fotoActual}>Foto actual guardada</span>
                )}
              </div>
            </div>
          </div>
          <p className={styles.formHint}>{SvgMapPin} La ubicacion se asigna desde el mapa al crear o editar el lote.</p>
          <button 
            className={editLote ? styles.btnSubmitEdit : styles.btnSubmit} 
            type="submit" 
            disabled={subiendo} 
            style={{ width: '100%' }}
          >
            {subiendo ? 'Guardando...' : <>{editLote ? 'Actualizar lote' : 'Guardar lote'}</>}
          </button>
        </form>
      )}

      <div className={styles.grid}>
        {lotes.map(lote => (
          <div key={lote.id} className={styles.loteCard}>
            <div className={styles.cardTop}>
              <div className={styles.imgWrapper}>
                {lote.fotoUrl || getCultivoImage(lote.cultivo) ? (
                  <img src={lote.fotoUrl || getCultivoImage(lote.cultivo)} alt="" className={styles.loteCardImg} />
                ) : (
                  <div className={styles.loteIconPlaceholder}>{SvgMountain}</div>
                )}
              </div>
              <div className={styles.loteInfo}>
                <h3 className={styles.loteName}>{lote.nombre}</h3>
                <span className={styles.loteCultivo}>{lote.cultivo}</span>
              </div>
              {userRole !== 'empleado' && (
                <div className={styles.loteActions}>
                  <button className={styles.editBtn} onClick={() => handleEdit(lote)} title="Editar">{SvgEdit}</button>
                  <button className={styles.deleteBtn} onClick={() => confirmDelete(lote)} title="Eliminar">{SvgTrash}</button>
                </div>
              )}
            </div>
            <div className={styles.loteMeta}>
              <span>{SvgMapPin} {lote.area || '—'} ha</span>
              <span>{SvgCheck} {lote.aplicaciones?.length || 0} aplicaciones</span>
            </div>
          </div>
        ))}
        {lotes.length === 0 && (
          <div className={styles.empty}>No hay lotes registrados. Crea el primero.</div>
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
            <h3 className={styles.modalTitle}>¿Eliminar lote?</h3>
            <p className={styles.modalText}>
              Se eliminara <strong>{deleteTarget.nombre}</strong> y todos sus datos. Esta accion no se puede deshacer.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)} disabled={eliminando}>Cancelar</button>
              <button className={styles.btnConfirmDelete} onClick={handleDelete} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
