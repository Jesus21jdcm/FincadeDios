import { useState, useEffect, useRef } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, orderBy, getDocs, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notificarAlerta } from '../utils/whatsapp';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { useAppContext } from '../context/AppContext';
import styles from './Monitoreo.module.css';

const SvgCamera = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const SvgImage = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const SvgAlertCircle = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const SvgClock = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const SvgTrash = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;

const SALUD_OPCIONES = [
  { valor: 'Saludable', color: '#16A34A', icono: '' },
  { valor: 'Alerta', color: '#D97706', icono: '' },
  { valor: 'Critico', color: '#DC2626', icono: '' },
];

export default function Monitoreo() {
  const { userRole } = useAppContext();
  const [lotes, setLotes] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState('');
  const [capturando, setCapturando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [comentario, setComentario] = useState('');
  const [salud, setSalud] = useState('Saludable');
  const [subiendo, setSubiendo] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  // Feed general
  const [viewMode, setViewMode] = useState(userRole !== 'empleado' ? 'feed' : 'lote');
  const [globalFeed, setGlobalFeed] = useState([]);
  const [globalFotosMap, setGlobalFotosMap] = useState({});
  const [filtroSaludGlobal, setFiltroSaludGlobal] = useState('Todos');
  const [usuarios, setUsuarios] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'usuarios')), snap => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (lotes.length === 0) return;
    const unsubs = lotes.map(lote => {
      return onSnapshot(
        query(collection(db, 'lotes', lote.id, 'fotos'), orderBy('fecha', 'desc')),
        (snap) => {
          const fotosLote = snap.docs.map(d => ({
            id: d.id,
            loteId: lote.id,
            loteNombre: lote.nombre,
            cultivo: lote.cultivo,
            ...d.data()
          }));
          setGlobalFotosMap(prev => {
            const next = { ...prev, [lote.id]: fotosLote };
            const flat = Object.values(next).flat().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            setGlobalFeed(flat);
            return next;
          });
        }
      );
    });
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [lotes]);

  useEffect(() => {
    if (!loteSeleccionado) return;
    const unsub = onSnapshot(
      query(collection(db, 'lotes', loteSeleccionado, 'fotos'), orderBy('fecha', 'desc')),
      snap => {
        setFotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return unsub;
  }, [loteSeleccionado]);

  const iniciarCamara = async () => {
    setCapturando(true);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert('No se pudo acceder a la cámara');
      setCapturando(false);
    }
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPreview(dataUrl);
    detenerCamara();
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCapturando(false);
  };

  const subirFoto = async () => {
    if (!preview || !loteSeleccionado) return;
    setSubiendo(true);
    try {
      let url = '';
      try {
        console.log("Intentando subir a Cloudinary...");
        url = await uploadImageToCloudinary(preview);
        console.log("Subida a Cloudinary exitosa:", url);
      } catch (cloudinaryError) {
        console.warn("Cloudinary falló, intentando con Firebase Storage...", cloudinaryError);
        const blob = await (await fetch(preview)).blob();
        const fileName = `monitoreo/${loteSeleccionado}/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        url = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'lotes', loteSeleccionado, 'fotos'), {
        url,
        fecha: new Date().toISOString(),
        usuario: auth.currentUser.uid,
        comentario,
        salud,
        estadoRevision: 'pendiente',
      });

      if (salud === 'Critico' || salud === 'Alerta') {
        const lote = lotes.find(l => l.id === loteSeleccionado);
        await addDoc(collection(db, 'alertas'), {
          tipo: salud === 'Critico' ? 'critico' : 'alerta',
          titulo: `Problema de Salud: ${salud}`,
          descripcion: comentario || `Se reportó estado de salud ${salud} en lote ${lote?.nombre}`,
          loteId: loteSeleccionado,
          loteNombre: lote?.nombre || loteSeleccionado,
          cultivo: lote?.cultivo || '—',
          fotoUrl: url,
          reportadoPor: auth.currentUser.uid,
          fecha: new Date().toISOString(),
          estado: 'pendiente',
          target: 'monitoreo'
        });

        const q = query(collection(db, 'usuarios'), where('rol', '==', 'admin'));
        const admins = await getDocs(q);
        admins.forEach(d => {
          if (d.data().telefono) {
            notificarAlerta({
              adminTelefono: d.data().telefono,
              loteNombre: lote?.nombre || loteSeleccionado,
              cultivo: lote?.cultivo || '—',
              reportadoPor: auth.currentUser.email || 'Desconocido',
              fotoUrl: url,
              nivel: salud
            });
          }
        });
      }

      setPreview(null);
      setComentario('');
      setSalud('Saludable');
    } catch (err) {
      alert('Error al subir: ' + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(null);

  const marcarComoRevisado = async (loteId, fotoId, fotoUrl) => {
    try {
      await updateDoc(doc(db, 'lotes', loteId, 'fotos', fotoId), {
        estadoRevision: 'revisado'
      });
      if (fotoUrl) {
        const alertasQ = query(collection(db, 'alertas'), where('fotoUrl', '==', fotoUrl), where('estado', '==', 'pendiente'));
        const alertasSnap = await getDocs(alertasQ);
        alertasSnap.forEach(async (alertaDoc) => {
          await updateDoc(doc(db, 'alertas', alertaDoc.id), { estado: 'revisado' });
        });
      }
    } catch (err) {
      alert('Error al marcar como revisado: ' + err.message);
    }
  };

  const iniciarEliminacion = (loteId, fotoId) => {
    setConfirmDelete({ loteId, fotoId });
  };

  const ejecutarEliminar = async () => {
    if (!confirmDelete) return;
    const { loteId, fotoId } = confirmDelete;
    try {
      await deleteDoc(doc(db, 'lotes', loteId, 'fotos', fotoId));
      setConfirmDelete(null);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const lote = lotes.find(l => l.id === loteSeleccionado);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Monitoreo de Cultivos</h1>
          <p className={styles.subtitle}>Captura fotos y reporta el estado de salud de los lotes</p>
        </div>
      </div>

      {userRole !== 'empleado' && (
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'feed' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('feed')}
          >
            Feed de toda la Finca
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'lote' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('lote')}
          >
            Monitorear Lote
          </button>
        </div>
      )}

      {viewMode === 'feed' && userRole !== 'empleado' && (
        <div className={styles.feedContainer}>
          <div className={styles.feedFilters}>
            <span className={styles.filterTitle}>Filtrar por salud:</span>
            {['Todos', 'Saludable', 'Alerta', 'Critico'].map(estado => (
              <button
                key={estado}
                className={`${styles.filterChip} ${filtroSaludGlobal === estado ? styles.chipActive : ''}`}
                onClick={() => setFiltroSaludGlobal(estado)}
              >
                {estado === 'Todos' ? 'Todos' : estado === 'Saludable' ? 'Saludable' : estado === 'Alerta' ? 'Alerta' : 'Crítico'}
              </button>
            ))}
          </div>

          {globalFeed.filter(f => filtroSaludGlobal === 'Todos' || f.salud === filtroSaludGlobal).length === 0 ? (
            <div className={styles.emptyState}>
              No hay reportes de monitoreo en este estado de salud.
            </div>
          ) : (
            <div className={styles.feedGrid}>
              {globalFeed
                .filter(f => filtroSaludGlobal === 'Todos' || f.salud === filtroSaludGlobal)
                .map(foto => {
                  const creador = usuarios.find(u => u.id === foto.usuario);
                  return (
                    <div key={foto.id} className={styles.feedCard} onClick={() => setFotoAmpliada(foto.url)}>
                      <div className={styles.feedCardHeader}>
                        <div className={styles.feedCardInfo}>
                          <strong>{foto.loteNombre}</strong>
                          <span className={styles.badgeCultivo}>{foto.cultivo}</span>
                        </div>
                        <div className={styles.feedCardHeaderActions}>
                          <span className={`${styles.feedCardSaludTag} ${
                            foto.salud === 'Critico' ? styles.tagCritico : foto.salud === 'Alerta' ? styles.tagAlerta : styles.tagSaludable
                          }`}>
                            {foto.salud}
                          </span>
                          <span className={`${styles.feedCardRevisionTag} ${
                            foto.estadoRevision === 'revisado' ? styles.tagRevisado : styles.tagPendiente
                          }`}>
                            {foto.estadoRevision === 'revisado' ? 'Revisado' : 'Pendiente'}
                          </span>
                          {userRole !== 'empleado' && (
                            <button
                              className={styles.deleteBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                iniciarEliminacion(foto.loteId, foto.id);
                              }}
                              title="Eliminar reporte"
                            >
                              {SvgTrash}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={styles.feedCardImgWrapper}>
                        <img src={foto.url} alt="Evidencia de salud" className={styles.feedCardImg} />
                      </div>

                      <div className={styles.feedCardFooter}>
                        {foto.comentario && <p className={styles.feedCardComment}>"{foto.comentario}"</p>}
                        <div className={styles.feedCardMeta}>
                          <span className={styles.feedCardUser}>Usuario: {creador?.nombre || 'Empleado'}</span>
                          <span className={styles.feedCardDate}>
                            {SvgClock} {new Date(foto.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {userRole !== 'empleado' && foto.estadoRevision !== 'revisado' && (
                          <div className={styles.feedCardActionsBottom}>
                             <button
                               className={styles.btnReview}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 marcarComoRevisado(foto.loteId, foto.id, foto.url);
                               }}
                             >
                               Marcar como Revisado
                             </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {(viewMode === 'lote' || userRole === 'empleado') && (
        <div className={styles.loteSelector}>
          <label className={styles.selectorLabel}>{SvgImage} Lote a monitorear</label>
          <select className={styles.select} value={loteSeleccionado} onChange={e => setLoteSeleccionado(e.target.value)}>
            <option value="">Seleccionar lote</option>
            {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.cultivo}</option>)}
          </select>
        </div>
      )}

      {(viewMode === 'lote' || userRole === 'empleado') && loteSeleccionado && (
        <div className={styles.content}>
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                {SvgCamera}
                <span>Capturar evidencia</span>
              </div>
              <div className={styles.cardBody}>
                {!capturando && !preview && (
                  <div className={styles.captureOptions}>
                    <button className={styles.camBtn} onClick={iniciarCamara}>
                      {SvgCamera}
                      <span className={styles.camBtnLabel}>Abrir cámara</span>
                      <span className={styles.camBtnHint}>Toma una foto en tiempo real</span>
                    </button>

                    <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                      {SvgImage}
                      <span className={styles.camBtnLabel}>Subir foto</span>
                      <span className={styles.camBtnHint}>Selecciona una imagen desde tu dispositivo</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {capturando && (
                  <div className={styles.viewfinder}>
                    <video ref={videoRef} autoPlay playsInline className={styles.video} />
                    <div className={styles.camActions}>
                      <button className={styles.btnSecondary} onClick={detenerCamara}>Cancelar</button>
                      <button className={styles.btnPrimary} onClick={capturarFoto}>Capturar foto</button>
                    </div>
                  </div>
                )}

                {preview && (
                  <div className={styles.previewSection}>
                    <img src={preview} alt="Preview" className={styles.preview} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div className={styles.saludSelector}>
                      <label className={styles.label}>Estado de salud</label>
                      <div className={styles.saludOptions}>
                        {SALUD_OPCIONES.map(op => (
                          <button
                            key={op.valor}
                            className={`${styles.saludBtn} ${salud === op.valor ? styles.saludActivo : ''}`}
                            style={{ borderColor: salud === op.valor ? op.color : 'transparent', background: salud === op.valor ? `${op.color}15` : 'transparent' }}
                            onClick={() => setSalud(op.valor)}
                          >
                            <span style={{ color: op.color }}>{op.icono}</span>
                            {op.valor}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Comentario</label>
                      <input className={styles.input} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Ej: Buen estado, sin plagas" />
                    </div>
                    <div className={styles.previewActions}>
                      <button className={styles.btnSecondary} onClick={() => { setPreview(null); detenerCamara(); }}>Retomar</button>
                      <button className={styles.btnPrimary} onClick={subirFoto} disabled={subiendo}>
                        {subiendo ? 'Subiendo...' : 'Subir foto'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                {SvgImage}
                <span>Historial fotográfico ({fotos.length})</span>
              </div>
              <div className={styles.cardBody}>
                {fotos.length === 0 ? (
                  <div className={styles.empty}>
                    {SvgAlertCircle}
                    <span>Aún no hay fotos para este lote</span>
                  </div>
                ) : (
                  <div className={styles.feedGrid}>
                    {fotos.map(f => {
                      const creador = usuarios.find(u => u.id === f.usuario);
                      return (
                        <div key={f.id} className={styles.feedCard} onClick={() => setFotoAmpliada(f.url)}>
                          <div className={styles.feedCardHeader}>
                            <div className={styles.feedCardInfo}>
                              <strong>{lote?.nombre}</strong>
                              <span className={styles.badgeCultivo}>{lote?.cultivo}</span>
                            </div>
                            <div className={styles.feedCardHeaderActions}>
                              <span className={`${styles.feedCardSaludTag} ${
                                f.salud === 'Critico' ? styles.tagCritico : f.salud === 'Alerta' ? styles.tagAlerta : styles.tagSaludable
                              }`}>
                                {f.salud}
                              </span>
                              <span className={`${styles.feedCardRevisionTag} ${
                                f.estadoRevision === 'revisado' ? styles.tagRevisado : styles.tagPendiente
                              }`}>
                                {f.estadoRevision === 'revisado' ? 'Revisado' : 'Pendiente'}
                              </span>
                              {userRole !== 'empleado' && (
                                <button
                                  className={styles.deleteBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    iniciarEliminacion(loteSeleccionado, f.id);
                                  }}
                                  title="Eliminar reporte"
                                >
                                  {SvgTrash}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className={styles.feedCardImgWrapper}>
                            <img src={f.url} alt="Evidencia de salud" className={styles.feedCardImg} />
                          </div>
                          
                          <div className={styles.feedCardFooter}>
                            {f.comentario && <p className={styles.feedCardComment}>"{f.comentario}"</p>}
                            <div className={styles.feedCardMeta}>
                              <span className={styles.feedCardUser}>Usuario: {creador?.nombre || 'Empleado'}</span>
                              <span className={styles.feedCardDate}>
                                {SvgClock} {new Date(f.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {userRole !== 'empleado' && f.estadoRevision !== 'revisado' && (
                              <div className={styles.feedCardActionsBottom}>
                                <button
                                  className={styles.btnReview}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    marcarComoRevisado(loteSeleccionado, f.id, f.url);
                                  }}
                                >
                                  Marcar como Revisado
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {fotoAmpliada && (
        <div className={styles.modalOverlay} onClick={() => setFotoAmpliada(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setFotoAmpliada(null)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <img src={fotoAmpliada} alt="Foto ampliada" className={styles.fotoFull} />
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Eliminar reporte?</h3>
            <p className={styles.confirmText}>Esta acción no se puede deshacer. La imagen se eliminará permanentemente del historial de monitoreo.</p>
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
