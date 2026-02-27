import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { developersApiService } from '../../services/developersApiService';
import { 
  X, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Target,
  Clock,
  Calendar,
  Tag
} from 'lucide-react';

const AssignTaskModal = ({ isOpen, onClose, task, onAssignSuccess }) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setError('');
      setConfirmation(false);
    }
  }, [isOpen, task]);

  // Mutation para asignar tarea del backlog
  const assignBacklogMutation = useMutation({
    mutationFn: (taskId) => developersApiService.assignBacklogTask(taskId, getToken),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['developer-tasks']);
      queryClient.invalidateQueries(['developer-sprint-board']);
      queryClient.invalidateQueries(['developer-dashboard']);
      
      setConfirmation(true);
      setTimeout(() => {
        onAssignSuccess(data);
        onClose();
      }, 1500);
    },
    onError: (err) => {
      console.error('Error al asignar tarea del backlog:', err);
      setError(err.message || 'Error al asignar tarea');
    }
  });

  // Mutation para asignar tarea regular
  const assignRegularMutation = useMutation({
    mutationFn: (taskId) => developersApiService.assignRegularTask(taskId, getToken),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['developer-tasks']);
      queryClient.invalidateQueries(['developer-sprint-board']);
      queryClient.invalidateQueries(['developer-dashboard']);
      
      setConfirmation(true);
      setTimeout(() => {
        onAssignSuccess(data);
        onClose();
      }, 1500);
    },
    onError: (err) => {
      console.error('Error al asignar tarea regular:', err);
      setError(err.message || 'Error al asignar tarea');
    }
  });

  const handleAssignToMe = async () => {
    if (!task) return;

    setError('');

    // Determinar si es tarea del backlog o tarea regular
    // Tareas del backlog tienen el campo 'tipo'
    if (task.tipo && task._id) {
      console.log('Asignando tarea del backlog:', task._id);
      assignBacklogMutation.mutate(task._id);
    } else {
      // Tarea regular del sistema de tasks
      assignRegularMutation.mutate(task._id);
    }
  };

  const loading = assignBacklogMutation.isLoading || assignRegularMutation.isLoading;

  const getTaskIcon = (type) => {
    switch (type) {
      case 'bug':
        return '🐛';
      case 'tarea':
        return '📋';
      case 'mejora':
        return '⚡';
      case 'historia':
        return '📖';
      default:
        return '📋';
    }
  };

  const getTaskColor = (type) => {
    switch (type) {
      case 'bug':
        return 'text-red-600 bg-red-100';
      case 'tarea':
        return 'text-blue-600 bg-blue-100';
      case 'mejora':
        return 'text-green-600 bg-green-100';
      case 'historia':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'muy_alta':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'alta':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'media':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'baja':
        return 'text-green-700 bg-green-100 border-green-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'muy_alta': return 'Muy Alta';
      case 'alta': return 'Alta';
      case 'media': return 'Media';
      case 'baja': return 'Baja';
      default: return 'Sin prioridad';
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getTaskColor(task.tipo || 'tarea')}`}>
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tomar Tarea
              </h3>
              <p className="text-sm text-gray-500">
                ¿Quieres asignarte esta tarea?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Información de la tarea */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {getTaskIcon(task.tipo || 'tarea')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{task.titulo || task.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.prioridad || task.priority)}`}>
                    {getPriorityText(task.prioridad || task.priority)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTaskColor(task.tipo || 'tarea')}`}>
                    {(task.tipo || 'tarea').charAt(0).toUpperCase() + (task.tipo || 'tarea').slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">
                  {task.descripcion || task.description || 'Sin descripción'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Tag className="h-4 w-4" />
                    <span>Proyecto: {task.producto?.nombre || 'Sin proyecto'}</span>
                  </div>
                  
                  {task.puntos_historia && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Target className="h-4 w-4" />
                      <span>Story Points: {task.puntos_historia}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Creado: {new Date(task.createdAt || task.fecha_creacion).toLocaleDateString()}</span>
                  </div>
                  
                  {task.fecha_limite && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Límite: {new Date(task.fecha_limite).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Criterios de aceptación */}
          {task.criterios_aceptacion && task.criterios_aceptacion.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Criterios de Aceptación:</h5>
              <ul className="space-y-1">
                {task.criterios_aceptacion.map((criterio, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{criterio.descripcion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmación */}
          {!confirmation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">
                    ¿Quieres tomar esta tarea?
                  </h5>
                  <p className="text-sm text-blue-700">
                    Al aceptar, esta tarea se asignará a ti y aparecerá en tu lista de "Mis Tareas". 
                    Podrás empezar a trabajar en ella inmediatamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {/* Éxito */}
          {confirmation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">¡Tarea asignada exitosamente!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                La tarea se ha asignado a tu lista de trabajo.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          
          {!confirmation && (
            <button
              onClick={handleAssignToMe}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Tomar Tarea
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal;
