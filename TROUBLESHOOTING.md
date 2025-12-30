# Troubleshooting Guide

This guide covers common issues when using `@diamondslab/diamonds-hardhat-foundry` in different projects.

## Table of Contents

- [DiamondDeployment.sol Generation Issues](#diamonddeploymentsol-generation-issues)
- [Forge Compilation Errors](#forge-compilation-errors)
- [Test Execution Failures](#test-execution-failures)
- [Import Resolution Problems](#import-resolution-problems)
- [Network and Deployment Issues](#network-and-deployment-issues)
- [Coverage Task Issues](#coverage-task-issues)

---

## DiamondDeployment.sol Generation Issues

### Problem: Helper Generated with Empty Address

**Symptoms:**
```
✓ Generated: /path/to/test/foundry/helpers/DiamondDeployment.sol
ℹ Diamond Address: 
ℹ Facets Included: 0
```

**Root Cause:** Deployment record not found or empty.

**Solution 1: Deploy with --force flag**

```bash
npx hardhat diamonds-forge:deploy \
  --diamond-name YourDiamond \
  --network localhost \
  --force
```

**Solution 2: Verify Hardhat node is running**

```bash
# Terminal 1: Start node
npx hardhat node

# Terminal 2: Deploy and test
npx hardhat diamonds-forge:deploy --diamond-name YourDiamond --network localhost
npx hardhat diamonds-forge:test --diamond-name YourDiamond --network localhost
```

**Solution 3: Check deployment file exists**

```bash
ls -la diamonds/YourDiamond/deployments/
# Expected: yourdiamondname-localhost-31337.json
```

If missing:
```bash
npx hardhat diamonds-forge:deploy \
  --diamond-name YourDiamond \
  --network localhost \
  --force
```

### Problem: Wrong Network/ChainId

**Symptoms:** Deployment file exists but helper still has empty address.

**Root Cause:** Network name or chainId mismatch between deployment and generation.

**Solution:**

Check your `hardhat.config.ts`:

```typescript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337, // Must match Hardhat node
  },
},
```

Always use the same network name consistently:

```bash
# Deploy
npx hardhat diamonds-forge:deploy --diamond-name YourDiamond --network localhost

# Generate helpers (uses same network)
npx hardhat diamonds-forge:generate-helpers --diamond-name YourDiamond --network localhost

# Test (uses same network)
npx hardhat diamonds-forge:test --diamond-name YourDiamond --network localhost
```

---

## Forge Compilation Errors

### Problem: "Undeclared identifier" for DiamondFuzzBase functions

**Symptoms:**
```
Error (7576): Undeclared identifier.
  --> test/foundry/fuzz/YourTest.t.sol:19:9:
   |
19 |         loadDiamond();
   |         ^^^^^^^^^^^
```

**Root Cause:** Missing imports in test file.

**Solution:**

Add proper imports at the top of your test file:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {DiamondFuzzBase} from "@diamondslab/diamonds-hardhat-foundry/contracts/DiamondFuzzBase.sol";
import {DiamondDeployment} from "../helpers/DiamondDeployment.sol";

contract YourTest is DiamondFuzzBase, Test {
    function setUp() public override {
        super.setUp();
        loadDiamond();
    }
    
    // ... tests
}
```

**Check remappings** in `foundry.toml`:

```toml
[profile.default]
remappings = [
    "@diamondslab/diamonds-hardhat-foundry/=node_modules/@diamondslab/diamonds-hardhat-foundry/",
    "forge-std/=node_modules/forge-std/src/"
]
```

### Problem: Cannot find DiamondDeployment

**Symptoms:**
```
Error: Could not find module "../helpers/DiamondDeployment.sol"
```

**Root Cause:** DiamondDeployment.sol was not generated.

**Solution:**

Generate the helper first:

```bash
npx hardhat diamonds-forge:generate-helpers \
  --diamond-name YourDiamond \
  --network localhost
```

Verify it was created:

```bash
cat test/foundry/helpers/DiamondDeployment.sol | head -20
```

### Problem: Wrong Diamond ABI Path

**Symptoms:**
```
Error: ABI file not found: ./diamond-abi/ExampleDiamond.json
```

**Root Cause:** Test is using hardcoded `ExampleDiamond` instead of your Diamond name.

**Solution:**

Override `_getDiamondABIPath()` in your test:

```solidity
import {DiamondDeployment} from "../helpers/DiamondDeployment.sol";

contract YourTest is DiamondFuzzBase {
    // Override to use generated ABI path
    function _getDiamondABIPath() internal view override returns (string memory) {
        return DiamondDeployment.getDiamondABIPath();
    }
    
    // Override to use generated address
    function _loadDiamondAddress() internal view override returns (address) {
        return DiamondDeployment.getDiamondAddress();
    }
}
```

**Or** ensure your Diamond ABI file matches the expected name:

```bash
ls diamond-abi/
# Should contain: YourDiamond.json (not ExampleDiamond.json)
```

---

## Test Execution Failures

### Problem: "Diamond has no code" error

**Symptoms:**
```
Error: Diamond at 0x... has no code
```

**Root Cause:** Test is trying to access Diamond on a different network than where it was deployed.

**Solution:**

Ensure Hardhat node is running and use `--network localhost`:

```bash
# Terminal 1: Keep running
npx hardhat node

# Terminal 2: Test
npx hardhat diamonds-forge:test --diamond-name YourDiamond --network localhost
```

**Verify Diamond is deployed:**

```bash
npx hardhat console --network localhost
```

Then in the console:
```javascript
const addr = "0x..."; // Your Diamond address from DiamondDeployment.sol
const code = await ethers.provider.getCode(addr);
console.log("Code length:", code.length);
// Should be > 2 (more than just "0x")
```

### Problem: Tests pass individually but fail when run together

**Root Cause:** State pollution between tests.

**Solution:**

Ensure each test properly resets state in `setUp()`:

```solidity
function setUp() public override {
    super.setUp();
    loadDiamond();
    
    // Initialize Diamond if needed
    diamond.call(abi.encodeWithSignature("diamondInitialize000()"));
    
    // Grant roles needed for tests
    vm.prank(owner);
    diamond.call(abi.encodeWithSignature("grantRole(bytes32,address)", DEFAULT_ADMIN_ROLE, address(this)));
}
```

Forge automatically snapshots state before each test and reverts after.

---

## Import Resolution Problems

### Problem: Module not found errors

**Symptoms:**
```
Error: Cannot find module '@diamondslab/diamonds-hardhat-foundry/contracts/DiamondFuzzBase.sol'
```

**Solution 1: Install the package**

```bash
yarn add -D @diamondslab/diamonds-hardhat-foundry
# or
npm install --save-dev @diamondslab/diamonds-hardhat-foundry
```

**Solution 2: Configure Foundry remappings**

Create or update `foundry.toml`:

```toml
[profile.default]
src = "contracts"
out = "out"
libs = ["node_modules"]

remappings = [
    "@diamondslab/diamonds-hardhat-foundry/=node_modules/@diamondslab/diamonds-hardhat-foundry/",
    "forge-std/=node_modules/forge-std/src/",
    "@openzeppelin/=node_modules/@openzeppelin/"
]
```

**Solution 3: Generate remappings automatically**

```bash
forge remappings > remappings.txt
```

### Problem: Duplicate contract definitions

**Symptoms:**
```
Error: Duplicate contract definition for 'Test'
```

**Root Cause:** Multiple inheritance of `Test` contract.

**Solution:**

Import `Test` only once and inherit from it once:

```solidity
import "forge-std/Test.sol";
import {DiamondFuzzBase} from "@diamondslab/diamonds-hardhat-foundry/contracts/DiamondFuzzBase.sol";

// DiamondFuzzBase already inherits from Test, so just inherit from DiamondFuzzBase
contract YourTest is DiamondFuzzBase {
    // ...
}
```

**NOT:**
```solidity
// ❌ Wrong - double inheritance
contract YourTest is Test, DiamondFuzzBase {
```

---

## Network and Deployment Issues

### Problem: Cannot connect to localhost:8545

**Symptoms:**
```
Error: Could not connect to http://127.0.0.1:8545
```

**Solution:**

Start Hardhat node:

```bash
npx hardhat node
```

Keep it running in a separate terminal.

### Problem: Deployment not persisting

**Symptoms:** Deployment works but no file is created.

**Root Cause:** `writeDeployedDiamondData` might be false.

**Solution:**

The `diamonds-forge:deploy` task should automatically save deployments. If using custom deployment scripts:

```typescript
const config: LocalDiamondDeployerConfig = {
  diamondName: "YourDiamond",
  networkName: "localhost",
  provider: provider,
  chainId: (await provider.getNetwork()).chainId,
  writeDeployedDiamondData: true, // ← Must be true
  configFilePath: "diamonds/YourDiamond/yourdiamondconfig.json",
};
```

---

## Clean State Recovery

If all else fails, start from a clean state:

```bash
# Stop any running nodes
pkill -f "hardhat node"

# Clean everything
rm -rf diamonds/YourDiamond/deployments/*.json
rm -f test/foundry/helpers/DiamondDeployment.sol
forge clean

# Start fresh
npx hardhat node &
sleep 5

# Deploy
npx hardhat diamonds-forge:deploy \
  --diamond-name YourDiamond \
  --network localhost \
  --force

# Generate helpers
npx hardhat diamonds-forge:generate-helpers \
  --diamond-name YourDiamond \
  --network localhost

# Verify helper
cat test/foundry/helpers/DiamondDeployment.sol | grep "DIAMOND_ADDRESS"

# Test
npx hardhat diamonds-forge:test \
  --diamond-name YourDiamond \
  --network localhost
```

---

## Coverage Task Issues

### Problem: Coverage Command Shows "No Tests Found"

**Symptoms:**
```
ℹ Executing: forge coverage --fork-url http://127.0.0.1:8545
No tests match the provided pattern
```

**Root Cause:** Test filtering patterns are too restrictive or tests aren't in the expected location.

**Solution 1: Check test file locations**

```bash
# Verify tests exist
find test/foundry -name "*.t.sol" -type f
```

**Solution 2: Remove test filters**

```bash
# Run without filters first
npx hardhat diamonds-forge:coverage --diamond-name YourDiamond

# Then add specific patterns
npx hardhat diamonds-forge:coverage --diamond-name YourDiamond --match-contract "Unit"
```

**Solution 3: Check forge configuration**

Verify `foundry.toml` has correct test paths:

```toml
[profile.default]
test = "test/foundry"
src = "contracts"
out = "artifacts/forge"
```

### Problem: LCOV Report File Not Generated

**Symptoms:**
```
✓ Coverage completed
ℹ Report file: coverage/lcov.info
(But file doesn't exist)
```

**Root Cause:** Output directory doesn't exist or insufficient permissions.

**Solution 1: Create output directory**

```bash
mkdir -p coverage
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --report lcov \
  --report-file coverage/lcov.info
```

**Solution 2: Use absolute path**

```bash
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --report lcov \
  --report-file "$PWD/coverage/lcov.info"
```

**Solution 3: Check file permissions**

```bash
ls -la coverage/
chmod 755 coverage/
```

### Problem: Coverage Shows 0% for All Contracts

**Symptoms:**
```
| Contract      | Line % | Statement % | Branch % | Function % |
|--------------|--------|-------------|----------|-----------|
| MyFacet      | 0.00%  | 0.00%      | 0.00%   | 0.00%     |
```

**Root Cause:** Tests aren't actually executing contract functions, or coverage is excluding your contracts.

**Solution 1: Verify tests are passing**

```bash
# Run tests first to ensure they work
npx hardhat diamonds-forge:test --diamond-name YourDiamond
```

**Solution 2: Check --no-match-coverage patterns**

Remove exclusion patterns that might be too broad:

```bash
# Don't exclude everything
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --no-match-coverage "test/*" \
  --no-match-coverage "script/*"
```

**Solution 3: Enable debug output**

```bash
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --verbosity 3 \
  --report debug
```

### Problem: "Fork URL Connection Failed"

**Symptoms:**
```
Error: Failed to connect to fork URL: http://127.0.0.1:8545
```

**Root Cause:** Hardhat node is not running, or network configuration is incorrect.

**Solution 1: Start Hardhat node**

```bash
# Terminal 1: Start node
npx hardhat node

# Terminal 2: Run coverage
npx hardhat diamonds-forge:coverage --diamond-name YourDiamond --network localhost
```

**Solution 2: Verify network configuration**

Check `hardhat.config.ts`:

```typescript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
  },
}
```

**Solution 3: Check for port conflicts**

```bash
# See if port 8545 is already in use
lsof -i :8545

# Kill conflicting process if needed
kill -9 <PID>
```

### Problem: "Out of Memory" During Coverage

**Symptoms:**
```
Error: JavaScript heap out of memory
```

**Root Cause:** Large codebase or too many tests running simultaneously.

**Solution 1: Increase Node memory**

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond
```

**Solution 2: Run coverage on subsets**

```bash
# Run coverage for unit tests only
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --match-path "test/foundry/unit/*"

# Then integration tests
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --match-path "test/foundry/integration/*"
```

**Solution 3: Reduce test scope**

```bash
# Focus on specific contracts
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --match-contract "MyFacet" \
  --no-match-coverage "test/*,mock/*,lib/*"
```

### Problem: LCOV Version Incompatibility with CI Tools

**Symptoms:**
```
Coveralls error: Invalid LCOV format
```

**Root Cause:** CI tool expects different LCOV version than what's generated.

**Solution: Specify LCOV version**

```bash
# For older CI tools (use v1)
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --report lcov \
  --lcov-version v1 \
  --report-file coverage/lcov.info

# For modern CI tools (use v2)
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --report lcov \
  --lcov-version v2 \
  --report-file coverage/lcov.info
```

**Verify LCOV version:**

```bash
head -1 coverage/lcov.info
# Should show: TN: or SF: depending on version
```

### Problem: "Diamond Has No Code" During Coverage

**Symptoms:**
```
Error: Diamond contract has no code at address 0x...
```

**Root Cause:** Diamond wasn't deployed before running coverage.

**Solution: Deploy first**

The coverage task should handle this automatically, but if it doesn't:

```bash
# Explicitly deploy first
npx hardhat diamonds-forge:deploy \
  --diamond-name YourDiamond \
  --network localhost \
  --force

# Then run coverage
npx hardhat diamonds-forge:coverage \
  --diamond-name YourDiamond \
  --network localhost
```

**For more coverage documentation, see:**
- [Coverage Guide](../../docs/FOUNDRY_FORGE_DIAMONDS_COVERAGE.md) - Complete usage guide
- [README.md](./README.md#diamonds-forgecoverage) - Quick reference

---

## Getting More Help

If these solutions don't work:

1. Check the [README.md](./README.md) for usage examples
2. Check [TESTING.md](./TESTING.md) for test patterns
3. Review [MIGRATION.md](./MIGRATION.md) if upgrading from v1.x
4. Open an issue on [GitHub](https://github.com/DiamondsLab/diamonds-hardhat-foundry/issues) with:
   - Output of failed command
   - Contents of deployment file
   - Your `hardhat.config.ts` diamonds configuration
   - Package version: `yarn list @diamondslab/diamonds-hardhat-foundry`
