import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Logger } from "../utils/logger";
import { DeploymentManager } from "../framework/DeploymentManager";
import { HelperGenerator } from "../framework/HelperGenerator";

/**
 * Task: diamonds-forge:generate-helpers
 * 
 * Generates Solidity helper files from Diamond deployment data.
 * - Reads deployment record
 * - Generates DiamondDeployment.sol library
 * - Creates constants for addresses and facets
 */
task("diamonds-forge:generate-helpers", "Generate Solidity helpers from Diamond deployment")
  .addOptionalParam(
    "diamondName",
    "Name of the deployed Diamond",
    "ExampleDiamond",
    types.string
  )
  .addOptionalParam(
    "network",
    "Network where Diamond is deployed",
    "hardhat",
    types.string
  )
  .addOptionalParam(
    "outputDir",
    "Directory for generated helper files",
    undefined,
    types.string
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.section("Generating Diamond Deployment Helpers");

    const diamondName = taskArgs.diamondName;
    const networkName = taskArgs.network;
    const outputDir = taskArgs.outputDir || hre.diamondsFoundry.helpersDir;

    Logger.info(`Diamond: ${diamondName}`);
    Logger.info(`Network: ${networkName}`);
    Logger.info(`Output: ${outputDir}`);

    // Step 1: Get deployment
    Logger.step("Loading deployment data...");
    const deploymentManager = new DeploymentManager(hre);
    
    try {
      const diamond = await deploymentManager.getDeployment(
        diamondName,
        networkName
      );

      if (!diamond) {
        Logger.error("No deployment found");
        Logger.info(`Deploy first: npx hardhat diamonds-forge:deploy --diamond-name ${diamondName} --network ${networkName}`);
        throw new Error("Deployment not found");
      }

      Logger.success("Deployment loaded");

      // Step 2: Get network info for chainId
      const provider = hre.ethers.provider;
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Step 3: Generate helpers
      Logger.step("Generating Solidity helpers...");
      const generator = new HelperGenerator(hre);
      
      const deploymentData = diamond.getDeployedDiamondData();
      
      const helperPath = await generator.generateDeploymentHelpers(
        diamondName,
        networkName,
        chainId,
        deploymentData
      );

      // Step 4: Summary
      Logger.section("Helper Generation Complete");
      Logger.success(`Generated: ${helperPath}`);
      
      const facetCount = Object.keys(deploymentData.DeployedFacets || {}).length;
      Logger.info(`Diamond Address: ${deploymentData.DiamondAddress}`);
      Logger.info(`Facets Included: ${facetCount}`);

      Logger.section("Next Steps");
      Logger.info("Import in your test files:");
      Logger.info(`  import "../../helpers/DiamondDeployment.sol";`);
      Logger.info("\nRun tests:");
      Logger.info(`  npx hardhat diamonds-forge:test`);

    } catch (error: any) {
      Logger.error(`Helper generation failed: ${error.message}`);
      throw error;
    }
  });


