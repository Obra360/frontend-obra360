// src/components/Sidebar/hooks/useSidebarState.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'obra360_sidebar_collapsed';
const MOBILE_BREAKPOINT = 768;

export const useSidebarState = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= MOBILE_BREAKPOINT
  );

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      
      if (!mobile && showMobileSidebar) {
        setShowMobileSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showMobileSidebar]);

  // Escuchar eventos del HTML externo
  useEffect(() => {
    const handleToggle = () => {
      if (isMobile) {
        setShowMobileSidebar(prev => !prev);
      } else {
        setIsCollapsed(prev => !prev);
      }
    };

    const handleCloseMobile = () => {
      setShowMobileSidebar(false);
    };

    window.addEventListener('toggleSidebar', handleToggle);
    window.addEventListener('closeMobileSidebar', handleCloseMobile);
    
    return () => {
      window.removeEventListener('toggleSidebar', handleToggle);
      window.removeEventListener('closeMobileSidebar', handleCloseMobile);
    };
  }, [isMobile]);

  // Guardar estado collapsed en localStorage
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

  // Emitir eventos cuando cambie el estado
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebarStateChanged', {
      detail: { isCollapsed, isMobile, showMobileSidebar }
    }));
  }, [isCollapsed, isMobile, showMobileSidebar]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setShowMobileSidebar(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const closeMobileSidebar = useCallback(() => {
    setShowMobileSidebar(false);
  }, []);

  return {
    isCollapsed,
    isMobile,
    showMobileSidebar,
    toggleSidebar,
    closeMobileSidebar
  };
};