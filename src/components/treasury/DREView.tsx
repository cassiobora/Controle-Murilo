import React, { useState, useEffect } from 'react';
import { DREPeriodData } from '../../types/erp';
import { api } from '../../services/api';
import { 
  Percent, 
  TrendingUp, 
  DollarSign, 
  Scale, 
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export const DREView: React.FC = () => {
  const [taxRate, setTaxRate] = useState<number>(6.0); // Padrão Simples Nacional 6%
  const [dreData, setDreData] = useState<DREPeriodData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDRE = async (rate: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getDRE(rate);
      setDreData(data);
    } catch (err: any) {
      console.error('Erro ao carregar DRE:', err);
      setErrorMsg(err?.message || 'Falha ao processar DRE');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDRE(taxRate);
  }, [taxRate]);

  if (isLoading && !dreData) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
        <p className="text-xs">Calculando Demonstração de Resultado do Exercício...</p>
      </div>
    );
  }

  if (errorMsg && !dreData) {
    return (
      <div className="p-6 bg-rose-950/20 border border-rose-900/50 rounded-xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-200">Não foi possível calcular o DRE neste momento.</p>
        <button
          onClick={() => fetchDRE(taxRate)}
          className="px-4 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-semibold transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!dreData) return null;

  const grossMargin = dreData.grossRevenue > 0 ? (dreData.grossProfit / dreData.grossRevenue) * 100 : 0;
  const netMargin = dreData.grossRevenue > 0 ? (dreData.netIncome / dreData.grossRevenue) * 100 : 0;
  const ebitdaMargin = dreData.grossRevenue > 0 ? (dreData.ebitda / dreData.grossRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header com Simulador de Alíquota */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">DRE Gerencial & Contábil</h1>
          <p className="text-xs text-slate-400 mt-1">
            Apuração de Receita Bruta, Deduções Fiscais, Margem de Contribuição, EBITDA e Ponto de Equilíbrio
          </p>
        </div>

        {/* Simulador de Alíquota Simples Nacional */}
        <div className="bg-slate-900 border border-cyan-900/60 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-cyan-300">
              Alíquota Simples Nacional
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono font-bold text-white text-right"
              />
              <span className="text-xs text-slate-400 font-mono">% a.m.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cartões de Indicadores Estratégicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Margem Bruta</span>
          <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {grossMargin.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-500">Eficiência sobre vendas</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">EBITDA / LAJIDA</span>
          <p className={`text-xl font-bold font-mono tabular-nums mt-1 ${dreData.ebitda >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {dreData.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Margem EBITDA: {ebitdaMargin.toFixed(1)}%</span>
        </div>

        <div className="bg-[#111827] border border-cyan-900/60 rounded-xl p-4 bg-gradient-to-br from-[#111827] to-cyan-950/20">
          <span className="text-xs font-semibold text-cyan-300">Lucro Líquido Real</span>
          <p className={`text-xl font-black font-mono tabular-nums mt-1 ${dreData.netIncome >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            R$ {dreData.netIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-cyan-500/80">Margem Líquida: {netMargin.toFixed(1)}%</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ponto de Equilíbrio</span>
            <Scale className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-amber-300 mt-1">
            R$ {dreData.breakEvenPoint.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Faturamento mínimo (Break-even)</span>
        </div>
      </div>

      {/* Estrutura Detalhada da DRE (Demonstrativo Contábil) */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Demonstração Contábil Estruturada</h2>
          <span className="text-xs font-mono text-slate-400">{dreData.period}</span>
        </div>

        <div className="p-4 space-y-3 font-mono text-xs">
          {/* 1. Receita Bruta */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80 font-bold text-slate-200">
            <span className="text-sm text-white font-sans font-semibold">1. (+) RECEITA OPERACIONAL BRUTA</span>
            <span className="text-sm text-emerald-400 tabular-nums">
              R$ {dreData.grossRevenue.toFixed(2)}
            </span>
          </div>

          {/* 2. Deduções (Impostos Simples Nacional) */}
          <div className="flex items-center justify-between pl-4 py-1 text-slate-400">
            <span>(-) Deduções da Receita Bruta (Simples Nacional {dreData.taxRatePercent}%)</span>
            <span className="text-rose-400 tabular-nums">
              - R$ {dreData.taxesSimplesNacional.toFixed(2)}
            </span>
          </div>

          {/* 3. Receita Líquida */}
          <div className="flex items-center justify-between py-2 border-t border-b border-slate-800/80 font-bold text-slate-200 bg-slate-900/30 px-2 rounded">
            <span className="font-sans font-semibold">2. (=) RECEITA OPERACIONAL LÍQUIDA</span>
            <span className="text-cyan-300 tabular-nums">
              R$ {dreData.netRevenue.toFixed(2)}
            </span>
          </div>

          {/* 4. CMV */}
          <div className="flex items-center justify-between pl-4 py-1 text-slate-400">
            <span>(-) Custo das Mercadorias Vendidas (CMV)</span>
            <span className="text-rose-400 tabular-nums">
              - R$ {dreData.cmv.toFixed(2)}
            </span>
          </div>

          {/* 5. Lucro Bruto */}
          <div className="flex items-center justify-between py-2 border-t border-b border-slate-800/80 font-bold text-slate-200 bg-slate-900/30 px-2 rounded">
            <span className="font-sans font-semibold">3. (=) LUCRO BRUTO (Margem de Contribuição)</span>
            <span className="text-white tabular-nums">
              R$ {dreData.grossProfit.toFixed(2)}
            </span>
          </div>

          {/* 6. Despesas Operacionais */}
          <div className="space-y-1 pl-4 pt-1 text-slate-400">
            <div className="text-slate-300 font-semibold mb-1">(-) Despesas Operacionais Totais:</div>
            <div className="flex items-center justify-between pl-3 text-slate-400">
              <span>· Despesas Fixas (Aluguel, Luz, Hub, Sistemas)</span>
              <span className="tabular-nums">- R$ {dreData.operatingExpenses.fixedExpenses.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pl-3 text-slate-400">
              <span>· Despesas Variáveis (Fretes, Comissões, Taxas)</span>
              <span className="tabular-nums">- R$ {dreData.operatingExpenses.variableExpenses.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pl-3 text-slate-400">
              <span>· Custos Diretos & Manutenção Operacional</span>
              <span className="tabular-nums">- R$ {dreData.operatingExpenses.directCosts.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-rose-400 font-semibold">
              <span>Total de Despesas Operacionais</span>
              <span className="tabular-nums">- R$ {dreData.operatingExpenses.totalOperating.toFixed(2)}</span>
            </div>
          </div>

          {/* 7. EBITDA */}
          <div className="flex items-center justify-between py-2 border-t border-b border-slate-800/80 font-bold text-slate-200 bg-slate-900/40 px-2 rounded">
            <span className="font-sans font-semibold">4. (=) EBITDA / LAJIDA</span>
            <span className={`tabular-nums ${dreData.ebitda >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {dreData.ebitda.toFixed(2)}
            </span>
          </div>

          {/* 8. Resultado Financeiro */}
          <div className="space-y-1 pl-4 pt-1 text-slate-400">
            <div className="text-slate-300 font-semibold mb-1">(+/-) Resultado Financeiro Líquido:</div>
            <div className="flex items-center justify-between pl-3 text-emerald-400">
              <span>(+) Receitas Financeiras (Juros de Empréstimos & Rendimentos)</span>
              <span className="tabular-nums">+ R$ {dreData.financialResult.financialRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pl-3 text-rose-400">
              <span>(-) Despesas Financeiras & Juros Bancários Pagos</span>
              <span className="tabular-nums">- R$ {dreData.financialResult.financialExpenses.toFixed(2)}</span>
            </div>
          </div>

          {/* 9. Resultado Líquido Final */}
          <div className="flex items-center justify-between py-3 border-t-2 border-cyan-800 font-extrabold text-base bg-cyan-950/40 px-3 rounded-lg mt-3">
            <span className="font-sans text-cyan-200 tracking-tight">5. (=) RESULTADO LÍQUIDO DO PERÍODO</span>
            <span className={`tabular-nums text-lg ${dreData.netIncome >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
              R$ {dreData.netIncome.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
