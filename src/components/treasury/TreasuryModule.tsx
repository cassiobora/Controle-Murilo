import React, { useState } from 'react';
import { 
  FinancialTransaction, 
  Client, 
  Supplier,
  FlowType,
  PaymentMethod,
  PaymentStatus 
} from '../../types/erp';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  Search, 
  Plus, 
  AlertCircle,
  Edit3,
  X,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TransactionModal } from './TransactionModal';

interface TreasuryModuleProps {
  transactions: FinancialTransaction[];
  clients: Client[];
  suppliers: Supplier[];
  onRefresh: () => void;
  onOpenModal: () => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
}

export const TreasuryModule: React.FC<TreasuryModuleProps> = ({
  transactions,
  clients,
  suppliers,
  onRefresh,
  onOpenModal,
  isModalOpen,
  onCloseModal,
}) => {
  const toast = useToast();
  const [filterFlow, setFilterFlow] = useState<'ALL' | 'RECEITA' | 'DESPESA'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAGO' | 'PENDENTE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettlingId, setIsSettlingId] = useState<string | null>(null);

  // Estado de Edição de Lançamento
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editFlowType, setEditFlowType] = useState<FlowType>('RECEITA');
  const [editMovementDate, setEditMovementDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editOriginalAmount, setEditOriginalAmount] = useState<number | ''>('');
  const [editMacroCategory, setEditMacroCategory] = useState('');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editBeneficiaryName, setEditBeneficiaryName] = useState('');
  const [editBeneficiaryPixKey, setEditBeneficiaryPixKey] = useState('');
  const [editAccountOrigin, setEditAccountOrigin] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('PIX');
  const [editMonthlyInterestRate, setEditMonthlyInterestRate] = useState<number>(0);
  const [editLatePenaltyRate, setEditLatePenaltyRate] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<PaymentStatus>('PAGO');
  const [editSettledDate, setEditSettledDate] = useState('');
  const [editDocumentNumber, setEditDocumentNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Cálculos analíticos de tesouraria
  const totalReceived = transactions
    .filter((t) => t.flowType === 'RECEITA' && t.status === 'PAGO')
    .reduce((sum, t) => sum + t.totalFinalAmount, 0);

  const totalPaid = transactions
    .filter((t) => t.flowType === 'DESPESA' && t.status === 'PAGO')
    .reduce((sum, t) => sum + t.totalFinalAmount, 0);

  const netRealBalance = totalReceived - totalPaid;

  const pendingReceivables = transactions
    .filter((t) => t.flowType === 'RECEITA' && t.status === 'PENDENTE')
    .reduce((sum, t) => sum + t.totalFinalAmount, 0);

  const pendingPayables = transactions
    .filter((t) => t.flowType === 'DESPESA' && t.status === 'PENDENTE')
    .reduce((sum, t) => sum + t.totalFinalAmount, 0);

  // Iniciar Edição
  const handleStartEdit = (tx: FinancialTransaction) => {
    setEditingTx(tx);
    setEditDescription(tx.description);
    setEditFlowType(tx.flowType);
    setEditMovementDate(tx.movementDate);
    setEditDueDate(tx.dueDate);
    setEditOriginalAmount(tx.originalAmount);
    setEditMacroCategory(tx.macroCategory);
    setEditSubCategory(tx.subCategory);
    setEditBeneficiaryName(tx.beneficiaryName);
    setEditBeneficiaryPixKey(tx.beneficiaryPixKey || '');
    setEditAccountOrigin(tx.accountOrigin);
    setEditPaymentMethod(tx.paymentMethod);
    setEditMonthlyInterestRate(tx.monthlyInterestRate || 0);
    setEditLatePenaltyRate(tx.latePenaltyRate || 0);
    setEditStatus(tx.status);
    setEditSettledDate(tx.settledDate || new Date().toISOString().split('T')[0]);
    setEditDocumentNumber(tx.documentNumber || '');
    setEditNotes(tx.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editDescription.trim()) return;

    setIsSubmittingEdit(true);
    try {
      await api.updateTransaction(editingTx.id, {
        description: editDescription,
        flowType: editFlowType,
        movementDate: editMovementDate,
        dueDate: editDueDate,
        originalAmount: Number(editOriginalAmount) || 0,
        macroCategory: editMacroCategory,
        subCategory: editSubCategory,
        beneficiaryName: editBeneficiaryName,
        beneficiaryPixKey: editBeneficiaryPixKey,
        accountOrigin: editAccountOrigin,
        paymentMethod: editPaymentMethod,
        monthlyInterestRate: Number(editMonthlyInterestRate) || 0,
        latePenaltyRate: Number(editLatePenaltyRate) || 0,
        status: editStatus,
        settledDate: editStatus === 'PAGO' ? editSettledDate : undefined,
        documentNumber: editDocumentNumber,
        notes: editNotes,
      });
      setEditingTx(null);
      toast.success('Lançamento atualizado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao atualizar lançamento financeiro');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Filtros aplicados
  const filteredTransactions = transactions.filter((tx) => {
    if (filterFlow !== 'ALL' && tx.flowType !== filterFlow) return false;
    if (filterStatus !== 'ALL' && tx.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(term);
      const matchBen = tx.beneficiaryName.toLowerCase().includes(term);
      const matchCode = tx.code.toLowerCase().includes(term);
      return matchDesc || matchBen || matchCode;
    }
    return true;
  });

  const handleSettle = async (id: string) => {
    setIsSettlingId(id);
    try {
      await api.settleTransaction(id);
      toast.success('Lançamento liquidado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao liquidar lançamento');
    } finally {
      setIsSettlingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo com Botão Primário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Tesouraria & Livro Caixa</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Fluxo de caixa em tempo real, liquidação bancária, edição de lançamentos e previsão
          </p>
        </div>
        <button
          onClick={onOpenModal}
          className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* 2. Grid de KPIs Analíticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Recebido */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Recebido</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-emerald-400">
            R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Entradas liquidadas</span>
        </div>

        {/* Total Pago */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Pago</span>
            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-rose-400">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Saídas liquidadas</span>
        </div>

        {/* Saldo Líquido Real */}
        <div className="bg-[#111827] border border-cyan-900/60 rounded-xl p-4 bg-gradient-to-br from-[#111827] to-cyan-950/20">
          <div className="flex items-center justify-between text-xs text-cyan-300 mb-1">
            <span className="font-semibold">Saldo Líquido Real</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <p className={`text-xl font-black font-mono tabular-nums ${netRealBalance >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            R$ {netRealBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-cyan-500/80">Disponível em contas</span>
        </div>

        {/* A Receber (Previsão) */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>A Receber (Previsão)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-amber-300">
            R$ {pendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Contratos & títulos</span>
        </div>

        {/* A Pagar (Previsão) */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>A Pagar (Previsão)</span>
            <AlertCircle className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-orange-300">
            R$ {pendingPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Boletos a vencer</span>
        </div>
      </div>

      {/* 3. Barra de Filtros e Busca */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 ml-1" />
          <input
            type="text"
            placeholder="Filtrar por código, descrição ou favorecido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro de Fluxo */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterFlow('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterFlow === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterFlow('RECEITA')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterFlow === 'RECEITA' ? 'bg-emerald-950 text-emerald-300' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterFlow('DESPESA')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterFlow === 'DESPESA' ? 'bg-rose-950 text-rose-300' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Saídas
            </button>
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('PAGO')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterStatus === 'PAGO' ? 'bg-cyan-950 text-cyan-300' : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              Pagos
            </button>
            <button
              onClick={() => setFilterStatus('PENDENTE')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterStatus === 'PENDENTE' ? 'bg-amber-950 text-amber-300' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabela de Lançamentos Financeiros (Livro Caixa) com Ações de Edição */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-900/60">
                <th className="py-3 px-4">Código / Data</th>
                <th className="py-3 px-4">Descrição & Categoria</th>
                <th className="py-3 px-4">Favorecido / Conta</th>
                <th className="py-3 px-4 text-center">Forma</th>
                <th className="py-3 px-4 text-right">Valor Final</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhum lançamento financeiro localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.flowType === 'RECEITA';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Código e Data */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-200">{tx.code}</span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Venc: {tx.dueDate}
                        </div>
                      </td>

                      {/* Descrição e Categoria */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-white truncate">{tx.description}</p>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{tx.macroCategory}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500">{tx.subCategory}</span>
                        </div>
                        {tx.isInstallment && (
                          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                            Parcelado em {tx.totalInstallments}x
                          </div>
                        )}
                      </td>

                      {/* Favorecido e Conta */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-200 truncate">{tx.beneficiaryName}</p>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {tx.accountOrigin}
                        </div>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                        {tx.paymentMethod}
                      </td>

                      {/* Valor Final */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                        <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                          {isIncome ? '+' : '-'} R$ {tx.totalFinalAmount.toFixed(2)}
                        </span>
                        {tx.calculatedInterestAmount > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Juros: +R${tx.calculatedInterestAmount.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                          tx.status === 'PAGO'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        }`}>
                          {tx.status === 'PAGO' ? 'Liquidado' : 'Pendente'}
                        </span>
                      </td>

                      {/* Ações: Editar e Dar Baixa */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => handleStartEdit(tx)}
                          className="px-2 py-1 text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-md transition-colors"
                        >
                          Editar
                        </button>
                        {tx.status === 'PENDENTE' && (
                          <button
                            onClick={() => handleSettle(tx.id)}
                            disabled={isSettlingId === tx.id}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-all shadow-xs"
                          >
                            {isSettlingId === tx.id ? 'Baixando...' : 'Dar Baixa'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDITAR LANÇAMENTO FINANCEIRO */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-400" />
                  <span>Editar Lançamento [{editingTx.code}]</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">Atualize informações contábeis, valores ou favorecido</p>
              </div>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditFlowType('RECEITA')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    editFlowType === 'RECEITA' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Entrada (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setEditFlowType('DESPESA')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    editFlowType === 'DESPESA' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Saída (Despesa)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Descrição do Lançamento <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Original (R$) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editOriginalAmount}
                    onChange={(e) => setEditOriginalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Favorecido (Cliente/Fornecedor)
                  </label>
                  <input
                    type="text"
                    value={editBeneficiaryName}
                    onChange={(e) => setEditBeneficiaryName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Movimentação
                  </label>
                  <input
                    type="date"
                    value={editMovementDate}
                    onChange={(e) => setEditMovementDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria Macro
                  </label>
                  <input
                    type="text"
                    value={editMacroCategory}
                    onChange={(e) => setEditMacroCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subcategoria
                  </label>
                  <input
                    type="text"
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Origem do Caixa / Conta
                  </label>
                  <select
                    value={editAccountOrigin}
                    onChange={(e) => setEditAccountOrigin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Caixa Geral Principal">Caixa Geral Principal</option>
                    <option value="Banco Itaú Empresa">Banco Itaú Empresa</option>
                    <option value="Banco Bradesco">Banco Bradesco</option>
                    <option value="Conta Digital PJ">Conta Digital PJ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="TRANSFERENCIA">Transferência TED</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="DINHEIRO">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status do Lançamento
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="PAGO">Pago / Liquidado</option>
                    <option value="PENDENTE">Pendente</option>
                  </select>
                </div>

                {editStatus === 'PAGO' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Data da Baixa / Liquidação
                    </label>
                    <input
                      type="date"
                      value={editSettledDate}
                      onChange={(e) => setEditSettledDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Número NF / Documento
                  </label>
                  <input
                    type="text"
                    value={editDocumentNumber}
                    onChange={(e) => setEditDocumentNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chave PIX Favorecido
                  </label>
                  <input
                    type="text"
                    value={editBeneficiaryPixKey}
                    onChange={(e) => setEditBeneficiaryPixKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Observações Operacionais
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmittingEdit ? 'Atualizando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação de Novo Lançamento */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSuccess={onRefresh}
        clients={clients}
        suppliers={suppliers}
      />
    </div>
  );
};
