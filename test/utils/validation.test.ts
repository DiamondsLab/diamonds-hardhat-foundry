import { expect } from "chai";
import { DEFAULT_CONFIG } from "../../src/types/config";
import {
    validateConfig,
    validateFoundryInstallation,
    validatePeerDependency,
} from "../../src/utils/validation";

describe("Validation Utilities", () => {
  describe("validateConfig", () => {
    it("should return default config when no user config provided", () => {
      const result = validateConfig();
      expect(result).to.deep.equal(DEFAULT_CONFIG);
    });

    it("should merge user config with defaults", () => {
      const result = validateConfig({ helpersDir: "custom/path" });
      expect(result.helpersDir).to.equal("custom/path");
      expect(result.generateExamples).to.equal(DEFAULT_CONFIG.generateExamples);
    });

    it("should throw error for invalid helpersDir type", () => {
      expect(() => validateConfig({ helpersDir: 123 as any })).to.throw(
        "helpersDir must be a string"
      );
    });

    it("should throw error for invalid generateExamples type", () => {
      expect(() =>
        validateConfig({ generateExamples: "true" as any })
      ).to.throw("generateExamples must be a boolean");
    });

    it("should throw error for invalid exampleTests type", () => {
      expect(() => validateConfig({ exampleTests: "unit" as any })).to.throw(
        "exampleTests must be an array"
      );
    });

    it("should throw error for invalid exampleTests value", () => {
      expect(() => validateConfig({ exampleTests: ["invalid"] as any })).to.throw(
        "Invalid exampleTests value"
      );
    });

    it("should accept valid exampleTests values", () => {
      const result = validateConfig({ exampleTests: ["unit", "fuzz"] });
      expect(result.exampleTests).to.deep.equal(["unit", "fuzz"]);
    });

    it("should throw error for invalid defaultNetwork type", () => {
      expect(() => validateConfig({ defaultNetwork: 123 as any })).to.throw(
        "defaultNetwork must be a string"
      );
    });

    it("should throw error for invalid reuseDeployment type", () => {
      expect(() =>
        validateConfig({ reuseDeployment: "true" as any })
      ).to.throw("reuseDeployment must be a boolean");
    });

    it("should throw error for invalid forgeTestArgs type", () => {
      expect(() => validateConfig({ forgeTestArgs: "--verbose" as any })).to.throw(
        "forgeTestArgs must be an array"
      );
    });

    it("should accept valid forgeTestArgs", () => {
      const result = validateConfig({ forgeTestArgs: ["-vvv", "--gas-report"] });
      expect(result.forgeTestArgs).to.deep.equal(["-vvv", "--gas-report"]);
    });
  });

  describe("validateFoundryInstallation", () => {
    it("should return boolean for Foundry installation check", () => {
      const result = validateFoundryInstallation();
      expect(result).to.be.a("boolean");
    });
  });

  describe("validatePeerDependency", () => {
    it("should return true for installed packages", () => {
      const result = validatePeerDependency("chai");
      expect(result).to.be.true;
    });

    it("should return false for non-installed packages", () => {
      const result = validatePeerDependency("non-existent-package-xyz-123");
      expect(result).to.be.false;
    });
  });
});
