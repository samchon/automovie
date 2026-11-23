# src/everyday/prepareSeatedPalms.ts#prepareSeatedPalms

## @evidence contracts/development/common.md#meaningful-documentation

States the body-local geometry and current thigh and wrist frames.

## @evidence contracts/development/implementation.md#principled-implementation

Prepares the canonical local skin ray and the original full flat hand shape and extent reader for each side at its entry articulation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bind two fixed geometry readers per side; the ongoing seated writer selects the current transform and direction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the real body surfaces and colliders and keeps the current joint observations, palm direction, and hand extent computation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the flat hand's FK and the thigh ray march once per side in setup; subsequent reads transform one point and scan the fixed hand extents.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Root translation and world wrist rotation preserve the flat hand's local geometry. Only scalar extents in the actual requested direction are evaluated live.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One fixed thigh point and bounded placed flat hand geometry per side release with the plan; no current posture, FK loan or queried time is retained.
