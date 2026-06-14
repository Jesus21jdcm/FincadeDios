import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
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
import './styles/global.css';

export default function App() {
  const { user, loading, userRole } = useAppContext();
  const [page, setPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const empleadoOnly = ['dashboard', 'elempleado', 'inventario', 'lotes', 'monitoreo'];
  const canAccess = (target) => userRole !== 'empleado' || empleadoOnly.includes(target);
  const safePage = canAccess(page) ? page : 'dashboard';

  const navigate = (target) => {
    if (canAccess(target)) setPage(target);
  };

  const renderPage = () => {
    switch (safePage) {
      case 'apply':
        return <ApplyInput />;
      case 'inventario':
        return <Inventario />;
      case 'lotes':
        return <Lotes />;
      case 'monitoreo':
        return <Monitoreo />;
      case 'alertas':
        return <Alertas />;
      case 'siembras':
        return <Siembras />;
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
