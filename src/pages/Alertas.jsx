import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import styles from './Alertas.module.css';

export default function Alertas() {
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [filter, setFilter] = useState('todas');

  useEffect(() => {
    const unsubL = onSnapshot(query(collection(db, 'lotes')), snap => {
      setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubI = onSnapshot(query(collection(db, 'inventario')), snap => {
      setInsumos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubL(); unsubI(); };
  }, []);

  const hoy = new Date();
  const en7dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  const alertas = [];

  insumos.forEach(i => {
    if (i.stock <= 0) {
      alertas.push({ tipo: 'critico', icono: '🔴', titulo: 'Stock agotado', descripcion: `${i.nombre} — sin stock disponible`, prioridad: 1, key: `stock-0-${i.id}` });
    } else if (i.stock <= i.stockMinimo) {
      alertas.push({ tipo: 'bajo', icono: '🟡', titulo: 'Stock bajo', descripcion: `${i.nombre} — ${i.stock} ${i.unidad} (mín: ${i.stockMinimo})`, prioridad: 2, key: `stock-${i.id}` });
    }
  });

  lotes.forEach(l => {
    const apps = l.aplicaciones || [];
    if (apps.length > 0) {
      const ultima = apps[apps.length - 1];
      const fechaUlt = ultima.fecha?.toDate ? ultima.fecha.toDate() : new Date(ultima.fecha);
      const diasDesde = Math.floor((hoy - fechaUlt) / (1000 * 60 * 60 * 24));
      if (diasDesde > 30) {
        alertas.push({ tipo: 'abono', icono: '🌱', titulo: 'Abono atrasado', descripcion: `${l.nombre} — última aplicación hace ${diasDesde} días`, prioridad: 3, key: `abono-${l.id}` });
      }
    }
  });

  lotes.forEach(l => {
    if (l.fechaCosecha) {
      const fechaCosecha = l.fechaCosecha.toDate ? l.fechaCosecha.toDate() : new Date(l.fechaCosecha);
      if (fechaCosecha >= hoy && fechaCosecha <= en7dias) {
        const dias = Math.ceil((fechaCosecha - hoy) / (1000 * 60 * 60 * 24));
        alertas.push({ tipo: 'cosecha', icono: '🌾', titulo: 'Cosecha próxima', descripcion: `${l.nombre} — en ${dias} día${dias !== 1 ? 's' : ''}`, prioridad: 4, key: `cosecha-${l.id}` });
      }
    }
  });

  const alertasFiltradas = filter === 'todas' ? alertas : alertas.filter(a => a.tipo === filter);
  alertasFiltradas.sort((a, b) => a.prioridad - b.prioridad);

  const enviarWhatsApp = (alerta) => {
    const mensaje = encodeURIComponent(`⚠️ Alerta Finca Digital\n${alerta.icono} ${alerta.titulo}\n${alerta.descripcion}`);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  const tipos = [
    { id: 'todas', label: 'Todas', count: alertas.length },
    { id: 'critico', label: 'Críticas', count: alertas.filter(a => a.tipo === 'critico').length },
    { id: 'bajo', label: 'Stock bajo', count: alertas.filter(a => a.tipo === 'bajo').length },
    { id: 'abono', label: 'Abono', count: alertas.filter(a => a.tipo === 'abono').length },
    { id: 'cosecha', label: 'Cosecha', count: alertas.filter(a => a.tipo === 'cosecha').length },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>🔔 Alertas</h1>
          <p className={styles.subtitle}>{alertas.length} alerta{alertas.length !== 1 ? 's' : ''} activa{alertas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {tipos.map(t => (
          <button key={t.id} className={`${styles.tab} ${filter === t.id ? styles.tabActive : ''}`} onClick={() => setFilter(t.id)}>
            {t.label} <span className={styles.tabCount}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {alertasFiltradas.map(a => (
          <div key={a.key} className={`${styles.card} ${styles[a.tipo]}`}>
            <div className={styles.cardIcon}>{a.icono}</div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{a.titulo}</h3>
              <p className={styles.cardDesc}>{a.descripcion}</p>
            </div>
            <button className={styles.whatsappBtn} onClick={() => enviarWhatsApp(a)} title="Enviar por WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </button>
          </div>
        ))}
        {alertasFiltradas.length === 0 && (
          <div className={styles.empty}>✅ No hay alertas {filter !== 'todas' ? 'de este tipo' : ''}</div>
        )}
      </div>

      <div className={styles.automationBanner}>
        <div>
          <strong>🤖 Automatización 🔧</strong>
          <p>Las alertas automáticas diarias (CRON a las 7:00 AM) están pendientes de implementar con Firebase Cloud Functions.</p>
        </div>
        <button className={styles.btnSecondary} onClick={() => navigator.clipboard.writeText(
          '// Firebase Cloud Function - pendiente de implementar\nexport const alertasDiarias = onSchedule("every day 07:00", async (event) => {\n  // Revisar fechas de abono y stock bajo\n  // Enviar notificaciones por WhatsApp API\n});'
        )}>Copiar ejemplo</button>
      </div>
    </div>
  );
}
