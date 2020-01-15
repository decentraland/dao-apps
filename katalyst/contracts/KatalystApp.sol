pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

contract KatalystApp is AragonApp {

    /// ACL
    bytes32 constant public MODIFY_ROLE = keccak256("MODIFY_ROLE");

    /// Errors
    string constant ERROR_OWNER_IN_USE = "ERROR_OWNER_IN_USE";
    string constant ERROR_DOMAIN_IN_USE = "ERROR_DOMAIN_IN_USE";
    string constant ERROR_ID_IN_USE = "ERROR_ID_IN_USE";
    string constant ERROR_KATALYST_NOT_FOUND = "ERROR_KATALYST_NOT_FOUND";


    struct Katalyst {
        bytes32 id;
        address owner;
        string domain;
    }

    // Katalyst by id
    mapping(bytes32 => Katalyst) public katalystById;
    // Domains used
    mapping(bytes32 => bool) public domains;
    // Owners used
    mapping(address => bool) public owners;
    // Katalyst indexes by id
    mapping(bytes32 => uint256) public katalystIndexById;
    // Katalyst ids
    bytes32[] public katalystIds;

    struct KatalystHistory {
        uint256 startTime;
        uint256 endTime;
    }

    // Katalyst history
    mapping(bytes32 => KatalystHistory) public katalystHistory;


    event AddKatalyst(bytes32 indexed _id, address indexed _owner, string _domain);
    event RemoveKatalyst(bytes32 indexed _id, address indexed _owner, string _domain);

    function initialize() public onlyInit {
        initialized();
    }

    /**
    * @dev Add a new katalyst
    * @notice Add katalyst with owner `_owner` and domain `_domain`
    * @param _owner - owner of the katalyst
    * @param _domain - domain of the katalyst
    */
    function addKatalyst(address _owner, string  _domain) external auth(MODIFY_ROLE) {
        bytes32 domainHash = keccak256(abi.encodePacked(_domain));

        // Check if the owner and the domain are free
        require(!owners[_owner], ERROR_OWNER_IN_USE);
        require(!domains[domainHash], ERROR_DOMAIN_IN_USE);

        uint256 startTime = block.timestamp;

        // Calculate a katalyst id
        bytes32 id = keccak256(
            abi.encodePacked(
                startTime,
                msg.sender,
                _owner,
                _domain
            )
        );

        // Check for collisions. Shouldn't happen
        require(katalystById[id].owner == address(0), ERROR_ID_IN_USE);

        // Store katalyst by its id
        katalystById[id] = Katalyst({
            id: id,
            owner: _owner,
            domain: _domain
        });

        katalystHistory[id] = KatalystHistory({
            startTime: startTime,
            endTime: 0
        });

        // Set owner and domain as used
        owners[_owner] = true;
        domains[domainHash] = true;

        // Store the katalyst id to be looped
        uint256 index = katalystIds.push(id);

        // Save mapping of the katalyst id within its position in the array
        katalystIndexById[id] = index - 1;

        // Log
        emit AddKatalyst(id, _owner, _domain);
    }

    /**
    * @dev Remove a katalyst
    * @notice Remove katalyst `_id` with owner `self.katalystOwner(_id): address` and domain `self.katalystDomain(_id): string`
    * @param _id - id of the katalyst
    */
    function removeKatalyst(bytes32 _id) external auth(MODIFY_ROLE)  {
        Katalyst memory katalyst = katalystById[_id];
        bytes32 domainHash = keccak256(abi.encodePacked(katalyst.domain));

        require(owners[katalyst.owner], ERROR_KATALYST_NOT_FOUND);
        require(domains[domainHash], ERROR_KATALYST_NOT_FOUND);

        // Katalyst length
        uint256 lastKatalystIndex = katalystCount() - 1;

        // Index of the katalyst to remove in the array
        uint256 removedIndex = katalystIndexById[_id];

        // Last katalyst id
        bytes32 lastKatalystId = katalystIds[lastKatalystIndex];

        // Override index of the removed katalyst with the last one
        katalystIds[removedIndex] = lastKatalystId;
        katalystIndexById[lastKatalystId] = removedIndex;

        katalystHistory[_id].endTime = block.timestamp;

        emit RemoveKatalyst(_id, katalyst.owner, katalyst.domain);

        // Clean storage
        katalystIds.length--;
        delete katalystIndexById[_id];
        owners[katalyst.owner] = false;
        domains[domainHash] = false;

    }

    /**
    * @dev Get katalyst count
    * @return count of katalyst
    */
    function katalystCount() public view returns (uint256) {
        return katalystIds.length;
    }

    /**
    * @dev Get katalyst owner
    * @param _id - id of the katalyst
    * @return katalyst owner
    */
    function katalystOwner(bytes32 _id) external view returns (address) {
        return katalystById[_id].owner;
    }

    /**
    * @dev Get katalyst domain
    * @param _id - id of the katalyst
    * @return katalyst domain
    */
    function katalystDomain(bytes32 _id) external view returns (string memory) {
        return katalystById[_id].domain;
    }
}