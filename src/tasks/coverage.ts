import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Logger } from "../utils/logger";

/**
 * Task: diamonds-forge:coverage
 *
 * Runs Forge coverage with Diamond deployment.
 * - Ensures Diamond deployment exists
 * - Generates Solidity helpers
 * - Runs forge coverage with specified options
 *
 * Use Hardhat's built-in --network flag to specify the network
 */
task("diamonds-forge:coverage", "Run forge coverage for Diamond contracts")
  .addParam(
    "diamondName",
    "Name of the Diamond to analyze",
    undefined,
    types.string
  )
  // Report options
  .addOptionalParam(
    "report",
    "Report type (summary, lcov, debug, bytecode) - can be used multiple times by passing comma-separated values",
    undefined,
    types.string
  )
  .addOptionalParam(
    "reportFile",
    "Output path for report file",
    undefined,
    types.string
  )
  .addOptionalParam(
    "lcovVersion",
    "LCOV format version",
    undefined,
    types.string
  )
  .addFlag("includeLibs", "Include libraries in coverage report")
  .addFlag("excludeTests", "Exclude tests from coverage report")
  .addFlag("irMinimum", "Enable viaIR with minimum optimization")
  // Test filtering
  .addOptionalParam(
    "matchTest",
    "Run tests matching pattern (--match-test)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchTest",
    "Exclude tests matching pattern (--no-match-test)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "matchContract",
    "Run contracts matching pattern (--match-contract)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchContract",
    "Exclude contracts matching pattern (--no-match-contract)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "matchPath",
    "Run files matching glob (--match-path)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchPath",
    "Exclude files matching glob (--no-match-path)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchCoverage",
    "Exclude files from coverage report (--no-match-coverage)",
    undefined,
    types.string
  )
  // Display options
  .addOptionalParam(
    "verbosity",
    "Verbosity level (1-5, more v's = more verbose)",
    undefined,
    types.int
  )
  .addFlag("quiet", "Suppress log output")
  .addFlag("json", "Format output as JSON")
  .addFlag("md", "Format output as Markdown")
  .addOptionalParam(
    "color",
    "Color mode (auto, always, never)",
    undefined,
    types.string
  )
  // Test execution options
  .addOptionalParam(
    "threads",
    "Number of threads to use",
    undefined,
    types.int
  )
  .addOptionalParam(
    "fuzzRuns",
    "Number of fuzz runs",
    undefined,
    types.int
  )
  .addOptionalParam(
    "fuzzSeed",
    "Seed for fuzz randomness",
    undefined,
    types.string
  )
  .addFlag("failFast", "Stop on first failure")
  .addFlag("allowFailure", "Exit 0 even if tests fail")
  // EVM options
  .addOptionalParam(
    "forkBlockNumber",
    "Fork from specific block number",
    undefined,
    types.int
  )
  .addOptionalParam(
    "initialBalance",
    "Initial balance for test contracts",
    undefined,
    types.string
  )
  .addOptionalParam(
    "sender",
    "Test sender address",
    undefined,
    types.string
  )
  .addFlag("ffi", "Enable FFI cheatcode")
  // Build options
  .addFlag("force", "Force recompile and redeploy")
  .addFlag("noCache", "Disable cache")
  .addFlag("optimize", "Enable Solidity optimizer")
  .addOptionalParam(
    "optimizerRuns",
    "Optimizer runs",
    undefined,
    types.int
  )
  .addFlag("viaIr", "Use Yul IR compilation")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.section("Running Forge Coverage with Diamond");

    const diamondName = taskArgs.diamondName;
    const networkName = hre.network.name;

    // Validate required parameters
    if (!diamondName) {
      Logger.error("--diamond-name is required");
      process.exitCode = 1;
      return;
    }

    Logger.info(`Diamond: ${diamondName}`);
    Logger.info(`Network: ${networkName}`);

    try {
      // Lazy-load framework classes to avoid circular dependency
      const { DeploymentManager } = await import("../framework/DeploymentManager.js");
      const { HelperGenerator } = await import("../framework/HelperGenerator.js");

      // Step 1: Ensure Diamond deployment
      Logger.section("Step 1/3: Ensuring Diamond Deployment");
      
      const deploymentManager = new DeploymentManager(hre);
      
      await deploymentManager.ensureDeployment(
        diamondName,
        networkName,
        taskArgs.force || false,
        false // Don't write deployment data for coverage (ephemeral by default)
      );

      // Step 2: Generate helpers
      Logger.section("Step 2/3: Generating Solidity Helpers");
      
      const deployment = await deploymentManager.getDeployment(
        diamondName,
        networkName
      );

      if (!deployment) {
        Logger.error("No deployment found. Cannot generate helpers.");
        process.exitCode = 1;
        return;
      }

      const provider = hre.ethers.provider;
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const deploymentData = deployment.getDeployedDiamondData();

      const helperGenerator = new HelperGenerator(hre);
      await helperGenerator.generateDeploymentHelpers(
        diamondName,
        networkName,
        chainId,
        deploymentData,
        deployment
      );

      // Step 3: Run coverage
      Logger.section("Step 3/3: Running Forge Coverage");

      // Construct fork URL for network
      // Coverage requires forking from a running network to access deployed contracts
      let forkUrl: string;
      if (networkName !== "hardhat") {
        // Use the configured network's URL
        forkUrl = (provider as any)._hardhatProvider?._wrapped?.url || "http://127.0.0.1:8545";
        Logger.info(`Forking from ${networkName}: ${forkUrl}`);
      } else {
        // Default to localhost for hardhat network
        // This assumes user has `npx hardhat node` running
        forkUrl = "http://127.0.0.1:8545";
        Logger.warn(`⚠️  Network is "${networkName}" - defaulting to localhost fork: ${forkUrl}`);
        Logger.warn(`💡 Make sure Hardhat node is running: npx hardhat node`);
        Logger.warn(`💡 Or specify network explicitly: --network localhost`);
      }

      // Lazy-load framework to avoid circular dependency
      const { ForgeCoverageFramework } = await import("../framework/ForgeCoverageFramework.js");
      type CoverageOptions = Parameters<InstanceType<typeof ForgeCoverageFramework>["runCoverage"]>[0];

      // Build coverage options from task args
      const options: CoverageOptions = {
        // Fork URL
        forkUrl,

        // Report options
        report: taskArgs.report ? taskArgs.report.split(",") : undefined,
        reportFile: taskArgs.reportFile,
        lcovVersion: taskArgs.lcovVersion,
        includeLibs: taskArgs.includeLibs,
        excludeTests: taskArgs.excludeTests,
        irMinimum: taskArgs.irMinimum,

        // Test filtering
        matchTest: taskArgs.matchTest,
        noMatchTest: taskArgs.noMatchTest,
        matchContract: taskArgs.matchContract,
        noMatchContract: taskArgs.noMatchContract,
        matchPath: taskArgs.matchPath,
        noMatchPath: taskArgs.noMatchPath,
        noMatchCoverage: taskArgs.noMatchCoverage,

        // Display options
        verbosity: taskArgs.verbosity,
        quiet: taskArgs.quiet,
        json: taskArgs.json,
        md: taskArgs.md,
        color: taskArgs.color as "auto" | "always" | "never" | undefined,

        // Test execution options
        threads: taskArgs.threads,
        fuzzRuns: taskArgs.fuzzRuns,
        fuzzSeed: taskArgs.fuzzSeed,
        failFast: taskArgs.failFast,
        allowFailure: taskArgs.allowFailure,

        // EVM options
        forkBlockNumber: taskArgs.forkBlockNumber,
        initialBalance: taskArgs.initialBalance,
        sender: taskArgs.sender,
        ffi: taskArgs.ffi,

        // Build options
        force: taskArgs.force,
        noCache: taskArgs.noCache,
        optimize: taskArgs.optimize,
        optimizerRuns: taskArgs.optimizerRuns,
        viaIr: taskArgs.viaIr,
      };

      // Run coverage
      const framework = new ForgeCoverageFramework(hre);
      const success = await framework.runCoverage(options);

      if (success) {
        Logger.section("Coverage Analysis Complete");
        Logger.success("Coverage analysis completed successfully!");
        process.exitCode = 0;
      } else {
        Logger.section("Coverage Analysis Complete");
        Logger.error("Coverage analysis failed");
        process.exitCode = 1;
      }
    } catch (error: any) {
      Logger.error(`Coverage execution failed: ${error.message}`);
      process.exitCode = 1;
      throw error;
    }
  });
