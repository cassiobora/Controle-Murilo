import pg from 'pg';
import crypto from 'node:crypto';
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
} from '../types/erp.ts';

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:comerciomurilo@db.zlyibbmhqmxqtyrbcbrt.supabase.co:5432/postgres';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[Supabase DB Pool Error]:', err.message);
});

// Inicialização e garantia das tabelas necessárias
export async function initDatabase(): Promise<boolean> {
  const client = await pool.connect();
  try {
    console.log('[Supabase] Verificando conexão e esquemas...');
    const ver = await client.query('SELECT version();');
    console.log('[Supabase] Conectado com sucesso:', ver.rows[0]?.version?.split(' on ')[0]);

    // Criação de tabelas complementares caso não existam no Supabase
    await client.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        contract_number TEXT,
        borrower_name TEXT,
        borrower_document TEXT,
        borrower_phone TEXT,
        borrower_client_id TEXT,
        principal_amount REAL,
        interest_rate_monthly REAL,
        interest_type TEXT,
        issue_date TEXT,
        term_months INTEGER,
        total_projected_return REAL,
        projected_profit REAL,
        repayments JSONB,
        total_collected REAL,
        remaining_balance REAL,
        status TEXT,
        notes TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hookahs (
        id TEXT PRIMARY KEY,
        asset_code TEXT,
        model TEXT,
        color TEXT,
        acquisition_cost REAL,
        daily_rate REAL,
        status TEXT,
        total_rentals_count INTEGER DEFAULT 0,
        total_revenue_generated REAL DEFAULT 0,
        current_rental_id TEXT,
        notes TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rentals (
        id TEXT PRIMARY KEY,
        code TEXT,
        equipment_id TEXT,
        equipment_code TEXT,
        equipment_model TEXT,
        client_id TEXT,
        client_name TEXT,
        client_document TEXT,
        client_phone TEXT,
        start_date TEXT,
        expected_end_date TEXT,
        actual_end_date TEXT,
        daily_rate REAL,
        total_rental_amount REAL,
        deposit_amount REAL,
        checklist_delivered JSONB,
        checklist_returned JSONB,
        damages JSONB,
        extra_charges REAL DEFAULT 0,
        final_total_amount REAL,
        status TEXT,
        notes TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );
    `);

    // Garante usuário Murilo na tabela users do Supabase
    const userCheck = await client.query(
      "SELECT id FROM users WHERE email = 'murilo@controlemurilo.com.br' OR name ILIKE '%murilo%' LIMIT 1;"
    );
    if (userCheck.rows.length === 0) {
      const nidRes = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as nid FROM users;');
      const nextId = nidRes.rows[0].nid;
      await client.query(
        'INSERT INTO users (id, name, email, passwordhash, role) VALUES ($1, $2, $3, $4, $5);',
        [nextId, 'Murilo', 'murilo@controlemurilo.com.br', 'admin123', 'admin']
      );
      console.log('[Supabase] Usuário Administrador Murilo sincronizado!');
    }

    return true;
  } catch (err: any) {
    console.error('[Supabase] Falha ao inicializar banco de dados:', err.message);
    return false;
  } finally {
    client.release();
  }
}

// ------------------- USUÁRIOS -------------------
export async function getSupabaseUsers(): Promise<User[]> {
  try {
    const res = await pool.query('SELECT id, name, email, role FROM users ORDER BY id ASC;');
    return res.rows.map((r) => {
      const isAdm = String(r.role).toLowerCase().includes('admin') || r.name.toLowerCase().includes('murilo');
      return {
        id: `usr_${r.id}`,
        name: r.name || 'Usuário',
        email: r.email,
        role: isAdm ? 'ADMIN_MASTER' : 'OPERADOR',
        tenantId: 'tenant_controle_murilo',
        createdAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('[DB] Erro ao buscar usuários:', err);
    return [];
  }
}

// ------------------- PRODUTOS & ESTOQUE -------------------
export async function getSupabaseProducts(): Promise<Product[]> {
  try {
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.description,
        COALESCE(c.name, 'Geral') as category,
        COALESCE(p.abcclass, 'C') as abc_class,
        COALESCE(v.sku, CONCAT('SKU-', SUBSTRING(p.id, 1, 8))) as sku,
        COALESCE(v.costprice, 0) as cost_price,
        COALESCE(v.sellprice, 0) as sell_price,
        COALESCE(v.stockquantity, 0) as current_stock,
        COALESCE(v.minstock, 10) as min_stock,
        COALESCE(v.reorderpoint, 15) as reorder_point,
        v.size,
        v.color,
        p.createdat
      FROM products p
      LEFT JOIN categories c ON p.categoryid = c.id
      LEFT JOIN LATERAL (
        SELECT * FROM product_variants WHERE productid = p.id ORDER BY createdat ASC LIMIT 1
      ) v ON true
      ORDER BY p.name ASC;
    `;
    const res = await pool.query(query);
    return res.rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      category: r.category,
      variations: r.color || r.size ? [{ id: `var_${r.id}`, name: `${r.color || ''} ${r.size || ''}`.trim(), skuSuffix: r.sku, stock: Number(r.current_stock) || 0 }] : [],
      costPrice: Number(r.cost_price) || 0,
      sellPrice: Number(r.sell_price) || 0,
      currentStock: Number(r.current_stock) || 0,
      minStock: Number(r.min_stock) || 10,
      reorderPoint: Number(r.reorder_point) || 15,
      unit: 'UN',
      salesVolumePeriod: 0,
      salesRevenuePeriod: 0,
      abcClass: (r.abc_class as 'A' | 'B' | 'C') || 'C',
      turnoverRatio: 1.0,
      coverageDays: 30,
      lastUpdated: r.createdat ? new Date(r.createdat).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar produtos:', err);
    return [];
  }
}

export async function createSupabaseProduct(p: Partial<Product>): Promise<Product> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prodId = p.id || crypto.randomUUID();
    const sku = p.sku || `SKU-${Date.now().toString().slice(-6)}`;
    const costPrice = Number(p.costPrice) || 0;
    const sellPrice = Number(p.sellPrice) || 0;
    const currentStock = Number(p.currentStock) || 0;
    const minStock = Number(p.minStock) || 10;
    const reorderPoint = Number(p.reorderPoint) || 15;

    await client.query(
      'INSERT INTO products (id, name, description, abcclass, createdat) VALUES ($1, $2, $3, $4, NOW());',
      [prodId, p.name, p.name, p.abcClass || 'C']
    );

    const variantId = crypto.randomUUID();
    await client.query(
      `INSERT INTO product_variants 
       (id, productid, sku, stockquantity, costprice, sellprice, minstock, reorderpoint, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());`,
      [variantId, prodId, sku, currentStock, costPrice, sellPrice, minStock, reorderPoint]
    );

    await client.query('COMMIT');

    return {
      id: prodId,
      sku,
      name: p.name || '',
      category: p.category || 'Geral',
      variations: p.variations || [],
      costPrice,
      sellPrice,
      currentStock,
      minStock,
      reorderPoint,
      unit: p.unit || 'UN',
      salesVolumePeriod: 0,
      salesRevenuePeriod: 0,
      abcClass: 'C',
      turnoverRatio: 1.0,
      coverageDays: 30,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Erro ao criar produto:', err);
    throw err;
  } finally {
    client.release();
  }
}

