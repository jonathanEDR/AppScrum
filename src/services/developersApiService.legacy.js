import { apiService } from './apiService';

/**
 * Servicio API para el módulo de Developers
 * Maneja todas las comunicaciones con el backend para funcionalidades de desarrolladores
 */
class DevelopersApiService {
  constructor() {
    this.baseURL = '/developers';
  }

  // Método privado para obtener el token de la forma correcta
  _getTokenFromContext() {
    // Este método será sobrescrito en tiempo de ejecución por el contexto
    throw new Error('Token context not initialized. Use setTokenProvider() first.');
  }

  // Método para establecer el proveedor de token (llamado desde el hook)
  setTokenProvider(getTokenFn) {
    // Aceptar un proveedor de token (función) o un token/promise directo y envolverlo
    if (typeof getTokenFn === 'function') {
      this._getTokenFromContext = getTokenFn;
      return;
    }

    if (getTokenFn && (typeof getTokenFn === 'string' || typeof getTokenFn.then === 'function')) {
      // Si recibimos un token (string) o una promesa, envolver en una función que lo devuelva
      this._getTokenFromContext = () => Promise.resolve(getTokenFn);
      console.warn('developersApiService: setTokenProvider received a token/promise instead of a function — wrapping it.');
      return;
    }

    // Caso por defecto: no válido
    console.warn('developersApiService: setTokenProvider called with invalid value, token requests will be unauthenticated.', getTokenFn);
    this._getTokenFromContext = async () => undefined;
  }

