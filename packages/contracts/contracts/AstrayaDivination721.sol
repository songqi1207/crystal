// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AstrayaCertificateBase} from "./AstrayaCertificateBase.sol";

/// @title Astraya Divination 721
/// @notice On-chain certificate for a master consultation / divination
///         reading. Separate contract from the product certificate so the
///         token namespaces stay disjoint and marketplaces can classify
///         them independently.
contract AstrayaDivination721 is AstrayaCertificateBase {
    constructor(
        address defaultAdmin,
        address minter,
        address royaltyReceiver,
        uint96 royaltyFeeBps
    )
        AstrayaCertificateBase(
            "Astraya Divination",
            "ASTRA-DIV",
            defaultAdmin,
            minter,
            royaltyReceiver,
            royaltyFeeBps
        )
    {}
}
