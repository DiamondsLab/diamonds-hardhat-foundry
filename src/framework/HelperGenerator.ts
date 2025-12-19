import { DeployedDiamondData } from "@diamondslab/diamonds";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { join } from "path";
import { Logger } from "../utils/logger";

/**
 * HelperGenerator - Generates Solidity helper files for testing
 */
export class HelperGenerator {
  constructor(private hre: HardhatRuntimeEnvironment) {}

  /**
   * Scaffold project with initial test structure
   */
  async scaffoldProject(outputDir?: string): Promise<void> {
    const helpersDir = outputDir || this.hre.diamondsFoundry.helpersDir;
    const basePath = join(this.hre.config.paths.root, helpersDir);

    Logger.section("Scaffolding Forge Test Structure");
    
    // Create directories
    Logger.step("Creating directories...");
    mkdirSync(basePath, { recursive: true });
    mkdirSync(join(basePath, "../unit"), { recursive: true });
    mkdirSync(join(basePath, "../integration"), { recursive: true });
    mkdirSync(join(basePath, "../fuzz"), { recursive: true });

    Logger.success(`Test structure created at ${basePath}`);
  }

  /**
   * Generate DiamondDeployment.sol from deployment record
   * Also sets DIAMOND_ADDRESS and DIAMOND_ABI_PATH environment variables for Forge tests
   */
  async generateDeploymentHelpers(
    diamondName: string,
    networkName: string,
    chainId: number,
    deploymentData: DeployedDiamondData,
    diamond?: any // Diamond instance from @diamondslab/hardhat-diamonds
  ): Promise<string> {
    Logger.section("Generating Diamond Deployment Helper");

    const helpersDir = this.hre.diamondsFoundry.helpersDir;
    const outputPath = join(
      this.hre.config.paths.root,
      helpersDir,
      "DiamondDeployment.sol"
    );

    const content = this.generateLibrarySource(
      diamondName,
      networkName,
      chainId,
      deploymentData
    );

    // Ensure directory exists
    mkdirSync(join(this.hre.config.paths.root, helpersDir), {
      recursive: true,
    });

    // Write file
    writeFileSync(outputPath, content, "utf8");

    Logger.success(`Generated: ${outputPath}`);

    // Set environment variables for Forge tests (if Diamond instance provided)
    if (diamond) {
      this.setForgeEnvironmentVariables(diamond, deploymentData);
    }

    return outputPath;
  }

  /**
   * Set environment variables for Forge tests
   * @private
   */
  private setForgeEnvironmentVariables(
    diamond: any,
    deploymentData: DeployedDiamondData
  ): void {
    try {
      // Get Diamond ABI path
      const abiPath = diamond.getDiamondAbiFilePath?.() || `./diamond-abi/${deploymentData.DiamondAddress}.json`;
      
      // Get Diamond address
      const diamondAddress = deploymentData.DiamondAddress;

      // Set environment variables
      process.env.DIAMOND_ABI_PATH = abiPath;
      process.env.DIAMOND_ADDRESS = diamondAddress;

      Logger.info(`Set DIAMOND_ABI_PATH: ${abiPath}`);
      Logger.info(`Set DIAMOND_ADDRESS: ${diamondAddress}`);
    } catch (error: any) {
      Logger.warn(`Failed to set environment variables: ${error.message}`);
      Logger.warn("Tests can still use DiamondDeployment.sol overrides");
    }
  }

  /**
   * Generate example test files
   */
  async generateExampleTests(): Promise<string[]> {
    const generated: string[] = [];
    const examples = this.hre.diamondsFoundry.exampleTests;

    if (!this.hre.diamondsFoundry.generateExamples) {
      Logger.info("Example generation disabled in config");
      return generated;
    }

    Logger.section("Generating Example Tests");

    const basePath = join(this.hre.config.paths.root, "test", "foundry");
    const templatesPath = join(__dirname, "../templates");

    for (const type of examples) {
      let templateFile = "";
      let outputPath = "";

      switch (type) {
        case "unit":
          templateFile = join(templatesPath, "ExampleUnitTest.t.sol.template");
          outputPath = join(basePath, "unit", "ExampleUnit.t.sol");
          break;
        case "integration":
          templateFile = join(templatesPath, "ExampleIntegrationTest.t.sol.template");
          outputPath = join(basePath, "integration", "ExampleIntegration.t.sol");
          break;
        case "fuzz":
          templateFile = join(templatesPath, "ExampleFuzzTest.t.sol.template");
          outputPath = join(basePath, "fuzz", "ExampleFuzz.t.sol");
          break;
        default:
          Logger.warn(`Unknown example type: ${type}`);
          continue;
      }

      try {
        // Check if template exists
        if (!existsSync(templateFile)) {
          Logger.warn(`Template not found: ${templateFile}`);
          continue;
        }

        // Read template content
        const templateContent = readFileSync(templateFile, "utf8");

        // Ensure output directory exists
        mkdirSync(join(basePath, type), { recursive: true });

        // Check if file already exists
        if (existsSync(outputPath)) {
          Logger.info(`Skipping ${type} example (already exists): ${outputPath}`);
          continue;
        }

        // Write example test file
        writeFileSync(outputPath, templateContent, "utf8");
        Logger.success(`Generated ${type} example: ${outputPath}`);
        generated.push(outputPath);
      } catch (error: any) {
        Logger.error(`Failed to generate ${type} example: ${error.message}`);
      }
    }

    if (generated.length === 0) {
      Logger.info("No new example tests generated (may already exist)");
    }

    return generated;
  }

