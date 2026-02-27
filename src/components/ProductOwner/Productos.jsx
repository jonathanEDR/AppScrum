import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalProducto from '../modalproductowner/ModalProducto';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { productOwnerService } from '../../services/productOwnerService';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User,
  Calendar,
  RefreshCw,
  MoreVertical,
  Eye,
  Database,
  Boxes
} from 'lucide-react';

const Productos = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    responsable: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    prioridad: 'media',
    estado: 'activo'
  });

  const estadoColors = theme === 'dark' ? {
    activo: 'bg-green-900/30 text-green-400 border-green-800',
    inactivo: 'bg-gray-700/30 text-gray-400 border-gray-600',
    completado: 'bg-blue-900/30 text-blue-400 border-blue-800'
  } : {
    activo: 'bg-green-100 text-green-800 border-green-200',
    inactivo: 'bg-gray-100 text-gray-800 border-gray-200',
    completado: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await productOwnerService.getProducts({}, getToken);
      setProductos(data.products || data.data || data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar productos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios disponibles para asignación
  const fetchUsuarios = async () => {
    try {
      const data = await productOwnerService.getUsersForAssignment(getToken);
      setUsuarios(data.users || data.data || data || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar colaboradores: ' + error.message);
      setUsuarios([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        // Actualizar producto existente
        const data = await productOwnerService.updateProduct(
          editingProduct._id,
          formData,
          getToken
        );
        setError(`success:${data.message || 'Producto actualizado correctamente'}`);
      } else {
        // Crear nuevo producto
        const data = await productOwnerService.createProduct(formData, getToken);
        setError(`success:${data.message || 'Producto creado correctamente'}`);
      }
      
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      await fetchProductos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setError('Error: ' + error.message);
    }
  };

  const handleEdit = (producto) => {
    if (!producto || !producto._id) {
      console.error('Producto no válido para editar:', producto);
      setError('Error: Producto no válido para editar');
      return;
    }

    try {
      setEditingProduct(producto);
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        responsable: producto.responsable?._id || producto.responsable || '',
  fecha_inicio: producto.fecha_inicio ? (typeof producto.fecha_inicio === 'string' ? producto.fecha_inicio.split('T')[0] : new Date(producto.fecha_inicio).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
  fecha_fin: producto.fecha_fin ? (typeof producto.fecha_fin === 'string' ? producto.fecha_fin.split('T')[0] : new Date(producto.fecha_fin).toISOString().split('T')[0]) : '',
        prioridad: producto.prioridad || 'media',
        estado: producto.estado || 'activo'
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error al configurar edición:', error);
      setError('Error al abrir formulario de edición');
    }
  };

  const handleDelete = async (producto) => {
    if (!producto || !producto._id) {
      console.error('Producto no válido para eliminar:', producto);
      setError('Error: Producto no válido para eliminar');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      return;
    }
    
    try {
      await productOwnerService.deleteProduct(producto._id, getToken);
      setError('success:Producto eliminado exitosamente');
      await fetchProductos();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError('Error: ' + error.message);
    }
  };

  const handleViewDetails = (producto) => {
    if (!producto || !producto._id) {
      console.error('Producto no válido para ver detalles:', producto);
      setError('Error: Producto no válido para ver detalles');
      return;
    }

    setSelectedProduct(producto);
    setShowDetails(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      responsable: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      prioridad: 'media',
      estado: 'activo'
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedProduct(null);
  };

  useEffect(() => {
    fetchProductos();
    fetchUsuarios();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className={`mt-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow-sm p-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Gestión de Productos</h1>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Administra los productos de tu organización
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        </div>

        {/* Búsqueda */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`} size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchProductos()}
            />
          </div>
          <button
            onClick={fetchProductos}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <RefreshCw size={20} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className={`p-4 rounded-lg ${
          error.startsWith('success:')
            ? theme === 'dark'
              ? 'bg-green-900/30 text-green-400 border border-green-800'
              : 'bg-green-50 border border-green-200 text-green-700'
            : theme === 'dark'
              ? 'bg-red-900/30 text-red-400 border border-red-800'
              : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {error.startsWith('success:') ? error.replace('success:', '') : error}
        </div>
      )}

      {/* Formulario */}
      <ModalProducto
        isOpen={showForm}
        onClose={handleCancel}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        usuarios={usuarios}
        error={error}
      />

      {/* Lista de productos */}
      <div className={`rounded-lg shadow-sm overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Productos ({productos.length})
          </h2>
        </div>

        {productos.length === 0 ? (
          <div className="text-center py-12">
            <Package className={`mx-auto h-12 w-12 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`mt-2 text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
            }`}>No hay productos</h3>
            <p className={`mt-1 text-sm ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Comienza creando tu primer producto
            </p>
          </div>
        ) : (
          <div className={`divide-y ${
            theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
          }`}>
            {productos.map((producto) => (
              <div key={producto._id} className={`p-6 transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {producto.nombre}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                        estadoColors[producto.estado]
                      }`}>
                        {producto.estado}
                      </span>
                    </div>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {producto.descripcion}
                    </p>
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-3 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{producto.responsable?.nombre_negocio || producto.responsable?.email || 'No asignado'}</span>
                      </div>
                      {producto.fecha_inicio && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Inicio: {new Date(producto.fecha_inicio).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                      {producto.fecha_fin && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Fin: {new Date(producto.fecha_fin).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Creado: {new Date(producto.createdAt).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/product_owner/database-schema/${producto._id}`)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-indigo-400 hover:bg-gray-600'
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                      title="Esquema de Base de Datos"
                    >
                      <Database size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/product_owner/architecture/${producto._id}`)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-blue-400 hover:bg-gray-600'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Arquitectura del Proyecto"
                    >
                      <Boxes size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(producto)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-orange-400 hover:bg-gray-600'
                          : 'text-orange-600 hover:bg-orange-50'
                      }`}
                      title="Editar producto"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(producto)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-gray-600'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title="Eliminar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleViewDetails(producto)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:bg-gray-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Detalles del Producto</h3>
              <button
                onClick={handleCloseDetails}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Nombre</label>
                  <p className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{selectedProduct.nombre}</p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Estado</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    estadoColors[selectedProduct.estado] || 
                    (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800')
                  }`}>
                    {selectedProduct.estado?.charAt(0).toUpperCase() + selectedProduct.estado?.slice(1)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                }`}>Descripción</label>
                <p className={`p-3 rounded-lg leading-relaxed ${
                  theme === 'dark'
                    ? 'text-gray-300 bg-gray-700'
                    : 'text-gray-900 bg-gray-50'
                }`}>{selectedProduct.descripcion || 'Sin descripción disponible'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Responsable</label>
                  <div className="flex items-center gap-2">
                    <User size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                      {selectedProduct.responsable?.nombre_negocio || 
                       selectedProduct.responsable?.email || 
                       'No asignado'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Creado Por</label>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-500" />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                      {selectedProduct.created_by?.nombre_negocio || 
                       selectedProduct.created_by?.email || 
                       'Sistema'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Fecha de Inicio</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                      {selectedProduct.fecha_inicio ? 
                        new Date(selectedProduct.fecha_inicio).toLocaleDateString('es-ES') : 
                        'No definida'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Fecha de Fin</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                      {selectedProduct.fecha_fin ? 
                        new Date(selectedProduct.fecha_fin).toLocaleDateString('es-ES') : 
                        'No definida'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Fecha de Creación</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                      {new Date(selectedProduct.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>Última Actualización</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                      {new Date(selectedProduct.updatedAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`flex justify-end gap-3 mt-6 pt-6 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  handleCloseDetails();
                  handleEdit(selectedProduct);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Editar Producto
              </button>
              <button
                onClick={handleCloseDetails}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;