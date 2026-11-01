import React, { useState } from 'react';
import { 
  HookahEquipment, 
  HookahRental, 
  Client, 
  HookahAccessoryChecklist,
  HookahDamageOccurrence 
} from '../../types/erp';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Flame, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  X,
  FileText,
  UserCheck,
  Edit2
} from 'lucide-react';

interface HookahModuleProps {
  hookahs: HookahEquipment[];
  rentals: HookahRental[];
  clients: Client[];
  onRefresh: () => void;
}

export const HookahModule: React.FC<HookahModuleProps> = ({
  hookahs,
  rentals,
  clients,
  onRefresh,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'fleet' | 'rentals'>('fleet');
  
  // Modais
  const [isNewHookahOpen, setIsNewHookahOpen] = useState(false);
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  const [returnRentalModal, setReturnRentalModal] = useState<HookahRental | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Novo Equipamento
  const [assetCode, setAssetCode] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState<number | ''>('');
  const [dailyRate, setDailyRate] = useState<number | ''>(110);
  const [notes, setNotes] = useState('');

  // Form Nova Locação
  const [selectedHookahId, setSelectedHookahId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [rentalEndDate, setRentalEndDate] = useState(
    new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [rentalDailyRate, setRentalDailyRate] = useState<number>(110);
  const [rentalTotalAmount, setRentalTotalAmount] = useState<number>(220);
  const [rentalDeposit, setRentalDeposit] = useState<number>(150);
  const [checklist, setChecklist] = useState<HookahAccessoryChecklist>({
    stem: true,
    siliconeHose: true,
    mouthpieceAluminum: true,
    bowlCeramic: true,
    glassBase: true,
    tray: true,
    charcoalTong: true,
    electricBurner: true,
  });

  // Form Devolução & Inspeção
  const [returnChecklist, setReturnChecklist] = useState<HookahAccessoryChecklist>({
    stem: true,
    siliconeHose: true,
    mouthpieceAluminum: true,
    bowlCeramic: true,
    glassBase: true,
    tray: true,
    charcoalTong: true,
    electricBurner: true,
  });
  const [damagePart, setDamagePart] = useState('');
  const [damageFee, setDamageFee] = useState<number>(0);
  const [damageNotes, setDamageNotes] = useState('');

  // Estados de Edição da Frota (Narguiles)
  const [editingHookah, setEditingHookah] = useState<HookahEquipment | null>(null);
  const [editHookahAssetCode, setEditHookahAssetCode] = useState('');
  const [editHookahModel, setEditHookahModel] = useState('');
  const [editHookahColor, setEditHookahColor] = useState('');
  const [editHookahAcquisitionCost, setEditHookahAcquisitionCost] = useState<number | ''>('');
  const [editHookahDailyRate, setEditHookahDailyRate] = useState<number | ''>('');
  const [editHookahStatus, setEditHookahStatus] = useState<'DISPONIVEL' | 'ALUGADO' | 'EM_MANUTENCAO'>('DISPONIVEL');
  const [editHookahNotes, setEditHookahNotes] = useState('');

  // Estados de Edição de Ficha de Locação
  const [editingRental, setEditingRental] = useState<HookahRental | null>(null);
  const [editRentalClientPhone, setEditRentalClientPhone] = useState('');
  const [editRentalStartDate, setEditRentalStartDate] = useState('');
  const [editRentalEndDate, setEditRentalEndDate] = useState('');
  const [editRentalDailyRate, setEditRentalDailyRate] = useState<number | ''>('');
  const [editRentalTotalAmount, setEditRentalTotalAmount] = useState<number | ''>('');
  const [editRentalDepositAmount, setEditRentalDepositAmount] = useState<number | ''>('');
  const [editRentalStatus, setEditRentalStatus] = useState<'ATIVA' | 'FINALIZADA' | 'CANCELADA'>('ATIVA');

  // Métricas do Proprietário da Frota
  const totalFleetCount = hookahs.length;
  const availableCount = hookahs.filter((h) => h.status === 'DISPONIVEL').length;
  const rentedCount = hookahs.filter((h) => h.status === 'ALUGADO').length;
  const maintenanceCount = hookahs.filter((h) => h.status === 'EM_MANUTENCAO').length;
  const totalFleetRevenue = hookahs.reduce((acc, h) => acc + h.totalRevenueGenerated, 0);

  const handleSelectHookahForRental = (hId: string) => {
    setSelectedHookahId(hId);
    const h = hookahs.find((item) => item.id === hId);
    if (h) {
      setRentalDailyRate(h.dailyRate);
      setRentalTotalAmount(h.dailyRate * 2);
    }
  };

  const handleCreateHookah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createHookah({
        assetCode: assetCode || `NRG-${Date.now().toString().slice(-4)}`,
        model,
        color: color || 'Padrão Luxo',
        acquisitionCost: Number(acquisitionCost) || 0,
        dailyRate: Number(dailyRate) || 100,
        status: 'DISPONIVEL',
        notes,
      });
      setIsNewHookahOpen(false);
      setModel('');
      setAssetCode('');
      toast.success('Equipamento cadastrado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao cadastrar narguile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHookahId || !selectedClientId) {
      toast.warning('Selecione o narguile disponível e o cliente.');
      return;
    }

    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    setIsSubmitting(true);
    try {
      await api.createRental({
        equipmentId: selectedHookahId,
        clientId: client.id,
        clientName: client.name,
        clientDocument: client.document,
        clientPhone: client.phone,
        startDate: rentalStartDate,
        expectedEndDate: rentalEndDate,
        dailyRate: rentalDailyRate,
        totalRentalAmount: rentalTotalAmount,
        depositAmount: rentalDeposit,
        checklistDelivered: checklist,
      });
      setIsNewRentalOpen(false);
      toast.success('Locação registrada com sucesso!');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar locação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnRentalModal) return;

    const damages: HookahDamageOccurrence[] = [];
    if (damageFee > 0 && damagePart) {
      damages.push({
        id: `dmg_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        partDamaged: damagePart,
        description: damageNotes || 'Avaria detectada no checklist de devolução',
        feeCharged: damageFee,
        paid: true,
      });
    }

    setIsSubmitting(true);
    try {
      await api.returnRental(returnRentalModal.id, {
        checklistReturned: returnChecklist,
        damages,
        extraCharges: damageFee,
      });
      setReturnRentalModal(null);
      setDamageFee(0);
      setDamagePart('');
      toast.success('Devolução registrada com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao registrar devolução.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditHookah = (h: HookahEquipment) => {
    setEditingHookah(h);
    setEditHookahAssetCode(h.assetCode);
    setEditHookahModel(h.model);
    setEditHookahColor(h.color);
    setEditHookahAcquisitionCost(h.acquisitionCost);
    setEditHookahDailyRate(h.dailyRate);
    setEditHookahStatus(h.status);
    setEditHookahNotes(h.notes || '');
  };

  const handleSaveEditHookah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHookah || !editHookahModel.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateHookah(editingHookah.id, {
        assetCode: editHookahAssetCode,
        model: editHookahModel,
        color: editHookahColor,
        acquisitionCost: Number(editHookahAcquisitionCost) || 0,
        dailyRate: Number(editHookahDailyRate) || 0,
        status: editHookahStatus,
        notes: editHookahNotes,
      });
      setEditingHookah(null);
      toast.success('Narguile atualizado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao atualizar dados do narguile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditRental = (r: HookahRental) => {
    setEditingRental(r);
    setEditRentalClientPhone(r.clientPhone);
    setEditRentalStartDate(r.startDate.slice(0, 16));
    setEditRentalEndDate(r.expectedEndDate.slice(0, 16));
    setEditRentalDailyRate(r.dailyRate);
    setEditRentalTotalAmount(r.finalTotalAmount || r.totalRentalAmount);
    setEditRentalDepositAmount(r.depositAmount);
    setEditRentalStatus(r.status);
  };

  const handleSaveEditRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    setIsSubmitting(true);
    try {
      await api.updateRental(editingRental.id, {
        clientPhone: editRentalClientPhone,
        startDate: editRentalStartDate,
        expectedEndDate: editRentalEndDate,
        dailyRate: Number(editRentalDailyRate) || 0,
        totalRentalAmount: Number(editRentalTotalAmount) || 0,
        finalTotalAmount: Number(editRentalTotalAmount) || 0,
        depositAmount: Number(editRentalDepositAmount) || 0,
        status: editRentalStatus,
      });
      setEditingRental(null);
      toast.success('Locação atualizada com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao atualizar locação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Painel do Proprietário — Aluguel de Narguiles</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Disponibilidade da frota em tempo real, checklists de avarias e faturamento por setup
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewHookahOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Cadastrar Narguile</span>
          </button>
          <button
            onClick={() => setIsNewRentalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <Flame className="w-4 h-4" />
            <span>Nova Ficha de Locação</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs da Frota */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Frota Total Cadastrada</span>
          <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {totalFleetCount} Setups
          </p>
          <span className="text-[10px] text-slate-500">Patrimônio da operação</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Disponíveis p/ Retirada</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {availableCount} Setups
          </p>
          <span className="text-[10px] text-slate-500">Prontos e higienizados</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-cyan-300">
            <span>Atualmente Alugados</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-cyan-300 mt-1">
            {rentedCount} Setups
          </p>
          <span className="text-[10px] text-slate-500">Em eventos & clientes</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Em Manutenção</span>
            <Wrench className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-amber-300 mt-1">
            {maintenanceCount} Setups
          </p>
          <span className="text-[10px] text-slate-500">Troca de vedação/avaria</span>
        </div>

        <div className="bg-[#111827] border border-cyan-900/60 rounded-xl p-4 bg-gradient-to-br from-[#111827] to-cyan-950/20">
          <span className="text-xs font-semibold text-cyan-300">Faturamento da Frota</span>
          <p className="text-xl font-black font-mono tabular-nums text-emerald-300 mt-1">
            R$ {totalFleetRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-cyan-500/80">Receita total gerada</span>
        </div>
      </div>

      {/* 3. Seletor de Visão (Equipamentos vs Locações Ativas) */}
      <div className="flex items-center justify-between bg-[#111827] border border-slate-800 rounded-xl p-2.5">
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'fleet' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Frota de Equipamentos ({hookahs.length})
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'rentals' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fichas de Locação ({rentals.length})
          </button>
        </div>
      </div>

      {/* 4. VISÃO A: Equipamentos da Frota */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hookahs.map((hookah) => {
            const isAvail = hookah.status === 'DISPONIVEL';
            const isRented = hookah.status === 'ALUGADO';
            const isMaint = hookah.status === 'EM_MANUTENCAO';

            return (
              <div
                key={hookah.id}
                className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-cyan-400 text-xs">
                      {hookah.assetCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isAvail ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      isRented ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {hookah.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">{hookah.model}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{hookah.color}</p>

                  <div className="mt-3 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Diária Sugerida:</span>
                      <span className="text-emerald-400 font-bold">R$ {hookah.dailyRate.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Locações Realizadas:</span>
                      <span className="text-slate-300">{hookah.totalRentalsCount} vezes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Receita Gerada:</span>
                      <span className="text-cyan-300 font-bold">R$ {hookah.totalRevenueGenerated.toFixed(2)}</span>
                    </div>
                  </div>

                  {hookah.notes && (
                    <p className="mt-2 text-[11px] text-slate-500 italic border-t border-slate-800/60 pt-2">
                      {hookah.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleStartEditHookah(hookah)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Editar Setup"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Editar</span>
                  </button>
                  {isAvail ? (
                    <button
                      onClick={() => {
                        setSelectedHookahId(hookah.id);
                        setRentalDailyRate(hookah.dailyRate);
                        setRentalTotalAmount(hookah.dailyRate * 2);
                        setIsNewRentalOpen(true);
                      }}
                      className="flex-1 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors text-center shadow-xs"
                    >
                      Locar Setup
                    </button>
                  ) : isRented ? (
                    <span className="text-xs text-cyan-400 font-mono">Setup em locação</span>
                  ) : (
                    <span className="text-xs text-amber-400 font-mono">Em manutenção</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VISÃO B: Fichas de Locação */}
      {activeTab === 'rentals' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Contrato / Código</th>
                  <th className="py-3 px-4">Narguile & Modelo</th>
                  <th className="py-3 px-4">Cliente / Contato</th>
                  <th className="py-3 px-4 text-center">Período</th>
                  <th className="py-3 px-4 text-right">Diária / Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rentals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {r.code}
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Caução: R$ {r.depositAmount.toFixed(2)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{r.equipmentCode}</p>
                      <p className="text-[11px] text-slate-400">{r.equipmentModel}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-200">{r.clientName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{r.clientPhone}</p>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-300">
                      <div>{r.startDate.replace('T', ' ')}</div>
                      <div className="text-slate-500">até {r.expectedEndDate.replace('T', ' ')}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-400">
                      R$ {r.finalTotalAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                        r.status === 'ATIVA' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEditRental(r)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1"
                          title="Editar Ficha de Locação"
                        >
                          <Edit2 className="w-3 h-3 text-cyan-400" />
                          <span>Editar</span>
                        </button>
                        {r.status === 'ATIVA' ? (
                          <button
                            onClick={() => {
                              setReturnRentalModal(r);
                              setReturnChecklist({ ...r.checklistDelivered });
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow-xs"
                          >
                            Devolução
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">Finalizada</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Novo Narguile na Frota */}
      {isNewHookahOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-md w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-cyan-400" />
                <span>Cadastrar Setup na Frota</span>
              </h2>
              <button onClick={() => setIsNewHookahOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHookah} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Patrimônio (Asset Tag)
                </label>
                <input
                  type="text"
                  placeholder="Ex: NRG-VIP-05"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modelo do Setup <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sultan Mani Sultan, Amazon Lord"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cor / Acabamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fibra de Carbono Vermelha, Dourado 24k"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custo de Aquisição (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Diária Sugerida (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewHookahOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Salvando...' : 'Adicionar à Frota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Nova Locação com Checklist */}
      {isNewRentalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-cyan-400" />
                <span>Nova Ficha de Locação & Checklist</span>
              </h2>
              <button onClick={() => setIsNewRentalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRental} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Selecionar Narguile da Frota <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={selectedHookahId}
                  onChange={(e) => handleSelectHookahForRental(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Selecione um setup disponível...</option>
                  {hookahs
                    .filter((h) => h.status === 'DISPONIVEL' || h.id === selectedHookahId)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.assetCode} — {h.model} ({h.color}) — Diária R$ {h.dailyRate.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cliente Solicitante <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Selecione o cliente do CRM...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.document}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data/Hora de Retirada
                  </label>
                  <input
                    type="datetime-local"
                    value={rentalStartDate}
                    onChange={(e) => setRentalStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Previsão de Devolução
                  </label>
                  <input
                    type="datetime-local"
                    value={rentalEndDate}
                    onChange={(e) => setRentalEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Total da Locação (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rentalTotalAmount}
                    onChange={(e) => setRentalTotalAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Caução em Garantia (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rentalDeposit}
                    onChange={(e) => setRentalDeposit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-amber-300"
                  />
                </div>
              </div>

              {/* Checklist de Acessórios Inclusos */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Checklist de Acessórios Entregues
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  {Object.entries(checklist).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) =>
                          setChecklist({ ...checklist, [key]: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                      />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewRentalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Gerando...' : 'Confirmar Locação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Devolução, Inspeção e Cobrança de Avarias */}
      {returnRentalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-lg w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">Inspeção de Devolução</h2>
                <p className="text-xs text-cyan-400 font-mono">
                  {returnRentalModal.code} — {returnRentalModal.equipmentCode} ({returnRentalModal.clientName})
                </p>
              </div>
              <button onClick={() => setReturnRentalModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteReturn} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Conferir Peças Devolvidas Íntegras
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  {Object.entries(returnChecklist).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) =>
                          setReturnChecklist({ ...returnChecklist, [key]: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                      />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Registro de Avaria / Taxa Extra */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Cobrança de Avaria / Peça Danificada (Se houver)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Peça Avariada</label>
                    <input
                      type="text"
                      placeholder="Ex: Vaso trincado, piteira"
                      value={damagePart}
                      onChange={(e) => setDamagePart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Taxa de Reposição (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={damageFee}
                      onChange={(e) => setDamageFee(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-rose-300 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Descrição do Ocorrido</label>
                  <input
                    type="text"
                    placeholder="Detalhes da avaria ou estado do retorno..."
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReturnRentalModal(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Finalizando...' : 'Finalizar Devolução'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Editar Setup da Frota */}
      {editingHookah && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-md w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <span>Editar Setup da Frota</span>
              </h2>
              <button onClick={() => setEditingHookah(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHookah} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Patrimônio (Asset Tag)
                </label>
                <input
                  type="text"
                  required
                  value={editHookahAssetCode}
                  onChange={(e) => setEditHookahAssetCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modelo do Setup <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editHookahModel}
                  onChange={(e) => setEditHookahModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cor / Acabamento
                </label>
                <input
                  type="text"
                  value={editHookahColor}
                  onChange={(e) => setEditHookahColor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custo de Aquisição (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editHookahAcquisitionCost}
                    onChange={(e) => setEditHookahAcquisitionCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Diária Sugerida (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editHookahDailyRate}
                    onChange={(e) => setEditHookahDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Operacional
                </label>
                <select
                  value={editHookahStatus}
                  onChange={(e) => setEditHookahStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="DISPONIVEL">DISPONÍVEL</option>
                  <option value="ALUGADO">ALUGADO</option>
                  <option value="EM_MANUTENCAO">EM MANUTENÇÃO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Histórico de Manutenção
                </label>
                <textarea
                  rows={2}
                  value={editHookahNotes}
                  onChange={(e) => setEditHookahNotes(e.target.value)}
                  placeholder="Observações sobre vedação, vaso, etc."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingHookah(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Editar Ficha de Locação */}
      {editingRental && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-lg w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-cyan-400" />
                  <span>Editar Locação {editingRental.code}</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  {editingRental.equipmentCode} ({editingRental.equipmentModel}) — {editingRental.clientName}
                </p>
              </div>
              <button onClick={() => setEditingRental(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRental} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telefone / WhatsApp de Contato
                </label>
                <input
                  type="text"
                  value={editRentalClientPhone}
                  onChange={(e) => setEditRentalClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data/Hora de Retirada
                  </label>
                  <input
                    type="datetime-local"
                    value={editRentalStartDate}
                    onChange={(e) => setEditRentalStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Previsão de Devolução
                  </label>
                  <input
                    type="datetime-local"
                    value={editRentalEndDate}
                    onChange={(e) => setEditRentalEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Diária Cobrada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRentalDailyRate}
                    onChange={(e) => setEditRentalDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Total da Locação (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRentalTotalAmount}
                    onChange={(e) => setEditRentalTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Caução em Garantia (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRentalDepositAmount}
                    onChange={(e) => setEditRentalDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status da Locação
                  </label>
                  <select
                    value={editRentalStatus}
                    onChange={(e) => setEditRentalStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="ATIVA">ATIVA (Em andamento)</option>
                    <option value="FINALIZADA">FINALIZADA (Devolvida)</option>
                    <option value="CANCELADA">CANCELADA</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRental(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
