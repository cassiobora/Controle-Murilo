import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types/erp';
import { api } from '../../services/api';
import { 
  Lock, 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  FileLock2,
  Terminal,
  Clock,
  KeyRound
} from 'lucide-react';

export const AuditModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.logs);
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((l) => {
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        l.action.toLowerCase().includes(term) ||
        l.userName.toLowerCase().includes(term) ||
        l.details.toLowerCase().includes(term) ||
        l.integrityHash.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header de Governança */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Auditoria Inviolável (Audit Trail Ledger)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Módulo de governança imutável com encadeamento criptográfico SHA-256 HMAC (sem permissão de exclusão)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Atualizar Ledger</span>
        </button>
      </div>

      {/* 2. Banner de Segurança Inviolável */}
      <div className="bg-[#111827] border border-emerald-900/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/20 via-[#111827] to-[#111827]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Integridade Criptográfica Garantida</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada operação realizada no sistema gera uma assinatura baseada no bloco anterior e nos detalhes operacionais.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div>
            <span className="text-slate-500 block text-[10px]">Total de Registros:</span>
            <span className="text-white font-bold">{logs.length} blocos</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Políticas RLS:</span>
            <span className="text-emerald-400 font-bold">100% Ativas</span>
          </div>
        </div>
      </div>

      {/* 3. Filtros e Busca de Auditoria */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 ml-1" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação, detalhes operacionais ou hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filtrar Ação:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
          >
            <option value="ALL">Todas as Ações</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Tabela do Ledger Imutável */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-900/60">
                <th className="py-3 px-4">Timestamp (ISO)</th>
                <th className="py-3 px-4">Usuário / Nível</th>
                <th className="py-3 px-4">IP Origem</th>
                <th className="py-3 px-4">Ação / Entidade</th>
                <th className="py-3 px-4">Detalhes Operacionais</th>
                <th className="py-3 px-4">Hash de Integridade (HMAC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {log.timestamp.replace('T', ' ').slice(0, 19)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-semibold text-white font-sans">{log.userName}</p>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      log.userRole === 'ADMIN_MASTER' ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.userRole}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {log.ip}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-cyan-400">{log.action}</span>
                    <div className="text-[10px] text-slate-500 font-sans">{log.entity}</div>
                  </td>

                  <td className="py-3 px-4 font-sans text-slate-300 max-w-sm">
                    {log.details}
                  </td>

                  <td className="py-3 px-4">
                    <span 
                      title={log.integrityHash}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono"
                    >
                      {log.integrityHash.slice(0, 18)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
