// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AstrayaCertificateBase} from "./AstrayaCertificateBase.sol";

/// @title Astraya Certificate 721
/// @notice On-chain certificate for a physical Astraya crystal piece. One
///         NFT = one piece. Holding the token means you are the "of-record"
///         owner of the real-world crystal bound to its NTAG424 chip. The
///         tokenURI returns the same JSON payload that was generated in
///         Phase 1 when the order was fulfilled.
contract AstrayaCertificate721 is AstrayaCertificateBase {
    constructor(
        address defaultAdmin,
        address minter,
        address royaltyReceiver,
        uint96 royaltyFeeBps
    )
        AstrayaCertificateBase(
            "Astraya Certificate",
            "ASTRA-CERT",
            defaultAdmin,
            minter,
            royaltyReceiver,
            royaltyFeeBps
        )
    {}
}
