// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AgentWallet
 * @notice Per-agent wallet that holds USDT, enforces spending limits, and
 *         executes payments to service providers.
 *
 * @dev Spending policy is enforced here at the contract level.
 *      The AI agent and application layer cannot bypass these checks.
 *
 * Security model:
 *   AI proposes → backend calls executePayment() → THIS contract enforces policy
 */
contract AgentWallet is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────────────

    address public immutable owner;       // EOA that owns this agent
    address public immutable registry;    // AgentRegistry that deployed this wallet
    address public immutable router;      // PaymentRouter authorized to trigger payments

    uint256 public dailyLimit;            // max USDT per day (in token units)
    uint256 public transactionLimit;      // max USDT per single payment

    uint256 public spentToday;            // accumulator for current day
    uint256 public lastReset;             // unix timestamp of last daily reset

    // Allowlist of tokens this wallet accepts
    mapping(address => bool) public supportedTokens;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed from, address indexed token, uint256 amount);
    event Withdrawn(address indexed to, address indexed token, uint256 amount);
    event PaymentExecuted(
        uint256 indexed serviceId,
        address indexed provider,
        address indexed token,
        uint256 amount
    );
    event LimitsUpdated(uint256 dailyLimit, uint256 transactionLimit);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error Unauthorized();
    error UnsupportedToken(address token);
    error ExceedsTransactionLimit(uint256 amount, uint256 limit);
    error ExceedsDailyLimit(uint256 amount, uint256 remaining);
    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidAmount();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAuthorized() {
        // PaymentRouter or Registry can trigger payments
        if (msg.sender != router && msg.sender != registry) revert Unauthorized();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _owner,
        address _registry,
        address _router,
        address _usdtToken,
        uint256 _dailyLimit,
        uint256 _transactionLimit
    ) {
        owner = _owner;
        registry = _registry;
        router = _router;
        dailyLimit = _dailyLimit;
        transactionLimit = _transactionLimit;
        lastReset = block.timestamp;

        // USDT is always supported
        supportedTokens[_usdtToken] = true;
    }

    // ─── Deposit ─────────────────────────────────────────────────────────────

    /**
     * @notice Deposit ERC-20 tokens (USDT) into the agent wallet.
     * @dev Caller must first approve this contract to spend their tokens.
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (!supportedTokens[token]) revert UnsupportedToken(token);
        if (amount == 0) revert InvalidAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, token, amount);
    }

    // ─── Withdraw ────────────────────────────────────────────────────────────

    /**
     * @notice Owner can withdraw any token from the wallet.
     */
    function withdraw(address token, uint256 amount) external nonReentrant onlyOwner {
        if (amount == 0) revert InvalidAmount();
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (amount > bal) revert InsufficientBalance(amount, bal);

        IERC20(token).safeTransfer(owner, amount);
        emit Withdrawn(owner, token, amount);
    }

    // ─── Payment execution ────────────────────────────────────────────────────

    /**
     * @notice Execute a payment to a service provider.
     * @dev Called by the PaymentRouter (which is called by the backend operator).
     *      All spending limits are validated here — this is the enforcement layer.
     *
     * @param serviceId On-chain service ID (for event indexing).
     * @param provider  Provider wallet to receive payment.
     * @param token     Payment token (must be supported).
     * @param amount    Payment amount in token units.
     */
    function executePayment(
        uint256 serviceId,
        address provider,
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused onlyAuthorized {
        if (!supportedTokens[token]) revert UnsupportedToken(token);
        if (amount == 0) revert InvalidAmount();

        // Reset daily counter if a new day has started
        _resetDailyIfNeeded();

        // Policy check 1: transaction limit
        if (amount > transactionLimit) {
            revert ExceedsTransactionLimit(amount, transactionLimit);
        }

        // Policy check 2: daily limit
        uint256 remaining = dailyLimit - spentToday;
        if (amount > remaining) {
            revert ExceedsDailyLimit(amount, remaining);
        }

        // Policy check 3: balance
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (amount > balance) {
            revert InsufficientBalance(amount, balance);
        }

        // Execute the transfer
        spentToday += amount;
        IERC20(token).safeTransfer(provider, amount);

        emit PaymentExecuted(serviceId, provider, token, amount);
    }

    // ─── Limit management ─────────────────────────────────────────────────────

    /**
     * @notice Update spending limits. Only the owner or registry can call this.
     */
    function setLimits(uint256 _dailyLimit, uint256 _transactionLimit) external {
        if (msg.sender != owner && msg.sender != registry) revert Unauthorized();
        dailyLimit = _dailyLimit;
        transactionLimit = _transactionLimit;
        emit LimitsUpdated(_dailyLimit, _transactionLimit);
    }

    // ─── Token management ─────────────────────────────────────────────────────

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    // ─── Emergency ────────────────────────────────────────────────────────────

    function pause() external {
        if (msg.sender != owner && msg.sender != registry) revert Unauthorized();
        _pause();
    }

    function unpause() external {
        if (msg.sender != owner && msg.sender != registry) revert Unauthorized();
        _unpause();
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getRemainingDailyLimit() external view returns (uint256) {
        // Account for reset that would happen on next interaction
        if (_isNewDay()) return dailyLimit;
        return dailyLimit > spentToday ? dailyLimit - spentToday : 0;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _resetDailyIfNeeded() internal {
        if (_isNewDay()) {
            spentToday = 0;
            lastReset = block.timestamp;
        }
    }

    function _isNewDay() internal view returns (bool) {
        return block.timestamp >= lastReset + 1 days;
    }
}
