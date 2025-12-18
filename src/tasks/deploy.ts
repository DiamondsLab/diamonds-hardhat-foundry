import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Logger } from "../utils/logger";
import { validateFoundryInstallation } from "../utils/validation";

/**
 * Task: diamonds-forge:deploy
 * 
 * Deploys a Diamond contract for Forge testing.
 * - Validates Foundry installation
 * - Deploys Diamond using LocalDiamondDeployer
 * - Saves deployment record
 * - Optionally reuses existing deployment
 * 
 * Use Hardhat's built-in --network flag to specify the network
 */
task("diamonds-forge:deploy", "Deploy Diamond contract for Forge testing")
  .addOptionalParam(
    "diamondName",
    "Name of the Diamond to deploy",
    "ExampleDiamond",
    types.string
  )
  .addFlag("reuse", "Reuse existing deployment if available")
  .addFlag("force", "Force redeployment even if deployment exists")
  .addFlag("saveDeployment", "Write deployment data to file (default: true for localhost/testnet)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.section("Deploying Diamond for Forge Testing");

    // Use Hardhat's built-in network name from HRE
    const networkName = hre.network.name;
    const diamondName = taskArgs.diamondName;
    const reuse = taskArgs.reuse;
    const force = taskArgs.force;
    
    // Default to saving deployment for persistent networks (localhost, sepolia, etc.)
    // but not for ephemeral hardhat network. 
    // Flags default to false when not provided, so we check if explicitly passed
    const saveDeployment = taskArgs.saveDeployment || networkName !== "hardhat";

    // Validate flags
    if (reuse && force) {
      Logger.error("Cannot use both --reuse and --force flags");
      throw new Error("Conflicting flags: --reuse and --force");
    }

    Logger.info(`Diamond: ${diamondName}`);
    Logger.info(`Network: ${networkName}`);
    Logger.info(`Mode: ${force ? "force deploy" : reuse ? "reuse if exists" : "deploy new"}`);
    Logger.info(`Save Deployment: ${saveDeployment}`);

    // Step 1: Validate Foundry (optional for deployment, but recommended)
    Logger.step("Checking Foundry installation...");
    const foundryInstalled = validateFoundryInstallation();
    
    if (!foundryInstalled) {
      Logger.warn("Foundry is not installed");
      Logger.warn("You'll need it to run tests later");
    } else {
      Logger.success("Foundry is installed");
    }

    // Step 2: Deploy or reuse Diamond
    Logger.step("Deploying Diamond contract...");
    
    // Lazy-load DeploymentManager to avoid circular dependency
    const { DeploymentManager } = await import("../framework/DeploymentManager.js");
    const deploymentManager = new DeploymentManager(hre);

    try {
      let diamond;
      
      if (reuse) {
        // Try to reuse, deploy if not exists
        diamond = await deploymentManager.ensureDeployment(
          diamondName,
          networkName,
          false,
          saveDeployment
        );
      } else {
        // Deploy (force if flag is set)
        diamond = await deploymentManager.deploy(
          diamondName,
          networkName,
          force,
          saveDeployment
        );
      }

      // Step 3: Display deployment info
      const deploymentData = diamond.getDeployedDiamondData();
      
      Logger.section("Deployment Summary");
      Logger.success(`Diamond Address: ${deploymentData.DiamondAddress}`);
      Logger.info(`Deployer Address: ${deploymentData.DeployerAddress}`);
      
      const facetCount = Object.keys(deploymentData.DeployedFacets || {}).length;
      Logger.info(`Facets Deployed: ${facetCount}`);
      
      if (facetCount > 0) {
        Logger.info("\nDeployed Facets:");
        for (const [name, facet] of Object.entries(deploymentData.DeployedFacets || {})) {
          Logger.info(`  - ${name}: ${facet.address}`);
        }
      }

      Logger.section("Next Steps");
      Logger.info("Generate helpers: npx hardhat diamonds-forge:generate-helpers");
      Logger.info("Run tests: npx hardhat diamonds-forge:test");

    } catch (error: any) {
      Logger.error(`Deployment failed: ${error.message}`);
      throw error;
    }
  });


