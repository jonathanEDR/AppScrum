import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Target, 
  User, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { scrumMasterService } from '../../services/scrumMasterService';

const SprintStoriesPanel = ({ 
  sprint, 
  sprintItems = [], 
  teamMembers = [],
  onStoryRemoved,
  onRefresh 
}) => {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  const [expandedStories, setExpandedStories] = useState({});
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');

  // Configuraciones
  const prioridadConfig = {
    muy_alta: { label: 'Muy Alta', color: 'bg-red-100 text-red-800', order: 1 },
    alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800', order: 2 },
    media: { label: 'Media', color: 'bg-yellow-100 text-yellow-800', order: 3 },
    baja: { label: 'Baja', color: 'bg-green-100 text-green-800', order: 4 }
  };

  const tipoConfig = {
    historia: { label: 'Historia', color: 'bg-blue-100 text-blue-800' },
    tarea: { label: 'Tarea', color: 'bg-green-100 text-green-800' },
    bug: { label: 'Bug', color: 'bg-red-100 text-red-800' },
    mejora: { label: 'Mejora', color: 'bg-purple-100 text-purple-800' }
  };

  const estadoConfig = {
    pendiente: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: Clock },
    en_progreso: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: BarChart3 },
    en_revision: { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    completado: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  };

  const toggleStoryExpanded = (storyId) => {
    setExpandedStories(prev => ({
      ...prev,
      [storyId]: !prev[storyId]
    }));
  };

  const handleRemoveStory = async (story) => {
    if (!confirm(`¿Estás seguro de que quieres desasignar "${story.titulo}" del sprint?`)) {
      return;
    }

    try {
      setRemoving(story._id);
      setError('');
      
      await scrumMasterService.unassignStoryFromSprint(sprint._id, story._id, getToken);

      // Notificar al componente padre
      if (onStoryRemoved) {
        onStoryRemoved(story);
      }
      
      // Refrescar la lista
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error removing story:', error);
      setError('Error al desasignar historia: ' + error.message);
    } finally {
      setRemoving(null);
    }
  };

  const getTeamMemberName = (userId) => {
    const member = teamMembers.find(m => m._id === userId);
    return member ? member.name : 'Usuario Desconocido';
  };

  // Agrupar historias por estado
  const storiesByStatus = sprintItems.reduce((acc, story) => {
    const status = story.estado || 'pendiente';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(story);
    return acc;
  }, {});

  // Calcular métricas
  const totalStoryPoints = sprintItems.reduce((sum, item) => sum + (item.puntos_historia || 0), 0);
  const completedStoryPoints = (storiesByStatus.completado || [])
    .reduce((sum, item) => sum + (item.puntos_historia || 0), 0);
  const progressPercentage = totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0;

  if (!sprint) {
    return (
      <div className={`rounded-lg border p-6 text-center ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <Target className={`h-12 w-12 mx-auto mb-4 ${
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        }`} />
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          Selecciona un sprint para ver sus historias
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con métricas */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Historias del Sprint: {sprint.nombre}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{sprint.objetivo}</p>
            </div>
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Actualizar
            </button>
          )}
        </div>

        {/* Métricas del sprint */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{sprintItems.length}</div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Historias</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalStoryPoints}</div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Story Points</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completedStoryPoints}</div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Completados</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{progressPercentage.toFixed(0)}%</div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Progreso</div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className={`flex justify-between text-sm mb-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>Progreso del Sprint</span>
            <span>{completedStoryPoints}/{totalStoryPoints} SP</span>
          </div>
          <div className={`w-full rounded-full h-3 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-medium">Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Historias agrupadas por estado */}
      {sprintItems.length === 0 ? (
        <div className={`rounded-lg border p-8 text-center ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <Target className={`h-16 w-16 mx-auto mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h4 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
          }`}>Sin historias asignadas</h4>
          <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
            Este sprint no tiene historias asignadas aún.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Usa el botón "Asignar Historia" para añadir historias al sprint.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(estadoConfig).map(([estado, config]) => {
            const stories = storiesByStatus[estado] || [];
            if (stories.length === 0) return null;

            const Icon = config.icon;
            const storyPoints = stories.reduce((sum, story) => sum + (story.puntos_historia || 0), 0);

            return (
              <div key={estado} className={`rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`p-4 border-b ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <h4 className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{config.label}</h4>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {stories.length} historias ({storyPoints} SP)
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
                      {stories.length}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {stories.map(story => (
                    <div key={story._id} className={`border rounded-lg ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div 
                        className={`p-4 cursor-pointer ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleStoryExpanded(story._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{story.titulo}</h5>
                              <span className={`px-2 py-1 rounded text-xs ${prioridadConfig[story.prioridad]?.color || 'bg-gray-100 text-gray-800'}`}>
                                {prioridadConfig[story.prioridad]?.label || story.prioridad}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${tipoConfig[story.tipo]?.color || 'bg-gray-100 text-gray-800'}`}>
                                {tipoConfig[story.tipo]?.label || story.tipo}
                              </span>
                              <span className="text-xs text-gray-500">
                                {story.puntos_historia} SP
                              </span>
                            </div>
                            
                            <p className={`text-sm line-clamp-2 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {story.descripcion}
                            </p>
                            
                            {story.asignado_a && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <User className="h-3 w-3" />
                                <span>{getTeamMemberName(story.asignado_a)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveStory(story);
                              }}
                              disabled={removing === story._id || sprint.estado === 'completado'}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Desasignar del sprint"
                            >
                              {removing === story._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                            
                            {expandedStories[story._id] ? 
                              <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            }
                          </div>
                        </div>
                      </div>

                      {/* Detalles expandidos */}
                      {expandedStories[story._id] && (
                        <div className={`px-4 pb-4 border-t ${
                          theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="pt-4 space-y-3">
                            <div>
                              <h6 className={`text-sm font-medium mb-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>Descripción completa:</h6>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>{story.descripcion}</p>
                            </div>
                            
                            {story.criterios_aceptacion && (
                              <div>
                                <h6 className={`text-sm font-medium mb-1 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Criterios de aceptación:</h6>
                                <p className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>{story.criterios_aceptacion}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Creado: {new Date(story.createdAt).toLocaleDateString()}</span>
                              </div>
                              
                              {story.updatedAt !== story.createdAt && (
                                <div className="flex items-center gap-1">
                                  <Edit className="h-3 w-3" />
                                  <span>Actualizado: {new Date(story.updatedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SprintStoriesPanel;
