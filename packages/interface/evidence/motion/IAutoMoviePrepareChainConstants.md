# src/motion/IAutoMoviePrepareChainConstants.ts#IAutoMoviePrepareChainConstants

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame, unit and the fixed rig it was read from.

## @evidence contracts/development/design.md#principled-representation

A chain's rest translations, rotations, offsets, hinge and domains with its rig readers, all of one unchanged body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The motions body keeps one per limb (`IAutoMovieMotionHumanBody.chains`); the engine's plant preparation reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rest facts only; every pose and target is read afresh.

# src/motion/IAutoMoviePrepareChainConstants.ts#IAutoMoviePrepareChainConstants.IConstants

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareChainConstants.IConstants: A chain's rig constants.

## @evidence contracts/development/design.md#principled-representation

One record of chain, parent, upperTranslation, upperRotation, lowerOffset, lowerRotation, effectorOffset, effectorBaseRotation, hinge, upperDomain, lowerDomain, rig over the canonical IAutoMoviePlantChain, AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieJointRotationDomain, IAutoMoviePrepareChainRigConstants contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainConstants` fills it and the enclosing IAutoMoviePrepareChainConstants contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareChainConstants`.
