# **AgentPay — Product Requirements Document & Build Plan**

**Version:** 1.0  
**Build Sprint:** August 1–13, 2026  
**Hackathon:** BOT Chain Africa Pioneer Builder Challenge — Nigeria  
**Target:** Functional MVP \+ polished demo \+ production-quality documentation

---

# **1\. Executive Summary**

## **Product**

**AgentPay** is a programmable financial infrastructure layer that enables AI agents to autonomously discover services, make payments, and receive results on BOT Chain while operating within user-defined financial constraints.

### **One-line description**

> **AgentPay gives AI agents programmable wallets and enforceable spending policies so they can autonomously pay for digital services on BOT Chain.**

### **Example**

A user creates a:

> **Research Agent**

and funds it with:

> **50 USDT**

The user defines:

Maximum transaction: $2  
Daily spending limit: $10  
Approved services:  
  ✓ Weather  
  ✓ Market Data  
  ✓ Translation

The user then asks:

> "What's the weather in Lagos?"

The agent:

1\. Understands the request  
2\. Determines it needs weather data  
3\. Discovers Weather Agent  
4\. Checks price  
5\. Checks its spending policy  
6\. Requests payment  
7\. Smart contract validates the payment  
8\. USDT is transferred on BOT Chain  
9\. Weather service returns the data  
10\. Agent gives the user the answer

The entire payment is recorded on-chain.

---

# **2\. Problem Statement**

AI agents are becoming increasingly capable of performing autonomous tasks.

However, most AI agents currently have no reliable financial infrastructure.

They cannot safely:

* hold funds  
* pay APIs  
* purchase data  
* pay other agents  
* enforce spending limits  
* maintain transparent financial histories  
* operate autonomously without requiring a human signature for every transaction

Giving an AI agent unrestricted access to a private wallet creates another problem:

> **What happens when the AI makes a bad decision?**

AgentPay addresses this by separating:

### **AI decision-making**

from

### **financial authorization.**

The AI can decide:

> "I want to purchase this service."

But the smart contract decides:

> "Is this payment allowed?"

---

# **3\. Product Vision**

AgentPay aims to become:

> **The financial operating system for autonomous AI agents.**

The long-term ecosystem can include:

AI Agent  
   │  
   ├── Wallet  
   ├── Identity  
   ├── Spending Policy  
   ├── Service Discovery  
   ├── Payments  
   ├── Reputation  
   └── Transaction History  
            │  
            ▼  
        BOT Chain

---

# **4\. Hackathon MVP**

We must **not attempt to build the entire vision**.

The MVP will prove one core proposition:

> **An AI agent can autonomously purchase a service using a programmable wallet while BOT Chain smart contracts enforce its spending policy.**

## **MVP components**

### **Required**

* Wallet connection  
* BOT Chain integration  
* Agent creation  
* Agent wallet  
* Agent funding  
* Spending limits  
* Service registry  
* Service discovery  
* AI agent  
* Payment execution  
* USDT payment  
* On-chain transaction history  
* Block explorer links  
* Dashboard  
* At least 2–3 services  
* Real BOT Chain transactions

### **Optional**

* ERC-4337  
* Agent reputation  
* Agent marketplace  
* recurring payments  
* multi-agent workflows  
* transaction simulation  
* gas sponsorship

These are **post-MVP** unless time permits.

---

# **5\. Target Users**

## **Primary**

### **AI developers**

Developers who want their agents to transact autonomously.

Example:

AI research agent  
AI trading assistant  
AI customer service agent  
AI logistics agent  
AI data agent

---

## **Secondary**

### **Service providers**

Businesses or developers who provide APIs/data/services that agents can purchase.

Examples:

Weather API  
Translation API  
Market data  
AI inference  
Geospatial data  
Search API

---

## **Tertiary**

### **End users**

People who create and fund agents.

---

# **6\. Core User Journey**

## **Journey A — Create agent**

User  
 ↓  
Connect Wallet  
 ↓  
Create Agent  
 ↓  
Enter name  
 ↓  
Configure spending policy  
 ↓  
Deploy Agent  
 ↓  
Agent created

---

# **7\. User Journey B — Fund Agent**

User  
 ↓  
Open Agent  
 ↓  
Deposit USDT  
 ↓  
Approve token  
 ↓  
Deposit  
 ↓  
Agent balance updated

---

# **8\. User Journey C — Autonomous Purchase**

User:

> "Get the current weather in Lagos."

Agent:

Intent detected  
      ↓  
Weather data required  
      ↓  
Search service registry  
      ↓  
Weather Agent discovered  
      ↓  
Service price \= $0.02  
      ↓  
Check agent balance  
      ↓  
Check transaction limit  
      ↓  
Check daily limit  
      ↓  
Check provider authorization  
      ↓  
Payment approved  
      ↓  
BOT Chain transaction  
      ↓  
Service executes  
      ↓  
Result returned  
      ↓  
AI responds

---

# **9\. User Journey D — Payment Rejection**

User asks the agent to purchase a service costing:

> `$5`

But:

Transaction limit \= $2

The agent must **not** send the transaction.

Instead:

Payment rejected

Reason:  
Transaction exceeds agent's  
$2 transaction limit.

This is an important demo because it proves the security model.

---

# **10\. Product Architecture**

                    ┌───────────────┐  
                     │     USER      │  
                     └───────┬───────┘  
                             │  
                             ▼  
                  ┌────────────────────┐  
                  │     NEXT.JS WEB    │  
                  │                    │  
                  │ Dashboard          │  
                  │ Agent Management   │  
                  │ Chat               │  
                  │ Transactions       │  
                  └─────────┬──────────┘  
                            │  
                            ▼  
                  ┌────────────────────┐  
                  │    NESTJS API      │  
                  │                    │  
                  │ Agent Service      │  
                  │ AI Orchestrator    │  
                  │ Service Registry   │  
                  │ Blockchain Service │  
                  └──────┬───────┬─────┘  
                         │       │  
                  ┌──────┘       └────────┐  
                  ▼                       ▼  
           ┌────────────┐          ┌─────────────┐  
           │    LLM     │          │ PostgreSQL  │  
           │            │          │             │  
           │ Tool Calls │          │ Agents      │  
           └─────┬──────┘          │ Services    │  
                 │                 │ Transactions│  
                 │                 └─────────────┘  
                 ▼  
        ┌──────────────────────┐  
        │     BOT CHAIN        │  
        │                      │  
        │ AgentRegistry        │  
        │ AgentWallet          │  
        │ ServiceRegistry      │  
        │ PaymentRouter        │  
        │ USDT                 │  
        └──────────────────────┘

---

# **11\. Technology Stack**

## **Frontend**

Next.js  
TypeScript  
Tailwind CSS  
shadcn/ui  
wagmi  
viem  
React Query

## **Backend**

NestJS  
TypeScript  
Prisma  
PostgreSQL  
viem

## **Blockchain**

Solidity  
Foundry  
BOT Chain  
OpenZeppelin

## **AI**

Use an LLM supporting tool/function calling.

The exact provider can remain configurable:

AI\_PROVIDER=  
AI\_MODEL=  
AI\_API\_KEY=

---

# **12\. BOT Chain Configuration**

## **Mainnet**

Network:  
BOT Chain

Chain ID:  
677

RPC:  
https://rpc.botchain.ai

Native token:  
BOT

Explorer:  
https://scan.botchain.ai

## **Testnet**

Use the official BOT Chain testnet configuration from their developer documentation/faucet during development.

---

# **13\. Token Configuration**

### **BOT**

Native token.

Used primarily for:

Gas

### **USDT**

BOT Chain USDT:

0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C

USDT will be the primary payment currency for the MVP.

### **WBOT**

0xD5452816194a3784dBa983426cCe7c122F4abd30

Not required for MVP.

---

# **14\. Smart Contract Architecture**

We will create four core contracts.

AgentRegistry  
      │  
      ▼  
AgentWallet  
      │  
      ▼  
PaymentRouter  
      │  
      ▼  
ServiceRegistry

---

# **15\. AgentRegistry**

Responsible for agent identity and configuration.

## **Data structure**

struct Agent {  
    uint256 id;  
    address owner;  
    address wallet;  
    string name;  
    uint256 dailyLimit;  
    uint256 transactionLimit;  
    uint256 spentToday;  
    uint256 lastReset;  
    bool active;  
}

## **Functions**

createAgent()

getAgent()

updatePolicy()

pauseAgent()

activateAgent()

getAgentWallet()

## **Events**

AgentCreated  
AgentPolicyUpdated  
AgentPaused  
AgentActivated

---

# **16\. AgentWallet**

Each agent receives a wallet controlled by the protocol.

## **Responsibilities**

* hold USDT  
* receive deposits  
* execute payments  
* enforce limits  
* allow owner withdrawal  
* pause emergency operations

## **Functions**

deposit()

withdraw()

executePayment()

setDailyLimit()

setTransactionLimit()

pause()

unpause()

---

# **17\. Payment Policy**

Every payment should pass:

Is agent active?  
        ↓  
Is provider approved?  
        ↓  
Is token supported?  
        ↓  
Is amount \<= transaction limit?  
        ↓  
Is daily limit exceeded?  
        ↓  
Does wallet have enough balance?  
        ↓  
Execute

This logic is central to AgentPay.

---

# **18\. ServiceRegistry**

Stores available services.

## **Service**

struct Service {  
    uint256 id;  
    address provider;  
    string name;  
    string metadataURI;  
    uint256 price;  
    address paymentToken;  
    bool active;  
}

Example:

ID: 1  
Name: Weather API  
Provider: 0x123...  
Price: 0.02 USDT  
Active: true

---

# **19\. PaymentRouter**

Standardizes payments.

AgentWallet  
     ↓  
PaymentRouter  
     ↓  
Provider

Events:

PaymentExecuted(  
    agentId,  
    serviceId,  
    provider,  
    token,  
    amount  
)

---

# **20\. Smart Contract Security**

We should use:

### **OpenZeppelin**

For:

* Ownable  
* ReentrancyGuard  
* SafeERC20  
* Pausable

### **Important protections**

✓ Reentrancy protection  
✓ Access control  
✓ Token allowlist  
✓ Provider validation  
✓ Spending limits  
✓ Emergency pause  
✓ Safe ERC20 transfers  
✓ Input validation

---

# **21\. Backend Architecture**

NestJS modules:

src/  
├── agents/  
├── auth/  
├── ai/  
├── blockchain/  
├── services/  
├── payments/  
├── transactions/  
├── users/  
└── common/

---

# **22\. AI Agent Architecture**

The AI should never receive arbitrary private-key access.

Instead:

AI  
 ↓  
Tool call  
 ↓  
Backend authorization layer  
 ↓  
Smart contract

The AI gets tools such as:

searchServices()

getService()

getAgentBalance()

checkPolicy()

requestPayment()

getTransaction()

getServiceResult()

---

# **23\. Agent Tool Flow**

Example:

User:  
"Get weather in Lagos"

LLM decides:

{  
  "tool": "searchServices",  
  "arguments": {  
    "category": "weather"  
  }  
}

Backend returns:

{  
  "service": "Weather Agent",  
  "price": "0.02",  
  "provider": "0x..."  
}

Agent calls:

checkPolicy()

Then:

requestPayment()

Backend executes the blockchain transaction.

---

# **24\. Critical Security Rule**

**The LLM must never directly control the wallet private key.**

Architecture:

            LLM  
              │  
              ▼  
       Tool Request  
              │  
              ▼  
       Policy Engine  
              │  
              ▼  
        Smart Contract  
              │  
              ▼  
          BOT Chain

This prevents prompt injection from directly becoming a financial transaction.

---

# **25\. Database Schema**

Using PostgreSQL \+ Prisma.

## **User**

User  
├── id  
├── walletAddress  
├── createdAt  
└── updatedAt

## **Agent**

Agent  
├── id  
├── blockchainAgentId  
├── ownerId  
├── name  
├── walletAddress  
├── dailyLimit  
├── transactionLimit  
├── status  
├── createdAt  
└── updatedAt

## **Service**

Service  
├── id  
├── blockchainServiceId  
├── providerAddress  
├── name  
├── description  
├── category  
├── price  
├── endpoint  
├── active  
└── createdAt

## **Transaction**

Transaction  
├── id  
├── agentId  
├── serviceId  
├── txHash  
├── amount  
├── token  
├── status  
├── createdAt  
└── confirmedAt

## **AgentUsage**

AgentUsage  
├── id  
├── agentId  
├── date  
├── totalSpent  
└── transactionCount

---

# **26\. API Design**

## **Agents**

POST /agents  
GET /agents  
GET /agents/:id  
PATCH /agents/:id  
POST /agents/:id/pause  
POST /agents/:id/fund

## **Services**

GET /services  
GET /services/:id  
POST /services  
PATCH /services/:id

## **AI**

POST /agents/:id/chat

## **Payments**

POST /payments/quote  
POST /payments/execute  
GET /payments/:id

## **Transactions**

GET /transactions  
GET /transactions/:hash

---

# **27\. Frontend Pages**

/  
├── Landing page  
│  
├── /dashboard  
│  
├── /agents  
│  
├── /agents/new  
│  
├── /agents/:id  
│  
├── /agents/:id/chat  
│  
├── /services  
│  
├── /transactions  
│  
└── /settings

---

# **28\. Landing Page**

Hero:

> **Give AI Agents the Power to Transact.**

Subtitle:

> Programmable wallets and autonomous payments for AI agents on BOT Chain.

CTA:

\[ Launch AgentPay \]  
\[ View on GitHub \]

Then:

Create Agent  
      ↓  
Fund Agent  
      ↓  
Set Policy  
      ↓  
Agent Discovers Service  
      ↓  
Agent Pays  
      ↓  
