import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { developersApiService } from '../services/developersApiService';

/**
 * Hook para manejar las tareas del developer con React Query
 * 
 * Beneficios de React Query:
 * - Caché automático (30s staleTime)
 * - Stale-while-revalidate (muestra datos cacheados mientras actualiza)
 * - Invalidación automática de caché
 * - Menos código y mejor performance
 */
export const useDeveloperTasks = (initialFilters = {}) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);

  // Query para obtener tareas con React Query
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['developer-tasks', filters],
    queryFn: async () => {
      const response = await developersApiService.getTasks(filters, getToken);
      if (!response.success) {
        throw new Error('Error al cargar tareas');
      }
      return response.data;
    },
    staleTime: 30000, // 30s - Coincide con backend cache
    cacheTime: 5 * 60 * 1000, // 5 minutos
    // keepPreviousData: Mantener datos anteriores mientras carga nuevos
    keepPreviousData: true,
    // onError: Manejar errores
    onError: (err) => {
      console.error('Error al cargar tareas:', err);
    }
  });

  // Mutation para actualizar estado de tarea
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }) => {
      const response = await developersApiService.updateTaskStatus(taskId, newStatus, getToken);
      if (!response.success) {
        throw new Error('Error al actualizar tarea');
      }
      return response.data;
    },
    // Optimistic update: Actualizar UI antes de la respuesta del servidor
    onMutate: async ({ taskId, newStatus }) => {
      // Cancelar queries en progreso para evitar sobrescribir el optimistic update
      await queryClient.cancelQueries(['developer-tasks']);

      // Snapshot del estado anterior (para rollback si falla)
      const previousTasks = queryClient.getQueryData(['developer-tasks', filters]);

      // Optimistic update
      queryClient.setQueryData(['developer-tasks', filters], (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map(task =>
            task._id === taskId
              ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
              : task
          )
        };
      });

      // Retornar contexto para rollback
      return { previousTasks };
    },
    // Si falla, hacer rollback
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['developer-tasks', filters], context.previousTasks);
      }
      console.error('Error al actualizar tarea:', err);
    },
    // Después de éxito o error, invalidar caché para refrescar datos
    onSettled: () => {
      queryClient.invalidateQueries(['developer-tasks']);
      // También invalidar sprint board y dashboard que dependen de tareas
      queryClient.invalidateQueries(['developer-sprint-board']);
      queryClient.invalidateQueries(['developer-dashboard']);
    }
  });

  // Función para aplicar filtros
  const applyFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters, page: 1 }));
  }, []);

  // Función para cambiar página
  const changePage = useCallback((page) => {
    setFilters(prevFilters => ({ ...prevFilters, page }));
  }, []);

  // Función para actualizar estado de tarea (wrapper)
  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    return updateTaskMutation.mutateAsync({ taskId, newStatus });
  }, [updateTaskMutation]);

  // Función para refrescar datos manualmente
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Datos
    tasks: data?.tasks || [],
    pagination: data?.pagination || { current: 1, pages: 1, total: 0 },
    filters,
    
    // Estados
    loading: isLoading,
    isFetching, // Útil para mostrar spinner mientras refresca en background
    error: error?.message || null,
    
    // Acciones
    updateTaskStatus,
    applyFilters,
    changePage,
    refresh,
    setError: () => {}, // Mantenido por compatibilidad
    
    // Extras de React Query
    isUpdating: updateTaskMutation.isLoading,
    updateError: updateTaskMutation.error
  };
};
