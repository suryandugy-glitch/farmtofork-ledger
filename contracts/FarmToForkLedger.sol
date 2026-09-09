// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FarmToForkLedger {
    // Define a struct for stage details
    struct Stage {
        uint256 timestamp;
        string location;
        string notes;
        uint256 temperature; // in Celsius * 100 (to allow decimals)
        uint256 humidity;    // in percentage * 100
        bytes32 ipfsHash;    // IPFS hash of detailed data (optional)
    }

    // Mapping from product ID to an array of stages
    mapping(string => Stage[]) public productStages;

    // Event when a stage is added
    event StageAdded(
        string indexed productId,
        uint256 indexed stageIndex,
        uint256 timestamp,
        string location,
        string notes,
        uint256 temperature,
        uint256 humidity,
        bytes32 ipfsHash
    );

    /**
     * @dev Add a stage for a product
     * @param productId The unique identifier of the product
     * @param location The location of the stage (e.g., GPS coordinates or place name)
     * @param notes Additional notes about the stage
     * @param temperature Temperature in Celsius * 100 (e.g., 2500 for 25.00°C)
     * @param humidity Humidity in percentage * 100 (e.g., 6000 for 60.00%)
     * @param ipfsHash IPFS hash of detailed data (32 bytes), optional
     */
    function addStage(
        string memory productId,
        string memory location,
        string memory notes,
        uint256 temperature,
        uint256 humidity,
        bytes32 ipfsHash
    ) public {
        Stage memory newStage = Stage(
            block.timestamp,
            location,
            notes,
            temperature,
            humidity,
            ipfsHash
        );

        uint256 index = productStages[productId].push(newStage) - 1;

        emit StageAdded(
            productId,
            index,
            block.timestamp,
            location,
            notes,
            temperature,
            humidity,
            ipfsHash
        );
    }

    /**
     * @dev Get all stages for a product
     * @param productId The unique identifier of the product
     * @return An array of stages
     */
    function getStages(string memory productId) public view returns (Stage[] memory) {
        return productStages[productId];
    }

    /**
     * @dev Get the number of stages for a product
     * @param productId The unique identifier of the product
     * @return The number of stages
     */
    function getStageCount(string memory productId) public view returns (uint256) {
        return productStages[productId].length;
    }

    /**
     * @dev Get a specific stage by index
     * @param productId The unique identifier of the product
     * @param index The index of the stage
     * @return The stage details
     */
    function getStage(string memory productId, uint256 index) public view returns (
        uint256,
        string memory,
        string memory,
        uint256,
        uint256,
        bytes32
    ) {
        Stage storage stage = productStages[productId][index];
        return (
            stage.timestamp,
            stage.location,
            stage.notes,
            stage.temperature,
            stage.humidity,
            stage.ipfsHash
        );
    }
}