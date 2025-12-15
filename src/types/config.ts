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
