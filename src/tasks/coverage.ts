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
 * 
 * Design: Mirrors diamonds-forge:test task structure for consistency
 */
task("diamonds-forge:coverage", "Run forge coverage for Diamond contracts")
  .addOptionalParam(
    "diamondName",
    "Name of the Diamond to analyze",
    "ExampleDiamond",
    types.string
  )
  // Report options
  .addOptionalParam(
    "report",
    "Report type (summary, lcov, debug, bytecode) - comma-separated for multiple",
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
    "LCOV format version (v1 or v2)",
    undefined,
    types.string
  )
  .addFlag("includeLibs", "Include libraries in coverage report")
  .addFlag("excludeTests", "Exclude tests from coverage report")
  .addFlag("irMinimum", "Enable viaIR with minimum optimization")
  // Test filtering
  .addOptionalParam(
    "matchTest",
    "Run tests matching pattern",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchTest",
    "Exclude tests matching pattern",
    undefined,
    types.string
  )
  .addOptionalParam(
    "matchContract",
    "Run contracts matching pattern",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchContract",
    "Exclude contracts matching pattern",
    undefined,
    types.string
  )
  .addOptionalParam(
    "matchPath",
    "Run files matching glob",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchPath",
    "Exclude files matching glob",
    undefined,
    types.string
  )
  .addOptionalParam(
    "noMatchCoverage",
    "Exclude files from coverage report",
    undefined,
    types.string
  )
  // Display options
  .addOptionalParam(
    "verbosity",
    "Verbosity level (1-5)",
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
  // Build/deployment options
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
  .addFlag("skipDeployment", "Skip Diamond deployment step")
  .addFlag("skipHelpers", "Skip helper generation step")
  .addFlag("saveDeployment", "Write deployment data to file for reuse")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.section("Running Forge Coverage with Diamond");

    const diamondName = taskArgs.diamondName;
    const networkName = hre.network.name;

    Logger.info(`Diamond: ${diamondName}`);
    Logger.info(`Network: ${networkName}`);

    // Log key options
    if (taskArgs.report) Logger.info(`Report: ${taskArgs.report}`);
    if (taskArgs.reportFile) Logger.info(`Report File: ${taskArgs.reportFile}`);
    if (taskArgs.matchTest) Logger.info(`Match Test: ${taskArgs.matchTest}`);
    if (taskArgs.matchContract) Logger.info(`Match Contract: ${taskArgs.matchContract}`);
    if (taskArgs.skipDeployment) Logger.info("Skip Deployment: true");
    if (taskArgs.skipHelpers) Logger.info("Skip Helpers: true");
    if (taskArgs.saveDeployment) Logger.info("Save Deployment: true");

    // Lazy-load framework to avoid circular dependency during config loading
    const { ForgeCoverageFramework } = await import(
      "../framework/ForgeCoverageFramework.js"
    );
    type CoverageOptions = Parameters<
      InstanceType<typeof ForgeCoverageFramework>["runCoverage"]
    >[0];

    // Parse comma-separated report types
    const reportTypes = taskArgs.report
      ? taskArgs.report.split(",").map((r: string) => r.trim())
      : undefined;

    // Create coverage options (matches test.ts pattern)
    const options: CoverageOptions = {
      diamondName,
      networkName,
      force: taskArgs.force,
      skipDeployment: taskArgs.skipDeployment,
      skipHelpers: taskArgs.skipHelpers,
      writeDeployedDiamondData: taskArgs.saveDeployment,
      // Report options
      report: reportTypes,
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
      color: taskArgs.color,
      // Test execution
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
      noCache: taskArgs.noCache,
      optimize: taskArgs.optimize,
      optimizerRuns: taskArgs.optimizerRuns,
      viaIr: taskArgs.viaIr,
    };

    // Run coverage using the framework (same pattern as test.ts)
    const framework = new ForgeCoverageFramework(hre);

    try {
      const success = await framework.runCoverage(options);

      if (success) {
        Logger.section("Coverage Analysis Complete");
        Logger.success("✅ Coverage completed successfully!");
        process.exitCode = 0;
      } else {
        Logger.section("Coverage Analysis Complete");
        Logger.error("❌ Coverage analysis failed");
        process.exitCode = 1;
      }
    } catch (error: any) {
      Logger.error(`Coverage execution failed: ${error.message}`);
      process.exitCode = 1;
      throw error;
    }
  });