BOT Chain Settlement

---

# **29\. Dashboard**

Show:

Total agents  
Total balance  
Total spending  
Transactions  
Active services

Example:

Agents              3  
Balance             $142.30  
Spent               $27.42  
Transactions        84

---

# **30\. Agent Page**

Must show:

Agent name  
Wallet address  
Balance  
Daily limit  
Transaction limit  
Daily usage  
Status  
Services  
Recent transactions

---

# **31\. Agent Chat**

This is the **hero feature**.

Interface:

┌─────────────────────────────────────────┐  
│ Research Agent                          │  
├─────────────────────────────────────────┤  
│                                         │  
│ You:                                    │  
│ What's the weather in Lagos?            │  
│                                         │  
│ Agent:                                  │  
│ I'll check a weather service.           │  
│                                         │  
│ 🔎 Searching services...                │  
│ ✓ Weather Agent found                   │  
│ 💰 Cost: $0.02                          │  
│ ✓ Policy approved                       │  
│ ⛓ Payment confirmed                     │  
│                                         │  
│ Lagos: 27°C                             │  
│ Humidity: 81%                           │  
│                                         │  
│ View transaction →                      │  
└─────────────────────────────────────────┘

---

# **32\. Service Marketplace**

Start with:

### **Weather Agent**

$0.02/request

### **Market Data Agent**

$0.05/request

### **Translation Agent**

$0.01/request

These can initially be services operated by our own backend.

The important part is that **payment is real**.

---

# **33\. Transaction Explorer**

Every transaction:

Agent  
Service  
Amount  
Token  
Status  
Timestamp  
TX Hash

Button:

> **View on BOT Chain Explorer**

---

# **34\. Error Handling**

Must handle:

### **Insufficient balance**

Your agent has insufficient funds.

### **Transaction limit**

Payment blocked.  
Requested: $5  
Limit: $2

### **Daily limit**

Daily spending limit reached.

### **Service unavailable**

Service temporarily unavailable.

### **Blockchain failure**

Transaction failed.  
No funds were deducted.

---

# **35\. Security Model**

This is extremely important for the judging/demo.

## **Principle**

> **AI proposes. Policy authorizes. Blockchain enforces.**

AI  
 ↓  
Intent  
 ↓  
Policy Engine  
 ↓  
Smart Contract  
 ↓  
BOT Chain

The AI cannot override:

* transaction limits  
* daily limits  
* approved providers  
* supported tokens  
* paused agents

---

# **36\. Testing Strategy**

## **Smart contracts**

Foundry tests:

✓ create agent  
✓ deposit USDT  
✓ payment succeeds  
✓ transaction limit enforced  
✓ daily limit enforced  
✓ insufficient balance  
✓ unauthorized caller  
✓ provider validation  
✓ pause agent  
✓ withdraw funds  
✓ reentrancy protection

Target:

> **High contract test coverage**

---

## **Backend**

Test:

Agent creation  
Policy validation  
Service discovery  
Payment execution  
Transaction tracking  
AI tool calls

---

## **Frontend**

Test:

Wallet connection  
Network detection  
Agent creation  
Deposit  
Dashboard  
Chat  
Transactions

---

# **37\. Deployment Architecture**

## **Frontend**

Deploy:

Vercel

## **Backend**

Deploy:

VPS / Render

## **Database**

PostgreSQL

## **Smart contracts**

BOT Chain Testnet  
        ↓  
BOT Chain Mainnet

---

# **38\. Environment Variables**

Frontend:

NEXT\_PUBLIC\_BOT\_CHAIN\_RPC=  
NEXT\_PUBLIC\_BOT\_CHAIN\_ID=677  
NEXT\_PUBLIC\_BOT\_EXPLORER=  
NEXT\_PUBLIC\_USDT\_ADDRESS=  
NEXT\_PUBLIC\_AGENT\_REGISTRY=  
NEXT\_PUBLIC\_SERVICE\_REGISTRY=  
NEXT\_PUBLIC\_PAYMENT\_ROUTER=

Backend:

DATABASE\_URL=  
BOT\_RPC\_URL=  
BOT\_PRIVATE\_KEY=  
USDT\_ADDRESS=

AGENT\_REGISTRY\_ADDRESS=  
AGENT\_WALLET\_ADDRESS=  
SERVICE\_REGISTRY\_ADDRESS=  
PAYMENT\_ROUTER\_ADDRESS=

AI\_API\_KEY=  
AI\_MODEL=

**Never expose private keys to the frontend.**

---

# **39\. Development Phases**

Now the actual execution plan.

---

## **PHASE 0 — Project Setup**

### **Objective**

Create the development environment.

### **Tasks**

