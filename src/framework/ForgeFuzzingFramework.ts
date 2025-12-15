import { HardhatRuntimeEnvironment } from "hardhat/types";
import { compileForge, isFoundryInstalled, runForgeTest } from "../utils/foundry";
import { Logger } from "../utils/logger";
import { DeploymentManager } from "./DeploymentManager";
import { HelperGenerator } from "./HelperGenerator";

export interface ForgeTestOptions {
  /** Name of the Diamond to deploy */
  diamondName?: string;
  /** Network to deploy on */
  networkName?: string;
  /** Force redeployment */
  force?: boolean;
  /** Match test pattern */
  matchTest?: string;
  /** Match contract pattern */
  matchContract?: string;
  /** Verbosity level (1-5) */
  verbosity?: number;
  /** Show gas report */
  gasReport?: boolean;
  /** Skip helper generation */
  skipHelpers?: boolean;
  /** Skip deployment (use existing) */
  skipDeployment?: boolean;
}

/**
 * ForgeFuzzingFramework - Main orchestration class for Forge testing with Diamonds
 * 
 * Coordinates:
 * 1. Diamond deployment via DeploymentManager
 * 2. Helper generation via HelperGenerator
 * 3. Forge test execution
 */
export class ForgeFuzzingFramework {
  private deploymentManager: DeploymentManager;
  private helperGenerator: HelperGenerator;

  constructor(private hre: HardhatRuntimeEnvironment) {
    this.deploymentManager = new DeploymentManager(hre);
    this.helperGenerator = new HelperGenerator(hre);
  }

  /**
   * Run complete Forge testing workflow
   * 
   * Workflow:
   * 1. Validate Foundry installation
   * 2. Deploy or reuse Diamond
   * 3. Generate Solidity helpers
   * 4. Compile Forge contracts
   * 5. Run Forge tests
   * 
   * @param options - Test execution options
   */
  async runTests(options: ForgeTestOptions = {}): Promise<boolean> {
    const {
      diamondName = "ExampleDiamond",
      networkName = "hardhat",
      force = false,
      matchTest,
      matchContract,
      verbosity = 2,
      gasReport = false,
      skipHelpers = false,
      skipDeployment = false,
    } = options;

    Logger.section("Forge Fuzzing Framework - Test Execution");

    // Step 1: Validate Foundry
    if (!isFoundryInstalled()) {
      Logger.error("Foundry is not installed. Please install it: https://book.getfoundry.sh/getting-started/installation");
      return false;
    }

    try {
      // Step 2: Ensure Diamond deployment
      if (!skipDeployment) {
        Logger.section("Step 1/4: Ensuring Diamond Deployment");
        await this.deploymentManager.ensureDeployment(
          diamondName,
          networkName,
          force
        );
      } else {
        Logger.info("Skipping deployment (using existing)");
      }

      // Step 3: Generate helpers
      if (!skipHelpers) {
        Logger.section("Step 2/4: Generating Solidity Helpers");
        const deployment = await this.deploymentManager.getDeployment(
          diamondName,
          networkName
        );

        if (!deployment) {
          Logger.error("No deployment found. Cannot generate helpers.");
          return false;
        }

        const provider = this.hre.ethers.provider;
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        const deploymentData = deployment.getDeployedDiamondData();
        
        await this.helperGenerator.generateDeploymentHelpers(
          diamondName,
          networkName,
          chainId,
          deploymentData
        );
      } else {
        Logger.info("Skipping helper generation");
      }

      // Step 4: Compile Forge contracts
      Logger.section("Step 3/4: Compiling Forge Contracts");
      const compileResult = await compileForge({
        cwd: this.hre.config.paths.root,
        verbose: verbosity >= 3,
      });

      if (!compileResult.success) {
        Logger.error("Forge compilation failed");
        return false;
      }

      // Step 5: Run tests
      Logger.section("Step 4/4: Running Forge Tests");
      const testResult = await runForgeTest({
        matchTest,
        matchContract,
        verbosity,
        gasReport,
        cwd: this.hre.config.paths.root,
      });

      return testResult.success;
    } catch (error: any) {
      Logger.error(`Test execution failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Deploy Diamond only (no testing)
   */
  async deployOnly(
    diamondName: string = "ExampleDiamond",
    networkName: string = "hardhat",
    force: boolean = false
  ) {
    return await this.deploymentManager.ensureDeployment(
      diamondName,
      networkName,
      force
    );
  }

  /**
   * Generate helpers only (no deployment or testing)
   */
  async generateHelpersOnly(
    diamondName: string = "ExampleDiamond",
    networkName: string = "hardhat"
  ) {
    const deployment = await this.deploymentManager.getDeployment(
      diamondName,
      networkName
    );

    if (!deployment) {
      throw new Error("No deployment found. Deploy first using deployOnly()");
    }

    const provider = this.hre.ethers.provider;
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    const deploymentData = deployment.getDeployedDiamondData();

    return await this.helperGenerator.generateDeploymentHelpers(
      diamondName,
      networkName,
      chainId,
      deploymentData
    );
  }
}

