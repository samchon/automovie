# src/createAutoMovieSourceOracle.ts#createAutoMovieSourceOracle

## @evidence contracts/development/implementation.md#principled-implementation

Every answer is computed by the same function the compiled runtime uses, `compiledFormationSlot`, `instanceSlot` and `worldGroundHeight`, so a source's question and the runtime's answer cannot diverge; ids are tested with `Object.hasOwn`, which excludes inherited properties such as `toString`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A thin adapter from the compiled records to the interface's oracle contract that owns only the id lookup and the zero-ground default the contract names; regeneration and range checks stay with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No formation, set or surface is special-cased; the zero ground height over no surface is the interface's documented answer, not a fallback for one caller.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why answers come from compiled records, the distance and ground rules, the refusal and its error type, that props are held by reference, and who checks slot ranges.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Construction and distance arithmetic are constant work. Slot methods use an own-property lookup then delegated regeneration; ground height delegates surface traversal. Those owners determine query costs, and this adapter chooses no separate algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers are regenerated per question by design, because a compact slot is cheaper to recompute than to store and the records may change between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned oracle retains references to the three props for as long as the caller holds it and copies nothing; it allocates only per-answer results, which the caller owns.