export async function updateSupabaseProduct(id: string, p: Partial<Product>): Promise<Product> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (p.name) {
      await client.query('UPDATE products SET name = $1 WHERE id = $2;', [p.name, id]);
    }
    await client.query(
      `UPDATE product_variants 
       SET costprice = COALESCE($1, costprice),
           sellprice = COALESCE($2, sellprice),
           stockquantity = COALESCE($3, stockquantity),
           minstock = COALESCE($4, minstock),
           reorderpoint = COALESCE($5, reorderpoint),
           sku = COALESCE($6, sku)
       WHERE productid = $7;`,
      [
        p.costPrice !== undefined ? Number(p.costPrice) : null,
        p.sellPrice !== undefined ? Number(p.sellPrice) : null,
        p.currentStock !== undefined ? Number(p.currentStock) : null,
        p.minStock !== undefined ? Number(p.minStock) : null,
        p.reorderPoint !== undefined ? Number(p.reorderPoint) : null,
        p.sku || null,
        id,
      ]
    );
    await client.query('COMMIT');
    const prods = await getSupabaseProducts();
    const updated = prods.find((x) => x.id === id);
    if (!updated) throw new Error('Produto não localizado');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Erro ao atualizar produto:', err);
    throw err;
  } finally {
    client.release();
  }
}

