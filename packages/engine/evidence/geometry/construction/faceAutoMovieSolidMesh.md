# src/geometry/construction/faceAutoMovieSolidMesh.ts#faceAutoMovieSolidMesh

## @evidence contracts/development/common.md#meaningful-documentation

States the chart orientation, the ordinary-array and coherent-source premises, buffer atomicity and named versus thrown failures. Prepared draws retain the committed prefix and read interleaved cap or seam triangles. Face callbacks must preserve the buffers and run outside the draw's own write path.

## @evidence contracts/development/implementation.md#principled-implementation

Retains untouched full cells, triangulates the residual native chart with original shared vertex IDs and validates exposed boundaries before emitting one declared orientation. The prepared draw builds directed and unoriented incidence from actual committed triangles, including faces, caps and seams. The two directed keys correspond to opposite halfedges. [CGAL Surface Mesh](https://doc.cgal.org/6.1.1/Surface_mesh/index.html)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grid preparation, index planning, boundary reading and final writes have explicit owners. The prepared closure delegates to the same atomic face admission as an isolated append.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Admits the actual chart and its boundary IDs in the owning face's coordinates. A refused face leaves the output and incidence unchanged. Named failures without an observer throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

An isolated face reads the current prior triangles once. A prepared draw forms edge keys once per initial or newly appended triangle. Each face also pays for its own grid, residual triangulation, admission and staged indices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the copied station-major jets, original boundary indices and returned split provenance. Each new vertex enters on its first committed use. All faces in a prepared draw share incidence of already committed output.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

An isolated append releases its incidence after admission. A prepared draw owns directed and unoriented edge sets until the last face. Only the mesh and caller-owned open records outlive the draw.
