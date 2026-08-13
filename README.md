# Avara

**Programmable wallets and autonomous payments for AI agents on BOT Chain.**

> The AI proposes. Policy authorizes. Blockchain enforces.

Built for the **BOT Chain Africa Pioneer Builder Challenge 2026**.

---

![Avara Landing Page](docs/landing.png)

> *Screenshot: Landing page — "Give AI Agents the Power to Transact"*

---

## What is Avara?

Avara gives AI agents programmable on-chain wallets and enforceable spending policies so they can autonomously discover services, make payments, and return results — without requiring a human to sign every transaction.

Most AI agents today have no financial infrastructure. They can reason, plan, and execute tasks — but they cannot pay for anything safely. Giving an agent unrestricted access to a private key creates a different problem: what stops the AI from making a bad decision?

Avara separates **AI decision-making** from **financial authorization**.

```
AI proposes a payment
        ↓
Policy engine validates against limits
        ↓
AgentWallet smart contract enforces on-chain
        ↓
USDT transferred on BOT Chain
        ↓
Result returned to user
```

The AI cannot override transaction limits, daily limits, or approved providers. These are enforced at the smart contract level — not in application code.

---

## Demo

![Avara Agent Chat](docs/chat.png)

> *Screenshot: Research Agent autonomously finding a trending token, analyzing risk, checking spending policy, and executing a $1 USDT payment on BOT Chain*

**Live demo flow:**

1. User creates a Research Agent with a $2 transaction limit and $10 daily limit
2. Agent is funded with USDT via its on-chain wallet
3. User asks: *"Find a trending token, analyze it, and if it looks reasonable buy $1 worth"*
4. Agent searches DexScreener live, analyzes risk signals, checks spending policy
5. If approved: USDT is transferred on BOT Chain — real transaction hash returned
6. If blocked: Agent explains exactly why (e.g. *"$5 exceeds your $2 transaction limit"*)

The second case is as important as the first. It proves the security model works.

---

## Architecture

```
                        USER
                          │
                          ▼
                 ┌─────────────────┐
                 │    Next.js App  │
                 │                 │
                 │  Dashboard      │
                 │  Agent UI       │
                 │  Chat           │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Next.js Server │
                 │                 │
                 │  API Routes     │
                 │  AI Orchestrator│
                 │  Policy Engine  │
                 │  Blockchain SDK │
                 └───────┬─────────┘
                         │
            ┌────────────┼─────────────┐
            │            │             │
            ▼            ▼             ▼
       PostgreSQL        LLM        BOT Chain
       (Supabase)   (OpenRouter)       │
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                   AgentRegistry              AgentWallet
                          │                         │
                          └────────────┬────────────┘
                                       │
                                PaymentRouter
                                       │
                                 ServiceRegistry
```

---

## Smart Contracts — BOT Chain Mainnet (Chain 677)

| Contract | Address | Explorer |
|---|---|---|
| AgentRegistry | `0x9AD5E520a0E105F0bb44BCc2CB259C973d95E416` | [View](https://scan.botchain.ai/address/0x9AD5E520a0E105F0bb44BCc2CB259C973d95E416) |
| ServiceRegistry | `0x37BbAE37b3c23C6D2d27163B154F8e49116263A4` | [View](https://scan.botchain.ai/address/0x37BbAE37b3c23C6D2d27163B154F8e49116263A4) |
| PaymentRouter | `0xAF1A1C87e19879fA1a846C3c94c5c449137d564D` | [View](https://scan.botchain.ai/address/0xAF1A1C87e19879fA1a846C3c94c5c449137d564D) |
| USDT | `0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C` | [View](https://scan.botchain.ai/address/0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C) |

**Deployment transactions (block 19535519):**

| Contract | TX Hash |
|---|---|
| ServiceRegistry | [0xe2566c...](https://scan.botchain.ai/tx/0xe2566cdf0814e37e1cbb889808e796911e4262eccbc5f4c9d154ebd6479b27fc) |
| PaymentRouter | [0xfc6de4...](https://scan.botchain.ai/tx/0xfc6de4a196fc8cbde743c73b9b19a417b0664ce5e697e49f788ddb053ca13a0d) |
| AgentRegistry | [0xa7f7ae...](https://scan.botchain.ai/tx/0xa7f7ae77b4eaa7cd7ad9d9e4706f2889ea6040c36db8cacccb96eaa02711cc6b) |

---

## Contract Architecture

### AgentRegistry
Central registry for all Avara agents. When a user creates an agent:
- Assigns a unique on-chain agent ID
- Deploys a dedicated `AgentWallet` for that agent
- Stores the agent's spending policy (daily limit + transaction limit)

### AgentWallet
Per-agent wallet that holds USDT and enforces spending limits. Every payment call validates:
1. Is the agent active?
2. Is the token supported?
3. Does the amount exceed the transaction limit?
4. Does the payment exceed today's remaining daily limit?
5. Does the wallet have enough balance?

These checks are in the contract — no application code can bypass them.

### PaymentRouter
The single entry point for the backend operator to trigger payments. Validates the service is active on-chain, then routes to `AgentWallet.executePayment()`.

### ServiceRegistry
On-chain registry of services agents can purchase. Each service has a name, price (in USDT), provider address, and metadata URI.

---

## AI Agent Tools

The agent uses tool calling to autonomously carry out tasks. All tools are server-side — the LLM never accesses a private key.

| Tool | Description |
|---|---|
| `searchWeb` | DuckDuckGo real-time search |
| `fetchPage` | Read content from any URL |
| `getTrendingTokens` | Live trending tokens from DexScreener |
| `getTokenPrice` | Price, market cap, volume from CoinGecko + DexScreener |
| `searchTokens` | Find tokens by name or keyword |
| `analyzeToken` | Risk analysis: liquidity, age, volume, red flags |
| `checkSpendingPolicy` | Validate payment against agent limits |
| `executePayment` | USDT transfer on BOT Chain via PaymentRouter |

### Security model

```
LLM decides: "I want to purchase this service"
         ↓
checkSpendingPolicy() — validates limits in the database
         ↓
executePayment() — calls PaymentRouter on BOT Chain
         ↓
AgentWallet.executePayment() — final enforcement on-chain
```

Prompt injection cannot become a financial transaction. The contract is the last line of defence.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers (serverless) |
| Database | PostgreSQL via Supabase + Prisma ORM |
| Blockchain (client) | wagmi v2, viem v2 |
| Blockchain (server) | viem v2 |
| Smart contracts | Solidity 0.8.24, Foundry, OpenZeppelin |
| AI | Vercel AI SDK, OpenRouter (any model) |
| Deployment | Vercel + Supabase + BOT Chain |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- An OpenRouter API key (free models available)
- MetaMask with BOT Chain mainnet added

### Installation

```bash
git clone https://github.com/tomdan-ai/avara.git
cd avara/web
npm install
```

### Environment setup

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```env
# Supabase — Transaction pooler URL (port 6543)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# OpenRouter — https://openrouter.ai/keys
AI_PROVIDER="openrouter"
AI_MODEL="nvidia/nemotron-3-ultra-550b-a55b:free"
AI_API_KEY="sk-or-v1-..."

# BOT Chain operator wallet (server-side only)
BOT_PRIVATE_KEY="0x..."
BOT_RPC_URL="https://rpc.botchain.ai"

# Contract addresses
AGENT_REGISTRY_ADDRESS="0x9AD5E520a0E105F0bb44BCc2CB259C973d95E416"
SERVICE_REGISTRY_ADDRESS="0x37BbAE37b3c23C6D2d27163B154F8e49116263A4"
PAYMENT_ROUTER_ADDRESS="0xAF1A1C87e19879fA1a846C3c94c5c449137d564D"
USDT_ADDRESS="0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C"

# Public
NEXT_PUBLIC_BOT_CHAIN_ID=677
NEXT_PUBLIC_BOT_CHAIN_NAME="BOT Chain"
NEXT_PUBLIC_BOT_CHAIN_RPC="https://rpc.botchain.ai"
NEXT_PUBLIC_BOT_EXPLORER="https://scan.botchain.ai"
NEXT_PUBLIC_USDT_ADDRESS="0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C"
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS="0x9AD5E520a0E105F0bb44BCc2CB259C973d95E416"
NEXT_PUBLIC_SERVICE_REGISTRY_ADDRESS="0x37BbAE37b3c23C6D2d27163B154F8e49116263A4"
NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS="0xAF1A1C87e19879fA1a846C3c94c5c449137d564D"
```

### Database setup

```bash
# Push schema to Supabase
npx prisma db push

# Seed built-in services
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Using the App

### Add BOT Chain to MetaMask

The app will automatically prompt you — or add it manually:

| Field | Value |
|---|---|
| Network name | BOT Chain |
| RPC URL | https://rpc.botchain.ai |
| Chain ID | 677 |
| Symbol | BOT |
| Explorer | https://scan.botchain.ai |

### Create an agent

1. Connect your MetaMask wallet
2. Go to **Agents → New Agent**
3. Set a name and spending policy (e.g. $2 per transaction, $10 per day)
4. Click **Deploy Agent** — this calls `AgentRegistry.createAgent()` on BOT Chain

### Fund the agent

1. Open the agent detail page
2. Click **Fund Agent**
3. Enter a USDT amount and confirm two transactions in MetaMask:
   - Approve USDT spend
   - Deposit into agent wallet

### Chat with the agent

Open the chat and try:

```
Find a trending token, analyze it, and buy $1 worth if it looks safe
```

Watch the agent work in real time:
- Fetches trending tokens from DexScreener
- Analyzes liquidity, volume, age, and risk signals
- Checks spending policy
- Executes payment on BOT Chain
- Returns a transaction hash

Try the policy block demo:
```
Buy $50 worth of any token
```
The agent will explain it cannot proceed because the amount exceeds the $2 transaction limit. This demonstrates the security model.

---

## Smart Contract Development

### Build

```bash
cd contracts
forge build
```

### Test

```bash
forge test -v
```

**Test coverage includes:**
- Create agent
- Deposit USDT
- Payment succeeds
- Transaction limit enforced
- Daily limit enforced
- Insufficient balance
- Unauthorized caller
- Paused wallet
- Daily limit reset after 24 hours
- Unsupported token

All 21 tests pass.

### Deploy to BOT Chain

```bash
source .env
forge script script/Deploy.s.sol:DeployAvara \
  --rpc-url $BOT_RPC_URL \
  --private-key $BOT_PRIVATE_KEY \
  --broadcast
```

### Verify contracts

```bash
source .env

forge verify-contract \
  0x37BbAE37b3c23C6D2d27163B154F8e49116263A4 \
  src/ServiceRegistry.sol:ServiceRegistry \
  --chain-id 677 \
  --rpc-url https://rpc.botchain.ai \
  --verifier-url https://scan.botchain.ai/api \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch

forge verify-contract \
  0xAF1A1C87e19879fA1a846C3c94c5c449137d564D \
  src/PaymentRouter.sol:PaymentRouter \
  --chain-id 677 \
  --rpc-url https://rpc.botchain.ai \
  --verifier-url https://scan.botchain.ai/api \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" \
    0x9AD5E520a0E105F0bb44BCc2CB259C973d95E416 \
    0x37BbAE37b3c23C6D2d27163B154F8e49116263A4) \
  --watch

forge verify-contract \
  0x9AD5E520a0E105F0bb44BCc2CB259C973d95E416 \
  src/AgentRegistry.sol:AgentRegistry \
  --chain-id 677 \
  --rpc-url https://rpc.botchain.ai \
  --verifier-url https://scan.botchain.ai/api \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" \
    0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C \
    0xAF1A1C87e19879fA1a846C3c94c5c449137d564D) \
  --watch
```

---

## Security

- The LLM never accesses a private key
- `checkSpendingPolicy` is enforced both in the database and on-chain
- The `AgentWallet` contract is the final authority on all payments
- Emergency pause is available per-agent (owner or registry only)
- ReentrancyGuard on all state-changing wallet functions
- SafeERC20 for all token transfers
- Token allowlist — only explicitly supported tokens can be used

---

## Built-in Services

Three services are pre-registered on BOT Chain:

| Service | Price | Category |
|---|---|---|
| Weather Agent | $0.02 / request | Real-time weather via Open-Meteo |
| Market Data Agent | $0.05 / request | Crypto prices via CoinGecko |
| Translation Agent | $0.01 / request | Text translation via MyMemory |

---

## BOT Chain Integration

Avara is built natively on BOT Chain, demonstrating:

- **On-chain agent identity** — every agent has a blockchain ID and wallet address
- **On-chain service registry** — services are registered and discovered on-chain
- **On-chain payment enforcement** — spending limits live in the contract, not the app
- **Real USDT payments** — actual token transfers with verifiable transaction hashes
- **Block explorer integration** — every transaction links to scan.botchain.ai

BOT Chain was chosen for its low fees, fast finality, and USDT support — properties that make autonomous micropayments practical.

---

## Hackathon

**Event:** BOT Chain Africa Pioneer Builder Challenge 2026  
**Track:** Infrastructure / DeFi  
**Theme:** Autonomous AI payments on BOT Chain

---

## License

MIT
