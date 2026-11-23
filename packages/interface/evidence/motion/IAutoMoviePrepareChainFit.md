# src/motion/IAutoMoviePrepareChainFit.ts#IAutoMoviePrepareChainFit

## @evidence contracts/development/common.md#meaningful-documentation

Each reader states the bone it reads, its clinical degrees or quaternion result and what it shares across one unchanged rig.

## @evidence contracts/development/design.md#principled-representation

One record of fixed rig readers (bones, domains, bases, clamps, overshoot, projections, held and reference rotations, hinge range and geometry) over canonical joint and pose contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainFit` produces it; the engine's chain fits and the prepared chain constants the motions body keeps read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every reader returns actual rig facts or fresh results; no pose, target or solve answer is retained by the shape.

# src/motion/IAutoMoviePrepareChainFit.ts#IAutoMoviePrepareChainFit.IRig

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareChainFit.IRig: Lazy immutable-rig preparation.

## @evidence contracts/development/design.md#principled-representation

One record of overshoot, rotatedOvershoot, bone, domain, basis, jointBasis, composer, clamp, effectorProjection, effectorRestInverse, held, heldRotation, heldRotationInverse, distalTwist, reference, referenceWeight, hingeRange, posedSwing, hingedGeometry over the canonical AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieBone, IAutoMovieJointRotationDomain, IAutoMovieJointAxes, IAutoMovieRestFrame, AutoMovieClinicalAxis, IAutoMoviePrepareJointRotationProjection, IAutoMovieSolveDistalTwist, IAutoMovieVector3, IAutoMovieHingedArmSwivel contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainFit` fills it and the enclosing IAutoMoviePrepareChainFit contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareChainFit`.
