# src/autoMovieModelPartPoints.ts#autoMovieModelPartPoints

## @evidence contracts/development/implementation.md#principled-implementation

Moves every vertex by the part-to-model matrix of `autoMovieModelPartMatrices`, the part TRS pre-multiplied by an attached bone's rest world placement, with an identity for an unplaced part.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of model-frame part points for subject description, reusing the shared placement matrices, the engine tessellator and the shared affine point transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No model, part or bone is special-cased; an unresolved bone is left unattached by the stated rule instead of being guessed.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the per-part placement order, the bone rule and its failure case, the partial-triple rule, the units, that the pose is resolved at most once, and the keys and order of both results.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the model's vertices plus at most one rest-pose resolution and one tessellation per primitive part; the rest pose is resolved only when a part is attached and is then shared by every attached part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Recomputed per call from the given model; the subject describer memoizes the result per model for one description pass, because the artifact is the caller's value.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The resolved pose and tessellations are released on return; the caller owns the returned map and list, each bounded by the model's vertex count and sharing the same point objects.
