import { useAppContext } from '../context/AppContext';
import { auth } from '../firebase';
import styles from './Sidebar.module.css';

const navItems = [
  { id: 'dashboard', label: 'Inicio', icon: HomeIcon },
  { id: 'lotes', label: 'Lotes', icon: MountainIcon },
  { id: 'siembras', label: 'Siembras', icon: SiembraIcon },
  { id: 'inventario', label: 'Inventario', icon: BoxIcon },
  { id: 'usuarios', label: 'Usuarios', icon: MembersIcon },
];

export default function Sidebar({ onNavigate, currentPage }) {
  const { userRole } = useAppContext();

  // Filter items based on user role
  const empleadoOnly = ['dashboard', 'inventario', 'lotes', 'siembras'];
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

    </aside>
  );
}

function HomeIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10l8-7 8 7v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="4 20, 10 9, 14 15, 18 6, 22 20" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SiembraIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V3" />
      <path d="M7 8v3c0 2.8 2.2 5 5 5" />
      <path d="M17 8v3c0 2.8-2.2 5-5 5" />
      <path d="M9 21h6" />
    </svg>
  );
}
