import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import ApplyInput from './pages/ApplyInput';
import Inventario from './pages/Inventario';
import Lotes from './pages/Lotes';
import Monitoreo from './pages/Monitoreo';
import Alertas from './pages/Alertas';
import Siembras from './pages/Siembras';
import Historial from './pages/Historial';
import Usuarios from './pages/Usuarios';
import PanelAdmin from './pages/PanelAdmin';
import PanelEncargado from './pages/PanelEncargado';
import PanelEmpleado from './pages/PanelEmpleado';
import Perfil from './pages/Perfil';
import { auth } from './firebase';
import './styles/global.css';

export default function App() {
  const { user, loading, userRole } = useAppContext();
  const [page, setPage] = useState('dashboard');
  const [pageProps, setPageProps] = useState({});
  const [unauthRoute, setUnauthRoute] = useState('landing');

  if (loading) {
    return (
      <div className="app-loading">
        <div className="tractor-loader">
          <svg viewBox="0 -10 100 70" width="100%" height="100%" className="tractor-svg">
            {/* Smoke */}
            <circle cx="28" cy="5" r="4" fill="#cbd5e1" className="smoke smoke-1"/>
            <circle cx="34" cy="0" r="5" fill="#cbd5e1" className="smoke smoke-2"/>
            <g className="tractor-body">
              {/* Engine/Hood */}
              <path d="M 15 25 L 50 25 L 50 40 L 10 40 Z" fill="var(--color-primary-light)" />
              {/* Cabin */}
              <path d="M 45 25 L 45 10 L 75 10 L 80 25 L 80 40 L 50 40 Z" fill="var(--color-primary)" />
              {/* Window */}
              <path d="M 50 14 L 70 14 L 73 22 L 50 22 Z" fill="#E8EAF3" />
              {/* Roof */}
              <rect x="42" y="6" width="38" height="4" rx="2" fill="var(--color-primary)" />
              {/* Exhaust Pipe inside body for simplicity but visual is same */}
              <path d="M 25 25 L 25 10 L 30 10 L 30 25 Z" fill="#A0A5BB" />
              {/* Lights */}
              <circle cx="12" cy="30" r="3" fill="#FDE047" />
            </g>
            <g transform="translate(25, 40)">
              <g className="wheel front-wheel">
                <circle cx="0" cy="0" r="10" fill="#1e293b" />
                <circle cx="0" cy="0" r="4" fill="#cbd5e1" />
                <circle cx="0" cy="0" r="10" fill="none" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M -7 -7 L 7 7 M -7 7 L 7 -7 M 0 -10 L 0 10 M -10 0 L 10 0" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            </g>
            <g transform="translate(70, 35)">
              <g className="wheel back-wheel">
                <circle cx="0" cy="0" r="16" fill="#1e293b" />
                <circle cx="0" cy="0" r="6" fill="#cbd5e1" />
                <circle cx="0" cy="0" r="16" fill="none" stroke="#0f172a" strokeWidth="3" strokeDasharray="6 6" />
                <path d="M -11 -11 L 11 11 M -11 11 L 11 -11 M 0 -16 L 0 16 M -16 0 L 16 0" stroke="#cbd5e1" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        </div>
        <p className="loading-text">CARGANDO...</p>
      </div>
    );
  }

  if (!user) {
    if (unauthRoute === 'landing') return <Landing onGoToLogin={() => setUnauthRoute('login')} onGoToRegister={() => setUnauthRoute('register')} />;
    if (unauthRoute === 'login') return <Login onGoToLanding={() => setUnauthRoute('landing')} onGoToRegister={() => setUnauthRoute('register')} />;
    if (unauthRoute === 'register') return <Register onBack={() => setUnauthRoute('landing')} onGoToLogin={() => setUnauthRoute('login')} />;
  }

  if (userRole === 'pendiente') {
    return <PendingApproval userData={user} onLogout={() => auth.signOut()} />;
  }

  const empleadoOnly = ['dashboard', 'elempleado', 'inventario', 'lotes', 'monitoreo', 'apply', 'siembras', 'perfil'];
  const canAccess = (target) => userRole !== 'empleado' || empleadoOnly.includes(target);
  const safePage = canAccess(page) ? page : 'dashboard';

  const navigate = (target, props = {}) => {
    if (canAccess(target)) {
      setPage(target);
      setPageProps(props);
    }
  };

  const renderPage = () => {
    switch (safePage) {
      case 'apply':
        return <ApplyInput />;
      case 'inventario':
        return <Inventario {...pageProps} />;
      case 'lotes':
        return <Lotes {...pageProps} />;
      case 'monitoreo':
        return <Monitoreo />;
      case 'alertas':
        return <Alertas />;
      case 'siembras':
        return <Siembras {...pageProps} />;
      case 'historial':
        return <Historial />;
      case 'usuarios':
        return <Usuarios />;
      case 'perfil':
        return <Perfil />;
      case 'eladmin':
        return <PanelAdmin />;
      case 'elencargado':
        return <PanelEncargado />;
      case 'elempleado':
        return <PanelEmpleado />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">
      <Sidebar currentPage={safePage} onNavigate={navigate} />
      <div className="app-main-wrapper">
        <Header currentPage={safePage} onNavigate={navigate} />
        <main className="app-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
