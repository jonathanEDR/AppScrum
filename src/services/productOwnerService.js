/**
 * Product Owner Service
 * Servicio centralizado para todas las operaciones del Product Owner
 * 
 * @module services/productOwnerService
 * @description
 * Este servicio encapsula TODAS las llamadas API relacionadas con:
 * - Gestión de productos
 * - Product Backlog
 * - Sprints
 * - Releases
 * - Roadmap
 * - Métricas
 * 
 * ✅ Utiliza apiService para:
 *    - Deduplicación de peticiones
 *    - Caché automático
 *    - Manejo centralizado de tokens
 *    - Headers de autenticación
 */

import { apiService } from './apiService';

class ProductOwnerService {
  constructor() {
    // Paths base para cada módulo
    this.paths = {
      products: '/products',
      backlog: '/backlog',
      sprints: '/sprints',
      releases: '/releases',
      metrics: '/metricas',
      roadmap: '/releases' // Usa el mismo endpoint que releases
    };
  }

  // ============================================
  // GESTIÓN DE PRODUCTOS
  // ============================================

  /**
   * Obtener todos los productos
   * @param {Object} filters - Filtros opcionales (estado, búsqueda, etc.)
   * @param {Function} getToken - Función para obtener token de autenticación
   * @returns {Promise<Object>} Lista de productos
   */
  async getProducts(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString() 
        ? `${this.paths.products}?${queryParams}` 
        : this.paths.products;
      
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Obtener un producto específico por ID
   * @param {string} productId - ID del producto
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos del producto
   */
  async getProduct(productId, getToken) {
    try {
      return await apiService.get(`${this.paths.products}/${productId}`, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getProduct error:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo producto
   * @param {Object} productData - Datos del producto
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Producto creado
   */
  async createProduct(productData, getToken) {
    try {
      const response = await apiService.post(this.paths.products, productData, getToken);
      
      // Invalidar caché de productos
      apiService.invalidateApiCache('products');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.createProduct error:', error);
      throw error;
    }
  }

  /**
   * Actualizar un producto existente
   * @param {string} productId - ID del producto
   * @param {Object} updates - Datos a actualizar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Producto actualizado
   */
  async updateProduct(productId, updates, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.products}/${productId}`, 
        updates, 
        getToken
      );
      
      // Invalidar caché de productos
      apiService.invalidateApiCache('products');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.updateProduct error:', error);
      throw error;
    }
  }

  /**
   * Eliminar un producto
   * @param {string} productId - ID del producto
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteProduct(productId, getToken) {
    try {
      const response = await apiService.delete(
        `${this.paths.products}/${productId}`, 
        getToken
      );
      
      // Invalidar caché de productos
      apiService.invalidateApiCache('products');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.deleteProduct error:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios disponibles para asignar como responsables
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Lista de usuarios
   */
  async getUsersForAssignment(getToken) {
    try {
      return await apiService.get(`${this.paths.products}/users-for-assignment`, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getUsersForAssignment error:', error);
      throw error;
    }
  }

  // ============================================
  // GESTIÓN DE BACKLOG
  // ============================================

  /**
   * Obtener items del backlog
   * @param {Object} filters - Filtros (productId, sprintId, tipo, prioridad, estado)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Lista de items del backlog
   */
  async getBacklogItems(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString() 
        ? `${this.paths.backlog}?${queryParams}` 
        : this.paths.backlog;
      
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getBacklogItems error:', error);
      throw error;
    }
  }

  /**
   * Obtener un item del backlog por ID
   * @param {string} itemId - ID del item
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos del item
   */
  async getBacklogItem(itemId, getToken) {
    try {
      return await apiService.get(`${this.paths.backlog}/${itemId}`, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getBacklogItem error:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo item del backlog
   * @param {Object} itemData - Datos del item
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Item creado
   */
  async createBacklogItem(itemData, getToken) {
    try {
      const response = await apiService.post(this.paths.backlog, itemData, getToken);
      
      // Invalidar caché de backlog
      apiService.invalidateApiCache('backlog');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.createBacklogItem error:', error);
      throw error;
    }
  }

  /**
   * Actualizar un item del backlog
   * @param {string} itemId - ID del item
   * @param {Object} updates - Datos a actualizar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Item actualizado
   */
  async updateBacklogItem(itemId, updates, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.backlog}/${itemId}`, 
        updates, 
        getToken
      );
      
      // Invalidar caché de backlog
      apiService.invalidateApiCache('backlog');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.updateBacklogItem error:', error);
      throw error;
    }
  }

  /**
   * Eliminar un item del backlog
   * @param {string} itemId - ID del item
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteBacklogItem(itemId, getToken) {
    try {
      const response = await apiService.delete(
        `${this.paths.backlog}/${itemId}`, 
        getToken
      );
      
      // Invalidar caché de backlog
      apiService.invalidateApiCache('backlog');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.deleteBacklogItem error:', error);
      throw error;
    }
  }

  /**
   * Reordenar items del backlog (cambiar prioridades)
   * @param {Array<Object>} items - Array de items con nuevas prioridades [{_id, prioridad}]
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación de reordenamiento
   */
  async reorderBacklog(items, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.backlog}/reorder`, 
        { items }, 
        getToken
      );
      
      // Invalidar caché de backlog
      apiService.invalidateApiCache('backlog');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.reorderBacklog error:', error);
      throw error;
    }
  }

  // ============================================
  // GESTIÓN DE SPRINTS
  // ============================================

  /**
   * Obtener sprints
   * @param {Object} filters - Filtros (producto, estado)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Lista de sprints
   */
  async getSprints(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString() 
        ? `${this.paths.sprints}?${queryParams}` 
        : this.paths.sprints;
      
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getSprints error:', error);
      throw error;
    }
  }

  /**
   * Obtener un sprint específico
   * @param {string} sprintId - ID del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos del sprint
   */
  async getSprint(sprintId, getToken) {
    try {
      return await apiService.get(`${this.paths.sprints}/${sprintId}`, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getSprint error:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo sprint
   * @param {Object} sprintData - Datos del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Sprint creado
   */
  async createSprint(sprintData, getToken) {
    try {
      const response = await apiService.post(this.paths.sprints, sprintData, getToken);
      
      // Invalidar caché de sprints
      apiService.invalidateApiCache('sprints');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.createSprint error:', error);
      throw error;
    }
  }

  /**
   * Actualizar un sprint
   * @param {string} sprintId - ID del sprint
   * @param {Object} updates - Datos a actualizar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Sprint actualizado
   */
  async updateSprint(sprintId, updates, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.sprints}/${sprintId}`, 
        updates, 
        getToken
      );
      
