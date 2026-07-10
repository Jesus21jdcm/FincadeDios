import { useState } from 'react';
import { auth, db } from '../firebase';
import { verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import styles from './Perfil.module.css';

export default function Perfil() {
  const { user, userData } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Debes ingresar tu contraseña actual para realizar cambios.');
      return;
    }

    if (!newEmail && !newPassword) {
      setError('Debes ingresar un nuevo correo o una nueva contraseña.');
      return;
    }

    setLoading(true);

    try {
      // Re-autenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      let emailChanged = false;
      let passwordChanged = false;

      // Actualizar Email con Verificación
      if (newEmail && newEmail !== user.email) {
        await verifyBeforeUpdateEmail(user, newEmail);
        // Firebase enviará un correo. No actualizamos Firestore aún hasta que lo verifique,
        // pero le avisaremos al usuario en el mensaje de éxito.
        emailChanged = true;
      }

      // Actualizar Contraseña
      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
        }
        await updatePassword(user, newPassword);
        passwordChanged = true;
      }

      setSuccess(`Actualización exitosa: ${emailChanged ? 'Se ha enviado un correo al nuevo email. Debes abrir el enlace en ese correo para verificar y aplicar el cambio. ' : ''}${passwordChanged ? 'Contraseña actualizada.' : ''}`);
      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError('La contraseña actual es incorrecta.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El nuevo correo ya está en uso por otra cuenta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El nuevo correo no es válido.');
      } else {
        setError(err.message || 'Ocurrió un error al actualizar los datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mi Perfil</h1>
        <p className={styles.subtitle}>Actualiza tus credenciales de acceso. Por seguridad, necesitas tu contraseña actual.</p>
      </div>

      <div className={styles.card}>
        {error && (
          <div className={styles.errorBanner}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successBanner}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Correo Electrónico Actual</label>
            <input type="text" className={styles.inputDisabled} value={user?.email || ''} disabled />
          </div>

          <div className={styles.divider} />

          <div className={styles.formGroup}>
            <label className={styles.label}>Nuevo Correo Electrónico (Opcional)</label>
            <input 
              type="email" 
              className={styles.input} 
              value={newEmail} 
              onChange={e => setNewEmail(e.target.value)} 
              placeholder="nuevo@correo.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nueva Contraseña (Opcional)</label>
            <input 
              type="password" 
              className={styles.input} 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div className={styles.divider} />
          
          <div className={styles.alertBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <strong>Autenticación Requerida</strong>
              <p>Para aplicar cualquier cambio debes introducir tu contraseña actual.</p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña Actual <span style={{color: 'var(--color-red)'}}>*</span></label>
            <input 
              type="password" 
              className={styles.input} 
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)} 
              placeholder="Tu contraseña actual"
              required
            />
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
