import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { apiService } from "../services/apiService";

export const RoleContext = createContext();
export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [role, setRole] = useState(undefined);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [serverRole, setServerRole] = useState(null);

  // Función para sincronizar rol con el servidor
  const syncRoleWithServer = useCallback(async () => {
    if (!user || !isLoaded) return;

    try {
      // Primero intentar obtener el perfil del servidor
      const profileData = await apiService.getUserProfile(getToken);
      if (profileData?.user?.role) {
        setServerRole(profileData.user.role);
        setRole(profileData.user.role);
        setIsRoleLoaded(true);
        return;
      }
    } catch (error) {
      console.warn('Could not fetch server role, using Clerk metadata:', error);
    }

    // Si no se puede obtener del servidor, usar metadata de Clerk
    const clerkRole = user?.publicMetadata?.role || 
                     user?.unsafeMetadata?.role || 
                     user?.role || 
                     'user'; // rol por defecto

    setRole(clerkRole);
    setIsRoleLoaded(true);
  }, [user, isLoaded, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      setRole(undefined);
      setServerRole(null);
      setIsRoleLoaded(true);
      return;
    }

    syncRoleWithServer();
  }, [user, isLoaded, syncRoleWithServer]);

  // Función para actualizar el rol
  const updateRole = useCallback((newRole) => {
    setRole(newRole);
    setServerRole(newRole);
  }, []);

  // Función para refrescar el rol desde el servidor
  const refreshRole = useCallback(async () => {
    if (user && isLoaded) {
      setIsRoleLoaded(false);
      await syncRoleWithServer();
    }
  }, [user, isLoaded, syncRoleWithServer]);

  const contextValue = {
    role,
    serverRole,
    isLoaded: isLoaded && isRoleLoaded,
    isRoleLoaded,
    updateRole,
    refreshRole,
    user
  };

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
}