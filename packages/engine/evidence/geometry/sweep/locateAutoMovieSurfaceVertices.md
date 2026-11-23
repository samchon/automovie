# src/geometry/sweep/locateAutoMovieSurfaceVertices.ts#locateAutoMovieSurfaceVertices

## @evidence contracts/development/implementation.md#principled-implementation

Chart composition: the subdivision's face parameters through the sampler's per-corner patch coordinates, then a sweep patch's affine map to its domain rectangle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads only the parameters, the corner coordinates and the patch ranges; it neither subdivides nor evaluates a sweep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cage from another network is refused by its patch names instead of matched by position, and a non-quad face, which the sampler never emits, is refused rather than guessed.

## @evidence contracts/development/common.md#meaningful-documentation

States the chart, its within-patch exactness and continuity, its seam limitation, the domain map, the pose independence and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V + P) for V vertices and P patches, a constant blend per vertex.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single pass; the caller keeps its result across poses, as the description states.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result holds one location per vertex, owned by the caller.
