import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  UserCog, 
  LogOut, 
  Shield, 
  History,
  Menu,
  X,
  Settings,
  Cloud,
  GraduationCap,
  Bot,
  UserPlus
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import LogoDisplay from '../LogoDisplay';

function SuperAdminSidebar({ onLogout, isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Gestión de Usuarios', path: '/super_admin/usuarios' },
    { id: 'cvs', icon: GraduationCap, label: 'Gestión de CVs', path: '/super_admin/cvs' },
    { id: 'cloudinary', icon: Cloud, label: 'Gestión de Cloudinary', path: '/super_admin/cloudinary' },
    { id: 'ai-agents', icon: Bot, label: 'Agentes AI', path: '/super_admin/ai-agents', badge: 'Nuevo' },
    { id: 'scrum-ai', icon: Bot, label: 'SCRUM AI', path: '/super_admin/scrum-ai', badge: 'Beta' },
    { id: 'config', icon: Settings, label: 'Configuración', path: '/super_admin/configuracion' },
    { id: 'guest-access', icon: UserPlus, label: 'Acceso Invitados', path: '/super_admin/acceso-invitados' },
    { id: 'history', icon: History, label: 'Historial', path: '/super_admin/historial' },
    { id: 'profile', icon: UserCog, label: 'Mi Perfil', path: '/super_admin/perfil' },
  ];
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Botón toggle para móvil y desktop */}
      <button
        onClick={onToggle}
        className={`fixed top-4 left-4 z-[60] p-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 border-white/30 dark:border-gray-700 ${
          isOpen ? 'translate-x-64' : 'translate-x-0'
        }`}
      >
        {isOpen ? (
          <X className="text-white drop-shadow-sm" size={18} />
        ) : (
          <Menu className="text-white drop-shadow-sm" size={18} />
        )}
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar principal con colores definidos: blanco puro (claro) y negro eclipse (oscuro) */}
      <div 
        className={`fixed left-0 top-0 h-screen w-64 z-50 transform transition-all duration-300 ease-in-out shadow-2xl border-r-2 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg, #ffffff)',
          borderColor: 'var(--sidebar-border, #e5e7eb)',
          boxShadow: '4px 0 16px var(--sidebar-shadow, rgba(0, 0, 0, 0.06))'
        }}
      >
        {/* Header premium con colores adaptados */}
        <div className="p-3 border-b-2" style={{ borderColor: 'var(--sidebar-border)', boxShadow: '0 2px 6px var(--sidebar-shadow, rgba(0, 0, 0, 0.03))' }}>
          <div className="flex items-center gap-2">
            <LogoDisplay 
              size="small" 
              showText={false}
              iconClassName="bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold truncate" style={{ color: 'var(--sidebar-text)' }}>Super Admin</h2>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text-muted)' }}>Control del sistema</p>
            </div>
            {/* Theme Toggle al lado del título */}
            <div className="flex-shrink-0">
              <ThemeToggle size="small" showLabel={false} />
            </div>
          </div>
          <div className="mt-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 text-white shadow-lg">
              Admin
            </span>
          </div>
        </div>
        
        {/* Navegación moderna */}
        <div className="p-2 overflow-y-auto" style={{ height: 'calc(100vh - 150px)' }}>
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`sidebar-button w-full group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 ${
                    active 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 shadow-md sidebar-button-text-active border border-purple-400 dark:border-purple-300' 
                      : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 sidebar-button-text border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{
                    transform: active ? 'scale(1)' : 'scale(1)'
                  }}
                >
                  <div 
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      active 
                        ? 'bg-white/20' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <Icon size={14} className={active ? 'sidebar-button-text-active' : 'sidebar-button-text'} />
                  </div>
                  <span className="text-xs font-medium flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Footer premium */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t-2" style={{ borderColor: 'var(--sidebar-border)', backgroundColor: 'var(--sidebar-bg)', boxShadow: '0 -2px 6px var(--sidebar-shadow, rgba(0, 0, 0, 0.03))' }}>
          <button
            onClick={onLogout}
            className="sidebar-button w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 group text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-transparent hover:border-red-300 dark:hover:border-red-700"
          >
            <div 
              className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 bg-red-100 dark:bg-red-950/50 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 flex-shrink-0"
            >
              <LogOut size={14} />
            </div>
            <span className="text-xs font-medium truncate">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default SuperAdminSidebar;
