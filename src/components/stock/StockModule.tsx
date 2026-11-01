import React, { useState } from 'react';
import { Product, ProductVariation, StockMovement } from '../../types/erp';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Boxes, 
  Plus, 
  AlertTriangle, 
  Search, 
  X, 
  Edit3,
  CheckCircle2
} from 'lucide-react';

interface StockModuleProps {
  products: Product[];
  onRefresh: () => void;
}

export const StockModule: React.FC<StockModuleProps> = ({ products, onRefresh }) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [abcFilter, setAbcFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  
  // Modais
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movementModalProduct, setMovementModalProduct] = useState<Product | null>(null);

  // Formulário de Cadastro / Edição
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Narguiles & Setups');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellPrice, setSellPrice] = useState<number | ''>('');
  const [currentStock, setCurrentStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number>(10);
  const [reorderPoint, setReorderPoint] = useState<number>(15);
  const [unit, setUnit] = useState<'UN' | 'CX' | 'KG' | 'PC' | 'KIT'>('UN');
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationName, setVariationName] = useState('');

  // Formulário de Movimentação
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [movementQty, setMovementQty] = useState<number | ''>('');
  const [movementReason, setMovementReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-geração de SKU se vazio
  const handleAutoSku = (prodName: string) => {
    if (!sku) {
      const initials = prodName
        .split(' ')
        .filter((w) => w.length > 2)
        .map((w) => w.substring(0, 3).toUpperCase())
        .join('-');
      const randomCode = Math.floor(100 + Math.random() * 900);
      setSku(`${initials || 'PROD'}-${randomCode}`);
    }
  };

  const handleAddVariation = () => {
    if (!variationName.trim()) return;
    const newVar: ProductVariation = {
      id: `var_${Date.now()}`,
      name: variationName.trim(),
      skuSuffix: variationName.substring(0, 3).toUpperCase(),
      stock: 0,
    };
    setVariations([...variations, newVar]);
    setVariationName('');
  };

  const handleRemoveVariation = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createProduct({
        name,
        sku: sku || `SKU-${Date.now().toString().slice(-5)}`,
        category,
        costPrice: Number(costPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 10,
        reorderPoint: Number(reorderPoint) || 15,
        unit,
        variations,
      });
      setIsNewProductOpen(false);
      setName('');
      setSku('');
      setCostPrice('');
      setSellPrice('');
      setCurrentStock('');
      setVariations([]);
      toast.success('Produto cadastrado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao criar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSellPrice(p.sellPrice);
    setCurrentStock(p.currentStock);
    setMinStock(p.minStock);
    setReorderPoint(p.reorderPoint);
    setUnit(p.unit);
    setVariations(p.variations || []);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateProduct(editingProduct.id, {
        name,
        sku,
        category,
        costPrice: Number(costPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 10,
        reorderPoint: Number(reorderPoint) || 15,
        unit,
        variations,
      });
      setEditingProduct(null);
      toast.success('Produto atualizado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao atualizar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModalProduct || !movementQty) return;
    setIsSubmitting(true);
    try {
      await api.registerStockMovement(
        movementModalProduct.id,
        movementType,
        Number(movementQty),
        movementReason || 'Movimentação via módulo de estoque'
      );
      setMovementModalProduct(null);
      setMovementQty('');
      setMovementReason('');
      toast.success('Movimentação registrada com sucesso!');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtros aplicados
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (abcFilter !== 'ALL' && p.abcClass !== abcFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
    }
    return true;
  });

  const totalInventoryValue = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const criticalStockCount = products.filter((p) => p.currentStock < p.minStock).length;

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Estoque, Catálogo & Inteligência Comercial</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Classificação Curva ABC, giro por SKU, ponto de reposição, edição e rastreabilidade
          </p>
        </div>
        <button
          onClick={() => {
            setName('');
            setSku('');
            setCostPrice('');
            setSellPrice('');
            setCurrentStock('');
            setMinStock(10);
            setReorderPoint(15);
            setVariations([]);
            setIsNewProductOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto & SKU</span>
        </button>
      </div>

      {/* 2. Grid de Métricas de Inventário */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Patrimônio em Estoque</span>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            R$ {totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Custo total do inventário</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Alertas de Estoque Baixo</span>
            {criticalStockCount > 0 && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          </div>
          <p className={`text-xl font-bold font-mono tabular-nums mt-1 ${criticalStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {criticalStockCount} SKU(s)
          </p>
          <span className="text-[10px] text-slate-500">Abaixo do estoque mínimo (&lt; 10 un)</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Total de SKUs Ativos</span>
          <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {products.length} itens
          </p>
          <span className="text-[10px] text-slate-500">Distribuídos em {categories.length} categorias</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Critério Curva ABC</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              A: 80% Fatur.
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              B: 15%
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
              C: 5%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Busca e Filtros */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 ml-1" />
          <input
            type="text"
            placeholder="Buscar por SKU, nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
          >
            <option value="ALL">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
            {(['ALL', 'A', 'B', 'C'] as const).map((grade) => (
              <button
                key={grade}
                onClick={() => setAbcFilter(grade)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  abcFilter === grade
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {grade === 'ALL' ? 'ABC Todas' : `Classe ${grade}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Tabela de Estoque com Ações de Edição e Ajuste */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-900/60">
                <th className="py-3 px-4">SKU / Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Custo Unit.</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-center">Estoque Atual</th>
                <th className="py-3 px-4 text-center">Curva ABC</th>
                <th className="py-3 px-4 text-center">Giro & Cobertura</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredProducts.map((p) => {
                const isCritical = p.currentStock < p.minStock;
                const isWarning = p.currentStock >= p.minStock && p.currentStock <= p.reorderPoint;

                return (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* SKU & Nome */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-cyan-400 text-xs">{p.sku}</div>
                      <div className="font-medium text-white truncate max-w-xs">{p.name}</div>
                      {p.variations && p.variations.length > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Grades: {p.variations.map((v) => v.name).join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-4 text-slate-300">{p.category}</td>

                    {/* Custo */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                      R$ {p.costPrice.toFixed(2)}
                    </td>

                    {/* Venda */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-400">
                      R$ {p.sellPrice.toFixed(2)}
                    </td>

                    {/* Estoque Atual com Alertas Visuais */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums font-bold">
                        <span className={`text-sm ${
                          isCritical ? 'text-rose-400 font-black' : isWarning ? 'text-amber-400' : 'text-slate-100'
                        }`}>
                          {p.currentStock} {p.unit}
                        </span>
                        {isCritical && (
                          <span title="Estoque abaixo do mínimo!" className="text-rose-400">⚠️</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Mín: {p.minStock} | Pedido: {p.reorderPoint}
                      </div>
                    </td>

                    {/* Curva ABC */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md font-mono ${
                        p.abcClass === 'A'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : p.abcClass === 'B'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        Classe {p.abcClass || 'C'}
                      </span>
                    </td>

                    {/* Giro e Cobertura */}
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono text-xs font-semibold text-slate-200">
                        {p.turnoverRatio || 1.0}x / ano
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.coverageDays || 30} dias cobert.
                      </div>
                    </td>

                    {/* Botões de Ação: Editar e Ajustar */}
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setMovementModalProduct(p)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
                      >
                        Ajustar / Baixa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Cadastrar Novo Produto & SKU */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-cyan-400" />
                <span>Cadastro de Produto & SKU Automático</span>
              </h2>
              <button
                onClick={() => setIsNewProductOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome do Produto / Setup <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Narguile Triton Zip Black Edition"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      handleAutoSku(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SKU Único (Auto ou Personalizado)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: NRG-TRIT-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Narguiles & Setups">Narguiles & Setups</option>
                    <option value="Carvões & Consumíveis">Carvões & Consumíveis</option>
                    <option value="Essências">Essências</option>
                    <option value="Acessórios">Acessórios (Rosh, Mangueiras)</option>
                    <option value="Equipamentos">Equipamentos & Fogareiros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estoque Mínimo (Alerta Crítico)
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Grades / Variações */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Grades / Variações (Cor, Tamanho, Voltagem)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Preto Fosco, Dourado, 220V..."
                    value={variationName}
                    onChange={(e) => setVariationName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded"
                  >
                    + Adicionar Variação
                  </button>
                </div>
                {variations.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {variations.map((v, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1.5"
                      >
                        <span>{v.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(idx)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Salvando...' : 'Cadastrar no Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR PRODUTO EXISTENTE */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Editar Informações do Produto & Estoque</span>
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome do Produto <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Código SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Narguiles & Setups">Narguiles & Setups</option>
                    <option value="Carvões & Consumíveis">Carvões & Consumíveis</option>
                    <option value="Essências">Essências</option>
                    <option value="Acessórios">Acessórios (Rosh, Mangueiras)</option>
                    <option value="Equipamentos">Equipamentos & Fogareiros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    required
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ponto de Reposição / Pedido
                  </label>
                  <input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="PC">PC (Peça)</option>
                    <option value="KIT">KIT</option>
                  </select>
                </div>
              </div>

              {/* Grades / Variações */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Grades / Variações (Cor, Tamanho, Voltagem)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar variação..."
                    value={variationName}
                    onChange={(e) => setVariationName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded"
                  >
                    + Adicionar
                  </button>
                </div>
                {variations.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {variations.map((v, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1.5"
                      >
                        <span>{v.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(idx)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Salvando...' : 'Atualizar Informações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Movimentação de Estoque */}
      {movementModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Movimentação de Estoque</h2>
                <p className="text-xs text-cyan-400 font-mono">{movementModalProduct.sku} · {movementModalProduct.name}</p>
              </div>
              <button
                onClick={() => setMovementModalProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovementType('ENTRADA')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    movementType === 'ENTRADA' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('SAIDA')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    movementType === 'SAIDA' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Saída (-)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('AJUSTE')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    movementType === 'AJUSTE' ? 'bg-amber-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Inventário / Ajuste
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantidade ({movementModalProduct.unit})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Quantidade a movimentar"
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Saldo atual: {movementModalProduct.currentStock} {movementModalProduct.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo / Justificativa da Rastreabilidade
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra NF 1204 ou Devolução de evento"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMovementModalProduct(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Gravando...' : 'Confirmar Movimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
