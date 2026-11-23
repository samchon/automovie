# src/geometry/measureAutoMovieMeshGap.ts#measureAutoMovieMeshGap

## @evidence contracts/development/implementation.md#principled-implementation

The distance between two non-crossing triangles is attained edge to edge or corner to face interior, so each pair takes its nine clamped segment distances (Ericson 2005, Real-Time Collision Detection, 5.1.9) and its six interior projections. A zero-length edge reads as its point and a zero-area face is answered by its edges. Box distances bound every descendant pair from below, so the simultaneous nearest-first walk of both hierarchies prunes without changing the least distance. Crossing surfaces are not detected here; the caller decides them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation (`surface`, with the hierarchy from `buildAutoMovieMeshQueryHierarchy`) is separate from measurement, so a part measured against many others is prepared once; the dual walk and the two closed-form distances are private steps. It stays out of the barrel because model contacts is its only consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or sampling is used: zero tests are exact, the walk prunes only box pairs no nearer than the running least distance, and the result is not rounded.

## @evidence contracts/development/common.md#meaningful-documentation

States the method and its citation, why edges and interiors suffice, the crossing caveat, the preparation, the walk and why it changes no answer, the early stop and units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation is O(n log n) per surface. The dual walk visits only node pairs nearer than the running least distance, near-logarithmic for separated parts; parts whose surfaces nearly touch over a wide area compare every triangle pair whose boxes come within that distance, O(n m) in the worst case. Measured over the archetype catalog's middles, preparing once per part and walking both trees cut the contact report from 45 s to 17 s.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call measures one pair of prepared surfaces; the preparation is what callers reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing between calls; each call holds only its running least distance and its recursion stack, bounded by the hierarchies' depths.

# src/geometry/measureAutoMovieMeshGap.ts#measureAutoMovieMeshGap.surface

## @evidence contracts/development/implementation.md#principled-implementation

Copies each triangle's corners and box into a hierarchy entry and builds the median box hierarchy every gap walk reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission and preparation only; the walk lives in the gap function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a malformed index buffer, non-finite positions and an empty surface rather than measuring them.

## @evidence contracts/development/common.md#meaningful-documentation

States what is prepared, units and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in triangles for the copy plus the hierarchy build's O(n log n).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared surface is the reusable work: model contacts prepares each part once and measures it against every other part.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned surface owns nine coordinates, a box and a centre per triangle and the hierarchy nodes; it lives as long as the caller keeps it.

# src/geometry/measureAutoMovieMeshGap.ts#measureAutoMovieMeshGap.ISurface

## @evidence contracts/development/design.md#principled-representation

The root of a box hierarchy over triangles in one metre frame; every node encloses its descendants, which is the pruning premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine-internal, built by `surface` and read by the gap and by model contacts, which keeps one per part.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One required field; no cast.

## @evidence contracts/development/common.md#meaningful-documentation

States what it holds and its units.

# src/geometry/measureAutoMovieMeshGap.ts#measureAutoMovieMeshGap.ITriangle

## @evidence contracts/development/design.md#principled-representation

Nine corner coordinates in metres in corner order, with the box and centre the hierarchy reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine-internal hierarchy entry of the prepared surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A typed array keeps the inner distance loop free of allocation; no cast.

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate layout and units.
