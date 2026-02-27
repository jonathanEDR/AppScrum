/**
 * Developer Service
 * Servicio centralizado para todas las operaciones del Developer
 * 
 * @module services/developersApiService
 * @description
 * Este servicio encapsula TODAS las llamadas API del módulo Developer:
 * - Dashboard del developer
 * - Gestión de tareas (CRUD, asignación, des-asignación)
 * - Sprint Board
 * - Time Tracking (entradas, timer)
 * - Bug Reports (CRUD, comentarios, attachments)
 * - Proyectos y backlog disponible
 * 
 * ✅ Utiliza apiService para:
 *    - Deduplicación de peticiones
 *    - Caché automático (30s)
 *    - Manejo centralizado de tokens (Clerk)
 *    - Headers de autenticación
 * 
 * ✅ Patrón consistente con productOwnerService y scrumMasterService:
 *    - getToken se pasa como parámetro en cada método
 *    - apiService maneja la resolución del token internamente
 */

import { apiService } from './apiService';

class DevelopersApiService {
  constructor() {
    // Paths base para cada módulo del Developer
    this.paths = {
      developers: '/developers',
      products: '/products',
      backlog: '/backlog'
    };
  }

  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * Obtiene métricas del dashboard del developer
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getDashboardData(getToken) {
    try {
      return await apiService.get(`${this.paths.developers}/dashboard`, getToken);
    } catch (error) {
      console.error('DevelopersService.getDashboardData error:', error);
      throw error;
    }
  }

  // ============================================
  // TAREAS
  // ============================================

