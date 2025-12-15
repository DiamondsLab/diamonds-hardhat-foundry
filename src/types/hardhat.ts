/**
 * Type extensions for Hardhat Runtime Environment
 */

import "hardhat/types/config";
import "hardhat/types/runtime";
import { DiamondsFoundryConfig } from "../types/config";

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    diamondsFoundry?: Partial<DiamondsFoundryConfig>;
  }

  export interface HardhatConfig {
    diamondsFoundry: Required<DiamondsFoundryConfig>;
  }
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    diamondsFoundry: Required<DiamondsFoundryConfig>;
  }
}
