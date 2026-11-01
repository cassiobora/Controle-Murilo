import React, { useState } from 'react';
import { MoneyLoan, Client } from '../../types/erp';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  BadgeDollarSign, 
  Plus, 
  Search, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X,
  Edit3,
  FileCheck
} from 'lucide-react';

interface LoansModuleProps {
  loans: MoneyLoan[];
  clients: Client[];
  onRefresh: () => void;
}

export const LoansModule: React.FC<LoansModuleProps> = ({ loans, clients, onRefresh }) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<MoneyLoan | null>(null);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<MoneyLoan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form de Novo Contrato
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerDocument, setBorrowerDocument] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerClientId, setBorrowerClientId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState<number | ''>('');
  const [interestRateMonthly, setInterestRateMonthly] = useState<number>(4.0);
  const [interestType, setInterestType] = useState<'SIMPLES' | 'COMPOSTO'>('SIMPLES');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [termMonths, setTermMonths] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'EM_ANDAMENTO' | 'LIQUIDADO' | 'EM_ATRASO'>('EM_ANDAMENTO');

  // KPIs da Central de Empréstimos
  const totalPrincipalLent = loans.reduce((acc, l) => acc + l.principalAmount, 0);
  const totalProjectedReturn = loans.reduce((acc, l) => acc + l.totalProjectedReturn, 0);
  const totalCollected = loans.reduce((acc, l) => acc + l.totalCollected, 0);
  const totalRemaining = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalProjectedProfit = loans.reduce((acc, l) => acc + l.projectedProfit, 0);

  // Simulação dinâmica no modal
  const p = Number(principalAmount) || 0;
  const r = Number(interestRateMonthly) || 0;
  const n = Number(termMonths) || 1;
  const simulatedTotal = interestType === 'COMPOSTO'
    ? p * Math.pow(1 + r / 100, n)
    : p + p * (r / 100) * n;
  const simulatedProfit = simulatedTotal - p;

  const handleSelectClient = (clientId: string) => {
    const cli = clients.find((c) => c.id === clientId);
    if (cli) {
      setBorrowerClientId(cli.id);
      setBorrowerName(cli.name);
      setBorrowerDocument(cli.document);
      setBorrowerPhone(cli.phone);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || p <= 0) return;
    setIsSubmitting(true);
    try {
      await api.createLoan({
        borrowerName,
        borrowerDocument,
        borrowerPhone,
        borrowerClientId: borrowerClientId || undefined,
        principalAmount: p,
        interestRateMonthly: r,
        interestType,
        issueDate,
        termMonths: n,
        notes,
      });
      setIsNewLoanOpen(false);
      setBorrowerName('');
      setBorrowerDocument('');
      setPrincipalAmount('');
      toast.success('Empréstimo registrado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao cadastrar empréstimo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditLoan = (loan: MoneyLoan) => {
    setEditingLoan(loan);
    setBorrowerName(loan.borrowerName);
    setBorrowerDocument(loan.borrowerDocument);
    setBorrowerPhone(loan.borrowerPhone);
    setInterestRateMonthly(loan.interestRateMonthly);
    setStatus(loan.status);
    setNotes(loan.notes || '');
  };

  const handleSaveEditLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan || !borrowerName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateLoan(editingLoan.id, {
        borrowerName,
        borrowerDocument,
        borrowerPhone,
        interestRateMonthly: Number(interestRateMonthly) || 0,
        status,
        notes,
      });
      setEditingLoan(null);
      toast.success('Contrato de empréstimo atualizado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao atualizar contrato de empréstimo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmortize = async (loanId: string, installmentNumber: number) => {
    try {
      const updated = await api.amortizeLoan(loanId, installmentNumber);
      setSelectedLoan(updated);
      toast.success('Parcela amortizada com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao registrar amortização.');
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return l.borrowerName.toLowerCase().includes(term) || l.contractNumber.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Central de Inteligência de Empréstimos</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão de capital emprestado, motor de juros com projeção de lucro, edição de contratos e amortizações
          </p>
        </div>
        <button
          onClick={() => {
            setBorrowerName('');
            setBorrowerDocument('');
            setPrincipalAmount('');
            setTermMonths(3);
            setIsNewLoanOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Contrato de Empréstimo</span>
        </button>
      </div>

      {/* 2. Grid de KPIs Financeiros de Empréstimos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Capital Emprestado</span>
          <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            R$ {totalPrincipalLent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Montante principal cedido</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Retorno Total Previsto</span>
          <p className="text-xl font-bold font-mono tabular-nums text-cyan-300 mt-1">
            R$ {totalProjectedReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Principal + Juros acumulados</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Total Já Recebido</span>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            R$ {totalCollected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Baixado na tesouraria</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Saldo a Receber</span>
          <p className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            R$ {totalRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Parcelas vincendas</span>
        </div>

        <div className="bg-[#111827] border border-cyan-900/60 rounded-xl p-4 bg-gradient-to-br from-[#111827] to-cyan-950/20">
          <span className="text-xs font-semibold text-cyan-300">Lucro Projetado</span>
          <p className="text-xl font-black font-mono tabular-nums text-emerald-300 mt-1">
            + R$ {totalProjectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-cyan-500/80">Rendimento real das operações</span>
        </div>
      </div>

      {/* 3. Tabela de Contratos de Empréstimos */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Contratos e Cronograma de Recebimentos</h2>
          </div>
          <div className="flex items-center gap-2 max-w-xs w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar tomador ou contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-900/40">
                <th className="py-3 px-4">Contrato</th>
                <th className="py-3 px-4">Tomador / Cliente</th>
                <th className="py-3 px-4 text-right">Valor Cedido</th>
                <th className="py-3 px-4 text-center">Taxa / Tipo</th>
                <th className="py-3 px-4 text-right">Retorno Total</th>
                <th className="py-3 px-4 text-right">Lucro Previsto</th>
                <th className="py-3 px-4 text-center">Amortização</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                    {loan.contractNumber}
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {loan.issueDate}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{loan.borrowerName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{loan.borrowerDocument}</p>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white">
                    R$ {loan.principalAmount.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-center font-mono">
                    <span className="text-cyan-300 font-bold">{loan.interestRateMonthly}% a.m.</span>
                    <div className="text-[10px] text-slate-500 uppercase">{loan.interestType}</div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white">
                    R$ {loan.totalProjectedReturn.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-400">
                    + R$ {loan.projectedProfit.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-center font-mono">
                    <div className="text-xs text-slate-300">
                      R$ {loan.totalCollected.toFixed(2)} / R$ {loan.totalProjectedReturn.toFixed(2)}
                    </div>
                    <div className="w-24 bg-slate-800 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (loan.totalCollected / loan.totalProjectedReturn) * 100)}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                      loan.status === 'LIQUIDADO'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : loan.status === 'EM_ATRASO'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {loan.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => handleStartEditLoan(loan)}
                      className="px-2 py-1 text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-md transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
                    >
                      Parcelas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Novo Empréstimo */}
      {isNewLoanOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-cyan-400" />
                <span>Novo Contrato de Empréstimo & Juros</span>
              </h2>
              <button onClick={() => setIsNewLoanOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vincular Cliente do CRM (Opcional)
                </label>
                <select
                  value={borrowerClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Digitar tomador avulso...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.document})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo do Tomador <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={borrowerDocument}
                    onChange={(e) => setBorrowerDocument(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capital Emprestado (R$) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Taxa de Juros (% ao mês)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRateMonthly}
                    onChange={(e) => setInterestRateMonthly(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prazo em Meses (Parcelas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={termMonths}
                    onChange={(e) => setTermMonths(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modalidade de Juros
                  </label>
                  <select
                    value={interestType}
                    onChange={(e) => setInterestType(e.target.value as 'SIMPLES' | 'COMPOSTO')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="SIMPLES">Juros Simples (Padrão)</option>
                    <option value="COMPOSTO">Juros Compostos</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs text-cyan-200">
                  <span>Total a Receber Projetado:</span>
                  <span className="font-bold font-mono text-sm text-cyan-300">
                    R$ {simulatedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>Lucro Líquido da Operação:</span>
                  <span className="font-bold font-mono">
                    + R$ {simulatedProfit.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewLoanOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Gerando...' : 'Efetivar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CONTRATO DE EMPRÉSTIMO */}
      {editingLoan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-lg w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-400" />
                  <span>Editar Contrato [{editingLoan.contractNumber}]</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">Atualize dados do tomador, contatos ou status</p>
              </div>
              <button onClick={() => setEditingLoan(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLoan} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Tomador <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={borrowerDocument}
                    onChange={(e) => setBorrowerDocument(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Taxa de Juros (% a.m.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRateMonthly}
                    onChange={(e) => setInterestRateMonthly(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status do Contrato
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="LIQUIDADO">Liquidado</option>
                    <option value="EM_ATRASO">Em Atraso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Garantias
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingLoan(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Atualizando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Visualizar Cronograma e Amortizar */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">Cronograma de Parcelas</h2>
                <p className="text-xs text-cyan-400 font-mono">
                  {selectedLoan.contractNumber} · {selectedLoan.borrowerName}
                </p>
              </div>
              <button onClick={() => setSelectedLoan(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Principal:</span>
                  <span className="text-white font-bold">R$ {selectedLoan.principalAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Recebido:</span>
                  <span className="text-emerald-400 font-bold">R$ {selectedLoan.totalCollected.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Saldo Restante:</span>
                  <span className="text-amber-400 font-bold">R$ {selectedLoan.remainingBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-900/60">
                      <th className="py-2 px-3">Parcela</th>
                      <th className="py-2 px-3">Vencimento</th>
                      <th className="py-2 px-3 text-right">Principal</th>
                      <th className="py-2 px-3 text-right">Juros</th>
                      <th className="py-2 px-3 text-right">Total Parcela</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Amortizar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedLoan.repayments.map((rep) => (
                      <tr key={rep.installmentNumber} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                          {rep.installmentNumber} / {selectedLoan.termMonths}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {rep.dueDate}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          R$ {rep.principalAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          + R$ {rep.interestAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          R$ {rep.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                            rep.status === 'PAGO' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {rep.status === 'PAGO' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {rep.status === 'PENDENTE' ? (
                            <button
                              onClick={() => handleAmortize(selectedLoan.id, rep.installmentNumber)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow-xs"
                            >
                              Receber Baixa
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Pago {rep.paidDate}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
