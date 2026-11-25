# src/perform/validateInitialPropMounts.ts#validateInitialPropMounts

## @evidence contracts/development/common.md#meaningful-documentation

Names the construction point and every refused mount condition.

## @evidence contracts/development/implementation.md#principled-implementation

Each mounted prop has one parent edge. A walk's ordered Set detects revisits, and walks stop at a verified node or a prop with no mount. Socket references are checked against the declared affordances and rigid offsets use the engine's unit-rotation policy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One iterative pass follows the canonical mount records. Validation of individual offsets delegates finite position and unit rotation to ViolationCollector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects competing placement inputs and invalid references before reading any prop callbacks. No missing transform is replaced and no cycle is broken by selecting a fallback parent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each completed subject is visited once plus the outgoing lookup into a completed chain. Socket checks scan the named parent's affordances. The current path and completed set use linear temporary space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The completed set lets different chains share their already-verified suffix within this call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The two temporary sets and scalar validation findings are local and discarded. Only a thrown refusal escapes.
