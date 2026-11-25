# src/touch/kissClock.ts#kissClock

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `kiss.plan` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The kiss's `contact` and `part` are the phrase's own `ready` and `relax` instants, appended to its instants unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `kiss.plan`: the kiss's contact events on its phrase, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `kiss.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `kiss.plan` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `kiss.plan` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/touch/kissClock.ts#kissClock.meeting

## @evidence contracts/development/common.md#meaningful-documentation

States that both roles of a hand kiss share the meeting's local contact and departure instants.

## @evidence contracts/development/implementation.md#principled-implementation

The phrase prepares until the meeting's local `ready`, holds until its `relax` and retracts in the approach's time, so both roles meet and part at the same film seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `kiss.plan`: the shared phrase of a hand kiss, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `kiss.ts`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

One meeting read and one phrase per call, as before the move.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the meeting's own timing instead of recomputing it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh clock and retains nothing else.