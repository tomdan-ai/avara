// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ServiceRegistry.sol";
import "../src/AgentRegistry.sol";
import "../src/AgentWallet.sol";
import "../src/PaymentRouter.sol";

/**
 * @notice Mock ERC-20 token used as USDT in tests.
 */
contract MockUSDT {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name = "Mock USDT";
    string public symbol = "USDT";
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract AvaraTest is Test {
    // ─── Contracts ────────────────────────────────────────────────────────────
    MockUSDT usdt;
    ServiceRegistry serviceRegistry;
    AgentRegistry agentRegistry;
    PaymentRouter paymentRouter;

    // ─── Actors ───────────────────────────────────────────────────────────────
    address deployer = address(0x1);
    address agentOwner = address(0x2);
    address provider = address(0x3);
    address operator = address(0x4);
    address attacker = address(0x5);

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 constant TX_LIMIT = 2_000_000;    // $2 USDT
    uint256 constant DAILY_LIMIT = 10_000_000; // $10 USDT
    uint256 constant WEATHER_PRICE = 20_000;  // $0.02 USDT
    uint256 constant WALLET_FUND = 50_000_000; // $50 USDT

    uint256 weatherServiceId;
    uint256 agentId;
    address agentWalletAddr;

    // ─── Setup ────────────────────────────────────────────────────────────────

    function setUp() public {
        vm.startPrank(deployer);

        usdt = new MockUSDT();
        serviceRegistry = new ServiceRegistry();

        uint256 nonce = vm.getNonce(deployer);
        address predictedAgentRegistry = vm.computeCreateAddress(deployer, nonce + 1);

        paymentRouter = new PaymentRouter(predictedAgentRegistry, address(serviceRegistry));
        agentRegistry = new AgentRegistry(address(usdt), address(paymentRouter));
        require(address(agentRegistry) == predictedAgentRegistry, "AgentRegistry address mismatch");

        // Add operator
        paymentRouter.addOperator(operator);

        // Register the Weather service
        weatherServiceId = serviceRegistry.registerService(
            "Weather Agent",
            "ipfs://weather",
            WEATHER_PRICE,
            address(usdt)
        );

        vm.stopPrank();

        // Create an agent
        vm.startPrank(agentOwner);
        agentId = agentRegistry.createAgent("Research Agent", DAILY_LIMIT, TX_LIMIT);
        agentWalletAddr = agentRegistry.getAgentWallet(agentId);

        // Fund the agent wallet
        usdt.mint(agentOwner, WALLET_FUND);
        usdt.approve(agentWalletAddr, WALLET_FUND);
        AgentWallet(agentWalletAddr).deposit(address(usdt), WALLET_FUND);

        vm.stopPrank();
    }

    // ─── ServiceRegistry tests ────────────────────────────────────────────────

    function test_RegisterService() public view {
        ServiceRegistry.Service memory svc = serviceRegistry.getService(weatherServiceId);
        assertEq(svc.name, "Weather Agent");
        assertEq(svc.price, WEATHER_PRICE);
        assertTrue(svc.active);
        assertEq(svc.provider, deployer);
    }

    function test_ServiceNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(ServiceRegistry.ServiceNotFound.selector, 999));
        serviceRegistry.getService(999);
    }

    function test_DeactivateService() public {
        vm.prank(deployer);
        serviceRegistry.deactivateService(weatherServiceId);
        assertFalse(serviceRegistry.isServiceActive(weatherServiceId));
    }

    function test_OnlyProviderCanDeactivate() public {
        vm.prank(attacker);
        vm.expectRevert();
        serviceRegistry.deactivateService(weatherServiceId);
    }

    // ─── AgentRegistry tests ──────────────────────────────────────────────────

    function test_CreateAgent() public view {
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        assertEq(agent.owner, agentOwner);
        assertEq(agent.name, "Research Agent");
        assertEq(agent.dailyLimit, DAILY_LIMIT);
        assertEq(agent.transactionLimit, TX_LIMIT);
        assertTrue(agent.active);
        assertTrue(agent.wallet != address(0));
    }

    function test_AgentNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(AgentRegistry.AgentNotFound.selector, 999));
        agentRegistry.getAgent(999);
    }

    function test_TransactionLimitCannotExceedDailyLimit() public {
        vm.prank(agentOwner);
        vm.expectRevert(AgentRegistry.InvalidLimit.selector);
        agentRegistry.createAgent("Bad Agent", 1_000_000, 5_000_000); // tx > daily
    }

    function test_UpdatePolicy() public {
        uint256 newDaily = 5_000_000;
        uint256 newTx = 1_000_000;

        vm.prank(agentOwner);
        agentRegistry.updatePolicy(agentId, newDaily, newTx);

        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        assertEq(agent.dailyLimit, newDaily);
        assertEq(agent.transactionLimit, newTx);

        // Wallet should also be updated
        assertEq(AgentWallet(agentWalletAddr).dailyLimit(), newDaily);
        assertEq(AgentWallet(agentWalletAddr).transactionLimit(), newTx);
    }

    function test_PauseAgent() public {
        vm.prank(agentOwner);
        agentRegistry.pauseAgent(agentId);

        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        assertFalse(agent.active);
    }

    // ─── AgentWallet tests ────────────────────────────────────────────────────

    function test_Deposit() public view {
        uint256 balance = AgentWallet(agentWalletAddr).getBalance(address(usdt));
        assertEq(balance, WALLET_FUND);
    }

    function test_Withdraw() public {
        uint256 withdrawAmount = 10_000_000; // $10
        vm.prank(agentOwner);
        AgentWallet(agentWalletAddr).withdraw(address(usdt), withdrawAmount);
        assertEq(usdt.balanceOf(agentOwner), withdrawAmount);
    }

    function test_WithdrawUnauthorized() public {
        vm.prank(attacker);
        vm.expectRevert(AgentWallet.Unauthorized.selector);
        AgentWallet(agentWalletAddr).withdraw(address(usdt), 1_000_000);
    }

    // ─── Payment tests ────────────────────────────────────────────────────────

    function test_PaymentSucceeds() public {
        address walletRegistry = AgentWallet(agentWalletAddr).registry();
        assertEq(walletRegistry, address(agentRegistry));

        uint256 providerBefore = usdt.balanceOf(provider);

        // prank must be directly before the call it applies to
        vm.prank(walletRegistry);
        AgentWallet(agentWalletAddr).executePayment(
            weatherServiceId,
            provider,
            address(usdt),
            WEATHER_PRICE
        );

        assertEq(usdt.balanceOf(provider), providerBefore + WEATHER_PRICE);
        assertEq(AgentWallet(agentWalletAddr).spentToday(), WEATHER_PRICE);
    }

    function test_RoutePaymentSucceeds() public {
        uint256 providerBefore = usdt.balanceOf(deployer); // deployer is provider for weatherServiceId

        vm.prank(operator);
        paymentRouter.routePayment(
            agentId,
            weatherServiceId,
            WEATHER_PRICE
        );

        assertEq(usdt.balanceOf(deployer), providerBefore + WEATHER_PRICE);
        assertEq(AgentWallet(agentWalletAddr).spentToday(), WEATHER_PRICE);
    }

    function test_TransactionLimitEnforced() public {
        uint256 overLimit = TX_LIMIT + 1;

        vm.prank(address(agentRegistry));
        vm.expectRevert(
            abi.encodeWithSelector(AgentWallet.ExceedsTransactionLimit.selector, overLimit, TX_LIMIT)
        );
        AgentWallet(agentWalletAddr).executePayment(
            weatherServiceId,
            provider,
            address(usdt),
            overLimit
        );
    }

    function test_DailyLimitEnforced() public {
        // Execute 5 payments of $2 each to exhaust $10 daily limit
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(address(agentRegistry));
            AgentWallet(agentWalletAddr).executePayment(
                weatherServiceId,
                provider,
                address(usdt),
                TX_LIMIT
            );
        }

        // Next payment should fail
        vm.prank(address(agentRegistry));
        vm.expectRevert();
        AgentWallet(agentWalletAddr).executePayment(
            weatherServiceId,
            provider,
            address(usdt),
            TX_LIMIT
        );
    }

    function test_InsufficientBalance() public {
        // Create a wallet with minimal funds
        vm.startPrank(agentOwner);
        uint256 smallAgentId = agentRegistry.createAgent("Poor Agent", DAILY_LIMIT, TX_LIMIT);
        address smallWallet = agentRegistry.getAgentWallet(smallAgentId);

        // Only fund with $0.01
        usdt.mint(agentOwner, 10_000);
        usdt.approve(smallWallet, 10_000);
        AgentWallet(smallWallet).deposit(address(usdt), 10_000);
        vm.stopPrank();

        // Try to pay $0.02 — should fail
        vm.prank(address(agentRegistry));
        vm.expectRevert();
        AgentWallet(smallWallet).executePayment(
            weatherServiceId,
            provider,
            address(usdt),
            WEATHER_PRICE
        );
    }

    function test_PaymentUnauthorized() public {
        vm.prank(attacker);
        vm.expectRevert(AgentWallet.Unauthorized.selector);
        AgentWallet(agentWalletAddr).executePayment(
            weatherServiceId,
            provider,
            address(usdt),
            WEATHER_PRICE
        );
    }

    function test_PausedWalletBlocksPayment() public {
        vm.prank(agentOwner);
        agentRegistry.pauseAgent(agentId);

        vm.prank(address(agentRegistry));
        vm.expectRevert();
        AgentWallet(agentWalletAddr).executePayment(
            weatherServiceId,
            provider,
            address(usdt),
            WEATHER_PRICE
        );
    }

    function test_DailyLimitResetsAfter24Hours() public {
        // Spend the full daily limit
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(address(agentRegistry));
            AgentWallet(agentWalletAddr).executePayment(
                weatherServiceId,
                provider,
                address(usdt),
                TX_LIMIT
            );
        }

        // Warp forward 1 day + 1 second
        vm.warp(block.timestamp + 1 days + 1);

        // Should succeed now
        vm.prank(address(agentRegistry));
        AgentWallet(agentWalletAddr).executePayment(
            weatherServiceId,
            provider,
            address(usdt),
            TX_LIMIT
        );

        assertEq(AgentWallet(agentWalletAddr).spentToday(), TX_LIMIT);
    }

    function test_UnsupportedToken() public {
        address fakeToken = address(0xdead);
        vm.prank(address(agentRegistry));
        vm.expectRevert(
            abi.encodeWithSelector(AgentWallet.UnsupportedToken.selector, fakeToken)
        );
        AgentWallet(agentWalletAddr).executePayment(
            weatherServiceId,
            provider,
            fakeToken,
            WEATHER_PRICE
        );
    }

    // ─── Reentrancy protection test ───────────────────────────────────────────

    function test_MultiplePaymentsNonReentrant() public {
        // Execute multiple sequential payments — all should succeed without reentrancy issues
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(address(agentRegistry));
            AgentWallet(agentWalletAddr).executePayment(
                weatherServiceId,
                provider,
                address(usdt),
                WEATHER_PRICE
            );
        }
        assertEq(AgentWallet(agentWalletAddr).spentToday(), WEATHER_PRICE * 3);
    }
}