* Create GitHub repository  
* Create monorepo  
* Initialize Next.js  
* Initialize NestJS  
* Initialize Foundry  
* Configure TypeScript  
* Configure ESLint  
* Configure Prettier  
* Configure environment files  
* Setup PostgreSQL  
* Setup Git workflow

### **Deliverable**

Running:

npm run dev

starts the frontend/backend.

---

# **PHASE 1 — BOT Chain Integration**

### **Objective**

Connect everything to BOT Chain.

### **Tasks**

* Add BOT Chain network  
* Configure viem  
* Configure wagmi  
* Connect MetaMask  
* Detect incorrect network  
* Add network switch  
* Configure BOT RPC  
* Configure BOT explorer  
* Configure USDT contract

### **Deliverable**

User can:

Connect wallet  
      ↓  
Switch to BOT Chain  
      ↓  
See BOT balance  
      ↓  
See USDT balance

---

# **PHASE 2 — Smart Contracts**

### **Objective**

Build the financial infrastructure.

### **Tasks**

* AgentRegistry  
* AgentWallet  
* ServiceRegistry  
* PaymentRouter  
* OpenZeppelin integration  
* Events  
* Access control  
* Spending limits  
* Pause mechanism  
* Tests

### **Deliverable**

Fully tested contracts running on BOT testnet.

---

# **PHASE 3 — Contract Deployment**

### **Objective**

Deploy the protocol.

### **Tasks**

* Deploy testnet contracts  
* Verify contracts  
* Record addresses  
* Update environment  
* Test USDT approval  
* Test deposits  
* Test withdrawals  
* Test payment  
* Test limits

### **Deliverable**

Real BOT Chain transactions.

---

# **PHASE 4 — Backend**

### **Objective**

Build the API.

### **Tasks**

* Prisma  
* PostgreSQL  
* Database migrations  
* Agent module  
* Service module  
* Payment module  
* Transaction module  
* Blockchain service  
* Event listener

### **Deliverable**

API capable of managing agents and blockchain transactions.

---

# **PHASE 5 — AI Agent**

### **Objective**

Give agents intelligence.

### **Tasks**

* LLM integration  
* Tool calling  
* Service discovery  
* Balance tool  
* Policy tool  
* Payment tool  
* Transaction status tool  
* Service result tool

### **Deliverable**

User can ask:

> "Get weather in Lagos."

Agent can autonomously purchase the service.

---

# **PHASE 6 — Frontend**

### **Objective**

Build the complete user interface.

### **Tasks**

* Landing page  
* Dashboard  
* Agent creation  
* Agent details  
* Agent funding  
* Policy configuration  
* Chat  
* Service marketplace  
* Transactions  
* Explorer links

### **Deliverable**

Complete usable application.

---

# **PHASE 7 — Real Services**

### **Objective**

Demonstrate the economy.

Implement:

Weather  
Market Data  
Translation

Each service has:

provider  
price  
endpoint  
description

### **Deliverable**

Agent discovers and purchases real services.

---

# **PHASE 8 — End-to-End Integration**

Run the complete scenario:

Connect wallet  
       ↓  
Create agent  
       ↓  
Fund agent  
       ↓  
Set policy  
       ↓  
Ask question  
       ↓  
AI identifies service  
       ↓  
Service discovered  
       ↓  
Policy checked  
       ↓  
Payment executed  
       ↓  
BOT Chain confirms  
       ↓  
Service executes  
       ↓  
Result returned

### **Deliverable**

**The complete AgentPay demo works from beginning to end.**

---

# **PHASE 9 — Security & Hardening**

Before mainnet:

* Contract tests  
* Access control review  
* Reentrancy review  
* Integer/overflow review  
* Token validation  
* Provider validation  
* Private-key security  
* Prompt injection protection  
* Rate limiting  
* API authentication  
* Input validation  
* Transaction replay protection  
* Error handling

---

# **PHASE 10 — Mainnet**

Only after the MVP is stable.

### **Tasks**

* Deploy contracts to BOT mainnet  
* Verify contracts  
* Update frontend  
* Update backend  
* Test with small amounts  
* Verify explorer transactions  
* Freeze contract versions

Mainnet:

Chain ID: 677  
RPC: https://rpc.botchain.ai

---

# **PHASE 11 — UI/UX Polish**

This is where we make it look like a serious startup.

Add:

* smooth transitions  
* transaction animations  
* skeleton loaders  
* toast notifications  
* wallet states  
* transaction status  
* responsive design  
* empty states  
* error states  
* copy address buttons  
* explorer links

Avoid unnecessary flashy animations.

The product should feel like:

> **Stripe × AI Agent × Web3**

rather than a crypto casino.

