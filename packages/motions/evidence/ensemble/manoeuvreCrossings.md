# src/ensemble/manoeuvreCrossings.ts#manoeuvreCrossings

## @evidence contracts/development/common.md#meaningful-documentation

States what it checks, its sampling step and the refusal it throws.

## @evidence contracts/development/implementation.md#principled-implementation

Each member is read on its way at its travel's speed from its delay (a station's slot where it keeps one) at the crowd's step, and every pair is compared against the smaller of their two halves' sum and their distances at the start and the end, so two ways that come closer than either end leaves them cross.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: the crossing check of a manoeuvre's straight ways, apart from laying them (`HumanManoeuvre.plan`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The floor of each pair is the members' own extent or their own end spacing; the millimetre margin is the comparison's rounding, not a tuned let-out.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(T n^2) for n members over T = end / `HumanCrowd.STEP` samples, the pairwise test the check states; each way's arc lengths are prepared once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each way's prefix arc lengths across samples; nothing outlives the call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after return or throw.
