import { apiService } from './apiService';

class UserService {
  constructor() {
    this.currentUser = null;
    this.isLoading = false;
    this.paths = {
      users: '/users',
      admin: '/admin'
    };
  }

  // Obtener el perfil del usuario actual
  async getCurrentUser(token) {
    try {
      if (this.isLoading) return null;
      this.isLoading = true;

      const profile = await apiService.request('/auth/profile', {
        method: 'GET'
      }, () => Promise.resolve(token));

      this.currentUser = profile;
      return profile;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Actualizar el rol del usuario
  async updateUserRole(userId, role, token) {
    try {
      return await apiService.request('/auth/role', {
        method: 'PUT',
        body: JSON.stringify({ role })
      }, () => Promise.resolve(token));
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Verificar estado de autenticación
  async checkAuth(token) {
    try {
      return await apiService.request('/auth/check', {
        method: 'GET'
      }, () => Promise.resolve(token));
    } catch (error) {
      console.error('Error checking auth:', error);
      throw error;
    }
  }

  // ============================================
  // DASHBOARD DEL CLIENTE / INVITADO
  // ============================================

  /**
   * Obtener dashboard del usuario (incluye productos invitados)
   * @param {string} userId - clerk_id del usuario
   * @param {Function} getToken - Función para obtener token
   */
  async getDashboard(userId, getToken) {
    try {
      return await apiService.get(`${this.paths.users}/dashboard/${userId}`, getToken);
    } catch (error) {
      console.error('UserService.getDashboard error:', error);
      throw error;
    }
  }

  /**
   * Obtener proyectos asignados al usuario
   * @param {string} userId - clerk_id del usuario
   * @param {Function} getToken - Función para obtener token
   */
  async getProjects(userId, getToken) {
    try {
      return await apiService.get(`${this.paths.users}/projects/${userId}`, getToken);
    } catch (error) {
      console.error('UserService.getProjects error:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso detallado de un producto
   * @param {string} productId - ID del producto
   * @param {Function} getToken - Función para obtener token
   */
  async getProductProgress(productId, getToken) {
    try {
      return await apiService.get(`${this.paths.users}/products/${productId}/progress`, getToken);
    } catch (error) {
      console.error('UserService.getProductProgress error:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario
   * @param {string} userId - clerk_id del usuario
   * @param {Function} getToken - Función para obtener token
   */
  async getProfile(userId, getToken) {
    try {
      return await apiService.get(`${this.paths.users}/profile/${userId}`, getToken);
    } catch (error) {
      console.error('UserService.getProfile error:', error);
      throw error;
    }
  }

  // ============================================
  // ADMIN: GESTIÓN DE ACCESO INVITADOS
  // ============================================

  /**
   * Obtener todos los productos (para panel admin)
   * @param {Function} getToken - Función para obtener token
   */
  async getAdminProducts(getToken) {
    try {
      return await apiService.get(`${this.paths.admin}/products`, getToken);
    } catch (error) {
      console.error('UserService.getAdminProducts error:', error);
      throw error;
    }
  }

  /**
   * Invitar un usuario como observador a un producto
   * @param {string} productId - ID del producto
   * @param {string} userId - ID del usuario a invitar
   * @param {Function} getToken - Función para obtener token
   */
  async inviteUserToProduct(productId, userId, getToken) {
    try {
      return await apiService.post(
        `${this.paths.admin}/products/${productId}/invite`,
        { userId },
        getToken
      );
    } catch (error) {
      console.error('UserService.inviteUserToProduct error:', error);
      throw error;
    }
  }

  /**
   * Revocar acceso de un usuario invitado
   * @param {string} productId - ID del producto
   * @param {string} userId - ID del usuario a revocar
   * @param {Function} getToken - Función para obtener token
   */
  async revokeUserFromProduct(productId, userId, getToken) {
    try {
      return await apiService.delete(
        `${this.paths.admin}/products/${productId}/invite/${userId}`,
        getToken
      );
    } catch (error) {
      console.error('UserService.revokeUserFromProduct error:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios con rol 'user' (para selector)
   * @param {Function} getToken - Función para obtener token
   */
  async getUsersByRole(getToken) {
    try {
      return await apiService.get(`${this.paths.admin}/users?role=user&limit=100`, getToken);
    } catch (error) {
      console.error('UserService.getUsersByRole error:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
