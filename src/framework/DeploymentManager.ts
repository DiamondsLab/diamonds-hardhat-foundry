import { Diamond } from "@diamondslab/diamonds/core";
import {
  LocalDiamondDeployer,
  LocalDiamondDeployerConfig,
} from "@diamondslab/hardhat-diamonds/dist/lib";
import "@nomicfoundation/hardhat-ethers";
import { existsSync } from "fs";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { join } from "path";
import { Logger } from "../utils/logger";

/**
 * DeploymentManager - Manages Diamond deployment lifecycle for Forge testing
 * 
 * Uses LocalDiamondDeployer from @diamondslab/hardhat-diamonds peer dependency
 * for portable, dependency-managed Diamond deployments.
 */
export class DeploymentManager {
  // In-memory cache for ephemeral deployments (when writeDeployedDiamondData: false)
  private deploymentCache: Map<string, Diamond> = new Map();

  constructor(private hre: HardhatRuntimeEnvironment) {}

  /**
   * Deploy a Diamond using LocalDiamondDeployer
   * @param diamondName - Name of the Diamond to deploy
   * @param networkName - Target network (hardhat, localhost, anvil)
   * @param force - Force redeployment even if exists
   * @param writeDeployedDiamondData - Whether to write deployment record to file
   */
  async deploy(
    diamondName: string = "ExampleDiamond",
    networkName: string = "hardhat",
    force: boolean = false,
    writeDeployedDiamondData: boolean = false
  ): Promise<Diamond> {
    Logger.section(`Deploying ${diamondName} to ${networkName}`);

    // Get provider and network info
    const provider = this.hre.ethers.provider;
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Check if deployment exists and handle force flag
    if (!force && this.hasDeploymentRecord(diamondName, networkName, chainId)) {
      Logger.info("Deployment record exists, using existing deployment");
      Logger.info("Use --force to redeploy");
      
      try {
        const deployer = await LocalDiamondDeployer.getInstance(this.hre, {
          diamondName,
          networkName,
          provider,
          chainId,
          writeDeployedDiamondData,
        } as LocalDiamondDeployerConfig);
        
        return await deployer.getDiamond();
      } catch (error) {
        throw new Error(
          `Failed to load deployment. Ensure @diamondslab/hardhat-diamonds is installed.\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    Logger.step("Initializing LocalDiamondDeployer...");
    
    try {
      const deployer = await LocalDiamondDeployer.getInstance(this.hre as any, {
        diamondName,
        networkName,
        provider,
        chainId,
        writeDeployedDiamondData,
      } as LocalDiamondDeployerConfig);

      await deployer.setVerbose(false); // Reduce noise, use our logger instead

      Logger.step("Deploying Diamond contract...");
      const diamond = await deployer.getDiamondDeployed();
      
      const deployedData = diamond.getDeployedDiamondData();
      
      Logger.success(`Diamond deployed at: ${deployedData.DiamondAddress}`);
      Logger.info(`Deployer: ${deployedData.DeployerAddress}`);
      Logger.info(`Facets deployed: ${Object.keys(deployedData.DeployedFacets || {}).length}`);

      // Cache deployment if not writing to file
      if (!writeDeployedDiamondData) {
        const cacheKey = `${diamondName}-${networkName}-${chainId}`;
        this.deploymentCache.set(cacheKey, diamond);
        Logger.info("Deployment cached in memory (not persisted to file)");
      }

      return diamond;
    } catch (error) {
      throw new Error(
        `Failed to deploy diamond. Ensure @diamondslab/hardhat-diamonds is installed.\n` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get existing deployment record
   * @param diamondName - Name of the Diamond
   * @param networkName - Network name
   * @param chainId - Chain ID
   */
  async getDeployment(
    diamondName: string = "ExampleDiamond",
    networkName: string = "hardhat",
    chainId?: number
  ): Promise<Diamond | null> {
    try {
      const provider = this.hre.ethers.provider;
      const network = await provider.getNetwork();
      const actualChainId = chainId ?? Number(network.chainId);

      // Check in-memory cache first (for ephemeral deployments)
      const cacheKey = `${diamondName}-${networkName}-${actualChainId}`;
      if (this.deploymentCache.has(cacheKey)) {
        Logger.info("Using cached deployment (ephemeral)");
        return this.deploymentCache.get(cacheKey)!;
      }

      if (!this.hasDeploymentRecord(diamondName, networkName, actualChainId)) {
        Logger.warn("No deployment record found");
        return null;
      }

      const deployer = await LocalDiamondDeployer.getInstance(this.hre as any, {
        diamondName,
        networkName,
        provider,
        chainId: actualChainId,
        writeDeployedDiamondData: false,
      } as LocalDiamondDeployerConfig);

      return await deployer.getDiamond();
    } catch (error) {
      Logger.error(`Failed to get deployment. Ensure @diamondslab/hardhat-diamonds is installed: ${error}`);
      return null;
    }
  }

  /**
   * Ensure deployment exists, deploy if needed
   * @param diamondName - Name of the Diamond
   * @param networkName - Network name
   * @param force - Force redeployment
   * @param writeDeployedDiamondData - Whether to write deployment record to file
   */
  async ensureDeployment(
    diamondName: string = "ExampleDiamond",
    networkName: string = "hardhat",
    force: boolean = false,
    writeDeployedDiamondData: boolean = false
  ): Promise<Diamond> {
    const provider = this.hre.ethers.provider;
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Check if deployment exists
    const existing = await this.getDeployment(diamondName, networkName, chainId);
    
    if (existing && !force) {
      Logger.info("Using existing deployment");
      return existing;
    }

    // Deploy if not exists or force is true
    return await this.deploy(diamondName, networkName, force, writeDeployedDiamondData);
  }

  /**
   * Check if deployment record exists
   * @private
   */
  private hasDeploymentRecord(
    diamondName: string,
    networkName: string,
    chainId: number
  ): boolean {
    const deploymentFileName = `${diamondName.toLowerCase()}-${networkName.toLowerCase()}-${chainId}.json`;
    const deploymentPath = join(
      this.hre.config.paths.root,
      "diamonds",
      diamondName,
      "deployments",
      deploymentFileName
    );

    return existsSync(deploymentPath);
  }

  /**
   * Get deployment file path
   */
  getDeploymentPath(
    diamondName: string,
    networkName: string,
    chainId: number
  ): string {
    const deploymentFileName = `${diamondName.toLowerCase()}-${networkName.toLowerCase()}-${chainId}.json`;
    return join(
      this.hre.config.paths.root,
      "diamonds",
      diamondName,
      "deployments",
      deploymentFileName
    );
  }
}
