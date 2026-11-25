# src/geometry/AutoMovieMeshCrossingGeometry.ts#AutoMovieMeshCrossingGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the internal owner and public consumer, complete-buffer admission, fixed layout, independent snapshots and zero-area retention.

## @evidence contracts/development/design.md#principled-representation

Represents Internal geometry ownership for immutable crossing snapshots and refits: companion namespace of 5 members (`ITriangle`, `ISnapshot`, `index`, `prepare`, `withPositions`); units and frames named in its text: second, metre, frame, world. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieMeshCrossingGeometry` in packages/engine/src/geometry/AutoMovieMeshCrossingGeometry.ts; its surface is the 5 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/AutoMovieMeshCrossingGeometry.ts#AutoMovieMeshCrossingGeometry.index

## @evidence contracts/development/implementation.md#principled-implementation

Shared triangle-index admission makes each addressed corner total, and a complete indexed finite-coordinate scan ensures exact current triangle boxes can enclose their copied corners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Current query subjects and resident preparation share the same private corner/box reader rather than maintaining different mesh admission or indexing laws.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every index triple becomes a record, including zero-area triples. Unreferenced coordinates are still admitted and sparse/nonfinite coordinates refuse.

## @evidence contracts/development/common.md#meaningful-documentation

States current subject ownership and complete admission, with original triples and degenerate membership inherited from ITriangle/read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans V position scalars and T triangle triples in O(V+T), which is necessary to admit and index the complete current subject; no hierarchy is built for it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each referenced vertex is copied once for this read. All triangles at that index share the copied coordinate triple. A later query reads current coordinates again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns O(T) fresh corner/box records and retains no mesh, source indices or caller positions after the call.

# src/geometry/AutoMovieMeshCrossingGeometry.ts#AutoMovieMeshCrossingGeometry.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Copies admitted triangle indices, indexes all current corners and builds the existing exact-box hierarchy. Frozen indices and original ordinals form the invariant used by later refits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This initial constructor delegates index admission, corner reading and hierarchy partitioning to their single owners; public query construction consumes its resulting snapshot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Source mutation cannot alter copied/frozen indices or current corners. No zero-area or currently inactive triangle is discarded.

## @evidence contracts/development/common.md#meaningful-documentation

States complete source ownership, the copied fixed-layout invariant and initial median build; ISnapshot states empty and lifetime semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V+T) admission/indexing plus median hierarchy selection, typically O(T log T) with a local sort fallback. Preparation runs once per adopted index layout. Each crossing result is sorted by shared cell and original ordinal independently of the tree's visit order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Produces the frozen source index run and hierarchy partition that later current-position snapshots can reuse. Each copied vertex supplies all corners that address it. Changed indices or cardinality require another preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers copied frozen indices and O(T) private triangle/tree state to the query owner, retaining no original mesh/position/index buffers.

# src/geometry/AutoMovieMeshCrossingGeometry.ts#AutoMovieMeshCrossingGeometry.withPositions

## @evidence contracts/development/implementation.md#principled-implementation

Identical position cardinality keeps every frozen index valid. Re-reading all corners then refitting every partition node gives actual current bounds, preserving every ordinal even across degenerate/valid transitions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Position replacement owns no transform law: the actual consumer supplies canonical world coordinates. Existing read and shared refit keep the arithmetic and population in one owner each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains all source triples and validates all positions, including unused ones. No triangle activation shortcut, inverse affine query, cached world transform or mutable prior snapshot is used.

## @evidence contracts/development/common.md#meaningful-documentation

States common frame, fixed source addressing, cardinality/nonfinite refusal, failure effects, actual-coordinate ownership and degenerate transitions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads V coordinate scalars and T triples, then refits O(T) tree state: O(V+T) time and O(T) fresh retained geometry, with no repeated partition sort. Query efficiency may decrease if the retained partition poorly matches the new placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Between snapshots, shares only the frozen indices and reuses only partition membership and order. This snapshot shares each newly copied vertex among its incident triangles. Its bounds and corners all describe the new positions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh triangle/tree state plus the shared frozen index run and scalar count. It borrows positions synchronously, and neither the input buffer nor a chain of old snapshots is retained.
