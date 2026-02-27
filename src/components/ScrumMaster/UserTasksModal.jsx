import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { scrumMasterService } from '../../services/scrumMasterService';
import {
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Flag,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';

const UserTasksModal = ({ isOpen, onClose, user, teamMemberId }) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserTasks = async () => {
    if (!user || !isOpen) return;

    try {
      setLoading(true);
      setError('');
      
      const token = await getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Usar el ID del TeamMember si está disponible, sino el ID del usuario
      const userId = teamMemberId || user._id;
      const result = await scrumMasterService.getUserTasks(userId, getToken);

      // Adaptar respuesta: getUserTasks retorna { tasks, total, completed, inProgress, pending }
      const tasksData = result.tasks || result.data || [];
      const statsData = result.stats || {
        total: result.total || tasksData.length,
        completed: result.completed || 0,
        inProgress: result.inProgress || 0,
        pending: result.pending || 0
      };
      
      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      setError('Error al cargar las tareas del usuario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTasks();
  }, [user, teamMemberId, isOpen]);

  if (!isOpen) return null;

  const getStatusColor = (status) => {
    const colors = {
      'pending': theme === 'dark' ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-800',
      'in_progress': theme === 'dark' ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-100 text-blue-800',
      'done': theme === 'dark' ? 'bg-green-800/50 text-green-300' : 'bg-green-100 text-green-800',
      'blocked': theme === 'dark' ? 'bg-red-800/50 text-red-300' : 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'baja': theme === 'dark' ? 'text-green-400' : 'text-green-600',
      'media': theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
      'alta': theme === 'dark' ? 'text-orange-400' : 'text-orange-600',
      'muy_alta': theme === 'dark' ? 'text-red-400' : 'text-red-600'
    };
    return colors[priority] || colors.media;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': Clock,
      'in_progress': Zap,
      'done': CheckCircle,
      'blocked': AlertCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Tareas de {user?.firstName} {user?.lastName}
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`rounded-md p-2 hover:bg-gray-100 transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Total</span>
                </div>
                <p className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{stats.total}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Completadas</span>
                </div>
                <p className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{stats.completed}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>En Progreso</span>
                </div>
                <p className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{stats.inProgress}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Progreso</span>
                </div>
                <p className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{completionPercentage}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className={`w-full rounded-full h-3 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <p className={`text-sm mt-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {stats.completed} de {stats.total} tareas completadas ({completionPercentage}%)
              </p>
            </div>
          </div>

          {/* Tasks List */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Target className="w-12 h-12 mx-auto mb-4" />
                <p>No hay tareas asignadas a este usuario</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50' 
                        : 'bg-white border-gray-200 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(task.status)}
                          <h4 className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {task.titulo || task.title}
                          </h4>
                        </div>
                        
                        {task.descripcion && (
                          <p className={`text-sm mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {task.descripcion}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                            {task.status === 'in_progress' ? 'En Progreso' : 
                             task.status === 'done' ? 'Completada' :
                             task.status === 'blocked' ? 'Bloqueada' : 'Pendiente'}
                          </span>
                          
                          {task.prioridad && (
                            <span className={`flex items-center gap-1 ${getPriorityColor(task.prioridad)}`}>
                              <Flag className="w-3 h-3" />
                              {task.prioridad.charAt(0).toUpperCase() + task.prioridad.slice(1).replace('_', ' ')}
                            </span>
                          )}
                          
                          {task.puntos_historia && (
                            <span className={`flex items-center gap-1 ${
                              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              <Target className="w-3 h-3" />
                              {task.puntos_historia} pts
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {task.fecha_limite && (
                        <div className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(task.fecha_limite).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTasksModal;