import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import styles from './ApplyInput.module.css';

const API_WEATHER = import.meta.env.VITE_WEATHER_API_KEY;

export default function ApplyInput() {
  const { userData } = useAppContext();
  const [step, setStep] = useState('form');
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [formData, setFormData] = useState({ loteId: '', insumoId: '', cantidad: '' });
  const [error, setError] = useState('');
  const [clima, setClima] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const unsubLotes = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.filter(d => d.data().activo !== false).map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubInsumos = onSnapshot(query(collection(db, 'inventario')), snap => {
      setInsumos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubLotes(); unsubInsumos(); };
  }, []);

  const insumo = insumos.find(i => i.id === formData.insumoId);
  const lote = lotes.find(l => l.id === formData.loteId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cantidad = Number(formData.cantidad);
    if (!formData.loteId || !formData.insumoId || !cantidad || cantidad <= 0) {
      setError('Completa todos los campos correctamente');
      return;
    }

    if (!insumo) {
      setError(`"${formData.insumoId ? 'El insumo seleccionado' : 'El insumo'} no esta registrado en el inventario. Debes registrarlo primero en Inventario.`);
      return;
    }
    if (insumo.stock < cantidad) {
      setError(`Stock insuficiente. Disponible: ${insumo.stock} ${insumo.unidad}, solicitado: ${cantidad}`);
      return;
    }

    setStep('clima');
    setProcesando(true);

    try {
      let climaData = null;
      let lluvia = false;
      
      if (formData.loteId !== 'general') {
        const lat = lote?.ubicacion?.lat || -34.6037;
        const lng = lote?.ubicacion?.lng || -58.3816;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_WEATHER}&lang=es`
        );
        const data = await res.json();

        climaData = {
          temp: data.main?.temp != null ? Math.round(data.main.temp - 273.15) : null,
          humedad: data.main?.humidity ?? null,
          condicion: data.weather?.[0]?.description ?? null,
        };
        lluvia = ['Rain', 'Drizzle', 'Thunderstorm'].includes(data.weather?.[0]?.main);
        setClima({ ...climaData, lluvia });
      }

      if (lluvia) {
        setStep('cancelado');
        setProcesando(false);
        return;
      }

      setStep('registrando');
      await runTransaction(db, async (transaction) => {
        const insumoRef = doc(db, 'inventario', formData.insumoId);
        const insumoSnap = await transaction.get(insumoRef);
        
        let loteSnap = null;
        let loteRef = null;
        if (formData.loteId !== 'general') {
          loteRef = doc(db, 'lotes', formData.loteId);
          loteSnap = await transaction.get(loteRef);
        }

        if (!insumoSnap.exists()) throw new Error('Insumo no encontrado');
        const stockActual = insumoSnap.data().stock;
        if (stockActual < cantidad) throw new Error('Stock insuficiente');

        transaction.update(insumoRef, {
          stock: stockActual - cantidad,
          ultimaActualizacion: Timestamp.now(),
        });

        if (loteSnap && loteSnap.exists()) {
          const appsPrev = loteSnap.data().aplicaciones || [];
          transaction.update(loteRef, {
            aplicaciones: [...appsPrev, { insumoId: formData.insumoId, cantidad, fecha: Timestamp.now() }],
          });
        }

        const appRef = doc(collection(db, 'aplicaciones'));
        transaction.set(appRef, {
          loteId: formData.loteId,
          insumoId: formData.insumoId,
          cantidad,
          fecha: Timestamp.now(),
          usuario: userData?.id || auth.currentUser?.uid || 'desconocido',
          clima: climaData,
        });
      });

      setStep('exito');
    } catch (err) {
      setError(err.message);
      setStep('form');
    } finally {
      setProcesando(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setFormData({ loteId: '', insumoId: '', cantidad: '' });
    setError('');
    setClima(null);
  };

  if (step === 'cancelado') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <div className={styles.statusIconError}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className={styles.statusTitle}>Aplicación cancelada</h2>
          <p className={styles.statusDesc}>
            Se detectaron condiciones de lluvia en el lote <strong>{lote?.nombre}</strong>.
          </p>
          {clima && (
            <div className={styles.climaInfo}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
              <span>{clima.condicion}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <span>{clima.temp}°C</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20v-4"/><path d="M6 20v-4"/></svg>
              <span>Humedad {clima.humedad}%</span>
            </div>
          )}
          <p className={styles.statusDesc}>Se ha enviado una alerta por WhatsApp.</p>
          <button className={styles.btn} style={{ background: '#2AD7FF', color: '#000' }} onClick={resetForm}>Nueva aplicación</button>
        </div>
      </div>
    );
  }

  if (step === 'registrando') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <div className={styles.spinner} />
          <h2 className={styles.statusTitle}>Registrando aplicación...</h2>
          <p className={styles.statusDesc}>Actualizando inventario y lote en Firestore</p>
        </div>
      </div>
    );
  }

  if (step === 'exito') {
    return (
      <div className={styles.container}>
        <div className={`${styles.statusCard} ${styles.successCard}`}>
          <div className={styles.successBanner}>
            <div className={styles.statusIconOkAlt}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className={styles.statusTitleAlt}>¡Verificado y Aplicado!</h2>
          </div>
          <div className={styles.successBody}>
            <p className={styles.statusDesc}>
              El sistema ha registrado exitosamente la aplicación de:<br/>
              <strong className={styles.highlightText}>{formData.cantidad} {insumo?.unidad} de {insumo?.nombre}</strong><br/>
              {formData.loteId === 'general' ? 'para uso general.' : <>en el lote <strong>{lote?.nombre}</strong>.</>}
            </p>
            {clima && (
              <div className={styles.climaInfoBox}>
                <div className={styles.climaHeader}>Condiciones registradas:</div>
                <div className={styles.climaItems}>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> {clima.condicion}</span>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> {clima.temp}°C</span>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20v-4"/><path d="M6 20v-4"/></svg> Humedad {clima.humedad}%</span>
                </div>
              </div>
            )}
            <button className={`${styles.btn} ${styles.btnNewApp}`} onClick={resetForm}>Registrar nueva aplicación</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Aplicar insumo a un lote</h1>
        <p className={styles.subtitle}>Selecciona el lote, el insumo y la cantidad a aplicar.</p>

        {error && (
          <div className={styles.error} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="lote" className={styles.label}>Destino / Lote</label>
            <select id="lote" className={styles.select} value={formData.loteId} onChange={e => setFormData(f => ({ ...f, loteId: e.target.value }))} required>
              <option value="">Seleccionar destino</option>
              <option value="general">Uso general (ningún lote específico)</option>
              {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.cultivo}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="insumo" className={styles.label}>Insumo</label>
            <select id="insumo" className={styles.select} value={formData.insumoId} onChange={e => setFormData(f => ({ ...f, insumoId: e.target.value }))} required>
              <option value="">Seleccionar insumo</option>
              {insumos.map(i => (
                <option key={i.id} value={i.id} disabled={i.stock <= 0}>
                  {i.nombre} — Stock: {i.stock} {i.unidad} {i.stock <= 0 ? '(sin stock)' : ''}
                </option>
              ))}
            </select>
          </div>

          {insumo && (
            <div className={styles.stockInfo}>
              Stock disponible: <strong>{insumo.stock} {insumo.unidad}</strong>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="cantidad" className={styles.label}>Cantidad a aplicar</label>
            <input
              id="cantidad"
              type="number"
              className={styles.input}
              value={formData.cantidad}
              onChange={e => setFormData(f => ({ ...f, cantidad: e.target.value }))}
              placeholder="0"
              min="0.1"
              step="0.1"
              required
            />
          </div>

          <button type="submit" className={`${styles.btn} ${styles.btnSubmitSquare}`} disabled={procesando}>
            {procesando ? <span className={styles.spinnerSmall} /> : 'Verificar y aplicar'}
          </button>
        </form>
      </div>
    </div>
  );
}
