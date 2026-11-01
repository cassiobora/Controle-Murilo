# Cérebro ERP — Sistema Integrado de Gestão Empresarial

O **Cérebro ERP** é uma plataforma corporativa full-stack de alto desempenho projetada para centralizar o controle operacional, comercial e financeiro com isolamento estrito de dados, tesouraria analítica com DRE gerencial, motor de empréstimos, gestão de aluguel de narguiles e auditoria imutável.

---

### Decisões Críticas e Preferências Confirmadas

> [!IMPORTANT]
> As decisões de design e regras fiscais foram validadas e incorporadas à arquitetura do sistema:

- **Estilo Visual e Ergonomia:** Interface *Dark Mode* executivo de alta densidade (`#0B0F19` canvas, `#111827` superfícies estruturais), com acentos estratégicos em esmeralda (`#10B981`) para liquidez/créditos e ciano (`#06B6D4`) para ações principais e KPIs de inteligência. Tipografia com números tabulares obrigatórios (`tabular-nums`) para integridade contábil.
- **Painel Inicial:** Visão Executiva Unificada com resumo consolidado de Tesouraria (Saldo Líquido Real, Entradas, Saídas, Previsões), DRE Sintética instantânea e atalhos rápidos para operações ativas de aluguel de narguiles e empréstimos de capital.
- **Regime Tributário Padrão da DRE:** Simples Nacional Comercial configurado inicialmente em 6,00% sobre a Receita Bruta, acompanhado de um motor de ajuste fino da alíquota fiscal permitindo recálculo instantâneo de impostos, deduções e margens.
- **Arquitetura de Segurança & RLS:** Autenticação por token JWT assinado criptograficamente com HMAC SHA-256, hash público de sessão gerado em tempo de execução para validação no frontend, papéis estritos (`Admin Master` vs. `Operador`), ledger de auditoria imutável (append-only) e rate-limiting ativo.

---

## 1. Visão Geral & Conceito Central

- **O que faz:** Centraliza cinco verticais operacionais essenciais em um ambiente coeso e reativo:
  1. *Estoque & Catálogo Inteligente:* Gestão de SKUs, grades de variação, Curva ABC por faturamento acumulado, índice de giro e ponto de pedido com alertas preditivos.
  2. *CRM Fiscal B2B/B2C:* Fichas cadastrais completas de Clientes (PF/PJ com CPF/CNPJ, endereços e histórico de compras) e Fornecedores (com Lead Time de entrega, termos FOB/CIF e chaves PIX).
  3. *Tesouraria Avançada & DRE Gerencial:* Livro caixa detalhado, modais avançados de lançamentos com juros/multas condicionais, parcelamento inteligente de N vezes com vencimentos individuais, extrato bancário por conta e DRE gerencial com EBITDA e Ponto de Equilíbrio.
  4. *Central de Inteligência de Empréstimos:* Controle de capital cedido, amortizações, cronograma de repasses e motor de juros simples/compostos com projeção de lucro líquido real da operação.
  5. *Gestão de Frota de Narguiles:* Controle de disponibilidade em tempo real (Disponível, Alugado, Manutenção), checklist de componentes (mangueiras, rosh, vaso, prato, pegador), histórico de avarias e receita gerada por item da frota.
  6. *Central de Relatórios & Exportação:* Relatórios com filtros dinâmicos e exportação nativa em Excel (.xlsx) e visualização pronta para impressão/PDF.
- **Público-Alvo:** Gestores executivos, operadores financeiros e proprietários de frotas de locação e centros de distribuição que demandam rigor matemático sem tolerância a dados fictícios estáticos.
- **Proposta de Valor:** Elimina planilhas desconexas, previne perdas de inventário e inadimplência, e fornece visibilidade contábil precisa do lucro líquido da empresa.

---

## 2. Experiência do Usuário & Design Visual

### Fluxos Principais de Usuário
1. **Autenticação & Sessão Confiável:** Login com credenciais seguras, geração de token JWT criptografado, exibição do hash de integridade da sessão no cabeçalho e chaveamento rápido entre perfis para auditoria.
2. **Dashboard Executivo Unificado:** Visão macro da saúde financeira (Saldo Líquido Real, Total Recebido no mês, Total Pago, Previsões a Receber/Pagar), velocímetro de ponto de equilíbrio e gráficos comparativos de receitas vs. despesas.
3. **Lançamento Financeiro Avançado (Modal Dedicado):**
   - Seleção de Fluxo (Entrada/A Receber vs. Saída/A Pagar)
   - Favorecido com autocompletar dinâmico e cadastro inline instantâneo (`+ Novo Favorecido`)
   - Plano de Contas Macro e Subcategorias
   - Parcelamento Inteligente com geração de cronograma de parcelas e recálculo de juros e multas
   - Dados de liquidação imediata (PIX, comprovante, conta bancária de origem)
