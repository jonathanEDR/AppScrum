import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { scrumMasterService } from '../../services/scrumMasterService';
import { 
  X, 
  User, 
  UserPlus,
  AlertCircle, 
  CheckCircle, 
  CheckSquare,
  Bug,
  Settings,
  Loader2
} from 'lucide-react';

const AssignUserToTechnicalItemModal = ({ 
  isOpen, 
  onClose, 
  technicalItem, 
  onAssignSuccess 
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDevelopers, setFetchingDevelopers] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDevelopers();
      // Pre-seleccionar el usuario actual si existe
      setSelectedUserId(technicalItem?.asignado_a?._id || '');
      setError('');
    }
  }, [isOpen, technicalItem]);

  const fetchDevelopers = async () => {
    try {
      setFetchingDevelopers(true);
      
      const data = await scrumMasterService.getTeamMembers({}, getToken);
      
      // Filtrar solo developers
      const devs = (data.members || [])
        .filter(member => member.role === 'developer' || member.role === 'developers')
        .map(member => ({
          _id: member.user._id,
          nombre_negocio: member.user.nombre_negocio || member.user.email,
          email: member.user.email,
          role: member.role
        }));
      
      setDevelopers(devs);
    } catch (error) {
      console.error('Error fetching developers:', error);
      setError('Error al cargar la lista de developers');
    } finally {
      setFetchingDevelopers(false);
    }
  };

  const handleAssign = async () => {
    if (!technicalItem) return;

    try {
      setLoading(true);
      setError('');

      const result = await scrumMasterService.assignUserToItem(
        technicalItem._id,
        selectedUserId || null,
        getToken
      );

      // Notificar éxito y cerrar modal
      onAssignSuccess(result);
      onClose();

    } catch (error) {
      console.error('Error asignando usuario:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeInfo = (type) => {
    const isDark = theme === 'dark';
    switch (type) {
      case 'tarea':
        return { 
          label: 'Tarea', 
          icon: CheckSquare,
          color: isDark ? 'text-purple-400' : 'text-purple-600', 
          bgColor: isDark ? 'bg-purple-900/30' : 'bg-purple-100' 
        };
      case 'bug':
        return { 
          label: 'Bug', 
          icon: Bug,
          color: isDark ? 'text-red-400' : 'text-red-600', 
          bgColor: isDark ? 'bg-red-900/30' : 'bg-red-100' 
        };
      case 'mejora':
        return { 
          label: 'Mejora', 
          icon: Settings,
          color: isDark ? 'text-green-400' : 'text-green-600', 
          bgColor: isDark ? 'bg-green-900/30' : 'bg-green-100' 
        };
      default:
        return { 
          label: 'Item', 
          icon: CheckSquare,
          color: isDark ? 'text-gray-400' : 'text-gray-600', 
          bgColor: isDark ? 'bg-gray-700' : 'bg-gray-100' 
        };
    }
  };

  const getPriorityColor = (priority) => {
    const isDark = theme === 'dark';
    switch (priority) {
      case 'critica':
      case 'muy_alta':
        return isDark ? 'text-red-400' : 'text-red-700';
      case 'alta':
        return isDark ? 'text-orange-400' : 'text-orange-600';
      case 'media':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'baja':
        return isDark ? 'text-green-400' : 'text-green-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critica': return 'Crítica';
      case 'muy_alta': return 'Muy Alta';
      case 'alta': return 'Alta';
      case 'media': return 'Media';
      case 'baja': return 'Baja';
      default: return 'Media';
    }
  };

  if (!isOpen || !technicalItem) return null;

  const typeInfo = getItemTypeInfo(technicalItem.tipo);
  const TypeIcon = typeInfo.icon;
  const currentUser = developers.find(dev => dev._id === technicalItem.asignado_a?._id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark'
            ? 'border-gray-700 bg-gradient-to-r from-orange-900/20 to-red-900/20'
            : 'border-gray-200 bg-gradient-to-r from-orange-50 to-red-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${typeInfo.bgColor}`}>
              <TypeIcon className={`h-6 w-6 ${typeInfo.color}`} />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Asignar Usuario a {typeInfo.label}
              </h3>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Selecciona un developer para asignar este item técnico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Información del item técnico */}
          <div className={`rounded-lg p-5 border ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <CheckCircle className="h-5 w-5 text-orange-500" />
              Item Técnico
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
                <div className="flex-1">
                  <h5 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{technicalItem.titulo}</h5>
                  <p className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{technicalItem.descripcion}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Prioridad:</span>
                  <span className={`font-medium ${getPriorityColor(technicalItem.prioridad)}`}>
                    {getPriorityText(technicalItem.prioridad)}
                  </span>
                </div>
                
                {technicalItem.producto && (
                  <div className="flex items-center gap-1">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Producto:</span>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {technicalItem.producto.nombre}
                    </span>
                  </div>
                )}
                
                {technicalItem.historia_padre && (
                  <div className="flex items-center gap-1">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Historia:</span>
                    <span className="font-medium text-blue-600 truncate max-w-xs">
                      {technicalItem.historia_padre.titulo}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {currentUser && (
              <div className={`mt-4 p-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-blue-900/20 border-blue-700'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm font-medium flex items-center gap-2 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-800'
                }`}>
                  <User className="h-4 w-4" />
                  Actualmente asignado a: {currentUser.nombre_negocio}
                </p>
              </div>
            )}
          </div>

          {/* Selector de Developer */}
          <div>
            <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <UserPlus className="h-5 w-5 text-orange-500" />
              Seleccionar Developer
            </label>
            
            {fetchingDevelopers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className={`ml-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Cargando developers...</span>
              </div>
            ) : developers.length === 0 ? (
              <div className={`text-center py-8 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-yellow-900/20 border-yellow-700'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'
                }`}>No hay developers disponibles</p>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'
                }`}>
                  Agrega miembros con rol Developer al equipo
                </p>
              </div>
            ) : (
              <div className={`space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2 ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                {/* Opción para des-asignar */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-700 hover:bg-gray-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="developer"
                    value=""
                    checked={selectedUserId === ''}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <X className={`h-5 w-5 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <div className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Sin asignar</div>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Des-asignar este item (volverá a estar disponible)
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Opciones de developers */}
                {developers.map(developer => {
                  const isCurrentlyAssigned = developer._id === technicalItem.asignado_a?._id;
                  
                  return (
                    <label 
                      key={developer._id} 
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUserId === developer._id
                          ? theme === 'dark'
                            ? 'border-orange-500 bg-orange-900/20'
                            : 'border-orange-500 bg-orange-50'
                          : isCurrentlyAssigned
                          ? theme === 'dark'
                            ? 'border-blue-600 bg-blue-900/20'
                            : 'border-blue-300 bg-blue-50'
                          : theme === 'dark'
                            ? 'border-gray-700 hover:bg-gray-700'
                            : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="developer"
                        value={developer._id}
                        checked={selectedUserId === developer._id}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                            {developer.nombre_negocio.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {developer.nombre_negocio}
                              </div>
                              {isCurrentlyAssigned && (
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                  theme === 'dark'
                                    ? 'bg-blue-900/30 text-blue-400'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  Actual
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>{developer.email}</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className={`border rounded-lg p-4 ${
              theme === 'dark'
                ? 'bg-red-900/20 border-red-700'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-800'
                  }`}>Error</h4>
                  <p className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-red-300' : 'text-red-700'
                  }`}>{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          theme === 'dark'
            ? 'border-gray-700 bg-gray-900'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-5 py-2.5 border rounded-lg transition-colors disabled:opacity-50 ${
              theme === 'dark'
                ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || fetchingDevelopers || (developers.length === 0 && selectedUserId !== '')}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {selectedUserId ? 'Asignar Usuario' : 'Des-asignar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignUserToTechnicalItemModal;
