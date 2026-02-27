import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { developersApiService } from '../services/developersApiService';

/**
 * Hook para manejar time tracking y timer con React Query
 * 
 * Mejoras implementadas:
 * - Caché automático de stats y entries
 * - Timer optimizado (calculado on-demand en lugar de interval de 1s)
 * - Polling inteligente del timer activo (solo cuando hay timer corriendo)
 * - Invalidación automática de queries relacionadas
 */
export const useTimeTracking = (initialPeriod = 'week') => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(initialPeriod);


  // Query para obtener estadísticas de time tracking
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['developer-time-stats', period],
    queryFn: async () => {
      const response = await developersApiService.getTimeTrackingStats(period, getToken);
      if (!response.success) {
        throw new Error('Error al cargar estadísticas');
      }
      return response.data;
    },
    staleTime: 120000, // 2 minutos - Stats cambian con menos frecuencia
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Query para obtener entradas de tiempo
  const {
    data: entries,
    isLoading: entriesLoading,
    refetch: refetchEntries
  } = useQuery({
    queryKey: ['developer-time-entries'],
    queryFn: async () => {
      const response = await developersApiService.getTimeEntries({}, getToken);
      if (!response.success) {
        throw new Error('Error al cargar entradas de tiempo');
      }
      return response.data || [];
    },
    staleTime: 60000, // 1 minuto
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener timer activo con polling inteligente
  const {
    data: activeTimer,
    isLoading: timerLoading,
    refetch: refetchTimer
  } = useQuery({
    queryKey: ['developer-active-timer'],
    queryFn: async () => {
      const response = await developersApiService.getActiveTimer(getToken);
      if (!response.success) {
        return null;
      }
      return response.data;
    },
    staleTime: 5000, // 5 segundos - Timer necesita actualizarse más seguido pero no cada 1s
    cacheTime: 30000, // 30 segundos
    // Refetch automático cada 10 segundos SOLO si hay timer activo
    refetchInterval: (data) => {
      return data ? 10000 : false; // 10s cuando hay timer, desactivado cuando no hay
    },
    refetchIntervalInBackground: true, // Continuar polling en background
  });

  // ⚡ OPTIMIZACIÓN: Calcular tiempo del timer on-demand en lugar de interval de 1s
  const timerSeconds = useMemo(() => {
    if (!activeTimer?.startTime) return 0;
    const start = new Date(activeTimer.startTime);
    const now = new Date();
    return Math.floor((now - start) / 1000);
  }, [activeTimer, statsLoading]); // Re-calcular cuando cambia activeTimer o cada render

  // Formato del tiempo del timer
  const formattedTimerTime = useMemo(() => {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const secs = timerSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timerSeconds]);

  // Mutation para iniciar timer
  const startTimerMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await developersApiService.startTimer(taskId, getToken);
      if (!response.success) {
        throw new Error('Error al iniciar timer');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['developer-active-timer']);
      queryClient.invalidateQueries(['developer-time-stats']);
      queryClient.invalidateQueries(['developer-tasks']);
    },
    onError: (err) => {
      console.error('Error al iniciar timer:', err);
    }
  });

  // Mutation para detener timer
  const stopTimerMutation = useMutation({
    mutationFn: async (description = '') => {
      const response = await developersApiService.stopTimer(description, getToken);
      if (!response.success) {
        throw new Error('Error al detener timer');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['developer-active-timer']);
      queryClient.invalidateQueries(['developer-time-stats']);
      queryClient.invalidateQueries(['developer-time-entries']);
      queryClient.invalidateQueries(['developer-tasks']);
    },
    onError: (err) => {
      console.error('Error al detener timer:', err);
    }
  });

  // Mutation para crear entrada manual
  const createEntryMutation = useMutation({
    mutationFn: async (timeData) => {
      const response = await developersApiService.createTimeEntry(timeData, getToken);
      if (!response.success) {
        throw new Error('Error al crear entrada de tiempo');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['developer-time-stats']);
      queryClient.invalidateQueries(['developer-time-entries']);
      queryClient.invalidateQueries(['developer-tasks']);
    }
  });

  // Mutation para actualizar entrada
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, updateData }) => {
      const response = await developersApiService.updateTimeEntry(entryId, updateData, getToken);
      if (!response.success) {
        throw new Error('Error al actualizar entrada de tiempo');
      }
      return response.data;
    },
    // Optimistic update
    onMutate: async ({ entryId, updateData }) => {
      await queryClient.cancelQueries(['developer-time-entries']);
      const previousEntries = queryClient.getQueryData(['developer-time-entries']);
      
      queryClient.setQueryData(['developer-time-entries'], (old) => {
        if (!old) return old;
        return old.map(entry =>
          entry._id === entryId ? { ...entry, ...updateData } : entry
        );
      });
      
      return { previousEntries };
    },
    onError: (err, variables, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(['developer-time-entries'], context.previousEntries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['developer-time-stats']);
      queryClient.invalidateQueries(['developer-time-entries']);
    }
  });

  // Mutation para eliminar entrada
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId) => {
      const response = await developersApiService.deleteTimeEntry(entryId, getToken);
      if (!response.success) {
        throw new Error('Error al eliminar entrada de tiempo');
      }
      return response.data;
    },
    // Optimistic update
    onMutate: async (entryId) => {
      await queryClient.cancelQueries(['developer-time-entries']);
      const previousEntries = queryClient.getQueryData(['developer-time-entries']);
      
      queryClient.setQueryData(['developer-time-entries'], (old) => {
        if (!old) return old;
        return old.filter(entry => entry._id !== entryId);
      });
      
      return { previousEntries };
    },
    onError: (err, variables, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(['developer-time-entries'], context.previousEntries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['developer-time-stats']);
      queryClient.invalidateQueries(['developer-time-entries']);
    }
  });

  // Funciones wrapper para mantener API consistente
  const startTimer = useCallback(async (taskId) => {
    return startTimerMutation.mutateAsync(taskId);
  }, [startTimerMutation]);

  const stopTimer = useCallback(async (description = '') => {
    return stopTimerMutation.mutateAsync(description);
  }, [stopTimerMutation]);

  const createTimeEntry = useCallback(async (timeData) => {
    return createEntryMutation.mutateAsync(timeData);
  }, [createEntryMutation]);

  const updateTimeEntry = useCallback(async (entryId, updateData) => {
    return updateEntryMutation.mutateAsync({ entryId, updateData });
  }, [updateEntryMutation]);

  const deleteTimeEntry = useCallback(async (entryId) => {
    return deleteEntryMutation.mutateAsync(entryId);
  }, [deleteEntryMutation]);

  // Función para cambiar período
  const changePeriod = useCallback((newPeriod) => {
    setPeriod(newPeriod);
    loadStats(newPeriod);
  }, []);

  // Función para refrescar todos los datos manualmente
  const refresh = useCallback(async () => {
    await Promise.all([
      refetchStats(),
      refetchEntries(),
      refetchTimer()
    ]);
  }, [refetchStats, refetchEntries, refetchTimer]);

  // Función helper para formatear tiempo (mantenida por compatibilidad)
  const formatTimerTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // Estados
    stats: stats || null,
    entries: entries || [],
    activeTimer: activeTimer || null,
    loading: statsLoading || entriesLoading || timerLoading,
    error: statsError?.message || null,
    period,
    timerSeconds,
    
    // Funciones
    startTimer,
    stopTimer,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    changePeriod,
    refresh,
    formatTimerTime,
    setError: () => {}, // Mantenido por compatibilidad
    
    // Estados computados
    isTimerRunning: !!activeTimer,
    formattedTimerTime,
    
    // Extras de React Query
    isStartingTimer: startTimerMutation.isLoading,
    isStoppingTimer: stopTimerMutation.isLoading,
    isCreatingEntry: createEntryMutation.isLoading,
    isUpdatingEntry: updateEntryMutation.isLoading,
    isDeletingEntry: deleteEntryMutation.isLoading
  };
};
