# src/motion/IAutoMovieSolveDistalTwist.ts#IAutoMovieSolveDistalTwist

## @evidence contracts/development/common.md#meaningful-documentation

Joint inputs use clinical degrees, bases are normalized, requested/above/rest rotations are unit quaternions and all frames refer to the same prepared rig. Optional synchronous ROM projectors preserve the bone identity and do not mutate borrowed joints; solver and caller admission own numerical validity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieSolveDistalTwist contracts used by packages/engine/src/motion/solveDistalTwist.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Joint inputs use clinical degrees, bases are normalized, requested/above/rest rotations are unit quaternions and all frames refer to the same prepared rig. Optional synchronous ROM projectors preserve the bone identity and do not mutate borrowed joints; solver and caller admission own numerical validity. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieSolveDistalTwist contract belongs to interface; packages/engine/src/motion/solveDistalTwist.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/IAutoMovieSolveDistalTwist.ts#IAutoMovieSolveDistalTwist.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines pre-articulation world orientation, local rest/basis frames, clinical inputs and clamp lifetime.

## @evidence contracts/development/design.md#principled-representation

Clinical angles are degrees; bases are pre-normalized and world/rest quaternions unit. The caller admits those frames and effective ROM projectors own clamping.

## @evidence contracts/development/design.md#minimal-and-owned-surface

splitDistalTwist and fitHingedRotationError supply this request to solveDistalTwist, reusing precomputed clamps during candidate scoring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional clamps replace repeated skeleton lookup without importing runtime clamp implementations into interface.

# src/motion/IAutoMovieSolveDistalTwist.ts#IAutoMovieSolveDistalTwist.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieSolveDistalTwist.IPrepared: Lazy fixed-frame data.

## @evidence contracts/development/design.md#principled-representation

One record of abduction, flexion, zero over the canonical IAutoMovieVector3 contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieSolveDistalTwist contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.

# src/motion/IAutoMovieSolveDistalTwist.ts#IAutoMovieSolveDistalTwist.IZero

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieSolveDistalTwist.IZero: Fixed clinical-zero twist coefficients, borrowed unchanged by a solve.

## @evidence contracts/development/design.md#principled-representation

One record of cosine, sine.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieSolveDistalTwist contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
