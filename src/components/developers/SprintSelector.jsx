import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { developersApiService } from '../../services/developersApiService';
import { useTheme } from '../../context/ThemeContext';

const SprintSelector = ({ 
  selectedSprintId, 
  onSprintChange, 
  filterMode, 
  onFilterModeChange,
  className = "" 
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [sprints, setSprints] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar sprints disponibles
  useEffect(() => {
    const fetchSprints = async () => {
      setLoading(true);
      try {
        const response = await developersApiService.getAvailableSprints(getToken);
        
        if (response.success) {
          setSprints(response.data || []);
        }
      } catch (error) {
        console.error('Error al cargar sprints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSprints();
  }, []);

  const selectedSprint = sprints.find(sprint => sprint._id === selectedSprintId);
  
  const handleSprintSelect = (sprint) => {
    if (sprint._id === 'all') {
      onFilterModeChange('all');
      onSprintChange(null);
    } else {
      onFilterModeChange('sprint');
      onSprintChange(sprint._id);
    }
    setIsOpen(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'activo': { 
        colorLight: 'bg-green-100 text-green-800', 
        colorDark: 'bg-green-900/40 text-green-300',
        label: 'Activo' 
      },
      'planificado': { 
        colorLight: 'bg-blue-100 text-blue-800', 
        colorDark: 'bg-blue-900/40 text-blue-300',
        label: 'Planificado' 
      },
      'completado': { 
        colorLight: 'bg-gray-100 text-gray-800', 
        colorDark: 'bg-gray-700 text-gray-300',
        label: 'Completado' 
      },
      'cancelado': { 
        colorLight: 'bg-red-100 text-red-800', 
        colorDark: 'bg-red-900/40 text-red-300',
        label: 'Cancelado' 
      }
    };
    
    const config = statusConfig[status] || statusConfig['planificado'];
    const colorClass = theme === 'dark' ? config.colorDark : config.colorLight;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`h-10 rounded-lg w-64 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full sm:w-auto min-w-64 flex items-center justify-between px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
            : 'bg-white border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="text-left">
            <div className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {filterMode === 'all' ? 'Todas mis tareas' : (selectedSprint?.name || 'Seleccionar Sprint')}
            </div>
            {filterMode === 'sprint' && selectedSprint && (
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatDate(selectedSprint.startDate)} - {formatDate(selectedSprint.endDate)}
              </div>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-full sm:w-96 border rounded-lg shadow-lg max-h-80 overflow-y-auto ${
          theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
        }`}>
          {/* Opción "Todas mis tareas" */}
          <div
            onClick={() => handleSprintSelect({ _id: 'all' })}
            className={`px-4 py-3 cursor-pointer transition-colors border-b ${
              theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
            } ${
              filterMode === 'all' ? (theme === 'dark' ? 'bg-blue-900/30' : 'bg-primary-50') : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <div>
                  <div className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Todas mis tareas</div>
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>Ver todas las tareas asignadas</div>
                </div>
              </div>
              {filterMode === 'all' && (
                <Check className="h-5 w-5 text-primary-600" />
              )}
            </div>
          </div>

          {/* Lista de sprints */}
          {sprints.map((sprint) => (
            <div
              key={sprint._id}
              onClick={() => handleSprintSelect(sprint)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } ${
                selectedSprintId === sprint._id 
                  ? (theme === 'dark' ? 'bg-blue-900/30' : 'bg-primary-50') 
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`text-sm font-medium truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {sprint.name}
                    </h4>
                    {getStatusBadge(sprint.status)}
                  </div>
                  {sprint.goal && (
                    <p className={`text-xs mb-1 line-clamp-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {sprint.goal}
                    </p>
                  )}
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  </div>
                </div>
                {selectedSprintId === sprint._id && (
                  <Check className="h-5 w-5 text-primary-600 ml-2 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}

          {sprints.length === 0 && (
            <div className="px-4 py-6 text-center">
              <Calendar className={`h-12 w-12 mx-auto mb-2 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>No hay sprints disponibles</p>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SprintSelector;
