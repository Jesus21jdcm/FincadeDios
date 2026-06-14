import { useState, useEffect, useRef } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, orderBy, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notificarAlertaCritica } from '../utils/whatsapp';
import styles from './Monitoreo.module.css';

const SvgCamera = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const SvgImage = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const SvgAlertCircle = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const SvgClock = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

const SALUD_OPCIONES = [
  { valor: 'Saludable', color: '#16A34A', icono: '✅' },
  { valor: 'Alerta', color: '#D97706', icono: '⚠️' },
  { valor: 'Critico', color: '#DC2626', icono: '🚨' },
];

export default function Monitoreo() {
  const [lotes, setLotes] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState('');
  const [capturando, setCapturando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [comentario, setComentario] = useState('');
  const [salud, setSalud] = useState('Saludable');
  const [subiendo, setSubiendo] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

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
      const blob = await (await fetch(preview)).blob();
      const fileName = `monitoreo/${loteSeleccionado}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'lotes', loteSeleccionado, 'fotos'), {
        url,
        fecha: new Date().toISOString(),
        usuario: auth.currentUser.uid,
        comentario,
        salud,
      });

      if (salud === 'Critico') {
        const lote = lotes.find(l => l.id === loteSeleccionado);
        await addDoc(collection(db, 'alertas'), {
          tipo: 'salud_critica',
          loteId: loteSeleccionado,
          loteNombre: lote?.nombre || loteSeleccionado,
          cultivo: lote?.cultivo || '—',
          fotoUrl: url,
          comentario,
          reportadoPor: auth.currentUser.uid,
          fecha: new Date().toISOString(),
          estado: 'pendiente',
        });

        const q = query(collection(db, 'usuarios'), where('rol', '==', 'admin'));
        const admins = await getDocs(q);
        admins.forEach(d => {
          if (d.data().telefono) {
            notificarAlertaCritica({
              adminTelefono: d.data().telefono,
              loteNombre: lote?.nombre || loteSeleccionado,
              cultivo: lote?.cultivo || '—',
              reportadoPor: auth.currentUser.email || 'Desconocido',
              fotoUrl: url,
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

  const lote = lotes.find(l => l.id === loteSeleccionado);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Monitoreo de Cultivos</h1>
          <p className={styles.subtitle}>Captura fotos y reporta el estado de salud de los lotes</p>
        </div>
      </div>

      <div className={styles.loteSelector}>
        <label className={styles.selectorLabel}>{SvgImage} Lote a monitorear</label>
        <select className={styles.select} value={loteSeleccionado} onChange={e => setLoteSeleccionado(e.target.value)}>
          <option value="">Seleccionar lote</option>
          {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.cultivo}</option>)}
        </select>
      </div>

      {loteSeleccionado && (
        <div className={styles.content}>
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                {SvgCamera}
                <span>Capturar evidencia</span>
              </div>
              <div className={styles.cardBody}>
                {!capturando && !preview && (
                  <button className={styles.camBtn} onClick={iniciarCamara}>
                    {SvgCamera}
                    <span className={styles.camBtnLabel}>Abrir cámara</span>
                    <span className={styles.camBtnHint}>Toma una foto del lote como evidencia</span>
                  </button>
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
                      <button className={styles.btnSecondary} onClick={() => { setPreview(null); iniciarCamara(); }}>Retomar</button>
                      <button className={styles.btnPrimary} onClick={subirFoto} disabled={subiendo}>
                        {subiendo ? 'Subiendo...' : 'Guardar evidencia'}
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
                  <div className={styles.fotoGrid}>
                    {fotos.map(f => (
                      <div key={f.id} className={styles.fotoCard} onClick={() => setFotoAmpliada(f.url)}>
                        <div className={styles.fotoImgWrapper}>
                          <img src={f.url} alt={f.comentario || 'Foto'} className={styles.fotoImg} />
                          {f.salud && (
                            <span className={styles.fotoSaludTag} style={{
                              background: f.salud === 'Critico' ? '#DC2626' : f.salud === 'Alerta' ? '#D97706' : '#16A34A'
                            }}>
                              {f.salud === 'Critico' ? '🚨' : f.salud === 'Alerta' ? '⚠️' : '✅'} {f.salud}
                            </span>
                          )}
                        </div>
                        <div className={styles.fotoInfo}>
                          {f.comentario && <p className={styles.fotoComentario}>{f.comentario}</p>}
                          <span className={styles.fotoFecha}>
                            {SvgClock} {new Date(f.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img src={fotoAmpliada} alt="Foto ampliada" className={styles.fotoFull} />
          </div>
        </div>
      )}
    </div>
  );
}
