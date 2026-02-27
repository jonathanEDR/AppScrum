// Servicios API para el módulo Scrum Master
// Usar URL estática para evitar problemas de process en el navegador
const API_BASE_URL = 'http://localhost:5000/api';

class ScrumMasterService {
  constructor() {
    // Función para obtener token de Clerk desde contexto
    this._getTokenFromContext = async () => undefined;
  }

  // Método para configurar el proveedor de token desde el contexto de Clerk
  setTokenProvider(getTokenFn) {
    console.log('scrumMasterService: Setting token provider');
    if (typeof getTokenFn === 'function') {
      this._getTokenFromContext = getTokenFn;
      console.log('scrumMasterService: Token provider set successfully (function)');
      return;
    }
    
    if (getTokenFn && (typeof getTokenFn === 'string' || typeof getTokenFn.then === 'function')) {
      console.log('scrumMasterService: Token provider set successfully (string/promise)');
      this._getTokenFromContext = () => Promise.resolve(getTokenFn);
      return;
    }

    console.warn('scrumMasterService: setTokenProvider called with invalid value, token requests will be unauthenticated.', getTokenFn);
    this._getTokenFromContext = async () => undefined;
  }

  // Método privado para obtener headers con autenticación
  async _getHeaders() {
    try {
      const token = await this._getTokenFromContext();
      return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
    } catch (error) {
      console.error('Error al obtener token para scrumMasterService:', error);
      return { 'Content-Type': 'application/json' };
    }
  }
  // Métodos para impedimentos
  async getImpediments(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const headers = await this._getHeaders();
      const response = await fetch(`${API_BASE_URL}/impediments?${queryParams}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener impedimentos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getImpediments:', error);
      throw error;
    }
  }

  async createImpediment(impedimentData) {
    try {
      const headers = await this._getHeaders();
      const response = await fetch(`${API_BASE_URL}/impediments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(impedimentData)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear impedimento');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en createImpediment:', error);
      throw error;
    }
  }

  async updateImpediment(id, impedimentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/impediments/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(impedimentData)
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar impedimento');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en updateImpediment:', error);
      throw error;
    }
  }

  async deleteImpediment(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/impediments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar impedimento');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en deleteImpediment:', error);
      throw error;
    }
  }

  // Métodos para ceremonias
  async getCeremonies(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/ceremonies?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener ceremonias');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getCeremonies:', error);
      throw error;
    }
  }

  async createCeremony(ceremonyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/ceremonies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ceremonyData)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear ceremonia');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en createCeremony:', error);
      throw error;
    }
  }

  async updateCeremony(id, ceremonyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/ceremonies/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ceremonyData)
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar ceremonia');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en updateCeremony:', error);
      throw error;
    }
  }

  // Métodos para métricas y reportes
  async getSprintMetrics(sprintId) {
    try {
      const response = await fetch(`${API_BASE_URL}/sprints/${sprintId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener métricas del sprint');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getSprintMetrics:', error);
      throw error;
    }
  }

  async getTeamVelocity(timeframe = 'last_5_sprints') {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/velocity?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener velocidad del equipo');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getTeamVelocity:', error);
      throw error;
    }
  }

  async getBurndownData(sprintId) {
    try {
      const response = await fetch(`${API_BASE_URL}/sprints/${sprintId}/burndown`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener datos de burndown');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getBurndownData:', error);
      throw error;
    }
  }

  // Métodos para gestión del equipo
  async getTeamMembers() {
    try {
      const response = await fetch(`${API_BASE_URL}/team/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener miembros del equipo');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getTeamMembers:', error);
      throw error;
    }
  }

  async updateTeamMemberStatus(memberId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/team/members/${memberId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar estado del miembro');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en updateTeamMemberStatus:', error);
      throw error;
    }
  }

  // Métodos para exportación de reportes
  async exportImpedimentsReport(format = 'pdf', filters = {}) {
    try {
      const queryParams = new URLSearchParams({ format, ...filters });
      const response = await fetch(`${API_BASE_URL}/reports/impediments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar reporte de impedimentos');
      }
      
      // Crear y descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `impedimentos_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error en exportImpedimentsReport:', error);
      throw error;
    }
  }

  async exportSprintReport(sprintId, format = 'pdf') {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/sprints/${sprintId}?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar reporte del sprint');
      }
      
      // Crear y descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sprint_${sprintId}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error en exportSprintReport:', error);
      throw error;
    }
  }

  // Métodos para Bug Reports
  async getBugReports(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar filtros a los query params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });

      const headers = await this._getHeaders();
      const response = await fetch(`${API_BASE_URL}/scrum-master/bugs?${queryParams}`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error al obtener bug reports: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getBugReports:', error);
      throw error;
    }
  }

  async getBugReportById(id) {
    try {
      const headers = await this._getHeaders();
      const response = await fetch(`${API_BASE_URL}/scrum-master/bugs/${id}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener bug report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getBugReportById:', error);
      throw error;
    }
  }

  async getBugComments(bugId) {
    try {
      const headers = await this._getHeaders();
      const response = await fetch(`${API_BASE_URL}/scrum-master/bugs/${bugId}/comments`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener comentarios');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en getBugComments:', error);
      throw error;
    }
  }

  async addBugComment(bugId, text) {
    try {
      const headers = await this._getHeaders();
      const response = await fetch(`${API_BASE_URL}/scrum-master/bugs/${bugId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error('Error al agregar comentario');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en addBugComment:', error);
      throw error;
    }
  }
}

// Crear instancia singleton del servicio
const scrumMasterService = new ScrumMasterService();

export default scrumMasterService;
