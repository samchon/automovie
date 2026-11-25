# src/geometry/construction/AutoMovieSolidMeshLoop.ts#AutoMovieSolidMeshLoop.keeps

## @evidence contracts/development/implementation.md#principled-implementation

Combines existing kept-side parity with the first-fundamental-form distance to every segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The live public reading shares its scalar metric minimum with prepared face queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the same local metric, phase shifts, sqrt/clamp and inclusive margin comparison; no geodesic or world-distance substitute is used.

## @evidence contracts/development/common.md#meaningful-documentation

Names chart inputs, jet-derived metric and world-mm margin; parity boundary ties remain the existing predicate's.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) time for S edges, with metric coefficients computed once per call; prepare amortizes invariant work across a face.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

This live API caches nothing and sees current mutable input; prepared face snapshots have a separate lifetime.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean and retains no input or scratch after returning.

# src/geometry/construction/AutoMovieSolidMeshLoop.ts#AutoMovieSolidMeshLoop.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same parity, metric projection and margin comparisons as keeps; copied chart values change no geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One face-local closure owns lazy loop preparation and each loop's chart box; no global cache is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves loop order, eager fallback, both distinct periodic rules, sqrt and equality; the metric scan of a loop is skipped only where a lower bound of the same metric to the loop's chart box strictly exceeds the margin, so the answer is the full scan's and no tolerance or curve is changed.

## @evidence contracts/development/common.md#meaningful-documentation

States numerical snapshot ownership, accessor fallback, the supported descriptor premise and the bound that skips a far loop.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation is O(S+L) for S total edges and L loops; a query reads the kept side of each loop and scans only the loops whose box lies within the margin, so a face of many small holes costs each grid point its few near ones.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each new face owns new preparation after edits or rollback; eligible input and jet values stay unchanged while read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Captures O(S+L) scratch for L loops until the returned reader is dropped; the face retains it only through its synchronous call.

# src/geometry/construction/AutoMovieSolidMeshLoop.ts#AutoMovieSolidMeshLoop.nearest

## @evidence contracts/development/implementation.md#principled-implementation

Averages each drawn-cycle point's nearest polygon-segment chart distance to rank candidate boundaries in Mesh.face, using Cycle.foot's periodic branch conventions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mean score separates candidate ranking from the later world-space starting/direction alignment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal point weighting and mixed chart-coordinate units remain the implemented heuristic; the score does not prove corresponding topology or globally optimal cycle assignment.

## @evidence contracts/development/common.md#meaningful-documentation

States chart-distance meaning, matching role and the empty-input NaN/infinite limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P*S) work for P cycle points and S loop segments: every foot compares all segments without an index to find its chart minimum, and Mesh.face repeats the score across candidate cycles.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This independent score retains no spatial index or prior foot; no effectful requests are coordinated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar; per-query foot records are temporary, with no loop, point list or score cache retained after the call.

# src/geometry/construction/AutoMovieSolidMeshLoop.ts#AutoMovieSolidMeshLoop.arc

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates world-position chord lengths, includes the closing edge and normalizes the cumulative distances to one turn for Zip's monotone parameter walk.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cumulative array and a closing total describe the existing vertex sequence without fitting or sampling a new curve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not claim exact smooth-curve arclength or validate indices/simplicity; a total that is not above zero produces zero parameters rather than a repaired polygon.

## @evidence contracts/development/common.md#meaningful-documentation

Gives world-chord meaning, radians, nonempty/index premises and degenerate-total behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) position/chord work and O(N) output for N vertices, including the final closing edge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call rebuilds cumulative lengths; aligned's quarter queries and the later Zip inputs currently repeat those arc reads rather than share a prepared result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh N-entry parameter array; intermediate positions and the cumulative array are call-local, with no mesh or vertex list retained globally.

# src/geometry/construction/AutoMovieSolidMeshLoop.ts#AutoMovieSolidMeshLoop.aligned

## @evidence contracts/development/implementation.md#principled-implementation

Starts at the world vertex nearest the loop's first point, then compares forward/backward quarter-vertex distances to choose one traversal for the zipper.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two reordered candidate arrays expose the heuristic's two choices without moving any vertex or changing its owner coordinates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ties keep the earlier start and choose forward; nearest-start and discrete-quarter tests do not certify matching topology, smooth arclength or a globally best alignment.

## @evidence contracts/development/common.md#meaningful-documentation

States valid nonempty inputs, world-space comparison and the discrete quarter/fallback convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L+C) scans for loop length L and cycle length C, with two C-entry candidate arrays and three cumulative arc readings; no pairwise alignment search is used.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The loop's quarter is shared between direction comparisons, but candidate arcs and the current best start distance are recomputed, and Mesh.face later rebuilds the chosen arcs for Zip.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh reordered cycle; the unchosen array, arc arrays and point vectors are call-local, with no retained mesh, reader or cross-face cache.
