// Minimal Hardhat config used ONLY to bootstrap a HardhatRuntimeEnvironment for
// the mocha test suite. The framework modules import "@nomicfoundation/hardhat-ethers",
// which calls extendEnvironment() at load time and therefore requires a HardhatContext
// to already exist. `hardhat/register` (see .mocharc.json) loads this config to create it.
import "@nomicfoundation/hardhat-ethers";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
};

export default config;
