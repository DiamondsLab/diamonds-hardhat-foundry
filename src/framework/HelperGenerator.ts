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
   */
  async generateDeploymentHelpers(
    diamondName: string,
    networkName: string,
    chainId: number,
    deploymentData: DeployedDiamondData
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
    return outputPath;
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

    // Diamond address
    source += `    /// @notice Address of the deployed ${diamondName} contract\n`;
    source += `    /// @dev This is the main Diamond proxy address\n`;
    source += `    address constant DIAMOND_ADDRESS = ${deploymentData.DiamondAddress};\n\n`;

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
    source += "     * @notice Get the Diamond contract address\n";
    source += "     * @return The address of the deployed Diamond proxy\n";
    source += "     */\n";
    source += "    function getDiamondAddress() internal pure returns (address) {\n";
    source += "        return DIAMOND_ADDRESS;\n";
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
