# src/geometry/construction/AutoMovieConstructionState.ts#AutoMovieConstructionState.snap

## @evidence contracts/development/implementation.md#principled-implementation

Copies mutable cycles and inverted flags while recording append-only population lengths and current face names, matching the realization's actual mutation responsibilities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit checkpoint constructor keeps all restored fields visible beside restore.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not claim a full state clone: diagnostics, overrides, existing mesh values and immutable surface/station data remain outside this checkpoint.

## @evidence contracts/development/common.md#meaningful-documentation

ISnapshot states saved fields, array-entry units, excluded state and the append/edit premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F+C) face/name/cycle copying stores only data that may be edited plus scalar array lengths, avoiding an O(V+T) mesh copy at every attaching node.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing mesh arrays and realized operator records remain shared; each mutable cycle is copied once for this particular checkpoint.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the new face/cycle/name snapshot until the node succeeds or rolls back; nested checkpoints scale with their captured populations and no process cache is used.

# src/geometry/construction/AutoMovieConstructionState.ts#AutoMovieConstructionState.restore

## @evidence contracts/development/implementation.md#principled-implementation

Truncates appended faces/mesh/owners/blends/output lists, restores saved cycles/inverted flags and deletes post-checkpoint face/chain names under global name uniqueness.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

In-place restoration preserves the host's object identity and existing mesh numbers without reconstructing its geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not rewind diagnostics/overrides or arbitrary changes to preexisting mesh/surface fields; the caller must use the documented append-and-cycle-edit transaction model.

## @evidence contracts/development/common.md#meaningful-documentation

States which state survives, cycle-array transfer and the checkpoint's limited mutation coverage.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits saved faces/current names and truncates appended populations; no surface solve or tessellation is repeated, and array truncation may release a number of entries proportional to discarded output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the saved cycle arrays and untouched prefix mesh values; saved arrays subsequently become the live mutable face cycles rather than an immutable reusable snapshot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Discarded array/map entries lose their owning references and saved cycles transfer to the body; the caller then releases the checkpoint when its node settles.
