import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Calendar, 
  Users, 
  TrendingUp, 
  Eye, 
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

/**
 * ProductCard - Tarjeta de producto para el dashboard del usuario/cliente
 * Muestra información del proyecto con progreso visual y acceso al detalle
 */
const ProductCard = ({ project, onClick }) => {
  const navigate = useNavigate();

  const statusConfig = {
    activo: { 
      label: 'Activo', 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: TrendingUp,
      borderColor: 'border-l-green-500'
    },
    inactivo: { 
      label: 'Planificación', 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: Clock,
      borderColor: 'border-l-yellow-500'
    },
    completado: { 
      label: 'Completado', 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: CheckCircle2,
      borderColor: 'border-l-blue-500'
    }
  };

  const status = statusConfig[project.estado] || statusConfig.activo;
  const StatusIcon = status.icon;

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const progress = project.progress || 0;
  const progressColor = getProgressColor(progress);

  const handleClick = () => {
    if (onClick) {
      onClick(project);
    } else {
      navigate(`/user/proyectos/${project._id}`);
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 border-l-4 ${status.borderColor} hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1`}
      onClick={handleClick}
    >
      {/* Header de la tarjeta */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {project.nombre}
            </h3>
            {project.descripcion && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {project.descripcion}
              </p>
            )}
          </div>
          <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Progreso</span>
            <span className="text-gray-900 dark:text-gray-100 font-bold text-lg">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`${progressColor} h-3 rounded-full transition-all duration-500 ease-out`} 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info adicional */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            {project.responsable && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {project.responsable.nombre_negocio || project.responsable.email || 'Equipo'}
              </span>
            )}
            {project.fecha_fin && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(project.fecha_fin)}
              </span>
            )}
          </div>
          <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver avance
            <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