      // Invalidar caché de sprints
      apiService.invalidateApiCache('sprints');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.updateSprint error:', error);
      throw error;
    }
  }

  /**
   * Eliminar un sprint
   * @param {string} sprintId - ID del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteSprint(sprintId, getToken) {
    try {
      const response = await apiService.delete(
        `${this.paths.sprints}/${sprintId}`, 
        getToken
      );
      
      // Invalidar caché de sprints
      apiService.invalidateApiCache('sprints');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.deleteSprint error:', error);
      throw error;
    }
  }

  /**
   * Obtener datos del burndown de un sprint
   * @param {string} sprintId - ID del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos del burndown
   */
  async getSprintBurndown(sprintId, getToken) {
    try {
      return await apiService.get(`${this.paths.sprints}/${sprintId}/burndown-data`, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getSprintBurndown error:', error);
      throw error;
    }
  }

  /**
   * Validar capacidad del sprint antes de asignar historias
   * @param {string} sprintId - ID del sprint
   * @param {Array<string>} storyIds - IDs de las historias a validar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Resultado de la validación
   */
  async validateSprintCapacity(sprintId, storyIds, getToken) {
    try {
      return await apiService.post(
        `${this.paths.sprints}/${sprintId}/validate-capacity`,
        { storyIds },
        getToken
      );
    } catch (error) {
      console.error('ProductOwnerService.validateSprintCapacity error:', error);
      throw error;
    }
  }

  /**
   * Asignar múltiples historias a un sprint
   * @param {string} sprintId - ID del sprint
   * @param {Array<string>} storyIds - IDs de las historias a asignar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Resultado de la asignación
   */
  async assignMultipleStoriesToSprint(sprintId, storyIds, getToken) {
    try {
      const response = await apiService.post(
        `${this.paths.sprints}/${sprintId}/assign-multiple`,
        { storyIds },
        getToken
      );

      // Invalidar caché de sprints y backlog
      apiService.invalidateApiCache('sprints');
      apiService.invalidateApiCache('backlog');

      return response;
    } catch (error) {
      console.error('ProductOwnerService.assignMultipleStoriesToSprint error:', error);
      throw error;
    }
  }

  // ============================================
  // GESTIÓN DE RELEASES
  // ============================================

  /**
   * Obtener releases
   * @param {Object} filters - Filtros (producto, estado)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Lista de releases
   */
  async getReleases(filters = {}, getToken) {
    try {
      const queryParams = new URLSearchParams(filters);
      const endpoint = queryParams.toString() 
        ? `${this.paths.releases}?${queryParams}` 
        : this.paths.releases;
      
      return await apiService.get(endpoint, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getReleases error:', error);
      throw error;
    }
  }

  /**
   * Obtener una release específica
   * @param {string} releaseId - ID de la release
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos de la release
   */
  async getRelease(releaseId, getToken) {
    try {
      return await apiService.get(`${this.paths.releases}/${releaseId}`, getToken);
    } catch (error) {
      console.error('ProductOwnerService.getRelease error:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva release
   * @param {Object} releaseData - Datos de la release
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Release creada
   */
  async createRelease(releaseData, getToken) {
    try {
      const response = await apiService.post(this.paths.releases, releaseData, getToken);
      
      // Invalidar caché de releases
      apiService.invalidateApiCache('releases');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.createRelease error:', error);
      throw error;
    }
  }

  /**
   * Actualizar una release
   * @param {string} releaseId - ID de la release
   * @param {Object} updates - Datos a actualizar
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Release actualizada
   */
  async updateRelease(releaseId, updates, getToken) {
    try {
      const response = await apiService.put(
        `${this.paths.releases}/${releaseId}`, 
        updates, 
        getToken
      );
      
      // Invalidar caché de releases
      apiService.invalidateApiCache('releases');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.updateRelease error:', error);
      throw error;
    }
  }

  /**
   * Eliminar una release
   * @param {string} releaseId - ID de la release
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteRelease(releaseId, getToken) {
    try {
      const response = await apiService.delete(
        `${this.paths.releases}/${releaseId}`, 
        getToken
      );
      
      // Invalidar caché de releases
      apiService.invalidateApiCache('releases');
      
      return response;
    } catch (error) {
      console.error('ProductOwnerService.deleteRelease error:', error);
      throw error;
    }
  }

  // ============================================
  // MÉTRICAS Y REPORTES
  // ============================================

  /**
   * Obtener métricas del dashboard
   * @param {string} productId - ID del producto
   * @param {Object} options - Opciones (periodo, etc.)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Métricas del dashboard
   */
  async getDashboardMetrics(productId, options = {}, getToken) {
    try {
      const { periodo = '30d' } = options;
      return await apiService.get(
        `${this.paths.metrics}/dashboard/${productId}?periodo=${periodo}`, 
        getToken
      );
    } catch (error) {
      console.error('ProductOwnerService.getDashboardMetrics error:', error);
      throw error;
    }
  }

  /**
   * Obtener velocity del equipo
   * @param {string} productId - ID del producto
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos de velocity
   */
  async getVelocity(productId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.metrics}/velocity/${productId}`, 
        getToken
      );
    } catch (error) {
      console.error('ProductOwnerService.getVelocity error:', error);
      throw error;
    }
  }

  /**
   * Obtener datos del burndown
   * @param {string} sprintId - ID del sprint
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Object>} Datos del burndown
   */
  async getBurndownData(sprintId, getToken) {
    try {
      return await apiService.get(
        `${this.paths.metrics}/burndown/${sprintId}`, 
        getToken
      );
    } catch (error) {
      console.error('ProductOwnerService.getBurndownData error:', error);
      throw error;
    }
  }

  /**
   * Exportar métricas en formato específico
   * @param {string} productId - ID del producto
   * @param {Object} options - Opciones de exportación (formato, periodo)
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Blob>} Archivo descargable
   */
  async exportMetrics(productId, options = {}, getToken) {
    try {
      const { formato = 'excel', periodo = '30d' } = options;
      
      // Para descargas, necesitamos usar fetch directo pero con headers de apiService
      const token = typeof getToken === 'function' ? await getToken() : getToken;
      const headers = await apiService.getAuthHeaders(() => Promise.resolve(token));
      
      const response = await fetch(
        `${apiService.baseURL}${this.paths.metrics}/export/${productId}?formato=${formato}&periodo=${periodo}`, 
        { method: 'GET', headers }
      );
      
      if (!response.ok) {
        throw new Error('Error al exportar métricas');
      }
      
      return await response.blob();
    } catch (error) {
      console.error('ProductOwnerService.exportMetrics error:', error);
      throw error;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Invalidar caché completo del módulo Product Owner
   * Útil después de operaciones masivas o sincronizaciones
   */
  invalidateAllCache() {
    console.log('🗑️ Invalidando caché completo de Product Owner');
    apiService.invalidateApiCache('products');
    apiService.invalidateApiCache('backlog');
    apiService.invalidateApiCache('sprints');
    apiService.invalidateApiCache('releases');
    apiService.invalidateApiCache('metricas');
  }

  /**
   * Verificar conectividad con backend
   * @param {Function} getToken - Función para obtener token
   * @returns {Promise<Boolean>} true si el servidor responde correctamente
   */
  async checkServerHealth(getToken) {
    try {
      await apiService.checkServerHealth();
      return true;
    } catch (error) {
      console.error('ProductOwnerService.checkServerHealth error:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const productOwnerService = new ProductOwnerService();
export default productOwnerService;
