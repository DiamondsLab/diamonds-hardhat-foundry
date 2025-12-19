# Troubleshooting Guide

This guide covers common issues when using `@diamondslab/diamonds-hardhat-foundry` in different projects.

## Table of Contents

- [DiamondDeployment.sol Generation Issues](#diamonddeploymentsol-generation-issues)
- [Forge Compilation Errors](#forge-compilation-errors)
- [Test Execution Failures](#test-execution-failures)
- [Import Resolution Problems](#import-resolution-problems)
- [Network and Deployment Issues](#network-and-deployment-issues)

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
