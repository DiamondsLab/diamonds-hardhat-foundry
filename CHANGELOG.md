# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Dynamic Helper Generation**: DiamondDeployment.sol now generated dynamically from deployment records
  - No more hardcoded addresses in test helpers
  - Automatic regeneration on each deployment
  - Network-specific helpers for multi-network testing
  - Helper library pattern for clean imports
- **Deployment Management Improvements**:
  - Ephemeral deployment mode (default) - deploy in-memory without persisting records
  - Persistent deployment mode - save deployment records for reuse
  - `--save-deployment` flag to persist deployment records
  - `--use-deployment` flag to load existing deployments
  - `--force-deploy` flag to force redeployment
  - Smart deployment detection and reuse
- **Enhanced Test Task Flags**:
  - `--match-test <pattern>` - Filter tests by name pattern
  - `--match-contract <contract>` - Filter tests by contract name
  - `--match-path <path>` - Filter tests by file path
  - `--verbosity <1-5>` - Control Forge output verbosity
  - `--gas-report` - Display gas usage reports
  - `--coverage` - Generate coverage reports
  - `--skip-helpers` - Skip helper generation step
  - `--helpers-dir <path>` - Custom helpers output directory
- **Snapshot/Restore Support**:
  - `DiamondForgeHelpers.snapshotState()` - Take blockchain state snapshot
  - `DiamondForgeHelpers.revertToSnapshot()` - Restore to saved snapshot
  - Uses Foundry's `vm.snapshotState()` and `vm.revertToState()` (no deprecation warnings)
  - Comprehensive snapshot examples in `SnapshotExample.t.sol`
  - Full documentation in TESTING.md
- **Integration Tests**:
  - 40+ integration tests covering all framework functionality
  - DeploymentIntegrationTest - validates deployment management
  - HelperGenerationTest - validates dynamic helper generation
  - EndToEndTest - validates complete workflows
  - DiamondABILoaderTest - validates ABI parsing
  - ExampleIntegrationTest - demonstrates multi-facet interactions
  - BasicDiamondIntegration - self-deploying test pattern
  - BasicDiamondIntegrationDeployed - deployed Diamond pattern with fork-awareness
  - SnapshotExample - snapshot/restore examples
  - All tests pass with proper fork-awareness and graceful skipping

### Changed

- Helper generation now creates library-based helpers instead of standalone contracts
- Test workflows now support both ephemeral and persistent deployment modes
- `diamonds-forge:test` task now supports comprehensive filtering and control
- Fork-aware test pattern established for deployed Diamond tests
- Enhanced error messages with actionable troubleshooting steps
- Improved CI/CD compatibility with ephemeral deployments

### Documentation

- **README.md**:
  - Added "Dynamic Helper Generation" section with examples
  - Added "Deployment Management" section covering ephemeral vs persistent modes
  - Added "Task Flags Reference" with all available options
  - Added "Snapshot and Restore" section with usage examples
  - Expanded "Troubleshooting" section with 10+ common issues and solutions
  - Added fork-awareness patterns and best practices
- **TESTING.md**:
  - Added comprehensive "Snapshot and Restore" section
  - Added snapshot API reference
  - Added snapshot use cases and examples
  - Added snapshot limitations and best practices
  - Enhanced fork-aware testing documentation
- All documentation updated with working examples from integration tests

### Fixed

- Helper generation now works reliably with ephemeral deployments
- Tests properly skip when Diamond not deployed (fork-awareness)
- Snapshot functions use non-deprecated Foundry APIs
- All integration tests pass with proper isolation

## [2.0.0] - 2024-12-16

### Breaking Changes

