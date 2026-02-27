import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { scrumMasterService } from '../../services/scrumMasterService';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';

const ImpedimentCard = ({ impediment, onEdit, onDelete, onStatusChange }) => {
  const { theme } = useTheme();
  
  const getStatusColor = (status) => {
    if (theme === 'dark') {
      const colors = {
        open: 'bg-red-900/40 text-red-300 border-red-800',
        in_progress: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
        resolved: 'bg-green-900/40 text-green-300 border-green-800'
      };
      return colors[status] || colors.open;
    }
    const colors = {
      open: 'bg-red-100 text-red-800 border-red-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: AlertTriangle,
      in_progress: Clock,
      resolved: CheckCircle
    };
    const Icon = icons[status] || AlertTriangle;
    return Icon;
  };

  const StatusIcon = getStatusIcon(impediment.status);

  return (
    <div className={`rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <StatusIcon className={`h-5 w-5 ${getPriorityColor(impediment.priority)}`} />
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{impediment.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(impediment.status)}`}>
                {impediment.status === 'open' && 'Abierto'}
                {impediment.status === 'in_progress' && 'En Progreso'}
                {impediment.status === 'resolved' && 'Resuelto'}
              </span>
            </div>
            
            <p className={`mb-4 leading-relaxed ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>{impediment.description}</p>
            
            <div className={`flex items-center gap-6 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{impediment.responsible}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Creado: {new Date(impediment.createdDate).toLocaleDateString()}</span>
              </div>
              {impediment.resolvedDate && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Resuelto: {new Date(impediment.resolvedDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <button className={`p-2 rounded-lg ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}>
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(impediment)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                theme === 'dark'
                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
            {impediment.status !== 'resolved' && (
              <button 
                onClick={() => onStatusChange(impediment.id, 'resolved')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'text-green-400 hover:text-green-300 hover:bg-green-900/30'
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Resolver
              </button>
            )}
          </div>
          <button 
            onClick={() => onDelete(impediment.id)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              theme === 'dark'
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};


import ImpedimentModal from "./modalScrumMaster/modalImpediments";

const Impediments = () => {
  const { theme } = useTheme();
  const [impediments, setImpediments] = useState([]);
  const [filteredImpediments, setFilteredImpediments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImpediment, setEditingImpediment] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  // Cargar impedimentos desde el backend
  useEffect(() => {
    loadImpediments();
  }, [getToken]);

  const loadImpediments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scrumMasterService.getImpediments({}, getToken);
      const impedimentsList = response.impediments || response || [];
      setImpediments(impedimentsList);
    } catch (error) {
      console.error('Error loading impediments:', error);
      setError('Error al cargar impedimentos');
      setImpediments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const data = await scrumMasterService.getTeamMembersWithFallback(getToken);
        const names = (data.members || data || []).map(member => {
          if (member.user && member.user.firstName && member.user.lastName) {
            return `${member.user.firstName} ${member.user.lastName}`;
          }
          if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
          }
          return member.user?.email || member.email || member.id || 'Usuario';
        });
        setTeamMembers(names);
      } catch (error) {
        setTeamMembers([
          'Ana García',
          'Carlos López',
          'María Rodríguez',
          'David Chen'
        ]);
      }
    };
    fetchTeamMembers();
  }, [getToken]);

  // Filtrar impedimentos
  useEffect(() => {
    let filtered = impediments;

    if (searchTerm) {
      filtered = filtered.filter(imp => 
        imp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imp.responsible.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(imp => imp.status === statusFilter);
    }

    setFilteredImpediments(filtered);
  }, [impediments, searchTerm, statusFilter]);

  const handleCreateImpediment = () => {
    setEditingImpediment(null);
    setIsModalOpen(true);
  };

  const handleEditImpediment = (impediment) => {
    setEditingImpediment(impediment);
    setIsModalOpen(true);
  };

  const handleDeleteImpediment = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este impedimento?')) {
      try {
        await scrumMasterService.deleteImpediment(id, getToken);
        setImpediments(prev => prev.filter(imp => (imp._id || imp.id) !== id));
      } catch (error) {
        console.error('Error deleting impediment:', error);
        alert('Error al eliminar el impedimento');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await scrumMasterService.updateImpediment(
        id,
        { 
          status: newStatus,
          resolvedDate: newStatus === 'resolved' ? new Date().toISOString() : null
        },
        getToken
      );
      
      setImpediments(prev => prev.map(imp => 
        imp._id === id || imp.id === id
          ? { 
              ...imp, 
              status: newStatus, 
              resolvedDate: newStatus === 'resolved' ? new Date().toISOString() : null 
            }
          : imp
      ));
    } catch (error) {
      console.error('Error updating impediment status:', error);
      alert('Error al actualizar el estado del impedimento');
    }
  };

  const handleSaveImpediment = async (formData) => {
    try {
      if (editingImpediment) {
        // Editar impedimento existente
        await scrumMasterService.updateImpediment(
          editingImpediment._id || editingImpediment.id,
          formData,
          getToken
        );
        await loadImpediments(); // Recargar lista
      } else {
        // Crear nuevo impedimento
        await scrumMasterService.createImpediment(formData, getToken);
        await loadImpediments(); // Recargar lista
      }
      
      setIsModalOpen(false);
      setEditingImpediment(null);
    } catch (error) {
      console.error('Error saving impediment:', error);
      alert('Error al guardar el impedimento');
    }
  };

  const handleExportReport = () => {
    // Aquí implementarías la lógica de exportación
    alert('Función de exportación en desarrollo');
  };

  const getStatusCounts = () => {
    return {
      total: impediments.length,
      open: impediments.filter(imp => imp.status === 'open').length,
      in_progress: impediments.filter(imp => imp.status === 'in_progress').length,
      resolved: impediments.filter(imp => imp.status === 'resolved').length
    };
  };

  const counts = getStatusCounts();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className={`ml-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Cargando impedimentos...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className={`mb-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>{error}</p>
          <button
            onClick={loadImpediments}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Gestión de Impedimentos</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Registra y da seguimiento a los impedimentos del equipo
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportReport}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={handleCreateImpediment}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Impedimento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{counts.total}</div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Total</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="text-2xl font-bold text-red-600">{counts.open}</div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Abiertos</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="text-2xl font-bold text-yellow-600">{counts.in_progress}</div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>En Progreso</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="text-2xl font-bold text-green-600">{counts.resolved}</div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Resueltos</div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar impedimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Todos los estados</option>
              <option value="open">Abiertos</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resueltos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Impediments List */}
      <div className="space-y-4">
        {filteredImpediments.length > 0 ? (
          filteredImpediments.map((impediment) => (
            <ImpedimentCard
              key={impediment.id}
              impediment={impediment}
              onEdit={handleEditImpediment}
              onDelete={handleDeleteImpediment}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className={`rounded-lg border p-12 text-center ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <AlertTriangle className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>No hay impedimentos</h3>
            <p className={`mb-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron impedimentos con los filtros aplicados.'
                : 'No hay impedimentos registrados en este momento.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleCreateImpediment}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Crear primer impedimento
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <ImpedimentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingImpediment(null);
        }}
        impediment={editingImpediment}
        onSave={handleSaveImpediment}
        teamMembers={teamMembers}
      />
    </div>
  );
};

export default Impediments;
