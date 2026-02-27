/**
 * Scrum Master Service
 * Servicio centralizado para todas las operaciones del Scrum Master
 * 
 * @module services/scrumMasterService
 * @description
 * Este servicio encapsula TODAS las llamadas API del módulo Scrum Master:
 * - Gestión de ceremonias (Planning, Daily, Review, Retro)
 * - Gestión de impedimentos
 * - Dashboard consolidado
 * - Gestión de equipo (team members, capacidad, tareas)
 * - Bug Reports (vista SM)
 * - Métricas y reportes SM
 * 
 * ✅ Utiliza apiService para:
 *    - Deduplicación de peticiones
 *    - Caché automático (30s)
 *    - Manejo centralizado de tokens (Clerk)
 *    - Headers de autenticación
 * 
 * ✅ Reutiliza productOwnerService para:
 *    - Sprints (getSprints, createSprint, updateSprint, etc.)
 *    - Backlog items (getBacklogItems, etc.)
 *    - Releases (getReleases, etc.)
 * 
 * ⚠️ REEMPLAZA los servicios legacy:
 *    - scrumMasterService.js (URL hardcoded, localStorage)
 *    - sprintService.js (duplicaba lógica de PO)
 *    - userTasksService.js (URL inconsistente)
 */

import { apiService } from './apiService';

class ScrumMasterService {
  constructor() {
    // Paths base para cada módulo del Scrum Master
    this.paths = {
      ceremonies: '/ceremonies',
      impediments: '/impediments',
      scrumMaster: '/scrum-master',
      team: '/team',
      metrics: '/metricas',
      sprints: '/sprints',
      backlog: '/backlog',
      bugReports: '/scrum-master/bugs'
    };
  }

  // ============================================
  // DASHBOARD CONSOLIDADO
  // ============================================

