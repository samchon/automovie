# src/pose/IAutoMovieHingedChainGeometry.ts#IAutoMovieHingedChainGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Gives each rest offset's bone frame, world target and radian hinge interval.

## @evidence contracts/development/design.md#principled-representation

branches rejects its small-segment, target-at-root, small-hinge and invariant-span cases with null; callers supply finite geometry, unit rest frames and valid ranges.

## @evidence contracts/development/design.md#minimal-and-owned-surface

hingedArmSwivel and hingedArmArticulation use this same prepared rest-chain geometry for span branches and swivel posing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contract reuses IAutoMovieChainBone and keeps clinical ROM scoring out of geometric branch construction.
