import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { TreasuryModule } from './components/treasury/TreasuryModule';
import { DREView } from './components/treasury/DREView';
import { StockModule } from './components/stock/StockModule';
import { CrmModule } from './components/crm/CrmModule';
import { LoansModule } from './components/loans/LoansModule';
import { HookahModule } from './components/hookah/HookahModule';
import { AuditModule } from './components/audit/AuditModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { TransactionModal } from './components/treasury/TransactionModal';
import { api } from './services/api';
import { 
  Product, 
  Client, 
  Supplier, 
  FinancialTransaction, 
  MoneyLoan, 
  HookahEquipment, 
  HookahRental, 
  DREPeriodData 
} from './types/erp';
import { RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Estados Globais de Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loans, setLoans] = useState<MoneyLoan[]>([]);
  const [hookahs, setHookahs] = useState<HookahEquipment[]>([]);
  const [rentals, setRentals] = useState<HookahRental[]>([]);
  const [dreData, setDreData] = useState<DREPeriodData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [
        prodsRes,
        cliRes,
        supRes,
        txRes,
        loanRes,
        hookahRes,
        rentalRes,
        dreRes,
      ] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getClients().catch(() => []),
        api.getSuppliers().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getLoans().catch(() => []),
        api.getHookahs().catch(() => []),
        api.getRentals().catch(() => []),
        api.getDRE(6.0).catch(() => null),
      ]);

      setProducts(prodsRes);
      setClients(cliRes);
      setSuppliers(supRes);
      setTransactions(txRes);
      setLoans(loanRes);
      setHookahs(hookahRes);
      setRentals(rentalRes);
      setDreData(dreRes);
    } catch (err) {
      console.error('Erro na sincronização de dados do ERP:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  if (authLoading || (isDataLoading && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-black text-xl mb-4 shadow-lg shadow-cyan-900/50">
          M
        </div>
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
        <p className="text-sm font-semibold text-white">Carregando Controle Murilo...</p>
        <p className="text-xs text-slate-500 font-mono mt-1">Validando hash de sessão e integridade RLS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col antialiased">
      {/* Alerta de status de rede offline / online */}
      <OfflineIndicator />

      {/* Top Bar Responsiva */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop e Drawer Mobile */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isOpenMobile={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        {/* Viewport Principal com Scroll Suave e Margem para Bottom Nav Mobile */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-[1600px] w-full mx-auto space-y-4">
          {/* Banner de Instalação PWA no Smartphone */}
          <div className="md:hidden">
            <PWAInstallButton variant="mobile-banner" />
          </div>

          {currentTab === 'dashboard' && (
            <ExecutiveDashboard
              transactions={transactions}
              products={products}
              hookahs={hookahs}
              loans={loans}
              dreData={dreData}
              onNavigate={setCurrentTab}
              onOpenNewTransaction={() => setIsQuickEntryOpen(true)}
            />
          )}

          {currentTab === 'treasury' && (
            <TreasuryModule
              transactions={transactions}
              clients={clients}
              suppliers={suppliers}
              onRefresh={fetchAllData}
              onOpenModal={() => setIsQuickEntryOpen(true)}
              isModalOpen={isQuickEntryOpen}
              onCloseModal={() => setIsQuickEntryOpen(false)}
            />
          )}

          {currentTab === 'dre' && (
            <DREView />
          )}

          {currentTab === 'stock' && (
            <StockModule
              products={products}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'clients' && (
            <CrmModule
              clients={clients}
              suppliers={suppliers}
              initialTab="clients"
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'suppliers' && (
            <CrmModule
              clients={clients}
              suppliers={suppliers}
              initialTab="suppliers"
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'loans' && (
            <LoansModule
              loans={loans}
              clients={clients}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'hookah' && (
            <HookahModule
              hookahs={hookahs}
              rentals={rentals}
              clients={clients}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsModule
              transactions={transactions}
              products={products}
              clients={clients}
              rentals={rentals}
              loans={loans}
              dreData={dreData}
            />
          )}

          {currentTab === 'audit' && (
            <AuditModule />
          )}
        </main>
      </div>

      {/* Barra de Navegação Inferior Nativa para Smartphones */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Modal Global de Novo Lançamento */}
      <TransactionModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        onSuccess={fetchAllData}
        clients={clients}
        suppliers={suppliers}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
