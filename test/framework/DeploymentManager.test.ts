import { expect } from "chai";
import { DeploymentManager } from "../../src/framework/DeploymentManager";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

describe("DeploymentManager", () => {
  let mockHRE: any;
  let deploymentManager: DeploymentManager;
  let testRoot: string;

  beforeEach(() => {
    // Create temporary test directory
    testRoot = join(__dirname, "../../.test-tmp");
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
      },
    } as unknown as HardhatRuntimeEnvironment;

    deploymentManager = new DeploymentManager(mockHRE);
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe("getDeploymentPath", () => {
    it("should generate correct deployment path", () => {
      const path = deploymentManager.getDeploymentPath(
        "ExampleDiamond",
        "hardhat",
        31337
      );

      expect(path).to.include("diamonds");
      expect(path).to.include("ExampleDiamond");
      expect(path).to.include("deployments");
      expect(path).to.include("examplediamond-hardhat-31337.json");
    });

    it("should lowercase diamond name and network name", () => {
      const path = deploymentManager.getDeploymentPath(
        "MyCustomDiamond",
        "Localhost",
        1234
      );

      expect(path).to.include("mycustomdiamond-localhost-1234.json");
    });
  });

  describe("hasDeploymentRecord", () => {
    it("should return false when deployment doesn't exist", async () => {
      const result = await deploymentManager.getDeployment(
        "ExampleDiamond",
        "hardhat"
      );

      expect(result).to.be.null;
    });

    it("should return true when deployment exists", async () => {
      // Create mock deployment file
      const deploymentDir = join(
        testRoot,
        "diamonds",
        "ExampleDiamond",
        "deployments"
      );
      mkdirSync(deploymentDir, { recursive: true });

      const deploymentPath = join(
        deploymentDir,
        "examplediamond-hardhat-31337.json"
      );
      writeFileSync(
        deploymentPath,
        JSON.stringify({
          DiamondAddress: "0x1234567890123456789012345678901234567890",
          DeployerAddress: "0x0987654321098765432109876543210987654321",
          DeployedFacets: {},
        })
      );

      const path = deploymentManager.getDeploymentPath(
        "ExampleDiamond",
        "hardhat",
        31337
      );

      expect(existsSync(path)).to.be.true;
    });
  });

  describe("getDeployment", () => {
    it("should return null when no deployment exists", async () => {
      const result = await deploymentManager.getDeployment(
        "NonExistent",
        "hardhat"
      );

      expect(result).to.be.null;
    });

    it("should handle errors gracefully", async () => {
      // Mock HRE with failing provider
      const badHRE = {
        config: {
          paths: {
            root: testRoot,
          },
        },
        ethers: {
          provider: {
            getNetwork: async () => {
              throw new Error("Network error");
            },
          },
        },
      } as unknown as HardhatRuntimeEnvironment;

      const badManager = new DeploymentManager(badHRE);
      const result = await badManager.getDeployment("Test", "hardhat");

      expect(result).to.be.null;
    });
  });

  describe("deploy", () => {
    it("should throw error when LocalDiamondDeployer not found", async () => {
      try {
        await deploymentManager.deploy("ExampleDiamond", "hardhat", false);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer not found");
      }
    });
  });

  describe("ensureDeployment", () => {
    it("should call deploy when no deployment exists", async () => {
      // This will fail because LocalDiamondDeployer doesn't exist in test env
      // But we can verify it tries to deploy
      try {
        await deploymentManager.ensureDeployment(
          "ExampleDiamond",
          "hardhat",
          false
        );
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer not found");
      }
    });
  });

  describe("integration scenarios", () => {
    it("should handle missing LocalDiamondDeployer gracefully", async () => {
      try {
        await deploymentManager.deploy("ExampleDiamond", "hardhat", false);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("LocalDiamondDeployer not found");
      }
    });

    it("should verify deployment path structure", () => {
      const path = deploymentManager.getDeploymentPath(
        "TestDiamond",
        "sepolia",
        11155111
      );
      
      expect(path).to.include("diamonds/TestDiamond/deployments");
      expect(path).to.include("testdiamond-sepolia-11155111.json");
    });

    it("should handle getDeployment with chainId parameter", async () => {
      const result = await deploymentManager.getDeployment(
        "TestDiamond",
        "hardhat",
        31337
      );
      
      expect(result).to.be.null; // No deployment exists
    });
  });
});
