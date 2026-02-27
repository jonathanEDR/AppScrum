import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { developersApiService } from '../services/developersApiService';

/**
 * Normaliza el estado para el backend
 * Convierte de cualquier formato a los valores válidos del Task model
 */
const normalizeStatusForBackend = (status) => {
  // Mapeo de posibles variaciones a estados válidos del Task model
  const statusMap = {
    // Formato Task (ya correcto)
    'todo': 'todo',
    'in_progress': 'in_progress',
    'code_review': 'code_review',
    'testing': 'testing',
    'done': 'done',
    
    // Formato BacklogItem (necesita conversión)
    'pendiente': 'todo',
    'en_progreso': 'in_progress',
    'revision': 'code_review',
    'pruebas': 'testing',
    'completado': 'done',
    
    // Posibles variaciones en español
    'por_hacer': 'todo',
    'en_proceso': 'in_progress',
    'revisión': 'code_review',
    'completada': 'done'
  };
  
  const normalized = statusMap[status] || status;
  return normalized;
};

/**
 * Hook para manejar el sprint board del developer con React Query
 * 
 * Mejoras con React Query:
 * - Caché automático del sprint board (60s staleTime)
 * - Optimistic updates mantenidos
 * - Invalidación automática de queries relacionadas
 * - Sincronización entre diferentes vistas
 */
