// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "./DiamondABILoader.sol";

/// @title DiamondFuzzBase
/// @author DiamondsLab
/// @notice Abstract base contract for Diamond fuzzing and integration tests
/// @dev Inherit from this contract to create Diamond-based tests with built-in helpers for calling functions, measuring gas, and verifying routing
/// @custom:security This contract is intended for testing purposes only
/// @custom:usage
/// ```solidity
/// contract MyDiamondTest is DiamondFuzzBase {
///     function setUp() public override {
///         super.setUp();
///         // Additional setup
///     }
/// }
/// ```
abstract contract DiamondFuzzBase is Test {
    using DiamondABILoader for string;

    /// @notice Deployed Diamond contract address
    /// @dev Loaded in setUp(), can be overridden by implementing _loadDiamondAddress()
    address internal diamond;

    /// @notice Diamond ABI JSON content
    /// @dev Loaded from diamond-abi file in setUp()
    string internal diamondABI;

    /// @notice Array of all function selectors in the Diamond
    bytes4[] internal diamondSelectors;

    /// @notice Array of all function signatures in the Diamond
    string[] internal diamondSignatures;

    /// @notice Mapping of selector to function name for debugging
    mapping(bytes4 => string) internal selectorToName;

    /// @notice Error for failed Diamond calls
    /// @param selector The function selector that was called
    /// @param data The calldata that was sent
    /// @param returnData The raw error data returned
    error DiamondCallFailed(bytes4 selector, bytes data, bytes returnData);

    /// @notice Error for unexpected Diamond success when expecting revert
    /// @param selector The function selector that was called
    /// @param data The calldata that was sent
    /// @param returnData The return data from the unexpected success
    error DiamondCallUnexpectedSuccess(bytes4 selector, bytes data, bytes returnData);

    /// @notice Event emitted when Diamond is loaded in setUp
    /// @param diamondAddress The address of the loaded Diamond
    /// @param functionCount The number of functions found in the ABI
    event DiamondLoaded(address indexed diamondAddress, uint256 functionCount);

    /// @notice Event emitted when gas is measured for a function call
    /// @param selector The function selector
    /// @param functionName The function signature
    /// @param gasUsed The gas consumed by the call
    event GasMeasurement(bytes4 indexed selector, string functionName, uint256 gasUsed);

    /// @notice Load deployed Diamond address
    /// @dev Override this function to provide custom Diamond address loading logic
    /// @dev Default implementation uses vm.envAddress("DIAMOND_ADDRESS") if available, otherwise uses a test deployment
    /// @return diamondAddress The deployed Diamond contract address
    function _loadDiamondAddress() internal view virtual returns (address diamondAddress) {
        // Try to load from environment variable
        try vm.envAddress("DIAMOND_ADDRESS") returns (address addr) {
            return addr;
        } catch {
            // Fall back to expecting a deployment file or generated library
            revert(
                "DiamondFuzzBase: Override _loadDiamondAddress() or set DIAMOND_ADDRESS env var"
            );
        }
    }

    /// @notice Get the path to the Diamond ABI file
    /// @dev Override this to use a different ABI file path
    /// @return abiPath The path to the Diamond ABI JSON file
    function _getDiamondABIPath() internal view virtual returns (string memory abiPath) {
        return "./diamond-abi/ExampleDiamond.json";
    }

    /// @notice Load and parse Diamond ABI file
    /// @dev Uses DiamondABILoader to extract selectors and signatures
    /// @dev Can be overridden to customize ABI loading behavior
    function _loadDiamondABI() internal virtual {
        string memory abiPath = _getDiamondABIPath();

        // Load ABI JSON
        diamondABI = DiamondABILoader.loadDiamondABI(abiPath);

        // Extract selectors and signatures
        diamondSelectors = DiamondABILoader.extractSelectors(diamondABI);
        diamondSignatures = DiamondABILoader.extractSignatures(diamondABI);

        require(diamondSelectors.length > 0, "DiamondFuzzBase: No selectors found");
        require(
            diamondSelectors.length == diamondSignatures.length,
            "DiamondFuzzBase: Selector/signature count mismatch"
        );

        // Build selector to name mapping for debugging
        for (uint256 i = 0; i < diamondSelectors.length; i++) {
            selectorToName[diamondSelectors[i]] = diamondSignatures[i];
        }

        emit DiamondLoaded(diamond, diamondSelectors.length);
    }

    /// @notice Call a Diamond function with selector and encoded arguments
    /// @dev Low-level call helper for non-payable functions
    /// @param selector The function selector (bytes4)
    /// @param data The encoded function arguments (without selector)
    /// @return success Whether the call succeeded
    /// @return returnData The raw return data from the call
    function _callDiamond(
        bytes4 selector,
        bytes memory data
    ) internal virtual returns (bool success, bytes memory returnData) {
        bytes memory callData = abi.encodePacked(selector, data);
        (success, returnData) = diamond.call(callData);
    }

    /// @notice Call a Diamond function with value (for payable functions)
    /// @dev Low-level call helper for payable functions
    /// @param selector The function selector (bytes4)
    /// @param data The encoded function arguments (without selector)
    /// @param value The ETH value to send with the call
    /// @return success Whether the call succeeded
    /// @return returnData The raw return data from the call
    function _callDiamondWithValue(
        bytes4 selector,
        bytes memory data,
        uint256 value
    ) internal virtual returns (bool success, bytes memory returnData) {
        bytes memory callData = abi.encodePacked(selector, data);
        (success, returnData) = diamond.call{value: value}(callData);
    }

    /// @notice Expect a Diamond call to revert with specific error
    /// @dev Helper for testing expected reverts
    /// @param selector The function selector to call
    /// @param data The encoded function arguments
    /// @param expectedError The expected error data (can be empty to expect any revert)
    function _expectDiamondRevert(
        bytes4 selector,
        bytes memory data,
        bytes memory expectedError
    ) internal virtual {
        (bool success, bytes memory returnData) = _callDiamond(selector, data);

        if (success) {
            revert DiamondCallUnexpectedSuccess(selector, data, returnData);
        }

        if (expectedError.length > 0) {
            // Verify exact error match
            assertEq(returnData, expectedError, "Unexpected error data");
        }
        // If expectedError is empty, just verify it reverted (which we already did)
    }

    /// @notice Verify function selector routes to expected facet address
    /// @dev Uses DiamondLoupe to check facet routing
    /// @param selector The function selector to check
    /// @param expectedFacet The expected facet address (address(0) to just verify it exists)
    /// @return facetAddress The actual facet address for this selector
    function _verifyFacetRouting(
        bytes4 selector,
        address expectedFacet
    ) internal view virtual returns (address facetAddress) {
        // Call facetAddress(bytes4) from DiamondLoupe
        bytes memory callData = abi.encodeWithSignature("facetAddress(bytes4)", selector);
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "DiamondFuzzBase: facetAddress call failed");
        facetAddress = abi.decode(returnData, (address));

        if (expectedFacet != address(0)) {
            assertEq(facetAddress, expectedFacet, "Selector routes to unexpected facet");
        } else {
            assertTrue(facetAddress != address(0), "Selector has no facet");
        }

        return facetAddress;
    }

    /// @notice Measure gas consumption of a Diamond function call
    /// @dev Gas profiling helper for optimization testing
    /// @param selector The function selector to call
    /// @param data The encoded function arguments
    /// @return gasUsed The gas consumed by the call
    function _measureDiamondGas(
        bytes4 selector,
        bytes memory data
    ) internal virtual returns (uint256 gasUsed) {
        uint256 gasBefore = gasleft();
        (bool success, bytes memory returnData) = _callDiamond(selector, data);
        uint256 gasAfter = gasleft();

        if (!success) {
            revert DiamondCallFailed(selector, data, returnData);
        }

        gasUsed = gasBefore - gasAfter;
        emit GasMeasurement(selector, selectorToName[selector], gasUsed);

        return gasUsed;
    }

    /// @notice Get the Diamond owner address
    /// @dev Helper to get owner for ownership checks (assumes owner() function exists)
    /// @return owner The current Diamond owner address
    function _getDiamondOwner() internal view virtual returns (address owner) {
        // Call owner() function - standard in most ownership facets
        bytes memory callData = abi.encodeWithSignature("owner()");
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        require(success, "DiamondFuzzBase: owner() call failed");
        owner = abi.decode(returnData, (address));

        return owner;
    }

    /// @notice Check if an address has a specific role
    /// @dev Helper for access control testing (assumes role-based access control)
    /// @param role The role identifier (bytes32)
    /// @param account The address to check
    /// @return hasRole True if the account has the role
    function _hasRole(bytes32 role, address account) internal view virtual returns (bool hasRole) {
        bytes memory callData = abi.encodeWithSignature("hasRole(bytes32,address)", role, account);
        (bool success, bytes memory returnData) = diamond.staticcall(callData);

        if (!success) {
            return false;
        }

        hasRole = abi.decode(returnData, (bool));
        return hasRole;
    }

    /// @notice Grant a role to an address (requires appropriate permissions)
    /// @dev Helper for access control testing
    /// @dev Note: The caller must have permission to grant the role (e.g., have DEFAULT_ADMIN_ROLE)
    /// @dev For tests, use vm.prank() to call from an address with the appropriate permissions
    /// @param role The role identifier
    /// @param account The address to grant the role to
    function _grantRole(bytes32 role, address account) internal virtual {
        bytes4 selector = bytes4(keccak256("grantRole(bytes32,address)"));
        bytes memory data = abi.encode(role, account);
        (bool success, bytes memory returnData) = _callDiamond(selector, data);

        if (!success) {
            revert DiamondCallFailed(selector, data, returnData);
        }
    }

    /// @notice Grant a role to the test contract itself
    /// @dev Convenience helper that grants a role to address(this)
    /// @dev The caller must have permission to grant the role - use vm.prank() as needed
    /// @dev Common pattern in setUp(): vm.prank(owner); _grantRoleToSelf(DEFAULT_ADMIN_ROLE);
    /// @param role The role identifier to grant to the test contract
    function _grantRoleToSelf(bytes32 role) internal virtual {
        _grantRole(role, address(this));
    }

    /// @notice Revoke a role from an address (requires appropriate permissions)
    /// @dev Helper for access control testing
    /// @param role The role identifier
    /// @param account The address to revoke the role from
    function _revokeRole(bytes32 role, address account) internal virtual {
        bytes4 selector = bytes4(keccak256("revokeRole(bytes32,address)"));
        bytes memory data = abi.encode(role, account);
        (bool success, bytes memory returnData) = _callDiamond(selector, data);

        if (!success) {
            revert DiamondCallFailed(selector, data, returnData);
        }
    }

    /// @notice Get all function selectors in the Diamond
    /// @dev Helper to access loaded selectors
    /// @return selectors Array of all function selectors
    function _getDiamondSelectors() internal view virtual returns (bytes4[] memory selectors) {
        return diamondSelectors;
    }

    /// @notice Get all function signatures in the Diamond
    /// @dev Helper to access loaded signatures
    /// @return signatures Array of all function signatures
    function _getDiamondSignatures() internal view virtual returns (string[] memory signatures) {
        return diamondSignatures;
    }

    /// @notice Get function name/signature for a selector
    /// @dev Helper for debugging and logging
    /// @param selector The function selector
    /// @return name The function signature/name
    function _getFunctionName(bytes4 selector) internal view virtual returns (string memory name) {
        return selectorToName[selector];
    }

    /// @notice Setup function that loads Diamond address and ABI
    /// @dev Override this to customize setup behavior, but call super.setUp() to load Diamond
    /// @dev For access control tests, grant necessary roles in setUp() after calling super.setUp()
    /// @custom:example
    /// ```solidity
    /// function setUp() public override {
    ///     super.setUp(); // Load Diamond and ABI
    ///
    ///     // Grant DEFAULT_ADMIN_ROLE to test contract for access control tests
    ///     vm.prank(_getDiamondOwner());
    ///     _grantRoleToSelf(DEFAULT_ADMIN_ROLE);
    ///
    ///     // Additional custom setup
    /// }
    /// ```
    function setUp() public virtual {
        // Load Diamond address
        diamond = _loadDiamondAddress();

        // Verify Diamond has code deployed
        require(diamond.code.length > 0, "DiamondFuzzBase: Diamond has no code");

        // Load and parse Diamond ABI
        _loadDiamondABI();

        // Log for debugging
        console.log("Diamond loaded at:", diamond);
        console.log("Functions found:", diamondSelectors.length);
    }
}
