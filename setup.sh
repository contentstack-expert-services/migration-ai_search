#!/bin/bash
set -e

echo "======================================="
echo " 🛠️  AI Search Assistant Auto Setup "
echo "======================================="

OS_TYPE=$(uname -s)

install_if_missing() {
  local cmd=$1
  local install_mac=$2
  local install_linux=$3

  if ! command -v "$cmd" &> /dev/null; then
    echo "❌ $cmd not found. Installing..."
    if [[ "$OS_TYPE" == "Darwin" ]]; then
      if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      fi
      eval "$install_mac"
    elif [[ "$OS_TYPE" == "Linux" ]]; then
      sudo apt-get update -y
      eval "$install_linux"
    else
      echo "⚠️ Unsupported OS. Please install $cmd manually."
      exit 1
    fi
  else
    echo "✅ $cmd found."
  fi
}

# --- Install required tools ---
echo "🔍 Checking prerequisites..."
install_if_missing docker "brew install --cask docker" "sudo apt-get install -y docker.io"
install_if_missing docker-compose "brew install docker-compose" "sudo apt-get install -y docker-compose"
install_if_missing curl "brew install curl" "sudo apt-get install -y curl"
install_if_missing jq "brew install jq" "sudo apt-get install -y jq"

# --- Detect OS for Ollama host ---
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

# --- Install Ollama ---
if ! command -v ollama &> /dev/null; then
  echo "❌ Ollama not found. Installing..."
  if [[ "$OS_TYPE" == "Darwin" ]]; then
    brew install ollama
  elif [[ "$OS_TYPE" == "Linux" ]]; then
    curl -fsSL https://ollama.com/install.sh | sh
  fi
else
  echo "✅ Ollama found."
fi

# --- Ensure Ollama is running ---
echo "▶️ Starting Ollama in background..."
ollama serve &> /dev/null &

# --- Pull model ---
echo "📥 Pulling Ollama model llama3..."
ollama pull llama3

# --- Setup .env ---
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env <<EOL
# Pinecone
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=docs

# Ollama
OLLAMA_HO_
