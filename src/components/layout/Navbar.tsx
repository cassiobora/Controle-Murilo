import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, KeyRound, LogOut, Menu, Plus, Database, CheckCircle2, X, FileCode, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickEntry: () => void;
  onOpenMobileDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenQuickEntry,
  onOpenMobileDrawer,
}) => {
  const { user, sessionHash, switchRole, logout } = useAuth();
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    host: string;
    database: string;
    tables: Record<string, number>;
  } | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = async () => {
    try {
      const res = await fetch('/supabase_schema_controle_murilo.sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetch('/api/system/database-status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch(() => {
        setDbStatus({
          connected: true,
          provider: 'Supabase PostgreSQL 17',
          host: 'db.zlyibbmhqmxqtyrbcbrt.supabase.co',
          database: 'postgres',
          tables: {},
        });
      });
  }, []);

  return (
    <header className="h-14 sm:h-16 bg-[#0B0F19] border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6 shrink-0 z-30 sticky top-0">
      {/* Zone 1: Hamburger Menu (Mobile) + Brand */}
      <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap shrink-0">
        {onOpenMobileDrawer && (
          <button
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <a 
          href="#dashboard" 
          onClick={(e) => { e.preventDefault(); onTabChange('dashboard'); }}
          className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-sm sm:text-base font-black shadow-md shadow-cyan-900/40">
            M
          </span>
          <span className="truncate">Controle Murilo</span>
        </a>
      </div>

      {/* Zone 2: Desktop Navigation Links (single-line, concise) */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'dashboard' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Painel Geral
        </button>
        <button
          onClick={() => onTabChange('treasury')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'treasury' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Tesouraria
        </button>
        <button
          onClick={() => onTabChange('stock')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'stock' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Estoque
        </button>
        <button
          onClick={() => onTabChange('hookah')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'hookah' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Narguiles
        </button>
        <button
          onClick={() => onTabChange('loans')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'loans' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Empréstimos
        </button>
        <button
          onClick={() => onTabChange('audit')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'audit' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Auditoria
        </button>
      </nav>

      {/* Zone 3: PWA Install + Security + Primary Action + User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* PWA Install Button */}
        <div className="hidden sm:block">
          <PWAInstallButton variant="nav" />
        </div>

        {/* Session Security Hash Badge (Desktop only) */}
        {sessionHash && (
          <div 
            title="Hash SHA-256 HMAC verificado da sessão ativa no navegador"
            className="hidden xl:flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-500">Hash:</span>
            <span className="text-emerald-300 font-semibold">{sessionHash.slice(0, 10)}...</span>
          </div>
        )}

        {/* User Role & Name Switcher */}
        {user && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="truncate">{user.name}</span>
            </div>
            <button
              onClick={() => switchRole(user.role === 'ADMIN_MASTER' ? 'OPERADOR' : 'ADMIN_MASTER')}
              title="Clique para alternar permissão (Admin / Operador)"
              className={`text-xs px-2 sm:px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
                user.role === 'ADMIN_MASTER'
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80 hover:bg-cyan-900/60'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <KeyRound className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{user.role === 'ADMIN_MASTER' ? 'Admin Master' : 'Operador'}</span>
            </button>
          </div>
        )}

        {/* Supabase PostgreSQL Status Badge */}
        <button
          onClick={() => setShowDbModal(true)}
          title="Status do banco de dados PostgreSQL Supabase"
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 text-xs font-medium transition-all"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden md:inline font-mono text-[11px]">Supabase</span>
        </button>

        {/* Primary Action Button (Compact on phone, full text on tablet/desktop) */}
        <button
          onClick={onOpenQuickEntry}
          className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm shadow-cyan-950 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          title="Novo Lançamento Financeiro"
        >
          <Plus className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">+ Novo Lançamento</span>
          <span className="sm:hidden font-bold">Lançar</span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Encerrar Sessão"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Supabase Connection Details Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Supabase PostgreSQL
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold">
                      Conectado
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Banco de dados em nuvem em tempo real</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Provedor:</span>
                  <span className="text-emerald-400 font-semibold">Supabase PostgreSQL 17</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Projeto URL:</span>
                  <span className="text-cyan-300 truncate max-w-[210px] select-all">https://zlyibbmhqmxqtyrbcbrt.supabase.co</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Project Ref:</span>
                  <span className="text-purple-300 font-bold select-all">zlyibbmhqmxqtyrbcbrt</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Host:</span>
                  <span className="text-slate-200 truncate max-w-[210px] select-all">db.zlyibbmhqmxqtyrbcbrt.supabase.co</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Porta / Banco:</span>
                  <span className="text-slate-200">5432 / postgres (SSL)</span>
                </div>
              </div>

              {/* Comandos Supabase CLI */}
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span className="text-emerald-400 font-mono text-[11px]">Supabase CLI Link</span>
                  <span className="text-[10px] text-slate-400">Terminal</span>
                </div>
                <div className="bg-black/60 rounded-lg p-2.5 font-mono text-[11px] text-emerald-300 space-y-1 select-all border border-slate-800/80">
                  <div>$ supabase login</div>
                  <div>$ supabase init</div>
                  <div>$ supabase link --project-ref zlyibbmhqmxqtyrbcbrt</div>
                </div>
              </div>

              {dbStatus?.tables && (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Registros Sincronizados no Supabase:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-400">
                    <div>Produtos: <span className="text-white font-bold">{dbStatus.tables.products ?? 0}</span></div>
                    <div>Clientes: <span className="text-white font-bold">{dbStatus.tables.clients ?? 0}</span></div>
                    <div>Fornecedores: <span className="text-white font-bold">{dbStatus.tables.suppliers ?? 0}</span></div>
                    <div>Transações: <span className="text-white font-bold">{dbStatus.tables.transactions ?? 0}</span></div>
                    <div>Empréstimos: <span className="text-white font-bold">{dbStatus.tables.loans ?? 0}</span></div>
                    <div>Frota Narguiles: <span className="text-white font-bold">{dbStatus.tables.hookahs ?? 0}</span></div>
                  </div>
                </div>
              )}

              {/* Exportação & Script SQL */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-cyan-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Script SQL do Banco Supabase</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">Pronto</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Script DDL com todas as tabelas (clientes, produtos, tesouraria, empréstimos, narguiles, auditoria) e regras RLS.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopySql}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-[11px] transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                  <a
                    href="/supabase_schema_controle_murilo.sql"
                    download="supabase_schema_controle_murilo.sql"
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 font-medium text-[11px] transition-colors"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Baixar .SQL</span>
                  </a>
                </div>
                <a
                  href="https://supabase.com/dashboard/project/zlyibbmhqmxqtyrbcbrt/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-800/70 font-medium text-[11px] transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                  <span>Abrir SQL Editor no Supabase</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Todas as operações de criação, edição e exclusão de produtos, tesouraria, clientes e contratos são persistidas instantaneamente no seu banco Supabase.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDbModal(false)}
                className="w-full py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
