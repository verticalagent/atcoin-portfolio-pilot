FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do pacote
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Construir a aplicação
RUN npm run build

# Expor porta
EXPOSE 4173

# Comando para iniciar a aplicação
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]