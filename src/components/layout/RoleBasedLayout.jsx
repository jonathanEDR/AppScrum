import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { useRole } from '../../context/RoleContext.jsx';
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X, 
  User,
  Shield,
  LogOut,
  BarChart3,
  Calendar,
  Target,
  Code,
  Briefcase,
  Cloud
} from 'lucide-react';
import LogoutButton from '../auth/LogoutButton';
import ProductOwnerSidebar from './Sidebars/ProductOwnerSidebar';
import ScrumMasterSidebar from './Sidebars/ScrumMasterSidebar';
import DevelopersSidebar from './Sidebars/DevelopersSidebar';
import UserSidebar from './Sidebars/UserSidebar';
import SuperAdminSidebar from './Sidebars/SuperAdminSidebar';

// Configuración de navegación por rol
const getRoleNavigation = (role) => {
  const baseItems = [
    {
      name: 'Dashboard',
      path: `/${role}`,
      icon: Home,
      show: true
    },
    {
      name: 'Mi Perfil',
      path: `/${role}/perfil`,
      icon: User,
      show: true
    }
  ];

  // Elementos específicos por rol
  const roleSpecificItems = {
    super_admin: [
      {
        name: 'Gestión de Usuarios',
        path: `/super_admin/usuarios`,
        icon: Users,
        show: true
      },
      {
        name: 'Gestión de CVs',
        path: `/super_admin/cvs`,
        icon: FileText,
        show: true
      },
      {
        name: 'Colaboradores',
        path: `/super_admin/colaboradores`,
        icon: Users,
        show: true
      },
      {
        name: 'Panel Admin',
        path: `/super_admin/admin`,
        icon: Shield,
        show: true
      },
      {
        name: 'Gestión de Cloudinary',
        path: `/super_admin/cloudinary`,
        icon: Cloud,
        show: true
      },
      {
        name: 'Configuración',
        path: `/super_admin/configuracion`,
        icon: Settings,
        show: true
      },
      {
        name: 'Acceso Invitados',
        path: `/super_admin/acceso-invitados`,
        icon: Users,
        show: true
      }
    ],
    product_owner: [
      {
        name: 'Productos',
        path: `/product_owner/productos`,
        icon: Briefcase,
        show: true
      },
      {
        name: 'Product Backlog',
        path: `/product_owner/backlog`,
        icon: Target,
        show: true
      },
      {
        name: 'Roadmap',
        path: `/product_owner/roadmap`,
        icon: Calendar,
        show: true
      },
      {
        name: 'Métricas',
        path: `/product_owner/metricas`,
        icon: BarChart3,
        show: true
      }
    ],
    scrum_master: [
      {
        name: 'Sprints',
        path: `/scrum_master/sprints`,
        icon: Target,
        show: true
      },
      {
        name: 'Impedimentos',
        path: `/scrum_master/impedimentos`,
        icon: Shield,
        show: true
      },
      {
        name: 'Ceremonias',
        path: `/scrum_master/ceremonias`,
        icon: Calendar,
        show: true
      },
      {
        name: 'Equipo',
        path: `/scrum_master/equipo`,
        icon: Users,
        show: true
      },
      {
        name: 'Métricas',
        path: `/scrum_master/metricas`,
        icon: BarChart3,
        show: true
      }
    ],
    developers: [
      {
        name: 'Mis Tareas',
        path: `/developers/tareas`,
        icon: Target,
        show: true
      },
      {
        name: 'Proyectos',
        path: `/developers/proyectos`,
        icon: Briefcase,
        show: true
      },
      {
        name: 'Sprint Board',
        path: `/developers/sprint-board`,
        icon: Calendar,
        show: true
      },
      {
        name: 'Time Tracking',
        path: `/developers/time-tracking`,
        icon: BarChart3,
        show: true
      }
    ],
    user: [
      {
        name: 'Mis Actividades',
        path: `/user/actividades`,
        icon: BarChart3,
        show: true
      }
    ],
  };

  return [...baseItems, ...(roleSpecificItems[role] || [])];
};

// Mapeo de títulos por rol
const getRoleTitle = (role) => {
  const titles = {
    super_admin: 'Panel Super Administrador',
    product_owner: 'Panel Product Owner',
    scrum_master: 'Panel Scrum Master',
    developers: 'Panel Desarrollador',
    user: 'Panel Usuario'
  };
  return titles[role] || 'Dashboard';
};

