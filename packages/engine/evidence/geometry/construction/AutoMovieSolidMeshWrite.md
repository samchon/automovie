# src/geometry/construction/AutoMovieSolidMeshWrite.ts#AutoMovieSolidMeshWrite.owner

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the unique-name owner index and reads the surface's actual Point0 when supplied, otherwise its existing jet point; a true tip need not pretend to carry physical2.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and conditional append own registration.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal names are an input ownership premise; this function does not prove two same-named surfaces are equivalent or freeze their callbacks.

## @evidence contracts/development/common.md#meaningful-documentation

Names the retained surface closure and unique-name premise; optional Point0 is authoritative, and its errors propagate without a jet fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans R existing owners in O(R), appending one fixed record only when absent.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Later vertices use the existing owner index for that name.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mesh owns the new closure and transitively retains its surface until the mesh is released.

# src/geometry/construction/AutoMovieSolidMeshWrite.ts#AutoMovieSolidMeshWrite.vertex

## @evidence contracts/development/implementation.md#principled-implementation

Copies three world components and an owner/u/v triple into parallel flat buffers without a positional search.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One append returns the next mesh index.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Caller admission owns finiteness and matching chart semantics; this low-level writer neither normalizes coordinates nor welds an existing index.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes evaluated world-mm data from owner-local chart coordinates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant amortized append work per vertex.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Appends the provided point once, with no surface reevaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mesh owns six appended numbers; the borrowed point vector is not retained.

# src/geometry/construction/AutoMovieSolidMeshWrite.ts#AutoMovieSolidMeshWrite.emit

## @evidence contracts/development/implementation.md#principled-implementation

Uses a known chart sign directly, or the largest triangle's normal against its own requested reference normal, to turn the whole population together.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One decision precedes a linear index append; no triangle-specific normal repair is performed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Consistent population winding and a meaningful reference remain caller premises. known requires a numeric sign; zero-area geometry is not repaired into an outward surface.

## @evidence contracts/development/common.md#meaningful-documentation

States the two sign modes and the whole-population orientation premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Known sign uses O(T) emission; reference mode first scans T triangles for the largest normal and rereads that triangle for its final comparison.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One flip applies to every emitted triangle; supplied point buffers are reused without source evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only appended indices persist in mesh; normal vectors and the reference callback are call-local.

# src/geometry/construction/AutoMovieSolidMeshWrite.ts#AutoMovieSolidMeshWrite.normal

## @evidence contracts/development/implementation.md#principled-implementation

Crosses two edges from the same first vertex with the existing vector arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single position-only reading supports reference orientation and the Human bridge's buffer view.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not require owner/chart arrays or claim a chord normal is the generating surface's analytic normal.

## @evidence contracts/development/common.md#meaningful-documentation

States the unnormalised result and position-only input use.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-size position reads, differences and cross product.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure constant-size reading retains no source evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains no mesh reference.

# src/geometry/construction/AutoMovieSolidMeshWrite.ts#AutoMovieSolidMeshWrite.facing

## @evidence contracts/development/implementation.md#principled-implementation

Reads analytic surface normals at each supplied corner's u/v and sums their nonzero unit directions, preserving the existing pole-zero contribution rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reference reading serves closure populations whose corner coordinates belong to the requested face.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Coordinates must belong to this surface; a foreign-owner seam index is not proof of that premise. Native face triangulation uses its explicit ILoop.chart and chart orientation instead.

## @evidence contracts/development/common.md#meaningful-documentation

Names the same-face coordinate premise and zero-normal behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three surface jets and fixed-size vector work per triangle.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses existing chart coordinates rather than solving a closest point or inferring a frame from emitted triangles.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh vector and retains no mesh, surface or callback after the call.

# src/geometry/construction/AutoMovieSolidMeshWrite.ts#AutoMovieSolidMeshWrite.outward

## @evidence contracts/development/implementation.md#principled-implementation

Multiplies the chart tangent cross product by the surface's explicit orientation sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One jet and one sign determine the unnormalised outward vector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Makes no tube-axis or storage-origin inference and does not repair a singular/nonfinite chart jet.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes analytic normal from the chord-triangle reference and leaves source regularity with its producer.

## @evidence contracts/development/implementation.md#efficient-algorithms

One surface jet plus constant vector arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pure chart query has no cross-request work to share here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; no surface callback is retained by this reading.
