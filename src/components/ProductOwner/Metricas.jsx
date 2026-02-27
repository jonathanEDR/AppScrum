import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { productOwnerService } from '../../services/productOwnerService';
import { useProducts } from '../../hooks/useProducts';
import { useSprints } from '../../hooks/useSprints';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Download, 
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Activity,
  Users
} from 'lucide-react';

const Metricas = () => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  
  // Estados locales
  const [metricas, setMetricas] = useState(null);
  const [velocityData, setVelocityData] = useState(null);
  const [burndownData, setBurndownData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [periodo, setPeriodo] = useState('30');
  const [activeTab, setActiveTab] = useState('dashboard');

  // ✅ Usar custom hooks con caché
  const { products: productos, loading: loadingProducts } = useProducts();
  const { sprints, loading: loadingSprints } = useSprints(selectedProduct);

  // ✅ OPTIMIZADO: Usar useCallback para cargarDatos
  const cargarDatos = useCallback(async () => {
    if (!selectedProduct) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Usar productOwnerService para obtener métricas
      const [dashboardData, velocityDataRes] = await Promise.all([
        productOwnerService.getDashboardMetrics(selectedProduct, { periodo: `${periodo}d` }, getToken),
        productOwnerService.getVelocity(selectedProduct, getToken)
      ]);

      setMetricas(dashboardData);
      setVelocityData(velocityDataRes);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, periodo, getToken]);

  // ✅ OPTIMIZADO: Solo cargar métricas cuando cambian producto o periodo
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cargarBurndown = useCallback(async () => {
    if (!selectedSprint) {
      setBurndownData(null);
      return;
    }

    try {
      const data = await productOwnerService.getBurndownData(selectedSprint, getToken);
      setBurndownData(data);
    } catch (error) {
      console.error('Error al cargar burndown:', error);
    }
  }, [selectedSprint, getToken]);

  useEffect(() => {
    cargarBurndown();
  }, [cargarBurndown]);

  const exportarMetricas = async (formato) => {
    try {
      const blob = await productOwnerService.exportMetrics(
        selectedProduct, 
        { formato, periodo: `${periodo}d` }, 
        getToken
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metricas-${new Date().toISOString().split('T')[0]}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar métricas:', error);
      setError(error.message);
    }
  };

  const getTendenciaIcon = (tendencia) => {
    switch (tendencia) {
      case 'creciente':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'decreciente':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTendenciaColor = (tendencia) => {
    switch (tendencia) {
      case 'creciente':
        return 'text-green-600';
      case 'decreciente':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow-sm p-6 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
            }`}>
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Métricas del Producto</h1>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Analiza el rendimiento y progreso del equipo
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatos}
              className={`flex items-center gap-2 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <RefreshCw size={20} />
              Actualizar
            </button>
            
            {selectedProduct && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportarMetricas('json')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <Download size={20} />
                  JSON
                </button>
                <button
                  onClick={() => exportarMetricas('csv')}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Download size={20} />
                  CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Producto:</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="">Seleccionar producto</option>
              {productos.map(producto => (
                <option key={producto._id} value={producto._id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <>
              <div className="flex items-center gap-2">
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Período:</label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="7">7 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                  <option value="180">6 meses</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Sprint (Burndown):</label>
                <select
                  value={selectedSprint}
                  onChange={(e) => setSelectedSprint(e.target.value)}
                  className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="">Seleccionar sprint</option>
                  {sprints.map(sprint => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.nombre} ({sprint.estado})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={`border rounded-lg p-4 ${
          theme === 'dark'
            ? 'bg-red-900/30 border-red-800 text-red-400'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {selectedProduct ? (
        <>
          {/* Tabs */}
          <div className={`rounded-lg shadow-sm ${
            theme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className={`border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                  { id: 'velocity', label: 'Velocidad', icon: TrendingUp },
                  { id: 'burndown', label: 'Burndown', icon: Activity }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : (theme === 'dark' 
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        )
                    }`}
                  >
                    <tab.icon size={20} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'dashboard' && metricas && (
                <DashboardTab metricas={metricas} getTendenciaIcon={getTendenciaIcon} getTendenciaColor={getTendenciaColor} theme={theme} />
              )}
              
              {activeTab === 'velocity' && velocityData && (
                <VelocityTab velocityData={velocityData} getTendenciaIcon={getTendenciaIcon} getTendenciaColor={getTendenciaColor} theme={theme} />
              )}
              
              {activeTab === 'burndown' && (
                <BurndownTab 
                  burndownData={burndownData} 
                  selectedSprint={selectedSprint}
                  sprints={sprints}
                  theme={theme}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className={`rounded-lg shadow-sm p-12 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center max-w-md mx-auto">
            <BarChart3 className={`h-16 w-16 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h2 className={`text-xl font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-700'
            }`}>
              Selecciona un producto
            </h2>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              Elige un producto del menú desplegable para ver sus métricas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Dashboard Tab
const DashboardTab = ({ metricas, getTendenciaIcon, getTendenciaColor, theme }) => {
  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-lg p-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-800'
            : 'bg-gradient-to-r from-green-50 to-green-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-green-900/50' : 'bg-green-200'
              }`}>
                <Target className="h-5 w-5 text-green-700" />
              </div>
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Velocidad del Equipo</h3>
            </div>
            <div className={`flex items-center gap-1 ${getTendenciaColor(metricas.velocidad.tendencia)}`}>
              {getTendenciaIcon(metricas.velocidad.tendencia)}
              <span className="text-sm font-medium">{metricas.velocidad.tendencia}</span>
            </div>
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-green-400' : 'text-green-700'
          }`}>
            {Math.round(metricas.velocidad.promedio)}
          </div>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-green-300' : 'text-green-600'
          }`}>
            Puntos por sprint • Último: {metricas.velocidad.ultimo_sprint}
          </p>
        </div>

        <div className={`rounded-lg p-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-orange-900/30 to-orange-800/20 border border-orange-800'
            : 'bg-gradient-to-r from-orange-50 to-orange-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-orange-900/50' : 'bg-orange-200'
            }`}>
              <TrendingUp className="h-5 w-5 text-orange-700" />
            </div>
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Progreso General</h3>
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-orange-400' : 'text-orange-700'
          }`}>
            {Math.round(metricas.progreso.porcentaje)}%
          </div>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
          }`}>
            {metricas.progreso.historias_completadas} de {metricas.progreso.historias_totales} historias
          </p>
        </div>

        <div className={`rounded-lg p-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-800'
            : 'bg-gradient-to-r from-purple-50 to-purple-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-200'
            }`}>
              <Clock className="h-5 w-5 text-purple-700" />
            </div>
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Calidad</h3>
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-purple-400' : 'text-purple-700'
          }`}>
            {metricas.calidad.coberturaPruebas}%
          </div>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
          }`}>Cobertura de pruebas</p>
        </div>
      </div>

      {/* Gráficos de distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`border rounded-lg p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Distribución por Estado</h3>
          <div className="space-y-3">
            {metricas.distribucion.por_estado.map((item, index) => {
              const colors = ['bg-green-500', 'bg-orange-500', 'bg-gray-400', 'bg-blue-500'];
              const bgColors = ['bg-green-100', 'bg-orange-100', 'bg-gray-100', 'bg-blue-100'];
              const textColors = ['text-green-700', 'text-orange-700', 'text-gray-700', 'text-blue-700'];
              
              return (
                <div key={item.estado} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                    <span className={`text-sm capitalize ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-32 rounded-full h-2 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-2 rounded-full ${colors[index % colors.length]}`}
                        style={{ 
                          width: `${metricas.progreso.historias_totales > 0 
                            ? (item.cantidad / metricas.progreso.historias_totales) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium w-8 text-right ${textColors[index % textColors.length]}`}>
                      {item.cantidad}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`border rounded-lg p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Distribución por Prioridad</h3>
          <div className="space-y-3">
            {metricas.distribucion.por_prioridad.map((item, index) => {
              const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500'];
              const textColors = ['text-red-700', 'text-yellow-700', 'text-green-700'];
              
              return (
                <div key={item.prioridad} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                    <span className={`text-sm capitalize ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.prioridad}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-32 rounded-full h-2 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-2 rounded-full ${colors[index % colors.length]}`}
                        style={{ 
                          width: `${metricas.progreso.historias_totales > 0 
                            ? (item.cantidad / metricas.progreso.historias_totales) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium w-8 text-right ${textColors[index % textColors.length]}`}>
                      {item.cantidad}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Métricas adicionales de equipo y calidad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`rounded-lg p-6 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-blue-900/50' 
                : 'bg-blue-100'
            }`}>
              <Users className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Sprints</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>{metricas.sprints.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Completados</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>{metricas.sprints.completados}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>En progreso</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>{metricas.sprints.enProgreso}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-6 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-purple-900/50' 
                : 'bg-purple-100'
            }`}>
              <Target className={`h-5 w-5 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Releases</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`}>{metricas.releases.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Completados</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>{metricas.releases.completados}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>En progreso</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>{metricas.releases.enProgreso}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-6 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-red-900/50' 
                : 'bg-red-100'
            }`}>
              <Activity className={`h-5 w-5 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Calidad</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Defectos</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>{metricas.calidad.defectos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Cobertura</span>
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>{metricas.calidad.coberturaPruebas}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">T. Resolución</span>
              <span className="text-lg font-bold text-blue-600">{metricas.calidad.tiempoPromedioResolucion}d</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Velocity Tab
const VelocityTab = ({ velocityData, getTendenciaIcon, getTendenciaColor, theme }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Histórico de Velocidad</h3>
        <div className={`flex items-center gap-2 ${getTendenciaColor(velocityData.trend)}`}>
          {getTendenciaIcon(velocityData.trend)}
          <span className="text-sm font-medium">
            Tendencia: {velocityData.trend}
          </span>
        </div>
      </div>

      <div className={`rounded-lg p-6 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <div className="text-center mb-6">
          <div className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {Math.round(velocityData.averageVelocity)}
          </div>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Velocidad promedio (puntos por sprint)
          </p>
        </div>

        {/* Gráfico de velocidad */}
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2 h-64">
            {velocityData.velocityHistory.map((sprint, index) => {
              const maxVelocidad = Math.max(...velocityData.velocityHistory.map(s => Math.max(s.plannedPoints || 0, s.completedPoints || 0)));
              const alturaPlanificada = ((sprint.plannedPoints || 0) / maxVelocidad) * 100;
              const alturaReal = ((sprint.completedPoints || 0) / maxVelocidad) * 100;
              
              return (
                <div key={sprint.sprintName} className="flex flex-col items-center gap-2 flex-1">
                  <div className="flex items-end gap-1 h-48">
                    <div 
                      className="bg-orange-300 w-4 rounded-t hover:bg-orange-400 transition-colors cursor-pointer"
                      style={{ height: `${alturaPlanificada}%` }}
                      title={`Planificada: ${sprint.plannedPoints} puntos`}
                    ></div>
                    <div 
                      className="bg-orange-600 w-4 rounded-t hover:bg-orange-700 transition-colors cursor-pointer"
                      style={{ height: `${alturaReal}%` }}
                      title={`Completada: ${sprint.completedPoints} puntos`}
                    ></div>
                  </div>
                  <div className={`text-xs text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className="font-medium">{sprint.sprintName}</div>
                    <div className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
                      {new Date(sprint.endDate).toLocaleDateString('es-ES', { month: 'short', day: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-300 rounded"></div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Velocidad Planificada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-600 rounded"></div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Velocidad Completada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Burndown Tab
const BurndownTab = ({ burndownData, selectedSprint, sprints, theme }) => {
  if (!selectedSprint) {
    return (
      <div className="text-center py-12">
        <Activity className={`h-16 w-16 mx-auto mb-4 ${
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        }`} />
        <h3 className={`text-lg font-semibold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-700'
        }`}>
          Selecciona un sprint
        </h3>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          Elige un sprint para ver su burndown chart
        </p>
      </div>
    );
  }

  if (!burndownData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const maxPuntos = Math.max(...burndownData.datos.map(d => d.puntos_ideales));

  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-6 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Burndown Chart - {burndownData.sprint.nombre}
            </h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              {new Date(burndownData.sprint.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(burndownData.sprint.fecha_fin).toLocaleDateString('es-ES')}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {burndownData.sprint.puntos_totales}
            </div>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Puntos totales</div>
          </div>
        </div>

        {/* Gráfico burndown */}
        <div className="relative">
          <div className="flex items-end justify-between gap-1 h-64 mb-4">
            {burndownData.datos.map((dia, index) => {
              const alturaIdeal = (dia.puntos_ideales / maxPuntos) * 100;
              const alturaReal = dia.puntos_reales !== null ? (dia.puntos_reales / maxPuntos) * 100 : null;
              
              return (
                <div key={dia.dia} className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex items-end gap-1 h-56">
                    {/* Línea ideal */}
                    <div 
                      className="bg-gray-300 w-2 rounded-t"
                      style={{ height: `${alturaIdeal}%` }}
                      title={`Ideal: ${dia.puntos_ideales} puntos`}
                    ></div>
                    {/* Línea real */}
                    {alturaReal !== null && (
                      <div 
                        className={`w-2 rounded-t ${
                          dia.puntos_reales <= dia.puntos_ideales ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ height: `${alturaReal}%` }}
                        title={`Real: ${dia.puntos_reales} puntos`}
                      ></div>
                    )}
                  </div>
                  <div className={`text-xs text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div>Día {dia.dia}</div>
                    <div className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
                      {new Date(dia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Burndown Ideal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>En tiempo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Retrasado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metricas;

