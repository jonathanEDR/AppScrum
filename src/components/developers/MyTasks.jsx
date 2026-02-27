import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  Zap, 
  Play, 
  Pause, 
  MoreHorizontal,
  Filter,
  Search,
  AlertCircle,
  Calendar,
  UserMinus
} from 'lucide-react';
import { useDeveloperTasks } from '../../hooks/useDeveloperTasks';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { developersApiService } from '../../services/developersApiService';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';

const MyTasks = () => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);
  const [unassigning, setUnassigning] = useState(false);

  // Hooks para datos
  const {
    tasks,
    loading,
    error,
    pagination,
    updateTaskStatus,
    applyFilters,
    changePage,
    refresh,
    setError: setTaskError
  } = useDeveloperTasks();

  const {
    startTimer,
    stopTimer,
    activeTimer,
    isTimerRunning,
    formattedTimerTime,
    entries,
    setError: setTimerError
  } = useTimeTracking();

  // Manejar cambio de filtro de estado
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    applyFilters({
      status: newFilter === 'all' ? undefined : newFilter,
      priority: selectedPriority || undefined,
      search: searchTerm || undefined
    });
  }, [applyFilters, selectedPriority, searchTerm]);

  // Manejar cambio de prioridad
  const handlePriorityChange = useCallback((newPriority) => {
    setSelectedPriority(newPriority);
    applyFilters({
      status: filter === 'all' ? undefined : filter,
      priority: newPriority || undefined,
      search: searchTerm || undefined
    });
  }, [applyFilters, filter, searchTerm]);

  // Manejar búsqueda
  const handleSearch = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    applyFilters({
      status: filter === 'all' ? undefined : filter,
      priority: selectedPriority || undefined,
      search: newSearchTerm || undefined
    });
  }, [applyFilters, filter, selectedPriority]);

  // Manejar actualización de estado de tarea
  const handleStatusUpdate = useCallback(async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
  }, [updateTaskStatus]);

  // Manejar inicio/parada de timer
  const handleTimerToggle = useCallback(async (taskId) => {
    try {
      if (isTimerRunning && activeTimer?.task?._id === taskId) {
        // Detener timer actual
        await stopTimer('Trabajo en progreso');
      } else if (isTimerRunning) {
        // Cambiar a otra tarea
        await stopTimer('Cambio de tarea');
        await startTimer(taskId);
      } else {
        // Iniciar timer
        await startTimer(taskId);
      }
    } catch (error) {
      console.error('Error con el timer:', error);
      setTimerError(error.message);
    }
  }, [isTimerRunning, activeTimer, startTimer, stopTimer, setTimerError]);

  // Manejar menú desplegable
  const menuRef = useRef(null);
  
  const toggleMenu = useCallback((taskId) => {
    setOpenMenuTaskId(openMenuTaskId === taskId ? null : taskId);
  }, [openMenuTaskId]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuTaskId(null);
      }
    };

    if (openMenuTaskId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuTaskId]);

  // Des-asignar tarea
  const handleUnassignTask = useCallback(async (taskId) => {
    if (!confirm('¿Estás seguro de que deseas des-asignar esta tarea? La tarea volverá a estar disponible en Proyectos.')) {
      return;
    }

    setUnassigning(true);
    setOpenMenuTaskId(null);

    try {
      await developersApiService.unassignTask(taskId, getToken);
      
      // Recargar lista de tareas
      await refresh();
      
      console.log('✅ Tarea des-asignada exitosamente');
    } catch (error) {
      console.error('Error al des-asignar tarea:', error);
      setTaskError(error.message || 'Error al des-asignar la tarea');
    } finally {
      setUnassigning(false);
    }
  }, [getToken, refresh, setTaskError]);

  // Obtener información de estado
  const getStatusInfo = (status) => {
    const statusConfig = {
      todo: { label: 'Por Hacer', color: 'bg-gray-100 text-gray-800', icon: Clock },
      in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Zap },
      code_review: { label: 'Code Review', color: 'bg-purple-100 text-purple-800', icon: Target },
      testing: { label: 'Testing', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      done: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    return statusConfig[status] || statusConfig.todo;
  };

  // Obtener tiempo acumulado por tarea
  const getTaskTime = useCallback((taskId) => {
    const taskSessions = entries.filter(entry => entry.task && entry.task._id === taskId);
    // duration viene en segundos desde el backend
    const totalSeconds = taskSessions.reduce((total, session) => total + (session.duration || 0), 0);
    
    const today = new Date().toDateString();
    const todaySeconds = taskSessions
      .filter(session => new Date(session.date).toDateString() === today)
      .reduce((total, session) => total + (session.duration || 0), 0);
    
    return { 
      totalMinutes: totalSeconds / 60, 
      todayMinutes: todaySeconds / 60 
    };
  }, [entries]);

  // Formatear tiempo en minutos a formato legible con segundos
  const formatTime = useCallback((minutes) => {
    if (!minutes) return '0s';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    if (hours > 0) {
      if (mins > 0) return `${hours}h ${mins}m`;
      return `${hours}h`;
    }
    if (mins > 0) {
      if (secs > 0) return `${mins}m ${secs}s`;
      return `${mins}m`;
    }
    return `${secs}s`;
  }, []);

  // Obtener color de prioridad
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'border-green-500 bg-green-50/50',
      medium: 'border-yellow-500 bg-yellow-50/50',
      high: 'border-orange-500 bg-orange-50/50',
      critical: 'border-red-500 bg-red-50/50'
    };
    return colors[priority] || colors.medium;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Componente de loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Tareas</h1>
              <p className="text-gray-600">Gestiona tus tareas asignadas</p>
            </div>
          </div>
        </div>

        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl h-24`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-lg`}>
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mis Tareas</h1>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} asignada{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Timer activo */}
      {isTimerRunning && activeTimer && (
        <div className={`${theme === 'dark' ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>Timer activo</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                  {activeTimer.task?.titulo || activeTimer.task?.title || 'Tarea en progreso'}
                </p>
              </div>
            </div>
            <div className={`text-xl font-mono font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
              {formattedTimerTime}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
        <div className="flex flex-wrap gap-4">
          {/* Filtro de estado */}
          <div className="flex items-center gap-2">
            <Filter className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Todos los estados</option>
              <option value="todo">Por Hacer</option>
              <option value="in_progress">En Progreso</option>
              <option value="code_review">Code Review</option>
              <option value="testing">Testing</option>
              <option value="done">Completado</option>
            </select>
          </div>

          {/* Filtro de prioridad */}
          <select
            value={selectedPriority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Todas las prioridades</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>

          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar tareas..."
              className={`pl-10 pr-4 py-2 border rounded-lg w-full text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} border rounded-xl p-4`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className={theme === 'dark' ? 'text-red-300' : 'text-red-700'}>{error}</p>
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No hay tareas</h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {filter === 'all' 
                ? 'No tienes tareas asignadas en este momento'
                : `No hay tareas con el filtro "${filter}"`}
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const statusInfo = getStatusInfo(task.status);
            const StatusIcon = statusInfo.icon;
            const isActiveTimer = activeTimer?.task?._id === task._id;
            const { totalMinutes, todayMinutes } = getTaskTime(task._id);
            
            return (
              <div 
                key={task._id} 
                className={`border-l-4 ${getPriorityColor(task.priority)} p-6 rounded-r-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} hover:shadow-md transition-all duration-300 group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Timer Button */}
                        <button
                          onClick={() => handleTimerToggle(task._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isActiveTimer 
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={isActiveTimer ? 'Detener timer' : 'Iniciar timer'}
                        >
                          {isActiveTimer ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        
                        {/* More options menu */}
                        <div className="relative" ref={openMenuTaskId === task._id ? menuRef : null}>
                          <button 
                            onClick={() => toggleMenu(task._id)}
                            disabled={unassigning}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Más opciones"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          
                          {/* Dropdown Menu - Solo opción de des-asignar */}
                          {openMenuTaskId === task._id && (
                            <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 py-1 ${
                              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                              <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Opciones de tarea</p>
                              </div>
                              
                              <button
                                onClick={() => handleUnassignTask(task._id)}
                                disabled={unassigning}
                                className="w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <UserMinus className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Des-asignar tarea</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Devolverla al backlog de proyectos
                                  </div>
                                </div>
                              </button>
                              
                              <div className={`px-4 py-2 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Esta tarea será removida de "Mis Tareas" y estará disponible nuevamente en "Proyectos"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {task.description && (
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3 text-sm`}>{task.description}</p>
                    )}

                    <div className="flex items-center flex-wrap gap-3 mb-4">
                      {/* Estado */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center shadow-sm`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </span>

                      {/* Story Points */}
                      {task.storyPoints && (
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                          {task.storyPoints} SP
                        </span>
                      )}

                      {/* Sprint */}
                      {task.sprint && (
                        <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {task.sprint.name || task.sprint.nombre}
                        </span>
                      )}

                      {/* Tiempo trabajado */}
                      {(totalMinutes > 0 || isActiveTimer) && (
                        <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(totalMinutes)}
                          {isActiveTimer && ` + ${formattedTimerTime}`}
                        </span>
                      )}
                      
                      {/* Tiempo hoy */}
                      {todayMinutes > 0 && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          Hoy: {formatTime(todayMinutes)}
                        </span>
                      )}
                    </div>

                    {/* Fechas */}
                    <div className={`flex items-center gap-4 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {task.createdAt && (
                        <span>Creada: {formatDate(task.createdAt)}</span>
                      )}
                      {task.dueDate && (
                        <span>Vence: {formatDate(task.dueDate)}</span>
                      )}
                    </div>

                    {/* Acciones de estado */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cambiar estado:</span>
                      <div className="flex gap-1">
                        {['todo', 'in_progress', 'code_review', 'testing', 'done'].map((status) => {
                          if (status === task.status) return null;
                          const statusInfo = getStatusInfo(status);
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(task._id, status)}
                              className={`px-2 py-1 text-xs rounded ${statusInfo.color} hover:opacity-80 transition-opacity`}
                              title={`Cambiar a ${statusInfo.label}`}
                            >
                              {statusInfo.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => changePage(pagination.current - 1)}
            disabled={pagination.current === 1}
            className={`px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark' 
                ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            Anterior
          </button>
          
          <span className={`px-3 py-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Página {pagination.current} de {pagination.pages}
          </span>
          
          <button
            onClick={() => changePage(pagination.current + 1)}
            disabled={pagination.current === pagination.pages}
            className={`px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark' 
                ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
