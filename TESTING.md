# Testing with @diamondslab/diamonds-hardhat-foundry

## Overview

This package provides two testing approaches for Diamond contracts using Foundry:

1. **Self-Deploying Tests** - Tests that deploy their own Diamond in `setUp()`
2. **Deployed Diamond Tests** - Tests that use a pre-deployed Diamond via `DiamondFuzzBase`

## Test Types

### Self-Deploying Tests ✅

These tests work with any network (including the default "hardhat" network):

```solidity
contract MyTest is Test {
    Diamond diamond;
    
    function setUp() public {
        // Deploy Diamond in the test
        diamond = new Diamond(owner, address(diamondCutFacet));
        // ...
    }
}
```

**Examples:**
- `test/foundry/integration/BasicDiamondIntegration.t.sol`
- `test/foundry/unit/ExampleConstantsFacet.t.sol`

These tests run in Forge's isolated EVM and don't require network forking.

### Deployed Diamond Tests ⚠️

These tests access a Diamond deployed by Hardhat:

```solidity
contract MyTest is DiamondFuzzBase {
    function _loadDiamondAddress() internal view override returns (address) {
        return DiamondDeployment.getDiamondAddress();
    }
}
```

**Examples:**
- `test/foundry/fuzz/ExampleFuzz.t.sol`
- `test/foundry/integration/BasicDiamondIntegrationDeployed.t.sol`
- `test/foundry/invariant/DiamondProxyInvariant.t.sol`

**Requirements:**
- ✅ Must use a **persistent network** (localhost, sepolia, etc.)
- ✅ Network must be **running** before tests
- ❌ Will fail with ephemeral "hardhat" network

## Correct Usage

### For Self-Deploying Tests

```bash
npx hardhat diamonds-forge:test
```

Works with default "hardhat" network ✅

### For Deployed Diamond Tests

**Step 1:** Start Hardhat node in a separate terminal

```bash
npx hardhat node
```

**Step 2:** Deploy and test

```bash
npx hardhat diamonds-forge:test --network localhost
```

This uses `--fork-url http://127.0.0.1:8545` to fork from the running node ✅

## Why Tests Fail with Default Network

When you run:

```bash
npx hardhat diamonds-forge:test  # Uses "hardhat" network by default
```

Here's what happens:

1. ✅ **Hardhat creates ephemeral in-memory blockchain**
2. ✅ **Diamond is deployed to this blockchain**
3. ✅ **Helper files are generated with deployment address**
4. ❌ **Forge tests run in SEPARATE isolated EVM**
5. ❌ **Diamond address has no code in Forge's EVM**
6. ❌ **Tests fail: "Diamond has no code"**

The "hardhat" network is destroyed after each task, so Forge can't fork from it.

## Network Comparison

| Network | Type | Can Fork? | Use Case |
|---------|------|-----------|----------|
| hardhat | Ephemeral | ❌ No | Self-deploying tests only |
| localhost | Persistent | ✅ Yes | Deployed Diamond tests |
| sepolia | Persistent | ✅ Yes | Testnet testing |
| mainnet | Persistent | ✅ Yes | Mainnet fork testing |

## Troubleshooting

### Error: "Diamond has no code"

**Cause:** Test extends `DiamondFuzzBase` but running without forking

**Solution:** Use `--network localhost` with a running Hardhat node

```bash
# Terminal 1
npx hardhat node

# Terminal 2  
npx hardhat diamonds-forge:test --network localhost
```

### Error: "Connection refused"

**Cause:** Trying to fork but Hardhat node isn't running

**Solution:** Start Hardhat node first

```bash
npx hardhat node
```

### Some tests pass, others fail

**Cause:** Mix of self-deploying and deployed Diamond tests

**Solution:**
- Self-deploying tests work with any network
- Deployed Diamond tests require `--network localhost`

To run only self-deploying tests:
```bash
npx hardhat diamonds-forge:test --match-contract "BasicDiamond"
```

To run deployed Diamond tests:
```bash
# Start node first!
npx hardhat diamonds-forge:test --network localhost --match-contract "Fuzz"
```

## Best Practices

### For Development

Use localhost network for comprehensive testing:

```bash
# Terminal 1 (keep running)
npx hardhat node

# Terminal 2 (run tests)
npx hardhat diamonds-forge:test --network localhost
```

### For CI/CD

1. Start Hardhat node in background
2. Wait for it to be ready
3. Run tests with --network localhost
4. Kill node after tests

```bash
npx hardhat node &
NODE_PID=$!
sleep 5  # Wait for node to start
npx hardhat diamonds-forge:test --network localhost
kill $NODE_PID
```

### Writing Tests

**For unit tests** - Use self-deploying approach:
```solidity
contract MyUnitTest is Test {
    function setUp() public {
        diamond = new Diamond(...);
    }
}
```

**For fuzz/integration tests** - Use DiamondFuzzBase:
```solidity
contract MyFuzzTest is DiamondFuzzBase {
    function _loadDiamondAddress() internal view override returns (address) {
        return DiamondDeployment.getDiamondAddress();
    }
}
```

Then run with `--network localhost`.

## Summary

- **Default network (hardhat)**: Use for self-deploying tests
- **Localhost network**: Use for deployed Diamond tests (requires `npx hardhat node`)
- **DiamondFuzzBase**: Requires forking, use with persistent networks only
- **Test.sol**: Works everywhere, deploys its own contracts

Choose the right approach based on your testing needs!
