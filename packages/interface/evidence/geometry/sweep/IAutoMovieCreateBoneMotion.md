# src/geometry/sweep/IAutoMovieCreateBoneMotion.ts#IAutoMovieCreateBoneMotion

## @evidence contracts/development/common.md#meaningful-documentation

Rest and posed bone identities refer to metre origins and dimensionless rotations in the same model frame. Matching identities are checked when requested; duplicate identities use the last record, and retained transforms must remain stable.

## @evidence contracts/development/design.md#principled-representation

Rest and posed bone identities refer to metre origins and dimensionless rotations in the same model frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createAutoMovieBoneMotion retains the resolved records to provide rigid motion to sweep and network posing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Matching identities are checked when requested; duplicate identities use the last record, and retained transforms must remain stable.

# src/geometry/sweep/IAutoMovieCreateBoneMotion.ts#IAutoMovieCreateBoneMotion.IProps

## @evidence contracts/development/design.md#principled-representation

Resolved bone identities pair metre origins and rotations in one model frame; lookup refuses a missing identity, while duplicate identities follow Map's last-record rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createAutoMovieBoneMotion supplies poseAutoMovieSweep and poseAutoMovieSurfaceNetwork with the same rigid motion rule using the canonical resolved-bone contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rest and posed arrays need not share ordering; records are matched by bone identity rather than by one skeleton's array layout.

## @evidence contracts/development/common.md#meaningful-documentation

States the rigid-transform equation, shared frame, reference retention, cache implications and missing-bone failure.
