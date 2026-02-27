import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  ArrowLeft,
  Bug,
  User,
  Calendar,
  Edit,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Loader,
  X,
  MessageSquare,
  Users,
  Tag,
  Settings,
  FileText
} from 'lucide-react';
import { scrumMasterService } from '../../services/scrumMasterService';
import { useAuth, useUser } from '@clerk/clerk-react';

const ScrumMasterBugDetail = ({ bugId, onClose, onUpdate }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { theme } = useTheme();
  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Token provider ya no es necesario - getToken se pasa directamente

  // Cargar bug y comentarios
  useEffect(() => {
    loadBugDetail();
    loadComments();
  }, [bugId]);

  const loadBugDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scrumMasterService.getBugReportById(bugId, getToken);
      
      if (response.success) {
        setBug(response.data);
      } else {
        setError('No se pudo cargar el bug report');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar bug report');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await scrumMasterService.getBugComments(bugId, getToken);
      if (response.success) {
        setComments(response.data || []);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await scrumMasterService.addBugComment(bugId, newComment, getToken);
      
      if (response.success) {
        setComments(prev => [...prev, response.data]);
        setNewComment('');
      } else {
        throw new Error('Error al agregar comentario');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Error al agregar comentario: ' + (err.message || 'Error desconocido'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await scrumMasterService.updateBugReport(
        bugId,
        { status: newStatus },
        getToken
      );

      if (response.success || response.data) {
        setBug(response.data || response);
        onUpdate?.(response.data || response);
      } else {
        throw new Error('Error al cambiar estado');
      }
    } catch (err) {
      alert('Error al cambiar estado: ' + err.message);
    }
  };

  // Configuración de estados y prioridades
  const statusConfig = {
    open: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: AlertCircle, label: 'Abierto' },
    in_progress: { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', icon: Clock, label: 'En Progreso' },
    resolved: { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', icon: CheckCircle, label: 'Resuelto' },
    closed: { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', icon: XCircle, label: 'Cerrado' },
    rejected: { color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50', icon: X, label: 'Rechazado' }
  };

  const priorityConfig = {
    low: { color: 'bg-gray-100 text-gray-700', icon: '🟢', label: 'Baja' },
    medium: { color: 'bg-blue-100 text-blue-700', icon: '🔵', label: 'Media' },
    high: { color: 'bg-orange-100 text-orange-700', icon: '🟡', label: 'Alta' },
    critical: { color: 'bg-red-100 text-red-700', icon: '🔴', label: 'Crítica' }
  };

  const severityConfig = {
    minor: { color: 'bg-green-100 text-green-700', label: 'Menor' },
    major: { color: 'bg-yellow-100 text-yellow-700', label: 'Mayor' },
    critical: { color: 'bg-red-100 text-red-700', label: 'Crítica' },
    blocker: { color: 'bg-purple-100 text-purple-700', label: 'Bloqueador' }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-950 rounded-xl p-8">
          <Loader className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando bug report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-950 rounded-xl p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!bug) return null;

  const status = statusConfig[bug.status] || statusConfig.open;
  const priority = priorityConfig[bug.priority] || priorityConfig.medium;
  const severity = severityConfig[bug.severity] || severityConfig.major;
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Bug className="h-6 w-6 text-red-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Bug Report #{bug._id?.slice(-6)}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color} text-white`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {status.label}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenido Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Título */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {bug.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {bug.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priority.color}`}>
                  {priority.icon} {priority.label}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${severity.color}`}>
                  {severity.label}
                </span>
                {bug.type && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {bug.type.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Tarea Relacionada */}
              {bug.relatedTasks && bug.relatedTasks.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">🔗 Tarea Relacionada</h4>
                      {bug.relatedTasks.map((task, index) => (
                        <div key={index} className="mb-2">
                          <p className="text-blue-800 dark:text-blue-300 font-medium">
                            {task.titulo || task.title || `Tarea #${task._id?.slice(-6)}`}
                          </p>
                          {task.status && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">Estado: {task.status}</span>
                          )}
                        </div>
                      ))}
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
                        Este bug está asociado a la tarea específica mostrada arriba
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pasos para Reproducir */}
              {bug.stepsToReproduce && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pasos para Reproducir:</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {bug.stepsToReproduce}
                  </p>
                </div>
              )}

              {/* Comportamiento Esperado vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bug.expectedBehavior && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">Comportamiento Esperado:</h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      {bug.expectedBehavior}
                    </p>
                  </div>
                )}
                {bug.actualBehavior && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">Comportamiento Actual:</h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {bug.actualBehavior}
                    </p>
                  </div>
                )}
              </div>

              {/* Comentarios */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Comentarios ({comments.length})
                  </h3>
                </div>

                {/* Lista de Comentarios */}
                <div className="space-y-3 mb-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {comment.author?.nombre_negocio || comment.author?.firstName || comment.author?.name || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                        {comment.text || comment.content}
                      </p>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No hay comentarios aún. ¡Sé el primero en comentar!
                    </p>
                  )}
                </div>

                {/* Agregar Comentario */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Agregar un comentario como Scrum Master..."
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="3"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Comentario como Scrum Master • {user?.firstName || 'Usuario'}
                        </span>
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || submittingComment}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {submittingComment ? (
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          {submittingComment ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar con información */}
            <div className="space-y-6">
              {/* Información del Bug */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Información del Bug</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                    <select
                      value={bug.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-right bg-transparent border-none text-gray-900 dark:text-gray-100 font-medium focus:ring-0 cursor-pointer"
                    >
                      <option value="open">Abierto</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="resolved">Resuelto</option>
                      <option value="closed">Cerrado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Prioridad:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{priority.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Severidad:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{severity.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {bug.type?.toUpperCase() || 'BUG'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personas */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Personas
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block">Reportado por:</span>
                    <div className="flex items-center mt-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-2">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {bug.reportedBy?.firstName || bug.reportedBy?.nombre_negocio || 'Usuario'} {bug.reportedBy?.lastName || ''}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block">Asignado a:</span>
                    <div className="flex items-center mt-1">
                      {bug.assignedTo ? (
                        <>
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-2">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {bug.assignedTo?.firstName || bug.assignedTo?.nombre_negocio || 'Usuario'} {bug.assignedTo?.lastName || ''}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Sin asignar</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Fechas
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Creado:</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(bug.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Actualizado:</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(bug.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Proyecto y Sprint */}
              {(bug.project || bug.sprint) && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Contexto
                  </h3>
                  <div className="space-y-2 text-sm">
                    {bug.project && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Proyecto:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{bug.project.nombre}</span>
                      </div>
                    )}
                    {bug.sprint && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Sprint:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{bug.sprint.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrumMasterBugDetail;