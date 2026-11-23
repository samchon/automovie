# src/geometry/construction/AutoMovieSolidMeshPlan.ts#AutoMovieSolidMeshPlan.triangulate

## @evidence contracts/development/implementation.md#principled-implementation

Subdivides shared constraints, uses explicit left probes and winding to identify hole/periodic boundary components, joins them visibly, validates the indexed ears against the residual source partition and reads the finished triangles' membership per constraint-bounded region, as Shewchuk's Triangle spreads a region's attribute across non-segment edges, so an exact sliver needs no representable interior sample of its own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The union result is atomic: failed coverage publishes no partial triangle population.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Tests all represented vertices and existing segment images for each diagonal; kept nonzero-winding or nontriangular components are refused rather than silently dropped. Membership must remain unchanged during the synchronous call.

## @evidence contracts/development/common.md#meaningful-documentation

Names original-ID ownership, residual membership, periodic search scope and atomic failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each of H joins can scan W squared boundary-occurrence pairs with O(V+S+H) visibility work; ear removal is cubic, M interior insertions cost O(M(T+M)) and legalization at most V(V-1)/2 constant-cost flips. Splitting, bounded witness probes, one O(T) region labelling and Q times caller predicate cost are additional. Component count decreases after each bridge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ranks each join's candidate pairs once by metric length and stops at the first visible one; original indexed positions serve incidence, visibility and ear reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new triangles and the owned split records/source-index histories, including total provenance length P; input maps/segments and membership reader remain borrowed for this call and are never stored globally.
