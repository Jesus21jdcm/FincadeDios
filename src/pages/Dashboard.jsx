import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import styles from './Dashboard.module.css';

// Using simple SVG icons that match the minimal aesthetic
const Iconos = {
  apply: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
  ),
  lotes: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
  ),
  monitoreo: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
  ),
  inventario: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>
  ),
  historial: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  alertas: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  ),
  usuarios: (props) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
};

const menuItems = [
  { id: 'apply', label: 'Inputs', icon: Iconos.apply },
  { id: 'lotes', label: 'Lots', icon: Iconos.lotes },
  { id: 'monitoreo', label: 'Monitoring', icon: Iconos.monitoreo },
  { id: 'inventario', label: 'Inventory', icon: Iconos.inventario },
];

export default function Dashboard({ onNavigate }) {
  const { userRole, userData, user } = useAppContext();
  const [stats, setStats] = useState({ lotes: 0, insumos: 0, aplicaciones: 0, stockBajo: 0 });
  const [tareasPendientes, setTareasPendientes] = useState(0);
  const [misTareas, setMisTareas] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);

  const [chartData, setChartData] = useState([]);

  const userId = userData?.id || user?.uid;

  useEffect(() => {
    let allApps = [];
    let allTareas = [];
    let allExcepciones = [];

    const buildChartData = (apps, tareas, excepciones) => {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      const weeklyData = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          name: days[d.getDay()],
          dateString: d.toISOString().split('T')[0],
          consumo: 0
        };
      });

      const addConsumo = (dateObj, amount) => {
        if (!dateObj || !amount) return;
        const dStr = dateObj.toISOString().split('T')[0];
        const dayMatch = weeklyData.find(w => w.dateString === dStr);
        if (dayMatch) {
          dayMatch.consumo += Number(amount);
        }
      };

      apps.forEach(app => {
        if (app.fecha) {
           const date = app.fecha.toDate ? app.fecha.toDate() : new Date(app.fecha);
           addConsumo(date, app.cantidad);
        }
      });

      tareas.forEach(tarea => {
        if (tarea.estado === 'Ejecutado' && tarea.fechaEjecucion && tarea.cantidadConsumida) {
          addConsumo(new Date(tarea.fechaEjecucion), tarea.cantidadConsumida);
        }
      });
      
      excepciones.forEach(exc => {
        if (exc.fechaReporte) {
           const date = exc.fechaReporte.toDate ? exc.fechaReporte.toDate() : new Date(exc.fechaReporte);
           addConsumo(date, exc.cantidad);
        }
      });

      setChartData(weeklyData);
    };

    const unsubLotes = onSnapshot(query(collection(db, 'lotes')), snapshot => {
      setStats(prev => ({ ...prev, lotes: snapshot.size }));
    });
    const unsubInsumos = onSnapshot(query(collection(db, 'inventario')), snapshot => {
      const docs = snapshot.docs;
      const total = docs.length;
      const bajo = docs.filter(d => d.data().stock <= d.data().stockMinimo).length;
      setStats(prev => ({ ...prev, insumos: total, stockBajo: bajo }));
    });
    const unsubApps = onSnapshot(query(collection(db, 'aplicaciones')), snapshot => {
      setStats(prev => ({ ...prev, aplicaciones: snapshot.size }));
      allApps = snapshot.docs.map(d => d.data());
      buildChartData(allApps, allTareas, allExcepciones);
    });
    const unsubTareas = onSnapshot(query(collection(db, 'tareas')), snapshot => {
      setTareasPendientes(snapshot.docs.filter(d => d.data().estado === 'Ejecutado').length);
      allTareas = snapshot.docs.map(d => d.data());
      buildChartData(allApps, allTareas, allExcepciones);
    });
    const unsubExcepciones = onSnapshot(query(collection(db, 'excepciones')), snapshot => {
      allExcepciones = snapshot.docs.map(d => d.data());
      buildChartData(allApps, allTareas, allExcepciones);
    });
    const unsubUsuarios = onSnapshot(query(collection(db, 'usuarios')), snapshot => {
      const active = snapshot.docs.filter(d => d.data().activo !== false).map(d => d.data());
      setActiveMembers(active.slice(0, 4));
    });

    return () => { unsubLotes(); unsubInsumos(); unsubApps(); unsubTareas(); unsubExcepciones(); unsubUsuarios(); };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(
      query(collection(db, 'tareas'), where('idEmpleado', '==', userId)),
      snap => setMisTareas(snap.docs.filter(d => d.data().estado === 'Asignado').map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [userId]);

  const userName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuario';
  
  const rolePanels = {
    superadmin: { id: 'paneladmin', label: 'Panel Admin' },
    admin: { id: 'paneladmin', label: 'Panel Admin' },
    encargado: { id: 'panelencargado', label: 'Panel Encargado' },
    empleado: { id: 'elempleado', label: 'Mis Tareas' },
  };

  const rolePanel = rolePanels[userRole] || rolePanels.empleado;

  const moduleColors = ['var(--color-orange)', 'var(--color-purple-light)', 'var(--color-red)', 'var(--color-cyan)'];

  const mainModules = [
    { id: 'apply', label: 'Insumos', icon: Iconos.apply },
    { id: 'historial', label: 'Reportes', icon: Iconos.historial },
    { id: 'monitoreo', label: 'Monitoreo', icon: Iconos.monitoreo },
    { id: rolePanel.id, label: rolePanel.label, icon: Iconos.usuarios },
  ];

  const quickAccessItems = [
    { id: 'inventario', label: 'Inventario', icon: Iconos.inventario },
    { id: 'historial', label: 'Reportes', icon: Iconos.historial },
    { id: 'alertas', label: 'Alertas', icon: Iconos.alertas },
    { id: 'usuarios', label: 'Usuarios', icon: Iconos.usuarios }
  ];

  return (
    <div className={styles.container}>
      {/* Left Column */}
      <div className={styles.leftCol}>
        
        {/* Welcome Section */}
        <div className={styles.welcomeText}>
          <h2>Hola, <strong>{userName.toUpperCase()} !</strong></h2>
          <p>Buen Día</p>
        </div>

        {/* Stats Row (White Cards with Heavy Shadows) */}
        <div className={styles.statsRow}>
          
          <div className={`${styles.statCard} white-card`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={styles.statHeader} style={{ color: '#8BA3B8', fontWeight: 500 }}>
              <span>Clima Local</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '10px 0' }}>
              <svg width="64" height="64" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD166" />
                    <stop offset="100%" stopColor="#FF9F1C" />
                  </linearGradient>
                  <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#D1E1EF" />
                  </linearGradient>
                  <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#633AF8" floodOpacity="0.15" />
                  </filter>
                </defs>
                <circle cx="65" cy="35" r="18" fill="url(#sunGrad)" />
                <path d="M75 75 H25 C12 75 12 55 25 55 C25 35 50 35 55 48 C60 30 85 40 80 55 C95 55 95 75 75 75 Z" fill="url(#cloudGrad)" filter="url(#cloudShadow)" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '36px', fontWeight: '700', color: '#1A1A24', lineHeight: 1 }}>+30°C</span>
                <span style={{ fontSize: '12px', color: '#8BA3B8', fontWeight: 600 }}>Mayormente Soleado</span>
              </div>
            </div>

            <div className={styles.statSlider} style={{ marginTop: '10px' }}>
              <div className={styles.sliderTrack} style={{ background: '#E8EAF3', height: '8px', borderRadius: '4px' }}>
                <div className={styles.sliderThumb} style={{ left: '70%', background: '#FF9F1C', width: '20px', height: '20px', top: '-6px' }}></div>
              </div>
            </div>
          </div>

          <div className={`${styles.statCard} white-card`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={styles.statHeader} style={{ color: '#8BA3B8', fontWeight: 500, marginBottom: '8px' }}>
              <span>Distribución de Siembras</span>
            </div>
            
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '20px', flex: 1 }}>
              
              {/* Donut Chart */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `conic-gradient(
                  #FFD166 0% 35%, 
                  #34D399 35% 60%, 
                  #14C2F4 60% 80%, 
                  #7E4FF6 80% 100%
                )`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1A1A24', fontSize: '14px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                  100%
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#8BA3B8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD166' }}></span> Maíz (35%)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399' }}></span> Yuca (25%)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#14C2F4' }}></span> Plátano (20%)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7E4FF6' }}></span> Cacao (20%)</div>
              </div>

            </div>
          </div>

        </div>
        
        {/* Consumed / Chart Row */}
        <div className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Consumo de Insumos</h3>
            <span style={{ background: '#F0EAFB', color: '#7E4FF6', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>Últimos 7 días</span>
          </div>
          <div className={`${styles.chartCard} white-card`} style={{ height: 'auto', padding: '32px' }}>
            <div className={styles.chartLines}>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 25, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7E4FF6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#7E4FF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F0F0F5" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{fontSize: 12, fill: '#8BA3B8', fontWeight: 600}} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10} 
                    label={{ value: 'Día de la semana', position: 'insideBottom', offset: -15, fill: '#8BA3B8', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    tick={{fontSize: 12, fill: '#8BA3B8'}} 
                    axisLine={false} 
                    tickLine={false} 
                    dx={-10}
                    label={{ value: 'Cantidad de Insumos', angle: -90, position: 'insideLeft', offset: 10, fill: '#8BA3B8', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-sm)' }}
                    itemStyle={{ color: '#7E4FF6', fontWeight: 600 }}
                    formatter={(value) => [`${value} unidades`, 'Consumo']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="consumo" 
                    stroke="#7E4FF6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorConsumo)" 
                    dot={{ stroke: '#7E4FF6', strokeWidth: 3, r: 4, fill: '#fff' }}
                    activeDot={{ stroke: '#7E4FF6', strokeWidth: 3, r: 6, fill: '#fff' }}
                    label={{ position: 'top', fill: '#7E4FF6', fontSize: 13, fontWeight: 'bold', offset: 10 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>



      </div>

      <div className={styles.divider}></div>

      {/* Right Column */}
      <div className={styles.rightCol}>
        
        {/* At Home Now */}
        <div className={styles.membersSection}>
          <h3 className={styles.sectionTitle}>Miembros Activos</h3>
          <div className={`${styles.membersCard} white-card`}>
            {activeMembers.map((member, i) => {
              const colors = ['#14C2F4', '#FF9F1C', '#7E4FF6', '#FF5A5F', '#34D399'];
              const color = colors[i % colors.length];
              return (
                <div key={i} className={styles.memberAvatar}>
                  <div className={styles.memberImg} style={{ background: color, border: 'none' }}>
                    <Iconos.usuarios style={{ stroke: 'white', width: '20px', height: '20px' }} />
                  </div>
                  <span>{member.nombre || member.email?.split('@')[0] || 'Usuario'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Devices (Modules) */}
        <div className={styles.modulesSection}>
          <h3 className={styles.sectionTitle}>Mis Módulos</h3>
          <div className={styles.modulesGrid}>
            {mainModules.map((item, idx) => (
              <div key={item.id} className={styles.moduleCard} style={{background: moduleColors[idx]}} onClick={() => onNavigate(item.id)}>
                <div className={styles.moduleHeader}>
                  <item.icon />
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob}></div>
                  </div>
                </div>
                <span className={styles.moduleName}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className={styles.shortcutsSection}>
          <h3 className={styles.sectionTitle}>Atajos</h3>
          <div className={styles.shortcutsRow}>
            {['A', 'B', 'C', '+'].map((label, idx) => (
              <div key={idx} className={styles.shortcutWrapper}>
                <button className={styles.shortcutBtn}>
                  {label}
                </button>
                <span>Acción {idx+1}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
