# Migration Guide: v1.x to v2.0.0

This guide helps you upgrade `@diamondslab/diamonds-hardhat-foundry` from version 1.x to 2.0.0.

## Overview of Changes

Version 2.0.0 introduces significant architectural improvements:

1. **LocalDiamondDeployer** moved to peer dependency (`@diamondslab/hardhat-diamonds`)
2. **Helper contracts** now importable as package resources
3. **Enhanced test templates** with package imports
4. **Improved type safety** with better TypeScript type extensions

## Breaking Changes

### 1. LocalDiamondDeployer Now from Peer Dependency

**What Changed:**

Previously, `LocalDiamondDeployer` was bundled within `diamonds-hardhat-foundry`. Now it's imported from the `@diamondslab/hardhat-diamonds` peer dependency.

**Why:**

- Eliminates code duplication across packages
- Ensures single source of truth for deployment logic
- Improves maintainability and reduces bundle size
- Enables better version management

**Impact:**

- No impact on users of the Hardhat tasks (CLI workflow)
- Only affects users accessing `DeploymentManager` programmatically

**Action Required:**

Ensure `@diamondslab/hardhat-diamonds` is installed as a peer dependency:

```bash
npm install --save-dev @diamondslab/hardhat-diamonds
# or
yarn add -D @diamondslab/hardhat-diamonds
```

**Code Changes (Programmatic API Only):**

If you're using `DeploymentManager` directly in scripts:

**Before (v1.x):**
```typescript
import { DeploymentManager } from "@diamondslab/diamonds-hardhat-foundry";

// LocalDiamondDeployer was loaded dynamically from workspace
const manager = new DeploymentManager(hre, diamondName);
```

**After (v2.0.0):**
```typescript
import { DeploymentManager } from "@diamondslab/diamonds-hardhat-foundry";
// LocalDiamondDeployer now imported from peer dependency automatically
// No code changes required - works the same way

const manager = new DeploymentManager(hre, diamondName);
```

> **Note**: If you get module resolution errors, ensure `@diamondslab/hardhat-diamonds` is installed and its type extensions are loading properly. The package includes proper type declarations.

### 2. Helper Contracts Now Importable

**What's New:**

Three helper contracts are now available as importable package resources:

- `DiamondFuzzBase.sol` - Abstract base for fuzz tests
- `DiamondForgeHelpers.sol` - Utility library for assertions and validation
- `DiamondABILoader.sol` - ABI file loading and parsing

**Why:**

- Enables code reuse across projects
- Provides standardized testing patterns
- Offers comprehensive NatSpec documentation
- Supports extensibility via virtual functions

**Action Required:**

Update your test file imports to use the package paths.

## Step-by-Step Upgrade Instructions

### Step 1: Update Dependencies

Update `package.json` dependencies:

```json
{
  "devDependencies": {
    "@diamondslab/diamonds-hardhat-foundry": "^2.0.0",
    "@diamondslab/hardhat-diamonds": "workspace:^",  // or "^1.0.0" from npm
    "@diamondslab/diamonds": "workspace:^",          // or "^1.0.0" from npm
    "@nomicfoundation/hardhat-ethers": "^3.0.8",
    "ethers": "^6.0.0",
    "hardhat": "^2.26.0"
  }
}
```

Install dependencies:

```bash
yarn install
# or
npm install
```

### Step 2: Update Test Imports (Optional)

If you want to use the new helper contracts, update your test files.

**Example: Migrating to DiamondFuzzBase**

**Before (v1.x - custom base contract):**
```solidity
// test/foundry/fuzz/MyTest.t.sol
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../helpers/DiamondDeployment.sol";

contract MyFuzzTest is Test {
    address diamond;

    function setUp() public {
        diamond = DiamondDeployment.diamond();
        // Manual setup code
    }

    function testFuzz_Something(address user) public {
        vm.assume(user != address(0));
        // Test logic
    }
}
```

**After (v2.0.0 - using DiamondFuzzBase):**
```solidity
// test/foundry/fuzz/MyTest.t.sol
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "@diamondslab/diamonds-hardhat-foundry/contracts/DiamondFuzzBase.sol";
import "@diamondslab/diamonds-hardhat-foundry/contracts/DiamondForgeHelpers.sol";
import "../helpers/DiamondDeployment.sol";

contract MyFuzzTest is DiamondFuzzBase {
    using DiamondForgeHelpers for address;

    function _loadDiamondAddress() internal view override returns (address) {
        return DiamondDeployment.diamond();
    }

    function setUp() public override {
        super.setUp(); // Loads Diamond and ABI automatically
        // Your additional setup
    }

    function testFuzz_Something(address user) public {
        // Built-in validation helper
        vm.assume(DiamondForgeHelpers.isValidTestAddress(user));
        
        // Use DiamondFuzzBase helpers
        bytes4 selector = bytes4(keccak256("someFunction(address)"));
        (bool success, ) = _callDiamond(selector, abi.encode(user));
        assertTrue(success);
    }
}
```

