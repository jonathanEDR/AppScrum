import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// Páginas principales - inmediata
import Home from '../Pages/Home.jsx';

// Componentes de autenticación - inmediata
import { SignIn, SignUp } from '@clerk/clerk-react';
import { RoleProtectedRoute, RoleBasedRedirect } from '../components/auth/RoleBasedComponents.jsx';

// Layout principal para dashboards - inmediata
import RoleBasedLayout from '../components/layout/RoleBasedLayout.jsx';

// Error Boundary
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';

// Dashboards específicos por rol - inmediata
import SuperAdminDashboard from '../components/layout/dashboard/SuperAdminDashboard.jsx';
import ProfileManagement from '../components/auth/ProfileManagement.jsx';
import ProductOwnerDashboard from '../components/layout/dashboard/ProductOwnerDashboard.jsx';
import ScrumMasterDashboard from '../components/layout/dashboard/ScrumMasterDashboard.jsx';
import DevelopersDashboard from '../components/layout/dashboard/DevelopersDashboard.jsx';
import UserDashboard from '../components/layout/dashboard/UserDashboard.jsx';
import SystemConfigPanel from '../components/admin/SystemConfigPanel.jsx';
import CloudinaryManagement from '../Pages/CloudinaryManagement.jsx';
import CVManagementPanel from '../components/admin/CVManagementPanel.jsx';

// Componentes de submódulos - inmediata
import ProfileCV from '../components/auth/ProfileCV.jsx';

// Páginas de gestión - inmediata
import CollaboratorsManagement from '../Pages/CollaboratorsManagement.jsx';

// Componentes de Product Owner - lazy loading
const Productos = lazy(() => import('../components/ProductOwner/Productos.jsx'));
const ProductBacklog = lazy(() => import('../components/ProductOwner/ProductBacklog.jsx'));
const Roadmap = lazy(() => import('../components/ProductOwner/Roadmap.jsx'));
const Metricas = lazy(() => import('../components/ProductOwner/Metricas.jsx'));
const SprintBacklogPlanning = lazy(() => import('../components/ProductOwner/SprintBacklogPlanning.jsx'));
const AIAgents = lazy(() => import('../components/ProductOwner/AIAgents.jsx'));
const DatabaseSchemaPage = lazy(() => import('../components/ProductOwner/DatabaseSchema/DatabaseSchemaPage.jsx'));
const ProjectArchitecturePage = lazy(() => import('../components/ProductOwner/ProjectArchitecture/ProjectArchitecturePage.jsx'));

// SCRUM AI Module - lazy loading
const ScrumAI = lazy(() => import('../Pages/ScrumAI.jsx'));

// Componentes de Scrum Master - lazy loading
const Impediments = lazy(() => import('../components/ScrumMaster/Impediments.jsx'));
const Ceremonies = lazy(() => import('../components/ScrumMaster/Ceremonies.jsx'));
const SprintManagement = lazy(() => import('../components/ScrumMaster/SprintManagement.jsx'));
const SprintPlanning = lazy(() => import('../components/ScrumMaster/SprintPlanning.jsx'));
const TeamOverview = lazy(() => import('../components/ScrumMaster/TeamOverview.jsx'));
const Metrics = lazy(() => import('../components/ScrumMaster/Metrics.jsx'));
const ScrumMasterBacklog = lazy(() => import('../components/ScrumMaster/ScrumMasterBacklog.jsx'));
const ScrumMasterBugReports = lazy(() => import('../components/ScrumMaster/ScrumMasterBugReports.jsx'));

// Componentes de Developers - lazy loading
const MyTasks = lazy(() => import('../components/developers/MyTasks.jsx'));
const SprintBoard = lazy(() => import('../components/developers/SprintBoard.jsx'));
const TimeTracking = lazy(() => import('../components/developers/TimeTracking.jsx'));
const Projects = lazy(() => import('../components/developers/Projects.jsx'));
const BugReports = lazy(() => import('../components/developers/BugReports.jsx'));

// Componentes de User - lazy loading
const MyActivities = lazy(() => import('../components/users/MyActivities.jsx'));
const ProductProgress = lazy(() => import('../components/users/ProductProgress.jsx'));

// Componentes de Admin - lazy loading
const GuestAccessPanel = lazy(() => import('../components/admin/GuestAccessPanel.jsx'));