---

# **PHASE 12 — Hackathon Submission**

Prepare:

### **README**

Problem  
Solution  
Architecture  
How it works  
BOT Chain integration  
Smart contracts  
AI architecture  
Security  
Installation  
Demo

### **Demo video**

Target:

**2–3 minutes**

Structure:

0:00 Problem

0:20 Create Agent

0:40 Fund Agent

1:00 Configure limits

1:20 Ask agent question

1:40 Agent discovers service

2:00 Payment occurs

2:15 BOT Chain transaction

2:30 Result

2:45 Why AgentPay

---

# **40\. The Hero Demo**

This should be rehearsed.

## **Scene 1**

You:

> "AI agents can reason, but they currently don't have safe financial autonomy."

## **Scene 2**

Create:

**Research Agent**

Fund:

**50 USDT**

Set:

Transaction limit: $2  
Daily limit: $10

## **Scene 3**

Ask:

> **"What's the weather in Lagos?"**

## **Scene 4**

Agent:

Weather service found  
Price: $0.02

Policy check:  
✓ Allowed

Payment:  
$0.02 USDT

## **Scene 5**

Show:

> **BOT Chain Transaction Confirmed**

Click explorer.

## **Scene 6**

Agent returns:

> **Lagos: 27°C, 81% humidity...**

## **Scene 7**

Try:

> **"Purchase this $5 service."**

Agent:

Payment blocked.

Reason:  
$5 exceeds the agent's  
$2 transaction limit.

### **That second transaction is extremely important.**

It demonstrates:

**AI autonomy \+ blockchain-enforced safety.**

---

# **41\. Definition of Done**

AgentPay is considered complete when all of these work:

### **Blockchain**

* BOT Chain connected  
* Contracts deployed  
* Contracts verified  
* USDT payments work  
* Spending limits work  
* Transactions visible on explorer

### **AI**

* Agent understands requests  
* Agent discovers services  
* Agent checks policy  
* Agent requests payment  
* Agent receives service result

### **Frontend**

* Wallet connection  
* Agent creation  
* Funding  
* Policy configuration  
* Chat  
* Transactions  
* Service marketplace

### **Backend**

* API works  
* Database works  
* Blockchain listener works  
* AI tools work  
* Payment orchestration works

### **Security**

* AI cannot bypass policy  
* Private keys protected  
* Contract tests pass  
* Payment limits enforced on-chain

### **Submission**

* README  
* Architecture diagram  
* Demo video  
* Live deployment  
* GitHub repository  
* Contract addresses  
* Explorer links  
* Hackathon submission

---

# **42\. Stretch Goals**

Only after MVP is complete.

## **Priority 1**

### **ERC-4337**

Use BOT Chain's bundler to create smart accounts.

---

## **Priority 2**

### **Agent reputation**

Weather Agent  
★★★★☆ 4.8

1,240 successful transactions

---

## **Priority 3**

### **Agent-to-agent payments**

Research Agent  
       ↓  
Data Agent  
       ↓  
Weather Agent

---

## **Priority 4**

### **Multi-agent workflows**

Research Agent  
      ↓  
Data Agent  
      ↓  
Analysis Agent  
      ↓  
Report Agent

Each agent can pay the next.

That becomes extremely powerful.

---

# **43\. Future Vision**

If the hackathon goes well, AgentPay can evolve into:

                AGENTPAY  
                     │  
       ┌─────────────┼─────────────┐  
       │             │             │  
    Wallets       Services      Identity  
       │             │             │  
       └─────────────┼─────────────┘  
                     │  
               Agent Economy  
                     │  
              ┌──────┼──────┐  
              │      │      │  
             AI    DePIN   APIs  
              │      │      │  
              └──────┼──────┘  
                     │  
                 BOT Chain

Eventually:

> **Agents become economic actors.**

They can earn.

They can spend.

They can negotiate.

They can purchase services.

They can pay other agents.

And BOT Chain becomes the settlement layer.

---

# **44\. Our Build Rule**

One rule I want us to follow throughout the build:

> **Don't build features because they're cool. Build features that strengthen the core demo.**

Every feature should answer:

**Does this make autonomous agent payments more useful, safer, or more believable?**

If not:

**Cut it.**

---

# **45\. Immediate Build Order**

We should **not jump into the frontend yet.**

