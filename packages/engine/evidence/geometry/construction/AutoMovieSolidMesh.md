# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.create

## @evidence contracts/development/implementation.md#principled-implementation

Creates empty position, index, chart and owner arrays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A plain four-array record is sufficient.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Allocates no hidden geometry or cache.

## @evidence contracts/development/common.md#meaningful-documentation

States detached output ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and initially empty storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each request creates a separate mesh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns all four returned arrays.

# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.owner

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the existing name lookup and retained jet-point closure to the write owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public façade preserves one registration API.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Same-name equivalence is a caller premise; no positional identity or source freezing is inferred.

## @evidence contracts/development/common.md#meaningful-documentation

Names registration identity and transitive source retention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans R existing owner names in O(R).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated registration of the same name reuses its index.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A new closure persists in the mesh only when the name was absent.

# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.seam

## @evidence contracts/development/implementation.md#principled-implementation

Preserves original source-column/row evaluation and shared rail identity; the tessellation owner admits the actual closed clock/orientation and restores this call's append-only changes on propagated failure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Tessellate owns seam construction; this façade preserves the public API.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no fitted correspondence, positional weld or per-triangle reversal.

## @evidence contracts/development/common.md#meaningful-documentation

States original clock columns, legacy default2pi, closed-band admission, authoritative blend orientation, shared indices and append-only failure rollback.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(CR) source evaluations and triangles for C columns and R row intervals, plus owner-name scans and constant-size rollback bookkeeping.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Published rail charts set each boundary point once per seam.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mesh numbers/owners and returned rail indices persist; grid/triangle scratch is local.

# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.face

## @evidence contracts/development/implementation.md#principled-implementation

Prepares grid, residual index plan and provenance before any append, then uses one declared chart orientation for the whole face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The face owner coordinates preparation, named diagnostics and one commit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported topology is never silently omitted. Omitted onFailure throws; arbitrary source, keeps and callback exceptions propagate with the same object before writes.

## @evidence contracts/development/common.md#meaningful-documentation

Returns actual native occurrence/winding/end data and diagnoses partial periodic arcs instead of capping them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes grid, bridge/ear/insertion/legalization work and predicate cost; no f1 speed or world-approximation bound is inferred from positive chart area.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses copied source jets, split constraints and original shared IDs within the synchronous call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Scratch/provenance expires after commit/refusal; mesh owners retain surfaces and returned cycles own copied numeric data.

# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.close

## @evidence contracts/development/implementation.md#principled-implementation

The fan reverses the source boundary traversal before applying source orientation and cutter inversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Endpoint/pole admission remains with callers; Tessellate owns index emission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not cap arbitrary trim arcs or query foreign owner coordinates for a face normal.

## @evidence contracts/development/common.md#meaningful-documentation

States fan traversal, known native orientation and inversion premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear triangle emission with no analytic reevaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses original boundary indices and the declared orientation sign.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only appended indices survive; the operation adds no retained callback.

# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.bridge

## @evidence contracts/development/implementation.md#principled-implementation

Uses original world-polyline alignment/arc zipper and one population outward reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns indices for the caller's shared event buffers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires compatible complete cycles and preserves the positions-only Human view; it is not a general trimmed-region fill.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes event correspondence from constrained face tessellation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear alignment, arc, zipper and normal scans in the two cycle sizes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses original ring/cycle IDs and the caller's outward reference.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh output triples belong to the caller; scratch expires and no mesh buffer changes.

# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

Reads the owner/u/v triple and invokes that owner's original point callback.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One indexed replay preserves the existing API.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires valid index/owner data and never substitutes that chart for a foreign face occurrence.

## @evidence contracts/development/common.md#meaningful-documentation

States owner-local inputs and original callback-result ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant indexing plus the source callback's actual cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No replay cache assumes mutable callbacks stayed unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The three-number slice is local; returned vector ownership follows the source.

# src/geometry/construction/AutoMovieSolidMesh.ts#AutoMovieSolidMesh.vertex

## @evidence contracts/development/implementation.md#principled-implementation

Copies three world components and owner/u/v into aligned buffers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The write owner returns the new global index.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Finiteness and chart meaning are caller admission premises; no normalization or positional welding is performed.

## @evidence contracts/development/common.md#meaningful-documentation

Names low-level append ownership and coordinate units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant amortized append work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Copies the provided evaluated point without a new surface reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Six numeric entries persist in mesh; the borrowed vector is not retained.
