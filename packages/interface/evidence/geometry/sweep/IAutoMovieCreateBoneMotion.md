# src/geometry/sweep/IAutoMovieCreateBoneMotion.ts#IAutoMovieCreateBoneMotion.IProps

## @evidence contracts/development/design.md#principled-representation

Resolved bone identities pair metre origins and rotations in one model frame; lookup refuses a missing identity, while duplicate identities follow Map's last-record rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createAutoMovieBoneMotion supplies poseAutoMovieSweep and poseAutoMovieSurfaceNetwork with the same rigid motion rule using the canonical resolved-bone contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rest and posed arrays need not share ordering; records are matched by bone identity rather than by one skeleton's array layout.

## @evidence contracts/development/common.md#meaningful-documentation

States the rigid-transform equation, shared frame, reference retention, cache implications and missing-bone failure.
