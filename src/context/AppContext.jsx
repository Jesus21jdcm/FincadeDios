import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

const AppContext = createContext(null);

const ROLES = { superadmin: 'Super Admin', admin: 'Administrador', encargado: 'Encargado', empleado: 'Empleado' };

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          let userDoc;
          const directRef = doc(db, 'usuarios', firebaseUser.uid);
          const directSnap = await getDoc(directRef);
          if (directSnap.exists() && directSnap.data().activo !== false) {
            userDoc = { id: directSnap.id, ...directSnap.data() };
          } else {
            const q = query(collection(db, 'usuarios'), where('uid', '==', firebaseUser.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              userDoc = docs.find(d => d.activo !== false) || docs[0];
            }
          }
          if (userDoc) {
            setUserRole(userDoc.rol);
            setUserData({ id: userDoc.id, ...userDoc });
          } else {
            const newDoc = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nombre: firebaseUser.displayName || firebaseUser.email,
              rol: 'pendiente',
              activo: true,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'usuarios', firebaseUser.uid), newDoc);
            setUserRole('pendiente');
            setUserData({ id: firebaseUser.uid, ...newDoc });
          }
        } catch {
          setUserRole('pendiente');
          setUserData({ nombre: firebaseUser.email, rol: 'pendiente' });
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
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
