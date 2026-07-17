import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import styles from './Register.module.css';
import tractorImg from '../assets/images/header.webp';

const SvgIcon = ({ name, size = 18 }) => {
  const icons = {
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
    eyeOff: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>,
    alertCircle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
  };
  return icons[name] || null;
};

export default function Register({ onBack, onGoToLogin }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('Por favor, ingresa tu nombre completo.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Create user in Auth
      // The AppContext.jsx will detect the new user and create the Firestore document
      // with activo: false and estado: 'pendiente'

      // But wait! We need to pass the name so AppContext can use it.
      // By default Firebase auth allows updating profile.
      const { updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: nombre });

      // After this, the AuthStateChanged listener will fire in AppContext.
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'El correo ya está registrado',
        'auth/invalid-email': 'Correo inválido',
        'auth/weak-password': 'La contraseña es muy débil',
      };
      setError(messages[err.code] || 'Error al registrarse: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftSide}>
        <div className={styles.brand} style={{ cursor: 'pointer' }} onClick={onBack}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '32px', fontFamily: "'Poppins', sans-serif" }}>
            <span style={{ fontWeight: 800, color: '#1A1A24', letterSpacing: '1px' }}>FINCA</span>
            <span style={{ fontWeight: 800, color: 'var(--color-cyan)', letterSpacing: '1px' }}>DIGI</span>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.title}>Crear cuenta</h1>
            <p className={styles.subtitle}>
              ¿Ya tienes una cuenta? <a href="#" className={styles.link} onClick={(e) => { e.preventDefault(); onGoToLogin(); }}>Iniciar sesión</a>
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <div className={styles.error} role="alert">
                <SvgIcon name="alertCircle" size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="nombre" className={styles.label}>Nombre completo</label>
              <input id="nombre" type="text" className={styles.input}
                value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez" autoComplete="name" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Correo electrónico</label>
              <input id="email" type="email" className={styles.input}
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@gmail.com" autoComplete="email" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <input id="password" type={showPassword ? "text" : "password"} className={styles.input}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 caracteres" autoComplete="new-password" required minLength={6} />
                <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)} title="Mostrar contraseña">
                  <SvgIcon name={showPassword ? "eyeOff" : "eye"} size={20} />
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ marginTop: '24px' }}>
              {loading ? <span className={styles.spinner} /> : 'Registrarse'}
            </button>

            {onBack && (
              <button type="button" onClick={onBack} className={styles.backToHomeBtn}>
                Volver al inicio
              </button>
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
