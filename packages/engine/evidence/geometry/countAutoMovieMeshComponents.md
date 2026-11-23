# src/geometry/countAutoMovieMeshComponents.ts#countAutoMovieMeshComponents

## @evidence contracts/development/implementation.md#principled-implementation

Mechanically extracts test_human_f1_body's disjoint sets, full path compression, three unions per triangle and used-triangle root census. Sharing an exact index connects triangles; coordinate coincidence is never a union rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Canonical triangleIndicesOf owns index admission; one parent array, one local find and one root set own the existing component census shared by Human's body test and capture observation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No position welding, physical alias reinterpretation, unused-vertex component, expected-count special case or connected-skin acceptance is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States used-index identity, empty and degenerate behavior, coincident and unused vertices, borrowed buffers, canonical refusals and the limits of a component count.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains the existing union order and path compression: O(V) initialization and three union operations per triangle, each following a parent path of at most V links before compression. This gives the conservative O(V+TV) worst-case bound and O(V) temporary storage; non-indexed admission also allocates V consecutive indices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure census of the current buffers has no cross-request effect; indexed admission borrows the original index run, and callers retain the scalar when reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The parent array, used-root set and any non-indexed run have call lifetime. Only the scalar count survives; no mesh, process or cache is retained.
