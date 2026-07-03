import React from 'react';
import styles from './Landing.module.css';

const SvgIcon = ({ name, size = 24 }) => {
  const icons = {
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    arrowRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
    activity: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    cloudRain: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" /></svg>
  };
  return icons[name] || null;
};

export default function Landing({ onGoToLogin, onGoToRegister }) {
  return (
    <div className={styles.landingContainer}>
      {/* NAVEGACIÓN SUPERIOR */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <svg width="155" height="33" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 0)">
              <path d="M4 10C4 4.477 8.477 0 14 0H24.5C26.985 0 29 2.015 29 4.5C29 6.985 26.985 9 24.5 9H14.5C13.67 9 13 9.67 13 10.5V26.5C13 27.88 11.88 29 10.5 29H6.5C5.12 29 4 27.88 4 26.5V10Z" fill="url(#gradLogoLanding1)" />
              <path d="M13 13H20.5C22.985 13 25 15.015 25 17.5C25 19.985 22.985 22 20.5 22H13V13Z" fill="url(#gradLogoLanding2)" />
            </g>
            <defs>
              <linearGradient id="gradLogoLanding1" x1="4" y1="0" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34D399" />
                <stop offset="1" stopColor="#14C2F4" />
              </linearGradient>
              <linearGradient id="gradLogoLanding2" x1="13" y1="13" x2="25" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#14C2F4" />
                <stop offset="1" stopColor="#633AF8" />
              </linearGradient>
            </defs>
            <text x="36" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="var(--color-foreground)" letterSpacing="0.5">FINCA</text>
            <text x="86" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="var(--color-cyan)" letterSpacing="0.5">DIGI</text>
          </svg>
        </div>
        <div className={styles.navActions}>
          <button className={styles.loginBtn} onClick={onGoToLogin}>
            Iniciar Sesión
          </button>
          <button className={styles.registerBtn} onClick={onGoToRegister}>
            Registrarse
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>El futuro del agro</span>
          <h1 className={styles.heroTitle}>Control total y gestión inteligente de tus cultivos</h1>
          <p className={styles.heroSubtitle}>
            Administra personal, monitorea clima, supervisa inventarios y realiza trazabilidad completa de tus siembras en tiempo real con la plataforma agrícola más intuitiva.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryBtn} onClick={onGoToLogin}>
              Acceder al Sistema <SvgIcon name="arrowRight" size={18} />
            </button>
          </div>
        </div>

        <div className={styles.heroGallery}>
          <div className={styles.galleryCol}>
            <img src="/cacao.perfil.jpg" alt="Cultivo de Cacao" className={`${styles.galleryImg} ${styles.slideUp}`} />
            <img src="/platano.perfil.jpg" alt="Cultivo de Plátano" className={`${styles.galleryImg} ${styles.slideDown}`} />
          </div>
          <div className={styles.galleryCol} style={{ marginTop: '40px' }}>
            <img src="/maiz.perfil.jpg" alt="Cultivo de Maíz" className={`${styles.galleryImg} ${styles.slideUpDelay}`} />
            <img src="/yuca.perfil.jpg" alt="Cultivo de Yuca" className={`${styles.galleryImg} ${styles.slideDownDelay}`} />
          </div>
        </div>
      </header>

      {/* BENEFICIOS / CARACTERÍSTICAS */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <h2>Digitaliza el corazón de tu finca</h2>
          <p>Toma el control de cada etapa del proceso agrícola con herramientas precisas.</p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <SvgIcon name="activity" size={24} />
            </div>
            <h3>Trazabilidad de Siembras</h3>
            <p>Monitorea cada lote desde la siembra hasta la cosecha, con historial completo y reportes al instante.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <SvgIcon name="users" size={24} />
            </div>
            <h3>Gestión Operativa</h3>
            <p>Asigna tareas a tus empleados, haz seguimiento de avances y valida el cumplimiento a través del panel de control.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <SvgIcon name="cloudRain" size={24} />
            </div>
            <h3>Agro Inteligencia</h3>
            <p>Datos en tiempo real, alertas críticas y monitoreo climatológico para que siempre tomes la mejor decisión.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerMain}>
            <div className={styles.logo}>
              <svg width="155" height="33" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(0, 0)">
                  <path d="M4 10C4 4.477 8.477 0 14 0H24.5C26.985 0 29 2.015 29 4.5C29 6.985 26.985 9 24.5 9H14.5C13.67 9 13 9.67 13 10.5V26.5C13 27.88 11.88 29 10.5 29H6.5C5.12 29 4 27.88 4 26.5V10Z" fill="url(#gradLogoFooter1)" />
                  <path d="M13 13H20.5C22.985 13 25 15.015 25 17.5C25 19.985 22.985 22 20.5 22H13V13Z" fill="url(#gradLogoFooter2)" />
                </g>
                <defs>
                  <linearGradient id="gradLogoFooter1" x1="4" y1="0" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#34D399" />
                    <stop offset="1" stopColor="#14C2F4" />
                  </linearGradient>
                  <linearGradient id="gradLogoFooter2" x1="13" y1="13" x2="25" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14C2F4" />
                    <stop offset="1" stopColor="#633AF8" />
                  </linearGradient>
                </defs>
                <text x="36" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="#ffffff" letterSpacing="0.5">FINCA</text>
                <text x="86" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="var(--color-cyan)" letterSpacing="0.5">DIGI</text>
              </svg>
            </div>
            <p className={styles.footerDesc}>
              El ecosistema definitivo para la trazabilidad y gestión inteligente de tus proyectos agrícolas.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Plataforma</h4>
              <a href="#">Trazabilidad</a>
              <a href="#">Gestión Operativa</a>
              <a href="#">Agro Inteligencia</a>
            </div>
            <div className={styles.linkGroup}>
              <h4>Compañía</h4>
              <a href="#">Sobre Nosotros</a>
              <a href="#">Centro de Ayuda</a>
              <a href="#">Términos de Servicio</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} Finca Digi. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