Our actual implementation sequence should be:

                   NOW  
                     │  
                     ▼  
             ┌──────────────┐  
             │ PHASE 0      │  
             │ Project Setup│  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 1      │  
             │ BOT Chain    │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 2      │  
             │ Solidity     │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 3      │  
             │ Testnet      │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 4      │  
             │ NestJS       │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 5      │  
             │ AI Agent     │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 6      │  
             │ Next.js      │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 7      │  
             │ Services     │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 8      │  
             │ E2E Demo     │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 9      │  
             │ Security     │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 10     │  
             │ Mainnet      │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 11     │  
             │ Polish       │  
             └──────┬───────┘  
                    ▼  
             ┌──────────────┐  
             │ PHASE 12     │  
             │ SUBMIT 🚀    │  
             └──────────────┘

**Our first implementation task should therefore be Phase 0 \+ Phase 1: create the monorepo and get a wallet connected to BOT Chain testnet.**

Once that foundation is working, we move directly into **the Solidity contracts**, because the contract/security model is the most important technical part of AgentPay.

Yes — **we absolutely can run the AgentPay backend with Next.js**, and for this hackathon I actually think that is the better approach.

And yes, **Vercel can deploy Node.js backend code**, but there's an important distinction: Vercel primarily runs your backend as **serverless functions**, not as a traditional always-running Node.js/NestJS server.

## **My recommendation for AgentPay**

Instead of:

Next.js  
   ↓  
NestJS  
   ↓  
PostgreSQL

I'd simplify it to:

                AGENTPAY  
                    │  
        ┌───────────┴───────────┐  
        │                       │  
     Next.js                PostgreSQL  
        │  
        ├── UI  
        ├── API Routes  
        ├── Server Actions  
        ├── AI Agent  
        ├── Blockchain Logic  
        └── Authentication  
                │  
                ▼  
           BOT Chain

So we'd have **one application/repository** instead of separate frontend and backend applications.

---

# **Why Next.js is enough**

Next.js isn't just a frontend framework.

You can have:

app/  
├── page.tsx  
├── dashboard/  
├── agents/  
└── api/  
    ├── agents/  
    ├── payments/  
    ├── services/  
    └── chat/

For example:

/api/agents  
/api/agents/\[id\]  
/api/agents/\[id\]/chat  
/api/payments  
/api/services  
/api/transactions

These are backend endpoints.

Your frontend can call:

const response \= await fetch("/api/agents");

And the API can execute server-side code.

---

# **And this is especially good for AgentPay**

Remember our architecture:

User  
 │  
 ▼  
Next.js  
 │  
 ├── Dashboard  
 ├── Agent UI  
 ├── Chat  
 │  
 ├── API  
 │    ├── Agent orchestration  
 │    ├── AI tools  
 │    ├── Payments  
 │    └── Service discovery  
 │  
 └── Blockchain  
       │  
       ▼  
   BOT Chain

We don't actually need NestJS for the MVP.

In fact, **adding NestJS would give us another application to deploy, another API layer to maintain, another environment to configure, and another place for bugs.**

For a 13-day hackathon, that's unnecessary complexity.

---

# **What Vercel can handle**

Vercel is very good for:

### **Frontend**

Next.js  
React  
Tailwind

### **Backend/API**

/api/\*

### **Server-side code**

AI API calls  
Database queries  
Blockchain RPC calls

### **Server Actions**

Useful for operations such as:

createAgent()  
updatePolicy()  
registerService()

### **Cron jobs**

Potentially useful later for things like:

daily spending reset  
transaction reconciliation  
service health checks

---

# **The important limitation**

This is where we need to design AgentPay correctly.

A Vercel function is **not a permanent Node.js process**.

So don't build something that requires:

while (true) {  
   listenForBlockchainEvents();  
}

or:

WebSocket server  
that stays alive forever

on Vercel.

That's where a traditional VPS/container becomes more appropriate.

---

# **What about blockchain event listeners?**

This is one area where I would change the architecture slightly.

Instead of having:

Vercel  
  ↓  
permanent blockchain listener  
  ↓  
PostgreSQL

we can initially do:

User  
 ↓  
Next.js API  
 ↓  
BOT Chain RPC  
 ↓  
Transaction  
 ↓  
Store TX hash

Then when we need confirmation:

GET /api/transactions/:hash  
        ↓  
BOT Chain RPC  
        ↓  
receipt  
        ↓  
confirmed

That's perfectly adequate for our hackathon MVP.

---

# **AI agent on Next.js?**

Yes.

This is actually a **great fit**.

We can have:

/api/agents/\[id\]/chat

The request:

{  
  "message": "What's the weather in Lagos?"  
}

goes to the server.

Then:

LLM  
 ↓  
Tool call  
 ↓  
searchServices()  
 ↓  
checkPolicy()  
 ↓  
requestPayment()  
 ↓  
BOT Chain  
 ↓  
service  
 ↓  
LLM  
 ↓  
response

All within the Next.js application.

---

# **Database**

We can use:

### **PostgreSQL \+ Prisma**

