import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  UserCog, 
  LogOut, 
  Activity,
  Menu,
  X
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import LogoDisplay from '../LogoDisplay';

function UserSidebar({ currentView, onViewChange, onLogout, userRole, isOpen, onToggle }) {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'profile', icon: UserCog, label: 'Mi Perfil' },
    { id: 'actividades', icon: Activity, label: 'Mis Actividades' },
  ];

  return (
    <>
      {/* Botón toggle para móvil y desktop */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-[60] p-3 rounded-xl backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-105 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95))',
          boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4), 0 4px 16px rgba(0, 0, 0, 0.1)',
          transform: isOpen ? 'translateX(280px)' : 'translateX(0)'
        }}
      >
        {isOpen ? (
          <X className="text-white drop-shadow-sm" size={20} />
        ) : (
          <Menu className="text-white drop-shadow-sm" size={20} />
        )}
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar principal */}
      <div 
        className={`fixed left-0 top-0 h-screen w-72 z-50 transform transition-transform duration-300 ease-in-out border-r-2 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
          boxShadow: 'var(--sidebar-shadow)'
        }}
      >
        {/* Header del sidebar con tema */}
        <div className="p-8 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600 to-blue-700">
                <Home className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--sidebar-text)' }}>Usuario</h2>
                <p className="text-sm opacity-70" style={{ color: 'var(--sidebar-text)' }}>Panel personal</p>
              </div>
            </div>
            <ThemeToggle size="small" showLabel={false} />
          </div>
        </div>
        
        {/* Navegación moderna */}
        <div className="p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 240px)' }}>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`sidebar-button w-full group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                      : 'hover:bg-blue-100 dark:hover:bg-gray-800'
                  }`}
                  style={{
                    color: isActive ? '#ffffff' : 'var(--sidebar-text)'
                  }}
                >
                  <div 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-blue-100 dark:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} className="sidebar-button-text" />
                  </div>
                  <span className="font-medium text-sm sidebar-button-text">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2" style={{ borderColor: 'var(--sidebar-border)', backgroundColor: 'var(--sidebar-bg)', boxShadow: '0 -2px 6px var(--sidebar-shadow, rgba(0, 0, 0, 0.03))' }}>
          <button
            onClick={onLogout}
            className="sidebar-button w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 bg-red-100 dark:bg-red-950/50 group-hover:bg-red-200 dark:group-hover:bg-red-900/50">
              <LogOut size={16} />
            </div>
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default UserSidebar;
