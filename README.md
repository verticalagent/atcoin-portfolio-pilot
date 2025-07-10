# 🤖 BIA Trading Platform

> **B**lockchain **I**ntelligence **A**lgorithmic Trading Platform - Sistema avançado de trading automatizado com IA

[![Deploy Status](https://img.shields.io/badge/deploy-success-green)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](package.json)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Deploy](#-deploy)
- [API](#-api)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🎯 Sobre o Projeto

A **BIA Trading Platform** é uma solução completa de trading algorítmico que combina inteligência artificial, análise técnica avançada e automação para otimizar operações no mercado de criptomoedas. O sistema oferece:

- **Trading Automatizado**: Estratégias de IA que operam 24/7
- **Análise em Tempo Real**: Monitoramento contínuo de mercados
- **Gestão de Risco**: Controles automáticos de perda e lucro
- **Interface Intuitiva**: Dashboard completo para controle total

## ✨ Funcionalidades

### 🤖 Trading Automatizado
- Múltiplas estratégias de trading (SMA, RSI, Bollinger Bands)
- Execução automática de ordens
- Backtesting de estratégias
- Rebalanceamento de portfólio

### 📊 Dashboard Analítico
- Visualização em tempo real do portfólio
- Gráficos interativos de preços
- Métricas de performance
- Histórico de operações

### 🔐 Segurança
- Autenticação JWT com Supabase
- Criptografia de chaves API
- Row Level Security (RLS)
- Rate limiting e proteção DDoS

### 🔄 Integrações
- Binance API
- Coinbase Pro API
- Kraken API
- Mais exchanges em desenvolvimento

## 🛠 Tecnologias

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Recharts** - Gráficos e visualizações

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados
- **Edge Functions** - Serverless computing
- **Row Level Security** - Segurança de dados

### Infrastructure
- **Docker** - Containerização
- **Google Cloud Platform** - Cloud hosting
- **Nginx** - Proxy reverso
- **Redis** - Cache e sessões

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Docker](https://www.docker.com/) (opcional, para containerização)
- [Git](https://git-scm.com/)
- Conta no [Supabase](https://supabase.com/)
- Chaves API de exchanges (Binance, etc.)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/bia-trading.git
cd bia-trading
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# APIs (opcionais para desenvolvimento)
BINANCE_API_KEY=sua_binance_api_key
BINANCE_SECRET_KEY=sua_binance_secret_key
```

### 4. Execute a aplicação
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run preview
```

## ⚙️ Configuração

### 1. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/)
2. Execute as migrações SQL (incluídas no projeto)
3. Configure as variáveis de ambiente
4. Ative a autenticação por email

### 2. Configuração de Chaves API

1. Acesse **Configurações > Chaves API**
2. Adicione suas chaves da Binance/outras exchanges
3. Configure permissões de trading
4. Ative o modo testnet para testes

### 3. Criação de Estratégias

1. Vá para **Configurações > Estratégias**
2. Crie uma nova estratégia
3. Configure parâmetros de risco
4. Ative a estratégia

## 🎮 Uso

### Dashboard Principal
- Visualize performance do portfólio em tempo real
- Monitore posições ativas
- Acompanhe PnL diário/mensal

### Gestão de Estratégias
- Crie e edite estratégias personalizadas
- Configure parâmetros de risco
- Execute backtests

### Monitoramento
- Logs de sistema em tempo real
- Alertas de trading
- Relatórios de performance

## 🚀 Deploy

### Deploy no Google Cloud Platform

#### 1. Usando Cloud Run (Recomendado)
```bash
# Configure o projeto
gcloud config set project SEU_PROJETO_ID

# Execute o script de deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh SEU_PROJETO_ID us-central1
```

#### 2. Usando App Engine
```bash
# Deploy direto
gcloud app deploy app.yaml

# Com configurações personalizadas
gcloud app deploy --project SEU_PROJETO_ID
```

#### 3. Usando Kubernetes (GKE)
```bash
# Criar cluster
gcloud container clusters create bia-trading-cluster

# Deploy
kubectl apply -f kubernetes/
```

### Deploy com Docker

#### 1. Build local
```bash
docker build -t bia-trading .
docker run -p 4173:4173 bia-trading
```

#### 2. Usando docker-compose
```bash
docker-compose up -d
```

### Variáveis de Ambiente para Produção

```env
NODE_ENV=production
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
```

## 📡 API

### Endpoints Principais

#### Autenticação
```http
POST /auth/login
POST /auth/register
POST /auth/logout
```

#### Trading
```http
GET /api/portfolio
GET /api/strategies
POST /api/strategies
PUT /api/strategies/:id
DELETE /api/strategies/:id
```

#### Market Data
```http
GET /api/prices/:symbol
GET /api/history/:symbol
GET /api/markets
```

### Edge Functions

#### Binance Service
```javascript
// Executar ordem
const response = await fetch('/functions/v1/binance-service', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'placeOrder',
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    quantity: 0.001
  })
});
```

#### Trading Engine
```javascript
// Executar estratégia
const response = await fetch('/functions/v1/trading-engine', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'executeStrategy',
    strategyId: 'uuid-da-estrategia'
  })
});
```

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
src/
├── components/          # Componentes React
├── contexts/           # Contextos do React
├── hooks/              # Hooks customizados
├── integrations/       # Integrações (Supabase)
├── pages/              # Páginas da aplicação
└── lib/                # Utilitários

supabase/
├── functions/          # Edge Functions
└── migrations/         # Migrações SQL

kubernetes/             # Manifests Kubernetes
scripts/               # Scripts de deploy
```

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm run test

# Lint
npm run lint

# Type check
npm run type-check
```

## 🔒 Segurança

### Medidas Implementadas
- **Autenticação JWT** com refresh tokens
- **Criptografia** de chaves API sensíveis
- **Rate limiting** em endpoints críticos
- **CORS** configurado adequadamente
- **HTTPS** obrigatório em produção
- **Sanitização** de inputs

### Boas Práticas
- Nunca comite chaves API no código
- Use variáveis de ambiente para configurações
- Mantenha dependências atualizadas
- Configure alertas de segurança

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm run test

# Testes unitários
npm run test:unit

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📈 Monitoramento

### Métricas Disponíveis
- Performance de estratégias
- Latência de API
- Uso de recursos
- Erros e exceptions

### Logs
```bash
# Ver logs do Cloud Run
gcloud logging read "resource.type=cloud_run_revision"

# Ver logs locais
docker-compose logs -f
```

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes
- Siga os padrões de código existentes
- Escreva testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use conventional commits

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

### Problemas Comuns

#### 1. Erro de autenticação
```bash
# Verificar configuração do Supabase
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

#### 2. Falha na conexão com exchange
- Verifique se as chaves API estão corretas
- Confirme permissões na exchange
- Teste no modo sandbox primeiro

#### 3. Problemas de deploy
```bash
# Verificar logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Contato
- 📧 Email: suporte@biatrading.com
- 💬 Discord: [BIA Trading Community](https://discord.gg/biatrading)
- 📚 Documentação: [docs.biatrading.com](https://docs.biatrading.com)

---

<div align="center">

**🤖 Desenvolvido com ❤️ pela equipe BIA Trading**

[Website](https://biatrading.com) • [Documentation](https://docs.biatrading.com) • [Support](mailto:suporte@biatrading.com)

</div>