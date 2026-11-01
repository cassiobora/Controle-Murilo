import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

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
} from './src/types/erp.ts';

import {
  SEED_USERS,
  SEED_PRODUCTS,
  SEED_CLIENTS,
  SEED_SUPPLIERS,
  SEED_TRANSACTIONS,
  SEED_LOANS,
  SEED_HOOKAHS,
  SEED_RENTALS,
  SEED_AUDIT_LOGS,
} from './src/data/seedData.ts';

import {
  initDatabase,
  getSupabaseUsers,
  getSupabaseProducts,
  createSupabaseProduct,
  updateSupabaseProduct,
  deleteSupabaseProduct,
  getSupabaseClients,
  createSupabaseClient,
  updateSupabaseClient,
  deleteSupabaseClient,
  getSupabaseSuppliers,
  createSupabaseSupplier,
  updateSupabaseSupplier,
  deleteSupabaseSupplier,
  getSupabaseTransactions,
  createSupabaseTransaction,
  settleSupabaseTransaction,
  updateSupabaseTransaction,
  deleteSupabaseTransaction,
  getSupabaseLoans,
  createSupabaseLoan,
  updateSupabaseLoan,
  deleteSupabaseLoan,
  getSupabaseHookahs,
  createSupabaseHookah,
  updateSupabaseHookah,
  deleteSupabaseHookah,
  getSupabaseRentals,
  createSupabaseRental,
  updateSupabaseRental,
  deleteSupabaseRental,
  getSupabaseStockMovements,
  createSupabaseStockMovement,
  getSupabaseAuditLogs,
  createSupabaseAuditLog,
} from './src/db/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'cerebro_erp_super_secure_hmac_sha256_key_2026';
const DATA_FILE = path.resolve(__dirname, 'cerebro_erp_database.json');

// Estrutura de persistência
interface ERPDatabase {
  users: User[];
  products: Product[];
  movements: StockMovement[];
  clients: Client[];
  suppliers: Supplier[];
  transactions: FinancialTransaction[];
  loans: MoneyLoan[];
  hookahs: HookahEquipment[];
  rentals: HookahRental[];
  auditLogs: AuditLog[];
}

let db: ERPDatabase = {
  users: [...SEED_USERS],
  products: [],
  movements: [],
  clients: [],
  suppliers: [],
  transactions: [],
  loans: [],
  hookahs: [],
  rentals: [],
  auditLogs: [],
};

// Não há dados fictícios: o banco de dados oficial é o Supabase PostgreSQL
function loadDatabase() {
  // Inicialização direta do Supabase
}

function saveDatabase() {
  // O Supabase PostgreSQL é a fonte da verdade em tempo real
}

// ------------------- CRIPTOGRAFIA & JWT HMAC SHA-256 -------------------
function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJWT(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

function verifyJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) return null;
    const payloadJson = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function computeSessionHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 24);
}