### Step 3: Verify Build and Tests

Run a full build and test cycle:

```bash
# Build TypeScript
yarn build

# Run Foundry tests
npx hardhat diamonds-forge:test

# Or directly with forge
forge test
```

### Step 4: Review Generated Templates

If you use `diamonds-forge:init` to generate new test files, the templates now include package imports automatically:

```bash
npx hardhat diamonds-forge:init --diamond-name MyDiamond
```

Check the generated files in `test/foundry/` to see the new import patterns.

## Common Migration Scenarios

### Scenario 1: CLI-Only Usage (No Migration Needed)

If you only use the Hardhat tasks and don't write custom Foundry tests:

```bash
npx hardhat diamonds-forge:deploy --diamond-name MyDiamond
npx hardhat diamonds-forge:generate-helpers --diamond-name MyDiamond
npx hardhat diamonds-forge:test
```

✅ **No changes required** - Just install peer dependencies and upgrade.

### Scenario 2: Custom Tests with Local Helpers

If you have custom Foundry tests using local helper contracts:

✅ **No changes required** - Your local helpers continue to work. Optionally migrate to package helpers for standardization.

### Scenario 3: Programmatic API Usage

If you use `DeploymentManager`, `HelperGenerator`, or `ForgeFuzzingFramework` in scripts:

**Before (v1.x):**
```typescript
import { DeploymentManager } from "@diamondslab/diamonds-hardhat-foundry";

const manager = new DeploymentManager(hre, "MyDiamond");
await manager.deploy({ network: "hardhat" });
```

**After (v2.0.0):**
```typescript
import { DeploymentManager } from "@diamondslab/diamonds-hardhat-foundry";

// Ensure hardhat-diamonds plugin is imported
import "@diamondslab/hardhat-diamonds";
import "@nomicfoundation/hardhat-ethers";

const manager = new DeploymentManager(hre, "MyDiamond");
await manager.deploy({ network: "hardhat" }); // Works the same!
```

Add these imports to your `hardhat.config.ts`:

```typescript
import "@diamondslab/diamonds-hardhat-foundry";
import "@diamondslab/hardhat-diamonds";      // Required for v2.0.0+
import "@nomicfoundation/hardhat-ethers";
```

## Troubleshooting

### Module Resolution Errors

**Problem:**
```
Error: Cannot find module '@diamondslab/hardhat-diamonds'
```

**Solution:**
Install the peer dependency:
```bash
npm install --save-dev @diamondslab/hardhat-diamonds
```

### TypeScript Type Errors

**Problem:**
```typescript
Property 'diamonds' does not exist on type 'HardhatRuntimeEnvironment'
```

**Solution:**
Ensure type extensions are loaded by importing the plugins in `hardhat.config.ts`:

```typescript
import "@diamondslab/diamonds-hardhat-foundry";
import "@diamondslab/hardhat-diamonds";
import "@nomicfoundation/hardhat-ethers";

import type { HardhatUserConfig } from "hardhat/config";
```

### Solidity Import Errors

**Problem:**
```
Error: Source "@diamondslab/diamonds-hardhat-foundry/contracts/DiamondFuzzBase.sol" not found
```

**Solution:**

1. Ensure package is installed: `yarn install`
2. Check your `foundry.toml` includes node_modules in libs:
   ```toml
   [profile.default]
   libs = ["node_modules", "lib"]
   ```
3. Run `forge remappings` to verify the import path is correct

### Peer Dependency Warnings

**Problem:**
```
npm WARN @diamondslab/diamonds-hardhat-foundry@2.0.0 requires a peer of @diamondslab/hardhat-diamonds@workspace:^ but none is installed.
```

**Solution:**
Install the peer dependency (use actual version if not in workspace):
```bash
npm install --save-dev @diamondslab/hardhat-diamonds@^1.0.0
```

## Benefits of Upgrading

### 1. Better Modularity
- LocalDiamondDeployer is now maintained in one place
- Easier to update deployment logic across all packages

### 2. Standardized Testing Patterns
- Reusable base contracts eliminate boilerplate
- Comprehensive helper libraries for common operations
- Virtual functions enable custom extensions

### 3. Improved Documentation
- All helper contracts have detailed NatSpec comments
- Usage examples in documentation
- Type-safe APIs with full TypeScript support

### 4. Future-Proof
- Cleaner architecture for upcoming features
- Better separation of concerns
- More maintainable codebase

## Need Help?

- **Documentation**: [README.md](./README.md)
- **Issues**: [GitHub Issues](https://github.com/diamondslab/diamonds-hardhat-foundry/issues)
- **Examples**: Check the test templates generated by `diamonds-forge:init`

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the complete list of changes in v2.0.0.
