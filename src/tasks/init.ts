import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { HelperGenerator } from "../framework/HelperGenerator";
import { Logger } from "../utils/logger";
import { validateConfig, validateFoundryInstallation } from "../utils/validation";

/**
 * Task: diamonds-forge:init
 * 
 * Initializes the project for Forge testing with Diamond contracts.
 * - Validates configuration
 * - Checks Foundry installation
 * - Scaffolds test directory structure
 * - Optionally generates example tests
 */
task("diamonds-forge:init", "Initialize Forge testing structure for Diamond contracts")
  .addOptionalParam(
    "helpersDir",
    "Directory for generated helper files",
    undefined,
    types.string
  )
  .addFlag("examples", "Generate example test files")
  .addFlag("force", "Overwrite existing files")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.section("Initializing Diamonds-Forge Testing");

    // Step 1: Validate configuration
    Logger.step("Validating configuration...");
    const config = validateConfig(hre.diamondsFoundry);
    
    // Override with task args if provided
    const helpersDir = taskArgs.helpersDir || config.helpersDir;
    const generateExamples = taskArgs.examples || config.generateExamples;

    Logger.info(`Helpers directory: ${helpersDir}`);
    Logger.info(`Generate examples: ${generateExamples}`);

    // Step 2: Check Foundry installation
    Logger.step("Checking Foundry installation...");
    const foundryInstalled = validateFoundryInstallation();
    
    if (!foundryInstalled) {
      Logger.warn("Foundry is not installed or not in PATH");
      Logger.warn("Install from: https://book.getfoundry.sh/getting-started/installation");
      Logger.warn("Continuing anyway...");
    } else {
      Logger.success("Foundry is installed");
    }

    // Step 3: Scaffold project structure
    Logger.step("Creating test directory structure...");
    const generator = new HelperGenerator(hre);
    
    try {
      await generator.scaffoldProject(helpersDir);
      Logger.success("Directory structure created");
    } catch (error: any) {
      Logger.error(`Failed to scaffold project: ${error.message}`);
      throw error;
    }

    // Step 4: Generate example tests if requested
    if (generateExamples) {
      Logger.step("Generating example test files...");
      try {
        const examplePaths = await generator.generateExampleTests();
        
        if (examplePaths.length > 0) {
          Logger.success(`Generated ${examplePaths.length} example test(s)`);
          examplePaths.forEach((path) => Logger.info(`  - ${path}`));
        } else {
          Logger.info("No example tests generated (implementation pending)");
        }
      } catch (error: any) {
        Logger.error(`Failed to generate examples: ${error.message}`);
        throw error;
      }
    }

    // Step 5: Summary
    Logger.section("Initialization Complete");
    Logger.success("Your project is ready for Forge testing!");
    Logger.info("\nNext steps:");
    Logger.info("  1. Deploy your Diamond: npx hardhat diamonds-forge:deploy");
    Logger.info("  2. Generate helpers: npx hardhat diamonds-forge:generate-helpers");
    Logger.info("  3. Run tests: npx hardhat diamonds-forge:test");
  });


