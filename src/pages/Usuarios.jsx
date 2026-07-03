import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, setDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import styles from './Usuarios.module.css';

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

const ROLES_OPTS = [
  { value: 'empleado', label: 'Empleado', desc: 'Solo ve y finaliza sus tareas asignadas' },
  { value: 'encargado', label: 'Encargado', desc: 'Valida tareas, edita, aprueba' },
  { value: 'admin', label: 'Administrador', desc: 'Asigna tareas, semaforo, gestiona cultivos' },
];

const SvgIcon = ({ name, size = 16 }) => {
  const icons = {
    userPlus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    refreshCw: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    userCheck: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  };
  return icons[name] || null;
};

export default function Usuarios() {
  const { userRole } = useAppContext();
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'empleado' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [modalForm, setModalForm] = useState({ nombre: '', rol: '', newPassword: '' });
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'usuarios'), orderBy('nombre')), snap => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm({ email: '', password: '', nombre: '', rol: 'empleado' });
    setEditing(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email || !form.password || !form.nombre) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    try {
      const res = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          returnSecureToken: true,
        }),
      });
      const data = await res.json();

      if (data.error) {
        if (data.error.message === 'EMAIL_EXISTS') {
          setError('Este correo ya esta registrado');
        } else {
          setError(data.error.message);
        }
        return;
      }

      await setDoc(doc(db, 'usuarios', data.localId), {
        uid: data.localId,
        email: form.email,
        nombre: form.nombre,
        rol: form.rol,
        activo: true,
        createdAt: new Date().toISOString(),
      });

      setSuccess(`Usuario "${form.nombre}" creado exitosamente como ${ROLES_OPTS.find(r => r.value === form.rol)?.label || form.rol}`);
      resetForm();
    } catch (err) {
      setError('Error de conexion al crear usuario');
    }
  };

  const handleRolChange = async (usuarioId, nuevoRol) => {
    try {
      await updateDoc(doc(db, 'usuarios', usuarioId), { rol: nuevoRol });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDesactivar = async () => {
    if (!deleteTarget) return;
    try {
      await updateDoc(doc(db, 'usuarios', deleteTarget.id), { activo: false });
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
      setDeleteTarget(null);
    }
  };

  const handleEliminarPermanente = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'usuarios', deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
      setDeleteTarget(null);
    }
  };

  const handleActivate = async (usuario) => {
    try {
      await updateDoc(doc(db, 'usuarios', usuario.id), { activo: true });
    } catch (err) {
      alert(err.message);
    }
  };

  const openModal = (usuario) => {
    setModalUser(usuario);
    setModalForm({ nombre: usuario.nombre || '', rol: usuario.rol || '', newPassword: '' });
    setModalError('');
    setModalSuccess('');
  };

  const handleGuardarCambios = async () => {
    if (!modalUser) return;
    setModalError('');
    setModalSuccess('');
    if (!modalForm.nombre) {
      setModalError('El nombre es obligatorio');
      return;
    }
    try {
      await updateDoc(doc(db, 'usuarios', modalUser.id), {
        nombre: modalForm.nombre,
        rol: modalForm.rol,
      });
      setModalSuccess('Cambios guardados exitosamente');
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleActualizarPassword = async () => {
    if (!modalUser) return;
    if (!modalForm.newPassword || modalForm.newPassword.length < 6) {
      setModalError('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    setEnviandoReset(true);
    setModalError('');
    setModalSuccess('');
    try {
      // Step 1: get OOB code without sending email
      const res1 = await fetch(`${AUTH_BASE}/accounts:sendOobCode?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: modalUser.email,
          returnOobLink: true,
        }),
      });
      const data1 = await res1.json();
      if (data1.error) throw new Error(data1.error.message);

      const oobLink = data1.oobLink;
      if (!oobLink) throw new Error('No se pudo generar el codigo de restablecimiento');
      const oobCode = new URL(oobLink).searchParams.get('oobCode');

      // Step 2: reset password with OOB code
      const res2 = await fetch(`${AUTH_BASE}/accounts:resetPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode, newPassword: modalForm.newPassword }),
      });
      const data2 = await res2.json();
      if (data2.error) throw new Error(data2.error.message);

      setModalSuccess('Contrasena actualizada exitosamente');
      setModalForm(f => ({ ...f, newPassword: '' }));
    } catch (err) {
      setModalError(err.message);
    } finally {
      setEnviandoReset(false);
    }
  };

  const rolLabel = { superadmin: 'Super Admin', admin: 'Administrador', encargado: 'Encargado', empleado: 'Empleado', pendiente: 'Pendiente de Aprobación' };

  const activos = usuarios.filter(u => u.activo !== false);
  const inactivos = usuarios.filter(u => u.activo === false);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Gestion de Usuarios</h1>
          <p className={styles.subtitle}>
            {activos.length} usuario{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''} · Crea cuentas con correo, contrasena y rol
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { if (!showForm) { resetForm(); setShowForm(true); } else { resetForm(); } }}>
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleCreate}>
          <h2 className={styles.formTitle}>{editing ? 'Editar usuario' : 'Crear nuevo usuario'}</h2>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre completo</label>
              <input className={styles.input} type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Juan Perez" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Correo electronico</label>
              <input className={styles.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ejemplo@correo.com" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Contrasena</label>
              <input className={styles.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 caracteres" required minLength={6} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Rol</label>
              <select className={styles.select} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                {ROLES_OPTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <p className={styles.rolDesc}>{ROLES_OPTS.find(r => r.value === form.rol)?.desc}</p>
          <button className={styles.btnPrimary} type="submit">Crear usuario</button>
        </form>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Usuarios activos</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activos.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.cellUser}>
                      <span className={styles.avatar}>{u.nombre?.charAt(0).toUpperCase() || '?'}</span>
                      <span className={styles.userNombre}>{u.nombre || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className={styles.cellEmail}>{u.email || '—'}</td>
                  <td>
                      <select
                        className={`${styles.rolSelect} ${u.rol === 'pendiente' ? styles.rolPendiente : ''}`}
                        value={u.rol}
                        onChange={e => handleRolChange(u.id, e.target.value)}
                        disabled={u.rol === 'superadmin'}
                      >
                        {Object.entries(rolLabel).map(([key, label]) => (
                          <option key={key} value={key} disabled={key === 'superadmin' || key === 'pendiente'}>{label}</option>
                        ))}
                      </select>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      {u.rol !== 'superadmin' && (
                        <>
                          <button className={styles.btnIcon} onClick={() => openModal(u)} title="Editar / Restablecer contrasena">
                            <SvgIcon name="edit" size={16} />
                          </button>
                          <button className={styles.btnIcon} onClick={() => setDeleteTarget(u)} title="Desactivar">
                            <SvgIcon name="trash" size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {activos.length === 0 && (
                <tr><td colSpan={4} className={styles.empty}>No hay usuarios activos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inactivos.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Usuarios desactivados</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map(u => (
                  <tr key={u.id} className={styles.rowInactivo}>
                    <td>
                      <div className={styles.cellUser}>
                        <span className={styles.avatar}>{u.nombre?.charAt(0).toUpperCase() || '?'}</span>
                        <span className={styles.userNombre}>{u.nombre || 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td className={styles.cellEmail}>{u.email || '—'}</td>
                    <td><span className={styles.rolTag}>{rolLabel[u.rol]}</span></td>
                    <td>
                      <button className={styles.btnActivate} onClick={() => handleActivate(u)}>
                        <SvgIcon name="userCheck" size={14} /> Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal editar / restablecer contrasena */}
      {modalUser && (
        <div className={styles.overlay} onClick={() => { setModalUser(null); setDeleteTarget(null); }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <SvgIcon name="edit" size={18} /> Editar usuario
              </h3>
              <button className={styles.modalClose} onClick={() => { setModalUser(null); setDeleteTarget(null); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className={styles.modalSub}>{modalUser.email}</p>

            {modalError && <div className={styles.error}>{modalError}</div>}
            {modalSuccess && <div className={styles.success}>{modalSuccess}</div>}

            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre</label>
                <input className={styles.input} type="text" value={modalForm.nombre} onChange={e => setModalForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Rol</label>
                <select className={styles.select} value={modalForm.rol} onChange={e => setModalForm(f => ({ ...f, rol: e.target.value }))}>
                  {Object.entries(rolLabel).map(([key, label]) => (
                    <option key={key} value={key} disabled={key === 'superadmin'}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => { setModalUser(null); setDeleteTarget(null); }}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleGuardarCambios}>Guardar cambios</button>
            </div>

            <div className={styles.modalDivider} />

            <div className={styles.modalResetSection}>
              <p className={styles.modalResetLabel}>Cambiar contrasena</p>
              <div className={styles.field}>
                <label className={styles.label}>Nueva contrasena</label>
                <input className={styles.input} type="password" value={modalForm.newPassword} onChange={e => setModalForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min. 6 caracteres" />
              </div>
              <button className={styles.btnResetPass} onClick={handleActualizarPassword} disabled={enviandoReset || !modalForm.newPassword}>
                <SvgIcon name="refreshCw" size={16} />
                {enviandoReset ? 'Actualizando...' : 'Actualizar contrasena'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && !modalUser && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Gestionar acceso</h3>
            <p className={styles.modalText}>
              Selecciona qué acción deseas realizar con <strong>{deleteTarget.nombre}</strong>.
            </p>
            <div className={styles.modalActionsCol}>
              <button className={styles.btnSecondary} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className={styles.btnWarning} onClick={handleDesactivar}>Desactivar temporalmente</button>
              <button className={styles.btnDanger} onClick={handleEliminarPermanente}>Eliminar permanentemente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
