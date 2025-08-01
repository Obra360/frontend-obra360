// src/components/Sidebar/hooks/useActiveRoute.js
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export const useActiveRoute = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActiveRoute = useMemo(() => {
    return (href, pageId) => {
      if (!href) return false;
      
      // Exact match
      if (currentPath === href) return true;
      
      // Page ID match
      if (pageId && currentPath.includes(pageId)) return true;
      
      return false;
    };
  }, [currentPath]);

  const findActiveParent = useMemo(() => {
    return (children) => {
      if (!children) return false;
      return children.some(child => isActiveRoute(child.href, child.id));
    };
  }, [isActiveRoute]);

  return {
    currentPath,
    isActiveRoute,
    findActiveParent
  };
};