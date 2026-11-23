# src/posture/HumanInteractionMeshLaplacian.ts#HumanInteractionMeshLaplacian.Row

## @evidence contracts/development/common.md#meaningful-documentation

States the index and coefficient representation of one linear row.

## @evidence contracts/development/design.md#principled-representation

Point indices and scalar coefficients represent the same linear map on each Cartesian axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two values per nonzero coefficient; no dense matrix is retained.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row uses input indices rather than a body-specific bone vocabulary.

# src/posture/HumanInteractionMeshLaplacian.ts#HumanInteractionMeshLaplacian.rows

## @evidence contracts/development/common.md#meaningful-documentation

States which geometry fixes the weights, the omitted edges and the isolated case.

## @evidence contracts/development/implementation.md#principled-implementation

Ho, Komura and Tai's equation 3 normalises inverse-distance weights; section 5.1 excludes bone edges because their deformation energy conflicts with the changing bone lengths. For coincident neighbours the inverse-distance limit shares the weight among those zero-distance neighbours alone. A point with no remaining neighbours records no relation, so its row is zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index the omitted edges, then one neighbour filter and normalisation per point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No numerical cutoff replaces a zero distance; scaling all inverse distances by the closest positive distance leaves their normalisation unchanged and avoids overflow.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bone edges and Delaunay edges; the bone lookup is a set, and the rows are constructed once per key-pose adaptation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the already computed Delaunay neighbourhoods and the adaptation's bone list.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure builder; only its caller retains the returned sparse rows.