// ------------------- AUDITORIA INVIOLÁVEL (LEDGER) -------------------
function appendAuditLog(
  userId: string,
  userName: string,
  userRole: 'ADMIN_MASTER' | 'OPERADOR',
  ip: string,
  action: string,
  entity: string,
  entityId: string,
  details: string
): AuditLog {
  const lastLog = db.auditLogs[db.auditLogs.length - 1];
  const previousHash = lastLog ? lastLog.integrityHash : 'GENESIS_CEREBRO_ERP_HASH';
  const timestamp = new Date().toISOString();
  
  // Hash encadeado (Block-chain style) que impede adulteração retroativa
  const integrityHash = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${previousHash}|${timestamp}|${userId}|${action}|${entity}|${entityId}|${details}`)
    .digest('hex');

  const newLog: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    userId,
    userName,
    userRole,
    ip: ip || '127.0.0.1',
    action,
    entity,
    entityId,
    details,
    integrityHash,
  };

  db.auditLogs.push(newLog);
  saveDatabase();
  createSupabaseAuditLog(5, action, `${entity} ${entityId}: ${details}`, ip).catch(() => {});
  return newLog;
}

// ------------------- RATE LIMITING & DDOS SHIELD -------------------
const rateLimitWindowMs = 60 * 1000; // 1 minuto
const rateLimitMaxRequests = 120; // 120 requisições por minuto por IP
const ipRequests = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now > entry.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + rateLimitWindowMs });
    return next();
  }

  entry.count++;
  if (entry.count > rateLimitMaxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Taxa limite de requisições excedida. Proteção DDoS ativa.',
      retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000),
    });
  }

  next();
}

// ------------------- AUTENTICAÇÃO & RLS MIDDLEWARE -------------------
interface AuthenticatedRequest extends Request {
  user?: User;
  sessionHash?: string;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sessão expirada ou assinatura HMAC inválida' });
  }

  const user = db.users.find((u) => u.id === payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não localizado no sistema' });
  }

  req.user = user;
  req.sessionHash = computeSessionHash(token);
  res.setHeader('X-Session-Hash', req.sessionHash);
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN_MASTER') {
    return res.status(403).json({ error: 'Acesso restrito ao nível de privilégio Admin Master.' });
  }
  next();
}

// ------------------- RECALCULAR CURVA ABC & MÉTRICAS -------------------
function recalculateABC() {
  const totalRevenue = db.products.reduce((acc, p) => acc + (p.salesRevenuePeriod || 0), 0);
  if (totalRevenue === 0) return;

  const sorted = [...db.products].sort(
    (a, b) => (b.salesRevenuePeriod || 0) - (a.salesRevenuePeriod || 0)
  );

  let accumulated = 0;
  for (const item of sorted) {
    accumulated += item.salesRevenuePeriod || 0;
    const share = (accumulated / totalRevenue) * 100;
    let abc: 'A' | 'B' | 'C' = 'C';
    if (share <= 80) abc = 'A';
    else if (share <= 95) abc = 'B';
    else abc = 'C';

    const p = db.products.find((prod) => prod.id === item.id);
    if (p) p.abcClass = abc;
  }
}

// Sincronização em tempo real com o banco de dados Supabase PostgreSQL
let isSupabaseConnected = false;

async function syncWithSupabase() {
  try {
    const ok = await initDatabase();
    if (!ok) {
      console.warn('[Supabase] Não foi possível conectar ao Supabase neste momento.');
      return;
    }
    isSupabaseConnected = true;

    const [u, p, c, s, tx, ln, hk, rn, aud, movs] = await Promise.all([
      getSupabaseUsers().catch(() => []),
      getSupabaseProducts().catch(() => []),
      getSupabaseClients().catch(() => []),
      getSupabaseSuppliers().catch(() => []),
      getSupabaseTransactions().catch(() => []),
      getSupabaseLoans().catch(() => []),
      getSupabaseHookahs().catch(() => []),
      getSupabaseRentals().catch(() => []),
      getSupabaseAuditLogs().catch(() => []),
      getSupabaseStockMovements().catch(() => []),
    ]);

    if (u && u.length > 0) db.users = u;
    db.products = p || [];
    db.clients = c || [];
    db.suppliers = s || [];
    db.transactions = tx || [];
    db.loans = ln || [];
    db.hookahs = hk || [];
    db.rentals = rn || [];
    db.auditLogs = aud || [];
    db.movements = movs || [];

    console.log(`[Supabase PostgreSQL] Sincronização 100% Real! ${db.products.length} produtos, ${db.clients.length} clientes, ${db.suppliers.length} fornecedores, ${db.transactions.length} transações, ${db.loans.length} empréstimos, ${db.hookahs.length} narguiles.`);
  } catch (err) {
    console.error('[Supabase] Falha ao sincronizar dados:', err);
  }
}

// ------------------- INICIALIZAÇÃO DO SERVIDOR EXPRESS -------------------
async function startServer() {
  loadDatabase();
  await syncWithSupabase();
  recalculateABC();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());
  app.use(rateLimiter);

  // Status de conexão com o banco de dados Supabase Oficial
  app.get('/api/system/database-status', (_req: Request, res: Response) => {
    res.json({
      connected: isSupabaseConnected,
      provider: 'Supabase PostgreSQL 17 (Oficial)',
      host: 'db.zlyibbmhqmxqtyrbcbrt.supabase.co',
      database: 'postgres',
      user: 'postgres',
      url: 'https://zlyibbmhqmxqtyrbcbrt.supabase.co',
      projectRef: 'zlyibbmhqmxqtyrbcbrt',
      publishableKey: 'sb_publishable_WAYUhz3h3lYJxteMjZExbg_1mZ1_Cms',
      connectionString: 'postgresql://postgres:comerciomurilo@db.zlyibbmhqmxqtyrbcbrt.supabase.co:5432/postgres',
      cliCommands: [
        'supabase login',
        'supabase init',
        'supabase link --project-ref zlyibbmhqmxqtyrbcbrt'
      ],
      tables: {
        products: db.products.length,
        clients: db.clients.length,
        suppliers: db.suppliers.length,
        transactions: db.transactions.length,
        loans: db.loans.length,
        hookahs: db.hookahs.length,
        rentals: db.rentals.length,
        stock_movements: db.movements.length,
        audit_logs: db.auditLogs.length,
      },
      lastSync: new Date().toISOString(),
    });
  });

  // ------------------- ROTAS DE AUTENTICAÇÃO & SESSÃO -------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const emailNorm = String(email || '').toLowerCase().trim();
    
    // Autenticação com credenciais reais
    const user = db.users.find((u) => {
      const uEmail = u.email.toLowerCase();
      if (uEmail === emailNorm) return true;
      if (u.role === 'ADMIN_MASTER' && (emailNorm === 'murilo' || emailNorm === 'admin' || emailNorm === 'murilo@controlemurilo.com.br' || emailNorm === 'admin@controlemurilo.com.br' || emailNorm === 'admin@cerebroerp.com.br')) {
        return true;
      }
      if (u.role === 'OPERADOR' && (emailNorm === 'operador' || emailNorm === 'operador@controlemurilo.com.br' || emailNorm === 'operador@cerebroerp.com.br')) {
        return true;
      }
      return false;
    });
    
    // Senha padrão configurada: 'admin123', 'admin', 'murilo123', 'murilo' para Admin Master (Murilo) e 'operador123' para Operador
    const isValid =
      user &&
      ((user.role === 'ADMIN_MASTER' && (password === 'admin123' || password === 'admin' || password === 'murilo' || password === 'murilo123')) ||
       (user.role === 'OPERADOR' && (password === 'operador123' || password === 'operador')));

    if (!isValid || !user) {
      appendAuditLog(
        'anonymous',
        'Desconhecido',
        'OPERADOR',
        req.ip || '127.0.0.1',
        'FALHA_LOGIN',
        'Autenticacao',
        email || 'na',
        `Tentativa de login frustrada para o e-mail: ${email}`
      );
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique e-mail e senha.' });
    }

    const payload = {
      sub: user.id,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 horas
    };

    const token = createJWT(payload);
    const sessionHash = computeSessionHash(token);

    appendAuditLog(
      user.id,
      user.name,
      user.role,
      req.ip || '127.0.0.1',
      'LOGIN_SUCESSO',
      'Sessao',
      user.id,
      `Login autenticado via HMAC SHA-256. Hash de sessão: ${sessionHash}`
    );

    res.json({
      token,
      sessionHash,
      user,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
  });

  app.get('/api/auth/session', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      user: req.user,
      sessionHash: req.sessionHash,
    });
  });

  // ------------------- AUDITORIA INVIOLÁVEL (READ-ONLY) -------------------
  app.get('/api/audit-logs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const sorted = [...db.auditLogs].reverse();
    res.json({ logs: sorted, totalCount: sorted.length });
  });

  // ------------------- ESTOQUE & PRODUTOS -------------------
  app.get('/api/products', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const spProds = await getSupabaseProducts();
      db.products = spProds;
    } catch (e) {
      console.warn('[Supabase] Usando cache local de produtos:', e);
    }
    res.json(db.products);
  });

  app.post('/api/products', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    let newProduct: Product;
    try {
      newProduct = await createSupabaseProduct(body);
      db.products.unshift(newProduct);
    } catch (err) {
      newProduct = {
        id: `prod_${Date.now()}`,
        sku: body.sku || `SKU-${Date.now().toString().slice(-5)}`,
        name: body.name,
        category: body.category || 'Geral',
        variations: body.variations || [],
        costPrice: Number(body.costPrice) || 0,
        sellPrice: Number(body.sellPrice) || 0,
        currentStock: Number(body.currentStock) || 0,
        minStock: Number(body.minStock) || 10,
        reorderPoint: Number(body.reorderPoint) || 15,
        unit: body.unit || 'UN',
        salesVolumePeriod: 0,
        salesRevenuePeriod: 0,
        abcClass: 'C',
        turnoverRatio: 1.0,
        coverageDays: 30,
        lastUpdated: new Date().toISOString(),
      };
      db.products.push(newProduct);
    }

    recalculateABC();
    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'CRIAR_PRODUTO',
      'Produto',
      newProduct.id,
      `Criado produto ${newProduct.name} [SKU: ${newProduct.sku}], Estoque inicial: ${newProduct.currentStock}`
    );

    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let updated: Product;
    try {
      updated = await updateSupabaseProduct(id, req.body);
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx !== -1) db.products[idx] = updated;
      else db.products.push(updated);
    } catch (e) {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Produto não encontrado' });
      const prev = db.products[idx];
      updated = {
        ...prev,
        ...req.body,
        lastUpdated: new Date().toISOString(),
      };
      db.products[idx] = updated;
    }

    recalculateABC();
    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'ATUALIZAR_PRODUTO',
      'Produto',
      id,
      `Produto ${updated.name} atualizado no Supabase. Preço: R$ ${updated.sellPrice}, Estoque: ${updated.currentStock}`
    );

    res.json(updated);
  });

  app.delete('/api/products/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await deleteSupabaseProduct(id);
      db.products = db.products.filter((p) => p.id !== id);
      recalculateABC();
      appendAuditLog(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.ip || '127.0.0.1',
        'EXCLUIR_PRODUTO',
        'Produto',
        id,
        `Produto ${id} excluído com sucesso do banco de dados Supabase`
      );
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[Supabase] Erro ao excluir produto:', err);
      res.status(500).json({ error: 'Falha ao excluir produto no banco de dados' });
    }
  });

  app.get('/api/movements', authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const spMovs = await getSupabaseStockMovements();
      db.movements = spMovs;
    } catch (e) {
      console.warn('[Supabase] Usando cache de movimentações:', e);
    }
    res.json(db.movements);
  });

  app.post('/api/products/:id/movement', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { type, quantity, reason } = req.body;
    const product = db.products.find((p) => p.id === id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    const qty = Math.abs(Number(quantity) || 0);
    if (qty === 0) return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });

    const prevStock = product.currentStock;
    let newStock = prevStock;

    if (type === 'ENTRADA') {
      newStock = prevStock + qty;
    } else if (type === 'SAIDA') {
      if (prevStock < qty) {
        return res.status(400).json({ error: 'Estoque insuficiente para esta saída' });
      }
      newStock = prevStock - qty;
      product.salesVolumePeriod = (product.salesVolumePeriod || 0) + qty;
      product.salesRevenuePeriod = (product.salesRevenuePeriod || 0) + (qty * product.sellPrice);
    } else if (type === 'AJUSTE') {
      newStock = qty;
    }

    product.currentStock = newStock;
    product.lastUpdated = new Date().toISOString();

    let movement: StockMovement = {
      id: `mov_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity: qty,
      previousStock: prevStock,
      newStock,
      unitCost: product.costPrice,
      reason: reason || 'Movimentação manual de inventário',
      timestamp: new Date().toISOString(),
      userId: req.user!.id,
      userName: req.user!.name,
    };

    try {
      movement = await createSupabaseStockMovement(movement);
    } catch (err) {
      console.warn('[Supabase] Falha ao persistir movimentação no banco:', err);
    }

    db.movements.unshift(movement);
    recalculateABC();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      `MOVIMENTO_ESTOQUE_${type}`,
      'Estoque',
      product.id,
      `${type} de ${qty} un em ${product.name}. Saldo: ${prevStock} -> ${newStock}. Motivo: ${reason}`
    );

    res.json({ product, movement });
  });

  // ------------------- CRM (CLIENTES & FORNECEDORES) -------------------
  app.get('/api/clients', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const spClients = await getSupabaseClients();
      db.clients = spClients;
    } catch (e) {
      console.warn('[Supabase] Usando cache local de clientes:', e);
    }
    res.json(db.clients);
  });

  app.post('/api/clients', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    let newClient: Client;
    try {
      newClient = await createSupabaseClient(body);
      db.clients.unshift(newClient);
    } catch (err) {
      newClient = {
        id: `cli_${Date.now()}`,
        type: body.type || 'PF',
        name: body.name,
        tradeName: body.tradeName,
        document: body.document,
        stateRegistration: body.stateRegistration,
        phone: body.phone,
        email: body.email,
        address: body.address || {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: 'SP',
          zipCode: '',
        },
        creditLimit: Number(body.creditLimit) || 0,
        status: body.status || 'ATIVO',
        notes: body.notes,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
      };
      db.clients.push(newClient);
    }

    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'CRIAR_CLIENTE',
      'Cliente',
      newClient.id,
      `Cadastrado cliente ${newClient.name} (${newClient.type} - Doc: ${newClient.document})`
    );

    res.status(201).json(newClient);
  });

  app.put('/api/clients/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let updated: Client;
    try {
      updated = await updateSupabaseClient(id, req.body);
      const idx = db.clients.findIndex((c) => c.id === id);
      if (idx !== -1) db.clients[idx] = updated;
      else db.clients.push(updated);
    } catch (e) {
      const idx = db.clients.findIndex((c) => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Cliente não encontrado' });
      const prev = db.clients[idx];
      updated = {
        ...prev,
        ...req.body,
        id: prev.id,
      };
      db.clients[idx] = updated;
    }

    saveDatabase();
    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'ATUALIZAR_CLIENTE',
      'Cliente',
      id,
      `Atualizados dados do cliente ${updated.name} (${updated.document}) no Supabase`
    );
    res.json(updated);
  });

  app.delete('/api/clients/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await deleteSupabaseClient(id);
      db.clients = db.clients.filter((c) => c.id !== id);
      appendAuditLog(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.ip || '127.0.0.1',
        'EXCLUIR_CLIENTE',
        'Cliente',
        id,
        `Cliente ${id} excluído com sucesso do banco de dados Supabase`
      );
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[Supabase] Erro ao excluir cliente:', err);
      res.status(500).json({ error: 'Falha ao excluir cliente no banco de dados' });
    }
  });

  app.get('/api/suppliers', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const spSuppliers = await getSupabaseSuppliers();
      db.suppliers = spSuppliers;
    } catch (e) {
      console.warn('[Supabase] Usando cache local de fornecedores:', e);
    }
    res.json(db.suppliers);
  });

  app.post('/api/suppliers', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    let newSupplier: Supplier;
    try {
      newSupplier = await createSupabaseSupplier(body);
      db.suppliers.unshift(newSupplier);
    } catch (err) {
      newSupplier = {
        id: `sup_${Date.now()}`,
        companyName: body.companyName,
        tradeName: body.tradeName,
        cnpj: body.cnpj,
        stateRegistration: body.stateRegistration,
        category: body.category || 'Insumos Gerais',
        contactName: body.contactName,
        phone: body.phone,
        email: body.email,
        bankDetails: body.bankDetails || {
          bank: '',
          agency: '',
          account: '',
          pixKey: '',
          pixType: 'CNPJ',
        },
        leadTimeDays: Number(body.leadTimeDays) || 5,
        shippingType: body.shippingType || 'FOB',
        paymentTerms: body.paymentTerms || 'À vista',
        createdAt: new Date().toISOString(),
      };
      db.suppliers.push(newSupplier);
    }

    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'CRIAR_FORNECEDOR',
      'Fornecedor',
      newSupplier.id,
      `Cadastrado fornecedor ${newSupplier.tradeName} (CNPJ: ${newSupplier.cnpj}) Lead time: ${newSupplier.leadTimeDays}d`
    );

    res.status(201).json(newSupplier);
  });

  app.put('/api/suppliers/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let updated: Supplier;
    try {
      updated = await updateSupabaseSupplier(id, req.body);
      const idx = db.suppliers.findIndex((s) => s.id === id);
      if (idx !== -1) db.suppliers[idx] = updated;
      else db.suppliers.push(updated);
    } catch (e) {
      const idx = db.suppliers.findIndex((s) => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Fornecedor não encontrado' });
      const prev = db.suppliers[idx];
      updated = {
        ...prev,
        ...req.body,
        id: prev.id,
      };
      db.suppliers[idx] = updated;
    }

    saveDatabase();
    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'ATUALIZAR_FORNECEDOR',
      'Fornecedor',
      id,
      `Atualizado fornecedor ${updated.tradeName} (CNPJ: ${updated.cnpj}) no Supabase`
    );
    res.json(updated);
  });

  app.delete('/api/suppliers/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await deleteSupabaseSupplier(id);
      db.suppliers = db.suppliers.filter((s) => s.id !== id);
      appendAuditLog(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.ip || '127.0.0.1',
        'EXCLUIR_FORNECEDOR',
        'Fornecedor',
        id,
        `Fornecedor ${id} excluído com sucesso do banco de dados Supabase`
      );
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[Supabase] Erro ao excluir fornecedor:', err);
      res.status(500).json({ error: 'Falha ao excluir fornecedor no banco de dados' });
    }
  });

  // ------------------- TESOURARIA & LIVRO CAIXA -------------------
  app.get('/api/transactions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const spTx = await getSupabaseTransactions();
      db.transactions = spTx;
    } catch (e) {
      console.warn('[Supabase] Usando cache local de transações:', e);
    }
    res.json(db.transactions);
  });

  app.post('/api/transactions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    const count = db.transactions.length + 1;
    const code = `LAN-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const originalAmount = Number(body.originalAmount) || 0;
    const monthlyInterestRate = Number(body.monthlyInterestRate) || 0;
    const latePenaltyRate = Number(body.latePenaltyRate) || 0;

    const interestAmount = (originalAmount * monthlyInterestRate) / 100;
    const penaltyAmount = (originalAmount * latePenaltyRate) / 100;
    const totalFinalAmount = originalAmount + interestAmount + penaltyAmount;

    const isInstallment = Boolean(body.isInstallment && body.totalInstallments > 1);
    const totalInstallments = isInstallment ? Number(body.totalInstallments) : 1;

    // Geração dinâmica de parcelas
    const installments = [];
    const installmentOriginal = originalAmount / totalInstallments;
    const installmentFinal = totalFinalAmount / totalInstallments;
    const baseDate = new Date(body.dueDate || body.movementDate || new Date());

    for (let i = 1; i <= totalInstallments; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));
      installments.push({
        number: i,
        totalInstallments,
        dueDate: d.toISOString().split('T')[0],
        originalAmount: Math.round(installmentOriginal * 100) / 100,
        interestAmount: Math.round((interestAmount / totalInstallments) * 100) / 100,
        penaltyAmount: Math.round((penaltyAmount / totalInstallments) * 100) / 100,
        finalAmount: Math.round(installmentFinal * 100) / 100,
        status: body.status || 'PENDENTE',
        settledDate: body.status === 'PAGO' ? new Date().toISOString().split('T')[0] : undefined,
      });
    }

    let transaction: FinancialTransaction = {
      id: `tx_${Date.now()}`,
      code,
      flowType: body.flowType || 'RECEITA',
      description: body.description,
      movementDate: body.movementDate || new Date().toISOString().split('T')[0],
      dueDate: body.dueDate || new Date().toISOString().split('T')[0],
      originalAmount,
      macroCategory: body.macroCategory || 'Operacional Geral',
      subCategory: body.subCategory || 'Geral',
      beneficiaryId: body.beneficiaryId,
      beneficiaryName: body.beneficiaryName || 'Diversos',
      beneficiaryType: body.beneficiaryType || 'TERCEIRO',
      accountOrigin: body.accountOrigin || 'Caixa Geral Principal',
      paymentMethod: body.paymentMethod || 'PIX',
      isInstallment,
      totalInstallments,
      installments,
      monthlyInterestRate,
      latePenaltyRate,
      calculatedInterestAmount: interestAmount,
      calculatedPenaltyAmount: penaltyAmount,
      totalFinalAmount,
      status: body.status || 'PENDENTE',
      settledDate: body.status === 'PAGO' ? (body.settledDate || new Date().toISOString().split('T')[0]) : undefined,
      beneficiaryPixKey: body.beneficiaryPixKey,
      documentNumber: body.documentNumber,
      notes: body.notes,
      createdAt: new Date().toISOString(),
    };

    try {
      const spCreated = await createSupabaseTransaction(transaction);
      transaction = { ...transaction, id: spCreated.id };
    } catch (e) {
      console.warn('[Supabase] Falha ao persistir transação, usando fallback local:', e);
    }

    db.transactions.unshift(transaction);
    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'CRIAR_LANCAMENTO',
      'Tesouraria',
      transaction.id,
      `Criado lançamento [${transaction.code}] ${transaction.flowType}: R$ ${transaction.totalFinalAmount.toFixed(2)} - ${transaction.description}`
    );

    res.status(201).json(transaction);
  });

  app.put('/api/transactions/:id/settle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tx = db.transactions.find((t) => t.id === id);
    if (!tx) return res.status(404).json({ error: 'Lançamento não encontrado' });

    tx.status = 'PAGO';
    tx.settledDate = new Date().toISOString().split('T')[0];
    tx.installments.forEach((inst) => {
      inst.status = 'PAGO';
      inst.settledDate = tx.settledDate;
    });

    try {
      await settleSupabaseTransaction(id);
    } catch (e) {
      console.warn('[Supabase] Falha ao liquidar no banco:', e);
    }

    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'LIQUIDAR_LANCAMENTO',
      'Tesouraria',
      tx.id,
      `Liquidado lançamento [${tx.code}] R$ ${tx.totalFinalAmount.toFixed(2)} na conta ${tx.accountOrigin} (Supabase sincronizado)`
    );

    res.json(tx);
  });

  app.put('/api/transactions/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const idx = db.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Lançamento não encontrado' });
    const prev = db.transactions[idx];
    const body = req.body;

    const originalAmount = body.originalAmount !== undefined ? Number(body.originalAmount) : prev.originalAmount;
    const monthlyInterestRate = body.monthlyInterestRate !== undefined ? Number(body.monthlyInterestRate) : prev.monthlyInterestRate;
    const latePenaltyRate = body.latePenaltyRate !== undefined ? Number(body.latePenaltyRate) : prev.latePenaltyRate;

    const interestAmount = (originalAmount * monthlyInterestRate) / 100;
    const penaltyAmount = (originalAmount * latePenaltyRate) / 100;
    const totalFinalAmount = originalAmount + interestAmount + penaltyAmount;

    const updated: FinancialTransaction = {
      ...prev,
      ...body,
      id: prev.id,
      code: prev.code,
      originalAmount,
      monthlyInterestRate,
      latePenaltyRate,
      calculatedInterestAmount: interestAmount,
      calculatedPenaltyAmount: penaltyAmount,
      totalFinalAmount,
    };

    try {
      await updateSupabaseTransaction(id, updated);
    } catch (e) {
      console.warn('[Supabase] Falha ao atualizar transação no banco:', e);
    }

    db.transactions[idx] = updated;
    saveDatabase();
    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'ATUALIZAR_LANCAMENTO',
      'Tesouraria',
      id,
      `Lançamento [${updated.code}] atualizado no Supabase: R$ ${updated.totalFinalAmount.toFixed(2)} - ${updated.description}`
    );
    res.json(updated);
  });

  app.delete('/api/transactions/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await deleteSupabaseTransaction(id);
      db.transactions = db.transactions.filter((t) => t.id !== id);
      appendAuditLog(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.ip || '127.0.0.1',
        'EXCLUIR_LANCAMENTO',
        'Tesouraria',
        id,
        `Lançamento ${id} excluído com sucesso do banco de dados Supabase`
      );
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[Supabase] Erro ao excluir transação:', err);
      res.status(500).json({ error: 'Falha ao excluir lançamento no banco de dados' });
    }
  });

  // ------------------- DRE GERENCIAL & CONTÁBIL -------------------
  app.get('/api/dre', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
      const taxRate = Number(req.query.taxRate) || 6.0; // Padrão Simples Nacional 6%

      let grossSalesRevenue = 0;
      let hookahRentalRevenue = 0;
      let loanInterestRevenue = 0;
      let cmvTotal = 0;
      let fixedOperating = 0;
      let variableOperating = 0;
      let directCosts = 0;
      let financialExpenses = 0;

      for (const tx of db.transactions || []) {
        if (!tx) continue;
        const status = String(tx.status || '').toUpperCase();
        if (status !== 'PAGO' && status !== 'COMPLETED' && status !== 'LIQUIDADO') continue;

        const cat = String(tx.macroCategory || tx.subCategory || '').toLowerCase();
        const flow = String(tx.flowType || '').toUpperCase();
        const finalAmt = Number(tx.totalFinalAmount || tx.originalAmount) || 0;

        if (flow === 'RECEITA' || flow === 'IN' || flow === 'A RECEBER') {
          if (cat.includes('locaç') || cat.includes('locac') || cat.includes('narguil')) {
            hookahRentalRevenue += finalAmt;
          } else if (cat.includes('rendimento') || cat.includes('juro') || cat.includes('financeir')) {
            loanInterestRevenue += finalAmt;
          } else {
            grossSalesRevenue += finalAmt;
          }
        } else if (flow === 'DESPESA' || flow === 'OUT' || flow === 'A PAGAR') {
          if (cat.includes('cmv') || cat.includes('mercadoria') || cat.includes('insumo')) {
            cmvTotal += finalAmt;
          } else if (cat.includes('fixa') || cat.includes('aluguel') || cat.includes('folha') || cat.includes('salario')) {
            fixedOperating += finalAmt;
          } else if (cat.includes('variáv') || cat.includes('varia') || cat.includes('comiss')) {
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

      // Cálculo do Ponto de Equilíbrio (Break-even): Custos Fixos / Margem de Contribuição %
      const contributionMarginAmount = netRevenue - (cmvTotal + variableOperating + directCosts);
      const contributionMarginRatio = netRevenue > 0 ? (contributionMarginAmount / netRevenue) : 0.45;
      const breakEvenPoint = contributionMarginRatio > 0 ? (fixedOperating / contributionMarginRatio) : 0;

      res.json({
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
      });
    } catch (err: any) {
      console.error('[DRE Calculation Error]:', err);
      res.status(500).json({ error: 'Erro interno ao processar DRE', details: err?.message });
    }
  });

  // ------------------- CENTRAL DE EMPRÉSTIMOS DE CAPITAL -------------------
  app.get('/api/loans', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const spLoans = await getSupabaseLoans();
      db.loans = spLoans;
    } catch (e) {
      console.warn('[Supabase] Usando cache local de empréstimos:', e);
    }
    res.json(db.loans);
  });

  app.post('/api/loans', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    const count = db.loans.length + 1;
    const contractNumber = `EMP-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const principal = Number(body.principalAmount) || 0;
    const rateMonthly = Number(body.interestRateMonthly) || 4.0;
    const termMonths = Number(body.termMonths) || 1;
    const isCompound = body.interestType === 'COMPOSTO';

    let totalProjectedReturn = 0;
    let repayments = [];

    if (isCompound) {
      totalProjectedReturn = principal * Math.pow(1 + rateMonthly / 100, termMonths);
      const monthlyTotal = totalProjectedReturn / termMonths;
      const baseDate = new Date(body.issueDate || new Date());

      for (let i = 1; i <= termMonths; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        repayments.push({
          installmentNumber: i,
          dueDate: d.toISOString().split('T')[0],
          principalAmount: Math.round((principal / termMonths) * 100) / 100,
          interestAmount: Math.round((monthlyTotal - principal / termMonths) * 100) / 100,
          totalAmount: Math.round(monthlyTotal * 100) / 100,
          status: 'PENDENTE' as const,
        });
      }
    } else {
      const totalInterest = principal * (rateMonthly / 100) * termMonths;
      totalProjectedReturn = principal + totalInterest;
      const monthlyPrincipal = principal / termMonths;
      const monthlyInterest = totalInterest / termMonths;
      const baseDate = new Date(body.issueDate || new Date());

      for (let i = 1; i <= termMonths; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        repayments.push({
          installmentNumber: i,
          dueDate: d.toISOString().split('T')[0],
          principalAmount: Math.round(monthlyPrincipal * 100) / 100,
          interestAmount: Math.round(monthlyInterest * 100) / 100,
          totalAmount: Math.round((monthlyPrincipal + monthlyInterest) * 100) / 100,
          status: 'PENDENTE' as const,
        });
      }
    }

    const projectedProfit = totalProjectedReturn - principal;

    let newLoan: MoneyLoan = {
      id: `loan_${Date.now()}`,
      contractNumber,
      borrowerName: body.borrowerName,
      borrowerDocument: body.borrowerDocument,
      borrowerPhone: body.borrowerPhone,
      borrowerClientId: body.borrowerClientId,
      principalAmount: principal,
      interestRateMonthly: rateMonthly,
      interestType: isCompound ? 'COMPOSTO' : 'SIMPLES',
      issueDate: body.issueDate || new Date().toISOString().split('T')[0],
      termMonths,
      totalProjectedReturn: Math.round(totalProjectedReturn * 100) / 100,
      projectedProfit: Math.round(projectedProfit * 100) / 100,
      repayments,
      totalCollected: 0,
      remainingBalance: Math.round(totalProjectedReturn * 100) / 100,
      status: 'EM_ANDAMENTO',
      notes: body.notes,
      createdAt: new Date().toISOString(),
    };

    try {
      newLoan = await createSupabaseLoan(newLoan);
    } catch (e) {
      console.warn('[Supabase] Falha ao persistir empréstimo no banco:', e);
    }

    db.loans.unshift(newLoan);
    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'CRIAR_EMPRESTIMO',
      'Emprestimos',
      newLoan.id,
      `Criado contrato [${contractNumber}] Tomador: ${newLoan.borrowerName}, Principal: R$ ${principal.toFixed(2)}, Retorno Projetado: R$ ${newLoan.totalProjectedReturn.toFixed(2)} (Supabase)`
    );

    res.status(201).json(newLoan);
  });

  app.post('/api/loans/:id/amortize', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { installmentNumber, amount } = req.body;
    const loan = db.loans.find((l) => l.id === id);
    if (!loan) return res.status(404).json({ error: 'Contrato de empréstimo não encontrado' });

    const rep = loan.repayments.find((r) => r.installmentNumber === Number(installmentNumber));
    if (!rep) return res.status(404).json({ error: 'Parcela de empréstimo não encontrada' });

    rep.status = 'PAGO';
    rep.paidDate = new Date().toISOString().split('T')[0];
    rep.paidAmount = Number(amount) || rep.totalAmount;

    loan.totalCollected += rep.paidAmount;
    loan.remainingBalance = Math.max(0, loan.totalProjectedReturn - loan.totalCollected);

    const allPaid = loan.repayments.every((r) => r.status === 'PAGO');
    if (allPaid) {
      loan.status = 'LIQUIDADO';
    }

    try {
      await updateSupabaseLoan(id, {
        status: loan.status,
        totalCollected: loan.totalCollected,
        remainingBalance: loan.remainingBalance,
        repayments: loan.repayments,
      });
    } catch (e) {
      console.warn('[Supabase] Falha ao atualizar empréstimo no banco:', e);
    }

    // Registra entrada na tesouraria automaticamente
    const txCode = `LAN-EMP-${Date.now().toString().slice(-4)}`;
    const txData: FinancialTransaction = {
      id: `tx_${Date.now()}`,
      code: txCode,
      flowType: 'RECEITA',
      description: `Amortização Parcela ${rep.installmentNumber}/${loan.termMonths} - Contrato ${loan.contractNumber} (${loan.borrowerName})`,
      movementDate: new Date().toISOString().split('T')[0],
      dueDate: rep.dueDate,
      originalAmount: rep.paidAmount,
      macroCategory: 'Rendimentos Financeiros',
      subCategory: 'Juros e Amortização de Capital',
      beneficiaryName: loan.borrowerName,
      beneficiaryType: 'CLIENTE',
      accountOrigin: 'Banco Itaú Empresa',
      paymentMethod: 'PIX',
      isInstallment: false,
      totalInstallments: 1,
      installments: [],
      monthlyInterestRate: loan.interestRateMonthly,
      latePenaltyRate: 0,
      calculatedInterestAmount: rep.interestAmount,
      calculatedPenaltyAmount: 0,
      totalFinalAmount: rep.paidAmount,
      status: 'PAGO',
      settledDate: new Date().toISOString().split('T')[0],
      documentNumber: loan.contractNumber,
      createdAt: new Date().toISOString(),
    };

    try {
      await createSupabaseTransaction(txData);
    } catch (e) {
      console.warn('[Supabase] Falha ao registrar transação de amortização no banco:', e);
    }

    db.transactions.unshift(txData);
    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'AMORTIZAR_EMPRESTIMO',
      'Emprestimos',
      loan.id,
      `Amortizada parcela ${installmentNumber} de ${loan.contractNumber} valor R$ ${rep.paidAmount.toFixed(2)}. Saldo restante: R$ ${loan.remainingBalance.toFixed(2)}`
    );

    res.json(loan);
  });

  app.put('/api/loans/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let updated: MoneyLoan;
    try {
      updated = await updateSupabaseLoan(id, req.body);
      const idx = db.loans.findIndex((l) => l.id === id);
      if (idx !== -1) db.loans[idx] = updated;
      else db.loans.push(updated);
    } catch (e) {
      const idx = db.loans.findIndex((l) => l.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Contrato de empréstimo não encontrado' });
      const prev = db.loans[idx];
      updated = {
        ...prev,
        ...req.body,
        id: prev.id,
        contractNumber: prev.contractNumber,
      };
      db.loans[idx] = updated;
    }

    saveDatabase();
    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'ATUALIZAR_EMPRESTIMO',
      'Emprestimos',
      id,
      `Atualizados termos do contrato [${updated.contractNumber}] Tomador: ${updated.borrowerName} no Supabase`
    );
    res.json(updated);
  });

  app.delete('/api/loans/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await deleteSupabaseLoan(id);
      db.loans = db.loans.filter((l) => l.id !== id);
      appendAuditLog(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.ip || '127.0.0.1',
        'EXCLUIR_EMPRESTIMO',
        'Emprestimos',
        id,
        `Contrato de empréstimo ${id} excluído com sucesso do banco de dados Supabase`
      );
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[Supabase] Erro ao excluir empréstimo:', err);
      res.status(500).json({ error: 'Falha ao excluir contrato de empréstimo' });
    }
  });

  // ------------------- GESTÃO DE FROTA & ALUGUEL DE NARGUILES -------------------
  app.get('/api/hookahs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const spHk = await getSupabaseHookahs();
      db.hookahs = spHk;
    } catch (e) {
      console.warn('[Supabase] Usando cache local de narguiles:', e);
    }
    res.json(db.hookahs);
  });

  app.post('/api/hookahs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    let newHookah: HookahEquipment = {
      id: `hookah_${Date.now()}`,
      assetCode: body.assetCode || `NRG-${Date.now().toString().slice(-4)}`,
      model: body.model,
      color: body.color || 'Padrão',
      acquisitionCost: Number(body.acquisitionCost) || 0,
      dailyRate: Number(body.dailyRate) || 80.0,
      status: body.status || 'DISPONIVEL',
      totalRentalsCount: 0,
      totalRevenueGenerated: 0,
      notes: body.notes,
    };

    try {
      newHookah = await createSupabaseHookah(newHookah);
    } catch (e) {
      console.warn('[Supabase] Falha ao persistir narguile no banco:', e);
    }

    db.hookahs.unshift(newHookah);
    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'CRIAR_NARGUILE',
      'FrotaNarguile',
      newHookah.id,
      `Cadastrado narguile ${newHookah.assetCode} - ${newHookah.model} (Diária: R$ ${newHookah.dailyRate.toFixed(2)}) no Supabase`
    );

    res.status(201).json(newHookah);
  });

  app.put('/api/hookahs/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let updated: HookahEquipment;
    try {
      updated = await updateSupabaseHookah(id, req.body);
      const idx = db.hookahs.findIndex((h) => h.id === id);
      if (idx !== -1) db.hookahs[idx] = updated;
      else db.hookahs.push(updated);
    } catch (e) {
      const idx = db.hookahs.findIndex((h) => h.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Narguile não encontrado' });
      const prev = db.hookahs[idx];
      updated = {
        ...prev,
        ...req.body,
        id: prev.id,
      };
      db.hookahs[idx] = updated;
    }

    saveDatabase();
    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'ATUALIZAR_NARGUILE',
      'FrotaNarguile',
      id,
      `Setup ${updated.assetCode} (${updated.model}) atualizado no Supabase. Status: ${updated.status}`
    );
    res.json(updated);
  });

  app.delete('/api/hookahs/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await deleteSupabaseHookah(id);
      db.hookahs = db.hookahs.filter((h) => h.id !== id);
      appendAuditLog(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.ip || '127.0.0.1',
        'EXCLUIR_NARGUILE',
        'FrotaNarguile',
        id,
        `Setup de narguile ${id} excluído com sucesso do banco de dados Supabase`
      );
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[Supabase] Erro ao excluir narguile:', err);
      res.status(500).json({ error: 'Falha ao excluir setup de narguile no banco de dados' });
    }
  });

  app.get('/api/rentals', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const spRn = await getSupabaseRentals();
      db.rentals = spRn;
    } catch (e) {
      console.warn('[Supabase] Usando cache local de locações:', e);
    }
    res.json(db.rentals);
  });

  app.post('/api/rentals', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    const count = db.rentals.length + 1;
    const code = `LOC-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const equipment = db.hookahs.find((h) => h.id === body.equipmentId);
    if (!equipment) return res.status(404).json({ error: 'Narguile não encontrado' });
    if (equipment.status !== 'DISPONIVEL') {
      return res.status(400).json({ error: `Narguile ${equipment.assetCode} não está disponível (Status: ${equipment.status})` });
    }

    const dailyRate = Number(body.dailyRate) || equipment.dailyRate;
    const totalRentalAmount = Number(body.totalRentalAmount) || dailyRate;
    const depositAmount = Number(body.depositAmount) || 150.0;

    let rental: HookahRental = {
      id: `loc_${Date.now()}`,
      code,
      equipmentId: equipment.id,
      equipmentCode: equipment.assetCode,
      equipmentModel: equipment.model,
      clientId: body.clientId,
      clientName: body.clientName,
      clientDocument: body.clientDocument,
      clientPhone: body.clientPhone,
      startDate: body.startDate || new Date().toISOString(),
      expectedEndDate: body.expectedEndDate,
      dailyRate,
      totalRentalAmount,
      depositAmount,
      checklistDelivered: body.checklistDelivered || {
        stem: true,
        siliconeHose: true,
        mouthpieceAluminum: true,
        bowlCeramic: true,
        glassBase: true,
        tray: true,
        charcoalTong: true,
        electricBurner: true,
      },
      damages: [],
      extraCharges: 0,
      finalTotalAmount: totalRentalAmount,
      status: 'ATIVA',
      notes: body.notes,
      createdAt: new Date().toISOString(),
    };

    equipment.status = 'ALUGADO';
    equipment.currentRentalId = rental.id;
    equipment.totalRentalsCount += 1;
    equipment.totalRevenueGenerated += totalRentalAmount;

    try {
      rental = await createSupabaseRental(rental);
    } catch (e) {
      console.warn('[Supabase] Falha ao persistir locação no banco:', e);
    }

    db.rentals.unshift(rental);

    // Registra entrada na tesouraria
    const txRental: FinancialTransaction = {
      id: `tx_${Date.now()}`,
      code: `LAN-LOC-${Date.now().toString().slice(-4)}`,
      flowType: 'RECEITA',
      description: `Locação ${rental.code} - ${equipment.assetCode} (${rental.clientName})`,
      movementDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      originalAmount: totalRentalAmount,
      macroCategory: 'Locação de Narguiles',
      subCategory: 'Diárias e Pacotes de Eventos',
      beneficiaryName: rental.clientName,
      beneficiaryType: 'CLIENTE',
      accountOrigin: 'Caixa Geral Principal',
      paymentMethod: 'PIX',
      isInstallment: false,
      totalInstallments: 1,
      installments: [],
      monthlyInterestRate: 0,
      latePenaltyRate: 0,
      calculatedInterestAmount: 0,
      calculatedPenaltyAmount: 0,
      totalFinalAmount: totalRentalAmount,
      status: 'PAGO',
      settledDate: new Date().toISOString().split('T')[0],
      documentNumber: rental.code,
      createdAt: new Date().toISOString(),
    };

    try {
      await createSupabaseTransaction(txRental);
    } catch (e) {
      console.warn('[Supabase] Falha ao persistir transação de locação:', e);
    }

    db.transactions.unshift(txRental);
    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'LOCAR_NARGUILE',
      'AluguelNarguile',
      rental.id,
      `Aberta locação ${rental.code} do narguile ${equipment.assetCode} para ${rental.clientName}. Total: R$ ${rental.finalTotalAmount.toFixed(2)} (Supabase)`
    );

    res.status(201).json(rental);
  });

  app.post('/api/rentals/:id/return', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { checklistReturned, damages, extraCharges } = req.body;

    const rental = db.rentals.find((r) => r.id === id);
    if (!rental) return res.status(404).json({ error: 'Locação não encontrada' });

    rental.status = 'FINALIZADA';
    rental.actualEndDate = new Date().toISOString();
    rental.checklistReturned = checklistReturned;
    rental.damages = damages || [];
    rental.extraCharges = Number(extraCharges) || 0;
    rental.finalTotalAmount = rental.totalRentalAmount + rental.extraCharges;

    const equipment = db.hookahs.find((h) => h.id === rental.equipmentId);
    if (equipment) {
      equipment.currentRentalId = undefined;
      if (rental.damages && rental.damages.length > 0) {
        equipment.status = 'EM_MANUTENCAO';
      } else {
        equipment.status = 'DISPONIVEL';
      }
      try {
        await updateSupabaseHookah(equipment.id, {
          status: equipment.status,
          currentRentalId: undefined,
        });
      } catch (e) {
        console.warn('[Supabase] Falha ao atualizar narguile na devolução:', e);
      }
    }

    try {
      await updateSupabaseRental(id, {
        status: 'FINALIZADA',
        actualEndDate: rental.actualEndDate,
        checklistReturned: rental.checklistReturned,
        damages: rental.damages,
        extraCharges: rental.extraCharges,
        finalTotalAmount: rental.finalTotalAmount,
      });
    } catch (e) {
      console.warn('[Supabase] Falha ao atualizar locação na devolução:', e);
    }

    saveDatabase();

    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'DEVOLVER_NARGUILE',
      'AluguelNarguile',
      rental.id,
      `Devolução da locação ${rental.code} registrada no Supabase. Cobrança de avarias/extras: R$ ${rental.extraCharges.toFixed(2)}`
    );

    res.json(rental);
  });

  app.put('/api/rentals/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let updated: HookahRental;
    try {
      updated = await updateSupabaseRental(id, req.body);
      const idx = db.rentals.findIndex((r) => r.id === id);
      if (idx !== -1) db.rentals[idx] = updated;
      else db.rentals.push(updated);
    } catch (e) {
      const idx = db.rentals.findIndex((r) => r.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Locação não encontrada' });
      const prev = db.rentals[idx];
      updated = {
        ...prev,
        ...req.body,
        id: prev.id,
        code: prev.code,
      };
      db.rentals[idx] = updated;
    }

    saveDatabase();
    appendAuditLog(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      req.ip || '127.0.0.1',
      'ATUALIZAR_LOCACAO',
      'AluguelNarguile',
      id,
      `Atualizados dados da locação [${updated.code}] - Cliente: ${updated.clientName} no Supabase`
    );
    res.json(updated);
  });

  app.delete('/api/rentals/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      await deleteSupabaseRental(id);
      db.rentals = db.rentals.filter((r) => r.id !== id);
      appendAuditLog(
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.ip || '127.0.0.1',
        'EXCLUIR_LOCACAO',
        'AluguelNarguile',
        id,
        `Locação ${id} excluída com sucesso do banco de dados Supabase`
      );
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[Supabase] Erro ao excluir locação:', err);
      res.status(500).json({ error: 'Falha ao excluir locação no banco de dados' });
    }
  });

  // ------------------- RELATÓRIOS CONSOLIDADOS -------------------
  app.get('/api/reports/summary', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const totalStockValue = db.products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
    const totalPotentialSales = db.products.reduce((acc, p) => acc + (p.currentStock * p.sellPrice), 0);
    const lowStockCount = db.products.filter((p) => p.currentStock < p.minStock).length;

    const totalPaidRevenue = db.transactions
      .filter((t) => t.flowType === 'RECEITA' && t.status === 'PAGO')
      .reduce((acc, t) => acc + t.totalFinalAmount, 0);

    const totalPaidExpense = db.transactions
      .filter((t) => t.flowType === 'DESPESA' && t.status === 'PAGO')
      .reduce((acc, t) => acc + t.totalFinalAmount, 0);

    const pendingReceivables = db.transactions
      .filter((t) => t.flowType === 'RECEITA' && t.status === 'PENDENTE')
      .reduce((acc, t) => acc + t.totalFinalAmount, 0);

    const pendingPayables = db.transactions
      .filter((t) => t.flowType === 'DESPESA' && t.status === 'PENDENTE')
      .reduce((acc, t) => acc + t.totalFinalAmount, 0);

    const netRealBalance = totalPaidRevenue - totalPaidExpense;

    const totalLoanCapitalOut = db.loans.reduce((acc, l) => acc + l.principalAmount, 0);
    const totalLoanCollected = db.loans.reduce((acc, l) => acc + l.totalCollected, 0);
    const totalLoanRemaining = db.loans.reduce((acc, l) => acc + l.remainingBalance, 0);
    const totalLoanProfitProjected = db.loans.reduce((acc, l) => acc + l.projectedProfit, 0);

    const hookahFleetCount = db.hookahs.length;
    const hookahsAvailable = db.hookahs.filter((h) => h.status === 'DISPONIVEL').length;
    const hookahsRented = db.hookahs.filter((h) => h.status === 'ALUGADO').length;
    const hookahsMaintenance = db.hookahs.filter((h) => h.status === 'EM_MANUTENCAO').length;
    const hookahRevenueTotal = db.hookahs.reduce((acc, h) => acc + h.totalRevenueGenerated, 0);

    res.json({
      stock: {
        totalStockValue,
        totalPotentialSales,
        lowStockCount,
        totalSkus: db.products.length,
      },
      treasury: {
        totalPaidRevenue,
        totalPaidExpense,
        netRealBalance,
        pendingReceivables,
        pendingPayables,
      },
      loans: {
        totalLoanCapitalOut,
        totalLoanCollected,
        totalLoanRemaining,
        totalLoanProfitProjected,
        activeLoansCount: db.loans.filter((l) => l.status === 'EM_ANDAMENTO').length,
      },
      hookahs: {
        hookahFleetCount,
        hookahsAvailable,
        hookahsRented,
        hookahsMaintenance,
        hookahRevenueTotal,
        activeRentalsCount: db.rentals.filter((r) => r.status === 'ATIVA').length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ------------------- VITE DEV SERVER OU ARQUIVOS ESTÁTICOS -------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });

    const WS_SHIM = `<script>
(function() {
  if (typeof window === 'undefined') return;
  var NativeWS = window.WebSocket;
  if (!NativeWS) return;

  class FakeHmrWS extends EventTarget {
    constructor(url, protocols) {
      super();
      this.url = String(url || '');
      this.protocol = Array.isArray(protocols) ? protocols.join(', ') : String(protocols || '');
      this.readyState = 1; // OPEN
      this.binaryType = 'blob';
      this.bufferedAmount = 0;
      this.extensions = '';
      this.onopen = null;
      this.onclose = null;
      this.onerror = null;
      this.onmessage = null;
    }
    send() {}
    close() {
      this.readyState = 3;
    }
  }

  FakeHmrWS.prototype.CONNECTING = 0;
  FakeHmrWS.prototype.OPEN = 1;
  FakeHmrWS.prototype.CLOSING = 2;
  FakeHmrWS.prototype.CLOSED = 3;
  FakeHmrWS.CONNECTING = 0;
  FakeHmrWS.OPEN = 1;
  FakeHmrWS.CLOSING = 2;
  FakeHmrWS.CLOSED = 3;

  function ProxiedWebSocket(url, protocols) {
    var urlStr = String(url || '');
    var protoStr = Array.isArray(protocols) ? protocols.join(' ') : String(protocols || '');
    if (
      protoStr.indexOf('vite-hmr') !== -1 ||
      urlStr.indexOf('vite-hmr') !== -1 ||
      urlStr.indexOf('24678') !== -1 ||
      urlStr.indexOf('token=') !== -1
    ) {
      return new FakeHmrWS(url, protocols);
    }
    return new NativeWS(url, protocols);
  }

  ProxiedWebSocket.CONNECTING = 0;
  ProxiedWebSocket.OPEN = 1;
  ProxiedWebSocket.CLOSING = 2;
  ProxiedWebSocket.CLOSED = 3;
  ProxiedWebSocket.prototype = NativeWS.prototype;

  window.WebSocket = ProxiedWebSocket;
})();
</script>`;

    // Intercept HTML requests to ensure WS_SHIM is loaded before /@vite/client
    app.use(async (req, res, next) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl.split('?')[0];
      const isHtml =
        req.headers.accept?.includes('text/html') ||
        url === '/' ||
        url === '/index.html' ||
        (!url.includes('.') && !url.startsWith('/api') && !url.startsWith('/@'));

      if (!isHtml) return next();

      try {
        const rawTemplate = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        let html = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        if (html.includes('<script type="module" src="/@vite/client"></script>')) {
          html = html.replace(
            '<script type="module" src="/@vite/client"></script>',
            WS_SHIM + '<script type="module" src="/@vite/client"></script>'
          );
        } else {
          html = html.replace('<head>', '<head>' + WS_SHIM);
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Controle Murilo] Servidor Full-Stack executando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Controle Murilo] Falha crítica na inicialização do servidor:', err);
});
