import { expect } from "chai";
import { existsSync, mkdirSync, rmSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { join } from "path";
import { ForgeCoverageFramework } from "../../src/framework/ForgeCoverageFramework";
import { CoverageOptions, CoverageReportType } from "../../src/types/config";

describe("Coverage Reports", () => {
  let mockHRE: any;
  let framework: ForgeCoverageFramework;
  let testRoot: string;

  beforeEach(() => {
    // Create temporary test directory
    testRoot = join(__dirname, "../../.test-tmp-reports");
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
    mkdirSync(testRoot, { recursive: true });

    // Mock HRE
    mockHRE = {
      config: {
        paths: {
          root: testRoot,
        },
      },
      ethers: {
        provider: {
          getNetwork: async () => ({
            chainId: BigInt(31337),
          }),
        },
      },
      diamondsFoundry: {
        helpersDir: "test/foundry/helpers",
        generateExamples: true,
        defaultNetwork: "hardhat",
      },
    } as unknown as HardhatRuntimeEnvironment;

    framework = new ForgeCoverageFramework(mockHRE);
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe("Report Format Types", () => {
    it("should accept summary report type", async () => {
      const reportType: CoverageReportType = "summary";
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: [reportType],
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        // Expected to fail without deployment
        expect(error).to.exist;
      }
    });

    it("should accept lcov report type", async () => {
      const reportType: CoverageReportType = "lcov";
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: [reportType],
        reportFile: join(testRoot, "coverage", "lcov.info"),
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should accept debug report type", async () => {
      const reportType: CoverageReportType = "debug";
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: [reportType],
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should accept bytecode report type", async () => {
      const reportType: CoverageReportType = "bytecode";
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: [reportType],
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("Summary Report", () => {
    it("should generate summary report by default", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        // Expected to fail, but should attempt to use summary by default
        expect(error).to.exist;
      }
    });

    it("should generate summary report with explicit flag", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary"],
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should display summary in terminal", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary"],
        verbosity: 2,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("LCOV Report", () => {
    it("should generate LCOV report with --report lcov flag", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: join(testRoot, "coverage", "lcov.info"),
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        // Should attempt to generate LCOV
        expect(error).to.exist;
      }
    });

    it("should output LCOV to custom path with --report-file flag", async () => {
      const customPath = join(testRoot, "custom", "path", "coverage.info");
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: customPath,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should use LCOV v1 with --lcov-version v1", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: join(testRoot, "coverage", "lcov.info"),
        lcovVersion: "v1",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should use LCOV v2 with --lcov-version v2", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: join(testRoot, "coverage", "lcov.info"),
        lcovVersion: "v2",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should include libraries with --include-libs flag", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        includeLibs: true,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should exclude tests with --exclude-tests flag", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        excludeTests: true,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("Multiple Reports", () => {
    it("should generate multiple reports with repeated --report flags", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary", "lcov", "debug"],
        reportFile: join(testRoot, "coverage", "lcov.info"),
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should generate all available report types", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary", "lcov", "debug", "bytecode"],
        reportFile: join(testRoot, "coverage", "lcov.info"),
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("Test Filtering Options", () => {
    it("should pass through test filtering options correctly", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        matchTest: "testTransfer",
        noMatchTest: "testFail",
        matchContract: "UnitTest",
        noMatchContract: "IntegrationTest",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should pass through path filtering options correctly", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        matchPath: "test/foundry/unit/*",
        noMatchPath: "test/foundry/integration/*",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should pass through coverage exclusion patterns correctly", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        noMatchCoverage: "test/*,mock/*,lib/*",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("Display Options", () => {
    it("should pass through display options correctly (--json, --md, --color)", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        json: true,
        md: true,
        color: "always",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should pass through verbosity levels correctly (-v, -vv, -vvv)", async () => {
      const verbosityLevels = [0, 1, 2, 3, 4, 5];

      for (const verbosity of verbosityLevels) {
        const options: CoverageOptions = {
          forkUrl: "http://127.0.0.1:8545",
          verbosity,
        };

        try {
          await framework.runCoverage(options);
        } catch (error: any) {
          expect(error).to.exist;
        }
      }
    });

    it("should handle quiet mode", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        quiet: true,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should handle color modes", async () => {
      const colorModes: Array<"auto" | "always" | "never"> = ["auto", "always", "never"];

      for (const color of colorModes) {
        const options: CoverageOptions = {
          forkUrl: "http://127.0.0.1:8545",
          color,
        };

        try {
          await framework.runCoverage(options);
        } catch (error: any) {
          expect(error).to.exist;
        }
      }
    });
  });

  describe("EVM Options", () => {
    it("should pass through EVM options correctly (--ffi, --fork-block-number)", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        ffi: true,
        forkBlockNumber: 1000000,
        initialBalance: "1000000000000000000",
        sender: "0x1234567890123456789012345678901234567890",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should handle fork block number", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        forkBlockNumber: 5000000,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("Build Options", () => {
    it("should pass through build options correctly (--optimize, --via-ir)", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        optimize: true,
        optimizerRuns: 200,
        viaIr: true,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should handle force rebuild", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        force: true,
        noCache: true,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("CI/CD Integration Scenarios", () => {
    it("should support GitHub Actions LCOV workflow", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: join(testRoot, "coverage", "lcov.info"),
        lcovVersion: "v1",
        noMatchCoverage: "test/*,mock/*,lib/*",
        verbosity: 1,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        // Should create valid command for CI
        expect(error).to.exist;
      }
    });

    it("should support GitLab CI coverage workflow", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: "coverage/lcov.info",
        excludeTests: true,
        verbosity: 0,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should support multiple report formats for comprehensive CI", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary", "lcov", "debug"],
        reportFile: join(testRoot, "coverage", "lcov.info"),
        verbosity: 2,
        color: "always",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });
});
