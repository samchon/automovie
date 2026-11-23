# src/geometry/curve/tessellateAutoMovieContourPath64.ts#tessellateAutoMovieContourPath64

## @evidence contracts/development/implementation.md#principled-implementation

Each instruction advances one boundary exactly once; modulo indices close both rings, shared polygon IDs allocate one new vertex set, and area-weighted normals derive only from emitted faces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Polygon and path admission precede all generation; the result reports each pair's generated triangle range, recomputed area and separate quality diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source mesh, external triangles, copied normals, positional weld, path repair or optimizer substitution enters the engine. Invalid instructions fail, while finite faces with topology warnings remain visible.

## @evidence contracts/development/common.md#meaningful-documentation

States millimetre input, one metre conversion, whole-condition winding, path semantics, generated normal authority and unsupported embedding/optimality claims.

## @evidence contracts/development/implementation.md#efficient-algorithms

V saved vertices and T instructions require O(V+T) generation and expected map work, plus O(V+T) returned mesh and ownership storage; polygon simplicity and intersections are not computed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Polygon identity shares one newly allocated vertex set between incident pairs and one normal accumulation across emitted faces; no coordinate-based sharing occurs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local registries expire on return and generated arrays transfer to the caller; no global cache, source geometry or file handle is acquired.
