// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Astraya Certificate (base)
/// @notice Shared logic for the Astraya product certificate and divination
///         certificate ERC-721 contracts. Each token is uniquely keyed by the
///         off-chain `integrityHash` (sha256 of the canonical JSON payload
///         that Phase 1 stores in the `Certificate` table). Minting the same
///         integrityHash twice is rejected on-chain so the off-chain database
///         and the on-chain registry stay consistent.
abstract contract AstrayaCertificateBase is ERC721URIStorage, ERC2981, AccessControl {
    /// @dev Role granted to the platform's minting signer (the apps/web
    ///      backend). Holders can call {mint}; they cannot update royalties or
    ///      grant new roles.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    /// @dev integrityHash (sha256 of canonical cert payload) → tokenId.
    ///      Reverse lookup for /verify flows.
    mapping(bytes32 integrityHash => uint256 tokenId) private _tokenIdByHash;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 indexed integrityHash,
        string uri
    );

    error IntegrityHashAlreadyMinted(bytes32 integrityHash, uint256 tokenId);
    error ZeroIntegrityHash();
    error ZeroRecipient();

    constructor(
        string memory name_,
        string memory symbol_,
        address defaultAdmin,
        address minter,
        address royaltyReceiver,
        uint96 royaltyFeeBps
    ) ERC721(name_, symbol_) {
        require(defaultAdmin != address(0), "AstrayaCert: admin=0");
        require(minter != address(0), "AstrayaCert: minter=0");

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);

        if (royaltyReceiver != address(0) && royaltyFeeBps > 0) {
            _setDefaultRoyalty(royaltyReceiver, royaltyFeeBps);
        }

        _nextTokenId = 1;
    }

    /// @notice Mint a certificate NFT. Only callable by MINTER_ROLE.
    /// @param to             Recipient wallet — typically the buyer / asker.
    /// @param integrityHash  sha256 digest of the canonical JSON payload the
    ///                       backend already generated in Phase 1.
    /// @param uri            ERC-721 tokenURI. Usually "https://astraya.io/api/cert/<code>"
    ///                       or an IPFS CID once we move metadata off our box.
    /// @return tokenId       Freshly minted token id (monotonic, starting at 1).
    function mint(
        address to,
        bytes32 integrityHash,
        string calldata uri
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroRecipient();
        if (integrityHash == bytes32(0)) revert ZeroIntegrityHash();

        uint256 existing = _tokenIdByHash[integrityHash];
        if (existing != 0) revert IntegrityHashAlreadyMinted(integrityHash, existing);

        tokenId = _nextTokenId++;
        _tokenIdByHash[integrityHash] = tokenId;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit CertificateMinted(tokenId, to, integrityHash, uri);
    }

    /// @notice Returns the tokenId for a given cert integrityHash, or 0 when
    ///         the hash has not been minted yet.
    function tokenIdByHash(bytes32 integrityHash) external view returns (uint256) {
        return _tokenIdByHash[integrityHash];
    }

    /// @notice Next token id that would be assigned by {mint}. Useful for
    ///         off-chain preflight / testing.
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    // ------------------------------------------------------------------
    // Royalty admin
    // ------------------------------------------------------------------

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _deleteDefaultRoyalty();
    }

    // ------------------------------------------------------------------
    // ERC-165 plumbing (required by Solidity when multiple parents define
    // supportsInterface).
    // ------------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
