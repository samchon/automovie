# src/striking/KickSwingTurned.ts#KickSwingTurned

## @evidence contracts/development/common.md#meaningful-documentation

States the great-arc turn of a segment, its linear length and the opposite-direction case.

## @evidence contracts/development/implementation.md#principled-implementation

Spherical linear interpolation of the unit directions with the length interpolated linearly, so a share is a joint's turn and never a chord; opposite directions turn about a horizontal axis across the first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The segment-turn helper `KickSwing.create`'s lift and lowering share, moved out of `KickSwing` unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `KickSwing`; no value, tolerance, fallback or search is added. The degenerate thresholds are the ones the arc has no direction below.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic per call: two lengths, one angle and one rotation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call turns one segment at one share; nothing is shared across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains nothing.
