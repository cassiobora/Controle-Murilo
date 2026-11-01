import React, { useState } from 'react';
import { Client, Supplier, ClientType } from '../../types/erp';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Users, 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Clock, 
  X,
  Edit3,
  UserCheck
} from 'lucide-react';

interface CrmModuleProps {
  clients: Client[];
  suppliers: Supplier[];
  initialTab?: 'clients' | 'suppliers';
  onRefresh: () => void;
}

export const CrmModule: React.FC<CrmModuleProps> = ({
  clients,
  suppliers,
  initialTab = 'clients',
  onRefresh,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais de Criação
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);

  // Modais de Edição
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Cliente
  const [clientType, setClientType] = useState<ClientType>('PJ');
  const [clientName, setClientName] = useState('');
  const [clientTradeName, setClientTradeName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientStateReg, setClientStateReg] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientStreet, setClientStreet] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [clientNeighborhood, setClientNeighborhood] = useState('Centro');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('SP');
  const [clientZip, setClientZip] = useState('');
  const [clientCreditLimit, setClientCreditLimit] = useState<number | ''>('');
  const [clientStatus, setClientStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');

  // Form Fornecedor
  const [supplierCompanyName, setSupplierCompanyName] = useState('');
  const [supplierTradeName, setSupplierTradeName] = useState('');
  const [supplierCnpj, setSupplierCnpj] = useState('');
  const [supplierStateReg, setSupplierStateReg] = useState('');
  const [supplierCategory, setSupplierCategory] = useState('Narguiles & Hastes');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierBank, setSupplierBank] = useState('Banco Itaú');
  const [supplierPix, setSupplierPix] = useState('');
  const [supplierLeadTime, setSupplierLeadTime] = useState<number>(5);
  const [supplierShipping, setSupplierShipping] = useState<'FOB' | 'CIF'>('CIF');
  const [supplierTerms, setSupplierTerms] = useState('28 DDL no Boleto');

  // Handlers de Edição de Cliente
  const handleStartEditClient = (c: Client) => {
    setEditingClient(c);
    setClientType(c.type);
    setClientName(c.name);
    setClientTradeName(c.tradeName || '');
    setClientDoc(c.document);
    setClientStateReg(c.stateRegistration || '');
    setClientPhone(c.phone);
    setClientEmail(c.email);
    setClientStreet(c.address?.street || '');
    setClientNumber(c.address?.number || '');
    setClientNeighborhood(c.address?.neighborhood || 'Centro');
    setClientCity(c.address?.city || 'São Paulo');
    setClientState(c.address?.state || 'SP');
    setClientZip(c.address?.zipCode || '');
    setClientCreditLimit(c.creditLimit);
    setClientStatus(c.status);
  };

  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !clientName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateClient(editingClient.id, {
        type: clientType,
        name: clientName,
        tradeName: clientTradeName || clientName,
        document: clientDoc,
        stateRegistration: clientStateReg,
        phone: clientPhone,
        email: clientEmail,
        address: {
          street: clientStreet,
          number: clientNumber,
          neighborhood: clientNeighborhood,
          city: clientCity,
          state: clientState,
          zipCode: clientZip,
        },
        creditLimit: Number(clientCreditLimit) || 0,
        status: clientStatus,
      });
      setEditingClient(null);
      toast.success('Cliente atualizado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao atualizar dados do cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers de Edição de Fornecedor
  const handleStartEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierCompanyName(s.companyName);
    setSupplierTradeName(s.tradeName || '');
    setSupplierCnpj(s.cnpj);
    setSupplierStateReg(s.stateRegistration || '');
    setSupplierCategory(s.category);
    setSupplierContact(s.contactName);
    setSupplierPhone(s.phone);
    setSupplierEmail(s.email);
    setSupplierBank(s.bankDetails?.bank || 'Banco Itaú');
    setSupplierPix(s.bankDetails?.pixKey || '');
    setSupplierLeadTime(s.leadTimeDays || 5);
    setSupplierShipping(s.shippingType || 'CIF');
    setSupplierTerms(s.paymentTerms || 'À vista');
  };

  const handleSaveEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !supplierCompanyName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.updateSupplier(editingSupplier.id, {
        companyName: supplierCompanyName,
        tradeName: supplierTradeName || supplierCompanyName,
        cnpj: supplierCnpj,
        stateRegistration: supplierStateReg,
        category: supplierCategory,
        contactName: supplierContact,
        phone: supplierPhone,
        email: supplierEmail,
        bankDetails: {
          bank: supplierBank,
          agency: editingSupplier.bankDetails?.agency || '0001',
          account: editingSupplier.bankDetails?.account || '12345-6',
          pixKey: supplierPix || supplierCnpj,
          pixType: 'CNPJ',
        },
        leadTimeDays: Number(supplierLeadTime) || 5,
        shippingType: supplierShipping,
        paymentTerms: supplierTerms,
      });
      setEditingSupplier(null);
      toast.success('Fornecedor atualizado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao atualizar dados do fornecedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientDoc.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createClient({
        type: clientType,
        name: clientName,
        tradeName: clientTradeName || clientName,
        document: clientDoc,
        stateRegistration: clientStateReg,
        phone: clientPhone,
        email: clientEmail,
        address: {
          street: clientStreet,
          number: clientNumber,
          neighborhood: clientNeighborhood,
          city: clientCity || 'São Paulo',
          state: clientState,
          zipCode: clientZip || '01000-000',
        },
        creditLimit: Number(clientCreditLimit) || 0,
        status: 'ATIVO',
      });
      setIsNewClientOpen(false);
      setClientName('');
      setClientDoc('');
      setClientPhone('');
      setClientEmail('');
      toast.success('Cliente cadastrado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao cadastrar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierCompanyName.trim() || !supplierCnpj.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createSupplier({
        companyName: supplierCompanyName,
        tradeName: supplierTradeName || supplierCompanyName,
        cnpj: supplierCnpj,
        category: supplierCategory,
        contactName: supplierContact,
        phone: supplierPhone,
        email: supplierEmail,
        bankDetails: {
          bank: supplierBank,
          agency: '0001',
          account: '12345-6',
          pixKey: supplierPix || supplierCnpj,
          pixType: 'CNPJ',
        },
        leadTimeDays: Number(supplierLeadTime) || 5,
        shippingType: supplierShipping,
        paymentTerms: supplierTerms,
      });
      setIsNewSupplierOpen(false);
      setSupplierCompanyName('');
      setSupplierCnpj('');
      setSupplierContact('');
      toast.success('Fornecedor cadastrado com sucesso!');
      onRefresh();
    } catch (err) {
      toast.error('Falha ao cadastrar fornecedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.document.includes(term) || (c.tradeName && c.tradeName.toLowerCase().includes(term));
  });

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return s.companyName.toLowerCase().includes(term) || s.tradeName.toLowerCase().includes(term) || s.cnpj.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* 1. Header do CRM com Alternância de Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">CRM Fiscal (Clientes & Fornecedores)</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro fiscal PF/PJ completo, edição de registros, termos de frete CIF/FOB e conciliação
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'clients' ? (
            <button
              onClick={() => {
                setClientName('');
                setClientDoc('');
                setClientPhone('');
                setClientEmail('');
                setClientCreditLimit('');
                setIsNewClientOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Cliente</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSupplierCompanyName('');
                setSupplierCnpj('');
                setSupplierContact('');
                setSupplierPhone('');
                setIsNewSupplierOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Fornecedor</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Seletor de Módulo (Clientes vs Fornecedores) */}
      <div className="flex items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes ({clients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'suppliers'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Fornecedores ({suppliers.length})</span>
          </button>
        </div>

        {/* Busca */}
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder={activeTab === 'clients' ? 'Buscar cliente por nome ou CPF/CNPJ...' : 'Buscar fornecedor por razão social ou CNPJ...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 3. Renderização da Lista de Clientes */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    client.type === 'PJ' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-semibold ${client.status === 'ATIVO' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {client.status}
                    </span>
                    <button
                      onClick={() => handleStartEditClient(client)}
                      title="Editar informações do cliente"
                      className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white truncate">{client.name}</h3>
                {client.tradeName && client.tradeName !== client.name && (
                  <p className="text-xs text-cyan-400 font-medium truncate">{client.tradeName}</p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-500">{client.type === 'PJ' ? 'CNPJ:' : 'CPF:'}</span>
                    <span className="text-slate-200">{client.document}</span>
                  </div>
                  {client.stateRegistration && (
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-500">{client.type === 'PJ' ? 'Inscr. Estadual:' : 'RG:'}</span>
                      <span className="text-slate-300">{client.stateRegistration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.address?.street && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{client.address.street}, {client.address.number} - {client.address.city}/{client.address.state}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Limite Crédito:</span>
                  <span className="text-white font-bold">R$ {client.creditLimit.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Total Comprado:</span>
                  <span className="text-emerald-400 font-bold">R$ {client.totalSpent.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Renderização da Lista de Fornecedores */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {supplier.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      supplier.shippingType === 'CIF' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      Frete {supplier.shippingType}
                    </span>
                    <button
                      onClick={() => handleStartEditSupplier(supplier)}
                      title="Editar dados do fornecedor"
                      className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white truncate">{supplier.tradeName}</h3>
                <p className="text-xs text-slate-400 truncate">{supplier.companyName}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-500">CNPJ:</span>
                    <span className="text-slate-200">{supplier.cnpj}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Rep: {supplier.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> Lead Time Médio:
                  </span>
                  <span className="text-cyan-300 font-bold">{supplier.leadTimeDays} dias</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[11px]">Condições:</span>
                  <span className="text-slate-300">{supplier.paymentTerms}</span>
                </div>
                {supplier.bankDetails?.pixKey && (
                  <div className="text-[10px] text-slate-400 font-mono pt-1 truncate">
                    Chave PIX: <span className="text-slate-200">{supplier.bankDetails.pixKey}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: NOVO CLIENTE */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Cadastro de Cliente (Ficha Fiscal)</span>
              </h2>
              <button onClick={() => setIsNewClientOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setClientType('PJ')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    clientType === 'PJ' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Pessoa Jurídica (CNPJ)
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('PF')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    clientType === 'PF' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Pessoa Física (CPF)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'Razão Social' : 'Nome Completo'} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'Nome Fantasia' : 'Apelido / Como Chamar'}
                  </label>
                  <input
                    type="text"
                    value={clientTradeName}
                    onChange={(e) => setClientTradeName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'CNPJ' : 'CPF'} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={clientType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'Inscrição Estadual' : 'RG'}
                  </label>
                  <input
                    type="text"
                    value={clientStateReg}
                    onChange={(e) => setClientStateReg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp / Telefone <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 90000-0000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail Fiscal / Contato
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Logradouro / Rua</label>
                    <input
                      type="text"
                      placeholder="Av. Paulista"
                      value={clientStreet}
                      onChange={(e) => setClientStreet(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Número</label>
                    <input
                      type="text"
                      placeholder="1000"
                      value={clientNumber}
                      onChange={(e) => setClientNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Limite de Crédito Aprovado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5000.00"
                    value={clientCreditLimit}
                    onChange={(e) => setClientCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CLIENTE EXISTENTE */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Editar Informações do Cliente</span>
              </h2>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setClientType('PJ')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    clientType === 'PJ' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Pessoa Jurídica (CNPJ)
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('PF')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                    clientType === 'PF' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Pessoa Física (CPF)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'Razão Social' : 'Nome Completo'} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'Nome Fantasia' : 'Apelido / Como Chamar'}
                  </label>
                  <input
                    type="text"
                    value={clientTradeName}
                    onChange={(e) => setClientTradeName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'CNPJ' : 'CPF'} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {clientType === 'PJ' ? 'Inscrição Estadual' : 'RG'}
                  </label>
                  <input
                    type="text"
                    value={clientStateReg}
                    onChange={(e) => setClientStateReg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp / Telefone <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail Fiscal
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Logradouro / Rua</label>
                    <input
                      type="text"
                      value={clientStreet}
                      onChange={(e) => setClientStreet(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Número</label>
                    <input
                      type="text"
                      value={clientNumber}
                      onChange={(e) => setClientNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Limite de Crédito Aprovado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={clientCreditLimit}
                    onChange={(e) => setClientCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status do Cliente
                  </label>
                  <select
                    value={clientStatus}
                    onChange={(e) => setClientStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
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

      {/* MODAL 3: NOVO FORNECEDOR */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span>Cadastro de Fornecedor & Lead Time</span>
              </h2>
              <button onClick={() => setIsNewSupplierOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Razão Social <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierCompanyName}
                    onChange={(e) => setSupplierCompanyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={supplierTradeName}
                    onChange={(e) => setSupplierTradeName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={supplierCnpj}
                    onChange={(e) => setSupplierCnpj(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria de Insumo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carvão, Tabaco, Alumínio"
                    value={supplierCategory}
                    onChange={(e) => setSupplierCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome do Representante Comercial
                  </label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lead Time de Entrega (Dias Úteis)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={supplierLeadTime}
                    onChange={(e) => setSupplierLeadTime(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modalidade de Frete
                  </label>
                  <select
                    value={supplierShipping}
                    onChange={(e) => setSupplierShipping(e.target.value as 'FOB' | 'CIF')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="CIF">CIF (Frete por conta do Fornecedor)</option>
                    <option value="FOB">FOB (Frete por conta do Comprador)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chave PIX do Fornecedor
                  </label>
                  <input
                    type="text"
                    placeholder="Chave CNPJ ou e-mail"
                    value={supplierPix}
                    onChange={(e) => setSupplierPix(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Condições Habituais de Pagamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 30 DDL no Boleto"
                    value={supplierTerms}
                    onChange={(e) => setSupplierTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDITAR FORNECEDOR EXISTENTE */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[94vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Editar Informações do Fornecedor</span>
              </h2>
              <button onClick={() => setEditingSupplier(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSupplier} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Razão Social <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierCompanyName}
                    onChange={(e) => setSupplierCompanyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={supplierTradeName}
                    onChange={(e) => setSupplierTradeName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierCnpj}
                    onChange={(e) => setSupplierCnpj(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria de Insumo
                  </label>
                  <input
                    type="text"
                    value={supplierCategory}
                    onChange={(e) => setSupplierCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome do Representante
                  </label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lead Time de Entrega (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={supplierLeadTime}
                    onChange={(e) => setSupplierLeadTime(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modalidade de Frete
                  </label>
                  <select
                    value={supplierShipping}
                    onChange={(e) => setSupplierShipping(e.target.value as 'FOB' | 'CIF')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="CIF">CIF (Frete por conta do Fornecedor)</option>
                    <option value="FOB">FOB (Frete por conta do Comprador)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={supplierPix}
                    onChange={(e) => setSupplierPix(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Condições de Pagamento
                  </label>
                  <input
                    type="text"
                    value={supplierTerms}
                    onChange={(e) => setSupplierTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
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
    </div>
  );
};
