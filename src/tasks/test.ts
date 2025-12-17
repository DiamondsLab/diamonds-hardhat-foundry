import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Logger } from "../utils/logger";

/**
 * Task: diamonds-forge:test
 * 
 * Runs Forge tests with Diamond deployment.
 * - Ensures Diamond deployment exists
 * - Generates Solidity helpers
 * - Compiles Forge contracts
 * - Runs forge test with specified options
 * 
 * Use Hardhat's built-in --network flag to specify the network
 */
task("diamonds-forge:test", "Run Forge tests with Diamond deployment")
  .addOptionalParam(
    "diamondName",
    "Name of the Diamond to test",
    "ExampleDiamond",
    types.string
  )
  .addOptionalParam(
    "matchTest",
    "Run tests matching pattern (--match-test)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "matchContract",
    "Run tests in contracts matching pattern (--match-contract)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "verbosity",
    "Verbosity level (1-5, more v's = more verbose)",
    2,
    types.int
  )
  .addFlag("gasReport", "Show gas report")
  .addFlag("skipDeployment", "Skip Diamond deployment step")
  .addFlag("skipHelpers", "Skip helper generation step")
  .addFlag("force", "Force redeployment of Diamond")
  .addFlag("saveDeployment", "Write deployment data to file for reuse")
  .addFlag("useSnapshot", "Use EVM snapshots for test isolation")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.section("Running Forge Tests with Diamond");

    const diamondName = taskArgs.diamondName;
    // Use Hardhat's built-in network name from HRE
    const networkName = hre.network.name;
    const matchTest = taskArgs.matchTest;
    const matchContract = taskArgs.matchContract;
    const verbosity = taskArgs.verbosity;
    const gasReport = taskArgs.gasReport;
    const skipDeployment = taskArgs.skipDeployment;
    const skipHelpers = taskArgs.skipHelpers;
    const force = taskArgs.force;
    const saveDeployment = taskArgs.saveDeployment;
    const useSnapshot = taskArgs.useSnapshot;

    Logger.info(`Diamond: ${diamondName}`);
    Logger.info(`Network: ${networkName}`);
    
    if (matchTest) Logger.info(`Match Test: ${matchTest}`);
    if (matchContract) Logger.info(`Match Contract: ${matchContract}`);
    if (gasReport) Logger.info("Gas Report: enabled");
    if (skipDeployment) Logger.info("Skip Deployment: true");
    if (skipHelpers) Logger.info("Skip Helpers: true");
    if (saveDeployment) Logger.info("Save Deployment: true");
    if (useSnapshot) Logger.info("Use Snapshot: true");

    // Lazy-load framework to avoid circular dependency during config loading
    const { ForgeFuzzingFramework } = await import("../framework/ForgeFuzzingFramework.js");
    type ForgeTestOptions = Parameters<InstanceType<typeof ForgeFuzzingFramework>["runTests"]>[0];

    // Create test options
    const options: ForgeTestOptions = {
      diamondName,
      networkName,
      force,
      matchTest,
      matchContract,
      verbosity,
      gasReport,
      skipHelpers,
      skipDeployment,
      writeDeployedDiamondData: saveDeployment,
      useSnapshot,
    };

    // Run tests using the framework
    const framework = new ForgeFuzzingFramework(hre);
    
    try {
      const success = await framework.runTests(options);

      if (success) {
        Logger.section("Test Execution Complete");
        Logger.success("All tests passed!");
        process.exitCode = 0;
      } else {
        Logger.section("Test Execution Complete");
        Logger.error("Some tests failed");
        process.exitCode = 1;
      }

    } catch (error: any) {
      Logger.error(`Test execution failed: ${error.message}`);
      process.exitCode = 1;
      throw error;
    }
  });


