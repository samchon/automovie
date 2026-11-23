# src/index.ts#measureAutoMovieInspectionEdges

## @evidence contracts/development/common.md#meaningful-documentation

States why the inspection measures this kind itself, the once-per-edge and welding rules with their consequence for indexed and non-indexed forms, the kind, path, label and colour, and what the posed coordinates include.

## @evidence contracts/development/implementation.md#principled-implementation

An edge is an unordered pair of distinct corners of a triangle; welding by exact stored position identifies the corners a non-indexed geometry repeats per triangle, which is the topology an indexed one states, so both give one edge set.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Weld the corners, collect each triangle's three sides into one set keyed by the welded pair, then a refresh that writes each edge's two posed ends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Positions are read through the attribute so interleaved and normalized buffers give metres, a group-split or drawn range is not used to skip triangles, and no mesh is skipped by name.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the stored vertices and the triangles, with one hashed lookup per corner and per side; each refresh is linear in the edges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each mesh's edges are read once per inspection and rewritten in place on every refresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mark and its corner runs live as long as the caller keeps the record; the mesh is borrowed.
