pragma solidity ^0.4.24;


import "../List.sol";

contract FakeList is ListApp {
    function toAddress(string memory _value) public view returns (address) {
        return _toAddress(_value);
    }
}