4. **Inventário & Curva ABC:** Tabela com cálculo em tempo real do valor total em estoque, classificação automática A (80% da receita), B (15%) e C (5%), alertas de estoque baixo (< 10 unidades) e movimentação manual/automática de entrada/saída com justificativa.
5. **Painel do Proprietário de Narguiles:** Quadro Kanban/Grid da frota com tags de status, controle de devoluções com inspeção de acessórios e cálculo automático de diárias excedentes.
6. **Central de Empréstimos:** Cadastro de contratos, cronograma de parcelas, simulação de juros mensais e quitação parcial ou total com baixa automática na tesouraria.

### Identidade Visual & Diretrizes de Design
- **Paleta de Cores (60-30-10):**
  - *Canvas (60%):* Neutral Slate escuro `#0B0F19` e `#0F172A`.
  - *Superfícies Estruturais (30%):* Cards planos e tabelas em `#111827` com divisores sutis em hairline `border-slate-800`.
  - *Acentos de Ação & Semântica (10%):* Esmeralda `#10B981` (entradas, lucros, ativos), Ciano `#06B6D4` (ações primárias, contratos), Âmbar `#F59E0B` (pendências, alertas de reposição) e Carmesim `#EF4444` (saídas, avarias, atrasos).
- **Tipografia:** `Plus Jakarta Sans` para display, títulos e navegação corporativa; fontes tabulares monotípicas (`tabular-nums font-mono`) para todas as moedas (R$), datas, códigos SKU e taxas percentuais.
- **Top Bar Contract & Navegação:** Barra lateral fixa de 260px com ícones claros e rotulagem limpa, e cabeçalho unificado de topo exibindo a trilha de navegação (breadcrumbs), o hash público da sessão autenticada e o usuário ativo. Sem elementos puramente decorativos ou falsos tickers.

---

## 3. Decisões Técnicas de Arquitetura & Governança

- **Segurança de Sessão & Autenticação JWT:** Implementação de algoritmo HMAC SHA-256 com chave mestra segura em backend Node.js. O payload inclui `sub`, `role` (`ADMIN_MASTER` ou `OPERADOR`), `tenantId` e `sessionId`. No cliente, o hash hexadecimal da sessão é computado para garantir que a sessão ativa é válida e inviolável.
- **Isolamento de Dados (RLS Nativo):** Todas as queries e mutações de dados verificam o `tenantId` e permissões do usuário antes da persistência ou leitura, garantindo isolamento total por empresa/unidade.
- **Auditoria Imutável (Audit Trail Ledger):** Mecanismo de persistência que registra cada inserção, atualização ou exclusão lógica com `timestamp` ISO 8601, `ipAddress`, `userId`, `actionType`, `targetEntity` e `payloadDiff`. O registro não possui rota de deleção (imutabilidade garantida em nível de API).
- **Proteção Contra Força Bruta & Rate Limit:** Middlewares dedicados no servidor Express que limitam requisições repetitivas a rotas críticas (como login e exportação de relatórios).
- **Persistência de Dados Confiável:** Backend Express em TypeScript operando banco relacional estruturado com integridade referencial, queries transacionais e fallback persistente em disco (armazenamento JSON/SQLite relacional estruturado em `/data/cerebro_erp.db` ou persistência síncrona), garantindo que dados cadastrados persistam após reinicializações.

---

## 4. Diagrama de Arquitetura & Fluxo de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CÉREBRO ERP - FRONTEND                          │
│     React 19 + Tailwind CSS + Lucide Icons + Motion (Dark Executivo)   │
├───────────────────┬────────────────────────────────────────────────────┤
│  Navegação / Nav  │  Módulos Funcionais Reativos                       │
│  ├─ Dashboard     │  ├─ Tesouraria & Livro Caixa (Modal Parcelamento)   │
│  ├─ Estoque & SKU │  ├─ DRE Gerencial & Impostos Simples Nacional      │
│  ├─ CRM Completo  │  ├─ Gestão de Frota de Narguiles (Avarias/Status)  │
│  ├─ Empréstimos   │  ├─ Central de Inteligência de Empréstimos         │
│  └─ Relatórios    │  └─ Exportador Excel (XLSX) / Impressão PDF        │
└─────────┬──────────────────────────────────────────────────────────────┘
          │ Requisições REST seguras (Bearer JWT + Session Hash)
