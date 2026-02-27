import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../../context/ThemeContext';
import { productOwnerService } from '../../../services/productOwnerService';
import { 
  X, 
  Plus, 
  Minus,
  Package,
  Calendar,
  Target,
  Tag,
  CheckCircle
} from 'lucide-react';

const ModalBacklogItem = ({ 
  isOpen, 
  onClose, 
  editingItem, 
  productos, 
  usuarios, 
  sprints, 
  onSuccess,
  onProductChange,
  loadingSprints 
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'historia',
    prioridad: 'media',
    producto: '',
    puntos_historia: '',
    sprint: '',
    criterios_aceptacion: [{ descripcion: '', completado: false }],
    etiquetas: []
  });

  // Configuraciones de colores y opciones
  const tipoOptions = [
    { value: 'historia', label: 'Historia de Usuario', color: 'text-blue-600' },
    { value: 'tarea', label: 'Tarea', color: 'text-green-600' },
    { value: 'bug', label: 'Bug', color: 'text-red-600' },
    { value: 'mejora', label: 'Mejora', color: 'text-purple-600' }
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
        tipo: editingItem.tipo || 'historia',
        prioridad: editingItem.prioridad || 'media',
        producto: editingItem.producto?._id || '',
        puntos_historia: editingItem.puntos_historia?.toString() || '',
        sprint: editingItem.sprint?._id || '',
        criterios_aceptacion: editingItem.criterios_aceptacion?.length > 0 
          ? editingItem.criterios_aceptacion 
          : [{ descripcion: '', completado: false }],
        etiquetas: editingItem.etiquetas || []
      });
    } else {
      resetForm();
    }
  }, [editingItem, productos, usuarios, sprints]); // Agregar productos a las dependencias

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'historia',
      prioridad: 'media',
      producto: '',
      puntos_historia: '',
      sprint: '',
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
        sprint: formData.sprint && formData.sprint.trim() !== '' ? formData.sprint : undefined,
        criterios_aceptacion: formData.criterios_aceptacion.filter(c => c.descripcion.trim() !== ''),
        etiquetas: formData.etiquetas.filter(tag => tag.trim() !== '')
      };
      
      let data;
      if (editingItem) {
        // Actualizar item existente
        data = await productOwnerService.updateBacklogItem(
          editingItem._id,
          submitData,
          getToken
        );
      } else {
        // Crear nuevo item
        data = await productOwnerService.createBacklogItem(submitData, getToken);
      }
      
      console.log('Respuesta exitosa:', data);
      
      // Notificar éxito al componente padre
      onSuccess(data.message || `Item ${editingItem ? 'actualizado' : 'creado'} exitosamente`);
      
      // Cerrar modal y resetear
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
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

  // ✅ Manejar cambio de producto - cargar sprints del producto seleccionado
  const handleProductoChange = (productId) => {
    setFormData({ 
      ...formData, 
      producto: productId,
      sprint: '' // Resetear sprint cuando cambia el producto
    });
    
    // Llamar a la función del padre para cargar los sprints
    if (onProductChange) {
      onProductChange(productId);
    }
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
    const etiquetas = value.split(',').map(tag => tag.trim()).filter(tag => tag);
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
      <div className={`rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' 
            ? 'border-gray-700' 
            : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-blue-900/30 text-blue-400' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {editingItem ? 'Editar Item del Backlog' : 'Nuevo Item del Backlog'}
              </h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {editingItem ? 'Actualiza la información del item' : 'Agrega un nuevo item al product backlog'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className={`border rounded-lg p-4 ${
              theme === 'dark' 
                ? 'bg-red-900/30 border-red-800 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Título y Descripción */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Título *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Ej: Como usuario, quiero poder..."
                required
              />
            </div>

            <div className="lg:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Descripción *
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Describe detalladamente el item del backlog..."
                required
              />
            </div>
          </div>

          {/* Tipo, Prioridad y Puntos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {tipoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Prioridad *
              </label>
              <select
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {prioridadOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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
                value={formData.puntos_historia}
                onChange={(e) => setFormData({ ...formData, puntos_historia: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="1-100"
              />
            </div>
          </div>

          {/* Producto y Sprint */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Package className="h-4 w-4 inline mr-1" />
                Producto *
              </label>
              <select
                value={formData.producto}
                onChange={(e) => handleProductoChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              >
                <option value="">Seleccionar producto</option>
                {(productos || []).map(producto => (
                  <option key={producto._id} value={producto._id}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
              {(!productos || productos.length === 0) && (
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  ⚠️ No se han cargado productos. Recargando...
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Calendar className="h-4 w-4 inline mr-1" />
                Sprint
                {loadingSprints && (
                  <span className="ml-2 inline-block animate-spin">⟳</span>
                )}
              </label>
              <select
                value={formData.sprint}
                onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled={loadingSprints || !formData.producto}
              >
                <option value="">
                  {!formData.producto 
                    ? 'Seleccione un producto primero' 
                    : loadingSprints 
                      ? 'Cargando sprints...' 
                      : 'Sin asignar'}
                </option>
                {(sprints || []).map(sprint => (
                  <option key={sprint._id} value={sprint._id}>
                    {sprint.nombre} ({sprint.estado})
                  </option>
                ))}
              </select>
              {formData.producto && !loadingSprints && sprints.length === 0 && (
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No hay sprints disponibles para este producto
                </p>
              )}
            </div>
          </div>

          {/* Criterios de Aceptación */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`block text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Target className="h-4 w-4 inline mr-1" />
                Criterios de Aceptación
              </label>
              <button
                type="button"
                onClick={addCriterio}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/40' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
            <div className="space-y-3">
              {formData.criterios_aceptacion.map((criterio, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className={`h-4 w-4 flex-shrink-0 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={criterio.descripcion}
                    onChange={(e) => updateCriterio(index, e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Criterio de aceptación..."
                  />
                  {formData.criterios_aceptacion.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriterio(index)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'text-red-400 hover:bg-red-900/30' 
                          : 'text-red-500 hover:bg-red-50'
                      }`}
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
              value={formData.etiquetas.join(', ')}
              onChange={(e) => handleEtiquetaChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="frontend, backend, api (separadas por comas)"
            />
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Separa las etiquetas con comas
            </p>
          </div>

          {/* Botones */}
          <div className={`flex items-center justify-end gap-3 pt-6 border-t ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingItem ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  {editingItem ? 'Actualizar Item' : 'Crear Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalBacklogItem;
