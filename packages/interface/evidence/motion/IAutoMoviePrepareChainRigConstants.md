# src/motion/IAutoMoviePrepareChainRigConstants.ts#IAutoMoviePrepareChainRigConstants

## @evidence contracts/development/common.md#meaningful-documentation

States which fixed chain-fit readers a prepared chain keeps and its span.

## @evidence contracts/development/design.md#principled-representation

The chain-fit readers a chain needs, picked from `IAutoMoviePrepareChainFit.IRig`, with the chain's span.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainRigConstants` produces it for `prepareChainConstants` and the prepared chain plant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Picks the readers instead of copying them; no result is retained.

# src/motion/IAutoMoviePrepareChainRigConstants.ts#IAutoMoviePrepareChainRigConstants.IRig

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareChainRigConstants.IRig: The rig-only readers of `IAutoMoviePrepareChainFit.IRig` and the hinge span holder.

## @evidence contracts/development/design.md#principled-representation

One record of span over the canonical IAutoMoviePrepareChainFit, IAutoMovieHingedArmSpan contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainRigConstants` fills it and the enclosing IAutoMoviePrepareChainRigConstants contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareChainRigConstants`.
