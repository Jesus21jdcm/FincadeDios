import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import styles from './Header.module.css';

export default function Header({ onNavigate }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  };

  return (
    <header className={styles.header}>
      {/* Fincadigi Logo - Left Side */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <svg width="155" height="33" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 0)">
            <path d="M4 10C4 4.477 8.477 0 14 0H24.5C26.985 0 29 2.015 29 4.5C29 6.985 26.985 9 24.5 9H14.5C13.67 9 13 9.67 13 10.5V26.5C13 27.88 11.88 29 10.5 29H6.5C5.12 29 4 27.88 4 26.5V10Z" fill="url(#gradLogo1)"/>
            <path d="M13 13H20.5C22.985 13 25 15.015 25 17.5C25 19.985 22.985 22 20.5 22H13V13Z" fill="url(#gradLogo2)"/>
          </g>
          <defs>
            <linearGradient id="gradLogo1" x1="4" y1="0" x2="29" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399"/>
              <stop offset="1" stopColor="#14C2F4"/>
            </linearGradient>
            <linearGradient id="gradLogo2" x1="13" y1="13" x2="25" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#14C2F4"/>
              <stop offset="1" stopColor="#633AF8"/>
            </linearGradient>
          </defs>
          <text x="36" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="var(--color-foreground)" letterSpacing="0.5">FINCA</text>
          <text x="86" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="var(--color-cyan)" letterSpacing="0.5">DIGI</text>
        </svg>
      </div>

      <div className={styles.headerRight}>

        <button className={styles.iconBtn} title="Notificaciones" onClick={() => onNavigate?.('alertas')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className={styles.badgeWarn}></span>
        </button>

        <div className={styles.timeDisplay}>
          {time}
        </div>

        {/* Temporary logout button to keep functionality */}
        <button className={styles.iconBtn} onClick={handleLogout} title="Cerrar sesión" style={{marginLeft: '8px'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0A5BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>

      </div>
    </header>
  );
}
