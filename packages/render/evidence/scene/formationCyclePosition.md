# src/scene/formationCyclePosition.ts#formationCyclePosition

## @evidence contracts/development/implementation.md#principled-implementation

Computes fractional phase as raw-floor(raw) from compiled member phase plus absolute cadence advance and radius-weighted turn; admitted finite/nonnegative metre radius and finite accumulators are premises, and very large accumulated values lose fractional precision in IEEE754 doubles rather than guaranteeing arbitrary-time phase accuracy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar helper owns the CPU cycle-position convention shared with the shader's fract expression; cadence integration and per-member radius/phase acquisition remain separate owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual phase/travel/turn inputs without a wall clock, accumulated frame step or fixture gait-name rule; the default zero radius is pivot membership, not a correction for missing data.

## @evidence contracts/development/common.md#meaningful-documentation

Gives unit-interval result, seeded phase, metre radius and absolute input semantics while removing the unsupported captured-byte identity claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs fixed-count scalar arithmetic and one floor in constant time/storage, independent of slots, gait samples or scene geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the already integrated cadence rather than resampling cues per member; pure inexpensive scalar evaluation retains no phase cache and matching values do not imply shared render effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows two scalar cadence fields and returns one number with no retained references, native handles or running task.
