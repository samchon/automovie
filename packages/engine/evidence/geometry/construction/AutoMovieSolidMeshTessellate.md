# src/geometry/construction/AutoMovieSolidMeshTessellate.ts#AutoMovieSolidMeshTessellate.seam

## @evidence contracts/development/implementation.md#principled-implementation

Builds one indexed strip per adjacent analytic column, shares the exact source rail indices later used by both trims and applies the blend's authoritative chart orientation to the entire triangle population.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One returned host/part pair records the new boundary indices and their original source charts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Admits actual period, orientation and finite ordered clock columns before writes; open bands refuse. Outward sign comes from the actual blend chart, never a chord triangle or another face's normal. Original exceptions restore this call's append-only mesh changes and retain identity.

## @evidence contracts/development/common.md#meaningful-documentation

Names actual clock columns, legacy default2pi, kernel transverse/clock order, shared identity and append-only rollback. Sources/callbacks must not mutate or reenter this mesh.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(CR) jet/vertex/triangle work for C columns and R rows plus three owner-name scans; the chart sign needs no triangle-normal scan or host rereading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rail vertices are each evaluated once and the same indices serve the strip and both returned trims.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mesh retains appended geometry and owner closures; returned loops own their index arrays but borrow the supplied charts, while grid/triangle scratch is local.

# src/geometry/construction/AutoMovieSolidMeshTessellate.ts#AutoMovieSolidMeshTessellate.close

## @evidence contracts/development/implementation.md#principled-implementation

The supplied edge-next-apex fan reverses the positive native face boundary, then applies the source orientation sign and cutter inversion to the whole population.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Closure owns no pole selection or new point; the caller supplies both fan topology and source surface.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires the caller's fan to follow an admitted complete IOpen boundary. It neither queries foreign-owner chart coordinates nor closes arbitrary residual trim arcs.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes fan emission from endpoint/pole admission and states cutter inversion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear triangle emission with no source reevaluation or largest-reference search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the caller's indexed fan, performing no source point evaluation or tessellation again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only appended indices persist in mesh; no fan or surface reference is newly retained by the operation.

# src/geometry/construction/AutoMovieSolidMeshTessellate.ts#AutoMovieSolidMeshTessellate.bridge

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the existing world-polyline alignment/arclength zipper and turns its whole population against the caller's outward reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns triangles only; the Human caller adds them to buffers where its event ring already lives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires compatible ring/endpoint cycles rather than applying a zipper to arbitrary trimmed regions. It reads positions only, preserving the Human positions-only view.

## @evidence contracts/development/common.md#meaningful-documentation

States ring provenance, reference ownership and absence of vertex/mesh mutation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes existing alignment and arc scans, a linear zipper and a scan over its resulting triangle normals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses original ring/cycle indices and the provided reference; does not reevaluate a surface or create a duplicate boundary.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh triangle array; temporary alignment/angle/normal data expires and no mesh/surface callback is retained.
