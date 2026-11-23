# src/soft/plantingContainsPoint.ts#plantingContainsPoint

## @evidence contracts/development/implementation.md#principled-implementation

Box membership uses inclusive component comparisons; sphere membership uses direct squared offset and radius. Typed admitted envelopes/points are premises, while extreme square overflow/underflow can make the sphere comparison unreliable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Growth's emission admission and analytic pruning operate on the same authored envelope, with membership kept separate from exit distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No invented clipping region or point clamp replaces the envelope; none means unrestricted growth and a boundary point is intentionally inside.

## @evidence contracts/development/common.md#meaningful-documentation

States recipe-local frame, closed-boundary meaning and squared-arithmetic limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three-axis comparisons or a fixed squared norm take constant time and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One predicate serves every emitted branch base; varying points cannot reuse a prior membership result behind envelope identity alone.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a boolean transfers; point and envelope are read without mutation or retained references.
