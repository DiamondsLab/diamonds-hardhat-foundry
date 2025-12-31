/**
 * Configuration types for diamonds-hardhat-foundry plugin
 * Will be fully implemented in Task 2.1
 */

export interface DiamondsFoundryConfig {
  /**
   * Output directory for generated helpers (relative to project root)
   * @default "test/foundry/helpers"
   */
  helpersDir?: string;

  /**
   * Whether to generate example tests on init
   * @default true
   */
  generateExamples?: boolean;

  /**
   * Example test templates to generate
   * @default ["unit", "integration", "fuzz"]
   */
  exampleTests?: Array<"unit" | "integration" | "fuzz">;

  /**
   * Default network for deployments
   * @default "hardhat"
   */
  defaultNetwork?: string;

  /**
   * Whether to reuse existing deployment or deploy fresh
   * @default true
   */
  reuseDeployment?: boolean;

  /**
   * Additional forge test arguments
   * @default []
   */
  forgeTestArgs?: string[];
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<DiamondsFoundryConfig> = {
  helpersDir: "test/foundry/helpers",
  generateExamples: true,
  exampleTests: ["unit", "integration", "fuzz"],
  defaultNetwork: "hardhat",
  reuseDeployment: true,
  forgeTestArgs: [],
};

/**
 * Type for forge coverage report formats
 */
export type CoverageReportType = "summary" | "lcov" | "debug" | "bytecode";

/**
 * Type for color output modes
 */
export type ColorMode = "auto" | "always" | "never";

/**
 * Coverage options for forge coverage command
 * Maps to all available forge coverage command-line options
 * Plus orchestration options for Diamond deployment and helpers
 */
export interface CoverageOptions {
  // Orchestration options (matching ForgeFuzzingFramework pattern)
  /** Name of the Diamond to analyze */
  diamondName?: string;
  /** Network name for deployment (hardhat, localhost, etc.) */
  networkName?: string;
  /** Skip Diamond deployment step */
  skipDeployment?: boolean;
  /** Skip helper generation step */
  skipHelpers?: boolean;
  /** Write deployment data to file for reuse */
  writeDeployedDiamondData?: boolean;

  // Report options
  /** Report type(s) - can specify multiple */
  report?: CoverageReportType[];
  /** Output path for report file */
  reportFile?: string;
  /** LCOV format version (default: 1) */
  lcovVersion?: string;
  /** Include libraries in coverage report */
  includeLibs?: boolean;
  /** Exclude tests from coverage report */
  excludeTests?: boolean;
  /** Enable viaIR with minimum optimization */
  irMinimum?: boolean;

  // Test filtering
  /** Run tests matching regex pattern */
  matchTest?: string;
  /** Exclude tests matching regex pattern */
  noMatchTest?: string;
  /** Run contracts matching regex pattern */
  matchContract?: string;
  /** Exclude contracts matching regex pattern */
  noMatchContract?: string;
  /** Run files matching glob pattern */
  matchPath?: string;
  /** Exclude files matching glob pattern */
  noMatchPath?: string;
  /** Exclude files from coverage report matching regex */
  noMatchCoverage?: string;

  // Display options
  /** Verbosity level (1-5) - more v's = more verbose */
  verbosity?: number;
  /** Suppress log output */
  quiet?: boolean;
  /** Format output as JSON */
  json?: boolean;
  /** Format output as Markdown */
  md?: boolean;
  /** Color output mode */
  color?: ColorMode;

  // Test execution options
  /** Number of threads to use for parallel execution */
  threads?: number;
  /** Number of fuzz test runs */
  fuzzRuns?: number;
  /** Seed for fuzz test randomness (for reproducibility) */
  fuzzSeed?: string;
  /** Stop running tests after first failure */
  failFast?: boolean;
  /** Exit with code 0 even if tests fail */
  allowFailure?: boolean;

  // EVM options
  /** Fork URL for network state */
  forkUrl?: string;
  /** Fork from specific block number */
  forkBlockNumber?: number;
  /** Initial balance for deployed test contracts */
  initialBalance?: string;
  /** Address to use as test sender */
  sender?: string;
  /** Enable FFI (Foreign Function Interface) cheatcode */
  ffi?: boolean;

  // Build options
  /** Force recompilation and cache clearing */
  force?: boolean;
  /** Disable compiler cache */
  noCache?: boolean;
  /** Enable Solidity optimizer */
  optimize?: boolean;
  /** Number of optimizer runs */
  optimizerRuns?: number;
  /** Use Yul intermediate representation compilation */
  viaIr?: boolean;
}
