import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { productOwnerService } from '../../services/productOwnerService';
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import { useSprints } from '../../hooks/useSprints';
import ModalBacklogItem from './modalsPO/ModalBacklogItem';
import { 
  List, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter,
  RefreshCw,
  Package,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

const ProductBacklog = () => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  
  // Estados locales primero
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // ✅ Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // ✅ Usar custom hooks con caché para productos y usuarios (siempre cargan)
  const { products: productos, loading: loadingProducts } = useProducts();
  const { users: usuarios, loading: loadingUsers } = useUsers(true);
  
  // ✅ Para sprints, cargarlos manualmente solo cuando se necesiten
  const [sprints, setSprints] = useState([]);
  const [loadingSprints, setLoadingSprints] = useState(false);

  const tipoColors = {
    historia: theme === 'dark' 
      ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
      : 'bg-blue-100 text-blue-800',
    tarea: theme === 'dark' 
      ? 'bg-green-900/30 text-green-400 border border-green-800' 
      : 'bg-green-100 text-green-800',
    bug: theme === 'dark' 
      ? 'bg-red-900/30 text-red-400 border border-red-800' 
      : 'bg-red-100 text-red-800',
    mejora: theme === 'dark' 
      ? 'bg-purple-900/30 text-purple-400 border border-purple-800' 
      : 'bg-purple-100 text-purple-800'
  };

  const prioridadColors = {
    muy_alta: theme === 'dark' 
      ? 'bg-red-900/30 text-red-400 border border-red-800' 
      : 'bg-red-100 text-red-800',
    alta: theme === 'dark' 
      ? 'bg-orange-900/30 text-orange-400 border border-orange-800' 
      : 'bg-orange-100 text-orange-800',
    media: theme === 'dark' 
      ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' 
      : 'bg-yellow-100 text-yellow-800',
    baja: theme === 'dark' 
      ? 'bg-green-900/30 text-green-400 border border-green-800' 
      : 'bg-green-100 text-green-800'
  };

  const estadoColors = {
    pendiente: theme === 'dark' 
      ? 'bg-gray-700 text-gray-300 border border-gray-600' 
      : 'bg-gray-100 text-gray-800',
    en_progreso: theme === 'dark' 
      ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
      : 'bg-blue-100 text-blue-800',
    en_revision: theme === 'dark' 
      ? 'bg-purple-900/30 text-purple-400 border border-purple-800' 
      : 'bg-purple-100 text-purple-800',
    completado: theme === 'dark' 
      ? 'bg-green-900/30 text-green-400 border border-green-800' 
      : 'bg-green-100 text-green-800'
  };

  // Función para evaluar si un item está listo para sprint
  const isReadyForSprint = (item) => {
    // Criterios para estar "listo para sprint":
    // 1. Tiene descripción completa
    // 2. Tiene criterios de aceptación
    // 3. Tiene puntos de historia estimados
    // 4. Está en estado pendiente (no asignado a sprint)
    const hasDescription = item.descripcion && item.descripcion.trim().length > 10;
    const hasCriteria = item.criterios_aceptacion && item.criterios_aceptacion.length > 0 && 
                       item.criterios_aceptacion.some(c => c.descripcion && c.descripcion.trim().length > 0);
    const hasStoryPoints = item.puntos_historia && item.puntos_historia > 0;
    const isPending = item.estado === 'pendiente' && !item.sprint;
    
    return hasDescription && hasCriteria && hasStoryPoints && isPending;
  };

  const fetchItems = useCallback(async (page = currentPage) => {
    try {
      setIsFiltering(true);
      
      // Preparar filtros
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (filtroProducto) filters.producto = filtroProducto;
      if (filtroEstado) filters.estado = filtroEstado;
      if (filtroPrioridad) filters.prioridad = filtroPrioridad;
      filters.page = page.toString();
      filters.limit = itemsPerPage.toString();
      
      const data = await productOwnerService.getBacklogItems(filters, getToken);
      
      setItems(data.items || data.data || []);
      
      // Actualizar información de paginación
      if (data.pagination) {
        setCurrentPage(data.pagination.current_page || 1);
        setTotalPages(data.pagination.total_pages || 1);
        setTotalItems(data.pagination.total_items || 0);
      }
      
      setError('');
    } catch (error) {
      console.error('Error al cargar backlog:', error);
      setError('Error al cargar backlog: ' + error.message);
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  }, [getToken, searchTerm, filtroProducto, filtroEstado, filtroPrioridad, currentPage, itemsPerPage]);

  // ✅ OPTIMIZADO: Solo cargar items inicialmente, productos/usuarios/sprints vienen de hooks
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError('No hay token de autenticación');
          setLoading(false);
          return;
        }
        
        // ✅ Solo cargar items, el resto viene de los hooks con caché
        await fetchItems();
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [fetchItems, getToken]);

  // ✅ OPTIMIZADO: Efecto para aplicar filtros con debounce mejorado
  useEffect(() => {
    // Solo ejecutar si ya terminó la carga inicial de productos
    if (loadingProducts) {
      return;
    }

    const timeoutId = setTimeout(() => {
      // Resetear a página 1 cuando cambian los filtros
      setCurrentPage(1);
      fetchItems(1);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filtroProducto, filtroEstado, filtroPrioridad, loadingProducts]);

  // ✅ Funciones de navegación de paginación
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchItems(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // ✅ Cambiar items por página
  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchItems(1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleModalSuccess = (message) => {
    setError(`success:${message}`);
    fetchItems(currentPage);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.titulo}"?`)) {
      return;
    }
    
    try {
      await productOwnerService.deleteBacklogItem(item._id, getToken);
      setError('success:Item eliminado exitosamente');
      
      // Si era el último item de la página, ir a la página anterior
      if (items.length === 1 && currentPage > 1) {
        goToPage(currentPage - 1);
      } else {
        fetchItems(currentPage);
      }
    } catch (error) {
      console.error('Error al eliminar item:', error);
      setError('Error: ' + error.message);
    }
  };

  const handleNewItem = async () => {
    setEditingItem(null);
    // Cargar sprints si hay un producto seleccionado
    if (filtroProducto) {
      await cargarSprintsDelProducto(filtroProducto);
    }
    setShowModal(true);
  };

  const handleEditItem = async (item) => {
    setEditingItem(item);
    // Cargar sprints del producto del item
    if (item.producto?._id) {
      await cargarSprintsDelProducto(item.producto._id);
    }
    setShowModal(true);
  };

  // Función para cargar sprints de un producto específico
  const cargarSprintsDelProducto = async (productId) => {
    if (!productId) {
      setSprints([]);
      return;
    }
    
    try {
      setLoadingSprints(true);
      const data = await productOwnerService.getSprints({ producto: productId }, getToken);
      setSprints(data.sprints || data.data || []);
      console.log('Sprints cargados para producto:', productId, (data.sprints || data.data || []).length);
    } catch (error) {
      console.error('Error cargando sprints:', error);
      setSprints([]);
    } finally {
      setLoadingSprints(false);
    }
  };

  // ✅ Mostrar loading solo si los datos principales están cargando
  if (loading || loadingProducts) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`ml-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Cargando backlog...</span>
      </div>
    );
  }

  const readyForSprintCount = items.filter(item => isReadyForSprint(item)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <List className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Backlog</h1>
            <p className="text-gray-600">
              Gestiona los items del backlog del producto 
              {readyForSprintCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {readyForSprintCount} listos para sprint
                </span>
              )}
              {items.length > 0 && (
                <span className="ml-2 text-gray-500">
                  • {items.length} elementos total
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Item
          </button>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-lg ${
          error.startsWith('success:') 
            ? theme === 'dark'
              ? 'bg-green-900/30 border border-green-800 text-green-400'
              : 'bg-green-50 border border-green-200 text-green-800'
            : theme === 'dark'
              ? 'bg-red-900/30 border border-red-800 text-red-400'
              : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {error.replace('success:', '')}
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Todos los productos</option>
              {productos.map((producto) => (
                <option key={producto._id} value={producto._id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="en_revision">En Revisión</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          
          <div>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
          </div>
        </div>
        
        {/* Indicadores de filtros activos */}
        {(searchTerm || filtroProducto || filtroEstado || filtroPrioridad) && (
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Filtros activos:</span>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                  theme === 'dark'
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  Búsqueda: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-600">✕</button>
                </span>
              )}
              {filtroProducto && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                  theme === 'dark'
                    ? 'bg-green-900/30 text-green-400 border border-green-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  Producto: {productos.find(p => p._id === filtroProducto)?.nombre}
                  <button onClick={() => setFiltroProducto('')} className="hover:text-green-600">✕</button>
                </span>
              )}
              {filtroEstado && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                  theme === 'dark'
                    ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Estado: {filtroEstado.replace('_', ' ')}
                  <button onClick={() => setFiltroEstado('')} className="hover:text-yellow-600">✕</button>
                </span>
              )}
              {filtroPrioridad && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                  theme === 'dark'
                    ? 'bg-purple-900/30 text-purple-400 border border-purple-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  Prioridad: {filtroPrioridad.replace('_', ' ')}
                  <button onClick={() => setFiltroPrioridad('')} className="hover:text-purple-600">✕</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFiltroProducto('');
                  setFiltroEstado('');
                  setFiltroPrioridad('');
                }}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Limpiar todos
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-between items-center">
          <div className={`text-sm flex items-center gap-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {totalItems > 0 ? (
              <>
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
              </>
            ) : (
              'No hay registros'
            )}
            {isFiltering && (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span>Filtrando...</span>
              </>
            )}
          </div>
          <button
            onClick={fetchItems}
            disabled={isFiltering}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`h-3 w-3 ${isFiltering ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Lista de Items */}
      <div className={`rounded-lg border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <List className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>No hay items en el backlog</h3>
            <p className={`mb-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Comienza agregando el primer item al product backlog</p>
            <button
              onClick={handleNewItem}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Primer Item
            </button>
          </div>
        ) : (
          <div className={`divide-y ${
            theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
          }`}>
            {items.map((item) => {
              const readyForSprint = isReadyForSprint(item);
              
              return (
                <div key={item._id} className={`p-6 transition-colors ${
                  readyForSprint 
                    ? theme === 'dark'
                      ? 'border-l-4 border-l-green-500 bg-green-900/20'
                      : 'border-l-4 border-l-green-500 bg-green-50/30'
                    : theme === 'dark'
                      ? 'hover:bg-gray-700/50'
                      : 'hover:bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {readyForSprint && (
                          <div className={`flex items-center gap-1 ${
                            theme === 'dark' ? 'text-green-400' : 'text-green-600'
                          }`} title="Listo para Sprint Planning">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Ready</span>
                          </div>
                        )}
                        <h3 className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{item.titulo}</h3>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoColors[item.tipo]}`}>
                            {item.tipo}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${prioridadColors[item.prioridad]}`}>
                            {item.prioridad.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColors[item.estado]}`}>
                            {item.estado.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`mb-3 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>{item.descripcion}</p>
                      
                      <div className={`flex flex-wrap items-center gap-4 text-sm ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {item.producto && (
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>{item.producto.nombre}</span>
                          </div>
                        )}
                        
                        {item.asignado_a && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{item.asignado_a.nombre_negocio || item.asignado_a.firstName}</span>
                          </div>
                        )}
                        
                        {item.sprint && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{item.sprint.nombre}</span>
                          </div>
                        )}
                        
                        {item.puntos_historia && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{item.puntos_historia} puntos</span>
                          </div>
                        )}
                      </div>
                      
                      {item.etiquetas && item.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.etiquetas.map((etiqueta, index) => (
                            <span key={index} className={`px-2 py-1 text-xs rounded ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {etiqueta}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditItem(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-blue-400 hover:bg-blue-900/30'
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Editar item"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-red-400 hover:bg-red-900/30'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title="Eliminar item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalItems > 0 && totalPages > 1 && (
        <div className={`rounded-lg border p-4 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Información de paginación y selector de items por página */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Mostrar:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className={`px-3 py-1.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  por página
                </span>
              </div>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              {/* Primera página */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white disabled:hover:bg-transparent disabled:hover:text-gray-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:hover:bg-transparent disabled:hover:text-gray-600'
                }`}
                title="Primera página"
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>

              {/* Página anterior */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white disabled:hover:bg-transparent disabled:hover:text-gray-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:hover:bg-transparent disabled:hover:text-gray-600'
                }`}
                title="Página anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Indicador numérico de páginas */}
              <div className="flex items-center gap-1">
                {/* Mostrar páginas alrededor de la actual */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Mostrar: primera, última, actual, y páginas cercanas a la actual
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    // Agregar separador "..." si hay salto
                    const prevPage = array[index - 1];
                    const showSeparator = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showSeparator && (
                          <span className={`px-2 ${
                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-blue-600 text-white'
                              : theme === 'dark'
                                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Página siguiente */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white disabled:hover:bg-transparent disabled:hover:text-gray-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:hover:bg-transparent disabled:hover:text-gray-600'
                }`}
                title="Página siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Última página */}
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white disabled:hover:bg-transparent disabled:hover:text-gray-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:hover:bg-transparent disabled:hover:text-gray-600'
                }`}
                title="Última página"
              >
                <ChevronsRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <ModalBacklogItem
        isOpen={showModal}
        onClose={handleCloseModal}
        editingItem={editingItem}
        productos={productos}
        usuarios={usuarios}
        sprints={sprints}
        onSuccess={handleModalSuccess}
        onProductChange={cargarSprintsDelProducto}
        loadingSprints={loadingSprints}
      />
    </div>
  );
};

export default ProductBacklog;