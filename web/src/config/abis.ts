/**
 * ABI fragments matching the deployed Avara contracts.
 * All signatures verified against /contracts/src/*.sol
 */

export const AGENT_REGISTRY_ABI = [
  // createAgent(name, dailyLimit, transactionLimit) → agentId
  {
    name: 'createAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'dailyLimit', type: 'uint256' },
      { name: 'transactionLimit', type: 'uint256' },
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  // getAgent(agentId) → Agent struct
  {
    name: 'getAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'wallet', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'dailyLimit', type: 'uint256' },
          { name: 'transactionLimit', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
  // getAgentWallet(agentId) → address
  {
    name: 'getAgentWallet',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  // getAgentsByOwner(owner) → uint256[]
  {
    name: 'getAgentsByOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  // updatePolicy(agentId, dailyLimit, transactionLimit)
  {
    name: 'updatePolicy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'dailyLimit', type: 'uint256' },
      { name: 'transactionLimit', type: 'uint256' },
    ],
    outputs: [],
  },
  // pauseAgent(agentId)
  {
    name: 'pauseAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  // activateAgent(agentId)
  {
    name: 'activateAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  // events
  {
    name: 'AgentCreated',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'wallet', type: 'address', indexed: false },
      { name: 'name', type: 'string', indexed: false },
    ],
  },
  {
    name: 'AgentPolicyUpdated',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'dailyLimit', type: 'uint256', indexed: false },
      { name: 'transactionLimit', type: 'uint256', indexed: false },
    ],
  },
] as const

export const AGENT_WALLET_ABI = [
  // deposit(token, amount) — caller must approve first
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // withdraw(token, amount)
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // getBalance(token) → uint256
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // getRemainingDailyLimit() → uint256
  {
    name: 'getRemainingDailyLimit',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // executePayment(serviceId, provider, token, amount) — only router/registry
  {
    name: 'executePayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'serviceId', type: 'uint256' },
      { name: 'provider', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // setLimits(dailyLimit, transactionLimit)
  {
    name: 'setLimits',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dailyLimit', type: 'uint256' },
      { name: '_transactionLimit', type: 'uint256' },
    ],
    outputs: [],
  },
  // state readers
  {
    name: 'dailyLimit',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transactionLimit',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'spentToday',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // events
  {
    name: 'Deposited',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PaymentExecuted',
    type: 'event',
    inputs: [
      { name: 'serviceId', type: 'uint256', indexed: true },
      { name: 'provider', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

export const PAYMENT_ROUTER_ABI = [
  // routePayment(agentId, serviceId, amount) — only authorized operators
  {
    name: 'routePayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'serviceId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // addOperator(operator)
  {
    name: 'addOperator',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [],
  },
  // authorizedOperators(address) → bool
  {
    name: 'authorizedOperators',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // events
  {
    name: 'PaymentExecuted',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'serviceId', type: 'uint256', indexed: true },
      { name: 'provider', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

export const SERVICE_REGISTRY_ABI = [
  {
    name: 'registerService',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'metadataURI', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [{ name: 'serviceId', type: 'uint256' }],
  },
  {
    name: 'getService',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'serviceId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'provider', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'metadataURI', type: 'string' },
          { name: 'price', type: 'uint256' },
          { name: 'paymentToken', type: 'address' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'isServiceActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'serviceId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'totalServices',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const
