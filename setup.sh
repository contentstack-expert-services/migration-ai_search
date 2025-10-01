#!/bin/bash
set -e

echo "======================================="
echo " 🛠️  AI Search Assistant Setup Script "
echo "======================================="

# --- Check dependencies ---
check_command() {
  if ! command -v "$1" &> /dev/null
  then
    echo "❌ $1 not found."
    return 1
  else
    echo "✅ $1 found."
    return 0
  fi
}

echo "🔍 Checking prerequisites..."
check_command docker || { echo "👉 Install Docker: https://docs.docker.com/get-docker/"; exit 1; }
check_command docker-compose || { echo "👉 Install Docker Compose: https://docs.docker.com/compose/install/"; exit 1; }
check_command curl || { echo "👉 Install curl before running this script."; exit 1; }
check_command jq || { echo "👉 Install jq: brew install jq (Mac) OR sudo apt-get install jq (Linux)"; exit 1; }

# --- Detect OS for Ollama host ---
OS_TYPE=$(uname -s)
if [[ "$OS_TYPE" == "Darwin" ]]; then
  OLLAMA_HOST_URL="http://host.docker.internal:11434"
  echo "🖥️  Detected macOS → using $OLLAMA_HOST_URL"
elif [[ "$OS_TYPE" == "Linux" ]]; then
  HOST_IP=$(hostname -I | awk '{print $1}')
  OLLAMA_HOST_URL="http://$HOST_IP:11434"
  echo "🐧 Detected Linux → using $OLLAMA_HOST_URL"
else
  OLLAMA_HOST_URL="http://host.docker.internal:11434"
  echo "⚠️ Unknown OS, defaulting to $OLLAMA_HOST_URL"
fi

# --- Check Ollama ---
if ! check_command ollama; then
  echo "❌ Ollama not found."
  if [[ "$OS_TYPE" == "Darwin" ]]; then
    echo "👉 Install Ollama on Mac:"
    echo "   brew install ollama"
    echo "   ollama serve"
  elif [[ "$OS_TYPE" == "Linux" ]]; then
    echo "👉 Install Ollama on Linux:"
    echo "   curl -fsSL https://ollama.com/install.sh | sh"
    echo "   ollama serve"
  fi
  exit 1
fi

# --- Pull Ollama model ---
echo "📥 Pulling Ollama model llama3..."
ollama pull llama3 || {
  echo "❌ Failed to pull Ollama model. Make sure Ollama is running with: ollama serve"
  exit 1
}

# --- Setup .env ---
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env <<EOL
# Pinecone
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=docs

# Ollama
OLLAMA_HOST=$OLLAMA_HOST_URL
EOL
  echo "⚠️  Please edit .env and add your Pinecone API key."
else
  echo "✅ .env file already exists (not overwritten)."
fi

# --- Validate Pinecone key ---
source .env
if [[ "$PINECONE_API_KEY" == "your_pinecone_key" ]]; then
  echo "⚠️ Pinecone API key not set. Please update .env before running the app."
else
  echo "🔍 Validating Pinecone API key..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Api-Key: $PINECONE_API_KEY" \
    https://api.pinecone.io/indexes)
  if [[ "$RESPONSE" == "200" ]]; then
    echo "✅ Pinecone API key is valid."
  else
    echo "❌ Pinecone API key check failed (HTTP $RESPONSE). Please verify your key in .env."
    exit 1
  fi
fi

# --- Build + Run Docker ---
echo "🐳 Building Docker images..."
docker compose build --no-cache

echo "🚀 Starting containers..."
docker compose up -d

echo "======================================="
echo " ✅ Setup complete! "
echo "---------------------------------------"
echo "Frontend → http://localhost"
echo "Backend  → http://localhost:4000"
echo
echo "👉 Put your docs inside backend/docs/ and restart with:"
echo "   docker compose restart backend"
echo
echo "👉 Remember to run Ollama separately with:"
echo "   ollama serve"
echo "======================================="