  /**
   * Obtener datos del dashboard consolidado del Scrum Master
   * Endpoint optimizado que retorna todos los datos en una sola petición:
   * - Sprints, sprint activo, items del sprint
   * - Backlog items, items técnicos
   * - Team members con workload
   * - Productos
   * - Métricas calculadas en servidor
   * 
   * @param {Function} getToken - Función para obtener token de autenticación
   * @returns {Promise<Object>} Datos completos del dashboard
   */
  async getDashboard(getToken) {
    try {
      return await apiService.get(`${this.paths.scrumMaster}/dashboard`, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getDashboard error:', error);
      throw error;
    }
  }

  /**
   * Invalidar caché del dashboard en el servidor
   * Útil llamar después de crear/editar/eliminar sprints, items, etc.
   * 
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación
   */
  async invalidateDashboardCache(getToken) {
    try {
      const response = await apiService.post(
        `${this.paths.scrumMaster}/dashboard/invalidate`,
        {},
        getToken
      );
      // También invalidar caché local
      apiService.invalidateApiCache('scrum-master');
      return response;
    } catch (error) {
      console.error('ScrumMasterService.invalidateDashboardCache error:', error);
      throw error;
    }
  }

  /**
   * Obtener métricas detalladas de un sprint específico
   * 
   * @param {string} sprintId - ID del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Sprint con métricas, items y items técnicos
   */
  async getSprintMetrics(sprintId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.scrumMaster}/sprint/${sprintId}/metrics`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getSprintMetrics error:', error);
      throw error;
    }
  }

  // ============================================
  // GESTIÓN DE CEREMONIAS
  // ============================================

  /**
   * Obtener todas las ceremonias
   * @param {Object} filters - Filtros opcionales { type, status, date_from, date_to }
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { ceremonies: Array, total: number }
   */
  async getCeremonies(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString()
        ? `${this.paths.ceremonies}?${queryParams}`
        : this.paths.ceremonies;

      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getCeremonies error:', error);
      throw error;
    }
  }

  /**
   * Obtener una ceremonia específica
   * @param {string} ceremonyId - ID de la ceremonia
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos de la ceremonia
   */
  async getCeremony(ceremonyId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.ceremonies}/${ceremonyId}`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getCeremony error:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva ceremonia
   * @param {Object} ceremonyData - Datos de la ceremonia
   * @param {string} ceremonyData.type - Tipo: sprint_planning|daily_standup|sprint_review|retrospective
   * @param {string} ceremonyData.title - Título de la ceremonia
   * @param {string} ceremonyData.date - Fecha (ISO string)
   * @param {string} ceremonyData.startTime - Hora de inicio
   * @param {number} [ceremonyData.duration] - Duración en minutos (default: 60)
   * @param {Array} [ceremonyData.participants] - Participantes
   * @param {string} [ceremonyData.description] - Descripción
   * @param {Array} [ceremonyData.goals] - Objetivos
   * @param {Array} [ceremonyData.blockers] - Bloqueadores
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Ceremonia creada
   */
  async createCeremony(ceremonyData, getToken) {
    try {
      const response = await apiService.post(
        this.paths.ceremonies,
        ceremonyData,
        getToken
      );

      // Invalidar caché de ceremonias
      apiService.invalidateApiCache('ceremonies');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.createCeremony error:', error);
      throw error;
    }
  }

  /**
   * Actualizar una ceremonia existente
   * @param {string} ceremonyId - ID de la ceremonia
   * @param {Object} ceremonyData - Datos a actualizar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Ceremonia actualizada
   */
  async updateCeremony(ceremonyId, ceremonyData, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.ceremonies}/${ceremonyId}`,
        ceremonyData,
        getToken
      );

      // Invalidar caché de ceremonias
      apiService.invalidateApiCache('ceremonies');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.updateCeremony error:', error);
      throw error;
    }
  }

  /**
   * Eliminar una ceremonia
   * @param {string} ceremonyId - ID de la ceremonia
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteCeremony(ceremonyId, getToken) {
    try {
      const response = await apiService.delete(
        `${this.paths.ceremonies}/${ceremonyId}`,
        getToken
      );

      // Invalidar caché de ceremonias
      apiService.invalidateApiCache('ceremonies');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.deleteCeremony error:', error);
      throw error;
    }
  }

  // ============================================
  // GESTIÓN DE IMPEDIMENTOS
  // ============================================

  /**
   * Obtener todos los impedimentos
   * @param {Object} filters - Filtros opcionales { status, priority, category, responsible }
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { impediments: Array, total: number }
   */
  async getImpediments(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString()
        ? `${this.paths.impediments}?${queryParams}`
        : this.paths.impediments;

      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getImpediments error:', error);
      throw error;
    }
  }

  /**
   * Obtener un impedimento específico
   * @param {string} impedimentId - ID del impedimento
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos del impedimento
   */
  async getImpediment(impedimentId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.impediments}/${impedimentId}`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getImpediment error:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo impedimento
   * @param {Object} impedimentData - Datos del impedimento
   * @param {string} impedimentData.title - Título
   * @param {string} impedimentData.description - Descripción
   * @param {string} impedimentData.responsible - Responsable
   * @param {string} [impedimentData.priority] - Prioridad (low|medium|high|critical)
   * @param {string} [impedimentData.category] - Categoría (technical|organizational|external)
   * @param {string} [impedimentData.assignedTo] - ID del usuario asignado
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Impedimento creado
   */
  async createImpediment(impedimentData, getToken) {
    try {
      const response = await apiService.post(
        this.paths.impediments,
        impedimentData,
        getToken
      );

      // Invalidar caché de impedimentos
      apiService.invalidateApiCache('impediments');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.createImpediment error:', error);
      throw error;
    }
  }

  /**
   * Actualizar un impedimento
   * @param {string} impedimentId - ID del impedimento
   * @param {Object} impedimentData - Datos a actualizar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Impedimento actualizado
   */
  async updateImpediment(impedimentId, impedimentData, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.impediments}/${impedimentId}`,
        impedimentData,
        getToken
      );

      // Invalidar caché de impedimentos
      apiService.invalidateApiCache('impediments');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.updateImpediment error:', error);
      throw error;
    }
  }

  /**
   * Eliminar un impedimento
   * @param {string} impedimentId - ID del impedimento
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteImpediment(impedimentId, getToken) {
    try {
      const response = await apiService.delete(
        `${this.paths.impediments}/${impedimentId}`,
        getToken
      );

      // Invalidar caché de impedimentos
      apiService.invalidateApiCache('impediments');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.deleteImpediment error:', error);
      throw error;
    }
  }

  /**
   * Resolver un impedimento (atajo para actualizar estado a 'resolved')
   * @param {string} impedimentId - ID del impedimento
   * @param {string} [resolution] - Notas de resolución
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Impedimento resuelto
   */
  async resolveImpediment(impedimentId, resolution, getToken) {
    return this.updateImpediment(
      impedimentId,
      { 
        status: 'resolved',
        description: resolution || undefined
      },
      getToken
    );
  }

  // ============================================
  // GESTIÓN DE EQUIPO
  // ============================================

  /**
   * Obtener miembros del equipo
   * @param {Object} filters - Filtros opcionales { team, status, role }
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { members: Array, total: number, summary: Object }
   */
  async getTeamMembers(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString()
        ? `${this.paths.team}/members?${queryParams}`
        : `${this.paths.team}/members`;

      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getTeamMembers error:', error);
      throw error;
    }
  }

  /**
   * Obtener miembros del equipo con fallback a datos mock
   * Útil durante desarrollo cuando el backend no tiene datos reales
   * 
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { members: Array }
   */
  async getTeamMembersWithFallback(getToken) {
    try {
      return await this.getTeamMembers({}, getToken);
    } catch (error) {
      console.warn('Using mock team members data:', error.message);
      return {
        members: [
          {
            _id: 'mock-1',
            user: { firstName: 'Usuario', lastName: 'Demo', email: 'demo@example.com' },
            role: 'developer',
            status: 'active'
          }
        ],
        total: 1
      };
    }
  }

  /**
   * Obtener tareas de un usuario específico
   * @param {string} userId - ID del usuario
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { tasks: Array, stats: Object }
   */
  async getUserTasks(userId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.team}/members/${userId}/tasks`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getUserTasks error:', error);
      // Retornar estructura vacía en caso de error para no romper UI
      return {
        tasks: [],
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
      };
    }
  }

  /**
   * Obtener resumen de tareas de todo el equipo
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { teamTasksSummary: Array }
   */
  async getTeamTasksSummary(getToken) {
    try {
      return await apiService.get(
        `${this.paths.team}/tasks-summary`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getTeamTasksSummary error:', error);
      return { teamTasksSummary: [] };
    }
  }

  /**
   * Actualizar estado de un miembro del equipo
   * @param {string} memberId - ID del miembro
   * @param {string} status - Nuevo estado (active|inactive|on_leave|busy)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Miembro actualizado
   */
  async updateTeamMemberStatus(memberId, status, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.team}/members/${memberId}/status`,
        { status },
        getToken
      );

      apiService.invalidateApiCache('team');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.updateTeamMemberStatus error:', error);
      throw error;
    }
  }

  // ============================================
  // GESTIÓN DE BUG REPORTS (Vista SM)
  // ============================================

  /**
   * Obtener bug reports (vista Scrum Master)
   * @param {Object} filters - Filtros opcionales
   * @param {string} [filters.status] - Estado del bug
   * @param {string} [filters.priority] - Prioridad
   * @param {string} [filters.severity] - Severidad
   * @param {string} [filters.assignedTo] - Asignado a
   * @param {string} [filters.search] - Búsqueda por texto
   * @param {number} [filters.page] - Página (default: 1)
   * @param {number} [filters.limit] - Límite por página (default: 20)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { data: { bugs, pagination, stats } }
   */
  async getBugReports(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          queryParams.append(key, value);
        }
      });

      const endpoint = queryParams.toString()
        ? `${this.paths.bugReports}?${queryParams}`
        : this.paths.bugReports;

      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getBugReports error:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de un bug report
   * @param {string} bugId - ID del bug report
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Detalle del bug
   */
  async getBugReportById(bugId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.bugReports}/${bugId}`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getBugReportById error:', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios de un bug report
   * @param {string} bugId - ID del bug report
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { data: Array de comentarios }
   */
  async getBugComments(bugId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.bugReports}/${bugId}/comments`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getBugComments error:', error);
      throw error;
    }
  }

  /**
   * Agregar comentario a un bug report
   * @param {string} bugId - ID del bug report
   * @param {string} text - Contenido del comentario
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Comentario creado
   */
  async addBugComment(bugId, text, getToken) {
    try {
      return await apiService.post(
        `${this.paths.bugReports}/${bugId}/comments`,
        { text },
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.addBugComment error:', error);
      throw error;
    }
  }

  /**
   * Actualizar un bug report (estado, asignación, etc.)
   * @param {string} bugId - ID del bug report
   * @param {Object} updateData - Datos a actualizar { status, assignedTo, priority, etc. }
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Bug actualizado
   */
  async updateBugReport(bugId, updateData, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.bugReports}/${bugId}`,
        updateData,
        getToken
      );

      apiService.invalidateApiCache('scrum-master');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.updateBugReport error:', error);
      throw error;
    }
  }

  // ============================================
  // SPRINT - OPERACIONES ESPECÍFICAS SM
  // ============================================

  /**
   * Obtener historias disponibles para asignar a un sprint
   * @param {string} sprintId - ID del sprint
   * @param {Object} filters - Filtros opcionales { producto }
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Historias disponibles
   */
  async getAvailableStories(sprintId, filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString()
        ? `${this.paths.sprints}/${sprintId}/available-stories?${queryParams}`
        : `${this.paths.sprints}/${sprintId}/available-stories`;

      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getAvailableStories error:', error);
      throw error;
    }
  }

  /**
   * Asignar una historia a un sprint
   * @param {string} sprintId - ID del sprint
   * @param {Object} storyData - Datos de la historia a asignar
   * @param {string} storyData.storyId - ID de la historia
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Resultado de la asignación
   */
  async assignStoryToSprint(sprintId, storyData, getToken) {
    try {
      const response = await apiService.post(
        `${this.paths.sprints}/${sprintId}/assign-story`,
        storyData,
        getToken
      );

      // Invalidar caché de sprints y backlog
      apiService.invalidateApiCache('sprints');
      apiService.invalidateApiCache('backlog');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.assignStoryToSprint error:', error);
      throw error;
    }
  }

  /**
   * Desasignar una historia de un sprint
   * @param {string} sprintId - ID del sprint
   * @param {string} storyId - ID de la historia
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Resultado
   */
  async unassignStoryFromSprint(sprintId, storyId, getToken) {
    try {
      const response = await apiService.delete(
        `${this.paths.sprints}/${sprintId}/stories/${storyId}`,
        getToken
      );

      apiService.invalidateApiCache('sprints');
      apiService.invalidateApiCache('backlog');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.unassignStoryFromSprint error:', error);
      throw error;
    }
  }

  /**
   * Obtener items del backlog de un sprint de forma jerárquica
   * @param {string} sprintId - ID del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Items jerárquicos del sprint
   */
  async getSprintHierarchicalItems(sprintId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.backlog}/sprint/${sprintId}/hierarchical`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getSprintHierarchicalItems error:', error);
      throw error;
    }
  }

  /**
   * Asignar un usuario a un item técnico
   * @param {string} itemId - ID del item técnico
   * @param {Object} assignmentData - Datos de asignación
   * @param {string} assignmentData.userId - ID del usuario a asignar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Resultado de la asignación
   */
  async assignUserToItem(itemId, assignmentData, getToken) {
    try {
      const response = await apiService.post(
        `${this.paths.backlog}/${itemId}/assign-user`,
        assignmentData,
        getToken
      );

      apiService.invalidateApiCache('backlog');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.assignUserToItem error:', error);
      throw error;
    }
  }

  // ============================================
  // BACKLOG - OPERACIONES SM
  // ============================================

  /**
   * Crear un item técnico del backlog (tarea, bug, mejora)
   * @param {Object} itemData - Datos del item técnico
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Item creado
   */
  async createTechnicalItem(itemData, getToken) {
    try {
      const response = await apiService.post(
        `${this.paths.backlog}/technical`,
        itemData,
        getToken
      );

      apiService.invalidateApiCache('backlog');
      apiService.invalidateApiCache('scrum-master');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.createTechnicalItem error:', error);
      throw error;
    }
  }

  /**
   * Actualizar un item del backlog  
   * @param {string} itemId - ID del item
   * @param {Object} itemData - Datos a actualizar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Item actualizado
   */
  async updateBacklogItem(itemId, itemData, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.backlog}/${itemId}`,
        itemData,
        getToken
      );

      apiService.invalidateApiCache('backlog');
      apiService.invalidateApiCache('scrum-master');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.updateBacklogItem error:', error);
      throw error;
    }
  }

  /**
   * Obtener items del backlog con filtros SM
   * @param {Object} filters - Filtros { tipo, estado, producto, sprint, limit }
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { items: Array }
   */
  async getBacklogItems(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString()
        ? `${this.paths.backlog}?${queryParams}`
        : this.paths.backlog;

      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getBacklogItems error:', error);
      throw error;
    }
  }

  /**
   * Obtener sprints con filtros
   * @param {Object} filters - Filtros opcionales { estado, producto, limit }
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { sprints: Array }
   */
  async getSprints(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString()
        ? `${this.paths.sprints}?${queryParams}`
        : this.paths.sprints;

      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ScrumMasterService.getSprints error:', error);
      throw error;
    }
  }

  /**
   * Ejecutar una acción sobre un sprint (iniciar, pausar, finalizar)
   * @param {string} sprintId - ID del sprint
   * @param {string} action - Acción: 'iniciar' | 'pausar' | 'finalizar'
   * @param {Object} data - Datos adicionales para la acción
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Resultado de la acción
   */
  async executeSprintAction(sprintId, action, data = {}, getToken) {
    try {
      const response = await apiService.post(
        `${this.paths.sprints}/${sprintId}/${action}`,
        data,
        getToken
      );

      // Invalidar caché de sprints y dashboard después de cambiar estado
      apiService.invalidateApiCache('sprints');
      apiService.invalidateApiCache('scrum-master');

      return response;
    } catch (error) {
      console.error('ScrumMasterService.executeSprintAction error:', error);
      throw error;
    }
  }

  /**
   * Obtener productos (para selectores/filtros)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} { products: Array }
   */
  async getProducts(getToken) {
    try {
      return await apiService.get('/products', getToken);
    } catch (error) {
      console.error('ScrumMasterService.getProducts error:', error);
      throw error;
    }
  }

  // ============================================
  // MÉTRICAS Y REPORTES SM
  // ============================================

  /**
   * Obtener velocidad del equipo
   * @param {string} [timeframe='last_5_sprints'] - Periodo de tiempo
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos de velocidad
   */
  async getTeamVelocity(timeframe = 'last_5_sprints', getToken) {
    try {
      return await apiService.get(
        `${this.paths.metrics}/velocity?timeframe=${timeframe}`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getTeamVelocity error:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de burndown de un sprint
   * @param {string} sprintId - ID del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos del burndown
   */
  async getBurndownData(sprintId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.sprints}/${sprintId}/burndown`,
        getToken
      );
    } catch (error) {
      console.error('ScrumMasterService.getBurndownData error:', error);
      throw error;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Invalidar toda la caché del módulo SM
   * Útil después de operaciones batch
   */
  invalidateAllCache() {
    apiService.invalidateApiCache('ceremonies');
    apiService.invalidateApiCache('impediments');
    apiService.invalidateApiCache('team');
    apiService.invalidateApiCache('scrum-master');
    apiService.invalidateApiCache('sprints');
    apiService.invalidateApiCache('backlog');
  }
}

// Exportar instancia singleton (named + default para compatibilidad)
export const scrumMasterService = new ScrumMasterService();
export default scrumMasterService;
