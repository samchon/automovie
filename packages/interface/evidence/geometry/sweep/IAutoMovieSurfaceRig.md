# src/geometry/sweep/IAutoMovieSurfaceRig.ts#IAutoMovieSurfaceRig

## @evidence contracts/development/design.md#principled-representation

The pose-invariant compile and per-pose evaluation split of a deformable surface, with the posed cage equal to sampling the network `poseAutoMovieSurfaceNetwork` makes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One shared rest cage, an optional rest construction snapshot and one pose writer that fills a buffer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fit residual is returned on every pose, so a caller can refuse a pose whose fit did not converge.

## @evidence contracts/development/common.md#meaningful-documentation

States what compiles once, what moves per pose, the allocation and cache guarantees and the residual.
