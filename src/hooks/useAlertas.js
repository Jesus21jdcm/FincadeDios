import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

export function useAlertas(userRole, userDataId) {
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs = [];
    setLoading(true);
    
    if (userRole === 'empleado' && userDataId) {
      const unsubT = onSnapshot(query(collection(db, 'tareas'), where('idEmpleado', '==', userDataId)), snap => {
        setTareas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      unsubs.push(unsubT);
    } else if (userRole && userRole !== 'empleado') {
      const unsubL = onSnapshot(query(collection(db, 'lotes')), snap => {
        setLotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubI = onSnapshot(query(collection(db, 'inventario')), snap => {
        setInsumos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubTAdmin = onSnapshot(query(collection(db, 'tareas')), snap => {
        setTareas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      unsubs.push(unsubL, unsubI, unsubTAdmin);
    } else {
      setLoading(false);
    }
    
    return () => unsubs.forEach(u => u());
  }, [userRole, userDataId]);

  const hoy = new Date();
  const en7dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  let alertas = [];

  if (userRole === 'empleado') {
    const pendientes = tareas.filter(t => t.estado === 'Asignado');
    pendientes.forEach(t => {
      const fecha = new Date(t.fechaSugerida);
      const isVencida = fecha < hoy;
      alertas.push({
        tipo: isVencida ? 'critico' : 'tarea',
        titulo: t.titulo,
        descripcion: `${t.descripcion || 'Sin descripción'} — Vence: ${fecha.toLocaleDateString()}`,
        prioridad: isVencida ? 1 : 2,
        key: `tarea-${t.id}`,
        target: 'elempleado'
      });
    });
  } else if (userRole && userRole !== 'empleado') {
    insumos.forEach(i => {
      if (i.stock <= 0) {
        alertas.push({ tipo: 'critico', titulo: 'Stock agotado', descripcion: `${i.nombre} — sin stock`, prioridad: 1, key: `stock-0-${i.id}`, target: 'inventario' });
      } else if (i.stock <= i.stockMinimo) {
        alertas.push({ tipo: 'bajo', titulo: 'Stock bajo', descripcion: `${i.nombre} — ${i.stock} ${i.unidad}`, prioridad: 2, key: `stock-${i.id}`, target: 'inventario' });
      }
    });

    lotes.forEach(l => {
      const apps = l.aplicaciones || [];
      if (apps.length > 0) {
        const ultima = apps[apps.length - 1];
        const fechaUlt = ultima.fecha?.toDate ? ultima.fecha.toDate() : new Date(ultima.fecha);
        const diasDesde = Math.floor((hoy - fechaUlt) / (1000 * 60 * 60 * 24));
        if (diasDesde > 30) {
          alertas.push({ tipo: 'abono', titulo: 'Abono atrasado', descripcion: `${l.nombre} — hace ${diasDesde} días`, prioridad: 3, key: `abono-${l.id}`, target: 'lotes' });
        }
      }

      if (l.fechaCosecha) {
        const fechaCosecha = l.fechaCosecha.toDate ? l.fechaCosecha.toDate() : new Date(l.fechaCosecha);
        if (fechaCosecha >= hoy && fechaCosecha <= en7dias) {
          const dias = Math.ceil((fechaCosecha - hoy) / (1000 * 60 * 60 * 24));
          alertas.push({ tipo: 'cosecha', titulo: 'Cosecha próxima', descripcion: `${l.nombre} — en ${dias} día(s)`, prioridad: 4, key: `cosecha-${l.id}`, target: 'lotes' });
        }
      }
    });

    const porValidar = tareas.filter(t => t.estado === 'Ejecutado');
    porValidar.forEach(t => {
      alertas.push({
        tipo: 'tarea',
        titulo: `Tarea por Validar`,
        descripcion: `${t.titulo} ${t.asignadoA ? `por ${t.asignadoA}` : ''}`,
        prioridad: 5,
        key: `tarea-terminada-${t.id}`,
        target: userRole === 'encargado' ? 'elencargado' : 'eladmin'
      });
    });
  }

  alertas.sort((a, b) => a.prioridad - b.prioridad);

  return { alertas, loading };
}
