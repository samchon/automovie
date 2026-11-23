# src/geometry/construction/AutoMovieSolidBodyMerge.ts#AutoMovieSolidBodyMerge.atlas

## @evidence contracts/development/implementation.md#principled-implementation

Copies face trim cycles and original-atlas addresses while borrowing immutable surfaces/atlases. Original domain exits follow their actual chart map before trim classification; retained-cycle exits preserve polygon-foot shares, except through a segment that lies on an owner's exact boundary, which maps by that owner's correspondence whether or not a clip has edited the rest of its cycle. Legacy cycle-inclusive parity remains a limitation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frozen face list and back-index map keep later clips from altering the join's original host region.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves violated-cycle scans, raw chart-distance ranking and open/excluded-neighbour nulls without changing boundary ties.

## @evidence contracts/development/common.md#meaningful-documentation

States snapshot versus borrowed-surface lifetime and the body-to-atlas index/foot correspondence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies O(F+S) face/cycle data for F included faces and S trim records; each query scans the reached face's cycles and segments.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returned callbacks share one copied trim snapshot and one index map; changed body cycles require another atlas.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Closures retain copied cycles/maps and borrowed surfaces until dropped; population follows that captured body, with no global cache.

# src/geometry/construction/AutoMovieSolidBodyMerge.ts#AutoMovieSolidBodyMerge.merge

## @evidence contracts/development/implementation.md#principled-implementation

Checkpoints cycle copies and mesh populations, then appends shared rail vertices and reciprocal cycles through the existing join, blend and clip owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One transaction owns mutation order while numerical geometry remains in the existing operators.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves early join-null, returned diagnostics and the original checkpoint scope; thrown callbacks are not caught or converted into rollback results.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes append/cycle mutations, admitted input premises and returned failure from a thrown operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes cycle/atlas snapshots, join and column solves, boundary allocation and clipping; supplied traced data can be reused by the join.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adjoining faces share exact boundary vertex indices, and one published blend supplies its surface and trim records.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains successful geometry; checkpoint copies are local, while returned joins retain their existing query cache with no new cache here.

# src/geometry/construction/AutoMovieSolidBodyMerge.ts#AutoMovieSolidBodyMerge.kept

## @evidence contracts/development/implementation.md#principled-implementation

Requires the actual original source atlas domain when supplied, then conjoins current cycle predicates using the face's period; the legacy cycle-inclusive-boundary gap remains.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The original source domain precedes the unchanged ordered cycle conjunction and first-false short circuit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no domain repair, boundary tolerance or replacement classification.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the current face/cycle inputs and kept-side boolean.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reached cycle predicates cost O(S+L) worst-case work for S edges and L cycles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads live cycles on each query; prepared mesh readers have their separate unchanged-input lifetime.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean without retaining the face or query.
