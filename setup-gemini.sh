#!/bin/bash

echo "🚀 Configurando Google Gemini AI para ConcursoGenius..."
echo ""

# Verificar se o arquivo .env já existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe!"
    echo "📝 Conteúdo atual:"
    cat .env
    echo ""
    read -p "Deseja sobrescrever? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuração cancelada."
        exit 1
    fi
fi

echo ""
echo "🔑 Para obter sua API Key GRATUITA:"
echo "   1. Acesse: https://aistudio.google.com/app/apikey"
echo "   2. Faça login com sua conta Google"
echo "   3. Clique em 'Create API key'"
echo "   4. Copie a chave gerada"
echo ""

read -p "📋 Cole sua API Key do Gemini: " api_key

if [ -z "$api_key" ]; then
    echo "❌ API Key não pode estar vazia!"
    exit 1
fi

# Criar arquivo .env
echo "API_KEY=$api_key" > .env

echo ""
echo "✅ Configuração concluída!"
echo "📁 Arquivo .env criado com sua API Key"
echo ""
echo "🔒 Segurança:"
echo "   • Sua API Key está protegida no arquivo .env"
echo "   • Este arquivo não será enviado para o GitHub"
echo ""
echo "🚀 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Acesse: http://localhost:3000"
echo "   3. Comece a usar a IA!"
echo ""
echo "🆓 Limites gratuitos do Gemini:"
echo "   • 1.500 requests por dia"
echo "   • 1 milhão de tokens por minuto"
echo "   • 15 requests por minuto"
echo ""