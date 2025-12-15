# @diamondslab/diamonds-hardhat-foundry

[![npm version](https://badge.fury.io/js/@diamondslab%2Fdiamonds-hardhat-foundry.svg)](https://www.npmjs.com/package/@diamondslab/diamonds-hardhat-foundry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Hardhat plugin that seamlessly integrates Foundry testing with [ERC-2535 Diamond](https://eips.ethereum.org/EIPS/eip-2535) proxy contracts. This plugin provides deployment helpers, test scaffolding, and automated test generation for Diamond-based smart contracts using Foundry's powerful testing framework.

## Features

- 🚀 **Automated Diamond Deployment** - Deploy Diamond contracts with a single command
- 📝 **Helper Generation** - Automatically generate Solidity helpers with deployment data
- 🧪 **Test Scaffolding** - Create unit, integration, and fuzz test templates
- 🔧 **Hardhat Tasks** - CLI tasks for init, deploy, generate, and test workflows
- 🎯 **Programmatic API** - Use framework classes directly in scripts
- 📚 **Base Contracts** - Reusable Solidity utilities and test base classes
- ⚡ **Foundry Integration** - Leverage Forge's speed and fuzzing capabilities
- 🔗 **Diamonds Ecosystem** - Works seamlessly with `@diamondslab/diamonds` and `@diamondslab/hardhat-diamonds`

## Installation

```bash
npm install --save-dev @diamondslab/diamonds-hardhat-foundry
# or
yarn add -D @diamondslab/diamonds-hardhat-foundry
# or
pnpm add -D @diamondslab/diamonds-hardhat-foundry
```

### Prerequisites

- **Foundry**: Install from [getfoundry.sh](https://getfoundry.sh/)
- **Hardhat**: `^2.26.0` or later
- **Peer Dependencies**:
  - `@diamondslab/diamonds` - Core Diamond deployment library
  - `@diamondslab/hardhat-diamonds` - Hardhat Diamond configuration helpers

```bash
npm install --save-dev @diamondslab/diamonds @diamondslab/hardhat-diamonds hardhat
```

## Quick Start

### 1. Configure Hardhat

Import the plugin in your `hardhat.config.ts`:

```typescript
import "@diamondslab/diamonds-hardhat-foundry";
import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  
  // Optional: Configure diamonds-foundry settings
  diamondsFoundry: {
    helpersDir: "test/foundry/helpers",
    generateExamples: true,
    exampleTests: ["unit", "integration", "fuzz"],
    defaultNetwork: "hardhat",
    reuseDeployment: false,
    forgeTestArgs: ["-vvv"]
  }
};

export default config;
```

### 2. Initialize Test Structure

```bash
npx hardhat diamonds-forge:init
```

This creates:
```
test/foundry/
├── helpers/           # Generated Diamond deployment helpers
├── unit/              # Unit test examples
├── integration/       # Integration test examples
└── fuzz/              # Fuzz test examples
```

### 3. Deploy Your Diamond

```bash
npx hardhat diamonds-forge:deploy --diamond-name YourDiamond --network hardhat
```

### 4. Generate Helpers

```bash
npx hardhat diamonds-forge:generate-helpers --diamond-name YourDiamond
```

This generates `test/foundry/helpers/DiamondDeployment.sol` with:
- Diamond contract address
- All facet addresses
- Helper functions for test setup

### 5. Run Foundry Tests

```bash
npx hardhat diamonds-forge:test
```

## Hardhat Tasks

### `diamonds-forge:init`

Initialize the Foundry test directory structure.

**Options:**
- `--helpers-dir <path>` - Custom directory for helpers (default: `test/foundry/helpers`)
- `--examples` - Generate example tests (default: from config)
- `--force` - Overwrite existing files

**Example:**
```bash
npx hardhat diamonds-forge:init --helpers-dir test/forge/helpers --examples
```

### `diamonds-forge:deploy`

Deploy a Diamond contract to the specified network.

**Options:**
- `--diamond-name <name>` - Name of the Diamond to deploy (default: from config)
- `--network <name>` - Network to deploy to (default: `hardhat`)
- `--reuse` - Reuse existing deployment if found (default: from config)
- `--force` - Force new deployment even if one exists

**Example:**
```bash
npx hardhat diamonds-forge:deploy --diamond-name MyDiamond --network sepolia
```

### `diamonds-forge:generate-helpers`

Generate Solidity helper contract with deployment data.

**Options:**
- `--diamond-name <name>` - Name of the Diamond (default: from config)
- `--output-dir <path>` - Output directory for helpers (default: from config)
- `--network <name>` - Network to use for deployment data (default: `hardhat`)

**Example:**
```bash
npx hardhat diamonds-forge:generate-helpers --diamond-name MyDiamond --output-dir test/foundry/helpers
```

### `diamonds-forge:test`

Run Foundry tests with optional deployment and helper generation.

**Options:**
- `--diamond-name <name>` - Diamond to deploy/test (default: from config)
- `--network <name>` - Network for deployment (default: from config)
- `--skip-deployment` - Skip deployment step
- `--skip-helpers` - Skip helper generation step
- `--match-test <pattern>` - Run tests matching pattern
- `--match-contract <pattern>` - Run tests in matching contracts
- `--verbosity <level>` - Forge verbosity level (1-5)
- `--gas-report` - Show gas usage report

**Example:**
```bash
# Run all tests with gas reporting
npx hardhat diamonds-forge:test --gas-report

# Run specific tests with high verbosity
npx hardhat diamonds-forge:test --match-test "testOwnership" --verbosity 4

# Skip deployment (use existing)
npx hardhat diamonds-forge:test --skip-deployment --match-contract "MyTest"
```

## Programmatic API

Use the framework classes directly in your scripts:

```typescript
import hre from "hardhat";
import { 
  ForgeFuzzingFramework, 
  DeploymentManager, 
  HelperGenerator 
} from "@diamondslab/diamonds-hardhat-foundry";

// Deploy a Diamond
const deployer = new DeploymentManager(hre);
await deployer.deploy("MyDiamond", "hardhat");

// Generate helpers
const generator = new HelperGenerator(hre);
await generator.scaffoldProject();
await generator.generateDeploymentHelpers("MyDiamond", "hardhat");

// Run tests
const framework = new ForgeFuzzingFramework(hre);
await framework.runTests({
  diamondName: "MyDiamond",
  networkName: "hardhat",
  skipDeployment: false,
  skipHelpers: false,
  forgeTestOptions: {
    matchTest: "testFuzz",
    verbosity: 3
  }
});
```

### DeploymentManager

Manages Diamond contract deployments.

**Methods:**
- `deploy(diamondName, networkName, force?)` - Deploy a Diamond
- `getDeployment(diamondName, networkName, chainId?)` - Get deployment data
- `ensureDeployment(diamondName, networkName, force?)` - Deploy if needed
- `hasDeploymentRecord(diamondName, networkName)` - Check if deployment exists

### HelperGenerator

Generates Solidity test helpers and examples.

**Methods:**
- `scaffoldProject(outputDir?, generateExamples?)` - Create test directory structure
- `generateDeploymentHelpers(diamondName, networkName, outputDir?)` - Generate DiamondDeployment.sol
- `generateExampleTests(testTypes?, outputDir?)` - Generate example test files

### ForgeFuzzingFramework

Orchestrates the complete test workflow.

**Methods:**
- `runTests(options)` - Run complete test workflow
- `deployOnly(diamondName?, networkName?, force?)` - Deploy only
- `generateHelpersOnly(diamondName?, networkName?, outputDir?)` - Generate helpers only

## Configuration

Configure the plugin in `hardhat.config.ts`:

```typescript
export default {
  diamondsFoundry: {
    // Directory for generated helper contracts
    helpersDir: "test/foundry/helpers",
    
    // Whether to generate example tests during init
    generateExamples: true,
    
    // Types of example tests to generate
    exampleTests: ["unit", "integration", "fuzz"],
    
    // Default network for deployments
    defaultNetwork: "hardhat",
    
    // Reuse existing deployments instead of redeploying
    reuseDeployment: false,
    
    // Default arguments to pass to forge test
    forgeTestArgs: ["-vv", "--gas-report"]
  }
};
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `helpersDir` | `string` | `"test/foundry/helpers"` | Directory for generated helpers |
| `generateExamples` | `boolean` | `true` | Generate example tests on init |
| `exampleTests` | `array` | `["unit", "integration", "fuzz"]` | Types of examples to generate |
| `defaultNetwork` | `string` | `"hardhat"` | Default deployment network |
| `reuseDeployment` | `boolean` | `false` | Reuse existing deployments |
| `forgeTestArgs` | `string[]` | `[]` | Default forge test arguments |

## Base Contracts

The plugin provides base Solidity contracts for your tests:

### DiamondForgeHelpers

Utility functions for Diamond testing:

```solidity
import "@diamondslab/diamonds-hardhat-foundry/contracts/DiamondForgeHelpers.sol";

contract MyTest is Test {
    using DiamondForgeHelpers for *;
    
    function testDiamond() public {
        address diamond = DiamondForgeHelpers.getDiamondAddress();
        DiamondForgeHelpers.logDiamondInfo(diamond);
        DiamondForgeHelpers.assertValidDiamond(diamond);
    }
}
```

### DiamondFuzzBase

Base contract for fuzz tests:

```solidity
import "@diamondslab/diamonds-hardhat-foundry/contracts/DiamondFuzzBase.sol";

contract MyFuzzTest is DiamondFuzzBase {
    function setUp() public override {
        super.setUp();
        // Your setup
    }
    
    function testFuzz_Transfer(address to, uint256 amount) public {
        assumeValidAddress(to);
        amount = boundValue(amount, 1, 1000 ether);
        // Test logic
    }
}
```

## Usage Examples

### Example 1: Deploy and Test

```bash
# Initialize project
npx hardhat diamonds-forge:init

# Deploy Diamond
npx hardhat diamonds-forge:deploy --diamond-name MyDiamond

# Run tests
npx hardhat diamonds-forge:test
```

### Example 2: Custom Workflow

```typescript
import hre from "hardhat";
import { ForgeFuzzingFramework } from "@diamondslab/diamonds-hardhat-foundry";

async function main() {
  const framework = new ForgeFuzzingFramework(hre);
  
  // Deploy only
  await framework.deployOnly("MyDiamond", "sepolia");
  
  // Generate helpers
  await framework.generateHelpersOnly("MyDiamond", "sepolia");
  
  // Run specific tests
  await framework.runTests({
    skipDeployment: true,
    skipHelpers: true,
    forgeTestOptions: {
      matchContract: "MyIntegrationTest",
      verbosity: 4
    }
  });
}

main().catch(console.error);
```

### Example 3: CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  foundry-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-rs/foundry-toolchain@v1
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npx hardhat diamonds-forge:deploy
      - run: npx hardhat diamonds-forge:test --gas-report
```

## Integration with Existing Diamonds Projects

This plugin is designed to work seamlessly with existing `@diamondslab/diamonds` projects:

1. **Use your existing Diamond configuration** - The plugin reads from your project's Diamond deployment configuration
2. **LocalDiamondDeployer integration** - Works with your project's `LocalDiamondDeployer` class
3. **Deployment records** - Uses the same deployment record format as `@diamondslab/diamonds`
4. **Hardhat configuration** - Integrates with `@diamondslab/hardhat-diamonds` settings

**Example with existing Diamond:**

```typescript
// Your existing hardhat.config.ts
import "@diamondslab/hardhat-diamonds";
import "@diamondslab/diamonds-hardhat-foundry";

export default {
  diamonds: {
    diamondsPath: "./diamonds",
    deploymentsPath: "./diamonds/ExampleDiamond/deployments"
  },
  diamondsFoundry: {
    helpersDir: "test/foundry/helpers",
    defaultNetwork: "hardhat"
  }
};
```

## Troubleshooting

### Foundry Not Found

**Error:** `Foundry not installed`

**Solution:** Install Foundry from [getfoundry.sh](https://getfoundry.sh/):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### LocalDiamondDeployer Not Found

**Error:** `LocalDiamondDeployer not found`

**Solution:** Ensure you have a `LocalDiamondDeployer` class in your project at `scripts/setup/LocalDiamondDeployer.ts`. This is required for Diamond deployments.

### Deployment Record Not Found

**Error:** `No deployment record found`

**Solution:** Deploy your Diamond first:
```bash
npx hardhat diamonds-forge:deploy --diamond-name YourDiamond
```

### Generated Helpers Not Compiling

**Error:** Compilation errors in `DiamondDeployment.sol`

**Solution:** Ensure:
1. Foundry is properly installed
2. Your `foundry.toml` includes the correct remappings
3. The Diamond was successfully deployed before generating helpers

### Peer Dependency Warnings

**Warning:** `@diamondslab/diamonds not found`

**Solution:** Install required peer dependencies:
```bash
npm install --save-dev @diamondslab/diamonds @diamondslab/hardhat-diamonds
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [DiamondsLab](https://github.com/diamondslab)

## Links

- [GitHub Repository](https://github.com/diamondslab/diamonds-hardhat-foundry)
- [npm Package](https://www.npmjs.com/package/@diamondslab/diamonds-hardhat-foundry)
- [@diamondslab/diamonds](https://github.com/diamondslab/diamonds)
- [@diamondslab/hardhat-diamonds](https://github.com/diamondslab/hardhat-diamonds)
- [ERC-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535)
- [Foundry Book](https://book.getfoundry.sh/)
