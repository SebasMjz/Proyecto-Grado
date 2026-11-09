const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  const contract = await ethers.deployContract('AcademicSBT', [deployer.address])
  await contract.waitForDeployment()
  console.log(`AcademicSBT deployed at ${await contract.getAddress()} by ${deployer.address}`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
