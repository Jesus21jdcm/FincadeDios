import React from 'react';
import styles from './Landing.module.css';

// Import images
import heroBgField from '../assets/images/hero_bg_field.webp';
import appMockup from '../assets/images/farmer_holding_phone.png';

const GrassSeparator = ({ flip = false, fill = "#ffffff" }) => (
  <div className={styles.grassSeparator} style={{ transform: flip ? 'rotate(180deg)' : 'none' }}>
    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
      <path fill={fill} d="M0,60 L0,30 Q10,15 20,30 T40,30 T60,30 T80,30 T100,30 T120,30 T140,30 T160,30 T180,30 T200,30 T220,30 T240,30 T260,30 T280,30 T300,30 T320,30 T340,30 T360,30 T380,30 T400,30 T420,30 T440,30 T460,30 T480,30 T500,30 T520,30 T540,30 T560,30 T580,30 T600,30 T620,30 T640,30 T660,30 T680,30 T700,30 T720,30 T740,30 T760,30 T780,30 T800,30 T820,30 T840,30 T860,30 T880,30 T900,30 T920,30 T940,30 T960,30 T980,30 T1000,30 T1020,30 T1040,30 T1060,30 T1080,30 T1100,30 T1120,30 T1140,30 T1160,30 T1180,30 T1200,30 L1200,60 Z" />
      {/* Simple jagged pattern for grass */}
      <path fill={fill} d="M0,60 L0,40 L10,20 L20,40 L30,10 L40,35 L50,15 L60,40 L70,5 L80,35 L90,10 L100,45 L110,20 L120,40 L130,15 L140,45 L150,10 L160,40 L170,25 L180,45 L190,15 L200,40 L210,10 L220,35 L230,20 L240,40 L250,5 L260,45 L270,15 L280,40 L290,20 L300,45 L310,10 L320,40 L330,25 L340,45 L350,15 L360,40 L370,10 L380,35 L390,20 L400,45 L410,5 L420,40 L430,25 L440,45 L450,15 L460,40 L470,10 L480,35 L490,20 L500,45 L510,15 L520,40 L530,5 L540,45 L550,20 L560,40 L570,10 L580,35 L590,25 L600,45 L610,15 L620,40 L630,5 L640,45 L650,20 L660,40 L670,10 L680,35 L690,25 L700,45 L710,15 L720,40 L730,5 L740,45 L750,20 L760,40 L770,10 L780,35 L790,25 L800,45 L810,15 L820,40 L830,10 L840,45 L850,20 L860,40 L870,5 L880,35 L890,15 L900,45 L910,20 L920,40 L930,10 L940,35 L950,25 L960,45 L970,15 L980,40 L990,5 L1000,45 L1010,20 L1020,40 L1030,10 L1040,35 L1050,25 L1060,45 L1070,15 L1080,40 L1090,5 L1100,45 L1110,20 L1120,40 L1130,10 L1140,35 L1150,25 L1160,45 L1170,15 L1180,40 L1190,5 L1200,45 L1200,60 Z" />
    </svg>
  </div>
);

const LogoSvg = () => (
  <svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="28" fill="#0D2E1C" letterSpacing="1">FINCA</text>
    <text x="90" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="28" fill="#5EBC67" letterSpacing="1">DIGI</text>
  </svg>
);

const FooterLogoSvg = () => (
  <svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
    <text x="0" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="28" fill="#FFFFFF" letterSpacing="1">FINCA</text>
    <text x="90" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="28" fill="#5EBC67" letterSpacing="1">DIGI</text>
  </svg>
);

const SvgIcon = ({ name, size = 48 }) => {
  const icons = {
    tractor: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5EBC67" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11V19H5M7 19H17M19 19H21V15C21 13 19 11 17 11H13V7H7V11H3" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></svg>,
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5EBC67" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
    sun: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5EBC67" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5EBC67" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    facebook: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.81l.39-4h-4.2V7a1 1 0 0 1 1-1h3z" /></svg>,
    instagram: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>,
    twitter: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
  };
  return icons[name] || null;
};