For example:

Next.js  
   │  
   ▼  
Prisma  
   │  
   ▼  
PostgreSQL

For the hackathon, something like **Neon**, Supabase PostgreSQL, or another managed PostgreSQL provider would work well.

No need to maintain PostgreSQL ourselves.

---

# **Blockchain**

We can use:

viem  
wagmi

### **Browser**

`wagmi` \+ `viem`

For:

connect wallet  
read balance  
switch network  
sign transactions

### **Server**

`viem`

For:

read contract  
submit authorized transactions  
wait for receipts  
query BOT Chain

---

# **One important security issue**

Remember what I said earlier:

> **The AI must not have unrestricted access to a private key.**

If our backend needs to submit transactions, we need to design that carefully.

For the hackathon MVP, we could have a dedicated **AgentPay protocol/operator wallet** that interacts with the smart contracts, while the smart contracts enforce the agent's limits.

But I would prefer the stronger architecture:

                AI  
                  │  
                  ▼  
             Tool Request  
                  │  
                  ▼  
            Policy Engine  
                  │  
                  ▼  
         AgentWallet Contract  
                  │  
                  ▼  
              BOT Chain

The backend doesn't get to arbitrarily spend the user's funds.

The contract remains the final authority.

---

# **What I would change in our PRD**

Instead of:

Frontend  
Next.js

Backend  
NestJS

Database  
PostgreSQL

I'd change it to:

## **Application**

Next.js  
TypeScript  
Tailwind  
shadcn/ui

## **Backend**

Next.js App Router  
Route Handlers  
Server Actions

## **Database**

PostgreSQL  
Prisma

## **Blockchain**

viem  
wagmi  
Solidity  
Foundry  
OpenZeppelin

## **AI**

LLM \+ tool calling

## **Deployment**

Vercel  
    \+  
Managed PostgreSQL  
    \+  
BOT Chain

That is **much cleaner**.

---

# **Revised AgentPay architecture**

                        USER  
                           │  
                           ▼  
                  ┌─────────────────┐  
                  │     Next.js     │  
                  │                 │  
                  │   Dashboard     │  
                  │   Agent UI      │  
                  │   Chat          │  
                  └────────┬────────┘  
                           │  
                           ▼  
                  ┌─────────────────┐  
                  │ Next.js Server  │  
                  │                 │  
                  │ API Routes      │  
                  │ Server Actions  │  
                  │ AI Orchestrator │  
                  │ Policy Engine   │  
                  │ Blockchain SDK  │  
                  └───────┬─────────┘  
                          │  
             ┌────────────┼─────────────┐  
             │            │             │  
             ▼            ▼             ▼  
        PostgreSQL       LLM        BOT Chain  
          Prisma                       │  
                                       │  
                           ┌───────────┴───────────┐  
                           │                       │  
                    AgentRegistry           AgentWallet  
                           │                       │  
                           └───────────┬───────────┘  
                                       │  
                                PaymentRouter  
                                       │  
                                       ▼  
                                 Service Provider

This is the architecture **I'd now recommend**.

---

# **When would we add a separate Node backend?**

Only if AgentPay grows beyond the hackathon.

For example, if we eventually need:

* persistent WebSocket connections  
* blockchain event indexing  
* thousands of agents  
* background workers  
* queues  
* long-running AI jobs  
* Redis workers  
* Kafka  
* scheduled autonomous tasks  
* high-frequency payment processing

Then we'd introduce:

Next.js  
    │  
    ▼  
API Gateway  
    │  
    ▼  
Agent Orchestrator  
    │  
    ├── Workers  
    ├── Queue  
    ├── Blockchain Indexer  
    └── AI Services

That could run on a VPS, Docker, Railway, Render, AWS, etc.

But **we don't need that complexity right now.**

---

# **So yes — let's simplify the build**

Our stack becomes:

| Component | Technology |
| ----- | ----- |
| Frontend | Next.js |
| Backend | Next.js Route Handlers / Server Actions |
| Language | TypeScript |
| Styling | Tailwind \+ shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Blockchain | viem |
| Wallet | wagmi |
| Contracts | Solidity |
| Contract tooling | Foundry |
| Security | OpenZeppelin |
| AI | LLM \+ tool calling |
| Frontend/API deployment | Vercel |
| Database hosting | Managed PostgreSQL |
| Blockchain | BOT Chain |

**One repo. One deployment. One codebase.**

For a hackathon with a **13-day build window**, I strongly prefer this over Next.js \+ NestJS.

And since you already work with Next.js, TypeScript, PostgreSQL and Web3, it'll let us spend our time on the **actual differentiator — AgentPay's autonomous payment/security system — rather than infrastructure.**

