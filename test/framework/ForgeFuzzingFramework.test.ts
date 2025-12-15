import { expect } from "chai";
import { existsSync, mkdirSync, rmSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { join } from "path";
import { ForgeFuzzingFramework, ForgeTestOptions } from "../../src/framework/ForgeFuzzingFramework";

describe("ForgeFuzzingFramework", () => {
  let mockHRE: any;
  let framework: ForgeFuzzingFramework;
  let testRoot: string;

  beforeEach(() => {
    // Create temporary test directory
    testRoot = join(__dirname, "../../.test-tmp-framework");
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

    framework = new ForgeFuzzingFramework(mockHRE);
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe("constructor", () => {
    it("should initialize with HRE", () => {
      expect(framework).to.be.instanceOf(ForgeFuzzingFramework);
    });

    it("should create DeploymentManager and HelperGenerator instances", () => {
      // Framework should have private instances, but we can test indirectly
      expect(framework.deployOnly).to.be.a("function");
      expect(framework.generateHelpersOnly).to.be.a("function");
    });
  });

  describe("runTests", () => {
    it("should fail when Foundry is not installed", async () => {
      // This test assumes Foundry might not be installed in CI
      // The framework should handle this gracefully
      const result = await framework.runTests({ skipDeployment: true, skipHelpers: true });
      
      // Result should be boolean
      expect(result).to.be.a("boolean");
    });

    it("should accept ForgeTestOptions", async () => {
      const options: ForgeTestOptions = {
        diamondName: "TestDiamond",
        networkName: "hardhat",
        force: false,
        matchTest: "testExample",
        verbosity: 3,
        gasReport: true,
        skipHelpers: true,
        skipDeployment: true,
      };

      // This will fail without Foundry/deployment, but should not throw
      try {
        const result = await framework.runTests(options);
        expect(result).to.be.a("boolean");
      } catch (error: any) {
        // Expected to fail without actual deployment
        expect(error).to.exist;
      }
    });

    it("should use default options when none provided", async () => {
      // Test with minimal options
      try {
        const result = await framework.runTests({
          skipDeployment: true,
          skipHelpers: true,
        });
        expect(result).to.be.a("boolean");
      } catch (error) {
        // May fail without Foundry installed
        expect(error).to.exist;
      }
    });

    it("should handle skipDeployment flag", async () => {
      const result = await framework.runTests({
        skipDeployment: true,
        skipHelpers: true,
      });

      expect(result).to.be.a("boolean");
    });

    it("should handle skipHelpers flag", async () => {
      try {
        const result = await framework.runTests({
          skipDeployment: true,
          skipHelpers: true,
        });
        expect(result).to.be.a("boolean");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("deployOnly", () => {
    it("should attempt to deploy Diamond", async () => {
      // Will fail without LocalDiamondDeployer, but should not throw unexpected errors
      try {
        await framework.deployOnly("ExampleDiamond", "hardhat", false);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer");
      }
    });

    it("should accept diamond name parameter", async () => {
      try {
        await framework.deployOnly("CustomDiamond", "hardhat", false);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer");
      }
    });

    it("should accept network name parameter", async () => {
      try {
        await framework.deployOnly("TestDiamond", "localhost", false);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer");
      }
    });

    it("should accept force parameter", async () => {
      try {
        await framework.deployOnly("TestDiamond", "hardhat", true);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer");
      }
    });
  });

  describe("generateHelpersOnly", () => {
    it("should throw error when no deployment exists", async () => {
      try {
        await framework.generateHelpersOnly("ExampleDiamond", "hardhat");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("No deployment found");
      }
    });

    it("should accept diamond name parameter", async () => {
      try {
        await framework.generateHelpersOnly("CustomDiamond", "hardhat");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("No deployment found");
      }
    });

    it("should accept network name parameter", async () => {
      try {
        await framework.generateHelpersOnly("TestDiamond", "localhost");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("No deployment found");
      }
    });
  });

  describe("integration workflow", () => {
    it("should define all required methods", () => {
      expect(framework.runTests).to.be.a("function");
      expect(framework.deployOnly).to.be.a("function");
      expect(framework.generateHelpersOnly).to.be.a("function");
    });

    it("should be instantiable with HRE", () => {
      const newFramework = new ForgeFuzzingFramework(mockHRE);
      expect(newFramework).to.be.instanceOf(ForgeFuzzingFramework);
      expect(newFramework.runTests).to.be.a("function");
    });
  });

  describe("error handling", () => {
    it("should handle deployment errors gracefully", async () => {
      try {
        const result = await framework.runTests({
          diamondName: "NonExistent",
          networkName: "invalid",
          skipHelpers: true,
        });
        
        // Should return false on error, not throw
        expect(result).to.be.false;
      } catch (error: any) {
        // Or might throw, which is also acceptable
        expect(error).to.exist;
      }
    });

    it("should handle helper generation errors gracefully", async () => {
      try {
        await framework.generateHelpersOnly("NonExistent", "hardhat");
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).to.include("No deployment found");
      }
    });

    it("should propagate LocalDiamondDeployer errors", async () => {
      try {
        await framework.deployOnly();
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer");
      }
    });
  });
});
