import { spawn } from "child_process";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CoverageOptions } from "../types/config";
import { Logger } from "../utils/logger";

/**
 * ForgeCoverageFramework - Orchestrates forge coverage execution for Diamond contracts
 *
 * Responsibilities:
 * 1. Build forge coverage command with all options
 * 2. Execute forge coverage with proper fork URL
 * 3. Stream output to terminal
 * 4. Handle errors appropriately
 */
export class ForgeCoverageFramework {
  constructor(private hre: HardhatRuntimeEnvironment) {}

  /**
   * Run forge coverage with provided options
   *
   * @param options - Coverage execution options
   * @returns Promise<boolean> - true if coverage succeeds, false otherwise
   */
  async runCoverage(options: CoverageOptions = {}): Promise<boolean> {
    Logger.section("Forge Coverage - Execution");

    try {
      // Build command arguments
      const args = this.buildCoverageCommand(options);

      Logger.info(`Executing: forge coverage ${args.join(" ")}`);
      Logger.info("⏳ Running coverage analysis (this may take a while)...\n");

      // Execute forge coverage
      const success = await this.executeForge(args);

      if (success) {
        Logger.success("✅ Coverage analysis completed successfully");
      } else {
        Logger.error("❌ Coverage analysis failed");
      }

      return success;
    } catch (error: any) {
      Logger.error(`Coverage execution error: ${error.message}`);
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
      options.report.forEach((reportType) => {
        args.push("--report", reportType);
      });
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
      const forgeProcess = spawn("forge", ["coverage", ...args], {
        cwd: this.hre.config.paths.root,
        stdio: "inherit", // Stream output directly to terminal
      });

      forgeProcess.on("close", (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      forgeProcess.on("error", (error) => {
        reject(new Error(`Failed to execute forge coverage: ${error.message}`));
      });
    });
  }
}
