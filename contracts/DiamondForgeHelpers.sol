// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";

/**
 * @title DiamondForgeHelpers
 * @notice Common test utilities for Diamond contract testing with Forge
 * @dev Provides helper functions for accessing Diamond deployment data and logging
 */
library DiamondForgeHelpers {
    /**
     * @notice Get the Diamond contract address
     * @param diamondAddress The address of the deployed Diamond
     * @return The Diamond address
     */
    function getDiamondAddress(address diamondAddress) internal pure returns (address) {
        return diamondAddress;
    }

    /**
     * @notice Get a facet address from the deployment
     * @param facetAddress The address of the facet
     * @return The facet address
     */
    function getFacetAddress(address facetAddress) internal pure returns (address) {
        return facetAddress;
    }

    /**
     * @notice Log Diamond deployment information
     * @param diamondAddress The Diamond contract address
     * @param facetNames Array of facet names
     * @param facetAddresses Array of facet addresses
     */
    function logDiamondInfo(
        address diamondAddress,
        string[] memory facetNames,
        address[] memory facetAddresses
    ) internal view {
        console.log("=== Diamond Deployment Info ===");
        console.log("Diamond Address:", diamondAddress);
        console.log("Total Facets:", facetAddresses.length);

        for (uint256 i = 0; i < facetNames.length; i++) {
            console.log("Facet:", facetNames[i]);
            console.log("  Address:", facetAddresses[i]);
        }
        console.log("================================");
    }

    /**
     * @notice Log a single facet's information
     * @param facetName Name of the facet
     * @param facetAddress Address of the facet
     */
    function logFacetInfo(string memory facetName, address facetAddress) internal view {
        console.log("Facet:", facetName);
        console.log("Address:", facetAddress);
    }

    /**
     * @notice Assert that an address is not zero
     * @param addr The address to check
     * @param message Error message if assertion fails
     */
    function assertNonZeroAddress(address addr, string memory message) internal pure {
        require(addr != address(0), message);
    }

    /**
     * @notice Assert that Diamond address is valid
     * @param diamondAddress The Diamond address to validate
     */
    function assertValidDiamond(address diamondAddress) internal pure {
        require(diamondAddress != address(0), "Invalid Diamond address: zero address");
        require(diamondAddress.code.length > 0, "Invalid Diamond address: no code deployed");
    }

    /**
     * @notice Assert that a facet address is valid
     * @param facetAddress The facet address to validate
     * @param facetName Name of the facet for error messaging
     */
    function assertValidFacet(address facetAddress, string memory facetName) internal pure {
        require(
            facetAddress != address(0),
            string(abi.encodePacked("Invalid ", facetName, ": zero address"))
        );
        require(
            facetAddress.code.length > 0,
            string(abi.encodePacked("Invalid ", facetName, ": no code deployed"))
        );
    }
}
