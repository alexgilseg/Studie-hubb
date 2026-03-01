#!/bin/bash
echo "🎓 Startar Studie-hubb..."
echo ""

# Kontrollera att Node.js finns
if ! command -v node &> /dev/null; then
  echo "❌ Node.js hittades inte. Installera Node.js från https://nodejs.org"
  exit 1
fi

# Installera dependencies om de saknas
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installerar beroenden..."
  cd backend && npm install && npm rebuild better-sqlite3 --python=python3 && cd ..
fi

echo "✅ Öppna http://localhost:3000 i din webbläsare"
echo "   Tryck Ctrl+C för att stänga"
echo ""

cd backend && node server.js
