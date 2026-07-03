import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import styles from './Login.module.css';
import tractorImg from '../assets/header.jpg';

const SvgIcon = ({ name, size = 18 }) => {
  const icons = {
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
    eyeOff: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>,
    alertCircle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    google: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  };
  return icons[name] || null;
};

export default function Login({ onGoToLanding, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico arriba y presiona "Olvidaste tu contraseña".');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError('No pudimos enviar el correo. Verifica que la dirección sea correcta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Correo inválido',
        'auth/invalid-credential': 'Credenciales inválidas',
      };
      setError(messages[err.code] || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftSide}>
        <div className={styles.brand} style={{ cursor: 'pointer' }} onClick={onGoToLanding}>
          <svg width="155" height="33" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 0)">
              <path d="M4 10C4 4.477 8.477 0 14 0H24.5C26.985 0 29 2.015 29 4.5C29 6.985 26.985 9 24.5 9H14.5C13.67 9 13 9.67 13 10.5V26.5C13 27.88 11.88 29 10.5 29H6.5C5.12 29 4 27.88 4 26.5V10Z" fill="url(#gradLogoLogin1)"/>
              <path d="M13 13H20.5C22.985 13 25 15.015 25 17.5C25 19.985 22.985 22 20.5 22H13V13Z" fill="url(#gradLogoLogin2)"/>
            </g>
            <defs>
              <linearGradient id="gradLogoLogin1" x1="4" y1="0" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34D399"/>
                <stop offset="1" stopColor="#14C2F4"/>
              </linearGradient>
              <linearGradient id="gradLogoLogin2" x1="13" y1="13" x2="25" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#14C2F4"/>
                <stop offset="1" stopColor="#633AF8"/>
              </linearGradient>
            </defs>
            <text x="36" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="var(--color-foreground)" letterSpacing="0.5">FINCA</text>
            <text x="86" y="21" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="17" fill="var(--color-cyan)" letterSpacing="0.5">DIGI</text>
          </svg>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.title}>Iniciar sesión</h1>
            <p className={styles.subtitle}>
              ¿No tienes una cuenta? <a href="#" className={styles.link} onClick={(e) => { e.preventDefault(); onGoToRegister(); }}>Crear ahora</a>
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <div className={styles.error} role="alert">
                <SvgIcon name="alertCircle" size={16} />
                <span>{error}</span>
              </div>
            )}
            
            {resetSent && (
              <div className={styles.error} style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }} role="alert">
                <span>Enlace de recuperación enviado. Revisa tu bandeja de entrada o carpeta de spam.</span>
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Correo electrónico</label>
              <input id="email" type="email" className={styles.input}
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="superadmin@fincadigital.com" autoComplete="email" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <input id="password" type={showPassword ? "text" : "password"} className={styles.input}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••" autoComplete="current-password" required minLength={6} />
                <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)} title="Mostrar contraseña">
                  <SvgIcon name={showPassword ? "eyeOff" : "eye"} size={20} />
                </button>
              </div>
            </div>

            <div className={styles.optionsRow} style={{ justifyContent: 'flex-end', marginTop: '8px' }}>
              <a href="#" className={styles.forgotLink} onClick={handleResetPassword}>¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Iniciar sesión'}
            </button>

            {onGoToLanding && (
              <div className={styles.footerLinks}>
                <button type="button" onClick={onGoToLanding} className={styles.backToHomeBtn}>
                  Volver al inicio
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className={styles.rightSide}>
        <img src={tractorImg} className={styles.heroImage} alt="Tractor en la finca" />
      </div>
    </div>
  );
}
