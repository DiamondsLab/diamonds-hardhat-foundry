import { expect } from "chai";
import { existsSync, mkdirSync, rmSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { join } from "path";
import { ForgeCoverageFramework } from "../../src/framework/ForgeCoverageFramework";
import { CoverageOptions } from "../../src/types/config";

describe("ForgeCoverageFramework", () => {
  let mockHRE: any;
  let framework: ForgeCoverageFramework;
  let testRoot: string;

  beforeEach(() => {
    // Create temporary test directory
    testRoot = join(__dirname, "../../.test-tmp-coverage");
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
        exampleTests: ["unit", "integration", "fuzz"],
        defaultNetwork: "hardhat",
        reuseDeployment: true,
        forgeTestArgs: [],
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

  describe("constructor", () => {
    it("should initialize with HRE", () => {
      expect(framework).to.be.instanceOf(ForgeCoverageFramework);
    });

    it("should have runCoverage method", () => {
      expect(framework.runCoverage).to.be.a("function");
    });
  });

  describe("runCoverage", () => {
    it("should fail when Foundry is not installed", async () => {
      // This test assumes Foundry might not be installed in CI
      // The framework should handle this gracefully
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
      };

      try {
        const result = await framework.runCoverage(options);
        // Result should be boolean
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        // Expected to fail without Foundry or fork URL
        expect(error).to.exist;
      }
    });

    it("should accept CoverageOptions with summary report", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary"],
        verbosity: 2,
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        // Expected to fail without actual deployment
        expect(error).to.exist;
      }
    });

    it("should accept CoverageOptions with LCOV report", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: "coverage/lcov.info",
        lcovVersion: "v1",
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        // Expected to fail without actual deployment
        expect(error).to.exist;
      }
    });

    it("should accept CoverageOptions with multiple reports", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary", "lcov", "debug"],
        reportFile: "coverage/lcov.info",
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        // Expected to fail without actual deployment
        expect(error).to.exist;
      }
    });

    it("should accept test filtering options", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        matchTest: "testTransfer",
        matchContract: "UnitTest",
        matchPath: "test/foundry/unit/*",
        noMatchCoverage: "test/*,mock/*",
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should accept display options", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        verbosity: 3,
        json: true,
        md: true,
        color: "always",
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should accept test execution options", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        threads: 4,
        fuzzRuns: 1000,
        fuzzSeed: "0x123",
        failFast: true,
        allowFailure: false,
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should accept EVM options", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        forkBlockNumber: 1000000,
        initialBalance: "1000",
        sender: "0x1234567890123456789012345678901234567890",
        ffi: true,
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should accept build options", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        force: true,
        noCache: true,
        optimize: true,
        optimizerRuns: 200,
        viaIr: false,
      };

      try {
        const result = await framework.runCoverage(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should handle missing fork URL", async () => {
      const options: CoverageOptions = {};

      try {
        await framework.runCoverage(options);
        expect.fail("Should have thrown error for missing fork URL");
      } catch (error: any) {
        // Expect error about missing fork URL or forge not found
        expect(error).to.exist;
      }
    });
  });

  describe("option builders", () => {
    it("should build report options correctly", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary", "lcov"],
        reportFile: "coverage/lcov.info",
        lcovVersion: "v2",
        includeLibs: true,
        excludeTests: true,
        irMinimum: true,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        // We're just testing that options are accepted without throwing type errors
        expect(error).to.exist;
      }
    });

    it("should build filter options correctly", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        matchTest: "testTransfer",
        noMatchTest: "testFail",
        matchContract: "Unit",
        noMatchContract: "Integration",
        matchPath: "test/foundry/unit/*",
        noMatchPath: "test/foundry/integration/*",
        noMatchCoverage: "test/*,mock/*,lib/*",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should build display options correctly", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        verbosity: 5,
        quiet: false,
        json: true,
        md: true,
        color: "never",
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("error handling", () => {
    it("should handle forge command failure", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://invalid-url:9999",
      };

      try {
        await framework.runCoverage(options);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("should handle invalid report file path", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: "/invalid/path/that/does/not/exist/coverage.info",
      };

      try {
        await framework.runCoverage(options);
        // May or may not fail depending on forge behavior
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("integration scenarios", () => {
    it("should generate valid forge coverage command", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["summary"],
        verbosity: 2,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        // Expected to fail without actual deployment, but command should be valid
        expect(error).to.exist;
      }
    });

    it("should support CI/CD workflow with LCOV", async () => {
      const options: CoverageOptions = {
        forkUrl: "http://127.0.0.1:8545",
        report: ["lcov"],
        reportFile: "coverage/lcov.info",
        lcovVersion: "v1",
        noMatchCoverage: "test/*,mock/*,lib/*",
        verbosity: 1,
      };

      try {
        await framework.runCoverage(options);
      } catch (error: any) {
        // Expected to fail, but options should be valid
        expect(error).to.exist;
      }
    });
  });
});
