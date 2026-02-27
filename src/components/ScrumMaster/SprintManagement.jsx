import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { scrumMasterService } from '../../services/scrumMasterService';
import { useScrumMasterData } from '../../hooks/useScrumMasterData';
import SprintTechnicalItems from './SprintTechnicalItems';
import { useTheme } from '../../context/ThemeContext';
import { 
  Target, 
  Calendar, 
  BarChart3,
  Clock,
  Pause,
  Square,
  RefreshCw,
  Code,
  Eye,
  Edit,
  User,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Componente para navegación por pestañas
const SprintTabNavigation = ({ activeTab, onTabChange, sprintData, theme }) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Sprints',
      icon: BarChart3,
      description: 'Gestionar sprints y items técnicos',
      badge: null
    },
    {
      id: 'planning',
      label: 'Sprint Planning',
      icon: Target,
      description: 'Asignar historias al sprint',
      badge: sprintData?.backlogItems?.length || null
    },
    {
      id: 'backlog',
      label: 'Items Técnicos',
      icon: Code,
      description: 'Gestionar tareas y bugs',
      badge: sprintData?.technicalItems?.length || null
    }
  ];

  return (
    <div className={`rounded-lg border shadow-sm mb-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent
                  className={`mr-2 h-5 w-5 ${
                    isActive ? 'text-orange-500' : theme === 'dark' ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span className="mr-2">{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                    isActive 
                      ? 'bg-orange-100 text-orange-800' 
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Descripción de la pestaña activa */}
      <div className={`px-6 py-3 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>
    </div>
  );
};

// Componente para seleccionar sprints
const SprintSelector = ({ sprints, activeSprint, onSelectSprint, loading, theme }) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const SPRINTS_PER_PAGE = 6;
  
  const totalPages = Math.ceil(sprints.length / SPRINTS_PER_PAGE);
  const startIndex = currentPage * SPRINTS_PER_PAGE;
  const endIndex = startIndex + SPRINTS_PER_PAGE;
  const visibleSprints = sprints.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className={`rounded-lg border p-6 mb-6 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Sprints Disponibles</h3>
          <p className={`text-sm mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Mostrando {startIndex + 1}-{Math.min(endIndex, sprints.length)} de {sprints.length} sprints
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>
      
      {sprints.length === 0 ? (
        <div className={`text-center py-12 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        }`}>
          <Target className={`h-16 w-16 mx-auto mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h4 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
          }`}>No hay sprints disponibles</h4>
          <p className="text-sm">Los sprints se crean desde el módulo Product Owner</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSprints.map(sprint => {
              const isActive = activeSprint?._id === sprint._id;
              const statusColor = 
                (sprint.estado || sprint.status) === 'activo' || (sprint.estado || sprint.status) === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : (sprint.estado || sprint.status) === 'completado' || (sprint.estado || sprint.status) === 'completed'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-100 text-blue-800';
              
              return (
                <button
                  key={sprint._id}
                  onClick={() => onSelectSprint(sprint)}
                  disabled={loading}
                  className={`group relative p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : theme === 'dark'
                        ? 'border-gray-700 bg-gray-700 hover:border-orange-500 hover:shadow-sm'
                        : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Badge de selección */}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1.5">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}

                  {/* Producto */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {(sprint.producto?.nombre || sprint.product?.name || 'P')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 truncate">
                        {sprint.producto?.nombre || sprint.product?.name || 'Sin producto'}
                      </p>
                    </div>
                  </div>

                  {/* Nombre del sprint */}
                  <h4 className={`font-semibold mb-2 line-clamp-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {sprint.nombre || sprint.name}
                  </h4>

                  {/* Meta del sprint */}
                  {(sprint.meta || sprint.goal) && (
                    <p className={`text-xs mb-3 line-clamp-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {sprint.meta || sprint.goal}
                    </p>
                  )}

                  {/* Estado y fechas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {(sprint.estado || sprint.status) === 'activo' || (sprint.estado || sprint.status) === 'active' 
                          ? 'Activo' 
                          : (sprint.estado || sprint.status) === 'completado' || (sprint.estado || sprint.status) === 'completed'
                          ? 'Completado'
                          : 'Planificado'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {Math.ceil(
                            (new Date(sprint.fecha_fin || sprint.endDate) - new Date(sprint.fecha_inicio || sprint.startDate)) 
                            / (1000 * 60 * 60 * 24)
                          )} días
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(sprint.fecha_inicio || sprint.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        {' - '}
                        {new Date(sprint.fecha_fin || sprint.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Indicador hover */}
                  {!isActive && (
                    <div className="absolute inset-0 border-2 border-orange-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between mt-6 pt-6 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i
                        ? 'bg-orange-500 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Componente para mostrar historias del sprint
const SprintBacklogDetails = ({ sprintData, onToggleStory, showDetails, onToggleDetails, theme }) => {
  if (!sprintData?.backlogItems) {
    return null;
  }

  const getStatusColor = (status) => {
    const colors = {
      'pendiente': 'bg-gray-100 text-gray-800',
      'en_progreso': 'bg-blue-100 text-blue-800',
      'completado': 'bg-green-100 text-green-800',
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completado': 'Completado',
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completado'
    };
    return texts[status] || status;
  };

  return (
    <div className={`rounded-lg border ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={onToggleDetails}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Historias del Sprint ({sprintData.backlogItems?.length || 0})
          </h3>
          <Eye className={`h-5 w-5 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {showDetails && (
        <div className="p-4">
          {sprintData.backlogItems?.length === 0 ? (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              <Target className={`h-12 w-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <h4 className={`text-lg font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
              }`}>No hay historias asignadas</h4>
              <p className="text-sm">Este sprint no tiene historias del backlog asignadas aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sprintData.backlogItems.map((story, index) => (
                <div
                  key={story._id || index}
                  className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {story.titulo || story.title || `Historia ${index + 1}`}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.estado || story.status)}`}>
                          {getStatusText(story.estado || story.status)}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {story.puntos_historia || story.storyPoints || 1} SP
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {story.descripcion || story.description || 'Sin descripción disponible'}
                      </p>
                      
                      <div className={`flex items-center gap-4 text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {story.asignado_a?.nombre_negocio || 
                             story.assignedTo?.name || 
                             story.asignado_a?.email ||
                             'Sin asignar'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{story.prioridad || story.priority || 'Media'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onToggleStory(story)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onToggleStory(story)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Editar historia"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SprintManagement = () => {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  // ✅ OPTIMIZADO: Usar hook centralizado con caché
  const { 
    sprints,
    activeSprint: activeSprintData,
    backlogItems,
    technicalItems,
    teamMembers,
    metrics,
    loading: isLoading,
    error: hookError,
    refresh,
    setActiveSprint: setActiveSprintHook
  } = useScrumMasterData();
  
  // Estados locales solo para UI
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'planning', 'backlog'
  
  // ✅ OPTIMIZADO: Mantener compatibilidad con componentes hijos
  const activeSprint = activeSprintData;
  
  // ✅ OPTIMIZADO: Construir sprintData desde datos del hook para compatibilidad con componentes hijos
  const sprintData = activeSprintData ? {
    ...activeSprintData,
    // Añadir propiedades calculadas desde metrics
    completed: metrics?.completedStoryPoints || 0,
    planned: metrics?.plannedStoryPoints || 0,
    inProgress: metrics?.inProgressCount || 0,
    totalStoryPoints: metrics?.totalStoryPoints || 0,
    velocity: metrics?.velocity || 0,
    previousVelocity: metrics?.previousVelocity,
    capacity: metrics?.teamCapacity || 0,
    // Datos relacionados
    backlogItems: backlogItems || [],
    technicalItems: technicalItems || [],
    teamMembers: teamMembers || [],
    // Datos del sprint
    status: activeSprintData.estado || activeSprintData.status || 'planning',
    startDate: activeSprintData.fecha_inicio || activeSprintData.startDate,
    endDate: activeSprintData.fecha_fin || activeSprintData.endDate,
    burndownData: metrics?.burndownData || []
  } : null;

  const handleNavigateToSprint = () => {
    navigate('/scrum_master/sprint-planning');
  };

  const handleNavigateToBacklog = () => {
    navigate('/scrum_master/backlog-tecnico');
  };

  // Nueva función para manejar cambio de pestañas
  const handleTabChange = (tabId) => {
    if (tabId === 'planning') {
      navigate('/scrum_master/sprint-planning');
    } else if (tabId === 'backlog') {
      navigate('/scrum_master/backlog-tecnico');
    } else {
      setActiveTab(tabId);
    }
  };

  // ✅ ELIMINADAS: fetchSprints y fetchSprintDetails ya no son necesarias
  // Los datos vienen directamente del hook useScrumMasterData
  
  // ✅ ELIMINADAS: fetchTechnicalItemsForSprint y fetchTeamMembersWithSprintData
  // Estos datos ya vienen incluidos en el hook

  const handleSprintAction = async (action) => {
    if (!activeSprintData) return;
    
    try {
      const actionMap = {
        'start': 'iniciar',
        'pause': 'pausar', 
        'end': 'finalizar'
      };
      
      const actionData = action === 'end' ? { velocidad_real: metrics?.completedStoryPoints || 0 } : {};
      
      await scrumMasterService.executeSprintAction(
        activeSprintData._id, 
        actionMap[action], 
        actionData,
        getToken
      );

      // ✅ OPTIMIZADO: Refrescar usando el hook en lugar de fetchSprints
      await refresh();
    } catch (error) {
      console.error('Error in sprint action:', error);
      setError(`Error al ${action} sprint: ${error.message}`);
    }
  };

  const handleSelectSprint = async (sprint) => {
    // ✅ OPTIMIZADO: Usar setActiveSprintHook del hook
    setActiveSprintHook(sprint);
  };

  // ✅ OPTIMIZADO: handleRefreshTechnicalItems ya no es necesario,
  // pero lo mantenemos para no romper el componente SprintTechnicalItems
  const handleRefreshTechnicalItems = async () => {
    await refresh();
  };

  const handleToggleStory = (story) => {
    console.log('Ver/Editar historia:', story);
    // Aquí puedes implementar la lógica para abrir un modal de edición
    // o navegar a una página de detalles de la historia
  };

  // Calcular progreso y estado del sprint inline
  const totalPlanned = metrics?.plannedStoryPoints || 0;
  const totalCompleted = metrics?.completedStoryPoints || 0;
  const progress = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;

  const today = new Date();
  const endDate = activeSprintData ? new Date(activeSprintData.fecha_fin || activeSprintData.endDate) : new Date();
  const startDate = activeSprintData ? new Date(activeSprintData.fecha_inicio || activeSprintData.startDate) : new Date();
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const sprintStatus = {
    totalDays,
    daysElapsed: Math.max(0, daysElapsed),
    daysRemaining,
    isOverdue: today > endDate
  };

  // Mostrar loading
  if (isLoading && !activeSprintData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de error/información */}
      {error && (
        <div className={`border rounded-lg p-4 ${
          theme === 'dark'
            ? 'bg-blue-900/30 border-blue-800'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
              }`}>Información</h3>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
              }`}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Si no hay sprint seleccionado, mostrar solo selector */}
      {!sprintData && (
        <div className="space-y-6">
          <div className={`rounded-lg border p-6 text-center ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <Target className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Selecciona un Sprint
            </h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Elige un sprint de la lista para ver sus detalles e items técnicos
            </p>
          </div>

          {/* Selector de Sprints */}
          <SprintSelector 
            sprints={sprints}
            activeSprint={activeSprint}
            onSelectSprint={handleSelectSprint}
            loading={isLoading}
            theme={theme}
          />
        </div>
      )}

      {/* Contenido principal solo si hay datos del sprint */}
      {sprintData && (
        <>
          {/* Header del Sprint mejorado */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{sprintData.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sprintData.status === 'active' ? 'bg-green-500' :
                    sprintData.status === 'completed' ? 'bg-gray-500' :
                    'bg-blue-500'
                  }`}>
                    {sprintData.status === 'active' ? 'Activo' :
                     sprintData.status === 'completed' ? 'Completado' :
                     'Planificado'}
                  </span>
                </div>
                <p className="text-orange-100 mb-4">{sprintData.goal}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(sprintData.startDate).toLocaleDateString()} - {new Date(sprintData.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{sprintStatus.daysRemaining} días restantes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{sprintData.totalStoryPoints || 0} Story Points</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-4xl font-bold mb-1">{progress.toFixed(0)}%</div>
                  <div className="text-orange-100">Progreso</div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleNavigateToSprint}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'planning' 
                        ? 'bg-white bg-opacity-30' 
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                    }`}
                  >
                    <Target className="h-4 w-4" />
                    Sprint Planning
                  </button>
                  
                  {sprintData.status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSprintAction('pause')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 transition-colors"
                      >
                        <Pause className="h-4 w-4" />
                        Pausar
                      </button>
                      <button
                        onClick={() => handleSprintAction('end')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 transition-colors"
                      >
                        <Square className="h-4 w-4" />
                        Finalizar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <SprintTabNavigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            sprintData={sprintData}
            theme={theme}
          />

          {/* Contenido según la pestaña activa */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Selector de Sprints */}
              <SprintSelector 
                sprints={sprints}
                activeSprint={activeSprint}
                onSelectSprint={handleSelectSprint}
                loading={isLoading}
                theme={theme}
              />

              {/* Items Técnicos del Sprint */}
              <SprintTechnicalItems 
                sprintData={sprintData}
                onRefresh={handleRefreshTechnicalItems}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SprintManagement;
