import React from 'react';
import { 
  FinancialTransaction, 
  Product, 
  HookahEquipment, 
  MoneyLoan, 
  DREPeriodData 
} from '../../types/erp';
import { 
  TrendingUp, 
  TrendingDown, 
  Boxes, 
  Flame, 
  BadgeDollarSign, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle,
  Plus,
  Scale
} from 'lucide-react';

interface ExecutiveDashboardProps {
  transactions: FinancialTransaction[];
  products: Product[];
  hookahs: HookahEquipment[];
  loans: MoneyLoan[];
  dreData: DREPeriodData | null;
  onNavigate: (tab: string) => void;
  onOpenNewTransaction: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  transactions,
  products,
  hookahs,
  loans,
  dreData,
  onNavigate,
  onOpenNewTransaction,
}) => {
  // Cálculos de Tesouraria
  const totalReceived = transactions
    .filter((t) => t.flowType === 'RECEITA' && t.status === 'PAGO')
    .reduce((sum, t) => sum + t.totalFinalAmount, 0);

  const totalPaid = transactions
    .filter((t) => t.flowType === 'DESPESA' && t.status === 'PAGO')
    .reduce((sum, t) => sum + t.totalFinalAmount, 0);

  const netRealBalance = totalReceived - totalPaid;

  // Alertas de estoque crítico
  const criticalProducts = products.filter((p) => p.currentStock < p.minStock);

  // Status da frota de narguiles
  const availableHookahs = hookahs.filter((h) => h.status === 'DISPONIVEL').length;
  const rentedHookahs = hookahs.filter((h) => h.status === 'ALUGADO').length;

  // Empréstimos
  const activeLoans = loans.filter((l) => l.status === 'EM_ANDAMENTO');
  const totalLentActive = activeLoans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalProfitProjected = loans.reduce((sum, l) => sum + l.projectedProfit, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Executivo com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Painel Executivo Unificado</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão consolidada de liquidez em caixa, DRE gerencial, inventário crítico e frotas ativas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewTransaction}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* 2. Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Líquido Real */}
        <div 
          onClick={() => onNavigate('treasury')}
          className="bg-[#111827] border border-cyan-900/60 rounded-xl p-5 cursor-pointer hover:border-cyan-500 transition-all bg-gradient-to-br from-[#111827] to-cyan-950/20"
        >
          <div className="flex items-center justify-between text-xs text-cyan-300 mb-2">
            <span className="font-semibold">Saldo Líquido Real</span>
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          </div>
          <p className={`text-2xl font-black font-mono tabular-nums ${netRealBalance >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            R$ {netRealBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-mono">+{totalReceived.toFixed(0)}</span>
            <span>·</span>
            <span className="text-rose-400 font-mono">-{totalPaid.toFixed(0)}</span>
          </div>
        </div>

        {/* DRE - Lucro Líquido */}
        <div 
          onClick={() => onNavigate('dre')}
          className="bg-[#111827] border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Lucro Líquido DRE (Simples 6%)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            R$ {dreData ? dreData.netIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            EBITDA: R$ {dreData ? dreData.ebitda.toFixed(2) : '0,00'}
          </p>
        </div>

        {/* Aluguel de Narguiles */}
        <div 
          onClick={() => onNavigate('hookah')}
          className="bg-[#111827] border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Frota de Narguiles</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-white">
            {rentedHookahs} Alugados <span className="text-slate-500 text-sm font-normal">/ {hookahs.length}</span>
          </p>
          <p className="text-[11px] text-emerald-400 mt-2 font-mono">
            {availableHookahs} disponíveis p/ locação
          </p>
        </div>

        {/* Empréstimos de Capital */}
        <div 
          onClick={() => onNavigate('loans')}
          className="bg-[#111827] border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Capital Emprestado</span>
            <BadgeDollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-white">
            R$ {totalLentActive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-400 mt-2 font-mono">
            +R$ {totalProfitProjected.toFixed(2)} em rendimentos previstos
          </p>
        </div>
      </div>

      {/* 3. Seções Centrais: DRE Sintética vs. Alertas de Estoque Crítico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DRE Sintética Resumida */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>DRE Sintética do Mês (Regime Simples Nacional)</span>
            </h2>
            <button
              onClick={() => onNavigate('dre')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Ver DRE Completa →
            </button>
          </div>

          {dreData && (
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-300 font-sans font-medium">(+) Receita Bruta Consolidada</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  R$ {dreData.grossRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 pl-3 text-slate-400">
                <span>(-) Impostos Simples Nacional ({dreData.taxRatePercent}%)</span>
                <span className="text-rose-400 tabular-nums">- R$ {dreData.taxesSimplesNacional.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 pl-3 text-slate-400">
                <span>(-) Custo Mercadorias Vendidas (CMV)</span>
                <span className="text-rose-400 tabular-nums">- R$ {dreData.cmv.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-b border-slate-800/60 bg-slate-900/40 px-2 rounded">
                <span className="text-white font-sans font-medium">(=) Lucro Bruto Operacional</span>
                <span className="text-white font-bold tabular-nums">R$ {dreData.grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 pl-3 text-slate-400">
                <span>(-) Despesas Operacionais Totais</span>
                <span className="text-rose-400 tabular-nums">- R$ {dreData.operatingExpenses.totalOperating.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t-2 border-cyan-800/80 bg-cyan-950/30 px-3 rounded-lg font-bold text-sm">
                <span className="text-cyan-200 font-sans">(=) Lucro Líquido Real</span>
                <span className={`tabular-nums ${dreData.netIncome >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
                  R$ {dreData.netIncome.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alertas de Estoque Crítico (< 10 unidades) */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Estoque Crítico (&lt; 10 un)</span>
            </h2>
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Estoque →
            </button>
          </div>

          <div className="space-y-3">
            {criticalProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Todos os SKUs operando dentro dos níveis normais de inventário.
              </p>
            ) : (
              criticalProducts.map((p) => (
                <div 
                  key={p.id}
                  className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-mono text-cyan-400 text-[11px]">{p.sku}</p>
                    <p className="font-semibold text-white truncate">{p.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-rose-950 text-rose-300 font-mono font-bold rounded">
                      {p.currentStock} {p.unit}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Mín: {p.minStock}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
