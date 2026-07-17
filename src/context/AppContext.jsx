import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const AppContext = createContext(null);

const ROLES = { superadmin: 'Super Admin', admin: 'Administrador', encargado: 'Encargado', empleado: 'Empleado' };

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        setLoading(true);
        try {
          const directRef = doc(db, 'usuarios', firebaseUser.uid);
          const directSnap = await getDoc(directRef);
          
          let targetDocId = null;

          if (directSnap.exists() && directSnap.data().activo !== false) {
            targetDocId = directSnap.id;
          } else {
            const q = query(collection(db, 'usuarios'), where('uid', '==', firebaseUser.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              const foundDoc = docs.find(d => d.activo !== false) || docs[0];
              targetDocId = foundDoc.id;
            } else {
              const newDoc = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                nombre: firebaseUser.displayName || firebaseUser.email,
                rol: 'pendiente',
                activo: true,
                createdAt: new Date().toISOString()
              };

              const qAdmin = query(collection(db, 'usuarios'), where('rol', 'in', ['superadmin', 'admin']));
              const snapAdmin = await getDocs(qAdmin);
              const activeAdmins = snapAdmin.docs.filter(d => d.data().activo !== false);
              if (activeAdmins.length === 0) {
                newDoc.rol = 'superadmin';
              }

              await setDoc(doc(db, 'usuarios', firebaseUser.uid), newDoc);
              targetDocId = firebaseUser.uid;
            }
          }

          if (targetDocId) {
            unsubscribeSnapshot = onSnapshot(doc(db, 'usuarios', targetDocId), async (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.rol === 'pendiente') {
                  const qAdmin = query(collection(db, 'usuarios'), where('rol', 'in', ['superadmin', 'admin']));
                  const snapAdmin = await getDocs(qAdmin);
                  const activeAdmins = snapAdmin.docs.filter(d => d.data().activo !== false);
                  if (activeAdmins.length === 0) {
                    await updateDoc(doc(db, 'usuarios', targetDocId), { rol: 'superadmin' });
                    data.rol = 'superadmin';
                  }
                }
                setUserRole(data.rol);
                setUserData({ id: docSnap.id, ...data });
              } else {
                setUserRole(null);
                setUserData(null);
              }
              setLoading(false);
            });
          }
        } catch {
          setUserRole('pendiente');
          setUserData({ nombre: firebaseUser.email, rol: 'pendiente' });
          setLoading(false);
        }
      } else {
        setUserRole(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const rolLabel = ROLES[userRole] || 'Usuario';

  return (
    <AppContext.Provider value={{ user, userRole, userData, loading, theme, toggleTheme, rolLabel }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}

export { ROLES };
