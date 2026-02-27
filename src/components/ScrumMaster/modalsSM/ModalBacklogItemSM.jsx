import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../../context/ThemeContext';
import { scrumMasterService } from '../../../services/scrumMasterService';
import { 
  X, 
  Plus, 
  Minus,
  Package,
  User,
  Calendar,
  Target,
  Tag,
  CheckCircle,
  Bug,
  Wrench,
  Zap
} from 'lucide-react';

const ModalBacklogItemSM = ({ 
  isOpen, 
  onClose, 
  editingItem, 
  productos, 
  usuarios, 
  sprints, 
  onSuccess,
  currentSprint = null // Nuevo prop para pre-seleccionar sprint actual
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'tarea',
    prioridad: 'media',
    producto: '',
    puntos_historia: '',
    asignado_a: '',
    sprint: '',
    criterios_aceptacion: [{ descripcion: '', completado: false }],
    etiquetas: []
  });

  // Configuraciones de colores y opciones para Scrum Master
  const tipoOptions = [
    { value: 'tarea', label: 'Tarea Técnica', color: 'text-green-600', icon: Wrench },
    { value: 'bug', label: 'Bug', color: 'text-red-600', icon: Bug },
    { value: 'mejora', label: 'Mejora', color: 'text-purple-600', icon: Zap }
  ];

  const prioridadOptions = [
    { value: 'muy_alta', label: 'Muy Alta', color: 'text-red-600' },
    { value: 'alta', label: 'Alta', color: 'text-orange-600' },
    { value: 'media', label: 'Media', color: 'text-yellow-600' },
    { value: 'baja', label: 'Baja', color: 'text-green-600' }
  ];

  // Efecto para cargar datos cuando se edita un item
  useEffect(() => {
    if (editingItem) {
      setFormData({
        titulo: editingItem.titulo || '',
        descripcion: editingItem.descripcion || '',
        tipo: editingItem.tipo || 'tarea',
        prioridad: editingItem.prioridad || 'media',
        producto: editingItem.producto?._id || '',
        puntos_historia: editingItem.puntos_historia?.toString() || '',
        asignado_a: editingItem.asignado_a?._id || '',
        sprint: editingItem.sprint?._id || '',
        criterios_aceptacion: editingItem.criterios_aceptacion?.length > 0 
          ? editingItem.criterios_aceptacion 
          : [{ descripcion: '', completado: false }],
        etiquetas: editingItem.etiquetas || []
      });
    } else {
      resetForm();
    }
  }, [editingItem]);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'tarea',
      prioridad: 'media',
      producto: '',
      puntos_historia: '',
      asignado_a: '',
      sprint: currentSprint?._id || '', // Pre-seleccionar sprint actual si existe
      criterios_aceptacion: [{ descripcion: '', completado: false }],
      etiquetas: []
    });
    setError('');
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.titulo.trim()) {
      setError('El título es requerido');
      return;
    }
    
    if (!formData.descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }
    
    if (!formData.producto) {
      setError('Debe seleccionar un producto');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Limpiar y preparar datos
      const submitData = {
        ...formData,
        puntos_historia: formData.puntos_historia ? parseInt(formData.puntos_historia) : undefined,
        asignado_a: formData.asignado_a && formData.asignado_a.trim() !== '' ? formData.asignado_a : undefined,
        sprint: formData.sprint && formData.sprint.trim() !== '' ? formData.sprint : undefined,
        criterios_aceptacion: formData.criterios_aceptacion.filter(c => c.descripcion.trim() !== ''),
        etiquetas: formData.etiquetas.filter(tag => tag.trim() !== '')
      };
      
      console.log('Enviando datos de Scrum Master:', editingItem ? 'PUT' : 'POST', submitData);
      
      let data;
      if (editingItem) {
        data = await scrumMasterService.updateBacklogItem(editingItem._id, submitData, getToken);
      } else {
        data = await scrumMasterService.createTechnicalItem(submitData, getToken);
      }
      
      console.log('Respuesta exitosa de Scrum Master:', data);
      
      // Notificar éxito al componente padre
      onSuccess(data.message || `Item técnico ${editingItem ? 'actualizado' : 'creado'} exitosamente`);
      
      // Cerrar modal y resetear
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error en handleSubmit de Scrum Master:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar criterios de aceptación
  const addCriterio = () => {
    setFormData({
      ...formData,
      criterios_aceptacion: [...formData.criterios_aceptacion, { descripcion: '', completado: false }]
    });
  };

  const removeCriterio = (index) => {
    const newCriterios = formData.criterios_aceptacion.filter((_, i) => i !== index);
    setFormData({ ...formData, criterios_aceptacion: newCriterios });
  };

  const updateCriterio = (index, descripcion) => {
    const newCriterios = [...formData.criterios_aceptacion];
    newCriterios[index].descripcion = descripcion;
    setFormData({ ...formData, criterios_aceptacion: newCriterios });
  };

  // Manejar cambio de etiquetas
  const handleEtiquetaChange = (value) => {
    const raw = (typeof value === 'string') ? value : '';
    const etiquetas = raw.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, etiquetas });
  };

  // Cerrar modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
            }`}>
              <Package className={`h-5 w-5 ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {editingItem ? 'Editar Item Técnico' : 'Nuevo Item Técnico'}
              </h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {editingItem ? 'Actualiza la información del item' : 'Crea una nueva tarea, bug o mejora'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className={`border rounded-lg p-4 ${
                theme === 'dark'
                  ? 'bg-red-900/20 border-red-700'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-800'
                    }`}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Título *
                </label>
                <input
                  type="text"
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Ej: Optimizar consulta de base de datos..."
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Descripción *
                </label>
                <textarea
                  required
                  rows={4}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Describe detalladamente el item técnico..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tipo *
                </label>
                <select
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  {tipoOptions.map(option => {
                    const IconComponent = option.icon;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Como Scrum Master, puedes crear tareas técnicas, reportar bugs y planificar mejoras
                </p>
              </div>

              {/* Prioridad */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Prioridad *
                </label>
                <select
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                >
                  {prioridadOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Package className="h-4 w-4 inline mr-1" />
                  Producto *
                </label>
                <select
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={formData.producto}
                  onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                  disabled={productos.length === 0}
                >
                  <option value="">{productos.length === 0 ? 'No hay productos disponibles' : 'Seleccionar producto'}</option>
                  {productos.map(producto => (
                    <option key={producto._id} value={producto._id}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Puntos de Historia */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Puntos de Historia
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="1-100"
                  value={formData.puntos_historia}
                  onChange={(e) => setFormData({ ...formData, puntos_historia: e.target.value })}
                />
              </div>

              {/* Asignado a */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <User className="h-4 w-4 inline mr-1" />
                  Asignado a
                </label>
                <select
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={formData.asignado_a}
                  onChange={(e) => setFormData({ ...formData, asignado_a: e.target.value })}
                  disabled={usuarios.length === 0}
                >
                  <option value="">{usuarios.length === 0 ? 'No hay desarrolladores disponibles' : 'Sin asignar'}</option>
                  {usuarios.map(usuario => (
                    <option key={usuario._id} value={usuario._id}>
                      {usuario.nombre_negocio || usuario.email} ({usuario.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprint */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Sprint
                </label>
                <select
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={formData.sprint}
                  onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                  disabled={sprints.length === 0}
                >
                  <option value="">{sprints.length === 0 ? 'No hay sprints disponibles' : 'Sin asignar'}</option>
                  {sprints.map(sprint => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.nombre} ({sprint.estado})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Criterios de Aceptación */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Criterios de Aceptación
                </label>
                <button
                  type="button"
                  onClick={addCriterio}
                  className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>

              <div className="space-y-3">
                {formData.criterios_aceptacion.map((criterio, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Criterio de aceptación..."
                        value={criterio.descripcion}
                        onChange={(e) => updateCriterio(index, e.target.value)}
                      />
                    </div>
                    {formData.criterios_aceptacion.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterio(index)}
                        className="p-3 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Etiquetas */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Tag className="h-4 w-4 inline mr-1" />
                Etiquetas
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="frontend, backend, api (separadas por comas)"
                value={formData.etiquetas.join(', ')}
                onChange={(e) => handleEtiquetaChange(e.target.value)}
              />
              <p className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Separa las etiquetas con comas
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          theme === 'dark'
            ? 'border-gray-700 bg-gray-900'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={`px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
              theme === 'dark'
                ? 'text-gray-300 border-gray-600 hover:bg-gray-800'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {editingItem ? 'Actualizar Item' : 'Crear Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBacklogItemSM;