  /**
   * Generate Solidity library source from deployment data
   * @private
   */
  private generateLibrarySource(
    diamondName: string,
    networkName: string,
    chainId: number,
    deploymentData: DeployedDiamondData
  ): string {
    const timestamp = new Date().toISOString();
    const networkInfo = `${networkName}-${chainId}`;
    const deploymentFileName = `${diamondName.toLowerCase()}-${networkInfo}.json`;
    const deploymentFilePath = `diamonds/${diamondName}/deployments/${deploymentFileName}`;

    let source = "";

    // SPDX and pragma
    source += "// SPDX-License-Identifier: MIT\n";
    source += "pragma solidity ^0.8.19;\n\n";

    // Header comments
    source += "/**\n";
    source += ` * @title DiamondDeployment\n`;
    source += ` * @notice Auto-generated deployment data for ${diamondName}\n`;
    source += ` * @dev This library provides constants and helper functions for accessing\n`;
    source += ` *      deployment data in Forge tests. It is auto-generated from the deployment\n`;
    source += ` *      record and should not be edited manually.\n`;
    source += ` *\n`;
    source += ` * Generated from: ${deploymentFilePath}\n`;
    source += ` * Generated at: ${timestamp}\n`;
    source += ` *\n`;
    source += ` * To regenerate this file:\n`;
    source += ` *   npx hardhat diamonds-forge:generate-helpers --diamond ${diamondName}\n`;
    source += ` *\n`;
    source += ` * ⚠️  DO NOT EDIT MANUALLY - Changes will be overwritten on next generation\n`;
    source += " */\n";
    source += "library DiamondDeployment {\n";

    // Diamond name
    source += `    /// @notice Name of the Diamond contract\n`;
    source += `    /// @dev Used for identifying the Diamond in tests\n`;
    source += `    string constant DIAMOND_NAME = "${diamondName}";\n\n`;

    // Diamond ABI path
    source += `    /// @notice Path to the Diamond ABI file\n`;
    source += `    /// @dev Used by DiamondFuzzBase to load ABI for testing\n`;
    source += `    string constant DIAMOND_ABI_PATH = "./diamond-abi/${diamondName}.json";\n\n`;

    // Diamond address
    source += `    /// @notice Address of the deployed ${diamondName} contract\n`;
    source += `    /// @dev This is the main Diamond proxy address\n`;
    source += `    address constant DIAMOND_ADDRESS = ${deploymentData.DiamondAddress};\n\n`;

    // Deployer address
    source += `    /// @notice Address of the deployer account\n`;
    source += `    /// @dev Account that deployed the Diamond\n`;
    source += `    address constant DEPLOYER_ADDRESS = ${deploymentData.DeployerAddress};\n\n`;

    // Facet addresses
    source += "    // ========================================\n";
    source += "    // Facet Addresses\n";
    source += "    // ========================================\n\n";

    const facets = deploymentData.DeployedFacets ?? {};
    for (const [facetName, facetData] of Object.entries(facets)) {
      const constantName = facetName
        .replace(/Facet$/, "")
        .replace(/([A-Z])/g, "_$1")
        .toUpperCase()
        .replace(/^_/, "") + "_FACET";

      source += `    /// @notice Address of ${facetName} implementation\n`;
      source += `    address constant ${constantName} = ${facetData.address};\n`;
    }
    source += "\n";

    // Helper functions
    source += "    // ========================================\n";
    source += "    // Helper Functions\n";
    source += "    // ========================================\n\n";

    source += "    /**\n";
    source += "     * @notice Get the Diamond name\n";
    source += "     * @return The name of the Diamond contract\n";
    source += "     */\n";
    source += "    function getDiamondName() internal pure returns (string memory) {\n";
    source += "        return DIAMOND_NAME;\n";
    source += "    }\n\n";

    source += "    /**\n";
    source += "     * @notice Get the path to the Diamond ABI file\n";
    source += "     * @return The path to the Diamond ABI JSON file\n";
    source += "     */\n";
    source += "    function getDiamondABIPath() internal pure returns (string memory) {\n";
    source += "        return DIAMOND_ABI_PATH;\n";
    source += "    }\n\n";

    source += "    /**\n";
    source += "     * @notice Get the Diamond contract address\n";
    source += "     * @return The address of the deployed Diamond proxy\n";
    source += "     */\n";
    source += "    function getDiamondAddress() internal pure returns (address) {\n";
    source += "        return DIAMOND_ADDRESS;\n";
    source += "    }\n\n";

    source += "    /**\n";
    source += "     * @notice Get the deployer address\n";
    source += "     * @return The address of the deployer account\n";
    source += "     */\n";
    source += "    function getDeployerAddress() internal pure returns (address) {\n";
    source += "        return DEPLOYER_ADDRESS;\n";
    source += "    }\n\n";

    source += "    /**\n";
    source += "     * @notice Get facet implementation address by name\n";
    source += "     * @param facetName The name of the facet\n";
    source += "     * @return The address of the facet implementation\n";
    source += "     */\n";
    source += "    function getFacetAddress(string memory facetName) internal pure returns (address) {\n";

    let firstFacet = true;
    for (const [facetName, facetData] of Object.entries(facets)) {
      const constantName = facetName
        .replace(/Facet$/, "")
        .replace(/([A-Z])/g, "_$1")
        .toUpperCase()
        .replace(/^_/, "") + "_FACET";

      const condition = firstFacet ? "if" : "else if";
      source += `        ${condition} (keccak256(bytes(facetName)) == keccak256(bytes("${facetName}"))) {\n`;
      source += `            return ${constantName};\n`;
      source += "        }\n";
      firstFacet = false;
    }
    source += "        return address(0);\n";
    source += "    }\n";

    source += "}\n";

    return source;
  }
}
