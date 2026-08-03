// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AgentWallet.sol";

/**
 * @title AgentRegistry
 * @notice Central registry for Avara agents. Each agent gets a unique ID,
 *         an associated AgentWallet, and a spending policy.
 *
 * @dev When a user creates an agent, this contract:
 *      1. Assigns a monotonically increasing agent ID
 *      2. Deploys a new AgentWallet for that agent
 *      3. Stores the agent's metadata and policy
 */
contract AgentRegistry is Ownable, Pausable {
    // ─── Types ────────────────────────────────────────────────────────────────

    struct Agent {
        uint256 id;
        address owner;
        address wallet;      // deployed AgentWallet address
        string name;
        uint256 dailyLimit;
        uint256 transactionLimit;
        bool active;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 private _nextAgentId = 1;

    mapping(uint256 => Agent) private _agents;
    mapping(address => uint256[]) private _ownerAgents; // owner → list of agent IDs

    address public immutable usdtToken;
    address public immutable paymentRouter;

    // ─── Events ───────────────────────────────────────────────────────────────

    event AgentCreated(
        uint256 indexed agentId,
        address indexed owner,
        address wallet,
        string name
    );
    event AgentPolicyUpdated(
        uint256 indexed agentId,
        uint256 dailyLimit,
        uint256 transactionLimit
    );
    event AgentPaused(uint256 indexed agentId);
    event AgentActivated(uint256 indexed agentId);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AgentNotFound(uint256 agentId);
    error NotAgentOwner(uint256 agentId, address caller);
    error InvalidLimit();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _usdtToken, address _paymentRouter) Ownable(msg.sender) {
        usdtToken = _usdtToken;
        paymentRouter = _paymentRouter;
    }

    // ─── Agent lifecycle ──────────────────────────────────────────────────────

    /**
     * @notice Create a new agent with a programmable wallet.
     * @param name              Human-readable agent name.
     * @param dailyLimit        Max USDT spending per day (in token units, 6 decimals).
     * @param transactionLimit  Max USDT per single transaction.
     * @return agentId          The newly created agent's ID.
     */
    function createAgent(
        string calldata name,
        uint256 dailyLimit,
        uint256 transactionLimit
    ) external whenNotPaused returns (uint256 agentId) {
        if (dailyLimit == 0 || transactionLimit == 0) revert InvalidLimit();
        if (transactionLimit > dailyLimit) revert InvalidLimit();

        agentId = _nextAgentId++;

        // Deploy a dedicated wallet for this agent
        AgentWallet wallet = new AgentWallet(
            msg.sender,     // owner
            address(this),  // registry
            paymentRouter,  // authorized router
            usdtToken,
            dailyLimit,
            transactionLimit
        );

        _agents[agentId] = Agent({
            id: agentId,
            owner: msg.sender,
            wallet: address(wallet),
            name: name,
            dailyLimit: dailyLimit,
            transactionLimit: transactionLimit,
            active: true
        });

        _ownerAgents[msg.sender].push(agentId);

        emit AgentCreated(agentId, msg.sender, address(wallet), name);
    }

    /**
     * @notice Update the spending policy for an agent.
     * @dev This also updates the AgentWallet contract's limits.
     */
    function updatePolicy(
        uint256 agentId,
        uint256 dailyLimit,
        uint256 transactionLimit
    ) external {
        Agent storage agent = _getAgentForOwner(agentId, msg.sender);
        if (dailyLimit == 0 || transactionLimit == 0) revert InvalidLimit();
        if (transactionLimit > dailyLimit) revert InvalidLimit();

        agent.dailyLimit = dailyLimit;
        agent.transactionLimit = transactionLimit;

        // Propagate to the wallet contract
        AgentWallet(agent.wallet).setLimits(dailyLimit, transactionLimit);

        emit AgentPolicyUpdated(agentId, dailyLimit, transactionLimit);
    }

    /**
     * @notice Pause an agent (emergency stop). No further payments will go through.
     */
    function pauseAgent(uint256 agentId) external {
        Agent storage agent = _getAgentForOwner(agentId, msg.sender);
        agent.active = false;
        AgentWallet(agent.wallet).pause();
        emit AgentPaused(agentId);
    }

    /**
     * @notice Re-activate a paused agent.
     */
    function activateAgent(uint256 agentId) external {
        Agent storage agent = _getAgentForOwner(agentId, msg.sender);
        agent.active = true;
        AgentWallet(agent.wallet).unpause();
        emit AgentActivated(agentId);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return _getExistingAgent(agentId);
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _getExistingAgent(agentId).wallet;
    }

    function getAgentsByOwner(address _owner) external view returns (uint256[] memory) {
        return _ownerAgents[_owner];
    }

    function totalAgents() external view returns (uint256) {
        return _nextAgentId - 1;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _getExistingAgent(uint256 agentId) internal view returns (Agent storage) {
        Agent storage agent = _agents[agentId];
        if (agent.id == 0) revert AgentNotFound(agentId);
        return agent;
    }

    function _getAgentForOwner(
        uint256 agentId,
        address caller
    ) internal view returns (Agent storage) {
        Agent storage agent = _getExistingAgent(agentId);
        if (agent.owner != caller && owner() != caller) {
            revert NotAgentOwner(agentId, caller);
        }
        return agent;
    }
}
