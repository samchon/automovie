# src/motion/IAutoMoviePrepareChainRigConstants.ts#IAutoMoviePrepareChainRigConstants.IRig

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareChainRigConstants.IRig: The rig-only readers of `IAutoMoviePrepareChainFit.IRig` and the hinge span holder.

## @evidence contracts/development/design.md#principled-representation

One record of span over the canonical IAutoMoviePrepareChainFit, IAutoMovieHingedArmSpan contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainRigConstants` fills it and the enclosing IAutoMoviePrepareChainRigConstants contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareChainRigConstants`.
