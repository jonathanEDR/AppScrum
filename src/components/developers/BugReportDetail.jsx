import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bug,
  User,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Paperclip,
  Download,
  Send,
  Loader,
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { developersApiService } from '../../services/developersApiService';
import { useAuth } from '@clerk/clerk-react';

const BugReportDetail = ({ bugId, onClose, onUpdate, onDelete }) => {
  const { getToken } = useAuth();
  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  // Cargar bug y comentarios
  useEffect(() => {
    loadBugDetail();
    loadComments();
  }, [bugId]);

  const loadBugDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await developersApiService.getBugReportById(bugId, getToken);
      
      if (response.success) {
        setBug(response.data);
        setEditData(response.data);
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
      const response = await developersApiService.getBugComments(bugId, 1, 20, getToken);
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
      const response = await developersApiService.addBugComment(bugId, newComment, null, getToken);
      
      if (response.success) {
        setComments(prev => [...prev, response.data]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Error al agregar comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await developersApiService.updateBugStatus(bugId, newStatus, getToken);
      if (response.success) {
        const updatedBug = { ...bug, status: newStatus };
        setBug(updatedBug);
        onUpdate?.(updatedBug);
      }
    } catch (err) {
      alert('Error al cambiar estado: ' + err.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await developersApiService.updateBugReport(bugId, editData, getToken);
      if (response.success) {
        setBug(response.data);
        setEditMode(false);
        onUpdate?.(response.data);
      }
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este bug report?')) return;

    try {
      const response = await developersApiService.deleteBugReport(bugId, getToken);
      if (response.success) {
        onDelete?.(bugId);
        onClose();
      }
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Configuración de estados y prioridades
  const statusConfig = {
    open: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: AlertCircle, label: 'Abierto' },
    in_progress: { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', icon: Clock, label: 'En Progreso' },
    resolved: { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', icon: CheckCircle, label: 'Resuelto' },
    closed: { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', icon: XCircle, label: 'Cerrado' }
  };

  const priorityConfig = {
    low: { color: 'bg-gray-100 text-gray-700', icon: '🟢', label: 'Baja' },
    medium: { color: 'bg-blue-100 text-blue-700', icon: '🔵', label: 'Media' },
    high: { color: 'bg-orange-100 text-orange-700', icon: '🟡', label: 'Alta' },
    critical: { color: 'bg-red-100 text-red-700', icon: '🔴', label: 'Crítica' }
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
        <div className="bg-white rounded-xl p-8">
          <Loader className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Cargando bug report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
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
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bug className="h-6 w-6 text-red-500" />
                Bug Report #{bugId.slice(-6)}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priority.color}`}>
                  {priority.icon} {priority.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color} text-white`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!editMode ? (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditData(bug);
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            {editMode ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3 className="text-2xl font-bold text-gray-900">{bug.title}</h3>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <User className="h-4 w-4" />
                <span>Reportado por:</span>
              </div>
              <p className="font-medium text-gray-900">
                {bug.reportedBy?.nombre_negocio || `${bug.reportedBy?.firstName || ''} ${bug.reportedBy?.lastName || ''}`.trim() || 'Usuario'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span>Fecha:</span>
              </div>
              <p className="font-medium text-gray-900">{formatDate(bug.createdAt)}</p>
            </div>
          </div>

          {/* Tarea Relacionada */}
          {bug.relatedTasks && bug.relatedTasks.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">🔗 Tarea Relacionada</h4>
                  {bug.relatedTasks.map((task, index) => (
                    <div key={index} className="mb-2">
                      <p className="text-blue-800 font-medium">
                        {task.titulo || task.title || `Tarea #${task._id?.slice(-6)}`}
                      </p>
                      {task.status && (
                        <span className="text-xs text-blue-600">Estado: {task.status}</span>
                      )}
                    </div>
                  ))}
                  <p className="text-sm text-blue-700 mt-2">
                    Este bug está asociado a la tarea específica mostrada arriba
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            {editMode ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {bug.description || 'Sin descripción'}
              </p>
            )}
          </div>

          {/* Pasos para reproducir */}
          {bug.stepsToReproduce && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Pasos para Reproducir</label>
              <p className="text-gray-700 whitespace-pre-wrap bg-blue-50 p-4 rounded-lg border border-blue-200">
                {bug.stepsToReproduce}
              </p>
            </div>
          )}

          {/* Comportamiento esperado/actual */}
          <div className="grid grid-cols-2 gap-4">
            {bug.expectedBehavior && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">✅ Comportamiento Esperado</label>
                <p className="text-gray-700 whitespace-pre-wrap bg-green-50 p-4 rounded-lg border border-green-200">
                  {bug.expectedBehavior}
                </p>
              </div>
            )}
            {bug.actualBehavior && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">❌ Comportamiento Actual</label>
                <p className="text-gray-700 whitespace-pre-wrap bg-red-50 p-4 rounded-lg border border-red-200">
                  {bug.actualBehavior}
                </p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {bug.attachments && bug.attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">📎 Archivos Adjuntos</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {bug.attachments.map((attachment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      {attachment.mimetype?.startsWith('image/') ? (
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate flex-1">
                        {attachment.filename || attachment.originalName}
                      </span>
                    </div>
                    <a
                      href={attachment.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Status */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Cambiar Estado</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={bug.status === key}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    bug.status === key
                      ? `${config.color} text-white cursor-default`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comentarios */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Comentarios ({comments.length})</h3>
            
            {/* Lista de comentarios */}
            <div className="space-y-4 mb-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay comentarios aún. ¡Sé el primero!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {(comment.author?.nombre_negocio?.charAt(0) || comment.author?.firstName?.charAt(0) || 'U')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.author?.nombre_negocio || `${comment.author?.firstName || ''} ${comment.author?.lastName || ''}`.trim() || 'Usuario'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Agregar comentario */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {submittingComment ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugReportDetail;
