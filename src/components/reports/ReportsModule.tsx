import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FinancialTransaction, 
  Product, 
  Client, 
  HookahRental, 
  MoneyLoan, 
  DREPeriodData 
} from '../../types/erp';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  FileBarChart2, 
  CheckCircle2, 
  Layers,
  TrendingUp,
  Table
} from 'lucide-react';

interface ReportsModuleProps {
  transactions: FinancialTransaction[];
  products: Product[];
  clients: Client[];
  rentals: HookahRental[];
  loans: MoneyLoan[];
  dreData: DREPeriodData | null;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  transactions,
  products,
  clients,
  rentals,
  loans,
  dreData,
}) => {
  const [selectedReport, setSelectedReport] = useState<
    'VENDAS' | 'SKU' | 'CLIENTES' | 'DRE' | 'CURVA_ABC' | 'GIRO' | 'BALANCO' | 'EXTRATO'
  >('VENDAS');

  // 1. Exportação Real para Excel (.xlsx) usando a biblioteca xlsx
  const handleExportXLSX = () => {
    let dataToExport: any[] = [];
    let fileName = `Controle_Murilo_${selectedReport}_${new Date().toISOString().split('T')[0]}.xlsx`;

    switch (selectedReport) {
      case 'VENDAS':
        dataToExport = transactions
          .filter((t) => t.flowType === 'RECEITA')
          .map((t) => ({
            Código: t.code,
            Data: t.movementDate,
            Vencimento: t.dueDate,
            Favorecido: t.beneficiaryName,
            Descrição: t.description,
            Categoria: t.macroCategory,
            Subcategoria: t.subCategory,
            Forma_Pagamento: t.paymentMethod,
            Valor_Original: t.originalAmount,
            Valor_Final: t.totalFinalAmount,
            Status: t.status,
            Liquidado_Em: t.settledDate || 'Pendente',
          }));
        break;

      case 'SKU':
        dataToExport = products.map((p) => ({
          SKU: p.sku,
          Nome_Produto: p.name,
          Categoria: p.category,
          Custo_Unitario: p.costPrice,
          Preco_Venda: p.sellPrice,
          Estoque_Atual: p.currentStock,
          Estoque_Minimo: p.minStock,
          Ponto_Pedido: p.reorderPoint,
          Unidade: p.unit,
          Classe_ABC: p.abcClass || 'C',
          Giro_Estoque: p.turnoverRatio || 1.0,
          Dias_Cobertura: p.coverageDays || 30,
        }));
        break;

      case 'CLIENTES':
        dataToExport = clients.map((c) => ({
          Tipo: c.type,
          Nome_Razao_Social: c.name,
          Nome_Fantasia: c.tradeName || c.name,
          Documento_CPF_CNPJ: c.document,
          Inscricao_Estadual: c.stateRegistration || '',
          Telefone: c.phone,
          Email: c.email,
          Cidade: c.address.city,
          UF: c.address.state,
          Limite_Credito: c.creditLimit,
          Total_Comprado: c.totalSpent,
          Status: c.status,
        }));
        break;

      case 'CURVA_ABC':
        dataToExport = products
          .slice()
          .sort((a, b) => (b.salesRevenuePeriod || 0) - (a.salesRevenuePeriod || 0))
          .map((p) => ({
            SKU: p.sku,
            Produto: p.name,
            Classe_ABC: p.abcClass,
            Faturamento_Periodo: p.salesRevenuePeriod || 0,
            Volume_Vendido: p.salesVolumePeriod || 0,
            Estoque_Atual: p.currentStock,
            Preco_Venda: p.sellPrice,
          }));
        break;

      case 'GIRO':
        dataToExport = products.map((p) => ({
          SKU: p.sku,
          Produto: p.name,
          Indice_Giro_Anual: p.turnoverRatio || 1.0,
          Dias_Cobertura_Estoque: p.coverageDays || 30,
          Estoque_Atual: p.currentStock,
          Estoque_Minimo: p.minStock,
        }));
        break;

      case 'DRE':
        if (dreData) {
          dataToExport = [
            { Rubrica: '1. (+) Receita Operacional Bruta', Valor: dreData.grossRevenue },
            { Rubrica: `2. (-) Impostos Simples Nacional (${dreData.taxRatePercent}%)`, Valor: -dreData.taxesSimplesNacional },
            { Rubrica: '3. (=) Receita Operacional Líquida', Valor: dreData.netRevenue },
            { Rubrica: '4. (-) Custo das Mercadorias Vendidas (CMV)', Valor: -dreData.cmv },
            { Rubrica: '5. (=) Lucro Bruto', Valor: dreData.grossProfit },
            { Rubrica: '6. (-) Despesas Fixas', Valor: -dreData.operatingExpenses.fixedExpenses },
            { Rubrica: '7. (-) Despesas Variáveis', Valor: -dreData.operatingExpenses.variableExpenses },
            { Rubrica: '8. (-) Custos Diretos & Manutenção', Valor: -dreData.operatingExpenses.directCosts },
            { Rubrica: '9. (=) EBITDA / LAJIDA', Valor: dreData.ebitda },
            { Rubrica: '10. (+/-) Resultado Financeiro Líquido', Valor: dreData.financialResult.netFinancial },
            { Rubrica: '11. (=) Resultado Líquido do Período', Valor: dreData.netIncome },
            { Rubrica: '12. Ponto de Equilíbrio (Break-even)', Valor: dreData.breakEvenPoint },
          ];
        }
        break;

      case 'EXTRATO':
      default:
        dataToExport = transactions.map((t) => ({
          Código: t.code,
          Tipo: t.flowType,
          Data: t.movementDate,
          Vencimento: t.dueDate,
          Descrição: t.description,
          Favorecido: t.beneficiaryName,
          Conta: t.accountOrigin,
          Forma: t.paymentMethod,
          Valor_Final: t.totalFinalAmount,
          Status: t.status,
          Liquidado_Em: t.settledDate || '',
        }));
        break;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    XLSX.writeFile(workbook, fileName);
  };

  // 2. Impressão Executiva / PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo com Botões de Exportação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Central de Relatórios Corporativos</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pré-visualização gerencial em tempo real com exportação direta para Excel (.XLSX) e Impressão / PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportXLSX}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (XLSX)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Menu de Tipos de Relatórios */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2">
        {[
          { id: 'VENDAS', label: 'Vendas por Período' },
          { id: 'SKU', label: 'Vendas Detalhadas por SKU' },
          { id: 'CLIENTES', label: 'Histórico de Clientes' },
          { id: 'DRE', label: 'DRE Consolidada' },
          { id: 'CURVA_ABC', label: 'Curva ABC de Estoque' },
          { id: 'GIRO', label: 'Índice de Giro & Cobertura' },
          { id: 'EXTRATO', label: 'Extrato Bruto de Caixa' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedReport === tab.id
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tabela de Pré-visualização do Relatório Selecionado */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">
              Pré-visualização do Relatório — {selectedReport}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </span>
        </div>

        <div className="overflow-x-auto p-4">
          {/* Relatório: Vendas por Período */}
          {selectedReport === 'VENDAS' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3">Favorecido</th>
                  <th className="py-2 px-3">Categoria</th>
                  <th className="py-2 px-3 text-right">Valor Final</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions
                  .filter((t) => t.flowType === 'RECEITA')
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-mono text-cyan-400">{t.code}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{t.movementDate}</td>
                      <td className="py-2 px-3 text-white font-medium">{t.beneficiaryName}</td>
                      <td className="py-2 px-3 text-slate-400">{t.macroCategory}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                        R$ {t.totalFinalAmount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* Relatório: SKU & Inventário */}
          {selectedReport === 'SKU' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Produto</th>
                  <th className="py-2 px-3">Categoria</th>
                  <th className="py-2 px-3 text-right">Custo Unit.</th>
                  <th className="py-2 px-3 text-right">Preço Venda</th>
                  <th className="py-2 px-3 text-center">Estoque</th>
                  <th className="py-2 px-3 text-center">Curva ABC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-mono font-bold text-cyan-400">{p.sku}</td>
                    <td className="py-2 px-3 text-white font-medium">{p.name}</td>
                    <td className="py-2 px-3 text-slate-400">{p.category}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">
                      R$ {p.costPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                      R$ {p.sellPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-slate-200">
                      {p.currentStock} {p.unit}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-cyan-300">
                      Classe {p.abcClass || 'C'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Relatório: DRE */}
          {selectedReport === 'DRE' && dreData && (
            <div className="space-y-2 font-mono text-xs max-w-2xl">
              <div className="flex justify-between py-1.5 border-b border-slate-800 font-bold text-white">
                <span>Receita Operacional Bruta:</span>
                <span className="text-emerald-400">R$ {dreData.grossRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400 pl-3">
                <span>(-) Simples Nacional ({dreData.taxRatePercent}%):</span>
                <span className="text-rose-400">- R$ {dreData.taxesSimplesNacional.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400 pl-3">
                <span>(-) Custo Mercadorias (CMV):</span>
                <span className="text-rose-400">- R$ {dreData.cmv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-b border-slate-800 font-bold text-slate-200">
                <span>Lucro Bruto Operacional:</span>
                <span className="text-white">R$ {dreData.grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400 pl-3">
                <span>(-) Despesas Operacionais Totais:</span>
                <span className="text-rose-400">- R$ {dreData.operatingExpenses.totalOperating.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-b border-slate-800 font-bold text-white">
                <span>EBITDA / LAJIDA:</span>
                <span className={dreData.ebitda >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  R$ {dreData.ebitda.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-cyan-800 font-bold text-sm bg-cyan-950/40 px-3 rounded text-cyan-300">
                <span>Resultado Líquido do Período:</span>
                <span>R$ {dreData.netIncome.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Relatório: Extrato Bruto do Caixa */}
          {selectedReport === 'EXTRATO' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Descrição</th>
                  <th className="py-2 px-3">Conta</th>
                  <th className="py-2 px-3 text-right">Valor</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-cyan-400">{t.code}</td>
                    <td className="py-2 px-3 text-slate-400">{t.movementDate}</td>
                    <td className="py-2 px-3">
                      <span className={t.flowType === 'RECEITA' ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.flowType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-white font-sans truncate max-w-xs">{t.description}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">{t.accountOrigin}</td>
                    <td className="py-2 px-3 text-right font-bold tabular-nums">
                      <span className={t.flowType === 'RECEITA' ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.flowType === 'RECEITA' ? '+' : '-'} R$ {t.totalFinalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] text-slate-400">{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
