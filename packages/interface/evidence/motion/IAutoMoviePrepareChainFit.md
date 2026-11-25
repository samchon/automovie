# src/motion/IAutoMoviePrepareChainFit.ts#IAutoMoviePrepareChainFit.IRig

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareChainFit.IRig: Lazy immutable-rig preparation.

## @evidence contracts/development/design.md#principled-representation

One record of overshoot, rotatedOvershoot, bone, domain, basis, jointBasis, composer, clamp, effectorProjection, effectorRestInverse, held, heldRotation, heldRotationInverse, distalTwist, reference, referenceWeight, hingeRange, posedSwing, hingedGeometry over the canonical AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieBone, IAutoMovieJointRotationDomain, IAutoMovieJointAxes, IAutoMovieRestFrame, AutoMovieClinicalAxis, IAutoMoviePrepareJointRotationProjection, IAutoMovieSolveDistalTwist, IAutoMovieVector3, IAutoMovieHingedArmSwivel contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainFit` fills it and the enclosing IAutoMoviePrepareChainFit contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareChainFit`.
