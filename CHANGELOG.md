# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [1.0.0] - TBD

Initial public release.

### Features
- Complete Diamond + Foundry integration for Hardhat
- Automated deployment and helper generation
- Test scaffolding with examples
- Comprehensive CLI tasks
- Full programmatic API
- Base contracts and utilities
- Template system for code generation
