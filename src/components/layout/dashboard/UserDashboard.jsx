import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useRole } from '../../../context/RoleContext.jsx';
import { userService } from '../../../services/userService';
import ProductCard from '../../../components/users/ProductCard';
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  User,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Eye,
  ChevronRight,
  FolderOpen,
  RefreshCw
} from 'lucide-react';

// Tarjeta de estadística para el Panel de Usuario
const StatCard = ({ title, value, icon: Icon, color = 'blue', trend = null }) => {
  const iconBackgroundColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 flex items-center hover:shadow-xl transition-all duration-300">
      <div className={`${iconBackgroundColors[color]} rounded-lg p-3 mr-4 shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {trend && (
          <p className={`text-xs ${trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center mt-1 font-medium`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
};

// Dashboard específico para User (Panel de Usuario / Cliente)
const UserDashboard = () => {
  const navigate = useNavigate();
  const { userId, getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await userService.getDashboard(userId, getToken);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId, getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando panel de usuario...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">Error al cargar datos</h3>
        <p className="text-red-600 dark:text-red-500">{error}</p>
        <button 
          onClick={fetchDashboardData} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  const { metrics = {}, projects = [] } = dashboardData || {};

  // Separar proyectos activos y completados
  const activeProjects = projects.filter(p => p.estado === 'activo' || p.estado === 'inactivo');
  const completedProjects = projects.filter(p => p.estado === 'completado');

  const stats = [
    {
      title: 'Proyectos Asignados',
      value: metrics.totalProjects || 0,
      icon: Briefcase,
      color: 'blue'
    },
    {
      title: 'Tareas Pendientes',
      value: metrics.pendingTasks || 0,
      icon: Target,
      color: 'yellow'
    },
    {
      title: 'Horas Esta Semana',
      value: metrics.weeklyHours || 0,
      icon: Clock,
      color: 'purple',
      trend: metrics.hoursVariation !== undefined ? { 
        positive: metrics.isIncrease, 
        value: `${metrics.isIncrease ? '+' : ''}${metrics.hoursVariation || 0}h vs semana anterior`
      } : null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header del Panel de Usuario */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenido{dashboardData?.user?.nombre_negocio ? `, ${dashboardData.user.nombre_negocio}` : ''}
            </h1>
            <p className="text-indigo-100 text-lg">
              Visualiza el avance de tus proyectos asignados
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <div className="mt-3 bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm">
            ⚠️ Algunos datos podrían no estar actualizados
          </div>
        )}
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Proyectos Activos - Grid de tarjetas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-indigo-600" />
            Mis Proyectos
            {activeProjects.length > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm px-2.5 py-0.5 rounded-full font-medium">
                {activeProjects.length}
              </span>
            )}
          </h2>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <ProductCard key={project._id} project={project} />
            ))}
            {completedProjects.map((project) => (
              <ProductCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tienes proyectos asignados
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Cuando el administrador te asigne acceso a un proyecto, aparecerá aquí como una tarjeta con su progreso en tiempo real.
            </p>
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Acciones Rápidas</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/user/actividades')}
            className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:shadow-lg"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Mis Actividades
          </button>
          
          <button 
            onClick={() => navigate('/user/perfil')}
            className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:shadow-lg"
          >
            <User className="h-5 w-5 mr-2" />
            Mi Perfil
          </button>

          <button 
            onClick={fetchDashboardData}
            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-lg"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Actualizar Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
