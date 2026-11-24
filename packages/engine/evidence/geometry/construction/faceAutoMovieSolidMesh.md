# src/geometry/construction/faceAutoMovieSolidMesh.ts#faceAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Retains untouched full cells, triangulates the remaining native constrained region with original shared IDs, validates exposed domain boundaries and emits one declared orientation for the complete face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grid/source preparation, index planning, open-boundary reading and final writes have explicit owners; one commit point follows all fallible geometry preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not omit a missing-grid source, weld boundary vertices, zip unrelated cycles or use foreign owner coordinates as this face's chart. Named failure without a callback throws rather than silently returning an empty skin.

## @evidence contracts/development/common.md#meaningful-documentation

States named versus thrown failure, buffer/owner atomicity, partial endpoint diagnostics, chart orientation and the ordinary-array/coherent-source premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

An isolated face reads the current prior triangles once. A prepared draw reads the initial triangle buffer once and the newly committed triangle ranges before each face. Each face also pays for its grid, residual triangulation, admission and staged index order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses copied station-major jets, original boundary indices and returned split provenance. Each committed new vertex is inserted once on its first actual use. A prepared draw shares incidence across its own face batch.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

An isolated face retains incidence only during admission. A prepared draw owns its directed and unoriented edge sets until its last face. The mesh and its caller-owned open records survive the draw.

# src/geometry/construction/faceAutoMovieSolidMesh.ts#faceAutoMovieSolidMesh.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Builds directed and unoriented incidence from committed triangles. Faces, seams and caps all contribute their actual emitted edges, in the same order as isolated face admission sees them. The two directed keys of an edge correspond to the opposite halfedges in [CGAL's indexed Surface Mesh](https://doc.cgal.org/6.1.1/Surface_mesh/index.html).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One caller-owned closure delegates to the same atomic face admission as an isolated append.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The closure only adds edges from already committed triangles. A refused face adds no edges and leaves the output unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed-prefix premise, reads of interleaved cap or seam triangles, and the prohibition on writes or reentrancy from face callbacks.

## @evidence contracts/development/implementation.md#efficient-algorithms

Forms edge keys once per initial or newly appended triangle, in addition to each face's own planning work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All faces in the draw use the incidence of the already committed output.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure owns at most the output's directed and unoriented edge sets. A draw releases the closure after its last face.
