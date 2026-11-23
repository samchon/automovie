# src/motion/IAutoMoviePrepareChainConstants.ts#IAutoMoviePrepareChainConstants.IConstants

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareChainConstants.IConstants: A chain's rig constants.

## @evidence contracts/development/design.md#principled-representation

One record of chain, parent, upperTranslation, upperRotation, lowerOffset, lowerRotation, effectorOffset, effectorBaseRotation, hinge, upperDomain, lowerDomain, rig over the canonical IAutoMoviePlantChain, AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieJointRotationDomain, IAutoMoviePrepareChainRigConstants contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainConstants` fills it and the enclosing IAutoMoviePrepareChainConstants contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareChainConstants`.
