const assert = require('node:assert/strict')
const { ethers } = require('hardhat')

describe('AcademicSBT', function () {
  it('mints once per certificate and never transfers', async function () {
    const [issuer, recipient, other] = await ethers.getSigners()
    const contract = await ethers.deployContract('AcademicSBT', [issuer.address])
    const certificateId = '0x11111111111111111111111111111111'
    const digest = '0x' + 'ab'.repeat(32)
    await contract.mintCertificate(recipient.address, 'https://example.org/metadata', 'evento-1', certificateId, digest)
    const tokenId = await contract.certificateToken(certificateId)
    assert.equal(await contract.ownerOf(tokenId), recipient.address)
    assert.equal(await contract.locked(tokenId), true)
    assert.equal(await contract.certificateHash(tokenId), digest)
    await assert.rejects(contract.mintCertificate(recipient.address, '', 'evento-1', certificateId, digest))
    await assert.rejects(contract.connect(recipient).transferFrom(recipient.address, other.address, tokenId))
  })
})
