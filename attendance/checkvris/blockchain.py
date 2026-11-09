"""On-chain issuance and verification for the AcademicSBT contract."""

from urllib.parse import urlparse

from django.conf import settings
from rest_framework.exceptions import ValidationError
from web3 import Web3


ABI = [
    {'type': 'function', 'name': 'owner', 'inputs': [], 'outputs': [{'type': 'address'}], 'stateMutability': 'view'},
    {'type': 'function', 'name': 'certificateToken', 'inputs': [{'type': 'bytes16'}], 'outputs': [{'type': 'uint256'}], 'stateMutability': 'view'},
    {'type': 'function', 'name': 'certificateHash', 'inputs': [{'type': 'uint256'}], 'outputs': [{'type': 'bytes32'}], 'stateMutability': 'view'},
    {'type': 'function', 'name': 'ownerOf', 'inputs': [{'type': 'uint256'}], 'outputs': [{'type': 'address'}], 'stateMutability': 'view'},
    {'type': 'function', 'name': 'locked', 'inputs': [{'type': 'uint256'}], 'outputs': [{'type': 'bool'}], 'stateMutability': 'view'},
    {'type': 'function', 'name': 'mintCertificate', 'inputs': [
        {'name': 'recipient', 'type': 'address'}, {'name': 'tokenURI_', 'type': 'string'},
        {'name': 'eventCode', 'type': 'string'}, {'name': 'certificateId', 'type': 'bytes16'},
        {'name': 'contentHash', 'type': 'bytes32'},
    ], 'outputs': [{'type': 'uint256'}], 'stateMutability': 'nonpayable'},
]


def contract_client():
    if not all((settings.BLOCKCHAIN_RPC_URL, settings.BLOCKCHAIN_CONTRACT_ADDRESS)):
        raise ValidationError('Sepolia aún no está configurada en el servidor.')
    web3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL, request_kwargs={'timeout': 15}))
    if web3.eth.chain_id != settings.BLOCKCHAIN_CHAIN_ID:
        raise ValidationError('La red RPC no coincide con BLOCKCHAIN_CHAIN_ID.')
    if not Web3.is_address(settings.BLOCKCHAIN_CONTRACT_ADDRESS):
        raise ValidationError('BLOCKCHAIN_CONTRACT_ADDRESS no es válida.')
    address = Web3.to_checksum_address(settings.BLOCKCHAIN_CONTRACT_ADDRESS)
    if not web3.eth.get_code(address):
        raise ValidationError('El contrato no está desplegado en esta red.')
    return web3, web3.eth.contract(address=address, abi=ABI)


def submit_certificate(certificate, recipient):
    metadata_host = urlparse(settings.BACKEND_URL)
    if metadata_host.scheme != 'https' or metadata_host.hostname in ('localhost', '127.0.0.1'):
        raise ValidationError('Configura BACKEND_URL con una dirección HTTPS pública antes de acuñar certificados.')
    if not settings.BLOCKCHAIN_PRIVATE_KEY:
        raise ValidationError('La cuenta emisora no está configurada en el servidor.')
    web3, contract = contract_client()
    account = web3.eth.account.from_key(settings.BLOCKCHAIN_PRIVATE_KEY)
    if contract.functions.owner().call() != account.address:
        raise ValidationError('La cuenta emisora no es propietaria del contrato.')
    if contract.functions.certificateToken(certificate.id.bytes).call():
        raise ValidationError('Este certificado ya existe en blockchain; sincroniza su estado antes de reintentar.')
    recipient = Web3.to_checksum_address(recipient)
    metadata_url = f"{settings.BACKEND_URL.rstrip('/')}/attendance/certificates/{certificate.id}/metadata/"
    function = contract.functions.mintCertificate(
        recipient, metadata_url, str(certificate.registration.event_id),
        certificate.id.bytes, bytes.fromhex(certificate.content_hash),
    )
    tx = function.build_transaction({
        'from': account.address,
        'chainId': settings.BLOCKCHAIN_CHAIN_ID,
        'nonce': web3.eth.get_transaction_count(account.address, 'pending'),
        'gasPrice': web3.eth.gas_price,
    })
    signed = account.sign_transaction(tx)
    certificate.recipient_wallet = recipient
    certificate.chain_id = settings.BLOCKCHAIN_CHAIN_ID
    certificate.contract_address = contract.address
    certificate.transaction_hash = signed.hash.hex()
    certificate.blockchain_status = 'pending_chain'
    certificate.save(update_fields=[
        'recipient_wallet', 'chain_id', 'contract_address', 'transaction_hash', 'blockchain_status',
    ])
    web3.eth.send_raw_transaction(signed.raw_transaction)
    return certificate


def sync_certificate(certificate):
    web3, contract = contract_client()
    if certificate.chain_id != settings.BLOCKCHAIN_CHAIN_ID or certificate.contract_address.lower() != contract.address.lower():
        raise ValidationError('La red o el contrato no corresponden a este certificado.')
    receipt = web3.eth.get_transaction_receipt(certificate.transaction_hash)
    if receipt is None:
        return certificate
    if receipt['status'] != 1:
        certificate.blockchain_status = 'failed'
    else:
        token_id = contract.functions.certificateToken(certificate.id.bytes).call()
        if not token_id or not verify_certificate(certificate, web3, contract, token_id):
            raise ValidationError('La transacción no coincide con el certificado emitido.')
        certificate.token_id = token_id
        certificate.blockchain_status = 'confirmed'
    certificate.save(update_fields=['token_id', 'blockchain_status'])
    return certificate


def verify_certificate(certificate, web3=None, contract=None, token_id=None):
    if not certificate.content_hash or not certificate.recipient_wallet:
        return False
    if not web3 or not contract:
        web3, contract = contract_client()
    token_id = token_id or certificate.token_id
    return bool(token_id and
                contract.functions.certificateToken(certificate.id.bytes).call() == token_id and
                contract.functions.certificateHash(token_id).call() == bytes.fromhex(certificate.content_hash) and
                contract.functions.ownerOf(token_id).call().lower() == certificate.recipient_wallet.lower() and
                contract.functions.locked(token_id).call())
