# src/drawing/autoMovieDrawingSilhouetteEdges.ts#autoMovieDrawingSilhouetteEdges

## @evidence contracts/development/implementation.md#principled-implementation

The standard polygon-mesh silhouette rule, a front-facing and a back-facing face sharing an edge, plus boundary edges owned once, with facing from the right-hand winding normal that `IAutoMovieDrawingTriangle` defines; welding on the six-decimal output grid is the stated limitation, since two nearly equal corners straddling a rounding boundary stay distinct.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns facing, welding and the edge verdict; the owner tally is a private record because no other pass reads it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element or view is special-cased; edge-on faces fall to the away side by the facing test's strict inequality, which is the documented drafting convention rather than a fixture fix.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the edge rule, the facing definition and the edge-on convention with its effect, the welding rule and its limitation, the skipped degenerate faces, and the output order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `t` triangles with a hash map keyed by welded edge, so time and space are linear in `t`; each triangle builds its three corner keys once and reuses them for its three edges, and the map is needed because an edge's verdict depends on every triangle sharing it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per drawable and role per derivation; the welding map serves only that call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner map is created per call, grows to at most three entries per triangle, and is released when the call returns; only the returned edge array, owned by the caller, survives.