  /**
   * Dashboard - Obtiene métricas del dashboard del developer
   */
  async getDashboardData() {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.get(`${this.baseURL}/dashboard`, token);
      return response;
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Tareas - Obtiene tareas del developer con filtros
   */
  async getTasks(filters = {}) {
    try {
      const token = await this._getTokenFromContext();
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${this.baseURL}/tasks?${queryString}` : `${this.baseURL}/tasks`;
      
      const response = await apiService.get(url, token);
      return response;
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualiza el estado de una tarea
   */
  async updateTaskStatus(taskId, status) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.put(`${this.baseURL}/tasks/${taskId}/status`, {
        status
      }, token);
      return response;
    } catch (error) {
      console.error('Error al actualizar estado de tarea:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Des-asigna una tarea (la devuelve al backlog)
   */
  async unassignTask(taskId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.delete(`${this.baseURL}/tasks/${taskId}/unassign`, token);
      return response;
    } catch (error) {
      console.error('Error al des-asignar tarea:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sprint Board - Obtiene datos del sprint board con filtros
   */
  async getSprintBoardData(sprintId = null, filterMode = 'all') {
    try {
      const token = await this._getTokenFromContext();
      const params = new URLSearchParams();
      
      if (sprintId) {
        params.append('sprintId', sprintId);
      }
      
      if (filterMode) {
        params.append('filterMode', filterMode);
      }
      
      const queryString = params.toString();
      const url = `${this.baseURL}/sprint-board${queryString ? '?' + queryString : ''}`;
      
      const response = await apiService.get(url, token);
      return response;
    } catch (error) {
      console.error('Error al obtener datos del sprint board:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sprints - Obtiene lista de sprints disponibles
   */
  async getAvailableSprints() {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.get(`${this.baseURL}/sprints`, token);
      return response;
    } catch (error) {
      console.error('Error al obtener sprints disponibles:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Time Tracking - Obtiene estadísticas de tiempo
   */
  async getTimeTrackingStats(period = 'week') {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.get(`${this.baseURL}/time-tracking/stats?period=${period}`, token);
      return response;
    } catch (error) {
      console.error('Error al obtener estadísticas de time tracking:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene entradas de time tracking
   */
  async getTimeEntries(filters = {}) {
    try {
      const token = await this._getTokenFromContext();
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${this.baseURL}/time-tracking?${queryString}` : `${this.baseURL}/time-tracking`;
      
      const response = await apiService.get(url, token);
      return response;
    } catch (error) {
      console.error('Error al obtener entradas de tiempo:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Crea una nueva entrada de time tracking
   */
  async createTimeEntry(timeData) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.post(`${this.baseURL}/time-tracking`, timeData, token);
      return response;
    } catch (error) {
      console.error('Error al crear entrada de tiempo:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualiza una entrada de time tracking
   */
  async updateTimeEntry(entryId, updateData) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.put(`${this.baseURL}/time-tracking/${entryId}`, updateData, token);
      return response;
    } catch (error) {
      console.error('Error al actualizar entrada de tiempo:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Elimina una entrada de time tracking
   */
  async deleteTimeEntry(entryId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.delete(`${this.baseURL}/time-tracking/${entryId}`, token);
      return response;
    } catch (error) {
      console.error('Error al eliminar entrada de tiempo:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Timer - Inicia un timer para una tarea
   */
  async startTimer(taskId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.post(`${this.baseURL}/timer/start`, { taskId }, token);
      return response;
    } catch (error) {
      console.error('Error al iniciar timer:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Detiene el timer activo
   */
  async stopTimer(description = '') {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.post(`${this.baseURL}/timer/stop`, { description }, token);
      return response;
    } catch (error) {
      console.error('Error al detener timer:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene el timer activo
   */
  async getActiveTimer() {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.get(`${this.baseURL}/timer/active`, token);
      return response;
    } catch (error) {
      console.error('Error al obtener timer activo:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Bug Reports - Obtiene reportes de bugs
   */
  async getBugReports(filters = {}) {
    try {
      const token = await this._getTokenFromContext();
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${this.baseURL}/bug-reports?${queryString}` : `${this.baseURL}/bug-reports`;
      
      const response = await apiService.get(url, token);
      return response;
    } catch (error) {
      console.error('Error al obtener reportes de bugs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Crea un nuevo reporte de bug
   */
  async createBugReport(bugData) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.post(`${this.baseURL}/bug-reports`, bugData, token);
      return response;
    } catch (error) {
      console.error('Error al crear reporte de bug:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene un bug report específico por ID
   */
  async getBugReportById(bugId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.get(`${this.baseURL}/bug-reports/${bugId}`, token);
      return response;
    } catch (error) {
      console.error('Error al obtener bug report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualiza un bug report
   */
  async updateBugReport(bugId, updateData) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.put(`${this.baseURL}/bug-reports/${bugId}`, updateData, token);
      return response;
    } catch (error) {
      console.error('Error al actualizar bug report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cambia el estado de un bug report
   */
  async updateBugStatus(bugId, status) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.patch(`${this.baseURL}/bug-reports/${bugId}/status`, { status }, token);
      return response;
    } catch (error) {
      console.error('Error al cambiar estado del bug:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Asigna un bug report a un developer
   */
  async assignBugReport(bugId, developerId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.patch(`${this.baseURL}/bug-reports/${bugId}/assign`, { developerId }, token);
      return response;
    } catch (error) {
      console.error('Error al asignar bug report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Elimina un bug report
   */
  async deleteBugReport(bugId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.delete(`${this.baseURL}/bug-reports/${bugId}`, token);
      return response;
    } catch (error) {
      console.error('Error al eliminar bug report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene comentarios de un bug report
   */
  async getBugComments(bugId, page = 1, limit = 20) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.get(
        `${this.baseURL}/bug-reports/${bugId}/comments?page=${page}&limit=${limit}`, 
        token
      );
      return response;
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Agrega un comentario a un bug report
   */
  async addBugComment(bugId, content, parentComment = null) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.post(
        `${this.baseURL}/bug-reports/${bugId}/comments`, 
        { content, parentComment },
        token
      );
      return response;
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sube attachments a un bug report
   */
  async uploadBugAttachments(bugId, files) {
    try {
      const token = await this._getTokenFromContext();
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await apiService.post(
        `${this.baseURL}/bug-reports/${bugId}/attachments`,
        formData,
        token,
        { 'Content-Type': 'multipart/form-data' }
      );
      return response;
    } catch (error) {
      console.error('Error al subir attachments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Asigna una tarea del backlog al developer autenticado
   */
  async assignBacklogTask(taskId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.post(
        `${this.baseURL}/backlog/${taskId}/take`,
        {},
        token
      );
      return response;
    } catch (error) {
      console.error('Error al asignar tarea del backlog:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Asigna una tarea regular al developer autenticado
   */
  async assignRegularTask(taskId) {
    try {
      const token = await this._getTokenFromContext();
      const response = await apiService.put(
        `${this.baseURL}/tasks/${taskId}/assign`,
        { assign_to_me: true },
        token
      );
      return response;
    } catch (error) {
      console.error('Error al asignar tarea regular:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Maneja errores de la API de forma consistente
   */
  handleError(error) {
    if (error.response) {
      // Error de respuesta del servidor
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.error || 'Datos inválidos');
        case 401:
          return new Error('Token de autenticación inválido');
        case 403:
          return new Error('Sin permisos para realizar esta acción');
        case 404:
          return new Error('Recurso no encontrado');
        case 500:
          return new Error('Error interno del servidor');
        default:
          return new Error(data.error || 'Error desconocido');
      }
    } else if (error.request) {
      // Error de red
      return new Error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Error de configuración
      return new Error('Error en la configuración de la solicitud');
    }
  }
}

// Crear y exportar instancia singleton
export const developersApiService = new DevelopersApiService();
export default developersApiService;
