import {
  User,
  AuditLog,
  Product,
  StockMovement,
  Client,
  Supplier,
  FinancialTransaction,
  MoneyLoan,
  HookahEquipment,
  HookahRental,
  DREPeriodData,
} from '../types/erp';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cerebro_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha na autenticação');
    }
    const data = await res.json();
    localStorage.setItem('cerebro_token', data.token);
    localStorage.setItem('cerebro_session_hash', data.sessionHash);
    localStorage.setItem('cerebro_user', JSON.stringify(data.user));
    return data;
  },

  async getSession() {
    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return null;
    return res.json();
  },

  logout() {
    localStorage.removeItem('cerebro_token');
    localStorage.removeItem('cerebro_session_hash');
    localStorage.removeItem('cerebro_user');
  },

  // Audit Logs
  async getAuditLogs(): Promise<{ logs: AuditLog[]; totalCount: number }> {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao carregar logs de auditoria');
    return res.json();
  },

  // Products & Stock
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter produtos');
    return res.json();
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Falha ao criar produto');
    return res.json();
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Falha ao atualizar produto');
    return res.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao excluir produto no banco de dados');
  },

  async getMovements(): Promise<StockMovement[]> {
    const res = await fetch(`${API_BASE}/movements`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async registerStockMovement(id: string, type: 'ENTRADA' | 'SAIDA' | 'AJUSTE', quantity: number, reason: string): Promise<{ product: Product; movement: StockMovement }> {
    const res = await fetch(`${API_BASE}/products/${id}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ type, quantity, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar movimentação');
    }
    return res.json();
  },

  // CRM Clients
  async getClients(): Promise<Client[]> {
    const res = await fetch(`${API_BASE}/clients`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter clientes');
    return res.json();
  },

  async createClient(client: Partial<Client>): Promise<Client> {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error('Falha ao criar cliente');
    return res.json();
  },

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error('Falha ao atualizar cliente');
    return res.json();
  },

  async deleteClient(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao excluir cliente');
  },

  // CRM Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${API_BASE}/suppliers`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter fornecedores');
    return res.json();
  },

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(supplier),
    });
    if (!res.ok) throw new Error('Falha ao criar fornecedor');
    return res.json();
  },

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(supplier),
    });
    if (!res.ok) throw new Error('Falha ao atualizar fornecedor');
    return res.json();
  },

  async deleteSupplier(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao excluir fornecedor');
  },

  // Treasury & Transactions
  async getTransactions(): Promise<FinancialTransaction[]> {
    const res = await fetch(`${API_BASE}/transactions`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter lançamentos');
    return res.json();
  },

  async createTransaction(tx: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(tx),
    });
    if (!res.ok) throw new Error('Falha ao criar lançamento financeiro');
    return res.json();
  },

  async updateTransaction(id: string, tx: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(tx),
    });
    if (!res.ok) throw new Error('Falha ao atualizar lançamento financeiro');
    return res.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao excluir lançamento');
  },

  async settleTransaction(id: string): Promise<FinancialTransaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}/settle`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao liquidar lançamento');
    return res.json();
  },

  // DRE
  async getDRE(taxRate: number = 6.0): Promise<DREPeriodData> {
    try {
      const res = await fetch(`${API_BASE}/dre?taxRate=${taxRate}`, {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Falha na chamada direta /api/dre, calculando com base nos lançamentos:', e);
    }

    // Fallback gracioso com base nas transações sincronizadas
    const txList = await api.getTransactions().catch(() => []);
    let grossSalesRevenue = 0;
    let hookahRentalRevenue = 0;
    let loanInterestRevenue = 0;
    let cmvTotal = 0;
    let fixedOperating = 0;
    let variableOperating = 0;
    let directCosts = 0;
    let financialExpenses = 0;

    for (const tx of txList) {
      const status = String(tx.status || '').toUpperCase();
      if (status !== 'PAGO' && status !== 'COMPLETED' && status !== 'LIQUIDADO') continue;

      const cat = String(tx.macroCategory || tx.subCategory || '').toLowerCase();
      const flow = String(tx.flowType || '').toUpperCase();
      const finalAmt = Number(tx.totalFinalAmount || tx.originalAmount) || 0;

      if (flow === 'RECEITA' || flow === 'IN') {
        if (cat.includes('locaç') || cat.includes('locac') || cat.includes('narguil')) {
          hookahRentalRevenue += finalAmt;
        } else if (cat.includes('rendimento') || cat.includes('juro') || cat.includes('financeir')) {
          loanInterestRevenue += finalAmt;
        } else {
          grossSalesRevenue += finalAmt;
        }
      } else if (flow === 'DESPESA' || flow === 'OUT') {
        if (cat.includes('cmv') || cat.includes('mercadoria') || cat.includes('insumo')) {
          cmvTotal += finalAmt;
        } else if (cat.includes('fixa') || cat.includes('aluguel') || cat.includes('salario')) {
          fixedOperating += finalAmt;
        } else if (cat.includes('variáv') || cat.includes('comiss')) {
          variableOperating += finalAmt;
        } else if (cat.includes('custo') || cat.includes('manuten')) {
          directCosts += finalAmt;
        } else if (cat.includes('financeir') || cat.includes('juro')) {
          financialExpenses += finalAmt;
        } else {
          fixedOperating += finalAmt;
        }
      }
    }

    const totalGrossRevenue = grossSalesRevenue + hookahRentalRevenue + loanInterestRevenue;
    const taxesSimplesNacional = (totalGrossRevenue * taxRate) / 100;
    const netRevenue = totalGrossRevenue - taxesSimplesNacional;
    const grossProfit = netRevenue - cmvTotal;

    const totalOperatingExpenses = fixedOperating + variableOperating + directCosts;
    const ebitda = grossProfit - totalOperatingExpenses;
    const netFinancial = loanInterestRevenue - financialExpenses;
    const netIncome = ebitda + netFinancial;

    const contributionMarginAmount = netRevenue - (cmvTotal + variableOperating + directCosts);
    const contributionMarginRatio = netRevenue > 0 ? (contributionMarginAmount / netRevenue) : 0.45;
    const breakEvenPoint = contributionMarginRatio > 0 ? (fixedOperating / contributionMarginRatio) : 0;

    return {
      period: 'Mês Vigente (Outubro/2026)',
      grossRevenue: Number(totalGrossRevenue.toFixed(2)),
      taxRatePercent: taxRate,
      taxesSimplesNacional: Number(taxesSimplesNacional.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      cmv: Number(cmvTotal.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      operatingExpenses: {
        fixedExpenses: Number(fixedOperating.toFixed(2)),
        variableExpenses: Number(variableOperating.toFixed(2)),
        directCosts: Number(directCosts.toFixed(2)),
        totalOperating: Number(totalOperatingExpenses.toFixed(2)),
      },
      ebitda: Number(ebitda.toFixed(2)),
      financialResult: {
        financialRevenue: Number(loanInterestRevenue.toFixed(2)),
        financialExpenses: Number(financialExpenses.toFixed(2)),
        netFinancial: Number(netFinancial.toFixed(2)),
      },
      netIncome: Number(netIncome.toFixed(2)),
      breakEvenPoint: Number(breakEvenPoint.toFixed(2)),
      breakdown: {
        grossSalesRevenue: Number(grossSalesRevenue.toFixed(2)),
        hookahRentalRevenue: Number(hookahRentalRevenue.toFixed(2)),
        loanInterestRevenue: Number(loanInterestRevenue.toFixed(2)),
      }
    };
  },

  // Loans
  async getLoans(): Promise<MoneyLoan[]> {
    const res = await fetch(`${API_BASE}/loans`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter contratos de empréstimos');
    return res.json();
  },

  async createLoan(loan: Partial<MoneyLoan>): Promise<MoneyLoan> {
    const res = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(loan),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar empréstimo');
    return res.json();
  },

  async updateLoan(id: string, loan: Partial<MoneyLoan>): Promise<MoneyLoan> {
    const res = await fetch(`${API_BASE}/loans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(loan),
    });
    if (!res.ok) throw new Error('Falha ao atualizar empréstimo');
    return res.json();
  },

  async deleteLoan(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/loans/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao excluir contrato de empréstimo');
  },

  async amortizeLoan(id: string, installmentNumber: number, amount?: number): Promise<MoneyLoan> {
    const res = await fetch(`${API_BASE}/loans/${id}/amortize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ installmentNumber, amount }),
    });
    if (!res.ok) throw new Error('Falha ao registrar amortização');
    return res.json();
  },

  // Hookah Fleet
  async getHookahs(): Promise<HookahEquipment[]> {
    const res = await fetch(`${API_BASE}/hookahs`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter equipamentos de narguile');
    return res.json();
  },

  async createHookah(hookah: Partial<HookahEquipment>): Promise<HookahEquipment> {
    const res = await fetch(`${API_BASE}/hookahs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(hookah),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar narguile');
    return res.json();
  },

  async updateHookah(id: string, hookah: Partial<HookahEquipment>): Promise<HookahEquipment> {
    const res = await fetch(`${API_BASE}/hookahs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(hookah),
    });
    if (!res.ok) throw new Error('Falha ao atualizar narguile');
    return res.json();
  },

  async deleteHookah(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/hookahs/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao excluir narguile');
  },

  async getRentals(): Promise<HookahRental[]> {
    const res = await fetch(`${API_BASE}/rentals`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter locações');
    return res.json();
  },

  async createRental(rental: Partial<HookahRental>): Promise<HookahRental> {
    const res = await fetch(`${API_BASE}/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(rental),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar locação');
    }
    return res.json();
  },

  async returnRental(id: string, data: { checklistReturned: any; damages: any[]; extraCharges: number }): Promise<HookahRental> {
    const res = await fetch(`${API_BASE}/rentals/${id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao registrar devolução');
    return res.json();
  },

  async updateRental(id: string, rental: Partial<HookahRental>): Promise<HookahRental> {
    const res = await fetch(`${API_BASE}/rentals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(rental),
    });
    if (!res.ok) throw new Error('Falha ao atualizar locação');
    return res.json();
  },

  async deleteRental(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/rentals/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao excluir locação');
  },

  // Reports Summary
  async getSummaryReport() {
    const res = await fetch(`${API_BASE}/reports/summary`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Falha ao obter resumo gerencial');
    return res.json();
  },
};
