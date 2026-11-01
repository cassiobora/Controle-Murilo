-- ==============================================================================
-- SISTEMA CONTROLE MURILO - ESQUEMA COMPLETO SUPABASE POSTGRESQL (100% OFICIAL)
-- Projeto: zlyibbmhqmxqtyrbcbrt (https://zlyibbmhqmxqtyrbcbrt.supabase.co)
-- Compatível com: PostgreSQL 15 / 16 / 17 (Supabase)
-- Instruções: Copie e cole este script no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zlyibbmhqmxqtyrbcbrt/sql
-- ==============================================================================

-- 1. HABILITAR EXTENSÕES ESSENCIAIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA DE USUÁRIOS DO SISTEMA (USERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordhash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'OPERADOR',
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Inserir / Garantir Usuário Administrador Master Murilo
INSERT INTO public.users (id, name, email, passwordhash, role, createdat)
VALUES 
    (1, 'Murilo', 'admin@controlemurilo.com.br', 'admin123', 'admin', NOW()),
    (5, 'Murilo', 'murilo@controlemurilo.com.br', 'admin123', 'admin', NOW())
ON CONFLICT (email) DO UPDATE 
SET name = 'Murilo', role = 'admin';

-- ==============================================================================
-- 3. CRM - CLIENTES (CUSTOMERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tradename TEXT,
    document TEXT,
    stateregistration TEXT,
    municipalregistration TEXT,
    isstatetaxpayer TEXT,
    rg TEXT,
    birthdate TEXT,
    email TEXT,
    secondaryemail TEXT,
    phone TEXT,
    cellphone TEXT,
    contactname TEXT,
    contactrole TEXT,
    address TEXT,
    type TEXT DEFAULT 'PF',
    status TEXT DEFAULT 'ACTIVE',
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT DEFAULT 'São Paulo',
    state TEXT DEFAULT 'SP',
    creditlimit REAL DEFAULT 0,
    paymentterm TEXT,
    preferredpaymentmethod TEXT,
    pixkeytype TEXT,
    pixkey TEXT,
    deliverynotes TEXT,
    notes TEXT,
    totalspent REAL DEFAULT 0,
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_document ON public.customers (document);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers (name);

-- ==============================================================================
-- 4. CRM - FORNECEDORES (SUPPLIERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tradename TEXT,
    document TEXT,
    stateregistration TEXT,
    municipalregistration TEXT,
    email TEXT,
    secondaryemail TEXT,
    phone TEXT,
    cellphone TEXT,
    contactname TEXT,
    contactrole TEXT,
    address TEXT,
    category TEXT DEFAULT 'Geral',
    status TEXT DEFAULT 'ACTIVE',
    website TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT DEFAULT 'São Paulo',
    state TEXT DEFAULT 'SP',
    leadtimedays INTEGER DEFAULT 5,
    shippingtype TEXT DEFAULT 'FOB',
    minordervalue REAL DEFAULT 0,
    paymentterm TEXT DEFAULT 'À vista',
    bankname TEXT,
    bankagency TEXT,
    bankaccount TEXT,
    pixkeytype TEXT,
    pixkey TEXT,
    notes TEXT,
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_document ON public.suppliers (document);

-- ==============================================================================
-- 5. CATEGORIAS & MARCAS (CATEGORIES & BRANDS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 6. ESTOQUE & CATÁLOGO DE PRODUTOS (PRODUCTS & PRODUCT_VARIANTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    brandid TEXT,
    categoryid TEXT,
    abcclass TEXT DEFAULT 'C',
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id TEXT PRIMARY KEY,
    productid TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    size TEXT,
    color TEXT,
    stockquantity INTEGER DEFAULT 0,
    costprice REAL DEFAULT 0,
    sellprice REAL DEFAULT 0,
    minstock INTEGER DEFAULT 10,
    reorderpoint INTEGER DEFAULT 15,
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_productid ON public.product_variants (productid);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants (sku);

-- ==============================================================================
-- 7. MOVIMENTAÇÕES DE ESTOQUE (STOCK_MOVEMENTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_name TEXT,
    sku TEXT,
    type TEXT NOT NULL, -- ENTRADA, SAIDA, AJUSTE
    quantity REAL NOT NULL,
    previous_stock REAL DEFAULT 0,
    new_stock REAL DEFAULT 0,
    unit_cost REAL DEFAULT 0,
    reason TEXT,
    user_id TEXT,
    user_name TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements (created_at DESC);

-- ==============================================================================
-- 8. TESOURARIA & LIVRO CAIXA (TRANSACTIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- IN (Receita) ou OUT (Despesa)
    amount REAL NOT NULL,
    category TEXT,
    description TEXT,
    date TEXT,
    duedate TEXT,
    referenceid TEXT,
    referencetype TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING ou COMPLETED (PAGO)
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    subcategory TEXT,
    flowtype TEXT, -- RECEITA / DESPESA / A RECEBER / A PAGAR
    originalamount REAL,
    finalamount REAL,
    beneficiaryname TEXT,
    customerid TEXT,
    supplierid TEXT,
    cashorigin TEXT DEFAULT 'Caixa Geral Principal',
    paymentmethod TEXT DEFAULT 'PIX',
    pixkey TEXT,
    exchangenotes TEXT,
    installmentscount INTEGER DEFAULT 1,
    installmentnumber INTEGER DEFAULT 1,
    hasinterest TEXT DEFAULT 'NAO',
    interestamount REAL DEFAULT 0,
    haspenalty TEXT DEFAULT 'NAO',
    penaltyamount REAL DEFAULT 0,
    paymentdate TEXT,
    documentnumber TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_duedate ON public.transactions (duedate);

-- ==============================================================================
-- 9. CENTRAL DE EMPRÉSTIMOS DE CAPITAL (LOANS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.loans (
    id TEXT PRIMARY KEY,
    contract_number TEXT,
    borrower_name TEXT NOT NULL,
    borrower_document TEXT,
    borrower_phone TEXT,
    borrower_client_id TEXT,
    principal_amount REAL NOT NULL,
    interest_rate_monthly REAL NOT NULL,
    interest_type TEXT DEFAULT 'SIMPLES', -- SIMPLES ou COMPOSTO
    issue_date TEXT,
    term_months INTEGER DEFAULT 1,
    total_projected_return REAL,
    projected_profit REAL,
    repayments JSONB DEFAULT '[]'::jsonb,
    total_collected REAL DEFAULT 0,
    remaining_balance REAL,
    status TEXT DEFAULT 'EM_ANDAMENTO', -- EM_ANDAMENTO, LIQUIDADO, ATRASADO
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_contract ON public.loans (contract_number);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans (status);

-- ==============================================================================
-- 10. FROTA DE EQUIPAMENTOS & NARGUILES (HOOKAHS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hookahs (
    id TEXT PRIMARY KEY,
    asset_code TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    acquisition_cost REAL DEFAULT 0,
    daily_rate REAL DEFAULT 80,
    status TEXT DEFAULT 'DISPONIVEL', -- DISPONIVEL, ALUGADO, EM_MANUTENCAO
    total_rentals_count INTEGER DEFAULT 0,
    total_revenue_generated REAL DEFAULT 0,
    current_rental_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hookahs_code ON public.hookahs (asset_code);
CREATE INDEX IF NOT EXISTS idx_hookahs_status ON public.hookahs (status);

-- ==============================================================================
-- 11. CONTRATOS DE LOCAÇÃO (RENTALS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rentals (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    equipment_id TEXT REFERENCES public.hookahs(id) ON DELETE SET NULL,
    equipment_code TEXT,
    equipment_model TEXT,
    client_id TEXT,
    client_name TEXT NOT NULL,
    client_document TEXT,
    client_phone TEXT,
    start_date TEXT,
    expected_end_date TEXT,
    actual_end_date TEXT,
    daily_rate REAL DEFAULT 0,
    total_rental_amount REAL DEFAULT 0,
    deposit_amount REAL DEFAULT 150,
    checklist_delivered JSONB DEFAULT '{}'::jsonb,
    checklist_returned JSONB DEFAULT '{}'::jsonb,
    damages JSONB DEFAULT '[]'::jsonb,
    extra_charges REAL DEFAULT 0,
    final_total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'ATIVA', -- ATIVA, FINALIZADA, CANCELADA
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rentals_code ON public.rentals (code);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON public.rentals (status);

-- ==============================================================================
-- 12. LOGS DE AUDITORIA INVIOLÁVEL (AUDIT_LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    userid INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ipaddress TEXT DEFAULT '127.0.0.1',
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_createdat ON public.audit_logs (createdat DESC);

-- ==============================================================================
-- 13. POLÍTICAS DE ACESSO (RLS - ROW LEVEL SECURITY)
-- ==============================================================================
-- Como o backend Node.js conecta com a role postgres com SSL, ele possui bypass nativo de RLS.
-- Para permitir acesso via SDK client anon (caso deseje consultas no frontend com a chave pública):
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hookahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura e escrita públicas / autenticadas
CREATE POLICY "Acesso Total Anon e Autenticado Clientes" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Produtos" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Variantes" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Fornecedores" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Transacoes" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Emprestimos" ON public.loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Narguiles" ON public.hookahs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Locacoes" ON public.rentals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Movimentacoes" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Anon e Autenticado Auditoria" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- FIM DO SCRIPT DDL SUPABASE - CONTROLE MURILO
-- ==============================================================================
