import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Users,
  Flag,
  Zap,
  RefreshCw,
  Save,
  ArrowLeft,
  AlertTriangle,
  Info
} from 'lucide-react';
import { productOwnerService } from '../../services/productOwnerService';
import { useProducts } from '../../hooks/useProducts';
import { useSprints } from '../../hooks/useSprints';

const SprintBacklogPlanning = () => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  
  // Estados
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [availableStories, setAvailableStories] = useState([]);
  const [sprintStories, setSprintStories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [capacityValidation, setCapacityValidation] = useState(null);
  const [pendingStories, setPendingStories] = useState([]);

  // ✅ Usar custom hooks con caché
  const { products: productos, loading: loadingProducts } = useProducts();
  const { sprints, loading: loadingSprints } = useSprints(selectedProduct);

  // Configuración de prioridades
  const prioridadConfig = theme === 'dark' ? {
    muy_alta: { label: 'Muy Alta', icon: '🔴', color: 'border-red-600 bg-red-900/30' },
    alta: { label: 'Alta', icon: '🟠', color: 'border-orange-600 bg-orange-900/30' },
    media: { label: 'Media', icon: '🟡', color: 'border-yellow-600 bg-yellow-900/30' },
    baja: { label: 'Baja', icon: '🟢', color: 'border-green-600 bg-green-900/30' }
  } : {
    muy_alta: { label: 'Muy Alta', icon: '🔴', color: 'border-red-500 bg-red-50' },
    alta: { label: 'Alta', icon: '🟠', color: 'border-orange-500 bg-orange-50' },
    media: { label: 'Media', icon: '🟡', color: 'border-yellow-500 bg-yellow-50' },
    baja: { label: 'Baja', icon: '🟢', color: 'border-green-500 bg-green-50' }
  };

  const tipoColors = theme === 'dark' ? {
    historia: 'bg-blue-900/30 text-blue-400 border border-blue-800',
    tarea: 'bg-green-900/30 text-green-400 border border-green-800',
    bug: 'bg-red-900/30 text-red-400 border border-red-800',
    mejora: 'bg-purple-900/30 text-purple-400 border border-purple-800'
  } : {
    historia: 'bg-blue-100 text-blue-800 border border-blue-200',
    tarea: 'bg-green-100 text-green-800 border border-green-200',
    bug: 'bg-red-100 text-red-800 border border-red-200',
    mejora: 'bg-purple-100 text-purple-800 border border-purple-200'
  };

  // ✅ OPTIMIZADO: useCallback para cargarBacklogItems
  const cargarBacklogItems = useCallback(async () => {
    if (!selectedProduct) {
      setAvailableStories([]);
      return;
    }

    try {
      const data = await productOwnerService.getBacklogItems(
        { producto: selectedProduct, estado: 'pendiente' },
        getToken
      );

      // Filtrar solo items sin sprint asignado
      const availableItems = (data.items || []).filter(item => !item.sprint);
      setAvailableStories(availableItems);
    } catch (error) {
      console.error('Error al cargar backlog:', error);
    }
  }, [selectedProduct, getToken]);

  // ✅ OPTIMIZADO: useCallback para cargarSprintStories
  const cargarSprintStories = useCallback(async () => {
    if (!selectedSprint?._id) {
      setSprintStories([]);
      setPendingStories([]);
      return;
    }

    try {
      const data = await productOwnerService.getSprint(selectedSprint._id, getToken);
      setSprintStories(data.historias || []);
    } catch (error) {
      console.error('Error al cargar historias del sprint:', error);
    }
  }, [selectedSprint?._id, getToken]);

  // ✅ OPTIMIZADO: Cargar backlog items solo cuando cambia el producto
  useEffect(() => {
    cargarBacklogItems();
  }, [cargarBacklogItems]);

  // ✅ OPTIMIZADO: Cargar sprint stories solo cuando se selecciona sprint
  useEffect(() => {
    cargarSprintStories();
  }, [cargarSprintStories]);

  const isReadyForSprint = (item) => {
    return (
      item.descripcion && item.descripcion.length > 10 &&
      item.criterios_aceptacion && item.criterios_aceptacion.length > 0 &&
      item.puntos_historia > 0 &&
      item.estado === 'pendiente'
    );
  };

  const validateCapacity = useCallback(async () => {
    if (!selectedSprint || pendingStories.length === 0) {
      setCapacityValidation(null);
      return;
    }

    try {
      const validation = await productOwnerService.validateSprintCapacity(
        selectedSprint._id,
        pendingStories,
        getToken
      );
      setCapacityValidation(validation);
    } catch (error) {
      console.error('Error al validar capacidad:', error);
    }
  }, [selectedSprint, pendingStories, getToken]);

  // ✅ OPTIMIZADO: Validación de capacidad con debounce (DESPUÉS de declarar validateCapacity)
  useEffect(() => {
    if (!selectedSprint || pendingStories.length === 0) {
      setCapacityValidation(null);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      validateCapacity();
    }, 500); // 500ms de debounce para reducir peticiones
    
    return () => clearTimeout(timeoutId);
  }, [validateCapacity, selectedSprint, pendingStories.length]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Si no hay destino, no hacer nada
    if (!destination) return;

    // Si se soltó en el mismo lugar, no hacer nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Mover de backlog disponible a sprint
    if (source.droppableId === 'available' && destination.droppableId === 'sprint') {
      const story = availableStories.find(s => s._id === draggableId);
      if (story && !pendingStories.includes(draggableId)) {
        setPendingStories([...pendingStories, draggableId]);
      }
    }

    // Mover de sprint de vuelta a backlog
    if (source.droppableId === 'sprint' && destination.droppableId === 'available') {
      setPendingStories(pendingStories.filter(id => id !== draggableId));
    }
  };

  const handleSaveAssignments = async () => {
    if (pendingStories.length === 0) {
      setError('No hay historias pendientes para asignar');
      return;
    }

    if (capacityValidation && !capacityValidation.isValid) {
      if (!window.confirm('⚠️ El sprint estará sobrecargado. ¿Deseas continuar de todos modos?')) {
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await productOwnerService.assignMultipleStoriesToSprint(
        selectedSprint._id,
        pendingStories,
        getToken
      );

      setSuccess(`✅ ${data.assigned} historia(s) asignadas exitosamente`);
      setPendingStories([]);
      setCapacityValidation(null);
      
      // Recargar datos
      await cargarBacklogItems();
      await cargarSprintStories();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getPendingStories = () => {
    return availableStories.filter(story => pendingStories.includes(story._id));
  };

  const getCapacityIndicator = () => {
    if (!capacityValidation || !capacityValidation.capacityInPoints) {
      return null;
    }

    const percentage = parseFloat(capacityValidation.percentageUsed);
    let colorClass = 'bg-green-500';
    let icon = <CheckCircle size={20} />;

    if (percentage > 100) {
      colorClass = 'bg-red-500';
      icon = <AlertCircle size={20} />;
    } else if (percentage > 90) {
      colorClass = 'bg-yellow-500';
      icon = <AlertTriangle size={20} />;
    } else if (percentage < 70) {
      colorClass = 'bg-blue-500';
      icon = <Info size={20} />;
    }

    return (
      <div className={`mt-4 p-4 border rounded-lg ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Capacidad del Sprint</span>
          <div className="flex items-center gap-2">
            {icon}
            <span className={`text-lg font-bold ${
              percentage > 100 ? 'text-red-600' : 
              percentage > 90 ? 'text-yellow-600' : 
              percentage < 70 ? 'text-blue-600' : 'text-green-600'
            }`}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className={`w-full rounded-full h-3 overflow-hidden ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div
            className={`h-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className={`mt-2 grid grid-cols-3 gap-2 text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <div>
            <span className="font-medium">Actual: </span>
            {capacityValidation.currentPoints} pts
          </div>
          <div>
            <span className="font-medium">Nuevos: </span>
            +{capacityValidation.newPoints} pts
          </div>
          <div>
            <span className="font-medium">Total: </span>
            {capacityValidation.totalPoints} pts
          </div>
        </div>

        {capacityValidation.message && (
          <div className={`mt-2 p-2 rounded text-sm ${
            capacityValidation.severity === 'error' ? 'bg-red-50 text-red-700' :
            capacityValidation.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
            capacityValidation.severity === 'info' ? 'bg-blue-50 text-blue-700' :
            'bg-green-50 text-green-700'
          }`}>
            {capacityValidation.message}
          </div>
        )}
      </div>
    );
  };

  // ✅ Mostrar loading solo mientras cargan productos
  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`rounded-lg shadow-sm p-6 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-blue-800 to-blue-900 border border-blue-700' 
          : 'bg-gradient-to-r from-blue-600 to-blue-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-blue-700/50 text-white'
                  : 'hover:bg-blue-500/20 text-white'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target />
                Planificación de Sprint
              </h1>
              <p className="text-blue-100 mt-1">Arrastra historias del backlog al sprint</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selectores */}
      <div className={`rounded-lg border p-4 space-y-4 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Producto
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setSelectedSprint(null);
                setPendingStories([]);
              }}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Seleccionar producto</option>
              {productos.map(producto => (
                <option key={producto._id} value={producto._id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Sprint
            </label>
            <select
              value={selectedSprint?._id || ''}
              onChange={(e) => {
                const sprint = sprints.find(s => s._id === e.target.value);
                setSelectedSprint(sprint);
                setPendingStories([]);
              }}
              disabled={!selectedProduct}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400'
              }`}
            >
              <option value="">Seleccionar sprint</option>
              {sprints.map(sprint => (
                <option key={sprint._id} value={sprint._id}>
                  {sprint.nombre} ({sprint.estado})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSprint && (
          <div className={`border-t pt-4 grid grid-cols-4 gap-4 text-sm ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Objetivo:</span>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{selectedSprint.objetivo}</p>
            </div>
            <div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Fechas:</span>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {new Date(selectedSprint.fecha_inicio).toLocaleDateString()} - {new Date(selectedSprint.fecha_fin).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Capacidad:</span>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{selectedSprint.capacidad_equipo} hrs</p>
            </div>
            <div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Historias actuales:</span>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{sprintStories.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className={`border rounded-lg p-4 flex items-center gap-2 ${
          theme === 'dark'
            ? 'bg-red-900/20 border-red-800 text-red-400'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={`border rounded-lg p-4 flex items-center gap-2 ${
          theme === 'dark'
            ? 'bg-green-900/20 border-green-800 text-green-400'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      {selectedSprint && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-6">
            {/* Panel Izquierdo: Backlog Disponible */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Package size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                  Backlog Disponible
                  <span className={`text-sm font-normal ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    ({availableStories.length} historias)
                  </span>
                </h2>
                <button
                  onClick={cargarBacklogItems}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Actualizar"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              <Droppable droppableId="available">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] border-2 border-dashed rounded-lg p-4 transition-colors ${
                      snapshot.isDraggingOver 
                        ? (theme === 'dark' ? 'border-blue-600 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                        : (theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50')
                    }`}
                  >
                    {availableStories.length === 0 ? (
                      <div className={`text-center py-12 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Package size={48} className="mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No hay historias disponibles</p>
                        <p className="text-sm mt-1">
                          Todas las historias del backlog están asignadas a un sprint
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          💡 Crea nuevas historias en "Product Backlog"
                        </p>
                      </div>
                    ) : (
                      availableStories.map((story, index) => (
                        <Draggable key={story._id} draggableId={story._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 p-4 border-l-4 rounded-lg shadow-sm transition-all ${
                                prioridadConfig[story.prioridad]?.color || 'border-gray-300'
                              } ${
                                snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : 'hover:shadow-md'
                              } ${
                                pendingStories.includes(story._id) ? 'opacity-50' : ''
                              } ${
                                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className={`font-medium flex-1 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{story.titulo}</h3>
                                <div className="flex items-center gap-2 ml-2">
                                  {!isReadyForSprint(story) && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      theme === 'dark' 
                                        ? 'bg-yellow-900/50 text-yellow-300' 
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`} title="Faltan criterios o puntos">
                                      ⚠️ Incompleta
                                    </span>
                                  )}
                                  <span className="text-lg">
                                    {prioridadConfig[story.prioridad]?.icon}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className={`px-2 py-1 rounded ${tipoColors[story.tipo] || (
                                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                                )}`}>
                                  {story.tipo}
                                </span>
                                <span className={`px-2 py-1 rounded font-medium ${
                                  story.puntos_historia > 0 
                                    ? (theme === 'dark' ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-100 text-blue-800')
                                    : (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
                                }`}>
                                  {story.puntos_historia || 0} pts
                                </span>
                                {story.criterios_aceptacion?.length > 0 ? (
                                  <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                                    ✓ {story.criterios_aceptacion.length} criterios
                                  </span>
                                ) : (
                                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                                    ⚠️ Sin criterios
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Panel Derecho: Sprint */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Target size={20} className="text-blue-600" />
                  {selectedSprint.nombre}
                  <span className={`text-sm font-normal ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    ({sprintStories.length + pendingStories.length} historias)
                  </span>
                </h2>
              </div>

              <Droppable droppableId="sprint">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] border-2 border-dashed rounded-lg p-4 transition-colors ${
                      snapshot.isDraggingOver
                        ? (theme === 'dark' ? 'border-green-600 bg-green-900/20' : 'border-green-500 bg-green-50')
                        : (theme === 'dark' ? 'border-blue-700 bg-blue-900/20' : 'border-blue-300 bg-blue-50')
                    }`}
                  >
                    {/* Historias ya asignadas */}
                    {sprintStories.map((story) => (
                      <div
                        key={story._id}
                        className={`mb-3 p-4 border-l-4 border-gray-400 rounded-lg opacity-70 ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className={`font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>{story.titulo}</h3>
                          <span className={`text-xs ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>Ya asignada</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-2">
                          <span className={`px-2 py-1 rounded ${tipoColors[story.tipo] || (theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
                            {story.tipo}
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {story.puntos_historia || 0} pts
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Historias pendientes de guardar */}
                    {getPendingStories().map((story, index) => (
                      <Draggable key={story._id} draggableId={story._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 p-4 border-l-4 border-green-500 rounded-lg shadow-sm transition-all ${
                              snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                            } ${
                              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{story.titulo}</h3>
                              <span className={`text-xs px-2 py-1 rounded ${
                                theme === 'dark' 
                                  ? 'bg-green-800/50 text-green-300' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                Pendiente
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`px-2 py-1 rounded ${tipoColors[story.tipo] || (theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
                                {story.tipo}
                              </span>
                              <span className={`px-2 py-1 rounded font-medium ${
                                theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {story.puntos_historia || 0} pts
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {sprintStories.length === 0 && pendingStories.length === 0 && (
                      <div className={`text-center py-12 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Target size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Arrastra historias aquí</p>
                        <p className="text-sm">Este sprint está vacío</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Indicador de capacidad */}
              {getCapacityIndicator()}

              {/* Botón guardar */}
              {pendingStories.length > 0 && (
                <button
                  onClick={handleSaveAssignments}
                  disabled={saving}
                  className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : (theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      )
                  }`}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar Asignaciones ({pendingStories.length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      {!selectedProduct && (
        <div className={`text-center py-12 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Package size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-lg font-medium">Selecciona un producto para comenzar</p>
        </div>
      )}

      {selectedProduct && !selectedSprint && (
        <div className={`text-center py-12 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Target size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-lg font-medium">Selecciona un sprint para planificar</p>
        </div>
      )}
    </div>
  );
};

export default SprintBacklogPlanning;
