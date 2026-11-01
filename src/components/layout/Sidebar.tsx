import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  FileSpreadsheet,
  Boxes,
  Users,
  Truck,
  Flame,
  BadgeDollarSign,
  FileBarChart2,
  Lock,
  X,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, switchRole, sessionHash } = useAuth();

  const menuSections = [
    {
      label: 'Visão Executiva',
      items: [
        { id: 'dashboard', label: 'Dashboard Unificado', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Tesouraria & Finanças',
      items: [
        { id: 'treasury', label: 'Tesouraria & Caixa', icon: Wallet },
        { id: 'dre', label: 'DRE Gerencial (6%)', icon: FileSpreadsheet },
        { id: 'loans', label: 'Central de Empréstimos', icon: BadgeDollarSign },
      ],
    },
    {
      label: 'Estoque & CRM',
      items: [
        { id: 'stock', label: 'Estoque & Curva ABC', icon: Boxes },
        { id: 'clients', label: 'Clientes (PF/PJ)', icon: Users },
        { id: 'suppliers', label: 'Fornecedores (CIF/FOB)', icon: Truck },
      ],
    },
    {
      label: 'Frota & Ativos',
      items: [
        { id: 'hookah', label: 'Aluguel de Narguiles', icon: Flame },
      ],
    },
    {
      label: 'Governança & Análise',
      items: [
        { id: 'reports', label: 'Central de Relatórios', icon: FileBarChart2 },
        { id: 'audit', label: 'Auditoria Inviolável', icon: Lock },
      ],
    },
  ];

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto select-none bg-[#0B0F19]">
      {/* Header Unidade / Empresa */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Empresa / Unidade</span>
            <span className="text-emerald-400 font-mono text-[10px]">RLS Ativo</span>
          </div>
          <p className="text-sm font-bold text-white truncate">Controle Murilo Matriz</p>
          <p className="text-[11px] text-slate-500 font-mono">CNPJ: 42.891.302/0001-85</p>
        </div>
        {isOpenMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Fechar Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* PWA Install Button Prominente para Smartphones */}
      <div className="px-3 pt-3">
        <PWAInstallButton variant="sidebar" />
      </div>

      {/* Navegação por Grupos */}
      <div className="flex-1 py-4 px-3 space-y-5">
        {menuSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hash de Sessão e Privilégios (Mobile drawer) */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
        {sessionHash && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-500">Hash:</span>
            <span className="text-emerald-300 truncate">{sessionHash.slice(0, 12)}...</span>
          </div>
        )}

        {user && (
          <button
            onClick={() => switchRole(user.role === 'ADMIN_MASTER' ? 'OPERADOR' : 'ADMIN_MASTER')}
            className={`w-full text-xs px-2.5 py-1.5 rounded-lg border flex items-center justify-between transition-all font-medium ${
              user.role === 'ADMIN_MASTER'
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80 hover:bg-cyan-900/60'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Privilégio:</span>
            </span>
            <span className="font-bold">{user.role === 'ADMIN_MASTER' ? 'Admin Master' : 'Operador'}</span>
          </button>
        )}

        {/* Rodapé com Perfil */}
        <div className="flex items-center gap-2.5 pt-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'MU'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Murilo'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (fixa à esquerda em telas >= md) */}
      <aside className="hidden md:flex w-64 bg-[#0B0F19] border-r border-slate-800/80 shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer (slide-over a partir da esquerda em smartphones) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop escuro com blur */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Container do Drawer com animação */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 border-r border-slate-800">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
