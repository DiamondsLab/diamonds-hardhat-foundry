import { execSync, spawn } from "child_process";
import { Logger } from "./logger";

/**
 * Execute a Foundry command synchronously
 * @param command - The foundry command (e.g., "forge test")
 * @param args - Command arguments
 * @param options - Execution options
 */
export function execForgeSync(
  command: string,
  args: string[] = [],
  options: { cwd?: string; stdio?: "inherit" | "pipe" } = {}
): string {
  const fullCommand = `${command} ${args.join(" ")}`;
  Logger.step(`Running: ${fullCommand}`);

  try {
    const output = execSync(fullCommand, {
      cwd: options.cwd || process.cwd(),
      stdio: options.stdio || "pipe",
      encoding: "utf-8",
    });

    return output;
  } catch (error: any) {
    Logger.error(`Forge command failed: ${error.message}`);
    if (error.stdout) Logger.info(error.stdout);
    if (error.stderr) Logger.error(error.stderr);
    throw error;
  }
}

/**
 * Execute a Foundry command asynchronously
 * @param command - The foundry command (e.g., "forge")
 * @param args - Command arguments
 * @param options - Execution options
 */
export async function execForgeAsync(
  command: string,
  args: string[] = [],
  options: { cwd?: string; verbose?: boolean } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  Logger.step(`Running: ${command} ${args.join(" ")}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      if (options.verbose) {
        process.stdout.write(text);
      }
    });

    child.stderr?.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      if (options.verbose) {
        process.stderr.write(text);
      }
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code || 0 });
    });

    child.on("error", (error) => {
      Logger.error(`Failed to spawn ${command}: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Run forge test with specified options
 * @param options - Test execution options
 */
export async function runForgeTest(options: {
  matchTest?: string;
  matchContract?: string;
  verbosity?: number;
  gasReport?: boolean;
  forkUrl?: string;
  cwd?: string;
  env?: Record<string, string>;
}): Promise<{ success: boolean; output: string }> {
  const args: string[] = ["test"];

  if (options.matchTest) {
    args.push("--match-test", options.matchTest);
  }

  if (options.matchContract) {
    args.push("--match-contract", options.matchContract);
  }

  if (options.verbosity) {
    args.push("-" + "v".repeat(options.verbosity));
  }

  if (options.gasReport) {
    args.push("--gas-report");
  }

  if (options.forkUrl) {
    args.push("--fork-url", options.forkUrl);
  }

  try {
    const result = await execForgeAsync("forge", args, {
      cwd: options.cwd,
      verbose: true,
    });

    const success = result.exitCode === 0;
    
    if (success) {
      Logger.success("Forge tests passed!");
    } else {
      Logger.error("Forge tests failed");
    }

    return { success, output: result.stdout + result.stderr };
  } catch (error: any) {
    Logger.error(`Test execution failed: ${error.message}`);
    return { success: false, output: error.message };
  }
}

/**
 * Compile Forge contracts
 * @param options - Compilation options
 */
export async function compileForge(options: {
  cwd?: string;
  verbose?: boolean;
}): Promise<{ success: boolean; output: string }> {
  Logger.step("Compiling Forge contracts...");

  try {
    const result = await execForgeAsync("forge", ["build"], {
      cwd: options.cwd,
      verbose: options.verbose,
    });

    const success = result.exitCode === 0;
    
    if (success) {
      Logger.success("Forge compilation successful!");
    } else {
      Logger.error("Forge compilation failed");
    }

    return { success, output: result.stdout + result.stderr };
  } catch (error: any) {
    Logger.error(`Compilation failed: ${error.message}`);
    return { success: false, output: error.message };
  }
}

/**
 * Check if Foundry is installed
 */
export function isFoundryInstalled(): boolean {
  try {
    execSync("forge --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Foundry version
 */
export function getFoundryVersion(): string | null {
  try {
    const output = execSync("forge --version", { encoding: "utf-8", stdio: "pipe" });
    // Extract version from output like "forge 0.2.0 (abc123 2024-01-01T00:00:00.000000000Z)"
    const match = output.match(/forge\s+([\d.]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
