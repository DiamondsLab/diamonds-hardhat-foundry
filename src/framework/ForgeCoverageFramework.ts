import { spawn } from "child_process";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CoverageOptions } from "../types/config";
import { isFoundryInstalled } from "../utils/foundry";
import { Logger } from "../utils/logger";
import { DeploymentManager } from "./DeploymentManager";
import { HelperGenerator } from "./HelperGenerator";

/**
 * ForgeCoverageFramework - Main orchestration class for Forge coverage with Diamonds
 *
 * Coordinates:
 * 1. Diamond deployment via DeploymentManager
 * 2. Helper generation via HelperGenerator
 * 3. Forge coverage execution
 *
 * Mirrors ForgeFuzzingFramework design for consistency and code reuse
 */
export class ForgeCoverageFramework {
  private deploymentManager: DeploymentManager;
  private helperGenerator: HelperGenerator;

  constructor(private hre: HardhatRuntimeEnvironment) {
    this.deploymentManager = new DeploymentManager(hre);
    this.helperGenerator = new HelperGenerator(hre);
  }

  /**
   * Run complete Forge coverage workflow
   *
   * Workflow:
   * 1. Validate Foundry installation
   * 2. Deploy or reuse Diamond
   * 3. Generate Solidity helpers
   * 4. Run forge coverage with options
   *
   * @param options - Coverage execution options
   * @returns Promise<boolean> - true if coverage succeeds
   */
  async runCoverage(options: CoverageOptions = {}): Promise<boolean> {
    const {
      diamondName = "ExampleDiamond",
      networkName = "hardhat",
      force = false,
      skipDeployment = false,
      skipHelpers = false,
      writeDeployedDiamondData = false,
    } = options;

    Logger.section("Running Forge Coverage with Diamond");

    // Step 1: Validate Foundry
    if (!isFoundryInstalled()) {
      Logger.error(
        "Foundry is not installed. Please install it: https://book.getfoundry.sh/getting-started/installation"
      );
      return false;
    }

    try {
      // Step 2: Ensure Diamond deployment
      if (!skipDeployment) {
        Logger.section("Step 1/3: Ensuring Diamond Deployment");
        await this.deploymentManager.ensureDeployment(
          diamondName,
          networkName,
          force,
          writeDeployedDiamondData
        );
      } else {
        Logger.info("Skipping deployment (using existing)");
      }

      // Step 3: Generate helpers
      if (!skipHelpers) {
        Logger.section("Step 2/3: Generating Solidity Helpers");

        const deployment = await this.deploymentManager.getDeployment(
          diamondName,
          networkName
        );

        if (!deployment) {
          Logger.warn("⚠ No deployment record found");
          if (!skipDeployment) {
            Logger.info("ℹ Using cached deployment (ephemeral)");
          }
        } else {
          Logger.info("Using deployment record");
        }

        const provider = this.hre.ethers.provider;
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        const deploymentData = deployment
          ? deployment.getDeployedDiamondData()
          : await this.deploymentManager
              .ensureDeployment(diamondName, networkName, false, false)
              .then((d) => d.getDeployedDiamondData());

        await this.helperGenerator.generateDeploymentHelpers(
          diamondName,
          networkName,
          chainId,
          deploymentData,
          deployment || undefined
        );
      } else {
        Logger.info("Skipping helper generation");
      }

      // Step 4: Run coverage
      Logger.section("Step 3/3: Running Forge Coverage");

      // Get fork URL for network (same pattern as ForgeFuzzingFramework)
      const provider = this.hre.ethers.provider;
      let forkUrl: string;

      if (networkName !== "hardhat") {
        forkUrl = (provider as any).connection?.url || "http://127.0.0.1:8545";
      } else {
        forkUrl = "http://127.0.0.1:8545";
        Logger.warn(
          "⚠️  Network is \"hardhat\" - defaulting to localhost fork: http://127.0.0.1:8545"
        );
        Logger.warn("💡 Make sure Hardhat node is running: npx hardhat node");
        Logger.warn("💡 Or specify network explicitly: --network localhost");
      }

      const args = this.buildCoverageCommand({ ...options, forkUrl });

      Logger.info(`Executing: forge coverage ${args.join(" ")}`);
      Logger.info("⏳ Running coverage analysis (this may take a while)...");

      const success = await this.executeForge(args);

      if (success) {
        Logger.success("✅ Coverage analysis completed successfully");
      } else {
        Logger.error("❌ Coverage analysis failed");
      }

      return success;
    } catch (error: any) {
      Logger.error(`Coverage execution failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Build complete forge coverage command arguments
   *
   * @param options - Coverage options
   * @returns Array of command arguments
   */
  private buildCoverageCommand(options: CoverageOptions): string[] {
    const args: string[] = [];

    // Add fork URL if provided
    if (options.forkUrl) {
      args.push("--fork-url", options.forkUrl);
    }

    // Add all option groups
    args.push(...this.buildReportOptions(options));
    args.push(...this.buildFilterOptions(options));
    args.push(...this.buildDisplayOptions(options));
    args.push(...this.buildTestOptions(options));
    args.push(...this.buildEvmOptions(options));
    args.push(...this.buildBuildOptions(options));

    return args.filter((arg) => arg !== "");
  }

  /**
   * Build report-related options
   */
  private buildReportOptions(options: CoverageOptions): string[] {
    const args: string[] = [];

    // Multiple --report flags
    if (options.report && options.report.length > 0) {
      for (const reportType of options.report) {
        args.push("--report", reportType);
      }
    }

    if (options.reportFile) {
      args.push("--report-file", options.reportFile);
    }

    if (options.lcovVersion) {
      args.push("--lcov-version", options.lcovVersion);
    }

    if (options.includeLibs) {
      args.push("--include-libs");
    }

    if (options.excludeTests) {
      args.push("--exclude-tests");
    }

    if (options.irMinimum) {
      args.push("--ir-minimum");
    }

    return args;
  }

  /**
   * Build test filtering options
   */
  private buildFilterOptions(options: CoverageOptions): string[] {
    const args: string[] = [];

    if (options.matchTest) {
      args.push("--match-test", options.matchTest);
    }

    if (options.noMatchTest) {
      args.push("--no-match-test", options.noMatchTest);
    }

    if (options.matchContract) {
      args.push("--match-contract", options.matchContract);
    }

    if (options.noMatchContract) {
      args.push("--no-match-contract", options.noMatchContract);
    }

    if (options.matchPath) {
      args.push("--match-path", options.matchPath);
    }

    if (options.noMatchPath) {
      args.push("--no-match-path", options.noMatchPath);
    }

    if (options.noMatchCoverage) {
      args.push("--no-match-coverage", options.noMatchCoverage);
    }

    return args;
  }

  /**
   * Build display options
   */
  private buildDisplayOptions(options: CoverageOptions): string[] {
    const args: string[] = [];

    // Verbosity (-v, -vv, -vvv, etc.)
    if (options.verbosity && options.verbosity > 0) {
      args.push("-" + "v".repeat(options.verbosity));
    }

    if (options.quiet) {
      args.push("--quiet");
    }

    if (options.json) {
      args.push("--json");
    }

    if (options.md) {
      args.push("--md");
    }

    if (options.color) {
      args.push("--color", options.color);
    }

    return args;
  }

  /**
   * Build test execution options
   */
  private buildTestOptions(options: CoverageOptions): string[] {
    const args: string[] = [];

    if (options.threads !== undefined) {
      args.push("--threads", options.threads.toString());
    }

    if (options.fuzzRuns !== undefined) {
      args.push("--fuzz-runs", options.fuzzRuns.toString());
    }

    if (options.fuzzSeed) {
      args.push("--fuzz-seed", options.fuzzSeed);
    }

    if (options.failFast) {
      args.push("--fail-fast");
    }

    if (options.allowFailure) {
      args.push("--allow-failure");
    }

    return args;
  }

  /**
   * Build EVM options
   */
  private buildEvmOptions(options: CoverageOptions): string[] {
    const args: string[] = [];

    if (options.forkBlockNumber !== undefined) {
      args.push("--fork-block-number", options.forkBlockNumber.toString());
    }

    if (options.initialBalance) {
      args.push("--initial-balance", options.initialBalance);
    }

    if (options.sender) {
      args.push("--sender", options.sender);
    }

    if (options.ffi) {
      args.push("--ffi");
    }

    return args;
  }

  /**
   * Build build options
   */
  private buildBuildOptions(options: CoverageOptions): string[] {
    const args: string[] = [];

    if (options.force) {
      args.push("--force");
    }

    if (options.noCache) {
      args.push("--no-cache");
    }

    if (options.optimize) {
      args.push("--optimize");
    }

    if (options.optimizerRuns !== undefined) {
      args.push("--optimizer-runs", options.optimizerRuns.toString());
    }

    if (options.viaIr) {
      args.push("--via-ir");
    }

    return args;
  }

  /**
   * Execute forge coverage command and stream output
   *
   * @param args - Command arguments
   * @returns Promise<boolean> - true if command succeeds
   */
  private executeForge(args: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const forge = spawn("forge", ["coverage", ...args], {
        cwd: this.hre.config.paths.root,
        stdio: "inherit",
        shell: true,
      });

      forge.on("close", (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      forge.on("error", (error) => {
        Logger.error(`Failed to execute forge: ${error.message}`);
        reject(error);
      });
    });
  }
}
