import { expect } from "chai";
import { HelperGenerator } from "../../src/framework/HelperGenerator";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { existsSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { DeployedDiamondData } from "@diamondslab/diamonds";

describe("HelperGenerator", () => {
  let mockHRE: any;
  let helperGenerator: HelperGenerator;
  let testRoot: string;

  beforeEach(() => {
    // Create temporary test directory
    testRoot = join(__dirname, "../../.test-tmp-helpers");
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
      diamondsFoundry: {
        helpersDir: "test/foundry/helpers",
        generateExamples: true,
        exampleTests: ["unit", "integration", "fuzz"],
      },
    } as unknown as HardhatRuntimeEnvironment;

    helperGenerator = new HelperGenerator(mockHRE);
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe("scaffoldProject", () => {
    it("should create directory structure", async () => {
      await helperGenerator.scaffoldProject();

      const helpersPath = join(testRoot, "test/foundry/helpers");
      const unitPath = join(testRoot, "test/foundry/unit");
      const integrationPath = join(testRoot, "test/foundry/integration");
      const fuzzPath = join(testRoot, "test/foundry/fuzz");

      expect(existsSync(helpersPath)).to.be.true;
      expect(existsSync(unitPath)).to.be.true;
      expect(existsSync(integrationPath)).to.be.true;
      expect(existsSync(fuzzPath)).to.be.true;
    });

    it("should accept custom output directory", async () => {
      await helperGenerator.scaffoldProject("custom/test/path");

      const customPath = join(testRoot, "custom/test/path");
      expect(existsSync(customPath)).to.be.true;
    });

    it("should create nested directories recursively", async () => {
      await helperGenerator.scaffoldProject("very/deep/nested/structure");

      const deepPath = join(testRoot, "very/deep/nested/structure");
      expect(existsSync(deepPath)).to.be.true;
    });
  });

  describe("generateDeploymentHelpers", () => {
    it("should generate DiamondDeployment.sol file", async () => {
      const mockDeploymentData: DeployedDiamondData = {
        DiamondAddress: "0x1234567890123456789012345678901234567890",
        DeployerAddress: "0x0987654321098765432109876543210987654321",
        DeployedFacets: {
          DiamondCutFacet: {
            address: "0xABC0000000000000000000000000000000000000",
            tx_hash: "0x123",
            version: 1,
            funcSelectors: ["0x12345678"],
          },
          DiamondLoupeFacet: {
            address: "0xDEF0000000000000000000000000000000000000",
            tx_hash: "0x456",
            version: 1,
            funcSelectors: ["0x87654321"],
          },
        },
      };

      const outputPath = await helperGenerator.generateDeploymentHelpers(
        "ExampleDiamond",
        "hardhat",
        31337,
        mockDeploymentData
      );

      expect(existsSync(outputPath)).to.be.true;
      expect(outputPath).to.include("DiamondDeployment.sol");
    });

    it("should include Diamond address in generated file", async () => {
      const mockDeploymentData: DeployedDiamondData = {
        DiamondAddress: "0x1234567890123456789012345678901234567890",
        DeployerAddress: "0x0987654321098765432109876543210987654321",
        DeployedFacets: {},
      };

      const outputPath = await helperGenerator.generateDeploymentHelpers(
        "TestDiamond",
        "hardhat",
        31337,
        mockDeploymentData
      );

      const content = readFileSync(outputPath, "utf8");
      expect(content).to.include("0x1234567890123456789012345678901234567890");
      expect(content).to.include("library DiamondDeployment");
    });

    it("should include facet addresses in generated file", async () => {
      const mockDeploymentData: DeployedDiamondData = {
        DiamondAddress: "0x1111111111111111111111111111111111111111",
        DeployerAddress: "0x2222222222222222222222222222222222222222",
        DeployedFacets: {
          CustomFacet: {
            address: "0x3333333333333333333333333333333333333333",
            tx_hash: "0xabc",
            version: 1,
            funcSelectors: ["0x12345678"],
          },
        },
      };

      const outputPath = await helperGenerator.generateDeploymentHelpers(
        "CustomDiamond",
        "localhost",
        1337,
        mockDeploymentData
      );

      const content = readFileSync(outputPath, "utf8");
      expect(content).to.include("0x3333333333333333333333333333333333333333");
      expect(content).to.include("CustomFacet");
    });

    it("should create helpers directory if it doesn't exist", async () => {
      const mockDeploymentData: DeployedDiamondData = {
        DiamondAddress: "0x1111111111111111111111111111111111111111",
        DeployerAddress: "0x2222222222222222222222222222222222222222",
        DeployedFacets: {},
      };

      const helpersPath = join(testRoot, "test/foundry/helpers");
      expect(existsSync(helpersPath)).to.be.false;

      await helperGenerator.generateDeploymentHelpers(
        "NewDiamond",
        "hardhat",
        31337,
        mockDeploymentData
      );

      expect(existsSync(helpersPath)).to.be.true;
    });

    it("should generate valid Solidity syntax", async () => {
      const mockDeploymentData: DeployedDiamondData = {
        DiamondAddress: "0x1111111111111111111111111111111111111111",
        DeployerAddress: "0x2222222222222222222222222222222222222222",
        DeployedFacets: {
          Facet1: {
            address: "0x3333333333333333333333333333333333333333",
            tx_hash: "0xabc",
            version: 1,
            funcSelectors: [],
          },
        },
      };

      const outputPath = await helperGenerator.generateDeploymentHelpers(
        "ValidDiamond",
        "hardhat",
        31337,
        mockDeploymentData
      );

      const content = readFileSync(outputPath, "utf8");
      
      // Check for valid Solidity structure
      expect(content).to.include("// SPDX-License-Identifier:");
      expect(content).to.include("pragma solidity");
      expect(content).to.include("library DiamondDeployment");
      expect(content).to.match(/address\s+constant/); // Has constant declarations
    });
  });

  describe("generateExampleTests", () => {
    it("should respect generateExamples config flag", async () => {
      const result = await helperGenerator.generateExampleTests();
      expect(result).to.be.an("array");
    });

    it("should return empty array when generateExamples is false", async () => {
      mockHRE.diamondsFoundry.generateExamples = false;
      const generator = new HelperGenerator(mockHRE);
      
      const result = await generator.generateExampleTests();
      expect(result).to.be.an("array");
      expect(result).to.have.length(0);
    });

    it("should process all example types in config", async () => {
      mockHRE.diamondsFoundry.exampleTests = ["unit", "fuzz"];
      const generator = new HelperGenerator(mockHRE);
      
      const result = await generator.generateExampleTests();
      expect(result).to.be.an("array");
    });
  });

  describe("integration", () => {
    it("should handle complete workflow", async () => {
      // 1. Scaffold project
      await helperGenerator.scaffoldProject();

      // 2. Generate deployment helpers
      const mockDeploymentData: DeployedDiamondData = {
        DiamondAddress: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        DeployerAddress: "0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
        DeployedFacets: {
          TestFacet: {
            address: "0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            tx_hash: "0x789",
            version: 1,
            funcSelectors: ["0xabcdef12"],
          },
        },
      };

      const helperPath = await helperGenerator.generateDeploymentHelpers(
        "IntegrationDiamond",
        "hardhat",
        31337,
        mockDeploymentData
      );

      // 3. Generate examples
      const examplePaths = await helperGenerator.generateExampleTests();

      // Verify structure
      const basePath = join(testRoot, "test/foundry");
      expect(existsSync(join(basePath, "helpers"))).to.be.true;
      expect(existsSync(join(basePath, "unit"))).to.be.true;
      expect(existsSync(join(basePath, "integration"))).to.be.true;
      expect(existsSync(join(basePath, "fuzz"))).to.be.true;
      expect(existsSync(helperPath)).to.be.true;

      // Verify helper content
      const content = readFileSync(helperPath, "utf8");
      expect(content).to.include("IntegrationDiamond");
      expect(content).to.include("TestFacet");
    });
  });
});