┌─────────▼──────────────────────────────────────────────────────────────┐
│                    BACKEND EXPRESS FULL-STACK (NODE.JS)                │
├────────────────────────────────────────────────────────────────────────┤
│  Middlewares: Rate Limiter · Helmet Headers · JWT HMAC SHA-256 Auth   │
│  RLS Enforcement: Tenant & Role Gatekeeper (Admin Master / Operador)   │
├────────────────────────────────────────────────────────────────────────┤
│  Serviços de Negócio:                                                  │
│  ├─ Motor Financeiro (Cálculo de Juros/Multa, DRE, Ponto de Equilíbrio)│
│  ├─ Motor Comercial (Curva ABC Ponderada, Giro de Estoque)             │
│  ├─ Motor de Contratos (Empréstimos de Capital & Locação Narguiles)    │
│  └─ Motor de Auditoria (Ledger de Auditoria Inviolável / Audit Trail)  │
├────────────────────────────────────────────────────────────────────────┤
│  Camada de Dados Relacional (Integridade Referencial & Schemas)        │
│  [Usuários] · [Produtos/SKUs] · [Clientes] · [Fornecedores]            │
│  [Lançamentos/Parcelas] · [Empréstimos] · [Frota Narguile] · [Ledger]  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Mapeamento de Estados e Tratamento de Erros

- **Modais com Validação Contábil Rigorosa:** Campos monetários impedem valores negativos acidentais, datas de vencimento anteriores à emissão emitem alerta, e parcelamentos validam se a soma das parcelas bate rigorosamente com o montante com juros.
- **Estados Visuais Completos:**
  - *Preenchido:* Tabelas de alta densidade com paginação ou virtualização leve e ordenação por colunas.
  - *Vazio:* Ilustrações contextuais com instrução clara e botão primário de primeiro cadastro.
  - *Carregamento:* Skeletons sem quebra de layout durante trocas assíncronas.
  - *Auditoria:* Visualizador em tempo real dos últimos registros de auditoria com filtros por usuário e ação.
- **Exportação:** Geração de planilhas Excel formatadas com fórmulas de soma e arquivos formatados para relatórios executivos.

---

## 6. Plano de Execução Passo a Passo

1. **Configuração de Dependências & Banco:** Instalar pacotes utilitários de alta performance (como `xlsx`, `canvas-confetti` para liquidação, etc.) e estruturar o backend Express com schemas relacionais, autenticação JWT com HMAC SHA-256, isolamento RLS e ledger de auditoria.
2. **Camada de Serviços & APIs do Backend:**
   - Rotas de autenticação, sessão e auditoria.
   - Rotas de produtos, movimentações de estoque e algoritmo de Curva ABC.
   - Rotas de CRM (clientes PF/PJ e fornecedores com lead time).
   - Rotas de tesouraria, lançamentos parcelados, centros de custo e DRE.
   - Rotas de empréstimos com cronograma financeiro e amortizações.
   - Rotas de frota de narguiles com histórico de danos e locações.
3. **Frontend do Sistema Cérebro ERP:**
   - Criação da estrutura de layout com sidebar executiva escura, cabeçalho de integridade de sessão e roteamento por abas dinâmicas.
   - Implementação do Dashboard Unificado com métricas consolidadas e gráficos sintéticos.
   - Implementação do Modal Avançado de Lançamento Financeiro com todos os campos exigidos (parcelamento, favorecido inline, juros dinâmicos, comprovante PIX).
   - Implementação da DRE com simulador de alíquota do Simples Nacional (6%).
   - Módulo de Estoque com Curva ABC e grades.
   - Módulos de CRM, Empréstimos e Aluguel de Narguiles.
   - Módulo de Auditoria Inviolável com visualização de logs criptografados.
   - Central de Relatórios com exportação XLSX e visualização para impressão/PDF.
4. **Verificação & Testes de Integridade:** Validação de compilação TypeScript, verificação de rotas e consistência contábil sem dados mockados vazios.