- **LocalDiamondDeployer Migration**: `LocalDiamondDeployer` is now imported from `@diamondslab/hardhat-diamonds` peer dependency instead of being bundled
  - Requires `@diamondslab/hardhat-diamonds` as a peer dependency
  - Eliminates code duplication and ensures single source of truth
  - No API changes for users of Hardhat tasks (CLI workflow)
  - Minimal impact on programmatic API users (just ensure peer dependency is installed)
  - See [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions

### Added

- **Importable Helper Contracts**: Three Solidity helper contracts now available as package resources:
  - `DiamondFuzzBase.sol`: Abstract base contract for Diamond fuzz testing with virtual functions
    - Automatic Diamond address and ABI loading
    - Built-in helpers: `_callDiamond()`, `_callDiamondWithValue()`, `_expectDiamondRevert()`
    - Facet routing verification: `_verifyFacetRouting()`
    - Gas measurement: `_measureDiamondGas()`
    - Access control helpers: `_getDiamondOwner()`, `_hasRole()`, `_grantRole()`, `_revokeRole()`
    - All functions are virtual for extensibility
  - `DiamondForgeHelpers.sol`: Utility library for Diamond testing
    - Validation: `assertValidDiamond()`, `assertValidFacet()`, `isValidTestAddress()`, `isValidTestAmount()`
    - DiamondLoupe wrappers: `getFacetAddress()`, `getAllFacets()`, `getFacetAddresses()`, `getFacetSelectors()`
    - Fuzzing helpers: `boundAddress()`, `boundAmount()`, `selectorsEqual()`
    - Owner management: `getDiamondOwner()`, `assertDiamondOwner()`
  - `DiamondABILoader.sol`: Library for loading and parsing Diamond ABI files
    - Functions: `loadDiamondABI()`, `extractSelectors()`, `extractSignatures()`, `getFunctionInfo()`, `verifySelectorsMatch()`
- All helper contracts use pragma `^0.8.0` for broad Solidity version compatibility
- Comprehensive NatSpec documentation for all helper contract functions with usage examples
- Updated test templates to demonstrate helper contract imports from package path

### Changed

- `DeploymentManager` now imports `LocalDiamondDeployer` statically from `@diamondslab/hardhat-diamonds`
- Removed dynamic `getDeployerClass()` method in favor of direct static imports
- Enhanced error handling with helpful messages for missing peer dependency
- Updated all test templates to use `@diamondslab/diamonds-hardhat-foundry/contracts/...` imports
- ExampleUnitTest template now uses `DiamondForgeHelpers`
- ExampleIntegrationTest template now uses `DiamondForgeHelpers` and `DiamondABILoader`
- ExampleFuzzTest template now extends `DiamondFuzzBase`

### Fixed

- Improved TypeScript type extension loading for HardhatRuntimeEnvironment
- Better type safety with explicit type imports for Hardhat and Ethers types
- Resolved module resolution issues with proper side-effect imports

### Documentation

- Added comprehensive "Importing Helper Contracts" section to README with code examples
- Created [MIGRATION.md](./MIGRATION.md) with detailed v1.x to v2.0.0 upgrade guide
- Updated installation instructions to highlight required peer dependencies
- Added examples for all three helper contracts with real-world usage patterns
- Documented all helper contract functions with parameter descriptions

### Testing

- Verified all existing fuzz and invariant tests compile successfully
- Integration tests updated to use new deployment patterns
- All test templates generate with correct package imports

### Migration Guide

See [MIGRATION.md](./MIGRATION.md) for complete upgrade instructions, including:
- Breaking changes explanation
- Step-by-step migration guide
- Common scenarios and code examples
- Troubleshooting section

## [1.0.5] - 2025-12-16

### Fixed
- Fixed DeploymentManager to use `require()` instead of `import()` for better TypeScript module loading in Hardhat environment
- Corrected template import paths from `../../helpers/` to `../helpers/` for proper file resolution
- Simplified ExampleFuzz template to use standard Foundry Test helpers instead of non-existent custom functions
- All changes validated through full workspace integration testing

## [1.0.4] - 2025-12-16

### Fixed
- Templates from `src/templates/` are now properly copied to `dist/templates/` during build
- Added `copy-templates` script to ensure all `.template` files are included in the published package

## [1.0.0] - 2025-12-15

Initial public release of `@diamondslab/diamonds-hardhat-foundry`.

### Added
- Initial release of `@diamondslab/diamonds-hardhat-foundry`
- Core framework classes for Diamond deployment and testing:
  - `DeploymentManager` - Manages Diamond contract deployments
  - `HelperGenerator` - Generates Solidity test helpers and scaffolding
  - `ForgeFuzzingFramework` - Orchestrates complete test workflows
- Four Hardhat tasks for Diamond + Foundry workflow:
  - `diamonds-forge:init` - Initialize test directory structure
  - `diamonds-forge:deploy` - Deploy Diamond contracts
  - `diamonds-forge:generate-helpers` - Generate DiamondDeployment.sol helpers
  - `diamonds-forge:test` - Run Foundry tests with deployment orchestration
- Base Solidity contracts for testing:
  - `DiamondForgeHelpers.sol` - Utility functions for Diamond testing
  - `DiamondFuzzBase.sol` - Abstract base contract for fuzz tests
- Template system for generating:
  - `DiamondDeployment.sol` - Generated deployment data helper
  - Example unit tests (`ExampleUnitTest.t.sol`)
  - Example integration tests (`ExampleIntegrationTest.t.sol`)
  - Example fuzz tests (`ExampleFuzzTest.t.sol`)
- Configuration system via `hardhat.config.ts`:
  - `diamondsFoundry.helpersDir` - Configure helper output directory
  - `diamondsFoundry.generateExamples` - Toggle example generation
  - `diamondsFoundry.exampleTests` - Select example test types
  - `diamondsFoundry.defaultNetwork` - Set default deployment network
  - `diamondsFoundry.reuseDeployment` - Enable deployment reuse
  - `diamondsFoundry.forgeTestArgs` - Default Forge test arguments
- Comprehensive validation:
  - Foundry installation check
  - Peer dependency validation
  - Configuration validation with helpful error messages
- Colored logging with `picocolors` for better UX
- Integration with `@diamondslab/diamonds` ecosystem:
  - Uses `LocalDiamondDeployer` from workspace
  - Reads deployment records from Diamond deployments
  - Compatible with `@diamondslab/hardhat-diamonds` configuration
- Comprehensive documentation:
  - Full README with Quick Start guide
  - API documentation for all classes and methods
  - Configuration reference with all options
  - Usage examples and workflows
  - Troubleshooting guide
  - Integration guide for existing projects

### Testing
- 61 unit tests covering:
  - Framework class functionality
  - Configuration validation
  - Helper generation
  - Deployment management
  - Error handling
- Integration tests:
  - Solidity integration tests for workflow verification
  - TypeScript integration tests for API validation

[1.0.0]: https://github.com/diamondslab/diamonds-hardhat-foundry/releases/tag/v1.0.0
