/**
 * Cérebro ERP - Tipos e Modelos de Domínio
 */

export type UserRole = 'ADMIN_MASTER' | 'OPERADOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  sessionHash: string;
  user: User;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  ip: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  integrityHash: string; // Hash encadeado (Ledger inviolável)
}

// ------------------- ESTOQUE & SKU -------------------
export interface ProductVariation {
  id: string;
  name: string; // Ex: "Preto Fosco", "Dourado", "Grande"
  skuSuffix: string;
  stock: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  variations: ProductVariation[];
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  unit: 'UN' | 'CX' | 'KG' | 'PC' | 'KIT';
  // Métricas calculadas
  salesVolumePeriod?: number;
  salesRevenuePeriod?: number;
  abcClass?: 'A' | 'B' | 'C';
  turnoverRatio?: number; // Giro de estoque
  coverageDays?: number; // Dias de cobertura
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  reason: string;
  timestamp: string;
  userId: string;
  userName: string;
}

// ------------------- CRM -------------------
export type ClientType = 'PF' | 'PJ';

export interface Client {
  id: string;
  type: ClientType;
  name: string; // Nome Completo ou Razão Social
  tradeName?: string; // Nome Fantasia ou Apelido
  document: string; // CPF ou CNPJ
  stateRegistration?: string; // RG ou Inscrição Estadual
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  creditLimit: number;
  status: 'ATIVO' | 'INATIVO';
  notes?: string;
  totalSpent: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyName: string; // Razão Social
  tradeName: string; // Nome Fantasia
  cnpj: string;
  stateRegistration?: string;
  category: string; // Ex: Tabacos, Alumínio, Carvão, Vapores, Equipamentos
  contactName: string;
  phone: string;
  email: string;
  bankDetails: {
    bank: string;
    agency: string;
    account: string;
    pixKey: string;
    pixType: 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  };
  leadTimeDays: number; // Lead time de entrega em dias
  shippingType: 'FOB' | 'CIF';
  paymentTerms: string; // Ex: "30/60 DDL", "À vista PIX"
  createdAt: string;
}

// ------------------- TESOURARIA & LIVRO CAIXA -------------------
export type FlowType = 'RECEITA' | 'DESPESA';
export type PaymentMethod = 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO';
export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export interface Installment {
  number: number;
  totalInstallments: number;
  dueDate: string;
  originalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  finalAmount: number;
  status: PaymentStatus;
  settledDate?: string;
}

export interface FinancialTransaction {
  id: string;
  code: string; // Ex: "LAN-2026-0042"
  flowType: FlowType;
  description: string;
  movementDate: string;
  dueDate: string;
  originalAmount: number;
  
  // Categorização
  macroCategory: string;
  subCategory: string;
  
  // Favorecido
  beneficiaryId?: string;
  beneficiaryName: string;
  beneficiaryType: 'CLIENTE' | 'FORNECEDOR' | 'TERCEIRO';
  
  // Conta e Forma de Pagamento
  accountOrigin: string; // Ex: "Caixa Geral Principal", "Itaú PJ"
  paymentMethod: PaymentMethod;
  
  // Parcelamento
  isInstallment: boolean;
  totalInstallments: number;
  installments: Installment[];
  
  // Encargos
  monthlyInterestRate: number; // % ao mês
  latePenaltyRate: number; // % multa
  calculatedInterestAmount: number;
  calculatedPenaltyAmount: number;
  totalFinalAmount: number; // Valor final com acréscimos
  
  // Liquidação
  status: PaymentStatus;
  settledDate?: string;
  beneficiaryPixKey?: string;
  documentNumber?: string; // NF ou Recibo
  notes?: string;
  
  createdAt: string;
}

