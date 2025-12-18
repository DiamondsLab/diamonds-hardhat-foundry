// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/Vm.sol";

/// @title DiamondForgeHelpers
/// @author DiamondsLab
/// @notice Utility library for Diamond testing with Forge
/// @dev Provides assertion helpers, address validation, and common test utilities for Diamond contracts
/// @custom:security This library is intended for testing purposes only
library DiamondForgeHelpers {
    /// @notice Forge VM interface for cheat codes
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    /// @notice Error for invalid Diamond address
    /// @param diamondAddress The invalid address
    /// @param reason The reason it's invalid
    error InvalidDiamond(address diamondAddress, string reason);

    /// @notice Error for invalid facet address
    /// @param facetAddress The invalid facet address
    /// @param facetName The facet name
    /// @param reason The reason it's invalid
    error InvalidFacet(address facetAddress, string facetName, string reason);

    /// @notice Assert that an address is a valid Diamond contract
    /// @dev Checks that:
    ///      - Address is not zero
    ///      - Contract has code deployed
    ///      - Contract supports DiamondLoupe interface
    /// @param diamond The Diamond contract address to validate
    function assertValidDiamond(address diamond) internal view {
        // Check non-zero address
        if (diamond == address(0)) {
            revert InvalidDiamond(diamond, "Diamond address is zero");
        }

        // Check contract has code
        if (diamond.code.length == 0) {
            revert InvalidDiamond(diamond, "Diamond has no code deployed");
        }

        // Check DiamondLoupe interface support
        // Try calling facets() which should exist in any EIP-2535 Diamond
        (bool success, ) = diamond.staticcall(abi.encodeWithSignature("facets()"));
        if (!success) {
            revert InvalidDiamond(
                diamond,
                "Diamond does not support DiamondLoupe (facets() call failed)"
            );
        }
    }

    /// @notice Assert that an address is a valid facet contract
    /// @dev Checks that:
    ///      - Address is not zero
    ///      - Contract has code deployed
    /// @param facetAddress The facet contract address to validate
    /// @param facetName The facet name for error messaging
    function assertValidFacet(address facetAddress, string memory facetName) internal view {
        // Check non-zero address
        if (facetAddress == address(0)) {
            revert InvalidFacet(facetAddress, facetName, "Facet address is zero");
        }

        // Check contract has code
        if (facetAddress.code.length == 0) {
            revert InvalidFacet(facetAddress, facetName, "Facet has no code deployed");
        }
    }

    /// @notice Validate address is not zero or known invalid address
    /// @dev Use with vm.assume() in fuzz tests to filter invalid addresses
    /// @param addr The address to validate
    /// @return valid True if address passes basic validation
    function isValidTestAddress(address addr) internal pure returns (bool valid) {
        return
            addr != address(0) &&
            addr != address(0x000000000000000000000000000000000000dEaD) &&
            uint160(addr) > 0xFF; // Avoid precompiles
    }

    /// @notice Validate amount is reasonable for testing
    /// @dev Use with vm.assume() in fuzz tests to filter extreme values
    /// @param amount The amount to validate
    /// @return valid True if amount is within reasonable bounds
    function isValidTestAmount(uint256 amount) internal pure returns (bool valid) {
        return amount > 0 && amount < type(uint128).max;
    }

    /// @notice Assert selector exists in Diamond
    /// @dev Uses DiamondLoupe facetAddress() to verify selector is registered
    /// @param diamond The Diamond contract address
    /// @param selector The function selector to check
    function assertSelectorExists(address diamond, bytes4 selector) internal view {
        bytes memory callData = abi.encodeWithSignature("facetAddress(bytes4)", selector);
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "facetAddress() call failed");

        address facetAddress = abi.decode(returnData, (address));
        require(facetAddress != address(0), "Selector not found in Diamond");
    }

    /// @notice Assert selector routes to expected facet
    /// @dev Uses DiamondLoupe facetAddress() to verify routing
    /// @param diamond The Diamond contract address
    /// @param selector The function selector to check
    /// @param expectedFacet The expected facet address
    function assertSelectorRouting(
        address diamond,
        bytes4 selector,
        address expectedFacet
    ) internal view {
        bytes memory callData = abi.encodeWithSignature("facetAddress(bytes4)", selector);
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "facetAddress() call failed");

        address actualFacet = abi.decode(returnData, (address));
        require(actualFacet == expectedFacet, "Selector routes to unexpected facet");
    }

    /// @notice Get facet address for a selector
    /// @dev Wrapper around DiamondLoupe facetAddress()
    /// @param diamond The Diamond contract address
    /// @param selector The function selector
    /// @return facetAddress The facet address that implements this selector
    function getFacetAddress(
        address diamond,
        bytes4 selector
    ) internal view returns (address facetAddress) {
        bytes memory callData = abi.encodeWithSignature("facetAddress(bytes4)", selector);
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "facetAddress() call failed");
        facetAddress = abi.decode(returnData, (address));
    }

    /// @notice Get all facets in Diamond
    /// @dev Calls DiamondLoupe facets()
    /// @param diamond The Diamond contract address
    /// @return facets Array of Facet structs with address and selectors
    function getAllFacets(address diamond) internal view returns (bytes memory facets) {
        bytes memory callData = abi.encodeWithSignature("facets()");
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "facets() call failed");
        return returnData;
    }

    /// @notice Get facet addresses
    /// @dev Calls DiamondLoupe facetAddresses()
    /// @param diamond The Diamond contract address
    /// @return facetAddresses Array of all facet addresses
    function getFacetAddresses(
        address diamond
    ) internal view returns (address[] memory facetAddresses) {
        bytes memory callData = abi.encodeWithSignature("facetAddresses()");
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "facetAddresses() call failed");
        facetAddresses = abi.decode(returnData, (address[]));
    }

    /// @notice Get function selectors for a facet
    /// @dev Calls DiamondLoupe facetFunctionSelectors()
    /// @param diamond The Diamond contract address
    /// @param facet The facet address to query
    /// @return selectors Array of function selectors
    function getFacetSelectors(
        address diamond,
        address facet
    ) internal view returns (bytes4[] memory selectors) {
        bytes memory callData = abi.encodeWithSignature("facetFunctionSelectors(address)", facet);
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "facetFunctionSelectors() call failed");
        selectors = abi.decode(returnData, (bytes4[]));
    }

    /// @notice Assert Diamond owner matches expected address
    /// @dev Assumes owner() function exists in Diamond
    /// @param diamond The Diamond contract address
    /// @param expectedOwner The expected owner address
    function assertDiamondOwner(address diamond, address expectedOwner) internal view {
        bytes memory callData = abi.encodeWithSignature("owner()");
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "owner() call failed");

        address actualOwner = abi.decode(returnData, (address));
        require(actualOwner == expectedOwner, "Diamond owner does not match expected");
    }

    /// @notice Get Diamond owner address
    /// @dev Assumes owner() function exists in Diamond
    /// @param diamond The Diamond contract address
    /// @return owner The current Diamond owner
    function getDiamondOwner(address diamond) internal view returns (address owner) {
        bytes memory callData = abi.encodeWithSignature("owner()");
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "owner() call failed");
        owner = abi.decode(returnData, (address));
    }

    /// @notice Format bytes4 selector as hex string
    /// @dev Utility for logging and debugging
    /// @param selector The bytes4 selector
    /// @return hexString The hex string representation
    function toHexString(bytes4 selector) internal pure returns (string memory hexString) {
        bytes memory buffer = new bytes(10);
        buffer[0] = "0";
        buffer[1] = "x";

        bytes memory hexChars = "0123456789abcdef";
        bytes memory selectorBytes = abi.encodePacked(selector);

        for (uint256 i = 0; i < 4; i++) {
            uint8 value = uint8(selectorBytes[i]);
            buffer[2 + i * 2] = hexChars[value >> 4];
            buffer[3 + i * 2] = hexChars[value & 0x0f];
        }

        return string(buffer);
    }

    /// @notice Create a bounded random address for fuzzing
    /// @dev Ensures address is valid for testing
    /// @param seed The fuzzing seed value
    /// @return addr A valid test address
    function boundAddress(uint256 seed) internal pure returns (address addr) {
        // Create address from seed, ensuring it's valid
        addr = address(uint160(seed));

        // Re-hash if address is invalid
        while (!isValidTestAddress(addr)) {
            seed = uint256(keccak256(abi.encodePacked(seed)));
            addr = address(uint160(seed));
        }

        return addr;
    }

    /// @notice Create a bounded random amount for fuzzing
    /// @dev Ensures amount is reasonable for testing
    /// @param seed The fuzzing seed value
    /// @param min The minimum amount (inclusive)
    /// @param max The maximum amount (inclusive)
    /// @return amount A valid test amount
    function boundAmount(
        uint256 seed,
        uint256 min,
        uint256 max
    ) internal pure returns (uint256 amount) {
        require(max >= min, "max must be >= min");
        require(max < type(uint128).max, "max must be < uint128 max");

        amount = min + (seed % (max - min + 1));
        return amount;
    }

    /// @notice Compare two bytes arrays for equality
    /// @dev Utility for comparing ABI-encoded data
    /// @param a First bytes array
    /// @param b Second bytes array
    /// @return equal True if arrays are equal
    function bytesEqual(bytes memory a, bytes memory b) internal pure returns (bool equal) {
        return keccak256(a) == keccak256(b);
    }

    /// @notice Compare two bytes4 arrays for equality
    /// @dev Utility for comparing selector arrays
    /// @param a First array
    /// @param b Second array
    /// @return equal True if arrays contain same selectors (order doesn't matter)
    function selectorsEqual(
        bytes4[] memory a,
        bytes4[] memory b
    ) internal pure returns (bool equal) {
        if (a.length != b.length) {
            return false;
        }

        // Simple O(n²) comparison for small arrays (typical in Diamond tests)
        for (uint256 i = 0; i < a.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < b.length; j++) {
                if (a[i] == b[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return true;
    }

    /// @notice Take a snapshot of current blockchain state
    /// @dev Uses Foundry's vm.snapshotState() to save state
    /// @dev Only works on networks that support snapshots (Hardhat, Anvil)
    /// @return snapshotId The snapshot identifier to use for reverting
    function snapshotState() internal returns (uint256 snapshotId) {
        snapshotId = vm.snapshotState();
    }

    /// @notice Revert blockchain state to a previously saved snapshot
    /// @dev Uses Foundry's vm.revertToState() to restore state
    /// @dev The snapshot is consumed after reverting
    /// @param snapshotId The snapshot identifier from snapshotState()
    /// @return success True if revert was successful
    function revertToSnapshot(uint256 snapshotId) internal returns (bool success) {
        success = vm.revertToState(snapshotId);
    }
}