export default function Landing({ onGoToLogin, onGoToRegister }) {
  return (
    <div className={styles.landingContainer}>
      {/* NAVBAR */}
      <nav className={styles.navbar}>
        <div className={styles.logoContainer}>
          <LogoSvg />
        </div>
        <button className={styles.uiButton} onClick={onGoToLogin}>
          ACCEDER
          <div className={styles.uiIcon}>
            <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"></path><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path></svg>
          </div>
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className={styles.heroSection} style={{ backgroundImage: `url(${heroBgField})` }}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <p className={styles.heroPreTitle}>BIENVENIDO A</p>
          <h1 className={styles.heroTitle}>Finca Digi<br />Gestión Agrícola</h1>
          <p className={styles.heroSlogan}>
            Los cultivos hermosos no ocurren por casualidad — ocurren con cuidado.
          </p>
        </div>
        <GrassSeparator fill="#ffffff" />
      </section>

      {/* MAIN CONTENT SECTION */}
      <section className={styles.contentSection}>
        <div className={styles.textContent}>
          <h2>
            Estamos emocionados de ayudarte a mantener un cultivo limpio, <strong>sano y perfectamente monitoreado todo el año.</strong>
          </h2>
          <p>
            Nuestro equipo profesional usa herramientas tecnológicas modernas y técnicas probadas para mantener tus terrenos siempre en su mejor estado.
          </p>
        </div>

        {/* GRID CARDS */}
        <div className={styles.gridContainer}>
          <div className={styles.serviceCard}>
            <div className={styles.iconWrapper}><SvgIcon name="leaf" /></div>
            <h3>Yuca y Tubérculos</h3>
          </div>
          <div className={styles.serviceCard}>
            <div className={styles.iconWrapper}><SvgIcon name="tractor" /></div>
            <h3>Manejo de Plátano</h3>
          </div>
          <div className={styles.serviceCard}>
            <div className={styles.iconWrapper}><SvgIcon name="sun" /></div>
            <h3>Trazabilidad de Maíz</h3>
          </div>
          <div className={styles.serviceCard}>
            <div className={styles.iconWrapper}><SvgIcon name="home" /></div>
            <h3>Supervisión de Cacao</h3>
          </div>
        </div>

        {/* SYSTEM SECTION */}
        <div className={styles.systemSection}>
          <div className={styles.systemHeader}>
            <h3>Conoce Nuestro Sistema Integral</h3>
            <p>Una plataforma completa diseñada específicamente para transformar la manera en que administras tu finca y aumentar tu rentabilidad.</p>
          </div>

          <div className={styles.systemGrid}>
            <div className={styles.systemCard}>
              <div className={styles.systemIcon}><SvgIcon name="leaf" size={32} /></div>
              <h4>Trazabilidad de Lotes</h4>
              <p>Lleva un registro detallado de todas tus cosechas, desde la siembra hasta la distribución.</p>
            </div>
            <div className={styles.systemCard}>
              <div className={styles.systemIcon}><SvgIcon name="tractor" size={32} /></div>
              <h4>Gestión de Empleados</h4>
              <p>Controla roles, asigna tareas específicas y haz seguimiento del rendimiento del personal.</p>
            </div>

            <div className={styles.systemCard}>
              <div className={styles.systemIcon}><SvgIcon name="home" size={32} /></div>
              <h4>Decisiones con Datos</h4>
              <p>Accede a reportes y estadísticas claras para optimizar tus recursos y reducir las mermas.</p>
            </div>
          </div>
        </div>

        {/* APP SECTION */}
        <div className={styles.appPromoSection}>
          <div className={styles.appContentText}>
            <h3>¿Gestión desde el campo?</h3>
            <p>Descarga nuestra aplicación móvil y sincroniza datos sin conexión. Monitorea empleados, clima y rendimiento desde tu teléfono, en cualquier lugar.</p>
            <a href="/downloads/Fincadigi.apk" download className={styles.uiButton} style={{ textDecoration: 'none' }}>
              DESCARGAR APK
              <div className={styles.uiIcon}>
                <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"></path><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path></svg>
              </div>
            </a>
          </div>
          <div className={styles.appContentImage}>
            <img src={appMockup} alt="App Móvil Finca Digi" className={styles.mockupImg} />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section className={styles.footerSection}>
        <GrassSeparator fill="#0D2E1C" flip={true} />
        <div className={styles.footerContent}>
          <FooterLogoSvg />

          <div className={styles.contactInfo}>
            <p className={styles.contactLabel}>¿Tienes alguna duda? Escríbenos a:</p>
            <p className={styles.contactEmail}>contacto@fincadigi.com</p>
          </div>

          <div className={styles.socialInfo}>
            <p className={styles.socialLabel}>CONÉCTATE CON NOSOTROS</p>
            <div className={styles.socialIcons}>
              <a href="#"><SvgIcon name="facebook" /></a>
              <a href="#"><SvgIcon name="instagram" /></a>
              <a href="#"><SvgIcon name="twitter" /></a>
            </div>
          </div>

          <p className={styles.unsubscribeText}>Si no deseas recibir correos de nosotros, <a href="#">desuscríbete</a></p>
        </div>
      </section>
    </div>
  );
}
