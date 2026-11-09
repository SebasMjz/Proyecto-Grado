require('@nomicfoundation/hardhat-ethers')

const networks = {}
if (process.env.SEPOLIA_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  networks.sepolia = { url: process.env.SEPOLIA_RPC_URL, accounts: [process.env.DEPLOYER_PRIVATE_KEY], chainId: 11155111 }
}
if (process.env.MAINNET_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  networks.mainnet = { url: process.env.MAINNET_RPC_URL, accounts: [process.env.DEPLOYER_PRIVATE_KEY], chainId: 1 }
}

module.exports = {
  solidity: { version: '0.8.26', settings: { evmVersion: 'cancun' } },
  networks,
}
