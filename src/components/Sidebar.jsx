import { useAppContext } from '../context/AppContext';
import { auth } from '../firebase';
import styles from './Sidebar.module.css';

const navItems = [
  { id: 'dashboard', label: 'Inicio', icon: HomeIcon },
  { id: 'monitoreo', label: 'Monitoreo', icon: DevicesIcon },
  { id: 'lotes', label: 'Lotes', icon: SecurityIcon },
  { id: 'inventario', label: 'Inventario', icon: GlobalIcon },
  { id: 'usuarios', label: 'Usuarios', icon: MembersIcon },
];

export default function Sidebar({ onNavigate, currentPage }) {
  const { userRole } = useAppContext();

  // Filter items based on user role
  const empleadoOnly = ['dashboard', 'inventario', 'lotes', 'monitoreo'];
  const visibleItems = userRole === 'empleado' 
    ? navItems.filter(item => empleadoOnly.includes(item.id))
    : navItems;

  return (
    <aside className={styles.sidebar}>
      {/* Top Avatar */}
      <div className={styles.avatarContainer}>
        <div className={styles.avatarCircle}>
          {/* Avatar representation similar to the image (brown circle silhouette) */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="none">
            <circle cx="12" cy="8" r="5" fill="#8B5A2B" />
            <path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#8B5A2B" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navContainer}>
        {visibleItems.map(item => (
          <button 
            key={item.id}
            className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <div className={styles.iconWrapper}>
              <item.icon />
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Settings at the bottom */}
      <div className={styles.settingsContainer}>
        <button className={styles.navItem} onClick={() => onNavigate('dashboard')}>
          <div className={styles.iconWrapper}>
            <SettingsIcon />
          </div>
          <span>Ajustes</span>
        </button>
      </div>
    </aside>
  );
}

// Minimal SVG Icons matching the aesthetic
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function GlobalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
