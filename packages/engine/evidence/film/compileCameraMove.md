# src/film/compileCameraMove.ts#compileCameraMove

## @evidence contracts/development/implementation.md#principled-implementation

The distance is the pinhole fit on each axis with the binding axis winning, the aim and path are look-at rotations along the staged bearing, and eased segments are sampled into linear keys; the premises are a valid positive vertical field of view, which scene validation guarantees, and sorted non-overlapping entries, which `performShot` gates, and the limitation is that the linear keys approximate the eased orbit arc between its eight samples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One compiler owns the whole framing grammar and every move's path, keyed into one two-track clip; resolving subjects belongs to `performShot` and the grammar tables to their constants, and coverage takes reuse this function with their own camera.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no subject or camera; +Z bearing and world -X screen-left are stated geometric-degeneracy fallbacks. Unknown framing/move and a follow key count outside safe-integer representation throw; the count gate prevents nonprogressing enumeration without an arbitrary workload cap.

## @evidence contracts/development/common.md#meaningful-documentation

States the distance and aim solve, the bearing rule and its fallback, each move's path with its constants, span and auto-duration rules, key merging, the input preconditions, the null and error returns, and each parameter's role, units and default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Local construction is linear in the emitted keys: moves emit at most nine keys except follow, whose count grows with four samples per second. Each key adds a look rotation, while truck and follow invoke the subject's at callback and lookahead can add one forward sample per key. Callback work is additional. Both output tracks are built from the same key list.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one camera's entries, called once per take; the hero and coverage takes have different cameras and entries, so nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the key list is a local bounded by the keys above, and the returned clip is a fresh value owned by the caller.
