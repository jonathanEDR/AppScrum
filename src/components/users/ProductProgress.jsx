import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { userService } from '../../services/userService';
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Clock, 
  Users,
  Calendar,
  BarChart3,
  Layers,
  Zap,
  AlertCircle,
  RefreshCw,
  Bug,
  Lightbulb,
  FileText,
  ListChecks
} from 'lucide-react';

/**
 * ProductProgress - Vista de progreso de un producto (solo lectura)
 * Para usuarios con rol 'user' (clientes/observadores invitados)
 */
const ProductProgress = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getProductProgress(productId, getToken);
      setProgressData(data);
    } catch (err) {
      console.error('Error fetching product progress:', err);
      setError('No se pudo cargar el progreso del proyecto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProgress();
    }
  }, [productId, getToken]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin definir';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getProgressColor = (value) => {
    if (value >= 75) return 'text-green-600 dark:text-green-400';
    if (value >= 50) return 'text-blue-600 dark:text-blue-400';
    if (value >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = (value) => {
    if (value >= 75) return 'bg-green-500';
    if (value >= 50) return 'bg-blue-500';
    if (value >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const statusConfig = {
    activo: { label: 'Activo', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    inactivo: { label: 'Planificación', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    completado: { label: 'Completado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando progreso del proyecto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => navigate('/user')} 
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al Dashboard
        </button>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-500">{error}</p>
          <button 
            onClick={fetchProgress}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { product, metrics, activeSprint, sprintHistory, backlogSummary } = progressData || {};
  const status = statusConfig[product?.estado] || statusConfig.activo;

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/user')} 
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al Dashboard
        </button>
        <button
          onClick={fetchProgress}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow transition-all"
          title="Actualizar datos"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Encabezado del proyecto */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-xl text-white p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{product?.nombre}</h1>
            <p className="text-indigo-100 text-lg mb-4">{product?.descripcion}</p>
            <div className="flex items-center gap-6 text-indigo-200 text-sm">
              {product?.responsable && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {product.responsable.nombre_negocio || product.responsable.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(product?.fecha_inicio)} — {formatDate(product?.fecha_fin)}
              </span>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Progreso general grande */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600" />
            Progreso General
          </h2>
          <span className={`text-4xl font-bold ${getProgressColor(metrics?.overallProgress || 0)}`}>
            {metrics?.overallProgress || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
          <div 
            className={`${getProgressBarColor(metrics?.overallProgress || 0)} h-5 rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${metrics?.overallProgress || 0}%` }}
          />
        </div>
      </div>

      {/* Métricas en grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={ListChecks} 
          label="Total Tareas" 
          value={metrics?.totalTasks || 0} 
          color="blue" 
        />
        <MetricCard 
          icon={CheckCircle2} 
          label="Completadas" 
          value={metrics?.completedTasks || 0} 
          color="green" 
        />
        <MetricCard 
          icon={Clock} 
          label="En Progreso" 
          value={metrics?.inProgressTasks || 0} 
          color="yellow" 
        />
        <MetricCard 
          icon={AlertCircle} 
          label="Pendientes" 
          value={metrics?.pendingTasks || 0} 
          color="red" 
        />
      </div>

      {/* Sprint activo y Backlog side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Activo */}
        <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Sprint Actual
            </h3>
          </div>
          <div className="p-6">
            {activeSprint ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {activeSprint.nombre}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {activeSprint.objetivo}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(activeSprint.fecha_inicio)}
                  </span>
                  <span>→</span>
                  <span>{formatDate(activeSprint.fecha_fin)}</span>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progreso del Sprint</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{activeSprint.progreso || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`${getProgressBarColor(activeSprint.progreso || 0)} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${activeSprint.progreso || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vel. Planificada</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{activeSprint.velocidad_planificada || 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vel. Real</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{activeSprint.velocidad_real || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No hay sprint activo actualmente</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen del Backlog */}
        <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              Backlog del Producto
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Progreso del backlog */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Items completados</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {metrics?.completedBacklogItems || 0} / {metrics?.totalBacklogItems || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`${getProgressBarColor(metrics?.backlogProgress || 0)} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${metrics?.backlogProgress || 0}%` }}
                />
              </div>
            </div>

            {/* Por tipo */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Por Tipo</h4>
              <div className="grid grid-cols-2 gap-2">
                <TypeBadge icon={FileText} label="Historias" count={backlogSummary?.byType?.historias || 0} color="blue" />
                <TypeBadge icon={ListChecks} label="Tareas" count={backlogSummary?.byType?.tareas || 0} color="gray" />
                <TypeBadge icon={Bug} label="Bugs" count={backlogSummary?.byType?.bugs || 0} color="red" />
                <TypeBadge icon={Lightbulb} label="Mejoras" count={backlogSummary?.byType?.mejoras || 0} color="green" />
              </div>
            </div>

            {/* Por prioridad */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Por Prioridad</h4>
              <div className="space-y-2">
                <PriorityBar label="Muy Alta" count={backlogSummary?.byPriority?.muy_alta || 0} total={metrics?.totalBacklogItems || 1} color="bg-red-500" />
                <PriorityBar label="Alta" count={backlogSummary?.byPriority?.alta || 0} total={metrics?.totalBacklogItems || 1} color="bg-orange-500" />
                <PriorityBar label="Media" count={backlogSummary?.byPriority?.media || 0} total={metrics?.totalBacklogItems || 1} color="bg-yellow-500" />
                <PriorityBar label="Baja" count={backlogSummary?.byPriority?.baja || 0} total={metrics?.totalBacklogItems || 1} color="bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Sprints */}
      {sprintHistory && sprintHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Historial de Sprints
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                Velocidad promedio: {metrics?.avgVelocity || 0} pts
              </span>
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium">Sprint</th>
                    <th className="pb-3 font-medium">Período</th>
                    <th className="pb-3 font-medium text-center">Vel. Plan.</th>
                    <th className="pb-3 font-medium text-center">Vel. Real</th>
                    <th className="pb-3 font-medium text-center">Progreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sprintHistory.map((sprint) => (
                    <tr key={sprint._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{sprint.nombre}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(sprint.fecha_inicio)} — {formatDate(sprint.fecha_fin)}
                      </td>
                      <td className="py-3 text-center text-gray-700 dark:text-gray-300">{sprint.velocidad_planificada || 0}</td>
                      <td className="py-3 text-center font-medium">
                        <span className={sprint.velocidad_real >= sprint.velocidad_planificada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {sprint.velocidad_real || 0}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${sprint.progreso || 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{sprint.progreso || 100}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Métricas del proyecto resumen */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Resumen del Proyecto
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryItem label="Total Sprints" value={metrics?.totalSprints || 0} />
          <SummaryItem label="Sprints Completados" value={metrics?.completedSprints || 0} />
          <SummaryItem label="Vel. Promedio" value={`${metrics?.avgVelocity || 0} pts`} />
          <SummaryItem label="Backlog Progress" value={`${metrics?.backlogProgress || 0}%`} />
        </div>
      </div>
    </div>
  );
};

// --- Sub-componentes ---

const MetricCard = ({ icon: Icon, label, value, color }) => {
  const bgColors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20'
  };
  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400'
  };

  return (
    <div className={`${bgColors[color]} rounded-xl p-4 text-center`}>
      <Icon className={`h-6 w-6 mx-auto mb-2 ${iconColors[color]}`} />
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
};

const TypeBadge = ({ icon: Icon, label, count, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    gray: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  };

  return (
    <div className={`${colors[color]} rounded-lg p-2.5 flex items-center gap-2`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
      <span className="ml-auto font-bold">{count}</span>
    </div>
  );
};

const PriorityBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-16">{label}</span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
    </div>
  );
};

const SummaryItem = ({ label, value }) => (
  <div className="text-center">
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
  </div>
);

export default ProductProgress;
