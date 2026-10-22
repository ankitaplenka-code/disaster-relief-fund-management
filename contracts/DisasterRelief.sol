// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DisasterRelief
 * @dev Transparent Disaster Relief Fund Tracking Smart Contract
 * Deployed on Ethereum testnets (Sepolia).
 */
contract DisasterRelief {
    address public owner;

    struct Campaign {
        string name;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountRaised;
        bool active;
    }

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    struct Withdrawal {
        uint256 campaignId;
        uint256 amount;
        string purpose;
        address recipient;
        uint256 timestamp;
    }

    Campaign[] public campaigns;
    mapping(uint256 => Donation[]) public donations;
    Withdrawal[] public withdrawals;

    // --- Events ---
    event CampaignCreated(
        uint256 indexed campaignId,
        string name,
        uint256 target,
        uint256 deadline
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        uint256 amount,
        string purpose,
        address recipient,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "DisasterRelief: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Create a new disaster relief campaign
     */
    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _target,
        uint256 _deadline
    ) external onlyOwner returns (uint256) {
        require(bytes(_name).length > 0, "DisasterRelief: name cannot be empty");
        require(_target > 0, "DisasterRelief: target must be greater than 0");
        require(_deadline > block.timestamp, "DisasterRelief: deadline must be in the future");

        uint256 campaignId = campaigns.length;
        campaigns.push(
            Campaign({
                name: _name,
                description: _description,
                target: _target,
                deadline: _deadline,
                amountRaised: 0,
                active: true
            })
        );

        emit CampaignCreated(campaignId, _name, _target, _deadline);
        return campaignId;
    }

    /**
     * @notice Public donation to an active campaign
     */
    function donate(uint256 _campaignId) external payable {
        require(_campaignId < campaigns.length, "DisasterRelief: campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];

        require(campaign.active, "DisasterRelief: campaign is not active");
        require(block.timestamp < campaign.deadline, "DisasterRelief: campaign deadline passed");
        require(msg.value > 0, "DisasterRelief: donation amount must be greater than 0");

        campaign.amountRaised += msg.value;

        donations[_campaignId].push(
            Donation({
                donor: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );

        emit DonationReceived(_campaignId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Withdraw funds for verified relief purposes (only owner)
     */
    function withdrawFunds(
        uint256 _campaignId,
        uint256 _amount,
        string memory _purpose,
        address payable _recipient
    ) external onlyOwner {
        require(_campaignId < campaigns.length, "DisasterRelief: campaign does not exist");
        require(_amount > 0, "DisasterRelief: amount must be greater than 0");
        require(_recipient != address(0), "DisasterRelief: invalid recipient address");
        require(bytes(_purpose).length > 0, "DisasterRelief: purpose must be specified");

        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.amountRaised >= _amount, "DisasterRelief: insufficient campaign funds");
        require(address(this).balance >= _amount, "DisasterRelief: insufficient contract balance");

        campaign.amountRaised -= _amount;

        withdrawals.push(
            Withdrawal({
                campaignId: _campaignId,
                amount: _amount,
                purpose: _purpose,
                recipient: _recipient,
                timestamp: block.timestamp
            })
        );

        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "DisasterRelief: fund transfer failed");

        emit FundsWithdrawn(_campaignId, _amount, _purpose, _recipient, block.timestamp);
    }

    /**
     * @notice Helper to get the total number of campaigns
     */
    function getCampaignsCount() external view returns (uint256) {
        return campaigns.length;
    }

    /**
     * @notice Transfer ownership of the contract
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DisasterRelief: new owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {
        revert("DisasterRelief: direct transfers not allowed, use donate(campaignId)");
    }
}