export const useSprintBoard = (initialSprintId = null, initialFilterMode = 'all') => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSprintId, setSelectedSprintId] = useState(initialSprintId);
  const [filterMode, setFilterMode] = useState(initialFilterMode); // 'all' o 'sprint'

  // Query para obtener datos del sprint board
  const {
    data: sprintData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['developer-sprint-board', selectedSprintId, filterMode],
    queryFn: async () => {
      const response = await developersApiService.getSprintBoardData(selectedSprintId, filterMode, getToken);
      if (!response.success) {
        throw new Error('Error al cargar datos del sprint board');
      }
      
      // 🔥 DEDUPLICACIÓN: Asegurar que no hay tareas duplicadas por _id
      const data = response.data;
      if (data.tasks && Array.isArray(data.tasks)) {
        const uniqueTasks = Array.from(
          new Map(data.tasks.map(task => [task._id, task])).values()
        );
        
        if (uniqueTasks.length !== data.tasks.length) {
          console.warn('⚠️ [DEDUP] Se encontraron tareas duplicadas:', {
            original: data.tasks.length,
            unique: uniqueTasks.length,
            duplicates: data.tasks.length - uniqueTasks.length
          });
        }
        
        data.tasks = uniqueTasks;
        data.allTasks = uniqueTasks;
      }
      
      return data;
    },
    staleTime: 60000, // 60s - Sprint board cambia con menos frecuencia
    cacheTime: 5 * 60 * 1000, // 5 minutos
    keepPreviousData: true,
    refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana
    refetchOnMount: false, // No refetch al montar si hay datos en cache
    refetchOnReconnect: false, // No refetch al reconectar
    onError: (err) => {
      console.error('❌ Error al cargar Sprint Board:', err);
    }
  });

  // Mutation para actualizar estado de tarea con optimistic update
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }) => {
      console.log('🎯 [DRAG & DROP] Iniciando actualización:', { taskId, newStatus });
      
      const normalizedStatus = normalizeStatusForBackend(newStatus);
      console.log('📤 [DRAG & DROP] Enviando al backend:', { taskId, normalizedStatus });
      
      const response = await developersApiService.updateTaskStatus(taskId, normalizedStatus, getToken);
      console.log('📥 [DRAG & DROP] Respuesta del backend:', response);
      
      if (!response.success) {
        throw new Error('Error al actualizar tarea');
      }
      return response.data;
    },
    // Optimistic update
    onMutate: async ({ taskId, newStatus }) => {
      console.log('⚡ [OPTIMISTIC] Actualizando UI inmediatamente:', { taskId, newStatus });
      
      // Cancelar queries en progreso para evitar race conditions
      await queryClient.cancelQueries({ 
        queryKey: ['developer-sprint-board', selectedSprintId, filterMode] 
      });

      // Snapshot del estado anterior
      const previousData = queryClient.getQueryData(['developer-sprint-board', selectedSprintId, filterMode]);

      // Optimistic update
      queryClient.setQueryData(['developer-sprint-board', selectedSprintId, filterMode], (old) => {
        if (!old) return old;

        console.log('📝 [OPTIMISTIC] Datos antes de actualizar:', {
          totalTasks: old.tasks?.length,
          taskToUpdate: old.tasks?.find(t => t._id === taskId)
        });

        // 🔥 IMPORTANTE: Asegurar que no hay duplicados al actualizar
        const updatedTasks = old.tasks.map(task =>
          task._id === taskId
            ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
            : task
        );

        const updatedAllTasks = old.allTasks.map(task =>
          task._id === taskId
            ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
            : task
        );

        console.log('✏️ [OPTIMISTIC] Datos después de actualizar:', {
          totalTasks: updatedTasks?.length,
          updatedTask: updatedTasks?.find(t => t._id === taskId)
        });

        // Recalcular métricas
        const newMetrics = calculateSprintMetrics(updatedAllTasks);

        return {
          ...old,
          tasks: updatedTasks,
          allTasks: updatedAllTasks,
          metrics: newMetrics,
          sprint: {
            ...old.sprint,
            progress: newMetrics.sprintProgress
          }
        };
      });

      return { previousData };
    },
    // Actualizar con la respuesta del servidor
    onSuccess: async (serverData, variables) => {
      console.log('✅ [SUCCESS] Actualización exitosa:', { variables, serverData });
      
      // 🔥 ESTRATEGIA: Invalidar y esperar refetch para evitar duplicados
      await queryClient.invalidateQueries({
        queryKey: ['developer-sprint-board', selectedSprintId, filterMode],
        refetchType: 'active' // Solo refetch de queries activas
      });
      
      console.log('🔄 [CACHE INVALIDATED] Caché invalidado - refetch completado');
      
      // Invalidar otras queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['developer-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['developer-dashboard'] });
      
      // Verificar que no hay duplicados después del refetch
      setTimeout(() => {
        const laterCache = queryClient.getQueryData(['developer-sprint-board', selectedSprintId, filterMode]);
        const laterTask = laterCache?.tasks?.find(t => t._id === variables.taskId);
        const duplicates = laterCache?.tasks?.filter(t => t._id === variables.taskId).length;
        
        console.log('⏰ [CACHE CHECK] Verificación final:', {
          taskId: variables.taskId,
          status: laterTask?.status,
          expectedStatus: variables.newStatus,
          totalTasks: laterCache?.tasks?.length,
          duplicates: duplicates > 1 ? `⚠️ ${duplicates} duplicados!` : '✅ Sin duplicados'
        });
      }, 100);
    },
    // Rollback si falla
    onError: (err, variables, context) => {
      console.error('❌ [ERROR] Falló la actualización:', { variables, error: err.message });
      
      if (context?.previousData) {
        console.log('🔄 [ROLLBACK] Revirtiendo cambios...');
        queryClient.setQueryData(
          ['developer-sprint-board', selectedSprintId, filterMode],
          context.previousData
        );
      }
    }
  });

  // Función para calcular métricas del sprint
  const calculateSprintMetrics = (tasks) => {
    const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedPoints = tasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const sprintProgress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return {
      totalPoints,
      completedPoints,
      sprintProgress,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      codeReviewTasks: tasks.filter(t => t.status === 'code_review').length,
      testingTasks: tasks.filter(t => t.status === 'testing').length,
      doneTasks: tasks.filter(t => t.status === 'done').length
    };
  };

  // Función para cambiar sprint y filtro
  const changeSprintFilter = useCallback((sprintId, mode) => {
    console.log('🔄 Cambiando filtro de sprint:', { sprintId, mode });
    setSelectedSprintId(sprintId);
    setFilterMode(mode);
  }, []);

  // Función para actualizar estado de tarea (wrapper)
  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    return updateTaskMutation.mutateAsync({ taskId, newStatus });
  }, [updateTaskMutation]);

  // Función para obtener tareas por estado
  const getTasksByStatus = useCallback((status) => {
    if (!sprintData || !sprintData.tasks) {
      return [];
    }
    return sprintData.tasks.filter(task => task.status === status);
  }, [sprintData]);

  // Función para obtener el progreso de una tarea específica
  const getTaskProgress = useCallback((task) => {
    if (!task.estimatedHours) return 0;
    const spentHours = task.spentHours || 0;
    return Math.min((spentHours / task.estimatedHours) * 100, 100);
  }, []);

  // Función para obtener color de prioridad
  const getPriorityColor = useCallback((priority) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[priority] || colors.medium;
  }, []);

  // Función para obtener color de estado
  const getStatusColor = useCallback((status) => {
    const colors = {
      todo: 'text-gray-600 bg-gray-100',
      in_progress: 'text-blue-600 bg-blue-100',
      code_review: 'text-purple-600 bg-purple-100',
      testing: 'text-yellow-600 bg-yellow-100',
      done: 'text-green-600 bg-green-100'
    };
    return colors[status] || colors.todo;
  }, []);

  // Estados computados con useMemo para evitar recálculos
  const isActive = useMemo(() => {
    if (!sprintData?.sprint) return false;
    const now = new Date();
    const startDate = new Date(sprintData.sprint.startDate);
    const endDate = new Date(sprintData.sprint.endDate);
    return now >= startDate && now <= endDate;
  }, [sprintData]);

  const daysRemaining = useMemo(() => {
    if (!sprintData?.sprint) return 0;
    const now = new Date();
    const endDate = new Date(sprintData.sprint.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  }, [sprintData]);

  // Función para refrescar datos manualmente
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Estados
    sprintData,
    loading: isLoading,
    error: error?.message || null,
    selectedSprintId,
    filterMode,
    updatingTask: updateTaskMutation.isLoading,
    isFetching, // Para mostrar spinner en background refresh
    
    // Funciones
    updateTaskStatus,
    changeSprintFilter,
    refresh,
    setError: () => {}, // Mantenido por compatibilidad
    
    // Funciones computadas
    getTasksByStatus,
    getTaskProgress,
    getPriorityColor,
    getStatusColor,
    isSprintActive: () => isActive,
    getDaysRemaining: () => daysRemaining,
    
    // Estados computados
    sprint: sprintData?.sprint || null,
    tasks: sprintData?.tasks || [],
    metrics: sprintData?.metrics || {},
    isActive,
    daysRemaining,
    
    // Extras de React Query
    isUpdating: updateTaskMutation.isLoading,
    updateError: updateTaskMutation.error
  };
};
