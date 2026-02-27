import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { scrumMasterService } from '../../services/scrumMasterService';
import UserTasksModal from './UserTasksModal';
import { 
  Users, 
  User, 
  Clock, 
  Calendar, 
  Activity, 
  Mail, 
  Phone,
  MoreHorizontal,
  Edit,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Target
} from 'lucide-react';

const TeamMemberCard = ({ member, onMessage, onViewTasks, tasksStats }) => {
  const { theme } = useTheme();
  
  // Usar datos reales de tareas si están disponibles
  const actualTasksStats = tasksStats || {
    assignedItems: member.sprintInfo?.assignedItems || 0,
    completedItems: member.sprintInfo?.completedItems || 0
  };
  
  const workloadPercentage = actualTasksStats.assignedItems > 0 
    ? Math.round((actualTasksStats.completedItems / actualTasksStats.assignedItems) * 100)
    : 0;
  
  const getStatusColor = (status) => {
    if (theme === 'dark') {
      const colors = {
        active: 'bg-success-900/40 text-success-300 border-success-800',
        busy: 'bg-warning-900/40 text-warning-300 border-warning-800',
        on_leave: 'bg-primary-900/40 text-primary-300 border-primary-800',
        inactive: 'bg-error-900/40 text-error-300 border-error-800'
      };
      return colors[status] || colors.active;
    }
    const colors = {
      active: 'bg-success-100 text-success-800 border-success-200',
      busy: 'bg-warning-100 text-warning-800 border-warning-200',
      on_leave: 'bg-primary-100 text-primary-800 border-primary-200',
      inactive: 'bg-error-100 text-error-800 border-error-200'
    };
    return colors[status] || colors.active;
  };

  const getWorkloadColor = (percentage) => {
    if (percentage > 100) return 'text-error-600';
    if (percentage > 80) return 'text-warning-600';
    return 'text-success-600';
  };

  const getRoleIcon = (role) => {
    const icons = {
      scrum_master: '🎯',
      product_owner: '📋',
      developer: '💻',
      tester: '🧪',
      designer: '🎨',
      analyst: '📊'
    };
    return icons[role] || '👤';
  };

  return (
    <div 
      className={`backdrop-blur-lg rounded-xl border-0 shadow-galaxy hover:shadow-large transition-all duration-300 overflow-hidden relative group cursor-pointer ${
        theme === 'dark' ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white/80 hover:bg-gray-50'
      }`}
      onClick={() => onViewTasks && onViewTasks(member)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        theme === 'dark' 
          ? 'from-gray-700/50 via-transparent to-primary-900/30'
          : 'from-white/50 via-transparent to-primary-50/30'
      }`}></div>
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-medium">
              <span className="text-white font-semibold text-lg">
                {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h3 className={`text-lg font-semibold transition-colors ${
                theme === 'dark' 
                  ? 'text-white group-hover:text-gray-200'
                  : 'text-primary-900 group-hover:text-primary-700'
              }`}>
                {member.user?.firstName} {member.user?.lastName}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                  theme === 'dark'
                    ? 'text-primary-300 bg-primary-900/40'
                    : 'text-primary-600 bg-primary-50'
                }`}>{getRoleIcon(member.role)} {member.role.replace('_', ' ')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border shadow-soft ${getStatusColor(member.status)}`}>
                  {member.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <button className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-primary-100'
            }`}>
              <MoreHorizontal className="h-5 w-5 text-primary-400" />
            </button>
          </div>
        </div>
        
        {/* Información de contacto */}
        <div className="mt-4 space-y-2">
          <div className={`flex items-center gap-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-primary-600'
          }`}>
            <Mail className="h-4 w-4" />
            <span>{member.user?.email}</span>
          </div>
          {member.user?.phone && (
            <div className={`flex items-center gap-2 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-primary-600'
            }`}>
              <Phone className="h-4 w-4" />
              <span>{member.user.phone}</span>
            </div>
          )}
        </div>
        
        {/* Carga de trabajo actual */}
        <div className="mt-4">
          <div className={`flex items-center justify-between text-sm mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-primary-700'
          }`}>
            <span>Progreso de tareas</span>
            <span className={`font-semibold ${getWorkloadColor(workloadPercentage)}`}>
              {workloadPercentage}%
            </span>
          </div>
          <div className={`w-full rounded-full h-2 shadow-inner ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-primary-100'
          }`}>
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                workloadPercentage > 100 
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : workloadPercentage > 80
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
              }`}
              style={{ width: `${Math.min(workloadPercentage, 100)}%` }}
            ></div>
          </div>
          <div className={`flex items-center justify-between text-xs mt-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-primary-600'
          }`}>
            <span>{actualTasksStats.completedItems} completadas</span>
            <span>{actualTasksStats.assignedItems} asignadas</span>
          </div>
        </div>
        
        {/* Información del Sprint Activo */}
        {member.sprintInfo?.currentSprint && (
          <div className={`mt-4 p-3 border rounded-lg ${
            theme === 'dark'
              ? 'bg-orange-900/30 border-orange-800'
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-orange-300' : 'text-orange-800'
              }`}>Sprint Activo</span>
            </div>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-700'
            }`}>
              <div>{member.sprintInfo.assignedItems} items asignados</div>
              <div>{member.sprintInfo.completedItems} items completados</div>
            </div>
          </div>
        )}
        
        {/* Habilidades */}
        {member.skills && member.skills.length > 0 && (
          <div className="mt-4">
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-primary-700'
            }`}>Habilidades</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {member.skills.slice(0, 4).map((skill, index) => (
                <span 
                  key={index}
                  className={`px-2 py-1 text-xs rounded-md shadow-soft ${
                    theme === 'dark'
                      ? 'bg-primary-900/40 text-primary-300'
                      : 'bg-primary-100 text-primary-800'
                  }`}
                >
                  {skill.name}
                </span>
              ))}
              {member.skills.length > 4 && (
                <span className={`px-2 py-1 text-xs rounded-md shadow-soft ${
                  theme === 'dark'
                    ? 'bg-accent-900/40 text-accent-300'
                    : 'bg-accent-100 text-accent-600'
                }`}>
                  +{member.skills.length - 4} más
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Disponibilidad */}
        <div className="mt-4">
          <div className={`flex items-center gap-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-primary-600'
          }`}>
            <Activity className="h-4 w-4" />
            <span>Disponibilidad: {member.availability}%</span>
          </div>
          <div className={`flex items-center gap-2 text-sm mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-primary-500'
          }`}>
            <Clock className="h-4 w-4" />
            <span>Última actividad: {new Date(member.lastActiveDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Acciones */}
        <div className={`flex gap-2 mt-4 pt-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-primary-100'
        }`}>
          <button 
            onClick={() => onMessage(member)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl transition-all duration-300 font-medium shadow-soft hover:shadow-medium ${
              theme === 'dark'
                ? 'text-accent-400 hover:text-accent-300 hover:bg-accent-900/30'
                : 'text-accent-600 hover:text-accent-700 hover:bg-accent-50'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Mensaje
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamOverview = () => {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  
  // Estados para manejo de datos
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Estados para modal de tareas
  const [selectedUser, setSelectedUser] = useState(null);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [teamTasksStats, setTeamTasksStats] = useState({});

  // Función para cargar colaboradores de la API
  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await scrumMasterService.getTeamMembers({}, getToken);
        
      // Procesar datos de TeamMember a formato de usuario
      // Filtrar solo roles relevantes para Scrum Master: developers y scrum_master
      const allowedRoles = ['developers', 'scrum_master'];
      const filteredMembers = (data.teamMembers || data.members || [])
        .filter(teamMember => allowedRoles.includes(teamMember.role));
      
      const members = filteredMembers.map(teamMember => ({
        _id: teamMember.user?._id || teamMember._id,
        user: {
          firstName: teamMember.user?.firstName || teamMember.user?.nombre_negocio?.split(' ')[0] || 'Usuario',
          lastName: teamMember.user?.lastName || teamMember.user?.nombre_negocio?.split(' ').slice(1).join(' ') || '',
          email: teamMember.user?.email || 'usuario@email.com',
          phone: teamMember.user?.phone || ''
        },
        role: teamMember.role || 'user',
        status: teamMember.status || 'active',
        team: teamMember.team,
        position: teamMember.position || 'Miembro del equipo',
        skills: teamMember.skills || [],
        availability: teamMember.availability || 100,
        lastActiveDate: teamMember.lastActiveDate || new Date(),
        workloadPercentage: teamMember.workloadPercentage || 0,
        sprintInfo: {
          currentSprint: teamMember.currentSprint || null,
          assignedItems: teamMember.assignedItems || 0,
          completedItems: teamMember.completedItems || 0
        }
      }));
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Error al cargar los miembros del equipo: ' + error.message);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar estadísticas de tareas del equipo
  const fetchTeamTasksStats = async () => {
    try {
      const result = await scrumMasterService.getTeamTasksSummary(getToken);
      const summaryData = result.teamTasksSummary || result.data || result || [];
      
      if (Array.isArray(summaryData) && summaryData.length > 0) {
        // Convertir array a objeto para acceso rápido por ID de usuario
        const statsMap = {};
        summaryData.forEach(stat => {
          // Usar tanto email como teamMemberId como claves para acceso flexible
          statsMap[stat.userId] = {
            assignedItems: stat.totalTasks || 0,
            completedItems: stat.completedTasks || 0,
            inProgressItems: stat.inProgressTasks || 0,
            pendingItems: stat.pendingTasks || 0
          };
          
          // También usar teamMemberId si está disponible
          if (stat.teamMemberId) {
            statsMap[stat.teamMemberId] = {
              assignedItems: stat.totalTasks || 0,
              completedItems: stat.completedTasks || 0,
              inProgressItems: stat.inProgressTasks || 0,
              pendingItems: stat.pendingTasks || 0
            };
          }
        });
        setTeamTasksStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching team tasks stats:', error);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchTeamMembers();
    fetchTeamTasksStats();
  }, []);

  // ✅ OPTIMIZADO: Procesar teamMembers con useMemo
  const processedTeamMembers = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return [];
    
    return teamMembers;
  }, [teamMembers]);

  // ✅ OPTIMIZADO: Filtrado optimizado con useMemo
  const filteredMembers = useMemo(() => {
    let filtered = processedTeamMembers;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        `${member.user?.firstName} ${member.user?.lastName}`.toLowerCase().includes(searchLower) ||
        member.user?.email.toLowerCase().includes(searchLower) ||
        member.role.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    return filtered;
  }, [processedTeamMembers, searchTerm, statusFilter, roleFilter]);

  // Handlers optimizados con useCallback
  const handleMessageMember = useCallback((member) => {
    // Aquí puedes abrir un chat o modal de mensaje
  }, []);  const handleViewTasks = useCallback((member) => {
    setSelectedUser(member);
    setShowTasksModal(true);
  }, []);

  const handleCloseTasksModal = useCallback(() => {
    setShowTasksModal(false);
    setSelectedUser(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchTeamMembers(),
      fetchTeamTasksStats()
    ]);
  }, []);

  // Estadísticas optimizadas con useMemo
  const statsCards = useMemo(() => {
    const totalMembers = processedTeamMembers.length;
    const activeMembers = processedTeamMembers.filter(m => m.status === 'active').length;
    
    // Calcular estadísticas basadas en tareas reales
    const totalTasks = Object.values(teamTasksStats).reduce((sum, stats) => sum + stats.assignedItems, 0);
    const completedTasks = Object.values(teamTasksStats).reduce((sum, stats) => sum + stats.completedItems, 0);
    const avgProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Nueva estadística: miembros trabajando en sprint activo
    const membersWithTasks = Object.keys(teamTasksStats).length;

    return [
      {
        title: 'Total Miembros',
        value: totalMembers,
        icon: Users,
        color: 'blue'
      },
      {
        title: 'Miembros Activos',
        value: activeMembers,
        icon: CheckCircle,
        color: 'green'
      },
      {
        title: 'Con Tareas Asignadas',
        value: membersWithTasks,
        icon: Target,
        color: 'orange'
      },
      {
        title: 'Progreso Promedio',
        value: `${avgProgress}%`,
        icon: AlertTriangle,
        color: avgProgress > 70 ? 'green' : avgProgress > 40 ? 'orange' : 'red'
      }
    ];
  }, [processedTeamMembers, teamTasksStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-primary-900'
          }`}>Resumen del Equipo</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-primary-600'}>
            Gestiona y supervisa el estado del equipo de desarrollo
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50 shadow-soft hover:shadow-medium ${
              theme === 'dark'
                ? 'text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700'
                : 'text-primary-700 bg-white border border-primary-300 hover:bg-primary-50'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

        </div>
      </div>

      {/* Mensaje de información */}
      {error && (
        <div className={`border rounded-lg p-4 ${
          theme === 'dark'
            ? 'bg-blue-900/30 border-blue-800'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
              }`}>Modo Demostración</h3>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
              }`}>{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'text-blue-600 bg-blue-100',
            green: 'text-green-600 bg-green-100',
            red: 'text-red-600 bg-red-100',
            yellow: 'text-yellow-600 bg-yellow-100',
            orange: 'text-orange-600 bg-orange-100',
            gray: 'text-gray-600 bg-gray-100'
          };
          
          return (
            <div key={index} className={`p-6 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{stat.title}</p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`p-4 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar miembros del equipo..."
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
          
          <div className="flex gap-4">
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
                <option value="active">Activo</option>
                <option value="busy">Ocupado</option>
                <option value="on_leave">De licencia</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Todos los roles</option>
              <option value="scrum_master">Scrum Master</option>
              <option value="product_owner">Product Owner</option>
              <option value="developer">Desarrollador</option>
              <option value="tester">Tester</option>
              <option value="designer">Diseñador</option>
              <option value="analyst">Analista</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <TeamMemberCard
              key={member._id}
              member={member}
              onMessage={handleMessageMember}
              onViewTasks={handleViewTasks}
              tasksStats={teamTasksStats[member.user?.email] || teamTasksStats[member._id]}
            />
          ))
        ) : (
          <div className={`col-span-full rounded-lg border p-12 text-center ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <Users className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>No hay miembros del equipo</h3>
            <p className={`mb-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                ? 'No se encontraron miembros con los filtros aplicados.'
                : 'No hay miembros del equipo registrados en este momento.'
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Modal de tareas del usuario */}
      <UserTasksModal
        isOpen={showTasksModal}
        onClose={handleCloseTasksModal}
        user={selectedUser?.user}
        teamMemberId={selectedUser?._id}
      />
    </div>
  );
};

export default TeamOverview;