  /**
   * Obtiene tareas del developer con filtros
   * @param {Object} filters - Filtros opcionales
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getTasks(filters = {}, getToken) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const queryString = params.toString();
      const endpoint = queryString 
        ? `${this.paths.developers}/tasks?${queryString}` 
        : `${this.paths.developers}/tasks`;
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('DevelopersService.getTasks error:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una tarea
   * @param {string} taskId - ID de la tarea
   * @param {string} status - Nuevo estado
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async updateTaskStatus(taskId, status, getToken) {
    try {
      return await apiService.put(
        `${this.paths.developers}/tasks/${taskId}/status`,
        { status },
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.updateTaskStatus error:', error);
      throw error;
    }
  }

  /**
   * Des-asigna una tarea (la devuelve al backlog)
   * @param {string} taskId - ID de la tarea
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async unassignTask(taskId, getToken) {
    try {
      return await apiService.delete(`${this.paths.developers}/tasks/${taskId}/unassign`, getToken);
    } catch (error) {
      console.error('DevelopersService.unassignTask error:', error);
      throw error;
    }
  }

  // ============================================
  // SPRINT BOARD
  // ============================================

  /**
   * Obtiene datos del sprint board con filtros
   * @param {string|null} sprintId - ID del sprint (null para todos)
   * @param {string} filterMode - Modo de filtro ('all' o 'sprint')
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getSprintBoardData(sprintId = null, filterMode = 'all', getToken) {
    try {
      const params = new URLSearchParams();
      if (sprintId) params.append('sprintId', sprintId);
      if (filterMode) params.append('filterMode', filterMode);
      const queryString = params.toString();
      const endpoint = `${this.paths.developers}/sprint-board${queryString ? '?' + queryString : ''}`;
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('DevelopersService.getSprintBoardData error:', error);
      throw error;
    }
  }

  // ============================================
  // SPRINTS
  // ============================================

  /**
   * Obtiene lista de sprints disponibles
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getAvailableSprints(getToken) {
    try {
      return await apiService.get(`${this.paths.developers}/sprints`, getToken);
    } catch (error) {
      console.error('DevelopersService.getAvailableSprints error:', error);
      throw error;
    }
  }

  // ============================================
  // TIME TRACKING
  // ============================================

  /**
   * Obtiene estadísticas de tiempo
   * @param {string} period - Período ('week', 'month', etc.)
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getTimeTrackingStats(period = 'week', getToken) {
    try {
      return await apiService.get(
        `${this.paths.developers}/time-tracking/stats?period=${period}`,
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.getTimeTrackingStats error:', error);
      throw error;
    }
  }

  /**
   * Obtiene entradas de time tracking
   * @param {Object} filters - Filtros opcionales
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getTimeEntries(filters = {}, getToken) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const queryString = params.toString();
      const endpoint = queryString 
        ? `${this.paths.developers}/time-tracking?${queryString}` 
        : `${this.paths.developers}/time-tracking`;
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('DevelopersService.getTimeEntries error:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva entrada de time tracking
   * @param {Object} timeData - Datos de la entrada de tiempo
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async createTimeEntry(timeData, getToken) {
    try {
      return await apiService.post(`${this.paths.developers}/time-tracking`, timeData, getToken);
    } catch (error) {
      console.error('DevelopersService.createTimeEntry error:', error);
      throw error;
    }
  }

  /**
   * Actualiza una entrada de time tracking
   * @param {string} entryId - ID de la entrada
   * @param {Object} updateData - Datos a actualizar
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async updateTimeEntry(entryId, updateData, getToken) {
    try {
      return await apiService.put(
        `${this.paths.developers}/time-tracking/${entryId}`,
        updateData,
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.updateTimeEntry error:', error);
      throw error;
    }
  }

  /**
   * Elimina una entrada de time tracking
   * @param {string} entryId - ID de la entrada
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async deleteTimeEntry(entryId, getToken) {
    try {
      return await apiService.delete(`${this.paths.developers}/time-tracking/${entryId}`, getToken);
    } catch (error) {
      console.error('DevelopersService.deleteTimeEntry error:', error);
      throw error;
    }
  }

  // ============================================
  // TIMER
  // ============================================

  /**
   * Inicia un timer para una tarea
   * @param {string} taskId - ID de la tarea
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async startTimer(taskId, getToken) {
    try {
      return await apiService.post(`${this.paths.developers}/timer/start`, { taskId }, getToken);
    } catch (error) {
      console.error('DevelopersService.startTimer error:', error);
      throw error;
    }
  }

  /**
   * Detiene el timer activo
   * @param {string} description - Descripción del trabajo realizado
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async stopTimer(description = '', getToken) {
    try {
      return await apiService.post(`${this.paths.developers}/timer/stop`, { description }, getToken);
    } catch (error) {
      console.error('DevelopersService.stopTimer error:', error);
      throw error;
    }
  }

  /**
   * Obtiene el timer activo
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getActiveTimer(getToken) {
    try {
      return await apiService.get(`${this.paths.developers}/timer/active`, getToken);
    } catch (error) {
      console.error('DevelopersService.getActiveTimer error:', error);
      throw error;
    }
  }

  // ============================================
  // BUG REPORTS
  // ============================================

  /**
   * Obtiene reportes de bugs
   * @param {Object} filters - Filtros opcionales
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getBugReports(filters = {}, getToken) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const queryString = params.toString();
      const endpoint = queryString 
        ? `${this.paths.developers}/bug-reports?${queryString}` 
        : `${this.paths.developers}/bug-reports`;
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('DevelopersService.getBugReports error:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo reporte de bug
   * @param {Object} bugData - Datos del bug
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async createBugReport(bugData, getToken) {
    try {
      return await apiService.post(`${this.paths.developers}/bug-reports`, bugData, getToken);
    } catch (error) {
      console.error('DevelopersService.createBugReport error:', error);
      throw error;
    }
  }

  /**
   * Obtiene un bug report específico por ID
   * @param {string} bugId - ID del bug
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getBugReportById(bugId, getToken) {
    try {
      return await apiService.get(`${this.paths.developers}/bug-reports/${bugId}`, getToken);
    } catch (error) {
      console.error('DevelopersService.getBugReportById error:', error);
      throw error;
    }
  }

  /**
   * Actualiza un bug report
   * @param {string} bugId - ID del bug
   * @param {Object} updateData - Datos a actualizar
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async updateBugReport(bugId, updateData, getToken) {
    try {
      return await apiService.put(
        `${this.paths.developers}/bug-reports/${bugId}`,
        updateData,
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.updateBugReport error:', error);
      throw error;
    }
  }

  /**
   * Cambia el estado de un bug report
   * @param {string} bugId - ID del bug
   * @param {string} status - Nuevo estado
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async updateBugStatus(bugId, status, getToken) {
    try {
      return await apiService.patch(
        `${this.paths.developers}/bug-reports/${bugId}/status`,
        { status },
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.updateBugStatus error:', error);
      throw error;
    }
  }

  /**
   * Asigna un bug report a un developer
   * @param {string} bugId - ID del bug
   * @param {string} developerId - ID del developer
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async assignBugReport(bugId, developerId, getToken) {
    try {
      return await apiService.patch(
        `${this.paths.developers}/bug-reports/${bugId}/assign`,
        { developerId },
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.assignBugReport error:', error);
      throw error;
    }
  }

  /**
   * Elimina un bug report
   * @param {string} bugId - ID del bug
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async deleteBugReport(bugId, getToken) {
    try {
      return await apiService.delete(`${this.paths.developers}/bug-reports/${bugId}`, getToken);
    } catch (error) {
      console.error('DevelopersService.deleteBugReport error:', error);
      throw error;
    }
  }

  /**
   * Obtiene comentarios de un bug report
   * @param {string} bugId - ID del bug
   * @param {number} page - Página
   * @param {number} limit - Límite por página
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getBugComments(bugId, page = 1, limit = 20, getToken) {
    try {
      return await apiService.get(
        `${this.paths.developers}/bug-reports/${bugId}/comments?page=${page}&limit=${limit}`,
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.getBugComments error:', error);
      throw error;
    }
  }

  /**
   * Agrega un comentario a un bug report
   * @param {string} bugId - ID del bug
   * @param {string} content - Contenido del comentario
   * @param {string|null} parentComment - ID del comentario padre (para respuestas)
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async addBugComment(bugId, content, parentComment = null, getToken) {
    try {
      return await apiService.post(
        `${this.paths.developers}/bug-reports/${bugId}/comments`,
        { content, parentComment },
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.addBugComment error:', error);
      throw error;
    }
  }

  /**
   * Sube attachments a un bug report
   * Usa fetch directo porque apiService.post() hace JSON.stringify
   * que no es compatible con FormData
   * @param {string} bugId - ID del bug
   * @param {File[]} files - Archivos a subir
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async uploadBugAttachments(bugId, files, getToken) {
    try {
      // Obtener token (getToken puede ser función o string)
      const token = typeof getToken === 'function' ? await getToken() : getToken;
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('attachments', file);
      });

      // Construir URL igual que apiService._executeRequest
      const endpoint = `${this.paths.developers}/bug-reports/${bugId}/attachments`;
      let finalEndpoint = endpoint;
      const baseURL = apiService.baseURL || '';
      if (!baseURL && !endpoint.startsWith('/api') && !endpoint.startsWith('http')) {
        finalEndpoint = `/api${endpoint}`;
      }
      const url = finalEndpoint.startsWith('http') ? finalEndpoint : `${baseURL}${finalEndpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // NO establecer Content-Type: el browser lo agrega con el boundary automáticamente
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DevelopersService.uploadBugAttachments error:', error);
      throw error;
    }
  }

  // ============================================
  // BACKLOG / ASIGNACIÓN DE TAREAS
  // ============================================

  /**
   * Asigna una tarea del backlog al developer autenticado
   * Endpoint: POST /developers/backlog/:taskId/take
   * @param {string} taskId - ID del item de backlog
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async assignBacklogTask(taskId, getToken) {
    try {
      return await apiService.post(
        `${this.paths.developers}/backlog/${taskId}/take`,
        {},
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.assignBacklogTask error:', error);
      throw error;
    }
  }

  /**
   * Asigna una tarea regular al developer autenticado
   * Nota: Usa el mismo endpoint de backlog/take ya que es el único
   * mecanismo de asignación disponible en el backend
   * @param {string} taskId - ID de la tarea
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async assignRegularTask(taskId, getToken) {
    try {
      // Reutiliza el endpoint de backlog/take que es el mecanismo de asignación
      return await apiService.post(
        `${this.paths.developers}/backlog/${taskId}/take`,
        {},
        getToken
      );
    } catch (error) {
      console.error('DevelopersService.assignRegularTask error:', error);
      throw error;
    }
  }

  // ============================================
  // PROYECTOS (para vista de proyectos/tareas disponibles)
  // ============================================

  /**
   * Obtiene lista de productos/proyectos
   * @param {Object} filters - Filtros opcionales
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getProducts(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString()
        ? `${this.paths.products}?${queryParams}`
        : this.paths.products;
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('DevelopersService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Obtiene items de backlog disponibles (sin asignar)
   * @param {Object} filters - Filtros opcionales (tipo, producto, prioridad, search, etc.)
   * @param {Function} getToken - Función para obtener token de autenticación
   */
  async getAvailableBacklogItems(filters = {}, getToken) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const queryString = params.toString();
      const endpoint = queryString
        ? `${this.paths.backlog}?${queryString}`
        : this.paths.backlog;
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('DevelopersService.getAvailableBacklogItems error:', error);
      throw error;
    }
  }
}

// Crear y exportar instancia singleton
export const developersApiService = new DevelopersApiService();
export default developersApiService;
