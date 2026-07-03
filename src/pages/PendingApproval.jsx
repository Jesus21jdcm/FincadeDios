import React from 'react';
import styles from './PendingApproval.module.css';

const ClockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function PendingApproval({ userData, onLogout }) {
  // Use userData to personalize if needed.
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <ClockIcon />
        </div>
        <h1 className={styles.title}>Cuenta pendiente de aprobación</h1>
        <p className={styles.message}>
          Hola <strong>{userData?.nombre || 'Usuario'}</strong>, tu cuenta ha sido creada exitosamente. 
          <br /><br />
          Para acceder al sistema de Finca Digi, un administrador debe aprobar tu solicitud y asignarte un rol. 
          Por favor, espera la confirmación o contacta al administrador.
        </p>
        <button className={styles.btn} onClick={onLogout}>
          Cerrar sesión y volver al inicio
        </button>
      </div>
    </div>
  );
}
