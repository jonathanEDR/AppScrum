import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { userService } from '../../services/userService';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Briefcase, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ChevronDown,
  X,
  Eye
} from 'lucide-react';

/**
 * GuestAccessPanel - Panel de administración para gestionar acceso de invitados
 * Solo visible para super_admin
 * Permite asignar/revocar acceso a usuarios con rol 'user' a productos específicos
 */
const GuestAccessPanel = () => {
  const { getToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Estado para el formulario de invitación
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsRes, usersRes] = await Promise.all([
        userService.getAdminProducts(getToken),
        userService.getUsersByRole(getToken)
      ]);
      
      setProducts(productsRes?.products || []);
      setUsers(usersRes?.users || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-limpiar mensajes de éxito
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleInvite = async () => {
    if (!selectedProduct || !selectedUser) {
      setError('Selecciona un producto y un usuario');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      
      const result = await userService.inviteUserToProduct(selectedProduct, selectedUser, getToken);
      setSuccess(result.message || 'Usuario invitado exitosamente');
      
      // Refrescar datos
      await fetchData();
      setSelectedUser('');
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Error al invitar usuario';
      setError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (productId, userId, userName) => {
    if (!confirm(`¿Revocar acceso de "${userName}" a este producto?`)) return;
    
    try {
      setActionLoading(true);
      setError(null);
      
      const result = await userService.revokeUserFromProduct(productId, userId, getToken);
      setSuccess(result.message || 'Acceso revocado exitosamente');
      
      await fetchData();
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Error al revocar acceso';
      setError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(u => {
    if (!searchUser) return true;
    const term = searchUser.toLowerCase();
    return (
      (u.nombre_negocio && u.nombre_negocio.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  // Usuarios que aún no están invitados al producto seleccionado
  const availableUsers = filteredUsers.filter(u => {
    if (!selectedProduct) return true;
    const product = products.find(p => p._id === selectedProduct);
    if (!product) return true;
    return !product.invitados?.some(inv => inv._id === u._id);
  });

  // Contar total de invitaciones activas
  const totalInvitations = products.reduce((acc, p) => acc + (p.invitados?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando panel de accesos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8" />
              Gestión de Acceso de Invitados
            </h1>
            <p className="text-indigo-100 text-lg">
              Asigna o revoca acceso a productos para usuarios con rol cliente
            </p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="bg-blue-500 rounded-lg p-3">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Productos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{products.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="bg-green-500 rounded-lg p-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios Clientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="bg-purple-500 rounded-lg p-3">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Invitaciones Activas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalInvitations}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-400 flex-1">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Formulario de invitación */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Invitar Usuario a Producto
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Producto
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seleccionar producto...</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.nombre} ({p.estado})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de usuario con búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuario (Cliente)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Buscar usuario..."
                  className="w-full px-3 py-2.5 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              {searchUser && availableUsers.length > 0 && (
                <div className="mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {availableUsers.map(u => (
                    <button
                      key={u._id}
                      onClick={() => {
                        setSelectedUser(u._id);
                        setSearchUser(u.nombre_negocio || u.email);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                        selectedUser === u._id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{u.nombre_negocio || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {searchUser && availableUsers.length === 0 && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No se encontraron usuarios disponibles</p>
              )}
            </div>

            {/* Botón de acción */}
            <div className="flex items-end">
              <button
                onClick={handleInvite}
                disabled={!selectedProduct || !selectedUser || actionLoading}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {actionLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Invitar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos con invitados */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Productos y sus Invitados
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No hay productos creados</p>
            </div>
          ) : (
            products.map(product => (
              <ProductInvitadosRow 
                key={product._id} 
                product={product} 
                onRevoke={handleRevoke}
                actionLoading={actionLoading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Fila de producto con sus invitados expandible
const ProductInvitadosRow = ({ product, onRevoke, actionLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const invitados = product.invitados || [];

  const statusColors = {
    activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    inactivo: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  };

  return (
    <div className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <Briefcase className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{product.nombre}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Responsable: {product.responsable?.nombre_negocio || product.responsable?.email || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[product.estado] || statusColors.activo}`}>
            {product.estado}
          </span>
          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-medium">
            {invitados.length} invitado{invitados.length !== 1 ? 's' : ''}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-4">
          {invitados.length > 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {invitados.map(inv => (
                <div key={inv._id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {inv.nombre_negocio || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{inv.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRevoke(product._id, inv._id, inv.nombre_negocio || inv.email)}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Revocar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin invitados asignados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuestAccessPanel;