// Layout wrapper para páginas de autenticación
const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
    <div className="max-w-md w-full">
      {children}
    </div>
  </div>
);

// Componente para páginas en construcción
const UnderConstruction = ({ module }) => (
  <div className="flex items-center justify-center h-64">
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-8 text-center shadow-lg rounded-2xl">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">En Construcción</h2>
      <p className="text-gray-600 dark:text-gray-400">El módulo "{module}" estará disponible pronto.</p>
    </div>
  </div>
);

// Componente de Loading para lazy components
const LazyLoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-8 text-center shadow-lg rounded-2xl">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Cargando módulo...</p>
    </div>
  </div>
);

// Wrapper para componentes lazy con suspense
const LazyWrapper = ({ children }) => (
  <Suspense fallback={<LazyLoadingSpinner />}>
    {children}
  </Suspense>
);

// Configuración de rutas con future flags para silenciar warnings
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/sign-in',
    element: (
      <AuthLayout>
        <SignIn 
          path="/sign-in" 
          routing="path" 
          signUpUrl="/sign-up"
          afterSignInUrl="/redirect"
        />
      </AuthLayout>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <AuthLayout>
        <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in"
          afterSignUpUrl="/redirect"
        />
      </AuthLayout>
    ),
  },
  // Ruta de redirección automática basada en rol
  {
    path: '/redirect',
    element: <RoleBasedRedirect />,
  },
  // Dashboard para Super Admin
  {
    path: '/super_admin',
    element: (
      <RoleProtectedRoute allowedRoles={['super_admin']}>
        <RoleBasedLayout />
      </RoleProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <SuperAdminDashboard />,
      },
      {
        path: 'usuarios',
        element: <ProfileManagement userRole="super_admin" />,
      },
      {
        path: 'cvs',
        element: <CVManagementPanel />,
      },
      {
        path: 'colaboradores',
        element: <CollaboratorsManagement />,
      },
      {
        path: 'perfil',
        element: <ProfileCV />,
      },
      {
        path: 'admin',
        element: <UnderConstruction module="Panel Admin" />,
      },
      {
        path: 'configuracion',
        element: <SystemConfigPanel />,
      },
      {
        path: 'cloudinary',
        element: <CloudinaryManagement />,
      },
      {
        path: 'ai-agents',
        element: <LazyWrapper><AIAgents /></LazyWrapper>,
      },
      {
        path: 'scrum-ai',
        element: <LazyWrapper><ScrumAI /></LazyWrapper>,
      },
      {
        path: 'acceso-invitados',
        element: <LazyWrapper><GuestAccessPanel /></LazyWrapper>,
      },
    ],
  },
  // Dashboard para Product Owner
  {
    path: '/product_owner',
    element: (
      <RoleProtectedRoute allowedRoles={['product_owner']}>
        <RoleBasedLayout />
      </RoleProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <ProductOwnerDashboard />,
      },
      {
        path: 'perfil',
        element: <ProfileCV />,
      },
      {
        path: 'productos',
        element: <LazyWrapper><Productos /></LazyWrapper>,
      },
      {
        path: 'backlog',
        element: <LazyWrapper><ProductBacklog /></LazyWrapper>,
      },
      {
        path: 'roadmap',
        element: <LazyWrapper><Roadmap /></LazyWrapper>,
      },
      {
        path: 'sprint-planning',
        element: <LazyWrapper><SprintBacklogPlanning /></LazyWrapper>,
      },
      {
        path: 'ai-agents',
        element: <LazyWrapper><AIAgents /></LazyWrapper>,
      },
      {
        path: 'scrum-ai',
        element: <LazyWrapper><ScrumAI /></LazyWrapper>,
      },
      {
        path: 'metricas',
        element: <LazyWrapper><Metricas /></LazyWrapper>,
      },
      {
        path: 'database-schema',
        element: <LazyWrapper><DatabaseSchemaPage /></LazyWrapper>,
      },
      {
        path: 'database-schema/:productId',
        element: <LazyWrapper><DatabaseSchemaPage /></LazyWrapper>,
      },
      {
        path: 'architecture',
        element: <LazyWrapper><ProjectArchitecturePage /></LazyWrapper>,
      },
      {
        path: 'architecture/:productId',
        element: <LazyWrapper><ProjectArchitecturePage /></LazyWrapper>,
      },
      {
        path: 'colaboradores',
        element: <CollaboratorsManagement />,
      },
    ],
  },
  // Dashboard para Scrum Master
  {
    path: '/scrum_master',
    element: (
      <RoleProtectedRoute allowedRoles={['scrum_master']}>
        <RoleBasedLayout />
      </RoleProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <ScrumMasterDashboard />,
      },
      {
        path: 'perfil',
        element: <ProfileCV />,
      },
      {
        path: 'sprints',
        element: <LazyWrapper><SprintManagement /></LazyWrapper>,
      },
      {
        path: 'sprint-planning',
        element: <LazyWrapper><SprintPlanning /></LazyWrapper>,
      },
      {
        path: 'impedimentos',
        element: <LazyWrapper><Impediments /></LazyWrapper>,
      },
      {
        path: 'ceremonias',
        element: <LazyWrapper><Ceremonies /></LazyWrapper>,
      },
      {
        path: 'equipo',
        element: <LazyWrapper><TeamOverview /></LazyWrapper>,
      },
      {
        path: 'metricas',
        element: <LazyWrapper><Metrics /></LazyWrapper>,
      },
      {
        path: 'backlog-tecnico',
        element: <LazyWrapper><ScrumMasterBacklog /></LazyWrapper>,
      },
      {
        path: 'bug-reports',
        element: <LazyWrapper><ScrumMasterBugReports /></LazyWrapper>,
      },
    ],
  },
  // Dashboard para Developers
  {
    path: '/developers',
    element: (
      <RoleProtectedRoute allowedRoles={['developers']}>
        <RoleBasedLayout />
      </RoleProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: (
          <ErrorBoundary>
            <DevelopersDashboard />
          </ErrorBoundary>
        ),
      },
      {
        path: 'perfil',
        element: <ProfileCV />,
      },
      {
        path: 'tareas',
        element: (
          <ErrorBoundary>
            <LazyWrapper><MyTasks /></LazyWrapper>
          </ErrorBoundary>
        ),
      },
      {
        path: 'proyectos',
        element: (
          <ErrorBoundary>
            <LazyWrapper><Projects /></LazyWrapper>
          </ErrorBoundary>
        ),
      },
      {
        path: 'sprint-board',
        element: (
          <ErrorBoundary>
            <LazyWrapper><SprintBoard /></LazyWrapper>
          </ErrorBoundary>
        ),
      },
      {
        path: 'time-tracking',
        element: (
          <ErrorBoundary>
            <LazyWrapper><TimeTracking /></LazyWrapper>
          </ErrorBoundary>
        ),
      },
      {
        path: 'bug-reports',
        element: (
          <ErrorBoundary>
            <LazyWrapper><BugReports /></LazyWrapper>
          </ErrorBoundary>
        ),
      },
    ],
  },
  // Dashboard para User (rol básico)
  {
    path: '/user',
    element: (
      <RoleProtectedRoute allowedRoles={['user']}>
        <RoleBasedLayout />
      </RoleProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <UserDashboard />,
      },
      {
        path: 'perfil',
        element: <ProfileCV />,
      },
      {
        path: 'actividades',
        element: <LazyWrapper><MyActivities /></LazyWrapper>,
      },
      {
        path: 'proyectos/:productId',
        element: <LazyWrapper><ProductProgress /></LazyWrapper>,
      },
    ],
  },
  // Rutas de compatibilidad (redirects para URLs legacy)
  {
    path: '/dashboard',
    element: <RoleBasedRedirect />,
  },
  {
    path: '/super-admin/dashboard',
    element: <Navigate to="/super_admin" replace />,
  },
  {
    path: '/admin/dashboard',
    element: <Navigate to="/super_admin" replace />,
  },
  {
    path: '/product-owner/dashboard',
    element: <Navigate to="/product_owner" replace />,
  },
  {
    path: '/scrum-master/dashboard',
    element: <Navigate to="/scrum_master" replace />,
  },
  {
    path: '/developers/dashboard',
    element: <Navigate to="/developers" replace />,
  },
  {
    path: '/user/dashboard',
    element: <Navigate to="/user" replace />,
  },
  // Ruta catch-all para redirigir a home
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  }
});

export default router;
