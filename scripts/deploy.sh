#!/bin/bash

# BIA Trading Platform - Deploy Script for Google Cloud Platform
# Este script automatiza o processo de deploy no Google Cloud

set -e

# Configurações
PROJECT_ID=${1:-"seu-projeto-gcp"}
REGION=${2:-"us-central1"}
SERVICE_NAME="bia-trading"

echo "🚀 Iniciando deploy do BIA Trading Platform"
echo "📋 Projeto: $PROJECT_ID"
echo "🌍 Região: $REGION"
echo "⚙️  Serviço: $SERVICE_NAME"

# Verificar se o gcloud está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Erro: Você não está autenticado no gcloud."
    echo "Execute: gcloud auth login"
    exit 1
fi

# Configurar projeto
echo "🔧 Configurando projeto..."
gcloud config set project $PROJECT_ID

# Habilitar APIs necessárias
echo "📡 Habilitando APIs necessárias..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build da aplicação
echo "🔨 Construindo aplicação..."
npm install
npm run build

# Build da imagem Docker
echo "🐳 Construindo imagem Docker..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

# Push da imagem para GCR
echo "⬆️  Enviando imagem para Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy no Cloud Run
echo "🚀 Fazendo deploy no Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 4173 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production

# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "✅ Deploy concluído com sucesso!"
echo "🌐 URL do serviço: $SERVICE_URL"

# Opcional: Configurar domínio personalizado
read -p "🤔 Deseja configurar um domínio personalizado? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "📝 Digite o domínio: " DOMAIN
    gcloud run domain-mappings create --service $SERVICE_NAME --domain $DOMAIN --region $REGION
    echo "🎯 Domínio $DOMAIN configurado. Não se esqueça de configurar os registros DNS."
fi

echo "🎉 Deploy do BIA Trading Platform finalizado!"
echo "📊 Dashboard: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"