// Índice de servicios - Exporta todos los servicios de la aplicación

// Importar servicios principales
import apiService from './apiService.js';
import scrumMasterService from './scrumMasterService.js';
import productOwnerService from './productOwnerService.js';

// Importar otros servicios específicos
let developersApiService = null;
try {
  const developersModule = await import('./developersApiService.js');
  developersApiService = developersModule.default;
} catch (error) {
  console.warn('developersApiService no encontrado');
}

// Crear alias para compatibilidad
export const scrumMasterApiService = scrumMasterService;

// Exportar servicios individuales
export {
  apiService,
  scrumMasterService,
  productOwnerService,
  developersApiService
};

// Exportar como default un objeto con todos los servicios
export default {
  api: apiService,
  scrumMaster: scrumMasterService,
  scrumMasterApi: scrumMasterService, // Alias
  productOwner: productOwnerService,
  developers: developersApiService
};