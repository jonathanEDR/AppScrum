import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Calendar, 
  Target, 
  Clock, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2,
  PlayCircle, 
  CheckCircle,
  AlertCircle,
  Users,
  GitBranch,
  MoreVertical,
  History,
  Tag,
  Hash,
  Activity
} from 'lucide-react';
import ReleaseModal from './modalsPO/ReleaseModal';
import SprintModal from './modalsPO/SprintModal';
import AlertSystem from './components/AlertSystem';
import AdvancedFilters from './components/AdvancedFilters';
import AdvancedMetrics from './components/AdvancedMetrics';
import DependencyView from './components/DependencyView';
import ReleaseHistoryModal from './components/ReleaseHistoryModal';
import VersionManager from './components/VersionManager';
import TimelineWithMilestones from './TimelineWithMilestones';
import SprintMetrics from './SprintMetrics';
import BurndownChart from './BurndownChart';

import { productOwnerService } from '../../services/productOwnerService';
import { useProducts } from '../../hooks/useProducts';
import { useSprints } from '../../hooks/useSprints';

const Roadmap = () => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  
  // Estados locales
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);
  const [editingSprint, setEditingSprint] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // timeline, kanban, dependencies
  const [showHistory, setShowHistory] = useState(null); // Release para mostrar historial
  const [showVersionManager, setShowVersionManager] = useState(null); // Release para gestionar versión
  const [showBurndown, setShowBurndown] = useState(null); // Sprint para mostrar burndown
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    prioridad: '',
    fechaDesde: '',
    fechaHasta: '',
    responsable: ''
  });
  const [alerts, setAlerts] = useState([]);

  // ✅ Usar custom hooks con caché
  const { products: productos, loading: loadingProducts } = useProducts();
  const { sprints, loading: loadingSprints } = useSprints(selectedProduct);

  // Función para agregar alertas
  const addAlert = (message, type = 'info') => {
    const id = Date.now();
    const newAlert = { id, message, type };
    setAlerts(prev => [...prev, newAlert]);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Función para calcular el progreso real del release
  // Función para normalizar estados basándose en fechas y contexto
  const normalizarEstadoRelease = (release) => {
    const ahora = new Date();
    const fechaObjetivo = release.fecha_objetivo ? new Date(release.fecha_objetivo) : null;
    const fechaLanzamiento = release.fecha_lanzamiento ? new Date(release.fecha_lanzamiento) : null;
    
    // Si tiene fecha de lanzamiento, debería estar lanzado
    if (fechaLanzamiento) {
      return { ...release, estado: 'lanzado', progreso: 100 };
    }
    
    // Si pasó la fecha objetivo sin lanzarse, marcar como retrasado
    if (fechaObjetivo && ahora > fechaObjetivo && release.estado !== 'lanzado') {
      return { ...release, estado: 'retrasado' };
    }
    
    // Si está cerca de la fecha objetivo, marcar como en desarrollo
    if (fechaObjetivo && release.estado === 'planificado') {
      const diasHastaObjetivo = Math.ceil((fechaObjetivo - ahora) / (1000 * 60 * 60 * 24));
      if (diasHastaObjetivo <= 30) {
        return { ...release, estado: 'en_desarrollo' };
      }
    }
    
    return release;
  };

  const calcularProgresoReal = (release) => {
    // Si está lanzado, completado o released, progreso es 100%
    if (release.estado === 'lanzado' || release.estado === 'completado' || release.estado === 'released') {
      return 100;
    }
    
    // Si tiene progreso definido y es mayor a 0, usarlo
    if (release.progreso && release.progreso > 0) {
      return release.progreso;
    }
    
    // Si no tiene progreso definido, calcularlo basado en tiempo transcurrido
    if (release.fecha_objetivo) {
      const ahora = new Date();
      const fechaObjetivo = new Date(release.fecha_objetivo);
      const fechaInicio = new Date(release.created_at || release.fecha_inicio);
      
      if (fechaInicio < ahora && ahora < fechaObjetivo) {
        // Calcular progreso basado en tiempo transcurrido
        const tiempoTotal = fechaObjetivo - fechaInicio;
        const tiempoTranscurrido = ahora - fechaInicio;
        const progresoEstimado = Math.min(Math.round((tiempoTranscurrido / tiempoTotal) * 100), 95);
        
        // Asignar progreso mínimo según el estado
        if (release.estado === 'en_desarrollo') {
          return Math.max(progresoEstimado, 25); // Mínimo 25% si está en desarrollo
        } else if (release.estado === 'planificado') {
          return Math.max(progresoEstimado, 10); // Mínimo 10% si está planificado
        }
        
        return progresoEstimado;
      } else if (ahora >= fechaObjetivo) {
        // Si ya pasó la fecha objetivo pero no está lanzado, 95%
        return 95;
      }
    }
    
    // Fallback: progreso mínimo según estado
    switch (release.estado) {
      case 'en_desarrollo':
        return 25;
      case 'planificado':
        return 10;
      default:
        return 0;
    }
  };

  // ✅ OPTIMIZADO: Usar useCallback para cargarReleases
  const cargarReleases = useCallback(async () => {
    if (!selectedProduct) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Incluir tareas en el roadmap
      const releasesData = await productOwnerService.getReleases({
        producto: selectedProduct,
        includeTasks: 'true'
      }, getToken);

      setReleases(releasesData.releases || releasesData.data || []);
      
      // Guardar las tareas de sprints en estado
      if (releasesData.sprintTasks) {
        const tasksMap = releasesData.sprintTasks.reduce((acc, sprintTask) => {
          acc[sprintTask.sprintId] = {
            tasks: sprintTask.tasks,
            metrics: sprintTask.metrics
          };
          return acc;
        }, {});
        
        sessionStorage.setItem('roadmap_sprint_tasks', JSON.stringify(tasksMap));
      }
    } catch (error) {
      console.error('Error al cargar releases:', error);
      setError('Error al cargar releases del roadmap');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, getToken]);

  // ✅ OPTIMIZADO: Solo cargar releases cuando cambia el producto
  useEffect(() => {
    cargarReleases();
  }, [cargarReleases]);

  const crearRelease = async (formData) => {
    try {
      console.log('=== Creating Release ===');
      console.log('Form data received:', formData);
      console.log('Selected product:', selectedProduct);
      
      if (!selectedProduct) {
        throw new Error('Debe seleccionar un producto antes de crear un release');
      }
      
      const dataToSend = { ...formData, producto: selectedProduct };
      console.log('Data to send:', dataToSend);
      
      const response = await productOwnerService.createRelease(dataToSend, getToken);

      console.log('Success response:', response);
      
      await cargarReleases();
      setShowReleaseModal(false);
      addAlert('Release creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creating release:', error);
      setError(error.message);
      addAlert(error.message || 'Error al crear release', 'error');
    }
  };

  const actualizarRelease = async (id, formData) => {
    try {
      await productOwnerService.updateRelease(id, formData, getToken);
      await cargarReleases();
      setEditingRelease(null);
      addAlert('Release actualizado exitosamente', 'success');
    } catch (error) {
      setError(error.message);
      addAlert(error.message || 'Error al actualizar release', 'error');
    }
  };

  const actualizarSprint = async (id, formData) => {
    try {
      console.log('=== Updating Sprint ===');
      console.log('Sprint ID:', id);
      console.log('Form data:', formData);

      if (formData.release_id && !releases.find(r => r._id === formData.release_id)) {
        throw new Error('Release seleccionado no es válido');
      }

      const dataToSend = { 
        ...formData,
        velocidad_planificada: parseInt(formData.velocidad_planificada) || 0,
        capacidad_equipo: parseInt(formData.capacidad_equipo) || 0,
        progreso: parseInt(formData.progreso) || 0
      };

      await productOwnerService.updateSprint(id, dataToSend, getToken);
      
      console.log('Sprint updated successfully');
      
      await cargarReleases();
      setEditingSprint(null);
      addAlert('Sprint actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error updating sprint:', error);
      addAlert(error.message || 'Error al actualizar sprint', 'error');
    }
  };

  const eliminarRelease = async (id) => {
    if (!confirm('¿Está seguro de eliminar este release?')) return;

    try {
      await productOwnerService.deleteRelease(id, getToken);
      await cargarReleases();
      addAlert('Release eliminado exitosamente', 'success');
    } catch (error) {
      setError(error.message);
      addAlert(error.message || 'Error al eliminar release', 'error');
    }
  };

  const eliminarSprint = async (id) => {
    if (!confirm('¿Está seguro de eliminar este sprint? Esta acción no se puede deshacer.')) return;

    try {
      await productOwnerService.deleteSprint(id, getToken);
      await cargarReleases();
      addAlert('Sprint eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando sprint:', error);
      addAlert(error.message || 'Error al eliminar sprint', 'error');
    }
  };

  const manejarCambioVersion = async (datosVersion) => {
    try {
      const token = await getToken();
      
      // Crear nuevo release con la nueva versión
      const nuevoRelease = {
        ...showVersionManager,
        version: datosVersion.version,
        estado: 'planificado',
        progreso: 0,
        notas_version: datosVersion.notas,
        release_padre: showVersionManager._id,
        nombre: `${showVersionManager.nombre} v${datosVersion.version}`,
        fecha_objetivo: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 días por defecto
      };

      const response = await fetch(`${API_BASE_URL}/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoRelease)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear nueva versión');
      }

      addAlert(
        `Nueva versión ${datosVersion.version} creada exitosamente`, 
        'success'
      );
      
      setShowVersionManager(null);
      await cargarReleases();
    } catch (error) {
      console.error('Error al crear versión:', error);
      addAlert(error.message || 'Error al crear nueva versión', 'error');
    }
  };

  const crearSprint = async (formData) => {
    try {
      console.log('=== Creating Sprint ===');
      console.log('Form data received:', formData);
      console.log('Selected product:', selectedProduct);
      
      if (!selectedProduct) {
        throw new Error('Debe seleccionar un producto antes de crear un sprint');
      }
      
      if (formData.release_id && !releases.find(r => r._id === formData.release_id)) {
        throw new Error('Release seleccionado no es válido');
      }
      
      const dataToSend = { 
        ...formData, 
        producto: selectedProduct,
        velocidad_planificada: parseInt(formData.velocidad_planificada) || 0,
        capacidad_equipo: parseInt(formData.capacidad_equipo) || 0,
        progreso: parseInt(formData.progreso) || 0
      };
      console.log('Data to send:', dataToSend);
      
      const result = await productOwnerService.createSprint(dataToSend, getToken);
      console.log('Success response:', result);
      
      await cargarReleases();
      setShowSprintModal(false);
      addAlert('Sprint creado exitosamente', 'success');
      console.log('Sprint creation completed successfully');
    } catch (error) {
      console.error('Error creating sprint:', error);
      setError(error.message);
      addAlert(error.message || 'Error al crear sprint', 'error');
    }
  };

  const cambiarEstadoSprint = async (sprintId, accion) => {
    try {
      const estadoMap = {
        'activate': 'activo',
        'complete': 'completado',
        'cancel': 'cancelado'
      };
      
      const nuevoEstado = estadoMap[accion] || accion;
      const dataToUpdate = { estado: nuevoEstado };
      
      if (accion === 'complete') {
        dataToUpdate.velocidad_real = 0;
      }

      await productOwnerService.updateSprint(sprintId, dataToUpdate, getToken);
      await cargarReleases();
      addAlert(`Sprint ${nuevoEstado} exitosamente`, 'success');
    } catch (error) {
      setError(error.message);
      addAlert(error.message || `Error al cambiar estado del sprint`, 'error');
    }
  };

  const cambiarEstadoRelease = async (releaseId, nuevoEstado) => {
    try {
      console.log('Cambiando estado:', { releaseId, nuevoEstado });
      
      const dataToUpdate = { 
        estado: nuevoEstado,
        notas: `Estado cambiado a ${nuevoEstado} desde Kanban`
      };

      const data = await productOwnerService.updateRelease(releaseId, dataToUpdate, getToken);
      console.log('Estado actualizado:', data);

      addAlert(`Release actualizado a ${nuevoEstado}`, 'success');
      await cargarReleases();
      
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      addAlert(error.message || 'Error al cambiar estado del release', 'error');
      setError(error.message);
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      planificado: 'bg-blue-100 text-blue-800',
      en_desarrollo: 'bg-yellow-100 text-yellow-800',
      activo: 'bg-green-100 text-green-800',
      lanzado: 'bg-purple-100 text-purple-800',
      completado: 'bg-green-100 text-green-800',
      retrasado: 'bg-red-100 text-red-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Normalizar estados antes del filtrado
  const releasesNormalizados = releases.map(normalizarEstadoRelease);

  const filteredReleases = releasesNormalizados.filter(release => {
    if (filters.search && !release.nombre.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.estado && release.estado !== filters.estado) return false;
    if (filters.prioridad && release.prioridad !== filters.prioridad) return false;
    if (filters.fechaDesde && new Date(release.fecha_objetivo) < new Date(filters.fechaDesde)) return false;
    if (filters.fechaHasta && new Date(release.fecha_objetivo) > new Date(filters.fechaHasta)) return false;
    return true;
  });

  const filteredSprints = sprints.filter(sprint => {
    if (filters.search && !sprint.nombre.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.estado && sprint.estado !== filters.estado) return false;
    if (filters.fechaDesde && new Date(sprint.fecha_inicio) < new Date(filters.fechaDesde)) return false;
    if (filters.fechaHasta && new Date(sprint.fecha_fin) > new Date(filters.fechaHasta)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow-sm p-6 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-gray-800 to-gray-900'
          : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Roadmap</h1>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Visualiza la hoja de ruta del producto
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Selector de vista */}
            <div className={`flex rounded-lg border ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                  viewMode === 'timeline' 
                    ? 'bg-purple-600 text-white' 
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'kanban' 
                    ? 'bg-purple-600 text-white' 
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('dependencies')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'dependencies' 
                    ? 'bg-purple-600 text-white' 
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dependencias
              </button>
            </div>

            {selectedProduct && (
              <>
                <button
                  onClick={() => setShowSprintModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  Nuevo Sprint
                </button>
                <button
                  onClick={() => setShowReleaseModal(true)}
                  disabled={!selectedProduct}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedProduct 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!selectedProduct ? 'Selecciona un producto primero' : ''}
                >
                  <Plus size={20} />
                  Nuevo Release
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selector de producto */}
        <div className="flex items-center gap-4">
          <label className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Producto:</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 bg-white text-gray-900'
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {selectedProduct ? (
        <>
          {/* Sistema de Alertas */}
          <AlertSystem releases={releases} sprints={sprints} alerts={alerts} />
          
          {/* Filtros Avanzados */}
          <AdvancedFilters onFilterChange={handleFilterChange} />

          {/* Métricas Avanzadas */}
          <AdvancedMetrics releases={filteredReleases} sprints={filteredSprints} />

          {/* Vista de roadmap */}
          {viewMode === 'timeline' ? (
            <TimelineWithMilestones 
              releases={filteredReleases} 
              sprints={filteredSprints}
              onEditRelease={setEditingRelease}
              onDeleteRelease={eliminarRelease}
              onEditSprint={setEditingSprint}
              onDeleteSprint={eliminarSprint}
              onSprintAction={cambiarEstadoSprint}
              onReleaseAction={cambiarEstadoRelease}
              onShowBurndown={setShowBurndown}
              getEstadoColor={getEstadoColor}
              formatearFecha={formatearFecha}
              calcularProgresoReal={calcularProgresoReal}
            />
          ) : viewMode === 'kanban' ? (
            <KanbanView 
              releases={filteredReleases}
              sprints={filteredSprints}
              onEditRelease={setEditingRelease}
              onDeleteRelease={eliminarRelease}
              onEditSprint={setEditingSprint}
              onDeleteSprint={eliminarSprint}
              onSprintAction={cambiarEstadoSprint}
              onReleaseAction={cambiarEstadoRelease}
              onShowHistory={setShowHistory}
              onShowVersionManager={setShowVersionManager}
              onShowBurndown={setShowBurndown}
              getEstadoColor={getEstadoColor}
              formatearFecha={formatearFecha}
              calcularProgresoReal={calcularProgresoReal}
              theme={theme}
            />
          ) : (
            <DependencyView 
              releases={filteredReleases}
              sprints={filteredSprints}
            />
          )}
        </>
      ) : (
        <div className={`rounded-lg shadow-sm p-12 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center max-w-md mx-auto">
            <Calendar className={`h-16 w-16 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h2 className={`text-xl font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-700'
            }`}>
              Selecciona un producto
            </h2>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              Elige un producto del menú desplegable para ver su roadmap
            </p>
          </div>
        </div>
      )}

      {/* Modales */}
      {showReleaseModal && (
        <ReleaseModal
          onClose={() => setShowReleaseModal(false)}
          onSave={crearRelease}
        />
      )}

      {showSprintModal && (
        <SprintModal
          onClose={() => setShowSprintModal(false)}
          onSave={crearSprint}
          releases={releases}
        />
      )}

      {editingSprint && (
        <SprintModal
          sprint={editingSprint}
          onClose={() => setEditingSprint(null)}
          onSave={(data) => actualizarSprint(editingSprint._id, data)}
          releases={releases}
        />
      )}

      {editingRelease && (
        <ReleaseModal
          release={editingRelease}
          onClose={() => setEditingRelease(null)}
          onSave={(data) => actualizarRelease(editingRelease._id, data)}
        />
      )}

      {/* Modal de Historial */}
      {showHistory && (
        <ReleaseHistoryModal
          release={showHistory}
          onClose={() => setShowHistory(null)}
        />
      )}

      {/* Modal de Gestión de Versiones */}
      {showVersionManager && (
        <VersionManager
          release={showVersionManager}
          onVersionChange={manejarCambioVersion}
          onClose={() => setShowVersionManager(null)}
        />
      )}

      {/* Modal de Burndown Chart */}
      {showBurndown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <BurndownChart 
                sprintId={showBurndown}
                onClose={() => setShowBurndown(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente TimelineView
const TimelineView = ({ 
  releases, 
  sprints, 
  onEditRelease, 
  onDeleteRelease,
  onEditSprint,
  onDeleteSprint,
  onSprintAction,
  getEstadoColor, 
  formatearFecha,
  calcularProgresoReal,
  theme
}) => {
  return (
    <div className={`rounded-lg shadow-sm p-6 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h3 className={`text-lg font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Vista Timeline</h3>      <div className="space-y-8">
        {releases.map(release => (
          <div key={release._id} className="border-l-4 border-purple-200 pl-6 relative">
            {/* Línea temporal */}
            <div className="absolute left-0 top-0 w-3 h-3 bg-purple-600 rounded-full -translate-x-1.5"></div>
            
            {/* Contenido del release */}
            <div className={`rounded-lg p-4 mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{release.nombre}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(release.estado)}`}>
                    {release.estado.replace('_', ' ')}
                  </span>
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>v{release.version}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditRelease(release)}
                    className={`p-1 ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-blue-400'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteRelease(release._id)}
                    className={`p-1 ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-red-400'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className={`mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{release.descripcion}</p>
              
              <div className="flex items-center gap-6 mb-3">
                <div className={`flex items-center gap-2 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Calendar size={16} />
                  <span>Objetivo: {formatearFecha(release.fecha_objetivo)}</span>
                </div>
                {release.fecha_lanzamiento && (
                  <div className={`flex items-center gap-2 text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <CheckCircle size={16} />
                    <span>Lanzado: {formatearFecha(release.fecha_lanzamiento)}</span>
                  </div>
                )}
              </div>
              
              {/* Barra de progreso */}
              <div className="mb-4">
                <div className={`flex justify-between text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <span>Progreso</span>
                  <span>{calcularProgresoReal(release)}%</span>
                </div>
                <div className={`w-full rounded-full h-2 ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calcularProgresoReal(release)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Sprints del release */}
            <div className="ml-4 space-y-3">
              {sprints
                .filter(sprint => release.sprints?.includes(sprint._id))
                .map(sprint => (
                  <SprintCard 
                    key={sprint._id}
                    sprint={sprint}
                    onEdit={onEditSprint}
                    onDelete={onDeleteSprint}
                    onAction={onSprintAction}
                    onShowBurndown={setShowBurndown}
                    getEstadoColor={getEstadoColor}
                    formatearFecha={formatearFecha}
                    theme={theme}
                  />
                ))}
            </div>
          </div>
        ))}
        
        {/* Sprints sin release asignado */}
        {sprints.filter(sprint => !releases.some(release => release.sprints?.includes(sprint._id))).length > 0 && (
          <div className="border-l-4 border-blue-200 pl-6 relative">
            <div className="absolute left-0 top-0 w-3 h-3 bg-blue-600 rounded-full -translate-x-1.5"></div>
            <div className={`rounded-lg p-4 mb-4 ${
              theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50'
            }`}>
              <h4 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Sprints Independientes</h4>
              <div className="space-y-3">
                {sprints
                  .filter(sprint => !releases.some(release => release.sprints?.includes(sprint._id)))
                  .map(sprint => (
                    <SprintCard 
                      key={sprint._id}
                      sprint={sprint}
                      onEdit={onEditSprint}
                      onDelete={onDeleteSprint}
                      onAction={onSprintAction}
                      onShowBurndown={setShowBurndown}
                      getEstadoColor={getEstadoColor}
                      formatearFecha={formatearFecha}
                      theme={theme}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
        
        {releases.length === 0 && sprints.length === 0 && (
          <div className="text-center py-12">
            <Target className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              No hay releases ni sprints creados aún
            </p>
          </div>
        )}
        
        {releases.length === 0 && sprints.length > 0 && (
          <div className="text-center py-8">
            <div className={`border-l-4 pl-6 relative max-w-2xl mx-auto ${
              theme === 'dark' ? 'border-blue-800' : 'border-blue-200'
            }`}>
              <div className={`absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-1.5 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-blue-600'
              }`}></div>
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Sprints Existentes</h4>
                <div className="space-y-3">
                  {sprints.map(sprint => (
                    <SprintCard 
                      key={sprint._id}
                      sprint={sprint}
                      onEdit={onEditSprint}
                      onDelete={onDeleteSprint}
                      onAction={onSprintAction}
                      onShowBurndown={setShowBurndown}
                      getEstadoColor={getEstadoColor}
                      formatearFecha={formatearFecha}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente KanbanView
const KanbanView = ({ 
  releases,
  sprints,
  onEditRelease, 
  onDeleteRelease,
  onEditSprint,
  onDeleteSprint,
  onSprintAction,
  onReleaseAction,
  onShowHistory,
  onShowVersionManager,
  onShowBurndown,
  getEstadoColor, 
  formatearFecha,
  calcularProgresoReal,
  theme
}) => {
  const estados = ['planificado', 'en_desarrollo', 'lanzado'];
  
  const getProximoEstado = (estadoActual) => {
    const index = estados.indexOf(estadoActual);
    return index < estados.length - 1 ? estados[index + 1] : null;
  };

  const getEstadoAnterior = (estadoActual) => {
    const index = estados.indexOf(estadoActual);
    return index > 0 ? estados[index - 1] : null;
  };

  const getAccionTexto = (estado) => {
    switch(estado) {
      case 'en_desarrollo': return 'Iniciar Desarrollo';
      case 'lanzado': return 'Lanzar';
      default: return 'Avanzar';
    }
  };

  const getAccionTextoAnterior = (estado) => {
    switch(estado) {
      case 'planificado': return 'Volver a Planificado';
      case 'en_desarrollo': return 'Volver a Desarrollo';
      default: return 'Retroceder';
    }
  };
  
  return (
    <div className={`rounded-lg shadow-sm p-6 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h3 className={`text-lg font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Vista Kanban</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {estados.map(estado => (
          <div key={estado} className={`rounded-lg p-4 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <h4 className={`font-semibold mb-4 capitalize ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {estado.replace('_', ' ')}
            </h4>
            
            <div className="space-y-3">
              {releases
                .filter(release => release.estado === estado)
                .map(release => (
                  <div key={release._id} className={`rounded-lg p-4 shadow-sm border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{release.nombre}</h5>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onShowHistory && onShowHistory(release)}
                          className={`p-1 ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-purple-400'
                              : 'text-gray-600 hover:text-purple-600'
                          }`}
                          title="Ver historial"
                        >
                          <History size={14} />
                        </button>
                        {onShowVersionManager && (
                          <button
                            onClick={() => onShowVersionManager(release)}
                            className={`p-1 ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-green-400'
                                : 'text-gray-600 hover:text-green-600'
                            }`}
                            title="Gestionar versión"
                          >
                            {Tag ? <Tag size={14} /> : <Hash size={14} />}
                          </button>
                        )}
                        <button
                          onClick={() => onEditRelease(release)}
                          className={`p-1 ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-blue-400'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                          title="Editar release"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteRelease(release._id)}
                          className={`p-1 ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-red-400'
                              : 'text-gray-600 hover:text-red-600'
                          }`}
                          title="Eliminar release"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>v{release.version}</p>
                    <p className={`text-xs mb-3 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>{release.descripcion}</p>
                    
                    <div className={`flex items-center justify-between text-xs mb-3 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <span>{formatearFecha(release.fecha_objetivo)}</span>
                      <span>{calcularProgresoReal(release)}%</span>
                    </div>
                    
                    <div className={`w-full rounded-full h-1 mb-3 ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="bg-purple-600 h-1 rounded-full"
                        style={{ width: `${calcularProgresoReal(release)}%` }}
                      ></div>
                    </div>

                    {/* Botones de Transición */}
                    <div className="flex gap-2 mt-3">
                      {getEstadoAnterior(release.estado) && (
                        <button
                          onClick={() => onReleaseAction(release._id, getEstadoAnterior(release.estado))}
                          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                            theme === 'dark'
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={getAccionTextoAnterior(getEstadoAnterior(release.estado))}
                        >
                          ← {getEstadoAnterior(release.estado).replace('_', ' ')}
                        </button>
                      )}
                      
                      {getProximoEstado(release.estado) && (
                        <button
                          onClick={() => onReleaseAction(release._id, getProximoEstado(release.estado))}
                          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                            getProximoEstado(release.estado) === 'en_desarrollo' 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : getProximoEstado(release.estado) === 'lanzado'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title={getAccionTexto(getProximoEstado(release.estado))}
                        >
                          {getProximoEstado(release.estado).replace('_', ' ')} →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              
              {releases.filter(r => r.estado === estado).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Target size={24} className="mx-auto mb-2" />
                  <p className="text-sm">No hay releases</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente SprintCard
const SprintCard = ({ 
  sprint, 
  onEdit,
  onDelete,
  onAction,
  onShowBurndown, 
  getEstadoColor, 
  formatearFecha,
  theme
}) => {
  return (
    <div className={`border rounded-lg p-4 ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-600'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-blue-600" />
          <h5 className={`font-medium ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{sprint.nombre}</h5>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(sprint.estado)}`}>
            {sprint.estado}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Botón de Burndown - Siempre visible */}
          <button
            onClick={() => onShowBurndown(sprint._id)}
            className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
            title="Ver Burndown Chart"
          >
            <Activity size={16} />
          </button>
          
          {sprint.estado === 'planificado' && (
            <button
              onClick={() => onAction(sprint._id, 'start')}
              className="p-1 text-green-600 hover:text-green-700"
              title="Iniciar sprint"
            >
              <PlayCircle size={16} />
            </button>
          )}
          {sprint.estado === 'activo' && (
            <button
              onClick={() => onAction(sprint._id, 'complete')}
              className="p-1 text-blue-600 hover:text-blue-700"
              title="Completar sprint"
            >
              <CheckCircle size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(sprint)}
            className={`p-1 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-blue-400'
                : 'text-gray-600 hover:text-blue-600'
            }`}
            title="Editar sprint"
          >
            <Edit size={14} />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(sprint._id)}
              className={`p-1 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}
              title="Eliminar sprint"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      
      <p className={`text-sm mb-3 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>{sprint.objetivo}</p>
      
      <div className={`flex items-center justify-between text-xs ${
        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
      }`}>
        <span>{formatearFecha(sprint.fecha_inicio)} - {formatearFecha(sprint.fecha_fin)}</span>
        <span>Velocidad: {sprint.velocidad_planificada}</span>
      </div>
    </div>
  );
};

export default Roadmap;