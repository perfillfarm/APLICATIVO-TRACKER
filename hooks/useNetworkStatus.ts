import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      logger.info('[Network] Status changed:', online ? 'Online' : 'Offline');
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return {
    isOnline,
    isConnected: isOnline,
  };
};
