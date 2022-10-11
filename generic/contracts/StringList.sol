//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract StringList is Ownable {
    /// Events
    event Add(address indexed _caller, string _value);
    event Remove(address indexed _caller,  string _value);

    string constant PLACE_HOLDER = "____INVALID_PLACE_HOLER";

    /// Errors
    string constant ERROR_VALUE_NOT_PART_OF_THE_LIST = "ERROR_VALUE_NOT_PART_OF_THE_LIST";
    string constant ERROR_VALUE_PART_OF_THE_LIST = "ERROR_VALUE_PART_OF_THE_LIST";
    string constant ERROR_INVALID_INDEX = "ERROR_INVALID_INDEX";
    string constant ERROR_INVALID_VALUE = "ERROR_INVALID_VALUE";

    /// State
    string public name;
    string[] public values;
    mapping(string => uint256) internal indexByValue;

    /**
     * @dev Initialize contract
     * @notice Create a new list with name `_name`
     * @param _name The list's display name
     */
    constructor(string memory _name) {
        name = _name;

        // Invalidate first position
        values.push(PLACE_HOLDER);
    }

    /**
     * @dev Add a value to the  list
     * @notice Add "`_value`" to the string` list.
     * @param _value String value to remove
     */
    function add(string calldata _value) external onlyOwner {
        // Check if the value is part of the list
        require(indexByValue[_value] == 0, ERROR_VALUE_PART_OF_THE_LIST);

        // Check if the value is not the placeholder
        require(keccak256(abi.encodePacked(_value)) != keccak256(abi.encodePacked(PLACE_HOLDER)), ERROR_INVALID_VALUE);

        _add(_value);
    }

    /**
     * @dev Remove a value from the list
     * @notice Remove "`_value`" from the `self.symbol(): string` list
     * @param _value String value to remove
     */
    function remove(string calldata _value) external onlyOwner {
        require(indexByValue[_value] > 0, ERROR_VALUE_NOT_PART_OF_THE_LIST);

        // Values length
        uint256 lastValueIndex = size();

        // Index of the value to remove in the array
        uint256 removedIndex = indexByValue[_value];

        // Last value id
        string memory lastValue = values[lastValueIndex];

        // Override index of the removed value with the last one
        values[removedIndex] = lastValue;
        indexByValue[lastValue] = removedIndex;

        emit Remove(msg.sender, _value);

        // Clean storage
        values.pop();
        delete indexByValue[_value];
    }

    /**
    * @dev Get list's size
    * @return list's size
    */
    function size() public view returns (uint256) {
        return values.length - 1;
    }

    /**
    * @dev Get list's item
    * @param _index of the item
    * @return item at index
    */
    function get(uint256 _index) public view returns (string memory) {
        require(_index < values.length - 1, ERROR_INVALID_INDEX);

        return values[_index + 1];
    }

    /**
    * @dev Add a value to the  list
    * @param _value String value to remove
    */
    function _add(string calldata _value) internal {
        // Store the value to be looped
        values.push(_value);

        // Save mapping of the value within its position in the array
        indexByValue[_value] = values.length - 1;

        emit Add(msg.sender, _value);
    }

}
