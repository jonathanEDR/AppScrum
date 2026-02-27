import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { 
  X, 
  Plus, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  Users,
  Calendar,
  Target,
  BookOpen,
  Clock
} from 'lucide-react';
import { scrumMasterService } from '../../services/scrumMasterService';
import BaseModalScrumMaster, { DateField } from './modalScrumMaster/BaseModalScrumMaster';

const AssignStoryModal = ({ 
  isOpen, 
  onClose, 
  sprint, 
  teamMembers = [],
  onStoryAssigned 
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [availableStories, setAvailableStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStory, setSelectedStory] = useState(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [fechaAsignacion, setFechaAsignacion] = useState('');
  const [fechaEstimadaFinalizacion, setFechaEstimadaFinalizacion] = useState('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');

  // Configuraciones
  const prioridadConfig = {
    muy_alta: { 
      label: 'Muy Alta', 
      color: theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800', 
      order: 1 
    },
    alta: { 
      label: 'Alta', 
      color: theme === 'dark' ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-800', 
      order: 2 
    },
    media: { 
      label: 'Media', 
      color: theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800', 
      order: 3 
    },
    baja: { 
      label: 'Baja', 
      color: theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800', 
      order: 4 
    }
  };

  const tipoConfig = {
    historia: { 
      label: 'Historia', 
      color: theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800' 
    },
    tarea: { 
      label: 'Tarea', 
      color: theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800' 
    },
    bug: { 
      label: 'Bug', 
      color: theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800' 
    },
    mejora: { 
      label: 'Mejora', 
      color: theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800' 
    }
  };

  // Establecer fechas automáticas
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setFechaAsignacion(today);
      
      // Calcular fecha estimada basada en la duración del sprint
      if (sprint?.fecha_fin) {
        setFechaEstimadaFinalizacion(sprint.fecha_fin);
      } else {
        // Si no hay fecha fin del sprint, usar 2 semanas por defecto
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
        setFechaEstimadaFinalizacion(twoWeeksLater.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, sprint]);

  useEffect(() => {
    if (isOpen && sprint) {
      fetchAvailableStories();
    }
  }, [isOpen, sprint]);

  const fetchAvailableStories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {};
      if (filterPriority) filters.prioridad = filterPriority;
      if (filterType) filters.tipo = filterType;
      
      console.log('Fetching available stories for sprint:', sprint?._id);
      
      const data = await scrumMasterService.getAvailableStories(sprint._id, filters, getToken);
      console.log('Stories received:', data.stories?.length || 0);
      setAvailableStories(data.stories || []);
    } catch (error) {
      console.error('Error fetching available stories:', error);
      setError('Error al cargar historias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStory = async () => {
    if (!selectedStory) return;

    try {
      setAssigning(true);
      
      const data = await scrumMasterService.assignStoryToSprint(
        sprint._id,
        {
          storyId: selectedStory._id,
          assignedTo: assignedTo || undefined,
          fechaAsignacion: fechaAsignacion,
          fechaEstimadaFinalizacion: fechaEstimadaFinalizacion
        },
        getToken
      );

      // Remover la historia de la lista de disponibles
      setAvailableStories(prev => 
        prev.filter(story => story._id !== selectedStory._id)
      );
      
      // Notificar al componente padre
      if (onStoryAssigned) {
        onStoryAssigned(data.story);
      }
      
      // Reset form
      setSelectedStory(null);
      setAssignedTo('');
    } catch (error) {
      console.error('Error assigning story:', error);
      setError('Error al asignar historia: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedStory(null);
    setAssignedTo('');
    setError('');
    setSearchTerm('');
    setFilterPriority('');
    setFilterType('');
    onClose();
  };

  // Filtrar historias por término de búsqueda
  const filteredStories = availableStories.filter(story => {
    const matchesSearch = searchTerm === '' || 
      story.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <BaseModalScrumMaster
      isOpen={isOpen}
      onClose={handleClose}
      title="Asignar Historia al Sprint"
      subtitle={`Sprint: ${sprint?.nombre || 'Sin nombre'}`}
      icon={BookOpen}
      maxWidth="sm:max-w-6xl"
      showDivider={true}
    >
      {/* Panel Izquierdo - Lista de Historias */}
      <div className={`flex-1 p-6 border-r ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Search className="h-5 w-5 text-blue-600" />
            Historias Disponibles
          </h3>

          {/* Filtros y búsqueda */}
          <div className="space-y-3">
            <div className="relative">
              <Search className={`absolute left-3 top-3 h-4 w-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Buscar historias por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">🔍 Todas las prioridades</option>
                {Object.entries(prioridadConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">📋 Todos los tipos</option>
                {Object.entries(tipoConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={fetchAvailableStories}
              disabled={loading}
              className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {loading ? 'Cargando...' : 'Aplicar Filtros'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Lista de historias */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando historias...</span>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay historias disponibles</p>
                <p className="text-sm text-gray-400 mt-1">
                  Todas las historias ya están asignadas o no cumplen los filtros
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">
                  📊 {filteredStories.length} historias disponibles
                </p>
                
                {filteredStories.map(story => (
                  <div
                    key={story._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedStory?._id === story._id
                        ? theme === 'dark'
                          ? 'border-blue-600 bg-blue-900/20 shadow-md'
                          : 'border-blue-500 bg-blue-50 shadow-md'
                        : theme === 'dark'
                          ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedStory(story)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {story.titulo}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${prioridadConfig[story.prioridad]?.color || (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
                          {prioridadConfig[story.prioridad]?.label || story.prioridad}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {story.puntos_historia} SP
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-2 line-clamp-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {story.descripcion}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-1 rounded ${tipoConfig[story.tipo]?.color || (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
                        {tipoConfig[story.tipo]?.label || story.tipo}
                      </span>
                      
                      {story.asignado_a && (
                        <div className={`flex items-center gap-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <User className="h-3 w-3" />
                          <span>
                            {story.asignado_a.firstName} {story.asignado_a.lastName}
                          </span>
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

      {/* Panel Derecho - Detalles de Asignación y Fechas */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Target className="h-5 w-5 text-blue-600" />
            Detalles de Asignación
          </h3>
          
          {selectedStory ? (
            <div className="space-y-4">
              {/* Historia seleccionada */}
              <div className={`p-4 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-blue-700'
                  : 'bg-white border-blue-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📋 {selectedStory.titulo}
                </h4>
                <p className={`text-sm mb-3 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {selectedStory.descripcion}
                </p>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs ${prioridadConfig[selectedStory.prioridad]?.color}`}>
                    {prioridadConfig[selectedStory.prioridad]?.label}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${tipoConfig[selectedStory.tipo]?.color}`}>
                    {tipoConfig[selectedStory.tipo]?.label}
                  </span>
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedStory.puntos_historia} SP
                  </span>
                </div>
              </div>

              {/* Fechas de Asignación */}
              <div className="space-y-4">
                <DateField
                  label="Fecha de Asignación"
                  value={fechaAsignacion}
                  onChange={(e) => setFechaAsignacion(e.target.value)}
                  required={true}
                  help="Fecha cuando se asigna la historia al sprint"
                />

                <DateField
                  label="Fecha Estimada de Finalización"
                  value={fechaEstimadaFinalizacion}
                  onChange={(e) => setFechaEstimadaFinalizacion(e.target.value)}
                  min={fechaAsignacion}
                  help="Fecha estimada para completar la historia"
                />
              </div>

              {/* Asignar a miembro del equipo */}
              {teamMembers.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Asignar a Desarrollador
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Sin asignar (se asignará después)</option>
                      {teamMembers.map(member => (
                        <option key={member._id} value={member._id}>
                          👤 {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Botón de asignación */}
              <button
                onClick={handleAssignStory}
                disabled={assigning}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {assigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Asignando historia...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Asignar al Sprint
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <CheckCircle className={`h-12 w-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p>Selecciona una historia</p>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Haz clic en una historia de la izquierda para asignarla
              </p>
            </div>
          )}

          {/* Info del sprint */}
          <div className={`p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-blue-900/20 border-blue-700'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h4 className={`font-medium mb-2 flex items-center gap-2 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-900'
            }`}>
              <Calendar className="h-4 w-4" />
              Información del Sprint
            </h4>
            <div className={`text-sm space-y-1 ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
            }`}>
              <p><strong>Sprint:</strong> {sprint?.nombre}</p>
              <p><strong>Duración:</strong> {new Date(sprint?.fecha_inicio).toLocaleDateString()} - {new Date(sprint?.fecha_fin).toLocaleDateString()}</p>
              <p><strong>Equipo:</strong> {teamMembers.length} desarrolladores</p>
            </div>
          </div>
        </div>
      </div>
    </BaseModalScrumMaster>
  );
};

export default AssignStoryModal;
