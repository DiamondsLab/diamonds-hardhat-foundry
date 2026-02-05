#!/bin/bash
set -e

# Configuration
MAX_INSTALL_TIME_SECONDS=300  # 5 minutes

echo "=== Container Setup Validation ==="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "✓ Node.js: $NODE_VERSION"

# Check Yarn version
echo "Checking Yarn version..."
YARN_VERSION=$(yarn --version)
echo "✓ Yarn: $YARN_VERSION"

# Check if Hardhat is available (via npx)
echo "Checking Hardhat availability..."
if npx hardhat --version > /dev/null 2>&1; then
  HARDHAT_VERSION=$(npx hardhat --version)
  echo "✓ Hardhat: $HARDHAT_VERSION"
else
  echo "⚠ Hardhat not installed globally (will be available after yarn install)"
fi

# Check Forge (Foundry)
echo "Checking Forge (Foundry)..."
if command -v forge > /dev/null 2>&1; then
  FORGE_VERSION=$(forge --version | head -n1)
  echo "✓ Forge: $FORGE_VERSION"
else
  echo "⚠ Forge not found (may need to install Foundry)"
fi

# Check Solc
echo "Checking Solc..."
if command -v solc > /dev/null 2>&1; then
  SOLC_VERSION=$(solc --version | grep Version)
  echo "✓ Solc: $SOLC_VERSION"
else
  echo "⚠ Solc not found (will be installed by Foundry/Hardhat as needed)"
fi

# Check Git
echo "Checking Git..."
GIT_VERSION=$(git --version)
echo "✓ Git: $GIT_VERSION"

# Check Cast (Foundry)
echo "Checking Cast (Foundry)..."
if command -v cast > /dev/null 2>&1; then
  CAST_VERSION=$(cast --version | head -n1)
  echo "✓ Cast: $CAST_VERSION"
else
  echo "⚠ Cast not found (part of Foundry suite)"
fi

# Check Anvil (Foundry)
echo "Checking Anvil (Foundry)..."
if command -v anvil > /dev/null 2>&1; then
  echo "✓ Anvil: available"
else
  echo "⚠ Anvil not found (part of Foundry suite)"
fi

# Check environment variables (optional)
echo ""
echo "=== Environment Variables ==="
if [ -n "$SNYK_TOKEN" ]; then
  echo "✓ SNYK_TOKEN is set"
else
  echo "⚠ SNYK_TOKEN not set (required for security scanning)"
fi

if [ -n "$ETHERSCAN_API_KEY" ]; then
  echo "✓ ETHERSCAN_API_KEY is set"
else
  echo "⚠ ETHERSCAN_API_KEY not set (optional for contract verification)"
fi

if [ -n "$MAINNET_RPC_URL" ]; then
  echo "✓ MAINNET_RPC_URL is set"
else
  echo "⚠ MAINNET_RPC_URL not set (optional for mainnet forking)"
fi

if [ -n "$SEPOLIA_RPC_URL" ]; then
  echo "✓ SEPOLIA_RPC_URL is set"
else
  echo "⚠ SEPOLIA_RPC_URL not set (optional for Sepolia testnet)"
fi

# Test dependency installation if requested
if [ "$SKIP_INSTALL" != "true" ]; then
  echo ""
  echo "=== Testing Dependency Installation ==="
  START_TIME=$(date +%s)
  yarn install
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  echo "✓ Dependencies installed in ${DURATION} seconds"
  
  if [ $DURATION -gt $MAX_INSTALL_TIME_SECONDS ]; then
    echo "⚠ WARNING: Installation took more than $MAX_INSTALL_TIME_SECONDS seconds ($DURATION seconds)"
  else
    echo "✓ Installation completed within $MAX_INSTALL_TIME_SECONDS seconds"
  fi
  
  # Test basic compilation
  echo ""
  echo "=== Testing Basic Build ==="
  yarn build
  echo "✓ Build successful"
else
  echo ""
  echo "⚠ Skipping dependency installation and build (SKIP_INSTALL=true)"
fi

echo ""
echo "=== Container Validation Complete ==="
