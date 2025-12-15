// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/DiamondHandsV2.sol";

contract DeployProxy is Script {
    function run() external {
        address implementation = 0x6AbADcc8D21F5fA8dA314cB9a8a2791BD4d7136b;

        vm.startBroadcast();

        // Deploy proxy with initialize() call
        ERC1967Proxy proxy = new ERC1967Proxy(
            implementation,
            abi.encodeWithSignature("initialize()")
        );

        console.log("Proxy deployed to:", address(proxy));

        vm.stopBroadcast();
    }
}
