# src/geometry/construction/AutoMovieSolidBodyMerge.ts#AutoMovieSolidBodyMerge

## @evidence contracts/development/common.md#meaningful-documentation

Operations name snapshot ownership, live surface dependencies and returned versus thrown failure.

## @evidence contracts/development/design.md#principled-representation

Represents Existing transactional body assembly and frozen host snapshots: companion namespace of 9 members (`IAutoMovieSolidBody.IFace`, `IBody`, `IFaceInput`, `IMerge`, `IMerged`, `atlas`, ...); units and frames named in its text: local, radians. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidBodyMerge` in packages/engine/src/geometry/construction/AutoMovieSolidBodyMerge.ts; its surface is the 9 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.

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

Checkpoints cycle copies and mesh populations, then appends shared rail vertices and reciprocal cycles through the existing join, blend and clip owners. When the part face already has a retained domain, it admits every part-rail column on that domain and applies the existing authoritative segment partition before publishing another trim on that face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One transaction owns mutation order while numerical geometry remains in the existing operators.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves early join-null, returned diagnostics and the original checkpoint scope. Part-side admission reuses existing chart membership, periodic lifts and exact predicates. Refining or connecting the new trim across a different part chart still belongs to the boundary producer.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes append/cycle mutations, admitted input premises and returned failure from a thrown operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes cycle/atlas snapshots, join and column solves, boundary allocation and clipping. Each retained cycle prepares one reader for the part's declared columns. The authoritative segment sweep uses only the previously retained and newly declared boundary segments of that one face.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adjoining faces share exact boundary vertex indices, and one published blend supplies its surface and trim records. A traced join that selects native boundaries gives both source cuts and their adjoining blend edges reciprocal readers of the same prepared cubic rails.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains successful geometry. Checkpoint copies and retained-part boundary preparation are local to the merge. Returned joins own their declared columns.

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
