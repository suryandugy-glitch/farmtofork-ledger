// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FarmToForkLedger {
    // Mapping from product ID to an array of stage hashes
    mapping(string => string[]) public productStageHashes;

    /**
     * @dev Add a stage hash for a product
     * @param productId The unique identifier of the product
     * @param stageHash The hash of the stage data (e.g., IPFS hash or SHA256 of stage details)
     */
    function addStageHash(string memory productId, string memory stageHash) public {
        productStageHashes[productId].push(stageHash);
    }

    /**
     * @dev Get all stage hashes for a product
     * @param productId The unique identifier of the product
     * @return An array of stage hashes
     */
    function getStageHashes(string memory productId) public view returns (string[] memory) {
        return productStageHashes[productId];
    }

    /**
     * @dev Get the number of stages for a product
     * @param productId The unique identifier of the product
     * @return The number of stages
     */
    function getStageCount(string memory productId) public view returns (uint256) {
        return productStageHashes[productId].length;
    }
}