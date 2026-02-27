import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { scrumMasterService } from '../../services/scrumMasterService';
import AssignStoryModal from './AssignStoryModal';
import SprintStoriesPanel from './SprintStoriesPanel';
// ✅ OPTIMIZADO: Importar hooks con caché
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import { useSprints } from '../../hooks/useSprints';
import { 
  Target, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Package,
  User,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Flag,
  Sparkles,
  PlayCircle
} from 'lucide-react';

const SprintPlanning = () => {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  
  // ✅ OPTIMIZADO: Usar hooks con caché en lugar de estados locales
  const { products: productos, loading: loadingProducts } = useProducts();
  const { users: teamMembers, loading: loadingUsers } = useUsers();
  const { sprints: allSprints, loading: loadingSprints } = useSprints();
  
  // Estados locales solo para UI
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [sprintItems, setSprintItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(''); // Filtro por producto
  
  // Filtros
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    muy_alta: true,
    alta: true,
    media: false,
    baja: false
  });

  // ✅ OPTIMIZADO: Filtrar sprints disponibles para planificación localmente con useMemo
  // Mostrar sprints en estado 'planificado' o 'activo' (excluyendo 'completado' y 'cancelado')
  const sprints = useMemo(() => {
    return allSprints.filter(sprint => {
      const estado = sprint.estado || sprint.status;
      const isAvailable = estado === 'planificado' || estado === 'activo';
      const matchProduct = !selectedProduct || sprint.producto?._id === selectedProduct || sprint.producto === selectedProduct;
      return isAvailable && matchProduct;
    });
  }, [allSprints, selectedProduct]);

  // Configuración de prioridades con colores y iconos adaptados al tema
  const prioridadConfig = {
    muy_alta: {
      label: 'Muy Alta',
      color: theme === 'dark' 
        ? 'bg-red-900/30 text-red-400 border-red-800'
        : 'bg-red-100 text-red-800 border-red-200',
      bgColor: theme === 'dark' ? 'bg-gray-800' : 'bg-red-50',
      borderColor: theme === 'dark' ? 'border-gray-700' : 'border-red-200',
      icon: Zap,
      order: 1
    },
    alta: {
      label: 'Alta', 
      color: theme === 'dark'
        ? 'bg-orange-900/30 text-orange-400 border-orange-800'
        : 'bg-orange-100 text-orange-800 border-orange-200',
      bgColor: theme === 'dark' ? 'bg-gray-800' : 'bg-orange-50',
      borderColor: theme === 'dark' ? 'border-gray-700' : 'border-orange-200',
      icon: Flag,
      order: 2
    },
    media: {
      label: 'Media',
      color: theme === 'dark'
        ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800'
        : 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      bgColor: theme === 'dark' ? 'bg-gray-800' : 'bg-yellow-50',
      borderColor: theme === 'dark' ? 'border-gray-700' : 'border-yellow-200',
      icon: BarChart3,
      order: 3
    },
    baja: {
      label: 'Baja',
      color: theme === 'dark'
        ? 'bg-green-900/30 text-green-400 border-green-800'
        : 'bg-green-100 text-green-800 border-green-200',
      bgColor: theme === 'dark' ? 'bg-gray-800' : 'bg-green-50',
      borderColor: theme === 'dark' ? 'border-gray-700' : 'border-green-200', 
      icon: TrendingUp,
      order: 4
    }
  };

  const tipoColors = theme === 'dark' ? {
    historia: 'bg-blue-900/30 text-blue-400',
    tarea: 'bg-green-900/30 text-green-400',
    bug: 'bg-red-900/30 text-red-400',
    mejora: 'bg-purple-900/30 text-purple-400'
  } : {
    historia: 'bg-blue-100 text-blue-800',
    tarea: 'bg-green-100 text-green-800',
    bug: 'bg-red-100 text-red-800',
    mejora: 'bg-purple-100 text-purple-800'
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // ✅ OPTIMIZADO: Ya no necesitamos recargar sprints cuando cambie producto
  // El filtrado se hace localmente con useMemo

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      // ✅ OPTIMIZADO: Solo cargar availableItems
      // productos, teamMembers y sprints vienen de los hooks con caché
      await fetchAvailableItems(token);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ELIMINADAS: fetchTeamMembers, fetchSprints y fetchProductos
  // Estos datos ahora vienen de los hooks useUsers, useSprints y useProducts con caché

  // ✅ SEMI-OPTIMIZADO: Obtener items disponibles para planning
  // TODO: En el futuro, reemplazar con useBacklogItems hook
  const fetchAvailableItems = async (token) => {
    try {
      const data = await scrumMasterService.getBacklogItems({ estado: 'pendiente' }, getToken);
      const itemsDisponibles = (data.items || []).filter(item => !item.sprint);
      setAvailableItems(itemsDisponibles);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Error al cargar items del backlog: ' + error.message);
      setAvailableItems([]);
    }
  };

  // ✅ OPTIMIZADO: Filtrar items localmente con useMemo
  const filteredAvailableItems = useMemo(() => {
    return availableItems.filter(item => {
      const matchProduct = !filtroProducto || 
        item.producto?._id === filtroProducto || 
        item.producto === filtroProducto;
      const matchPriority = !filtroPrioridad || item.prioridad === filtroPrioridad;
      return matchProduct && matchPriority;
    });
  }, [availableItems, filtroProducto, filtroPrioridad]);

  // ✅ ELIMINADAS: fetchSprints y fetchProductos
  // sprints viene de useSprints hook con filtrado local (useMemo)
  // productos viene de useProducts hook con caché

  // Cargar items del sprint seleccionado
  const loadSprintItems = async (sprintId) => {
    try {
      const data = await scrumMasterService.getBacklogItems({ sprint: sprintId }, getToken);
      setSprintItems(data.items || []);
    } catch (error) {
      console.error('Error loading sprint items:', error);
      setError('Error al cargar items del sprint: ' + error.message);
      setSprintItems([]);
    }
  };

  // Agrupar items por prioridad
  const groupItemsByPriority = (items) => {
    const grupos = { muy_alta: [], alta: [], media: [], baja: [] };
    items.forEach(item => {
      if (grupos[item.prioridad]) {
        grupos[item.prioridad].push(item);
      }
    });
    return grupos;
  };

  // Toggle sección expandida
  const toggleSection = (prioridad) => {
    setExpandedSections(prev => ({
      ...prev,
      [prioridad]: !prev[prioridad]
    }));
  };

  // Seleccionar sprint
  const handleSelectSprint = async (sprint) => {
    setSelectedSprint(sprint);
    await loadSprintItems(sprint._id);
  };

  // Aplicar filtros
  const handleApplyFilters = async () => {
    const token = await getToken();
    await fetchAvailableItems(token);
  };

  // Manejar asignación de historia exitosa
  const handleStoryAssigned = (assignedStory) => {
    // Actualizar la lista de items del sprint
    setSprintItems(prev => [...prev, assignedStory]);
    
    // Remover la historia de la lista de disponibles
    setAvailableItems(prev => 
      prev.filter(item => item._id !== assignedStory._id)
    );
  };

  // Manejar remoción de historia del sprint
  const handleStoryRemoved = (removedStory) => {
    // Remover la historia de la lista del sprint
    setSprintItems(prev => 
      prev.filter(item => item._id !== removedStory._id)
    );
    
    // Añadir la historia de vuelta a disponibles si cumple los filtros
    setAvailableItems(prev => [...prev, removedStory]);
  };

  // Refrescar datos del sprint seleccionado
  const handleRefreshSprintData = async () => {
    if (selectedSprint) {
      await loadSprintItems(selectedSprint._id);
    }
  };

  // Manejar cambio de producto
  const handleProductChange = async (productId) => {
    setSelectedProduct(productId);
    setSelectedSprint(null);
    setSprintItems([]);
    
    // ✅ OPTIMIZADO: Ya no necesitamos recargar sprints
    // El filtrado por producto se hace localmente con useMemo
  };

  // Manejar apertura del modal con debug
  const handleOpenAssignModal = (sprint) => {
    console.log('Abriendo modal para sprint:', sprint?.nombre);
    console.log('Sprint seleccionado:', selectedSprint?.nombre);
    setShowAssignModal(true);
  };

  if (loading || loadingProducts || loadingUsers || loadingSprints) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`ml-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Cargando Sprint Planning...</span>
      </div>
    );
  }

  const itemsGrouped = groupItemsByPriority(filteredAvailableItems);
  const totalStoryPoints = filteredAvailableItems.reduce((sum, item) => sum + (item.puntos_historia || 0), 0);
  const sprintStoryPoints = sprintItems.reduce((sum, item) => sum + (item.puntos_historia || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Sprint Planning</h1>
        </div>
        <p className="opacity-90">
          Planifica sprints basándote en las prioridades del Product Owner
        </p>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-medium">Error de conexión</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar estado real - sin datos ficticios */}
      {!error && (
        <>
          {/* Resumen de métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border shadow-sm ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-blue-600">{filteredAvailableItems.length}</div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Items Disponibles</div>
            </div>
            <div className={`p-4 rounded-lg border shadow-sm ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-green-600">{totalStoryPoints}</div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Story Points Total</div>
            </div>
            <div className={`p-4 rounded-lg border shadow-sm ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-purple-600">{sprintItems.length}</div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Items en Sprint</div>
            </div>
            <div className={`p-4 rounded-lg border shadow-sm ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-2xl font-bold text-orange-600">{sprintStoryPoints}</div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Puntos Asignados</div>
            </div>
          </div>

          {/* Filtros */}
          <div className={`rounded-lg border p-4 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Todos los productos</option>
                {productos.map(producto => (
                  <option key={producto._id} value={producto._id}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
              
              <select
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Filtro Backlog</option>
                {productos.map(producto => (
                  <option key={producto._id} value={producto._id}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
              
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Todas las prioridades</option>
                <option value="muy_alta">Muy Alta</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
              
              <button
                onClick={handleApplyFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Aplicar Filtros
              </button>
            </div>
          </div>

          {/* Layout principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selección de Sprint */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Seleccionar Sprint</h3>
                {selectedProduct && (
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {productos.find(p => p._id === selectedProduct)?.nombre || 'Producto'}
                  </div>
                )}
              </div>
              
              {sprints.length === 0 ? (
                <div className={`p-6 rounded-lg border text-center ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <PlayCircle className={`h-12 w-12 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {selectedProduct 
                      ? 'No hay sprints disponibles para este producto'
                      : 'No hay sprints disponibles para planificación'
                    }
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedProduct 
                      ? 'Selecciona otro producto o crea un nuevo sprint'
                      : 'Selecciona un producto o crea un nuevo sprint'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sprints.map(sprint => (
                    <div 
                      key={sprint._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedSprint?._id === sprint._id 
                          ? theme === 'dark'
                            ? 'border-blue-500 bg-blue-900/20 shadow-md'
                            : 'border-blue-500 bg-blue-50 shadow-md'
                          : theme === 'dark'
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectSprint(sprint)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`font-medium ${
                            selectedSprint?._id === sprint._id && theme === 'dark'
                              ? 'text-blue-400'
                              : selectedSprint?._id === sprint._id
                              ? 'text-blue-700'
                              : theme === 'dark' 
                              ? 'text-white' 
                              : 'text-gray-900'
                          }`}>{sprint.nombre}</div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{sprint.objetivo}</div>
                          <div className={`text-xs mt-1 flex items-center gap-2 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(sprint.fecha_inicio).toLocaleDateString()} - 
                            {new Date(sprint.fecha_fin).toLocaleDateString()}
                          </div>
                          {sprint.producto && (
                            <div className={`text-xs mt-1 flex items-center gap-1 ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              <Package className="h-3 w-3" />
                              {sprint.producto.nombre}
                            </div>
                          )}
                        </div>
                        
                        {selectedSprint?._id === sprint._id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Botón Asignar Historia clickeado');
                              handleOpenAssignModal(sprint);
                            }}
                            className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            Asignar Historia
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Información del Equipo */}
              {teamMembers.length > 0 && (
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-3 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Users className="h-4 w-4" />
                    Estado del Equipo ({teamMembers.length} miembros)
                  </h4>
                  
                  <div className="space-y-2">
                    {teamMembers.slice(0, 5).map(member => {
                      // Validación defensiva para workload
                      const workload = member.workload || { currentStoryPoints: 0, maxStoryPoints: 0 };
                      const workloadPercentage = workload.maxStoryPoints > 0 
                        ? Math.round((workload.currentStoryPoints / workload.maxStoryPoints) * 100)
                        : 0;
                      
                      const getWorkloadColor = (percentage) => {
                        if (percentage > 100) return 'text-red-600 bg-red-100';
                        if (percentage > 80) return 'text-yellow-600 bg-yellow-100';
                        return 'text-green-600 bg-green-100';
                      };
                      
                      return (
                        <div key={member._id || member.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              {(member.nombre_negocio || member.name || member.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{member.nombre_negocio || member.name || member.email || 'Usuario'}</div>
                              <div className={`text-xs ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                              }`}>{member.role || 'developer'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getWorkloadColor(workloadPercentage)}`}>
                              {workloadPercentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {workload.currentStoryPoints}/{workload.maxStoryPoints} SP
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {teamMembers.length > 5 && (
                      <div className="text-xs text-gray-500 text-center pt-2 border-t">
                        +{teamMembers.length - 5} miembros más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Backlog por Prioridades */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Product Backlog</h3>
              
              {filteredAvailableItems.length === 0 ? (
                <div className={`p-6 rounded-lg border text-center ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <Package className={`h-12 w-12 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    No hay items en el backlog
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Crea items en el backlog para planificar sprints</p>
                </div>
              ) : (
                Object.entries(prioridadConfig)
                  .sort(([,a], [,b]) => a.order - b.order)
                  .map(([prioridad, config]) => {
                    const items = itemsGrouped[prioridad] || [];
                    const Icon = config.icon;
                    const totalPoints = items.reduce((sum, item) => sum + (item.puntos_historia || 0), 0);
                    
                    return (
                      <div key={prioridad} className={`border rounded-lg ${config.bgColor} ${config.borderColor}`}>
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => toggleSection(prioridad)}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`} />
                            <div>
                              <h4 className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{config.label}</h4>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {items.length} items ({totalPoints} pts)
                              </p>
                            </div>
                          </div>
                          {expandedSections[prioridad] ? 
                            <ChevronUp className="h-5 w-5" /> : 
                            <ChevronDown className="h-5 w-5" />
                          }
                        </div>
                        
                        {expandedSections[prioridad] && (
                          <div className={`p-4 space-y-2 border-t ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            {items.length === 0 ? (
                              <p className={`text-sm text-center py-4 ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                No hay items con esta prioridad
                              </p>
                            ) : (
                              items.map(item => (
                                <div key={item._id} className={`p-3 border rounded-lg ${
                                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                  <h5 className={`font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>{item.titulo}</h5>
                                  <p className={`text-sm mt-1 ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>{item.descripcion}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded text-xs ${tipoColors[item.tipo] || 'bg-gray-100 text-gray-800'}`}>
                                      {item.tipo}
                                    </span>
                                    <span className="text-xs text-gray-500">{item.puntos_historia} pts</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
          
          {/* Panel de historias del sprint seleccionado */}
          {selectedSprint && (
            <div className="lg:col-span-2">
              <SprintStoriesPanel
                sprint={selectedSprint}
                sprintItems={sprintItems}
                teamMembers={teamMembers}
                onStoryRemoved={handleStoryRemoved}
                onRefresh={handleRefreshSprintData}
              />
            </div>
          )}
        </>
      )}
      
      {/* Modal de asignación de historias */}
      {console.log('Renderizando modal - isOpen:', showAssignModal, 'sprint:', selectedSprint?.nombre)}
      <AssignStoryModal
        isOpen={showAssignModal}
        onClose={() => {
          console.log('Cerrando modal');
          setShowAssignModal(false);
        }}
        sprint={selectedSprint}
        teamMembers={teamMembers}
        onStoryAssigned={handleStoryAssigned}
      />
    </div>
  );
};

export default SprintPlanning;
