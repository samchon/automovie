# src/physics/physicalBalanceHandoff.ts#physicalBalanceHandoff

## @evidence contracts/development/common.md#meaningful-documentation

States what authored ownership cancels, what it hands back and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

Authored motion owns an endpoint it reserves: a recovery step on it is cancelled, a diagonal pair whole, and resolved as cancelled rather than landed or failed; a retained landing offset on it is removed and recorded as a handoff. The state is copied where it changes, the offsets keeping the null prototype the state starts them with.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cancellation, then the offsets, each one copy of the state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The one cast types the null-prototype copy of the offsets.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the reserved endpoints and the steps under way.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep's reservations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the handoff record grows by one entry per offset handed back, owned by the caller's state.
