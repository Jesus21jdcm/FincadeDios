import { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, getDoc, where, orderBy, runTransaction, Timestamp, addDoc, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAppContext } from '../context/AppContext';
import { notificarEncargado, notificarExcepcionAdHoc } from '../utils/whatsapp';
import styles from './PanelEmpleado.module.css';

const comprimirImagen = (file, maxW = 800, calidad = 0.7) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Error al leer la imagen'));
  reader.onload = e => {
    const img = new Image();
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxW) { height = Math.round(height * maxW / width); width = maxW; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const timeout = setTimeout(() => reject(new Error('Tiempo de espera agotado al comprimir')), 10000);
      canvas.toBlob(blob => { clearTimeout(timeout); resolve(blob); }, 'image/jpeg', calidad);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

export default function PanelEmpleado() {
  const { userData, user } = useAppContext();
  const [tareas, setTareas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [confirmando, setConfirmando] = useState(null);
  const [evidenciaPreview, setEvidenciaPreview] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);
  const [insumosUsados, setInsumosUsados] = useState([{ id: '', cantidad: '' }]);
  const [adHocActivo, setAdHocActivo] = useState(false);
  const [adHocNombre, setAdHocNombre] = useState('');
  const [adHocCantidad, setAdHocCantidad] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(null);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [siembras, setSiembras] = useState([]);
  const fileRef = useRef(null);

  const uid = user?.uid;
  const userId = userData?.id || uid;

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(
      query(collection(db, 'tareas'), where('idEmpleado', '==', userId)),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(a.fechaSugerida || 0) - new Date(b.fechaSugerida || 0));
        setTareas(docs);
      }
    );
    return unsub;
  }, [userId]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'inventario')), snap => {
      setInsumos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubLotes = onSnapshot(collection(db, 'lotes'), snap => setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSiembras = onSnapshot(collection(db, 'siembras'), snap => setSiembras(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubLotes(); unsubSiembras(); };
  }, []);

  const pendientes = tareas.filter(t => t.estado === 'Asignado' || t.estado === 'Atrasado');
  const ejecutadas = tareas.filter(t => t.estado === 'Ejecutado' || t.estado === 'Validado');
  const vencidas = pendientes.filter(t => new Date(t.fechaSugerida) < new Date());

  const SvgCheck = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
  const SvgClock = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
  const SvgCalendar = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  const SvgAlert = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
  const SvgCamera = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
  const SvgBox = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
  const SvgClipboard = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>;
  const SvgUser = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

  const finalizarTarea = async (tareaId) => {
    try {
      setSubiendo(true);
      const validInsumos = insumosUsados.filter(i => i.id && i.cantidad);
      const file = fileRef.current?.files?.[0];

      // 1. Update basic fields to trigger instant UI update
      await updateDoc(doc(db, 'tareas', tareaId), {
        estado: 'Ejecutado',
        fechaEjecucion: new Date().toISOString(),
        insumosConsumidos: validInsumos.length > 0 ? validInsumos : null,
      });

      // 2. Close modal instantly for the user
      if (fileRef.current) fileRef.current.value = '';
      setConfirmando(null);
      setEvidenciaPreview(null);
      setInsumosUsados([{ id: '', cantidad: '' }]);

      // 3. Process image upload in background if present
      if (file) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        if (cloudName && uploadPreset) {
          comprimirImagen(file).then(blob => {
            const formData = new FormData();
            formData.append('file', blob);
            formData.append('upload_preset', uploadPreset);
            return fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData
            });
          })
            .then(res => res.json())
            .then(data => {
              if (data.secure_url) {
                updateDoc(doc(db, 'tareas', tareaId), { evidencia: data.secure_url });
              }
            })
            .catch(err => console.error('Error subiendo imagen en background:', err));
        }
      }

      // 4. Update inventory in background
      for (const item of validInsumos) {
        try {
          await runTransaction(db, async (tx) => {
            const d = doc(db, 'inventario', item.id);
            const s = await tx.get(d);
            if (s.exists) tx.update(d, { stock: s.data().stock - Number(item.cantidad), ultimaActualizacion: Timestamp.now() });
          });
        } catch (e) { }
      }

      // 5. Register Ad-hoc exceptions and notify admins in background
      if (adHocActivo && adHocNombre && adHocCantidad) {
        addDoc(collection(db, 'excepciones'), {
          tareaId,
          insumoNombre: adHocNombre,
          cantidad: Number(adHocCantidad),
          reportadoPor: userId,
          nombreEmpleado: userData?.nombre || 'Empleado',
          fecha: new Date().toISOString(),
          estado: 'pendiente',
        }).catch(() => { });

        const qAdmin = query(collection(db, 'usuarios'), where('rol', '==', 'admin'));
        getDocs(qAdmin).then(admins => {
          admins.forEach(d => {
            if (d.data().telefono) {
              notificarExcepcionAdHoc({
                adminTelefono: d.data().telefono,
                empleadoNombre: userData?.nombre || 'Empleado',
                insumoNombre: adHocNombre,
                cantidad: adHocCantidad,
                loteNombre: tareas.find(x => x.id === tareaId)?.cultivo || '?',
              });
            }
          });
        }).catch(() => { });
      }

      // 6. Notify supervisor in background
      const t = tareas.find(x => x.id === tareaId);
      if (t?.idEncargado) {
        getDoc(doc(db, 'usuarios', t.idEncargado)).then(d => {
          if (d.exists()) notificarEncargado({ encargadoTelefono: d.data().telefono, empleadoNombre: userData?.nombre || 'Empleado', tareaTitulo: t.titulo, tareaId });
        }).catch(() => { });
      }

      setAdHocActivo(false);
      setAdHocNombre('');
      setAdHocCantidad('');
    } catch (err) {
      alert('Error al finalizar tarea: ' + (err.message || 'desconocido'));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Mis tareas</h1>
        <p className={styles.subtitle}>Bienvenido, {userData?.nombre || 'Empleado'}</p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Pendientes
          {pendientes.length > 0 && <span className={styles.badge}>{pendientes.length}</span>}
        </h2>
        {pendientes.length === 0 ? (
          <div className={styles.empty}>No tienes tareas pendientes</div>
        ) : (
          <div className={styles.list}>
            {pendientes.map(t => (
              <div key={t.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIcon}>{SvgClipboard}</div>
                  <div className={styles.cardInfo}>
                    <strong className={styles.cardTitle}>{t.titulo}</strong>
                    <div className={styles.cardMetaRow}>
                      <span className={styles.cardMeta}>
                        {SvgCalendar} {new Date(t.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </span>
                      <span className={styles.cardCultivo}>
                        {(() => {
                          const siembra = siembras.find(s => s.id === t.siembraId);
                          const lote = lotes.find(l => l.id === siembra?.loteId);
                          return lote ? `${lote.nombre} • ${t.cultivo || '?'}` : (t.cultivo || '?');
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
                {t.descripcion && <p className={styles.cardDesc}>{t.descripcion}</p>}
                {new Date(t.fechaSugerida) < new Date() && (
                  <div className={styles.cardAlerta}>{SvgAlert} Vencida</div>
                )}

                {confirmando === t.id ? (
                  <div className={styles.confirmBox}>
                    <div className={styles.confirmBoxTop}>
                      {SvgCheck}
                      <span>Finalizar esta tarea</span>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>{SvgBox} Insumos utilizados (opcional)</label>
                      {insumosUsados.map((item, idx) => (
                        <div key={idx} className={styles.insumoRowMulti} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                          <select className={styles.select} value={item.id} onChange={e => {
                            const newInsumos = [...insumosUsados];
                            newInsumos[idx].id = e.target.value;
                            setInsumosUsados(newInsumos);
                          }} style={{ flex: 1 }}>
                            <option value="">Seleccionar insumo</option>
                            {insumos.filter(i => i.stock > 0).map(i => (
                              <option key={i.id} value={i.id}>{i.nombre} — {i.stock} {i.unidad}</option>
                            ))}
                          </select>
                          {item.id && (
                            <input className={styles.input} type="number" value={item.cantidad} onChange={e => {
                              const newInsumos = [...insumosUsados];
                              newInsumos[idx].cantidad = e.target.value;
                              setInsumosUsados(newInsumos);
                            }} placeholder="Cant." min="0.1" step="0.1" style={{ width: '80px' }} />
                          )}
                          {idx > 0 && (
                            <button className={styles.btnRemove} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0 4px' }} onClick={() => {
                              const newInsumos = [...insumosUsados];
                              newInsumos.splice(idx, 1);
                              setInsumosUsados(newInsumos);
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button className={styles.btnAdHoc} style={{ width: 'fit-content', padding: '0 12px' }} onClick={() => setInsumosUsados([...insumosUsados, { id: '', cantidad: '' }])}>
                          + Agregar otro
                        </button>
                        <button className={styles.btnAdHoc} style={{ width: 'fit-content', padding: '0 12px' }} onClick={() => setAdHocActivo(!adHocActivo)}>
                          + Insumo externo
                        </button>
                      </div>
                    </div>
                    {adHocActivo && (
                      <div className={styles.adHocBox}>
                        <div className={styles.adHocHeader}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                          <span>Insumo no inventariado</span>
                        </div>
                        <div className={styles.adHocFields}>
                          <input className={styles.input} value={adHocNombre} onChange={e => setAdHocNombre(e.target.value)} placeholder="Nombre del insumo" />
                          <input className={styles.input} type="number" value={adHocCantidad} onChange={e => setAdHocCantidad(e.target.value)} placeholder="Cantidad" min="0.1" step="0.1" />
                        </div>
                      </div>
                    )}
                    <div className={styles.field}>
                      <label className={styles.label}>{SvgCamera} Foto de evidencia (opcional)</label>
                      <div className={styles.fileInputWrapper} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input ref={fileRef} type="file" accept="image/*" className={styles.fileInputHidden} style={{ display: 'none' }}
                          onChange={e => { if (e.target.files[0]) setEvidenciaPreview(URL.createObjectURL(e.target.files[0])); }} />
                        <button className={styles.btnFile} onClick={() => fileRef.current?.click()}>
                          {SvgCamera} {evidenciaPreview ? 'Cambiar foto' : 'Seleccionar foto'}
                        </button>
                        {evidenciaPreview && (
                          <img
                            src={evidenciaPreview}
                            alt="Preview"
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0', border: '1px solid var(--color-border)' }}
                          />
                        )}
                      </div>
                    </div>
                    <div className={styles.confirmActions}>
                      <button className={styles.btnSecondary} onClick={() => { setConfirmando(null); setEvidenciaPreview(null); setInsumosUsados([{ id: '', cantidad: '' }]); setAdHocActivo(false); setAdHocNombre(''); setAdHocCantidad(''); }}>Cancelar</button>
                      <button className={styles.btnPrimary} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 600 }} onClick={() => setShowFinalConfirm(t.id)} disabled={subiendo}>
                        {subiendo ? `Subiendo ${progresoSubida}%` : SvgCheck}
                        {subiendo ? '' : ' Finalizar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    {t.estado !== 'Atrasado' && t.fechaSugerida && new Date(t.fechaSugerida).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && (
                      <button className={styles.btnAtraso} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 600, flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={async () => {
                        try {
                          await updateDoc(doc(db, 'tareas', t.id), { estado: 'Atrasado' });
                          await addDoc(collection(db, 'notificaciones'), {
                            titulo: 'Atraso Reportado',
                            mensaje: `El empleado ha reportado un atraso en la tarea: ${t.titulo}`,
                            fecha: new Date().toISOString(),
                            leida: false,
                            tipo: 'alerta',
                            tareaId: t.id
                          });
                          alert('Notificó que está atrasado.');
                        } catch (err) {
                          alert('Error al reportar atraso');
                        }
                      }}>
                        {SvgAlert} Reportar Atraso
                      </button>
                    )}
                    <button className={styles.btnFinalizar} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 600, flex: 1 }} onClick={() => setConfirmando(t.id)}>
                      {SvgCheck} Finalizar Tarea
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Completadas</h2>
        {ejecutadas.length === 0 ? (
          <div className={styles.empty}>Aún no has completado ninguna tarea</div>
        ) : (
          <div className={styles.list}>
            {ejecutadas.map(t => (
              <div key={t.id} className={`${styles.card} ${styles.cardDone}`}>
                <div className={styles.cardTop}>
                  <div className={`${styles.cardIcon} ${t.estado === 'Validado' ? styles.iconValidado : styles.iconEjecutado}`}>
                    {t.estado === 'Validado' ? SvgCheck : SvgClock}
                  </div>
                  <div className={styles.cardInfo}>
                    <strong className={styles.cardTitle}>{t.titulo}</strong>
                    <div className={styles.cardMetaRow}>
                      <span className={styles.cardMeta}>
                        {SvgCalendar} {new Date(t.fechaSugerida).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </span>
                      <span className={styles.cardCultivo}>
                        {(() => {
                          const siembra = siembras.find(s => s.id === t.siembraId);
                          const lote = lotes.find(l => l.id === siembra?.loteId);
                          return lote ? `${lote.nombre} • ${t.cultivo || '?'}` : (t.cultivo || '?');
                        })()}
                      </span>
                    </div>
                  </div>
                  <span className={`${styles.estadoTag} ${styles[t.estado]}`}>{t.estado}</span>
                  {t.evidencia && (
                    <img
                      src={t.evidencia}
                      alt="Evidencia"
                      className={styles.evidenciaThumb}
                      onClick={() => setImagenAmpliada(t.evidencia)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showFinalConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIconWrap}>{SvgAlert}</div>
            <h3 className={styles.modalTitle}>¿Finalizar tarea?</h3>
            <p className={styles.modalText}>Verifica que la foto y los insumos sean correctos. Esta acción descontará automáticamente el inventario y no se puede deshacer.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnCancel} onClick={() => setShowFinalConfirm(null)}>Cancelar</button>
              <button className={styles.modalBtnConfirm} onClick={() => { finalizarTarea(showFinalConfirm); setShowFinalConfirm(null); }}>
                Sí, finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {imagenAmpliada && (
        <div className={styles.modalOverlay} onClick={() => setImagenAmpliada(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setImagenAmpliada(null)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <img src={imagenAmpliada} alt="Vista ampliada" className={styles.fotoFull} />
          </div>
        </div>
      )}
    </div>
  );
}
