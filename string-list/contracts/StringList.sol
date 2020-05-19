pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

contract StringListApp is AragonApp {
    /// Events
    event Add(address indexed _caller, string _value);
    event Remove(address indexed _caller,  string _value);

    /// Errors
    string constant ERROR_VALUE_NOT_PART_OF_THE_LIST = "ERROR_VALUE_NOT_PART_OF_THE_LIST";
    string constant ERROR_VALUE_PART_OF_THE_LIST = "ERROR_VALUE_PART_OF_THE_LIST";
    string constant ERROR_INVALID_INDEX = "ERROR_INVALID_INDEX";
    string constant ERROR_INVALID_TYPE = "ERROR_INVALID_TYPE";

    /// State
    string public name;
    string public symbol;
    string public listType;
    string[] public values;
    mapping(string => uint256) internal indexByValue;

    /// ACL
    bytes32 constant public ADD_ROLE = keccak256("ADD_ROLE");
    bytes32 constant public REMOVE_ROLE = keccak256("REMOVE_ROLE");


    /**
     * @dev Initialize contract
     * @notice Create a new list: `_symbol` (`_name`) with type: `_type`
     * @param _name The list's display name
     * @param _symbol The list's display symbol
     * @param _type The list's type
     */
    function initialize(string _name, string _symbol, string _type) external onlyInit {
        initialized();

        _requireValidType(_type);

        name = _name;
        symbol = _symbol;
        listType = _type;

        // Invalidate first position
        values.push("INVALID");
    }

    /**
     * @dev Add a value to the  list
     * @notice Add "`_value`" to the `self.symbol(): string` list
     * @param _value String value to remove
     */
    function add(string _value) external auth(ADD_ROLE) {
        require(indexByValue[_value] == 0, ERROR_VALUE_PART_OF_THE_LIST);

        // Store the value to be looped
        uint256 index = values.push(_value);

        // Save mapping of the value within its position in the array
        indexByValue[_value] = index - 1;

        emit Add(msg.sender, _value);
    }

    /**
     * @dev Remove a value from the list
     * @notice Remove "`_value`" from the `self.symbol(): string` list
     * @param _value String value to remove
     */
    function remove(string _value) external auth(REMOVE_ROLE) {
        require(indexByValue[_value] > 0, ERROR_VALUE_NOT_PART_OF_THE_LIST);

        // Values length
        uint256 lastValueIndex = size();

        // Index of the value to remove in the array
        uint256 removedIndex = indexByValue[_value];

        // Last value id
        string lastValue = values[lastValueIndex];

        // Override index of the removed value with the last one
        values[removedIndex] = lastValue;
        indexByValue[lastValue] = removedIndex;

        emit Remove(msg.sender, _value);

        // Clean storage
        values.length--;
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
    function get(uint256 _index) public view returns (string) {
        require(_index < values.length, ERROR_INVALID_INDEX);

        return values[_index + 1];
    }

    function _requireValidType(string _type) internal {
        bytes32 typeHash = keccak256(_type);
        require(typeHash == keccak256("COORDINATES") || typeHash == keccak256("NAMES"), ERROR_INVALID_TYPE);
    }
}
