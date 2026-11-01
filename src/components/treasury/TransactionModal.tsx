import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Calculator, 
  Calendar, 
  DollarSign, 
  Building2, 
  CreditCard, 
  FileText, 
  Percent,
  CheckCircle2
} from 'lucide-react';
import { 
  FinancialTransaction, 
  FlowType, 
  PaymentMethod, 
  PaymentStatus, 
  Client, 
  Supplier 
} from '../../types/erp';
import { api } from '../../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
  suppliers: Supplier[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clients,
  suppliers,
}) => {
  const [flowType, setFlowType] = useState<FlowType>('RECEITA');
  const [description, setDescription] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [originalAmount, setOriginalAmount] = useState<number | ''>('');
  
  // Categorias
  const [macroCategory, setMacroCategory] = useState('Venda de Mercadorias');
  const [subCategory, setSubCategory] = useState('Venda Atacado B2B');

  // Favorecido
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryType, setBeneficiaryType] = useState<'CLIENTE' | 'FORNECEDOR' | 'TERCEIRO'>('CLIENTE');
  const [beneficiaryPixKey, setBeneficiaryPixKey] = useState('');
  const [showNewBeneficiaryModal, setShowNewBeneficiaryModal] = useState(false);
  const [newBeneficiaryInput, setNewBeneficiaryInput] = useState('');

  // Conta & Forma de Pagamento
  const [accountOrigin, setAccountOrigin] = useState('Caixa Geral Principal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');

  // Parcelamento Inteligente
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(1);

  // Encargos & Juros
  const [applySurcharges, setApplySurcharges] = useState(false);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(0);
  const [latePenaltyRate, setLatePenaltyRate] = useState<number>(0);

  // Liquidação
  const [status, setStatus] = useState<PaymentStatus>('PAGO');
  const [settledDate, setSettledDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Categorias predefinidas
  const macroCategoriesByFlow = {
    RECEITA: [
      'Venda de Mercadorias',
      'Locação de Narguiles',
      'Rendimentos Financeiros',
      'Serviços e Manutenção',
      'Outras Receitas Operacionais',
    ],
    DESPESA: [
      'Custo de Mercadorias (CMV)',
      'Despesas Operacionais Fixas',
      'Despesas Operacionais Variáveis',
      'Custos Diretos & Manutenção',
      'Despesas Financeiras & Tarifas',
      'Impostos e Tributos Fiscais',
      'Pró-labore & Pessoal',
    ],
  };

  // Atualiza categorias ao alterar o tipo de fluxo
  useEffect(() => {
    if (flowType === 'RECEITA') {
      setMacroCategory('Venda de Mercadorias');
      setSubCategory('Venda Atacado B2B');
    } else {
      setMacroCategory('Custo de Mercadorias (CMV)');
      setSubCategory('Compras de Fornecedores');
    }
  }, [flowType]);

  // Cálculos dinâmicos de encargos
  const numOriginal = Number(originalAmount) || 0;
  const calculatedInterest = applySurcharges ? (numOriginal * (Number(monthlyInterestRate) || 0)) / 100 : 0;
  const calculatedPenalty = applySurcharges ? (numOriginal * (Number(latePenaltyRate) || 0)) / 100 : 0;
  const totalFinalAmount = numOriginal + calculatedInterest + calculatedPenalty;

  // Autocompletar Favorecido
  const allBeneficiaries = [
    ...clients.map((c) => ({ name: c.name, type: 'CLIENTE' as const, doc: c.document, pix: c.email })),
    ...suppliers.map((s) => ({ name: s.tradeName || s.companyName, type: 'FORNECEDOR' as const, doc: s.cnpj, pix: s.bankDetails?.pixKey || '' })),
  ];

  const filteredBeneficiaries = beneficiaryName
    ? allBeneficiaries.filter((b) => b.name.toLowerCase().includes(beneficiaryName.toLowerCase()))
    : [];

  const handleSelectBeneficiary = (b: { name: string; type: 'CLIENTE' | 'FORNECEDOR'; pix: string }) => {
    setBeneficiaryName(b.name);
    setBeneficiaryType(b.type);
    if (b.pix) setBeneficiaryPixKey(b.pix);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('A descrição do lançamento é obrigatória.');
      return;
    }
    if (numOriginal <= 0) {
      setErrorMsg('Informe um valor original maior que zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.createTransaction({
        flowType,
        description,
        movementDate,
        dueDate,
        originalAmount: numOriginal,
        macroCategory,
        subCategory,
        beneficiaryName: beneficiaryName || 'Diversos',
        beneficiaryType,
        beneficiaryPixKey,
        accountOrigin,
        paymentMethod,
        isInstallment,
        totalInstallments: isInstallment ? totalInstallments : 1,
        monthlyInterestRate: applySurcharges ? Number(monthlyInterestRate) : 0,
        latePenaltyRate: applySurcharges ? Number(latePenaltyRate) : 0,
        status,
        settledDate: status === 'PAGO' ? settledDate : undefined,
        documentNumber,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar lançamento financeiro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header do Modal */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${flowType === 'RECEITA' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Novo Lançamento Financeiro</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Livro Caixa, Tesouraria e Conciliação</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* 1. Seleção de Tipo de Fluxo (Receita vs Despesa) */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setFlowType('RECEITA')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                flowType === 'RECEITA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Entrada / A Receber (Receita)</span>
            </button>
            <button
              type="button"
              onClick={() => setFlowType('DESPESA')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                flowType === 'DESPESA'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Saída / A Pagar (Despesa)</span>
            </button>
          </div>

          {/* 2. Descrição e Datas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descrição do Lançamento <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Venda de Setups Completos ou Pagamento Fornecedor de Carvão"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data de Movimentação
              </label>
              <input
                type="date"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vencimento Inicial
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Original (R$) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm font-mono tabular-nums text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Categorização Macro e Subcategoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria Macro
              </label>
              <select
                value={macroCategory}
                onChange={(e) => setMacroCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                {macroCategoriesByFlow[flowType].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subcategoria Financeira
              </label>
              <input
                type="text"
                placeholder="Ex: Locação de Fim de Semana, Compra de Alumínio"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 4. Favorecido com Autocomplete e Inline "+ Novo" */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Favorecido (Credor / Devedor)
              </label>
              <button
                type="button"
                onClick={() => setShowNewBeneficiaryModal(!showNewBeneficiaryModal)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Novo Favorecido Rápido</span>
              </button>
            </div>

            {showNewBeneficiaryModal ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do Novo Favorecido"
                  value={newBeneficiaryInput}
                  onChange={(e) => setNewBeneficiaryInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-cyan-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newBeneficiaryInput.trim()) {
                      setBeneficiaryName(newBeneficiaryInput);
                      setShowNewBeneficiaryModal(false);
                      setNewBeneficiaryInput('');
                    }
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewBeneficiaryModal(false)}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite para buscar Cliente ou Fornecedor..."
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
                {filteredBeneficiaries.length > 0 && beneficiaryName && !allBeneficiaries.some(b => b.name === beneficiaryName) && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-lg max-h-36 overflow-y-auto z-20 shadow-xl">
                    {filteredBeneficiaries.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectBeneficiary(b)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/40 last:border-0"
                      >
                        <span className="font-medium truncate">{b.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{b.type} · {b.doc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Conta de Origem e Forma de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Origem do Caixa / Conta Bancária
              </label>
              <select
                value={accountOrigin}
                onChange={(e) => setAccountOrigin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="Caixa Geral Principal">Caixa Geral Principal (Físico)</option>
                <option value="Banco Itaú Empresa">Banco Itaú Empresa (Conta PJ)</option>
                <option value="Banco Bradesco">Banco Bradesco (Conta Principal)</option>
                <option value="Conta Digital PJ">Conta Digital PJ (Inter/Nubank)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="PIX">PIX Instantâneo</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="TRANSFERENCIA">Transferência Bancária (TED/DOC)</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="DINHEIRO">Dinheiro em Espécie</option>
              </select>
            </div>
          </div>

          {/* 6. Parcelamento Inteligente */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkInstallment"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="chkInstallment" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Parcelamento Inteligente
                </label>
              </div>
              {isInstallment && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Quantidade de Parcelas:</span>
                  <select
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {[2, 3, 4, 5, 6, 10, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>
                        {n}x de R$ {(totalFinalAmount / n).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 7. Acréscimos, Juros e Multas Condicionais */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkSurcharges"
                  checked={applySurcharges}
                  onChange={(e) => setApplySurcharges(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="chkSurcharges" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Aplicar Encargos / Acréscimos (Juros e Multa)
                </label>
              </div>
            </div>

            {applySurcharges && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Juros ao Mês (% a.m.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 3.5"
                    value={monthlyInterestRate}
                    onChange={(e) => setMonthlyInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    + R$ {calculatedInterest.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Multa por Atraso (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.0"
                    value={latePenaltyRate}
                    onChange={(e) => setLatePenaltyRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    + R$ {calculatedPenalty.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 8. Resumo do Valor Total Final */}
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-lg flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-200">
              Valor Total Final (com acréscimos):
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-cyan-300">
              R$ {totalFinalAmount.toFixed(2)}
            </span>
          </div>

          {/* 9. Liquidação e Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status da Operação
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="PAGO">Pago / Liquidado Imediato</option>
                <option value="PENDENTE">Pendente (A Receber / A Pagar)</option>
              </select>
            </div>

            {status === 'PAGO' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data da Liquidação
                </label>
                <input
                  type="date"
                  value={settledDate}
                  onChange={(e) => setSettledDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chave PIX / Comprovante
              </label>
              <input
                type="text"
                placeholder="Chave PIX do Favorecido"
                value={beneficiaryPixKey}
                onChange={(e) => setBeneficiaryPixKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* 10. Documento Fiscal / Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Número do Documento / Nota Fiscal
              </label>
              <input
                type="text"
                placeholder="Ex: NF-e 001942 ou Recibo 482"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observações Operacionais
              </label>
              <input
                type="text"
                placeholder="Detalhes ou acordos específicos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Gravando...' : 'Salvar e Registrar no Caixa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
