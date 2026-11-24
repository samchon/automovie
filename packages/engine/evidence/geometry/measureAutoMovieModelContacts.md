# src/geometry/measureAutoMovieModelContacts.ts#measureAutoMovieModelContacts

## @evidence contracts/development/implementation.md#principled-implementation

Every part is realized and placed in the model frame, then each pair is classified from three measures: the strict crossing census in both directions, the least surface distance, and the area share of each part whose triangle centroids the other's winding number holds inside. Disjoint boxes cannot hold crossing triangles, so the census is skipped for them, while the gap is measured for every pair. The share resolves at the triangle size because one centroid stands for each triangle, and its numerator and denominator are summed in the same order so a wholly inside part gives exactly 1.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placement is `placeAutoMovieModelPartMesh` with `autoMovieModelPartMatrices`, the census `measureAutoMovieMeshCrossings`, the distance `measureAutoMovieMeshGap` and the containment `createAutoMovieMeshWindingQuery`; this function only surveys parts once and combines the measures into one record per pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The only threshold is the caller's contact distance; containment is an exact share of 1, and no part or pair is skipped or named.

## @evidence contracts/development/common.md#meaningful-documentation

States which parts are measured and how they are placed, the pair order, how each measure is taken, the share's resolution, the relation order, why a sub-contact gap avoids coplanar crossings, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P parts there are P(P-1)/2 pairs. Each part's survey, prepared gap surface and winding snapshot are made once and shared by all its pairs. A pair costs the crossing census when boxes overlap, the dual-hierarchy gap, and one winding query per triangle centroid near enough to the other part to be inside it. The exact bound that a centroid at box distance D sees a winding number of at most A / (4 pi D^2) decides far centroids and far pairs without a query. Over the archetype catalog's middles the report took 45 s before these steps and 17 s after; callers still bound part and triangle counts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each part's placed mesh, box, centroids, areas, prepared gap surface and winding query are built once per call and reused by every pair that part belongs to; nothing survives the call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds per part one placed mesh, one centroid and area per triangle, one prepared gap surface and, once a share needs it, one winding snapshot, all released on return; the result holds one record per pair.
