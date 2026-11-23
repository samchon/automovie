# src/core/IAutoMovieAimDriver.ts#IAutoMovieAimDriver

## @evidence contracts/development/design.md#principled-representation `resolveWorldDrivers` applies the standard two-step aim constraint: `rotationBetween` gives the exact atan2 shortest arc onto the normalized direction, then the up axis and `worldUp` are projected onto the plane normal to it and the signed angle between them becomes the twist, skipped when either projection is shorter than `1e-8`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record names the owner, the target and three directions plus a blend, and the solve lives in the shared world-space pass with parent and IK drivers rather than in a separate look-at system.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Degenerate geometry follows the math (no twist when up is parallel, identity arc for a zero direction) instead of a hand-picked fallback, and invalid axes or influence throw rather than being normalized away.

## @evidence contracts/development/common.md#meaningful-documentation

States the pass the driver runs in, the exact rotation it computes, what is preserved, its interaction with limits, every throw, and both degenerate cases.
