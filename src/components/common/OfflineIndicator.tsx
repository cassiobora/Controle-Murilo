import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-amber-500/90 backdrop-blur-xs border border-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-xl animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>Modo Offline — exibindo dados locais armazenados</span>
    </div>
  );
};
