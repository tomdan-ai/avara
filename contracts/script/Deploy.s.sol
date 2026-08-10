// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ServiceRegistry.sol";
import "../src/AgentRegistry.sol";
import "../src/PaymentRouter.sol";

/**
 * @notice Deployment script for Avara contracts.
 *
 * Usage:
 *   forge script script/Deploy.s.sol:DeployAvara \
 *     --rpc-url $BOT_RPC_URL \
 *     --private-key $BOT_PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 *
 * After deployment, update .env.local with the printed contract addresses.
 */
contract DeployAvara is Script {
    // BOT Chain USDT address
    address constant USDT = 0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C;

    function run() external {
        uint256 deployerKey = vm.envUint("BOT_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deploying Avara contracts...");
        console.log("Deployer:", deployer);
        console.log("USDT:", USDT);

        vm.startBroadcast(deployerKey);

        uint256 nonce = vm.getNonce(deployer);
        // Step 1: ServiceRegistry (nonce), Step 2: PaymentRouter (nonce + 1), Step 3: AgentRegistry (nonce + 2)
        address predictedAgentRegistry = vm.computeCreateAddress(deployer, nonce + 2);

        // 1. Deploy ServiceRegistry
        ServiceRegistry serviceRegistry = new ServiceRegistry();
        console.log("ServiceRegistry:", address(serviceRegistry));

        // 2. Deploy PaymentRouter with predicted AgentRegistry address
        PaymentRouter paymentRouter = new PaymentRouter(
            predictedAgentRegistry,
            address(serviceRegistry)
        );
        console.log("PaymentRouter:", address(paymentRouter));

        // 3. Deploy AgentRegistry
        AgentRegistry agentRegistry = new AgentRegistry(USDT, address(paymentRouter));
        require(address(agentRegistry) == predictedAgentRegistry, "AgentRegistry address mismatch");
        console.log("AgentRegistry:", address(agentRegistry));

        // 4. Register built-in services
        uint256 weatherId = serviceRegistry.registerService(
            "Weather Agent",
            "https://avara.app/services/weather",
            20_000, // $0.02 USDT
            USDT
        );
        console.log("Weather Agent service ID:", weatherId);

        uint256 marketId = serviceRegistry.registerService(
            "Market Data Agent",
            "https://avara.app/services/market",
            50_000, // $0.05 USDT
            USDT
        );
        console.log("Market Data Agent service ID:", marketId);

        uint256 translationId = serviceRegistry.registerService(
            "Translation Agent",
            "https://avara.app/services/translation",
            10_000, // $0.01 USDT
            USDT
        );
        console.log("Translation Agent service ID:", translationId);

        vm.stopBroadcast();

        // Print env vars to paste into .env.local
        console.log("\n--- Copy to .env.local ---");
        console.log("AGENT_REGISTRY_ADDRESS=%s", address(agentRegistry));
        console.log("SERVICE_REGISTRY_ADDRESS=%s", address(serviceRegistry));
        console.log("PAYMENT_ROUTER_ADDRESS=%s", address(paymentRouter));
        console.log("NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=%s", address(agentRegistry));
        console.log("NEXT_PUBLIC_SERVICE_REGISTRY_ADDRESS=%s", address(serviceRegistry));
        console.log("NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS=%s", address(paymentRouter));
    }
}
