import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Bug, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  AlertTriangle,
  Loader,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ExternalLink
} from 'lucide-react';
import { scrumMasterService } from '../../services/scrumMasterService';
import ScrumMasterBugDetail from './ScrumMasterBugDetail';

// Componente para las estadísticas de bugs
const BugStatsCard = ({ title, value, icon: Icon, color = 'primary', trend = null }) => {
  const { theme } = useTheme();
  const colorClasses = {
    primary: 'bg-gradient-to-br from-blue-500 to-blue-600',
    success: 'bg-gradient-to-br from-green-500 to-green-600',
    warning: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    danger: 'bg-gradient-to-br from-red-500 to-red-600',
    info: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`${colorClasses[color]} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {trend && (
              <p className={`text-xs ${trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center mt-1 font-medium`}>
                {trend.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trend.value}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjeta individual de bug
const BugCard = ({ bug, onClick }) => {
  const { theme } = useTheme();
  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'rejected': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'minor': <AlertCircle className="h-4 w-4" />,
      'major': <AlertTriangle className="h-4 w-4" />,
      'critical': <AlertTriangle className="h-4 w-4" />,
      'blocker': <AlertTriangle className="h-4 w-4" />
    };
    return icons[severity] || <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div 
      onClick={() => onClick && onClick(bug)}
      className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      {/* Header con título y badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {bug.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {bug.description}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {getSeverityIcon(bug.severity)}
          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>

      {/* Badges de estado y prioridad */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
          {bug.status.replace('_', ' ').toUpperCase()}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(bug.priority)}`}>
          {bug.priority.toUpperCase()}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {bug.severity.toUpperCase()}
        </span>
        {bug.type && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            {bug.type.toUpperCase()}
          </span>
        )}
      </div>

      {/* Información del reporte */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-200">Reportado por:</p>
          <p className="truncate">
            {bug.reportedBy?.firstName || bug.reportedBy?.nombre_negocio || 'Usuario'} {bug.reportedBy?.lastName || ''}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-200">Asignado a:</p>
          <p className="truncate">
            {bug.assignedTo 
              ? `${bug.assignedTo?.firstName || bug.assignedTo?.nombre_negocio || 'Usuario'} ${bug.assignedTo?.lastName || ''}` 
              : 'Sin asignar'
            }
          </p>
        </div>
      </div>

      {/* Footer con fechas */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Creado: {new Date(bug.createdAt).toLocaleDateString()}
        </span>
        <span>
          Actualizado: {new Date(bug.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Proyecto y Sprint si están disponibles */}
      {(bug.project || bug.sprint) && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {bug.project && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              📁 {bug.project.nombre}
            </span>
          )}
          {bug.sprint && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-300">
              🎯 {bug.sprint.nombre}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Componente principal
const ScrumMasterBugReports = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { theme } = useTheme();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    blockers: 0
  });
  const [pagination, setPagination] = useState({});
  const [selectedBug, setSelectedBug] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    severity: '',
    assignedTo: '',
    reportedBy: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12);

  // Token provider ya no es necesario - getToken se pasa directamente a cada método

  // Cargar datos de bugs
  const loadBugReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        page: currentPage,
        limit,
        ...filters
      };

      // Limpiar parámetros vacíos
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key] || queryParams[key] === 'all') {
          delete queryParams[key];
        }
      });

      const response = await scrumMasterService.getBugReports(queryParams, getToken);

      if (response.success) {
        setBugs(response.data.bugs || []);
        setStats(response.data.stats || {});
        setPagination(response.data.pagination || {});
      } else {
        throw new Error(response.message || 'Error al cargar bug reports');
      }
    } catch (err) {
      console.error('Error loading bug reports:', err);
      setError(err.message || 'Error al cargar los reportes de bugs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, filters]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadBugReports();
  }, [loadBugReports]);

  // Manejar cambios de filtros
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset a la primera página
  }, []);

  // Manejar búsqueda
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    handleFilterChange('search', value);
  }, [handleFilterChange]);

  // Manejar click en bug
  const handleBugClick = useCallback((bug) => {
    setSelectedBug(bug);
  }, []);

  // Stats memoizados
  const bugStatistics = useMemo(() => [
    {
      title: 'Total Bugs',
      value: stats.total || 0,
      icon: Bug,
      color: 'primary'
    },
    {
      title: 'Abiertos',
      value: stats.open || 0,
      icon: AlertCircle,
      color: 'danger'
    },
    {
      title: 'En Progreso',
      value: stats.inProgress || 0,
      icon: Clock,
      color: 'warning'
    },
    {
      title: 'Resueltos',
      value: stats.resolved || 0,
      icon: CheckCircle,
      color: 'success'
    },
    {
      title: 'Críticos',
      value: stats.critical || 0,
      icon: AlertTriangle,
      color: 'danger'
    },
    {
      title: 'Bloqueadores',
      value: stats.blockers || 0,
      icon: AlertTriangle,
      color: 'purple'
    }
  ], [stats]);

  if (loading && bugs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Cargando reportes de bugs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent">
            Bug Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestión y seguimiento de bugs reportados por el equipo
          </p>
        </div>
        <button
          onClick={loadBugReports}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {bugStatistics.map((stat, index) => (
          <BugStatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>

          {/* Filtro por prioridad */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>

          {/* Filtro por severidad */}
          <div>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las severidades</option>
              <option value="minor">Menor</option>
              <option value="major">Mayor</option>
              <option value="critical">Crítica</option>
              <option value="blocker">Bloqueador</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  status: '',
                  priority: '',
                  severity: '',
                  assignedTo: '',
                  reportedBy: '',
                  search: ''
                });
                setCurrentPage(1);
              }}
              className="w-full py-2 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300 font-medium">Error al cargar los datos</p>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
        </div>
      )}

      {/* Lista de bugs */}
      {bugs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {bugs.map((bug) => (
              <BugCard
                key={bug._id}
                bug={bug}
                onClick={handleBugClick}
              />
            ))}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPreviousPage}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : !loading && (
        <div className="text-center py-12">
          <Bug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron bugs
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {Object.values(filters).some(filter => filter) 
              ? 'No hay bugs que coincidan con los filtros seleccionados.'
              : 'Aún no hay bugs reportados en el sistema.'
            }
          </p>
        </div>
      )}

      {/* Modal de Detalle de Bug */}
      {selectedBug && (
        <ScrumMasterBugDetail
          bugId={selectedBug._id}
          onClose={() => setSelectedBug(null)}
          onUpdate={(updatedBug) => {
            // Actualizar el bug en la lista
            setBugs(prevBugs => 
              prevBugs.map(bug => 
                bug._id === updatedBug._id ? updatedBug : bug
              )
            );
            // Recargar estadísticas
            loadBugReports();
          }}
        />
      )}
    </div>
  );
};

export default ScrumMasterBugReports;