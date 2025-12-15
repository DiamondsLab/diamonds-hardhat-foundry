import { execSync } from "child_process";
import { existsSync } from "fs";
import { Logger } from "./logger";
import { DiamondsFoundryConfig, DEFAULT_CONFIG } from "../types/config";

/**
 * Validation utilities for diamonds-hardhat-foundry plugin
 */

/**
 * Check if Foundry is installed
 */
export function validateFoundryInstallation(): boolean {
  try {
    execSync("forge --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Foundry is installed and throw error if not
 */
export function requireFoundry(): void {
  if (!validateFoundryInstallation()) {
    Logger.error("Foundry is not installed or not in PATH");
    Logger.info("Install Foundry from: https://getfoundry.sh/");
    throw new Error("Foundry is required but not found");
  }
}

/**
 * Check if a peer dependency is installed
 */
export function validatePeerDependency(packageName: string): boolean {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if required peer dependencies are installed
 */
export function validatePeerDependencies(): void {
  const requiredDeps = [
    "@diamondslab/diamonds",
    "@diamondslab/hardhat-diamonds",
  ];

  const missing: string[] = [];

  for (const dep of requiredDeps) {
    if (!validatePeerDependency(dep)) {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    Logger.error("Missing required peer dependencies:");
    missing.forEach((dep) => Logger.error(`  - ${dep}`));
    Logger.info("\nInstall them with:");
    Logger.info(`  npm install ${missing.join(" ")}`);
    throw new Error("Missing peer dependencies");
  }
}

/**
 * Validate and merge user config with defaults
 */
export function validateConfig(
  userConfig?: Partial<DiamondsFoundryConfig>
): Required<DiamondsFoundryConfig> {
  const config: Required<DiamondsFoundryConfig> = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  // Validate helpersDir is a string
  if (typeof config.helpersDir !== "string") {
    throw new Error("diamondsFoundry.helpersDir must be a string");
  }

  // Validate generateExamples is boolean
  if (typeof config.generateExamples !== "boolean") {
    throw new Error("diamondsFoundry.generateExamples must be a boolean");
  }

  // Validate exampleTests is array
  if (!Array.isArray(config.exampleTests)) {
    throw new Error("diamondsFoundry.exampleTests must be an array");
  }

  // Validate exampleTests values
  const validTests = ["unit", "integration", "fuzz"];
  for (const test of config.exampleTests) {
    if (!validTests.includes(test)) {
      throw new Error(
        `Invalid exampleTests value: ${test}. Must be one of: ${validTests.join(", ")}`
      );
    }
  }

  // Validate defaultNetwork is string
  if (typeof config.defaultNetwork !== "string") {
    throw new Error("diamondsFoundry.defaultNetwork must be a string");
  }

  // Validate reuseDeployment is boolean
  if (typeof config.reuseDeployment !== "boolean") {
    throw new Error("diamondsFoundry.reuseDeployment must be a boolean");
  }

  // Validate forgeTestArgs is array
  if (!Array.isArray(config.forgeTestArgs)) {
    throw new Error("diamondsFoundry.forgeTestArgs must be an array");
  }

  return config;
}

/**
 * Check if a directory exists
 */
export function validateDirectoryExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Validate output directory doesn't have conflicts
 */
export function validateOutputDirectory(
  path: string,
  force: boolean = false
): void {
  if (!force && validateDirectoryExists(path)) {
    Logger.warn(`Output directory already exists: ${path}`);
    Logger.info("Use --force to overwrite");
    throw new Error("Output directory exists");
  }
}
