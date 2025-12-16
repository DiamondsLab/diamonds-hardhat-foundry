import { exec as execCallback, execSync } from "child_process";
import { NomicLabsHardhatPluginError } from "hardhat/internal/core/errors";
import picocolors from "picocolors";
import { promisify } from "util";

const exec = promisify(execCallback);

type Remappings = Record<string, string>;

let cachedRemappings: Promise<Remappings> | undefined;

export class HardhatFoundryError extends NomicLabsHardhatPluginError {
  constructor(message: string, parent?: Error) {
    super("diamonds-hardhat-foundry", message, parent);
  }
}

class ForgeInstallError extends HardhatFoundryError {
  constructor(dependency: string, parent: Error) {
    super(
      `Couldn't install '${dependency}', please install it manually.

${parent.message}
`,
      parent
    );
  }
}

export function getForgeConfig() {
  return JSON.parse(runCmdSync("forge config --json"));
}

export function parseRemappings(remappingsTxt: string): Remappings {
  const remappings: Remappings = {};
  const remappingLines = remappingsTxt.split(/\r\n|\r|\n/);
  for (const remappingLine of remappingLines) {
    if (remappingLine.trim() === "") {
      continue;
    }

    if (remappingLine.includes(":")) {
      throw new HardhatFoundryError(
        `Invalid remapping '${remappingLine}', remapping contexts are not allowed`
      );
    }

    if (!remappingLine.includes("=")) {
      throw new HardhatFoundryError(
        `Invalid remapping '${remappingLine}', remappings without a target are not allowed`
      );
    }

    const fromTo = remappingLine.split("=");

    // if the remapping already exists, we ignore it because the first one wins
    if (remappings[fromTo[0]] !== undefined) {
      continue;
    }

    remappings[fromTo[0]] = fromTo[1];
  }

  return remappings;
}

export async function getRemappings() {
  // Get remappings only once
  if (cachedRemappings === undefined) {
    cachedRemappings = runCmd("forge remappings").then(parseRemappings);
  }

  return cachedRemappings;
}

export async function installDependency(dependency: string) {
  // Check if --no-commit flag is supported. Best way is checking the help text
  const helpText = await runCmd("forge install --help");
  const useNoCommitFlag = helpText.includes("--no-commit");

  const cmd = `forge install ${
    useNoCommitFlag ? "--no-commit" : ""
  } ${dependency}`;

  console.log(`Running '${picocolors.blue(cmd)}'`);

  try {
    await exec(cmd);
  } catch (error: any) {
    throw new ForgeInstallError(dependency, error);
  }
}

function runCmdSync(cmd: string): string {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString();
  } catch (error: any) {
    const pluginError = buildForgeExecutionError(
      error.status,
      error.stderr.toString()
    );

    throw pluginError;
  }
}

async function runCmd(cmd: string): Promise<string> {
  try {
    const { stdout } = await exec(cmd);
    return stdout;
  } catch (error: any) {
    throw buildForgeExecutionError(error.code, error.message);
  }
}

function buildForgeExecutionError(
  exitCode: number | undefined,
  message: string
) {
  switch (exitCode) {
    case 127:
      return new HardhatFoundryError(
        "Couldn't run `forge`. Please check that your foundry installation is correct."
      );
    case 134:
      return new HardhatFoundryError(
        "Running `forge` failed. Please check that your foundry.toml file is correct."
      );
    default:
      return new HardhatFoundryError(
        `Unexpected error while running \`forge\`: ${message}`
      );
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
 * Compile Forge contracts
 */
export async function compileForge(options: {
  cwd?: string;
  verbose?: boolean;
}): Promise<{ success: boolean; output?: string }> {
  const { cwd = process.cwd(), verbose = false } = options;
  
  try {
    const args = ["build"];
    if (!verbose) {
      args.push("--quiet");
    }
    
    const { stdout, stderr } = await exec(`forge ${args.join(" ")}`, { cwd });
    return { success: true, output: stdout || stderr };
  } catch (error: any) {
    console.error("Forge build failed:", error.message);
    return { success: false, output: error.message };
  }
}

/**
 * Run Forge tests with optional forking
 */
export async function runForgeTest(options: {
  matchTest?: string;
  matchContract?: string;
  verbosity?: number;
  gasReport?: boolean;
  forkUrl?: string;
  cwd?: string;
}): Promise<{ success: boolean; output?: string }> {
  const {
    matchTest,
    matchContract,
    verbosity = 2,
    gasReport = false,
    forkUrl,
    cwd = process.cwd(),
  } = options;

  try {
    const args = ["test"];

    // Add verbosity
    if (verbosity > 0 && verbosity <= 5) {
      args.push(`-${"v".repeat(verbosity)}`);
    }

    // Add test filters
    if (matchTest) {
      args.push("--match-test", matchTest);
    }

    if (matchContract) {
      args.push("--match-contract", matchContract);
    }

    // Add gas reporting
    if (gasReport) {
      args.push("--gas-report");
    }

    // CRITICAL: Add fork URL to connect to deployed Diamond
    // This allows Forge tests to access the Hardhat-deployed Diamond contract
    if (forkUrl) {
      args.push("--fork-url", forkUrl);
    }

    const cmd = `forge ${args.join(" ")}`;
    console.log(`\nRunning: ${picocolors.blue(cmd)}\n`);

    const { stdout, stderr } = await exec(cmd, { cwd, maxBuffer: 10 * 1024 * 1024 });
    console.log(stdout);
    if (stderr) console.error(stderr);

    return { success: true, output: stdout };
  } catch (error: any) {
    // Forge returns non-zero exit code when tests fail
    // We still want to show the output
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);

    return {
      success: false,
      output: error.stdout || error.stderr || error.message,
    };
  }
}
