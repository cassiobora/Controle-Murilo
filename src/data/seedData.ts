import { 
  Product, 
  Client, 
  Supplier, 
  FinancialTransaction, 
  MoneyLoan, 
  HookahEquipment, 
  HookahRental, 
  AuditLog, 
  User 
} from '../types/erp';

// Apenas usuários reais do Controle Murilo
export const SEED_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Murilo',
    email: 'admin@controlemurilo.com.br',
    role: 'ADMIN_MASTER',
    tenantId: 'tenant_controle_murilo',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'usr_5',
    name: 'Murilo',
    email: 'murilo@controlemurilo.com.br',
    role: 'ADMIN_MASTER',
    tenantId: 'tenant_controle_murilo',
    createdAt: '2026-01-15T08:00:00Z',
  }
];

// Dados 100% sincronizados em tempo real com o banco de dados Supabase PostgreSQL
export const SEED_PRODUCTS: Product[] = [];
export const SEED_CLIENTS: Client[] = [];
export const SEED_SUPPLIERS: Supplier[] = [];
export const SEED_TRANSACTIONS: FinancialTransaction[] = [];
export const SEED_LOANS: MoneyLoan[] = [];
export const SEED_HOOKAHS: HookahEquipment[] = [];
export const SEED_RENTALS: HookahRental[] = [];
export const SEED_AUDIT_LOGS: AuditLog[] = [];