// Componente de navegación lateral
const Sidebar = ({ isOpen, onClose, onToggle, role, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationItems = getRoleNavigation(role);

  // Si es Product Owner, usar nuestro sidebar personalizado
  if (role === 'product_owner') {
    // Determinar la vista actual basada en la ruta
    const getCurrentView = () => {
      const path = location.pathname;
      if (path === '/product_owner') return 'dashboard';
      if (path.includes('/productos')) return 'productos';
      if (path.includes('/backlog')) return 'backlog';
      if (path.includes('/roadmap')) return 'roadmap';
      if (path.includes('/sprint-planning')) return 'sprint-planning';
      if (path.includes('/scrum-ai')) return 'scrum-ai';
      if (path.includes('/metricas')) return 'metricas';
      if (path.includes('/colaboradores')) return 'colaboradores';
      if (path.includes('/perfil')) return 'perfil';
      return 'dashboard';
    };

    const currentView = getCurrentView();
    const handleViewChange = (view) => {
      // Navegar a las diferentes vistas del Product Owner
      switch(view) {
        case 'dashboard':
          navigate('/product_owner');
          break;
        case 'productos':
          navigate('/product_owner/productos');
          break;
        case 'backlog':
          navigate('/product_owner/backlog');
          break;
        case 'roadmap':
          navigate('/product_owner/roadmap');
          break;
        case 'sprint-planning':
          navigate('/product_owner/sprint-planning');
          break;
        case 'scrum-ai':
          navigate('/product_owner/scrum-ai');
          break;
        case 'metricas':
          navigate('/product_owner/metricas');
          break;
        case 'colaboradores':
          navigate('/product_owner/colaboradores');
          break;
        case 'perfil':
          navigate('/product_owner/perfil');
          break;
        default:
          navigate('/product_owner');
      }
    };

    return (
      <ProductOwnerSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={onLogout}
        userRole={role}
        isOpen={isOpen}
        onToggle={onToggle}
      />
    );
  }

  // Si es Scrum Master, usar nuestro sidebar personalizado
  if (role === 'scrum_master') {
    // Determinar la vista actual basada en la ruta
    const getCurrentView = () => {
      const path = location.pathname;
      if (path === '/scrum_master') return 'dashboard';
      if (path.includes('/sprints')) return 'sprints';
      if (path.includes('/impedimentos')) return 'impediments';
      if (path.includes('/ceremonias')) return 'ceremonies';
      if (path.includes('/equipo')) return 'team';
      if (path.includes('/bug-reports')) return 'bug-reports';
      if (path.includes('/metricas')) return 'metrics';
      if (path.includes('/perfil')) return 'profile';
      return 'dashboard';
    };

    const currentView = getCurrentView();
    const handleViewChange = (view) => {
      // Navegar a las diferentes vistas del Scrum Master
      switch(view) {
        case 'dashboard':
          navigate('/scrum_master');
          break;
        case 'sprints':
          navigate('/scrum_master/sprints');
          break;
        case 'impediments':
          navigate('/scrum_master/impedimentos');
          break;
        case 'ceremonies':
          navigate('/scrum_master/ceremonias');
          break;
        case 'team':
          navigate('/scrum_master/equipo');
          break;
        case 'bug-reports':
          navigate('/scrum_master/bug-reports');
          break;
        case 'metrics':
          navigate('/scrum_master/metricas');
          break;
        case 'profile':
          navigate('/scrum_master/perfil');
          break;
        default:
          navigate('/scrum_master');
      }
    };

    return (
      <ScrumMasterSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={onLogout}
        userRole={role}
        isOpen={isOpen}
        onToggle={onToggle}
      />
    );
  }

  // Si es Developer, usar nuestro sidebar personalizado
  if (role === 'developers') {
    // Determinar la vista actual basada en la ruta
    const getCurrentView = () => {
      const path = location.pathname;
      if (path === '/developers') return 'dashboard';
      if (path.includes('/tareas')) return 'tasks';
      if (path.includes('/proyectos')) return 'projects';
      if (path.includes('/sprint-board')) return 'sprint-board';
      if (path.includes('/time-tracking')) return 'time-tracking';
      if (path.includes('/bug-reports')) return 'bug-reports';
      if (path.includes('/perfil')) return 'profile';
      return 'dashboard';
    };

    const currentView = getCurrentView();
    const handleViewChange = (view) => {
      // Navegar a las diferentes vistas del Developer
      switch(view) {
        case 'dashboard':
          navigate('/developers');
          break;
        case 'tasks':
          navigate('/developers/tareas');
          break;
        case 'projects':
          navigate('/developers/proyectos');
          break;
        case 'sprint-board':
          navigate('/developers/sprint-board');
          break;
        case 'time-tracking':
          navigate('/developers/time-tracking');
          break;
        case 'bug-reports':
          navigate('/developers/bug-reports');
          break;
        case 'profile':
          navigate('/developers/perfil');
          break;
        default:
          navigate('/developers');
      }
    };

    return (
      <DevelopersSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={onLogout}
        userRole={role}
        isOpen={isOpen}
        onToggle={onToggle}
      />
    );
  }

  // Si es User, usar nuestro sidebar personalizado
  if (role === 'user') {
    // Determinar la vista actual basada en la ruta
    const getCurrentView = () => {
      const path = location.pathname;
      if (path === '/user') return 'dashboard';
      if (path.includes('/actividades')) return 'actividades';
      if (path.includes('/perfil')) return 'profile';
      return 'dashboard';
    };

    const currentView = getCurrentView();
    const handleViewChange = (view) => {
      // Navegar a las diferentes vistas del User
      switch(view) {
        case 'dashboard':
          navigate('/user');
          break;
        case 'actividades':
          navigate('/user/actividades');
          break;
        case 'profile':
          navigate('/user/perfil');
          break;
        default:
          navigate('/user');
      }
    };

    return (
      <UserSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={onLogout}
        userRole={role}
        isOpen={isOpen}
        onToggle={onToggle}
      />
    );
  }

  // Si es Super Admin, usar nuestro sidebar personalizado
  if (role === 'super_admin') {
    // Determinar la vista actual basada en la ruta
    const getCurrentView = () => {
      const path = location.pathname;
      if (path === '/super_admin') return 'dashboard';
      if (path.includes('/usuarios')) return 'dashboard'; // Gestión de usuarios
      if (path.includes('/colaboradores')) return 'dashboard'; // También gestión
      if (path.includes('/cloudinary')) return 'cloudinary'; // Gestión de Cloudinary
      if (path.includes('/configuracion')) return 'config'; // Configuración del sistema
      if (path.includes('/historial')) return 'history';
      if (path.includes('/perfil')) return 'profile';
      return 'dashboard';
    };

    const currentView = getCurrentView();
    const handleViewChange = (view) => {
      // Navegar a las diferentes vistas del Super Admin
      switch(view) {
        case 'dashboard':
          navigate('/super_admin/usuarios'); // Gestión de usuarios como dashboard principal
          break;
        case 'cloudinary':
          navigate('/super_admin/cloudinary'); // Gestión de Cloudinary
          break;
        case 'config':
          navigate('/super_admin/configuracion'); // Configuración del sistema
          break;
        case 'history':
          navigate('/super_admin/historial');
          break;
        case 'profile':
          navigate('/super_admin/perfil');
          break;
        default:
          navigate('/super_admin/usuarios');
      }
    };

    return (
      <SuperAdminSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={onLogout}
        userRole={role}
        isOpen={isOpen}
        onToggle={onToggle}
      />
    );
  }

  // Para otros roles, usar el sidebar original
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      style={{
        background: 'linear-gradient(180deg, #1e3a8a 0%, #312e81 50%, #1e1b4b 100%)'
      }}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-400/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AS</span>
            </div>
            <h1 className="text-xl font-bold text-white">AppScrum</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-white/70 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Indicador de rol mejorado */}
        <div className="px-4 py-3 border-b border-blue-400/20" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))'
        }}>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-300">
            {getRoleTitle(role)}
          </p>
        </div>

        <nav className="mt-4 px-4">
          <div className="space-y-2">
            {navigationItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 text-sm group
                    ${isActive(item.path)
                      ? 'text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                    }
                  `}
                  style={{
                    background: isActive(item.path)
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3))'
                      : 'transparent',
                    boxShadow: isActive(item.path) ? '0 4px 20px rgba(59, 130, 246, 0.3)' : 'none',
                    border: isActive(item.path) ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon className={`h-5 w-5 mr-3 transition-colors ${
                    isActive(item.path) 
                      ? 'text-blue-300' 
                      : 'text-white/60 group-hover:text-white/80'
                  }`} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Información del usuario y logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-400/20">
          <div className="mb-4 px-4 py-3 rounded-xl bg-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Usuario</p>
                <p className="text-xs text-white/60 capitalize">
                  {role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </>
  );
};

// Header del dashboard
const DashboardHeader = ({ onMenuClick, title }) => {
  return (
    <header className="shadow-sm border-b border-white/20 px-6 py-4" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="ml-4 text-2xl font-semibold text-slate-800 lg:ml-0">
            {title}
          </h2>
        </div>
      </div>
    </header>
  );
};

// Mapeo de rutas a títulos
const getPageTitle = (pathname, role) => {
  const pathSegments = (pathname && typeof pathname === 'string') ? pathname.split('/') : [];
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  const titles = {
    // Rutas base de dashboard
    super_admin: 'Dashboard Super Admin',
    product_owner: 'Dashboard Product Owner',
    scrum_master: 'Dashboard Scrum Master',
    developers: 'Dashboard Developers',
    user: 'Dashboard Usuario',
    
    // Páginas específicas
    perfil: 'Mi Perfil',
    usuarios: 'Gestión de Usuarios',
    colaboradores: 'Gestión de Colaboradores',
    admin: 'Panel de Administración',
    configuracion: 'Configuración',
    cloudinary: 'Gestión de Cloudinary',
    'cloudinary-test': 'Test de Cloudinary',
    
    // Product Owner
    productos: 'Gestión de Productos',
    backlog: 'Product Backlog',
    roadmap: 'Roadmap',
    metricas: 'Métricas de Producto',
    
    // Scrum Master
    equipos: 'Gestión de Equipos',
    sprints: 'Gestión de Sprints',
    ceremonias: 'Ceremonias Scrum',
    impedimentos: 'Gestión de Impedimentos',
    
    // Developers
    tareas: 'Mis Tareas',
    'sprint-board': 'Sprint Board',
    'time-tracking': 'Seguimiento de Tiempo',
    codigo: 'Repositorios de Código',
    
    // User
    actividades: 'Mis Actividades'
  };
  
  return titles[lastSegment] || titles[role] || getRoleTitle(role);
};

// Layout principal del dashboard
const RoleBasedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Cambiar a true por defecto
  const { role, isLoaded } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();

  // Función de logout centralizada - accesible para todos los sidebars
  const handleLogout = async () => {
    try {
      if (!signOut) {
        console.error('signOut no está disponible');
        return;
      }
      await signOut();
      navigate('/sign-in');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const pageTitle = getPageTitle(location.pathname, role);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Botón de toggle flotante - Solo para roles que no tengan sidebar personalizado */}
      {!['product_owner', 'scrum_master', 'developers', 'user', 'super_admin'].includes(role) && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-6 left-6 z-50 p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl lg:block"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: 'white',
            transform: sidebarOpen ? 'translateX(252px)' : 'translateX(0)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = sidebarOpen ? 'translateX(252px) scale(1.1)' : 'translateX(0) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = sidebarOpen ? 'translateX(252px) scale(1)' : 'translateX(0) scale(1)';
          }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Layout específico para Product Owner */}
      {role === 'product_owner' ? (
        <div className="product-owner-layout product-owner-theme">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            role={role}
            onLogout={handleLogout}
          />
          <main className={`product-owner-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Outlet />
          </main>
        </div>
      ) : role === 'scrum_master' ? (
        <div className="scrum-master-layout scrum-master-theme">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            role={role}
            onLogout={handleLogout}
          />
          <main className={`scrum-master-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Outlet />
          </main>
        </div>
      ) : role === 'developers' ? (
        <div className="developers-layout developers-theme">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            role={role}
            onLogout={handleLogout}
          />
          <main className={`developers-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Outlet />
          </main>
        </div>
      ) : role === 'user' ? (
        <div className="user-layout user-theme">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            role={role}
            onLogout={handleLogout}
          />
          <main className={`user-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Outlet />
          </main>
        </div>
      ) : role === 'super_admin' ? (
        <div className="super-admin-layout super-admin-theme">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            role={role}
            onLogout={handleLogout}
          />
          <main className={`super-admin-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Outlet />
          </main>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            role={role}
            onLogout={handleLogout}
          />

          {/* Contenido principal */}
          <div className="main-content flex flex-col min-h-screen">
            {/* Header - Solo mostrar para roles que no tengan sidebar personalizado */}
            {!['product_owner', 'scrum_master', 'developers', 'user', 'super_admin'].includes(role) && (
              <DashboardHeader 
                onMenuClick={() => setSidebarOpen(true)}
                title={pageTitle}
              />
            )}

            {/* Área de contenido centrada y mejorada */}
            <main className="flex-1 w-full">
              <div className="content-area">
                <div className="w-full max-w-full">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleBasedLayout;
