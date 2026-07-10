import { useAppContext } from '../context/AppContext';
import styles from './Alertas.module.css';

function getIconForType(tipo) {
  switch (tipo) {
    case 'critico':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    case 'bajo':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      );
    case 'tarea':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      );
    case 'abono':
    case 'cosecha':
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      );
  }
}

export default function Alertas({ isDropdown = false, alertas = [], onNavigate, onClose }) {
  const { userRole } = useAppContext();
  const isEmpleado = userRole === 'empleado';

  const handleAlertClick = (target) => {
    if (onNavigate && target) {
      onNavigate(target);
      if (onClose) onClose();
    }
  };

  return (
    <div className={`${styles.container} ${isDropdown ? styles.dropdownContainer : ''}`}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{isEmpleado ? 'Mis Tareas' : 'Notificaciones'}</h1>
          <p className={styles.subtitle}>{alertas.length} {isEmpleado ? 'tarea' : 'alerta'}{alertas.length !== 1 ? 's' : ''} activa{alertas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className={styles.list}>
        {alertas.map(a => (
          <div 
            key={a.key} 
            className={`${styles.card} ${styles[a.tipo]} ${a.target ? styles.clickable : ''}`}
            onClick={() => handleAlertClick(a.target)}
          >
            <div className={styles.cardIcon}>{getIconForType(a.tipo)}</div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{a.titulo}</h3>
              <p className={styles.cardDesc}>{a.descripcion}</p>
            </div>
          </div>
        ))}
        {alertas.length === 0 && (
          <div className={styles.empty}>No hay {isEmpleado ? 'tareas pendientes' : 'alertas'}</div>
        )}
      </div>

      {!isEmpleado && !isDropdown && (
        <div className={styles.automationBanner}>
          <div>
            <strong>Automatización</strong>
            <p>Las alertas automáticas diarias (CRON a las 7:00 AM) están pendientes de implementar con Firebase Cloud Functions.</p>
          </div>
          <button className={styles.btnSecondary} onClick={() => navigator.clipboard.writeText(
            '// Firebase Cloud Function - pendiente de implementar\nexport const alertasDiarias = onSchedule("every day 07:00", async (event) => {\n  // Revisar fechas de abono y stock bajo\n  // Enviar notificaciones por WhatsApp API\n});'
          )}>Copiar ejemplo</button>
        </div>
      )}
    </div>
  );
}
