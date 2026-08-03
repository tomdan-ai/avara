// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AgentWallet.sol";
import "./ServiceRegistry.sol";
import "./AgentRegistry.sol";

/**
 * @title PaymentRouter
 * @notice Orchestrates payments between AgentWallet and service providers.
 *
 * @dev This is the single entry point for the backend operator to trigger payments.
 *      It validates the service is active, routes to the AgentWallet, and emits
 *      a standardized PaymentExecuted event for indexing.
 *
 * Call flow:
 *   Backend operator → PaymentRouter.routePayment() → AgentWallet.executePayment()
 *   AgentWallet enforces spending limits → transfers USDT to provider
 */
contract PaymentRouter is Ownable, Pausable {
    // ─── State ────────────────────────────────────────────────────────────────

    AgentRegistry public immutable agentRegistry;
    ServiceRegistry public immutable serviceRegistry;

    // Addresses authorized to trigger payments (backend operator wallets)
    mapping(address => bool) public authorizedOperators;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PaymentExecuted(
        uint256 indexed agentId,
        uint256 indexed serviceId,
        address indexed provider,
        address token,
        uint256 amount
    );

    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error Unauthorized();
    error ServiceNotActive(uint256 serviceId);
    error AgentNotActive(uint256 agentId);
    error PriceMismatch(uint256 expected, uint256 provided);

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _agentRegistry,
        address _serviceRegistry
    ) Ownable(msg.sender) {
        agentRegistry = AgentRegistry(_agentRegistry);
        serviceRegistry = ServiceRegistry(_serviceRegistry);
        // The deployer is the initial operator
        authorizedOperators[msg.sender] = true;
    }

    // ─── Payment routing ──────────────────────────────────────────────────────

    /**
     * @notice Route a payment from an agent wallet to a service provider.
     * @dev Can only be called by an authorized operator.
     *      AgentWallet will revert if any spending limit is exceeded.
     *
     * @param agentId       The agent making the payment.
     * @param serviceId     The service being purchased.
     * @param amount        Expected payment amount. Must match service price.
     */
    function routePayment(
        uint256 agentId,
        uint256 serviceId,
        uint256 amount
    ) external whenNotPaused {
        if (!authorizedOperators[msg.sender]) revert Unauthorized();

        // Validate agent is active
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        if (!agent.active) revert AgentNotActive(agentId);

        // Validate service is active and get price
        ServiceRegistry.Service memory svc = serviceRegistry.getService(serviceId);
        if (!svc.active) revert ServiceNotActive(serviceId);

        // Ensure amount matches expected service price (prevents manipulation)
        if (amount != svc.price) revert PriceMismatch(svc.price, amount);

        // Execute the payment via the agent's wallet
        // AgentWallet will enforce transaction and daily limits
        AgentWallet(agent.wallet).executePayment(
            serviceId,
            svc.provider,
            svc.paymentToken,
            amount
        );

        emit PaymentExecuted(agentId, serviceId, svc.provider, svc.paymentToken, amount);
    }

    // ─── Operator management ──────────────────────────────────────────────────

    function addOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = true;
        emit OperatorAdded(operator);
    }

    function removeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
        emit OperatorRemoved(operator);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