// ------------------- DRE GERENCIAL -------------------
export interface DREPeriodData {
  period: string; // Ex: "Mês Vigente", "Ano 2026"
  grossRevenue: number; // Receita Bruta Total
  taxRatePercent: number; // Alíquota configurável (padrão 6% Simples Nacional)
  taxesSimplesNacional: number; // Impostos calculados
  netRevenue: number; // Receita Líquida
  cmv: number; // Custo das Mercadorias Vendidas
  grossProfit: number; // Lucro Bruto
  operatingExpenses: {
    fixedExpenses: number; // Aluguel, contas básicas, salários fixos
    variableExpenses: number; // Comissões, fretes de vendas
    directCosts: number; // Manutenções, embalagens
    totalOperating: number;
  };
  ebitda: number; // EBITDA / LAJIDA
  financialResult: {
    financialRevenue: number; // Juros recebidos (ex: empréstimos)
    financialExpenses: number; // Juros e taxas pagas
    netFinancial: number;
  };
  netIncome: number; // Resultado Líquido Final
  breakEvenPoint: number; // Ponto de Equilíbrio em R$
  breakdown?: {
    grossSalesRevenue: number;
    hookahRentalRevenue: number;
    loanInterestRevenue: number;
  };
}

// ------------------- CENTRAL DE EMPRÉSTIMOS DE CAPITAL -------------------
export interface LoanRepayment {
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: PaymentStatus;
  paidDate?: string;
  paidAmount?: number;
}

export interface MoneyLoan {
  id: string;
  contractNumber: string; // Ex: "EMP-2026-008"
  borrowerName: string;
  borrowerDocument: string;
  borrowerPhone: string;
  borrowerClientId?: string;
  principalAmount: number; // Valor Emprestado
  interestRateMonthly: number; // Taxa % a.m.
  interestType: 'SIMPLES' | 'COMPOSTO';
  issueDate: string;
  termMonths: number;
  totalProjectedReturn: number; // Quanto vai receber
  projectedProfit: number; // Lucro exato da operação
  repayments: LoanRepayment[];
  totalCollected: number;
  remainingBalance: number;
  status: 'EM_ANDAMENTO' | 'LIQUIDADO' | 'EM_ATRASO';
  notes?: string;
  createdAt: string;
}

// ------------------- GESTÃO DE ALUGUEL DE NARGUILES -------------------
export type HookahStatus = 'DISPONIVEL' | 'ALUGADO' | 'EM_MANUTENCAO';

export interface HookahEquipment {
  id: string;
  assetCode: string; // Ex: "NRG-LORD-01"
  model: string; // Ex: "Amazon Lord", "Sultan Mani"
  color: string;
  acquisitionCost: number;
  dailyRate: number; // Diária sugerida
  status: HookahStatus;
  totalRentalsCount: number;
  totalRevenueGenerated: number;
  currentRentalId?: string;
  notes?: string;
}

export interface HookahAccessoryChecklist {
  stem: boolean;
  siliconeHose: boolean;
  mouthpieceAluminum: boolean;
  bowlCeramic: boolean;
  glassBase: boolean;
  tray: boolean;
  charcoalTong: boolean;
  electricBurner: boolean;
}

export interface HookahDamageOccurrence {
  id: string;
  date: string;
  partDamaged: string;
  description: string;
  feeCharged: number;
  paid: boolean;
}

export interface HookahRental {
  id: string;
  code: string; // Ex: "LOC-2026-015"
  equipmentId: string;
  equipmentCode: string;
  equipmentModel: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  clientPhone: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  dailyRate: number;
  totalRentalAmount: number;
  depositAmount: number; // Caução
  checklistDelivered: HookahAccessoryChecklist;
  checklistReturned?: HookahAccessoryChecklist;
  damages: HookahDamageOccurrence[];
  extraCharges: number;
  finalTotalAmount: number;
  status: 'ATIVA' | 'FINALIZADA' | 'CANCELADA';
  transactionId?: string; // Vínculo com a tesouraria
  notes?: string;
  createdAt: string;
}
