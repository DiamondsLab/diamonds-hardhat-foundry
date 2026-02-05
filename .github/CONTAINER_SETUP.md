# GitHub Actions Container Setup - Epic 2

This document describes the GitHub Actions container setup implemented in Epic 2 of the Diamonds CI/CD Project Plan.

## Overview

This implementation configures GitHub Actions to use a custom DevContainer for all CI jobs, ensuring environment parity between local development and CI/CD execution.

## Components

### 1. DevContainer Configuration (`.devcontainer/`)

The DevContainer provides a consistent development environment with all necessary tools pre-installed.

**Key Features:**
- **Base Image:** Node.js 20 (Bookworm)
- **Tools Installed:**
  - Node.js 20
  - Yarn 4.10.3 (via Corepack, not apt - this ensures we get the modern Yarn version)
  - Foundry suite (Forge, Cast, Anvil, Chisel) installed for vscode user
  - Git
  - Build essentials for native dependencies
- **VS Code Integration:** Pre-configured extensions and settings for TypeScript, Solidity, ESLint, and Prettier

**Files:**
- `.devcontainer/Dockerfile` - Container image definition
- `.devcontainer/devcontainer.json` - VS Code DevContainer configuration

### 2. DevContainer Build Workflow (`.github/workflows/build-devcontainer.yml`)

Automatically builds and publishes the DevContainer image to GitHub Container Registry (GHCR).

**Triggers:**
- Push to `main` or `develop` branches when `.devcontainer/**` files change
- Manual workflow dispatch

**Features:**
- Docker layer caching for faster builds
- Multi-tag strategy (branch, SHA, latest) for flexible image references
- Automatic GHCR authentication using `GITHUB_TOKEN`

**Published Images:**
- `ghcr.io/diamondslab/diamonds-hardhat-foundry-devcontainer:latest` - Always points to the latest main branch build
- `ghcr.io/diamondslab/diamonds-hardhat-foundry-devcontainer:main` - Human-readable branch tag
- `ghcr.io/diamondslab/diamonds-hardhat-foundry-devcontainer:main-<sha>` - Immutable SHA-based tag for reproducible builds

### 3. CI Workflow (`.github/workflows/ci.yml`)

Main CI workflow using the DevContainer for all jobs.

**Jobs:**

1. **validate-container** - Validates container setup
   - Checks tool versions (Node.js, Yarn, Hardhat, Forge, Git)
   - Validates environment variables
   - Tests dependency installation performance (< 5 minutes)
   - Runs basic build to ensure compilation works

2. **compile** - TypeScript compilation
   - Installs dependencies
   - Builds TypeScript to `dist/`
   - Uploads build artifacts for other jobs

3. **test** - Run test suite
   - Downloads build artifacts
   - Runs all tests with Mocha

4. **lint** - Code quality checks
   - Runs Prettier format check
   - Runs ESLint

5. **security** - Security scanning
   - Runs Snyk security scan (if `SNYK_TOKEN` is set)
   - Continues on error to not block PR merges

**Container Configuration:**
- All jobs run in the same DevContainer image from GHCR
- Yarn cache is mounted as a volume for faster dependency installation
- Environment variables are passed to jobs as needed

### 4. Container Validation Script (`scripts/test-container-setup.sh`)

Standalone bash script for validating container setup.

**Checks:**
- Node.js version
- Yarn version
- Hardhat availability
- Foundry tools (Forge, Cast, Anvil)
- Solc compiler
- Git version
- Environment variables (SNYK_TOKEN, ETHERSCAN_API_KEY, RPC URLs)
- Dependency installation time
- Basic build functionality

**Usage:**
```bash
# Run full validation including dependency install and build
./scripts/test-container-setup.sh

# Skip install and build for quick checks
SKIP_INSTALL=true ./scripts/test-container-setup.sh
```

## Required GitHub Secrets

Configure these secrets in your repository settings for full functionality:

- **`SNYK_TOKEN`** (Required for security scanning) - Get from https://snyk.io/
- **`ETHERSCAN_API_KEY`** (Optional) - For contract verification
- **`MAINNET_RPC_URL`** (Optional) - For mainnet forking tests
- **`SEPOLIA_RPC_URL`** (Optional) - For Sepolia testnet tests

**Note:** The CI workflow will work without these secrets but some features will be limited.

## Permissions

The workflows require the following permissions:

**Build DevContainer:**
- `contents: read` - Checkout repository
- `packages: write` - Push to GHCR

**CI Workflow:**
- `contents: read` - Checkout repository
- `packages: read` - Pull from GHCR

These permissions are automatically granted via `GITHUB_TOKEN`.

## Performance Optimizations

1. **Docker Layer Caching** - Uses GitHub Actions cache for Docker layers
2. **Yarn Cache Volume** - Mounts Yarn cache as volume across jobs
3. **Build Artifact Sharing** - Compiles once, uses artifacts in test job
4. **Parallel Job Execution** - Lint and security run in parallel with compile

## Benefits

- ✅ **Environment Parity** - Same container locally and in CI
- ✅ **Reproducible Builds** - Locked tool versions
- ✅ **Fast Execution** - Optimized caching strategies
- ✅ **Easy Onboarding** - Single container setup for all developers
- ✅ **Security** - Automated security scanning with Snyk
- ✅ **Quality** - Automated linting and formatting checks

## Troubleshooting

### Container Image Not Found

If CI fails with "container image not found":

1. Check that the build-devcontainer workflow has run successfully
2. Verify GHCR permissions are correctly set
3. Try manually triggering the build-devcontainer workflow

### Dependency Installation Timeout

If dependencies take longer than the configured threshold (defined as MAX_INSTALL_TIME_SECONDS=300 in the validation script):

1. Check if Yarn cache volume is properly mounted
2. Verify network connectivity in the runner
3. Consider adding specific package caching strategies

### Tool Not Found Errors

If a tool (forge, hardhat, etc.) is not found:

1. Verify the tool is installed in the Dockerfile
2. Check PATH environment variables
3. Rebuild the DevContainer image

## Next Steps

After Epic 2, the following improvements can be made:

- Add code coverage reporting
- Implement automated deployments
- Add performance benchmarking
- Integrate additional security scanning tools
- Add automated release workflows

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [DevContainers Specification](https://containers.dev/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
