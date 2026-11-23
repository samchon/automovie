# src/autoMovieModelPartMatrices.ts#autoMovieModelPartMatrices

## @evidence contracts/development/implementation.md#principled-implementation

Composes the part TRS with `Matrix4.compose` and pre-multiplies the attached bone's rest world placement, the order in which a rig carries a rigid attachment; the rest pose comes from `resolvePose` with no joint articulation, which is the skeleton's authored rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of part-to-model placement for `autoMovieModelPartPoints` and `measureAutoMovieModelCrossings`, which then move points or meshes by it, so the two cannot disagree on where a part sits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No model, part or bone is special-cased; an unresolved bone leaves the part unattached by the stated rule, and `null` reports an unplaced part instead of inventing an identity that would round signed zeros.

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix layout and composition order, the bone rule and its failure case, what `null` means and why it exists, when the pose is resolved, the units, and the result's keys and order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the part count plus at most one rest-pose resolution and one bone search per attached part over the resolved bones.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Recomputed per call from the given model; each caller derives it once per model it measures or describes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one sixteen-number matrix or `null` per part; the resolved pose is released on return.
