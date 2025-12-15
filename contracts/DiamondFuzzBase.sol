// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "./DiamondForgeHelpers.sol";

/**
 * @title DiamondFuzzBase
 * @notice Base contract for Diamond fuzz testing with Forge
 * @dev Provides setup methods and utilities for fuzz testing Diamond contracts
 */
abstract contract DiamondFuzzBase is Test {
    using DiamondForgeHelpers for address;

    // Diamond contract address (set by child contracts)
    address public diamond;

    // Facet addresses (set by child contracts)
    mapping(string => address) public facets;

    // Test accounts
    address public deployer;
    address public user1;
    address public user2;
    address public user3;

    /**
     * @notice Setup function called before each test
     * @dev Override this in child contracts to set up Diamond and facets
     */
    function setUp() public virtual {
        // Set up test accounts
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);

        // Child contracts should override and call setDiamondAddress()
    }

    /**
     * @notice Set the Diamond contract address
     * @param _diamond Address of the deployed Diamond
     */
    function setDiamondAddress(address _diamond) internal {
        require(_diamond != address(0), "Diamond address cannot be zero");
        diamond = _diamond;
        DiamondForgeHelpers.assertValidDiamond(_diamond);
    }

    /**
     * @notice Register a facet address
     * @param name Name of the facet
     * @param facetAddress Address of the facet
     */
    function registerFacet(string memory name, address facetAddress) internal {
        require(facetAddress != address(0), "Facet address cannot be zero");
        facets[name] = facetAddress;
        DiamondForgeHelpers.assertValidFacet(facetAddress, name);
    }

    /**
     * @notice Get a facet address by name
     * @param name Name of the facet
     * @return Address of the facet
     */
    function getFacet(string memory name) internal view returns (address) {
        address facetAddress = facets[name];
        require(facetAddress != address(0), string(abi.encodePacked("Facet not found: ", name)));
        return facetAddress;
    }

    /**
     * @notice Assume valid Ethereum address for fuzzing
     * @param addr Address to validate
     */
    function assumeValidAddress(address addr) internal pure {
        vm.assume(addr != address(0));
        vm.assume(addr != address(0xdead));
        vm.assume(uint160(addr) > 0xFF); // Avoid precompiles
    }

    /**
     * @notice Assume valid amount for fuzzing (not zero, not unreasonably large)
     * @param amount Amount to validate
     */
    function assumeValidAmount(uint256 amount) internal pure {
        vm.assume(amount > 0);
        vm.assume(amount < type(uint128).max); // Reasonable upper bound
    }

    /**
     * @notice Bound a fuzzed value to a specific range
     * @param value The fuzzed value
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @return Bounded value
     */
    function boundValue(uint256 value, uint256 min, uint256 max) internal pure returns (uint256) {
        return bound(value, min, max);
    }

    /**
     * @notice Log test context for debugging
     * @param testName Name of the test
     */
    function logTestContext(string memory testName) internal view {
        console.log("=== Test:", testName, "===");
        console.log("Diamond:", diamond);
        console.log("Deployer:", deployer);
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);
    }

    /**
     * @notice Expect a revert with specific error message
     * @param errorMessage Expected error message
     */
    function expectRevertWithMessage(string memory errorMessage) internal {
        vm.expectRevert(bytes(errorMessage));
    }
}
