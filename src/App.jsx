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
        <div className="app-spinner" />
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

  const empleadoOnly = ['dashboard', 'elempleado', 'inventario', 'lotes', 'monitoreo', 'apply', 'siembras'];
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
      case 'paneladmin':
        return <PanelAdmin />;
      case 'panelencargado':
        return <PanelEncargado />;
      case 'elempleado':
        return <PanelEmpleado />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">
      <Sidebar onNavigate={navigate} currentPage={safePage} />
      <div className="app-main-wrapper">
        <Header onNavigate={navigate} currentPage={safePage} />
        <main className="app-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
