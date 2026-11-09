// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Interfaz Oficial ERC-5192 (Minimal Soulbound Tokens)
interface IERC5192 {
    /// @notice Se emite cuando se bloquea la transferibilidad del token.
    event Locked(uint256 tokenId);

    /// @notice Se emite si se desbloquea la transferibilidad del token.
    event Unlocked(uint256 tokenId);

    /// @notice Retorna el estado de bloqueo del token.
    function locked(uint256 tokenId) external view returns (bool);
}

/// @title Contrato de Certificación Académica Intransferible (Soulbound Token)
/// @author Sebastian Erick Mendieta Jimenez
/// @notice DApp para el control y emisión de certificados académicos inmutables
contract AcademicSBT is ERC721URIStorage, Ownable, IERC5192 {
    uint256 private _nextTokenId;

    // Mapeo para registrar el estado de inmutabilidad/bloqueo de cada certificado
    mapping(uint256 => bool) private _isLocked;

    // Estructura de auditoría interna on-chain
    struct CertificateRecord {
        string eventCode;
        uint256 issueTimestamp;
    }

    mapping(uint256 => CertificateRecord) public certificateDetails;

    // Errores personalizados para optimización de consumo de gas
    error ErrTokenIsSoulbound();
    error ErrTokenDoesNotExist();

    constructor(address initialOwner) 
        ERC721("Univalle Academic Credential", "UAC-SBT") 
        Ownable(initialOwner) 
    {
        _nextTokenId = 1;
    }

    /// @notice Emite un certificado digital atado a la dirección del participante
    /// @param recipient Dirección pública (billetera) del estudiante
    /// @param tokenURI_ Enlace hacia los metadatos inmutables en IPFS (ipfs://CID...)
    /// @param eventCode Código del evento o seminario académico
    /// @return tokenId Identificador único del certificado emitido
    function mintCertificate(
        address recipient,
        string calldata tokenURI_,
        string calldata eventCode
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        // Acuñación y asignación del URI de IPFS
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        // Bloqueo permanente del token (Propiedad Soulbound ERC-5192)
        _isLocked[tokenId] = true;

        // Registro de auditoría
        certificateDetails[tokenId] = CertificateRecord({
            eventCode: eventCode,
            issueTimestamp: block.timestamp
        });

        // Emisión del evento reglamentario del estándar ERC-5192
        emit Locked(tokenId);

        return tokenId;
    }

    /// @notice Consulta si un certificado está ligado permanentemente a la identidad
    function locked(uint256 tokenId) external view override returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert ErrTokenDoesNotExist();
        return _isLocked[tokenId];
    }

    /// @dev Sobrescritura de hooks de transferencia para impedir la cesión o venta del título
    function _update(
        address to, 
        uint256 tokenId, 
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Permite la creación inicial (from == 0), pero bloquea transferencias posteriores
        if (from != address(0) && _isLocked[tokenId]) {
            revert ErrTokenIsSoulbound();
        }

        return super._update(to, tokenId, auth);
    }
}