// ------------------- CLIENTES (CUSTOMERS) -------------------
export async function getSupabaseClients(): Promise<Client[]> {
  try {
    const res = await pool.query('SELECT * FROM customers ORDER BY createdat DESC;');
    return res.rows.map((r) => ({
      id: r.id,
      type: (r.type as 'PF' | 'PJ') || (r.document && r.document.length > 14 ? 'PJ' : 'PF'),
      name: r.name,
      tradeName: r.tradename || r.name,
      document: r.document || '',
      stateRegistration: r.stateregistration || '',
      phone: r.phone || r.cellphone || '',
      email: r.email || '',
      address: {
        street: r.street || '',
        number: r.number || '',
        neighborhood: r.neighborhood || '',
        city: r.city || 'São Paulo',
        state: r.state || 'SP',
        zipCode: r.cep || '',
      },
      creditLimit: Number(r.creditlimit) || 0,
      status: r.status === 'ACTIVE' || r.status === 'ATIVO' ? 'ATIVO' : 'INATIVO',
      notes: r.notes || r.deliverynotes || '',
      totalSpent: Number(r.totalspent) || 0,
      createdAt: r.createdat ? new Date(r.createdat).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar clientes:', err);
    return [];
  }
}

export async function createSupabaseClient(c: Partial<Client>): Promise<Client> {
  const id = c.id || crypto.randomUUID();
  const addr = c.address || { street: '', number: '', neighborhood: '', city: 'São Paulo', state: 'SP', zipCode: '' };
  await pool.query(
    `INSERT INTO customers 
     (id, name, tradename, document, stateregistration, phone, email, street, number, neighborhood, city, state, cep, creditlimit, status, notes, totalspent, createdat)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 0, NOW());`,
    [
      id,
      c.name,
      c.tradeName || c.name,
      c.document || '',
      c.stateRegistration || '',
      c.phone || '',
      c.email || '',
      addr.street,
      addr.number,
      addr.neighborhood,
      addr.city,
      addr.state,
      addr.zipCode,
      Number(c.creditLimit) || 0,
      c.status || 'ACTIVE',
      c.notes || '',
    ]
  );
  return {
    id,
    type: c.type || 'PF',
    name: c.name || '',
    tradeName: c.tradeName || c.name || '',
    document: c.document || '',
    stateRegistration: c.stateRegistration || '',
    phone: c.phone || '',
    email: c.email || '',
    address: addr,
    creditLimit: Number(c.creditLimit) || 0,
    status: (c.status as any) || 'ATIVO',
    notes: c.notes,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function updateSupabaseClient(id: string, c: Partial<Client>): Promise<Client> {
  const addr = c.address;
  await pool.query(
    `UPDATE customers 
     SET name = COALESCE($1, name),
         tradename = COALESCE($2, tradename),
         document = COALESCE($3, document),
         phone = COALESCE($4, phone),
         email = COALESCE($5, email),
         creditlimit = COALESCE($6, creditlimit),
         status = COALESCE($7, status),
         notes = COALESCE($8, notes),
         street = COALESCE($9, street),
         number = COALESCE($10, number),
         neighborhood = COALESCE($11, neighborhood),
         city = COALESCE($12, city),
         state = COALESCE($13, state),
         cep = COALESCE($14, cep)
     WHERE id = $15;`,
    [
      c.name || null,
      c.tradeName || null,
      c.document || null,
      c.phone || null,
      c.email || null,
      c.creditLimit !== undefined ? Number(c.creditLimit) : null,
      c.status || null,
      c.notes || null,
      addr?.street || null,
      addr?.number || null,
      addr?.neighborhood || null,
      addr?.city || null,
      addr?.state || null,
      addr?.zipCode || null,
      id,
    ]
  );
  const clients = await getSupabaseClients();
  const updated = clients.find((x) => x.id === id);
  if (!updated) throw new Error('Cliente não encontrado');
  return updated;
}

// ------------------- FORNECEDORES (SUPPLIERS) -------------------
export async function getSupabaseSuppliers(): Promise<Supplier[]> {
  try {
    const res = await pool.query('SELECT * FROM suppliers ORDER BY createdat DESC;');
    return res.rows.map((r) => ({
      id: r.id,
      companyName: r.name,
      tradeName: r.tradename || r.name,
      cnpj: r.document || '',
      stateRegistration: r.stateregistration || '',
      category: r.category || 'Insumos Gerais',
      contactName: r.contactname || '',
      phone: r.phone || '',
      email: r.email || '',
      bankDetails: {
        bank: r.bankname || 'Banco Itaú',
        agency: r.bankagency || '0001',
        account: r.bankaccount || '12345-6',
        pixKey: r.pixkey || r.document || '',
        pixType: (r.pixkeytype as any) || 'CNPJ',
      },
      leadTimeDays: Number(r.leadtimedays) || 5,
      shippingType: (r.shippingtype as any) || 'FOB',
      paymentTerms: r.paymentterm || 'À vista',
      createdAt: r.createdat ? new Date(r.createdat).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar fornecedores:', err);
    return [];
  }
}

export async function createSupabaseSupplier(s: Partial<Supplier>): Promise<Supplier> {
  const id = s.id || crypto.randomUUID();
  const bank = s.bankDetails || { bank: 'Banco Itaú', agency: '0001', account: '12345-6', pixKey: '', pixType: 'CNPJ' };
  await pool.query(
    `INSERT INTO suppliers 
     (id, name, tradename, document, stateregistration, email, phone, contactname, category, leadtimedays, shippingtype, paymentterm, bankname, bankagency, bankaccount, pixkey, pixkeytype, status, createdat)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'ACTIVE', NOW());`,
    [
      id,
      s.companyName,
      s.tradeName || s.companyName,
      s.cnpj || '',
      s.stateRegistration || '',
      s.email || '',
      s.phone || '',
      s.contactName || '',
      s.category || 'Geral',
      Number(s.leadTimeDays) || 5,
      s.shippingType || 'FOB',
      s.paymentTerms || 'À vista',
      bank.bank,
      bank.agency,
      bank.account,
      bank.pixKey,
      bank.pixType,
    ]
  );
  return {
    id,
    companyName: s.companyName || '',
    tradeName: s.tradeName || s.companyName || '',
    cnpj: s.cnpj || '',
    stateRegistration: s.stateRegistration || '',
    category: s.category || 'Geral',
    contactName: s.contactName || '',
    phone: s.phone || '',
    email: s.email || '',
    bankDetails: bank,
    leadTimeDays: Number(s.leadTimeDays) || 5,
    shippingType: s.shippingType || 'FOB',
    paymentTerms: s.paymentTerms || 'À vista',
    createdAt: new Date().toISOString(),
  };
}

export async function updateSupabaseSupplier(id: string, s: Partial<Supplier>): Promise<Supplier> {
  const bank = s.bankDetails;
  await pool.query(
    `UPDATE suppliers 
     SET name = COALESCE($1, name),
         tradename = COALESCE($2, tradename),
         document = COALESCE($3, document),
         email = COALESCE($4, email),
         phone = COALESCE($5, phone),
         contactname = COALESCE($6, contactname),
         category = COALESCE($7, category),
         leadtimedays = COALESCE($8, leadtimedays),
         shippingtype = COALESCE($9, shippingtype),
         paymentterm = COALESCE($10, paymentterm),
         bankname = COALESCE($11, bankname),
         pixkey = COALESCE($12, pixkey)
     WHERE id = $13;`,
    [
      s.companyName || null,
      s.tradeName || null,
      s.cnpj || null,
      s.email || null,
      s.phone || null,
      s.contactName || null,
      s.category || null,
      s.leadTimeDays !== undefined ? Number(s.leadTimeDays) : null,
      s.shippingType || null,
      s.paymentTerms || null,
      bank?.bank || null,
      bank?.pixKey || null,
      id,
    ]
  );
  const suppliers = await getSupabaseSuppliers();
  const updated = suppliers.find((x) => x.id === id);
  if (!updated) throw new Error('Fornecedor não encontrado');
  return updated;
}

// ------------------- TESOURARIA & TRANSAÇÕES -------------------
export async function getSupabaseTransactions(): Promise<FinancialTransaction[]> {
  try {
    const res = await pool.query('SELECT * FROM transactions ORDER BY createdat DESC, date DESC;');
    return res.rows.map((r) => {
      const isReceita =
        r.type === 'IN' ||
        r.flowtype === 'A RECEBER' ||
        r.flowtype === 'RECEITA' ||
        String(r.category || '').toLowerCase().includes('receita');

      const isCompleted =
        r.status === 'COMPLETED' ||
        r.status === 'PAGO' ||
        r.status === 'LIQUIDADO';

      const original = Number(r.originalamount || r.amount) || 0;
      const finalAmt = Number(r.finalamount || r.amount) || original;

      return {
        id: r.id,
        code: r.documentnumber || `LAN-${r.id.slice(0, 8)}`,
        flowType: isReceita ? 'RECEITA' : 'DESPESA',
        description: r.description || 'Lançamento financeiro',
        movementDate: r.date ? String(r.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
        dueDate: r.duedate ? String(r.duedate).slice(0, 10) : new Date().toISOString().slice(0, 10),
        originalAmount: original,
        macroCategory: r.category || 'Operacional Geral',
        subCategory: r.subcategory || 'Geral',
        beneficiaryId: r.customerid || r.supplierid || undefined,
        beneficiaryName: r.beneficiaryname || 'Diversos',
        beneficiaryType: r.customerid ? 'CLIENTE' : r.supplierid ? 'FORNECEDOR' : 'TERCEIRO',
        accountOrigin: r.cashorigin || 'Caixa Geral Principal',
        paymentMethod: (r.paymentmethod as any) || 'PIX',
        isInstallment: Number(r.installmentscount) > 1,
        totalInstallments: Number(r.installmentscount) || 1,
        installments: [],
        monthlyInterestRate: 0,
        latePenaltyRate: 0,
        calculatedInterestAmount: Number(r.interestamount) || 0,
        calculatedPenaltyAmount: Number(r.penaltyamount) || 0,
        totalFinalAmount: finalAmt,
        status: isCompleted ? 'PAGO' : 'PENDENTE',
        settledDate: isCompleted ? (r.paymentdate ? String(r.paymentdate).slice(0, 10) : undefined) : undefined,
        beneficiaryPixKey: r.pixkey || undefined,
        documentNumber: r.documentnumber || undefined,
        notes: r.exchangenotes || undefined,
        createdAt: r.createdat ? new Date(r.createdat).toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('[DB] Erro ao buscar transações:', err);
    return [];
  }
}

export async function createSupabaseTransaction(tx: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
  const id = tx.id || `tx-${Date.now()}`;
  const isReceita = tx.flowType === 'RECEITA';
  const amount = Number(tx.totalFinalAmount || tx.originalAmount) || 0;

  await pool.query(
    `INSERT INTO transactions 
     (id, type, amount, category, description, date, duedate, status, subcategory, flowtype, originalamount, finalamount, beneficiaryname, cashorigin, paymentmethod, pixkey, exchangenotes, installmentscount, installmentnumber, hasinterest, interestamount, haspenalty, penaltyamount, paymentdate, documentnumber, createdat)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 1, $19, $20, $21, $22, $23, $24, NOW());`,
    [
      id,
      isReceita ? 'IN' : 'OUT',
      amount,
      tx.macroCategory || 'Geral',
      tx.description || '',
      tx.movementDate || new Date().toISOString().slice(0, 10),
      tx.dueDate || new Date().toISOString().slice(0, 10),
      tx.status === 'PAGO' ? 'COMPLETED' : 'PENDING',
      tx.subCategory || 'Geral',
      isReceita ? 'A RECEBER' : 'A PAGAR',
      Number(tx.originalAmount) || amount,
      amount,
      tx.beneficiaryName || 'Diversos',
      tx.accountOrigin || 'Caixa Geral Principal',
      tx.paymentMethod || 'PIX',
      tx.beneficiaryPixKey || null,
      tx.notes || null,
      Number(tx.totalInstallments) || 1,
      (tx.monthlyInterestRate || 0) > 0 ? 'SIM' : 'NAO',
      Number(tx.calculatedInterestAmount) || 0,
      (tx.latePenaltyRate || 0) > 0 ? 'SIM' : 'NAO',
      Number(tx.calculatedPenaltyAmount) || 0,
      tx.status === 'PAGO' ? (tx.settledDate || new Date().toISOString().slice(0, 10)) : null,
      tx.code || tx.documentNumber || id,
    ]
  );

  return {
    id,
    code: tx.code || tx.documentNumber || id,
    flowType: tx.flowType || 'RECEITA',
    description: tx.description || '',
    movementDate: tx.movementDate || new Date().toISOString().slice(0, 10),
    dueDate: tx.dueDate || new Date().toISOString().slice(0, 10),
    originalAmount: Number(tx.originalAmount) || amount,
    macroCategory: tx.macroCategory || 'Geral',
    subCategory: tx.subCategory || 'Geral',
    beneficiaryName: tx.beneficiaryName || 'Diversos',
    beneficiaryType: tx.beneficiaryType || 'TERCEIRO',
    accountOrigin: tx.accountOrigin || 'Caixa Geral Principal',
    paymentMethod: tx.paymentMethod || 'PIX',
    isInstallment: Boolean(tx.isInstallment),
    totalInstallments: Number(tx.totalInstallments) || 1,
    installments: tx.installments || [],
    monthlyInterestRate: Number(tx.monthlyInterestRate) || 0,
    latePenaltyRate: Number(tx.latePenaltyRate) || 0,
    calculatedInterestAmount: Number(tx.calculatedInterestAmount) || 0,
    calculatedPenaltyAmount: Number(tx.calculatedPenaltyAmount) || 0,
    totalFinalAmount: amount,
    status: tx.status || 'PENDENTE',
    settledDate: tx.status === 'PAGO' ? (tx.settledDate || new Date().toISOString().slice(0, 10)) : undefined,
    beneficiaryPixKey: tx.beneficiaryPixKey,
    documentNumber: tx.documentNumber,
    notes: tx.notes,
    createdAt: new Date().toISOString(),
  };
}

export async function settleSupabaseTransaction(id: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await pool.query(
    "UPDATE transactions SET status = 'COMPLETED', paymentdate = $1 WHERE id = $2;",
    [today, id]
  );
}

export async function updateSupabaseTransaction(id: string, tx: Partial<FinancialTransaction>): Promise<void> {
  const isReceita = tx.flowType === 'RECEITA';
  const amount = Number(tx.totalFinalAmount || tx.originalAmount);
  await pool.query(
    `UPDATE transactions 
     SET description = COALESCE($1, description),
         category = COALESCE($2, category),
         subcategory = COALESCE($3, subcategory),
         beneficiaryname = COALESCE($4, beneficiaryname),
         originalamount = COALESCE($5, originalamount),
         finalamount = COALESCE($6, finalamount),
         amount = COALESCE($6, amount),
         flowtype = COALESCE($7, flowtype),
         status = CASE WHEN $8 = 'PAGO' THEN 'COMPLETED' WHEN $8 = 'PENDENTE' THEN 'PENDING' ELSE status END,
         notes = COALESCE($9, exchangenotes),
         paymentdate = CASE WHEN $8 = 'PAGO' THEN COALESCE($10, paymentdate) ELSE paymentdate END
     WHERE id = $11;`,
    [
      tx.description || null,
      tx.macroCategory || null,
      tx.subCategory || null,
      tx.beneficiaryName || null,
      tx.originalAmount !== undefined ? Number(tx.originalAmount) : null,
      amount !== undefined && !isNaN(amount) ? amount : null,
      tx.flowType ? (isReceita ? 'A RECEBER' : 'A PAGAR') : null,
      tx.status || null,
      tx.notes || null,
      tx.settledDate || null,
      id,
    ]
  );
}

// ------------------- EMPRÉSTIMOS DE CAPITAL -------------------
export async function getSupabaseLoans(): Promise<MoneyLoan[]> {
  try {
    const res = await pool.query('SELECT * FROM loans ORDER BY created_at DESC;');
    return res.rows.map((r) => ({
      id: r.id,
      contractNumber: r.contract_number,
      borrowerName: r.borrower_name,
      borrowerDocument: r.borrower_document,
      borrowerPhone: r.borrower_phone,
      borrowerClientId: r.borrower_client_id,
      principalAmount: Number(r.principal_amount) || 0,
      interestRateMonthly: Number(r.interest_rate_monthly) || 0,
      interestType: (r.interest_type as any) || 'SIMPLES',
      issueDate: r.issue_date,
      termMonths: Number(r.term_months) || 1,
      totalProjectedReturn: Number(r.total_projected_return) || 0,
      projectedProfit: Number(r.projected_profit) || 0,
      repayments: r.repayments || [],
      totalCollected: Number(r.total_collected) || 0,
      remainingBalance: Number(r.remaining_balance) || 0,
      status: (r.status as any) || 'EM_ANDAMENTO',
      notes: r.notes,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar empréstimos:', err);
    return [];
  }
}

export async function createSupabaseLoan(loan: MoneyLoan): Promise<MoneyLoan> {
  await pool.query(
    `INSERT INTO loans 
     (id, contract_number, borrower_name, borrower_document, borrower_phone, borrower_client_id, principal_amount, interest_rate_monthly, interest_type, issue_date, term_months, total_projected_return, projected_profit, repayments, total_collected, remaining_balance, status, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW());`,
    [
      loan.id,
      loan.contractNumber,
      loan.borrowerName,
      loan.borrowerDocument,
      loan.borrowerPhone,
      loan.borrowerClientId,
      loan.principalAmount,
      loan.interestRateMonthly,
      loan.interestType,
      loan.issueDate,
      loan.termMonths,
      loan.totalProjectedReturn,
      loan.projectedProfit,
      JSON.stringify(loan.repayments || []),
      loan.totalCollected,
      loan.remainingBalance,
      loan.status,
      loan.notes,
    ]
  );
  return loan;
}

export async function updateSupabaseLoan(id: string, updates: Partial<MoneyLoan>): Promise<MoneyLoan> {
  await pool.query(
    `UPDATE loans 
     SET borrower_name = COALESCE($1, borrower_name),
         borrower_document = COALESCE($2, borrower_document),
         borrower_phone = COALESCE($3, borrower_phone),
         interest_rate_monthly = COALESCE($4, interest_rate_monthly),
         status = COALESCE($5, status),
         total_collected = COALESCE($6, total_collected),
         remaining_balance = COALESCE($7, remaining_balance),
         repayments = COALESCE($8, repayments),
         notes = COALESCE($9, notes)
     WHERE id = $10;`,
    [
      updates.borrowerName || null,
      updates.borrowerDocument || null,
      updates.borrowerPhone || null,
      updates.interestRateMonthly !== undefined ? Number(updates.interestRateMonthly) : null,
      updates.status || null,
      updates.totalCollected !== undefined ? Number(updates.totalCollected) : null,
      updates.remainingBalance !== undefined ? Number(updates.remainingBalance) : null,
      updates.repayments ? JSON.stringify(updates.repayments) : null,
      updates.notes || null,
      id,
    ]
  );
  const loans = await getSupabaseLoans();
  const updated = loans.find((x) => x.id === id);
  if (!updated) throw new Error('Empréstimo não encontrado');
  return updated;
}

// ------------------- NARGUILES (FROTA & LOCAÇÕES) -------------------
export async function getSupabaseHookahs(): Promise<HookahEquipment[]> {
  try {
    const res = await pool.query('SELECT * FROM hookahs ORDER BY created_at DESC;');
    return res.rows.map((r) => ({
      id: r.id,
      assetCode: r.asset_code,
      model: r.model,
      color: r.color,
      acquisitionCost: Number(r.acquisition_cost) || 0,
      dailyRate: Number(r.daily_rate) || 80,
      status: (r.status as any) || 'DISPONIVEL',
      totalRentalsCount: Number(r.total_rentals_count) || 0,
      totalRevenueGenerated: Number(r.total_revenue_generated) || 0,
      currentRentalId: r.current_rental_id,
      notes: r.notes,
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar narguiles:', err);
    return [];
  }
}

export async function createSupabaseHookah(h: HookahEquipment): Promise<HookahEquipment> {
  await pool.query(
    `INSERT INTO hookahs 
     (id, asset_code, model, color, acquisition_cost, daily_rate, status, total_rentals_count, total_revenue_generated, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, NOW());`,
    [h.id, h.assetCode, h.model, h.color, h.acquisitionCost, h.dailyRate, h.status, h.notes]
  );
  return h;
}

export async function updateSupabaseHookah(id: string, updates: Partial<HookahEquipment>): Promise<HookahEquipment> {
  await pool.query(
    `UPDATE hookahs 
     SET asset_code = COALESCE($1, asset_code),
         model = COALESCE($2, model),
         color = COALESCE($3, color),
         acquisition_cost = COALESCE($4, acquisition_cost),
         daily_rate = COALESCE($5, daily_rate),
         status = COALESCE($6, status),
         current_rental_id = $7,
         notes = COALESCE($8, notes)
     WHERE id = $9;`,
    [
      updates.assetCode || null,
      updates.model || null,
      updates.color || null,
      updates.acquisitionCost !== undefined ? Number(updates.acquisitionCost) : null,
      updates.dailyRate !== undefined ? Number(updates.dailyRate) : null,
      updates.status || null,
      updates.currentRentalId || null,
      updates.notes || null,
      id,
    ]
  );
  const hookahs = await getSupabaseHookahs();
  const updated = hookahs.find((x) => x.id === id);
  if (!updated) throw new Error('Narguile não encontrado');
  return updated;
}

export async function getSupabaseRentals(): Promise<HookahRental[]> {
  try {
    const res = await pool.query('SELECT * FROM rentals ORDER BY created_at DESC;');
    return res.rows.map((r) => ({
      id: r.id,
      code: r.code,
      equipmentId: r.equipment_id,
      equipmentCode: r.equipment_code,
      equipmentModel: r.equipment_model,
      clientId: r.client_id,
      clientName: r.client_name,
      clientDocument: r.client_document,
      clientPhone: r.client_phone,
      startDate: r.start_date,
      expectedEndDate: r.expected_end_date,
      actualEndDate: r.actual_end_date,
      dailyRate: Number(r.daily_rate) || 0,
      totalRentalAmount: Number(r.total_rental_amount) || 0,
      depositAmount: Number(r.deposit_amount) || 0,
      checklistDelivered: r.checklist_delivered || {},
      checklistReturned: r.checklist_returned || undefined,
      damages: r.damages || [],
      extraCharges: Number(r.extra_charges) || 0,
      finalTotalAmount: Number(r.final_total_amount) || Number(r.total_rental_amount) || 0,
      status: (r.status as any) || 'ATIVA',
      notes: r.notes,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar locações:', err);
    return [];
  }
}

export async function createSupabaseRental(r: HookahRental): Promise<HookahRental> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO rentals 
       (id, code, equipment_id, equipment_code, equipment_model, client_id, client_name, client_document, client_phone, start_date, expected_end_date, daily_rate, total_rental_amount, deposit_amount, checklist_delivered, extra_charges, final_total_amount, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW());`,
      [
        r.id,
        r.code,
        r.equipmentId,
        r.equipmentCode,
        r.equipmentModel,
        r.clientId,
        r.clientName,
        r.clientDocument,
        r.clientPhone,
        r.startDate,
        r.expectedEndDate,
        r.dailyRate,
        r.totalRentalAmount,
        r.depositAmount,
        JSON.stringify(r.checklistDelivered || {}),
        r.extraCharges || 0,
        r.finalTotalAmount,
        r.status,
        r.notes,
      ]
    );

    await client.query(
      `UPDATE hookahs 
       SET status = 'ALUGADO',
           current_rental_id = $1,
           total_rentals_count = total_rentals_count + 1,
           total_revenue_generated = total_revenue_generated + $2
       WHERE id = $3;`,
      [r.id, r.finalTotalAmount, r.equipmentId]
    );

    await client.query('COMMIT');
    return r;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateSupabaseRental(id: string, updates: Partial<HookahRental>): Promise<HookahRental> {
  await pool.query(
    `UPDATE rentals 
     SET client_phone = COALESCE($1, client_phone),
         start_date = COALESCE($2, start_date),
         expected_end_date = COALESCE($3, expected_end_date),
         actual_end_date = COALESCE($4, actual_end_date),
         daily_rate = COALESCE($5, daily_rate),
         total_rental_amount = COALESCE($6, total_rental_amount),
         final_total_amount = COALESCE($7, final_total_amount),
         deposit_amount = COALESCE($8, deposit_amount),
         status = COALESCE($9, status),
         extra_charges = COALESCE($10, extra_charges),
         checklist_returned = COALESCE($11, checklist_returned),
         damages = COALESCE($12, damages),
         notes = COALESCE($13, notes)
     WHERE id = $14;`,
    [
      updates.clientPhone || null,
      updates.startDate || null,
      updates.expectedEndDate || null,
      updates.actualEndDate || null,
      updates.dailyRate !== undefined ? Number(updates.dailyRate) : null,
      updates.totalRentalAmount !== undefined ? Number(updates.totalRentalAmount) : null,
      updates.finalTotalAmount !== undefined ? Number(updates.finalTotalAmount) : null,
      updates.depositAmount !== undefined ? Number(updates.depositAmount) : null,
      updates.status || null,
      updates.extraCharges !== undefined ? Number(updates.extraCharges) : null,
      updates.checklistReturned ? JSON.stringify(updates.checklistReturned) : null,
      updates.damages ? JSON.stringify(updates.damages) : null,
      updates.notes || null,
      id,
    ]
  );
  const rentals = await getSupabaseRentals();
  const updated = rentals.find((x) => x.id === id);
  if (!updated) throw new Error('Locação não encontrada');
  return updated;
}

// ------------------- AUDITORIA INVIOLÁVEL -------------------
export async function getSupabaseAuditLogs(): Promise<AuditLog[]> {
  try {
    const res = await pool.query('SELECT * FROM audit_logs ORDER BY createdat DESC LIMIT 200;');
    return res.rows.map((r) => ({
      id: `aud_${r.id}`,
      timestamp: r.createdat ? new Date(r.createdat).toISOString() : new Date().toISOString(),
      userId: `usr_${r.userid}`,
      userName: r.userid === 5 || r.userid === 1 ? 'Murilo' : 'Operador',
      userRole: r.userid === 5 || r.userid === 1 ? 'ADMIN_MASTER' : 'OPERADOR',
      ip: r.ipaddress || '127.0.0.1',
      action: r.action || 'OPERACAO',
      entity: 'Sistema',
      entityId: String(r.id),
      details: r.details || '',
      integrityHash: crypto.createHash('sha256').update(`${r.id}|${r.createdat}|${r.action}|${r.details}`).digest('hex'),
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar logs de auditoria:', err);
    return [];
  }
}

export async function createSupabaseAuditLog(
  userId: number,
  action: string,
  details: string,
  ip: string
): Promise<void> {
  try {
    const nidRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as nid FROM audit_logs;');
    const nextId = nidRes.rows[0].nid;
    await pool.query(
      `INSERT INTO audit_logs (id, userid, action, details, ipaddress, createdat)
       VALUES ($1, $2, $3, $4, $5, NOW());`,
      [nextId, userId, action, details, ip]
    );
  } catch (err) {
    console.error('[DB] Erro ao registrar log de auditoria no Supabase:', err);
  }
}

// ------------------- OPERAÇÕES REAIS DE EXCLUSÃO (DELETE NO SUPABASE) -------------------
export async function deleteSupabaseProduct(id: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM product_variants WHERE productid = $1;', [id]);
    await client.query('DELETE FROM products WHERE id = $1;', [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteSupabaseClient(id: string): Promise<void> {
  await pool.query('DELETE FROM customers WHERE id = $1;', [id]);
}

export async function deleteSupabaseSupplier(id: string): Promise<void> {
  await pool.query('DELETE FROM suppliers WHERE id = $1;', [id]);
}

export async function deleteSupabaseTransaction(id: string): Promise<void> {
  await pool.query('DELETE FROM transactions WHERE id = $1;', [id]);
}

export async function deleteSupabaseLoan(id: string): Promise<void> {
  await pool.query('DELETE FROM loans WHERE id = $1;', [id]);
}

export async function deleteSupabaseHookah(id: string): Promise<void> {
  await pool.query('DELETE FROM hookahs WHERE id = $1;', [id]);
}

export async function deleteSupabaseRental(id: string): Promise<void> {
  await pool.query('DELETE FROM rentals WHERE id = $1;', [id]);
}

// ------------------- MOVIMENTAÇÕES DE ESTOQUE REAIS NO SUPABASE -------------------
export async function getSupabaseStockMovements(): Promise<StockMovement[]> {
  try {
    const res = await pool.query('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 500;');
    return res.rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      sku: r.sku || '',
      type: r.type as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
      quantity: Number(r.quantity) || 0,
      previousStock: Number(r.previous_stock) || 0,
      newStock: Number(r.new_stock) || 0,
      unitCost: Number(r.unit_cost) || 0,
      reason: r.reason || '',
      timestamp: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      userId: r.user_id || 'usr_1',
      userName: r.user_name || 'Murilo',
    }));
  } catch (err) {
    console.error('[DB] Erro ao buscar movimentações de estoque:', err);
    return [];
  }
}

export async function createSupabaseStockMovement(mov: StockMovement): Promise<StockMovement> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO stock_movements 
       (id, product_id, product_name, sku, type, quantity, previous_stock, new_stock, unit_cost, reason, user_id, user_name, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW());`,
      [
        mov.id,
        mov.productId,
        mov.productName,
        mov.sku,
        mov.type,
        mov.quantity,
        mov.previousStock,
        mov.newStock,
        mov.unitCost,
        mov.reason,
        mov.userId,
        mov.userName,
      ]
    );
    await client.query(
      'UPDATE product_variants SET stockquantity = $1 WHERE productid = $2;',
      [mov.newStock, mov.productId]
    );
    await client.query('COMMIT');
    return mov;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

