import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Boxes,
  Flame,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenDrawer,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'treasury', label: 'Tesouraria', icon: Wallet },
    { id: 'stock', label: 'Estoque', icon: Boxes },
    { id: 'hookah', label: 'Narguiles', icon: Flame },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800/90 pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="grid grid-cols-5 items-center h-14 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center h-full py-1 px-1 transition-colors relative ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-cyan-400 rounded-full" />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className={`text-[10px] tracking-tight mt-0.5 truncate w-full text-center ${
                isActive ? 'font-bold text-cyan-300' : 'font-medium text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Botão Menu Completo / Mais */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center h-full py-1 px-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <Menu className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5 truncate w-full text-center text-slate-400">
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
};
