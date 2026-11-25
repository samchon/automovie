# src/motion/IAutoMoviePrepareJointRotationCoefficientDots.ts#IAutoMoviePrepareJointRotationCoefficientDots.IDot

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareJointRotationCoefficientDots.IDot: One fixed coefficient's four-term dot reader, with its existing finite-input premise.

## @evidence contracts/development/design.md#principled-representation

One named type over the canonical IAutoMovieQuaternion contracts, so its readers share one spelling of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationCoefficientDots` fills it and the enclosing IAutoMoviePrepareJointRotationCoefficientDots contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationCoefficientDots`.

# src/motion/IAutoMoviePrepareJointRotationCoefficientDots.ts#IAutoMoviePrepareJointRotationCoefficientDots.IReader

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareJointRotationCoefficientDots.IReader: Fixed-rig readers.

## @evidence contracts/development/design.md#principled-representation

One record of its call, swivels over the canonical IAutoMovieJointPose, IAutoMovieQuaternion contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationCoefficientDots` fills it and the enclosing IAutoMoviePrepareJointRotationCoefficientDots contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationCoefficientDots`.
